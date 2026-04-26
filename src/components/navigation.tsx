/**
 * Navigation — Tabs, Menu, Breadcrumb, Pagination, Steps
 * ──────────────────────────────────────────────────────
 */
import * as React from "react";
import type {
  TabsProps, TabItem,
  MenuProps, MenuItem,
  BreadcrumbProps,
  PaginationProps,
  StepsProps,
} from "../components";
import { cx } from "../internal/cx";

// ─── Tabs ─────────────────────────────────────────────────────────────
export function Tabs<K extends string = string>(props: TabsProps<K>): React.ReactElement {
  const { items, value, defaultValue, variant = "line", size = "md", onChange, className, style, id } = props;
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState<K>((defaultValue ?? items[0]?.key) as K);
  const v = isControlled ? value : internal;
  const active = items.find((it) => it.key === v);

  const select = (key: K, disabled?: boolean) => {
    if (disabled) return;
    if (!isControlled) setInternal(key);
    onChange?.(key);
  };

  return (
    <div id={id} className={cx("rcs-tabs", `rcs-tabs--${variant}`, `rcs-tabs--${size}`, className)} style={style}>
      <div className="rcs-tabs-nav" role="tablist">
        {items.map((it: TabItem<K>) => (
          <button
            key={it.key}
            type="button"
            role="tab"
            aria-selected={it.key === v}
            disabled={it.disabled}
            data-active={it.key === v || undefined}
            className="rcs-tabs-tab"
            onClick={() => select(it.key, it.disabled)}
          >
            {it.icon && <span aria-hidden>{it.icon}</span>}
            <span>{it.label}</span>
            {it.badge && <span style={{ marginLeft: 4 }}>{it.badge}</span>}
          </button>
        ))}
      </div>
      {active?.content && <div className="rcs-tabs-content" role="tabpanel">{active.content}</div>}
    </div>
  );
}

// ─── Menu ─────────────────────────────────────────────────────────────
type MenuEntry<K extends string> = MenuItem<K> | { type: "separator" } | { type: "label"; label: React.ReactNode };

export function Menu<K extends string = string>(props: MenuProps<K>): React.ReactElement {
  const { items, selectedKeys, defaultSelectedKeys, mode = "vertical", onSelect, className, style, id } = props;
  const isControlled = selectedKeys !== undefined;
  const [internal, setInternal] = React.useState<readonly K[]>(defaultSelectedKeys ?? []);
  const sel = isControlled ? selectedKeys : internal;

  return (
    <div
      id={id}
      role="menu"
      className={cx("rcs-menu", mode === "horizontal" && "rcs-menu--horizontal", className)}
      style={style}
    >
      {items.map((entry: MenuEntry<K>, i) => {
        if ("type" in entry && entry.type === "separator") {
          return <div key={`sep-${i}`} className="rcs-menu-separator" role="separator" />;
        }
        if ("type" in entry && entry.type === "label") {
          return <div key={`lbl-${i}`} className="rcs-menu-label">{entry.label}</div>;
        }
        const it = entry as MenuItem<K>;
        const isSel = sel.includes(it.key);
        return (
          <div
            key={it.key}
            role="menuitem"
            className="rcs-menu-item"
            data-selected={isSel || undefined}
            data-destructive={it.destructive || undefined}
            data-disabled={it.disabled || undefined}
            aria-disabled={it.disabled || undefined}
            onClick={() => {
              if (it.disabled) return;
              if (!isControlled) setInternal([it.key]);
              onSelect?.(it.key);
            }}
          >
            {it.icon && <span aria-hidden>{it.icon}</span>}
            <span>{it.label}</span>
            {it.badge && <span style={{ marginLeft: "auto" }}>{it.badge}</span>}
            {it.shortcut && <span className="rcs-menu-item-shortcut">{it.shortcut}</span>}
          </div>
        );
      })}
    </div>
  );
}

