/* Ternax by Nexora - script.js */
const TY = {kambing:'Kambing', ayam:'Ayam', sapi:'Sapi', telur:'Telur'};
const PAGES = [
  ['input','➕','Input Data','Input'],
  ['kambing','🐐','Data Kambing','Kambing'],
  ['ayam','🐔','Data Ayam','Ayam'],
  ['sapi','🐄','Data Sapi','Sapi'],
  ['telur','🥚','Data Telur','Telur'],
  ['jual','💰','Penjualan','Jual'],
  ['set','⚙️','Harga Pasar','Harga']
];
let S = {items:[], rates:{kambing:90000, ayam:45000, sapi:60000, telur:45}};
let page = 'input', draftType = 'kambing', photoTmp = '';

try{ const d = localStorage.getItem('ternax'); if(d) S = Object.assign(S, JSON.parse(d)); }catch(e){}
const save = () => { try{ localStorage.setItem('ternax', JSON.stringify(S)); }catch(e){ alert('Penyimpanan penuh, hapus beberapa foto.'); } };

const $ = s => document.querySelector(s);
const rp = n => 'Rp ' + Math.round(n||0).toLocaleString('id-ID');
const est = i => Math.round((+i.weight||0) * S.rates[i.type]);   // taksir harga pasar otomatis
const prof = i => (+i.price||0) - (+i.cost||0);                  // taksir keuntungan
const sel = (id,opts,v) => `<select id="${id}">${opts.map(o=>`<option value="${o[0]}" ${o[0]==v?'selected':''}>${o[1]}</option>`).join('')}</select>`;
const F = (l,h) => `<div><label>${l}</label>${h}</div>`;
const ph = i => i.photo ? `<img class="th" src="${i.photo}">` : '<div class="th" style="background:var(--bd);display:flex;align-items:center;justify-content:center">📷</div>';

/* ---------- SPLASH (smartphone saja) ---------- */
(function(){
  const sp = $('#splash');
  if(window.matchMedia('(max-width:760px)').matches){
    setTimeout(()=>{ sp.classList.add('hide'); setTimeout(()=>sp.remove(),600); }, 2600);
  }else sp.remove();
})();

/* ---------- FORM ---------- */
function form(it, isNew){
  const t = it.type, v = k => it[k] ?? '';
  let h = '<div class="grid">';
  if(isNew) h += F('Jenis', sel('f_type', Object.entries(TY), t));
  if(t == 'telur'){
    h += F('Kode', `<input id="f_code" value="${v('code')}">`)
      +  F('Tanggal bertelur', `<input type="date" id="f_laydate" value="${v('laydate')}">`)
      +  F('Kode ayam petelur', `<input id="f_hen" value="${v('hen')}">`)
      +  F('Berat telur (gram)', `<input type="number" step="any" id="f_weight" value="${v('weight')}">`);
  }else{
    h += F('Kode', `<input id="f_code" value="${v('code')}">`)
      +  F('Jenis kelamin', sel('f_sex', [['Jantan','Jantan'],['Betina','Betina']], v('sex')))
      +  F('Usia (bulan)', `<input type="number" id="f_age" value="${v('age')}">`)
      +  F('Berat (kg)', `<input type="number" step="any" id="f_weight" value="${v('weight')}">`);
  }
  h += F('Modal / biaya (Rp)', `<input type="number" id="f_cost" value="${v('cost')}">`)
    +  F('Harga dari saya (Rp)', `<input type="number" id="f_price" value="${v('price')}">`)
    +  F('Status', sel('f_status', [['ready','Ready'],['order','By Order'],['sold','Sold']], v('status')||'ready'))
    +  F('Foto', `<input type="file" accept="image/*" id="f_photo">`) + '</div>';
  h += `<div style="margin-top:12px">${F('Keterangan', `<textarea id="f_note" rows="3">${v('note')}</textarea>`)}</div>`;
  h += `<div id="pv">${it.photo ? `<img src="${it.photo}" style="max-width:160px;border-radius:10px;margin-top:10px">` : ''}</div>`;
  return h;
}

function bindForm(){
  const p = $('#f_photo'); if(!p) return;
  p.onchange = e => {
    const f = e.target.files[0]; if(!f) return;
    const r = new FileReader();
    r.onload = () => {
      const im = new Image();
      im.onload = () => {
        const c = document.createElement('canvas'), s = Math.min(1, 480/Math.max(im.width, im.height));
        c.width = im.width*s; c.height = im.height*s;
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        photoTmp = c.toDataURL('image/jpeg', .6);
        $('#pv').innerHTML = `<img src="${photoTmp}" style="max-width:160px;border-radius:10px;margin-top:10px">`;
      };
      im.src = r.result;
    };
    r.readAsDataURL(f);
  };
}

function read(base){
  const g = k => { const e = $('#f_'+k); return e ? e.value : undefined; }, o = Object.assign({}, base);
  ['code','sex','age','weight','cost','price','status','note','laydate','hen'].forEach(k => { const x = g(k); if(x !== undefined) o[k] = x; });
  if(g('type')) o.type = g('type');
  if(photoTmp) o.photo = photoTmp;
  return o;
}

/* ---------- NAVIGASI ---------- */
function nav(){
  $('#nav').innerHTML = PAGES.map(p =>
    `<button class="${page==p[0]?'on':''}" onclick="go('${p[0]}')"><span class="ic">${p[1]}</span><span class="lb-l">${p[2]}</span><span class="lb-s">${p[3]}</span></button>`).join('');
}
function go(p){ page = p; photoTmp = ''; nav(); render(); window.scrollTo(0,0); }

