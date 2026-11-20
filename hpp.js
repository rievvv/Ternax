/* Ternax - Hitung HPP (versi simple): modal per ekor/ayam -> saran harga jual -> cek harga yang Anda inginkan */
const q=v=>+v||0,fm=n=>(Math.round(n*100)/100).toLocaleString('id-ID'),clone=o=>JSON.parse(JSON.stringify(o));
const HD={
 kambing:{n:10,mort:3,w1:32,items:[{n:'Bibit / bakalan',c:1800000},{n:'Pakan selama pemeliharaan',c:450000},{n:'Obat, vaksin & vitamin',c:30000},{n:'Tenaga kerja',c:60000},{n:'Kandang, listrik & lain-lain',c:30000}]},
 sapi:{n:5,mort:2,w1:380,items:[{n:'Bibit / bakalan',c:12000000},{n:'Pakan selama pemeliharaan',c:3750000},{n:'Obat, vaksin & vitamin',c:150000},{n:'Tenaga kerja',c:300000},{n:'Kandang, listrik & lain-lain',c:150000}]},
 ayam:{n:500,mort:5,w1:1.9,items:[{n:'Bibit (DOC)',c:7000},{n:'Pakan selama pemeliharaan',c:31000},{n:'Obat, vaksin & vitamin',c:1500},{n:'Tenaga kerja',c:1500},{n:'Kandang, listrik & lain-lain',c:1500}]},
 telur:{n:500,eg:290,gram:62,brk:3,items:[{n:'Harga ayam (pullet)',c:75000},{n:'Pakan selama 1 periode',c:315000},{n:'Obat, vaksin & vitamin',c:5000},{n:'Tenaga kerja',c:15000},{n:'Kandang, listrik & lain-lain',c:10000}]}
};
Object.values(HD).forEach(d=>d.items.forEach((x,i)=>x.r=['m','b','b','x','x'][i]));   // peran biaya untuk bagi hasil: m=modal hewan, b=dibagi, x=tidak ikut
const HB={ikut:'',mg:20,want:'',wu:'u',name:'',bh:'n',sp:50,pay:'p'};
let H=null,HS=[],hid=null;
function hNew(t){H=clone(Object.assign({},HB,HD[t],{type:t}));hid=null}

/* ---------- perhitungan ---------- */
function calc(h){
  const L=h.type=='telur',n=q(h.n);
  const modal=h.items.reduce((a,x)=>a+q(x.c),0),M=Math.max(0,modal-q(h.ikut));   // modal per ekor/ayam awal
  const upa=L?q(h.eg)*(1-q(h.brk)/100):1-q(h.mort)/100;                           // jumlah yang bisa dijual per ekor/ayam awal
  const kgU=L?q(h.gram)/1000:q(h.w1);                                              // kg per ekor / per butir
  const hppU=upa>0?M/upa:0,hppK=kgU>0?hppU/kgU:0;
  return{modal,M,upa,kgU,hppU,hppK,units:n*upa,n};
}

/* ---------- tampilan input ---------- */
const hin=(k,l,u,ph)=>F(l+(u?` <small>(${u})</small>`:''),`<input type="number" step="any" inputmode="decimal" data-k="${k}" value="${H[k]??''}" ${ph?`placeholder="${ph}"`:''} oninput="hUp()">`);
function hRead(){const nm=$('#h_name');if(nm)H.name=nm.value;document.querySelectorAll('#main [data-k]').forEach(e=>{const k=e.dataset.k;e.dataset.l?H[e.dataset.l][+e.dataset.i][k]=e.value:H[k]=e.value})}
const hUp=()=>{hRead();hResult()};
const hAdd=()=>{hRead();H.items.push({n:'',c:'',r:'b'});renderHPP()};
const hDel=i=>{hRead();H.items.splice(i,1);if(!H.items.length)H.items.push({n:'',c:'',r:'b'});renderHPP()};

