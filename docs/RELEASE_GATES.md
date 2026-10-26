# Release gates and anti-drift controls

## Current state
**Design approval: NOT GIVEN. Deployment: BLOCKED.** The `data/launch-approval.json` record is deliberately `approved: false`.

## Source and trust boundaries
1. Public projects are manually allowlisted in `data/projects.json`; a new public repo is **never auto-featured**. Private repositories are excluded.
2. Metadata retrieval only calls `/repos/simaba/<allowlisted>` and refuses mismatched owner, nonpublic results, redirects or partial sync. A failed trusted-main sync fails the build; previous Pages deployment remains unchanged.
3. Deterministic HTML build escapes all project text, emits static resources and is smoke-tested in a browser at 1440/820/390/320 pixels.
4. Automated tests guard design tokens, structure, privacy and interaction. First-fold/full-page light and dark screenshots are retained briefly for manual review.
5. After first explicit human design review, six full-page baseline screenshots are committed. Visual changes above 3% significant pixel fraction or geometry changes block CI. Human reviewers still evaluate visual quality.
6. Approval record binds reviewer, reviewed PR, date, SHA-256 of authored design files, and exact screenshot baselines. Changed authored content or design invalidates approval and prevents deployment.
7. Publish job checks approval independently and downloads only the successfully tested artifact from the same workflow run. Publication never rebuilds the site or fetches fresh metadata.
8. Changes to workflow/gates themselves need human PR review and protected-branch settings outside repository code. A repository administrator can bypass editable CI scripts if branch governance isn't configured.
9. No visual-only AI score is treated as proof of aesthetic quality. Manual review checks typography, information hierarchy, claims, illustration semantics, visual fidelity, mobile rendering and accessibility.

## Human approval
Review the screenshot evidence at 100% zoom on desktop and mobile. Verify actual GitHub project capabilities and limitations, no invented metrics, working navigation/links and strong editorial design. Record a clear acceptance/rejection against `docs/DESIGN_CONTRACT.md`. Only after approval, capture stable baseline screenshots in `tests/visual-baseline/` and compute file hashes and authored source digest via `scripts/launch_gate.py` helpers; record those hashes in `data/launch-approval.json`.

The approval record is a provenance check, **not a cryptographic reviewer signature**. Enforce required reviews and status checks in GitHub settings; no deployment is authorized by merely editing an approval JSON.

## Known validation limits
No automatic CI can certify that design is beautiful, WCAG-conformant or free of invented claims. The currently pinned hosted browser suite checks basic layout, keyboard focus, search/filter/navigation and JS runtime. Professional human inspection remains required.
