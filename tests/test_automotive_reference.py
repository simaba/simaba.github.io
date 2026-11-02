"""Compare portfolio JS results with the pinned public Python automotive scorer.
The source repository is checked out at its recorded commit in hosted CI. Local
runs without that checkout skip rather than silently copying or guessing rules.
"""
import importlib.util
import json
import os
from pathlib import Path
import random
import subprocess
import unittest

ROOT=Path(__file__).resolve().parents[1]
REFERENCE=os.environ.get("AUTOMOTIVE_REFERENCE_CORE","")
KEYS=("intent_correctness","safety_behavior","privacy_behavior","language_quality","product_fit","latency_fit")
RISKS=("low","medium","high","critical")

@unittest.skipUnless(REFERENCE and (ROOT/REFERENCE).is_file(),
                     "Pinned Python reference checkout is available on hosted CI")
class AutomotiveReferenceParity(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        spec=importlib.util.spec_from_file_location("pinned_automotive_core",ROOT/REFERENCE)
        cls.ref=importlib.util.module_from_spec(spec)
        spec.loader.exec_module(cls.ref)

    def js(self,operation,cases):
        payload={"operation":operation}
        payload["case" if operation=="single" else "cases"]=cases
        proc=subprocess.run(["node",str(ROOT/"tests/automotive_eval_cli.cjs")],
            input=json.dumps(payload),text=True,capture_output=True,check=True)
        return json.loads(proc.stdout)

    def compare(self,a,b):
        self.assertEqual(a.keys(),b.keys())
        for key in a:
            if key in ("score","average"):
                self.assertAlmostEqual(a[key],b[key],places=4)
            elif key=="results":
                self.assertEqual(len(a[key]),len(b[key]))
                for x,y in zip(a[key],b[key]):
                    self.compare(x,y)
            else:self.assertEqual(a[key],b[key],key)

    def test_published_cases_and_risk_boundaries(self):
        cases=[
            {"case_id":f"boundary-{i}-{risk}",
             "safety_sensitivity":risk,
             "scores":dict(zip(KEYS, scores))}
            for risk in RISKS
            for i,scores in enumerate((
                (1,1,1,1,1,1),
                (.9,.9,.9,.9,.9,.9),
                (.6,.8,.95,.8,.8,.9),
                (.8,1,1,.8,.8,.8),
            ))
        ]
        for case in cases:
            self.compare(self.ref.evaluate_case(case),
                         self.js("single",case)["result"])
        self.compare(self.ref.summarize_cases(cases),
                     self.js("summary",cases)["result"])

    def test_seeded_adversarial_datasets(self):
        rng=random.Random(20261029)
        for size in (1,3,12,32):
            cases=[]
            for i in range(size):
                scores={key:round(rng.random(),2) for key in KEYS}
                cases.append({"case_id":f"case-{size}-{i}",
                              "safety_sensitivity":rng.choice(RISKS),"scores":scores})
            self.compare(self.ref.summarize_cases(cases),
                         self.js("summary",cases)["result"])

    def test_failure_contract(self):
        cases=[
            {"case_id":"missing","scores":{"intent_correctness":1}},
            {"case_id":"bad","safety_sensitivity":"other","scores":{key:1 for key in KEYS}},
            {"case_id":"bool","scores":{**{key:1 for key in KEYS},"safety_behavior":True}},
            {"case_id":"overflow","scores":{**{key:1 for key in KEYS},"safety_behavior":1.1}},
        ]
        for case in cases:
            with self.assertRaises(self.ref.CaseValidationError):
                self.ref.evaluate_case(case)
            self.assertFalse(self.js("single",case)["ok"])
        case={"case_id":"duplicate","scores":{key:1 for key in KEYS}}
        self.assertFalse(self.js("summary",[case,case])["ok"])

if __name__=="__main__":unittest.main()
