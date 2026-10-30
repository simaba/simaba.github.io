/* Decision-review and executive handoff helpers.
 * Method references: everything-program-management/skills/{decision-memo,risk-triage,executive-summary-brief}/SKILL.md
 * This is an advisory review of fictional examples, not the source pmkit schema or an approval engine.
 */
((root)=>{
"use strict";
const allowed=new Set(["documented","estimated","assumed","unknown"]);
const gate=new Set(["supported","unverified","failed"]);
const optionIds=new Set(["Option A","Option B"]);
const text=(v)=>typeof v==="string"?v.trim():"";
function review(input){
 const required=[],warnings=[];
 if(!input||typeof input!=="object")return {ready:false,blocking:["Review inputs are missing."],warnings:[],trace:[]};
 const state=input.status||"in_review";
 const selected=optionIds.has(input.choice)?input.choice:null;
 const a=input.options?.A||{},b=input.options?.B||{};
 if(!gate.has(a.constraint)||!gate.has(b.constraint))required.push("Record the hard-boundary evidence status for both alternatives.");
 if(!allowed.has(input.evidence_class))required.push("Classify the key evidence as documented, estimated, assumed, or unknown.");
 if(!text(input.evidence_reference))required.push("Identify a fictional evidence source or the owner of the estimate/assumption.");
 if(!text(input.changed))required.push("Describe what changed, rather than simply repeating the risk score.");
 if(!text(input.action))required.push("Name the next evidence-gathering, mitigation or decision action.");
 if(!text(input.trigger))required.push("Name the condition that reopens the decision.");
 if(!text(input.owner))required.push("Name one accountable owner for the next action.");
 if(!input.action_date||!root.PortfolioPMKit?.validDate(input.action_date))
   required.push("Use a real ISO date for the next action.");
 if(!text(input.delay_consequence))required.push("Explain why the decision deadline matters.");
 if(!text(input.residual_risk))required.push("Disclose a material residual risk.");
 if(!selected&&state==="decided")required.push("A decided memo needs an explicit selected option.");
 const choice=selected==="Option A"?a:selected==="Option B"?b:null;
 if(state==="decided"&&choice?.constraint==="failed")
   required.push("The selected option fails a declared hard boundary; record a different viable option or keep the memo under review.");
 if(state==="decided"&&choice?.constraint==="unverified")
   required.push("The selected option's hard boundary is not verified. A source-compatible decided memo would still need a qualified authorization review.");
 if(input.evidence_class==="estimated")warnings.push("Estimate: identify assumptions and sensitivity before relying on the value.");
 if(input.evidence_class==="assumed")warnings.push("Assumption: do not describe it as observed evidence; define the verification trigger.");
 if(input.evidence_class==="unknown")warnings.push("Evidence remains unknown; decision confidence must not be inferred.");
 if(a.constraint==="failed"&&b.constraint==="failed")
   warnings.push("Both alternatives fail declared boundaries; revisit the option set.");
 if(a.constraint!=="supported"&&b.constraint!=="supported")
   warnings.push("No demonstrated feasible alternative is shown; do not invent viability.");
 if(a.constraint==="unverified"||b.constraint==="unverified")
   warnings.push("At least one option has an unverified hard boundary.");
 if(state==="in_review"||state==="draft")
   warnings.push("This is a pending decision: a recommendation is not an authorization.");
 if(state==="deferred")warnings.push("An evidence gap requires a dated review; deferral does not resolve the risk.");
 const trace=[
  {label:"Current change",value:text(input.changed)||"Not recorded"},
  {label:"Why the decision matters",value:text(input.delay_consequence)||"Not recorded"},
  {label:"Option A boundary",value:gate.has(a.constraint)?a.constraint:"missing"},
  {label:"Option B boundary",value:gate.has(b.constraint)?b.constraint:"missing"},
  {label:"Evidence classification",value:input.evidence_class||"missing"},
  {label:"Next action",value:text(input.action)||"Not recorded"},
  {label:"Revisit condition",value:text(input.trigger)||"Not recorded"}
 ];
 return {ready:required.length===0,blocking:required,warnings,trace,
  viable_options:[...["A","B"]].filter(k=>input.options?.[k]?.constraint==="supported"),
  selected_option:selected,review_only:true};
}
function handoff(input,risk,memo,reviewResult){
 const state=memo.status,classification=state==="decided"?"Progress":state==="deferred"?"Exception":
   state==="superseded"?"FYI":"Decision";
 const select=state==="decided"?(memo.decision||"unrecorded"):"not authorized";
 const action=state==="decided"?
  "Recorded choice: "+select+". Next: "+text(input.action)+" (owner: "+text(input.owner)+", due "+input.action_date+").":
  state==="superseded"?"No new decision requested; review the successor decision record.":
  state==="deferred"?"Evidence is outstanding. "+text(input.action)+" (owner: "+text(input.owner)+", due "+input.action_date+").":
  "Decision needed from "+memo.decider+" by "+memo.due+". Next evidence step: "+text(input.action)+
  " (owner: "+text(input.owner)+", due "+input.action_date+").";
 const lines=[
 "# Fictional library pilot — executive handoff",
 "",
 "**Classification:** "+classification,
 "**Decision memo:** "+memo.id+" ("+state+")",
 "**Linked uncertainty:** "+risk.id+" ("+risk.status+")",
 "**Scope:** "+memo.decision_scope,
 "",
 "## Bottom line",
 state==="decided"?"A decision is recorded as "+select+" for the bounded fictional pilot.":
 state==="deferred"?"The decision is deferred; evidence must be obtained before reconsideration.":
 state==="superseded"?"This is a historical decision record, not a new approval request.":
 "A bounded choice remains between waiting for confirmation and using a reversible fallback.",
 "",
 "## What changed and why now",
 text(input.changed),
 text(input.delay_consequence),
 "",
 "## Evidence and constraints",
 "- Key evidence classification: **"+input.evidence_class+"**",
 "- Evidence reference / owner: "+text(input.evidence_reference),
 "- Option A declared boundary: "+input.options.A.constraint,
 "- Option B declared boundary: "+input.options.B.constraint,
 "- Risk ordinal score: "+risk.score+" (probability × impact; not expected financial loss)",
 "",
 "## Uncertainty and risks",
 "- "+text(input.residual_risk),
 "- Reopen if: "+text(input.trigger),
 ...reviewResult.warnings.map(x=>"- Review warning: "+x),
 "",
 "## Action and ownership",
 action,
 "",
 "## Source artifacts",
 "- "+risk.id+": fictional RAID risk (referenced by "+memo.id+")",
 "- "+memo.id+": fictional decision memo (links "+risk.id+")",
 "",
 "*Generated from fictional browser inputs. It does not validate external evidence or authorize a real decision.*"
 ];
 return lines.join("\n")+"\n";
}
const api=Object.freeze({review,handoff});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.PortfolioPMAnalysis=api;
})(typeof globalThis!=="undefined"?globalThis:window);
