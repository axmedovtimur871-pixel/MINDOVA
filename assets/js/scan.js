/* MINDOVA — scan sahifasi skripti */
const sb=supabase.createClient("https://zrebikqvjbvuwbzcunkw.supabase.co","sb_publishable_DszdaPjNPM3i0UbGX3lLjQ_DTjdfLcW");
const $=q=>document.querySelector(q);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let busy=false,count=0,stream=null;
const tm=d=>{const x=new Date(d);return isNaN(x)?"":String(x.getHours()).padStart(2,"0")+":"+String(x.getMinutes()).padStart(2,"0")};
(async()=>{
 const {data:{session}}=await sb.auth.getSession();
 if(!session){$("#who").innerHTML='Avval <a href="/">saytga kiring</a>, so‘ng bu sahifani qayta oching.';return}
 const r=await sb.rpc("is_registrator");
 if(!r.data){$("#who").textContent="Sizda registrator huquqi yo‘q. Admin sizga huquq berishi kerak.";return}
 $("#who").textContent=session.user.email;$("#app").hidden=false;
 const ev=await sb.from("events").select("id,title").order("starts_at",{ascending:false});
 (ev.data||[]).forEach(x=>{const o=document.createElement("option");o.value=x.id;o.textContent=x.title;$("#ev").appendChild(o)});
})();
function show(cls,html){$("#res").innerHTML=`<div class="r ${cls}">${html}</div>`}
let lastCode="";
async function handle(raw,cash){
 let code=String(raw||"").trim();try{const u=new URL(code);code=u.searchParams.get("t")||code}catch(e){}
 if(!code)return;lastCode=code;busy=true;$("#st").textContent="Tekshirilmoqda…";
 const {data,error}=await sb.rpc("checkin_ticket",{p_code:code,p_event_id:$("#ev").value||null,p_cash:!!cash});
 busy=false;$("#st").textContent="";
 if(error){show("no",`<h2>❌ Xato</h2><p>${esc(error.message)}</p>`);return}
 const r=data&&data[0];if(!r){show("no","<h2>❌ Chipta topilmadi</h2>");return}
 const pay=r.payment_status==="free"?"Bepul":r.payment_status==="paid"?"To‘langan":"To‘lanmagan";
 const info=`<b class="n">${esc(r.full_name||"—")}</b><p><span>Tadbir:</span> ${esc(r.event_title||"—")}</p><p><span>Telefon:</span> ${r.phone?`<a href="tel:${esc(r.phone)}">${esc(r.phone)}</a>`:"—"}</p><p><span>Telegram:</span> ${r.telegram_username?"@"+esc(r.telegram_username):"—"}</p><p><span>Yosh:</span> ${esc(r.age??"—")}</p><p><span>To‘lov:</span> ${pay}${r.amount?" ("+esc(r.amount)+" so‘m)":""}</p>`;
 if(r.status==="ok"){show("ok",`<h2>✅ Keldi: qabul qilindi</h2>${info}${r.cert_issued?'<p>🎓 Sertifikat avtomatik berildi</p>':""}`);count++;$("#cnt").textContent=count;$("#log").insertAdjacentHTML("afterbegin",`<div class="row"><span>${esc(r.full_name)}</span><span class="m">${tm(r.checked_in_at)}</span></div>`);navigator.vibrate&&navigator.vibrate(120)}
 else if(r.status==="unpaid"){show("wn",`<h2>⚠️ To‘lov tasdiqlanmagan</h2>${info}<button class="bt" id="cashBtn" style="margin-top:10px">Naqd to‘landi, kirgizish</button>`);$("#cashBtn").onclick=()=>handle(lastCode,true)}
 else if(r.status==="already")show("wn",`<h2>⚠️ Bu chipta allaqachon ishlatilgan</h2>${info}<p><span>Kirgan vaqti:</span> ${tm(r.checked_in_at)}</p>`);
 else show("no",`<h2>❌ Boshqa tadbir chiptasi</h2>${info}`);
}
$("#go").onclick=()=>{const v=$("#man").value;$("#man").value="";handle(v)};
let bd=null;try{if("BarcodeDetector" in window)bd=new BarcodeDetector({formats:["qr_code"]})}catch(e){bd=null}
$("#cam").onclick=async()=>{
 if(!bd&&typeof jsQR==="undefined"){$("#st").textContent="Skaner kutubxonasi yuklanmadi. Sahifani yangilang yoki kodni qo‘lda kiriting.";return}
 try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"},width:{ideal:1280},height:{ideal:720}}})}
 catch(e){$("#st").textContent="Kameraga ruxsat berilmadi: "+e.message;return}
 const v=$("#v");v.srcObject=stream;v.setAttribute("playsinline","");v.style.display="block";try{await v.play()}catch(e){}
 $("#cam").hidden=true;$("#st").textContent="QR kodni kameraga ko‘rsating (ekran yorqin, kamera yaqinroq bo‘lsin)";
 const cv=document.createElement("canvas"),cx=cv.getContext("2d",{willReadFrequently:true});
 async function scan(){
  try{
   if(!busy&&v.readyState>=2&&v.videoWidth){
    let data=null;
    if(bd){try{const r=await bd.detect(v);if(r.length)data=r[0].rawValue}catch(e){bd=null}}
    if(!bd&&!data&&typeof jsQR!=="undefined"){
     const sc=Math.min(1,720/v.videoWidth);cv.width=Math.round(v.videoWidth*sc);cv.height=Math.round(v.videoHeight*sc);
     cx.drawImage(v,0,0,cv.width,cv.height);
     const im=cx.getImageData(0,0,cv.width,cv.height),c=jsQR(im.data,im.width,im.height,{inversionAttempts:"attemptBoth"});
     if(c)data=c.data;
    }
    if(data){busy=true;await handle(data);busy=true;setTimeout(()=>{busy=false},2500)}
   }
  }catch(e){console.error(e);$("#st").textContent="Skaner xatosi: "+e.message}
  setTimeout(scan,150);
 }
 scan();
};
