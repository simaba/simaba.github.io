#!/usr/bin/env python3
"""Fail-closed production approval: authored content and screenshot baselines must match review."""
from __future__ import annotations
from datetime import datetime,timezone
import hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/"tests/visual-baseline"
REQUIRED=("desktop.png","desktop-dark.png","tablet.png","mobile.png","mobile-dark.png","small-mobile.png")
DESIGN_FILES=("site/template.html","assets/styles.css","assets/app.js","assets/favicon.svg","scripts/build.py","data/projects.json","docs/DESIGN_CONTRACT.md","docs/EDITORIAL_STANDARD.md","docs/CLAIM_AUDIT.md","site/project.html","assets/detail.js","assets/labs.css","assets/project-labs.js","assets/extended-labs.js","data/studies.json",".github/workflows/review.yml","scripts/launch_gate.py","scripts/compare_visual.py","scripts/verify.py","scripts/sync.py","scripts/browser_review.py","tests/test_pipeline.py")
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def design_digest():
    h=hashlib.sha256()
    for name in DESIGN_FILES:
        file=ROOT/name
        if not file.is_file(): raise RuntimeError("Missing approved source: "+name)
        h.update(name.encode()+b"\0"+file.read_bytes()+b"\0")
    return h.hexdigest()
def visual_hashes():
    return {name:sha(BASE/name) for name in REQUIRED}
def check():
    state=json.loads((ROOT/"data/launch-approval.json").read_text(encoding="utf-8"))
    if state.get("schema_version")!=2 or state.get("approved") is not True: raise RuntimeError("Publication blocked: no human design approval")
    if state.get("editorial_approved") is not True: raise RuntimeError("Publication blocked: missing human editorial approval")
    reviewer=state.get("reviewer")
    if not isinstance(reviewer,str) or len(reviewer.strip())<3: raise RuntimeError("Publication blocked: missing reviewer")
    evidence=state.get("evidence")
    if not isinstance(evidence,str) or not evidence.startswith("https://github.com/simaba/simaba.github.io/pull/"): raise RuntimeError("Publication blocked: missing PR evidence")
    try:
        when=datetime.fromisoformat(state["approved_at"].replace("Z","+00:00"))
        assert when.tzinfo and when<=datetime.now(timezone.utc)
    except (KeyError,TypeError,AttributeError,ValueError,AssertionError) as e:
        raise RuntimeError("Publication blocked: invalid reviewed date") from e
    if state.get("design_sha256")!=design_digest(): raise RuntimeError("Publication blocked: authored design or content changed after approval")
    hashes=state.get("baseline_sha256")
    if not isinstance(hashes,dict) or set(hashes)!=set(REQUIRED): raise RuntimeError("Publication blocked: missing six baseline hashes")
    for name in REQUIRED:
        file=BASE/name
        if not file.is_file() or file.stat().st_size<1000 or sha(file)!=hashes[name]:
            raise RuntimeError("Publication blocked: unapproved screenshot baseline "+name)
    print("PASS: reviewed design and six screenshot hashes bound to current source")
if __name__=="__main__": check()
