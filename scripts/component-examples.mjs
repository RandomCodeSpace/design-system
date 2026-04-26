/**
 * Hand-authored examples per component. Each example is a JSX expression
 * that the runner evaluates inside `<ThemeProvider mode="dark">`.
 *
 * Conventions:
 *   - Plain JSX expression for stateless examples.
 *   - IIFE returning <Demo/> for stateful examples (Modal, Drawer, Tabs).
 *   - All RCS exports + React are in scope (destructured by the runner).
 *
 * Components without an entry fall through to the auto-scaffolder below.
 */

export const EXAMPLES = {
  // ── Theme ───────────────────────────────────────────────────────────
  ThemeProvider: `(() => {
  function Demo() {
    const { mode, toggle } = useTheme();
    return <Button onClick={toggle}>Theme: {mode} (click to toggle)</Button>;
  }
  return <Demo />;
})()`,

  useTheme: `(() => {
  function Demo() {
    const { mode, toggle } = useTheme();
    return <Space size="sm">
      <Badge tone="info">{mode}</Badge>
      <Button onClick={toggle}>Toggle theme</Button>
    </Space>;
  }
  return <Demo />;
})()`,

  // ── Layout ──────────────────────────────────────────────────────────
  Card: `<Card>
  <h3 className="rcs-h3" style={{margin:0}}>Production</h3>
  <p className="rcs-body" style={{margin:"4px 0 0",color:"var(--fg-3)"}}>Last deploy 4 minutes ago.</p>
</Card>`,

  Space: `<Space size="md">
  <Button>One</Button>
  <Button>Two</Button>
  <Button>Three</Button>
</Space>`,

  ScrollDiv: `<ScrollDiv style={{ height: 120, border: "1px solid var(--border-1)", padding: 12 }}>
  <p>Scrollable content here.</p>
  <p>More content below.</p>
  <p>Keep going.</p>
  <p>Almost there.</p>
  <p>Done.</p>
</ScrollDiv>`,

  Divider: `<Card>
  <span className="rcs-micro">Above</span>
  <Divider />
  <span className="rcs-micro">Below</span>
</Card>`,

  Grid: `<Grid columns={3} gap="sm">
  <Card>One</Card>
  <Card>Two</Card>
  <Card>Three</Card>
</Grid>`,

  PageHeader: `<PageHeader
  title="Services"
  subtitle="42 active across 3 regions"
  actions={<Button variant="primary">New service</Button>}
/>`,

  AppShell: `<AppShell
  sidebar={<div style={{padding:16,fontFamily:"var(--font-mono)",fontSize:12,color:"var(--fg-3)"}}>SIDEBAR</div>}
  header={<div style={{padding:"12px 16px",borderBottom:"1px solid var(--border-1)",fontFamily:"var(--font-mono)",fontSize:12}}>HEADER</div>}
  style={{ height: 280 }}
>
  <div style={{padding:24,fontFamily:"var(--font-sans)"}}>Main content area</div>
</AppShell>`,

  // ── Buttons & actions ───────────────────────────────────────────────
  Button: `<Space size="sm">
  <Button variant="primary">Deploy</Button>
  <Button variant="secondary">Review</Button>
  <Button variant="ghost">Cancel</Button>
  <Button variant="danger">Destroy</Button>
</Space>`,

  IconButton: `<Space size="sm">
  <IconButton icon={<span>★</span>} aria-label="Favorite" />
  <IconButton icon={<span>⚙</span>} aria-label="Settings" />
  <IconButton icon={<span>×</span>} aria-label="Close" round />
</Space>`,

  ButtonGroup: `<ButtonGroup>
  <Button>Save</Button>
  <Button>Discard</Button>
</ButtonGroup>`,

  // ── Forms & inputs ──────────────────────────────────────────────────
  Input: `<Input placeholder="us-east-1.example.com" />`,

  NumberInput: `<NumberInput defaultValue={42} min={0} max={100} step={1} />`,

  PinInput: `<PinInput length={6} />`,

  Textarea: `<Textarea rows={3} placeholder="Describe the incident..." />`,

  Select: `<Select
  options={[
    { label: "us-east-1", value: "us-east-1" },
    { label: "eu-central-1", value: "eu-central-1" },
    { label: "ap-south-1", value: "ap-south-1" },
  ]}
  defaultValue="us-east-1"
/>`,

  Combobox: `<Combobox
  options={[
    { label: "production", value: "prod" },
    { label: "staging", value: "stage" },
    { label: "development", value: "dev" },
  ]}
  placeholder="Pick environment"
/>`,

  Checkbox: `<Checkbox defaultChecked>Accept terms and conditions</Checkbox>`,

  RadioGroup: `<RadioGroup
  name="size"
  options={[
    { label: "Small", value: "sm" },
    { label: "Medium", value: "md" },
    { label: "Large", value: "lg" },
  ]}
  defaultValue="md"
/>`,

  Switch: `<Space size="sm"><Switch defaultChecked /> Auto-deploy on merge</Space>`,

  Slider: `<Slider min={0} max={100} defaultValue={42} />`,

  DatePicker: `<DatePicker />`,

  DateRangePicker: `<DateRangePicker />`,

  FileUpload: `<FileUpload accept=".png,.jpg,.jpeg,.svg" />`,

  FormField: `<FormField label="Region" hint="Where the service should be deployed">
  <Input placeholder="us-east-1" />
</FormField>`,

  // ── Data display ────────────────────────────────────────────────────
  Badge: `<Space size="sm">
  <Badge tone="neutral">v0.1.0</Badge>
  <Badge tone="info">draft</Badge>
  <Badge tone="warning">staging</Badge>
  <Badge tone="danger">incident</Badge>
  <Badge tone="solid">live</Badge>
</Space>`,

  StatusDot: `<Space size="sm">
  <span><StatusDot tone="solid" /> Production</span>
  <span><StatusDot tone="warning" /> Degraded</span>
  <span><StatusDot tone="danger" /> Down</span>
</Space>`,

  Table: `<Table
  columns={[
    { key: "id", title: "ID", dataKey: "id" },
    { key: "region", title: "Region", dataKey: "region" },
    { key: "cpu", title: "CPU", dataKey: "cpu", render: (v) => v + "%" },
    { key: "status", title: "Status", dataKey: "status", render: (v) => <Badge tone={v === "live" ? "solid" : "warning"}>{v}</Badge> },
  ]}
  data={[
    { id: "svc_001", region: "us-east-1", cpu: 42, status: "live" },
    { id: "svc_002", region: "eu-central-1", cpu: 73, status: "live" },
    { id: "svc_003", region: "ap-south-1", cpu: 18, status: "draft" },
  ]}
  rowKey="id"
/>`,

  Stat: `<Space size="md">
  <Stat label="Active services" value="42" delta="+3" trend="up" />
  <Stat label="P95 latency" value="84ms" delta="-12ms" trend="up" />
  <Stat label="Error rate" value="0.04%" delta="+0.01%" trend="down" />
</Space>`,

  Avatar: `<Space size="sm">
  <Avatar name="Ada Lovelace" size="sm" />
  <Avatar name="Alan Turing" size="md" />
  <Avatar name="Grace Hopper" size="lg" />
</Space>`,

  Timeline: `<Timeline items={[
  { title: "v0.1.0 released to production", time: "4 minutes ago" },
  { title: "Build #128 succeeded", time: "12 minutes ago" },
  { title: "PR #42 merged into main", time: "1 hour ago" },
  { title: "PR #42 opened by @ada", time: "3 hours ago" },
]} />`,

  // ── Navigation ──────────────────────────────────────────────────────
  Tabs: `(() => {
  function Demo() {
    const [active, setActive] = React.useState("overview");
    return <Tabs
      items={[
        { key: "overview", label: "Overview" },
        { key: "logs", label: "Logs" },
        { key: "settings", label: "Settings" },
      ]}
      value={active}
      onChange={setActive}
    />;
  }
  return <Demo />;
})()`,

  Menu: `<Menu
  items={[
    { key: "edit", label: "Edit" },
    { key: "duplicate", label: "Duplicate" },
    { key: "archive", label: "Archive" },
    { key: "delete", label: "Delete", danger: true },
  ]}
/>`,

  Breadcrumb: `<Breadcrumb items={[
  { label: "Services", href: "#" },
  { label: "API gateway", href: "#" },
  { label: "Settings" },
]} />`,

  Pagination: `<Pagination total={120} pageSize={20} defaultCurrent={1} />`,

  Steps: `<Steps current={1} items={[
  { title: "Plan" },
  { title: "Build" },
  { title: "Deploy" },
  { title: "Verify" },
]} />`,

  // ── Feedback ────────────────────────────────────────────────────────
  Alert: `<Space size="sm" direction="vertical">
  <Alert severity="info" title="Heads up">Database approaches capacity in 4 hours.</Alert>
  <Alert severity="success" title="Deployed">v0.2.0 live in us-east-1.</Alert>
  <Alert severity="warning" title="Degraded">P95 latency 320ms.</Alert>
  <Alert severity="danger" title="Failed">Build #129 failed in CI.</Alert>
</Space>`,

  Modal: `(() => {
  function Demo() {
    const [open, setOpen] = React.useState(false);
    return <>
      <Button onClick={() => setOpen(true)}>Open modal</Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Confirm deploy"
        description="This will push v0.2.0 to production."
        footer={<Space size="sm">
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => setOpen(false)}>Deploy</Button>
        </Space>}
      >
        <p>All pre-deploy checks passed. Continue?</p>
      </Modal>
    </>;
  }
  return <Demo />;
})()`,

  Drawer: `(() => {
  function Demo() {
    const [open, setOpen] = React.useState(false);
    return <>
      <Button onClick={() => setOpen(true)}>Open drawer</Button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Service details" placement="right">
        <p>svc_001 · us-east-1 · 42% CPU</p>
        <p>Last deploy 4 minutes ago.</p>
      </Drawer>
    </>;
  }
  return <Demo />;
})()`,

  Progress: `<Space size="md" direction="vertical" style={{width:280}}>
  <Progress value={28} />
  <Progress value={62} />
  <Progress value={94} />
</Space>`,

  Skeleton: `<Space size="sm" direction="vertical" style={{width:240}}>
  <Skeleton width="60%" height={14} />
  <Skeleton width="100%" height={14} />
  <Skeleton width="80%" height={14} />
</Space>`,

  Spin: `<Space size="md">
  <Spin size="sm" />
  <Spin size="md" />
  <Spin size="lg" />
</Space>`,

  Tooltip: `<Tooltip content="A short description">
  <Button>Hover me</Button>
</Tooltip>`,

  toast: `(() => {
  function Demo() {
    return <Space size="sm">
      <Button onClick={() => toast.show({ title: "Saved", severity: "success" })}>Success</Button>
      <Button onClick={() => toast.show({ title: "Heads up", severity: "info" })}>Info</Button>
      <Button onClick={() => toast.show({ title: "Failed", severity: "danger" })}>Danger</Button>
    </Space>;
  }
  return <><Demo /><ToastRegion /></>;
})()`,

  ToastRegion: `(() => {
  function Demo() {
    return <Button onClick={() => toast.show({ title: "Hello world" })}>Trigger toast</Button>;
  }
  return <><Demo /><ToastRegion /></>;
})()`,

  // ── Content ─────────────────────────────────────────────────────────
  CodeBlock: `<CodeBlock language="ts">{\`function deploy(version: string): Promise<void> {
  return Promise.resolve();
}\`}</CodeBlock>`,

  Markdown: `<Markdown>{\`# Heading

This is **markdown** with [a link](#) and \\\`inline code\\\`.

- bullet one
- bullet two\`}</Markdown>`,

  Terminal: `<Terminal lines={[
  { kind: "command", content: "$ pnpm deploy --env=prod" },
  { kind: "output", content: "→ Building..." },
  { kind: "output", content: "→ Uploaded artifact 28.4 MB" },
  { kind: "output", content: "✓ Deployed v0.2.0 to us-east-1" },
]} />`,

  RichTextEditor: `<RichTextEditor placeholder="Start writing..." />`,

  Chat: `<Chat messages={[
  { role: "user", content: "Deploy v0.2.0?" },
  { role: "assistant", content: "Running pre-deploy checks..." },
  { role: "tool", content: "All checks passed." },
  { role: "assistant", content: "Proceeding with deploy." },
]} />`,
};

