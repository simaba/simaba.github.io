# Sima Bagheri | Technical Editorial portfolio

**Draft PR: not approved for publishing.** This branch contains the v0.4 visual candidate and a first implementation of its read-only public metadata and automated build architecture.

## Content architecture
- `data/projects.json`: human-curated public project allowlist, names, descriptions, maturity, categories, selected projects and visuals.
- `data/public-metadata.json`: last checked-in minimal public snapshot (seeded with an allowlisted, validated public-only snapshot).
- `scripts/sync.py`: GitHub API refresh; only explicitly curated public repositories, ownership/visibility checks, atomic writes; on failure, no deployment.
- `site/template.html`, `assets/*`, `scripts/build.py`: reproducible static HTML/CSS/JS site, no visitor-side GitHub API key or service.
- `dist/`: build output, ignored by Git; source content remains in `site/` and `data/`.

## Local verification
```bash
python3 scripts/verify.py
python3 -m unittest discover -s tests -v
node --check assets/app.js
# Requires Playwright + Chromium and Pillow:
python3 scripts/browser_review.py
python3 scripts/compare_visual.py
# Expected to fail until actual human design approval:
python3 scripts/launch_gate.py
```

The CI verification job runs on PRs without write credentials. On trusted main only, metadata is refreshed on pushes and manually dispatched runs. No scheduled jobs. If the GitHub metadata refresh fails, CI fails without publishing changes; the currently published site is retained. Metadata refreshes do not commit fetched data back to `main` and do not retain a cross-run cache.

Five authored project pages are generated at `dist/projects/<repository>/index.html` from source-backed `data/studies.json` and `site/project.html`. The selected essays are verified external links; no article content is copied into this repository. Case pages reuse the approved visual tokens and include specific examples, limitations and repository source links.

The publish job is *conditionally defined* for trusted main; it requires successful browser review, six screenshot baselines and a human-signed-off design digest before uploading the **same tested artifact** to GitHub Pages. All approval fields remain unset. Do not merge until design review and branch-protection settings are complete.

See `docs/DESIGN_CONTRACT.md` and `docs/RELEASE_GATES.md`. The reviewed project is independent of employment and does not certify compliance, operational readiness or measured AI performance.

## Current visual/editorial review
The original Technical Editorial palette and typography remain unchanged. Featured work now represents process improvement, program management, automotive evaluation and release governance, rather than suggesting the whole portfolio is an AI evaluation product. Five source-backed study pages and three verified Medium article links have been added; this is a draft for final visual and editorial acceptance, not proof of production operation or customer outcomes.
