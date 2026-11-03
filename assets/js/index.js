/* MINDOVA — index sahifasi skripti */
(function(){var d=document,els=d.querySelectorAll(".rv");d.documentElement.classList.add("js");
 if(!("IntersectionObserver" in window)){els.forEach(function(n){n.classList.add("in")});return}
 var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}})},{threshold:.12});
 els.forEach(function(n){io.observe(n)});
})();

const CFG={URL:"https://zrebikqvjbvuwbzcunkw.supabase.co",KEY:"sb_publishable_DszdaPjNPM3i0UbGX3lLjQ_DTjdfLcW",TG:"https://t.me/Mindova_uz",ADMIN:"https://t.me/Mindova_admin",GATE:false};
const $=q=>document.querySelector(q);
const T=k=>(window.MI18N?MI18N.t(k):k);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const safe=u=>{try{const x=new URL(u);return /^https?:$/.test(x.protocol)?x.href:""}catch{return""}};
const ML=()=>window.MI18N&&MI18N.lang==="en"
 ?["January","February","March","April","May","June","July","August","September","October","November","December"]
 :["yanvar","fevral","mart","aprel","may","iyun","iyul","avgust","sentabr","oktabr","noyabr","dekabr"];
const fd=d=>{if(!d)return"";const x=new Date(d);return isNaN(x)?"":`${x.getDate()}-${ML()[x.getMonth()]} ${x.getFullYear()}`};
const ft=d=>{const x=new Date(d);return `${String(x.getHours()).padStart(2,"0")}:${String(x.getMinutes()).padStart(2,"0")}`};
const money=n=>String(n||0).replace(/\B(?=(\d{3})+(?!\d))/g," ")+" "+T("currency");
const empty=t=>`<div class="empty">${t}</div>`;

/* Interfeys: bu qism Supabase yuklanmasa ham ishlaydi */
$("#yr").textContent=new Date().getFullYear();
addEventListener("scroll",()=>$("#nav").classList.toggle("scrolled",scrollY>12),{passive:true});
$("#tg1").href=$("#tg2").href=CFG.TG;
if(!CFG.ADMIN.includes("ADMIN_USERNAME")){$("#adm").href=CFG.ADMIN;$("#adm").hidden=false}
/* Mobil menyu */
const nav=$("#nav"),burger=$("#burger");
const setNav=open=>{nav.classList.toggle("open",open);burger.setAttribute("aria-expanded",open?"true":"false")};
burger.onclick=()=>setNav(!nav.classList.contains("open"));
document.querySelectorAll("#nav .links a,#nav .nr a").forEach(a=>a.addEventListener("click",()=>setNav(false)));
addEventListener("keydown",e=>{if(e.key==="Escape")setNav(false)});
addEventListener("resize",()=>{if(innerWidth>980)setNav(false)});
document.addEventListener("click",e=>{if(nav.classList.contains("open")&&!nav.contains(e.target))setNav(false)});
$("#closeLogin").onclick=()=>$("#loginModal").classList.remove("open");

const sb=window.supabase?supabase.createClient(CFG.URL,CFG.KEY):null;

/* Kirish / ro‘yxatdan o‘tish paneli. Birinchi kirishda faqat shu panel ochiladi (CFG.GATE=false bo‘lsa, majburiy emas) */
const ME={user:null,profile:null,regs:new Set(),ready:Promise.resolve()};
let signup=true,EVD=null,OPD=[];
const lf=$("#loginForm");
function setMode(s){signup=s;$("#authTitle").textContent=T(s?"auth_signup_title":"auth_login_title");$("#authBtn").textContent=T(s?"auth_signup":"auth_login");$("#suFields").hidden=!s;$("#authSwap").textContent=T(s?"to_login":"to_signup");$("#fpWrap").hidden=s;$("#loginErr").style.color="";$("#loginErr").textContent=""}
function openAuth(gate,s){setMode(s!==false);$("#closeLogin").hidden=!!gate;$("#loginModal").classList.add("open");if(gate)document.body.style.overflow="hidden"}
$("#openLogin").onclick=async()=>{setNav(false);try{await ME.ready}catch{};if(ME.user)location.href="/dashboard.html";else openAuth(false,false)};
/* Kabinet/Connect sahifalari faqat tizimga kirganlarga ochiladi. Sessiya hali
   tiklanmagan bo‘lsa, foydalanuvchini sayt boshiga qaytarib yubormasdan,
   shu yerning o‘zida kirish oynasini ochamiz. */
