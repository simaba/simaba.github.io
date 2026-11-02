"""Test source-parity for published and hypothetical Agent Simulator transitions.

Hosted CI retrieves the pinned public repository revision and runs its own Python
controller. Browser overrides are modeled as injected fixture evidence (the source
controller is not modified).
"""
import copy
from dataclasses import asdict
import json
import os
from pathlib import Path
import random
import subprocess
import sys
import unittest
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[1]
SRC=os.environ.get("AGENT_REFERENCE_SRC","")
CRITERIA=("task_complete","output_present","boundary_respected")
FALLBACK=("output_present","boundary_respected","fallback_is_bounded")

@unittest.skipUnless(SRC and (ROOT/SRC/"controller.py").is_file(),
    "Pinned Python source checkout required for reference parity")
class SimulatorParity(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        sys.path.insert(0,str(ROOT/SRC))
        import controller
        cls.controller=controller

    def browser(self,scenario,experiment=None):
        proc=subprocess.run(["node",str(ROOT/"tests/simulator_eval_cli.cjs")],
            input=json.dumps({"scenario":scenario,"experiment":experiment or {}}),
            capture_output=True,text=True,check=True)
        obj=json.loads(proc.stdout)
        self.assertTrue(obj["ok"],obj)
        return obj["report"]

    def python(self,scenario,experiment=None):
        experiment=experiment or {}
        source=self.controller
        config=copy.deepcopy(source.SCENARIOS[scenario])
        config["max_attempts"]=experiment.get("max_attempts",config["max_attempts"])
        fallback=experiment.get("fallback_evidence")
        if fallback is not None and config["fallback"]:
            config["fallback"]["evidence"]=dict(zip(FALLBACK,fallback))
        original=source.ExecutorAgent.act
        def executor(self,name,attempt):
            value=original(self,name,attempt)
            edited=(experiment.get("attempts") or [])
            if attempt-1<len(edited):
                override=edited[attempt-1]
                return source.ExecutorResult(
                    output=value.output,
                    evidence=dict(zip(CRITERIA,override["evidence"])),
                    reported_confidence=override["confidence"])
            return value
        with patch.dict(source.SCENARIOS,{scenario:config}),patch.object(source.ExecutorAgent,"act",executor):
            result=source.run_scenario(scenario)
        return asdict(result)

    def compare(self,scenario,experiment=None):
        expected=self.python(scenario,experiment)
        actual=self.browser(scenario,experiment)
        self.assertEqual(expected,actual,f"{scenario} / {experiment}")

    def test_all_published_scenarios(self):
        for name in ("normal_success","retry_then_success","fallback_after_failure","escalate_after_failure"):
            with self.subTest(name=name):self.compare(name)

    def test_evidence_overrides_fallback_rejection_and_retry_limits(self):
        cases=[
          ("normal_success",{"max_attempts":1,"attempts":[{"evidence":[False,True,True],"confidence":.99}]}),
          ("retry_then_success",{"max_attempts":2,"attempts":[{"evidence":[False,True,True],"confidence":.99},{"evidence":[True,True,True],"confidence":.10}]}),
          ("fallback_after_failure",{"max_attempts":2,"fallback_evidence":[True,False,True]}),
          ("fallback_after_failure",{"max_attempts":1,"attempts":[{"evidence":[False,True,True],"confidence":.99}],"fallback_evidence":[True,True,True]}),
          ("escalate_after_failure",{"max_attempts":3,"attempts":[{"evidence":[False,True,False],"confidence":.95},{"evidence":[False,True,False],"confidence":.95},{"evidence":[True,True,True],"confidence":.33}]})
        ]
        for name,experiment in cases:
            with self.subTest(name=name,experiment=experiment):
                self.compare(name,experiment)

    def test_randomized_evidence_paths(self):
        rng=random.Random(20261029)
        for name in ("normal_success","retry_then_success","fallback_after_failure","escalate_after_failure"):
            for _ in range(10):
                n=rng.randint(1,3)
                exp={"max_attempts":n,"attempts":[
                    {"evidence":[rng.choice([True,False]) for __ in CRITERIA],
                     "confidence":round(rng.random(),2)} for _ in range(n)]}
                if name=="fallback_after_failure":
                    exp["fallback_evidence"]=[rng.choice([True,False]) for __ in FALLBACK]
                self.compare(name,exp)

if __name__=="__main__":unittest.main()
