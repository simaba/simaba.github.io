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
    if kind=="program":
        return '<div class="program-sequence"><div><small>01 / FRAME</small><strong>Charter</strong></div><div><small>02 / TRACK</small><strong>RAID</strong></div><div><small>03 / DECIDE</small><strong>Decision memo</strong></div></div><div class="program-caption">Evidence classes · owners · alternatives · follow-through</div>'
    if kind=="matrix":
        rows=[("Validity",[1,0,0,1]),("Coverage",[1,1,0,1]),("Decision",[0,1,1,1])]
        out='<div class="matrix-art">'+''.join('<span class="matrix-heading">'+esc(h)+'</span>' for h in ("","TASK","SAFETY","RELIABILITY","EVIDENCE"))
        for name, marks in rows:
            out+='<span class="matrix-name">'+esc(name)+'</span>'
            out+=''.join('<span class="'+("mark" if x else "blank")+'" aria-label="'+("Relationship" if x else "No relationship shown")+'"></span>' for x in marks)
        return out+'</div>'
    raise ValueError("Unknown featured visual "+str(kind))
def featured_card(p,i):
    name=esc(p["title"])
    url=("projects/"+p["repo"]+"/") if p.get("study") else (p.get("live") or "https://github.com/simaba/"+p["repo"])
    attrs="" if p.get("study") else ' target="_blank" rel="noopener noreferrer"'
    return ('<a class="feature '+esc(p["feature_layout"])+'" href="'+esc(url)+'"'+attrs+' aria-label="Explore '+name+' project details">'
        '<div class="feature-topline"><span>'+f"{i:02d} / "+esc(p["category"].upper())+'</span><span>'+esc(p["status"].upper())+'</span></div>'
        '<div class="feature-visual art-'+esc(p["visual"])+'" role="img" aria-label="Schematic illustration for '+name+', not measured project output">'+illustration(p["visual"])+'</div>'
        '<div class="feature-bottom"><strong>'+name+'</strong><p>'+esc(p["description"])+'</p><div class="feature-meta"><span>'+esc(" · ".join(p["capabilities"][:2]))+'</span><span class="feature-arrow" aria-hidden="true">↗</span></div></div></a>')
def catalog_row(p,i,meta):
    searchable=" ".join(str(x) for x in [p["title"],p["repo"],p["description"],p["category"],*p["capabilities"]]).lower()
    url=("projects/"+p["repo"]+"/") if p.get("study") else ("https://github.com/simaba/"+p["repo"])
    attrs="" if p.get("study") else ' target="_blank" rel="noopener noreferrer"'
    stamped=(meta or {}).get("updated_at") or ""
    updated=(" · Last push "+esc(stamped[:7])) if len(stamped)>=7 and stamped[4]=="-" else ""
    return ('<a class="project-row" data-kind="'+esc(p["kind"])+'" data-search="'+esc(searchable)+'" href="'+esc(url)+'"'+attrs+'>'
        '<span class="project-num">'+f"{i:02d}"+'</span><span class="project-name">'+esc(p["title"])+'</span><span class="project-description">'+esc(p["description"])+'</span>'
        '<span class="project-type">'+esc(p["kind"].upper())+' / '+esc(p["status"])+updated+'</span><span class="project-arrow" aria-hidden="true">↗</span></a>')
