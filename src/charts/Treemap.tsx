/**
 * Treemap — hierarchical proportional layout with WebGL2 / WebGPU support
 * ───────────────────────────────────────────────────────────────────────
 * Three rendering paths (selected via the `engine` prop):
 *
 *  - "canvas" — Canvas2D path. Best for <50k cells, no peer deps.
 *  - "webgl"  — deck.gl SolidPolygonLayer. Instanced rendering on WebGL2;
 *               smooth at 1M+ cells. Used by default for big trees.
 *  - "webgpu" — Same deck.gl pipeline but with the WebGPU adapter. Lower
 *               CPU overhead, better on Apple Silicon and modern hardware.
 *  - "auto"   — Resolves to webgpu > webgl > canvas based on capability +
 *               dataset size. This is the default and what you want.
 *
 * Layout (squarified treemap) is computed by d3-hierarchy regardless of
 * renderer; only the draw path differs. Hover picking uses linear scan
 * for canvas2d and deck.gl's built-in pickObject() for WebGL/WebGPU.
 *
 * Peer deps:
 *   pnpm add d3-hierarchy                              # always required
 *   pnpm add @deck.gl/core @deck.gl/layers @luma.gl/core   # for webgl/webgpu
 */
import * as React from "react";
import { cx } from "../internal/cx";
import { readChartTheme, onThemeChange, type ChartTheme } from "./theme";
import { resolveEngine, loadDeck, colorToRGBA, type ResolvedEngine } from "./renderer";
import type { TreemapProps, TreemapNode } from "../components";

interface LaidOutNode {
  readonly node: TreemapNode;
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
  readonly depth: number;
  readonly path: string;
}

async function layout(root: TreemapNode, width: number, height: number, padding: number): Promise<LaidOutNode[]> {
  // @ts-expect-error — peer dep
  const d3hier = await import("d3-hierarchy");
  type HNode = { x0: number; y0: number; x1: number; y1: number; depth: number; data: TreemapNode; ancestors: () => HNode[] };
  const h = d3hier.hierarchy(root, (d: TreemapNode) => d.children)
    .sum((d: TreemapNode) => d.children?.length ? 0 : (d.value ?? 0))
    .sort((a: HNode, b: HNode) => (b.data.value ?? 0) - (a.data.value ?? 0));
  d3hier.treemap().size([width, height]).paddingInner(padding).paddingOuter(padding).round(true)(h);
  const out: LaidOutNode[] = [];
  h.each((n: HNode) => {
    if (!Number.isFinite(n.x1 - n.x0) || !Number.isFinite(n.y1 - n.y0)) return;
    out.push({
      node: n.data, x0: n.x0, y0: n.y0, x1: n.x1, y1: n.y1, depth: n.depth,
      path: n.ancestors().reverse().map((a: HNode) => a.data.name).join(" / "),
    });
  });
  return out;
}