function renderHPP(){
  if(!H)hNew('kambing');
  const L=H.type=='telur',lt=L?'ayam':'ekor';
  const BH=H.bh=='y',ro=[['m','Modal hewan (diganti dulu)'],['b','Pakan/biaya dibagi'],['x','Tidak ikut dihitung']];
  const rows=H.items.map((x,i)=>`<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:end;margin-bottom:10px">
    <div style="flex:2 1 150px"><label>Nama biaya</label><input data-l="items" data-i="${i}" data-k="n" value="${esc(x.n)}" oninput="hUp()"></div>
    <div style="flex:1 1 110px"><label>Rp per ${lt}</label><input type="number" step="any" inputmode="decimal" data-l="items" data-i="${i}" data-k="c" value="${esc(x.c)}" oninput="hUp()"></div>
    ${BH?`<div style="flex:1.4 1 160px"><label>Perlakuan bagi hasil</label><select data-l="items" data-i="${i}" data-k="r" onchange="hUp()">${ro.map(o=>`<option value="${o[0]}" ${o[0]==(x.r||'b')?'selected':''}>${o[1]}</option>`).join('')}</select></div>`:''}
    <button class="btn red" onclick="hDel(${i})">✕</button></div>`).join('');
  const wopts=L?[['u','per butir'],['kg','per kg telur'],['tray','per tray (30 butir)']]:[['u','per ekor'],['kg','per kg bobot hidup']];
  $('#main').innerHTML=`<div class="card"><div class="hd"><h2>🧮 Hitung HPP & Harga Jual</h2><div class="ex"><button class="btn alt" onclick="hPdf()">📄 PDF</button></div></div>
  <p style="color:var(--mut);margin:0 0 12px">Isi modal per ${lt}, lalu Anda langsung mendapat saran harga jual terbaik. Angka awal hanya contoh, silakan ganti.</p>
  <div class="grid">${F('Komoditas',sel('h_type',[['kambing','🐐 Kambing (penggemukan)'],['sapi','🐄 Sapi (penggemukan)'],['ayam','🐔 Ayam pedaging'],['telur','🥚 Telur (ayam petelur)']],H.type))}
  ${hin('n','Jumlah '+lt+' dipelihara')}
  ${L?hin('eg','Rata-rata telur per ayam selama periode','butir')+hin('gram','Berat rata-rata 1 telur','gram')+hin('brk','Telur pecah / tidak terjual','%')
     :hin('mort','Perkiraan yang mati','%')+hin('w1','Bobot jual per ekor','kg')}</div></div>
  <div class="card"><h2>1. Modal per ${lt}</h2><p style="color:var(--mut);margin:0 0 10px">${L?'Total biaya untuk 1 ayam selama 1 periode produksi.':'Total biaya untuk 1 ekor sampai siap dijual.'} Tambah atau hapus baris sesuai kebutuhan.</p>${rows}
  <button class="btn alt" onclick="hAdd()">＋ Tambah biaya</button>
  <div class="grid" style="margin-top:12px">${hin('ikut','Pendapatan tambahan per '+lt+' (opsional)','Rp',L?'mis. ayam afkir, kotoran':'mis. kotoran/pupuk')}${hin('mg','Target untung saya','% dari harga jual')}</div></div>
  <div class="card"><h2>Bagi hasil (opsional)</h2>
  <div class="grid">${F('Ada bagi hasil?',`<select data-k="bh" onchange="hToggle()"><option value="n" ${BH?'':'selected'}>Tidak ada</option><option value="y" ${BH?'selected':''}>Ya, ada bagi hasil</option></select>`)}
  ${BH?hin('sp','Bagian pemilik modal','% dari laba (sisanya untuk peternak)')+F('Pakan & biaya dibagi dibayar di muka oleh',`<select data-k="pay" onchange="hUp()"><option value="p" ${H.pay=='p'?'selected':''}>Peternak</option><option value="o" ${H.pay=='o'?'selected':''}>Pemilik modal</option></select>`):''}</div>
  ${BH?`<p style="color:var(--mut);margin:10px 0 0;font-size:14px">Tentukan perlakuan tiap biaya di bagian Modal di atas. Cara hitung: hasil penjualan dikurangi modal hewan (dikembalikan dulu ke pemilik) dan pakan/biaya dibagi, sisanya baru dibagi sesuai persentase. Dengan begitu pakan otomatis ditanggung kedua pihak sesuai porsi bagi hasil.</p>`:''}</div>
  <div id="hr"></div>
  <div class="card"><h2>3. Harga jual yang saya inginkan</h2><p style="color:var(--mut);margin:0 0 10px">Ketik harga yang ingin Anda pasang, nanti saya beri saran.</p>
  <div class="grid">${hin('want','Harga yang saya inginkan','Rp','')}${F('Harga tersebut untuk',`<select data-k="wu" onchange="hUp()">${wopts.map(o=>`<option value="${o[0]}" ${o[0]==H.wu?'selected':''}>${o[1]}</option>`).join('')}</select>`)}</div>
  <div id="hw" style="margin-top:12px"></div></div>
  <div id="hb"></div>
  <div class="card"><h2>Simpan skenario</h2><div class="grid">${F('Nama skenario / batch',`<input id="h_name" placeholder="mis. Batch Desember" value="${esc(H.name||'')}">`)}
  ${F('Skenario tersimpan',`<select id="h_sel"><option value="">– pilih –</option>${HS.map(x=>`<option value="${x.id}" ${x.id==hid?'selected':''}>${esc(x.name)}</option>`).join('')}</select>`)}</div>
  <div class="row"><button class="btn" onclick="hSave()">💾 Simpan</button><button class="btn alt" onclick="hLoadSel()">Muat</button><button class="btn red" onclick="hDelSave()">Hapus</button></div></div>
  <details class="opt"><summary>Harga pasar acuan (dipakai dashboard & pembanding)</summary><div class="grid" style="margin-top:10px">${Object.keys(TY).map(k=>F(k=='telur'?'Telur (Rp per gram)':TY[k]+' (Rp per kg)',`<input type="number" id="r_${k}" value="${S.rates[k]}">`)).join('')}</div><div class="row"><button class="btn" id="sr">Simpan harga pasar</button></div></details>`;
  $('#h_type').onchange=e=>{hNew(e.target.value);renderHPP()};
  $('#sr').onclick=()=>{const r={};Object.keys(TY).forEach(k=>r[k]=+$('#r_'+k).value||0);base.collection('meta').doc('settings').set(r);alert('Tersimpan');hResult()};
  hResult();hLoad();
}

