"""Validate browser-generated JSON (valid YAML) using the pinned public source
release-checklist validator. This checks internal structure, never evidentiary merit.
"""
import os
from pathlib import Path
import sys
def check_release(path,strict=False,expected_supported=None):
    root=os.environ.get("RELEASE_REFERENCE_ROOT")
    if not root:raise AssertionError("Pinned release source checkout is required")
    root=(Path(__file__).resolve().parents[1]/root).resolve()
    assert (root/"src/airc/validator.py").is_file(),"Pinned source missing"
    sys.path.insert(0,str(root/"src"))
    from airc.validator import validate_checklist
    result=validate_checklist(Path(path),strict=strict)
    assert result.configuration_valid
    if expected_supported is not None:
        assert result.passed==expected_supported,(result.outcome,result.failed_count,strict)
    return result
