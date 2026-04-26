/**
 * Form controls — Checkbox, RadioGroup, Switch, Slider,
 *                 DatePicker, DateRangePicker, FileUpload, FormField
 * ─────────────────────────────────────────────────────────────────
 */
import * as React from "react";
import type {
  CheckboxProps, RadioGroupProps, SwitchProps, SliderProps,
  DatePickerProps, DateRangePickerProps,
  FileUploadProps, FormFieldProps, DateRange,
} from "../components";
import { cx, uid } from "../internal/cx";
import { Input } from "./inputs";

// ─── Checkbox ─────────────────────────────────────────────────────────
export function Checkbox(props: CheckboxProps): React.ReactElement {
  const {
    checked, defaultChecked, indeterminate = false,
    disabled = false, label, description, onChange,
    className, style, id,
  } = props;
  const isControlled = checked !== undefined;
  const [internal, setInternal] = React.useState<boolean>(defaultChecked ?? false);
  const v = isControlled ? checked! : internal;
  const ref = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <label className={cx("rcs-checkbox", className)} style={style} id={id}>
      <input
        ref={ref}
        type="checkbox"
        checked={v}
        disabled={disabled}
        onChange={(e) => {
          if (!isControlled) setInternal(e.target.checked);
          onChange?.(e.target.checked);
        }}
      />
      {(label || description) && (
        <span>
          {label && <span className="rcs-checkbox-label">{label}</span>}
          {description && <span className="rcs-checkbox-desc">{description}</span>}
        </span>
      )}
    </label>
  );
}

// ─── RadioGroup ───────────────────────────────────────────────────────
export function RadioGroup<V extends string | number = string>(props: RadioGroupProps<V>): React.ReactElement {
  const { name, options, value, defaultValue, direction = "horizontal", disabled = false, onChange, className, style, id } = props;
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState<V | undefined>(defaultValue);
  const v = isControlled ? value : internal;

  return (
    <div
      id={id}
      role="radiogroup"
      className={cx("rcs-radio-group", direction === "vertical" && "rcs-radio-group--vertical", className)}
      style={style}
    >
      {options.map((o) => (
        <label key={String(o.value)} className="rcs-radio">
          <input
            type="radio"
            name={name}
            checked={o.value === v}
            disabled={disabled || o.disabled}
            onChange={() => {
              if (!isControlled) setInternal(o.value);
              onChange?.(o.value);
            }}
          />
          <span>
            <span className="rcs-radio-label">{o.label}</span>
            {o.description && <span className="rcs-radio-desc">{o.description}</span>}
          </span>
        </label>
      ))}
    </div>
  );
}

// ─── Switch ───────────────────────────────────────────────────────────
export function Switch(props: SwitchProps): React.ReactElement {
  const { checked, defaultChecked, size = "md", disabled = false, loading = false, label, onChange, className, style, id } = props;
  const isControlled = checked !== undefined;
  const [internal, setInternal] = React.useState<boolean>(defaultChecked ?? false);
  const v = isControlled ? checked! : internal;

  return (
    <label
      id={id}
      className={cx("rcs-switch", `rcs-switch--${size}`, className)}
      style={style}
      data-checked={v || undefined}
      data-disabled={disabled || undefined}
    >
      <input
        type="checkbox"
        role="switch"
        checked={v}
        disabled={disabled || loading}
        onChange={(e) => {
          if (!isControlled) setInternal(e.target.checked);
          onChange?.(e.target.checked);
        }}
      />
      <span className="rcs-switch-track" aria-hidden>
        <span className="rcs-switch-thumb" />
      </span>
      {label && <span className="rcs-switch-label">{label}</span>}
    </label>
  );
}