/* ---------- hasil & saran ---------- */
function hCtx(){
  const h=H,r=calc(h),L=h.type=='telur',u=L?'butir':'ekor',m=Math.min(q(h.mg),90)/100;
  const pas=(L?S.rates.telur*1000:S.rates[h.type])||0,pasU=pas*r.kgU;
  return{h,r,L,u,m,pas,pasU,pr:g=>r.hppU/(1-g)};
}
function hResult(){
  const{h,r,L,u,m,pas,pasU,pr}=hCtx();
  const two=pU=>`<div class="stat">${rp(pU)} <small style="font-size:13px;font-weight:600">/ ${u}</small></div><div style="color:var(--mut);font-size:13px;margin-top:2px">${r.kgU?rp(pU/r.kgU)+' / kg':''}${L?' · '+rp(pU*30)+' / tray 30 butir':''}</div>`;
  const kp=(l,pU,c)=>`<div class="card kpi ${c||''}"><label>${l}</label>${two(pU)}</div>`;
  const lt=L?'ayam':'ekor',tot=r.modal||0;
  const P=h.items.filter(x=>q(x.c)>0).map(x=>`<tr><td>${esc(x.n||'(tanpa nama)')}</td><td>${rp(q(x.c))}</td><td>${tot?fm(q(x.c)/tot*100):0}%</td></tr>`).join('');
  let ttl='';
  if(r.hppU<=0)ttl='<div class="tip w">Isi modal dan data produksi dulu supaya saran harga muncul.</div>';
  else{
    if(pasU>0){const mp=(pasU-r.hppU)/pasU*100;
      ttl+=pasU>=pr(m)?`<div class="tip">Harga pasar acuan ${rp(pas)}/kg sudah di atas harga disarankan. Jual di harga pasar memberi margin ${fm(mp)}%.</div>`
        :pasU>=r.hppU?`<div class="tip w">Harga pasar acuan ${rp(pas)}/kg di bawah harga disarankan. Jual di harga pasar hanya margin ${fm(mp)}%. Cari pembeli langsung atau tekan modal.</div>`
        :`<div class="tip b">Harga pasar acuan ${rp(pas)}/kg di bawah modal Anda. Jual di harga pasar akan rugi, perlu tekan modal atau cari pasar lain.</div>`}
    if(r.upa>0&&!L&&q(h.mort)>=1)ttl+=`<div class="tip">Karena ${fm(q(h.mort))}% diperkirakan mati, modal per ekor yang terjual naik dari ${rp(r.M)} menjadi ${rp(r.hppU)}.</div>`;
    if(r.modal&&h.items.find(x=>q(x.c)/r.modal>.7))ttl+=`<div class="tip w">Satu komponen biaya lebih dari 70% total modal. Cek apakah masih bisa ditekan.</div>`;
  }
  $('#hr').innerHTML=`<div class="card"><h2>2. Saran harga jual</h2>
  <div class="grid">${kp('Modal impas (HPP)',r.hppU,'')}${kp('Harga aman (untung tipis 10%)',pr(.1))}${kp('✅ Harga disarankan (untung '+fm(m*100)+'%)',pr(m),'g')}${kp('Harga untung besar ('+fm(m*100+10)+'%)',pr(Math.min(m+.1,.9)))}</div>
  <div style="margin-top:12px">${ttl}</div>
  <div class="tw" style="margin-top:8px"><table><tr><th>Rincian modal per ${lt}</th><th>Biaya</th><th>%</th></tr>${P}<tr><td><b>Total modal</b></td><td><b>${rp(r.modal)}</b></td><td></td></tr>${q(h.ikut)?`<tr><td>Pendapatan tambahan</td><td>− ${rp(q(h.ikut))}</td><td></td></tr>`:''}</table></div></div>`;
  hWant();hBagiRender();
}
function hWant(){
  const el=$('#hw');if(!el)return;
  const{h,r,L,u,m,pasU,pr}=hCtx(),p=q(h.want);
  const lbl={u:u,kg:'kg',tray:'tray (30 butir)'}[h.wu]||u;
  const toU=s=>h.wu=='kg'?s*r.kgU:h.wu=='tray'?s/30:s,toS=pU=>h.wu=='kg'?(r.kgU?pU/r.kgU:0):h.wu=='tray'?pU*30:pU;
  if(!p){el.innerHTML='<div class="empty">Isi harga di atas, saran akan muncul di sini.</div>';return}
  if(r.hppU<=0||(h.wu=='kg'&&!r.kgU)){el.innerHTML='<div class="tip w">Lengkapi modal dan bobot/produksi dulu.</div>';return}
  const pU=toU(p),laba=pU-r.hppU,mg=pU?laba/pU*100:0,tot=laba*r.units;
  const sg=`${rp(toS(pr(m)))} per ${lbl}`;
  let t=[];const T=(c,x)=>t.push(`<div class="tip ${c}">${x}</div>`);
  if(laba<0)T('b',`Harga ini rugi ${rp(-laba)} per ${u}. Harga minimal agar tidak rugi: ${rp(toS(r.hppU))} per ${lbl}. Saran saya: ${sg}.`);
  else if(mg<m*100)T('w',`Sudah untung, tapi margin ${fm(mg)}% di bawah target ${fm(m*100)}%. Naikkan harga ke ${sg} untuk mencapai target.`);
  else T('',`Bagus, margin ${fm(mg)}% sudah memenuhi target ${fm(m*100)}%.`);
  if(pasU>0){const d=(pU/pasU-1)*100;
    if(d>15)T('w',`Harga ini ${fm(d)}% di atas harga pasar acuan (${rp(toS(pasU))} per ${lbl}). Pembeli kemungkinan menawar atau sulit laku.`);
    else if(d<-10&&laba>=0)T('',`Harga ini ${fm(-d)}% di bawah harga pasar acuan. Masih ada ruang naik sampai sekitar ${rp(toS(pasU))} per ${lbl}.`);
    else T('',`Harga ini sejalan dengan harga pasar acuan (${rp(toS(pasU))} per ${lbl}).`)}
  el.innerHTML=`<div class="grid"><div class="card kpi ${laba<0?'':'g'}"><label>Laba per ${u}</label><div class="stat ${laba<0?'neg':''}">${rp(laba)}</div></div>
  <div class="card kpi"><label>Margin</label><div class="stat">${fm(mg)}%</div></div>
  ${r.kgU?`<div class="card kpi"><label>Laba per kg</label><div class="stat">${rp(laba/r.kgU)}</div></div>`:''}
  <div class="card kpi"><label>Total laba (${fm(r.n)} ${L?'ayam':'ekor'})</label><div class="stat ${tot<0?'neg':''}">${rp(tot)}</div></div></div>
  <div style="margin-top:10px">${t.join('')}</div>`;
}

