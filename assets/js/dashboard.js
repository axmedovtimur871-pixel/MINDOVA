/* MINDOVA — dashboard sahifasi skripti */
const REC=/type=recovery/.test(location.hash);
const sb=supabase.createClient("https://zrebikqvjbvuwbzcunkw.supabase.co","sb_publishable_DszdaPjNPM3i0UbGX3lLjQ_DTjdfLcW");
const $=q=>document.querySelector(q);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const ML=["yanvar","fevral","mart","aprel","may","iyun","iyul","avgust","sentabr","oktabr","noyabr","dekabr"];
const fd=d=>{const x=new Date(d);return !d||isNaN(x)?"":`${x.getDate()}-${ML[x.getMonth()]} ${x.getFullYear()}`};
const ST={pending:["Ko‘rib chiqilmoqda","amber"],accepted:["Qabul qilingan","green"],rejected:["Rad etilgan","red"]};
const badge=s=>{const [t,c]=ST[s]||ST.pending;return `<span class="b ${c}">${t}</span>`};
const safe=u=>{try{const x=new URL(u);return /^https?:$/.test(x.protocol)?x.href:""}catch{return""}};
let U,P,D={},cur="home",editId=null,ADMIN=false;
const nm=()=>P.full_name||U.email.split("@")[0];
const evM=()=>Object.fromEntries(D.ev.map(e=>[e.id,e]));
const opM=()=>Object.fromEntries(D.op.map(o=>[o.id,o]));
const av=()=>P.avatar_url?`<img class="av" src="${esc(P.avatar_url)}" alt="">`:`<div class="av">${esc(nm().slice(0,2).toUpperCase())}</div>`;
const empty=t=>`<div class="em">${t}</div>`;

/* ===== SERTIFIKAT SHABLONI — keyinchalik shu yerda tahrirlanadi =====
   bg: shablon rasmi (1536x1024). Yangi dizayn bo‘lsa, certificate-bg.jpg ni almashtiring.
   Har bir maydon: x, y — joylashuv (piksel), size — shrift o‘lchami, max — eng katta kenglik, color — rang. */
const CT={bg:"/assets/img/certificate-bg.jpg",W:1536,H:1024,font:"Inter,system-ui,sans-serif",script:'"Great Vibes",cursive',
 ink:"#1a1a4a",accent:"#3b2fe0",
 name:{x:768,y:482,size:120,max:760,color:"#14124a"},
 line1:{x:768,y:556,size:27},line2:{x:768,y:596,size:27,max:780},line3:{x:768,y:634,size:27},
 date:{x:426,y:716,size:21,max:190},place:{x:755,y:716,size:21,max:180},org:{x:1073,y:716,size:21,max:115},
 code:{x:276,y:880,size:25,max:215},
 qr:{x:120,y:810,size:100,color:"#0b0b24"}};
const bgImg=new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=CT.bg});
const tDate=d=>{const x=new Date(d);return !d||isNaN(x)?"—":`${x.getFullYear()}-yil ${x.getDate()}-${ML[x.getMonth()]}`};
async function cert(c){
 await Promise.all([document.fonts.load("800 24px Inter"),document.fonts.load("500 24px Inter"),document.fonts.load('100px "Great Vibes"')]).catch(()=>{});
 const bg=await bgImg,k=document.createElement("canvas");k.width=CT.W;k.height=CT.H;const x=k.getContext("2d");
 if(bg)x.drawImage(bg,0,0,CT.W,CT.H);else{x.fillStyle="#eef0ff";x.fillRect(0,0,CT.W,CT.H)}
 const put=(t,o,font,weight,color,align)=>{let s=o.size;x.textAlign=align||"left";x.fillStyle=color||CT.ink;
  do{x.font=`${weight} ${s}px ${font}`;s-=2}while(o.max&&x.measureText(t).width>o.max&&s>12);x.fillText(t,o.x,o.y)};
 put(nm(),CT.name,CT.script,400,CT.name.color,"center");
 x.textAlign="center";x.fillStyle=CT.ink;x.font=`500 ${CT.line1.size}px ${CT.font}`;x.fillText("Mindova tomonidan tashkil etilgan",CT.line1.x,CT.line1.y);
 const ev="“"+(c.event_title||c.title)+"”",tail=" tadbirida faol ishtirok etgani uchun";let s=CT.line2.size,w1,w2;
 do{x.font=`800 ${s}px ${CT.font}`;w1=x.measureText(ev).width;x.font=`500 ${s}px ${CT.font}`;w2=x.measureText(tail).width;s-=2}while(w1+w2>CT.line2.max&&s>14);
 s+=2;const x0=CT.line2.x-(w1+w2)/2;x.textAlign="left";x.fillStyle=CT.accent;x.font=`800 ${s}px ${CT.font}`;x.fillText(ev,x0,CT.line2.y);
 x.fillStyle=CT.ink;x.font=`500 ${s}px ${CT.font}`;x.fillText(tail,x0+w1,CT.line2.y);
 x.textAlign="center";x.font=`500 ${CT.line3.size}px ${CT.font}`;x.fillText("ushbu sertifikat bilan taqdirlanadi.",CT.line3.x,CT.line3.y);
 put(tDate(c.event_date||c.issued_at),CT.date,CT.font,500);
 put(c.event_place||"—",CT.place,CT.font,500);
 put(c.organization||"Mindova",CT.org,CT.font,500);
 put(c.code||"",CT.code,CT.font,800);
 if(window.qrcode){const q=qrcode(0,"M");q.addData(location.origin+"/verify.html?code="+c.code);q.make();const n=q.getModuleCount(),cs=CT.qr.size/(n+2);
  x.fillStyle=CT.qr.color;for(let r=0;r<n;r++)for(let cc=0;cc<n;cc++)if(q.isDark(r,cc))x.fillRect(CT.qr.x+cs*(cc+1),CT.qr.y+cs*(r+1),Math.ceil(cs),Math.ceil(cs))}
 return k.toDataURL("image/jpeg",.93);
}
async function zoom(i){$("#mi").src=await cert(D.cert[i]);$("#md").classList.add("on")}
async function pdf(i){const c=D.cert[i],u=await cert(c),d=new window.jspdf.jsPDF({orientation:"landscape",unit:"pt",format:[841.89,561.26]});d.addImage(u,"JPEG",0,0,841.89,561.26);d.save("MINDOVA-sertifikat-"+c.code+".pdf")}
function fill(){document.querySelectorAll("img[data-ci]").forEach(im=>cert(D.cert[im.dataset.ci]).then(u=>im.src=u))}
const certCard=(c,i)=>`<div class="card"><img class="cc" data-ci="${i}" alt=""><b>${esc(c.title)}</b><p class="m">${esc(c.event_title||"")} · ${fd(c.issued_at)} <span class="b green">Tasdiqlangan</span></p><div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button class="bt o" onclick="zoom(${i})">Kattalashtirish</button><button class="bt" onclick="pdf(${i})">PDF yuklab olish</button></div></div>`;
const NO_CERT="Sizda hozircha sertifikatlar yo‘q. Yangi sertifikatlar berilganda shu yerda paydo bo‘ladi.";

