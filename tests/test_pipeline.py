"""Focused tests for source boundary, HTML escaping, allowlisted synchronization and launch blocking."""
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from build import featured_card,catalog_row,build
from sync import extract
import launch_gate
ROOT=Path(__file__).resolve().parents[1]
class PortfolioChecks(unittest.TestCase):
    def setUp(self):
        self.data=json.loads((ROOT/"data/projects.json").read_text())
    def test_private_repositories_never_in_allowlist(self):
        names=[p["repo"].lower() for p in self.data["projects"]]
        self.assertEqual(len(names),len(set(names)))
        self.assertTrue(set(names).isdisjoint({"tipira","skill-builder","multilingual-contact-manager"}))
    def test_featured_content_escapes_html(self):
        p=dict(self.data["projects"][0],title='<script>alert("x")</script>')
        rendered=featured_card(p,1)
        self.assertNotIn("<script>",rendered)
        self.assertIn("&lt;script&gt;",rendered)
    def test_project_search_escapes_untrusted_text(self):
        p=dict(self.data["projects"][0],description='<img src=x onerror=alert(1)>')
        self.assertNotIn("<img",catalog_row(p,1,{}))
    def test_unknown_or_private_github_metadata_fails(self):
        sample={"name":"lean-ai-ops","full_name":"simaba/lean-ai-ops","private":False,"visibility":"public","owner":{"login":"simaba"}}
        self.assertEqual(extract(sample,"lean-ai-ops")["stars"],0)
        with self.assertRaises(ValueError): extract({**sample,"private":True},"lean-ai-ops")
        with self.assertRaises(ValueError): extract({**sample,"full_name":"other/lean-ai-ops"},"lean-ai-ops")
        with self.assertRaises(ValueError): extract(sample,"not-curated")
    def test_site_is_generated_and_links_are_safe(self):
        build()
        h=(ROOT/"dist/index.html").read_text()
        self.assertEqual(h.count('class="project-row"'),12)
        self.assertEqual(h.count('class="feature '),4)
        self.assertNotIn("{{FEATURED}}",h)
        self.assertNotIn("{{CATALOG}}",h)
    def test_launch_refuses_missing_design_approval(self):
        with self.assertRaisesRegex(RuntimeError,"no human design approval"):
            launch_gate.check()
    def test_approved_palette_is_locked(self):
        css=(ROOT/"assets/styles.css").read_text()
        for token in ("--bg:#F5F4F0","--bg:#111722","--accent:#5F69D9","--accent:#8A98FA","--accent-secondary:#6BBEAC"):
            self.assertIn(token,css)
if __name__=="__main__": unittest.main()
