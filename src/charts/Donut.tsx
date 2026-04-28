/**
 * Donut — proportional breakdown chart
 * ─────────────────────────────────────
 * Pure SVG. Up to ~50 segments before performance degrades; for more,
 * consider a treemap or stacked bar instead.
 */
import * as React from "react";
import { cx } from "../internal/cx";
import { readChartTheme } from "./theme";
import type { DonutProps, DonutSegment } from "../components";

/** Polar → cartesian, with 12 o'clock at -π/2. */
function arcPath(cx0: number, cy: number, rOuter: number, rInner: number, startAngle: number, endAngle: number): string {
  const x1 = cx0 + rOuter * Math.cos(startAngle);
  const y1 = cy + rOuter * Math.sin(startAngle);
  const x2 = cx0 + rOuter * Math.cos(endAngle);
  const y2 = cy + rOuter * Math.sin(endAngle);
  const x3 = cx0 + rInner * Math.cos(endAngle);
  const y3 = cy + rInner * Math.sin(endAngle);
  const x4 = cx0 + rInner * Math.cos(startAngle);
  const y4 = cy + rInner * Math.sin(startAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M${x1},${y1} A${rOuter},${rOuter} 0 ${largeArc} 1 ${x2},${y2} L${x3},${y3} A${rInner},${rInner} 0 ${largeArc} 0 ${x4},${y4} Z`;
}

export function Donut(props: DonutProps): React.ReactElement {
  const {
    segments, size = 200, thickness = 32,
    centerLabel, centerValue, showLegend = true,
    onSegmentClick,
    className, style, id,
  } = props;

  const theme = readChartTheme();
  const total = segments.reduce((acc, s) => acc + s.value, 0) || 1;
  const r = size / 2;
  const rInner = r - thickness;

  let angle = -Math.PI / 2;
  const arcs = segments.map((seg, i) => {
    const fraction = seg.value / total;
    const sweep = fraction * Math.PI * 2;
    const start = angle;
    const end = angle + sweep;
    angle = end;
    return {
      seg, i, fraction,
      path: arcPath(r, r, r, rInner, start, end),
      color: seg.color ?? theme.series[i % theme.series.length],
    };
  });

  return (
    <div
      id={id}
      className={cx("rcs-donut", className)}
      style={{ display: "inline-flex", alignItems: "center", gap: 16, ...style }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={props["aria-label"] ?? "Donut chart"}>
        {arcs.map((a) => (
          <path
            key={a.seg.label}
            d={a.path}
            fill={a.color}
            style={{ cursor: onSegmentClick ? "pointer" : undefined, transition: "opacity 120ms ease" }}
            onClick={onSegmentClick ? () => onSegmentClick(a.seg, a.i) : undefined}
          >
            <title>{a.seg.label}: {a.seg.value} ({(a.fraction * 100).toFixed(1)}%)</title>
          </path>
        ))}
        {(centerLabel || centerValue !== undefined) && (
          <g style={{ pointerEvents: "none" }}>
            {centerValue !== undefined && (
              <text x={r} y={r - 2} textAnchor="middle" dominantBaseline="middle" style={{ font: `600 22px ${theme.fontSans}`, fill: theme.fg1 }}>{centerValue}</text>
            )}
            {centerLabel && (
              <text x={r} y={r + 16} textAnchor="middle" dominantBaseline="middle" style={{ font: `400 12px ${theme.fontSans}`, fill: theme.fg3 }}>{centerLabel}</text>
            )}
          </g>
        )}
      </svg>
      {showLegend && (
        <ul className="rcs-donut-legend" style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          {arcs.map((a) => (
            <li key={a.seg.label} style={{ display: "flex", alignItems: "center", gap: 8, font: `400 13px ${theme.fontSans}`, color: theme.fg2 }}>
              <span aria-hidden="true" style={{ width: 10, height: 10, background: a.color, borderRadius: 2, flexShrink: 0 }}></span>
              <span style={{ flex: 1 }}>{a.seg.label}</span>
              <span style={{ font: `500 12px ${theme.fontMono}`, color: theme.fg1, fontVariantNumeric: "tabular-nums" }}>{(a.fraction * 100).toFixed(1)}%</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Single-value gauge — used for "76% capacity" kind of indicators. */
export function RadialGauge(props: import("../components").RadialGaugeProps): React.ReactElement {
  const { value, max = 100, size = 120, thickness = 12, label, tone = "neutral", className, style, id } = props;
  const theme = readChartTheme();
  const fraction = Math.max(0, Math.min(1, value / max));
  const r = size / 2;
  const rInner = r - thickness;
  const startAngle = -Math.PI * 0.75;
  const endAngle = startAngle + (Math.PI * 1.5) * fraction;
  const trackEnd = startAngle + Math.PI * 1.5;

  const toneColor =
    tone === "good" ? theme.success :
    tone === "warning" ? theme.warning :
    tone === "bad" ? theme.danger :
    theme.accent;

  return (
    <div id={id} className={cx("rcs-gauge", className)} style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", ...style }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={props["aria-label"] ?? `${value} of ${max}`}>
        <path d={arcPath(r, r, r, rInner, startAngle, trackEnd)} fill={theme.bg3} />
        {fraction > 0 && <path d={arcPath(r, r, r, rInner, startAngle, endAngle)} fill={toneColor} />}
        <text x={r} y={r} textAnchor="middle" dominantBaseline="middle" style={{ font: `600 ${size / 5}px ${theme.fontSans}`, fill: theme.fg1, fontVariantNumeric: "tabular-nums" }}>
          {Math.round(fraction * 100)}%
        </text>
      </svg>
      {label && <div style={{ font: `400 12px ${theme.fontSans}`, color: theme.fg3, marginTop: 4 }}>{label}</div>}
    </div>
  );
}

// Re-export segment type for convenience (already in components.ts)
export type { DonutSegment };