document.querySelectorAll('a[href^="/dashboard.html"],a[href^="/connect.html"]').forEach(a=>a.addEventListener("click",async e=>{
 if(ME.user)return;
 e.preventDefault();
 try{await ME.ready}catch{}
 if(ME.user)location.href=a.getAttribute("href");
 else openAuth(false,false);
}));
$("#authSwap").onclick=ev=>{ev.preventDefault();setMode(!signup)};
lf.telegram.oninput=()=>{lf.telegram.value=lf.telegram.value.toLowerCase().replace(/[^a-z0-9_@]/g,"")};
$("#pwEye").onclick=()=>{lf.password.type=lf.password.type==="password"?"text":"password"};
$("#forgot").onclick=async e=>{
 e.preventDefault();
 const out=$("#loginErr"),em=lf.email.value.trim();out.style.color="";out.textContent="";
 if(!em){out.textContent=T("forgot_need");return}
 const {error}=await sb.auth.resetPasswordForEmail(em,{redirectTo:location.origin+"/dashboard.html#set"});
 if(error){out.textContent=error.message;return}
 out.style.color="#0f6b46";out.textContent=T("forgot_sent");
};
async function enter(user,profile){
 ME.user=user;
 if(!profile){const r=await sb.from("profiles").select("*").eq("id",user.id).maybeSingle();profile=r.data}
 ME.profile=profile||{};
 const rg=await sb.from("registrations").select("event_id").eq("user_id",user.id);
 ME.regs=new Set((rg.data||[]).map(x=>x.event_id));
 $("#loginModal").classList.remove("open");document.body.style.overflow="";
 $("#openLogin").textContent=T("nav_dashboard");$("#cnLink").hidden=false;
 drawEv();
 loadTeam().catch(()=>{});
}
lf.onsubmit=async ev=>{
 ev.preventDefault();
 const out=$("#loginErr"),btn=$("#authBtn");out.textContent="";
 if(!sb){out.textContent=T("err_conn");return}
 const f=ev.target,email=f.email.value.trim();
 if(signup){
  const name=f.fullName.value.trim(),age=parseInt(f.age.value);
  let d=f.phone.value.replace(/\D/g,"");if(d.length===9)d="998"+d;
  const tg=f.telegram.value.trim().replace(/^@/,"").toLowerCase();
  if(name.length<3){out.textContent=T("err_name");return}
  if(!(age>=10&&age<=99)){out.textContent=T("err_age");return}
  if(!/^998\d{9}$/.test(d)){out.textContent=T("err_phone");return}
  if(!/^[a-z][a-z0-9_]{4,31}$/.test(tg)){out.textContent=T("err_tg");return}
  if(f.password.value.length<6){out.textContent=T("err_pw");return}
  btn.disabled=true;
  const {data,error}=await sb.auth.signUp({email,password:f.password.value,options:{data:{full_name:name}}});
  btn.disabled=false;
  if(error){out.textContent=/already/i.test(error.message)?T("err_email_taken"):error.message;return}
  if(!data.session){out.textContent=T("err_confirm");return}
  const prof={id:data.user.id,email,full_name:name,age,phone:"+"+d,telegram_username:tg};
  const up=await sb.from("profiles").upsert(prof);
  if(up.error)console.error(up.error);
  await enter(data.session.user,prof);
  return;
 }
 btn.disabled=true;
 const {data,error}=await sb.auth.signInWithPassword({email,password:f.password.value});
 btn.disabled=false;
 if(error){out.textContent=T("err_login");return}
 await enter(data.user);
};
if(sb)ME.ready=sb.auth.getSession().then(async({data})=>{if(data.session)await enter(data.session.user);else if(CFG.GATE)openAuth(true,false)}).catch(e=>console.error(e));

