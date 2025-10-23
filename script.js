/* Kalkulator Pintar - Script
   Fitur:
   - tombol rumus cepat (dengan form dynamic)
   - custom formula evaluator (simple validation)
   - history sederhana
   - background laser animation
*/

/* ---------- LASER BACKGROUND (Canvas) ---------- */
const canvas = document.getElementById('laser-bg');
const ctx = canvas.getContext('2d');
function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
resize();
addEventListener('resize', resize);

const points = [];
for (let i=0;i<60;i++){
  points.push({
    x: Math.random()*canvas.width,
    y: Math.random()*canvas.height,
    vx: (Math.random()-0.5)*0.6,
    vy: (Math.random()-0.5)*0.6,
    hue: Math.floor(Math.random()*360)
  });
}

function drawLaser(){
  ctx.fillStyle = 'rgba(2,6,23,0.12)';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  for (let p of points){
    ctx.beginPath();
    ctx.fillStyle = `hsla(${p.hue},90%,60%,0.95)`;
    ctx.arc(p.x,p.y,1.8,0,Math.PI*2);
    ctx.fill();

    // connect near points
    for (let q of points){
      const dx = p.x-q.x, dy = p.y-q.y;
      const d = Math.sqrt(dx*dx+dy*dy);
      if (d<120){
        ctx.beginPath();
        ctx.strokeStyle = `hsla(${p.hue},90%,60%,${(120-d)/200})`;
        ctx.moveTo(p.x,p.y);
        ctx.lineTo(q.x,q.y);
        ctx.stroke();
      }
    }

    p.x += p.vx; p.y += p.vy;
    if (p.x<0||p.x>canvas.width) p.vx*=-1;
    if (p.y<0||p.y>canvas.height) p.vy*=-1;
  }
  requestAnimationFrame(drawLaser);
}
drawLaser();

/* ---------- UI & Logic ---------- */
const resultBox = document.getElementById('result');
const historyBox = document.getElementById('history');
const formArea = document.getElementById('formArea');
const customExpr = document.getElementById('customExpr');
const customVars = document.getElementById('customVars');

let history = [];

function pushHistory(title, out){
  const time = new Date().toLocaleString();
  history.unshift(`<div class="hist-item"><b>${title}</b><div class="muted" style="font-size:12px">${time}</div><div>${out}</div></div>`);
  historyBox.innerHTML = history.join('<hr style="opacity:0.06">');
}

/* Utility: parse vars string into object */
function parseVars(text){
  const obj = {};
  const lines = text.split('\n');
  for (let line of lines){
    line = line.trim();
    if (!line) continue;
    const idx = line.indexOf('=');
    if (idx===-1) continue;
    const name = line.slice(0,idx).trim();
    const val = parseFloat(line.slice(idx+1).trim());
    if (name && !isNaN(val)) obj[name]=val;
  }
  return obj;
}

/* SAFE evaluator: allow only limited chars and map ^->** and Math functions */
const allowedPattern = /^[0-9a-zA-Z_\+\-\*\/\^\%\.\(\)\,\s]*$/;
const mathFuncs = ['abs','acos','asin','atan','ceil','floor','round','sqrt','log','max','min','sin','cos','tan','pow','exp'];

function safeEvaluate(expr, vars={}){
  // basic sanitize
  if (!allowedPattern.test(expr)) throw new Error('Ekspresi mengandung karakter tidak diizinkan.');
  // replace ^ with **
  expr = expr.replace(/\^/g, '**');

  // convert function names to Math.func
  for (let f of mathFuncs){
    const re = new RegExp('\\b'+f+'\\b','g');
    expr = expr.replace(re, 'Math.'+f);
  }

  // create parameter list for Function
  // attach var names as locals
  const varNames = Object.keys(vars);
  const varVals = Object.values(vars);
  // build function string
  const fnBody = `"use strict"; return (${expr});`;
  // create function with Math in scope and variables as parameters
  const fn = new Function(...varNames, fnBody);
  return fn(...varVals);
}

