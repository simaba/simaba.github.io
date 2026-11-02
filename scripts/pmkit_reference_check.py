"""Validate browser-generated linked fictional artifacts with the pinned Python pmkit source.
This does not authenticate evidence or judge the recommendation.
"""
import os
from pathlib import Path
import sys
def check_exports(raid_path,memo_path):
    root=os.environ.get("PMKIT_REFERENCE_ROOT")
    if not root:
        raise AssertionError("Pinned pmkit checkout is required for this source-contract check")
    path=(Path(__file__).resolve().parents[1]/root).resolve()
    assert (path/"src/pmkit/validators.py").is_file(),"Pinned pmkit validator checkout missing"
    sys.path.insert(0,str(path/"src"))
    from pmkit.validators import validate_json_file,validate_markdown_frontmatter
    risk=validate_json_file(raid_path,path/"schemas/raid-row.schema.json")
    memo=validate_markdown_frontmatter(memo_path,path/"schemas/decision-memo-frontmatter.schema.json")
    assert not risk,("RAID source validator rejected export: "+repr(risk))
    assert not memo,("Memo source validator rejected export: "+repr(memo))
