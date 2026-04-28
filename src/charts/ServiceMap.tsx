/**
 * ServiceMap — node-link graph for service topologies
 * ────────────────────────────────────────────────────
 * Two rendering paths:
 *
 *  - "canvas" — Cytoscape.js (canvas-based). Built-in interactivity,
 *               cose-bilkent layout. Best for <500 nodes.
 *  - "webgl"  — deck.gl ScatterplotLayer + ArcLayer. Instanced, ideal
 *               for 5k+ nodes / 50k+ edges. Layout is precomputed
 *               (d3-force or supplied positions); deck.gl just renders.
 *  - "webgpu" — Same deck.gl pipeline with the WebGPU adapter for
 *               modern hardware.
 *  - "auto"   — Resolves to webgpu > webgl > canvas. For 200-service
 *               maps the default lands on WebGL where supported.
 *
 * Peer deps:
 *   pnpm add cytoscape cytoscape-cose-bilkent              # canvas path
 *   pnpm add @deck.gl/core @deck.gl/layers d3-force        # webgl path
 */
import * as React from "react";
import { cx } from "../internal/cx";
import { readChartTheme, onThemeChange, type ChartTheme } from "./theme";
import { resolveEngine, loadDeck, colorToRGBA, type ResolvedEngine } from "./renderer";
import type { ServiceMapProps, ServiceNode, ServiceEdge } from "../components";

type CytoElement = {
  id: () => string;
  data: (key?: string) => unknown;
  addClass: (cls: string) => void;
  removeClass: (cls: string) => void;
  connectedEdges: () => CytoCollection;
  connectedNodes: () => CytoCollection;
  isNode?: () => boolean;
  isEdge?: () => boolean;
};
type CytoCollection = {
  forEach: (cb: (el: CytoElement) => void) => void;
  union: (other: CytoCollection) => CytoCollection;
  addClass: (cls: string) => void;
  removeClass: (cls: string) => void;
};
type CytoInstance = {
  destroy: () => void;
  on: (ev: string, sel: string, cb: (e: { target: CytoElement }) => void) => void;
  elements: (sel?: string) => CytoCollection;
  $: (sel: string) => CytoCollection;
  container: () => HTMLElement | null;
};
type CytoCtor = (opts: unknown) => CytoInstance;
let cytoCache: { ctor: CytoCtor } | null = null;

async function loadCyto(): Promise<CytoCtor | null> {
  if (cytoCache) return cytoCache.ctor;
  try {
    // @ts-expect-error — peer dep
    const mod = await import("cytoscape");
    const cytoscape = (mod.default ?? mod) as CytoCtor & { use: (ext: unknown) => void };
    try {
      // @ts-expect-error — optional layout
      const cose = await import("cytoscape-cose-bilkent");
      cytoscape.use(cose.default ?? cose);
    } catch { /* fallback layout */ }
    cytoCache = { ctor: cytoscape };
    return cytoscape;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[@ossrandom/design-system] cytoscape not installed:", err);
    return null;
  }
}

interface PositionedNode extends ServiceNode {
  readonly x: number;
  readonly y: number;
  readonly degree: number;
}

/**
 * Compute degree (in + out edge count) per node and map it to a pixel radius.
 * Square-root scaling so a 100-edge hub doesn't dwarf a 4-edge leaf into invisibility.
 * Range: 3px (isolated) → 14px (densest hub).
 */
function degreeRadius(degree: number, maxDegree: number): number {
  const MIN = 3;
  const MAX = 14;
  if (maxDegree <= 0) return MIN;
  const t = Math.sqrt(degree) / Math.sqrt(maxDegree);
  return MIN + (MAX - MIN) * t;
}

function computeDegrees(nodes: readonly ServiceNode[], edges: readonly ServiceEdge[]): { degrees: Map<string, number>; max: number } {
  const degrees = new Map<string, number>();
  for (const n of nodes) degrees.set(n.id, 0);
  for (const e of edges) {
    degrees.set(e.source, (degrees.get(e.source) ?? 0) + 1);
    degrees.set(e.target, (degrees.get(e.target) ?? 0) + 1);
  }
  let max = 0;
  for (const d of degrees.values()) if (d > max) max = d;
  return { degrees, max };
}

