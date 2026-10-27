#!/usr/bin/env python3
"""Compare six full-page viewport screenshots against human-reviewed baselines."""
from pathlib import Path
from PIL import Image,ImageChops
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/"tests/visual-baseline"
QA=ROOT/".qa"
REQUIRED=("desktop.png","desktop-dark.png","tablet.png","mobile.png","mobile-dark.png","small-mobile.png")
def compare():
    if not any((BASE/name).is_file() for name in REQUIRED):
        print("NOT APPROVED: screenshots captured for human inspection; no published baseline")
        return
    missing=[name for name in REQUIRED if not (BASE/name).is_file()]
    if missing: raise RuntimeError("Incomplete visual baseline: "+", ".join(missing))
    errors=[]
    for name in REQUIRED:
        with Image.open(BASE/name) as old,Image.open(QA/name) as new:
            if old.size!=new.size:
                errors.append(f"{name}: geometry changed {old.size} → {new.size}");continue
            img=ImageChops.difference(old.convert("RGB"),new.convert("RGB")).convert("L")
            fraction=sum(img.histogram()[32:]) / (old.width*old.height)
            print(f"{name}: {fraction:.2%} significant pixel changes")
            if fraction>0.03: errors.append(f"{name}: {fraction:.2%} > allowed 3% pixel difference")
    if errors: raise RuntimeError("Visual regression check failed: "+"; ".join(errors))
if __name__=="__main__": compare()
