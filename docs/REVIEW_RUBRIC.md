# Mandatory human review before public release

This candidate is NOT APPROVED. Review CI screenshots at 1440, 820, 390 and 320 pixels. Include light/dark desktop/mobile and first-viewport/full-page compositions.

Check:
1. Exact approved typography and color language, overall refinement, meaningful visual variety.
2. Legible hierarchy, practical navigation, adequate whitespace, 320px overflow and clipped elements.
3. Real and accurate project titles, descriptions, links, maturity labels and limitations.
4. Working search, filters, mobile menu, theme, keyboard navigation and focus.
5. Schematic graphics honestly labeled; no invented statistics or fake tool outputs.
6. Reduced motion, contrast, accessible labels. Perform broader accessibility checks before claiming WCAG compliance.
7. Actual hosted performance and link behavior before launch; screenshots cannot establish Core Web Vitals.

Record reviewer, reviewed PR, date and accepted screenshots in a later explicit approval step. The source PR and workflow cannot publish itself. Any materially changed visual must be re-reviewed.

## Editorial sign-off required (separate from the visual review)
Inspect the visible homepage, generated cards, project names, search labels, page title, About section and footer. Compare each project summary and maturity label against its README and `docs/CLAIM_AUDIT.md`. Do not infer professional deployment from a sample, framework from a tool, or runtime execution from a browser-only demonstration.

Test each sentence for specificity: would it fit nearly any AI consultancy? If so, rewrite it around an identifiable artifact, action or limitation. Reject invented performance metrics, clients and recognitions; promotional superlatives; vague noun clusters; and repeating the same abstract promise in successive headings.

The content release gate must be explicitly signed off by the human reviewer with `editorial_approved: true`. Passing a regex, automated rewrite or repository-excerpt comparison does **not** substitute for editorial judgment. The approval remains false until the reviewer actually accepts the content.

## Portfolio depth checks
Inspect the five generated project pages in desktop and mobile layouts. Verify each code sample against the linked README, distinguish working executables from static explainers, and confirm the source references and limitations. Verify each of the three selected Medium article destinations is a published work by the portfolio owner. Do not mistake the project notes for client engagements, tested production outcomes or case studies reporting real business impact.
