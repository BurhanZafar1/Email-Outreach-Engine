import { useState, useEffect, useCallback, useRef } from "react";

const RESUME = `Burhan Zafar | Whitman College '27 | Economics & Mathematics | zafarb@whitman.edu
- Whitman Investment Company Board Member: Researched public companies, built market maps & competitive comps, wrote/presented investment memos, built diligence templates (TAM/SAM/SOM, unit economics)
- Goldman Sachs Endowment Project: Built $250M endowment asset allocation proposal with GS PWM, cross-asset analysis, delivered 17-slide IC deck at Goldman Sachs Seattle
- Gesa Power House Theatre: Built reporting infrastructure for 20K+ patron records, dashboards, data hygiene across CRM/ticketing
- Al Noor Sugar Finance Intern: Automated financial reporting, improved close cycle 15%
- Beta Theta Pi Treasurer: Managed $140K budget, cut unnecessary spend 10%
- Crocs (CROX) Analysis: Fundamentals-driven industry overview, investment-style write-up
- Skills: Excel (PivotTables, VLOOKUP, SUMIFS), PowerPoint, Power BI/Tableau, Python (Pandas), R`;

const SEED = ["HOF Capital","Auldbrass Partners","Balenciaga","LG Electronics","Resolute Investment Managers","AJ Capital Partners","Precision AQ","Skechers","Walt Disney Imagineering","Kemps","State Street","Paragon Insurance","INB Bank","Seacoast Bank","Thermo Fisher Scientific","IMC Financial Markets","Northmarq","LV Collective","Kestra Financial","Deloitte","PwC","EY","KPMG","Lazard","Cascadia Capital","D.A. Davidson","Houlihan Lokey","William Blair","Baird","Piper Sandler","Stifel","Raymond James","Stephens Inc","BMO Capital Markets","Jefferies","Guggenheim Securities","Needham Bank","NEPC","Renewa LLC","Willis Johnson Associates","Canon USA","The Dermot Company","Vera Institute","BioLife Takeda","SharkNinja","Tighe Bond","Gelber Group","Hudson Institute","Conair","Apple","Blackstone","KKR","Carlyle Group","Apollo Global","TPG Capital","Warburg Pincus","General Atlantic","Insight Partners","StepStone Group","Graham Partners","Alpine Investors","Capula Investment","Citadel","Point72","Millennium Mgmt","Two Sigma","DE Shaw","Bridgewater","AQR Capital","Marshall Wace","Schonfeld Strategic","Tudor Investment","Goldman Sachs","Morgan Stanley","JP Morgan","Bank of America","Citi","Barclays","UBS","Deutsche Bank","Evercore","Centerview Partners","PJT Partners","Moelis","Perella Weinberg","Greenhill Mizuho","Rothschild","Qatalyst Partners","Allen Company","Cowen","Oppenheimer","Canaccord Genuity","Maxim Group","B Riley Financial","Craig-Hallum","Lake Street Capital","Northland Capital","Roth Capital","Wedbush Securities","Janney Montgomery"];

function Badge({ status }) {
  const m = { new:"#6366f1", researching:"#f59e0b", researched:"#8b5cf6", contact_found:"#06b6d4", drafted:"#c084fc", sent:"#22d3ee", followed_up:"#fb923c", replied:"#10b981", interview:"#f97316" };
  return <span style={{ background: (m[status]||"#666")+"22", color: m[status]||"#999", border: `1px solid ${(m[status]||"#666")}44`, padding:"2px 10px", borderRadius:20, fontSize:10, fontWeight:600, textTransform:"uppercase", letterSpacing:0.5, whiteSpace:"nowrap" }}>{status.replace("_"," ")}</span>;
}

async function ai(key, prompt, search=false) {
  const body = { model:"claude-sonnet-4-20250514", max_tokens:1024, messages:[{role:"user",content:prompt}] };
  if (search) body.tools = [{type:"web_search_20250305",name:"web_search"}];
  const r = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key },
    body: JSON.stringify(body),
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error.message || JSON.stringify(d.error));
  return d.content?.filter(b=>b.type==="text").map(b=>b.text).join("\n")||"";
}

