/**
 * Auto-generate one-or-more demos per component, derived entirely from
 * the parsed prop interface in `src/components.d.ts`.
 *
 * Heuristics:
 *   - Stateful pattern (`open` + `onClose`) → "Open me" demo with useState.
 *   - Imperative pattern (`toast.show`)     → trigger button + ToastRegion.
 *   - Union literal in {variant,tone,severity,kind} → "Variants" demo with one of each.
 *   - `size: Size`  → "Sizes" demo (xs/sm/md/lg).
 *   - `disabled` + `loading` → "States" demo.
 *   - Otherwise: a minimal "Default" demo with required props auto-filled
 *     from sample data shaped to the prop type.
 *
 * Each Demo is `{ title, description?, code }` where `code` is a JSX
 * expression rendered inside `<ThemeProvider mode="dark">`.
 */

const SAMPLE = {
  selectOptions: `[
    { label: "us-east-1", value: "us-east-1" },
    { label: "eu-central-1", value: "eu-central-1" },
    { label: "ap-south-1", value: "ap-south-1" },
  ]`,
  radioOptions: `[
    { label: "Small", value: "sm" },
    { label: "Medium", value: "md" },
    { label: "Large", value: "lg" },
  ]`,
  tabsItems: `[
    { key: "overview", label: "Overview" },
    { key: "logs", label: "Logs" },
    { key: "settings", label: "Settings" },
  ]`,
  menuItems: `[
    { key: "edit", label: "Edit" },
    { key: "duplicate", label: "Duplicate" },
    { key: "delete", label: "Delete", danger: true },
  ]`,
  breadcrumbItems: `[
    { label: "Services", href: "#" },
    { label: "API gateway", href: "#" },
    { label: "Settings" },
  ]`,
  stepsItems: `[
    { title: "Plan" },
    { title: "Build" },
    { title: "Deploy" },
  ]`,
  timelineItems: `[
    { title: "v0.1.0 released", time: "4m ago" },
    { title: "Build #128 passed", time: "12m ago" },
    { title: "PR #42 merged", time: "1h ago" },
  ]`,
  tableData: `[
    { id: "svc_001", region: "us-east-1", cpu: 42 },
    { id: "svc_002", region: "eu-central-1", cpu: 73 },
    { id: "svc_003", region: "ap-south-1", cpu: 18 },
  ]`,
  tableColumns: `[
    { key: "id", title: "ID", dataKey: "id" },
    { key: "region", title: "Region", dataKey: "region" },
    { key: "cpu", title: "CPU", dataKey: "cpu", render: (v) => v + "%" },
  ]`,
  chatMessages: `[
    { role: "user", content: "Deploy v0.2.0?" },
    { role: "assistant", content: "Running checks…" },
    { role: "tool", content: "All checks passed." },
    { role: "assistant", content: "Proceeding with deploy." },
  ]`,
  terminalLines: `[
    { kind: "command", content: "$ pnpm deploy --env=prod" },
    { kind: "output", content: "→ Building…" },
    { kind: "output", content: "✓ Deployed v0.2.0" },
  ]`,
  fileAccept: `".png,.jpg,.jpeg,.svg"`,
};

// Components that need a stable sample value for a given prop name.
const PROP_VALUE = {
  children: '"Click me"',
  text: '"Click me"',
  label: '"Label"',
  title: '"Title"',
  subtitle: '"Subtitle"',
  description: '"Description"',
  placeholder: '"Type something…"',
  hint: '"Helpful hint text"',
  content: '"A short tooltip"',
  name: '"Ada Lovelace"',
  value: "0",
  defaultValue: "0",
  min: "0",
  max: "100",
  step: "1",
  total: "120",
  pageSize: "20",
  defaultCurrent: "1",
  current: "1",
  delta: '"+3"',
  trend: '"up"',
  rows: "3",
  length: "6",
  size: '"md"',
  tone: '"neutral"',
  severity: '"info"',
  variant: '"primary"',
  language: '"ts"',
  kind: '"command"',
  icon: '<span>★</span>',
  "aria-label": '"Example"',
  rowKey: '"id"',
  accept: SAMPLE.fileAccept,
  options: SAMPLE.selectOptions,
  items: "/* depends on component */",
  data: SAMPLE.tableData,
  columns: SAMPLE.tableColumns,
  messages: SAMPLE.chatMessages,
  lines: SAMPLE.terminalLines,
};