/** Compute force-directed layout for the WebGL path. */
async function computeLayout(nodes: readonly ServiceNode[], edges: readonly ServiceEdge[], width: number, height: number): Promise<PositionedNode[]> {
  const { degrees } = computeDegrees(nodes, edges);
  // If positions are pre-supplied on the node, trust them
  if (nodes.every((n) => n.x !== undefined && n.y !== undefined)) {
    return nodes.map((n) => ({ ...n, x: n.x as number, y: n.y as number, degree: degrees.get(n.id) ?? 0 }));
  }
  try {
    // @ts-expect-error — peer dep
    const d3force = await import("d3-force");
    type SimNode = ServiceNode & { x: number; y: number; vx?: number; vy?: number; degree: number };
    const simNodes: SimNode[] = nodes.map((n) => ({ ...n, x: width / 2 + (Math.random() - 0.5) * 100, y: height / 2 + (Math.random() - 0.5) * 100, degree: degrees.get(n.id) ?? 0 }));
    const sim = d3force.forceSimulation(simNodes)
      .force("link", d3force.forceLink(edges.map((e) => ({ source: e.source, target: e.target }))).id((d: SimNode) => d.id).distance(60))
      .force("charge", d3force.forceManyBody().strength(-300))
      .force("center", d3force.forceCenter(width / 2, height / 2))
      .force("collide", d3force.forceCollide(14))
      .stop();
    // Run synchronously — 200 ticks is enough for reasonable layouts
    for (let i = 0; i < 200; i++) sim.tick();
    return simNodes;
  } catch {
    // Naive grid fallback
    const cols = Math.ceil(Math.sqrt(nodes.length));
    const cellW = width / cols;
    const cellH = height / Math.ceil(nodes.length / cols);
    return nodes.map((n, i) => ({ ...n, x: (i % cols) * cellW + cellW / 2, y: Math.floor(i / cols) * cellH + cellH / 2, degree: degrees.get(n.id) ?? 0 }));
  }
}