/* Kartochkalar */
function regBtn(e){if(!canReg(e))return "";return ME.regs.has(e.id)?`<a class="btn sm done" href="/dashboard.html#evs" style="cursor:pointer">${T("view_ticket")}</a>`:`<button class="btn acc sm" type="button" data-ev="${esc(e.id)}">${T("register")}</button>`}
function drawEv(){if(EVD===null)return;$("#evg").innerHTML=EVD.length?EVD.map(evCard).join(""):empty(T("no_events"))}
function openEv(id){
 const e=(EVD||[]).find(x=>x.id===id);if(!e)return;
 const z=safe(e.image_url);
 $("#evmBody").innerHTML=`${z?`<img class="evimg" src="${esc(z)}" alt="">`:""}<h3 style="margin:14px 0 8px">${esc(e.title)}</h3><div class="meta" style="margin-bottom:12px">${e.starts_at?`<span>${fd(e.starts_at)}, ${ft(e.starts_at)}</span>`:""}${e.location?`<span>${esc(e.location)}</span>`:""}${e.format?`<span>${esc(e.format)}</span>`:""}<span>${e.price>0?T("price")+" <b>"+money(e.price)+"</b>":T("free")}</span></div><p style="white-space:pre-line">${esc(e.description||T("no_desc"))}</p><div class="acts" style="margin-top:16px">${regBtn(e)}</div>`;
 $("#evModal").classList.add("open");
}
function canReg(e){const n=new Date();return !!e.registration_open&&(!e.starts_at||new Date(e.starts_at)>=n)&&(!e.registration_deadline||new Date(e.registration_deadline)>=n)}
const evCard=e=>`<article class="card">${safe(e.image_url)?`<img class="evimg" src="${esc(safe(e.image_url))}" alt="${esc(e.title)}" loading="lazy">`:""}<h3>${esc(e.title)}</h3><p>${esc((e.description||"").slice(0,140))}${(e.description||"").length>140?"…":""}</p>
<div class="meta">${e.starts_at?`<span>📅 ${fd(e.starts_at)}, ${ft(e.starts_at)}</span>`:""}${e.location?`<span>📍 ${esc(e.location)}</span>`:""}${e.format?`<span>🏷 ${esc(e.format)}</span>`:""}<span>${e.price>0?T("price")+" <b>"+money(e.price)+"</b>":T("free")}</span></div><div class="acts"><button class="btn out sm" type="button" data-more="${esc(e.id)}">${T("details")}</button>${regBtn(e)}</div></article>`;
const isJob=o=>/^ish$/i.test(o.category||"");
const short=(t,n)=>{t=(t||"").replace(/\s+/g," ").trim();return t.length>n?t.slice(0,n).trim()+"…":t};
const opCard=o=>{const z=safe(o.image_url);return `<article class="card">${z?`<img class="evimg opimg" src="${esc(z)}" alt="${esc(o.title)}" loading="lazy" data-opmore="${esc(o.id)}">`:""}<div class="opmeta"><span class="pill">${esc(o.category)}</span>${o.deadline?`<span class="dl">${T("deadline")} ${fd(o.deadline)}</span>`:""}</div><h3>${esc(o.title)}</h3><p>${esc(short(o.description,150))}</p><div class="acts"><button class="btn out sm" type="button" data-opmore="${esc(o.id)}">${T("details")}</button>${isJob(o)?`<button class="btn acc sm" type="button" data-job="${esc(o.id)}" data-t="${esc(o.title)}">${T("apply_job")}</button>`:""}</div></article>`};
function openOp(id){
 const o=OPD.find(x=>x.id===id);if(!o)return;const z=safe(o.image_url),u=safe(o.source_url);
 $("#opmBody").innerHTML=`${z?`<img class="evimg" src="${esc(z)}" alt="">`:""}<div class="opmeta" style="margin-top:14px"><span class="pill">${esc(o.category)}</span>${o.deadline?`<span class="dl">${T("deadline")} ${fd(o.deadline)}</span>`:""}</div><h3 style="margin:10px 0">${esc(o.title)}</h3>${o.eligibility?`<p style="margin-bottom:10px"><b>${T("requirements")}</b> ${esc(o.eligibility)}</p>`:""}<p style="white-space:pre-line">${esc(o.description||"")}</p><div class="acts" style="margin-top:16px">${isJob(o)?`<button class="btn acc sm" type="button" data-job="${esc(o.id)}" data-t="${esc(o.title)}">${T("apply_job")}</button>`:""}${u?`<a class="btn out sm" href="${esc(u)}" target="_blank" rel="noopener">${T("source")}</a>`:""}</div>`;
 $("#opModal").classList.add("open");
}
const tmCard=m=>{const z=safe(m.poster_url);if(z)return `<article class="card pcard"><img src="${esc(z)}" alt="${esc(m.name)} — ${esc(m.role)}" data-zoom loading="lazy"></article>`;const p=safe(m.photo);return `<article class="card"><div class="photo"${p?` style="background-image:url('${esc(p)}')"`:""}></div><h3>${esc(m.name)}</h3><b style="color:var(--acc);font-size:.85rem">${esc(m.role)}</b><p>${esc(m.bio)}</p></article>`};

const MQ=new WeakMap();
function setupMarquee(box){
 const stop=MQ.get(box);if(stop){stop();MQ.delete(box)}
 const track=box.querySelector(".track");
 if(!track||track.children.length<2)return;
 const g1=track.children[0],g2=track.children[1];
 const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
 const SPEED=42;
 let half=1,pos=0,last=0,raf=0,hover=false,dragging=false,pid=null,lastX=0,dragMoved=false,cancelClick=false,timer=0;
 const clamp=()=>{if(half<=0)return;while(pos<=-half)pos+=half;while(pos>0)pos-=half};
 const apply=()=>{track.style.transform=`translate3d(${pos}px,0,0)`};
 const measure=()=>{const w=g2.offsetLeft-g1.offsetLeft;half=w>0?w:Math.max(1,g1.getBoundingClientRect().width);clamp();apply()};
 const tick=now=>{
  if(!last)last=now;
  const dt=Math.min(64,now-last);last=now;
  if(!reduced&&!hover&&!dragging){pos-=SPEED*dt/1000;clamp();apply()}
  raf=requestAnimationFrame(tick);
 };
 const down=ev=>{
  if(ev.pointerType==="mouse"&&ev.button!==0)return;
  clearTimeout(timer);dragging=true;dragMoved=false;lastX=ev.clientX;hover=true;
  box.classList.add("dragging");
  try{box.setPointerCapture(ev.pointerId)}catch{}
  pid=ev.pointerId;
 };
 const move=ev=>{
  if(!dragging||ev.pointerId!==pid)return;
  const dx=ev.clientX-lastX;
  if(!dx)return;
  lastX=ev.clientX;pos+=dx;
  if(Math.abs(dx)>3)dragMoved=true;
  if(dragMoved)ev.preventDefault();
  clamp();apply();
 };
 const up=ev=>{
  if(!dragging||(ev&&ev.pointerId!==pid))return;
  dragging=false;box.classList.remove("dragging");
  if(pid!=null){try{if(box.hasPointerCapture(pid))box.releasePointerCapture(pid)}catch{}}
  pid=null;
  if(dragMoved){cancelClick=true;setTimeout(()=>{cancelClick=false},350)}
  const inside=ev&&ev.pointerType!=="mouse"?false:box.matches(":hover");
  hover=inside;
  if(!inside){clearTimeout(timer);timer=setTimeout(()=>{hover=false},900)}
 };
 const enter=ev=>{if(ev.pointerType==="mouse"&&!dragging){clearTimeout(timer);hover=true}};
 const leave=ev=>{if(dragging||ev.pointerType!=="mouse")return;clearTimeout(timer);hover=false};
 const click=ev=>{if(cancelClick){ev.preventDefault();ev.stopPropagation();cancelClick=false}};
 box.addEventListener("pointerdown",down);
 box.addEventListener("pointermove",move);
 box.addEventListener("pointerup",up);
 box.addEventListener("pointercancel",up);
 box.addEventListener("pointerenter",enter);
 box.addEventListener("pointerleave",leave);
 box.addEventListener("click",click,true);
 let ro=null;
 if("ResizeObserver"in window){ro=new ResizeObserver(measure);ro.observe(track)}
 const onResize=()=>measure();
 addEventListener("resize",onResize);
 const imgs=[...box.querySelectorAll("img")];
 const onLoad=()=>measure();
 imgs.forEach(img=>{if(!img.complete)img.addEventListener("load",onLoad,{once:true})});
 measure();raf=requestAnimationFrame(tick);
 MQ.set(box,()=>{
  cancelAnimationFrame(raf);clearTimeout(timer);
  if(ro)ro.disconnect();
  removeEventListener("resize",onResize);
  imgs.forEach(img=>img.removeEventListener("load",onLoad));
  box.removeEventListener("pointerdown",down);box.removeEventListener("pointermove",move);
  box.removeEventListener("pointerup",up);box.removeEventListener("pointercancel",up);
  box.removeEventListener("pointerenter",enter);box.removeEventListener("pointerleave",leave);
  box.removeEventListener("click",click,true);
 });
}