// ── Helpers ─────────────────────────────────────────────────────────
function resolveType(typeStr, aliases) {
  if (!aliases) return typeStr;
  // Strip "| undefined" tail
  let t = typeStr.replace(/\s*\|\s*undefined\s*$/, "").trim();
  // Single identifier referencing a known alias
  const m = t.match(/^([A-Za-z_]\w*)$/);
  if (m && aliases.has(m[1])) return aliases.get(m[1]);
  return typeStr;
}
function unionLiterals(typeStr, aliases) {
  const resolved = resolveType(typeStr, aliases);
  const out = [];
  for (const m of resolved.matchAll(/"([^"]+)"/g)) out.push(m[1]);
  return out;
}
function isLiteralUnion(typeStr, aliases) {
  const resolved = resolveType(typeStr, aliases);
  return /^"[^"]+"\s*\|/.test(resolved) || /^\s*"[^"]+"\s*$/.test(resolved);
}
function defaultLiteral(typeStr, aliases) {
  const resolved = resolveType(typeStr, aliases);
  const m = resolved.match(/^\s*"([^"]+)"/);
  return m ? m[1] : null;
}
function fillProp(name, typeStr, aliases) {
  // 1. Items prop is name-specific — items in Tabs vs Menu vs Steps differ
  // 2. Other named props use PROP_VALUE table when shape matches
  if (PROP_VALUE[name]) return `${name}={${PROP_VALUE[name]}}`;
  // String literal default (boolean → true; number → 0; etc.)
  if (typeStr === "boolean") return `${name}={true}`;
  if (typeStr === "number") return `${name}={0}`;
  if (typeStr === "string") return `${name}="…"`;
  if (isLiteralUnion(typeStr, aliases)) return `${name}="${defaultLiteral(typeStr, aliases)}"`;
  if (/=>\s*(void|undefined)/.test(typeStr)) return `${name}={() => {}}`;
  if (/\[\]/.test(typeStr) || /Array</.test(typeStr) || /readonly\s+\w+\[\]/.test(typeStr)) return `${name}={[]}`;
  if (/^Date\b/.test(typeStr)) return `${name}={new Date()}`;
  if (/^ReactNode$/.test(typeStr)) return `${name}={<span>•</span>}`;
  return `${name}={undefined}`;
}

// Components whose default demo wants a particular `items` shape.
function itemsForComponent(name) {
  if (name === "Tabs") return SAMPLE.tabsItems;
  if (name === "Menu") return SAMPLE.menuItems;
  if (name === "Steps") return SAMPLE.stepsItems;
  if (name === "Breadcrumb") return SAMPLE.breadcrumbItems;
  if (name === "Timeline") return SAMPLE.timelineItems;
  return null;
}
function optionsForComponent(name) {
  if (name === "RadioGroup") return SAMPLE.radioOptions;
  return SAMPLE.selectOptions;
}

// Required attribute string for a component, name-aware.
function requiredAttrs(name, iface, aliases) {
  const required = iface.props.filter((p) => !p.optional);
  const skipChildren = required.find((p) => p.name === "children");
  const attrs = [];
  for (const p of required) {
    if (p.name === "children") continue;
    if (p.name === "items") {
      const v = itemsForComponent(name);
      if (v) { attrs.push(`items={${v}}`); continue; }
    }
    if (p.name === "options") {
      attrs.push(`options={${optionsForComponent(name)}}`);
      continue;
    }
    if (p.name === "data") { attrs.push(`data={${SAMPLE.tableData}}`); continue; }
    if (p.name === "columns") { attrs.push(`columns={${SAMPLE.tableColumns}}`); continue; }
    if (p.name === "messages") { attrs.push(`messages={${SAMPLE.chatMessages}}`); continue; }
    if (p.name === "lines") { attrs.push(`lines={${SAMPLE.terminalLines}}`); continue; }
    attrs.push(fillProp(p.name, p.type, aliases));
  }
  return { attrs, hasChildren: !!skipChildren };
}

