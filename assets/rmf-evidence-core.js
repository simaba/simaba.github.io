/* Unofficial practitioner assessment extracted from the public template:
 * simaba/nist-rmf-guide @ 0776e82aec138d81aecf250cf7e98d50e2e1ef45
 * These are authored internal propositions, NEVER official NIST subcategory IDs.
 * No compliance grade, maturity score or control-effectiveness determination.
 */
((root)=>{
"use strict";
const questions=[
 ["Govern","Are decision, control, incident, and residual-risk owners authorized and current?"],
 ["Govern","Are policies, review paths, exceptions, and change triggers operating for this scope?"],
 ["Govern","Are affected-party input, accountability, and redress responsibilities defined where relevant?"],
 ["Map","Are intended use, prohibited use, users, affected populations, and environment bounded?"],
 ["Map","Are data, model, tool, supplier, and operational dependencies understood?"],
 ["Map","Are foreseeable benefits, harms, misuse, failures, and reversibility contextualized?"],
 ["Measure","Do evaluation and monitoring methods measure the stated properties for the intended population?"],
 ["Measure","Are evaluator validity, uncertainty, slices, and critical failures visible?"],
 ["Measure","Are control and outcome results traceable to the reviewed system version?"],
 ["Manage","Are risks prioritized and treated through enforceable decisions and controls?"],
 ["Manage","Are release, hold, exception, residual-risk, incident, rollback, and retirement decisions accountable?"],
 ["Manage","Are treatments monitored, tested, and changed when evidence or context changes?"]
];
const statusLabels={
 unknown:"Unknown",documented:"Documented, not demonstrated",
 partial:"Partially demonstrated",demonstrated:"Demonstrated",
 absent:"Not demonstrated",not_applicable:"Not applicable"
};
const types=["unspecified","design","operation","outcome"];
const dispositions=["unclassified","blocker","required_action","condition","defer","residual_risk","operating_model_improvement"];
const functions=["Govern","Map","Measure","Manage"];
const clone=x=>JSON.parse(JSON.stringify(x));
const limits={maxBytes:65536,maxNotes:2000};
function defaultItem([fn,proposition],index){
 return {id:"P-"+String(index+1).padStart(2,"0"),function:fn,proposition,
  source_reference:"",source_version:"",status:"unknown",evidence_type:"unspecified",
  evidence_reference:"",evidence_owner:"",evidence_date:"",coverage:"",
  limitation:"",not_applicable_rationale:"",decision_consequence:"",
  action_owner:"",action_due:"",disposition:"unclassified",invalidation_trigger:""};
}
function defaults(){
 return {schema_version:1,provenance:"Unofficial NIST AI RMF practitioner template, not official subcategory text",
  scope:{system:"Synthetic document-assistant pilot",version:"Fictional staging v0.2",
   populations:"Fictional internal reviewers; no production population",
   lifecycle_decision:"Whether to begin a bounded internal pilot",assessor:"Fictional Program Review Owner",
   evidence_cutoff:"2026-10-15",exclusions:"Production systems, external effects and sensitive records"},
  items:questions.map(defaultItem),
  conclusion:{outcome:"defer",rationale:"Evidence remains unverified and this fictional assessment cannot authorize a launch.",
   limitations:"No external controls or affected populations were independently tested.",next_review:"2026-11-15"}};
}
function validDate(x){if(typeof x!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(x))return false;
 const d=new Date(x+"T00:00:00Z");return Number.isFinite(d.valueOf())&&d.toISOString().slice(0,10)===x;}
function shapeErrors(doc){
 const errors=[];
 if(!doc||typeof doc!=="object"||Array.isArray(doc))return ["Assessment must be an object."];
 if(doc.schema_version!==1)errors.push("Unsupported internal assessment version.");
 if(!doc.scope||typeof doc.scope!=="object")errors.push("Assessment scope must be an object.");
 for(const key of ["system","version","populations","lifecycle_decision","assessor","evidence_cutoff","exclusions"]){
  if(typeof doc.scope?.[key]!=="string")errors.push("Scope."+key+" must be text.");
 }
 if(!Array.isArray(doc.items)||doc.items.length!==questions.length)errors.push("Assessment requires all 12 template propositions.");
 else doc.items.forEach((r,i)=>{
  const [fn,proposition]=questions[i];
  if(!r||typeof r!=="object"||Array.isArray(r)){errors.push("Item "+(i+1)+" is not a record.");return;}
  if(r.id!=="P-"+String(i+1).padStart(2,"0")||r.function!==fn||r.proposition!==proposition)
   errors.push("Item "+(i+1)+" does not match the pinned internal proposition.");
  if(!Object.hasOwn(statusLabels,r.status))errors.push("Item "+(i+1)+" has an unsupported status.");
  if(!types.includes(r.evidence_type))errors.push("Item "+(i+1)+" has an unsupported evidence type.");
  if(!dispositions.includes(r.disposition))errors.push("Item "+(i+1)+" has an unsupported disposition.");
  for(const key of ["source_reference","source_version","evidence_reference","evidence_owner","evidence_date",
   "coverage","limitation","not_applicable_rationale","decision_consequence","action_owner","action_due","invalidation_trigger"]){
    if(typeof r[key]!=="string")errors.push("Item "+(i+1)+" "+key+" must be text.");
  }
 });
 if(!doc.conclusion||typeof doc.conclusion!=="object")errors.push("Conclusion must be provided.");
 else{
  if(!["proceed","proceed_with_conditions","hold","redesign","defer","other"].includes(doc.conclusion.outcome))
    errors.push("Unsupported assessment outcome.");
  for(const k of ["rationale","limitations","next_review"])if(typeof doc.conclusion[k]!=="string")
    errors.push("Conclusion."+k+" must be text.");
 }
 return errors;
}
function review(doc){
 const errors=shapeErrors(doc),notes=[],gaps=[],strengths=[];
 if(errors.length)return {errors,notes,gaps,strengths,counts:{},valid:false};
 for(const key of ["system","version","populations","lifecycle_decision","assessor","exclusions"])
  if(!doc.scope[key].trim())notes.push("Scope: "+key.replaceAll("_"," ")+" remains unspecified.");
 if(!validDate(doc.scope.evidence_cutoff))errors.push("Scope: provide a valid evidence cutoff date.");
 if(!validDate(doc.conclusion.next_review))errors.push("Conclusion: provide a valid next-review date.");
 if(!doc.conclusion.rationale.trim())errors.push("Decision rationale is required, even for defer.");
 if(!doc.conclusion.limitations.trim())notes.push("Conclusions should disclose unrepresented groups and methodological limitations.");
 for(const item of doc.items){
  const prefix=item.id+" / "+item.function;
  if(item.status==="demonstrated"){
   for(const key of ["source_reference","source_version","evidence_reference","evidence_owner","coverage"])
    if(!item[key].trim())errors.push(prefix+": demonstrated requires "+key.replaceAll("_"," ")+".");
   if(!validDate(item.evidence_date))errors.push(prefix+": demonstrated requires a valid evidence date.");
   if(item.evidence_type==="unspecified")errors.push(prefix+": distinguish design, operation, or outcome evidence.");
   strengths.push(item);
  }else if(item.status==="not_applicable"){
   if(item.not_applicable_rationale.trim().length<15)
    errors.push(prefix+": not applicable requires a substantial, scoped rationale.");
   if(!item.source_reference.trim()||!item.source_version.trim())
    errors.push(prefix+": not applicable requires a verified official source reference and version.");
  }else if(item.status==="partial"||item.status==="documented"){
   if(!item.evidence_reference.trim())notes.push(prefix+": supporting or design evidence has no provenance.");
  }
  if(item.evidence_date&&!validDate(item.evidence_date))errors.push(prefix+": evidence date must be a real ISO date.");
  if(item.action_due&&!validDate(item.action_due))errors.push(prefix+": action due must be a real ISO date.");
  if(item.status!=="demonstrated"&&item.status!=="not_applicable"){
   gaps.push(item);
   if(item.disposition!=="unclassified"&&(!item.action_owner.trim()||!item.decision_consequence.trim()||!item.invalidation_trigger.trim()))
     errors.push(prefix+": a classified gap requires consequence, action owner, and review trigger.");
  }
  if(item.source_reference&&!item.source_version.trim())
   notes.push(prefix+": recorded reference has no version; official source applicability remains unverified.");
  if(item.evidence_date&&validDate(item.evidence_date)&&item.evidence_date>doc.scope.evidence_cutoff)
   notes.push(prefix+": evidence postdates the recorded cutoff; reassess the evidence boundary.");
 }
 const counts=Object.fromEntries(Object.keys(statusLabels).map(s=>[s,doc.items.filter(x=>x.status===s).length]));
 if(["proceed","proceed_with_conditions"].includes(doc.conclusion.outcome)&&gaps.some(x=>x.disposition==="blocker"))
  errors.push("Proposed proceeding conflicts with a material blocker. Revisit the outcome or resolve and verify the blocker.");
 if(["proceed","proceed_with_conditions"].includes(doc.conclusion.outcome))
  notes.push("Proceeding is only a fictional proposed outcome. The worksheet cannot verify actual evidence or authorize deployment.");
 return {errors,notes,gaps,strengths,counts,valid:!errors.length};
}
const cell=s=>String(s||"").replace(/\|/g,"\\|").replace(/\r?\n/g," ");
function markdown(doc,result){
 const lines=[
 "# Fictional AI RMF Evidence and Gap Assessment",
 "",
 "> Unofficial practitioner aid based on the selected source template. Internal questions are not official NIST subcategory text. No compliance, implementation or maturity rating.",
 "",
 "## 1. Assessment scope",
 ...Object.entries(doc.scope).map(([k,v])=>"- **"+k.replaceAll("_"," ")+":** "+v),
 "",
 "## 2. Authoritative references selected",
 "Official NIST category/subcategory references and versions must be verified for the specific system.",
 "",
 "## 3. Evidence states",
 "Demonstrated / Partially demonstrated / Documented, not demonstrated / Not demonstrated / Not applicable / Unknown.",
 "",
 "## 4. Evidence-quality fields",
 "For each item distinguish design, operation and outcome; record provenance, version, owner, date, population, limitations and invalidation trigger.",
 ""
 ];
 for(const fn of functions){
  lines.push("## "+fn+" review","",
   "| Internal proposition | Official reference/version | Evidence basis | Evidence state | Limitation / gap | Consequence | Owner / due |",
   "|---|---|---|---|---|---|---|");
  for(const item of doc.items.filter(x=>x.function===fn))
   lines.push("| "+[item.proposition,
     [item.source_reference,item.source_version].filter(Boolean).join(" · "),
     [item.evidence_type,item.evidence_reference,item.evidence_owner,item.evidence_date,item.coverage].filter(x=>x&&x!=="unspecified").join(" · "),
     statusLabels[item.status],item.status==="not_applicable"?item.not_applicable_rationale:item.limitation,
     item.decision_consequence,[item.action_owner,item.action_due].filter(Boolean).join(" / ")
   ].map(cell).join(" | ")+" |");
  lines.push("");
 }
 lines.push("## 9. Material gaps and dependencies","",
 "| ID | Function | Decision consequence | Evidence required / limitation | Disposition | Owner | Due / trigger |",
 "|---|---|---|---|---|---|---|");
 for(const item of result.gaps)
  lines.push("| "+[item.id,item.function,item.decision_consequence,item.limitation,item.disposition,item.action_owner,
   [item.action_due,item.invalidation_trigger].filter(Boolean).join(" / ")].map(cell).join(" | ")+" |");
 lines.push("","## 10. Strengths and reusable evidence","");
 for(const item of result.strengths)lines.push("- "+item.id+": "+item.evidence_reference+" ("+item.coverage+"), subject to source/freshness verification.");
 lines.push("","## 11. Decision and improvement plan","",
 "**Proposed outcome:** "+doc.conclusion.outcome,
 "**Rationale:** "+doc.conclusion.rationale,
 "**Next review:** "+doc.conclusion.next_review,"",
 "## 12. Assessment limitations",doc.conclusion.limitations,"",
 "### Review observations",
 ...result.notes.map(x=>"- "+x),"",
 "*Evidence states are user-entered and unverified. Official NIST material remains authoritative.*");
 return lines.join("\n")+"\n";
}
const api=Object.freeze({questions,functions,statusLabels,types,dispositions,defaults,shapeErrors,review,markdown,clone});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.PortfolioRMF=api;
})(typeof globalThis!=="undefined"?globalThis:window);
