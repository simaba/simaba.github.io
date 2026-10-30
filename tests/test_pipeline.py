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
from verify import audit_built_site
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
                approval={"schema_version":2,"approved":True,"editorial_approved":True,"reviewer":"Human reviewer",
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
    def test_visual_evidence_upload_cannot_succeed_without_artifact(self):
        workflow=(ROOT/".github/workflows/review.yml").read_text()
        screenshot_block=workflow.split("name: portfolio-visual-review-")[1].split("- name: Preserve exact verified site")[0]
        self.assertIn("if-no-files-found: error",screenshot_block)
        self.assertIn("include-hidden-files: true",screenshot_block)
        self.assertIn("path: .qa/",screenshot_block)
    def test_generated_site_single_source_of_truth(self):
        self.assertFalse((ROOT/"index.html").exists(), "Stale root HTML bypasses renderer")
        self.assertTrue((ROOT/"site/template.html").exists())
        css=(ROOT/"assets/styles.css").read_text()
        self.assertNotIn("var(--font-editorial)",css)
    def test_ci_uses_modern_pinned_node24_actions(self):
        workflow=(ROOT/".github/workflows/review.yml").read_text()
        for sha in ("3d3c42e5aac5ba805825da76410c181273ba90b1",
                    "cf430e030ddbb5b0abf93d22962f4752f3646cd9",
                    "9000827ccba6bdab643e8b6fd33ac0654aef8333"):
            self.assertIn(sha,workflow)
        self.assertIn("needs: [verify]",workflow)
        self.assertIn("python3 scripts/launch_gate.py",workflow)
    def test_release_control_files_are_bound_to_approval(self):
        for file in (".github/workflows/review.yml","scripts/launch_gate.py","scripts/verify.py","scripts/compare_visual.py","scripts/browser_review.py","scripts/sync.py","tests/test_pipeline.py","site/project.html","data/studies.json"):
            self.assertIn(file,launch_gate.DESIGN_FILES)
    def test_release_blocks_without_editorial_signoff(self):
        with patch.object(launch_gate.json,"loads",return_value={"schema_version":2,"approved":True,"editorial_approved":False}):
            with self.assertRaisesRegex(RuntimeError,"missing human editorial approval"):
                launch_gate.check()
    def test_catalog_copy_has_source_and_specificity(self):
        projects=self.data["projects"]
        self.assertTrue(all(p.get("editorial_source")=="README.md" for p in projects))
        self.assertEqual(len({p["description"] for p in projects}),len(projects))
        for p in projects:
            self.assertGreaterEqual(len(p["description"]),75,p["repo"])
            self.assertLessEqual(len(p["description"]),240,p["repo"])
            for phrase in ("seamless","revolutionary","game-changing","cutting-edge","state-of-the-art","unlock potential"):
                self.assertNotIn(phrase,p["description"].lower(),p["repo"])
        self.assertEqual(next(p for p in projects if p["repo"]=="prompt-harness-translator")["kind"],"tool")
    def test_study_routes_and_scope(self):
        build()
        case_studies=json.loads((ROOT/"data/studies.json").read_text("utf-8"))["studies"]
        self.assertEqual(len(case_studies),12)
        self.assertEqual({p["repo"] for p in self.data["projects"] if p.get("study")},{x["repo"] for x in case_studies})
        for entry in case_studies:
            page=ROOT/"dist/projects"/entry["repo"]/"index.html"
            self.assertTrue(page.is_file())
            html=page.read_text()
            self.assertIn("What it does not establish",html)
            self.assertNotIn("{{",html)
    def test_every_detail_has_a_real_browser_workbench(self):
        build()
        for p in self.data["projects"]:
            if p.get("study"):
                page=(ROOT/"dist/projects"/p["repo"]/"index.html").read_text()
                self.assertIn('data-project-lab="'+p["repo"]+'"',page)
                self.assertIn('id="workbench"',page)
                self.assertIn('src="../../assets/project-labs.js"',page)
                self.assertIn('src="../../assets/automotive-core.js"',page)
                self.assertIn('src="../../assets/extended-labs.js"',page)
                self.assertIn('src="../../assets/simulator-core.js"',page)
        js=(ROOT/"assets/project-labs.js").read_text()
        core=(ROOT/"assets/automotive-core.js").read_text()
        self.assertNotIn("fetch(",core)
        self.assertNotIn("XMLHttpRequest",core)
        self.assertNotIn("fetch(",js)
        self.assertNotIn("XMLHttpRequest",js)
        extended=(ROOT/"assets/extended-labs.js").read_text()
        self.assertNotIn("fetch(",extended)
        self.assertNotIn("XMLHttpRequest",extended)
        self.assertIn("FALLBACK",extended)
        self.assertIn("Lossy conversion warning",extended)
        simulator=(ROOT/"assets/simulator-core.js").read_text()
        self.assertNotIn("fetch(",simulator)
        self.assertNotIn("XMLHttpRequest",simulator)
        self.assertIn("fallback_used",simulator)
        self.assertIn("MEAN SCORE",js)
        self.assertIn("CAPABILITY ESTIMATES COMPUTED",js)
    def test_examples_are_typed_as_commands_or_prose(self):
        build()
        command=(ROOT/"dist/projects/agent-simulator/index.html").read_text()
        prose=(ROOT/"dist/projects/governance-playbook/index.html").read_text()
        self.assertIn('<pre class="study-code"><code>python run_demo.py',command)
        self.assertIn('<p class="study-example-text">',prose)
        self.assertNotIn('<pre class="study-code"><code>Read the fictional',prose)
    def test_source_anchors_are_reviewed_and_pinned(self):
        build()
        mapping=json.loads((ROOT/"data/source-revisions.json").read_text())["references"]
        self.assertEqual(set(mapping),{p["repo"] for p in self.data["projects"]})
        for slug,ref in mapping.items():
            page=(ROOT/"dist/projects"/slug/"index.html").read_text()
            self.assertIn("/blob/"+ref["commit"]+"/"+ref["reference_path"],page)
            self.assertIn("REVIEWED SOURCE SNAPSHOT",page)
    def test_program_workflow_assets_and_source_contract(self):
        build()
        html=(ROOT/"dist/projects/everything-program-management/index.html").read_text()
        self.assertIn('assets/pmkit-core.js',html)
        self.assertIn('src="../../assets/project-labs.js"',html)
        source=(ROOT/"assets/project-labs.js").read_text()
        self.assertIn("linked_decision_id",source)
        self.assertIn("lab-export-memo",source)
    def test_release_record_editor_exposes_source_evidence_fields(self):
        build()
        text=(ROOT/"assets/project-labs.js").read_text()
        self.assertIn('lab-evidence',text)
        self.assertIn('lab-limitation',text)
        self.assertIn('fictional-release-decision.json',text)
    def test_featured_areas_are_diverse(self):
        featured={p["repo"] for p in self.data["projects"] if p["featured"]}
        self.assertEqual(featured,{"lean-ai-ops","everything-program-management","automotive-llm-eval-harness","release-checklist"})
    def test_public_snapshot_is_complete_and_bounded(self):
        projects={p["repo"] for p in self.data["projects"]}
        snapshot=json.loads((ROOT/"data/public-metadata.json").read_text())
        self.assertEqual(set(snapshot["repositories"]),projects)
        self.assertTrue(snapshot["fetched_at"] and snapshot["fetched_at"].startswith("2026-"))
        for repo,item in snapshot["repositories"].items():
            self.assertIs(type(item["stars"]),int,repo)
            self.assertIs(type(item["forks"]),int,repo)
            self.assertIs(type(item["archived"]),bool,repo)
            self.assertIsInstance(item["language"],str,repo)
    def test_generated_local_navigation_is_complete(self):
        build()
        audit_built_site()
    def test_website_metadata_and_icon_align_with_professional_scope(self):
        build()
        homepage=(ROOT/"dist/index.html").read_text()
        self.assertIn("<title>Sima Bagheri | Technical Program Management, Engineering and AI</title>",homepage)
        self.assertIn('href="assets/favicon.svg"',homepage)
        self.assertNotIn("AI systems, made accountable",homepage)
        for p in self.data["projects"]:
            if p.get("study"):
                page=(ROOT/"dist/projects"/p["repo"]/"index.html").read_text()
                self.assertIn('property="og:description"',page)
                self.assertIn('href="../../assets/favicon.svg"',page)
    def test_approved_palette_is_locked(self):
        css=(ROOT/"assets/styles.css").read_text()
        for token in ("--bg:#F5F4F0","--bg:#111722","--accent:#5F69D9","--accent:#8A98FA","--accent-secondary:#6BBEAC"):
            self.assertIn(token,css)
if __name__=="__main__": unittest.main()