export function Treemap(props: TreemapProps): React.ReactElement {
  const {
    data, height = 480, padding = 1, maxDepth = 3,
    engine = "auto",
    valueFormat = (v: number) => v.toLocaleString(),
    onNodeClick, onNodeHover,
    className, style, id,
  } = props;

  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const deckRef = React.useRef<{ destroy: () => void; setProps: (p: unknown) => void } | null>(null);
  const [width, setWidth] = React.useState(0);
  const [nodes, setNodes] = React.useState<LaidOutNode[]>([]);
  const [hover, setHover] = React.useState<LaidOutNode | null>(null);
  const [resolved, setResolved] = React.useState<ResolvedEngine>("canvas");

  // Resolve engine based on data size
  React.useEffect(() => {
    const totalCells = countLeaves(data);
    setResolved(resolveEngine(engine, totalCells, 50_000));
  }, [data, engine]);

  // Resize observer
  React.useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const w = Math.floor(entries[0].contentRect.width);
      if (w > 0 && w !== width) setWidth(w);
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [width]);

  // Layout
  React.useEffect(() => {
    let cancelled = false;
    if (width === 0) return;
    layout(data, width, height, padding).then((laid) => {
      if (!cancelled) setNodes(laid);
    }).catch((err: unknown) => {
      // eslint-disable-next-line no-console
      console.warn("[@ossrandom/design-system] Treemap requires d3-hierarchy. Run: pnpm add d3-hierarchy", err);
    });
    return () => { cancelled = true; };
  }, [data, width, height, padding]);

  // ─── Canvas2D paint ────────────────────────────────────────────
  const paintCanvas = React.useCallback(() => {
    const cv = canvasRef.current;
    if (!cv || width === 0 || resolved !== "canvas") return;
    const dpr = window.devicePixelRatio || 1;
    const theme = readChartTheme();
    cv.width = width * dpr;
    cv.height = height * dpr;
    cv.style.width = `${width}px`;
    cv.style.height = `${height}px`;
    const ctx = cv.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);
    ctx.font = `500 11px ${theme.fontMono}`;
    ctx.textBaseline = "top";

    for (const n of nodes) {
      if (n.depth > maxDepth) continue;
      const w = n.x1 - n.x0, h = n.y1 - n.y0;
      if (w < 1 || h < 1) continue;
      const isLeaf = !n.node.children?.length;
      const baseColor = n.node.color ?? theme.series[n.depth % theme.series.length];
      ctx.fillStyle = isLeaf ? baseColor : baseColor + "22";
      ctx.fillRect(n.x0, n.y0, w, h);
      ctx.strokeStyle = theme.bg1;
      ctx.lineWidth = 1;
      ctx.strokeRect(n.x0, n.y0, w, h);
      if (w > 60 && h > 14 && isLeaf) {
        ctx.fillStyle = readableTextColor(baseColor);
        ctx.fillText(truncate(n.node.name, Math.floor(w / 7)), n.x0 + 4, n.y0 + 4);
        if (h > 32) {
          ctx.fillStyle = readableTextColor(baseColor) + "AA";
          ctx.fillText(valueFormat(n.node.value ?? 0), n.x0 + 4, n.y0 + 18);
        }
      }
    }
    if (hover) {
      ctx.strokeStyle = theme.fg1;
      ctx.lineWidth = 2;
      ctx.strokeRect(hover.x0, hover.y0, hover.x1 - hover.x0, hover.y1 - hover.y0);
    }
  }, [nodes, width, height, maxDepth, hover, valueFormat, resolved]);

  // ─── WebGL/WebGPU paint via deck.gl ───────────────────────────
  React.useEffect(() => {
    if (resolved === "canvas" || width === 0 || !nodes.length) return;
    let cancelled = false;
    let cleanup: (() => void) | null = null;

    (async () => {
      const deck = await loadDeck();
      if (!deck || cancelled || !wrapRef.current) {
        // Fallback to canvas if deck.gl missing
        setResolved("canvas");
        return;
      }
      const theme = readChartTheme();
      const layers = buildDeckLayers(deck, nodes, maxDepth, theme, hover);
      const adapter = resolved === "webgpu" ? "webgpu" : "webgl";

      const inst = new (deck.Deck as unknown as new (opts: unknown) => { destroy: () => void; setProps: (p: unknown) => void; pickObject: (p: { x: number; y: number }) => unknown })({
        parent: wrapRef.current,
        width,
        height,
        controller: false,
        // luma.gl device adapter — webgpu when supported, webgl2 fallback
        deviceProps: { type: adapter, createCanvasContext: { useDevicePixels: true } },
        views: [{ "@@type": "OrthographicView", id: "ortho", flipY: true }],
        viewState: { target: [width / 2, height / 2, 0], zoom: 0 },
        layers,
        getCursor: ({ isHovering }: { isHovering: boolean }) => isHovering && onNodeClick ? "pointer" : "default",
        onClick: ({ object }: { object?: { __node?: LaidOutNode } }) => {
          if (object?.__node && onNodeClick) onNodeClick(object.__node.node);
        },
        onHover: ({ object }: { object?: { __node?: LaidOutNode } }) => {
          const next = object?.__node ?? null;
          setHover(next);
          onNodeHover?.(next?.node ?? null);
        },
      });
      deckRef.current = inst;
      cleanup = () => inst.destroy();
    })().catch((err: unknown) => {
      // eslint-disable-next-line no-console
      console.warn("[@ossrandom/design-system] Treemap WebGL init failed; falling back to canvas2d:", err);
      setResolved("canvas");
    });

    return () => {
      cancelled = true;
      cleanup?.();
      deckRef.current = null;
    };
  }, [resolved, width, height, nodes, maxDepth, hover, onNodeClick, onNodeHover]);

  React.useEffect(() => { paintCanvas(); }, [paintCanvas]);
  React.useEffect(() => onThemeChange(() => {
    paintCanvas();
    // For deck.gl, recreate to pick up new theme colors
    if (resolved !== "canvas") setHover((h) => h);
  }), [paintCanvas, resolved]);

  // Canvas2D hover (WebGL hover handled by deck.gl onHover above)
  const handleMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (resolved !== "canvas" || !canvasRef.current || !nodes.length) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    let found: LaidOutNode | null = null;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      if (n.depth > maxDepth) continue;
      if (x >= n.x0 && x <= n.x1 && y >= n.y0 && y <= n.y1) { found = n; break; }
    }
    if (found !== hover) {
      setHover(found);
      onNodeHover?.(found?.node ?? null);
    }
  };

  const handleClick = () => {
    if (resolved === "canvas" && hover) onNodeClick?.(hover.node);
  };

  return (
    <div
      ref={wrapRef}
      id={id}
      className={cx("rcs-treemap", `rcs-treemap--${resolved}`, className)}
      style={{ position: "relative", width: "100%", height, ...style }}
      data-engine={resolved}
    >
      {resolved === "canvas" && (
        <canvas
          ref={canvasRef}
          onMouseMove={handleMove}
          onMouseLeave={() => { setHover(null); onNodeHover?.(null); }}
          onClick={handleClick}
          style={{ display: "block", cursor: hover && onNodeClick ? "pointer" : "default" }}
          role="img"
          aria-label={props["aria-label"] ?? `Treemap of ${data.name}`}
        ></canvas>
      )}
      {hover && (
        <div
          className="rcs-treemap-tooltip"
          style={{
            position: "absolute",
            left: Math.min(hover.x0 + 8, width - 240),
            top: Math.max(8, hover.y0 + 8),
            pointerEvents: "none",
          }}
        >
          <div className="rcs-treemap-tooltip-path">{hover.path}</div>
          <div className="rcs-treemap-tooltip-value">{valueFormat(hover.node.value ?? 0)}</div>
        </div>
      )}
      <div className="rcs-treemap-engine-badge" aria-hidden="true">{resolved}</div>
    </div>
  );
}

