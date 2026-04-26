/**
 * Badges & status — Badge, StatusDot
 * ──────────────────────────────────
 */
import * as React from "react";
import type { BadgeProps, StatusDotProps } from "../components";
import { cx } from "../internal/cx";

export function Badge(props: BadgeProps): React.ReactElement {
  const { tone = "neutral", size = "md", icon, closable = false, onClose, children, className, style, id } = props;
  return (
    <span
      id={id}
      className={cx("rcs-badge", `rcs-badge--${tone}`, size !== "md" && `rcs-badge--${size}`, className)}
      style={style}
    >
      {icon && <span aria-hidden>{icon}</span>}
      {children}
      {closable && (
        <button
          type="button"
          className="rcs-badge-x"
          aria-label="Remove"
          onClick={onClose}
        >×</button>
      )}
    </span>
  );
}

export function StatusDot(props: StatusDotProps): React.ReactElement {
  const { status, label, pulse = false, className, style, id } = props;
  return (
    <span
      id={id}
      className={cx("rcs-status-dot", className)}
      style={style}
      data-status={status}
      data-pulse={pulse || undefined}
    >
      <span className="rcs-status-dot-glyph" aria-hidden />
      {label && <span>{label}</span>}
    </span>
  );
}
