/**
 * Select & Combobox — single + multi pickers
 * ──────────────────────────────────────────
 */
import * as React from "react";
import type { SelectProps, ComboboxProps, SelectOption } from "../components";
import { cx } from "../internal/cx";

function useOutside(ref: React.RefObject<HTMLElement>, onOut: () => void): void {
  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOut();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [ref, onOut]);
}

export function Select<V extends string | number = string>(props: SelectProps<V>): React.ReactElement {
  const {
    options, value, defaultValue, placeholder = "Select…",
    searchable = false, clearable = false, disabled = false,
    status = "default", size = "md", onChange,
    className, style, id, "data-testid": dataTestid,
  } = props;

  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState<V | undefined>(defaultValue);
  const v = isControlled ? value : internal;
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const ref = React.useRef<HTMLDivElement>(null);
  useOutside(ref, () => setOpen(false));

  const selected = options.find((o) => o.value === v);
  const filtered = searchable && query
    ? options.filter((o) => String(o.label).toLowerCase().includes(query.toLowerCase()))
    : options;

  const pick = (opt: SelectOption<V>) => {
    if (opt.disabled) return;
    if (!isControlled) setInternal(opt.value);
    onChange?.(opt.value, opt);
    setOpen(false);
    setQuery("");
  };

  return (
    <div
      ref={ref}
      id={id}
      data-testid={dataTestid}
      className={cx("rcs-select", className)}
      style={style}
      data-open={open || undefined}
    >
      <button
        type="button"
        className={cx("rcs-select-trigger", `rcs-select-trigger--${size}`)}
        data-status={status}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((o) => !o)}
      >
        <span className={cx("rcs-select-value", !selected && "rcs-select-placeholder")}>
          {selected ? selected.label : placeholder}
        </span>
        {clearable && selected && !disabled && (
          <button
            type="button" className="rcs-input-clear" aria-label="Clear"
            onClick={(e) => {
              e.stopPropagation();
              if (!isControlled) setInternal(undefined);
              onChange?.(undefined as unknown as V, { value: undefined as unknown as V, label: "" });
            }}
          >×</button>
        )}
        <span className="rcs-select-caret" aria-hidden>▾</span>
      </button>

      {open && (
        <div className="rcs-select-menu" role="listbox">
          {searchable && (
            <input
              autoFocus
              className="rcs-select-search"
              placeholder="Search…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          )}
          {filtered.length === 0 ? (
            <div className="rcs-select-empty">No results</div>
          ) : filtered.map((o) => (
            <div
              key={String(o.value)}
              role="option"
              aria-selected={o.value === v}
              className="rcs-select-option"
              data-selected={o.value === v || undefined}
              data-disabled={o.disabled || undefined}
              onClick={() => pick(o)}
            >
              {o.icon && <span aria-hidden>{o.icon}</span>}
              <span>{o.label}</span>
              {o.description && <span className="rcs-select-option-desc">{o.description}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Combobox<V extends string | number = string>(props: ComboboxProps<V>): React.ReactElement {
  const {
    options, value, defaultValue, placeholder = "Select…",
    clearable = false, disabled = false, status = "default", size = "md",
    creatable = false, maxItems, onChange,
    className, style, id,
  } = props;

  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState<readonly V[]>(defaultValue ?? []);
  const v = isControlled ? (value ?? []) : internal;
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const ref = React.useRef<HTMLDivElement>(null);
  useOutside(ref, () => setOpen(false));

  const filtered = options.filter((o) =>
    !v.includes(o.value) &&
    (!query || String(o.label).toLowerCase().includes(query.toLowerCase())),
  );

  const setAll = (next: readonly V[]) => {
    const capped = maxItems ? next.slice(0, maxItems) : next;
    if (!isControlled) setInternal(capped);
    onChange?.(capped);
  };

  const add = (val: V, label?: string) => {
    setAll([...v, val]);
    setQuery("");
    if (label) { /* no-op, label preserved by options */ }
  };
  const remove = (val: V) => setAll(v.filter((x) => x !== val));

  const labelFor = (val: V) => options.find((o) => o.value === val)?.label ?? String(val);

  return (
    <div ref={ref} id={id} className={cx("rcs-select", className)} style={style} data-open={open || undefined}>
      <div
        className={cx("rcs-select-trigger", `rcs-select-trigger--${size}`)}
        data-status={status}
        onClick={() => !disabled && setOpen(true)}
        aria-disabled={disabled || undefined}
        style={{ flexWrap: "wrap", height: "auto", minHeight: 32, paddingTop: 4, paddingBottom: 4 }}
      >
        {v.length === 0 && !query && <span className="rcs-select-placeholder">{placeholder}</span>}
        {v.map((val) => (
          <span key={String(val)} className="rcs-combo-tag">
            {labelFor(val)}
            <button
              type="button" className="rcs-combo-tag-x"
              onClick={(e) => { e.stopPropagation(); remove(val); }}
              aria-label={`Remove ${labelFor(val)}`}
            >×</button>
          </span>
        ))}
        <input
          style={{ flex: 1, minWidth: 60, border: 0, outline: 0, background: "transparent", fontSize: "inherit", color: "inherit" }}
          value={query}
          disabled={disabled}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !query && v.length > 0) {
              remove(v[v.length - 1] as V);
            }
            if (e.key === "Enter" && creatable && query) {
              e.preventDefault();
              add(query as unknown as V, query);
            }
          }}
        />
        {clearable && v.length > 0 && (
          <button type="button" className="rcs-input-clear" onClick={(e) => { e.stopPropagation(); setAll([]); }}>×</button>
        )}
      </div>

      {open && (
        <div className="rcs-select-menu" role="listbox">
          {filtered.length === 0 ? (
            <div className="rcs-select-empty">{creatable && query ? `Press Enter to add "${query}"` : "No results"}</div>
          ) : filtered.map((o) => (
            <div
              key={String(o.value)}
              className="rcs-select-option"
              data-disabled={o.disabled || undefined}
              onClick={() => !o.disabled && add(o.value)}
            >
              {o.icon && <span aria-hidden>{o.icon}</span>}
              <span>{o.label}</span>
              {o.description && <span className="rcs-select-option-desc">{o.description}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
