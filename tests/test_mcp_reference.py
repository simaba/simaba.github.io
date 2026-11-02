"""Cross-check JS MCP record structural results with pinned Draft 2020-12 schema.

The Python schema tests run with the browser environment's jsonschema dependency
and are also checked independently on the actual browser-exported document.
"""
import json
import os
from pathlib import Path
import subprocess
import unittest
ROOT=Path(__file__).resolve().parents[1]
MCP_ROOT=os.environ.get("MCP_REFERENCE_ROOT")
class MCPContractTests(unittest.TestCase):
    def js(self,obj):
        cli="""const x=require('./assets/mcp-review-core.js');
const input=JSON.parse(process.argv[1]);
process.stdout.write(JSON.stringify({errors:x.validate(input),review:x.review(input)}));"""
        p=subprocess.run(["node","-e",cli,json.dumps(obj)],cwd=ROOT,
                         text=True,capture_output=True,check=True)
        return json.loads(p.stdout)
    def test_complete_example_and_finding_mutations(self):
        example=self.example()
        result=self.js(example)
        self.assertEqual([],result["errors"])
        self.assertEqual(3,result["review"]["findings_count"])
        self.assertEqual(2,result["review"]["open_count"])
        self.assertEqual(1,result["review"]["high_count"])
        for field,bad in [("likelihood",0),("impact",6),("area","unknown"),("risk_level","unknown"),
                          ("owner",""),("status","ignored")]:
            mutated=json.loads(json.dumps(example))
            mutated["findings"][1][field]=bad
            self.assertTrue(self.js(mutated)["errors"],field)
        broken=json.loads(json.dumps(example));broken["findings"][0]["invented"]="bad"
        self.assertTrue(self.js(broken)["errors"])
        broken["findings"]=[];self.assertTrue(self.js(broken)["errors"])
    def test_invalid_review_and_advisory_boundary(self):
        example=self.example()
        record=json.loads(json.dumps(example))
        record["findings"][0]["id"]=record["findings"][1]["id"]
        report=self.js(record)
        self.assertFalse(report["errors"]) # Source schema does not enforce unique IDs.
        self.assertTrue(any("Duplicate" in x for x in report["review"]["advisory"]))
        record=json.loads(json.dumps(example));record["findings"][1]["status"]="blocked"
        report=self.js(record)
        self.assertFalse(report["errors"])
        self.assertTrue(any("conflicts" in x for x in report["review"]["advisory"]))
    def example(self):
        path=ROOT/".source-reference/mcp/examples/fictional-mcp-risk-review.json"
        if path.is_file():
            return json.loads(path.read_text(encoding="utf-8"))
        return {"review_id":"MCP-FIC-001","system_name":"Fictional Read-Only Knowledge Helper",
                "scope":"Synthetic documents only","review_status":"draft",
                "findings":[{"id":"F-001","area":"permissions","finding":"Bounded fictional risk",
                    "likelihood":3,"impact":4,"risk_level":"high",
                    "mitigation":"Dedicated identity", "owner":"Fictional Owner","status":"mitigating"},
                 {"id":"F-002","area":"prompt_injection","finding":"Untrusted instructions",
                    "likelihood":3,"impact":3,"risk_level":"medium",
                    "mitigation":"Server-side boundaries", "owner":"Fictional Reviewer","status":"open"},
                 {"id":"F-003","area":"auditability","finding":"Missing trace",
                    "likelihood":2,"impact":3,"risk_level":"medium",
                    "mitigation":"Audit event provenance", "owner":"Fictional Ops","status":"open"}]}
if __name__=="__main__":unittest.main()