function parseJSON(text) {
  const c = text.replace(/```json?/g,"").replace(/```/g,"").trim();
  const s = c.indexOf("{")!==-1?c.indexOf("{"):c.indexOf("[");
  const e = c.lastIndexOf("}")!==-1?c.lastIndexOf("}"):c.lastIndexOf("]");
  if (s===-1) return null;
  try { return JSON.parse(c.substring(s, e+1)); } catch { return null; }
}

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [cfg, setCfg] = useState({key:"",hunter:"",gmail:"zafarb@whitman.edu"});
  const [cos, setCos] = useState([]);
  const [week, setWeek] = useState(1);
  const [hist, setHist] = useState([]);
  const [logs, setLogs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState("");
  const [prog, setProg] = useState({c:0,t:0});
  const [sel, setSel] = useState(null);
  const stop = useRef(false);

  useEffect(()=>{try{
    const a=localStorage.getItem("oe-cfg"); if(a)setCfg(JSON.parse(a));
    const b=localStorage.getItem("oe-cos"); if(b)setCos(JSON.parse(b));
    const c=localStorage.getItem("oe-wk"); if(c)setWeek(parseInt(c));
    const d=localStorage.getItem("oe-hist"); if(d)setHist(JSON.parse(d));
    const e=localStorage.getItem("oe-logs"); if(e)setLogs(JSON.parse(e));
  }catch(e){}},[]);

  const sv=useCallback((k,v)=>{try{localStorage.setItem(k,typeof v==="string"?v:JSON.stringify(v))}catch(e){}},[]);
  const log=useCallback(m=>{setLogs(p=>{const n=[{t:new Date().toLocaleTimeString(),m},...p].slice(0,300);sv("oe-logs",n);return n})},[sv]);
  const upd=useCallback((id,u)=>{setCos(p=>{const n=p.map(c=>c.id===id?{...c,...u}:c);sv("oe-cos",n);return n})},[sv]);

  const discover = useCallback(async()=>{
    if(!cfg.key){alert("Add Claude API key in Settings first");return}
    setBusy(true);stop.current=false;setStep("Discovering companies...");log("🔍 Starting discovery for Week "+week);
    const used=new Set([...hist.map(c=>c.name),...cos.map(c=>c.name)]);
    const seeds=SEED.filter(n=>!used.has(n)).slice(0,30);
    try{
      const r=await ai(cfg.key,`Search the web for US companies hiring finance/analytics/investment interns for summer 2026 that are still recruiting. 

Already contacted (skip): ${[...used].slice(0,40).join(", ")}

Return EXACTLY 70 companies as JSON array. Each: {"name":"...","type":"e.g. Middle Market IB","location":"City, ST","role":"specific intern title","website":"domain.com","targetTitle":"who to email e.g. Managing Director","hook":"1 sentence why interesting"}

ONLY JSON array, no markdown.`,true);
      let found=[];const p=parseJSON(r);if(Array.isArray(p))found=p;
      const seedCos=seeds.map(name=>({name,type:"Finance",location:"US",role:"Finance Intern",website:name.toLowerCase().replace(/[^a-z]/g,"")+".com",targetTitle:"Director, Finance",hook:"Potential opportunity"}));
      const all=[...found,...seedCos].filter(c=>c.name&&!used.has(c.name)).slice(0,100).map((c,i)=>({id:Date.now()+i,...c,status:"new",research:null,contact:null,draft:null,followUp:null,sentAt:null,fuSentAt:null,week}));
      setCos(all);sv("oe-cos",all);log(`✅ Found ${all.length} companies`);
    }catch(e){log("❌ "+e.message)}
    setBusy(false);setStep("");
  },[cfg,week,hist,cos,log,sv]);

  const research = useCallback(async(c)=>{
    upd(c.id,{status:"researching"});log(`🔬 Researching ${c.name}...`);
    try{
      const r=await ai(cfg.key,`Research "${c.name}" company. Search the web. Find: 1) What they do (2 sentences) 2) Recent news/deals (last 6 months) 3) Current hiring needs 4) A specific project/initiative to reference in a cold email. Return JSON: {"desc":"...","news":"...","needs":"...","hook":"..."} ONLY JSON.`,true);
      const d=parseJSON(r)||{desc:c.type,news:"N/A",needs:"N/A",hook:c.hook};
      upd(c.id,{status:"researched",research:d});log(`✅ ${c.name} researched`);
    }catch(e){log(`❌ ${c.name}: ${e.message}`);upd(c.id,{status:"new"})}
  },[cfg,upd,log]);

  const findContact = useCallback(async(c)=>{
    log(`👤 Finding contact at ${c.name}...`);
    if(cfg.hunter&&c.website){
      try{
        const r=await fetch(`https://api.hunter.io/v2/domain-search?domain=${c.website}&api_key=${cfg.hunter}&limit=5&department=executive,finance`);
        const d=await r.json();
        if(d.data?.emails?.length){
          const b=d.data.emails.find(e=>/director|vp|partner|head|chief|managing/i.test(e.position||""))||d.data.emails[0];
          upd(c.id,{status:"contact_found",contact:{name:`${b.first_name||""} ${b.last_name||""}`.trim(),email:b.value,title:b.position||"Finance Professional",conf:b.confidence||0}});
          log(`✅ Found ${b.first_name} at ${c.name} via Hunter`);return;
        }
      }catch(e){}
    }
    try{
      const r=await ai(cfg.key,`Find a decision-maker at ${c.name} (${c.website}) for a finance internship email. Target: ${c.targetTitle}. Search the web for their name and email. Return JSON: {"name":"...","title":"...","email":"...","conf":0-100} ONLY JSON.`,true);
      const d=parseJSON(r);
      if(d?.email){upd(c.id,{status:"contact_found",contact:d});log(`✅ Found ${d.name} at ${c.name}`);return}
    }catch(e){}
    upd(c.id,{status:"contact_found",contact:{name:c.targetTitle,title:c.targetTitle,email:`careers@${c.website}`,conf:10}});
    log(`⚠️ Fallback contact for ${c.name}`);
  },[cfg,upd,log]);

  const draft = useCallback(async(c)=>{
    log(`✉️ Drafting for ${c.name}...`);
    const rs=c.research||{};const ct=c.contact||{};
    try{
      const r=await ai(cfg.key,`Write a cold internship outreach email. STRICT RULES:
- UNDER 120 words. Short paragraphs.
- Structure: Hook (reference something specific about them) → What I bring to THEIR team → Ask for 15-min call
- Sound human, direct, confident. No generic flattery.
- No "I hope this finds you well" or similar filler

RECIPIENT: ${ct.name} (${ct.title}) at ${c.name}
ROLE: ${c.role}
COMPANY INFO: ${rs.desc||c.type}
RECENT NEWS: ${rs.news||"N/A"}  
THEIR NEEDS: ${rs.needs||"N/A"}
SPECIFIC HOOK: ${rs.hook||c.hook}

MY BACKGROUND: ${RESUME}

Return JSON: {"subject":"...","body":"...","followUp":"2-sentence follow-up for 5 days later"} ONLY JSON.`);
      const d=parseJSON(r)||{subject:`Whitman Junior — ${c.role} Interest`,body:r.slice(0,600),followUp:"Just bumping this — happy to work around your schedule."};
      upd(c.id,{status:"drafted",draft:d,followUp:d.followUp});log(`✅ Drafted for ${c.name}`);
    }catch(e){log(`❌ Draft failed: ${e.message}`)}
  },[cfg,upd,log]);

  const runAll = useCallback(async()=>{
    if(!cfg.key){alert("Add Claude API key first");return}
    setBusy(true);stop.current=false;
    const total=cos.length;
    for(let i=0;i<cos.length&&!stop.current;i++){
      const c=cos[i];setProg({c:i+1,t:total});
      if(c.status==="new"){setStep(`Research ${c.name} (${i+1}/${total})`);await research(c);await new Promise(r=>setTimeout(r,2000))}
    }
    let latest;setCos(p=>{latest=p;return p});
    for(let i=0;i<(latest||cos).length&&!stop.current;i++){
      const c=(latest||cos)[i];
      if(c.status==="researched"){setStep(`Contact at ${c.name}`);await findContact(c);await new Promise(r=>setTimeout(r,1500))}
    }
    setCos(p=>{latest=p;return p});
    for(let i=0;i<(latest||cos).length&&!stop.current;i++){
      const c=(latest||cos)[i];
      if(c.status==="contact_found"){setStep(`Drafting ${c.name}`);await draft(c);await new Promise(r=>setTimeout(r,2000))}
    }
    setBusy(false);setStep("");log("🎉 Pipeline complete!");
  },[cfg,cos,research,findContact,draft,log]);

  const gmailLink=(c)=>{
    if(!c.draft||!c.contact)return"#";
    return`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(c.contact.email)}&su=${encodeURIComponent(c.draft.subject)}&body=${encodeURIComponent(c.draft.body+"\n\n—\nResume & portfolio: https://burhanzafar1.github.io/Burhan-Zafar/")}`;
  };
  const fuLink=(c)=>{
    if(!c.contact)return"#";
    return`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(c.contact.email)}&su=${encodeURIComponent("Re: "+(c.draft?.subject||"Internship"))}&body=${encodeURIComponent(c.followUp||"Hi — just bumping this. Happy to work around your schedule.\n\nBest,\nBurhan")}`;
  };

  const markSent=(id)=>upd(id,{status:"sent",sentAt:new Date().toISOString()});
  const markFU=(id)=>upd(id,{status:"followed_up",fuSentAt:new Date().toISOString()});
  const markReply=(id)=>upd(id,{status:"replied"});
  const markInterview=(id)=>upd(id,{status:"interview"});

  const newWeek=async()=>{
    const a=cos.map(c=>({...c,archivedWeek:week}));
    const nh=[...hist,...a];setHist(nh);sv("oe-hist",nh);
    setCos([]);sv("oe-cos",[]);const nw=week+1;setWeek(nw);sv("oe-wk",String(nw));
    log(`🔄 Week ${nw} started — ${a.length} archived`);
  };

  const st={
    total:cos.length,
    newC:cos.filter(c=>c.status==="new").length,
    res:cos.filter(c=>["researched","researching"].includes(c.status)).length,
    con:cos.filter(c=>c.status==="contact_found").length,
    dra:cos.filter(c=>c.status==="drafted").length,
    sent:cos.filter(c=>["sent","followed_up","replied","interview"].includes(c.status)).length,
    fuDue:cos.filter(c=>c.status==="sent"&&c.sentAt&&(Date.now()-new Date(c.sentAt).getTime())/864e5>=5).length,
    rep:cos.filter(c=>c.status==="replied").length,
    int:cos.filter(c=>c.status==="interview").length,
  };
  const fuList=cos.filter(c=>c.status==="sent"&&c.sentAt&&(Date.now()-new Date(c.sentAt).getTime())/864e5>=5);

  return (
    <div style={{minHeight:"100vh",background:"#08080f",color:"#d0d0e8",fontFamily:"'Menlo','SF Mono','Courier New',monospace"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#2a2a4e;border-radius:3px}
        .cd{background:#0f0f1a;border:1px solid #1a1a30;border-radius:10px;padding:16px;transition:border-color .2s}
        .cd:hover{border-color:#2a2a50}
        .bt{padding:7px 16px;border-radius:7px;border:1px solid #252545;background:#131325;color:#b0b0d0;cursor:pointer;font:inherit;font-size:11px;font-weight:500;transition:all .15s}
        .bt:hover:not(:disabled){background:#1a1a35;border-color:#4040a0}.bt:disabled{opacity:.4;cursor:default}
        .bp{background:#4f46e5;border-color:#6366f1;color:#fff}.bp:hover:not(:disabled){background:#5b52f0}
        .bg{background:#065f46;border-color:#10b981;color:#a7f3d0}.bg:hover:not(:disabled){background:#047857}
        .bw{background:#78350f;border-color:#f59e0b;color:#fef3c7}.bw:hover:not(:disabled){background:#92400e}
        .br{background:#7f1d1d;border-color:#dc2626;color:#fecaca}.br:hover:not(:disabled){background:#991b1b}
        .inp{padding:7px 12px;border-radius:7px;border:1px solid #1a1a30;background:#0a0a14;color:#d0d0e8;font:inherit;font-size:12px;width:100%;outline:none}
        .inp:focus{border-color:#6366f1}
        .tb{padding:9px 18px;cursor:pointer;border:none;background:none;color:#5a5a8e;font:inherit;font-size:12px;font-weight:500;border-bottom:2px solid transparent;transition:all .2s}
        .tb:hover{color:#9090c0}.tb.on{color:#b0b0ee;border-bottom-color:#6366f1}
        @keyframes pl{0%,100%{opacity:1}50%{opacity:.4}}.pl{animation:pl 1.5s ease infinite}
        .ep{background:#0a0a16;border:1px solid #1a1a30;border-radius:7px;padding:14px;font-size:11.5px;line-height:1.65;white-space:pre-wrap;max-height:260px;overflow-y:auto;color:#a0a0c8}
      `}</style>

      <div style={{borderBottom:"1px solid #1a1a30",padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"#0b0b16"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:8,background:"linear-gradient(135deg,#6366f1,#a855f7)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>⚡</div>
          <div>
            <div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:16,color:"#e0e0ff"}}>Outreach Engine</div>
            <div style={{fontSize:10,color:"#5a5a8e"}}>Week {week} · {st.total} targets · {st.sent} sent · {st.rep} replies · {st.int} interviews</div>
          </div>
        </div>
        {busy&&<div style={{display:"flex",alignItems:"center",gap:8}}>
          <div className="pl" style={{width:7,height:7,borderRadius:"50%",background:"#10b981"}}/>
          <span style={{fontSize:11,color:"#10b981",maxWidth:300,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{step}</span>
          <button className="bt br" style={{fontSize:10,padding:"3px 10px"}} onClick={()=>{stop.current=true}}>Stop</button>
        </div>}
      </div>

      <div style={{borderBottom:"1px solid #1a1a30",padding:"0 20px",display:"flex",background:"#0b0b16"}}>
        {["dashboard","pipeline","outbox","follow-ups","settings","logs"].map(t=>(
          <button key={t} className={`tb ${tab===t?"on":""}`} onClick={()=>setTab(t)}>
            {t==="follow-ups"?`Follow-ups${st.fuDue>0?` (${st.fuDue})`:""}`:(t==="dashboard"?"⚡ Dashboard":t.charAt(0).toUpperCase()+t.slice(1))}
          </button>
        ))}
      </div>

      <div style={{padding:20,maxWidth:1100,margin:"0 auto"}}>

        {tab==="dashboard"&&<div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10}}>
            {[{l:"Targets",v:st.total,c:"#6366f1"},{l:"Researched",v:st.res,c:"#8b5cf6"},{l:"Contacts",v:st.con,c:"#06b6d4"},{l:"Drafted",v:st.dra,c:"#c084fc"},{l:"Sent",v:st.sent,c:"#22d3ee"},{l:"Follow-ups",v:st.fuDue,c:"#f59e0b"},{l:"Replies",v:st.rep,c:"#10b981"},{l:"Interviews",v:st.int,c:"#f97316"}].map(s=>(
              <div key={s.l} className="cd" style={{textAlign:"center",padding:14}}>
                <div style={{fontSize:24,fontWeight:700,color:s.c,fontFamily:"'Space Grotesk',sans-serif"}}>{s.v}</div>
                <div style={{fontSize:10,color:"#5a5a8e",marginTop:2}}>{s.l}</div>
              </div>
            ))}
          </div>

          <div className="cd" style={{borderColor:"#2a2a60",boxShadow:"0 0 30px rgba(99,102,241,.08)"}}>
            <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:15,fontWeight:600,color:"#c0c0ff",marginBottom:12}}>🚀 Weekly Pipeline Controls</div>
            {prog.t>0&&<div style={{marginBottom:10}}>
              <div style={{fontSize:10,color:"#5a5a8e",marginBottom:4}}>{prog.c}/{prog.t} processed</div>
              <div style={{width:"100%",height:4,background:"#1a1a30",borderRadius:2,overflow:"hidden"}}>
                <div style={{width:`${(prog.c/prog.t)*100}%`,height:"100%",background:"#6366f1",borderRadius:2,transition:"width .3s"}}/>
              </div>
            </div>}
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <button className="bt bp" disabled={busy} onClick={discover}>
                {cos.length===0?"🔍 Discover 100 Companies":"🔍 Re-discover"}
              </button>
              <button className="bt bp" disabled={busy||cos.length===0} onClick={runAll}>
                ⚡ Run Full Pipeline
              </button>
              <button className="bt bw" disabled={busy} onClick={newWeek}>
                🔄 Start Week {week+1}
              </button>
            </div>
            <div style={{fontSize:10,color:"#5a5a8e",marginTop:12,lineHeight:1.7}}>
              <b>Loop:</b> Discover → AI researches each company → finds decision-maker emails → drafts personalized emails → you send from Outbox → follow-ups appear after 5 days → Start New Week for 100 fresh companies.
            </div>
          </div>

          {hist.length>0&&<div className="cd">
            <div style={{fontSize:13,fontWeight:600,color:"#a0a0d0",marginBottom:6}}>📊 All-Time Stats</div>
            <div style={{fontSize:11,color:"#6b6b9e"}}>
              {hist.length} total contacted · {hist.filter(c=>c.status==="replied").length} replies · {hist.filter(c=>c.status==="interview").length} interviews · {Math.round(hist.filter(c=>c.status==="replied").length/Math.max(hist.filter(c=>["sent","followed_up","replied","interview"].includes(c.status)).length,1)*100)}% response rate
            </div>
          </div>}
        </div>}

        {tab==="pipeline"&&<div style={{display:"flex",flexDirection:"column",gap:6}}>
          <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:15,fontWeight:600,color:"#c0c0ff",marginBottom:6}}>
            Pipeline — {cos.length} companies
          </div>
          {cos.length===0?<div className="cd" style={{textAlign:"center",padding:30,color:"#5a5a8e"}}>No companies. Click "Discover 100 Companies" on Dashboard.</div>:
          cos.map((c,i)=>(
            <div key={c.id} className="cd" style={{padding:12,display:"flex",alignItems:"center",gap:12,cursor:"pointer",background:sel===c.id?"#14142a":"#0f0f1a"}} onClick={()=>setSel(sel===c.id?null:c.id)}>
              <div style={{fontSize:10,color:"#3a3a6e",minWidth:22,textAlign:"right"}}>{i+1}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                  <span style={{fontWeight:600,fontSize:12}}>{c.name}</span>
                  <Badge status={c.status}/>
                </div>
                <div style={{fontSize:10,color:"#5a5a8e",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {c.type} · {c.location} · {c.role}
                </div>
                {c.contact&&<div style={{fontSize:10,color:"#7070a0",marginTop:1}}>👤 {c.contact.name} — {c.contact.email}</div>}
                {sel===c.id&&c.draft&&<div style={{marginTop:8}}>
                  <div style={{fontSize:10,color:"#8080b0",marginBottom:4}}>Subject: {c.draft.subject}</div>
                  <div className="ep">{c.draft.body}</div>
                </div>}
                {sel===c.id&&c.research&&<div style={{marginTop:8,fontSize:10,color:"#6b6b9e",lineHeight:1.6}}>
                  <b>Research:</b> {c.research.desc}<br/><b>News:</b> {c.research.news}<br/><b>Hook:</b> {c.research.hook}
                </div>}
              </div>
              <div style={{display:"flex",gap:5,flexShrink:0}} onClick={e=>e.stopPropagation()}>
                {c.status==="new"&&<button className="bt" style={{fontSize:10,padding:"3px 10px"}} disabled={busy} onClick={()=>research(c)}>Research</button>}
                {c.status==="researched"&&<button className="bt" style={{fontSize:10,padding:"3px 10px"}} disabled={busy} onClick={()=>findContact(c)}>Find Contact</button>}
                {c.status==="contact_found"&&<button className="bt" style={{fontSize:10,padding:"3px 10px"}} disabled={busy} onClick={()=>draft(c)}>Draft</button>}
                {c.status==="drafted"&&<a href={gmailLink(c)} target="_blank" rel="noopener noreferrer" className="bt bg" style={{fontSize:10,padding:"3px 10px",textDecoration:"none"}} onClick={()=>setTimeout(()=>markSent(c.id),500)}>Send ↗</a>}
                {c.status==="sent"&&<button className="bt bg" style={{fontSize:10,padding:"3px 10px"}} onClick={()=>markReply(c.id)}>Got Reply</button>}
                {c.status==="replied"&&<button className="bt bw" style={{fontSize:10,padding:"3px 10px"}} onClick={()=>markInterview(c.id)}>Interview!</button>}
              </div>
            </div>
          ))}
        </div>}

        {tab==="outbox"&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:15,fontWeight:600,color:"#c0c0ff"}}>
            📤 Outbox — {cos.filter(c=>c.status==="drafted").length} ready
          </div>
          <div className="cd" style={{fontSize:11,color:"#6b6b9e",lineHeight:1.7}}>
            <b>Send Tue–Thu, 9–11 AM.</b> Each button opens Gmail Compose pre-filled. <b>Attach your resume PDF</b> before hitting send in Gmail.
          </div>
          {cos.filter(c=>c.status==="drafted").length===0?
            <div className="cd" style={{textAlign:"center",padding:24,color:"#5a5a8e"}}>No drafts. Run the pipeline first.</div>:
            cos.filter(c=>c.status==="drafted").map(c=>(
              <div key={c.id} className="cd">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div>
                    <div style={{fontWeight:600,fontSize:13}}>{c.name}</div>
                    <div style={{fontSize:10,color:"#5a5a8e"}}>To: {c.contact?.name} &lt;{c.contact?.email}&gt; · {c.contact?.title}</div>
                  </div>
                  <a href={gmailLink(c)} target="_blank" rel="noopener noreferrer" className="bt bg" style={{textDecoration:"none",fontSize:11}} onClick={()=>setTimeout(()=>markSent(c.id),500)}>
                    Open Gmail & Send ↗
                  </a>
                </div>
                <div style={{fontSize:10,color:"#7070a0",marginBottom:6}}>Subject: {c.draft?.subject}</div>
                <div className="ep">{c.draft?.body}</div>
              </div>
            ))}
        </div>}

        {tab==="follow-ups"&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:15,fontWeight:600,color:"#c0c0ff"}}>
            🔔 Follow-ups — {fuList.length} due
          </div>
          {fuList.length===0?
            <div className="cd" style={{textAlign:"center",padding:24,color:"#5a5a8e"}}>
              {cos.filter(c=>c.status==="sent").length>0?`${cos.filter(c=>c.status==="sent").length} sent — follow-ups appear after 5 days`:"No emails sent yet."}
            </div>:
            fuList.map(c=>{
              const days=Math.floor((Date.now()-new Date(c.sentAt).getTime())/864e5);
              return(
                <div key={c.id} className="cd">
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <div>
                      <div style={{fontWeight:600,fontSize:13}}>{c.name}</div>
                      <div style={{fontSize:10,color:"#f59e0b"}}>Sent {days}d ago to {c.contact?.name} ({c.contact?.email})</div>
                    </div>
                    <div style={{display:"flex",gap:5}}>
                      <a href={fuLink(c)} target="_blank" rel="noopener noreferrer" className="bt bw" style={{textDecoration:"none",fontSize:11}} onClick={()=>setTimeout(()=>markFU(c.id),500)}>Send Follow-up ↗</a>
                      <button className="bt bg" style={{fontSize:11}} onClick={()=>markReply(c.id)}>Got Reply</button>
                    </div>
                  </div>
                  <div className="ep">{c.followUp||"Hi — just bumping this to the top of your inbox. Happy to work around your schedule for a brief call.\n\nBest,\nBurhan"}</div>
                </div>
              );
            })}
          {cos.filter(c=>c.status==="sent"&&!fuList.includes(c)).length>0&&<>
            <div style={{fontSize:12,fontWeight:600,color:"#5a5a8e",marginTop:8}}>⏳ Waiting ({cos.filter(c=>c.status==="sent"&&!fuList.includes(c)).length})</div>
            {cos.filter(c=>c.status==="sent"&&!fuList.includes(c)).map(c=>{
              const d=Math.floor((Date.now()-new Date(c.sentAt).getTime())/864e5);
              return <div key={c.id} className="cd" style={{padding:10,opacity:.6}}>
                <span style={{fontSize:12,fontWeight:500}}>{c.name}</span>
                <span style={{fontSize:10,color:"#5a5a8e",marginLeft:10}}>sent {d}d ago — follow-up in {5-d}d</span>
              </div>;
            })}
          </>}
        </div>}

        {tab==="settings"&&<div style={{display:"flex",flexDirection:"column",gap:16,maxWidth:500}}>
          <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:15,fontWeight:600,color:"#c0c0ff"}}>⚙️ Settings</div>
          <div className="cd">
            <div style={{fontWeight:600,fontSize:12,marginBottom:10,color:"#9090c0"}}>API Keys</div>
            {[
              {k:"key",l:"Claude API Key (required)",p:"sk-ant-...",h:"console.anthropic.com — free credits for new accounts"},
              {k:"hunter",l:"Hunter.io Key (optional)",p:"Hunter key...",h:"hunter.io — 25 free searches/month"},
              {k:"gmail",l:"Your Gmail",p:"you@gmail.com",h:"Used for Gmail compose links"},
            ].map(f=>(
              <div key={f.k} style={{marginBottom:12}}>
                <label style={{fontSize:10,color:"#5a5a8e",display:"block",marginBottom:3}}>{f.l} — <span style={{color:"#6366f1"}}>{f.h}</span></label>
                <input className="inp" type={f.k==="gmail"?"email":"password"} placeholder={f.p} value={cfg[f.k]}
                  onChange={e=>{const n={...cfg,[f.k]:e.target.value};setCfg(n);sv("oe-cfg",n)}}/>
              </div>
            ))}
          </div>
          <div className="cd">
            <div style={{fontWeight:600,fontSize:12,marginBottom:8,color:"#9090c0"}}>Quick Start</div>
            <div style={{fontSize:11,color:"#7070a0",lineHeight:1.8}}>
              <b>1.</b> Paste Claude API key above<br/>
              <b>2.</b> Dashboard → "Discover 100 Companies"<br/>
              <b>3.</b> Dashboard → "Run Full Pipeline" (researches, finds contacts, drafts emails)<br/>
              <b>4.</b> Outbox → click Send for each (opens Gmail pre-filled)<br/>
              <b>5.</b> Attach resume PDF in Gmail before sending<br/>
              <b>6.</b> Check Follow-ups tab daily<br/>
              <b>7.</b> "Start New Week" → fresh 100 companies, repeat<br/>
              <b>Tip:</b> Send Tue–Thu, 9–11 AM. 20–50/day max for deliverability.
            </div>
          </div>
          <div className="cd">
            <button className="bt br" onClick={()=>{if(confirm("Delete ALL data?")){setCos([]);setHist([]);setLogs([]);setWeek(1);["oe-cos","oe-hist","oe-logs","oe-wk","oe-cfg"].forEach(k=>localStorage.removeItem(k))}}}>
              🗑️ Reset Everything
            </button>
          </div>
        </div>}

        {tab==="logs"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:15,fontWeight:600,color:"#c0c0ff"}}>📋 Activity Log</div>
            <button className="bt" style={{fontSize:10}} onClick={()=>{setLogs([]);sv("oe-logs",[])}}>Clear</button>
          </div>
          <div className="cd" style={{maxHeight:500,overflowY:"auto",padding:0}}>
            {logs.length===0?<div style={{padding:24,textAlign:"center",color:"#5a5a8e"}}>No activity yet</div>:
            logs.map((l,i)=>(
              <div key={i} style={{padding:"6px 14px",borderBottom:"1px solid #14142a",fontSize:11,display:"flex",gap:10}}>
                <span style={{color:"#3a3a6e",flexShrink:0,fontSize:10}}>{l.t}</span>
                <span style={{color:"#8080b0"}}>{l.m}</span>
              </div>
            ))}
          </div>
        </div>}

      </div>
    </div>
  );
}
