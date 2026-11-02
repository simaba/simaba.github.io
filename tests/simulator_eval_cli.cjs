"use strict";
const fs=require("node:fs");
const engine=require("../assets/simulator-core.js");
const payload=JSON.parse(fs.readFileSync(0,"utf8"));
try {
  process.stdout.write(JSON.stringify({ok:true,report:engine.runScenario(payload.scenario,payload.experiment??{}).report})+"\n");
}catch(error){
  process.stdout.write(JSON.stringify({ok:false,error:String(error.message||error)})+"\n");
}
