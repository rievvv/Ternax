/* Ternax by Nexora - script.js (v2: login + realtime Firebase + filter + export) */
const TY={kambing:'Kambing',ayam:'Ayam',sapi:'Sapi',telur:'Telur'};
const ST={ready:'Ready',order:'By Order',sold:'Sold'};
const PAGES=[['dash','📊','Dashboard'],['input','➕','Input'],['kambing','🐐','Kambing'],['ayam','🐔','Ayam'],['sapi','🐄','Sapi'],['telur','🥚','Telur'],['jual','💰','Penjualan'],['hpp','🧮','Hitung HPP'],['profil','👤','Profil']];
const EM={kambing:'🐐',ayam:'🐔',sapi:'🐄',telur:'🥚'};
let S={profile:{},items:[],rates:{kambing:90000,ayam:45000,sapi:60000,telur:45}};
let page='dash',draftType='kambing',photoTmp='',base=null,auth=null,unsubs=[],FL={};
const $=s=>document.querySelector(s);
const rp=n=>'Rp '+Math.round(n||0).toLocaleString('id-ID');
const est=i=>Math.round((+i.weight||0)*S.rates[i.type]);
const prof=i=>(+i.price||0)-(+i.cost||0);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const sel=(id,opts,v)=>`<select id="${id}">${opts.map(o=>`<option value="${o[0]}" ${o[0]==v?'selected':''}>${o[1]}</option>`).join('')}</select>`;
const F=(l,h)=>`<div><label>${l}</label>${h}</div>`;
const ph=i=>i.photo?`<img class="th" src="${i.photo}">`:'<div class="th" style="background:var(--bd);display:flex;align-items:center;justify-content:center">📷</div>';

/* ---------- SPLASH ---------- */
(function(){const sp=$('#splash');if(matchMedia('(max-width:760px)').matches)setTimeout(()=>{sp.classList.add('hide');setTimeout(()=>sp.remove(),600)},2400);else sp.remove()})();

/* ---------- PWA: pasang & pintasan ---------- */
let dp=null;
addEventListener('beforeinstallprompt',e=>{e.preventDefault();dp=e;$('#inst').classList.remove('hidden');$('#inst2').classList.remove('hidden')});
addEventListener('appinstalled',()=>{$('#inst').classList.add('hidden');$('#inst2').classList.add('hidden')});
const doInst=async()=>{if(!dp)return;dp.prompt();await dp.userChoice;dp=null;$('#inst').classList.add('hidden');$('#inst2').classList.add('hidden')};
$('#inst').onclick=$('#inst2').onclick=doInst;
if(/iphone|ipad/i.test(navigator.userAgent)&&!navigator.standalone)$('#ios').classList.remove('hidden');
if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
const setSync=()=>{const e=$('#sync');e.textContent=navigator.onLine?'● Realtime':'● Offline';e.style.color=navigator.onLine?'#c8f5a0':'#ffcc80'};
addEventListener('online',setSync);addEventListener('offline',setSync);

