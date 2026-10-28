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


def audit_built_site():
    """Check every generated page, local route, stylesheet and script without network access."""
    from urllib.parse import urlsplit, unquote
    root=(ROOT/"dist").resolve()
    pages=sorted(root.rglob("*.html"))
    expected={root/"index.html"} | {root/"projects"/p["repo"]/"index.html" for p in json.loads((ROOT/"data/projects.json").read_text("utf-8"))["projects"] if p.get("study")}
    assert set(pages)==expected, "Unexpected or missing generated HTML page"
    class PageAudit(HTMLParser):
        def __init__(self):
            super().__init__();self.ids=[];self.hrefs=[];self.resources=[];self.headings=[];self.alt_missing=0;self.lang=False
        def handle_starttag(self,tag,attrs):
            a=dict(attrs)
            if tag=="html":self.lang=a.get("lang")=="en"
            if "id" in a:self.ids.append(a["id"])
            if tag in ("h1","h2","h3"):self.headings.append(tag)
            if tag=="a":self.hrefs.append(a.get("href"))
            if tag=="script" and a.get("src"):self.resources.append(a["src"])
            if tag=="link" and a.get("rel")=="stylesheet":self.resources.append(a.get("href"))
            if tag=="img" and a.get("alt") is None:self.alt_missing+=1
    for page in pages:
        audit=PageAudit();audit.feed(page.read_text("utf-8"))
        assert audit.lang and audit.headings.count("h1")==1,(str(page),"language or h1 missing")
        assert len(audit.ids)==len(set(audit.ids)),(str(page),"duplicate ID")
        assert audit.alt_missing==0,(str(page),"image missing alt")
        for href in audit.hrefs+audit.resources:
            assert isinstance(href,str) and href,(str(page),"empty link/resource")
            parts=urlsplit(href)
            assert not parts.scheme or parts.scheme=="https",(str(page),"unsafe scheme",href)
            if parts.scheme:
                assert parts.netloc,(str(page),"invalid external URL",href)
                continue
            assert not parts.netloc,(str(page),"protocol-relative link",href)
            path=unquote(parts.path)
            if path:
                target=(page.parent/path).resolve()
                assert target.is_relative_to(root),(str(page),"link escapes site",href)
                if target.is_dir():target=target/"index.html"
                assert target.is_file(),(str(page),"broken local link or asset",href)
            else:
                target=page
            if href in audit.hrefs and parts.fragment:
                if target==page:
                    assert unquote(parts.fragment) in audit.ids,(str(page),"missing anchor",href)
                elif target.suffix==".html":
                    dest=PageAudit();dest.feed(target.read_text("utf-8"))
                    assert unquote(parts.fragment) in dest.ids,(str(page),"cross-page anchor missing",href)
    print(f"PASS: {len(pages)} generated HTML pages, local links, anchors, accessible images and resources")

def verify():
    assert "<style>" not in HTML and "<script>" not in HTML
    assert '<link rel="stylesheet" href="assets/styles.css"' in HTML
    assert '<script defer src="assets/app.js"></script>' in HTML
    a=Audit();a.feed(HTML)
    assert a.lang and a.headings.count("h1")==1, "Missing lang or single H1"
    assert len(a.ids)==len(set(a.ids)), "Duplicate DOM IDs"
    assert all(x and (x.startswith("https://") or x.startswith("#") or re.fullmatch(r"projects/[a-z0-9._-]+/",x)) for x in a.links), "Unsafe link protocol"
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
    studies=json.loads((ROOT/"data/studies.json").read_text())
    assert studies["schema_version"]==1 and len(studies["studies"])==12
    assert {s["repo"] for s in studies["studies"]}=={p["repo"] for p in data["projects"] if p.get("study")}
    assert {p["repo"] for p in data["projects"] if p["featured"]}=={"lean-ai-ops","everything-program-management","automotive-llm-eval-harness","release-checklist"}
    for s in studies["studies"]:
        page=ROOT/"dist"/"projects"/s["repo"]/"index.html"
        assert page.is_file() and page.stat().st_size>1500, "Missing project page"
        content=page.read_text(encoding="utf-8")
        assert "{{" not in content and "What it does not establish" in content
        assert "../../assets/styles.css" in content and "../../assets/detail.js" in content
        assert "../../assets/labs.css" in content and "../../assets/project-labs.js" in content
        assert "../../assets/extended-labs.js" in content
        assert 'data-project-lab="'+s["repo"]+'"' in content
        assert 'href="../../assets/favicon.svg"' in content
        assert 'property="og:title"' in content and 'property="og:description"' in content
    assert (ROOT/"dist/assets/detail.js").is_file()
    assert (ROOT/"dist/assets/project-labs.js").is_file()
    assert (ROOT/"dist/assets/extended-labs.js").is_file()
    assert (ROOT/"dist/assets/labs.css").is_file()
    assert "BUILT WITH INTENTION" not in HTML
    assert "Each project addresses a different part" not in HTML
    assert "A score isn’t a release decision" not in HTML
    assert "Systems, tools," in HTML
    assert "<title>Sima Bagheri | Technical Program Management, Engineering and AI</title>" in HTML
    assert 'property="og:title" content="Sima Bagheri | Technical Program Management, Engineering and AI"' in HTML
    assert 'href="assets/favicon.svg"' in HTML
    assert "AI systems, made accountable" not in HTML
    assert "AI Is Not Making Society Choices for Us" in HTML
    assert "AI Is Not Making Society’s Choices for Us" not in HTML
    assert "The Hidden Failure Mode in AI Systems" in HTML
    snapshot=json.loads((ROOT/"data/public-metadata.json").read_text())
    assert snapshot["schema_version"]==1 and set(snapshot["repositories"]).issubset(repos)
    assert all(set(m).issubset({"updated_at","stars","forks","language","archived"}) for m in snapshot["repositories"].values())
    audit_built_site()
    print("PASS: deterministic generated site, curated manifest, design tokens, anchors, privacy and approval schema")

if __name__=="__main__":
    verify()
