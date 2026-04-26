/**
 * Bundle entry for the docs site live previews and the editable playground.
 *
 * Re-exports the entire public design-system surface PLUS React and
 * ReactDOM's createRoot so example code in the browser can be fully
 * self-contained against `window.RCS`. Built by esbuild as IIFE →
 * `window.RCS = { Button, Input, ..., React, createRoot }`.
 *
 * Used by:
 *   - scripts/build-docs.mjs                 (per-component live previews)
 *   - _site/docs/playground/index.html       (editable playground)
 */

import * as React from "react";
import { createRoot } from "react-dom/client";

export * from "../src/index";
export { React, createRoot };
