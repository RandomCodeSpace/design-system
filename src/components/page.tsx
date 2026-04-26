/**
 * Page-level — PageHeader, AppShell
 * ─────────────────────────────────
 */
import * as React from "react";
import type { PageHeaderProps, AppShellProps } from "../components";
import { cx } from "../internal/cx";
import { Breadcrumb } from "./navigation";
import { Tabs } from "./navigation";

export function PageHeader(props: PageHeaderProps): React.ReactElement {
  const { title, subtitle, breadcrumbs, tabs, actions, badge, avatar, back, className, style, id } = props;
  return (
    <div id={id} className={cx("rcs-page-header", className)} style={style}>
      {back && (
        <button type="button" className="rcs-page-header-back" onClick={back.onClick}>
          ← {back.label ?? "Back"}
        </button>
      )}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div style={{ marginBottom: 8 }}><Breadcrumb items={breadcrumbs} /></div>
      )}
      <div className="rcs-page-header-row">
        <div className="rcs-page-header-title">
          {avatar}
          <div>
            <h1>{title}{badge && <span style={{ marginLeft: 8 }}>{badge}</span>}</h1>
            {subtitle && <div className="rcs-page-header-subtitle">{subtitle}</div>}
          </div>
        </div>
        {actions && <div className="rcs-page-header-actions">{actions}</div>}
      </div>
      {tabs && tabs.length > 0 && (
        <div className="rcs-page-header-tabs">
          <Tabs items={tabs} variant="line" />
        </div>
      )}
    </div>
  );
}

export function AppShell(props: AppShellProps): React.ReactElement {
  const { header, sidebar, footer, sidebarWidth = 240, sidebarCollapsible: _collapsible, children, className, style, id } = props;
  return (
    <div
      id={id}
      className={cx("rcs-app-shell", className)}
      style={{ ["--rcs-sidebar-w" as any]: `${sidebarWidth}px`, ...style }}
    >
      {header && <header className="rcs-app-shell-header">{header}</header>}
      <div className="rcs-app-shell-body" data-has-sidebar={Boolean(sidebar) || undefined}>
        {sidebar && <aside className="rcs-app-shell-sidebar">{sidebar}</aside>}
        <main className="rcs-app-shell-main">{children}</main>
      </div>
      {footer && <footer className="rcs-app-shell-footer">{footer}</footer>}
    </div>
  );
}
