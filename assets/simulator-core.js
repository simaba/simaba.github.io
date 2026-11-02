/* Deterministic Agent System Simulator, browser counterpart of
 * simaba/agent-simulator@8fa1bce9994f33e428592555d35acff79663f602.
 * The published fixtures run exactly as in the Python controller.
 * Optional evidence overrides are hypothetical user experiments, not source fixtures.
 */
((root)=>{
"use strict";
const criteria=["task_complete","output_present","boundary_respected"];
const fallbackCriteria=["output_present","boundary_respected","fallback_is_bounded"];
const obj=(task,output,evidence,confidence)=>({task,output,evidence,confidence});
const SCENARIOS=Object.freeze({
 normal_success:{
   task:"Summarize a straightforward support request.",max_attempts:2,latency_ms:420,cost_usd:.011,
   consistency_note:"Deterministic scenario fixture; no empirical repeated-run claim is made.",
   attempts:[obj(null,"Completed successfully on first pass.",[true,true,true],.93)],
   fallback:null},
 retry_then_success:{
   task:"Handle a partially ambiguous user request.",max_attempts:2,latency_ms:710,cost_usd:.019,
   consistency_note:"The first fixture fails task-completeness evidence; the second demonstrates every required criterion.",
   attempts:[
     obj(null,"Initial result is incomplete.",[false,true,true],.91),
     obj(null,"Improved result accepted after retry.",[true,true,true],.72)],
   fallback:null},
 fallback_after_failure:{
   task:"Handle a request that repeatedly fails the primary path.",max_attempts:2,latency_ms:650,cost_usd:.015,
   consistency_note:"The fallback is a separate controlled path with its own observable acceptance criteria.",
   attempts:[obj(null,"Primary path failed to produce a complete result.",[false,true,true],.88),
             obj(null,"Primary path failed to produce a complete result.",[false,true,true],.88)],
   fallback:{output:"Fallback path used: provide a bounded minimal response and stop.",evidence:[true,true,true]}},
 escalate_after_failure:{
   task:"Handle a high-impact request that repeatedly fails validation.",max_attempts:2,latency_ms:680,cost_usd:.016,
   consistency_note:"Escalation occurs because the required boundary evidence is absent and no authorized fallback exists.",
   attempts:[obj(null,"High-impact path could not demonstrate the required boundary control.",[false,true,false],.95),
             obj(null,"High-impact path could not demonstrate the required boundary control.",[false,true,false],.95)],
   fallback:null}
});
function sourceAttempt(name,i){
 const scenario=SCENARIOS[name];
 if(!scenario)throw Error("Unknown scenario: "+name+". Available scenarios: "+Object.keys(SCENARIOS).sort().join(", "));
 // Python ExecutorAgent normal_success returns successful evidence for any attempt;
 // retry_then_success uses its second fixture for every attempt after the first.
 if(name==="normal_success")return scenario.attempts[0];
 return scenario.attempts[Math.min(i,scenario.attempts.length-1)];
}
function validateFlags(list,n,label){
 if(!Array.isArray(list)||list.length!==n||list.some(v=>typeof v!=="boolean"))
   throw Error(label+" must contain "+n+" evidence booleans");
}
function runScenario(name,experiment={}){
 if(!Object.hasOwn(SCENARIOS,name))throw Error("Unknown scenario: "+name);
 if(!experiment||typeof experiment!=="object"||Array.isArray(experiment))throw Error("invalid experiment");
 const scenario=SCENARIOS[name],limit=experiment.max_attempts??scenario.max_attempts;
 if(!Number.isInteger(limit)||limit<1||limit>5)throw Error("max_attempts must be an integer from 1 to 5");
 if(experiment.attempts!==undefined&&(!Array.isArray(experiment.attempts)||experiment.attempts.length>5))
   throw Error("attempt overrides must be an array of at most five entries");
 const trace=[],decision_log=[];
 const log=(kind,text)=>{trace.push({kind,text});decision_log.push(text);};
 log("plan","Planner created plan: Handle task with bounded workflow: "+scenario.task);
 let attempts=0,failed_attempts=0,retries_requested=0,fallback_used=false,escalated=false,accepted=false,final_outcome="";
 for(let attempt=1;attempt<=limit;attempt++){
   attempts=attempt;
   const fixture=sourceAttempt(name,attempt-1),edit=experiment.attempts?.[attempt-1]||{};
   if(!edit||typeof edit!=="object"||Array.isArray(edit))throw Error("invalid attempt override");
   const evidence=edit.evidence??fixture.evidence;
   validateFlags(evidence,3,"attempt "+attempt);
   const confidence=edit.confidence??fixture.confidence;
   if(typeof confidence!=="number"||!Number.isFinite(confidence)||confidence<0||confidence>1)
     throw Error("confidence must be a number from 0 to 1");
   const ev=Object.fromEntries(criteria.map((key,i)=>[key,evidence[i]]));
   const evidence_summary=Object.keys(ev).sort().map(key=>key+"="+(ev[key]?"True":"False")).join(", ");
   log("execute","Executor attempt "+attempt+": evidence["+evidence_summary+"], self_reported_confidence="+confidence.toFixed(2)+" (recorded, not used as authorization)");
   const failed=criteria.filter(key=>ev[key]!==true);
   const reason=failed.length?"Required observable criteria were not demonstrated: "+failed.join(", "):"All required observable criteria were demonstrated.";
   log(failed.length?"reject":"accept","Evaluator decision: accepted="+(failed.length?"False":"True")+", reason="+reason);
   if(!failed.length){accepted=true;final_outcome=fixture.output;break;}
   failed_attempts++;
   if(attempt>=limit){
     if(scenario.fallback){
       const fallback=experiment.fallback_evidence??scenario.fallback.evidence;
       validateFlags(fallback,3,"fallback");
       const rejected=fallbackCriteria.filter((key,i)=>fallback[i]!==true);
       const fallbackReason=rejected.length?
         "Required observable criteria were not demonstrated: "+rejected.join(", "):
         "All required observable criteria were demonstrated.";
       log(rejected.length?"reject":"fallback",
         "Supervisor evaluated fallback contract: accepted="+(rejected.length?"False":"True")+", reason="+fallbackReason);
       if(!rejected.length){
         fallback_used=true;
         final_outcome=scenario.fallback.output;
         log("fallback","Supervisor triggered the validated fallback path.");
       }else{
         escalated=true;
         final_outcome="Escalated to human review.";
         log("escalate","Fallback failed its own acceptance contract; supervisor escalated.");
       }
     }else{
       escalated=true;
       final_outcome="Escalated to human review.";
       log("escalate","Supervisor escalated to human review.");
     }
     break;
   }
   retries_requested++;
   log("retry","Supervisor requested bounded retry.");
 }
 const report={
   scenario:name,final_outcome,accepted,attempts,failed_attempts,retries_requested,
   fallback_used,escalated,latency_ms:scenario.latency_ms,
   estimated_cost_usd:scenario.cost_usd,
   correctness_proxy:accepted?"high":fallback_used?"medium":"low",
   consistency_note:scenario.consistency_note,decision_log};
 return {report,trace,mode:Object.keys(experiment).length?"hypothetical":"published"};
}
const api=Object.freeze({SCENARIOS,criteria,fallbackCriteria,runScenario});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.PortfolioAgentSimulator=api;
})(typeof globalThis!=="undefined"?globalThis:window);
