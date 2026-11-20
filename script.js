/* Ternax by Nexora - script.js (v2: login + realtime Firebase + filter + export) */
const TY={kambing:'Kambing',ayam:'Ayam',sapi:'Sapi',telur:'Telur'};
const ST={ready:'Ready',order:'By Order',sold:'Sold'};
const PAGES=[['input','➕','Input Data','Input'],['kambing','🐐','Data Kambing','Kambing'],['ayam','🐔','Data Ayam','Ayam'],['sapi','🐄','Data Sapi','Sapi'],['telur','🥚','Data Telur','Telur'],['jual','💰','Penjualan','Jual'],['set','⚙️','Harga Pasar','Harga']];
let S={items:[],rates:{kambing:90000,ayam:45000,sapi:60000,telur:45}};
let page='input',draftType='kambing',photoTmp='',base=null,auth=null,unsubs=[],FL={};
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
$('#out').onclick=()=>{if(confirm('Keluar dari akun?'))auth.signOut()};
function showLogin(){$('#login').classList.remove('hidden');$('#app').classList.add('hidden')}
function onAuth(u){
  unsubs.forEach(f=>f());unsubs=[];
  if(!u){S.items=[];showLogin();return}
  $('#login').classList.add('hidden');$('#app').classList.remove('hidden');$('#who').textContent=u.email;setSync();
  base=firebase.firestore().collection('users').doc(u.uid);
  unsubs.push(base.collection('items').onSnapshot(s=>{S.items=s.docs.map(d=>d.data());onData()},e=>alert('Gagal sinkron: '+e.message)));
  unsubs.push(base.collection('meta').doc('settings').onSnapshot(d=>{if(d.exists)Object.assign(S.rates,d.data());onData()}));
  nav();render();
}
function onData(){ if(page!='input'&&page!='set')renderTable() }   // update realtime tanpa mengganggu form
const saveItem=o=>base.collection('items').doc(String(o.id)).set(o).catch(e=>alert('Gagal menyimpan: '+e.message));
const delItem=id=>base.collection('items').doc(String(id)).delete().catch(e=>alert(e.message));
if(okCfg){
  firebase.initializeApp(cfg);auth=firebase.auth();
  try{firebase.firestore().enablePersistence({synchronizeTabs:true}).catch(()=>{})}catch(e){}
  auth.onAuthStateChanged(onAuth);
}else{showLogin();$('#lerr').textContent=!window.firebase?'Library Firebase gagal dimuat. Periksa koneksi internet, matikan adblock/VPN, lalu refresh.':!cfg?'File firebase-config.js tidak terbaca atau isinya salah (harus diawali window.FIREBASE_CONFIG = ).':'apiKey di firebase-config.js belum diisi dengan benar.'}

/* ---------- FORM ---------- */
function form(it,isNew){
  const t=it.type,v=k=>esc(it[k]);let h='<div class="grid">';
  if(isNew)h+=F('Jenis',sel('f_type',Object.entries(TY),t));
  h+=F('Kode',`<input id="f_code" value="${v('code')}">`);
  if(t=='telur')h+=F('Tanggal bertelur',`<input type="date" id="f_laydate" value="${v('laydate')}">`)+F('Kode ayam petelur',`<input id="f_hen" value="${v('hen')}">`)+F('Berat telur (gram)',`<input type="number" step="any" id="f_weight" value="${v('weight')}">`);
  else h+=F('Jenis kelamin',sel('f_sex',[['Jantan','Jantan'],['Betina','Betina']],it.sex))+F('Usia (bulan)',`<input type="number" id="f_age" value="${v('age')}">`)+F('Berat (kg)',`<input type="number" step="any" id="f_weight" value="${v('weight')}">`);
  h+=F('Modal / biaya (Rp)',`<input type="number" id="f_cost" value="${v('cost')}">`)+F('Harga dari saya (Rp)',`<input type="number" id="f_price" value="${v('price')}">`)+F('Status',sel('f_status',[['ready','Ready'],['order','By Order'],['sold','Sold']],it.status||'ready'))+F('Foto',`<input type="file" accept="image/*" id="f_photo">`)+'</div>';
  h+=`<div style="margin-top:12px">${F('Keterangan',`<textarea id="f_note" rows="3">${v('note')}</textarea>`)}</div><div id="pv">${it.photo?`<img src="${it.photo}" style="max-width:160px;border-radius:10px;margin-top:10px">`:''}</div>`;
  return h;
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
function nav(){$('#nav').innerHTML=PAGES.map(p=>`<button class="${page==p[0]?'on':''}" onclick="go('${p[0]}')"><span class="ic">${p[1]}</span><span class="lb-l">${p[2]}</span><span class="lb-s">${p[3]}</span></button>`).join('')}
function go(p){page=p;photoTmp='';nav();render();scrollTo(0,0)}

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
  if(page=='input'){
    $('#main').innerHTML=`<div class="card"><h2>Input Data Ternak</h2>${form({type:draftType},true)}<div class="row"><button class="btn" id="sv">Simpan</button></div></div>`;
    bindForm();$('#f_type').onchange=e=>{draftType=e.target.value;photoTmp='';render()};
    $('#sv').onclick=()=>{const o=read({type:draftType,id:Date.now()});if(!o.code){alert('Kode wajib diisi');return}saveItem(o);photoTmp='';alert('Data tersimpan!');go(o.status=='sold'?'jual':o.type)};
  }else if(page=='set'){
    $('#main').innerHTML=`<div class="card"><h2>Harga Pasar (taksiran otomatis)</h2><p style="color:var(--mut)">Taksiran = berat × harga ini. Berlaku di semua perangkat.</p><div class="grid">${Object.keys(TY).map(k=>F(k=='telur'?'Telur (Rp per gram)':TY[k]+' (Rp per kg)',`<input type="number" id="r_${k}" value="${S.rates[k]}">`)).join('')}</div><div class="row"><button class="btn" id="sr">Simpan</button></div></div>`;
    $('#sr').onclick=()=>{const r={};Object.keys(TY).forEach(k=>r[k]=+$('#r_'+k).value||0);base.collection('meta').doc('settings').set(r);alert('Tersimpan')};
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