/** Build the SolidPolygonLayer for a deck.gl render. */
function buildDeckLayers(
  deck: NonNullable<Awaited<ReturnType<typeof loadDeck>>>,
  nodes: LaidOutNode[],
  maxDepth: number,
  theme: ChartTheme,
  hovered: LaidOutNode | null,
): unknown[] {
  type Cell = { polygon: number[][]; color: [number, number, number, number]; __node: LaidOutNode };
  const cells: Cell[] = [];
  for (const n of nodes) {
    if (n.depth > maxDepth) continue;
    const isLeaf = !n.node.children?.length;
    const baseColor = n.node.color ?? theme.series[n.depth % theme.series.length];
    const rgba = colorToRGBA(baseColor, isLeaf ? 255 : 64);
    cells.push({
      polygon: [[n.x0, n.y0], [n.x1, n.y0], [n.x1, n.y1], [n.x0, n.y1]],
      color: rgba,
      __node: n,
    });
  }
  const SolidPolygonLayer = deck.SolidPolygonLayer as unknown as new (opts: unknown) => unknown;

  return [
    new SolidPolygonLayer({
      id: "treemap-cells",
      data: cells,
      filled: true,
      stroked: false,
      getPolygon: (d: Cell) => d.polygon,
      getFillColor: (d: Cell) => d.color,
      pickable: true,
      // Outline for hovered cell — extra layer
      updateTriggers: { getFillColor: hovered?.node.name },
    }),
    // Hover outline as a thin polygon
    hovered ? new SolidPolygonLayer({
      id: "treemap-hover",
      data: [{ polygon: [[hovered.x0, hovered.y0], [hovered.x1, hovered.y0], [hovered.x1, hovered.y1], [hovered.x0, hovered.y1]] }],
      filled: false,
      stroked: true,
      getLineColor: colorToRGBA(theme.fg1),
      getLineWidth: 2,
      lineWidthUnits: "pixels",
      pickable: false,
    }) : null,
  ].filter(Boolean);
}

function countLeaves(node: TreemapNode): number {
  if (!node.children?.length) return 1;
  let n = 0;
  for (const c of node.children) n += countLeaves(c);
  return n;
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  if (max < 4) return s.slice(0, max);
  return s.slice(0, max - 1) + "…";
}

function readableTextColor(bg: string): string {
  const m = /^#?([0-9a-f]{6})/i.exec(bg);
  if (!m) return "#ffffff";
  const r = parseInt(m[1].slice(0, 2), 16);
  const g = parseInt(m[1].slice(2, 4), 16);
  const b = parseInt(m[1].slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#1C1C1C" : "#FFFFFF";
}