/**
 * Auto-scaffold a minimal example for a component without an explicit entry.
 * Reads the prop interface to fill in required props with sensible defaults.
 */
export function autoScaffold(name, iface) {
  if (!iface) return `<${name} />`;
  const required = iface.props.filter((p) => !p.optional);
  let attrs = [];
  let children = "";
  for (const p of required) {
    if (p.name === "children") { children = "Example"; continue; }
    if (p.name === "aria-label") { attrs.push(`aria-label="Example"`); continue; }
    const lit = p.type.match(/^"([^"]+)"/);
    if (lit) { attrs.push(`${p.name}="${lit[1]}"`); continue; }
    if (p.type === "string") { attrs.push(`${p.name}="..."`); continue; }
    if (p.type === "boolean") { attrs.push(`${p.name}={true}`); continue; }
    if (p.type === "number") { attrs.push(`${p.name}={0}`); continue; }
    if (/=>\s*(void|undefined)/.test(p.type)) { attrs.push(`${p.name}={() => {}}`); continue; }
    if (/\[\]/.test(p.type) || /Array</.test(p.type) || /readonly\s+\w+\[\]/.test(p.type)) {
      attrs.push(`${p.name}={[]}`); continue;
    }
    attrs.push(`${p.name}={undefined}`);
  }
  const attrStr = attrs.length ? " " + attrs.join(" ") : "";
  if (children) return `<${name}${attrStr}>${children}</${name}>`;
  return `<${name}${attrStr} />`;
}