/* ---------- HALAMAN ---------- */
function render(){
  const m = $('#main');

  if(page == 'input'){
    m.innerHTML = `<div class="card"><h2>Input Data Ternak</h2>${form({type:draftType}, true)}<div class="row"><button class="btn" id="sv">Simpan</button></div></div>`;
    bindForm();
    $('#f_type').onchange = e => { draftType = e.target.value; photoTmp = ''; render(); };
    $('#sv').onclick = () => {
      const o = read({type:draftType, id:Date.now()});
      if(!o.code){ alert('Kode wajib diisi'); return; }
      S.items.push(o); save(); photoTmp = '';
      alert('Data tersimpan!');
      go(o.status == 'sold' ? 'jual' : o.type);
    };

  }else if(page == 'set'){
    m.innerHTML = `<div class="card"><h2>Harga Pasar (untuk taksiran otomatis)</h2>
      <p style="color:var(--mut)">Sesuaikan dengan harga di daerah Anda. Taksiran = berat × harga ini.</p>
      <div class="grid">${Object.keys(TY).map(k => F(k=='telur' ? 'Telur (Rp per gram)' : TY[k]+' (Rp per kg)', `<input type="number" id="r_${k}" value="${S.rates[k]}">`)).join('')}</div>
      <div class="row"><button class="btn" id="sr">Simpan</button></div></div>`;
    $('#sr').onclick = () => { Object.keys(TY).forEach(k => S.rates[k] = +$('#r_'+k).value || 0); save(); alert('Tersimpan'); };

  }else if(page == 'jual'){
    const L = S.items.filter(i => i.status == 'sold');
    const tot = L.reduce((a,i) => a + (+i.price||0), 0), pf = L.reduce((a,i) => a + prof(i), 0);
    m.innerHTML = `<div class="grid">
      <div class="card"><label>Total terjual</label><div class="stat">${L.length}</div></div>
      <div class="card"><label>Total pendapatan</label><div class="stat">${rp(tot)}</div></div>
      <div class="card"><label>Total keuntungan</label><div class="stat pos">${rp(pf)}</div></div></div>
      <div class="card"><h2>Penjualan</h2><div class="tw">${L.length ? `<table><tr><th>No.</th><th>Foto</th><th>Jenis</th><th>Kode</th><th>Harga jual</th><th>Keuntungan</th><th>Ket.</th></tr>${
        L.map((i,n) => `<tr class="c" onclick="openM(${i.id})"><td>${n+1}</td><td>${ph(i)}</td><td>${TY[i.type]}</td><td>${i.code}</td><td>${rp(i.price)}</td><td class="${prof(i)<0?'neg':'pos'}">${rp(prof(i))}</td><td>${(i.note||'').slice(0,30)}</td></tr>`).join('')}</table>`
        : '<div class="empty">Belum ada penjualan. Ubah status menjadi Sold untuk memindahkan data ke sini.</div>'}</div></div>`;

  }else{
    const L = S.items.filter(i => i.type == page && i.status != 'sold'), e = page == 'telur';
    m.innerHTML = `<div class="card"><h2>Data ${TY[page]} <span style="font-weight:400;color:var(--mut);font-size:14px">(${L.length})</span></h2><div class="tw">${L.length ?
      `<table><tr><th>No.</th><th>Foto</th><th>Kode</th>${e ? '<th>Tgl bertelur</th><th>Kode ayam</th><th>Berat (g)</th>' : '<th>Kelamin</th><th>Usia</th><th>Berat (kg)</th>'}<th>Taksir pasar</th><th>Harga saya</th><th>Taksir untung</th><th>Status</th><th>Ket.</th></tr>${
      L.map((i,n) => `<tr class="c" onclick="openM(${i.id})"><td>${n+1}</td><td>${ph(i)}</td><td>${i.code}</td>${e ? `<td>${i.laydate||'-'}</td><td>${i.hen||'-'}</td><td>${i.weight||0}</td>` : `<td>${i.sex}</td><td>${i.age||0} bln</td><td>${i.weight||0}</td>`}<td>${rp(est(i))}</td><td>${rp(i.price)}</td><td class="${prof(i)<0?'neg':'pos'}">${rp(prof(i))}</td><td><span class="tag ${i.status}">${{ready:'Ready', order:'By Order'}[i.status]}</span></td><td>${(i.note||'').slice(0,30)}</td></tr>`).join('')}</table>`
      : '<div class="empty">Belum ada data. Tambahkan lewat menu Input Data.</div>'}</div></div>`;
  }
}

/* ---------- POP UP DETAIL / EDIT ---------- */
function openM(id){
  const it = S.items.find(x => x.id == id); photoTmp = '';
  $('#box').innerHTML = `<h2>Detail ${TY[it.type]} · ${it.code}</h2>
    <p style="color:var(--mut)">Taksir harga pasar: <b>${rp(est(it))}</b> · Taksir untung: <b>${rp(prof(it))}</b></p>
    ${form(it, false)}
    <div class="row"><button class="btn" id="us">Simpan perubahan</button><button class="btn red" id="ud">Hapus</button><button class="btn alt" onclick="closeM()">Tutup</button></div>`;
  $('#modal').classList.add('show'); bindForm();
  $('#us').onclick = () => { Object.assign(it, read(it)); save(); closeM(); render(); };
  $('#ud').onclick = () => { if(confirm('Hapus data ini?')){ S.items = S.items.filter(x => x.id != id); save(); closeM(); render(); } };
}
function closeM(){ $('#modal').classList.remove('show'); photoTmp = ''; }
$('#modal').onclick = e => { if(e.target.id == 'modal') closeM(); };

nav(); render();
