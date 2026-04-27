import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Table } from "../../src/components/data-display";
import type { TableColumn } from "../../src/components.d";

interface Row { id: string; region: string; cpu: number }

const data: readonly Row[] = [
  { id: "svc_001", region: "us-east-1", cpu: 42 },
  { id: "svc_002", region: "eu-central-1", cpu: 73 },
];

const columns: readonly TableColumn<Row>[] = [
  { key: "id", title: "ID", dataKey: "id" },
  { key: "region", title: "Region", dataKey: "region" },
  { key: "cpu", title: "CPU", dataKey: "cpu", render: (v) => `${v}%` },
];

describe("Table", () => {
  it("renders one row per data item", () => {
    render(<Table<Row> columns={columns} data={data} rowKey="id" />);
    expect(screen.getByText("svc_001")).toBeInTheDocument();
    expect(screen.getByText("svc_002")).toBeInTheDocument();
  });

  it("renders column headers", () => {
    render(<Table<Row> columns={columns} data={data} rowKey="id" />);
    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("Region")).toBeInTheDocument();
    expect(screen.getByText("CPU")).toBeInTheDocument();
  });

  it("invokes per-column render function", () => {
    render(<Table<Row> columns={columns} data={data} rowKey="id" />);
    expect(screen.getByText("42%")).toBeInTheDocument();
    expect(screen.getByText("73%")).toBeInTheDocument();
  });

  it("supports a function rowKey", () => {
    render(
      <Table<Row>
        columns={columns}
        data={data}
        rowKey={(r) => `row-${r.id}`}
      />,
    );
    expect(screen.getByText("svc_001")).toBeInTheDocument();
  });

  it("renders without rows when data is empty", () => {
    const { container } = render(<Table<Row> columns={columns} data={[]} rowKey="id" />);
    // Body should have no data rows
    expect(container.querySelectorAll("tbody tr").length).toBeLessThanOrEqual(1);
    // (a single 'empty state' row is acceptable; no svc_001 anywhere)
    expect(screen.queryByText("svc_001")).not.toBeInTheDocument();
  });

  it("handles a large dataset without crashing", () => {
    const big: Row[] = Array.from({ length: 500 }, (_, i) => ({
      id: `svc_${i.toString().padStart(4, "0")}`,
      region: "us-east-1",
      cpu: i % 100,
    }));
    const { container } = render(<Table<Row> columns={columns} data={big} rowKey="id" />);
    // Expect at least 500 body rows (no virtualization in this kit)
    expect(container.querySelectorAll("tbody tr").length).toBeGreaterThanOrEqual(500);
  });
});
