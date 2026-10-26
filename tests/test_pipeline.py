"""Focused tests for source boundary, HTML escaping, allowlisted synchronization and launch blocking."""
import json
import tempfile
import unittest
import sys
from pathlib import Path
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
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
        # Always test an unapproved fixture, even after the actual site is approved.
        with patch.object(launch_gate.json,"loads",return_value={"schema_version":2,"approved":False}):
            with self.assertRaisesRegex(RuntimeError,"no human design approval"):
                launch_gate.check()
    def test_launch_approval_binds_both_source_and_baselines(self):
        from datetime import datetime,timezone
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp); baseline=root/"tests/visual-baseline"
            baseline.mkdir(parents=True)
            for name in launch_gate.DESIGN_FILES:
                f=root/name;f.parent.mkdir(parents=True,exist_ok=True)
                f.write_text("approved source",encoding="utf-8")
            for name in launch_gate.REQUIRED:
                (baseline/name).write_bytes(b"approved visual evidence"*70)
            with patch.object(launch_gate,"ROOT",root),patch.object(launch_gate,"BASE",baseline):
                approval={"schema_version":2,"approved":True,"reviewer":"Human reviewer",
                    "approved_at":datetime.now(timezone.utc).isoformat(),
                    "evidence":"https://github.com/simaba/simaba.github.io/pull/1",
                    "design_sha256":launch_gate.design_digest(),
                    "baseline_sha256":launch_gate.visual_hashes()}
                (root/"data").mkdir(exist_ok=True)
                (root/"data/launch-approval.json").write_text(json.dumps(approval))
                launch_gate.check()
                (root/launch_gate.DESIGN_FILES[0]).write_text("unreviewed drift")
                with self.assertRaisesRegex(RuntimeError,"design or content changed"):
                    launch_gate.check()
                (root/launch_gate.DESIGN_FILES[0]).write_text("approved source")
                (baseline/launch_gate.REQUIRED[0]).write_bytes(b"mutated screenshot"*75)
                with self.assertRaisesRegex(RuntimeError,"screenshot baseline"):
                    launch_gate.check()
    def test_approved_palette_is_locked(self):
        css=(ROOT/"assets/styles.css").read_text()
        for token in ("--bg:#F5F4F0","--bg:#111722","--accent:#5F69D9","--accent:#8A98FA","--accent-secondary:#6BBEAC"):
            self.assertIn(token,css)
if __name__=="__main__": unittest.main()