/* ===== JAMOA PANELI (volontyor va menejerlar) ===== */
const ROLE={volunteer:"Volontyor",manager:"Menejer"};
const SP={ok:false,sm:null,lessons:[],idu:null};
const loadImg=u=>new Promise(r=>{if(!u)return r(null);const i=new Image();i.crossOrigin="anonymous";i.onload=()=>r(i);i.onerror=()=>r(null);i.src=u});
const memBg=new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src="/assets/img/membership-bg.jpg"});
const dmy=v=>{const x=new Date(v);return !v||isNaN(x)?"—":String(x.getDate()).padStart(2,"0")+"."+String(x.getMonth()+1).padStart(2,"0")+"."+x.getFullYear()};
async function staffCard(){
 await document.fonts.load("500 24px Inter").catch(()=>{});
 const sm=SP.sm,W=1536,H=1024,k=document.createElement("canvas");k.width=W;k.height=H;const x=k.getContext("2d"),bg=await memBg,SER='Georgia,"Times New Roman",serif';
 if(bg)x.drawImage(bg,0,0,W,H);else{x.fillStyle="#0B0B1E";x.fillRect(0,0,W,H)}
 x.textAlign="center";x.fillStyle="#fff";let s=96;do{x.font=`700 ${s}px ${SER}`;s-=2}while(x.measureText(sm.full_name).width>740&&s>30);x.fillText(sm.full_name,768,556);
 x.textAlign="left";x.font=`600 36px ${SER}`;x.fillText(dmy(sm.joined_at),101,822);
 x.fillStyle="#d7d9f2";x.font="500 24px Inter,system-ui,sans-serif";if("letterSpacing" in x)x.letterSpacing="4px";x.fillText(sm.member_no||"—",101,886);if("letterSpacing" in x)x.letterSpacing="0px";
 if(window.qrcode&&sm.member_no){const q=qrcode(0,"M");q.addData(location.origin+"/verify.html?code="+encodeURIComponent(sm.member_no));q.make();const n=q.getModuleCount(),cs=80/n;
  x.fillStyle="#fff";x.fillRect(1342,766,96,96);x.fillStyle="#0b0b24";for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(q.isDark(r,c))x.fillRect(1350+c*cs,774+r*cs,Math.ceil(cs),Math.ceil(cs))}
 return k.toDataURL("image/jpeg",.93);
}
function fillId(){const im=$("#idimg");if(im)staffCard().then(u=>{SP.idu=u;im.src=u})}
async function zoomId(){$("#mi").src=SP.idu||await staffCard();$("#md").classList.add("on")}
async function pdfId(){const u=SP.idu||await staffCard(),p=new window.jspdf.jsPDF({orientation:"landscape",unit:"pt",format:[841.89,561.26]});p.addImage(u,"JPEG",0,0,841.89,561.26);p.save("MINDOVA-guvohnoma.pdf")}
async function loadLessons(){const r=await sb.from("staff_lessons").select("*").order("created_at",{ascending:false});SP.lessons=r.data||[]}
async function claim(e){
 e.preventDefault();const f=e.target,m=$("#cm");m.textContent="";
 const {data,error}=await sb.rpc("claim_staff_code",{p_code:f.cd.value.trim()});
 if(error||!data||!data.length){m.textContent=error?error.message:"Kod noto‘g‘ri";return}
 SP.sm=data[0];sessionStorage.setItem("smu","1");await loadLessons();SP.ok=true;go("team");
}
async function initTeam(){
 if(sessionStorage.getItem("smu")!=="1")return;
 const r=await sb.from("staff_members").select("*").eq("user_id",U.id).eq("active",true).order("created_at",{ascending:true}).limit(1);
 if(r.error||!r.data||!r.data.length){sessionStorage.removeItem("smu");return}
 SP.sm=r.data[0];await loadLessons();SP.ok=true;if(cur==="team")go("team");
}
const lessonHtml=L=>L.length?L.map(l=>`<div class="rw" style="display:block"><b>${esc(l.title)}</b> ${l.lesson_date?`<span class="b">${fd(l.lesson_date)}</span> `:""}${l.staff_id?"":`<span class="b">Hammaga</span>`}<p class="m" style="white-space:pre-line;margin:6px 0">${esc(l.content||"")}</p>${safe(l.link)?`<a class="bt o" href="${esc(safe(l.link))}" target="_blank" rel="noopener">Darsni ochish</a>`:""}</div>`).join(""):empty("Hozircha dars joylanmagan.");

