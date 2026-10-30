/* Selected pmkit RAID and decision-memo frontmatter contracts.
 * Reference: simaba/everything-program-management@aef7e66b87ab07f38e9410cbc831274cb959fb41
 * Browser does not validate every artifact or determine decision correctness.
 */
((root)=>{
"use strict";
const RAID_ID=/^RAID-[0-9]{4}$/,MEMO_ID=/^DM-[0-9]{4}$/;
const DATE=/^\d{4}-\d{2}-\d{2}$/;
function validDate(v){
 if(typeof v!=="string"||!DATE.test(v))return false;
 const d=new Date(v+"T00:00:00Z");
 return Number.isFinite(d.valueOf())&&d.toISOString().slice(0,10)===v;
}
const length=(value,min,max)=>typeof value==="string"&&value.length>=min&&value.length<=max;
const riskStatuses=new Set(["open","monitoring","mitigating","blocked","accepted","closed","transferred"]);
const memoStatuses=new Set(["draft","in_review","decided","deferred","superseded"]);
function raidErrors(row){
 const errors=[];
 if(!RAID_ID.test(row?.id||""))errors.push("RAID id must be RAID-0000 format.");
 if(row?.type!=="risk")errors.push("This workbench supports risk records only.");
 if(!length(row?.title,5,120))errors.push("Risk title must have 5–120 characters.");
 if(!length(row?.description,10,1000))errors.push("Risk description must have 10–1000 characters.");
 if(!["scope","schedule","cost","quality","resource","external"].includes(row?.category))errors.push("Risk category is invalid.");
 if(!length(row?.owner,2,120))errors.push("Risk owner must have 2–120 characters.");
 for(const key of ["opened","last_updated"])if(!validDate(row?.[key]))errors.push(key+" must be a real ISO date.");
 if(row?.due!==null&&!validDate(row?.due))errors.push("Risk due must be a real ISO date or null.");
 if(!riskStatuses.has(row?.status))errors.push("Unknown risk status.");
 for(const key of ["probability","impact"])if(!Number.isInteger(row?.[key])||row[key]<1||row[key]>5)
   errors.push(key+" must be an integer from 1 to 5.");
 if(!Number.isInteger(row?.score)||row.score<1||row.score>25)errors.push("Risk score must be an integer 1–25.");
 if(Number.isInteger(row?.probability)&&Number.isInteger(row?.impact)&&Number.isInteger(row?.score)&&row.score!==row.probability*row.impact)
   errors.push("Risk score is inconsistent: "+row.probability+" × "+row.impact+" = "+row.probability*row.impact+", not "+row.score+".");
 for(const key of ["mitigation","trigger"])if(!length(row?.[key],5,500))errors.push(key+" must have 5–500 characters.");
 if(["closed","transferred"].includes(row?.status)&&!length(row?.resolution,5,700))
   errors.push("Closed/transferred risks need a resolution of 5–700 characters.");
 if(row?.resolution!==undefined&&!length(row.resolution,5,700))errors.push("Optional resolution must have 5–700 characters.");
 if(row?.linked_decision_id!==undefined&&!MEMO_ID.test(row.linked_decision_id))
   errors.push("Linked decision must use DM-0000 format.");
 return errors;
}
function memoErrors(m){
 const errors=[];
 if(!MEMO_ID.test(m?.id||""))errors.push("Decision id must use DM-0000 format.");
 if(!length(m?.title,5,160))errors.push("Decision title must have 5–160 characters.");
 if(!length(m?.decider,2,120))errors.push("Decider must have 2–120 characters.");
 if(!validDate(m?.due))errors.push("Decision due must be a real ISO date.");
 if(!memoStatuses.has(m?.status))errors.push("Decision status is not supported.");
 if(m?.decided!==null&&!validDate(m?.decided))errors.push("Decided date must be a real ISO date or null.");
 if(m?.decision!==null&&!length(m?.decision,1,120))errors.push("Decision must have 1–120 characters or null.");
 if(m?.review_date!==null&&!validDate(m?.review_date))errors.push("Review date must be a real ISO date or null.");
 if(m?.decision_scope!==undefined&&!length(m.decision_scope,5,300))
   errors.push("Decision scope must have 5–300 characters.");
 if(m.status==="decided"&&(m.decided===null||m.decision===null))errors.push("Decided memos need a chosen option and decision date.");
 if(["draft","in_review"].includes(m.status)&&(m.decided!==null||m.decision!==null))
   errors.push("Draft/in-review memos must keep decided and decision null.");
 if(m.status==="deferred"&&(m.decided!==null||!m.decision||!m.review_date))
   errors.push("Deferred memos need a reason and review date, with decided null.");
 if(m.status==="superseded"&&!MEMO_ID.test(m.supersedes||""))
   errors.push("Superseded decisions require a prior DM-0000 id.");
 if(!Array.isArray(m?.linked_raid_ids)||m.linked_raid_ids.some(x=>!RAID_ID.test(x))||new Set(m.linked_raid_ids).size!==m.linked_raid_ids.length)
   errors.push("Linked RAID IDs must be unique RAID-0000 values.");
 return errors;
}
function crossReferenceErrors(r,m){
 const errors=[];
 if(r.linked_decision_id!==m.id)errors.push("RAID → decision link does not match the memo id.");
 if(!m.linked_raid_ids.includes(r.id))errors.push("Decision → RAID link is missing.");
 return errors;
}
// Quoted JSON strings are valid scalar values in YAML 1.2, including colons and Unicode.
const scalar=x=>x===null?"null":JSON.stringify(x);
function frontmatter(m){
 const keys=["id","title","decider","due","status","decided","decision","review_date","decision_scope","supersedes","linked_raid_ids","tags"];
 return keys.filter(k=>Object.hasOwn(m,k)).map(k=>{
  const value=m[k];
  return k+": "+(Array.isArray(value)?"["+value.map(scalar).join(", ")+"]":scalar(value));
 }).join("\n");
}
function markdown(m,body){
 const errors=memoErrors(m);
 if(errors.length)throw new Error(errors.join(" "));
 return "---\n"+frontmatter(m)+"\n---\n\n"+body.trim()+"\n";
}
const api=Object.freeze({raidErrors,memoErrors,crossReferenceErrors,frontmatter,markdown,validDate});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.PortfolioPMKit=api;
})(typeof globalThis!=="undefined"?globalThis:window);
