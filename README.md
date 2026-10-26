# Sima Bagheri | Technical Editorial portfolio

**STAGING / DRAFT. Design candidate v0.4, NOT approved for publication.**

This branch contains the functioning v0.4 website, split into readable HTML, CSS, and JavaScript source, with a narrow quality-review workflow. It preserves the selected off-white/graphite/indigo/lavender/teal design direction and twelve curated public projects.

Run local static checks with:
    python3 scripts/verify.py
    node --check assets/app.js

Browser QA requires Python Playwright and Chromium; execute:
    python3 scripts/browser_review.py

GitHub CI generates twelve screenshots at desktop/tablet/mobile dimensions, checks search, filters, navigation and theme switching, and uploads short-lived visual evidence. See docs/DESIGN_CONTRACT.md and docs/REVIEW_RUBRIC.md.

**Deployment is deliberately absent** until hosted CI, visual approval and proper release gates are complete. Do not select a Pages publishing source or merge this draft PR yet.

**Scope:** The visual design and public catalog are represented in this repository. The larger original v0.4 metadata generator, repository sync, source-layout template and baseline/publish pipeline are not yet migrated here. The portfolio does not currently claim live GitHub statistics or automatic metadata freshness. The existing simaba/simaba profile README remains untouched.
