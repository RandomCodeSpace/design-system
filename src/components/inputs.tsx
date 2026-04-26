/**
 * Inputs — Input, NumberInput, PinInput, Textarea
 * ────────────────────────────────────────────────
 */
import * as React from "react";
import type {
  InputProps, NumberInputProps, PinInputProps, TextareaProps,
} from "../components";
import { cx } from "../internal/cx";

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(props, ref) {
  const {
    value, defaultValue, placeholder,
    size = "md", status = "default",
    disabled = false, readOnly = false, invalid = false,
    prefix, suffix, clearable = false,
    type = "text", autoFocus = false,
    onChange, onFocus, onBlur, onKeyDown,
    className, style, id, "data-testid": dataTestid,
  } = props;

  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState<string>(defaultValue ?? "");
  const v = isControlled ? value! : internal;

  const inputRef = React.useRef<HTMLInputElement>(null);
  React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

  const wrapStatus = invalid ? "error" : status;

  return (
    <span
      className={cx("rcs-input-wrap", `rcs-input-wrap--${size}`, className)}
      style={style}
      data-status={wrapStatus}
      data-disabled={disabled || undefined}
    >
      {prefix && <span className="rcs-input-affix rcs-input-affix--left">{prefix}</span>}
      <input
        ref={inputRef}
        id={id}
        data-testid={dataTestid}
        className="rcs-input"
        type={type}
        value={v}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        autoFocus={autoFocus}
        aria-invalid={wrapStatus === "error" || undefined}
        onChange={(e) => {
          if (!isControlled) setInternal(e.target.value);
          onChange?.(e.target.value, e);
        }}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
      />
      {clearable && v && !disabled && !readOnly && (
        <button
          type="button"
          className="rcs-input-clear"
          aria-label="Clear"
          onClick={(e) => {
            const native = inputRef.current;
            if (!isControlled) setInternal("");
            if (native) {
              const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
              setter?.call(native, "");
              native.dispatchEvent(new Event("input", { bubbles: true }));
            }
            onChange?.("", e as unknown as React.ChangeEvent<HTMLInputElement>);
          }}
        >×</button>
      )}
      {suffix && <span className="rcs-input-affix rcs-input-affix--right">{suffix}</span>}
    </span>
  );
});

export function NumberInput(props: NumberInputProps): React.ReactElement {
  const { value, defaultValue, min, max, step = 1, precision, onChange, ...rest } = props;
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState<number | "">(defaultValue ?? "");
  const v = isControlled ? value! : internal;

  const text = v === "" ? "" : (precision !== undefined ? Number(v).toFixed(precision) : String(v));

  const update = (n: number | "") => {
    if (n === "") {
      if (!isControlled) setInternal("");
      return;
    }
    let clamped = n;
    if (min !== undefined) clamped = Math.max(min, clamped);
    if (max !== undefined) clamped = Math.min(max, clamped);
    if (!isControlled) setInternal(clamped);
    onChange?.(clamped);
  };

  return (
    <Input
      {...rest}
      type="text"
      value={text}
      onChange={(s) => {
        if (s === "" || s === "-") return update("");
        const n = Number(s);
        if (!Number.isNaN(n)) update(n);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          update((typeof v === "number" ? v : 0) + step);
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          update((typeof v === "number" ? v : 0) - step);
        }
        rest.onKeyDown?.(e);
      }}
    />
  );
}

export function PinInput(props: PinInputProps): React.ReactElement {
  const { length, value, mask = false, autoFocus = false, placeholder = "·", onChange, onComplete, className, style, id } = props;
  const [internal, setInternal] = React.useState<string>("");
  const isControlled = value !== undefined;
  const v = isControlled ? value! : internal;
  const cells = Array.from({ length }, (_, i) => v[i] ?? "");
  const refs = React.useRef<Array<HTMLInputElement | null>>([]);

  const setAt = (i: number, ch: string) => {
    const next = (v.slice(0, i) + ch + v.slice(i + 1)).slice(0, length);
    if (!isControlled) setInternal(next);
    onChange?.(next);
    if (next.length === length && !next.includes("")) onComplete?.(next);
  };

  return (
    <div id={id} className={cx("rcs-pin", className)} style={style}>
      {cells.map((c, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          className="rcs-pin-cell"
          value={mask && c ? "•" : c}
          inputMode="numeric"
          maxLength={1}
          autoFocus={autoFocus && i === 0}
          placeholder={placeholder}
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => {
            const ch = e.target.value.slice(-1);
            setAt(i, ch);
            if (ch && i < length - 1) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !c && i > 0) refs.current[i - 1]?.focus();
            if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
            if (e.key === "ArrowRight" && i < length - 1) refs.current[i + 1]?.focus();
          }}
        />
      ))}
    </div>
  );
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(props, ref) {
  const {
    value, defaultValue, placeholder,
    rows = 4, autoResize = false, maxLength, showCount = false,
    size = "md", status = "default",
    disabled = false, readOnly = false, invalid = false,
    onChange, onFocus, onBlur, onKeyDown, autoFocus,
    className, style, id, "data-testid": dataTestid,
  } = props;
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState<string>(defaultValue ?? "");
  const v = isControlled ? value! : internal;
  const localRef = React.useRef<HTMLTextAreaElement>(null);
  React.useImperativeHandle(ref, () => localRef.current as HTMLTextAreaElement);

  React.useLayoutEffect(() => {
    if (!autoResize) return;
    const el = localRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [v, autoResize]);

  const wrapStatus = invalid ? "error" : status;

  return (
    <span style={{ display: "block", width: "100%", ...style }}>
      <textarea
        ref={localRef}
        id={id}
        data-testid={dataTestid}
        className={cx("rcs-textarea", `rcs-textarea--${size}`, className)}
        rows={rows}
        value={v}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        readOnly={readOnly}
        autoFocus={autoFocus}
        aria-invalid={wrapStatus === "error" || undefined}
        data-status={wrapStatus}
        onChange={(e) => {
          if (!isControlled) setInternal(e.target.value);
          onChange?.(e.target.value, e as unknown as React.ChangeEvent<HTMLInputElement>);
        }}
        onFocus={onFocus as any}
        onBlur={onBlur as any}
        onKeyDown={onKeyDown as any}
      />
      {showCount && (
        <span className="rcs-textarea-count">
          {v.length}{maxLength ? ` / ${maxLength}` : ""}
        </span>
      )}
    </span>
  );
});
