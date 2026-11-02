"""Validate the exported browser MCP review against the pinned repository's
actual Draft 2020-12 schema; never interpret schema validity as security approval.
"""
import json
import os
from pathlib import Path

def check_review(file):
    root=os.environ.get("MCP_REFERENCE_ROOT")
    if not root:
        raise AssertionError("Pinned MCP schema checkout is required")
    src=(Path(__file__).resolve().parents[1]/root).resolve()
    schema_path=src/"schemas/mcp-risk-review.schema.json"
    if not schema_path.is_file():
        raise AssertionError("Pinned JSON Schema not available")
    from jsonschema import Draft202012Validator
    schema=json.loads(schema_path.read_text(encoding="utf-8"))
    record=json.loads(Path(file).read_text(encoding="utf-8"))
    errors=sorted(Draft202012Validator(schema).iter_errors(record),
                  key=lambda e:str(list(e.absolute_path)))
    assert not errors,[(list(e.absolute_path),e.message) for e in errors]
    return record
