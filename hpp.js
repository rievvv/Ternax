/* Ternax - Hitung HPP (kambing, sapi, ayam pedaging, telur) */
const q=v=>+v||0,fm=n=>(Math.round(n*100)/100).toLocaleString('id-ID'),clone=o=>JSON.parse(JSON.stringify(o));
const HD={
 kambing:{n:10,days:120,mort:3,buy:1800000,w0:18,w1:32,kar:45,pakan:[{n:'Hijauan',kg:3,p:500},{n:'Konsentrat',kg:.4,p:5500}]},
 sapi:{n:5,days:150,mort:2,buy:12000000,w0:300,w1:380,kar:52,pakan:[{n:'Hijauan',kg:25,p:400},{n:'Konsentrat',kg:3,p:5000}]},
 ayam:{n:500,days:35,mort:5,buy:7000,w0:.04,w1:1.9,kar:70,pakan:[{n:'Pakan broiler',kg:.105,p:8500}]},
 telur:{n:500,days:365,mort:8,buy:75000,hdp:80,eg:62,brk:3,pakan:[{n:'Pakan layer',kg:.115,p:7500}]}
};
const HB={obat:[{n:'Vaksin, vitamin & obat',c:''}],gaji:'',ops:'',inv:'',life:5,sisa:'',bunga:12,tb:'',tj:'',lain:'',ikut:'',mg:20};
let H=null,HS=[],hid=null;
function hNew(t){H=clone(Object.assign({},HB,HD[t],{type:t}));H.hj=t=='telur'?S.rates.telur*1000:S.rates[t];hid=null}

function calc(h){
  const N=q(h.n),D=q(h.days),mo=q(h.mort)/100,L=h.type=='telur',al=N*(1-mo),avg=N*(1-mo/2);
  const kgF=h.pakan.reduce((a,x)=>a+avg*D*q(x.kg),0),pakan=h.pakan.reduce((a,x)=>a+avg*D*q(x.kg)*q(x.p),0);
  const bibit=N*q(h.buy),obat=h.obat.reduce((a,x)=>a+q(x.c),0),naker=q(h.gaji)*D/30,ops=q(h.ops)*D/30;
  const susut=Math.max(0,q(h.inv)-q(h.sisa))/(Math.max(.1,q(h.life))*365)*D,trans=q(h.tb)+q(h.tj),lain=q(h.lain);
  const bunga=(bibit+(pakan+obat)/2)*q(h.bunga)/100*D/365;           // pakan & obat dibelanjakan bertahap → rata-rata setengah periode
  const C=bibit+pakan+obat+naker+ops+susut+bunga+trans+lain,ik=q(h.ikut),net=C-ik;
  const eggs=L?avg*D*q(h.hdp)/100*(1-q(h.brk)/100):0,unit=L?eggs:al;
  const kg=L?eggs*q(h.eg)/1000:al*q(h.w1),kar=L?0:kg*q(h.kar)/100;
  const vc=bibit+pakan+obat+trans,fc=C-vc,hj=q(h.hj),rev=kg*hj,laba=rev+ik-C,cm=hj-(kg?vc/kg:0);
  const gain=L?kg:al*q(h.w1)-N*q(h.w0);
  return{C,net,ik,al,avg,kg,kar,eggs,unit,pakan,bibit,obat,naker,ops,susut,bunga,trans,lain,vc,fc,rev,laba,
    hpp:kg?net/kg:0,hppU:unit?net/unit:0,hppK:kar?net/kar:0,hppD:D?net/D:0,
    mg:rev?laba/rev*100:0,roi:C?laba/C*100:0,rc:C?(rev+ik)/C:0,fcr:gain>0?kgF/gain:0,adg:D&&!L?(q(h.w1)-q(h.w0))*1000/D:0,
    bepKg:cm>0?fc/cm:Infinity,cm,D};
}

