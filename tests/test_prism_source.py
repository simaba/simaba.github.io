"""Verify the portfolio's complete AI Prism source snapshot against the pinned README.
The repository's section-level review ledger is not per-URL verification.
"""
import json
import os
from pathlib import Path
import re
import subprocess
import unittest
ROOT=Path(__file__).resolve().parents[1]
def catalog():
    proc=subprocess.run(["node","-e","process.stdout.write(JSON.stringify(require('./assets/prism-catalog.js')))"],
        cwd=ROOT,capture_output=True,text=True,check=True)
    return json.loads(proc.stdout)
class PrismCatalogTests(unittest.TestCase):
    def test_catalog_counts_and_integrity(self):
        d=catalog();items=d["items"]
        self.assertEqual(56,len(items))
        self.assertEqual(51,len({x["url"] for x in items}))
        self.assertEqual(10,len({x["category"] for x in items}))
        self.assertEqual(56,len({x["id"] for x in items}))
        self.assertTrue(all(x["title"] and x["description"] and x["url"].startswith("https://") for x in items))
        self.assertIn("not independently re-verified",d["provenance"])
    @unittest.skipUnless(os.environ.get("PRISM_REFERENCE_ROOT"),"Pinned README available only in hosted CI")
    def test_exact_pinned_readme_catalog(self):
        path=ROOT/os.environ["PRISM_REFERENCE_ROOT"]/"README.md"
        self.assertTrue(path.is_file())
        section="";subsection="";expected=[]
        for line in path.read_text(encoding="utf-8").splitlines():
            h2=re.fullmatch(r"## (.+)",line)
            h3=re.fullmatch(r"### (.+)",line)
            if h2:section=h2.group(1).strip();subsection="";continue
            if h3:subsection=h3.group(1).strip();continue
            m=re.match(r"^-\s+\*{0,2}\[([^\]]+)\]\((https?://[^)]+)\)",line)
            if m:expected.append({
                "id":"R-"+f"{len(expected)+1:03d}","category":section,"subsection":subsection,
                "title":m.group(1),"url":m.group(2),
                "description":"—".join(line.split("—")[1:]).strip()})
        self.assertEqual(expected,catalog()["items"])
        ledger=(ROOT/os.environ["PRISM_REFERENCE_ROOT"]/"REVIEW_STATUS.md").read_text(encoding="utf-8")
        self.assertIn("manual content freshness",ledger)
        self.assertIn("A working URL does not confirm",ledger)
if __name__=="__main__":unittest.main()