const okPay=r=>!r.payment_status||r.payment_status==="free"||r.payment_status==="paid";
const PMT={card:"Bank karta",click:"Click",payme:"Payme",custom:"Boshqa"};
const payMethod=r=>r.paid_method||(String(r.receipt_path||"").startsWith("online:")?String(r.receipt_path).slice(7):"");
let PAYCFG=null;
async function payCfg(){
 if(PAYCFG)return PAYCFG;
 try{const r=await sb.from("payment_settings").select("*").eq("id",1).maybeSingle();PAYCFG=r.data||{}}catch(e){PAYCFG={}}
 return PAYCFG;
}
/* Click/Payme to‘lovini kabinetdan davom ettirish (masalan, sayt yopilib qolgan bo‘lsa) */
async function continuePay(id){
 const r=D.reg.find(x=>x.id===id);if(!r)return;
 const m=payMethod(r),c=await payCfg(),e=evM()[r.event_id]||{};
 const amount=Math.round(Number(r.amount)||Number(e.price)||0),ret=location.origin+"/dashboard.html#evs";
 if(!amount){alert("To‘lov summasi topilmadi. Admin bilan bog‘laning.");return}
 if(m==="click"&&c.click_service_id&&c.click_merchant_id){
  const qs=new URLSearchParams({service_id:c.click_service_id,merchant_id:c.click_merchant_id,amount:String(amount),transaction_param:r.id,return_url:ret});
  location.href="https://my.click.uz/services/pay?"+qs.toString();return;
 }
 if(m==="payme"&&c.payme_merchant_id){
  const f=document.createElement("form");f.method="POST";f.action="https://checkout.paycom.uz/";f.style.display="none";
  const add=(n,v)=>{const i=document.createElement("input");i.type="hidden";i.name=n;i.value=v;f.appendChild(i)};
  add("merchant",c.payme_merchant_id);add("amount",String(amount*100));add("account[order_id]",r.id);add("lang","uz");add("callback",ret);
  document.body.appendChild(f);f.submit();return;
 }
 alert("To‘lov usuli hozircha sozlanmagan. Admin bilan bog‘laning.");
}
function payBadge(r,past){const s=r.payment_status;if(s==="pending")return `<span class="b amber">To‘lov tekshirilmoqda${payMethod(r)?" · "+(PMT[payMethod(r)]||payMethod(r)):""}</span>`;if(s==="rejected")return `<span class="b red">To‘lov rad etildi</span>`;return `<span class="b ${r.checked_in?"green":past?"":"green"}">${r.checked_in?"Keldi ✓":past?"Yakunlangan":"Ro‘yxatdan o‘tgansiz"}</span>`}
function payAct(r){
 if(r.payment_status==="rejected")return `${r.payment_note?`<span class="m">Sabab: ${esc(r.payment_note)}</span> `:""}<label class="bt" style="cursor:pointer;margin:0">Chekni qayta yuborish<input type="file" accept="image/*" hidden onchange="resub('${r.id}',this)"></label>`;
 if(r.payment_status==="pending"){
  const m=payMethod(r);
  if(m==="click"||m==="payme")return `<button class="bt" onclick="continuePay('${r.id}')">${PMT[m]} orqali to‘lash</button> <label class="bt o" style="cursor:pointer;margin:0">Chek yuklash<input type="file" accept="image/*" hidden onchange="resub('${r.id}',this)"></label>`;
  if(m)return `<span class="m">Chekni yuklab, tasdiqlashni tezlashtiring.</span> <label class="bt" style="cursor:pointer;margin:0">Chek yuklash<input type="file" accept="image/*" hidden onchange="resub('${r.id}',this)"></label>`;
 }
 return okPay(r)&&r.ticket_code?`<button class="bt" onclick="ticket('${r.id}')">Chipta (QR)</button> `:"";
}
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
 if(file.size>5*1024*1024)throw new Error("Rasm hajmi 5 MB dan oshmasin");
 return file;
}
async function resub(id,inp){
 const f=inp.files[0];if(!f)return;
 try{
  const b=await toJpegBlob(f,1400),p=U.id+"/"+Date.now()+"-"+Math.random().toString(36).slice(2,8)+".jpg";
  const ct=["image/jpeg","image/png","image/webp"].includes(b.type)?b.type:"image/jpeg";
  const u=await sb.storage.from("receipts").upload(p,b,{contentType:ct});if(u.error)throw u.error;
  let r=await sb.rpc("submit_payment_receipt",{p_reg_id:id,p_receipt:p});if(r.error&&/could not find|schema cache|PGRST202|does not exist/i.test(r.error.message||""))r=await sb.rpc("resubmit_receipt",{p_reg_id:id,p_receipt:p});if(r.error)throw r.error;
  await load();go("evs");
 }catch(e){alert("Xato: "+e.message)}
}
function ticket(id){
 const r=D.reg.find(x=>x.id===id);if(!r||!r.ticket_code||!okPay(r)||!window.qrcode){alert("Chipta hozircha mavjud emas.");return}
 const e=evM()[r.event_id]||{},W=640,H=860,k=document.createElement("canvas");k.width=W;k.height=H;const x=k.getContext("2d"),F="Inter,system-ui,sans-serif";
 x.fillStyle="#fff";x.fillRect(0,0,W,H);x.fillStyle="#0F0E26";x.fillRect(0,0,W,120);
 x.textAlign="left";x.font=`800 40px ${F}`;x.fillStyle="#6366F1";x.fillText("M",36,76);const mw=x.measureText("M ").width;x.fillStyle="#fff";x.fillText("MINDOVA",36+mw,76);
 x.textAlign="right";x.fillStyle="#a5a8ff";x.font=`700 20px ${F}`;x.fillText("TADBIR CHIPTASI",W-36,74);
 x.textAlign="center";x.fillStyle="#0F0E26";let s=40;const t=e.title||"Tadbir";do{x.font=`800 ${s}px ${F}`;s-=2}while(x.measureText(t).width>W-80&&s>18);x.fillText(t,W/2,190);
 x.fillStyle="#687386";x.font=`500 24px ${F}`;x.fillText((fd(e.starts_at)||"")+(e.location?" · "+e.location:""),W/2,232);
 const q=qrcode(0,"M");q.addData(location.origin+"/scan.html?t="+r.ticket_code);q.make();const n=q.getModuleCount(),cs=Math.floor(440/n),S=cs*n,ox=Math.round((W-S)/2),oy=270;
 x.fillStyle="#0b0b24";for(let a=0;a<n;a++)for(let b=0;b<n;b++)if(q.isDark(a,b))x.fillRect(ox+b*cs,oy+a*cs,Math.ceil(cs),Math.ceil(cs));
 x.fillStyle="#0F0E26";x.font=`800 34px ${F}`;x.fillText(r.ticket_code,W/2,760);
 x.font=`600 26px ${F}`;x.fillText(r.full_name||nm(),W/2,805);
 x.fillStyle=r.checked_in?"#0f6b46":"#687386";x.font=`600 22px ${F}`;x.fillText(r.checked_in?"Keldi ✓":"Tadbirda shu QR kodni ko‘rsating",W/2,840);
 $("#mi").src=k.toDataURL("image/png");$("#md").classList.add("on");
}
const V={
home(){
 const now=new Date(),em=evM(),om=opM(),mine=new Set(D.reg.map(r=>r.event_id)),myEv=D.reg.filter(r=>r.event_id&&em[r.event_id]);
 const up=D.ev.filter(e=>e.starts_at&&new Date(e.starts_at)>=now),nx=up[0];
 const act=[...myEv.map(r=>({t:"Tadbirga yozildingiz: "+em[r.event_id].title,d:r.created_at})),...D.job.map(j=>({t:"Ishga ariza topshirdingiz: "+(om[j.opportunity_id]?.title||"e’lon"),d:j.created_at})),...D.cert.map(c=>({t:"Sertifikat berildi: "+c.title,d:c.created_at}))].sort((a,b)=>new Date(b.d)-new Date(a.d)).slice(0,5);
 const cta=e=>mine.has(e.id)?`<span class="b green">Ro‘yxatdan o‘tgansiz</span>`:e.registration_open?`<a class="bt" href="/#tadbirlar">Ro‘yxatdan o‘tish</a>`:"";
 const dt=e=>{const x=new Date(e.starts_at);return `<div class="dt"><b>${x.getDate()}</b><span>${ML[x.getMonth()].slice(0,3)}</span></div>`};
 const th=e=>safe(e.image_url)?`<img src="${esc(safe(e.image_url))}" alt="" loading="lazy">`:dt(e);
 const mt=e=>fd(e.starts_at)+(e.location?" · "+esc(e.location):"");
 const more=up.slice(1,4);
 return `<section class="hero"><span class="eb">Mindova a’zosi · ${fd(P.created_at)}</span><h1>Xush kelibsan, ${esc(nm().split(" ")[0])}</h1><p>Mindova — imkoniyatlar, yangi tanishuvlar va kelajakka yo‘l ochadigan platforma.</p></section>
<div class="strip"><button onclick="go('apps')"><b>${D.job.length}</b><span>Arizalar</span></button><button onclick="go('evs')"><b>${myEv.length}</b><span>Tadbirlar</span></button><button onclick="go('certs')"><b>${D.cert.length}</b><span>Sertifikatlar</span></button></div>
${nx?`<div class="card nx" style="margin-top:14px"><span class="eb">Eng yaqin tadbir</span><div class="ev" style="margin:12px 0 14px">${dt(nx)}<div><h2>${esc(nx.title)}</h2><p class="m">${mt(nx)}</p></div></div>${cta(nx)}</div>`:""}
<div class="g g2"><div class="card"><h3>Yaqinlashayotgan tadbirlar</h3>${more.length?more.map(e=>`<div class="rw"><div class="ev">${th(e)}<div><b>${esc(e.title)}</b><p class="m">${mt(e)}</p></div></div>${cta(e)}</div>`).join(""):empty("Boshqa yaqin tadbirlar yo‘q.")}</div>
<div class="card"><h3>So‘nggi arizalarim</h3>${D.job.length?D.job.slice(0,3).map(j=>`<div class="rw"><b>${esc(om[j.opportunity_id]?.title||"E’lon")}</b>${badge(j.status)}</div>`).join(""):empty("Hozircha arizalar yo‘q.")}</div></div>
<div class="g g2"><div class="card"><h3>So‘nggi sertifikatlar</h3>${D.cert.length?D.cert.slice(0,2).map((c,i)=>certCard(c,i)).join(""):empty(NO_CERT)}</div>
<div class="card"><h3>So‘nggi faoliyatlar</h3>${act.length?act.map(a=>`<div class="rw"><span>${esc(a.t)}</span><span class="m">${fd(a.d)}</span></div>`).join(""):empty("Faoliyat hali yo‘q.")}<div style="margin-top:14px"><a class="bt o" href="/#imkoniyatlar">Imkoniyatlarni ko‘rish</a></div></div></div>`},
team(){
 if(!SP.ok)return `<h1>Jamoa paneli</h1><p class="m" style="margin-top:6px">Jamoa a’zolari uchun. Sizga berilgan shaxsiy kodni kiriting.</p><form class="card" style="margin-top:16px;max-width:440px" onsubmit="claim(event)"><label>Shaxsiy kod<input name="cd" placeholder="MND-XXXX-XXXX" autocomplete="off" autocapitalize="characters" required></label><button class="bt">Kirish</button> <span id="cm" style="color:#fca5a5;font-size:.86rem"></span></form>`;
 return `<h1>Jamoa paneli</h1><p class="m" style="margin-top:6px">${esc(SP.sm.full_name)} · Jamoa a’zosi</p>
<div class="g g2"><div class="card"><h3>A’zolik guvohnomasi</h3><img class="cc" id="idimg" alt=""><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="bt o" onclick="zoomId()">Kattalashtirish</button><button class="bt" onclick="pdfId()">PDF yuklab olish</button></div></div>
<div class="card"><h3>Darslar</h3>${lessonHtml(SP.lessons)}</div></div>
<div class="g"><div class="card"><h3>Sertifikatlar</h3>${D.cert.length?`<div class="g g2" style="margin-top:0">${D.cert.map(certCard).join("")}</div>`:empty(NO_CERT)}</div></div>`},
prof(){return `<h1>Profilim</h1>
<form class="card" style="margin-top:16px;max-width:560px" onsubmit="saveP(event)">
 <div class="pc" style="margin-bottom:20px">
  ${av()}
  <div style="min-width:0">
   <b style="font-size:1.15rem">${esc(nm())}</b>
   <p class="m">${P.telegram_username?"@"+esc(P.telegram_username):"Telegram username kiritilmagan"}</p>
   <p class="m" style="font-size:.82rem">${esc(U.email)}</p>
   <label class="bt o" style="cursor:pointer;margin-top:8px">Rasmni almashtirish<input type="file" accept="image/*" onchange="upAv(this)" hidden></label>
  </div>
 </div>
 <label>Ism va familiya<input name="fn" maxlength="80" autocomplete="name" value="${esc(P.full_name)}" minlength="3" placeholder="Ism va familiya" required></label>
 <label>Telegram username<input name="tg" maxlength="33" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="@username" value="${esc(P.telegram_username)}"></label>
 <p class="m" style="margin:-4px 0 14px">Telegram username’ni @ belgisisiz kiriting. Masalan: <b>mindova_uz</b></p>
 <button class="bt" id="pSave">Saqlash</button> <span id="pm" class="ok"></span>
</form>`},
apps(){const om=opM();return `<h1>Mening arizalarim</h1><div class="card" style="margin-top:16px">${D.job.length?D.job.map(j=>`<div class="rw"><div><b>${esc(om[j.opportunity_id]?.title||"E’lon")}</b><p class="m">${esc(om[j.opportunity_id]?.category||"")} · ${fd(j.created_at)}</p></div>${badge(j.status)}</div>`).join(""):empty("Siz hali ishga ariza topshirmagansiz. Saytdagi “Dolzarb imkoniyatlar” bo‘limidan ariza topshiring.")}</div>`},
evs(){const em=evM(),now=new Date(),L=D.reg.filter(r=>r.event_id&&em[r.event_id]);return `<h1>Mening tadbirlarim</h1><div class="card" style="margin-top:16px">${L.length?L.map(r=>{const e=em[r.event_id],past=e.starts_at&&new Date(e.starts_at)<now;return `<div class="rw"><div><b>${esc(e.title)}</b><p class="m">${fd(e.starts_at)} ${e.location?"· "+esc(e.location):""}</p></div><div>${payBadge(r,past)} ${payAct(r)}<button class="bt o" onclick="this.parentNode.parentNode.nextElementSibling.hidden=!this.parentNode.parentNode.nextElementSibling.hidden">Tafsilotlar</button></div></div><p class="m" hidden style="padding:8px 0">${esc(e.description||"Tavsif yo‘q.")}</p>`}).join(""):empty("Siz hali tadbirga ro‘yxatdan o‘tmagansiz. Tizimga kirgan holda tadbirga yoziling.")}</div>`},
certs(){return `<h1>Mening sertifikatlarim</h1>${D.cert.length?`<div class="g g2">${D.cert.map(certCard).join("")}</div>`:`<div class="card" style="margin-top:16px">${empty(NO_CERT)}</div>`}`},
port(){const it=D.pf.find(x=>x.id===editId)||{};return `<h1>Portfolio</h1><div class="g g2"><form class="card" onsubmit="savePf(event)"><h3>${editId?"Tahrirlash":"Yangi qo‘shish"}</h3><label>Turi<select name="k">${["loyiha","ko‘nikma","yutuq"].map(k=>`<option ${it.kind===k?"selected":""}>${k}</option>`).join("")}</select></label><label>Nomi<input name="t" maxlength="100" value="${esc(it.title)}" required></label><label>Tavsif<textarea name="d" maxlength="500">${esc(it.description)}</textarea></label><label>Havola (ixtiyoriy)<input name="l" maxlength="300" placeholder="https://" value="${esc(it.link)}"></label><button class="bt">Saqlash</button>${editId?` <button type="button" class="bt o" onclick="editId=null;go('port')">Bekor</button>`:""}</form>
<div class="card"><h3>Mening ishlarim</h3>${D.pf.length?D.pf.map(p=>`<div class="rw"><div><span class="b">${esc(p.kind)}</span> <b>${esc(p.title)}</b><p class="m">${esc(p.description||"")} ${safe(p.link)?`<a href="${esc(safe(p.link))}" target="_blank" rel="noopener" style="color:#a5b4fc">havola ↗</a>`:""}</p></div><div><button class="bt o" onclick="editId='${p.id}';go('port')">Tahrirlash</button> <button class="bt r" onclick="delPf('${p.id}')">O‘chirish</button></div></div>`).join(""):empty("Portfolio hozircha bo‘sh.")}</div></div>`},
set(){return `<h1>Sozlamalar</h1><div class="g g2"><form class="card" onsubmit="savePw(event)"><h3>Parolni o‘zgartirish</h3><label>Yangi parol (kamida 6 belgi)<input type="password" name="pw" minlength="6" required></label><button class="bt">Parolni yangilash</button> <span id="sm" class="ok"></span></form>
<div class="card"><h3>Profil</h3><p class="m" style="margin-bottom:12px">Ma’lumotlaringizni “Profilim” bo‘limida tahrirlaysiz.</p><button class="bt o" onclick="go('prof')">Profilga o‘tish</button><h3 style="margin-top:22px">Bildirishnomalar</h3><p class="m">Yangiliklar hozircha Telegram kanalimiz orqali beriladi.</p><button class="bt" style="margin-top:22px" onclick="out()">Xavfsiz chiqish</button></div></div>`}};