/* ---------- tampilan input ---------- */
const hin=(k,l,u)=>F(l+(u?` <small>(${u})</small>`:''),`<input type="number" step="any" inputmode="decimal" data-k="${k}" value="${H[k]??''}" oninput="hUp()">`);
function hlines(l,cols,add){
  return H[l].map((x,i)=>`<div class="hl">${cols.map(c=>F(c[1],`<input ${c[2]?'type="number" step="any" inputmode="decimal"':''} data-l="${l}" data-i="${i}" data-k="${c[0]}" value="${esc(x[c[0]])}" oninput="hUp()">`)).join('')}<button class="btn red" onclick="hDel('${l}',${i})">✕</button></div>`).join('')+`<button class="btn alt" onclick="hAdd('${l}')">＋ ${add}</button>`;
}
function hRead(){const nm=$('#h_name');if(nm)H.name=nm.value;document.querySelectorAll('#main [data-k]').forEach(e=>{const k=e.dataset.k;e.dataset.l?H[e.dataset.l][+e.dataset.i][k]=e.value:H[k]=e.value})}
const hUp=()=>{hRead();hResult()};
const hAdd=l=>{hRead();H[l].push(l=='pakan'?{n:'',kg:'',p:''}:{n:'',c:''});renderHPP()};
const hDel=(l,i)=>{hRead();H[l].splice(i,1);if(!H[l].length)H[l].push(l=='pakan'?{n:'',kg:'',p:''}:{n:'',c:''});renderHPP()};

function renderHPP(){
  if(!H)hNew('kambing');
  const L=H.type=='telur',lt=L?'ayam':'ekor';
  $('#main').innerHTML=`<div class="card"><div class="hd"><h2>🧮 Hitung HPP</h2><div class="ex"><button class="btn alt" onclick="hPdf()">📄 PDF</button></div></div>
  <p style="color:var(--mut);margin:0 0 12px">Isi semua komponen biaya, hasil dihitung otomatis. Angka awal hanya contoh, ganti dengan data peternakan Anda.</p>
  <div class="grid">${F('Komoditas',sel('h_type',[['kambing','🐐 Kambing (penggemukan)'],['sapi','🐄 Sapi (penggemukan)'],['ayam','🐔 Ayam pedaging'],['telur','🥚 Telur (ayam petelur)']],H.type))}
  ${F('Nama skenario / batch',`<input id="h_name" placeholder="mis. Batch Desember" value="${esc(H.name||'')}">`)}
  ${F('Skenario tersimpan',`<select id="h_sel"><option value="">– pilih –</option>${HS.map(x=>`<option value="${x.id}" ${x.id==hid?'selected':''}>${esc(x.name)}</option>`).join('')}</select>`)}</div>
  <div class="row"><button class="btn" onclick="hSave()">💾 Simpan skenario</button><button class="btn alt" onclick="hLoadSel()">Muat</button><button class="btn red" onclick="hDelSave()">Hapus</button></div></div>
  <div id="hr"></div>
  <div class="card"><h2>1. Populasi & produksi</h2><div class="grid">${hin('n','Jumlah '+lt+' awal')}${hin('days','Lama pemeliharaan / periode','hari')}${hin('mort','Mortalitas / kematian','%')}${hin('buy',L?'Harga pullet / ayam per ekor':'Harga bibit / bakalan per ekor','Rp')}
  ${L?hin('hdp','Produksi harian (hen-day)','%')+hin('eg','Berat rata-rata telur','gram')+hin('brk','Telur pecah / afkir','%'):hin('w0','Bobot awal per ekor','kg')+hin('w1','Bobot jual per ekor','kg')+hin('kar','Persentase karkas','%')}</div></div>
  <div class="card"><h2>2. Pakan</h2><p style="color:var(--mut);margin:0 0 10px">Konsumsi per ekor per hari × harga per kg.</p>${hlines('pakan',[['n','Jenis pakan'],['kg','kg/ekor/hari',1],['p','Rp per kg',1]],'Tambah pakan')}</div>
  <div class="card"><h2>3. Obat, vaksin & vitamin (total periode)</h2>${hlines('obat',[['n','Nama'],['c','Biaya (Rp)',1]],'Tambah obat')}</div>
  <div class="card"><h2>4. Biaya tetap & lain-lain</h2><div class="grid">${hin('gaji','Tenaga kerja total / bulan','Rp')}${hin('ops','Listrik, air, sewa lahan / bulan','Rp')}${hin('inv','Investasi kandang & alat','Rp')}${hin('life','Umur ekonomis kandang','tahun')}${hin('sisa','Nilai sisa kandang','Rp')}${hin('bunga','Bunga / biaya modal','% per tahun')}${hin('tb','Ongkos angkut beli (total)','Rp')}${hin('tj','Ongkos angkut / pemasaran jual (total)','Rp')}${hin('lain','Biaya lain-lain (total)','Rp')}${hin('ikut','Pendapatan ikutan: pupuk, karung, ayam afkir (total)','Rp')}</div></div>
  <div class="card"><h2>5. Target jual</h2><div class="grid">${hin('hj','Rencana harga jual',L?'Rp per kg telur':'Rp per kg bobot hidup')}${hin('mg','Target margin laba','% dari harga jual')}</div></div>
  <div class="card"><h2>Harga pasar acuan</h2><p style="color:var(--mut)">Dipakai untuk kolom Taksir pasar di tabel & dashboard, dan sebagai pembanding HPP.</p><div class="grid">${Object.keys(TY).map(k=>F(k=='telur'?'Telur (Rp per gram)':TY[k]+' (Rp per kg)',`<input type="number" id="r_${k}" value="${S.rates[k]}">`)).join('')}</div><div class="row"><button class="btn" id="sr">Simpan harga pasar</button></div></div>`;
  $('#h_type').onchange=e=>{hNew(e.target.value);renderHPP()};
  $('#sr').onclick=()=>{const r={};Object.keys(TY).forEach(k=>r[k]=+$('#r_'+k).value||0);base.collection('meta').doc('settings').set(r);alert('Tersimpan')};
  hResult();hLoad();
}

