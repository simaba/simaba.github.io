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
if __name__=="__main__":unittest.main()
