"use strict";
const fs=require("node:fs");
const core=require("../assets/prompt-translation-core.js");
const payload=JSON.parse(fs.readFileSync(0,"utf8"));
try{
 const parsed=core.parseSource(payload.source);
 const outputs=Object.fromEntries(core.targets.map(target=>[target,core.convert(parsed,target)]));
 process.stdout.write(JSON.stringify({ok:true,parsed,outputs})+"\n");
}catch(error){
 process.stdout.write(JSON.stringify({ok:false,error:String(error.message||error)})+"\n");
}