/* ---------- hasil ---------- */
function hResult(){
  const h=H,r=calc(h),L=h.type=='telur',u=L?'butir':'ekor',kl=L?'kg telur':'kg hidup';
  const tp=r.hpp/(1-Math.min(q(h.mg),95)/100),pas=L?S.rates.telur*1000:S.rates[h.type];
  const P=[['Bibit / pullet',r.bibit,'#2e9e4f'],['Pakan',r.pakan,'#f59e0b'],['Obat & vaksin',r.obat,'#e11d48'],['Tenaga kerja',r.naker,'#3b82f6'],['Operasional',r.ops,'#8b5cf6'],['Penyusutan kandang',r.susut,'#14b8a6'],['Bunga modal',r.bunga,'#a16207'],['Transport',r.trans,'#64748b'],['Lain-lain',r.lain,'#ec4899']];
  const kp=(l,v,c)=>`<div class="card kpi ${c||''}"><label>${l}</label><div class="stat">${v}</div></div>`;
  const mod=f=>{const x=clone(h);f(x);return calc(x)};
  const SC=[['Kondisi saat ini',x=>x],['Harga pakan +10%',x=>x.pakan.forEach(p=>p.p=q(p.p)*1.1)],['Harga pakan +20%',x=>x.pakan.forEach(p=>p.p=q(p.p)*1.2)],['Mortalitas +5 poin',x=>x.mort=q(x.mort)+5],['Harga jual −10%',x=>x.hj=q(x.hj)*.9],['Pakan +20% & harga jual −10%',x=>{x.pakan.forEach(p=>p.p=q(p.p)*1.2);x.hj=q(x.hj)*.9}]];
  const tips=[],T=(c,t)=>tips.push(`<div class="tip ${c}">${t}</div>`);
  if(!q(h.gaji))T('w','Biaya tenaga kerja masih 0. Walau dikerjakan sendiri, hitung upah Anda agar HPP tidak terlalu rendah.');
  if(!q(h.inv))T('w','Investasi kandang masih 0, penyusutan belum ikut dihitung.');
  if(!r.obat)T('w','Biaya obat/vaksin masih 0.');
  if(r.C&&r.pakan/r.C>.7)T('w',`Pakan menyumbang ${Math.round(r.pakan/r.C*100)}% biaya. Tekan lewat bahan pakan lokal, beli grosir, dan perbaikan FCR.`);
  if(r.kg&&r.laba<0)T('b',`Rugi ${rp(-r.laba)}. Harga jual minimal agar impas ${rp(r.hpp)} per ${kl}.`);
  else if(r.kg&&r.mg<q(h.mg))T('w',`Margin ${fm(r.mg)}% di bawah target ${fm(q(h.mg))}%. Harga jual untuk mencapai target: ${rp(tp)} per ${kl}.`);
  else if(r.kg)T('',`Margin ${fm(r.mg)}% sudah memenuhi target. Laba ${rp(r.laba)}.`);
  if(r.kg){const a=mod(x=>x.mort=Math.max(0,q(x.mort)-1)).laba-r.laba,b=mod(x=>x.pakan.forEach(p=>p.p=q(p.p)*.95)).laba-r.laba;
    if(q(h.mort)>=1)T('',`Setiap penurunan mortalitas 1 poin menambah laba sekitar ${rp(a)}.`);T('',`Harga pakan turun 5% menambah laba sekitar ${rp(b)}.`)}
  if(q(h.mort)>5)T('w','Mortalitas di atas 5%, periksa kesehatan, kepadatan kandang, dan program vaksin.');
  $('#hr').innerHTML=`<div class="sec">Hasil perhitungan</div>
  <div class="grid">${kp('HPP per '+kl,rp(r.hpp),'g')}${kp('HPP per '+u,rp(r.hppU))}${L?'':kp('HPP per kg karkas',rp(r.hppK))}${kp('Harga jual target ('+fm(q(h.mg))+'% margin)',rp(tp),'g')}${kp('Total laba periode',rp(r.laba))}${kp('Total biaya (HPP total)',rp(r.net))}</div>
  <div class="card" style="margin-top:12px"><h2>Struktur biaya</h2><div class="sb">${P.map(x=>`<i style="width:${r.C?x[1]/r.C*100:0}%;background:${x[2]}"></i>`).join('')}</div>
  <div class="tw"><table><tr><th>Komponen</th><th>Biaya</th><th>%</th></tr>${P.map(x=>`<tr><td><span class="dot" style="background:${x[2]}"></span>${x[0]}</td><td>${rp(x[1])}</td><td>${r.C?fm(x[1]/r.C*100):0}%</td></tr>`).join('')}<tr><td><b>Total biaya</b></td><td><b>${rp(r.C)}</b></td><td></td></tr><tr><td>Pendapatan ikutan</td><td>− ${rp(r.ik)}</td><td></td></tr></table></div></div>
  <div class="card"><h2>Indikator</h2><div class="grid">
  ${[[L?'Ayam rata-rata hidup':'Ekor hidup saat jual',fm(L?r.avg:r.al)],[L?'Produksi telur':'Total bobot jual',L?fm(r.eggs)+' butir ('+fm(r.kg)+' kg)':fm(r.kg)+' kg'],['FCR (kg pakan per kg '+(L?'telur':'tambah bobot')+')',r.fcr?fm(r.fcr):'-'],...(L?[]:[['Pertambahan bobot harian (ADG)',fm(r.adg)+' g/hari']]),['Biaya per hari',rp(r.hppD)],['Margin laba',fm(r.mg)+'%'],['ROI',fm(r.roi)+'%'],['R/C ratio',fm(r.rc)+(r.rc>1?' (layak)':' (belum layak)')],['Laba per '+u,rp(r.unit?r.laba/r.unit:0)],['Laba per bulan',rp(r.D?r.laba/r.D*30:0)],['Titik impas (BEP)',isFinite(r.bepKg)?fm(r.bepKg)+' '+kl+' ('+fm(r.kg?r.bepKg/r.kg*100:0)+'% dari produksi)':'Harga jual di bawah biaya variabel'],['Harga pasar acuan',rp(pas)+' per kg'],['Selisih HPP vs pasar',rp(pas-r.hpp)+' per kg '+(pas>=r.hpp?'(untung)':'(rugi)')]].map(x=>F(x[0],`<div class="stat" style="font-size:17px">${x[1]}</div>`)).join('')}</div></div>
  <div class="card"><h2>Analisis sensitivitas</h2><div class="tw"><table><tr><th>Skenario</th><th>HPP per ${kl}</th><th>Laba</th><th>Margin</th></tr>${SC.map(s=>{const z=mod(s[1]);return `<tr><td>${s[0]}</td><td>${rp(z.hpp)}</td><td class="${z.laba<0?'neg':'pos'}">${rp(z.laba)}</td><td>${fm(z.mg)}%</td></tr>`}).join('')}</table></div></div>
  <div class="card"><h2>Saran</h2>${tips.join('')}</div>`;
}

