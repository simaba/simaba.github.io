#!/usr/bin/env python3
"""Static content, design, privacy and link checks for review-only portfolio."""
import json
import re
from html.parser import HTMLParser
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
from build import build
build()
HTML=(ROOT/"dist/index.html").read_text(encoding="utf-8")
CSS=(ROOT/"assets/styles.css").read_text(encoding="utf-8")
JS=(ROOT/"assets/app.js").read_text(encoding="utf-8")

class Audit(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids=[]; self.headings=[]; self.links=[]; self.lang=False
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=="html": self.lang=a.get("lang")=="en"
        if "id" in a: self.ids.append(a["id"])
        if tag in ("h1","h2","h3"): self.headings.append(tag)
        if tag=="a": self.links.append(a.get("href"))

def verify():
    assert "<style>" not in HTML and "<script>" not in HTML
    assert '<link rel="stylesheet" href="assets/styles.css"' in HTML
    assert '<script defer src="assets/app.js"></script>' in HTML
    a=Audit();a.feed(HTML)
    assert a.lang and a.headings.count("h1")==1, "Missing lang or single H1"
    assert len(a.ids)==len(set(a.ids)), "Duplicate DOM IDs"
    assert all(x and (x.startswith("https://") or x.startswith("#")) for x in a.links), "Unsafe link protocol"
    assert all(x[1:] in set(a.ids) for x in a.links if x.startswith("#")), "Broken anchor"
    assert HTML.count('class="project-row"')==12, "Catalog changed"
    assert HTML.count('class="feature ')==4, "Featured selection changed"
    for private in ("simaba/Tipira","simaba/Skill-builder","simaba/multilingual-contact-manager"):
        assert private.lower() not in HTML.lower(), "Private repo exposed"
    for token in ("--bg:#F5F4F0","--bg:#111722","--accent:#5F69D9","--accent:#8A98FA","--accent-secondary:#6BBEAC"):
        assert token in CSS, "Visual identity mismatch: "+token
    assert "Georgia" not in CSS and "font:italic 1em" not in CSS, "Unapproved serif design"
    assert "var(--font-editorial)" not in CSS, "Unresolved font token"
    assert not (ROOT/"index.html").exists(), "Stale root HTML could bypass generated site"
    assert ":focus-visible" in CSS and "prefers-reduced-motion" in CSS
    for name in ("project-search","theme-toggle","menu-toggle","empty-results"):
        assert name in HTML
    assert (ROOT/"data/launch-approval.json").is_file()
    state=json.loads((ROOT/"data/launch-approval.json").read_text())
    assert state.get("schema_version")==2, "Approval schema must be v2"
    assert state.get("approved") in (True,False), "Unknown approval value"
    data=json.loads((ROOT/"data/projects.json").read_text())
    assert data["owner"]=="simaba" and data["schema_version"]==1
    assert len(data["projects"])==12 and sum(p["featured"] for p in data["projects"])==4
    repos=[p["repo"] for p in data["projects"]]
    assert len(repos)==len(set(repos)) and all(p["repo"]!="Tipira" and p["repo"]!="Skill-builder" for p in data["projects"])
    assert all(re.fullmatch(r"[A-Za-z0-9._-]+",n) and n not in (".","..") for n in repos), "Invalid repository slug"
    assert all(p["kind"] in ("tool","prototype","method","resource") for p in data["projects"])
    assert all(isinstance(p["description"],str) and len(p["description"])>=75 for p in data["projects"])
    assert all(p.get("editorial_source")=="README.md" for p in data["projects"])
    assert "BUILT WITH INTENTION" not in HTML
    assert "Each project addresses a different part" not in HTML
    snapshot=json.loads((ROOT/"data/public-metadata.json").read_text())
    assert snapshot["schema_version"]==1 and set(snapshot["repositories"]).issubset(repos)
    assert all(set(m).issubset({"updated_at","stars","forks","language","archived"}) for m in snapshot["repositories"].values())
    print("PASS: deterministic generated site, curated manifest, design tokens, anchors, privacy and approval schema")

if __name__=="__main__":
    verify()