// ─── Slider ───────────────────────────────────────────────────────────
export function Slider(props: SliderProps): React.ReactElement {
  const {
    value, defaultValue,
    min = 0, max = 100, step = 1, marks, range = false,
    disabled = false, tooltip = "hover", onChange,
    className, style, id,
  } = props;

  const isRange = range || (Array.isArray(value) || Array.isArray(defaultValue));
  const init = (defaultValue ?? (isRange ? [min, max] : min)) as number | readonly [number, number];
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState<number | readonly [number, number]>(init);
  const v = isControlled ? value! : internal;

  const trackRef = React.useRef<HTMLDivElement>(null);
  const dragging = React.useRef<number | null>(null);

  const pct = (n: number) => ((n - min) / (max - min)) * 100;

  const setVal = (n: number | readonly [number, number]) => {
    if (!isControlled) setInternal(n);
    onChange?.(n);
  };

  const startDrag = (idx: number) => (e: React.PointerEvent) => {
    if (disabled) return;
    dragging.current = idx;
    (e.target as Element).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (dragging.current === null || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const raw = min + ratio * (max - min);
    const snapped = Math.round(raw / step) * step;
    if (Array.isArray(v)) {
      const next: [number, number] = [v[0], v[1]];
      next[dragging.current as 0 | 1] = snapped;
      if (next[0] > next[1]) next.reverse();
      setVal(next as readonly [number, number]);
    } else {
      setVal(snapped);
    }
  };
  const endDrag = () => { dragging.current = null; };

  const a = Array.isArray(v) ? v[0] : 0;
  const b = Array.isArray(v) ? v[1] : (v as number);

  return (
    <div
      id={id}
      className={cx("rcs-slider", className)}
      style={style}
      onPointerMove={onMove}
      onPointerUp={endDrag}
      aria-disabled={disabled || undefined}
    >
      <div ref={trackRef} className="rcs-slider-track">
        {Array.isArray(v) ? (
          <div className="rcs-slider-fill" style={{ left: `${pct(a)}%`, width: `${pct(b) - pct(a)}%` }} />
        ) : (
          <div className="rcs-slider-fill" style={{ width: `${pct(b)}%` }} />
        )}
        {Array.isArray(v) && (
          <div
            className="rcs-slider-thumb"
            role="slider" aria-valuemin={min} aria-valuemax={max} aria-valuenow={a}
            style={{ left: `${pct(a)}%` }}
            onPointerDown={startDrag(0)}
            title={tooltip !== "never" ? String(a) : undefined}
          />
        )}
        <div
          className="rcs-slider-thumb"
          role="slider" aria-valuemin={min} aria-valuemax={max} aria-valuenow={b}
          style={{ left: `${pct(b)}%` }}
          onPointerDown={startDrag(Array.isArray(v) ? 1 : 0)}
          title={tooltip !== "never" ? String(b) : undefined}
        />
      </div>
      {marks && (
        <div className="rcs-slider-marks">
          {Object.entries(marks).map(([k, lbl]) => (
            <span key={k} className="rcs-slider-mark" style={{ left: `${pct(Number(k))}%` }}>{lbl}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── DatePicker (lightweight — uses native input) ─────────────────────
function fmtDate(d?: Date | null, format = "YYYY-MM-DD"): string {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return format.replace("YYYY", String(y)).replace("MM", m).replace("DD", day);
}
function parseDate(s: string): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function DatePicker(props: DatePickerProps): React.ReactElement {
  const { value, defaultValue, min, max, format = "YYYY-MM-DD", placeholder, disabled, onChange, className, style, id } = props;
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState<Date | null>(defaultValue ?? null);
  const v = isControlled ? (value ?? null) : internal;

  return (
    <Input
      id={id}
      className={className}
      style={style}
      type="text"
      placeholder={placeholder ?? format}
      disabled={disabled}
      value={fmtDate(v, format)}
      onChange={(s) => {
        const d = parseDate(s);
        if (!isControlled) setInternal(d);
        onChange?.(d);
      }}
      suffix={<span style={{ fontSize: 12 }}>📅</span>}
    />
  );
}

export function DateRangePicker(props: DateRangePickerProps): React.ReactElement {
  const { value, defaultValue, format = "YYYY-MM-DD", placeholder, disabled, onChange, className, style, id } = props;
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState<DateRange | null>(defaultValue ?? null);
  const v = isControlled ? (value ?? null) : internal;
  const display = v ? `${fmtDate(v.from, format)} → ${fmtDate(v.to, format)}` : "";

  return (
    <Input
      id={id}
      className={className}
      style={style}
      type="text"
      placeholder={placeholder ?? `${format} → ${format}`}
      disabled={disabled}
      value={display}
      onChange={(s) => {
        const parts = s.split("→").map((p) => parseDate(p.trim()));
        if (parts.length === 2 && parts[0] && parts[1]) {
          const range: DateRange = { from: parts[0], to: parts[1] };
          if (!isControlled) setInternal(range);
          onChange?.(range);
        }
      }}
      suffix={<span style={{ fontSize: 12 }}>📅</span>}
    />
  );
}

// ─── FileUpload ───────────────────────────────────────────────────────
export function FileUpload(props: FileUploadProps): React.ReactElement {
  const {
    accept, multiple = false, maxSize, maxFiles,
    disabled = false, variant = "drop-zone",
    onUpload, onError,
    className, style, id,
  } = props;
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [drag, setDrag] = React.useState(false);

  const handle = (filesRaw: FileList | null) => {
    if (!filesRaw) return;
    let files = Array.from(filesRaw);
    if (maxFiles && files.length > maxFiles) {
      onError?.({ code: "count", message: `Max ${maxFiles} files allowed` });
      files = files.slice(0, maxFiles);
    }
    if (maxSize) {
      const bad = files.find((f) => f.size > maxSize);
      if (bad) {
        onError?.({ code: "size", message: `${bad.name} exceeds ${maxSize} bytes` });
        return;
      }
    }
    onUpload?.(files);
  };

  if (variant === "button") {
    return (
      <span className={className} style={style} id={id}>
        <button type="button" className="rcs-button rcs-button--secondary rcs-button--md" disabled={disabled} onClick={() => inputRef.current?.click()}>
          Upload {multiple ? "files" : "file"}
        </button>
        <input ref={inputRef} type="file" hidden accept={accept} multiple={multiple} onChange={(e) => handle(e.target.files)} />
      </span>
    );
  }

  return (
    <div
      id={id}
      className={cx("rcs-upload-drop", className)}
      style={style}
      data-drag={drag || undefined}
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault(); setDrag(false);
        if (!disabled) handle(e.dataTransfer.files);
      }}
    >
      <strong>Drop files here</strong>
      <span className="rcs-upload-hint">or click to browse{accept ? ` (${accept})` : ""}</span>
      <input ref={inputRef} type="file" hidden accept={accept} multiple={multiple} disabled={disabled} onChange={(e) => handle(e.target.files)} />
    </div>
  );
}

// ─── FormField ────────────────────────────────────────────────────────
export function FormField(props: FormFieldProps): React.ReactElement {
  const { label, hint, error, required, optional, htmlFor, children, className, style, id } = props;
  const fieldId = htmlFor ?? id ?? uid("field");
  return (
    <div id={id} className={cx("rcs-form-field", className)} style={style}>
      {label && (
        <label htmlFor={fieldId} className="rcs-form-label">
          {label}
          {required && <span className="rcs-form-required" aria-label="required">*</span>}
          {optional && !required && <span className="rcs-form-optional">(optional)</span>}
        </label>
      )}
      {children}
      {error ? (
        <span className="rcs-form-error" role="alert">{error}</span>
      ) : hint ? (
        <span className="rcs-form-hint">{hint}</span>
      ) : null}
    </div>
  );
}
