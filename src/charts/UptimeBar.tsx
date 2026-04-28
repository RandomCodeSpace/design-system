/**
 * UptimeBar — status-over-time bar chart
 * ───────────────────────────────────────
 * Each cell = a time window (last 90 days, last 24 hours, etc.).
 * Color encodes status — meant to mirror the StatusPage uptime visualization.
 * Canvas-rendered to handle 90+ cells without layout thrashing.
 */
import * as React from "react";
import { cx } from "../internal/cx";
import { readChartTheme, onThemeChange } from "./theme";
import type { UptimeBarProps, UptimeStatus } from "../components";

export function UptimeBar(props: UptimeBarProps): React.ReactElement {
  const { cells, height = 28, gap = 2, cellRadius = 1, onCellHover, className, style, id } = props;
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [width, setWidth] = React.useState(0);
  const [hovered, setHovered] = React.useState<{ idx: number; x: number } | null>(null);

  React.useEffect(() => {
    if (!canvasRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const w = Math.floor(entries[0].contentRect.width);
      if (w > 0 && w !== width) setWidth(w);
    });
    ro.observe(canvasRef.current.parentElement!);
    return () => ro.disconnect();
  }, [width]);

  const draw = React.useCallback(() => {
    const cv = canvasRef.current;
    if (!cv || width === 0) return;
    const dpr = window.devicePixelRatio || 1;
    const theme = readChartTheme();
    cv.width = width * dpr;
    cv.height = height * dpr;
    cv.style.width = `${width}px`;
    cv.style.height = `${height}px`;
    const ctx = cv.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const cellW = Math.max(1, (width - gap * (cells.length - 1)) / cells.length);
    cells.forEach((c, i) => {
      const x = i * (cellW + gap);
      ctx.fillStyle = colorFor(c.status, theme);
      ctx.beginPath();
      // Rounded rect via path
      const r = Math.min(cellRadius, cellW / 2, height / 2);
      ctx.moveTo(x + r, 0);
      ctx.lineTo(x + cellW - r, 0);
      ctx.arcTo(x + cellW, 0, x + cellW, r, r);
      ctx.lineTo(x + cellW, height - r);
      ctx.arcTo(x + cellW, height, x + cellW - r, height, r);
      ctx.lineTo(x + r, height);
      ctx.arcTo(x, height, x, height - r, r);
      ctx.lineTo(x, r);
      ctx.arcTo(x, 0, x + r, 0, r);
      ctx.closePath();
      ctx.fill();
    });
  }, [cells, width, height, gap, cellRadius]);

  React.useEffect(() => { draw(); }, [draw]);
  React.useEffect(() => onThemeChange(draw), [draw]);

  const handleMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cells.length || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const cellW = (width - gap * (cells.length - 1)) / cells.length;
    const idx = Math.min(cells.length - 1, Math.max(0, Math.floor(x / (cellW + gap))));
    setHovered({ idx, x });
    onCellHover?.(cells[idx], idx);
  };

  const handleLeave = () => {
    setHovered(null);
    onCellHover?.(null, -1);
  };

  return (
    <div
      id={id}
      className={cx("rcs-uptime", className)}
      style={{ position: "relative", width: "100%", ...style }}
    >
      <canvas
        ref={canvasRef}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        role="img"
        aria-label={props["aria-label"] ?? `Uptime over ${cells.length} periods`}
      ></canvas>
      {hovered && cells[hovered.idx] && (
        <div
          className="rcs-uptime-tooltip"
          style={{
            position: "absolute",
            left: Math.min(hovered.x, width - 160),
            top: -32,
            pointerEvents: "none",
          }}
        >
          <strong>{cells[hovered.idx].label ?? `Period ${hovered.idx + 1}`}</strong>
          <span data-status={cells[hovered.idx].status}>{cells[hovered.idx].status}</span>
        </div>
      )}
    </div>
  );
}

function colorFor(status: UptimeStatus, theme: ReturnType<typeof readChartTheme>): string {
  switch (status) {
    case "operational": return theme.success;
    case "degraded": return theme.warning;
    case "outage": return theme.danger;
    case "maintenance": return theme.info;
    case "no-data": return theme.bg3;
    default: return theme.bg3;
  }
}
