#!/usr/bin/env python3
"""Deterministic dependency-free HTML generator from editorial data and verified public metadata."""
from __future__ import annotations
import html
import json
import shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"dist"
def esc(x): return html.escape(str(x), quote=True)
def illustration(kind):
    if kind=="dmaic": return '<div class="steps"><span>DEFINE</span><span>MEASURE</span><span>ANALYZE</span><span>IMPROVE</span><span>CONTROL</span></div><div class="dash-rule"></div><div class="proof"><span>Supported</span><span>Inferred</span><span>Missing</span></div>'
    if kind=="gates": return '<div class="gate-board"><header><span>RELEASE DECISION</span><span>CONTROL REVIEW</span></header><div class="gate-row"><span>Declared evidence</span><b>REQUIRED</b></div><div class="gate-row"><span>Conditions &amp; exceptions</span><b>REVIEW</b></div><div class="gate-row"><span>Hard gate semantics</span><b>REQUIRED</b></div></div>'
    if kind=="evaluation": return '<div class="eval-board"><div class="eval-heading"><span>MEASUREMENT DESIGN</span><span>RUBRIC / SCHEMATIC</span></div><div class="eval-row"><span>Intent correctness</span><span class="eval-criterion">Observable rule</span></div><div class="eval-row"><span>Safety behavior</span><span class="eval-criterion">Hard gate</span></div><div class="eval-row"><span>Privacy behavior</span><span class="eval-criterion">Exposure checks</span></div><div class="eval-row"><span>Language quality</span><span class="eval-criterion">Evaluation rubric</span></div><div class="eval-note">DEFINE CRITERIA → TEST COVERAGE → REVIEW EVIDENCE</div></div>'
    if kind=="matrix":
        rows=[("Validity",[1,0,0,1]),("Coverage",[1,1,0,1]),("Decision",[0,1,1,1])]
        out='<div class="matrix-art">'+''.join('<span class="matrix-heading">'+esc(h)+'</span>' for h in ("","TASK","SAFETY","RELIABILITY","EVIDENCE"))
        for name, marks in rows:
            out+='<span class="matrix-name">'+esc(name)+'</span>'
            out+=''.join('<span class="'+("mark" if x else "blank")+'" aria-label="'+("Relationship" if x else "No relationship shown")+'"></span>' for x in marks)
        return out+'</div>'
    raise ValueError("Unknown featured visual "+str(kind))
def featured_card(p,i):
    name=esc(p["title"]);url=p.get("live") or "https://github.com/simaba/"+p["repo"]
    return ('<a class="feature '+esc(p["feature_layout"])+'" href="'+esc(url)+'" target="_blank" rel="noopener noreferrer" aria-label="Explore '+name+'">'
        '<div class="feature-topline"><span>'+f"{i:02d} / "+esc(p["category"].upper())+'</span><span>'+esc(p["status"].upper())+'</span></div>'
        '<div class="feature-visual art-'+esc(p["visual"])+'" role="img" aria-label="Schematic illustration for '+name+', not measured project output">'+illustration(p["visual"])+'</div>'
        '<div class="feature-bottom"><strong>'+name+'</strong><p>'+esc(p["description"])+'</p><div class="feature-meta"><span>'+esc(" · ".join(p["capabilities"][:2]))+'</span><span class="feature-arrow" aria-hidden="true">↗</span></div></div></a>')
def catalog_row(p,i,meta):
    searchable=" ".join(str(x) for x in [p["title"],p["repo"],p["description"],p["category"],*p["capabilities"]]).lower()
    stamped=(meta or {}).get("updated_at") or ""
    updated=(" · Updated "+esc(stamped[:7])) if len(stamped)>=7 and stamped[4]=="-" else ""
    return ('<a class="project-row" data-kind="'+esc(p["kind"])+'" data-search="'+esc(searchable)+'" href="https://github.com/simaba/'+esc(p["repo"])+'" target="_blank" rel="noopener noreferrer">'
        '<span class="project-num">'+f"{i:02d}"+'</span><span class="project-name">'+esc(p["title"])+'</span><span class="project-description">'+esc(p["description"])+'</span>'
        '<span class="project-type">'+esc(p["kind"].upper())+' / '+esc(p["status"])+updated+'</span><span class="project-arrow" aria-hidden="true">↗</span></a>')
def build():
    data=json.loads((ROOT/"data/projects.json").read_text("utf-8"))
    snap=json.loads((ROOT/"data/public-metadata.json").read_text("utf-8"))
    projects=data["projects"];meta=snap["repositories"];verified=snap.get("fetched_at")
    freshness="Public metadata refreshed "+verified[:10]+"." if verified else "Public activity data pending first verified refresh."
    tpl=(ROOT/"site/template.html").read_text("utf-8")
    mapping={"{{FEATURED}}":"\n".join(featured_card(p,i) for i,p in enumerate((x for x in projects if x["featured"]),1)),
        "{{CATALOG}}":"\n".join(catalog_row(p,i,meta.get(p["repo"])) for i,p in enumerate(projects,1)),
        "{{PROJECT_COUNT}}":str(len(projects)),"{{METADATA_NOTE}}":esc(freshness)}
    for marker,value in mapping.items():
        if marker not in tpl: raise RuntimeError("Missing template marker "+marker)
        tpl=tpl.replace(marker,value)
    if "{{" in tpl: raise RuntimeError("Unrendered token")
    if OUT.exists(): shutil.rmtree(OUT)
    OUT.mkdir()
    shutil.copytree(ROOT/"assets",OUT/"assets")
    (OUT/"index.html").write_text(tpl,encoding="utf-8")
    (OUT/".nojekyll").write_text("",encoding="utf-8")
    print(f"Built {len(projects)} curated entries, {sum(p['featured'] for p in projects)} featured")
if __name__=="__main__": build()