/* Prebuilt formulas UI */
const formulaButtons = document.querySelectorAll('[data-cmd]');
formulaButtons.forEach(b => b.addEventListener('click', ()=>selectFormula(b.dataset.cmd)));

function selectFormula(cmd){
  formArea.innerHTML = ''; // reset
  if (cmd==='area_rect'){
    formArea.innerHTML = `
      <div class="muted">Luas persegi panjang = p * l</div>
      <input id="p" placeholder="panjang (p)" />
      <input id="l" placeholder="lebar (l)" />
      <div class="row"><button id="calcArea">Hitung</button></div>`;
    document.getElementById('calcArea').addEventListener('click', ()=>{
      const p = parseFloat(document.getElementById('p').value);
      const l = parseFloat(document.getElementById('l').value);
      if (isNaN(p)||isNaN(l)) { resultBox.innerText = 'Masukkan angka yang valid.'; return; }
      const out = p*l;
      resultBox.innerHTML = `Luas = <b>${out}</b>`;
      pushHistory('Luas Persegi Panjang', `p=${p}, l=${l} → ${out}`);
    });
  } else if (cmd==='area_circle'){
    formArea.innerHTML = `
      <div class="muted">Luas lingkaran = π * r²</div>
      <input id="r" placeholder="radius (r)" />
      <div class="row"><button id="calcCircle">Hitung</button></div>`;
    document.getElementById('calcCircle').addEventListener('click', ()=>{
      const r = parseFloat(document.getElementById('r').value);
      if (isNaN(r)){ resultBox.innerText = 'Masukkan angka yang valid.'; return; }
      const out = Math.PI * r * r;
      resultBox.innerHTML = `Luas = <b>${out.toFixed(6)}</b>`;
      pushHistory('Luas Lingkaran', `r=${r} → ${out}`);
    });
  } else if (cmd==='perim_rect'){
    formArea.innerHTML = `
      <div class="muted">Keliling persegi panjang = 2*(p + l)</div>
      <input id="p2" placeholder="panjang (p)" />
      <input id="l2" placeholder="lebar (l)" />
      <div class="row"><button id="calcPerim">Hitung</button></div>`;
    document.getElementById('calcPerim').addEventListener('click', ()=>{
      const p = parseFloat(document.getElementById('p2').value);
      const l = parseFloat(document.getElementById('l2').value);
      if (isNaN(p)||isNaN(l)) { resultBox.innerText = 'Masukkan angka yang valid.'; return; }
      const out = 2*(p+l);
      resultBox.innerHTML = `Keliling = <b>${out}</b>`;
      pushHistory('Keliling Persegi Panjang', `p=${p}, l=${l} → ${out}`);
    });
  } else if (cmd==='quad'){
    formArea.innerHTML = `
      <div class="muted">Akar persamaan ax² + bx + c = 0</div>
      <input id="a" placeholder="a" />
      <input id="b" placeholder="b" />
      <input id="c" placeholder="c" />
      <div class="row"><button id="calcQuad">Hitung</button></div>`;
    document.getElementById('calcQuad').addEventListener('click', ()=>{
      const a = parseFloat(document.getElementById('a').value);
      const b = parseFloat(document.getElementById('b').value);
      const c = parseFloat(document.getElementById('c').value);
      if (isNaN(a)||isNaN(b)||isNaN(c) || a===0){ resultBox.innerText = 'Masukkan angka valid (a≠0).'; return; }
      const D = b*b-4*a*c;
      if (D<0){
        resultBox.innerHTML = `Diskriminan < 0 → akar kompleks. D=${D}`;
        pushHistory('Rumus Kuadrat', `a=${a}, b=${b}, c=${c} → Diskriminan=${D} (kompleks)`);
      } else {
        const x1 = (-b + Math.sqrt(D)) / (2*a);
        const x2 = (-b - Math.sqrt(D)) / (2*a);
        resultBox.innerHTML = `x₁ = <b>${x1}</b><br>x₂ = <b>${x2}</b>`;
        pushHistory('Rumus Kuadrat', `a=${a}, b=${b}, c=${c} → x1=${x1}, x2=${x2}`);
      }
    });
  } else if (cmd==='bmi'){
    formArea.innerHTML = `
      <div class="muted">BMI = berat(kg) / (tinggi(m)^2)</div>
      <input id="berat" placeholder="Berat (kg)" />
      <input id="tinggi" placeholder="Tinggi (cm)" />
      <div class="row"><button id="calcBMI">Hitung</button></div>`;
    document.getElementById('calcBMI').addEventListener('click', ()=>{
      const berat = parseFloat(document.getElementById('berat').value);
      const tinggiCm = parseFloat(document.getElementById('tinggi').value);
      if (isNaN(berat)||isNaN(tinggiCm)){ resultBox.innerText='Masukkan data valid.'; return; }
      const tinggi = tinggiCm/100;
      const bmi = berat / (tinggi*tinggi);
      let cat = 'Normal';
      if (bmi<18.5) cat='Kurus'; else if (bmi>=25) cat='Gemuk';
      resultBox.innerHTML = `BMI = <b>${bmi.toFixed(2)}</b> (${cat})`;
      pushHistory('BMI', `berat=${berat}, tinggi=${tinggiCm}cm → BMI=${bmi.toFixed(2)} (${cat})`);
    });
  } else if (cmd==='ohm'){
    formArea.innerHTML = `
      <div class="muted">V = I * R (Hukum Ohm). Isi dua nilai, kosongkan yang dicari.</div>
      <input id="V" placeholder="Tegangan V (Volt). Kosongkan jika ingin mencari" />
      <input id="I" placeholder="Arus I (Ampere). Kosongkan jika ingin mencari" />
      <input id="R" placeholder="Hambatan R (Ohm). Kosongkan jika ingin mencari" />
      <div class="row"><button id="calcOhm">Hitung</button></div>`;
    document.getElementById('calcOhm').addEventListener('click', ()=>{
      const V = parseFloat(document.getElementById('V').value);
      const I = parseFloat(document.getElementById('I').value);
      const R = parseFloat(document.getElementById('R').value);
      // count filled
      const filled = [V,I,R].filter(v=>!isNaN(v)).length;
      if (filled < 2){ resultBox.innerText='Isi minimal dua nilai.'; return; }
      if (isNaN(V)){
        const out = I*R; resultBox.innerHTML = `V = ${out}`; pushHistory('Ohm', `I=${I}, R=${R} → V=${out}`);
      } else if (isNaN(I)){
        const out = V/R; resultBox.innerHTML = `I = ${out}`; pushHistory('Ohm', `V=${V}, R=${R} → I=${out}`);
      } else if (isNaN(R)){
        const out = V/I; resultBox.innerHTML = `R = ${out}`; pushHistory('Ohm', `V=${V}, I=${I} → R=${out}`);
      } else {
        resultBox.innerHTML = `V=${V}, I=${I}, R=${R}`;
      }
    });
  }
}

/* Custom formula evaluator buttons */
document.getElementById('evalCustom').addEventListener('click', ()=>{
  const expr = customExpr.value.trim();
  const vars = parseVars(customVars.value);
  if (!expr) { resultBox.innerText = 'Masukkan ekspresi rumus.'; return; }
  try {
    const out = safeEvaluate(expr, vars);
    resultBox.innerHTML = `Hasil = <b>${out}</b>`;
    pushHistory('Custom: '+expr, `vars=${JSON.stringify(vars)} → ${out}`);
  } catch (e) {
    resultBox.innerText = 'Error: ' + e.message;
  }
});
document.getElementById('clearCustom').addEventListener('click', ()=>{
  customExpr.value=''; customVars.value=''; resultBox.innerText='Belum ada perhitungan.';
});

/* Init: show default formula info */
selectFormula('area_rect');