// Body for `children` prop, name-aware.
function childrenFor(name) {
  if (name === "Card") return `<h3 className="rcs-h3" style={{margin:0}}>Card title</h3><p style={{margin:"6px 0 0",color:"var(--fg-3)"}}>Body text.</p>`;
  if (name === "ScrollDiv") return `<p>Scrollable content.</p><p>More content.</p><p>Keep going.</p><p>Done.</p>`;
  if (name === "Space") return `<Button>One</Button>\n  <Button>Two</Button>\n  <Button>Three</Button>`;
  if (name === "Grid") return `<Card>One</Card>\n  <Card>Two</Card>\n  <Card>Three</Card>`;
  if (name === "Tooltip") return `<Button>Hover me</Button>`;
  if (name === "Markdown") return `{\`# Heading\\n\\nThis is **markdown** with [a link](#).\`}`;
  if (name === "CodeBlock") return `{\`function deploy() { return Promise.resolve(); }\`}`;
  if (name === "FormField") return `<Input placeholder="us-east-1" />`;
  if (name === "Checkbox") return `Accept terms`;
  if (name === "ButtonGroup") return `<Button>Save</Button>\n  <Button>Discard</Button>`;
  if (name === "Tooltip") return `<Button>Hover me</Button>`;
  if (name === "AppShell") return `<div style={{padding:24}}>Main content</div>`;
  if (name === "ThemeProvider") return `<Card>Themed content</Card>`;
  if (name === "Modal" || name === "Drawer") return `<p>Body content.</p>`;
  if (name === "Alert") return `Database approaches capacity in 4 hours.`;
  if (name === "Badge") return `live`;
  return `Click me`;
}

// ── Demo generators ─────────────────────────────────────────────────
function defaultDemo(name, iface, aliases) {
  const { attrs, hasChildren } = requiredAttrs(name, iface, aliases);
  const attrStr = attrs.length ? "\n  " + attrs.join("\n  ") + "\n" : "";
  const inner = hasChildren ? `\n  ${childrenFor(name).split("\n").join("\n  ")}\n` : "";
  if (hasChildren) {
    return { title: "Default", code: `<${name}${attrStr}>${inner}</${name}>` };
  }
  return { title: "Default", code: `<${name}${attrs.length ? " " + attrs.join(" ") : ""} />` };
}

// Build the JSX for one instance of `name` with a single override prop set,
// keeping all required props populated so the runtime doesn't throw.
function instance(name, iface, aliases, overrideKey, overrideVal, label, indent = "  ") {
  const { attrs, hasChildren } = requiredAttrs(name, iface, aliases);
  // Replace any existing attr with the override (e.g. swap an existing
  // size= / variant= filled in by requiredAttrs).
  const filtered = attrs.filter((a) => !a.startsWith(overrideKey + "=") && !a.startsWith(overrideKey + "{"));
  filtered.push(`${overrideKey}="${overrideVal}"`);
  const attrStr = filtered.length ? "\n" + indent + "  " + filtered.join("\n" + indent + "  ") + "\n" + indent : " ";
  if (hasChildren) {
    return `${indent}<${name}${attrStr}>${label}</${name}>`;
  }
  return `${indent}<${name}${attrStr}/>`;
}

function variantsDemo(name, iface, aliases) {
  const candidates = ["variant", "tone", "severity", "kind"];
  const prop = iface.props.find((p) => candidates.includes(p.name) && isLiteralUnion(p.type, aliases));
  if (!prop) return null;
  const values = unionLiterals(prop.type, aliases);
  if (values.length < 2) return null;
  const titleMap = { variant: "Variants", tone: "Tones", severity: "Severities", kind: "Kinds" };
  if (name === "Alert" && prop.name === "severity") {
    const cards = values.map((v) => `  <Alert severity="${v}" title="${capitalize(v)}">Body of the ${v} alert.</Alert>`).join("\n");
    return { title: "Severities", code: `<Space size="sm" direction="vertical">\n${cards}\n</Space>` };
  }
  if (name === "Badge") {
    const items = values.map((v) => `  <Badge tone="${v}">${v}</Badge>`).join("\n");
    return { title: "Tones", code: `<Space size="sm">\n${items}\n</Space>` };
  }
  if (name === "StatusDot") {
    const items = values.map((v) => `  <span><StatusDot tone="${v}" /> ${capitalize(v)}</span>`).join("\n");
    return { title: "Tones", code: `<Space size="md" direction="vertical">\n${items}\n</Space>` };
  }
  const items = values.map((v) => instance(name, iface, aliases, prop.name, v, capitalize(v))).join("\n");
  return { title: titleMap[prop.name] || "Variants", code: `<Space size="sm">\n${items}\n</Space>` };
}

function sizesDemo(name, iface, aliases) {
  const sizeProp = iface.props.find((p) => p.name === "size" && (p.type === "Size" || p.type === "Size | undefined"));
  if (!sizeProp) return null;
  const sizes = ["xs", "sm", "md", "lg"];
  const items = sizes.map((s) => instance(name, iface, aliases, "size", s, s.toUpperCase())).join("\n");
  return { title: "Sizes", code: `<Space size="sm">\n${items}\n</Space>` };
}