/* ---------- LOGIN + FIREBASE ---------- */
const cfg=window.FIREBASE_CONFIG;
const okCfg=cfg&&cfg.apiKey&&!/^ISI/.test(cfg.apiKey)&&window.firebase;
const ERR={'auth/invalid-credential':'Email atau password salah.','auth/wrong-password':'Password salah.','auth/user-not-found':'Akun tidak ditemukan.','auth/email-already-in-use':'Email sudah terdaftar.','auth/weak-password':'Password minimal 6 karakter.','auth/invalid-email':'Format email salah.','auth/network-request-failed':'Tidak ada koneksi internet.','auth/too-many-requests':'Terlalu banyak percobaan, coba lagi nanti.'};
function doAuth(reg){
  if(!okCfg)return;
  const e=$('#em').value.trim(),p=$('#pw').value;$('#lerr').textContent='';
  (reg?auth.createUserWithEmailAndPassword(e,p):auth.signInWithEmailAndPassword(e,p)).catch(x=>$('#lerr').textContent=ERR[x.code]||x.message);
}
$('#lin').onclick=()=>doAuth(false);$('#lreg').onclick=()=>doAuth(true);
$('#pw').onkeydown=e=>{if(e.key=='Enter')doAuth(false)};
$('#out').onclick=logout;
function showLogin(){$('#login').classList.remove('hidden');$('#app').classList.add('hidden')}
function onAuth(u){
  unsubs.forEach(f=>f());unsubs=[];
  if(!u){S.items=[];showLogin();return}
  $('#login').classList.add('hidden');$('#app').classList.remove('hidden');setSync();page='dash';
  base=firebase.firestore().collection('users').doc(u.uid);
  unsubs.push(base.collection('items').onSnapshot(s=>{S.items=s.docs.map(d=>d.data());onData()},e=>alert('Gagal sinkron: '+e.message)));
  unsubs.push(base.collection('meta').doc('profile').onSnapshot(d=>{S.profile=d.exists?d.data():{};updHdr();nav()}));
  unsubs.push(base.collection('meta').doc('settings').onSnapshot(d=>{if(d.exists)Object.assign(S.rates,d.data());onData()}));
  nav();render();
}
function onData(){ if(page=='dash')renderDash(); else if(!['input','hpp','profil'].includes(page))renderTable() }   // update realtime tanpa mengganggu form
const saveItem=o=>{if(o.status=='sold'&&!o.soldAt)o.soldAt=Date.now();if(o.status!='sold')delete o.soldAt;return base.collection('items').doc(String(o.id)).set(o).catch(e=>alert('Gagal menyimpan: '+e.message))};
const delItem=id=>base.collection('items').doc(String(id)).delete().catch(e=>alert(e.message));
if(okCfg){
  firebase.initializeApp(cfg);auth=firebase.auth();
  try{firebase.firestore().enablePersistence({synchronizeTabs:true}).catch(()=>{})}catch(e){}
  auth.onAuthStateChanged(onAuth);
}else{showLogin();$('#lerr').textContent=!window.firebase?'Library Firebase gagal dimuat. Periksa koneksi internet, matikan adblock/VPN, lalu refresh.':!cfg?'File firebase-config.js tidak terbaca atau isinya salah (harus diawali window.FIREBASE_CONFIG = ).':'apiKey di firebase-config.js belum diisi dengan benar.'}

/* ---------- FORM ---------- */
function form(it,isNew){
  const t=it.type,v=k=>esc(it[k]),L=t=='telur',inp=(k,l,ty='number')=>F(l,`<input type="${ty}" ${ty=='number'?'step="any" ':''}id="f_${k}" value="${v(k)}">`);
  const today=new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);
  const A=L?F('Tanggal bertelur *',`<input type="date" id="f_laydate" value="${it.laydate||(isNew?today:'')}">`):'',
  E=F('Status *',sel('f_status',[['ready','Ready'],['order','By Order'],['sold','Sold']],it.status||'ready')),
  B=F('Kode',`<input id="f_code" value="${v('code')}"${isNew?' placeholder="Otomatis jika kosong"':''}>`),
  C=L?inp('hen','Kode ayam petelur','text')+inp('weight','Berat telur (gram)'):F('Jenis kelamin',sel('f_sex',[['','– pilih –'],['Jantan','Jantan'],['Betina','Betina']],it.sex))+inp('age','Usia (bulan)')+inp('weight','Berat (kg)'),
  D=inp('cost','Modal / biaya (Rp)')+inp('price','Harga dari saya (Rp)'),
  G=F('Foto','<input type="file" accept="image/*" id="f_photo">'),
  N=`<div style="margin-top:12px">${F('Keterangan',`<textarea id="f_note" rows="3">${v('note')}</textarea>`)}</div>`,
  P=`<div id="pv">${it.photo?`<img src="${it.photo}" style="max-width:160px;border-radius:10px;margin-top:10px">`:''}</div>`;
  if(!isNew)return `<div class="grid">${A}${B}${C}${D}${E}${G}</div>${N}${P}`;
  return `<div class="grid">${F('Jenis *',sel('f_type',Object.entries(TY),t))}${A}${E}</div><details class="opt"><summary>＋ Data tambahan (opsional, bisa diisi nanti)</summary><div class="grid" style="margin-top:12px">${B}${C}${D}${G}</div>${N}</details>${P}`;
}
function bindForm(){
  const p=$('#f_photo');if(!p)return;
  p.onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas'),s=Math.min(1,480/Math.max(im.width,im.height));c.width=im.width*s;c.height=im.height*s;c.getContext('2d').drawImage(im,0,0,c.width,c.height);photoTmp=c.toDataURL('image/jpeg',.6);$('#pv').innerHTML=`<img src="${photoTmp}" style="max-width:160px;border-radius:10px;margin-top:10px">`};im.src=r.result};r.readAsDataURL(f)};
}
function read(b){
  const g=k=>{const e=$('#f_'+k);return e?e.value:undefined},o=Object.assign({},b);
  ['code','sex','age','weight','cost','price','status','note','laydate','hen'].forEach(k=>{const x=g(k);if(x!==undefined)o[k]=x});
  if(g('type'))o.type=g('type');if(photoTmp)o.photo=photoTmp;return o;
}

