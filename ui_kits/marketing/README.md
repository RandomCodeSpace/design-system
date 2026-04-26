# Marketing UI Kit — RandomCodeSpace

Components for the public marketing surface: landing page with hero, features, CLI showcase, an open-source statement, and footer.

Built with React 18 + Babel inline (no build step). Theme tokens come from `colors_and_type.css` in the project root. Voice and visual rules in [`SKILL.md`](../../SKILL.md) — declarative, technical, sentence-case, monochrome with Signal Red accents.

## Files

| File | What it is |
|------|------------|
| `index.html` | Assembled landing page — theme toggle, smooth scroll, hover states |
| `Nav.jsx` | Top navigation, 56px, fixed with blur-on-scroll |
| `Hero.jsx` | Declarative hero with terminal install block |
| `FeatureGrid.jsx` | 3×2 feature grid, Lucide icons at 1.5px stroke |
| `CLIShowcase.jsx` | Side-by-side CLI + explanation pairing |
| `Pricing.jsx` | "Free & open" statement — no tiers, MIT affirmation |
| `Footer.jsx` | Minimal footer — sitemap + legal |

## Loading

`index.html` already wires React 18, ReactDOM, and Babel standalone (pinned versions with SRI). To use a single component standalone, copy the JSX file plus the relevant section from `index.html`.

## Brand alignment

- Surface stays neutral (Cod Gray / White). Signal Red is reserved for primary CTA + active state.
- Hairline borders (1px), 4px radius, no decorative shadows.
- Headings use Inter with tight negative letterspacing; CLI blocks use JetBrains Mono.
- Motion is fast (140–220ms, out-quart). No stagger-for-the-sake-of-it.
