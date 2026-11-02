/* Source-bounded Markdown/YAML translator for the published sample shape.
 * Source: simaba/prompt-harness-translator@6a431004c06de1abca4dc47c5f6476ef4f00bf8e
 * Accepts a deliberately strict, common YAML subset. Invalid/unsupported YAML is
 * refused, not silently rewritten. See SUPPORTED_FORMATS.md in the source repo.
 * No remote parsing, external scripts, code execution or behavioral-equivalence claim.
 */
((root)=>{
"use strict";
const targets=["codex","cursor","generic"];
const badKeys=new Set(["__proto__","prototype","constructor"]);
const limits=Object.freeze({bytes:32768,lines:500,depth:12,entries:150});
function fail(message,line){throw new Error((line===undefined?"":"Line "+(line+1)+": ")+message);}
function splitComma(str,line){
 const segments=[];let start=0,quote="",depth=0,escape=false;
 for(let i=0;i<str.length;i++){
   const c=str[i];
   if(escape){escape=false;continue;}
   if(quote){if(c==="\\"&&quote==='"'){escape=true;continue;}if(c===quote){quote="";}continue;}
   if(c==='"'||c==="'"){quote=c;continue;}
   if(c==="["||c==="{")depth++;
   if(c==="]"||c==="}")depth--;
   if(depth<0)fail("Unbalanced flow structure.",line);
   if(c===","&&depth===0){segments.push(str.slice(start,i).trim());start=i+1;}
 }
 if(quote||depth!==0)fail("Unbalanced or unterminated flow value.",line);
 segments.push(str.slice(start).trim());
 if(segments.some((x,i)=>!x&&i<segments.length-1))fail("Empty item in flow sequence.",line);
 return segments.filter(Boolean);
}
function asScalar(raw,line,allowComplex=true){
 const value=raw.trim();
 if(value===""||value==="null"||value==="~")return null;
 if(/^(?:!!|!|&|\*|<<\s*:)/.test(value))
   fail("YAML tags, anchors, aliases and merge keys are not supported by this browser subset.",line);
 if(value[0]==='"'){
   try{const parsed=JSON.parse(value);if(typeof parsed!=="string")fail("Expected quoted string.",line);return parsed;}
   catch(e){fail("Invalid double-quoted YAML string.",line);}
 }
 if(value[0]==="'"){
   if(!value.endsWith("'")||value.length<2)fail("Unterminated single-quoted string.",line);
   return value.slice(1,-1).replace(/''/g,"'");
 }
 if(allowComplex&&value[0]==="["){
   if(!value.endsWith("]"))fail("Unclosed YAML sequence.",line);
   return splitComma(value.slice(1,-1),line).map(x=>asScalar(x,line));
 }
 if(allowComplex&&value[0]==="{"){
   if(!value.endsWith("}"))fail("Unclosed inline mapping.",line);
   const o={};
   for(const item of splitComma(value.slice(1,-1),line)){
     const m=item.match(/^([^:]+):\s*(.*)$/);
     if(!m)fail("Invalid inline mapping entry.",line);
     const key=String(asScalar(m[1],line,false));
     if(badKeys.has(key)||Object.hasOwn(o,key))fail("Unsafe or duplicate YAML key.",line);
     o[key]=asScalar(m[2],line);
   }
   return o;
 }
 // Reject non-string YAML keys, timestamps and exotic scalar types instead of
 // silently treating values differently from Python's safe_load().
 if(/^(?:true|false)$/i.test(value))return value.toLowerCase()==="true";
 if(/^(?:yes|no|on|off)$/i.test(value))return ["yes","on"].includes(value.toLowerCase());
 if(/^[-+]?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][-+]?\d+)?$/.test(value)){
   const n=Number(value);if(Number.isFinite(n))return n;
   fail("Number is not finite.",line);
 }
 if(/^(?:\d{4}-\d{2}-\d{2}|\.nan|[+-]?\.inf)$/i.test(value))
   fail("Date and special floating-point types are outside this browser subset.",line);
 if(/:\s/.test(value)||/[\[\]{}]/.test(value))fail("Quote strings with colons or flow delimiters.",line);
 const unquoted=value.replace(/\s+#.*$/,"").trim();
 if(unquoted.startsWith("!")||unquoted.startsWith("&")||unquoted.startsWith("*"))fail("Unsupported YAML tag or reference.",line);
 return unquoted;
}
function parseYaml(content){
 if(content.length>limits.bytes)fail("Frontmatter exceeds the 32 KiB limit.");
 const lines=content.replace(/\r\n?/g,"\n").split("\n");
 if(lines.length>limits.lines)fail("Too many YAML lines.");
 let cursor=0,count=0;
 const blank=x=>!x.trim()||x.trimStart().startsWith("#");
 const indent=i=>{
   const m=lines[i].match(/^[ \t]*/)[0];
   if(m.includes("\t"))fail("Tab indentation is not supported.",i);
   return m.length;
 };
 function next(){while(cursor<lines.length&&blank(lines[cursor]))cursor++;}
 function blockText(parent,fold,chomp){
   let blockIndent=null;const vals=[];
   while(cursor<lines.length){
     const raw=lines[cursor],sp=indent(cursor);
     if(raw.trim()&&sp<=parent)break;
     if(raw.trim()&&blockIndent===null)blockIndent=sp;
     if(raw.trim()&&sp<blockIndent)fail("Invalid block-scalar indentation.",cursor);
     vals.push(raw.trim()?raw.slice(blockIndent):"");cursor++;
   }
   let out=fold?vals.join("\n").replace(/([^\n])\n([^\n])/g,"$1 $2"):vals.join("\n");
   out=chomp==="-"?out.replace(/\n+$/,""):chomp==="+"?out+"\n":out.replace(/\n*$/,"\n");
   return out;
 }
 function parse(depth=0){
   if(depth>limits.depth)fail("YAML nesting is too deep.");
   next();if(cursor>=lines.length)return null;
   const base=indent(cursor),array=/^-\s(?:.*)$|^-$/.test(lines[cursor].trim());
   const out=array?[]:{};
   while(cursor<lines.length){
     next();if(cursor>=lines.length)break;
     const n=indent(cursor);if(n<base)break;
     if(n>base)fail("Unexpected YAML indentation.",cursor);
     const row=lines[cursor].slice(n),isArray=/^-\s(?:.*)$|^-$/.test(row);
     if(isArray!==array)fail("Mixed list and mapping entries at one indentation level.",cursor);
     let raw,key;
     if(array){raw=row==="-"?"":row.slice(2);cursor++;}
     else{
       const m=row.match(/^([A-Za-z_][\w.-]*|"(?:[^"\\]|\\.)*"|'(?:[^']|'')*'):\s*(.*)$/);
       if(!m)fail("Expected a simple YAML mapping key; unsupported syntax requires the Python CLI.",cursor);
       key=m[1].startsWith('"')||m[1].startsWith("'")?asScalar(m[1],cursor,false):m[1];
       if(badKeys.has(key)||Object.hasOwn(out,key))fail("Duplicate or unsafe key: "+key,cursor);
       raw=m[2];cursor++;
     }
     count++;if(count>limits.entries)fail("Too many YAML entries.");
     let value;
     if(/^[|>][+-]?\s*$/.test(raw.trim())){
       const spec=raw.trim();value=blockText(n,spec[0]===">",spec[1]||"");
     }else if(raw.trim()===""){
       let look=cursor;while(look<lines.length&&blank(lines[look]))look++;
       if(look<lines.length&&indent(look)>n){cursor=look;value=parse(depth+1);}
       else value=null;
     }else value=asScalar(raw,cursor-1);
     if(array)out.push(value);else out[key]=value;
   }
   return out;
 }
 const parsed=parse();
 next();if(cursor<lines.length)fail("Unprocessed YAML lines.",cursor);
 if(parsed===null)return {};
 if(Array.isArray(parsed)||typeof parsed!=="object")fail("Frontmatter must be a YAML mapping.");
 return parsed;
}
function parseSource(markdown){
 if(typeof markdown!=="string"||markdown.length>limits.bytes*2)
   fail("Markdown source must be text no longer than 64 KiB.");
 const lines=markdown.replace(/^\uFEFF/,"").replace(/\r\n?/g,"\n").split("\n");
 if(lines[0]?.trim()!=="---")fail("Expected YAML frontmatter delimited by ---.");
 const end=lines.findIndex((line,i)=>i>0&&line.trim()==="---");
 if(end<0)fail("Closing frontmatter delimiter --- is missing.");
 const metadata=parseYaml(lines.slice(1,end).join("\n"));
 const name=Object.hasOwn(metadata,"name")?metadata.name:"agent";
 const description=Object.hasOwn(metadata,"description")?metadata.description:"";
 if(typeof name!=="string"||!name.trim())fail("frontmatter.name must be a nonempty string.");
 if(typeof description!=="string")fail("frontmatter.description must be a string.");
 for(const k of Object.keys(metadata))if(badKeys.has(k))fail("Unsafe metadata key.");
 return {name:name.trim(),description:description.trim(),
   instructions:lines.slice(end+1).join("\n").trim(),metadata,
   unsupported_fields:Object.fromEntries(Object.entries(metadata).filter(([k])=>!["name","description"].includes(k)))};
}
function yamlScalar(v){
 if(v===null||v===undefined)return "null";
 if(typeof v==="boolean"||typeof v==="number")return String(v);
 return JSON.stringify(String(v));
}
function dumpYaml(input,indent=0){
 const lines=[],spaces=" ".repeat(indent);
 const entries=Array.isArray(input)?input.map(x=>[null,x]):Object.entries(input);
 for(const [key,value] of entries){
   const prefix=key===null?spaces+"- ":spaces+key+": ";
   const childIndent=indent+2;
   if(Array.isArray(value)&&value.length===0){lines.push(prefix+"[]");continue;}
   if(value&&typeof value==="object"&&!Array.isArray(value)&&Object.keys(value).length===0){lines.push(prefix+"{}");continue;}
   if(value!==null&&typeof value==="object"){
     lines.push(prefix.trimEnd());
     lines.push(dumpYaml(value,childIndent).replace(/\n$/,""));
   }else if(typeof value==="string"&&value.includes("\n")){
     // YAML's strip chomping would drop a trailing newline that Python
     // safe_load retains for literal | blocks. Preserve that distinction.
     const trailing=value.endsWith("\n");
     lines.push(prefix+(trailing?"|":"|-"));
     const parts=value.split("\n");
     if(trailing)parts.pop();
     lines.push(...parts.map(x=>" ".repeat(childIndent)+x));
   }else lines.push(prefix+yamlScalar(value));
 }
 return lines.join("\n")+"\n";
}
function convert(parsed,target){
 const t=String(target).toLowerCase();
 if(!targets.includes(t))fail("Unsupported target; supported: codex, cursor, generic.");
 const meta=parsed.metadata;
 const mapped=new Set(t==="codex"?["name","description"]:t==="cursor"?["name"]:Object.keys(meta));
 const unmapped=Object.fromEntries(Object.entries(meta).filter(([k])=>!mapped.has(k)));
 const lost=Object.keys(unmapped).sort();
 const loss=lost.length>0;
 const warning=loss?"> **Lossy conversion warning:** this target does not natively apply all source metadata. Preserved for review: "+lost.join(", ")+".\n\n":"";
 let output;
 if(t==="codex"){
   output="# "+parsed.name+"\n\n"+warning+parsed.description+"\n\n## Instructions\n\n"+parsed.instructions+"\n";
   if(loss)output+="\n## Unmapped source metadata\n\n\`\`\`yaml\n"+dumpYaml(Object.fromEntries(Object.entries(unmapped).sort(([a],[b])=>a.localeCompare(b)))).trimEnd()+"\n\`\`\`\n";
 }else if(t==="cursor"){
   const obj={name:parsed.name,rule:parsed.instructions};
   if(loss){obj.conversion_warning="Lossy conversion: review source_metadata before use; these fields are preserved but not enforced by the target representation.";obj.source_metadata=unmapped;}
   output=dumpYaml(obj);
 }else output=dumpYaml({...meta,instructions:parsed.instructions});
 return {target:t,output,lost,unmapped,metadata:meta,parsed};
}
const api=Object.freeze({targets,limits,parseSource,parseYaml,dumpYaml,convert});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.PortfolioPromptTranslation=api;
})(typeof globalThis!=="undefined"?globalThis:window);