/* ---------- NAVIGASI ---------- */
function av(){const p=S.profile||{},u=auth&&auth.currentUser,n=p.name||(u&&u.email)||'?';return p.photo?`<img src="${p.photo}">`:`<span>${esc(n[0].toUpperCase())}</span>`}
function updHdr(){const u=auth&&auth.currentUser;$('#av').innerHTML=av();$('#who').textContent=(S.profile&&S.profile.name)||(u?u.email:'')}
function nav(){const u=auth&&auth.currentUser,p=S.profile||{};
  $('#nav').innerHTML=`<div class="dp"><div class="av">${av()}</div><div><b>${esc(p.name||'Peternak')}</b><small>${esc(u?u.email:'')}</small></div></div>`+PAGES.map(p=>`<button class="${page==p[0]?'on':''}${p[0]=='profil'?' pfbtn':''}" onclick="go('${p[0]}')"><span>${p[1]}</span><span>${p[2]}</span></button>`).join('')+`<button class="lg" onclick="logout()"><span>🚪</span><span>Keluar</span></button>`}
function go(p){page=p;photoTmp='';menu(false);nav();render();scrollTo(0,0)}
function menu(o){$('#nav').classList.toggle('open',o);$('#bd').classList.toggle('show',o)}
$('#burger').onclick=()=>menu(!$('#nav').classList.contains('open'));$('#bd').onclick=()=>menu(false);
function logout(){if(confirm('Keluar dari akun?'))auth.signOut()}

/* ---------- DASHBOARD ---------- */
function renderDash(){
  if(page!='dash')return;
  const I=S.items,sold=I.filter(i=>i.status=='sold'),st=I.filter(i=>i.status!='sold');
  const sum=(a,f)=>a.reduce((x,i)=>x+f(i),0),P=i=>+i.price||0,C=i=>+i.cost||0;
  const inc=sum(sold,P),cogs=sum(sold,C),lab=inc-cogs,mkt=sum(st,est),val=sum(st,P),pot=val-sum(st,C),mg=inc?Math.round(lab/inc*100):0;
  const cards=Object.keys(TY).map(k=>{const a=I.filter(i=>i.type==k),c=x=>a.filter(i=>i.status==x).length;return `<div class="card kc" onclick="go('${k}')"><div class="em">${EM[k]}</div><label>${TY[k]}</label><div class="stat">${a.length}</div><small>Ready ${c('ready')} · Order ${c('order')} · Terjual ${c('sold')}</small></div>`}).join('');
  const kp=(l,v,c)=>`<div class="card kpi ${c||''}"><label>${l}</label><div class="stat">${v}</div></div>`;
  const now=new Date(),M=[];for(let n=5;n>=0;n--){const d=new Date(now.getFullYear(),now.getMonth()-n,1);M.push({k:d.getFullYear()+'-'+d.getMonth(),l:d.toLocaleDateString('id-ID',{month:'short'}),i:0,b:0})}
  sold.forEach(i=>{const d=new Date(i.soldAt||i.id),m=M.find(x=>x.k==d.getFullYear()+'-'+d.getMonth());if(m){m.i+=P(i);m.b+=prof(i)}});
  const mx=Math.max(1,...M.map(m=>m.i),...M.map(m=>m.b));
  $('#main').innerHTML=`<div class="sec">Jumlah ternak (stok aktif + terjual)</div><div class="grid">${cards}</div>
  <div class="sec">Nilai stok yang belum terjual (${st.length} data)</div><div class="grid">${kp('Taksiran harga pasar',rp(mkt))}${kp('Nilai jual (harga saya)',rp(val))}${kp('Potensi keuntungan',rp(pot),'')}</div>
  <div class="sec">Hasil penjualan (${sold.length} terjual)</div><div class="grid">${kp('Income / pendapatan',rp(inc),'g')}${kp('Modal barang terjual',rp(cogs))}${kp('Laba bersih',rp(lab),'g')}${kp('Margin laba',mg+'%')}</div>
  <div class="sec">Tren 6 bulan terakhir</div><div class="card"><div class="bars">${M.map(m=>`<div class="bc"><div class="bp"><i class="b1" style="height:${m.i/mx*100}%" title="Income ${rp(m.i)}"></i><i class="b2" style="height:${Math.max(0,m.b)/mx*100}%" title="Laba ${rp(m.b)}"></i></div>${m.l}</div>`).join('')}</div><div class="lg2"><span><i class="b1"></i>Income</span><span><i class="b2"></i>Laba bersih</span></div></div>`;
}

