/**
 * Data display — Table, Stat, Avatar, Timeline
 * ────────────────────────────────────────────
 */
import * as React from "react";
import type {
  TableProps, TableColumn,
  StatProps, AvatarProps, TimelineProps,
} from "../components";
import { cx } from "../internal/cx";

// ─── Table ────────────────────────────────────────────────────────────
export function Table<T extends object>(props: TableProps<T>): React.ReactElement {
  const {
    columns, data, rowKey,
    density = "default", bordered = false, striped = false, stickyHeader = false,
    loading = false, empty = "No data",
    selection = "none", selectedKeys, onSelectionChange, onSort, onRowClick,
    className, style, id, "data-testid": dataTestid,
  } = props;

  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");

  const keyFor = (row: T): string | number =>
    typeof rowKey === "function" ? rowKey(row) : (row[rowKey] as unknown as string | number);

  const toggleSort = (col: TableColumn<T>) => {
    if (!col.sortable) return;
    let nextDir: "asc" | "desc" = "asc";
    if (sortKey === col.key) nextDir = sortDir === "asc" ? "desc" : "asc";
    setSortKey(col.key);
    setSortDir(nextDir);
    onSort?.(col.key, nextDir);
  };

  const toggleRow = (k: string | number) => {
    if (!onSelectionChange || selection === "none") return;
    if (selection === "single") {
      onSelectionChange([k]);
    } else {
      const set = new Set(selectedKeys ?? []);
      if (set.has(k)) set.delete(k); else set.add(k);
      onSelectionChange(Array.from(set));
    }
  };

  return (
    <div id={id} data-testid={dataTestid} className={cx("rcs-table-wrap", className)} style={style}>
      <table
        className="rcs-table"
        data-density={density}
        data-bordered={bordered || undefined}
        data-striped={striped || undefined}
        data-sticky-header={stickyHeader || undefined}
      >
        <thead>
          <tr>
            {selection !== "none" && (
              <th style={{ width: 36 }}>
                {selection === "multi" && (
                  <input
                    type="checkbox"
                    checked={Boolean(selectedKeys?.length) && selectedKeys!.length === data.length}
                    onChange={(e) => onSelectionChange?.(e.target.checked ? data.map(keyFor) : [])}
                  />
                )}
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                className={cx(
                  col.sortable && "rcs-table-sortable",
                  col.align === "right" && "rcs-table-align-right",
                  col.align === "center" && "rcs-table-align-center",
                )}
                style={{ width: col.width }}
                data-sort={sortKey === col.key ? sortDir : undefined}
                onClick={() => toggleSort(col)}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={columns.length + (selection !== "none" ? 1 : 0)} className="rcs-table-empty">Loading…</td></tr>
          ) : data.length === 0 ? (
            <tr><td colSpan={columns.length + (selection !== "none" ? 1 : 0)} className="rcs-table-empty">{empty}</td></tr>
          ) : data.map((row, i) => {
            const k = keyFor(row);
            const isSel = selectedKeys?.includes(k);
            return (
              <tr key={k} data-selected={isSel || undefined} onClick={() => onRowClick?.(row, i)}>
                {selection !== "none" && (
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type={selection === "multi" ? "checkbox" : "radio"}
                      checked={Boolean(isSel)}
                      onChange={() => toggleRow(k)}
                    />
                  </td>
                )}
                {columns.map((col) => {
                  const raw = col.dataKey ? row[col.dataKey] : undefined;
                  const cell = col.render ? col.render(raw as any, row, i) : (raw as React.ReactNode);
                  return (
                    <td
                      key={col.key}
                      className={cx(
                        col.align === "right" && "rcs-table-align-right",
                        col.align === "center" && "rcs-table-align-center",
                      )}
                    >
                      {cell as React.ReactNode}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Stat ─────────────────────────────────────────────────────────────
export function Stat(props: StatProps): React.ReactElement {
  const { label, value, unit, delta, sparkline, className, style, id } = props;
  return (
    <div id={id} className={cx("rcs-stat", className)} style={style}>
      <div className="rcs-stat-label">{label}</div>
      <div className="rcs-stat-value">
        <span>{value}</span>
        {unit && <span className="rcs-stat-unit">{unit}</span>}
      </div>
      {delta && (
        <span className="rcs-stat-delta" data-tone={delta.tone ?? "neutral"}>
          {delta.direction === "up" ? "↑" : "↓"}
          {delta.value}%
        </span>
      )}
      {sparkline && sparkline.length > 1 && <Sparkline data={sparkline} />}
    </div>
  );
}

function Sparkline({ data }: { data: readonly number[] }): React.ReactElement {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 80},${24 - ((v - min) / range) * 24}`).join(" ");
  return (
    <svg viewBox="0 0 80 24" className="rcs-stat-spark" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────
const AVATAR_SIZE = { xs: 20, sm: 24, md: 32, lg: 44 } as const;

export function Avatar(props: AvatarProps): React.ReactElement {
  const { src, alt, initials, size = "md", shape = "circle", status, className, style, id } = props;
  const px = typeof size === "number" ? size : AVATAR_SIZE[size];
  const fontSize = Math.max(10, Math.round(px * 0.4));
  return (
    <span
      id={id}
      className={cx("rcs-avatar", `rcs-avatar--${shape}`, className)}
      style={{ width: px, height: px, fontSize, ...style }}
    >
      {src ? (
        <img src={src} alt={alt ?? initials ?? ""} />
      ) : (
        <span>{initials ?? "?"}</span>
      )}
      {status && <span className="rcs-avatar-status" data-status={status} aria-label={status} />}
    </span>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────
export function Timeline(props: TimelineProps): React.ReactElement {
  const { items, mode = "left", className, style, id } = props;
  return (
    <div id={id} className={cx("rcs-timeline", className)} style={style} data-mode={mode}>
      {items.map((it) => (
        <div key={it.key} className="rcs-timeline-item" data-tone={it.tone ?? "neutral"}>
          <div className="rcs-timeline-marker" aria-hidden />
          <div className="rcs-timeline-content">
            <div className="rcs-timeline-title">{it.title}</div>
            {it.description && <div className="rcs-timeline-desc">{it.description}</div>}
            {it.time && <span className="rcs-timeline-time">{it.time}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
