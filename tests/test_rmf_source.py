"""Source-anchored evidence assessment: 12 exact practitioner propositions.
Do not conflate these author-written questions with official NIST subcategory IDs.
"""
import json
import os
from pathlib import Path
import subprocess
import unittest
ROOT=Path(__file__).resolve().parents[1]

class RMFSourceTests(unittest.TestCase):
    @classmethod
    def cli(cls,payload):
        script="""const core=require('./assets/rmf-evidence-core.js');
const input=JSON.parse(process.argv[1]);const doc=input.doc||core.defaults();
const result=core.review(doc);
process.stdout.write(JSON.stringify({questions:core.questions,doc,result,
markdown:result.valid?core.markdown(doc,result):null}));"""
        p=subprocess.run(["node","-e",script,json.dumps(payload)],cwd=ROOT,
                         capture_output=True,text=True,check=True)
        return json.loads(p.stdout)
    def test_default_is_unverified_and_no_score(self):
        data=self.cli({})
        self.assertEqual(12,len(data["questions"]))
        self.assertEqual(12,len(data["result"]["gaps"]))
        self.assertEqual(0,data["result"]["counts"]["demonstrated"])
        self.assertNotIn("maturity_score",data["doc"])
        self.assertTrue(data["result"]["valid"])
        self.assertIn("Govern review",data["markdown"])
    def test_demonstrated_requires_provenance(self):
        data=self.cli({})["doc"]
        data["items"][0]["status"]="demonstrated"
        incomplete=self.cli({"doc":data})["result"]
        self.assertFalse(incomplete["valid"])
        data["items"][0].update(source_reference="Reviewed reference",source_version="Verified version",
          evidence_reference="Synthetic test",evidence_owner="Fictional owner",
          evidence_date="2026-09-15",coverage="Staging only",evidence_type="operation")
        self.assertTrue(self.cli({"doc":data})["result"]["valid"])
    def test_na_and_blocker_gate(self):
        data=self.cli({})["doc"]
        data["items"][0]["status"]="not_applicable"
        self.assertFalse(self.cli({"doc":data})["result"]["valid"])
        data["items"][0].update(not_applicable_rationale="Fictional non-applicable boundary that excludes the tool.",
          source_reference="Reviewed official source",source_version="Version confirmed")
        self.assertTrue(self.cli({"doc":data})["result"]["valid"])
        data["items"][0].update(status="partial",disposition="blocker",
          decision_consequence="Pilot exposure cannot be justified.",
          action_owner="Fictional owner",invalidation_trigger="Independent validation")
        data["conclusion"]["outcome"]="proceed_with_conditions"
        self.assertFalse(self.cli({"doc":data})["result"]["valid"])
        data["conclusion"]["outcome"]="defer"
        self.assertTrue(self.cli({"doc":data})["result"]["valid"])
    @unittest.skipUnless(os.environ.get("RMF_REFERENCE_ROOT"),"Pinned source checkout runs in hosted CI")
    def test_exact_propositions_are_in_pinned_practitioner_template(self):
        path=ROOT/os.environ["RMF_REFERENCE_ROOT"]/"templates/nist-rmf-gap-assessment.md"
        self.assertTrue(path.is_file())
        text=path.read_text(encoding="utf-8")
        source=self.cli({})["questions"]
        for fn,proposition in source:
            with self.subTest(function_name=fn,proposition=proposition):
                self.assertIn(proposition,text)
        self.assertIn("Evidence status vocabulary",text)
        self.assertIn("Material gaps and dependencies",text)
        self.assertIn("not an official NIST",text)
if __name__=="__main__":unittest.main()
