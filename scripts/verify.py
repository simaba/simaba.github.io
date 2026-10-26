#!/usr/bin/env python3
"""Static content, design, privacy and link checks for review-only portfolio."""
import json
from html.parser import HTMLParser
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/"index.html").read_text(encoding="utf-8")
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
    assert ":focus-visible" in CSS and "prefers-reduced-motion" in CSS
    for name in ("project-search","theme-toggle","menu-toggle","empty-results"):
        assert name in HTML
    assert (ROOT/"data/launch-approval.json").is_file()
    state=json.loads((ROOT/"data/launch-approval.json").read_text())
    assert state["approved"] is False, "Source draft must not claim prior approval"
    print("PASS: 4 featured, 12 curated, design identity, anchors, basic privacy and release lock")

if __name__=="__main__":
    verify()
