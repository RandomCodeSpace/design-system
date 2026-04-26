# Docs UI Kit — RandomCodeSpace

Documentation site: three-column layout with sidebar nav, article body, and on-page TOC.

Built with React 18 + Babel inline. Theme tokens from `colors_and_type.css` in the project root. Voice and visual rules in [`SKILL.md`](../../SKILL.md).

## Files

| File | What it is |
|------|------------|
| `index.html` | Assembled docs page — sidebar + article + TOC, sticky header |
| `DocsSidebar.jsx` | Three-level nav tree, current-page highlight |
| `Article.jsx` | Article body — headings, code blocks, callouts, inline links |
| `TOC.jsx` | Right-side "On this page" with scroll-spy |

## Brand alignment

- Body text is Inter at 16/26 (1.625 line-height) for long reads.
- Code blocks use JetBrains Mono with the syntax tokens from `colors_and_type.css` (no rainbow themes).
- Callouts (info / warning / danger) follow the same semantic palette as feedback components.
- Headings use a 4-step scale (`h1` 32px → `h4` 16px); h1 only appears once per page.
