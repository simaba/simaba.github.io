#!/usr/bin/env python3
"""Fetch only an explicit allowlist of public repositories; atomically replace snapshot on full success."""
from __future__ import annotations
import argparse
import datetime
import json
import os
from pathlib import Path
import re
import tempfile
import urllib.request
ROOT=Path(__file__).resolve().parents[1]
SNAP=ROOT/"data/public-metadata.json"
def extract(payload, repo):
    if not isinstance(payload,dict): raise ValueError("Malformed API response")
    if payload.get("full_name")!="simaba/"+repo or payload.get("owner",{}).get("login")!="simaba": raise ValueError("Wrong owner")
    if payload.get("private") is not False or payload.get("visibility","public")!="public": raise ValueError("Not public")
    def count(v): return v if type(v)==int and 0<=v<=1000000000 else 0
    return {"updated_at":payload.get("pushed_at") if isinstance(payload.get("pushed_at"),str) else None,"stars":count(payload.get("stargazers_count")),"forks":count(payload.get("forks_count")),"language":str(payload.get("language") or "")[:40],"archived":payload.get("archived") is True}
def sync(best_effort=False):
    projects=json.loads((ROOT/"data/projects.json").read_text("utf-8"))["projects"]
    repos=sorted({p["repo"] for p in projects})
    if any(not re.fullmatch(r"[A-Za-z0-9._-]+",x) for x in repos): raise ValueError("Invalid allowlist")
    snapshot={}; errors=[]
    for name in repos:
        url="https://api.github.com/repos/simaba/"+name
        headers={"Accept":"application/vnd.github+json","User-Agent":"simaba-curated-portfolio/1","X-GitHub-Api-Version":"2022-11-28"}
        token=os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN")
        if token: headers["Authorization"]="Bearer "+token
        try:
            with urllib.request.urlopen(urllib.request.Request(url,headers=headers),timeout=15) as response:
                if response.geturl()!=url: raise ValueError("Unexpected redirect")
                snapshot[name]=extract(json.load(response),name)
        except (OSError, ValueError,TimeoutError,json.JSONDecodeError) as e:
            errors.append(f"{name}: {e}")
    if errors:
        print("Metadata refresh failed; previous complete snapshot retained:",*errors,sep="\n")
        if best_effort: return False
        raise RuntimeError("Metadata refresh failed: "+str(len(errors))+" errors")
    result={"schema_version":1,"fetched_at":datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),"repositories":snapshot}
    with tempfile.NamedTemporaryFile("w",encoding="utf-8",dir=SNAP.parent,delete=False) as fp:
        json.dump(result,fp,ensure_ascii=False,sort_keys=True,indent=2);fp.write("\n");tmp=Path(fp.name)
    tmp.replace(SNAP)
    print("Refreshed",len(snapshot),"verified public repository records")
    return True
if __name__=="__main__":
    ap=argparse.ArgumentParser();ap.add_argument("--best-effort",action="store_true")
    args=ap.parse_args();sync(best_effort=args.best_effort)
