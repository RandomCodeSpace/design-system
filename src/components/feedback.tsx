/**
 * Feedback — Alert, Modal, Drawer, Progress, Skeleton, Spin, Tooltip, toast
 * ─────────────────────────────────────────────────────────────────────────
 */
import * as React from "react";
import type {
  AlertProps, ModalProps, DrawerProps,
  ProgressProps, SkeletonProps, SpinProps, TooltipProps,
  ToastApi, ToastOptions,
} from "../components";
import { cx, uid } from "../internal/cx";

const SEV_ICON = { info: "ⓘ", success: "✓", warning: "⚠", danger: "✕" } as const;

// ─── Alert ────────────────────────────────────────────────────────────
export function Alert(props: AlertProps): React.ReactElement {
  const { severity, title, children, closable = false, icon, action, onClose, className, style, id } = props;
  return (
    <div id={id} role="alert" className={cx("rcs-alert", `rcs-alert--${severity}`, className)} style={style}>
      {icon !== false && <span className="rcs-alert-icon" aria-hidden>{icon ?? SEV_ICON[severity]}</span>}
      <div className="rcs-alert-body">
        {title && <div className="rcs-alert-title">{title}</div>}
        {children && <div className="rcs-alert-content">{children}</div>}
        {action && <div className="rcs-alert-action">{action}</div>}
      </div>
      {closable && (
        <button type="button" className="rcs-alert-close" aria-label="Dismiss" onClick={onClose}>×</button>
      )}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────
function useEsc(active: boolean, handler: () => void): void {
  React.useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handler(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, handler]);
}

export function Modal(props: ModalProps): React.ReactElement | null {
  const {
    open, title, description, size = "md",
    closeOnEsc = true, closeOnBackdrop = true,
    footer, children, onClose, className, style, id,
  } = props;
  useEsc(open && closeOnEsc, onClose);
  if (!open) return null;
  return (
    <div
      className="rcs-modal-backdrop"
      role="dialog" aria-modal="true" aria-labelledby={title ? `${id ?? "modal"}-title` : undefined}
      onClick={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose();
      }}
    >
      <div id={id} className={cx("rcs-modal", `rcs-modal--${size}`, className)} style={style}>
        {(title || description) && (
          <div className="rcs-modal-header">
            {title && <h2 id={`${id ?? "modal"}-title`} className="rcs-modal-title">{title}</h2>}
            {description && <div className="rcs-modal-desc">{description}</div>}
          </div>
        )}
        <div className="rcs-modal-body">{children}</div>
        {footer && <div className="rcs-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ─── Drawer ───────────────────────────────────────────────────────────
export function Drawer(props: DrawerProps): React.ReactElement | null {
  const {
    open, title, description,
    placement = "right", width = 360,
    closeOnEsc = true, closeOnBackdrop = true,
    footer, children, onClose, className, style, id,
  } = props;
  useEsc(open && closeOnEsc, onClose);
  if (!open) return null;

  const w = typeof width === "number" ? `${width}px` : width;
  const drawerStyle: React.CSSProperties = { ...style };
  if (placement === "left" || placement === "right") drawerStyle.width = w;
  else drawerStyle.height = w;

  return (
    <div
      className="rcs-modal-backdrop"
      role="dialog" aria-modal="true"
      style={{ alignItems: placement === "top" ? "flex-start" : placement === "bottom" ? "flex-end" : "stretch", justifyItems: placement === "left" ? "flex-start" : placement === "right" ? "flex-end" : "stretch", padding: 0 }}
      onClick={(e) => { if (closeOnBackdrop && e.target === e.currentTarget) onClose(); }}
    >
      <div id={id} className={cx("rcs-drawer", `rcs-drawer--${placement}`, className)} style={drawerStyle}>
        {(title || description) && (
          <div className="rcs-modal-header">
            {title && <h2 className="rcs-modal-title">{title}</h2>}
            {description && <div className="rcs-modal-desc">{description}</div>}
          </div>
        )}
        <div className="rcs-modal-body" style={{ flex: 1, overflow: "auto" }}>{children}</div>
        {footer && <div className="rcs-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ─── Progress ─────────────────────────────────────────────────────────
export function Progress(props: ProgressProps): React.ReactElement {
  const { value, indeterminate = false, variant = "linear", size = "md", tone = "neutral", showValue = false, className, style, id } = props;
  const v = Math.max(0, Math.min(100, value));

  if (variant === "circular") {
    const r = size === "lg" ? 24 : size === "sm" ? 14 : 18;
    const stroke = size === "lg" ? 3 : 2;
    const c = 2 * Math.PI * r;
    const dash = (v / 100) * c;
    return (
      <span id={id} className={cx("rcs-progress", className)} style={style} role="progressbar" aria-valuenow={v}>
        <svg width={r * 2 + stroke * 2} height={r * 2 + stroke * 2}>
          <circle cx={r + stroke} cy={r + stroke} r={r} stroke="var(--bg-3)" strokeWidth={stroke} fill="none" />
          <circle
            cx={r + stroke} cy={r + stroke} r={r}
            stroke={tone === "danger" ? "var(--danger)" : tone === "warning" ? "var(--warning)" : "var(--bg-inverse)"}
            strokeWidth={stroke} fill="none"
            strokeDasharray={`${dash} ${c}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${r + stroke} ${r + stroke})`}
            style={{ transition: "stroke-dasharray 0.3s var(--ease-out-quart)" }}
          />
        </svg>
      </span>
    );
  }

  return (
    <div
      id={id}
      role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={indeterminate ? undefined : v}
      className={cx("rcs-progress", `rcs-progress--${size}`, className)}
      style={style}
      data-tone={tone}
      data-indeterminate={indeterminate || undefined}
    >
      <div className="rcs-progress-track">
        <div className="rcs-progress-fill" style={{ width: `${v}%` }} />
      </div>
      {showValue && <div className="rcs-progress-value">{Math.round(v)}%</div>}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────
export function Skeleton(props: SkeletonProps): React.ReactElement {
  const { variant = "rect", width, height, lines, animated = true, className, style, id } = props;
  if (variant === "text" && lines && lines > 1) {
    return (
      <span id={id} className={className} style={{ display: "block", ...style }}>
        {Array.from({ length: lines }, (_, i) => (
          <span
            key={i}
            className={cx("rcs-skeleton", "rcs-skeleton--text")}
            data-animated={animated || undefined}
            style={{ width: i === lines - 1 ? "60%" : "100%", marginBottom: 6, height: 12 }}
          />
        ))}
      </span>
    );
  }
  return (
    <span
      id={id}
      className={cx("rcs-skeleton", `rcs-skeleton--${variant}`, className)}
      data-animated={animated || undefined}
      style={{ width: width ?? (variant === "circle" ? 32 : "100%"), height: height ?? (variant === "circle" ? 32 : variant === "text" ? 12 : 60), ...style }}
    />
  );
}

// ─── Spin ─────────────────────────────────────────────────────────────
export function Spin(props: SpinProps): React.ReactElement {
  const { size = "md", tone = "neutral", label, className, style, id } = props;
  return (
    <span id={id} className={cx("rcs-spin", `rcs-spin--${size}`, className)} style={style} data-tone={tone} role="status">
      <span className="rcs-spin-glyph" aria-hidden />
      {label && <span>{label}</span>}
    </span>
  );
}

// ─── Tooltip ──────────────────────────────────────────────────────────
export function Tooltip(props: TooltipProps): React.ReactElement {
  const { content, placement = "top", delay = 100, children, className, style, id } = props;
  const [show, setShow] = React.useState(false);
  const t = React.useRef<number | null>(null);
  const open = () => {
    if (t.current) window.clearTimeout(t.current);
    t.current = window.setTimeout(() => setShow(true), delay);
  };
  const close = () => {
    if (t.current) window.clearTimeout(t.current);
    setShow(false);
  };
  return (
    <span
      id={id}
      className={cx("rcs-tooltip", className)}
      style={style}
      onMouseEnter={open}
      onMouseLeave={close}
      onFocus={open}
      onBlur={close}
    >
      {children}
      {show && <span className="rcs-tooltip-bubble" data-placement={placement} role="tooltip">{content}</span>}
    </span>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────
type ToastEntry = ToastOptions & { id: string };
type Listener = (toasts: ToastEntry[]) => void;

const toasts: ToastEntry[] = [];
const listeners = new Set<Listener>();
function emit(): void { for (const l of listeners) l([...toasts]); }

export const toast: ToastApi = {
  show(opts) {
    const id = opts.id ?? uid("toast");
    const entry: ToastEntry = { ...opts, id };
    toasts.push(entry);
    emit();
    const dur = opts.duration ?? 4000;
    if (dur > 0) {
      window.setTimeout(() => toast.dismiss(id), dur);
    }
    return id;
  },
  dismiss(id) {
    const idx = toasts.findIndex((t) => t.id === id);
    if (idx >= 0) {
      const removed = toasts.splice(idx, 1)[0]!;
      removed.onDismiss?.();
      emit();
    }
  },
  async promise(p, msgs) {
    const id = toast.show({ severity: "info", title: msgs.loading, duration: 0 });
    try {
      const result = await p;
      toast.dismiss(id);
      toast.show({ severity: "success", title: msgs.success });
      return result;
    } catch (e) {
      toast.dismiss(id);
      toast.show({ severity: "danger", title: msgs.error });
      throw e;
    }
  },
};

export function ToastRegion(): React.ReactElement {
  const [list, setList] = React.useState<ToastEntry[]>([]);
  React.useEffect(() => {
    listeners.add(setList);
    return () => { listeners.delete(setList); };
  }, []);
  return (
    <div className="rcs-toast-region" aria-live="polite" aria-atomic="false">
      {list.map((t) => (
        <div key={t.id} className={cx("rcs-toast", `rcs-toast--${t.severity ?? "info"}`)} role="status">
          <span className="rcs-toast-icon" aria-hidden>{SEV_ICON[t.severity ?? "info"]}</span>
          <div style={{ flex: 1 }}>
            <div className="rcs-toast-title">{t.title}</div>
            {t.description && <div className="rcs-toast-desc">{t.description}</div>}
          </div>
          {t.action && (
            <button className="rcs-toast-action" onClick={() => { t.action!.onClick(); toast.dismiss(t.id); }}>
              {t.action.label}
            </button>
          )}
          <button className="rcs-input-clear" aria-label="Dismiss" onClick={() => toast.dismiss(t.id)}>×</button>
        </div>
      ))}
    </div>
  );
}