function renderTeam(list,boxSel,headSel){
 const box=$(boxSel),head=$(headSel);
 head.hidden=!list.length;
 head.classList.toggle("in",!!list.length);
 if(!list.length){const stop=MQ.get(box);if(stop){stop();MQ.delete(box)}box.innerHTML="";return}
 const repeat=Math.max(1,Math.ceil(1240/Math.max(300,list.length*320)));
 const group=Array.from({length:repeat},()=>list.map(tmCard).join("")).join("");
 box.innerHTML=`<div class="track"><div class="mq-group">${group}</div><div class="mq-group" aria-hidden="true">${group}</div></div>`;
 setupMarquee(box);
}

/* Ma'lumotlarni yuklash */
async function loadTeam(){
 if(!sb)return;
 const tm=await sb.from("team").select("*").order("created_at",{ascending:true});
 if(tm.error)console.error("Jamoa ma’lumotlari:",tm.error);
 const TM=tm.error?[]:(tm.data||[]);
 renderTeam(TM.filter(x=>x.grp!=="mentor"),"#teamg","#famH");
 renderTeam(TM.filter(x=>x.grp==="mentor"),"#mentg","#mentH");
}
async function load(){
 if(!sb){["#evg","#opg"].forEach(i=>$(i).innerHTML=empty(T("could_not_load")));return}
 const [ev,op]=await Promise.all([
  sb.from("events").select("*").eq("status","published").order("starts_at",{ascending:true}),
  sb.from("opportunities").select("*").eq("status","published").order("created_at",{ascending:false})]);
 if(ev.error)$("#evg").innerHTML=empty(T("ev_load_err"));else{EVD=ev.data;drawEv()}
 OPD=op.error?[]:(op.data||[]);
 $("#opg").innerHTML=op.error?empty(T("op_load_err")):op.data.length?op.data.map(opCard).join(""):empty(T("no_ops"));
 /* Jamoa jadvali faqat tizimga kirgan foydalanuvchilarga ko‘rinadi.
    Shuning uchun sessiya tiklanib bo‘lishini kutamiz, aks holda so‘rov anonim
    kalit bilan ketib, bo‘sh natija qaytaradi. */
 await ME.ready;
 await loadTeam();
}
load();
const FAQ0=()=>[
 [T("faq_q1"),T("faq_a1")],
 [T("faq_q2"),T("faq_a2")],
 [T("faq_q3"),T("faq_a3")],
 [T("faq_q4"),T("faq_a4")],
 [T("faq_q5"),T("faq_a5")],
 [T("faq_q6"),T("faq_a6")],
 [T("faq_q7"),T("faq_a7")]
];
function renderFaq(list){
 $("#faqg").innerHTML=list.map(([q,a])=>`<details><summary>${esc(q)}</summary><div class="a">${esc(a)}</div></details>`).join("");
}
async function loadFaq(){
 renderFaq(FAQ0());
 if(!sb||(window.MI18N&&MI18N.lang==="en"))return;
 const {data,error}=await sb.from("faqs").select("question,answer").order("position",{ascending:true}).order("created_at",{ascending:true});
 if(!error&&data&&data.length)renderFaq(data.map(x=>[x.question,x.answer]));
}
loadFaq();
async function loadAbout(){
 if(!sb||(window.MI18N&&MI18N.lang==="en"))return;
 const {data,error}=await sb.from("site_about").select("*").eq("id",1).maybeSingle();
 if(error||!data)return;
 if(data.lead)$("#abLead").textContent=data.lead;
 if(data.body)$("#abBody").textContent=data.body;
 if(data.chips!=null){const c=$("#abChips");c.innerHTML="";data.chips.split(/[,\n]/).map(s=>s.trim()).filter(Boolean).forEach(t=>{const sp=document.createElement("span");sp.textContent=t;c.appendChild(sp)})}
 if(data.mission){const m=$("#abMission");m.innerHTML="";data.mission.split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean).forEach(t=>{const p=document.createElement("p");p.textContent=t;m.appendChild(p)})}
 if(data.tagline)$("#abTag").textContent=data.tagline;
}
loadAbout();
async function loadSocials(){
 if(!sb)return;
 const {data,error}=await sb.from("social_links").select("name,url").order("position",{ascending:true}).order("created_at",{ascending:true});
 if(error||!data||!data.length)return;
 const box=$("#socials");let n=0;box.innerHTML="";
 data.forEach(x=>{const u=safe(x.url);if(!u)return;const a=document.createElement("a");a.className="l";a.textContent=x.name;a.href=u;a.target="_blank";a.rel="noopener";box.appendChild(a);n++});
 if(!n){box.innerHTML='<a class="l" id="tg2" target="_blank" rel="noopener" href="'+CFG.TG+'">Telegram</a>';return}
 const t=data.find(x=>/telegram/i.test(x.name)&&safe(x.url));if(t)$("#tg1").href=safe(t.url);
}
loadSocials();

