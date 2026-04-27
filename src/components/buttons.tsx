/**
 * Buttons — Button, IconButton, ButtonGroup
 * ─────────────────────────────────────────
 */
import * as React from "react";
import type {
  ButtonProps, IconButtonProps, ButtonGroupProps,
} from "../components";
import { cx } from "../internal/cx";

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(props, ref) {
  const {
    variant = "secondary",
    size = "md",
    shape = "rect",
    loading = false,
    disabled = false,
    block = false,
    iconLeft,
    iconRight,
    type = "button",
    children,
    onClick,
    className,
    style,
    id,
    "data-testid": dataTestid,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    "aria-describedby": ariaDescribedBy,
  } = props;

  const cls = cx(
    "rcs-button",
    `rcs-button--${variant}`,
    `rcs-button--${size}`,
    shape !== "rect" && `rcs-button--${shape}`,
    block && "rcs-button--block",
    className,
  );

  return (
    <button
      ref={ref}
      id={id}
      data-testid={dataTestid}
      type={type}
      className={cls}
      style={style}
      disabled={disabled || loading}
      aria-disabled={disabled || loading || undefined}
      aria-busy={loading || undefined}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      onClick={onClick}
    >
      {loading ? <span className="rcs-button-spinner" aria-hidden /> : iconLeft}
      {children}
      {iconRight}
    </button>
  );
});

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(props, ref) {
  const { icon, round = false, "aria-label": ariaLabel, ...rest } = props;
  return (
    <Button
      ref={ref}
      {...rest}
      shape={round ? "circle" : "square"}
      aria-label={ariaLabel}
    >
      {icon}
    </Button>
  );
});

export function ButtonGroup(props: ButtonGroupProps): React.ReactElement {
  const { children, size, direction = "horizontal", attached = true, className, style, id } = props;
  return (
    <div
      id={id}
      style={style}
      role="group"
      className={cx(
        "rcs-button-group",
        direction === "vertical" && "rcs-button-group--vertical",
        attached && "rcs-button-group--attached",
        className,
      )}
    >
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        if (size && (child.type === Button || (child.props as any)?.className?.includes?.("rcs-button"))) {
          return React.cloneElement(child as React.ReactElement<any>, { size });
        }
        return child;
      })}
    </div>
  );
}