// ─── Breadcrumb ───────────────────────────────────────────────────────
export function Breadcrumb(props: BreadcrumbProps): React.ReactElement {
  const { items, separator = "/", maxItems, className, style, id } = props;
  let visible = items;
  if (maxItems && items.length > maxItems) {
    visible = [items[0]!, { label: "…" } as any, ...items.slice(items.length - (maxItems - 2))];
  }
  return (
    <nav id={id} aria-label="Breadcrumb" className={cx("rcs-breadcrumb", className)} style={style}>
      {visible.map((it, i) => {
        const last = i === visible.length - 1;
        const node = it.href ? (
          <a href={it.href} onClick={it.onClick}>{it.icon && <span aria-hidden style={{ marginRight: 4 }}>{it.icon}</span>}{it.label}</a>
        ) : it.onClick ? (
          <button type="button" onClick={it.onClick} style={{ background: "none", border: 0, padding: 0, color: "inherit", cursor: "pointer", font: "inherit" }}>
            {it.label}
          </button>
        ) : (
          <span>{it.label}</span>
        );
        return (
          <React.Fragment key={i}>
            <span className={last ? "rcs-breadcrumb-item--last" : undefined}>{node}</span>
            {!last && <span className="rcs-breadcrumb-sep" aria-hidden>{separator}</span>}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────
export function Pagination(props: PaginationProps): React.ReactElement {
  const {
    total, pageSize, current, siblings = 1,
    showJumper = false, showSizeChanger = false,
    pageSizeOptions = [10, 20, 50],
    onChange, className, style, id,
  } = props;
  const lastPage = Math.max(1, Math.ceil(total / pageSize));

  const go = (p: number, ps: number = pageSize) => {
    const next = Math.max(1, Math.min(lastPage, p));
    onChange?.(next, ps);
  };

  const pages: Array<number | "…"> = [];
  const start = Math.max(1, current - siblings);
  const end = Math.min(lastPage, current + siblings);
  if (start > 1) { pages.push(1); if (start > 2) pages.push("…"); }
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < lastPage) { if (end < lastPage - 1) pages.push("…"); pages.push(lastPage); }

  return (
    <nav id={id} aria-label="Pagination" className={cx("rcs-pagination", className)} style={style}>
      <button className="rcs-pagination-btn" disabled={current <= 1} onClick={() => go(current - 1)} aria-label="Previous">‹</button>
      {pages.map((p, i) => p === "…" ? (
        <span key={`e-${i}`} className="rcs-pagination-ellipsis">…</span>
      ) : (
        <button key={p} className="rcs-pagination-btn" data-active={p === current || undefined} onClick={() => go(p)}>{p}</button>
      ))}
      <button className="rcs-pagination-btn" disabled={current >= lastPage} onClick={() => go(current + 1)} aria-label="Next">›</button>
      {showSizeChanger && (
        <select
          className="rcs-pagination-btn"
          style={{ marginLeft: 8 }}
          value={pageSize}
          onChange={(e) => go(1, Number(e.target.value))}
        >
          {pageSizeOptions.map((ps) => <option key={ps} value={ps}>{ps} / page</option>)}
        </select>
      )}
      {showJumper && (
        <span style={{ marginLeft: 8, fontSize: 13, color: "var(--fg-3)" }}>
          Jump to&nbsp;
          <input
            type="number" min={1} max={lastPage} defaultValue={current}
            style={{ width: 56 }}
            className="rcs-pagination-btn"
            onKeyDown={(e) => {
              if (e.key === "Enter") go(Number((e.target as HTMLInputElement).value));
            }}
          />
        </span>
      )}
    </nav>
  );
}

// ─── Steps ────────────────────────────────────────────────────────────
export function Steps(props: StepsProps): React.ReactElement {
  const { items, current, direction = "horizontal", size = "md", onChange, className, style, id } = props;
  return (
    <div
      id={id}
      className={cx("rcs-steps", direction === "vertical" && "rcs-steps--vertical", `rcs-steps--${size}`, className)}
      style={{ flexDirection: direction === "vertical" ? "column" : "row", ...style }}
    >
      {items.map((it, i) => {
        const status = it.status ?? (i < current ? "finish" : i === current ? "process" : "wait");
        return (
          <div
            key={i}
            className="rcs-step"
            data-status={status}
            onClick={() => onChange?.(i)}
            style={{ cursor: onChange ? "pointer" : undefined }}
          >
            <div className="rcs-step-marker">{it.icon ?? (status === "finish" ? "✓" : i + 1)}</div>
            <div>
              <div className="rcs-step-title">{it.title}</div>
              {it.description && <div className="rcs-step-desc">{it.description}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