/* ---------- bagi hasil ---------- */
const hToggle=()=>{hRead();renderHPP()};
function hToUnit(s){const r=calc(H);return H.wu=='kg'?s*r.kgU:H.wu=='tray'?s/30:s}
function hBagi(pU){
  const h=H,r=calc(h),n=r.n,sp=Math.min(Math.max(q(h.sp),0),100)/100;
  const sum=t=>h.items.filter(x=>(x.r||'b')==t).reduce((a,x)=>a+q(x.c),0)*n;
  const B=sum('m'),K=sum('b'),X=sum('x'),sale=pU*r.units,ik=q(h.ikut)*n,pool=sale+ik-B-K,o=pool*sp,p=pool*(1-sp),op=h.pay=='o';
  return{n,sp,B,K,X,sale,ik,pool,o,p,uo:B+(op?K:0)+o,up:(op?0:K)+p,be:r.units?(B+K-ik)/r.units:0};
}
function hBagiRender(){
  const el=$('#hb');if(!el)return;
  if(H.bh!='y'){el.innerHTML='';return}
  const{h,r,L,u,m,pr}=hCtx();
  if(r.hppU<=0){el.innerHTML='';return}
  const cols=[['Harga disarankan',pr(m)]];if(q(h.want))cols.push(['Harga keinginan Anda',hToUnit(q(h.want))]);
  const bs=cols.map(c=>hBagi(c[1])),b0=bs[0],spp=fm(b0.sp*100),ppp=fm((1-b0.sp)*100),lt=L?'ayam':'ekor';
  const R=(l,f,bold)=>`<tr><td>${bold?'<b>'+l+'</b>':l}</td>${bs.map((b,i)=>`<td>${bold?'<b>'+f(b,i)+'</b>':f(b,i)}</td>`).join('')}</tr>`;
  const neg=v=>`<span class="${v<0?'neg':'pos'}">${rp(v)}</span>`;
  let t='';
  if(bs.some(b=>b.pool<0))t+='<div class="tip b">Pada salah satu harga, hasil penjualan tidak menutup modal hewan dan pakan. Kerugian ikut dibagi sesuai porsi bagi hasil.</div>';
  t+=`<div class="tip">Harga jual impas bagi hasil (laba dibagi = 0): ${rp(b0.be)} per ${u}${r.kgU?' atau '+rp(b0.be/r.kgU)+' per kg':''}.</div>`;
  if(b0.X>0)t+='<div class="tip w">Biaya yang ditandai "Tidak ikut dihitung" (mis. tenaga kerja, kandang) tidak masuk perhitungan bagi hasil ini.</div>';
  el.innerHTML=`<div class="card"><h2>4. Hitung bagi hasil</h2><div class="tw"><table><tr><th></th>${cols.map(c=>`<th>${c[0]}</th>`).join('')}</tr>
  ${R('Harga jual per '+u,(b,i)=>rp(cols[i][1]))}
  ${R('Total penjualan',b=>rp(b.sale))}
  ${b0.ik?R('+ Pendapatan tambahan',b=>rp(b.ik)):''}
  ${R('− Modal hewan (dikembalikan dulu)',b=>rp(b.B))}
  ${R('− Pakan & biaya dibagi',b=>rp(b.K))}
  ${R('= Laba untuk dibagi',b=>neg(b.pool),1)}
  ${R('Bagian pemilik modal ('+spp+'%)',b=>neg(b.o))}
  ${R('Bagian peternak ('+ppp+'%)',b=>neg(b.p))}
  ${R('Laba pemilik per '+lt,b=>neg(b.n?b.o/b.n:0))}
  ${R('Laba peternak per '+lt,b=>neg(b.n?b.p/b.n:0))}
  ${R('Uang diterima pemilik',b=>rp(b.uo),1)}
  ${R('Uang diterima peternak',b=>rp(b.up),1)}</table></div>
  <p style="color:var(--mut);font-size:13px;margin:8px 0">Uang diterima = laba bagiannya, ditambah pengembalian modal yang ia keluarkan di muka (modal hewan untuk pemilik, pakan untuk pihak yang menalangi).</p>${t}</div>`;
}

