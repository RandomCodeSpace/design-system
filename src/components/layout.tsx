/**
 * Layout primitives — Card, Space, ScrollDiv, Divider, Grid, Grid.Col
 * ───────────────────────────────────────────────────────────────────
 */
import * as React from "react";
import type {
  CardProps, SpaceProps, ScrollDivProps, DividerProps,
  GridProps, GridColProps,
} from "../components";
import type { SpaceSize, Radius, Shadow } from "../tokens";
import { cx } from "../internal/cx";

const SPACE_PX: Record<Exclude<SpaceSize, number>, number> = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
function spacePx(s?: SpaceSize): number {
  if (s === undefined) return 12;
  return typeof s === "number" ? s : SPACE_PX[s];
}
const RADIUS_PX: Record<Exclude<Radius, number>, string> = {
  none: "0", sm: "4px", md: "6px", lg: "8px", pill: "9999px", circle: "50%",
};
function radiusVal(r?: Radius): string {
  if (r === undefined) return "var(--radius-md)";
  return typeof r === "number" ? `${r}px` : RADIUS_PX[r];
}
const SHADOW_VAR: Record<Shadow, string> = {
  none: "none", sm: "var(--shadow-sm)", md: "var(--shadow-md)", lg: "var(--shadow-lg)", overlay: "var(--shadow-lg)",
};

// ─── Card ─────────────────────────────────────────────────────────────
export function Card(props: CardProps): React.ReactElement {
  const {
    title, subtitle, extra, footer,
    bordered = true, hoverable = false,
    padding, radius, shadow = "none",
    children, className, style, id,
  } = props;

  const computedStyle: React.CSSProperties = {
    borderRadius: radiusVal(radius),
    boxShadow: SHADOW_VAR[shadow],
    border: bordered ? undefined : "0",
    ...style,
  };

  return (
    <div
      id={id}
      className={cx("rcs-card", className)}
      style={computedStyle}
      data-hoverable={hoverable || undefined}
    >
      {(title || extra) && (
        <div className="rcs-card-header">
          <div>
            {title && <div className="rcs-card-title">{title}</div>}
            {subtitle && <div className="rcs-card-subtitle">{subtitle}</div>}
          </div>
          {extra && <div className="rcs-card-extra">{extra}</div>}
        </div>
      )}
      <div className="rcs-card-body" style={padding !== undefined ? { padding: spacePx(padding) } : undefined}>
        {children}
      </div>
      {footer && <div className="rcs-card-footer">{footer}</div>}
    </div>
  );
}

// ─── Space ────────────────────────────────────────────────────────────
export function Space(props: SpaceProps): React.ReactElement {
  const { direction = "horizontal", size = "sm", align, justify, wrap = false, split, children, className, style, id } = props;
  const gap = spacePx(size);
  const items = React.Children.toArray(children);
  return (
    <div
      id={id}
      className={cx("rcs-space", direction === "vertical" && "rcs-space--vertical", wrap && "rcs-space--wrap", className)}
      style={{
        gap,
        alignItems: align,
        justifyContent: justify,
        flexDirection: direction === "vertical" ? "column" : "row",
        ...style,
      }}
    >
      {items.map((child, i) => (
        <React.Fragment key={i}>
          {child}
          {split && i < items.length - 1 && <span className="rcs-space-split">{split}</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── ScrollDiv ────────────────────────────────────────────────────────
export function ScrollDiv(props: ScrollDivProps): React.ReactElement {
  const { direction = "y", height, maxHeight, width, contain = true, thin = false, children, onScroll, className, style, id } = props;
  return (
    <div
      id={id}
      className={cx("rcs-scroll", className)}
      data-thin={thin || undefined}
      style={{
        height, maxHeight, width,
        overflowX: direction === "x" || direction === "both" ? "auto" : "hidden",
        overflowY: direction === "y" || direction === "both" ? "auto" : "hidden",
        overscrollBehavior: contain ? "contain" : "auto",
        ...style,
      }}
      onScroll={(e) => {
        const el = e.currentTarget;
        onScroll?.({
          scrollTop: el.scrollTop,
          scrollLeft: el.scrollLeft,
          atTop: el.scrollTop === 0,
          atBottom: Math.abs(el.scrollHeight - el.clientHeight - el.scrollTop) < 1,
        });
      }}
    >
      {children}
    </div>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────
export function Divider(props: DividerProps): React.ReactElement {
  const { direction = "horizontal", variant = "solid", children, className, style, id } = props;
  if (children) {
    return (
      <div id={id} className={cx("rcs-divider", "rcs-divider--text", variant === "dashed" && "rcs-divider--dashed", className)} style={style}>
        {children}
      </div>
    );
  }
  return (
    <div
      id={id}
      role="separator"
      className={cx("rcs-divider", `rcs-divider--${direction}`, variant === "dashed" && "rcs-divider--dashed", className)}
      style={style}
    />
  );
}

// ─── Grid + Grid.Col ──────────────────────────────────────────────────
function GridFn(props: GridProps): React.ReactElement {
  const { columns = 12, gap = "md", children, className, style, id } = props;
  return (
    <div
      id={id}
      className={cx("rcs-grid", className)}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: spacePx(gap), ...style }}
    >
      {children}
    </div>
  );
}

function GridCol(props: GridColProps): React.ReactElement {
  const { span, offset, children, className, style, id } = props;
  return (
    <div
      id={id}
      className={className}
      style={{
        gridColumn: `${offset ? offset + 1 : "auto"} / span ${span}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export const Grid = Object.assign(GridFn, { Col: GridCol });
