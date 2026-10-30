"""Source contract regression tests for selected RAID and memo semantics."""
import json
from pathlib import Path
import subprocess
import unittest
ROOT=Path(__file__).resolve().parents[1]
class PMKitBrowserCoreTests(unittest.TestCase):
    def eval(self,which,data):
        script="""const x=require('./assets/pmkit-core.js');
const p=JSON.parse(process.argv[1]);
const out=p.which==='risk'?x.raidErrors(p.data):x.memoErrors(p.data);
process.stdout.write(JSON.stringify(out));"""
        p=subprocess.run(["node","-e",script,json.dumps({"which":which,"data":data})],
          cwd=ROOT,capture_output=True,text=True,check=True)
        return json.loads(p.stdout)
    def test_bad_risk_score_is_rejected(self):
        row={"id":"RAID-0001","type":"risk","title":"Fixture risk","description":"Long enough fixture risk description","category":"schedule",
          "owner":"Fictional owner","opened":"2026-04-26","due":"2026-05-15","status":"mitigating","last_updated":"2026-04-26",
          "probability":3,"impact":4,"score":12,"mitigation":"Bounded fallback","trigger":"Dependency late"}
        self.assertEqual([],self.eval("risk",row))
        row["score"]=13
        self.assertTrue(any("3 × 4 = 12" in x for x in self.eval("risk",row)))
    def test_decision_lifecycle_rules(self):
        memo={"id":"DM-0001","title":"Test decision on fictional scope","decider":"Fictional sponsor","due":"2026-04-26",
           "status":"in_review","decided":None,"decision":None,"review_date":"2026-05-10","linked_raid_ids":["RAID-0001"]}
        self.assertEqual([],self.eval("memo",memo))
        memo["status"]="decided"
        self.assertTrue(self.eval("memo",memo))
        memo["decided"]="2026-04-26";memo["decision"]="Option B"
        self.assertEqual([],self.eval("memo",memo))
        memo["status"]="deferred";memo["decided"]=None;memo["decision"]="Need further evidence";memo["review_date"]=None
        self.assertTrue(self.eval("memo",memo))
    def review(self,data):
        script="""require('./assets/pmkit-core.js');
const x=require('./assets/pmkit-analysis.js');
const input=JSON.parse(process.argv[1]);
const out=x.review(input);
process.stdout.write(JSON.stringify(out));"""
        p=subprocess.run(["node","-e",script,json.dumps(data)],
            cwd=ROOT,capture_output=True,text=True,check=True)
        return json.loads(p.stdout)
    def base_review(self):
        return {"status":"in_review","choice":"Option B",
            "options":{"A":{"constraint":"unverified"},"B":{"constraint":"supported"}},
            "evidence_class":"estimated","evidence_reference":"Fictional delivery estimate, unverified",
            "changed":"Interface confirmation is late","delay_consequence":"Compresses the pilot review window",
            "action":"Confirm reversible fallback boundary","owner":"Fictional delivery owner",
            "action_date":"2026-05-01","trigger":"Restricted records would be required",
            "residual_risk":"Later scope adjustments may be needed"}
    def test_review_warns_without_fabricating_authority(self):
        review=self.review(self.base_review())
        self.assertTrue(review["ready"])
        self.assertTrue(review["review_only"])
        self.assertIn("B",review["viable_options"])
        self.assertTrue(any("pending decision" in x.lower() for x in review["warnings"]))
        self.assertTrue(any("estimate" in x.lower() for x in review["warnings"]))
    def test_decided_hard_gate_cannot_be_ignored(self):
        data=self.base_review();data["status"]="decided"
        data["options"]["B"]["constraint"]="failed"
        review=self.review(data)
        self.assertFalse(review["ready"])
        self.assertTrue(any("fails a declared hard boundary" in x for x in review["blocking"]))
        data["options"]["B"]["constraint"]="unverified"
        self.assertFalse(self.review(data)["ready"])
        data["options"]["B"]["constraint"]="supported"
        self.assertTrue(self.review(data)["ready"])
    def test_missing_evidence_and_action_rejected(self):
        data=self.base_review();data["evidence_reference"]="";data["action_date"]="2026-02-30"
        data["changed"]="";data["trigger"]=""
        errors=self.review(data)["blocking"]
        self.assertGreaterEqual(len(errors),4)
        self.assertTrue(any("real ISO date" in x for x in errors))
if __name__=="__main__":unittest.main()