export function ServiceMap(props: ServiceMapProps): React.ReactElement {
  const {
    nodes, edges, height = 480,
    layout = "cose-bilkent",
    engine = "auto",
    onNodeClick, onEdgeClick,
    className, style, id,
  } = props;

  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const cyRef = React.useRef<CytoInstance | null>(null);
  const deckRef = React.useRef<{ destroy: () => void; setProps?: (p: unknown) => void } | null>(null);
  const [width, setWidth] = React.useState(0);
  const [resolved, setResolved] = React.useState<ResolvedEngine>("canvas");

  React.useEffect(() => {
    setResolved(resolveEngine(engine, nodes.length + edges.length, 500));
  }, [engine, nodes.length, edges.length]);

  React.useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const w = Math.floor(entries[0].contentRect.width);
      if (w > 0 && w !== width) setWidth(w);
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [width]);

  // ─── Canvas (cytoscape) path ──────────────────────────────────
  React.useEffect(() => {
    if (resolved !== "canvas" || !wrapRef.current) return;
    let cancelled = false;
    const target = wrapRef.current;

    loadCyto().then((cytoscape) => {
      if (!cytoscape || cancelled) {
        if (!cytoscape) target.innerHTML = `<div class="rcs-chart-fallback">Service map (canvas) requires cytoscape. Run: pnpm add cytoscape cytoscape-cose-bilkent</div>`;
        return;
      }
      const theme = readChartTheme();
      const { degrees, max: maxDegree } = computeDegrees(nodes, edges);
      const cy = cytoscape({
        container: target,
        elements: [
          ...nodes.map((n) => {
            const deg = degrees.get(n.id) ?? 0;
            const r = degreeRadius(deg, maxDegree);
            return { data: { id: n.id, label: n.label, status: n.status, kind: n.kind, degree: deg, diameter: Math.round(r * 2) } };
          }),
          ...edges.map((e) => ({ data: { id: `${e.source}->${e.target}`, source: e.source, target: e.target, label: e.label, status: e.status } })),
        ],
        style: cytoscapeStyle(theme),
        layout: { name: layout, animate: false, fit: true, padding: 24, nodeRepulsion: 6000, idealEdgeLength: 80 },
        wheelSensitivity: 0.2, minZoom: 0.2, maxZoom: 3,
      });
      if (onNodeClick) cy.on("tap", "node", (e) => onNodeClick(e.target.data() as ServiceNode));
      if (onEdgeClick) cy.on("tap", "edge", (e) => onEdgeClick(e.target.data() as { source: string; target: string }));

      // Hover / touch highlight — light the focused node + its incident edges + neighbors
      const focusOn = (el: CytoElement) => {
        const isNode = el.isNode?.() ?? true;
        cy.elements().addClass("rcs-dim");
        if (isNode) {
          const incident = el.connectedEdges();
          const neighbors = el.connectedNodes();
          neighbors.removeClass("rcs-dim");
          incident.removeClass("rcs-dim");
          (cy.$(`#${cssEscape(el.id())}`)).removeClass("rcs-dim");
          (cy.$(`#${cssEscape(el.id())}`)).addClass("rcs-focus");
          incident.addClass("rcs-focus-edge");
          neighbors.addClass("rcs-neighbor");
        } else {
          // edge
          const ends = el.connectedNodes();
          ends.removeClass("rcs-dim");
          ends.addClass("rcs-neighbor");
        }
      };
      const focusOff = () => {
        cy.elements().removeClass("rcs-dim rcs-focus rcs-focus-edge rcs-neighbor");
      };
      cy.on("mouseover", "node", (e) => focusOn(e.target));
      cy.on("mouseover", "edge", (e) => focusOn(e.target));
      cy.on("mouseout", "node", () => focusOff());
      cy.on("mouseout", "edge", () => focusOff());
      // touch — tap-and-hold also focuses; tap on background clears
      cy.on("tap", "node", (e) => focusOn(e.target));
      cy.on("tap", "edge", (e) => focusOn(e.target));
      // Tap on the background to clear (cytoscape: target is `cy` for empty taps).
      // We intentionally don't bind to a selector here.
      const ct = cy.container();
      if (ct) {
        ct.addEventListener("pointerleave", focusOff);
      }

      cyRef.current = cy;
    });

    return () => {
      cancelled = true;
      cyRef.current?.destroy();
      cyRef.current = null;
      target.innerHTML = "";
    };
  }, [resolved, nodes, edges, layout, onNodeClick, onEdgeClick]);

  // ─── WebGL/WebGPU (deck.gl) path ─────────────────────────────
  React.useEffect(() => {
    if (resolved === "canvas" || width === 0 || !wrapRef.current) return;
    let cancelled = false;
    const target = wrapRef.current;

    (async () => {
      const deck = await loadDeck();
      if (!deck || cancelled) { setResolved("canvas"); return; }
      const positioned = await computeLayout(nodes, edges, width, height);
      if (cancelled) return;
      const idIdx = new Map(positioned.map((n, i) => [n.id, i]));
      const theme = readChartTheme();
      const maxDegree = positioned.reduce((m, n) => Math.max(m, n.degree), 0);
      const adapter = resolved === "webgpu" ? "webgpu" : "webgl";

      const ScatterplotLayer = deck.ScatterplotLayer as unknown as new (opts: unknown) => unknown;
      const ArcLayer = deck.ArcLayer as unknown as new (opts: unknown) => unknown;

      // Adjacency for fast highlight lookup. Keyed by node id → set of neighbor ids
      // and set of incident edge keys ("a->b").
      const neighbors = new Map<string, Set<string>>();
      const incidentEdges = new Map<string, Set<string>>();
      for (const n of positioned) {
        neighbors.set(n.id, new Set());
        incidentEdges.set(n.id, new Set());
      }
      for (const e of edges) {
        const key = `${e.source}->${e.target}`;
        neighbors.get(e.source)?.add(e.target);
        neighbors.get(e.target)?.add(e.source);
        incidentEdges.get(e.source)?.add(key);
        incidentEdges.get(e.target)?.add(key);
      }

      // Mutable focus state. The deck instance reads via closures; we
      // rebuild layers and call setProps on every change.
      let focusId: string | null = null;

      const dimAlpha = 60;        // 0–255 alpha for non-focused elements
      const baseAlpha = 230;
      const focusAlpha = 255;

      const isInFocusSet = (nodeId: string): boolean => {
        if (!focusId) return true;
        if (nodeId === focusId) return true;
        return neighbors.get(focusId)?.has(nodeId) ?? false;
      };
      const isEdgeFocused = (e: ServiceEdge): boolean => {
        if (!focusId) return true;
        return e.source === focusId || e.target === focusId;
      };

      const fadeColor = (rgba: [number, number, number, number], alpha: number): [number, number, number, number] =>
        [rgba[0], rgba[1], rgba[2], alpha];

      const buildLayers = () => [
        new ArcLayer({
          id: "service-edges",
          data: edges.map((e) => ({
            ...e,
            sourcePos: positioned[idIdx.get(e.source) ?? 0],
            targetPos: positioned[idIdx.get(e.target) ?? 0],
          })),
          getSourcePosition: (d: { sourcePos: PositionedNode }) => [d.sourcePos.x, d.sourcePos.y, 0],
          getTargetPosition: (d: { targetPos: PositionedNode }) => [d.targetPos.x, d.targetPos.y, 0],
          getSourceColor: (d: ServiceEdge) => {
            const focused = isEdgeFocused(d);
            const base = colorToRGBA(focused && focusId
              ? theme.accent
              : d.status === "failing" ? theme.danger : theme.border2);
            return fadeColor(base, focused ? focusAlpha : dimAlpha);
          },
          getTargetColor: (d: ServiceEdge) => {
            const focused = isEdgeFocused(d);
            const base = colorToRGBA(focused && focusId
              ? theme.accent
              : d.status === "failing" ? theme.danger : theme.fg4);
            return fadeColor(base, focused ? focusAlpha : dimAlpha);
          },
          getWidth: (d: ServiceEdge) => {
            const focused = isEdgeFocused(d);
            if (focused && focusId) return 2;
            return d.status === "failing" ? 2 : 1;
          },
          getHeight: 0.3,
          pickable: !!onEdgeClick,
          updateTriggers: { getSourceColor: [focusId], getTargetColor: [focusId], getWidth: [focusId] },
        }),
        new ScatterplotLayer({
          id: "service-nodes",
          data: positioned,
          getPosition: (d: PositionedNode) => [d.x, d.y, 0],
          getFillColor: (d: PositionedNode) => {
            const inSet = isInFocusSet(d.id);
            const base = colorToRGBA(
              d.status === "failing" ? theme.danger
                : d.status === "degraded" ? theme.warning
                : d.status === "healthy" ? theme.success
                : theme.fg3,
            );
            return fadeColor(base, inSet ? baseAlpha : dimAlpha);
          },
          getLineColor: (d: PositionedNode) => {
            if (focusId === d.id) return colorToRGBA(theme.accent);
            return colorToRGBA(theme.bg1);
          },
          getRadius: (d: PositionedNode) => degreeRadius(d.degree, maxDegree),
          radiusUnits: "pixels",
          stroked: true,
          getLineWidth: (d: PositionedNode) => focusId === d.id ? 2 : 1,
          lineWidthUnits: "pixels",
          pickable: true,
          updateTriggers: { getFillColor: [focusId], getLineColor: [focusId], getLineWidth: [focusId] },
        }),
      ];

      const inst = new (deck.Deck as unknown as new (o: unknown) => { destroy: () => void; setProps: (p: unknown) => void })({
        parent: target,
        width, height,
        controller: true,
        deviceProps: { type: adapter },
        views: [{ "@@type": "OrthographicView", id: "v", flipY: true }],
        viewState: { target: [width / 2, height / 2, 0], zoom: 0 },
        layers: buildLayers(),
        onHover: ({ object, layer }: { object?: PositionedNode | ServiceEdge; layer?: { id: string } }) => {
          let next: string | null = null;
          if (object && layer?.id === "service-nodes") {
            next = (object as PositionedNode).id;
          } else if (object && layer?.id === "service-edges") {
            // Pick either endpoint — source first
            next = (object as ServiceEdge).source;
          }
          if (next !== focusId) {
            focusId = next;
            inst.setProps({ layers: buildLayers() });
          }
        },
        onClick: ({ object, layer }: { object?: PositionedNode | ServiceEdge; layer?: { id: string } }) => {
          if (!object || !layer) return;
          if (layer.id === "service-nodes" && onNodeClick) onNodeClick(object as ServiceNode);
          else if (layer.id === "service-edges" && onEdgeClick) onEdgeClick(object as { source: string; target: string });
        },
      });
      deckRef.current = inst;
    })().catch((err: unknown) => {
      // eslint-disable-next-line no-console
      console.warn("[@ossrandom/design-system] ServiceMap WebGL init failed; falling back to canvas:", err);
      setResolved("canvas");
    });

    return () => {
      cancelled = true;
      deckRef.current?.destroy();
      deckRef.current = null;
      target.innerHTML = "";
    };
  }, [resolved, width, height, nodes, edges, onNodeClick, onEdgeClick]);

  // Theme refresh
  React.useEffect(() => onThemeChange(() => {
    // Force a recreate by toggling resolved
    setResolved((r) => r);
  }), []);

  return (
    <div
      ref={wrapRef}
      id={id}
      className={cx("rcs-service-map", `rcs-service-map--${resolved}`, className)}
      style={{ position: "relative", width: "100%", height, ...style }}
      data-engine={resolved}
      role="img"
      aria-label={props["aria-label"] ?? `Service map with ${nodes.length} services`}
    >
      <div className="rcs-service-map-engine-badge" aria-hidden="true">{resolved}</div>
    </div>
  );
}

