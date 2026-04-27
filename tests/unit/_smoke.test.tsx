/**
 * Smoke render every public component with a minimal valid invocation.
 * Catches breakage in any component without requiring per-component test
 * coverage. Per-component edge cases live in their own files alongside.
 */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import * as React from "react";
import * as RCS from "../../src";

const opts = [
  { label: "A", value: "a" },
  { label: "B", value: "b" },
];
const tabsItems = [{ key: "a", label: "A" }];
const menuItems = [{ key: "a", label: "A" }];
const breadcrumbItems = [{ label: "A" }];
const stepsItems = [{ title: "A" }, { title: "B" }];
const timelineItems = [{ key: "k1", title: "A" }];
const tableData = [{ id: "a", v: 1 }];
const tableColumns = [{ key: "id", title: "ID", dataKey: "id" as const }];
const messages = [{ id: "m1", role: "user" as const, content: "hi" }];
const lines = [{ type: "stdout" as const, text: "$ echo" }];

const cases: ReadonlyArray<readonly [string, React.ReactElement]> = [
  ["Button", <RCS.Button>x</RCS.Button>],
  ["IconButton", <RCS.IconButton aria-label="x" icon={<span>★</span>} />],
  ["ButtonGroup", <RCS.ButtonGroup><RCS.Button>x</RCS.Button></RCS.ButtonGroup>],

  ["Input", <RCS.Input placeholder="x" />],
  ["NumberInput", <RCS.NumberInput />],
  ["PinInput", <RCS.PinInput length={4} />],
  ["Textarea", <RCS.Textarea />],

  ["Select", <RCS.Select options={opts} />],
  ["Combobox", <RCS.Combobox options={opts} />],

  ["Checkbox", <RCS.Checkbox label="label" />],
  ["Switch", <RCS.Switch />],
  ["Slider", <RCS.Slider />],
  ["RadioGroup", <RCS.RadioGroup name="g" options={opts} />],
  ["FormField", <RCS.FormField label="x"><RCS.Input /></RCS.FormField>],
  ["DatePicker", <RCS.DatePicker />],
  ["DateRangePicker", <RCS.DateRangePicker />],
  ["FileUpload", <RCS.FileUpload />],

  ["Card", <RCS.Card>x</RCS.Card>],
  ["Space", <RCS.Space>x</RCS.Space>],
  ["ScrollDiv", <RCS.ScrollDiv>x</RCS.ScrollDiv>],
  ["Divider", <RCS.Divider />],
  ["Grid", <RCS.Grid>x</RCS.Grid>],

  ["Tabs", <RCS.Tabs items={tabsItems} />],
  ["Menu", <RCS.Menu items={menuItems} />],
  ["Breadcrumb", <RCS.Breadcrumb items={breadcrumbItems} />],
  ["Pagination", <RCS.Pagination total={100} pageSize={10} current={1} />],
  ["Steps", <RCS.Steps items={stepsItems} current={0} />],

  ["Alert", <RCS.Alert severity="info">body</RCS.Alert>],
  ["Progress", <RCS.Progress value={50} />],
  ["Skeleton", <RCS.Skeleton />],
  ["Spin", <RCS.Spin />],
  ["Tooltip", <RCS.Tooltip content="t"><span>hover</span></RCS.Tooltip>],
  ["ToastRegion", <RCS.ToastRegion />],

  ["Table", <RCS.Table data={tableData} columns={tableColumns} rowKey="id" />],
  ["Stat", <RCS.Stat label="x" value={1} />],
  ["Badge", <RCS.Badge>x</RCS.Badge>],
  ["StatusDot", <RCS.StatusDot status="running" />],
  ["Avatar", <RCS.Avatar initials="X" />],
  ["Timeline", <RCS.Timeline items={timelineItems} />],

  ["Chat", <RCS.Chat messages={messages} />],
  ["CodeBlock", <RCS.CodeBlock code="const x = 1" />],
  ["Markdown", <RCS.Markdown source="# h" />],
  ["Terminal", <RCS.Terminal lines={lines} />],
  ["RichTextEditor", <RCS.RichTextEditor placeholder="…" />],

  ["PageHeader", <RCS.PageHeader title="x" />],
  ["AppShell", <RCS.AppShell><div /></RCS.AppShell>],
];

describe("smoke render", () => {
  for (const [name, element] of cases) {
    it(`${name} renders without throwing`, () => {
      const { container } = render(element);
      expect(container.firstChild).not.toBeNull();
    });
  }
});

describe("ThemeProvider", () => {
  it("renders children inside the provider", () => {
    const { getByText } = render(
      <RCS.ThemeProvider mode="dark"><span>themed</span></RCS.ThemeProvider>,
    );
    expect(getByText("themed").textContent).toBe("themed");
  });
});

describe("public API surface", () => {
  it("exposes the toast namespace", () => {
    expect(typeof RCS.toast.show).toBe("function");
  });
  it("exposes useTheme hook", () => {
    expect(typeof RCS.useTheme).toBe("function");
  });
  it("includes every expected runtime export", () => {
    const expected = [
      ...cases.map(([n]) => n),
      "ThemeProvider",
      "useTheme",
      "toast",
    ];
    for (const name of expected) {
      expect(RCS).toHaveProperty(name);
    }
  });
});