function statesDemo(name, iface, aliases) {
  const hasDisabled = iface.props.some((p) => p.name === "disabled" && /\bboolean\b/.test(p.type));
  const hasLoading = iface.props.some((p) => p.name === "loading" && /\bboolean\b/.test(p.type));
  if (!hasDisabled && !hasLoading) return null;
  const { attrs, hasChildren } = requiredAttrs(name, iface, aliases);
  const wrap = (extra, label) => {
    const all = [...attrs, ...extra];
    const attrStr = all.length ? "\n  " + all.join("\n  ") + "\n  " : " ";
    return hasChildren
      ? `  <${name}${attrStr}>${label}</${name}>`
      : `  <${name}${attrStr}/>`;
  };
  const parts = [wrap([], "Default")];
  if (hasDisabled) parts.push(wrap(["disabled"], "Disabled"));
  if (hasLoading) parts.push(wrap(["loading"], "Loading…"));
  return { title: "States", code: `<Space size="sm">\n${parts.join("\n")}\n</Space>` };
}

// Stateful Open-me demo for Modal/Drawer
function openCloseDemo(name, iface) {
  const hasOpen = iface.props.some((p) => p.name === "open");
  const hasOnClose = iface.props.some((p) => p.name === "onClose");
  if (!hasOpen || !hasOnClose) return null;
  const titleProp = iface.props.find((p) => p.name === "title")?.optional === false ? "" : ` title="Open me"`;
  return {
    title: "Open / close",
    code: `(() => {
  function Demo() {
    const [open, setOpen] = React.useState(false);
    return <>
      <Button onClick={() => setOpen(true)}>Open ${name.toLowerCase()}</Button>
      <${name}
        open={open}
        onClose={() => setOpen(false)}${titleProp}>
        <p>Body content.</p>
      </${name}>
    </>;
  }
  return <Demo />;
})()`,
  };
}

// Special: Theme + useTheme
function themeDemo(name) {
  if (name === "ThemeProvider") {
    return [
      {
        title: "Default",
        description: "Mount once near the root. The provider stamps `data-theme` on `<html>`.",
        code: `(() => {
  function Demo() {
    const { mode, toggle } = useTheme();
    return <Space size="sm">
      <Badge tone="info">{mode}</Badge>
      <Button onClick={toggle}>Toggle theme</Button>
    </Space>;
  }
  return <Demo />;
})()`,
      },
    ];
  }
  if (name === "useTheme") {
    return [
      {
        title: "Read mode and toggle",
        code: `(() => {
  function Demo() {
    const { mode, toggle } = useTheme();
    return <Space size="sm">
      <Badge tone="info">{mode}</Badge>
      <Button onClick={toggle}>Switch theme</Button>
    </Space>;
  }
  return <Demo />;
})()`,
      },
    ];
  }
  return null;
}

// Special: imperative toast (and ToastRegion)
function toastDemo(name) {
  if (name === "toast" || name === "ToastRegion") {
    return [
      {
        title: "Trigger toasts",
        description: "Mount `<ToastRegion />` once near the root, then call `toast.show(...)` from anywhere.",
        code: `(() => {
  function Demo() {
    return <Space size="sm">
      <Button onClick={() => toast.show({ title: "Saved", severity: "success" })}>Success</Button>
      <Button onClick={() => toast.show({ title: "Heads up", severity: "info" })}>Info</Button>
      <Button onClick={() => toast.show({ title: "Failed", severity: "danger" })}>Danger</Button>
    </Space>;
  }
  return <><Demo /><ToastRegion /></>;
})()`,
      },
    ];
  }
  return null;
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// ── Public: generateDemos(name, iface, opts) ──────────────────────────
//   opts.typeAliases: Map<string, string>   resolves named aliases like
//                                           "ButtonVariant" → '"primary" | "secondary" | …'
export function generateDemos(name, iface, opts) {
  const aliases = opts && opts.typeAliases;
  // Hooks have no prop interface; bail with hook-specific demo if known.
  const themeOverride = themeDemo(name);
  if (themeOverride) return themeOverride;

  const toastOverride = toastDemo(name);
  if (toastOverride) return toastOverride;

  if (!iface) return [{ title: "Default", code: `<${name} />` }];

  // Stateful Open/close pattern: only one demo (the open-close one).
  const oc = openCloseDemo(name, iface);
  if (oc) return [oc];

  const demos = [];
  demos.push(defaultDemo(name, iface, aliases));
  const v = variantsDemo(name, iface, aliases);
  if (v) demos.push(v);
  const s = sizesDemo(name, iface, aliases);
  if (s) demos.push(s);
  const st = statesDemo(name, iface, aliases);
  if (st) demos.push(st);

  return demos;
}