/* ---------- PROFIL ---------- */
function resize(f,max,cb){const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas'),k=Math.min(1,max/Math.max(im.width,im.height));c.width=im.width*k;c.height=im.height*k;c.getContext('2d').drawImage(im,0,0,c.width,c.height);cb(c.toDataURL('image/jpeg',.7))};im.src=r.result};r.readAsDataURL(f)}
function renderProfil(){
  const p=S.profile||{},u=auth.currentUser;let newPhoto='';
  $('#main').innerHTML=`<div class="card"><h2>Profil Saya</h2><div class="pf"><div class="av" id="pav">${av()}</div><div>${F('Ganti foto profil','<input type="file" accept="image/*" id="pp_photo">')}</div></div>
  <div class="grid">${F('Nama lengkap',`<input id="pp_name" value="${esc(p.name)}">`)}${F('Nama peternakan',`<input id="pp_farm" value="${esc(p.farm)}">`)}${F('No. HP / WhatsApp',`<input id="pp_hp" type="tel" value="${esc(p.hp)}">`)}${F('Email',`<input value="${esc(u.email)}" disabled>`)}${F('Password baru (kosongkan jika tidak diganti)','<input id="pp_pw" type="password" autocomplete="new-password">')}</div>
  <div style="margin-top:12px">${F('Alamat peternakan',`<textarea id="pp_addr" rows="2">${esc(p.addr)}</textarea>`)}</div>
  <div class="row"><button class="btn" id="pp_save">Simpan profil</button><button class="btn red" onclick="logout()">Keluar</button></div></div>`;
  $('#pp_photo').onchange=e=>{const f=e.target.files[0];if(f)resize(f,240,d=>{newPhoto=d;$('#pav').innerHTML=`<img src="${d}">`})};
  $('#pp_save').onclick=async()=>{
    const o={name:$('#pp_name').value.trim(),farm:$('#pp_farm').value.trim(),hp:$('#pp_hp').value.trim(),addr:$('#pp_addr').value.trim()};
    if(newPhoto)o.photo=newPhoto;
    try{await base.collection('meta').doc('profile').set(o,{merge:true});const pw=$('#pp_pw').value;if(pw)await u.updatePassword(pw);alert('Profil tersimpan');$('#pp_pw').value=''}
    catch(e){alert(e.code=='auth/requires-recent-login'?'Untuk ganti password, keluar lalu login ulang, kemudian coba lagi.':e.code=='auth/weak-password'?'Password minimal 6 karakter.':'Gagal: '+e.message)}
  };
}

/* ---------- FILTER ---------- */
function getList(){
  const f=FL[page]||{},q=(f.q||'').toLowerCase();
  let L=S.items.filter(i=>page=='jual'?i.status=='sold':i.type==page&&i.status!='sold');
  if(q)L=L.filter(i=>[i.code,i.note,i.hen].join(' ').toLowerCase().includes(q));
  if(f.ty)L=L.filter(i=>i.type==f.ty);
  if(f.st)L=L.filter(i=>i.status==f.st);
  if(f.sx)L=L.filter(i=>i.sex==f.sx);
  if(f.d1)L=L.filter(i=>(i.laydate||'')>=f.d1);
  if(f.d2)L=L.filter(i=>(i.laydate||'')<=f.d2&&i.laydate);
  const so=f.so||'new',key={weight:i=>+i.weight||0,price:i=>+i.price||0,profit:prof,age:i=>+i.age||0}[so];
  return L.sort((a,b)=>key?key(b)-key(a):b.id-a.id);
}
function setF(k,v){(FL[page]=FL[page]||{})[k]=v;renderTable()}
function fsel(k,opts,v){return `<select onchange="setF('${k}',this.value)">${opts.map(o=>`<option value="${o[0]}" ${o[0]==(v||'')?'selected':''}>${o[1]}</option>`).join('')}</select>`}
function fbar(){
  const f=FL[page]||{},e=page=='telur',j=page=='jual';
  let h=`<div class="grid fb"><input placeholder="🔍 Cari kode / keterangan" value="${esc(f.q)}" oninput="setF('q',this.value)">`;
  if(j)h+=fsel('ty',[['','Semua jenis'],...Object.entries(TY)],f.ty);
  else{h+=fsel('st',[['','Semua status'],['ready','Ready'],['order','By Order']],f.st);
    if(!e)h+=fsel('sx',[['','Semua kelamin'],['Jantan','Jantan'],['Betina','Betina']],f.sx)}
  if(e)h+=`<input type="date" title="Dari tanggal" value="${f.d1||''}" onchange="setF('d1',this.value)"><input type="date" title="Sampai tanggal" value="${f.d2||''}" onchange="setF('d2',this.value)">`;
  h+=fsel('so',[['new','Urut: Terbaru'],['weight','Berat tertinggi'],['price','Harga tertinggi'],['profit','Untung tertinggi'],...(e||j?[]:[['age','Usia tertua']])],f.so);
  return h+`<button class="btn alt" onclick="FL[page]={};render()">↺ Reset</button></div>`;
}

/* ---------- TABEL & EXPORT ---------- */
function spec(){
  const e=page=='telur',j=page=='jual',m=(raw,v)=>raw?Math.round(v||0):rp(v);
  if(j)return{h:['Jenis','Kode','Harga jual','Modal','Keuntungan','Keterangan'],r:(i,w)=>[TY[i.type],i.code,m(w,i.price),m(w,i.cost),m(w,prof(i)),i.note||'']};
  return{h:e?['Kode','Tgl bertelur','Kode ayam','Berat (g)','Taksir pasar','Harga saya','Taksir untung','Status','Keterangan']:['Kode','Kelamin','Usia (bln)','Berat (kg)','Taksir pasar','Harga saya','Taksir untung','Status','Keterangan'],
    r:(i,w)=>[i.code,...(e?[i.laydate||'-',i.hen||'-',+i.weight||0]:[i.sex,+i.age||0,+i.weight||0]),m(w,est(i)),m(w,i.price),m(w,prof(i)),ST[i.status],i.note||'']};
}
const title=()=>page=='jual'?'Penjualan':'Data '+TY[page];
function render(){
  if(page=='dash')return renderDash();
  if(page=='profil')return renderProfil();
  if(page=='input'){
    $('#main').innerHTML=`<div class="card"><h2>Input Data Ternak</h2><p style="color:var(--mut);margin:-4px 0 12px">Yang wajib diisi hanya yang bertanda *.</p>${form({type:draftType},true)}<div class="row"><button class="btn" id="sv">Simpan</button></div></div>`;
    bindForm();$('#f_type').onchange=e=>{draftType=e.target.value;photoTmp='';render()};
    $('#sv').onclick=()=>{const o=read({type:draftType,id:Date.now()});if(o.type=='telur'&&!o.laydate){alert('Tanggal bertelur wajib diisi');return}
      if(!o.code){const pre={kambing:'KMB',ayam:'AYM',sapi:'SPI',telur:'TLR'}[o.type];let n=S.items.filter(i=>i.type==o.type).length+1;while(S.items.some(i=>i.code==pre+'-'+String(n).padStart(3,'0')))n++;o.code=pre+'-'+String(n).padStart(3,'0')}saveItem(o);photoTmp='';alert('Data tersimpan!');go(o.status=='sold'?'jual':o.type)};
  }else if(page=='hpp'){renderHPP();
  }else{
    $('#main').innerHTML=`<div class="card"><div class="hd"><h2>${title()}</h2><div class="ex"><button class="btn alt" onclick="exp('pdf')">📄 PDF</button><button class="btn alt" onclick="exp('xlsx')">📊 Excel</button></div></div>${fbar()}<div id="sum"></div><div class="tw" id="tbl"></div></div>`;
    renderTable();
  }
}
function renderTable(){
  const t=$('#tbl');if(!t||$('#modal').classList.contains('show'))return;
  const L=getList(),sp=spec(),j=page=='jual',si=sp.h.indexOf('Status');
  $('#sum').innerHTML=`<span>Jumlah: <b>${L.length}</b></span>`+(j?`<span>Pendapatan: <b>${rp(L.reduce((a,i)=>a+(+i.price||0),0))}</b></span><span>Keuntungan: <b class="pos">${rp(L.reduce((a,i)=>a+prof(i),0))}</b></span>`:`<span>Total taksir pasar: <b>${rp(L.reduce((a,i)=>a+est(i),0))}</b></span><span>Total harga saya: <b>${rp(L.reduce((a,i)=>a+(+i.price||0),0))}</b></span>`);
  t.innerHTML=L.length?`<table><tr><th>No.</th><th>Foto</th>${sp.h.map(x=>`<th>${x}</th>`).join('')}</tr>${L.map((i,n)=>`<tr class="c" onclick="openM(${i.id})"><td>${n+1}</td><td>${ph(i)}</td>${sp.r(i).map((c,k)=>k==si?`<td><span class="tag ${i.status}">${c}</span></td>`:`<td class="${/untung|Keuntungan/i.test(sp.h[k])?(prof(i)<0?'neg':'pos'):''}">${esc(k==sp.h.length-1?String(c).slice(0,30):c)}</td>`).join('')}</tr>`).join('')}</table>`:'<div class="empty">Tidak ada data.</div>';
}
function exp(kind){
  const L=getList(),sp=spec(),head=['No.',...sp.h],raw=kind=='xlsx',body=L.map((i,n)=>[n+1,...sp.r(i,raw)]),fn='Ternax_'+title().replace(/\s/g,'_')+'_'+new Date().toISOString().slice(0,10);
  if(!L.length){alert('Tidak ada data untuk diexport');return}
  try{
    if(kind=='pdf'){const d=new jspdf.jsPDF({orientation:'landscape'});d.setFontSize(14);d.text('Ternax by Nexora - '+title(),14,14);d.setFontSize(9);d.text('Dicetak: '+new Date().toLocaleString('id-ID'),14,20);d.autoTable({head:[head],body,startY:24,styles:{fontSize:8},headStyles:{fillColor:[46,158,79]}});d.save(fn+'.pdf')}
    else{const ws=XLSX.utils.aoa_to_sheet([head,...body]),wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,title().slice(0,30));XLSX.writeFile(wb,fn+'.xlsx')}
  }catch(e){alert('Export gagal. Pastikan internet aktif saat pertama kali membuka aplikasi.')}
}

/* ---------- POP UP DETAIL / EDIT ---------- */
function openM(id){
  const it=S.items.find(x=>x.id==id);if(!it)return;photoTmp='';
  $('#box').innerHTML=`<h2>Detail ${TY[it.type]} · ${esc(it.code)}</h2><p style="color:var(--mut)">Taksir harga pasar: <b>${rp(est(it))}</b> · Taksir untung: <b>${rp(prof(it))}</b></p>${form(it,false)}<div class="row"><button class="btn" id="us">Simpan perubahan</button><button class="btn red" id="ud">Hapus</button><button class="btn alt" onclick="closeM()">Tutup</button></div>`;
  $('#modal').classList.add('show');bindForm();
  $('#us').onclick=()=>{saveItem(Object.assign({},it,read(it)));closeM()};
  $('#ud').onclick=()=>{if(confirm('Hapus data ini?')){delItem(id);closeM()}};
}
function closeM(){$('#modal').classList.remove('show');photoTmp='';renderTable()}
$('#modal').onclick=e=>{if(e.target.id=='modal')closeM()};