def render_study(page, study, p):
    name=esc(p["title"])
    url="https://github.com/simaba/"+p["repo"]
    def items(key):
        return '<ul class="study-points">'+''.join('<li>'+esc(t)+'</li>' for t in study[key])+'</ul>'
    links=[]
    for label,href in study["links"]:
        if not (href.startswith("https://github.com/simaba/") or href=="https://simaba.github.io/lean-ai-ops/" or href=="https://airc.nist.gov/home"):
            raise ValueError("Unexpected project link destination")
        links.append('<a href="'+esc(href)+'" target="_blank" rel="noopener noreferrer">'+esc(label)+' ↗</a>')
    lab_info={
        "lean-ai-ops":("PROCESS CAPABILITY","Capability from ordered measurements",
            "Edit observations and engineering specification limits. Explore Cp/Cpk and Pp/Ppk using the same selected formulas as the Python analytics module.",
            "A narrow calculation from analytics/capability.py, without Shapiro-Wilk normality testing, DPMO estimation or full project generation."),
        "everything-program-management":("RAID VALIDATOR","A risk record you can actually validate",
            "Edit the fictional risk owner, probability, impact, score and lifecycle. The checks follow the repository's published RAID schema and risk-score semantics for this record type.",
            "This workbench checks a single risk-row subset, not every RAID/decision-memo schema or the full pmkit CLI."),
        "automotive-llm-eval-harness":("SCORING PROTOTYPE","When a high score still fails",
            "Change the values of three real synthetic case artifacts from the repository and watch the weighted score and non-compensable safety/privacy gates recompute.",
            "Scores are supplied inputs, not measured model responses. Thresholds are illustrative and are not safety or release criteria."),
        "release-checklist":("DECISION SEMANTICS","Can the declared decision stand?",
            "Change a fictional pilot's gates, conditions, blockers and declared release outcome to explore the release-validator's real decision rules.",
            "This bounded exercise checks decision semantics, not YAML syntax, evidence authenticity, industry requirements or the full Python validation contract."),
        "agent-eval":("EVALUATION VALIDITY","Test a report's decision coherence",
            "Change the recommendation, approval status, finding severity and accepted actions from a fictional agent-evaluation record.",
            "This reproduces the validator's cross-field decision checks, not the complete JSON Schema or an evaluation of a deployed agent."),
        "governance-playbook":("GOVERNANCE SERVICE","Route the decision, not the committee",
            "Choose an AI lifecycle decision, intended authority, accountable owner and evidence readiness; inspect the proposed review service and missing inputs.",
            "An illustrative routing exercise from the playbook, not a prescribed enterprise control, policy engine or authorizing decision."),
        "agent-simulator":("DETERMINISTIC CONTROL FLOW","A decision trace, step by step",
            "Step through the four published fixture scenarios and see where evidence supports acceptance, bounded retries, fallback or human escalation.",
            "An interactive port of deterministic scenario logic, not live agent orchestration, empirical model evaluation or measured correctness."),
        "multi-agent-governance":("AUTHORITY ENVELOPE","Find the boundary before the tool call",
            "Choose a proposed action, data reach and proof controls within the fictional catalog-drafter envelope.",
            "No real agent/tool action is performed; enforcement must reside in authenticated tool, identity and data layers."),
        "ai-prism":("SOURCE EXPLORER","Explore the curated source index",
            "Search and filter representative public references by source, topic and publisher with explicit primary/secondary distinctions.",
            "A snapshot of repository-curated links, not automated freshness verification, legal interpretation or live source evaluation."),
        "prompt-harness-translator":("FORMAT CONVERSION","See what the target cannot carry",
            "Change the published synthetic sample's fields and render bounded Codex, Cursor or generic outputs with visible metadata-loss warnings.",
            "A constrained fixture editor, not the full YAML parser, full CLI or a claim of cross-harness behavioral equivalence."),
        "mcp-agent-risk-checklist":("STRUCTURED SECURITY REVIEW","Inspect a risk finding, not a trust label",
            "Edit one fictional MCP finding, check selected JSON-schema constraints and inspect likelihood-impact ordering without hiding owner or mitigation.",
            "Does not scan MCP servers, enforce actual permissions or infer risk severity from ordinal multiplication."),
        "nist-rmf-guide":("EVIDENCE WORKSHEET","Map evidence without inventing a maturity score",
            "Assign evidence states to Govern/Map/Measure/Manage propositions and record provenance or limitations in an exportable worksheet.",
            "Unofficial practitioner question extract. Reference applicability, control effectiveness and compliance remain unassessed.")
    }
    mode,lab_title,lab_description,lab_boundary=lab_info[p["repo"]]
    live=(' <a class="lab-live-link" href="https://simaba.github.io/lean-ai-ops/" target="_blank" rel="noopener noreferrer">Explore the separate interactive DMAIC walkthrough ↗</a>' if p["repo"]=="lean-ai-ops" else "")
    substitutions={
        "{{LAB_MODE}}":esc(mode),"{{LAB_TITLE}}":esc(lab_title),
        "{{LAB_DESCRIPTION}}":esc(lab_description),"{{LAB_BOUNDARY}}":esc(lab_boundary),
        "{{LAB_LIVE}}":live,"{{REPO}}":esc(p["repo"]),
        "{{META_TITLE}}":name,"{{META_DESCRIPTION}}":esc(study["summary"]),
        "{{CANONICAL}}":esc("https://simaba.github.io/projects/"+p["repo"]+"/"),
        "{{SOURCE_URL}}":esc(url),"{{ORIENTATION}}":esc(study["orientation"]),
        "{{STATUS}}":esc(p["status"]),"{{TITLE}}":name,"{{QUESTION}}":esc(study["question"]),
        "{{SUMMARY}}":esc(study["summary"]),"{{METHOD}}":items("method"),
        "{{ARTIFACTS}}":items("artifacts"),"{{EXAMPLE_LABEL}}":esc(study["example_label"]),
        "{{EXAMPLE}}":esc(study["example"]),"{{LIMITS}}":items("limits"),
        "{{LINKS}}":''.join(links)}
    for key,value in substitutions.items():
        if key not in page:raise RuntimeError("Missing project page placeholder "+key)
        page=page.replace(key,value)
    if "{{" in page:raise RuntimeError("Unrendered project page placeholder")
    return page
def build():
    data=json.loads((ROOT/"data/projects.json").read_text("utf-8"))
    snap=json.loads((ROOT/"data/public-metadata.json").read_text("utf-8"))
    projects=data["projects"];meta=snap["repositories"];verified=snap.get("fetched_at")
    study_data=json.loads((ROOT/"data/studies.json").read_text("utf-8"))
    studies=study_data["studies"]
    by_slug={s["repo"]:s for s in studies}
    if len(by_slug)!=len(studies) or set(by_slug)!={p["repo"] for p in projects if p.get("study")}:
        raise RuntimeError("Case-study route and catalog mismatch")
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
    study_template=(ROOT/"site/project.html").read_text("utf-8")
    for p in projects:
        if p["repo"] not in by_slug:continue
        folder=OUT/"projects"/p["repo"];folder.mkdir(parents=True,exist_ok=True)
        (folder/"index.html").write_text(render_study(study_template,by_slug[p["repo"]],p),encoding="utf-8")
    (OUT/"index.html").write_text(tpl,encoding="utf-8")
    (OUT/".nojekyll").write_text("",encoding="utf-8")
    print(f"Built {len(projects)} curated entries, {sum(p['featured'] for p in projects)} featured, {len(studies)} case pages")
if __name__=="__main__": build()
