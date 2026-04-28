/**
 * Renderer detection + engine abstraction for the charts module.
 *
 * Charts that handle large datasets accept an `engine` prop:
 *
 *   "auto"   → pick best available: webgpu > webgl2 > canvas2d
 *   "canvas" → CPU-bound canvas2d path (always available, no deps)
 *   "webgl"  → WebGL2 via deck.gl/luma.gl — instanced rendering, 1M+ primitives
 *   "webgpu" → WebGPU via deck.gl/luma.gl — modern API, lowest CPU overhead
 *
 * The WebGL/WebGPU paths require the optional peer dependency:
 *   pnpm add @deck.gl/core @deck.gl/layers @luma.gl/core
 */

export type RenderEngine = "auto" | "canvas" | "webgl" | "webgpu";
export type ResolvedEngine = "canvas" | "webgl" | "webgpu";

/** Cached capability probe — runs once per session. */
let cachedCaps: { webgl2: boolean; webgpu: boolean } | null = null;

export interface RendererCapabilities {
  readonly webgl2: boolean;
  readonly webgpu: boolean;
  readonly devicePixelRatio: number;
  readonly maxTextureSize: number;
}

/** Synchronous capability check — WebGPU result is async-resolved separately. */
export function detectCapabilities(): RendererCapabilities {
  if (typeof window === "undefined") {
    return { webgl2: false, webgpu: false, devicePixelRatio: 1, maxTextureSize: 0 };
  }
  if (cachedCaps) {
    return {
      ...cachedCaps,
      devicePixelRatio: window.devicePixelRatio || 1,
      maxTextureSize: 0,
    };
  }

  let webgl2 = false;
  let maxTextureSize = 0;
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2");
    if (gl) {
      webgl2 = true;
      maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
    }
  } catch { /* no webgl2 */ }

  // WebGPU is async-detected; the sync probe just checks for the API surface
  const webgpu = "gpu" in navigator && typeof (navigator as Navigator & { gpu?: unknown }).gpu === "object";

  cachedCaps = { webgl2, webgpu };
  return { webgl2, webgpu, devicePixelRatio: window.devicePixelRatio || 1, maxTextureSize };
}

/** Async confirm WebGPU is actually available (requestAdapter can fail). */
export async function confirmWebGPU(): Promise<boolean> {
  if (typeof navigator === "undefined") return false;
  const gpu = (navigator as Navigator & { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu;
  if (!gpu) return false;
  try {
    const adapter = await gpu.requestAdapter();
    return adapter !== null;
  } catch {
    return false;
  }
}

/**
 * Resolve "auto" → an actual engine, preferring WebGPU > WebGL2 > Canvas2D.
 * Datasets above `largeThreshold` items skip canvas (fall through to WebGL).
 */
export function resolveEngine(requested: RenderEngine, dataSize: number, largeThreshold = 50_000): ResolvedEngine {
  const caps = detectCapabilities();

  if (requested === "canvas") return "canvas";
  if (requested === "webgl") return caps.webgl2 ? "webgl" : "canvas";
  if (requested === "webgpu") return caps.webgpu ? "webgpu" : caps.webgl2 ? "webgl" : "canvas";

  // auto:
  if (caps.webgpu && dataSize > largeThreshold) return "webgpu";
  if (caps.webgl2 && dataSize > largeThreshold) return "webgl";
  return "canvas";
}

/** Lazy-load deck.gl + luma.gl. Returns null if not installed. */
type DeckCore = unknown;
type DeckLayer = unknown;
let deckCache: { Deck: DeckCore; SolidPolygonLayer: DeckLayer; ScatterplotLayer: DeckLayer; LineLayer: DeckLayer; ArcLayer: DeckLayer; PolygonLayer: DeckLayer } | null = null;

export async function loadDeck(): Promise<typeof deckCache> {
  if (deckCache) return deckCache;
  try {
    // @ts-expect-error — optional peer deps
    const core = await import("@deck.gl/core");
    // @ts-expect-error — optional peer deps
    const layers = await import("@deck.gl/layers");
    deckCache = {
      Deck: core.Deck,
      SolidPolygonLayer: layers.SolidPolygonLayer,
      ScatterplotLayer: layers.ScatterplotLayer,
      LineLayer: layers.LineLayer,
      ArcLayer: layers.ArcLayer,
      PolygonLayer: layers.PolygonLayer,
    };
    return deckCache;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[@ossrandom/design-system] WebGL renderer requested but @deck.gl/core not installed. Falling back to canvas. Run: pnpm add @deck.gl/core @deck.gl/layers", err);
    return null;
  }
}

/** Convert a hex/rgb color to deck.gl's [r, g, b, a] 0-255 array. */
export function colorToRGBA(input: string, alpha = 255): [number, number, number, number] {
  if (!input) return [0, 0, 0, alpha];
  if (input.startsWith("rgb")) {
    const m = /rgba?\(([^)]+)\)/.exec(input);
    if (!m) return [0, 0, 0, alpha];
    const parts = m[1].split(",").map((s) => parseFloat(s.trim()));
    const [r = 0, g = 0, b = 0, a = 1] = parts;
    return [r, g, b, Math.round(a * 255)];
  }
  const hex = input.replace("#", "");
  if (hex.length === 3) {
    return [
      parseInt(hex[0] + hex[0], 16),
      parseInt(hex[1] + hex[1], 16),
      parseInt(hex[2] + hex[2], 16),
      alpha,
    ];
  }
  if (hex.length >= 6) {
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
      hex.length === 8 ? parseInt(hex.slice(6, 8), 16) : alpha,
    ];
  }
  return [0, 0, 0, alpha];
}
