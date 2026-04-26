# App UI Kit — RandomCodeSpace

Self-hosted dashboard surface: services overview, logs, settings, command palette.

Built with React 18 + Babel inline. Theme tokens from `colors_and_type.css` in the project root. Voice and visual rules in [`SKILL.md`](../../SKILL.md).

## Files

| File | What it is |
|------|------------|
| `index.html` | Assembled dashboard — sidebar, topbar, services grid, log tail drawer |
| `Sidebar.jsx` | Left nav, 260px — service list + grouped sections |
| `Topbar.jsx` | Command menu trigger, theme toggle, user menu |
| `ServicesGrid.jsx` | Service cards with status dot, region, CPU/mem metrics |
| `LogTail.jsx` | Right drawer with live-ish log feed, severity filter |
| `CommandMenu.jsx` | ⌘K command palette with grouped actions |

## Loading

`index.html` wires React + Babel and renders a complete dashboard. Components are exported to `window` at end of each JSX file so they can be composed across `<script type="text/babel">` blocks.

## Brand alignment

- Density is **compact** by default — this is dev-tooling, not consumer.
- Status uses semantic tokens: `running` → green dot, `degraded` → amber, `failed` → red, `idle` → neutral.
- Tables and log rows use JetBrains Mono for IDs, timestamps, and values.
- Drawer / modal motion is 180ms ease-out — no spring physics.
