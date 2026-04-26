/**
 * RandomCodeSpace Design System — Token Types
 * ───────────────────────────────────────────
 * Strongly-typed design tokens. Import these from any component file
 * to constrain props to valid token values at compile time.
 */

// ── Color ──────────────────────────────────────────────────────────────
export type BrandColor =
  | "signal-red"      // #E60000 — primary action, live state, errors
  | "signal-red-700"  // #B30000
  | "signal-red-900"  // #9E0000
  | "cod-gray"        // #1C1C1C — primary text, ink
  | "cod-gray-700"    // #3D3D3D
  | "cod-gray-500"    // #5A5A5A — secondary text
  | "cod-gray-300"    // #A6A6A6 — tertiary, disabled
  | "cod-gray-100"    // #F5F5F5 — surface
  | "cod-gray-050"    // #FAFAFA
  | "white";

export type SemanticColor =
  | "success"   // green-ish via signal-red? we use mono — runtime cod-gray w/ filled dot
  | "warning"   // #D98E2B
  | "danger"    // signal-red
  | "info"      // cod-gray
  | "neutral";

export type ThemeMode = "light" | "dark";

// ── Spacing / sizing ───────────────────────────────────────────────────
export type SpaceSize = "xs" | "sm" | "md" | "lg" | "xl" | number;
//                       4     8     12    16    24

export type Radius = "none" | "sm" | "md" | "lg" | "pill" | "circle" | number;
//                    0       3     4     8     9999    50%

export type Shadow = "none" | "sm" | "md" | "lg" | "overlay";

// ── Typography ─────────────────────────────────────────────────────────
export type FontFamily = "sans" | "mono";       // Inter | JetBrains Mono
export type FontWeight = 400 | 500 | 600 | 700;
export type TypeScale =
  | "display-xl" | "display-lg" | "display-md"
  | "h1" | "h2" | "h3" | "h4"
  | "body-lg" | "body-md" | "body-sm"
  | "caption" | "overline" | "code";

// ── Component sizing ───────────────────────────────────────────────────
export type Size = "xs" | "sm" | "md" | "lg";
export type Density = "comfortable" | "default" | "compact";

// ── Layout primitives ──────────────────────────────────────────────────
export type Direction = "horizontal" | "vertical";
export type Axis = "x" | "y" | "both";
export type Align = "start" | "center" | "end" | "baseline" | "stretch";
export type Justify = "start" | "center" | "end" | "between" | "around" | "evenly";