/* ---------- simpan, muat, PDF ---------- */
function hLoad(){if(!base)return;base.collection('hpp').get().then(s=>{HS=s.docs.map(d=>d.data()).sort((a,b)=>b.at-a.at);const e=$('#h_sel');if(e)e.innerHTML='<option value="">– pilih –</option>'+HS.map(x=>`<option value="${x.id}" ${x.id==hid?'selected':''}>${esc(x.name)}</option>`).join('')}).catch(()=>{})}
function hSave(){hRead();const n=$('#h_name').value.trim();if(!n){alert('Isi nama skenario dulu');return}
  hid=hid||Date.now();H.name=n;base.collection('hpp').doc(String(hid)).set({id:hid,name:n,at:Date.now(),h:clone(H)}).then(()=>{alert('Skenario tersimpan');hLoad()}).catch(e=>alert('Gagal menyimpan: '+e.message+' (cek firestore.rules agar path hpp diizinkan)'))}
function hLoadSel(){const x=HS.find(s=>s.id==$('#h_sel').value);if(!x)return;H=clone(x.h);hid=x.id;renderHPP()}
function hDelSave(){const id=$('#h_sel').value;if(!id||!confirm('Hapus skenario ini?'))return;base.collection('hpp').doc(id).delete().then(()=>{if(id==hid)hid=null;hLoad()})}
function hPdf(){hRead();const r=calc(H),L=H.type=='telur',kl=L?'kg telur':'kg hidup';
  try{const d=new jspdf.jsPDF();d.setFontSize(14);d.text('Ternax by Nexora - Perhitungan HPP '+TY[H.type]+(H.name?' ('+H.name+')':''),14,14);d.setFontSize(9);d.text('Dicetak: '+new Date().toLocaleString('id-ID'),14,20);
    d.autoTable({startY:24,head:[['Komponen','Nilai']],styles:{fontSize:9},headStyles:{fillColor:[46,158,79]},body:[['Bibit',rp(r.bibit)],['Pakan',rp(r.pakan)],['Obat & vaksin',rp(r.obat)],['Tenaga kerja',rp(r.naker)],['Operasional',rp(r.ops)],['Penyusutan kandang',rp(r.susut)],['Bunga modal',rp(r.bunga)],['Transport',rp(r.trans)],['Lain-lain',rp(r.lain)],['Pendapatan ikutan',rp(-r.ik)],['TOTAL (HPP total)',rp(r.net)],['HPP per '+kl,rp(r.hpp)],['HPP per '+(L?'butir':'ekor'),rp(r.hppU)],['Rencana harga jual',rp(q(H.hj))],['Laba periode',rp(r.laba)],['Margin / ROI',fm(r.mg)+'% / '+fm(r.roi)+'%']]});
    d.save('Ternax_HPP_'+H.type+'_'+new Date().toISOString().slice(0,10)+'.pdf')}catch(e){alert('Export PDF gagal. Pastikan internet aktif.')}
}