const IC={home:"M3 11 12 3l9 8v10h-6v-6H9v6H3z",prof:"M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 4-6 8-6s8 2 8 6",apps:"M3 8h18v12H3zM9 8V5h6v3",evs:"M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",certs:"M12 14a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.5 13.5 7 22l5-3 5 3-1.5-8.5",port:"M3 6h6l2 2h10v12H3z",set:"M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6",ver:"M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4",site:"M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18",adm:"M12 3l8 4v5c0 4-3 7-8 9-5-2-8-5-8-9V7z",team:"M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20c0-3 3-5 6-5s6 2 6 5M16 15c3 0 6 2 6 5",out:"M9 4H4v16h5M16 8l4 4-4 4M20 12H9"};
const ic=n=>`<svg class="ic" viewBox="0 0 24 24"><path d="${IC[n]}"/></svg>`;
function buildNav(){
 const L=[["home","Bosh sahifa"],["prof","Profilim"],["apps","Mening arizalarim"],["evs","Mening tadbirlarim"],["certs","Mening sertifikatlarim"],["port","Portfolio"],["team","Jamoa paneli"],["set","Sozlamalar"]];
 $("#sb").innerHTML=`<div class="logo"><img src="/assets/img/logo-h.png" alt="MINDOVA"></div>`+L.map(([v,t])=>`<button class="nv" data-v="${v}">${ic(v)}${t}</button>`).join("")+`<div class="sp"></div><a class="nv" href="/connect.html">${ic("team")}Mindova Connect</a><a class="nv" href="/verify.html">${ic("ver")}Sertifikatni tekshirish</a><a class="nv" href="/">${ic("site")}Saytga qaytish</a><a class="nv" id="adm" href="/admin.html" hidden>${ic("adm")}Admin panel</a><a class="nv" id="scn" href="/scan.html" hidden>${ic("ver")}Skaner paneli</a><button class="nv" style="margin-top:auto" onclick="out()">${ic("out")}Chiqish</button>`;
 $("#bn").innerHTML=[["home","Bosh"],["apps","Arizalar"],["evs","Tadbirlar"],["certs","Sertifikat"],["prof","Profil"]].map(([v,t])=>`<button data-v="${v}">${ic(v)}${t}</button>`).join("");
 document.querySelectorAll("[data-v]").forEach(b=>b.onclick=()=>go(b.dataset.v));
}
const menu=o=>{$("#sb").classList.toggle("open",o);$("#ov").classList.toggle("on",o)};
function go(n){cur=n;document.querySelectorAll("[data-v]").forEach(b=>b.classList.toggle("on",b.dataset.v===n));$("#tav").innerHTML=av();$("#view").innerHTML=V[n]();menu(false);scrollTo(0,0);fill();if(n==="team"){SP.ok?fillId():initTeam()}}
async function out(){sessionStorage.removeItem("smu");await sb.auth.signOut();location.href="/"}
async function saveP(e){
 e.preventDefault();
 const f=e.target,btn=$("#pSave"),msg=$("#pm");
 const v={
  full_name:f.fn.value.trim().replace(/\s+/g," "),
  telegram_username:f.tg.value.trim().replace(/^@+/,"").toLowerCase()||null,
  updated_at:new Date().toISOString()
 };
 if(v.full_name.length<3){msg.textContent="Ism va familiyani to‘liq kiriting.";f.fn.focus();return}
 if(v.telegram_username&&!/^[a-z][a-z0-9_]{4,31}$/.test(v.telegram_username)){
  msg.textContent="Telegram username noto‘g‘ri. Masalan: mindova_uz";
  f.tg.focus();return;
 }
 msg.textContent="";btn.disabled=true;const btnText=btn.textContent;btn.textContent="Saqlanmoqda…";
 try{
  const {error}=await sb.from("profiles").upsert({id:U.id,email:U.email,...v},{onConflict:"id"});
  if(error)throw error;
  Object.assign(P,v);
  U.user_metadata={...(U.user_metadata||{}),full_name:v.full_name,telegram_username:v.telegram_username};
  const au=await sb.auth.updateUser({data:{full_name:v.full_name,telegram_username:v.telegram_username}});
  if(au.error)console.warn("Auth ma’lumotlari yangilanmadi:",au.error.message);
  D.reg.forEach(r=>{r.full_name=v.full_name;r.telegram_username=v.telegram_username});
  /* QR chipta va admin ro‘yxatlarida ham yangi ism ko‘rinishi uchun */
  let ur=await sb.rpc("sync_my_registration_names",{p_full_name:v.full_name,p_telegram:v.telegram_username||null});
  if(ur.error&&/PGRST202|could not find|does not exist/i.test(ur.error.message||""))ur=await sb.from("registrations").update({full_name:v.full_name,telegram_username:v.telegram_username}).eq("user_id",U.id);
  if(ur.error)console.warn("Ro‘yxatdan o‘tish yozuvlari yangilanmadi:",ur.error.message);
  go("prof");
  const m=$("#pm");if(m){m.style.color="#6ee7b7";m.textContent="Saqlandi ✓"}
 }catch(err){
  msg.textContent="Xato: "+(err.message||err);
 }finally{
  const b=$("#pSave");if(b){b.disabled=false;b.textContent=btnText}
 }
}
async function upAv(i){const fl=i.files[0];if(!fl)return;try{const im=await decodeImg(fl),s=Math.min(1,512/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=im.width*s;c.height=im.height*s;c.getContext("2d").drawImage(im,0,0,c.width,c.height);
 const b=await new Promise(r=>c.toBlob(r,"image/jpeg",.85)),p=U.id+"/"+Date.now()+".jpg",u=await sb.storage.from("avatars").upload(p,b,{contentType:"image/jpeg"});if(u.error)throw u.error;
 const url=sb.storage.from("avatars").getPublicUrl(p).data.publicUrl,{error}=await sb.from("profiles").update({avatar_url:url}).eq("id",U.id);if(error)throw error;P.avatar_url=url;go("prof")}catch(e){alert("Rasm yuklanmadi: "+e.message)}}
async function savePf(e){e.preventDefault();const f=e.target,v={kind:f.k.value,title:f.t.value.trim(),description:f.d.value.trim(),link:f.l.value.trim()||null};
 const r=editId?await sb.from("portfolio_items").update(v).eq("id",editId):await sb.from("portfolio_items").insert([v]);
 if(r.error){alert("Xato: "+r.error.message);return}editId=null;await load();go("port")}
async function delPf(id){if(!confirm("O‘chirilsinmi?"))return;const {error}=await sb.from("portfolio_items").delete().eq("id",id);if(error){alert(error.message);return}await load();go("port")}
async function savePw(e){e.preventDefault();const {error}=await sb.auth.updateUser({password:e.target.pw.value});$("#sm").textContent=error?"Xato: "+error.message:"Parol yangilandi ";if(!error)e.target.reset()}

async function retry(){$("#msg").textContent="Qayta yuklanmoqda…";await load();go(cur)}
async function load(){
 const q=(t,f)=>f(sb.from(t).select("*"));
 const R=await Promise.all([
  q("profiles",x=>x.eq("id",U.id).maybeSingle()),
  q("registrations",x=>x.eq("user_id",U.id).order("created_at",{ascending:false})),
  q("events",x=>x.eq("status","published").order("starts_at",{ascending:true})),
  q("job_applications",x=>x.eq("user_id",U.id).order("created_at",{ascending:false})),
  q("certificates",x=>x.eq("user_id",U.id).order("issued_at",{ascending:false})),
  q("portfolio_items",x=>x.eq("user_id",U.id).order("created_at",{ascending:false})),
  q("opportunities",x=>x)]);
 const er=R.find(r=>r.error),net=er&&/load failed|failed to fetch|network/i.test(er.error.message||"");
 $("#msg").innerHTML=!er?"":net?`Serverga ulanib bo‘lmadi (internet yoki server muammosi). Ma’lumotlaringiz o‘chmagan. <button class="bt o" style="margin-left:6px" onclick="retry()">Qayta urinish</button>`:"Ba’zi ma’lumotlar yuklanmadi: "+esc(er.error.message);
 if(net&&!window._rt){window._rt=1;setTimeout(retry,3000)}
 P=R[0].data;
 if(!P){P={id:U.id,email:U.email,full_name:U.user_metadata?.full_name||"",created_at:new Date().toISOString()};if(!R[0].error)await sb.from("profiles").upsert({id:U.id,email:U.email,full_name:P.full_name})}
 D={reg:R[1].data||[],ev:R[2].data||[],job:R[3].data||[],cert:R[4].data||[],pf:R[5].data||[],op:R[6].data||[]};
}
(async()=>{
 const {data:{session}}=await sb.auth.getSession();
 if(!session){location.href="/";return}
 U=session.user;
 sb.auth.onAuthStateChange(ev=>{if(ev==="SIGNED_OUT")location.href="/"});
 buildNav();
 const a=await sb.rpc("is_admin");ADMIN=!!a.data;$("#adm").hidden=!ADMIN;const rg=await sb.rpc("is_registrator");$("#scn").hidden=!rg.data;
 await load();const h=location.hash.slice(1);go(REC?"set":V[h]?h:"home");
})();

/* Fon harakati: telefonni qiyshaytirganda (yoki sichqoncha bilan) rasm sekin siljiydi */
(function(){
 if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
 let tx=0,ty=0,gx=0,gy=0,b0=null,g0=null;const st=document.documentElement.style,cl=v=>Math.max(-1,Math.min(1,v));
 (function tick(){if(Math.abs(gx-tx)>.05||Math.abs(gy-ty)>.05){tx+=(gx-tx)*.08;ty+=(gy-ty)*.08;st.setProperty("--tx",tx.toFixed(1)+"px");st.setProperty("--ty",ty.toFixed(1)+"px")}requestAnimationFrame(tick)})();
 const ori=e=>{if(e.beta==null||e.gamma==null)return;if(b0===null){b0=e.beta;g0=e.gamma}b0+=(e.beta-b0)*.003;g0+=(e.gamma-g0)*.003;gx=-cl((e.gamma-g0)/22)*innerWidth*.06;gy=-cl((e.beta-b0)/22)*innerHeight*.05};
 const on=()=>addEventListener("deviceorientation",ori);
 const DO=window.DeviceOrientationEvent;
 if(DO&&typeof DO.requestPermission==="function"){addEventListener("click",()=>{DO.requestPermission().then(s=>{if(s==="granted")on()}).catch(()=>{})},{once:true})}
 else if(DO&&"ontouchstart" in window)on();
 if(matchMedia("(hover:hover)").matches)addEventListener("mousemove",e=>{gx=-(e.clientX/innerWidth-.5)*innerWidth*.05;gy=-(e.clientY/innerHeight-.5)*innerHeight*.04});
})();