/* ---------- simpan, muat, PDF ---------- */
function hFill(){const e=$('#h_sel');if(e)e.innerHTML='<option value="">– pilih –</option>'+HS.map(x=>`<option value="${x.id}" ${x.id==hid?'selected':''}>${esc(x.name)}</option>`).join('')}
function hLoad(){if(!base)return;base.collection('hpp').get().then(s=>{HS=s.docs.map(d=>d.data()).filter(x=>x.v==2).sort((a,b)=>b.at-a.at);hFill()}).catch(()=>{})}
function hSave(){hRead();const n=$('#h_name').value.trim();if(!n){alert('Isi nama skenario dulu');return}
  hid=hid||Date.now();H.name=n;base.collection('hpp').doc(String(hid)).set({id:hid,name:n,at:Date.now(),v:2,h:clone(H)}).then(()=>{alert('Skenario tersimpan');hLoad()}).catch(e=>alert('Gagal menyimpan: '+e.message+' (cek firestore.rules agar path hpp diizinkan)'))}
function hLoadSel(){const x=HS.find(s=>s.id==$('#h_sel').value);if(!x)return;H=clone(Object.assign({},HB,x.h));hid=x.id;renderHPP()}
function hDelSave(){const id=$('#h_sel').value;if(!id||!confirm('Hapus skenario ini?'))return;base.collection('hpp').doc(id).delete().then(()=>{if(id==hid)hid=null;hLoad()})}
function hPdf(){hRead();const{h,r,L,u,m,pr}=hCtx();
  try{const d=new jspdf.jsPDF();d.setFontSize(14);d.text('Ternax by Nexora - HPP & Harga Jual '+TY[h.type]+(h.name?' ('+h.name+')':''),14,14);d.setFontSize(9);d.text('Dicetak: '+new Date().toLocaleString('id-ID'),14,20);
    const body=h.items.filter(x=>q(x.c)>0).map(x=>[x.n||'-',rp(q(x.c))]);
    body.push(['Total modal per '+(L?'ayam':'ekor'),rp(r.modal)]);
    if(q(h.ikut))body.push(['Pendapatan tambahan',rp(-q(h.ikut))]);
    body.push(['HPP per '+u,rp(r.hppU)]);
    if(r.kgU)body.push(['HPP per kg',rp(r.hppK)]);
    body.push(['Harga aman (untung 10%) per '+u,rp(pr(.1))],['Harga disarankan (untung '+fm(m*100)+'%) per '+u,rp(pr(m))]);
    if(r.kgU)body.push(['Harga disarankan per kg',rp(pr(m)/r.kgU)]);
    if(q(h.want))body.push(['Harga keinginan Anda',rp(q(h.want))+' ('+({u:'per '+u,kg:'per kg',tray:'per tray'}[h.wu])+')']);
    if(h.bh=='y'){const b=hBagi(pr(m));body.push(['--- Bagi hasil (di harga disarankan) ---',''],['Total penjualan',rp(b.sale)],['Modal hewan dikembalikan',rp(-b.B)],['Pakan & biaya dibagi',rp(-b.K)],['Laba untuk dibagi',rp(b.pool)],['Pemilik modal ('+fm(b.sp*100)+'%)',rp(b.o)],['Peternak ('+fm((1-b.sp)*100)+'%)',rp(b.p)],['Uang diterima pemilik',rp(b.uo)],['Uang diterima peternak',rp(b.up)])}
    d.autoTable({startY:24,head:[['Komponen','Nilai']],styles:{fontSize:9},headStyles:{fillColor:[46,158,79]},body});
    d.save('Ternax_HPP_'+h.type+'_'+new Date().toISOString().slice(0,10)+'.pdf')}catch(e){alert('Export PDF gagal. Pastikan internet aktif.')}
}