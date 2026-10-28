/* Source-grounded browser exercises for seven other curated repositories.
 * Deliberately bounded: no server calls, real tool invocation, compliance scores,
 * automated decision authority, storage, or use of private material.
 */
(()=>{
"use strict";
const root=document.querySelector("[data-project-lab]");
if(!root)return;
const slug=root.dataset.projectLab;
const $=id=>root.querySelector("#"+id);
const v=id=>$(id).value,check=id=>$(id).checked;
const safe=(s)=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const field=(id,label,text,type="text")=>'<label class="lab-field"><span>'+safe(label)+'</span><input id="'+id+'" type="'+type+'" value="'+safe(text)+'"></label>';
const area=(id,label,text,rows=4)=>'<label class="lab-field"><span>'+safe(label)+'</span><textarea id="'+id+'" rows="'+rows+'">'+safe(text)+'</textarea></label>';
const select=(id,label,opts)=>'<label class="lab-field"><span>'+safe(label)+'</span><select id="'+id+'">'+opts.map(x=>'<option value="'+safe(x[0])+'">'+safe(x[1])+'</option>').join("")+'</select></label>';
const tick=(id,label,on=false)=>'<label class="lab-check"><input type="checkbox" id="'+id+'" '+(on?"checked":"")+'><span>'+safe(label)+'</span></label>';
const button=(id,label)=>'<button type="button" class="lab-action" id="'+id+'">'+safe(label)+'</button>';
const metric=(id,label)=>'<div><small>'+safe(label)+'</small><strong id="'+id+'">—</strong></div>';
const shell=(intro,controls,output="")=>{
root.innerHTML='<div class="lab-main"><div class="lab-controls"><p class="lab-eyebrow">WORK WITH THE SOURCE MODEL</p><p class="lab-context">'+safe(intro)+'</p>'+controls+'</div><div class="lab-output" aria-live="polite">'+output+'<p class="lab-eyebrow">INSPECTED RESULT</p><h3 id="lab-verdict"></h3><ul class="lab-findings" id="lab-findings"></ul><p class="lab-privacy">This is an illustrative browser exercise; no data is sent, stored or executed outside this page.</p></div></div>';
};
const set=(id,text)=>{$(id).textContent=String(text);};
const findings=(state,headline,items)=>{
set("lab-verdict",headline);$("lab-verdict").dataset.state=state;
const ul=$("lab-findings");ul.replaceChildren();
items.forEach(item=>{const li=document.createElement("li");li.textContent=item;ul.append(li)});
};
const exportJSON=(obj,name)=>{
const blob=new Blob([JSON.stringify(obj,null,2)+"\n"],{type:"application/json"});
const url=URL.createObjectURL(blob),a=document.createElement("a");
a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
if($("lab-export-status"))set("lab-export-status","Prepared locally; no upload was made.");
};
const note='<p id="lab-export-status" class="lab-small" aria-live="polite"></p>';
function simulator(){
const scenarios={
normal_success:{task:"Summarize a straightforward support request.",confidence:[.93],evidence:[[true,true,true]],fallback:false},
retry_then_success:{task:"Handle a partially ambiguous user request.",confidence:[.91,.72],evidence:[[false,true,true],[true,true,true]],fallback:false},
fallback_after_failure:{task:"Handle a request that repeatedly fails the primary path.",confidence:[.88,.88],evidence:[[false,true,true],[false,true,true]],fallback:true},
escalate_after_failure:{task:"Handle a high-impact request that repeatedly fails validation.",confidence:[.95,.95],evidence:[[false,true,false],[false,true,false]],fallback:false}
};
let events=[],pointer=0;
shell("Step through the four deterministic scenarios in src/scenarios.py. Each transition is decided from the published executor evidence—not its confidence value.",
select("lab-scenario","Published scenario",Object.keys(scenarios).map(s=>[s,s.replaceAll("_"," ")]))+
'<div class="lab-actions">'+button("lab-step","Next state")+button("lab-run","Run to outcome")+button("lab-reset","Reset trace")+'</div>',
'<div class="lab-metrics">'+metric("lab-step-num","STEP")+metric("lab-outcome","OUTCOME")+'</div><ol id="lab-trace" class="lab-trace"></ol>');
function prepare(){
const s=scenarios[v("lab-scenario")],criteria=["task_complete","output_present","boundary_respected"];
events=[{type:"plan",text:"Planner: "+s.task}];
let accepted=false;
for(let i=0;i<s.evidence.length;i++){
const failed=s.evidence[i].map((val,j)=>val?null:criteria[j]).filter(Boolean);
events.push({type:"exec",text:"Executor attempt "+(i+1)+": confidence "+s.confidence[i].toFixed(2)+" (not authority); evidence "+s.evidence[i].map((x,j)=>criteria[j]+"="+x).join(", ")});
events.push({type:failed.length?"fail":"pass",text:failed.length?"Evaluator: rejected; missing "+failed.join(", "):"Evaluator: all required observable criteria satisfied"});
if(!failed.length){events.push({type:"pass",text:"Supervisor: ACCEPT the demonstrated primary result."});accepted=true;break;}
if(i<s.evidence.length-1)events.push({type:"retry",text:"Supervisor: bounded retry requested ("+(i+1)+"/2)."});
}
if(!accepted){if(s.fallback){
events.push({type:"fallback",text:"Fallback independently checked: output_present=true, boundary_respected=true, fallback_is_bounded=true."});
events.push({type:"pass",text:"Supervisor: ACCEPT bounded fallback (not primary success)."});
}else events.push({type:"escalate",text:"Supervisor: ESCALATE to human; no authorized fallback contract."});}
pointer=0;draw();
}
function draw(){
const view=events.slice(0,pointer),list=$("lab-trace");list.replaceChildren();
for(const item of view){const li=document.createElement("li");li.dataset.kind=item.type;li.textContent=item.text;list.append(li);}
set("lab-step-num",pointer+" / "+events.length);
const final=view.at(-1),done=pointer===events.length;
const state=done?(final.type==="pass"?(final.text.includes("fallback")?"FALLBACK":"ACCEPT"):"ESCALATE"):"IN PROGRESS";
set("lab-outcome",state);
findings(done&&state==="ESCALATE"?"fail":"pass",
done?"FINAL STATE: "+state:"TRACE IN PROGRESS",
done?["The final state follows the evidence and bounded supervisor transitions."]:["Use Next state to inspect each decision, or Run to outcome for the complete trace."]);
}
$("lab-step").addEventListener("click",()=>{pointer=Math.min(pointer+1,events.length);draw();});
$("lab-run").addEventListener("click",()=>{pointer=events.length;draw();});
$("lab-reset").addEventListener("click",prepare);
$("lab-scenario").addEventListener("change",prepare);
prepare();
}
function translator(){
const initial={name:"executive-summary",description:"Creates concise leadership-ready summaries.",tools:"Read, Write",model:"reasoning",instructions:"Produce a crisp executive summary with a recommendation, risks, and next steps."};
shell("Try the translator's documented sample fields. Target representations are generated locally; unlike the Python utility this editor does not parse arbitrary YAML.",
select("lab-target","Output target",[["codex","Codex"],["cursor","Cursor"],["generic","Generic YAML"]])+
field("lab-name","Asset name",initial.name)+field("lab-description","Description",initial.description)+
field("lab-tools","Source tools (comma separated)",initial.tools)+field("lab-model","Source model",initial.model)+
area("lab-instructions","Instructions",initial.instructions,5)+
'<div class="lab-actions">'+button("lab-reset","Restore sample")+button("lab-download","Download target")+'</div>'+note,
'<div class="lab-metrics">'+metric("lab-loss","METADATA MAPPING")+metric("lab-target-name","TARGET")+'</div><pre class="lab-preview"><code id="lab-preview"></code></pre>');
const yaml=s=>JSON.stringify(s);
let output="";
function evaluate(){
const name=v("lab-name").trim(),description=v("lab-description").trim(),instructions=v("lab-instructions").trim(),tools=v("lab-tools").split(",").map(x=>x.trim()).filter(Boolean),model=v("lab-model").trim(),target=v("lab-target");
const errors=[];
if(!name)errors.push("Asset name is required.");
if(!instructions)errors.push("Instructions are required.");
if(v("lab-tools").length>0&&!tools.length)errors.push("Supply a tool name or leave tools blank.");
const sourceMeta={name,description,...(tools.length?{tools}:{}),...(model?{model}:{})};
const unknown=target==="codex"?["model","tools"]:target==="cursor"?["description","model","tools"]:[];
const preserved=unknown.filter(x=>Object.hasOwn(sourceMeta,x));
const warn=preserved.length?"> **Lossy conversion warning:** this target does not natively apply all source metadata. Preserved for review: "+preserved.slice().sort().join(", ")+".\n\n":"";
const extra=preserved.map(x=>x+": "+(Array.isArray(sourceMeta[x])?"["+sourceMeta[x].map(yaml).join(", ")+"]":yaml(sourceMeta[x]))).join("\n");
if(target==="codex"){
output="# "+name+"\n\n"+warn+description+"\n\n## Instructions\n\n"+instructions+"\n"+(extra?"\n## Unmapped source metadata\n\n\`\`\`yaml\n"+extra+"\n\`\`\`\n":"");
}else if(target==="cursor"){
output="name: "+yaml(name)+"\nrule: "+yaml(instructions)+"\n"+(extra?"conversion_warning: "+yaml("Lossy conversion: review source_metadata before use; preserved, not enforced.")+"\nsource_metadata:\n"+extra.split("\n").map(x=>"  "+x).join("\n")+"\n":"");
}else output=Object.entries({...sourceMeta,instructions}).map(([key,value])=>key+": "+(Array.isArray(value)?"["+value.map(yaml).join(", ")+"]":yaml(value))).join("\n")+"\n";
set("lab-preview",errors.length?"Correct the input to produce an artifact.":output);
set("lab-loss",preserved.length?preserved.join(", "):"NONE");set("lab-target-name",target.toUpperCase());
findings(errors.length?"fail":"pass",errors.length?"SOURCE INPUT INCOMPLETE":preserved.length?"CONVERSION WITH REVIEW WARNINGS":"TARGET REPRESENTATION READY",errors.length?errors:preserved.length?["Preserved fields are not silently treated as native target configuration: "+preserved.join(", ")+".","Translation does not establish behavioral or permission equivalence."]:["All source fields are present in the bounded generic representation."]);
}
root.addEventListener("input",evaluate);root.addEventListener("change",evaluate);
$("lab-reset").addEventListener("click",()=>{for(const [key,value] of Object.entries(initial))$("lab-"+key).value=value;$("lab-target").value="codex";evaluate();});
$("lab-download").addEventListener("click",()=>{if(!v("lab-name").trim()||!v("lab-instructions").trim())return;const blob=new Blob([output],{type:"text/plain"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="translated-"+v("lab-target")+(v("lab-target")==="codex"?".md":".yaml");a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);set("lab-export-status","Prepared locally for inspection.");});
$("lab-target").value="codex";evaluate();
}
const sources=[
["Official frameworks","NIST AI RMF","NIST","https://airc.nist.gov/home","Primary","Four-function AI risk management framework and supporting resources"],
["Official frameworks","EU AI Act","European Union","https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689","Primary","Official EU legislative text; verify applicability and effective dates"],
["Official frameworks","ISO/IEC 42001","ISO","https://www.iso.org/standard/81230.html","Primary","International AI management-system standard listing"],
["Official frameworks","OECD AI Principles","OECD","https://oecd.ai/en/ai-principles","Primary","International trustworthy-AI principles"],
["Risk and security","MITRE ATLAS","MITRE","https://atlas.mitre.org/","Primary","Adversarial tactics and techniques involving AI systems"],
["Risk and security","OWASP Top 10 for LLMs","OWASP","https://genai.owasp.org/llm-top-10/","Primary","GenAI application security risks and mitigations"],
["Evaluation","HELM","Stanford CRFM","https://crfm.stanford.edu/helm/","Primary","Language-model evaluation across scenarios and measures"],
["Evaluation","LM Evaluation Harness","EleutherAI","https://github.com/EleutherAI/lm-evaluation-harness","Primary","Open-source language-model evaluation infrastructure"],
["Evaluation","Evidently AI","Evidently","https://github.com/evidentlyai/evidently","Primary","Open-source model evaluation and monitoring tools"],
["Evaluation","Microsoft PyRIT","Microsoft","https://github.com/Azure/PyRIT","Primary","Python-based generative-AI red-teaming toolkit"],
["Incident references","AI Incident Database","AIID","https://incidentdatabase.ai/","Primary","Reports and indexing of AI incidents"],
["Incident references","AI Vulnerability Database","AVID","https://avidml.org/","Primary","AI-specific failure and vulnerability taxonomy"],
["Research","Model Cards for Model Reporting","Mitchell et al.","https://arxiv.org/abs/1810.03993","Original paper","Foundational model-card documentation proposal"],
["Research","Datasheets for Datasets","Gebru et al.","https://arxiv.org/abs/1803.09010","Original paper","Dataset provenance and accountability documentation"],
["Governance guidance","Google PAIR Guidebook","Google","https://pair.withgoogle.com/guidebook/","Primary","Human-centered AI design and deployment reference"],
["Governance guidance","EU AI Act Summary","Secondary interpretation","https://artificialintelligenceact.eu/","Secondary","Explanatory summary; verify against official legal text"]
];
function prism(){
shell("Filter a selected extract of the public AI Prism resource list. These are source entries, not live-checked URLs or verified current regulatory guidance.",
field("lab-query","Search title, publisher or subject","")+
select("lab-topic","Topic",[["all","All"],...Array.from(new Set(sources.map(x=>x[0]))).map(x=>[x,x])])+
tick("lab-primary","Exclude secondary interpretations",false),
'<div class="lab-metrics">'+metric("lab-results","MATCHING SOURCES")+metric("lab-publishers","PUBLISHERS")+'</div><div class="lab-resource-list" id="lab-resources"></div>');
function update(){
const query=v("lab-query").trim().toLowerCase(),topic=v("lab-topic"),primary=check("lab-primary");
const filtered=sources.filter(s=>(topic==="all"||s[0]===topic)&&(!primary||s[4]!=="Secondary")&&(!query||s.join(" ").toLowerCase().includes(query)));
const list=$("lab-resources");list.replaceChildren();
for(const s of filtered){
const a=document.createElement("a");a.href=s[3];a.target="_blank";a.rel="noopener noreferrer";a.className="lab-resource";
const k=document.createElement("small");k.textContent=s[0]+" / "+s[2]+" / "+s[4];
const strong=document.createElement("strong");strong.textContent=s[1]+" ↗";
const summary=document.createElement("span");summary.textContent=s[5];a.append(k,strong,summary);list.append(a);
}
set("lab-results",filtered.length);set("lab-publishers",new Set(filtered.map(s=>s[2])).size);
findings("pass",filtered.length?"CURATED REFERENCES FOUND":"NO MATCHES",
filtered.length?["These are links curated in AI Prism, not links whose accessibility or currency has just been checked.","Open the primary publisher's source to confirm current scope, version and applicability."]:["Change the search or topic. No sources were fabricated to fill the result."]);
}
root.addEventListener("input",update);root.addEventListener("change",update);update();
}
function mcp(){
const defaults={area:"permissions",likelihood:"3",impact:"4",level:"high",status:"mitigating",owner:"Fictional Platform Owner",mitigation:"Use dedicated least-privilege identity and document a revocation path."};
shell("Edit one finding in the repository's fictional MCP review. Validate selected schema constraints and inspect the ordinal triage product—without turning it into a security verdict.",
select("lab-area","Finding area",[["permissions","Permissions"],["tool_scope","Tool scope"],["data_exposure","Data exposure"],["prompt_injection","Prompt injection"],["auditability","Auditability"],["failure_modes","Failure modes"],["human_oversight","Human oversight"]])+
'<div class="lab-split">'+field("lab-likelihood","Likelihood (1–5)","3","number")+field("lab-impact","Impact (1–5)","4","number")+'</div>'+
select("lab-level","Reviewer-assigned risk level",[["low","Low"],["medium","Medium"],["high","High"],["critical","Critical"]])+
select("lab-status","Finding status",[["open","Open"],["mitigating","Mitigating"],["accepted","Accepted"],["blocked","Blocked"]])+
field("lab-owner","Finding owner",defaults.owner)+area("lab-mitigation","Stated mitigation",defaults.mitigation)+
'<div class="lab-actions">'+button("lab-reset","Restore fictional finding")+button("lab-download","Export finding")+'</div>'+note,
'<div class="lab-metrics">'+metric("lab-priority","ORDINAL PRODUCT")+metric("lab-valid","RECORD CHECK")+'</div>');
function get(){return {id:"F-001",area:v("lab-area"),finding:"A broad service identity may exceed the intended synthetic data and tool scope.",
likelihood:Number(v("lab-likelihood")),impact:Number(v("lab-impact")),risk_level:v("lab-level"),mitigation:v("lab-mitigation").trim(),owner:v("lab-owner").trim(),status:v("lab-status")};}
function update(){const obj=get(),errors=[];
for(const k of ["likelihood","impact"])if(!Number.isInteger(obj[k])||obj[k]<1||obj[k]>5)errors.push(k+" must be an integer from 1 to 5.");
if(!obj.owner)errors.push("An accountable finding owner is required.");
if(!obj.mitigation)errors.push("A mitigation description is required.");
set("lab-priority",errors.length?"—":obj.likelihood*obj.impact);set("lab-valid",errors.length?"INVALID":"VALID SUBSET");
findings(errors.length?"fail":"pass",errors.length?"SCHEMA REVIEW REQUIRED":"FICTIONAL FINDING STRUCTURED",errors.length?errors:["Priority product is an ordinal sorting aid, not expected financial loss.","Reviewer-assigned risk level is deliberately not inferred from likelihood × impact.","No server, credential or actual access boundary has been tested."]);
return {obj,valid:!errors.length};}
root.addEventListener("input",update);root.addEventListener("change",update);
$("lab-reset").addEventListener("click",()=>{for(const [key,value] of Object.entries(defaults))$("lab-"+key).value=value;update();});
$("lab-download").addEventListener("click",()=>{const r=update();if(r.valid)exportJSON(r.obj,"fictional-mcp-finding.json");else set("lab-export-status","Correct the highlighted record errors first.");});
update();
}
const rows=[
["Govern","Are the decision and residual-risk owners current and authorized?"],
["Govern","Are exceptions and re-review triggers operating for this scope?"],
["Map","Are intended use, populations, permissions and exclusions defined?"],
["Map","Are material data, tool, model and supplier dependencies mapped?"],
["Measure","Are evaluation methods valid for the reviewed population and decision?"],
["Measure","Are gaps, critical failures and evaluator uncertainty documented?"],
["Manage","Are release, rollback, exception and residual-risk decisions accountable?"],
["Manage","Are treatments monitored with a verifiable stop and recovery path?"]
];
const states=[["unknown","Unknown"],["documented","Documented, not demonstrated"],["partial","Partially demonstrated"],["demonstrated","Demonstrated"],["absent","Not demonstrated"],["not_applicable","Not applicable"]];
function nist(){
shell("Create an evidence worksheet from representative prompts in the repository's Govern, Map, Measure and Manage template. These are internal questions, not official subcategory numbers.",
field("lab-scope","Fictional system scope","Synthetic document-assistant pilot")+
'<p class="lab-small">For each prompt record a status and a short evidence reference, limitation or not-applicable rationale.</p>'+
'<div class="lab-worksheet">'+rows.map(([fn,text],i)=>'<div class="lab-worksheet-row"><p><small>'+fn.toUpperCase()+'</small>'+safe(text)+'</p>'+
select("lab-state"+i,"Evidence state",states)+field("lab-evidence"+i,"Evidence / limitation / rationale","")+'</div>').join("")+'</div>'+
'<div class="lab-actions">'+button("lab-download","Export draft worksheet")+button("lab-reset","Reset evidence states")+'</div>'+note,
'<div class="lab-metrics">'+metric("lab-covered","DEMONSTRATED")+metric("lab-gaps","UNRESOLVED / UNKNOWN")+'</div>');
function data(){return rows.map(([fn,question],i)=>({function:fn,proposition:question,state:v("lab-state"+i),evidence_or_limitation:v("lab-evidence"+i).trim()}));}
function update(){
const all=data(),unknown=all.filter(x=>x.state==="unknown"||x.state==="absent"||x.state==="documented"||x.state==="partial"),strong=all.filter(x=>x.state==="demonstrated"),errors=[];
if(!v("lab-scope").trim())errors.push("A system scope is required.");
all.forEach((x,i)=>{if(x.state==="not_applicable"&&!x.evidence_or_limitation)errors.push(rows[i][0]+" item "+(i+1)+": not applicable requires a scoped rationale.");if(x.state==="demonstrated"&&!x.evidence_or_limitation)errors.push(rows[i][0]+" item "+(i+1)+": demonstrated needs cited evidence.");});
set("lab-covered",strong.length+"/"+all.length);set("lab-gaps",unknown.length+"/"+all.length);
findings(errors.length?"fail":"pass",errors.length?"EVIDENCE RECORD INCOMPLETE":"DRAFT EVIDENCE MAP",errors.length?errors:[unknown.length+" propositions remain not demonstrated, partially supported, documented only or unknown.","Do not assign a maturity/compliance score. Verify official references and version before use."]);
return {all,valid:!errors.length};}
root.addEventListener("input",update);root.addEventListener("change",update);
$("lab-reset").addEventListener("click",()=>{rows.forEach((_,i)=>{$("lab-state"+i).value="unknown";$("lab-evidence"+i).value="";});update();});
$("lab-download").addEventListener("click",()=>{const d=update();if(d.valid)exportJSON({scope:v("lab-scope"),source:"Unofficial practitioner question extract; confirm official NIST references",items:d.all},"rmf-evidence-worksheet.json");else set("lab-export-status","Document the missing evidence or rationale before export.");});
update();
}
function multiagent(){
shell("Test the fictional authority envelope in docs/authority-and-containment.md: a catalog correction drafter may read public records and create drafts, but may not publish, delete or access patron history.",
select("lab-action","Proposed capability",[["read","Read public catalog"],["create_draft","Create bounded correction draft"],["publish","Publish correction"],["delete","Delete record"]])+
select("lab-data","Requested data",[["public","Public catalog records"],["patron","Patron history"]])+
tick("lab-principal","Principal bound to authenticated operator",true)+
tick("lab-schema","Producer output checked as data, not instructions",true)+
tick("lab-confirm","Human confirmation recorded for external action",false)+
'<div class="lab-actions">'+button("lab-reset","Restore bounded read")+'</div>',
'<div class="lab-metrics">'+metric("lab-authority","AUTHORITY ENVELOPE")+metric("lab-next","NEXT CONTROL")+'</div><ol id="lab-trace" class="lab-trace"></ol>');
function update(){
const act=v("lab-action"),data=v("lab-data"),principal=check("lab-principal"),schema=check("lab-schema"),confirm=check("lab-confirm");
const states=["PROPOSE — request "+act+" against "+data+" data."],reasons=[];
if(!principal)reasons.push("The requester is not bound to the required principal.");
if(!schema)reasons.push("The producer output has not been validated as untrusted data.");
if(data!=="public")reasons.push("Patron history is outside the declared data envelope.");
if(!["read","create_draft"].includes(act))reasons.push("Action "+act+" is prohibited for this drafter; a human click does not grant new authority.");
let result=reasons.length?"DENY / ESCALATE":"ALLOW WITH BOUNDS";
if(reasons.length)states.push("VALIDATE — stopped: "+reasons.join(" "));
else {states.push("VALIDATE — principal, source and permitted scope checked in this illustration.");
states.push("AUTHORIZE — the declared envelope permits "+act+" only;"+(confirm?" human confirmation noted.":" no external confirmation needed for this bounded illustration."));
states.push("EXECUTE / VERIFY — NOT RUN: deployment controls must enforce the boundary.");
states.push("RECORD — retain principal, version, input provenance and verified effect in a real system.");}
set("lab-authority",result);set("lab-next",reasons.length?"REVIEW":"ENFORCE IN CODE");
const trace=$("lab-trace");trace.replaceChildren();states.forEach(t=>{const li=document.createElement("li");li.textContent=t;trace.append(li);});
findings(reasons.length?"fail":"pass",reasons.length?"OUTSIDE DECLARED AUTHORITY":"ILLUSTRATIVE PATH CONSISTENT",reasons.length?reasons:["No action has been executed. Permission must be enforced by the actual identity and tool layers."]);
}
$("lab-reset").addEventListener("click",()=>{$("lab-action").value="read";$("lab-data").value="public";$("lab-principal").checked=true;$("lab-schema").checked=true;$("lab-confirm").checked=false;update();});
root.addEventListener("change",update);update();
}
function governance(){
shell("Design an illustrative governance service route for a lifecycle decision. The playbook does not prescribe universal paths; its purpose is to surface owners, evidence, effects and follow-through.",
select("lab-decision","Decision to be made",[["pilot","Authorize bounded pilot"],["expand","Expand an existing system"],["exception","Grant an exception"],["pause","Pause or contain operation"]])+
select("lab-exposure","Effective authority / exposure",[["read","Internal read-only"],["draft","Drafts subject to review"],["external","External action or communication"],["irreversible","Irreversible or high-consequence effect"]])+
field("lab-owner","Accountable decision owner","Fictional Program Sponsor")+
tick("lab-evidence","Current relevant evidence is supplied",true)+tick("lab-affected","Affected-party and required specialist input identified",false)+
tick("lab-stop","Stop, rollback or recovery path is described",false)+
'<div class="lab-actions">'+button("lab-reset","Restore fictional pilot")+button("lab-download","Export service intake")+'</div>'+note,
'<div class="lab-metrics">'+metric("lab-route","REVIEW PATH")+metric("lab-ready","INTAKE READINESS")+'</div>');
function evaluate(){
const request={decision:v("lab-decision"),authority:v("lab-exposure"),decision_owner:v("lab-owner").trim(),evidence_supplied:check("lab-evidence"),affected_party_input:check("lab-affected"),recovery_plan:check("lab-stop")};
const gaps=[];if(!request.decision_owner)gaps.push("Name an accountable decision owner.");
if(!request.evidence_supplied)gaps.push("Provide evidence with scope and provenance before review.");
if(["external","irreversible"].includes(request.authority)&&!request.affected_party_input)gaps.push("Identify affected-party and specialist input.");
if((request.decision==="expand"||request.authority==="irreversible")&&!request.recovery_plan)gaps.push("Define stop/rollback/recovery capacity.");
const route=["external","irreversible"].includes(request.authority)||request.decision==="exception"?"CROSS-FUNCTIONAL":"BOUNDED PEER REVIEW";
set("lab-route",route);set("lab-ready",gaps.length?"INCOMPLETE":"READY TO REVIEW");
const record=["Decision: "+request.decision+" · Authority: "+request.authority+".","Illustrative route: "+route+".","Record accountable authority, evidence cutoff, conditions, dissent, useful-by date and expiry.","Verify actions and conditions; re-open after material change or incident."];
findings(gaps.length?"fail":"pass",gaps.length?"COMPLETE THE INTAKE":"REVIEW ROUTE PROPOSED",gaps.length?[...gaps,"The selected path has not authorized any pilot or release."]:record);
return request;}
$("lab-reset").addEventListener("click",()=>{$("lab-decision").value="pilot";$("lab-exposure").value="read";$("lab-owner").value="Fictional Program Sponsor";$("lab-evidence").checked=true;$("lab-affected").checked=false;$("lab-stop").checked=false;evaluate();});
$("lab-download").addEventListener("click",()=>exportJSON({...evaluate(),status:"draft; no actual authorization"},"fictional-governance-intake.json"));
root.addEventListener("input",evaluate);root.addEventListener("change",evaluate);evaluate();
}
const labs={"agent-simulator":simulator,"prompt-harness-translator":translator,"ai-prism":prism,
"mcp-agent-risk-checklist":mcp,"nist-rmf-guide":nist,"multi-agent-governance":multiagent,"governance-playbook":governance};
if(labs[slug])labs[slug]();
})();

