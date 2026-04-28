/**
 * Chart — high-performance time-series chart
 * ─────────────────────────────────────────
 * Two rendering paths:
 *
 *  - "canvas" — uPlot (canvas2d). Default. Smoothly handles 100k points
 *               per series. Best for typical dashboard workloads.
 *  - "webgl"  — deck.gl LineLayer (WebGL2 instanced). Use when you have
 *               >100k points or many series. Lower CPU, scrolls cleaner
 *               under heavy load but adds a few hundred kb.
 *  - "webgpu" — Same deck.gl pipeline with WebGPU adapter.
 *  - "auto"   — Picks WebGPU > WebGL > canvas based on point count.
 *
 * Peer deps:
 *   pnpm add uplot                                # canvas (default)
 *   pnpm add @deck.gl/core @deck.gl/layers        # webgl/webgpu
 */
import * as React from "react";
import { cx } from "../internal/cx";
import { readChartTheme, onThemeChange, type ChartTheme } from "./theme";
import { resolveEngine, loadDeck, colorToRGBA, type ResolvedEngine } from "./renderer";
import type { ChartProps, ChartSeries } from "../components";

type UplotInstance = { destroy: () => void; setSize: (s: { width: number; height: number }) => void };
type UplotCtor = new (opts: unknown, data: unknown, target: HTMLElement) => UplotInstance;
let uplotCache: { ctor: UplotCtor } | null = null;

async function loadUplot(): Promise<UplotCtor | null> {
  if (uplotCache) return uplotCache.ctor;
  try {
    // @ts-expect-error — peer dep
    const mod = await import("uplot");
    // @ts-expect-error — uplot CSS
    await import("uplot/dist/uPlot.min.css").catch(() => { /* best effort */ });
    const ctor = (mod.default ?? mod) as UplotCtor;
    uplotCache = { ctor };
    return ctor;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[@ossrandom/design-system] Chart canvas path requires uplot. Run: pnpm add uplot", err);
    return null;
  }
}

function buildUplotOptions(
  type: "line" | "area" | "bar",
  series: readonly ChartSeries[],
  theme: ChartTheme,
  width: number, height: number,
  opts: { showGrid: boolean; showLegend: boolean; xLabel?: string; yLabel?: string; onPointClick?: ChartProps["onPointClick"] },
): unknown {
  const fillAlpha = type === "area" ? "33" : "00";
  return {
    width, height,
    cursor: { drag: { x: true, y: false }, focus: { prox: 16 } },
    select: { show: true, stroke: theme.accent + "40", fill: theme.accent + "10" },
    legend: { show: opts.showLegend, live: true },
    scales: { x: { time: true } },
    axes: [
      { stroke: theme.fg3, grid: { show: opts.showGrid, stroke: theme.border1, width: 1 }, ticks: { show: opts.showGrid, stroke: theme.border2, width: 1 }, font: `11px ${theme.fontMono}`, label: opts.xLabel },
      { stroke: theme.fg3, grid: { show: opts.showGrid, stroke: theme.border1, width: 1 }, ticks: { show: opts.showGrid, stroke: theme.border2, width: 1 }, font: `11px ${theme.fontMono}`, label: opts.yLabel },
    ],
    series: [
      { label: "x" },
      ...series.map((s, i) => ({
        label: s.label,
        stroke: s.color ?? theme.series[i % theme.series.length],
        fill: type === "area" ? (s.color ?? theme.series[i % theme.series.length]) + fillAlpha : undefined,
        width: 1.5,
        points: { show: false },
      })),
    ],
  };
}

