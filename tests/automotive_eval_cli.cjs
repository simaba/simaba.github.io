"use strict";
const fs=require("node:fs");
const core=require("../assets/automotive-core.js");
const payload=JSON.parse(fs.readFileSync(0,"utf8"));
try{
  const result=payload.operation==="single"?core.evaluateCase(payload.case):
    core.summarizeCases(payload.cases);
  process.stdout.write(JSON.stringify({ok:true,result})+"\n");
}catch(error){
  process.stdout.write(JSON.stringify({ok:false,error:String(error.message||error)})+"\n");
}
