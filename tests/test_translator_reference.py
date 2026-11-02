"""Source-bounded translator parity against pinned PyYAML-based original.

The JavaScript parser intentionally rejects YAML outside a documented strict subset.
For supported fixtures, metadata and semantic target outputs must agree with
the original Python translator at an AST/structure level.
"""
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import unittest
ROOT=Path(__file__).resolve().parents[1]
REF=os.environ.get("TRANSLATOR_REFERENCE_ROOT")
class BrowserTranslatorContract(unittest.TestCase):
    def run_js(self,source):
        p=subprocess.run(["node",str(ROOT/"tests/translator_eval_cli.cjs")],
            input=json.dumps({"source":source}),text=True,capture_output=True,check=True)
        return json.loads(p.stdout)
    def samples(self):
        basic="""---
name: executive-summary
description: Creates concise leadership-ready summaries.
tools: ["Read", "Write"]
model: reasoning
---

Produce a crisp executive summary with a recommendation, risks, and next steps.
"""
        nested="""---
name: reviewer
description: |
  Review changes carefully:
  preserve safety constraints.
tools:
  read:
    enabled: true
  write:
    enabled: false
tags:
  - governance
  - evaluation
---

Provide a concise review.
"""
        multilingual="""---
name: "reviewer-中文"
description: "Review Japanese and Persian text."
tags: [governance, multilingual]
levels:
  low: 1
  medium: 2
enabled: true
---

Keep user-supplied constraints.
"""
        return [basic,nested,multilingual]
    def test_supported_cases_without_python(self):
        for src in self.samples():
            with self.subTest(source=src[:25]):
                js=self.run_js(src)
                self.assertTrue(js["ok"],js)
                fields=js["parsed"]
                self.assertTrue(fields["name"])
                self.assertTrue(all(target in js["outputs"] for target in ("codex","cursor","generic")))
                self.assertIn("Lossy conversion warning",js["outputs"]["codex"]["output"])
                self.assertEqual([],js["outputs"]["generic"]["lost"])
    def test_refuse_unsupported_or_dangerous_shapes(self):
        cases=["name: demo", "---\nname: [broken\n---\nHello",
            "---\nname: demo\nname: repeated\n---\nHello",
            "---\nname: demo\nextra: *recursive\n---\nHello",
            "---\nname: demo\nextra: 2026-11-02\n---\nHello",
            "---\nname: demo\nextra: !!python/object/apply:os.system\n---\nHello"]
        for src in cases:
            with self.subTest(src=src[:25]):
                self.assertFalse(self.run_js(src)["ok"])
    @unittest.skipUnless(REF and (ROOT/REF).is_dir(),"Pinned Python reference checkout requires CI")
    def test_semantic_parity_against_python(self):
        import yaml
        src_dir=ROOT/REF/"src"
        import sys
        sys.path.insert(0,str(src_dir))
        from prompt_harness_translator.core import parse_simple_agent_markdown,translate_text
        fixtures=self.samples()
        published=ROOT/REF/"examples/sample_agent.md"
        if published.is_file():fixtures.append(published.read_text(encoding="utf-8"))
        for src in fixtures:
            with self.subTest(src=src[:30]):
                js=self.run_js(src)
                self.assertTrue(js["ok"],js)
                py=parse_simple_agent_markdown(src)
                self.assertEqual(py,js["parsed"])
                for target in ("cursor","generic"):
                    self.assertEqual(yaml.safe_load(translate_text(src,target)),
                                     yaml.safe_load(js["outputs"][target]["output"]))
                codex=js["outputs"]["codex"]["output"]
                self.assertIn("# "+py["name"]+"\n",codex)
                self.assertIn("## Instructions\n\n"+py["instructions"],codex)
                self.assertEqual(set(py["unsupported_fields"]),set(js["outputs"]["codex"]["lost"]))
if __name__=="__main__":unittest.main()