function cytoscapeStyle(theme: ChartTheme) {
  return [
    { selector: "node", style: {
      // Dot — diameter scales with degree (computed in element data)
      "shape": "ellipse",
      "width": "data(diameter)",
      "height": "data(diameter)",
      "background-color": theme.fg3,
      "border-color": theme.bg1,
      "border-width": 1,
      // Label sits BELOW the dot, light weight, no background pill
      "label": "data(label)",
      "color": theme.fg3,
      "font-family": theme.fontSans,
      "font-size": 11,
      "font-weight": 400,
      "text-valign": "bottom",
      "text-halign": "center",
      "text-margin-y": 4,
      "text-events": "no",
      "min-zoomed-font-size": 9,
      "z-index": 10,
      "transition-property": "background-color, border-color, border-width, color, opacity",
      "transition-duration": "120ms",
    } },
    { selector: "node[status = 'healthy']",  style: { "background-color": theme.success } },
    { selector: "node[status = 'degraded']", style: { "background-color": theme.warning } },
    { selector: "node[status = 'failing']",  style: { "background-color": theme.danger } },

    { selector: "edge", style: {
      "width": 1,
      "line-color": theme.border2,
      "target-arrow-color": theme.border2,
      "target-arrow-shape": "triangle",
      "arrow-scale": 0.9,
      "curve-style": "bezier",
      // Edge label — hidden by default, shown on focus
      "label": "data(label)",
      "color": theme.fg4,
      "font-family": theme.fontMono,
      "font-size": 9,
      "text-rotation": "autorotate",
      "text-margin-y": -4,
      "text-opacity": 0,                 // hidden until focused
      "text-events": "no",
      "z-index": 1,
      "transition-property": "line-color, width, target-arrow-color, opacity, text-opacity",
      "transition-duration": "120ms",
    } },
    { selector: "edge[status = 'failing']", style: { "line-color": theme.danger, "target-arrow-color": theme.danger, "width": 1.5 } },

    // ─── Highlight states ──────────────────────────────────────
    { selector: ".rcs-dim", style: { "opacity": 0.18 } },
    { selector: "node.rcs-focus", style: {
      "opacity": 1,
      "border-color": theme.accent,
      "border-width": 2,
      "color": theme.fg1,
      "font-weight": 500,
      "z-index": 30,
    } },
    { selector: "node.rcs-neighbor", style: {
      "opacity": 1,
      "color": theme.fg1,
      "z-index": 20,
    } },
    { selector: "edge.rcs-focus-edge", style: {
      "opacity": 1,
      "line-color": theme.accent,
      "target-arrow-color": theme.accent,
      "width": 2,
      "text-opacity": 1,
      "color": theme.fg1,
      "z-index": 25,
    } },
    { selector: "node:selected", style: { "border-color": theme.accent, "border-width": 2 } },
  ];
}

/** Tiny CSS.escape polyfill — Cytoscape selectors need IDs escaped if they contain dots/colons. */
function cssEscape(id: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") return CSS.escape(id);
  return id.replace(/[^a-zA-Z0-9_-]/g, (c) => `\\${c}`);
}
