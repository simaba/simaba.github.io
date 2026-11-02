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
root.innerHTML='<div class="lab-main"><div class="lab-controls"><p class="lab-eyebrow">WORK WITH THE SOURCE MODEL</p><p class="lab-context">'+safe(intro)+'</p>'+controls+'</div><div class="lab-output" aria-live="polite">'+output+'<p class="lab-eyebrow">INSPECTED RESULT</p><h3 id="lab-verdict"></h3><ul class="lab-findings" id="lab-findings"></ul><p class="lab-privacy">This exercise processes your inputs locally; no scenario data is uploaded or used to operate an external system.</p></div></div>';
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
const engine=globalThis.PortfolioAgentSimulator;
if(!engine)throw Error("Simulator source module is not available");
const choices=Object.keys(engine.SCENARIOS);
let run=null,pointer=0;
const columns=["task_complete","output_present","boundary_respected"],fallbackFields=["output_present","boundary_respected","fallback_is_bounded"];
const boolCheck=(id,label,checked)=>tick(id,label,checked);
const attempt=(index)=>'<div class="lab-simulator-attempt"><p class="lab-eyebrow">ATTEMPT '+(index+1)+' / EVIDENCE CONTRACT</p>'+
 columns.map((key,i)=>boolCheck("lab-a"+index+"-"+i,key.replaceAll("_"," "),true)).join("")+
 field("lab-confidence"+index,"Reported confidence · diagnostic only","0.90","number")+'</div>';