export function Chart(props: ChartProps): React.ReactElement {
  const {
    type = "line",
    timestamps, series,
    height = 240,
    showGrid = true,
    showLegend = series.length > 1,
    xLabel, yLabel,
    engine = "auto",
    onPointClick,
    className, style, id,
  } = props;

  const totalPoints = series.reduce((acc, s) => acc + s.data.length, 0);
  const ref = React.useRef<HTMLDivElement | null>(null);
  const plotRef = React.useRef<UplotInstance | null>(null);
  const deckRef = React.useRef<{ destroy: () => void } | null>(null);
  const [width, setWidth] = React.useState(0);
  const [resolved, setResolved] = React.useState<ResolvedEngine>("canvas");

  React.useEffect(() => {
    setResolved(resolveEngine(engine, totalPoints, 100_000));
  }, [engine, totalPoints]);

  React.useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((entries) => {
      const w = Math.floor(entries[0].contentRect.width);
      if (w > 0 && w !== width) setWidth(w);
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [width]);

  // ─── Canvas (uPlot) path ─────────────────────────────────────
  React.useEffect(() => {
    if (resolved !== "canvas" || !ref.current || width === 0) return;
    let cancelled = false;
    const target = ref.current;
    const theme = readChartTheme();
    const data = [Array.from(timestamps), ...series.map((s) => Array.from(s.data))];
    const options = buildUplotOptions(type, series, theme, width, height, { showGrid, showLegend, xLabel, yLabel, onPointClick });

    loadUplot().then((Ctor) => {
      if (!Ctor || cancelled) {
        if (!Ctor) target.innerHTML = `<div class="rcs-chart-fallback">Chart requires uplot. Run: pnpm add uplot</div>`;
        return;
      }
      plotRef.current?.destroy();
      plotRef.current = new Ctor(options, data, target);
    });

    return () => { cancelled = true; plotRef.current?.destroy(); plotRef.current = null; };
  }, [resolved, type, timestamps, series, width, height, showGrid, showLegend, xLabel, yLabel, onPointClick]);

  // ─── WebGL/WebGPU (deck.gl) path ─────────────────────────────
  React.useEffect(() => {
    if (resolved === "canvas" || !ref.current || width === 0) return;
    let cancelled = false;
    const target = ref.current;

    (async () => {
      const deck = await loadDeck();
      if (!deck || cancelled) { setResolved("canvas"); return; }
      const theme = readChartTheme();
      const adapter = resolved === "webgpu" ? "webgpu" : "webgl";

      // Compute screen-space line segments: each pair (i, i+1) of points
      // becomes one LineLayer datum. Pre-flattened for instanced draw.
      const xs = timestamps;
      const xMin = xs[0], xMax = xs[xs.length - 1] || xMin + 1;
      const xScale = (x: number) => ((x - xMin) / (xMax - xMin)) * width;

      const allValues = series.flatMap((s) => Array.from(s.data));
      const yMin = Math.min(...allValues);
      const yMax = Math.max(...allValues);
      const yRange = yMax - yMin || 1;
      const yScale = (y: number) => height - ((y - yMin) / yRange) * height;

      type Seg = { from: [number, number, number]; to: [number, number, number]; color: [number, number, number, number] };
      const segments: Seg[] = [];
      series.forEach((s, sIdx) => {
        const color = colorToRGBA(s.color ?? theme.series[sIdx % theme.series.length]);
        for (let i = 0; i < s.data.length - 1; i++) {
          segments.push({
            from: [xScale(xs[i]), yScale(s.data[i]), 0],
            to: [xScale(xs[i + 1]), yScale(s.data[i + 1]), 0],
            color,
          });
        }
      });

      const LineLayer = deck.LineLayer as unknown as new (opts: unknown) => unknown;
      const layers = [
        new LineLayer({
          id: "chart-lines",
          data: segments,
          getSourcePosition: (d: Seg) => d.from,
          getTargetPosition: (d: Seg) => d.to,
          getColor: (d: Seg) => d.color,
          getWidth: 1.5,
          widthUnits: "pixels",
        }),
      ];

      const inst = new (deck.Deck as unknown as new (o: unknown) => { destroy: () => void })({
        parent: target,
        width, height,
        controller: false,
        deviceProps: { type: adapter },
        views: [{ "@@type": "OrthographicView", id: "v", flipY: true }],
        viewState: { target: [width / 2, height / 2, 0], zoom: 0 },
        layers,
      });
      deckRef.current = inst;
    })().catch((err: unknown) => {
      // eslint-disable-next-line no-console
      console.warn("[@ossrandom/design-system] Chart WebGL init failed; falling back to canvas:", err);
      setResolved("canvas");
    });

    return () => { cancelled = true; deckRef.current?.destroy(); deckRef.current = null; };
  }, [resolved, width, height, timestamps, series]);

  React.useEffect(() => onThemeChange(() => { setResolved((r) => r); }), []);

  return (
    <div
      ref={ref}
      id={id}
      className={cx("rcs-chart", `rcs-chart--${type}`, `rcs-chart--${resolved}`, className)}
      style={{ width: "100%", height, position: "relative", ...style }}
      data-engine={resolved}
      role="img"
      aria-label={props["aria-label"] ?? `${type} chart with ${series.length} series, ${totalPoints} points`}
    ></div>
  );
}
