# Design contract: Technical Editorial v0.4

This is the approved **direction**, not a declaration that this implementation is approved for release.

Light canvas #F5F4F0; dark graphite #111722; indigo #5F69D9; lavender #8A98FA (dark mode); teal #6BBEAC. Headings are sans-serif DM Sans, not decorative italic serif. DM Mono is reserved for small technical captions. Preserve editorial whitespace, precise hierarchy, and accessible contrast.

Use meaningful project-specific system sketches. Never invent measured statistics, testimonials, customers, production readiness, or certifications. A browser-only demo must not be presented as a working runtime. Limit the homepage to curated featured work and keep private repo data out of public assets.

Visually review desktop and mobile, first viewport and full page, both themes, before approving any source, diagram, design-token or content change. Passing literal color-token checks cannot substitute for assessing the composition and illustrations.

No "AI slop": avoid generic glow blobs, ornamental dashboards, fake numerical performance graphs, repeated template panels, vague marketing superlatives, and unverified descriptions.

## Launch-readability amendments (no change to approved palette)
- CSS must render the actual off-white / graphite / indigo / lavender / teal tokens, verified through Chromium computed styles, including after theme changes.
- DM Sans and DM Mono remain the preferred typefaces. If external font services are inaccessible, fall back to locally available Segoe UI / Arial / monospace without hiding content or navigation.
- Small diagram labels on mobile must remain legible; font declarations must not use undefined design tokens.
- Keep the original editorial composition and project-specific schematic meaning. Do not replace them with decorative SaaS art or fabricated performance graphs.
- The source of the published page is only the deterministic `dist/` build from `site/template.html`; do not maintain a second root HTML copy.

## Portfolio breadth / preservation of the initial intent
The website represents technical program management, engineering quality, systems methods, operations, working utilities and AI evaluation/governance. It is not exclusively an AI research, safety or release-readiness site. Featured work spans the four distinct areas of process improvement, program management, automotive evaluation and release decision tools. The four authored technical drawings retain their role as meaningful representations, not performance evidence.

Project-detail pages are additions *inside* the approved design system. Their content must remain traceable to public repositories, with real artifacts, correctly scoped commands and explicit limits. The homepage must not imply these independent projects constitute one integrated product.