const controls=
select("lab-scenario","Published scenario",choices.map(s=>[s,s.replaceAll("_"," ")]))+
'<div class="lab-scenario" id="lab-scenario-description"></div>'+
'<label class="lab-check"><input id="lab-whatif" type="checkbox"><span>Explore alternative evidence (hypothetical, not published fixtures)</span></label>'+
'<div id="lab-simulator-experiment" hidden><p class="lab-context">Change the evidence, number of attempts or fallback contract to inspect how supervisor decisions change. The original source fixture remains unchanged.</p>'+
select("lab-attempt-limit","Maximum primary attempts",[["1","One"],["2","Two"],["3","Three"]])+
attempt(0)+attempt(1)+attempt(2)+
'<div class="lab-simulator-attempt" id="lab-fallback-panel"><p class="lab-eyebrow">SEPARATE FALLBACK CONTRACT</p>'+
fallbackFields.map((name,i)=>boolCheck("lab-fallback"+i,name.replaceAll("_"," "),true)).join("")+'</div></div>'+
'<div class="lab-actions">'+button("lab-prev","Previous")+button("lab-step","Next event")+button("lab-run","Run to outcome")+button("lab-replay","Replay trace")+button("lab-reset","Restore source fixture")+button("lab-export","Download decision report")+'</div>'+note;
shell("Inspect actual deterministic controller decisions. Confidence never authorizes acceptance: observable evidence does. The published fixture and hypothetical overrides are explicitly separated.",controls,
'<div class="lab-metrics lab-four">'+metric("lab-step-num","EVENTS")+metric("lab-outcome","PATH")+
metric("lab-attempts","ATTEMPTS")+metric("lab-retries","RETRIES")+'</div>'+
'<p class="lab-small" id="lab-mode">Published source fixture</p>'+
'<div class="lab-state-flow" id="lab-state-flow" aria-label="Current control-flow stage"></div>'+
'<ol id="lab-trace" class="lab-trace"></ol>'+
'<div class="lab-metrics lab-four">'+metric("lab-accepted","PRIMARY ACCEPTED")+metric("lab-fallback-used","FALLBACK USED")+
metric("lab-escalated","HUMAN ESCALATION")+metric("lab-proxy","STATE LABEL ONLY")+'</div>');
function source(){return engine.SCENARIOS[v("lab-scenario")];}
function loadFixture(){
const fixture=source();
set("lab-scenario-description",fixture.task);
$("lab-attempt-limit").value=String(fixture.max_attempts);
for(let attempt=0;attempt<3;attempt++){
const ev=fixture.attempts[Math.min(attempt,fixture.attempts.length-1)];
for(let index=0;index<3;index++)$("lab-a"+attempt+"-"+index).checked=ev.evidence[index];
$("lab-confidence"+attempt).value=String(ev.confidence);
}
for(let index=0;index<3;index++)$("lab-fallback"+index).checked=fixture.fallback?fixture.fallback.evidence[index]:true;
$("lab-fallback-panel").hidden=!fixture.fallback;
}
function configured(){
if(!$("lab-whatif").checked)return {};
const attempts=[];
for(let i=0;i<Number(v("lab-attempt-limit"));i++){
attempts.push({evidence:columns.map((_,j)=>check("lab-a"+i+"-"+j)),confidence:Number(v("lab-confidence"+i))});
}
return {max_attempts:Number(v("lab-attempt-limit")),attempts,
 ...(source().fallback?{fallback_evidence:fallbackFields.map((_,j)=>check("lab-fallback"+j))}:{})};
}
function verdict(){
const report=run.report;
if(report.accepted)return "PRIMARY ACCEPT";
if(report.fallback_used)return "VALIDATED FALLBACK";
if(report.escalated)return "ESCALATE";
return "UNRESOLVED";
}
function display(){
const current=run.trace.slice(0,pointer),dest=$("lab-trace");
dest.replaceChildren();
for(const event of current){
const li=document.createElement("li");li.dataset.kind=event.kind;li.textContent=event.text;dest.append(li);
}
const done=pointer>=run.trace.length,report=run.report;
const phases=["PLAN","EXECUTE","EVALUATE","SUPERVISE"];
const stage=pointer?(({plan:0,execute:1,reject:2,accept:2,retry:3,fallback:3,escalate:3})[run.trace[pointer-1]?.kind]??0):-1;
const flow=$("lab-state-flow");flow.replaceChildren();
phases.forEach((phase,i)=>{
 const el=document.createElement("span");el.textContent=phase;
 el.dataset.position=i<stage?"past":i===stage?"current":"pending";
 flow.append(el);
});
$("lab-prev").disabled=pointer===0;
$("lab-step").disabled=done;
set("lab-step-num",pointer+" / "+run.trace.length);
set("lab-outcome",done?verdict():"INSPECTING");
set("lab-attempts",done?report.attempts:"—");
set("lab-retries",done?report.retries_requested:"—");
set("lab-accepted",done?(report.accepted?"YES":"NO"):"—");
set("lab-fallback-used",done?(report.fallback_used?"YES":"NO"):"—");
set("lab-escalated",done?(report.escalated?"YES":"NO"):"—");
set("lab-proxy",done?report.correctness_proxy.toUpperCase():"—");
set("lab-mode",run.mode==="published"?"Published source fixture · fixed evidence and latency/cost values":
 "Hypothetical evidence experiment · latency and cost remain original fixture metadata, not recomputed estimates");
findings(done&&report.escalated?"fail":"pass",
done?"SIMULATION COMPLETE · "+verdict():"TRACE IN PROGRESS",
done?[report.final_outcome,
"Primary acceptance, fallback and escalation are distinct outcomes. Correctness proxy is a simulator label, not measured system quality."]:
["The trace is derived from named observable criteria; advance to inspect each supervisor transition."]);
}
function calculate(){
try{
run=engine.runScenario(v("lab-scenario"),configured());
pointer=Math.min(3,run.trace.length);
$("lab-export").disabled=false;
display();
}catch(error){
$("lab-export").disabled=true;
findings("fail","SIMULATOR INPUT INVALID",[String(error.message||error)]);
set("lab-mode","Correct the input to continue; no trace was executed");
}
}
function reload(){
loadFixture();
calculate();
}
$("lab-scenario").addEventListener("change",reload);
$("lab-whatif").addEventListener("change",()=>{
$("lab-simulator-experiment").hidden=!check("lab-whatif");
loadFixture();calculate();
});
$("lab-attempt-limit").addEventListener("change",calculate);
root.addEventListener("change",event=>{
if(event.target.closest("#lab-simulator-experiment"))calculate();
});
root.addEventListener("input",event=>{
if(event.target.id.startsWith("lab-confidence"))calculate();
});
$("lab-prev").addEventListener("click",()=>{if(run){pointer=Math.max(0,pointer-1);display();}});
$("lab-step").addEventListener("click",()=>{if(run){pointer=Math.min(pointer+1,run.trace.length);display();}});
$("lab-replay").addEventListener("click",()=>{if(run){pointer=0;display();}});
$("lab-run").addEventListener("click",()=>{if(run){pointer=run.trace.length;display();}});
$("lab-reset").addEventListener("click",()=>{
$("lab-whatif").checked=false;$("lab-simulator-experiment").hidden=true;reload();
});
$("lab-export").addEventListener("click",()=>{
if(run)exportJSON({...run.report,mode:run.mode==="published"?"published_fixture":"hypothetical_override",
  note:run.mode==="published"?"Deterministic source fixture; no model calls":
  "What-if user modification; source fixture costs/latency retained without re-estimation"},
  "agent-simulator-decision-report.json");
});
$("lab-scenario").value="retry_then_success";
reload();
}
function translator(){
const engine=globalThis.PortfolioPromptTranslation;
if(!engine)throw new Error("Prompt translation core is missing.");
const sample=['---','name: executive-summary','description: Creates concise leadership-ready summaries.',
  'tools: ["Read", "Write"]','model: reasoning','---','',
  'Produce a crisp executive summary with a recommendation, risks, and next steps.',''].join("\n");
shell("Paste or import a Markdown prompt asset with YAML frontmatter. The browser supports a deliberately bounded source subset, including nested mappings, lists, and multiline scalar values. The Python CLI is the reference for other valid YAML constructs.",
select("lab-target","Output target",[["codex","Codex / Markdown"],["cursor","Cursor / YAML"],["generic","Generic / preservation YAML"]])+
area("lab-source","Source Markdown with YAML frontmatter",sample,16)+
'<div class="lab-actions">'+button("lab-reset","Restore published sample")+
button("lab-nested","Load nested example")+button("lab-download","Download conversion")+'</div>'+
'<label class="lab-field lab-file-field" for="lab-import"><span>Import local Markdown file (maximum 64 KiB)</span></label>'+
'<input id="lab-import" type="file" accept=".md,.markdown,.txt,text/markdown,text/plain" aria-describedby="lab-import-status">'+
'<p id="lab-import-status" class="lab-small" role="status">All parsing and rendering occurs locally. Do not paste private prompts or credentials into a public demo.</p>'+note,
'<div class="lab-metrics">'+metric("lab-loss","REVIEW-ONLY FIELDS")+metric("lab-target-name","TARGET")+'</div>'+
'<div class="lab-mapping-matrix"><p class="lab-eyebrow">FIELD MAPPING / ENFORCED ≠ PRESERVED</p>'+
'<div id="lab-mapping" class="lab-mapping" aria-label="Source field target mapping"></div></div>'+
'<div class="lab-document-preview"><p class="lab-eyebrow">TARGET OUTPUT / LOCAL PREVIEW</p>'+
'<pre class="lab-preview"><code id="lab-preview"></code></pre></div>');
const nested=['---','name: reviewer','description: |','  Review changes carefully:',
  '  preserve safety constraints.','tools:','  read:','    enabled: true',
  '  write:','    enabled: false','tags:','  - governance','  - evaluation',
  '---','','Provide a concise review.',''].join("\n");
let conversion=null;
function setMapping(parsed,target,lost){
const result=$("lab-mapping");result.replaceChildren();
for(const key of Object.keys(parsed.metadata)){
  const row=document.createElement("div");row.className="lab-mapping-row";
  const name=document.createElement("code");name.textContent=key;
  const state=document.createElement("strong");
  const isLoss=lost.includes(key);
  state.textContent=isLoss?"PRESERVED FOR REVIEW":"DIRECT FIELD";
  state.dataset.mapping=isLoss?"preserved":"direct";
  row.append(name,state);result.append(row);
}
if(!Object.keys(parsed.metadata).length){
  const empty=document.createElement("p");empty.className="lab-small";
  empty.textContent="No frontmatter keys supplied. Implicit defaults will be used.";result.append(empty);
}
}
function evaluate(){
const target=v("lab-target");
try{
const parsed=engine.parseSource(v("lab-source"));
conversion=engine.convert(parsed,target);
set("lab-loss",conversion.lost.length?conversion.lost.length+" FIELDS":"NONE");
set("lab-target-name",target.toUpperCase());
set("lab-preview",conversion.output);
setMapping(parsed,target,conversion.lost);
$("lab-download").disabled=false;
findings("pass",conversion.lost.length?"CONVERSION REQUIRES REVIEW":"PRESERVATION REPRESENTATION READY",
conversion.lost.length?[
"Unmapped source metadata remains available for human review: "+conversion.lost.join(", ")+".",
"Preserved values are not active permissions or runtime configuration. Manual target verification is required."]:
["All source metadata fields are retained in the selected bounded output representation.",
"Syntax preservation cannot establish equivalent runtime behavior, tools, or policy enforcement."]);
}catch(e){
conversion=null;$("lab-download").disabled=true;
set("lab-loss","INVALID");set("lab-target-name",target.toUpperCase());
set("lab-preview","Correct the source to produce an output.");
$("lab-mapping").replaceChildren();
findings("fail","SOURCE INPUT UNSUPPORTED OR INVALID",[
String(e.message||e),
"This browser deliberately rejects YAML outside its supported subset. Use the linked Python CLI for additional YAML constructs."]);
}
}
$("lab-reset").addEventListener("click",()=>{$("lab-source").value=sample;$("lab-target").value="codex";evaluate();set("lab-import-status","Published synthetic source restored. No file was uploaded.");});
$("lab-nested").addEventListener("click",()=>{$("lab-source").value=nested;evaluate();});
$("lab-download").addEventListener("click",()=>{
if(!conversion)return;
const file=new Blob([conversion.output],{type:"text/plain;charset=utf-8"}),url=URL.createObjectURL(file);
const link=document.createElement("a");link.href=url;
link.download="translated-"+conversion.target+(conversion.target==="codex"?".md":".yaml");link.click();
setTimeout(()=>URL.revokeObjectURL(url),1000);
set("lab-import-status","Prepared "+link.download+" locally for review. Nothing uploaded.");
});
$("lab-import").addEventListener("change",async event=>{
 const file=event.target.files?.[0];if(!file)return;
 try{
   if(file.size>65536)throw new Error("File exceeds the 64 KiB source limit.");
   const content=await file.text();engine.parseSource(content);
   $("lab-source").value=content;evaluate();
   set("lab-import-status","Imported "+file.name+" locally. Check target warnings before use.");
 }catch(e){set("lab-import-status","Import not accepted: "+String(e.message||e)+". Existing source preserved.");}
 finally{event.target.value="";}
});
root.addEventListener("input",event=>{if(event.target.id==="lab-import")return;evaluate();});
root.addEventListener("change",event=>{if(event.target.id==="lab-import")return;evaluate();});
evaluate();
}
function prism(){
const catalog=globalThis.PortfolioPrismCatalog;
if(!catalog||catalog.record_count!==catalog.items.length)throw Error("Pinned AI Prism catalog unavailable");
const all=catalog.items;
const sections=[...new Set(all.map(x=>x.category))];
const domain=x=>{try{return new URL(x.url).hostname.replace(/^www\./,"")}catch{return "unknown"}};
const urls=new Map();for(const x of all)urls.set(x.url,(urls.get(x.url)||0)+1);
let chosen=new Set(),visible=[],showAll=true;
const intro="Explore the full curated repository snapshot. Entries reflect the recorded README, including intentional cross-category repeats. Link accessibility, source currency and regulatory interpretation have not been reverified by this browser.";
const controls=
'<p class="lab-eyebrow">01 / SOURCE FACETS</p>'+
field("lab-query","Search titles, description, section or URL","")+
select("lab-topic","Repository section",[["all","All sections"],...sections.map(x=>[x,x])])+
select("lab-host","Source host",[["all","Any host"],
 ...[...new Set(all.map(domain))].sort().map(x=>[x,x])])+
tick("lab-unique","Show each URL once (collapse cross-category repeats)",false)+
'<div class="lab-actions">'+button("lab-reset","Clear filters")+
button("lab-export","Export reading set · JSON")+
button("lab-export-md","Export reading set · Markdown")+'</div>'+
'<p class="lab-small" id="lab-export-status" role="status">Reading-set choices are kept only in this browser page, until refreshed.</p>'+
'<div class="lab-prism-provenance"><p class="lab-eyebrow">SOURCE AND FRESHNESS BOUNDARY</p>'+
'<p>Curated <strong>README snapshot</strong> at '+catalog.source_commit.slice(0,12)+
'. The repository maintains a separate manual <a href="https://github.com/simaba/ai-prism/blob/'+catalog.source_commit+
'/REVIEW_STATUS.md" target="_blank" rel="noopener noreferrer">section-level review ledger</a>. '+
'Review dates apply to their recorded scope, not to every link on this page. The browser performs no live link checks.</p></div>';
shell(intro,controls,
'<div class="lab-metrics lab-four">'+metric("lab-results","VISIBLE ENTRIES")+
metric("lab-total","CURATED ENTRIES")+metric("lab-unique-count","UNIQUE URLS")+
metric("lab-selected","READING SET")+'</div>'+
'<div class="lab-prism-reading"><p class="lab-eyebrow">SELECTED SOURCE SET / INSPECTION</p>'+
'<div id="lab-reading-list" class="lab-reading-list"></div></div>'+
'<div class="lab-prism-resource-pane"><p class="lab-eyebrow">CATALOG / ORIGINAL SOURCE LINKS</p>'+
'<div id="lab-resources" class="lab-resource-list"></div></div>');
const find=id=>all.find(x=>x.id===id);
function renderReading(){
 const list=$("lab-reading-list");list.replaceChildren();
 const selections=[...chosen].map(find).filter(Boolean);
 if(!selections.length){
  const p=document.createElement("p");p.className="lab-small";
  p.textContent="Select individual resources below to create a reviewable reading set. Nothing is permanently saved.";
  list.append(p);return;
 }
 for(const item of selections){
  const row=document.createElement("div");row.className="lab-prism-reading-row";
  const name=document.createElement("a");name.href=item.url;name.target="_blank";name.rel="noopener noreferrer";
  name.textContent=item.title+" ↗";
  const remove=document.createElement("button");remove.type="button";remove.className="lab-mini-button";
  remove.textContent="Remove";remove.setAttribute("aria-label","Remove "+item.title+" from reading set");
  remove.addEventListener("click",()=>{chosen.delete(item.id);update()});
  row.append(name,remove);list.append(row);
 }
}
function setEntry(item){
 const card=document.createElement("article");card.className="lab-prism-entry";
 const category=document.createElement("small");category.className="lab-prism-category";
 category.textContent=item.category+(item.subsection?" / "+item.subsection:"")+" · "+domain(item);
 const link=document.createElement("a");link.href=item.url;link.target="_blank";
 link.rel="noopener noreferrer";link.className="lab-prism-title";
 link.textContent=item.title+" ↗";
 const description=document.createElement("p");description.textContent=item.description;
 const actions=document.createElement("div");actions.className="lab-prism-actions";
 const flag=document.createElement("button");flag.type="button";flag.className="lab-mini-button";
 flag.textContent=chosen.has(item.id)?"In reading set ✓":"Add to reading set";
 flag.setAttribute("aria-pressed",String(chosen.has(item.id)));
 flag.addEventListener("click",()=>{
   if(chosen.has(item.id))chosen.delete(item.id);
   else if(chosen.size<20)chosen.add(item.id);
   else {set("lab-export-status","The reading set is limited to 20 selected entries.");return;}
   update();
 });
 actions.append(flag);
 if(urls.get(item.url)>1){
  const duplicate=document.createElement("span");duplicate.className="lab-prism-repeated";
  duplicate.textContent="Cross-listed "+urls.get(item.url)+"× in README";
  actions.append(duplicate);
 }
 card.append(category,link,description,actions);
 return card;
}
function update(){
 const query=v("lab-query").trim().toLowerCase(),topic=v("lab-topic"),host=v("lab-host");
 const unique=check("lab-unique");
 const match=all.filter(x=>(topic==="all"||x.category===topic)&&
   (host==="all"||domain(x)===host)&&
   (!query||[x.title,x.description,x.category,x.subsection,x.url].join(" ").toLowerCase().includes(query)));
 const used=new Set();
 visible=match.filter(x=>{if(!unique)return true;if(used.has(x.url))return false;used.add(x.url);return true;});
 set("lab-results",visible.length);set("lab-total",all.length);
 set("lab-unique-count",catalog.unique_urls);set("lab-selected",chosen.size);
 renderReading();
 const list=$("lab-resources");list.replaceChildren();
 for(const item of visible)list.append(setEntry(item));
 if(!visible.length){
  const empty=document.createElement("p");empty.className="lab-small";
  empty.textContent="No source matches; broaden your search or reset the filters.";list.append(empty);
 }
 findings("pass",visible.length?"SOURCE CATALOG FILTERED":"NO SOURCES MATCH",
  ["Showing source snapshot entries and publisher links, without inventing live availability or editorial review status.",
   "Cross-category duplicates remain visible unless explicitly collapsed; manual content review dates are not per-URL verification."]);
}
function exportSet(type){
 const selected=[...chosen].map(find).filter(Boolean);
 if(!selected.length){set("lab-export-status","Select at least one source to export.");return;}
 if(type==="json")exportJSON({schema_version:1,source_commit:catalog.source_commit,
   review_status:"Not independently revalidated by this portfolio browser",resources:selected},
  "ai-prism-reading-set.json");
 else{
  const lines=["# AI Prism reading set","",
   "Curated README snapshot: "+catalog.source_commit,
   "No live link or editorial freshness verification was performed.",""];
  for(const x of selected){
   lines.push("## "+x.title,"","- Section: "+x.category+(x.subsection?" / "+x.subsection:""),
     "- Link: "+x.url,"- Description (source README): "+x.description,"");
  }
  const blob=new Blob([lines.join("\n")],{type:"text/markdown;charset=utf-8"});
  const uri=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=uri;a.download="ai-prism-reading-set.md";a.click();
  setTimeout(()=>URL.revokeObjectURL(uri),1000);
 }
 set("lab-export-status","Prepared "+selected.length+" selected source(s) locally; no upload.");
}
$("lab-export").addEventListener("click",()=>exportSet("json"));
$("lab-export-md").addEventListener("click",()=>exportSet("markdown"));
$("lab-reset").addEventListener("click",()=>{
 $("lab-query").value="";$("lab-topic").value="all";$("lab-host").value="all";
 $("lab-unique").checked=false;update();set("lab-export-status","Filters cleared; reading set retained.");
});
root.addEventListener("input",update);root.addEventListener("change",update);
update();
}
function mcp(){
const engine=globalThis.PortfolioMCPReview;
if(!engine)throw new Error("MCP source contract unavailable");
let record=engine.clone(engine.example),selected=0;
const options=(arr)=>arr.map(x=>[x,x.replaceAll("_"," ")]);
const controls=
'<p class="lab-eyebrow">01 / REVIEW ENVELOPE</p>'+
field("lab-review-id","Review identifier",record.review_id)+
field("lab-system","Fictional system name",record.system_name)+
area("lab-scope","Effective data and tool scope",record.scope,4)+
select("lab-review-status","Declared review status",options(engine.statuses))+
'<p class="lab-eyebrow lab-stage-title">02 / SELECT AND EDIT FINDING</p>'+
select("lab-finding-select","Finding",record.findings.map(f=>[f.id,f.id+" · "+f.area.replaceAll("_"," ")]))+
'<div class="lab-actions">'+button("lab-add","Add finding")+button("lab-remove","Remove selected finding")+'</div>'+
field("lab-finding-id","Finding ID","F-001")+
select("lab-area","Authority or failure area",options(engine.areas))+
area("lab-finding","Concrete failure scenario","",3)+
'<div class="lab-split">'+field("lab-likelihood","Likelihood (1–5)","3","number")+
field("lab-impact","Impact (1–5)","4","number")+'</div>'+
select("lab-level","Reviewer-assigned risk level",options(engine.levels))+
select("lab-status","Finding treatment state",options(engine.findingStatuses))+
field("lab-owner","Accountable finding owner","")+
area("lab-mitigation","Proposed mitigation and testable control","",4)+
'<p class="lab-eyebrow lab-stage-title">03 / LOCAL FILES</p>'+
'<label class="lab-field" for="lab-import"><span>Import review JSON (maximum 50 findings / 128 KiB)</span></label>'+
'<input id="lab-import" type="file" accept=".json,application/json" aria-describedby="lab-import-status">'+
'<p class="lab-small" role="status" id="lab-import-status">Example fields are entirely fictional; no remote MCP server is contacted.</p>'+
'<div class="lab-actions">'+button("lab-reset","Restore published example")+button("lab-download","Export complete review JSON")+'</div>'+note;
shell("Inspect the three published fictional scenarios together: identity permissions, prompt injection and auditability. Edit, add and remove findings, assess selected schema constraints, and compare scope/status consistency without treating a risk label as proof of safety.",controls,
'<div class="lab-metrics lab-four">'+metric("lab-count","FINDINGS")+metric("lab-open","OPEN / BLOCKED")+
metric("lab-high","HIGH / CRITICAL")+metric("lab-valid","SOURCE SCHEMA")+'</div>'+
'<div class="lab-metrics">'+metric("lab-priority","SELECTED ORDINAL PRODUCT")+
metric("lab-level-display","REVIEWER RISK LEVEL")+'</div>'+
'<div class="lab-dataset"><p class="lab-eyebrow">RISK INVENTORY / SELECT FOR REVIEW</p>'+
'<div id="lab-mcp-list" class="lab-ledger" aria-label="Review findings by effect and status"></div></div>'+
'<div class="lab-review-notes"><p class="lab-eyebrow">ADVISORY REVIEW OBSERVATIONS / NOT SOURCE SCHEMA</p>'+
'<ul id="lab-advisory" class="lab-findings"></ul></div>');
const ids=["lab-finding-id","lab-area","lab-finding","lab-likelihood","lab-impact","lab-level","lab-status","lab-owner","lab-mitigation"];
const elementToKey={"lab-finding-id":"id","lab-area":"area","lab-finding":"finding",
 "lab-likelihood":"likelihood","lab-impact":"impact","lab-level":"risk_level",
 "lab-status":"status","lab-owner":"owner","lab-mitigation":"mitigation"};
function display(){
 const f=record.findings[selected],optionsEl=$("lab-finding-select");
 optionsEl.replaceChildren();
 record.findings.forEach((item,index)=>{
  const option=document.createElement("option");
  option.value=String(index);
  option.textContent=item.id+" · "+item.area.replaceAll("_"," ");
  optionsEl.append(option);
 });
 optionsEl.value=String(selected);
 for(const id of ids){const key=elementToKey[id];$(id).value=f[key];}
 $("lab-review-id").value=record.review_id;
 $("lab-system").value=record.system_name;
 $("lab-scope").value=record.scope;
 $("lab-review-status").value=record.review_status;
 update();
}
function snapshot(){
 record.review_id=v("lab-review-id");
 record.system_name=v("lab-system");
 record.scope=v("lab-scope");
 record.review_status=v("lab-review-status");
 const f=record.findings[selected];
 for(const id of ids){
  const key=elementToKey[id];
  f[key]=["likelihood","impact"].includes(key)?
   (v(id)===""?null:Number(v(id))):v(id);
 }
}
function inventory(){
 const list=$("lab-mcp-list");list.replaceChildren();
 record.findings.forEach((f,index)=>{
  const item=document.createElement("button");item.type="button";
  item.className="lab-ledger-row";
  item.setAttribute("aria-current",index===selected?"true":"false");
  item.dataset.state=f.status==="blocked"?"fail":"pass";
  const name=document.createElement("span");name.textContent=f.id+" · "+f.area.replaceAll("_"," ");
  const ordinal=document.createElement("code");
  ordinal.textContent=Number.isInteger(f.likelihood)&&Number.isInteger(f.impact)?
   String(f.likelihood*f.impact):"—";
  const status=document.createElement("strong");status.textContent=f.status.toUpperCase();
  item.append(name,ordinal,status);
  item.addEventListener("click",()=>{selected=index;display();$("lab-finding-select").focus();});
  list.append(item);
 });
}
function update(){
 snapshot();
 const checked=engine.review(record);
 const f=record.findings[selected];
 set("lab-count",record.findings.length);
 set("lab-open",checked.open_count||record.findings.filter(x=>["open","blocked"].includes(x.status)).length);
 set("lab-high",checked.high_count||record.findings.filter(x=>["high","critical"].includes(x.risk_level)).length);
 set("lab-valid",checked.schema_valid?"VALID":"INVALID");
 set("lab-priority",Number.isInteger(f.likelihood)&&Number.isInteger(f.impact)&&f.likelihood>=1&&f.likelihood<=5&&f.impact>=1&&f.impact<=5?
  f.likelihood*f.impact:"—");
 set("lab-level-display",f.risk_level.toUpperCase());
 const duplicate=checked.advisory.filter(x=>x.startsWith("Duplicate finding ID"));
 $("lab-download").disabled=!checked.schema_valid||duplicate.length>0||record.findings.length>50;
 $("lab-remove").disabled=record.findings.length===1;
 const notes=$("lab-advisory");notes.replaceChildren();
 for(const message of checked.advisory){
  const li=document.createElement("li");li.textContent=message;notes.append(li);
 }
 if(!checked.advisory.length){
  const li=document.createElement("li");
  li.textContent="No cross-record advisory conflicts found. This does not establish control effectiveness.";notes.append(li);
 }
 findings(checked.schema_valid?"pass":"fail",
  checked.schema_valid?"SCHEMA STRUCTURE VALID":"REVIEW FIELDS INCOMPLETE",
  checked.schema_valid?
  ["All required fields and enums match the selected published JSON Schema.",
   "Risk level is a separate reviewer judgment. Likelihood × impact is only an ordinal sorting aid.",
   "Actual identity permissions, logging, attack paths and recovery mechanisms have not been tested."]:
   checked.structural.slice(0,12));
 inventory();
 return checked;
}
function add(){
 snapshot();
 if(record.findings.length>=50){set("lab-import-status","Maximum 50 findings in this browser exercise.");return;}
 const taken=new Set(record.findings.map(f=>f.id));let i=1,newId;
 do{newId="F-"+String(i++).padStart(3,"0");}while(taken.has(newId));
 record.findings.push({id:newId,area:"tool_scope",
  finding:"Fictional tool action requires a bounded effect and authority review.",
  likelihood:2,impact:3,risk_level:"medium",
  mitigation:"Identify the principal, actual tool effect, and an enforceable stop/revocation control.",
  owner:"Fictional Review Owner",status:"open"});
 selected=record.findings.length-1;display();
 set("lab-import-status","Added a new fictional finding. Replace the placeholder with evidence-backed review text.");
}
function remove(){
 if(record.findings.length<2)return;
 record.findings.splice(selected,1);selected=Math.min(selected,record.findings.length-1);
 display();
}
async function importReview(event){
 const file=event.target.files?.[0];if(!file)return;
 try{
  if(file.size>128*1024)throw new Error("The file exceeds the 128 KiB input limit.");
  const input=JSON.parse(await file.text());
  const violations=engine.validate(input);
  if(violations.length)throw new Error(violations.slice(0,4).join(" "));
  if(input.findings.length>50)throw new Error("Maximum 50 findings.");
  const ids=new Set(input.findings.map(x=>x.id));
  if(ids.size!==input.findings.length)throw new Error("Finding identifiers must be unique.");
  record=engine.clone(input);selected=0;display();
  set("lab-import-status","Imported "+record.findings.length+" findings locally. Source-schema fields preserved.");
 }catch(error){
  set("lab-import-status","Import not accepted: "+String(error.message||error)+". Existing review preserved.");
 }finally{event.target.value="";}
}
root.addEventListener("input",e=>{
 if(e.target.tagName==="INPUT"&&e.target.type==="file")return;
 if(e.target.id==="lab-finding-select")return;
 update();
});
root.addEventListener("change",e=>{
 if(e.target.id==="lab-finding-select"){selected=Number(e.target.value);display();return;}
 if(e.target.id==="lab-import")return;
 update();
});
$("lab-add").addEventListener("click",add);
$("lab-remove").addEventListener("click",remove);
$("lab-reset").addEventListener("click",()=>{
 record=engine.clone(engine.example);selected=0;display();
 set("lab-import-status","Restored the original three fictional findings.");
});
$("lab-import").addEventListener("change",importReview);
$("lab-download").addEventListener("click",()=>{
 const result=update();
 if(result.schema_valid&&record.findings.length<=50&&new Set(record.findings.map(x=>x.id)).size===record.findings.length)
  exportJSON(record,"fictional-mcp-risk-review.json");
});
display();
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
const engine=globalThis.PortfolioRMF;
if(!engine)throw Error("Source-anchored RMF review module is unavailable");
let record=engine.defaults(),selected=0,filter="all";
const states=Object.entries(engine.statusLabels).map(([value,label])=>[value,label]);
const dispositions=engine.dispositions.map(x=>[x,x.replaceAll("_"," ")]);
const controls=
'<p class="lab-eyebrow">01 / SCOPE AND DECISION</p>'+
field("lab-scope","Fictional system / use case",record.scope.system)+
field("lab-version","Version / environment",record.scope.version)+
field("lab-populations","Users and affected populations",record.scope.populations)+
field("lab-lifecycle","Lifecycle decision supported",record.scope.lifecycle_decision)+
field("lab-assessor","Accountable assessment owner",record.scope.assessor)+
field("lab-cutoff","Evidence cutoff",record.scope.evidence_cutoff,"date")+
area("lab-exclusions","Explicit exclusions",record.scope.exclusions,2)+
'<p class="lab-eyebrow lab-stage-title">02 / SELECT AN INTERNAL PROPOSITION</p>'+
select("lab-function","Review function",[["all","All four functions"],...engine.functions.map(x=>[x,x])])+
'<label class="lab-field"><span>Assessment proposition</span><select id="lab-item"></select></label>'+
'<div class="lab-proposition" id="lab-proposition"></div>'+
'<p class="lab-eyebrow lab-stage-title">03 / REFERENCE, EVIDENCE, AND CONSEQUENCE</p>'+
select("lab-state","Recorded evidence state",states)+
field("lab-reference","Verified official reference identifier (user-supplied)","")+
field("lab-source-version","Official source version / date (user-supplied)","")+
select("lab-evidence-type","What evidence demonstrates",[["unspecified","Not specified"],["design","Design"],["operation","Operation"],["outcome","Outcome"]])+
area("lab-evidence","Evidence source / location","",2)+
field("lab-evidence-owner","Evidence owner","")+
field("lab-evidence-date","Evidence date","","date")+
area("lab-coverage","Population, coverage and sampling boundary","",2)+
area("lab-limitation","Limitations, material uncertainty and gaps","",2)+
area("lab-na","Not-applicable scope rationale","",2)+
area("lab-consequence","Decision consequence if unresolved","",2)+
select("lab-disposition","Gap disposition",dispositions)+
field("lab-action-owner","Next action owner","")+
field("lab-action-due","Action due date","","date")+
area("lab-trigger","Re-review, invalidation or stop trigger","",2)+
'<p class="lab-eyebrow lab-stage-title">04 / OVERALL DRAFT CONCLUSION</p>'+
select("lab-outcome","Proposed outcome",[
["defer","Defer"],["hold","Hold"],["proceed_with_conditions","Proceed with conditions"],
["proceed","Proceed"],["redesign","Redesign"],["other","Other"]])+
area("lab-rationale","Reasoning for proposed outcome",record.conclusion.rationale,3)+
area("lab-report-limits","Assessment-wide limitations",record.conclusion.limitations,2)+
field("lab-next-review","Next review date",record.conclusion.next_review,"date")+
'<div class="lab-actions">'+button("lab-reset","Restore fictional example")+
button("lab-export","Export assessment JSON")+button("lab-markdown","Export review Markdown")+'</div>'+
'<label class="lab-field lab-file-field" for="lab-import"><span>Import prior review JSON (maximum 64 KiB)</span></label>'+
'<input id="lab-import" type="file" accept=".json,application/json" aria-describedby="lab-import-status">'+
'<p class="lab-small" id="lab-import-status" role="status">No real system is reviewed; the browser does not retain or upload data.</p>'+note;
shell("Work through the practitioner template's twelve internal propositions, organized by Govern, Map, Measure and Manage. These questions are not official NIST subcategory text. Evidence, population, provenance, limits, owner and decision consequence remain explicit; no maturity/compliance score is assigned.",
controls,
'<div class="lab-metrics lab-four">'+
metric("lab-covered","DEMONSTRATED")+metric("lab-gaps","OPEN / UNKNOWN")+
metric("lab-na-count","NOT APPLICABLE")+metric("lab-validated","RECORD STRUCTURE")+'</div>'+
'<div class="lab-rmf-board"><p class="lab-eyebrow">EVIDENCE INVENTORY / SELECT TO INSPECT</p>'+
'<div id="lab-rmf-list" class="lab-ledger" aria-label="Twelve internal assessment propositions"></div></div>'+
'<div class="lab-rmf-consequence"><p class="lab-eyebrow">DECISION-RELEVANT GAPS</p>'+
'<ul class="lab-findings" id="lab-gap-summary"></ul></div>'+
'<p class="lab-small">A complete draft record is an organizational review aid, not proof of NIST implementation, effectiveness, regulatory compliance, or safety.</p>');
const map={
 "lab-state":"status","lab-reference":"source_reference","lab-source-version":"source_version",
 "lab-evidence-type":"evidence_type","lab-evidence":"evidence_reference",
 "lab-evidence-owner":"evidence_owner","lab-evidence-date":"evidence_date",
 "lab-coverage":"coverage","lab-limitation":"limitation","lab-na":"not_applicable_rationale",
 "lab-consequence":"decision_consequence","lab-disposition":"disposition",
 "lab-action-owner":"action_owner","lab-action-due":"action_due","lab-trigger":"invalidation_trigger"
};
const scopes={"lab-scope":"system","lab-version":"version","lab-populations":"populations",
 "lab-lifecycle":"lifecycle_decision","lab-assessor":"assessor",
 "lab-cutoff":"evidence_cutoff","lab-exclusions":"exclusions"};
const outcomes={"lab-outcome":"outcome","lab-rationale":"rationale",
 "lab-report-limits":"limitations","lab-next-review":"next_review"};
function save(){
 for(const [id,key] of Object.entries(scopes))record.scope[key]=v(id);
 for(const [id,key] of Object.entries(outcomes))record.conclusion[key]=v(id);
 for(const [id,key] of Object.entries(map))record.items[selected][key]=v(id);
}
function renderSelector(){
 const items=$("lab-item");items.replaceChildren();
 const visible=record.items.map((item,index)=>({item,index})).filter(x=>filter==="all"||x.item.function===filter);
 if(!visible.some(x=>x.index===selected))selected=visible[0].index;
 for(const {item,index} of visible){
  const option=document.createElement("option");option.value=String(index);
  option.textContent=item.id+" · "+item.function+" · "+item.proposition.slice(0,55);
  items.append(option);
 }
 items.value=String(selected);
}
function display(){
 renderSelector();
 for(const [id,key] of Object.entries(scopes))$(id).value=record.scope[key];
 for(const [id,key] of Object.entries(outcomes))$(id).value=record.conclusion[key];
 for(const [id,key] of Object.entries(map))$(id).value=record.items[selected][key];
 set("lab-proposition",record.items[selected].function.toUpperCase()+" / "+
  record.items[selected].id+" — "+record.items[selected].proposition);
 update();
}
function inventory(){
 const board=$("lab-rmf-list");board.replaceChildren();
 const filtered=record.items.map((item,index)=>({item,index})).filter(({item})=>filter==="all"||item.function===filter);
 for(const {item,index} of filtered){
  const button=document.createElement("button");button.type="button";
  button.className="lab-ledger-row";button.setAttribute("aria-current",String(index===selected));
  button.dataset.state=["unknown","absent"].includes(item.status)?"fail":"pass";
  const name=document.createElement("span");name.textContent=item.id+" · "+item.function+" · "+item.proposition;
  const status=document.createElement("strong");status.textContent=engine.statusLabels[item.status].toUpperCase();
  button.append(name,status);
  button.addEventListener("click",()=>{save();selected=index;display();$("lab-item").focus();});
  board.append(button);
 }
}
function update(){
 save();
 const result=engine.review(record);
 set("lab-covered",(result.counts.demonstrated||0)+"/12");
 set("lab-gaps",result.gaps.length+"/12");
 set("lab-na-count",result.counts.not_applicable||0);
 set("lab-validated",result.valid?"DRAFT VALID":"NEEDS WORK");
 $("lab-export").disabled=!result.valid;
 $("lab-markdown").disabled=!result.valid;
 const notes=["Evidence states remain claims entered by the user, never independently verified."];
 if(result.gaps.length)notes.unshift(result.gaps.length+" internal propositions are unresolved, partially demonstrated, or documented without operating proof.");
 findings(result.valid?"pass":"fail",result.valid?"DRAFT EVIDENCE RECORD":"EVIDENCE RECORD INCOMPLETE",
  result.errors.length?result.errors.slice(0,12):notes);
 const summary=$("lab-gap-summary");summary.replaceChildren();
 const gaps=result.gaps.filter(x=>x.disposition!=="unclassified");
 if(!gaps.length){
  const li=document.createElement("li");
  li.textContent=result.gaps.length+" unresolved propositions; no gap dispositions assigned yet.";
  summary.append(li);
 }else for(const item of gaps){
  const li=document.createElement("li");li.textContent=item.id+" · "+item.disposition.replaceAll("_"," ")+
   " · "+(item.decision_consequence||"Decision consequence still missing");summary.append(li);
 }
 inventory();
 return result;
}
function download(content,filename,mime){
 const file=new Blob([content],{type:mime}),uri=URL.createObjectURL(file),anchor=document.createElement("a");
 anchor.href=uri;anchor.download=filename;anchor.click();setTimeout(()=>URL.revokeObjectURL(uri),1000);
 set("lab-import-status","Prepared "+filename+" locally. Nothing was uploaded.");
}
$("lab-item").addEventListener("change",e=>{save();selected=Number(e.target.value);display();});
$("lab-function").addEventListener("change",e=>{save();filter=e.target.value;display();});
root.addEventListener("input",e=>{
 if(e.target.id==="lab-import"||e.target.id==="lab-item"||e.target.id==="lab-function")return;
 update();
});
root.addEventListener("change",e=>{
 if(e.target.id==="lab-import"||e.target.id==="lab-item"||e.target.id==="lab-function")return;
 update();
});
$("lab-reset").addEventListener("click",()=>{record=engine.defaults();selected=0;filter="all";
 $("lab-function").value="all";display();set("lab-import-status","Restored fictional example; local inputs were reset.");});
$("lab-export").addEventListener("click",()=>{
 const res=update();if(res.valid)download(JSON.stringify(record,null,2)+"\n","fictional-rmf-evidence-record.json","application/json");
});
$("lab-markdown").addEventListener("click",()=>{
 const res=update();if(res.valid)download(engine.markdown(record,res),"fictional-rmf-evidence-assessment.md","text/markdown");
});
$("lab-import").addEventListener("change",async e=>{
 const file=e.target.files?.[0];if(!file)return;
 try{
  if(file.size>65536)throw Error("Import exceeds the 64 KiB limit.");
  const parsed=JSON.parse(await file.text()),errors=engine.shapeErrors(parsed);
  if(errors.length)throw Error(errors.slice(0,3).join(" "));
  record=engine.clone(parsed);selected=0;filter="all";$("lab-function").value="all";display();
  set("lab-import-status","Imported twelve reviewed propositions locally. Check evidence status and provenance.");
 }catch(error){set("lab-import-status","Import not accepted: "+String(error.message||error)+". Existing review preserved.");}
 finally{e.target.value="";}
});
display();
}function multiagent(){
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
return {...request,proposed_review_route:route,missing_inputs:gaps,readiness:gaps.length?"incomplete":"ready_to_review"};}
$("lab-reset").addEventListener("click",()=>{$("lab-decision").value="pilot";$("lab-exposure").value="read";$("lab-owner").value="Fictional Program Sponsor";$("lab-evidence").checked=true;$("lab-affected").checked=false;$("lab-stop").checked=false;evaluate();});
$("lab-download").addEventListener("click",()=>exportJSON({...evaluate(),status:"draft_no_authorization"},"fictional-governance-intake.json"));
root.addEventListener("input",evaluate);root.addEventListener("change",evaluate);evaluate();
}
const labs={"agent-simulator":simulator,"prompt-harness-translator":translator,"ai-prism":prism,
"mcp-agent-risk-checklist":mcp,"nist-rmf-guide":nist,"multi-agent-governance":multiagent,"governance-playbook":governance};
if(labs[slug])labs[slug]();
})();