let PAY={e:null,promo:null,final:0,cfg:null,method:"card"};
const PMT={card:{t:"pm_card",s:"pm_bank"},click:{t:"pm_click",s:"pm_online"},payme:{t:"pm_payme",s:"pm_online"},custom:{t:"pm_other",s:"pm_other_sub"}};
function payMethodList(){
 const c=PAY.cfg||{},out=[];
 if(c.card_number)out.push("card");
 if(c.click_enabled&&c.click_service_id&&c.click_merchant_id)out.push("click");
 if(c.payme_enabled&&c.payme_merchant_id)out.push("payme");
 if(c.custom_enabled&&c.custom_url)out.push("custom");
 if(!out.length)out.push("card");
 return out;
}
function renderPayMethods(ms){
 const box=$("#payMethods");box.innerHTML="";
 ms.forEach(m=>{
  const b=document.createElement("button");b.type="button";b.className="pay-method";b.dataset.pm=m;
  const a=document.createElement("span");a.textContent=m==="custom"?((PAY.cfg&&PAY.cfg.custom_name)||T("pm_other")):T(PMT[m].t);
  const s=document.createElement("small");s.textContent=T(PMT[m].s);
  b.append(a,s);b.onclick=()=>selectPayMethod(m);box.appendChild(b);
 });
 box.hidden=ms.length<2;
}
function payBtnLabel(){
 if(PAY.final===0)return T("pay_free_register");
 if(PAY.method==="click")return T("pay_click_btn");
 if(PAY.method==="payme")return T("pay_payme_btn");
 if(PAY.method==="custom")return T("pay_custom_btn").replace("{name}",(PAY.cfg&&PAY.cfg.custom_name)||T("pm_other"));
 return T("pay_receipt_btn");
}
function syncPayUI(){
 const online=PAY.method!=="card",list=payMethodList();
 $("#payChoose").hidden=PAY.final===0;
 $("#payChooseHint").textContent=list.includes("click")||list.includes("payme")
  ?T("pay_hint_online")
  :T("pay_hint_card");
 $("#payMethods").hidden=PAY.final===0||list.length<2;
 $("#payCardBox").hidden=PAY.final===0||online;
 $("#payOnlineBox").hidden=PAY.final===0||!online;
 $("#paySubmit").textContent=payBtnLabel();
}
function selectPayMethod(m){
 const list=payMethodList();if(!list.includes(m))m=list[0]||"card";
 PAY.method=m;
 document.querySelectorAll("#payMethods .pay-method").forEach(b=>b.classList.toggle("on",b.dataset.pm===m));
 if(m!=="card"){
  const c=PAY.cfg||{};
  $("#payOnlineTitle").textContent=m==="custom"?((c.custom_name||T("pay_custom_title"))):(m==="click"?T("pay_click_title"):T("pay_payme_title"));
  $("#payOnlineDesc").textContent=m==="click"?T("pay_click_desc"):m==="payme"?T("pay_payme_desc"):T("pay_custom_desc");
 }
 syncPayUI();
}
async function openPay(e){
 PAY={e,promo:null,final:e.price,cfg:PAY.cfg,method:"card"};
 $("#payTitle").textContent=e.title;$("#payBase").textContent=money(e.price);$("#payDiscRow").hidden=true;$("#payFinal").textContent=money(e.price);
 $("#payPromo").value="";$("#payPromoMsg").textContent="";$("#payErr").textContent="";$("#payFile").value="";$("#payPrev").hidden=true;
 $("#paySubmit").disabled=false;
 try{
  const r=await sb.from("payment_settings").select("*").eq("id",1).maybeSingle();
  if(!r.error)PAY.cfg=r.data||{};
 }catch(e){console.warn("To‘lov sozlamalari yuklanmadi:",e)}
 PAY.cfg=PAY.cfg||{};
 const c=PAY.cfg;$("#payNum").textContent=c.card_number||T("card_missing");$("#payHolder").textContent=c.card_holder||"";$("#payBank").textContent=c.bank||"";
 const ms=payMethodList();renderPayMethods(ms);
 selectPayMethod(c.card_number?"card":(ms.find(x=>x!=="card")||"card"));
 $("#payModal").classList.add("open");
}
function recalc(base,disc){const f=Math.max(0,base-disc);PAY.final=f;$("#payBase").textContent=money(base);$("#payDiscRow").hidden=!disc;$("#payDisc").textContent="− "+money(disc);$("#payFinal").textContent=money(f);selectPayMethod(PAY.method)}
$("#payApply").onclick=async()=>{
 const code=$("#payPromo").value.trim(),m=$("#payPromoMsg");m.style.color="";m.textContent="";
 if(!code){PAY.promo=null;recalc(PAY.e.price,0);return}
 const {data,error}=await sb.rpc("calc_price",{p_event_id:PAY.e.id,p_code:code});
 const r=data&&data[0];
 if(error||!r||!r.valid){PAY.promo=null;recalc(PAY.e.price,0);m.textContent=error?error.message:(r?r.message:T("error_prefix"));return}
 PAY.promo=r.promo||code;recalc(r.base_price,r.discount);m.style.color="#6ee7b7";m.textContent=r.message||"";
};
$("#payFile").onchange=()=>{const f=$("#payFile").files[0],p=$("#payPrev");if(!f){p.hidden=true;return}p.src=URL.createObjectURL(f);p.hidden=false};
$("#payCopy").onclick=()=>{const n=((PAY.cfg&&PAY.cfg.card_number)||"").replace(/\s/g,"");if(!n)return;(navigator.clipboard?navigator.clipboard.writeText(n):Promise.reject()).then(()=>toast(T("copy_ok"),"ok")).catch(()=>toast(T("copy_err"),"err"))};
$("#closePay").onclick=()=>$("#payModal").classList.remove("open");
async function decodeImg(file){
 try{return await createImageBitmap(file)}catch(e){}
 const url=URL.createObjectURL(file);
 const im=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error("Rasmni o‘qib bo‘lmadi"));i.src=url});
 setTimeout(()=>URL.revokeObjectURL(url),60000);return im;
}
async function toJpegBlob(file,max){
 try{
  const im=await decodeImg(file),s=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement("canvas");
  c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);c.getContext("2d").drawImage(im,0,0,c.width,c.height);
  const b=await new Promise(r=>c.toBlob(r,"image/jpeg",.85));if(b)return b;
 }catch(e){console.warn("rasm kichraytirilmadi, asl fayl yuboriladi:",e)}
 if(file.size>5*1024*1024)throw new Error(T("file_big"));
 return file;
}
async function upReceipt(file){
 const b=await toJpegBlob(file,1400),p=ME.user.id+"/"+Date.now()+"-"+Math.random().toString(36).slice(2,8)+".jpg";
 const ct=["image/jpeg","image/png","image/webp"].includes(b.type)?b.type:"image/jpeg";
 const u=await sb.storage.from("receipts").upload(p,b,{contentType:ct});if(u.error)throw u.error;return p;
}
async function ensureRegistration(id,promo,method){
 let row=null,err=null;
 let r=await sb.rpc("register_event",{p_event_id:id,p_promo:promo||null,p_receipt:null});
 if(r.error&&/chek|receipt/i.test(r.error.message||"")){
  const r2=await sb.rpc("register_event",{p_event_id:id,p_promo:promo||null,p_receipt:"online:"+(method||"pay")});
  if(!r2.error)r=r2;
 }
 if(r.error)err=r.error;
 const q=await sb.from("registrations").select("id,payment_status").eq("event_id",id).eq("user_id",ME.user.id).maybeSingle();
 if(!q.error&&q.data)row=q.data;
 if(!row&&!r.error){
  const d=r.data;
  if(Array.isArray(d)&&d[0]&&d[0].id)row=d[0];
  else if(d&&d.id)row=d;
 }
 if(!row&&err&&/idx_regs_event_username|duplicate key/i.test(err.message||"")){
  const c=await sb.rpc("claim_my_registration",{p_event_id:id});
  if(!c.error&&c.data&&c.data.length)row=c.data[0];
 }
 if(!row)throw err||new Error(T("reg_not_created"));
 if(row.payment_status==="paid"||row.payment_status==="free")throw new Error(T("reg_paid"));
 ME.regs.add(id);drawEv();
 return row.id;
}
async function startOnlinePay(method){
 const err=$("#payErr"),btn=$("#paySubmit");err.textContent="";btn.disabled=true;btn.textContent=T("preparing");
 try{
  const regId=await ensureRegistration(PAY.e.id,PAY.promo,method);
  const sm=await sb.rpc("set_payment_method",{p_reg_id:regId,p_method:method});
  if(sm.error)console.warn("To‘lov usuli saqlanmadi:",sm.error.message);
  const c=PAY.cfg||{},amount=Math.round(PAY.final),ret=location.origin+"/dashboard.html#evs";
  if(method==="click"){
   const qs=new URLSearchParams({service_id:c.click_service_id,merchant_id:c.click_merchant_id,amount:String(amount),transaction_param:regId,return_url:ret});
   location.href="https://my.click.uz/services/pay?"+qs.toString();return;
  }
  if(method==="payme"){
   const f=document.createElement("form");f.method="POST";f.action="https://checkout.paycom.uz/";f.style.display="none";
   const add=(n,v)=>{const i=document.createElement("input");i.type="hidden";i.name=n;i.value=v;f.appendChild(i)};
   add("merchant",c.payme_merchant_id);add("amount",String(amount*100));add("account[order_id]",regId);add("lang","uz");add("callback",ret);
   document.body.appendChild(f);f.submit();return;
  }
  if(method==="custom"){
   let u=String(c.custom_url||"").replace(/\{amount\}/g,encodeURIComponent(amount)).replace(/\{order_id\}/g,encodeURIComponent(regId)).replace(/\{return_url\}/g,encodeURIComponent(ret));
   if(!/^https?:\/\//i.test(u))throw new Error(T("pay_url_bad"));
   location.href=u;return;
  }
  throw new Error(T("pay_method_missing"));
 }catch(e){
  console.error(e);err.textContent=e.message||T("pay_start_err");btn.disabled=false;syncPayUI();
 }
}
$("#paySubmit").onclick=async()=>{
 const err=$("#payErr"),btn=$("#paySubmit");err.textContent="";let path=null;
 if(PAY.final>0&&PAY.method!=="card"){await startOnlinePay(PAY.method);return}
 if(PAY.final>0){
  const f=$("#payFile").files[0];
  if(!f){err.textContent=T("receipt_need");return}
  btn.disabled=true;btn.textContent=T("uploading");
  try{path=await upReceipt(f)}catch(e){err.textContent=T("receipt_fail")+e.message;btn.disabled=false;syncPayUI();return}
 }
 const ok=await registerEvent(PAY.e.id,null,PAY.promo,path);
 btn.disabled=false;
 if(ok)$("#payModal").classList.remove("open");else syncPayUI();
};
function toast(m,t){const x=$("#toast");x.textContent=m;x.className=t||"";x.style.display="block";clearTimeout(toast.t);toast.t=setTimeout(()=>x.style.display="none",6000)}
let pendingEv=null;
const pfm=$("#pfForm");
pfm.telegram.oninput=()=>{pfm.telegram.value=pfm.telegram.value.toLowerCase().replace(/[^a-z0-9_@]/g,"")};
$("#closePf").onclick=()=>$("#pfModal").classList.remove("open");
function fillPf(){const p=ME.profile||{};pfm.fullName.value=p.full_name||"";pfm.age.value=p.age||"";pfm.phone.value=p.phone||"";pfm.telegram.value=p.telegram_username||"";$("#pfErr").textContent=""}
async function registerEvent(id,b,promo,receipt){
 if(b){b.disabled=true;b.textContent=T("sending")}
 try{
  const r=await Promise.race([sb.rpc("register_event",{p_event_id:id,p_promo:promo||null,p_receipt:receipt||null}),new Promise((_,j)=>setTimeout(()=>j(new Error(T("server_timeout"))),15000))]);
  if(r.error)throw r.error;
  ME.regs.add(id);drawEv();
  toast(receipt?T("receipt_sent"):T("reg_ok"),"ok");
  setTimeout(()=>{location.href="/dashboard.html#evs"},1500);
  return true;
 }catch(err){
  console.error(err);const msg=(err&&err.message)||String(err);
  if(/idx_regs_event_username|duplicate key/i.test(msg)){
   const c=await sb.rpc("claim_my_registration",{p_event_id:id});
   if(!c.error&&c.data&&c.data.length){ME.regs.add(id);drawEv();toast(T("already_reg"),"ok");setTimeout(()=>{location.href="/dashboard.html#evs"},1500);return true}
   if(b){b.disabled=false;b.textContent=T("register")}
   toast(c.error?c.error.message:T("already_reg_short"),"err");return false;
  }
  if(b){b.disabled=false;b.textContent=T("register")}
  toast(T("error_prefix")+msg,"err");return false;
 }
}
function startReg(id,b){
 const e=(EVD||[]).find(x=>x.id===id);
 if(e&&e.price>0){openPay(e);return}
 registerEvent(id,b,null,null);
}
async function onEvClick(ev){
 const b=ev.target.closest("[data-ev]");if(!b||b.disabled)return;
 if(!ME.user)await ME.ready;
 if(!ME.user){openAuth(false,false);return}
 const p=ME.profile||{};
 if(!(p.full_name&&p.age&&p.phone&&p.telegram_username)){pendingEv=b.dataset.ev;fillPf();$("#pfModal").classList.add("open");return}
 $("#evModal").classList.remove("open");
 startReg(b.dataset.ev,b);
}
$("#evg").addEventListener("click",ev=>{const m=ev.target.closest("[data-more]");if(m)openEv(m.dataset.more)});
$("#evg").addEventListener("click",onEvClick);
$("#evm").addEventListener("click",onEvClick);
$("#closeEv").onclick=()=>$("#evModal").classList.remove("open");
$("#evModal").addEventListener("click",ev=>{if(ev.target.id==="evModal")$("#evModal").classList.remove("open")});
pfm.onsubmit=async e=>{
 e.preventDefault();const out=$("#pfErr");out.textContent="";
 const name=pfm.fullName.value.trim(),age=parseInt(pfm.age.value);
 let d=pfm.phone.value.replace(/\D/g,"");if(d.length===9)d="998"+d;
 const tg=pfm.telegram.value.trim().replace(/^@/,"").toLowerCase();
 if(name.length<3){out.textContent=T("err_name");return}
 if(!(age>=10&&age<=99)){out.textContent=T("err_age");return}
 if(!/^998\d{9}$/.test(d)){out.textContent=T("err_phone");return}
 if(!/^[a-z][a-z0-9_]{4,31}$/.test(tg)){out.textContent=T("err_tg");return}
 const prof={id:ME.user.id,full_name:name,age,phone:"+"+d,telegram_username:tg};
 const {error}=await sb.from("profiles").upsert(prof);
 if(error){out.textContent=T("saved_fail")+error.message;return}
 ME.profile={...ME.profile,...prof};$("#pfModal").classList.remove("open");
 if(pendingEv){const id=pendingEv;pendingEv=null;startReg(id,$('[data-ev="'+id+'"]'))}
};

/* Jamoa posterini kattalashtirib ko‘rish */
["#teamg","#mentg"].forEach(sel=>$(sel).addEventListener("click",ev=>{const im=ev.target.closest("img[data-zoom]");if(im){$("#lbi").src=im.src;$("#lb").classList.add("open")}}));
$("#lb").onclick=()=>$("#lb").classList.remove("open");

/* Ish uchun ariza */
let jobOpp=null;
const jf=$("#jobForm");
const closeJob=()=>$("#jobModal").classList.remove("open");
function onJobClick(ev){
 const b=ev.target.closest("[data-job]");
 if(!b)return;
 jobOpp={id:b.dataset.job,title:b.dataset.t};
 $("#jobSub").textContent=jobOpp.title;
 jf.reset();jf.hidden=false;$("#jobOk").hidden=true;
 const pf=ME.profile;if(pf){jf.fullName.value=pf.full_name||"";jf.age.value=pf.age||"";jf.phone.value=pf.phone||"";jf.telegram.value=pf.telegram_username||""}
 $("#jobSbm").disabled=false;$("#jobSbm").textContent=T("job_submit");
 document.querySelectorAll("[data-j]").forEach(x=>x.textContent="");$("#jobErr").textContent="";
 $("#opModal").classList.remove("open");
 $("#jobModal").classList.add("open");
}
$("#opg").addEventListener("click",onJobClick);
$("#opm").addEventListener("click",onJobClick);
$("#opg").addEventListener("click",ev=>{const m=ev.target.closest("[data-opmore]");if(m)openOp(m.dataset.opmore)});
$("#closeOp").onclick=()=>$("#opModal").classList.remove("open");
$("#opModal").addEventListener("click",ev=>{if(ev.target.id==="opModal")$("#opModal").classList.remove("open")});
$("#closeJob").onclick=closeJob;
$("#jobDone").onclick=closeJob;
jf.telegram.oninput=()=>{jf.telegram.value=jf.telegram.value.toLowerCase().replace(/[^a-z0-9_@]/g,"")};
jf.onsubmit=async ev=>{
 ev.preventDefault();
 document.querySelectorAll("[data-j]").forEach(x=>x.textContent="");
 $("#jobErr").textContent="";
 if(jf.website.value||!jobOpp)return;
 const E=(k,t)=>{$(`[data-j="${k}"]`).textContent=t};
 if(jf.fullName.value.trim().length<3){E("fullName",T("job_fill_name"));return}
 const age=parseInt(jf.age.value);
 if(!(age>=10&&age<=99)){E("age",T("err_age"));return}
 let d=jf.phone.value.replace(/\D/g,"");if(d.length===9)d="998"+d;
 if(!/^998\d{9}$/.test(d)){E("phone",T("err_phone"));return}
 const tg=jf.telegram.value.trim().replace(/^@/,"").toLowerCase();
 if(!/^[a-z][a-z0-9_]{4,31}$/.test(tg)){E("telegram",T("job_username"));return}
 if(!jf.exp.value){E("exp",T("select"));return}
 const file=jf.cv.files[0];
 if(file&&file.size>5*1024*1024){E("cv",T("file_big"));return}
 const b=$("#jobSbm");
 b.disabled=true;b.textContent=T("job_sending");
 try{
  let cv_path=null;
  if(file){
   const ext=(file.name.split(".").pop()||"").toLowerCase().replace(/[^a-z0-9]/g,"");
   const mime={pdf:"application/pdf",doc:"application/msword",docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",jpg:"image/jpeg",jpeg:"image/jpeg",png:"image/png"}[ext];
   if(!mime){E("cv",T("only_pdf"));b.disabled=false;b.textContent=T("job_submit");return}
   cv_path=Date.now()+"-"+Math.random().toString(36).slice(2,10)+"."+ext;
   const up=await sb.storage.from("cvs").upload(cv_path,file,{contentType:mime});
   if(up.error)throw up.error;
  }
  const {error}=await sb.from("job_applications").insert([{
   opportunity_id:jobOpp.id,
   full_name:jf.fullName.value.trim(),
   age,
   phone:"+"+d,
   telegram_username:tg,
   has_experience:jf.exp.value==="yes",
   cv_path
  }]);
  if(error)throw error;
  jf.hidden=true;$("#jobOk").hidden=false;
 }catch(err){
  console.error(err);
  $("#jobErr").textContent=T("job_error")+(err&&err.message?" ("+err.message+")":"");
  b.disabled=false;b.textContent=T("job_submit");
 }
};
