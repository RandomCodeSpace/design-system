/**
 * Internal utilities — class-name composition, no-op helpers.
 * Keep tiny; this is shipped to consumers.
 */

export function cx(...parts: ReadonlyArray<string | false | null | undefined>): string {
  let out = "";
  for (const p of parts) {
    if (!p) continue;
    out += out ? " " + p : p;
  }
  return out;
}

export function noop(): void { /* intentionally empty */ }

let idCounter = 0;
export function uid(prefix = "rcs"): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}
