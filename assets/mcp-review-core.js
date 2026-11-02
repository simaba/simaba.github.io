/* Source-contract counterpart for MCP Risk Checklist review records.
 * simaba/mcp-agent-risk-checklist@83a5abc45acf2184edfa1385e8895700d4c71b30
 * Structural validation mirrors schemas/mcp-risk-review.schema.json.
 * Semantic review notes below are advisory and NOT part of that JSON Schema.
 */
((root)=>{
"use strict";
const statuses=["draft","in_review","approved_with_conditions","blocked"];
const areas=["tool_scope","permissions","data_exposure","prompt_injection","auditability","failure_modes","human_oversight"];
const levels=["low","medium","high","critical"];
const findingStatuses=["open","mitigating","accepted","blocked"];
const recordKeys=["review_id","system_name","scope","review_status","findings"];
const findingKeys=["id","area","finding","likelihood","impact","risk_level","mitigation","owner","status"];
const strings=["id","finding","mitigation","owner"];
const isObject=x=>x!==null&&typeof x==="object"&&!Array.isArray(x);
function validate(record){
 const errors=[];
 if(!isObject(record))return ["Review must be a JSON object."];
 for(const key of Object.keys(record))
   if(!recordKeys.includes(key))errors.push("review."+key+": unexpected field.");
 for(const key of recordKeys)
   if(!Object.hasOwn(record,key))errors.push("review."+key+": required.");
 for(const key of ["review_id","system_name","scope"])
   if(Object.hasOwn(record,key)&&(typeof record[key]!=="string"||record[key].length<1))
     errors.push("review."+key+": expected a nonempty string.");
 if(Object.hasOwn(record,"review_status")&&!statuses.includes(record.review_status))
   errors.push("review.review_status: invalid status.");
 if(Object.hasOwn(record,"findings")){
   if(!Array.isArray(record.findings)||record.findings.length<1)
     errors.push("review.findings: expected at least one finding.");
   else record.findings.forEach((f,i)=>{
     const prefix="findings["+i+"]";
     if(!isObject(f)){errors.push(prefix+": expected object.");return;}
     for(const key of Object.keys(f))
       if(!findingKeys.includes(key))errors.push(prefix+"."+key+": unexpected field.");
     for(const key of findingKeys)
       if(!Object.hasOwn(f,key))errors.push(prefix+"."+key+": required.");
     for(const key of strings)
       if(Object.hasOwn(f,key)&&(typeof f[key]!=="string"||f[key].length<1))
         errors.push(prefix+"."+key+": expected nonempty string.");
     for(const key of ["likelihood","impact"])
       if(Object.hasOwn(f,key)&&(!Number.isInteger(f[key])||f[key]<1||f[key]>5))
         errors.push(prefix+"."+key+": integer from 1 to 5 required.");
     for(const [key,choices] of [["area",areas],["risk_level",levels],["status",findingStatuses]])
       if(Object.hasOwn(f,key)&&!choices.includes(f[key]))
         errors.push(prefix+"."+key+": unknown "+key+".");
   });
 }
 return errors;
}
function review(record){
 const structural=validate(record);
 const advisory=[];
 if(structural.length)return {schema_valid:false,structural,advisory,findings_count:0,open_count:0,high_count:0};
 const ids=new Set();
 for(const f of record.findings){
   if(ids.has(f.id))advisory.push("Duplicate finding ID "+f.id+" obscures traceability (additional reviewer safeguard).");
   ids.add(f.id);
   if(f.status==="accepted"&&!f.mitigation.trim())
     advisory.push(f.id+": accepted risk lacks a stated treatment or acceptance rationale.");
   if(f.status==="blocked"&&record.review_status==="approved_with_conditions")
     advisory.push(f.id+": blocked finding conflicts with conditional approval; requires explicit review.");
   if(f.risk_level==="critical"&&f.status==="open"&&record.review_status==="approved_with_conditions")
     advisory.push(f.id+": unresolved critical finding requires independent authority review.");
 }
 if(record.review_status==="approved_with_conditions"&&record.findings.some(f=>f.status==="open"))
   advisory.push("Conditional approval with open findings requires explicitly documented scope and acceptance authority.");
 return {schema_valid:true,structural:[],advisory,findings_count:record.findings.length,
  open_count:record.findings.filter(f=>f.status==="open"||f.status==="blocked").length,
  high_count:record.findings.filter(f=>f.risk_level==="high"||f.risk_level==="critical").length};
}
const example=Object.freeze({
 review_id:"MCP-FIC-001",system_name:"Fictional Read-Only Knowledge Helper",
 scope:"A fictional MCP server exposes a read-only search tool over a synthetic document collection. No external network access or write-capable tools are enabled.",
 review_status:"approved_with_conditions",
 findings:[
 {id:"F-001",area:"permissions",finding:"The fictional helper should use a dedicated read-only identity instead of a general workspace identity.",
 likelihood:3,impact:4,risk_level:"high",mitigation:"Use a dedicated least-privilege identity limited to the synthetic collection and document a revocation path.",owner:"Fictional Platform Owner",status:"mitigating"},
 {id:"F-002",area:"prompt_injection",finding:"Retrieved fictional content could contain instructions that attempt to influence tool selection.",
 likelihood:3,impact:3,risk_level:"medium",mitigation:"Treat retrieved text as untrusted content, enforce an allowlist of read-only tools, and require confirmation before any future high-impact action.",owner:"Fictional Security Reviewer",status:"open"},
 {id:"F-003",area:"auditability",finding:"The fictional prototype needs an event record for tool name, actor, parameter summary, allow/deny decision, and result category.",
 likelihood:2,impact:3,risk_level:"medium",mitigation:"Add privacy-aware audit logging and define retention/access rules before using non-synthetic data.",owner:"Fictional Operations Owner",status:"open"}
 ]});
const clone=x=>JSON.parse(JSON.stringify(x));
const api=Object.freeze({statuses,areas,levels,findingStatuses,validate,review,example,clone});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.PortfolioMCPReview=api;
})(typeof globalThis!=="undefined"?globalThis:window);
