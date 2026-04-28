/**
 * Sparkline — inline mini-chart for cards and rows
 * ─────────────────────────────────────────────────
 * SVG-based, intentionally minimal. For more than 100 points or
 * interactive needs, use <Chart type="line"/> instead.
 *
 * Same shape as the private Sparkline used by <Stat>, but exposed
 * publicly with size + color + stroke controls.
 */
import * as React from "react";
import { cx } from "../internal/cx";
import { readChartTheme } from "./theme";
import type { SparklineProps } from "../components";

export function Sparkline(props: SparklineProps): React.ReactElement {
  const {
    data, width = 80, height = 24, stroke, fill,
    showArea = false, strokeWidth = 1.5,
    className, style, id,
  } = props;

  if (!data.length) {
    return <span className={cx("rcs-sparkline", "rcs-sparkline--empty", className)} style={{ width, height, ...style }} aria-hidden="true"></span>;
  }

  const theme = readChartTheme();
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = data.length > 1 ? width / (data.length - 1) : 0;
  const yFor = (v: number) => height - ((v - min) / range) * height;

  const points = data.map((v, i) => `${i * stepX},${yFor(v)}`).join(" ");
  const areaPath = showArea
    ? `M0,${height} L${points.replaceAll(",", " ").split(" ").join(" ")} L${(data.length - 1) * stepX},${height} Z`
    : null;

  return (
    <svg
      id={id}
      className={cx("rcs-sparkline", className)}
      style={style}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      preserveAspectRatio="none"
      role="img"
      aria-label={props["aria-label"] ?? `Sparkline with ${data.length} points`}
    >
      {areaPath && <path d={areaPath} fill={fill ?? theme.accent + "22"} />}
      <polyline
        points={points}
        fill="none"
        stroke={stroke ?? theme.accent}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
