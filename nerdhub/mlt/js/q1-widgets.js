/* Quiz 1 interactive widgets, ported verbatim from the original Quiz 1 site and wrapped so they cannot clash with the Quiz 2 engine. */
(function(){
'use strict';
/* ===== Charts (single-series bars, one hue; hover tooltip; table view) ===== */
const tip = (function(){let t=document.getElementById('q1-tip');if(!t){t=document.createElement('div');t.id='q1-tip';t.className='q1-tip';document.body.appendChild(t);}return t;})();
function showTip(ev, html){ tip.innerHTML=html; tip.classList.add('on'); const x=Math.min(ev.clientX+14, innerWidth-300); tip.style.left=x+'px'; tip.style.top=(ev.clientY+14)+'px'; }
function hideTip(){ tip.classList.remove('on'); }
function esc(s){ return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function niceMax(v){ const p=Math.pow(10,Math.floor(Math.log10(v||1))); const n=v/p; return (n<=1?1:n<=2?2:n<=2.5?2.5:n<=5?5:10)*p; }
function drawChart(el, cfg){
  const NS='http://www.w3.org/2000/svg';
  const labels=cfg.labels, vals=cfg.values, unit=cfg.unit||'', tipx=cfg.tips||[];
  if(cfg.type==='hbar'){
    const W=cfg.width||560, lw=cfg.labelWidth||150, rowH=30, top=8, H=top+rowH*labels.length+24, pw=W-lw-70;
    const max=niceMax(Math.max(...vals)); const svg=document.createElementNS(NS,'svg'); svg.setAttribute('viewBox',`0 0 ${W} ${H}`); svg.setAttribute('role','img'); svg.setAttribute('aria-label',cfg.aria||'bar chart');
    let s='';
    for(let i=0;i<=4;i++){ const x=lw+pw*i/4; s+=`<line class="grid" x1="${x}" x2="${x}" y1="${top}" y2="${H-22}"/><text class="axis" x="${x}" y="${H-6}" text-anchor="middle">${+(max*i/4).toFixed(1)}</text>`; }
    labels.forEach((l,i)=>{ const y=top+i*rowH, w=Math.max(2,pw*vals[i]/max);
      s+=`<text x="${lw-10}" y="${y+rowH/2+4}" text-anchor="end" font-size="13">${esc(l)}</text>`+
         (w<8?`<rect x="${lw}" y="${y+7}" width="${w}" height="${rowH-14}" fill="#1D4ED8"/>`:`<path class="markp" d="M${lw},${y+7} h${w-4} a4,4 0 0 1 4,4 v${rowH-22} a4,4 0 0 1 -4,4 h-${w-4} z" fill="#1D4ED8"/>`)+
         `<text x="${lw+w+6}" y="${y+rowH/2+4}" font-size="12.5" fill="#d4d4d4">${vals[i]}${unit}</text>`+
         `<rect class="hit" x="0" y="${y}" width="${W}" height="${rowH}" data-i="${i}"/>`; });
    svg.innerHTML=s; el.appendChild(svg); hookTips(svg, labels, vals, unit, tipx);
  } else if(cfg.type==='vbar'){
    const W=720, H=260, left=40, bottom=46, top=14, pw=W-left-10, ph=H-top-bottom, n=labels.length, bw=Math.min(54,pw/n*0.62);
    const max=niceMax(Math.max(...vals)); const svg=document.createElementNS(NS,'svg'); svg.setAttribute('viewBox',`0 0 ${W} ${H}`); svg.setAttribute('role','img'); svg.setAttribute('aria-label',cfg.aria||'column chart');
    let s='';
    for(let i=0;i<=4;i++){ const y=top+ph-ph*i/4; s+=`<line class="grid" x1="${left}" x2="${W-10}" y1="${y}" y2="${y}"/><text class="axis" x="${left-6}" y="${y+4}" text-anchor="end">${+(max*i/4).toFixed(1)}</text>`; }
    labels.forEach((l,i)=>{ const cx=left+pw*(i+.5)/n, h=Math.max(2,ph*vals[i]/max), x=cx-bw/2, y=top+ph-h;
      s+=(h<8?`<rect x="${x}" y="${y}" width="${bw}" height="${h}" fill="#1D4ED8"/>`:`<path d="M${x},${top+ph} v-${h-4} a4,4 0 0 1 4,-4 h${bw-8} a4,4 0 0 1 4,4 v${h-4} z" fill="#1D4ED8"/>`)+
         `<text x="${cx}" y="${y-5}" text-anchor="middle" font-size="11.5">${vals[i]}${unit}</text>`+
         `<text class="axis" x="${cx}" y="${top+ph+16}" text-anchor="middle">${esc(l)}</text>`+
         (cfg.sub&&cfg.sub[i]?`<text class="axis" x="${cx}" y="${top+ph+30}" text-anchor="middle">${esc(cfg.sub[i])}</text>`:'')+
         `<rect class="hit" x="${cx-pw/n/2}" y="${top}" width="${pw/n}" height="${ph+bottom}" data-i="${i}"/>`; });
    svg.innerHTML=s; el.appendChild(svg); hookTips(svg, labels, vals, unit, tipx);
  } else if(cfg.type==='heat'){
    const rows=cfg.rows, cols=cfg.cols, m=cfg.matrix, mx=Math.max(...m.flat());
    let h='<div class="tbl-wrap"><table class="heat"><thead><tr><th>'+esc(cfg.corner||'')+'</th>'+cols.map(c=>`<th class="num">${esc(c)}</th>`).join('')+(cfg.rowTotal?'<th class="num">Total</th>':'')+'</tr></thead><tbody>';
    rows.forEach((r,i)=>{ h+=`<tr><th>${esc(r)}</th>`+m[i].map((v,j)=>`<td class="cell" style="background:rgba(96,165,250,${v? (0.08+0.82*v/mx).toFixed(2):0})" title="${esc(r)} · ${esc(cols[j])}: ${v}${unit}">${v||'·'}</td>`).join('')+(cfg.rowTotal?`<td class="num"><b>${m[i].reduce((a,b)=>a+b,0)}</b></td>`:'')+'</tr>'; });
    h+='</tbody></table></div><div class="legend-seq">0 <i></i> '+mx+(unit?' '+unit:'')+' (darker = more)</div>';
    el.innerHTML=h;
  }
}
function hookTips(svg, labels, vals, unit, tips){
  svg.querySelectorAll('.hit').forEach(r=>{ const i=+r.dataset.i;
    r.addEventListener('mousemove', ev=>showTip(ev, `<b>${esc(labels[i])}</b><br>${vals[i]}${unit}${tips[i]?'<br><span style="color:#a3a3a3">'+esc(tips[i])+'</span>':''}`));
    r.addEventListener('mouseleave', hideTip); });
}

/* ===== Widget: 2-D projection explorer (x onto line through origin along w) ===== */
function proj2d(el){
  const x0=(el.dataset.x||'3,4').split(',').map(Number), w0=(el.dataset.w||'1,1').split(',').map(Number);
  const st={x1:x0[0],x2:x0[1],w1:w0[0],w2:w0[1]};
  const f=v=>(Math.abs(v)<5e-10?0:v).toFixed(3).replace(/\.?0+$/,'')||'0';
  const sl=(k,lab)=>`<label style="display:flex;gap:8px;align-items:center;font-size:13px;margin:3px 0"><span class="mono" style="min-width:26px">${lab}</span><input type="range" min="-5" max="5" step="0.5" value="${st[k]}" data-k="${k}" style="flex:1;accent-color:#60A5FA"><span class="mono" data-v="${k}" style="min-width:34px;text-align:right">${st[k]}</span></label>`;
  el.innerHTML=`<div class="grid2" style="align-items:start"><div><svg viewBox="0 0 360 360" style="width:100%;max-width:420px;display:block;background:#18202B;border:1px solid #2A3442;border-radius:8px" role="img" aria-label="projection of x onto the line along w"></svg></div>
  <div><div style="margin-bottom:8px">${sl('x1','x₁')}${sl('x2','x₂')}${sl('w1','w₁')}${sl('w2','w₂')}</div><div class="tbl-wrap"><table><tbody data-out></tbody></table></div>
  <p class="note" style="margin:6px 0 0"><span style="color:#34D399">■</span> x &nbsp;<span style="color:#60A5FA">■</span> w &nbsp;<span style="color:#FBBF24">■</span> projection p &nbsp;<span style="color:#F87171">■</span> residual r = x − p</p></div></div>`;
  const svg=el.querySelector('svg'), out=el.querySelector('[data-out]');
  const S=28, C=180, X=v=>C+v*S, Y=v=>C-v*S;
  function draw(){
    const x=[st.x1,st.x2], w=[st.w1,st.w2], ww=w[0]*w[0]+w[1]*w[1];
    let g='';
    for(let i=-6;i<=6;i++){ g+=`<line x1="${X(i)}" y1="${Y(-6)}" x2="${X(i)}" y2="${Y(6)}" stroke="${i?'#1E2733':'#3A4555'}"/><line x1="${X(-6)}" y1="${Y(i)}" x2="${X(6)}" y2="${Y(i)}" stroke="${i?'#1E2733':'#3A4555'}"/>`; }
    const arrow=(a,b,c,col,wd)=>{ const dx=c[0]-b[0],dy=c[1]-b[1],L=Math.hypot(dx,dy); if(L<1e-9) return ''; const ux=dx/L,uy=dy/L, hx=X(c[0]),hy=Y(c[1]), s=9;
      const p1=[hx-s*ux+s*.45*uy*-1, hy+s*uy+s*.45*ux*-1], p2=[hx-s*ux-s*.45*uy*-1, hy+s*uy-s*.45*ux*-1];
      return `<line x1="${X(b[0])}" y1="${Y(b[1])}" x2="${hx}" y2="${hy}" stroke="${col}" stroke-width="${wd}"/><path d="M${hx},${hy} L${p1[0]},${p1[1]} L${p2[0]},${p2[1]} z" fill="${col}"/>`; };
    let rows='';
    if(ww<1e-12){ out.innerHTML='<tr><td>w = 0 defines no line, so the projection is undefined.</td></tr>'; svg.innerHTML=g+arrow(0,[0,0],x,'#34D399',2.4); return; }
    const nw=Math.sqrt(ww), dot=x[0]*w[0]+x[1]*w[1], t=dot/ww, p=[t*w[0],t*w[1]], r=[x[0]-p[0],x[1]-p[1]];
    const L=12/nw; g+=`<line x1="${X(-L*w[0])}" y1="${Y(-L*w[1])}" x2="${X(L*w[0])}" y2="${Y(L*w[1])}" stroke="#60A5FA" stroke-opacity=".35" stroke-dasharray="6 5"/>`;
    g+=arrow(0,[0,0],w,'#60A5FA',2)+arrow(0,[0,0],p,'#FBBF24',3.2)+arrow(0,p,x,'#F87171',2)+arrow(0,[0,0],x,'#34D399',2.4);
    svg.innerHTML=g;
    const nx2=x[0]*x[0]+x[1]*x[1], rn2=r[0]*r[0]+r[1]*r[1], sp=dot/nw;
    const R=(a,b)=>`<tr><td>${a}</td><td class="num mono">${b}</td></tr>`;
    rows+=R('xᵀw',f(dot))+R('‖w‖',f(nw))+R('scalar projection xᵀw / ‖w‖',f(sp))+R('length of projection |xᵀw| / ‖w‖',f(Math.abs(sp)))+
      R('p = (xᵀw / wᵀw) w','('+f(p[0])+', '+f(p[1])+')')+R('r = x − p','('+f(r[0])+', '+f(r[1])+')')+
      R('‖r‖ (reconstruction error norm)',f(Math.sqrt(rn2)))+R('‖r‖²',f(rn2))+R('check rᵀw (should be 0)',f(r[0]*w[0]+r[1]*w[1]))+R('check ‖x‖² − (scalar proj)²',f(nx2-sp*sp));
    out.innerHTML=rows;
  }
  el.querySelectorAll('input[type=range]').forEach(inp=>inp.addEventListener('input',()=>{ st[inp.dataset.k]=+inp.value; el.querySelector(`[data-v="${inp.dataset.k}"]`).textContent=inp.value; draw(); }));
  draw();
}

/* ===== Widget (B4+): variance along a direction u(θ) for a 2-D dataset (1/n convention) ===== */
function vardir(el){
  const P=(el.dataset.points||'5,3;1,-1;4,0;2,2').split(';').map(s=>s.split(',').map(Number)), n=P.length;
  const mu=[P.reduce((a,p)=>a+p[0],0)/n, P.reduce((a,p)=>a+p[1],0)/n];
  const Z=P.map(p=>[p[0]-mu[0],p[1]-mu[1]]);
  const a=Z.reduce((s,z)=>s+z[0]*z[0],0)/n, b=Z.reduce((s,z)=>s+z[0]*z[1],0)/n, c=Z.reduce((s,z)=>s+z[1]*z[1],0)/n;
  const tr=a+c, disc=Math.sqrt(((a-c)/2)**2+b*b), L1=tr/2+disc, L2=tr/2-disc;
  let th1=0.5*Math.atan2(2*b,a-c)*180/Math.PI; if(th1<0) th1+=180; const th2=(th1+90)%180;
  const f=v=>{ v=Math.abs(v)<5e-10?0:v; return v.toFixed(3).replace(/\.?0+$/,'')||'0'; };
  const st={th:+(el.dataset.theta||0)};
  el.innerHTML=`<div class="grid2" style="align-items:start">
  <div><svg data-s viewBox="0 0 360 360" style="width:100%;max-width:420px;display:block;background:#18202B;border:1px solid #2A3442;border-radius:8px" role="img" aria-label="centred data, direction u, projections"></svg>
  <p class="note" style="margin:6px 0 0"><span style="color:#34D399">●</span> centred point x̃ᵢ &nbsp;<span style="color:#FBBF24">●</span> projection (uᵀx̃ᵢ)u &nbsp;<span style="color:#F87171">┄</span> residual &nbsp;<span style="color:#60A5FA">━</span> direction u. Origin = mean (${f(mu[0])}, ${f(mu[1])}).</p></div>
  <div><label style="display:flex;gap:8px;align-items:center;font-size:13px;margin:0 0 6px"><span class="mono" style="min-width:20px">θ</span><input type="range" min="0" max="180" step="1" value="${st.th}" style="flex:1;accent-color:#60A5FA"><span class="mono" data-tv style="min-width:42px;text-align:right">${st.th}°</span></label>
  <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px"><button class="btn" data-go="${th1}">θ → max (λ₁)</button><button class="btn" data-go="${th2}">θ → min (λ₂)</button><button class="btn" data-go="0">θ = 0° (feature 1)</button></div>
  <svg data-c viewBox="0 0 360 210" style="width:100%;display:block;background:#18202B;border:1px solid #2A3442;border-radius:8px" role="img" aria-label="variance along u versus angle"></svg>
  <div class="tbl-wrap"><table><tbody data-out></tbody></table></div></div></div>`;
  const sv=el.querySelector('[data-s]'), cv=el.querySelector('[data-c]'), out=el.querySelector('[data-out]'), rng=el.querySelector('input');
  const M=Math.max(1,...Z.flat().map(Math.abs)), S=140/M, X=v=>180+v*S, Y=v=>180-v*S;
  const cx0=40, cx1=345, cy0=180, cy1=14, ymax=niceMax(L1*1.1), CX=t=>cx0+(cx1-cx0)*t/180, CY=v=>cy0-(cy0-cy1)*v/ymax;
  const varAt=t=>{ const r=t*Math.PI/180, u=[Math.cos(r),Math.sin(r)]; return a*u[0]*u[0]+2*b*u[0]*u[1]+c*u[1]*u[1]; };
  let curve=''; for(let t=0;t<=180;t+=1) curve+=(t?'L':'M')+CX(t).toFixed(1)+','+CY(varAt(t)).toFixed(1);
  let cbase='';
  for(let i=0;i<=4;i++){ const v=ymax*i/4; cbase+=`<line x1="${cx0}" x2="${cx1}" y1="${CY(v)}" y2="${CY(v)}" stroke="#2A3442"/><text x="${cx0-5}" y="${CY(v)+4}" text-anchor="end" font-size="10" fill="#a3a3a3">${+v.toFixed(2)}</text>`; }
  for(let t=0;t<=180;t+=45) cbase+=`<text x="${CX(t)}" y="${cy0+14}" text-anchor="middle" font-size="10" fill="#a3a3a3">${t}°</text>`;
  cbase+=`<text x="${(cx0+cx1)/2}" y="${cy0+27}" text-anchor="middle" font-size="10.5" fill="#d4d4d4">θ (direction angle)</text><text x="12" y="${(cy0+cy1)/2}" font-size="10.5" fill="#d4d4d4" transform="rotate(-90 12 ${(cy0+cy1)/2})" text-anchor="middle">variance along u</text>`;
  cbase+=`<line x1="${cx0}" x2="${cx1}" y1="${CY(L1)}" y2="${CY(L1)}" stroke="#34D399" stroke-dasharray="4 4"/><text x="${cx1}" y="${CY(L1)-4}" text-anchor="end" font-size="10.5" fill="#34D399">λ₁ = ${f(L1)}</text>`;
  cbase+=`<line x1="${cx0}" x2="${cx1}" y1="${CY(L2)}" y2="${CY(L2)}" stroke="#FBBF24" stroke-dasharray="4 4"/><text x="${cx1}" y="${CY(L2)-4}" text-anchor="end" font-size="10.5" fill="#FBBF24">λ₂ = ${f(L2)}</text>`;
  cbase+=`<path d="${curve}" fill="none" stroke="#60A5FA" stroke-width="2.2"/>`;
  function draw(){
    const t=st.th, r=t*Math.PI/180, u=[Math.cos(r),Math.sin(r)];
    let g='';
    for(let i=-9;i<=9;i++){ const p=i*M/9*S; g+=`<line x1="${180+p}" y1="20" x2="${180+p}" y2="340" stroke="${i?'#1C2430':'#3A4555'}"/><line x1="20" y1="${180+p}" x2="340" y2="${180+p}" stroke="${i?'#1C2430':'#3A4555'}"/>`; }
    g+=`<line x1="${X(-2*M*u[0])}" y1="${Y(-2*M*u[1])}" x2="${X(2*M*u[0])}" y2="${Y(2*M*u[1])}" stroke="#60A5FA" stroke-opacity=".55" stroke-dasharray="6 5"/>`;
    g+=`<line x1="${X(0)}" y1="${Y(0)}" x2="${X(u[0]*M*0.6)}" y2="${Y(u[1]*M*0.6)}" stroke="#60A5FA" stroke-width="3"/><text x="${X(u[0]*M*0.6)+6}" y="${Y(u[1]*M*0.6)-6}" fill="#60A5FA" font-size="12">u</text>`;
    const zs=Z.map(z=>z[0]*u[0]+z[1]*u[1]);
    Z.forEach((z,i)=>{ const p=[zs[i]*u[0],zs[i]*u[1]];
      g+=`<line x1="${X(z[0])}" y1="${Y(z[1])}" x2="${X(p[0])}" y2="${Y(p[1])}" stroke="#F87171" stroke-dasharray="3 3"/>`+
         `<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="4.5" fill="#FBBF24"/><circle cx="${X(z[0])}" cy="${Y(z[1])}" r="5" fill="#34D399"/>`+
         `<text x="${X(z[0])+7}" y="${Y(z[1])+4}" font-size="11" fill="#d4d4d4">(${f(z[0])}, ${f(z[1])})</text>`; });
    sv.innerHTML=g;
    const v=varAt(t);
    cv.innerHTML=cbase+`<line x1="${CX(t)}" x2="${CX(t)}" y1="${cy1}" y2="${cy0}" stroke="#a3a3a3" stroke-dasharray="2 3"/><circle cx="${CX(t)}" cy="${CY(v)}" r="5" fill="#fff" stroke="#60A5FA" stroke-width="2"/>`;
    const meanz=zs.reduce((s,x)=>s+x,0)/n, vz=zs.reduce((s,x)=>s+x*x,0)/n;
    const R=(k,val)=>`<tr><td>${k}</td><td class="num mono">${val}</td></tr>`;
    out.innerHTML=R('u = (cos θ, sin θ)','('+f(u[0])+', '+f(u[1])+')')+R('projections zᵢ = uᵀx̃ᵢ',zs.map(f).join(', '))+R('mean of zᵢ (centred ⇒ 0)',f(meanz))+
      R('variance (1/n) Σ zᵢ²',f(vz))+R('formula uᵀCu',f(v))+R('avg residual² = tr C − uᵀCu',f(tr-v))+R('C = [[a, b], [b, c]]','a='+f(a)+', b='+f(b)+', c='+f(c))+
      R('λ₁, λ₂ (tr C = λ₁+λ₂ = '+f(tr)+')',f(L1)+', '+f(L2))+R('q₁ angle (max-variance direction)',f(th1)+'°');
  }
  rng.addEventListener('input',()=>{ st.th=+rng.value; el.querySelector('[data-tv]').textContent=rng.value+'°'; draw(); });
  el.querySelectorAll('[data-go]').forEach(bt=>bt.addEventListener('click',()=>{ st.th=Math.round(+bt.dataset.go*100)/100; rng.value=st.th; el.querySelector('[data-tv]').textContent=f(st.th)+'°'; draw(); }));
  draw();
}

/* ===== Widget (B14+): 2x2 Gram table K=[[a,b],[b,c]] -> eigenvalues + drawable arrows ===== */
function gram2(el){
  const st={a:+(el.dataset.a||2), b:+(el.dataset.b||1), c:+(el.dataset.c||2)};
  const f=v=>{ v=Math.abs(v)<5e-10?0:v; return v.toFixed(3).replace(/\.?0+$/,'')||'0'; };
  const sl=(k,lab,mn,mx)=>`<label style="display:flex;gap:8px;align-items:center;font-size:13px;margin:3px 0"><span class="mono" style="min-width:74px">${lab}</span><input type="range" min="${mn}" max="${mx}" step="0.25" value="${st[k]}" data-k="${k}" style="flex:1;accent-color:#60A5FA"><span class="mono" data-v="${k}" style="min-width:42px;text-align:right">${st[k]}</span></label>`;
  const presets=[['Valid (a,b,c)=(2,1,2)',2,1,2],['Boundary b²=ac: (1,2,4)',1,2,4],['|b| too big: (1,2,1)',1,2,1],['Negative diagonal: (−1,0,2)',-1,0,2]];
  el.innerHTML=`<div class="grid2" style="align-items:start">
  <div><svg data-s viewBox="0 0 360 300" style="width:100%;max-width:420px;display:block;background:#18202B;border:1px solid #2A3442;border-radius:8px" role="img" aria-label="two arrows v1 and v2 whose lengths squared and dot product are the entries of the table K, or a message that no such arrows exist"></svg>
  <p class="note" style="margin:6px 0 0"><span style="color:#60A5FA">■</span> v₁ (length √a) &nbsp;<span style="color:#FBBF24">■</span> v₂ (length √c) &nbsp;angle θ with cos θ = b/√(ac)</p></div>
  <div><div style="margin-bottom:8px">${sl('a','a = ‖v₁‖²',-2,4)}${sl('c','c = ‖v₂‖²',-2,4)}${sl('b','b = v₁·v₂',-4,4)}</div>
  <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">${presets.map((p,i)=>`<button class="btn" data-p="${i}">${p[0]}</button>`).join('')}</div>
  <div class="tbl-wrap"><table><tbody data-out></tbody></table></div></div></div>`;
  const svg=el.querySelector('[data-s]'), out=el.querySelector('[data-out]');
  const O=[180,175], S=55;
  const arrow=(x1,y1,x2,y2,col,w)=>{ const dx=x2-x1, dy=y2-y1, L=Math.hypot(dx,dy); if(L<1) return `<circle cx="${x1}" cy="${y1}" r="4" fill="${col}"/>`;
    const ux=dx/L, uy=dy/L, s=10, px=-uy, py=ux;
    return `<line x1="${x1}" y1="${y1}" x2="${x2-ux*s*0.6}" y2="${y2-uy*s*0.6}" stroke="${col}" stroke-width="${w}"/><path d="M${x2},${y2} L${x2-ux*s+px*s*.45},${y2-uy*s+py*s*.45} L${x2-ux*s-px*s*.45},${y2-uy*s-py*s*.45} z" fill="${col}"/>`; };
  function draw(){
    const {a,b,c}=st, tr=a+c, det=a*c-b*b, disc=Math.sqrt(((a-c)/2)**2+b*b), L1=tr/2+disc, L2=tr/2-disc, psd=L2>=-1e-9;
    let g=''; for(let i=-3;i<=3;i++){ g+=`<line x1="${O[0]+i*S}" y1="20" x2="${O[0]+i*S}" y2="280" stroke="${i?'#1C2430':'#3A4555'}"/><line x1="20" y1="${O[1]+i*S}" x2="340" y2="${O[1]+i*S}" stroke="${i?'#1C2430':'#3A4555'}"/>`; }
    let why='', cosT=null;
    if(a>1e-9 && c>1e-9) cosT=b/Math.sqrt(a*c);
    if(psd){
      const r1=Math.sqrt(Math.max(a,0)), r2=Math.sqrt(Math.max(c,0));
      let th=0; if(cosT!==null) th=Math.acos(Math.max(-1,Math.min(1,cosT)));
      const e1=[O[0]+r1*S, O[1]], e2=[O[0]+r2*S*Math.cos(th), O[1]-r2*S*Math.sin(th)];
      g+=arrow(O[0],O[1],e1[0],e1[1],'#60A5FA',3)+arrow(O[0],O[1],e2[0],e2[1],'#FBBF24',3);
      if(cosT!==null && th>0.02){ const R=26, ax=O[0]+R*Math.cos(th), ay=O[1]-R*Math.sin(th); g+=`<path d="M${O[0]+R},${O[1]} A${R},${R} 0 0 0 ${ax},${ay}" fill="none" stroke="#a3a3a3"/><text x="${O[0]+R+8}" y="${O[1]-8}" fill="#d4d4d4" font-size="12">θ = ${f(th*180/Math.PI)}°</text>`; }
      g+=`<text x="${O[0]-4}" y="${O[1]+18}" fill="#a3a3a3" font-size="11" text-anchor="end">0</text>`;
      g+=`<text x="180" y="292" text-anchor="middle" fill="#34D399" font-size="12.5">PSD ⇒ drawable (‖v₁‖ = ${f(r1)}, ‖v₂‖ = ${f(r2)})</text>`;
    } else {
      if(a<-1e-9 || c<-1e-9) why='diagonal negative: ‖v‖² = a (ya c) &lt; 0 — impossible';
      else if(a<=1e-9 || c<=1e-9) why='one arrow is zero, so the dot product b must be 0, but b ≠ 0';
      else why='|b| > √(ac): cos θ = '+f(cosT)+', but |cos θ| must be ≤ 1';
      g+=`<line x1="${O[0]-70}" y1="${O[1]-70}" x2="${O[0]+70}" y2="${O[1]+70}" stroke="#F87171" stroke-width="3"/><line x1="${O[0]-70}" y1="${O[1]+70}" x2="${O[0]+70}" y2="${O[1]-70}" stroke="#F87171" stroke-width="3"/>`;
      g+=`<text x="180" y="262" text-anchor="middle" fill="#fca5a5" font-size="13" font-weight="600">no such arrows exist</text>`;
      g+=`<text x="180" y="282" text-anchor="middle" fill="#a3a3a3" font-size="11.5">${why}</text>`;
    }
    svg.innerHTML=g;
    const R=(k,v)=>`<tr><td>${k}</td><td class="num mono">${v}</td></tr>`;
    out.innerHTML=R('K','[[ '+f(a)+', '+f(b)+' ], [ '+f(b)+', '+f(c)+' ]]')+R('trace = λ₁ + λ₂',f(tr))+R('det = ac − b² = λ₁λ₂',f(det))+R('λ₁, λ₂',f(L1)+', '+f(L2))+
      R('b² ≤ ac ?', (b*b<=a*c+1e-9?'yes':'no')+'  (b² = '+f(b*b)+', ac = '+f(a*c)+')')+R('cos θ = b/√(ac)', cosT===null?'—':f(cosT))+
      R('PSD? (all λ ≥ 0)', psd?'<span class="chip target">PSD — valid Gram</span>':'<span class="chip repair">Not PSD: this cannot be a kernel table</span>');
  }
  el.querySelectorAll('input[type=range]').forEach(inp=>inp.addEventListener('input',()=>{ st[inp.dataset.k]=+inp.value; el.querySelector(`[data-v="${inp.dataset.k}"]`).textContent=inp.value; draw(); }));
  el.querySelectorAll('[data-p]').forEach(bt=>bt.addEventListener('click',()=>{ const p=presets[+bt.dataset.p]; st.a=p[1]; st.b=p[2]; st.c=p[3];
    ['a','b','c'].forEach(k=>{ el.querySelector(`input[data-k="${k}"]`).value=st[k]; el.querySelector(`[data-v="${k}"]`).textContent=st[k]; }); draw(); }));
  draw();
}

/* ===== Widget (B17+): K-means stepper — pure core + UI ===== */
function kmCore(P, M0){
  const K=M0.length, d=P[0].length;
  const sq=(a,b)=>{ let s=0; for(let i=0;i<a.length;i++){ const t=a[i]-b[i]; s+=t*t; } return s; };
  const S={mu:M0.map(m=>m.slice()), z:null, D:null, phase:'assign', iter:1, log:[], done:false};
  function assign(){
    S.D=P.map(p=>S.mu.map(m=>sq(p,m)));
    S.z=S.D.map(r=>{ let b=0; for(let k=1;k<K;k++) if(r[k]<r[b]-1e-12) b=k; return b; });
    const F=S.D.reduce((s,r,i)=>s+r[S.z[i]],0);
    S.log.push({lab:'Pass '+S.iter+' · Assign', kind:'assign', F:F, note:'F(z, μ): new labels, old centres'});
    S.phase='update';
  }
  function update(){
    const old=S.mu;
    const nm=old.map((m,k)=>{
      const mem=[]; S.z.forEach((v,i)=>{ if(v===k) mem.push(P[i]); });
      if(!mem.length) return m.slice();
      const s=new Array(d).fill(0); mem.forEach(p=>p.forEach((x,j)=>{ s[j]+=x; }));
      return s.map(x=>x/mem.length);
    });
    const F=P.reduce((s,p,i)=>s+sq(p,nm[S.z[i]]),0);
    const moved=nm.some((m,k)=>m.some((x,j)=>Math.abs(x-old[k][j])>1e-12));
    S.mu=nm;
    S.log.push({lab:'Pass '+S.iter+' · Update', kind:'update', F:F, note:'F(z, μ): same labels, new centres (means)'});
    S.phase='assign'; S.iter++;
    if(!moved) S.done=true;
  }
  return {
    S:S,
    step:function(){ if(S.done) return; if(S.phase==='assign') assign(); else update(); },
    run:function(){ let g=0; while(!S.done && g<200){ this.step(); g++; } }
  };
}
function kmstep(el){
  const P=(el.dataset.points||'0;2;4;9;10').split(';').map(s=>s.split(',').map(Number));
  const M0=(el.dataset.init||'0;5').split(';').map(s=>s.split(',').map(Number));
  const d=P[0].length, K=M0.length, COL=['#60A5FA','#FBBF24','#34D399'];
  const f=v=>{ v=Math.abs(v)<5e-10?0:v; return (+v.toFixed(3)).toString(); };
  const fv=v=>d===1? f(v[0]) : '('+v.map(f).join(', ')+')';
  let C=kmCore(P,M0);
  el.innerHTML='<div class="grid2" style="align-items:start"><div><svg data-s viewBox="0 0 360 '+(d===1?170:300)+'" style="width:100%;max-width:460px;display:block;background:#18202B;border:1px solid #2A3442;border-radius:8px" role="img" aria-label="K-means points, centres and assignments"></svg>'+
    '<p class="note" style="margin:6px 0 0">● point (colour = cluster) &nbsp;◆ centre &nbsp;line = point to its centre</p></div>'+
    '<div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px"><button class="btn" data-a="step"></button><button class="btn" data-a="run">Run to convergence</button><button class="btn" data-a="reset">Reset</button></div>'+
    '<p class="note" data-msg style="margin:0 0 8px"></p><div class="tbl-wrap" data-dist></div><div class="tbl-wrap"><table><thead><tr><th>Step</th><th class="num">F</th><th>Kaun sa F</th></tr></thead><tbody data-log></tbody></table></div><p class="note" data-mono style="margin:6px 0 0"></p></div></div>';
  const svg=el.querySelector('[data-s]'), btnStep=el.querySelector('[data-a="step"]'), msg=el.querySelector('[data-msg]'), dist=el.querySelector('[data-dist]'), logb=el.querySelector('[data-log]'), mono=el.querySelector('[data-mono]');
  const W=360, H=d===1?170:300, pad=34;
  const xs=P.map(p=>p[0]).concat(M0.map(m=>m[0])), ys=d>1? P.map(p=>p[1]).concat(M0.map(m=>m[1])) : [0];
  const x0=Math.min.apply(null,xs), x1=Math.max.apply(null,xs), y0=Math.min.apply(null,ys), y1=Math.max.apply(null,ys);
  const xr=Math.max(x1-x0,1e-9), yr=Math.max(y1-y0,1e-9);
  const sc=d===1? (W-2*pad)/xr : Math.min((W-2*pad)/xr,(H-2*pad)/yr);
  const ox=d===1? pad : (W-sc*xr)/2, oy=d===1? H/2 : (H+sc*yr)/2;
  const X=v=>ox+(v-x0)*sc, Y=v=>d===1? H/2 : oy-(v-y0)*sc;
  function niceStep(r){ const p=Math.pow(10,Math.floor(Math.log10(r/4))); const n=r/4/p; return (n<=1.5?1:n<=3.5?2:n<=7.5?5:10)*p; }
  function draw(){
    const S=C.S; let g='';
    const st=niceStep(Math.max(xr,yr)||1);
    if(d===1){
      g+='<line x1="'+(pad-10)+'" y1="'+(H/2)+'" x2="'+(W-pad+10)+'" y2="'+(H/2)+'" stroke="#3A4555"/>';
      for(let t=Math.ceil(x0/st)*st;t<=x1+1e-9;t+=st) g+='<line x1="'+X(t)+'" y1="'+(H/2-4)+'" x2="'+X(t)+'" y2="'+(H/2+4)+'" stroke="#525252"/><text x="'+X(t)+'" y="'+(H/2+20)+'" text-anchor="middle" fill="#737373" font-size="10.5">'+f(t)+'</text>';
    } else {
      for(let t=Math.ceil(x0/st)*st;t<=x1+1e-9;t+=st) g+='<line x1="'+X(t)+'" y1="14" x2="'+X(t)+'" y2="'+(H-14)+'" stroke="#1E2733"/><text x="'+X(t)+'" y="'+(H-3)+'" text-anchor="middle" fill="#737373" font-size="10">'+f(t)+'</text>';
      for(let t=Math.ceil(y0/st)*st;t<=y1+1e-9;t+=st) g+='<line x1="14" y1="'+Y(t)+'" x2="'+(W-14)+'" y2="'+Y(t)+'" stroke="#1E2733"/><text x="6" y="'+(Y(t)+3)+'" fill="#737373" font-size="10">'+f(t)+'</text>';
    }
    if(S.z){ P.forEach((p,i)=>{ const m=S.mu[S.z[i]]; g+='<line x1="'+X(p[0])+'" y1="'+(d===1?Y(0)-14:Y(p[1]))+'" x2="'+X(m[0])+'" y2="'+(d===1?Y(0)+14:Y(m[1]))+'" stroke="'+COL[S.z[i]%3]+'" stroke-opacity=".45"/>'; }); }
    P.forEach((p,i)=>{ const cy=d===1?Y(0)-14:Y(p[1]); const col=S.z? COL[S.z[i]%3] : '#a3a3a3';
      g+='<circle cx="'+X(p[0])+'" cy="'+cy+'" r="5.2" fill="'+col+'" stroke="#10161E"/><text x="'+(X(p[0])+7)+'" y="'+(cy-7)+'" font-size="10" fill="#d4d4d4">'+fv(p)+'</text>'; });
    S.mu.forEach((m,k)=>{ const cx=X(m[0]), cy=d===1?Y(0)+14:Y(m[1]); g+='<path d="M'+cx+','+(cy-8)+' L'+(cx+8)+','+cy+' L'+cx+','+(cy+8)+' L'+(cx-8)+','+cy+' z" fill="'+COL[k%3]+'" stroke="#fff" stroke-width="1.5"/><text x="'+(cx+10)+'" y="'+(cy+(d===1?18:-9))+'" font-size="10.5" fill="'+COL[k%3]+'">μ'+(k+1)+' = '+fv(m)+'</text>'; });
    svg.innerHTML=g;
    btnStep.textContent=S.done? 'Converged ✓' : (S.phase==='assign'? 'Next step: Assign' : 'Next step: Update');
    btnStep.disabled=S.done; btnStep.style.opacity=S.done?.5:1;
    msg.textContent=S.done? 'Converged: a full pass (assign + update) changes nothing, so the assignment and centres are fixed.' : (S.phase==='assign'? 'Next step: assign each point to its nearest centre (by distance²).' : 'Next step: move each centre to the mean of its points.');
    if(S.D){ let h='<table><thead><tr><th>Point</th>'+S.mu.map((m,k)=>'<th class="num" style="color:'+COL[k%3]+'">d² to μ'+(k+1)+'</th>').join('')+'<th class="num">z</th></tr></thead><tbody>';
      P.forEach((p,i)=>{ h+='<tr><td class="mono">'+fv(p)+'</td>'+S.D[i].map((v,k)=>'<td class="num mono"'+(k===S.z[i]?' style="font-weight:700;color:#fff"':' style="color:#a3a3a3"')+'>'+f(v)+'</td>').join('')+'<td class="num mono">'+(S.z[i]+1)+'</td></tr>'; });
      dist.innerHTML=h+'</tbody></table><p class="note" style="margin:4px 8px">These distances use the centres at the time of the assignment (the centres have moved since the update).</p>'; } else dist.innerHTML='';
    logb.innerHTML=S.log.map(r=>'<tr><td class="mono">'+r.lab+'</td><td class="num mono">'+f(r.F)+'</td><td>'+r.note+'</td></tr>').join('') || '<tr><td colspan="3" class="muted">No step run yet.</td></tr>';
    let ok=true; for(let i=1;i<S.log.length;i++) if(S.log[i].F>S.log[i-1].F+1e-9) ok=false;
    mono.textContent=S.log.length>1? (ok? '✓ F has never increased so far (assign and update each lower F or keep it the same).' : '⚠ F increased: this should never happen (bug).') : '';
  }
  btnStep.addEventListener('click',()=>{ C.step(); draw(); });
  el.querySelector('[data-a="run"]').addEventListener('click',()=>{ C.run(); draw(); });
  el.querySelector('[data-a="reset"]').addEventListener('click',()=>{ C=kmCore(P,M0); draw(); });
  draw();
}

/* ===== Widget (B18+): nearest-centre cells (exact clipped polygons) + click-to-probe ===== */
function vcells(el){
  const num=s=>s.split(',').map(Number);
  const C=(el.dataset.centres||'0,0;4,4').split(';').map(num);
  const Pt=(el.dataset.points||'').split(';').filter(Boolean).map(num);
  const seg=el.dataset.seg? el.dataset.seg.split(';').map(num) : null;
  const bx=num(el.dataset.box||'-1,-1,6,6');
  const COL=['#60A5FA','#FBBF24','#34D399','#F87171'];
  const f=v=>{ v=Math.abs(v)<5e-10?0:v; return (+v.toFixed(3)).toString(); };
  const W=360, pad=10, s=(W-2*pad)/(bx[2]-bx[0]), H=Math.round(2*pad+s*(bx[3]-bx[1]));
  const X=v=>pad+(v-bx[0])*s, Y=v=>H-pad-(v-bx[1])*s;
  const d2=(p,m)=>(p[0]-m[0])*(p[0]-m[0])+(p[1]-m[1])*(p[1]-m[1]);
  const near=p=>{ let b=0; for(let k=1;k<C.length;k++) if(d2(p,C[k])<d2(p,C[b])-1e-12) b=k; return b; };
  function clip(poly,g){ const out=[]; for(let i=0;i<poly.length;i++){ const p=poly[i], q=poly[(i+1)%poly.length], gp=g(p), gq=g(q);
    if(gp<=0) out.push(p);
    if((gp<0&&gq>0)||(gp>0&&gq<0)){ const t=gp/(gp-gq); out.push([p[0]+t*(q[0]-p[0]), p[1]+t*(q[1]-p[1])]); } } return out; }
  const cells=C.map((a,k)=>{ let poly=[[bx[0],bx[1]],[bx[2],bx[1]],[bx[2],bx[3]],[bx[0],bx[3]]];
    C.forEach((b,j)=>{ if(j===k) return; const c0=b[0]*b[0]+b[1]*b[1]-a[0]*a[0]-a[1]*a[1]; poly=clip(poly,p=>2*((b[0]-a[0])*p[0]+(b[1]-a[1])*p[1])-c0); });
    return poly; });
  el.innerHTML='<div class="grid2" style="align-items:start"><div><svg data-s viewBox="0 0 '+W+' '+H+'" style="width:100%;max-width:460px;display:block;background:#18202B;border:1px solid #2A3442;border-radius:8px;cursor:crosshair" role="img" aria-label="Nearest-centre cells for the given centres; click to probe a location"></svg>'+
    '<p class="note" style="margin:6px 0 0">◆ centre &nbsp;● point (rang = its cell) &nbsp;<span style="color:#fff">▢</span> click to probe</p></div>'+
    '<div><div class="tbl-wrap"><table><tbody data-out></tbody></table></div></div></div>';
  const svg=el.querySelector('[data-s]'), out=el.querySelector('[data-out]');
  let probe=null;
  function draw(){
    let g='';
    const st=(bx[2]-bx[0])>10?2:1;
    for(let t=Math.ceil(bx[0]/st)*st;t<=bx[2]+1e-9;t+=st) g+='<line x1="'+X(t)+'" y1="'+Y(bx[1])+'" x2="'+X(t)+'" y2="'+Y(bx[3])+'" stroke="#1C2430"/><text x="'+X(t)+'" y="'+(H-1)+'" text-anchor="middle" fill="#737373" font-size="9.5">'+t+'</text>';
    for(let t=Math.ceil(bx[1]/st)*st;t<=bx[3]+1e-9;t+=st) g+='<line x1="'+X(bx[0])+'" y1="'+Y(t)+'" x2="'+X(bx[2])+'" y2="'+Y(t)+'" stroke="#1C2430"/><text x="2" y="'+(Y(t)+3)+'" fill="#737373" font-size="9.5">'+t+'</text>';
    cells.forEach((poly,k)=>{ if(poly.length<3) return; g+='<polygon points="'+poly.map(p=>X(p[0]).toFixed(1)+','+Y(p[1]).toFixed(1)).join(' ')+'" fill="'+COL[k%4]+'" fill-opacity=".14" stroke="'+COL[k%4]+'" stroke-opacity=".8" stroke-width="1.5"/>'; });
    if(seg) g+='<line x1="'+X(seg[0][0])+'" y1="'+Y(seg[0][1])+'" x2="'+X(seg[1][0])+'" y2="'+Y(seg[1][1])+'" stroke="#fff" stroke-width="2" stroke-dasharray="5 3"/>';
    Pt.forEach(p=>{ g+='<circle cx="'+X(p[0])+'" cy="'+Y(p[1])+'" r="5" fill="'+COL[near(p)%4]+'" stroke="#10161E"/><text x="'+(X(p[0])+7)+'" y="'+(Y(p[1])-6)+'" font-size="10" fill="#d4d4d4">('+f(p[0])+','+f(p[1])+')</text>'; });
    C.forEach((m,k)=>{ const cx=X(m[0]), cy=Y(m[1]); g+='<path d="M'+cx+','+(cy-8)+' L'+(cx+8)+','+cy+' L'+cx+','+(cy+8)+' L'+(cx-8)+','+cy+' z" fill="'+COL[k%4]+'" stroke="#fff" stroke-width="1.5"/><text x="'+(cx+10)+'" y="'+(cy+14)+'" font-size="10.5" fill="'+COL[k%4]+'">μ'+(k+1)+'=('+f(m[0])+','+f(m[1])+')</text>'; });
    if(probe) g+='<rect x="'+(X(probe[0])-5)+'" y="'+(Y(probe[1])-5)+'" width="10" height="10" fill="none" stroke="#fff" stroke-width="2"/>';
    svg.innerHTML=g;
    const R=(a,b)=>'<tr><td>'+a+'</td><td class="num mono">'+b+'</td></tr>';
    let h='';
    if(probe){ const k=near(probe); h+=R('probe x',f(probe[0])+', '+f(probe[1]));
      C.forEach((m,j)=>{ h+=R('d² to μ'+(j+1), (j===k?'<b style="color:'+COL[j%4]+'">':'<span>')+f(d2(probe,m))+(j===k?' ← smallest</b>':'</span>')); });
      h+=R('cell (tie ⇒ lower index)','μ'+(k+1)); }
    else h+='<tr><td colspan="2" class="muted">Click anywhere on the plot to see the nearest centre there and the d² to each centre.</td></tr>';
    Pt.forEach((p,i)=>{ h+=R('point ('+f(p[0])+', '+f(p[1])+')','cell μ'+(near(p)+1)); });
    if(seg){ const k0=near(seg[0]); let same=true; for(let i=0;i<=40;i++){ const t=i/40, q=[seg[0][0]+t*(seg[1][0]-seg[0][0]), seg[0][1]+t*(seg[1][1]-seg[0][1])]; if(near(q)!==k0) same=false; }
      h+=R('41 sample points on the segment', same?'<span class="chip target">all in cell μ'+(k0+1)+' ✓</span>':'<span class="chip repair">in different cells</span>'); }
    out.innerHTML=h;
  }
  svg.addEventListener('click',ev=>{ const r=svg.getBoundingClientRect(); const sxp=(ev.clientX-r.left)/r.width*W, syp=(ev.clientY-r.top)/r.height*H;
    probe=[bx[0]+(sxp-pad)/s, bx[1]+(H-pad-syp)/s]; draw(); });
  draw();
}

/* ===== Widget (B20+): K-means++ seeding explorer — scores, probabilities, click-to-choose ===== */
function kmpp(el){
  const P=(el.dataset.points||'0,0;1,1;1,-1;8,0;9,1;9,-1;5,8').split(';').map(s=>s.split(',').map(Number));
  const n=P.length, COL=['#60A5FA','#FBBF24','#34D399','#F87171'];
  const st={C:(el.dataset.start||'0').split(',').map(Number), rule:el.dataset.rule||'sq'};
  const RULES={sq:'score = D² (Euclid, standard)', dist:'score = D (Euclid)', man:'score = D (Manhattan)', man2:'score = D² (Manhattan)'};
  const f=v=>{ v=Math.abs(v)<5e-10?0:v; return (+v.toFixed(3)).toString(); };
  const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
  const frac=(a,b)=>{ if(b===0) return '—'; const g=gcd(a,b)||1; return (a/g)+'/'+(b/g); };
  const pt=i=>'('+P[i].map(f).join(', ')+')';
  function calc(){
    const rows=P.map((p,i)=>{
      let e2=Infinity, m=Infinity;
      st.C.forEach(c=>{ const q=P[c], dx=p[0]-q[0], dy=p[1]-q[1]; e2=Math.min(e2,dx*dx+dy*dy); m=Math.min(m,Math.abs(dx)+Math.abs(dy)); });
      let s; if(st.rule==='sq') s=e2; else if(st.rule==='dist') s=Math.sqrt(e2); else if(st.rule==='man') s=m; else s=m*m;
      return {i:i, e2:e2, D:(st.rule==='man'||st.rule==='man2')?m:Math.sqrt(e2), s:s, isC:st.C.indexOf(i)>=0};
    });
    const S=rows.reduce((a,r)=>a+r.s,0);
    rows.forEach(r=>{ r.p=S>0? r.s/S : 0; });
    return {rows:rows,S:S};
  }
  el.innerHTML='<div class="grid2" style="align-items:start"><div><svg data-s viewBox="0 0 360 300" style="width:100%;max-width:460px;display:block;background:#18202B;border:1px solid #2A3442;border-radius:8px;cursor:pointer" role="img" aria-label="Points with chosen centres; circle area shows the probability of being chosen next; click a point to make it the next centre"></svg>'+
    '<p class="note" style="margin:6px 0 0">◆ chosen centre &nbsp;● point (bigger circle = higher probability) &nbsp;Click a point to make it the next centre</p></div>'+
    '<div><div data-rules style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px"></div>'+
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px"><button class="btn" data-a="top">Highest score → next centre</button><button class="btn" data-a="undo">Undo</button><button class="btn" data-a="reset">Reset</button></div>'+
    '<p class="note" data-msg style="margin:0 0 6px"></p><div class="tbl-wrap"><table><thead><tr><th>Point</th><th class="num">D (nearest centre)</th><th class="num">score</th><th class="num">P(chosen next)</th></tr></thead><tbody data-out></tbody></table></div><p class="note" data-foot style="margin:6px 0 0"></p></div></div>';
  const svg=el.querySelector('[data-s]'), out=el.querySelector('[data-out]'), msg=el.querySelector('[data-msg]'), foot=el.querySelector('[data-foot]'), rbox=el.querySelector('[data-rules]');
  const W=360,H=300,pad=30;
  const xs=P.map(p=>p[0]), ys=P.map(p=>p[1]);
  const x0=Math.min.apply(null,xs), x1=Math.max.apply(null,xs), y0=Math.min.apply(null,ys), y1=Math.max.apply(null,ys);
  const xr=Math.max(x1-x0,1e-9), yr=Math.max(y1-y0,1e-9), sc=Math.min((W-2*pad)/xr,(H-2*pad)/yr);
  const ox=(W-sc*xr)/2, oy=(H+sc*yr)/2, X=v=>ox+(v-x0)*sc, Y=v=>oy-(v-y0)*sc;
  const ORDER=['sq','dist','man','man2'];
  rbox.innerHTML=ORDER.map(k=>'<button class="btn" data-r="'+k+'">'+RULES[k]+'</button>').join('');
  function niceStep(r){ const p=Math.pow(10,Math.floor(Math.log10(r/4))); const m=r/4/p; return (m<=1.5?1:m<=3.5?2:m<=7.5?5:10)*p; }
  function draw(){
    const R=calc(), rows=R.rows;
    const free=rows.filter(r=>!r.isC), best=free.reduce((b,r)=>(!b||r.s>b.s+1e-12)?r:b,null);
    let g=''; const gs=niceStep(Math.max(xr,yr)||1);
    for(let t=Math.ceil(x0/gs)*gs;t<=x1+1e-9;t+=gs) g+='<line x1="'+X(t)+'" y1="12" x2="'+X(t)+'" y2="'+(H-14)+'" stroke="#1E2733"/><text x="'+X(t)+'" y="'+(H-3)+'" text-anchor="middle" fill="#737373" font-size="10">'+f(t)+'</text>';
    for(let t=Math.ceil(y0/gs)*gs;t<=y1+1e-9;t+=gs) g+='<line x1="14" y1="'+Y(t)+'" x2="'+(W-12)+'" y2="'+Y(t)+'" stroke="#1E2733"/><text x="4" y="'+(Y(t)+3)+'" fill="#737373" font-size="10">'+f(t)+'</text>';
    const pm=Math.max.apply(null,rows.map(r=>r.p))||1;
    rows.forEach(r=>{ if(r.isC) return; const rad=4+11*Math.sqrt(r.p/pm);
      g+='<circle data-i="'+r.i+'" cx="'+X(P[r.i][0])+'" cy="'+Y(P[r.i][1])+'" r="'+rad.toFixed(1)+'" fill="#60A5FA" fill-opacity=".55" stroke="#93c5fd"/><text x="'+(X(P[r.i][0])+rad+3)+'" y="'+(Y(P[r.i][1])+4)+'" font-size="10" fill="#d4d4d4" pointer-events="none">'+pt(r.i)+'</text>'; });
    st.C.forEach((c,k)=>{ const cx=X(P[c][0]), cy=Y(P[c][1]); g+='<path d="M'+cx+','+(cy-9)+' L'+(cx+9)+','+cy+' L'+cx+','+(cy+9)+' L'+(cx-9)+','+cy+' z" fill="'+COL[k%4]+'" stroke="#fff" stroke-width="1.5" pointer-events="none"/><text x="'+(cx+11)+'" y="'+(cy-8)+'" font-size="10.5" fill="'+COL[k%4]+'" pointer-events="none">μ'+(k+1)+' '+pt(c)+'</text>'; });
    svg.innerHTML=g;
    rbox.querySelectorAll('button').forEach(b=>{ const on=b.dataset.r===st.rule; b.style.borderColor=on?'#60A5FA':''; b.style.color=on?'#fff':'#a3a3a3'; });
    const intS=rows.every(r=>Math.abs(r.s-Math.round(r.s))<1e-9) && st.rule!=='dist';
    out.innerHTML=rows.map(r=>{ const hi=best&&r.i===best.i&&!r.isC;
      return '<tr><td class="mono">'+pt(r.i)+(r.isC?' <span class="chip target">centre μ'+(st.C.indexOf(r.i)+1)+'</span>':'')+'</td><td class="num mono">'+f(r.D)+'</td><td class="num mono">'+f(r.s)+'</td><td class="num mono"'+(hi?' style="font-weight:700;color:#fff"':'')+'>'+(r.isC?'0':(intS&&R.S>0?frac(Math.round(r.s),Math.round(R.S))+' = ':'')+(100*r.p).toFixed(1)+'%')+'</td></tr>'; }).join('')+
      '<tr><td><b>Σ score</b></td><td></td><td class="num mono"><b>'+f(R.S)+'</b></td><td class="num mono"><b>100%</b></td></tr>';
    const k=st.C.length;
    msg.textContent= free.length===0? 'Every point is already a centre: nothing left to sample.' : (k+1)+'th centre to choose: '+RULES[st.rule]+'. Highest probability: '+pt(best.i)+' ('+(100*best.p).toFixed(1)+'%). It is not certain to be chosen, only the most likely.';
    foot.textContent= st.rule==='sq' ? 'Σ score = F: the current cost of the nearest-centre assignment (each point\'s D²). P = the point\'s share of that cost.' : 'Note: changing the score rule changes the probabilities (and Euclidean versus Manhattan can even change the ranking).';
    el.querySelector('[data-a="top"]').disabled=free.length===0;
    el.querySelector('[data-a="undo"]').disabled=st.C.length<=1;
  }
  svg.addEventListener('click',ev=>{ const t=ev.target; if(t && t.dataset && t.dataset.i!==undefined){ st.C.push(+t.dataset.i); draw(); } });
  rbox.addEventListener('click',ev=>{ const b=ev.target.closest('button'); if(b&&b.dataset.r){ st.rule=b.dataset.r; draw(); } });
  el.querySelector('[data-a="top"]').addEventListener('click',()=>{ const R=calc(), free=R.rows.filter(r=>!r.isC); if(!free.length) return; const b=free.reduce((a,r)=>(r.s>a.s+1e-12)?r:a,free[0]); st.C.push(b.i); draw(); });
  el.querySelector('[data-a="undo"]').addEventListener('click',()=>{ if(st.C.length>1){ st.C.pop(); draw(); } });
  el.querySelector('[data-a="reset"]').addEventListener('click',()=>{ st.C=(el.dataset.start||'0').split(',').map(Number); st.rule=el.dataset.rule||'sq'; draw(); });
  draw();
}

/* ===== Widget (B22+): Bernoulli likelihood explorer — slide n, k, probe p; relative L or log-likelihood ===== */
function bernlik(el){
  const st={n:+(el.dataset.n||10), k:+(el.dataset.k||3), p:+(el.dataset.p||0.5), mode:el.dataset.mode||'rel'};
  const f=(v,d)=>{ if(v===-Infinity) return '−∞'; if(v===Infinity) return '∞'; const a=Math.abs(v); if(a!==0 && a<1e-3) return v.toExponential(2); return (+v.toFixed(d===undefined?4:d)).toString(); };
  const ell=p=>{ const k=st.k, n=st.n; return (k>0? k*Math.log(p):0)+(n-k>0? (n-k)*Math.log(1-p):0); };
  const sl=(key,lab,mn,mx,stp)=>'<label style="display:flex;gap:8px;align-items:center;font-size:13px;margin:3px 0"><span class="mono" style="min-width:74px">'+lab+'</span><input type="range" min="'+mn+'" max="'+mx+'" step="'+stp+'" value="'+st[key]+'" data-k="'+key+'" style="flex:1;accent-color:#60A5FA"><span class="mono" data-v="'+key+'" style="min-width:42px;text-align:right">'+st[key]+'</span></label>';
  el.innerHTML='<div class="grid2" style="align-items:start"><div><svg data-s viewBox="0 0 360 250" style="width:100%;max-width:460px;display:block;background:#18202B;border:1px solid #2A3442;border-radius:8px" role="img" aria-label="Bernoulli likelihood of p for n tosses with k ones, with the maximum at p-hat = k/n"></svg>'+
    '<p class="note" style="margin:6px 0 0"><span style="color:#60A5FA">━</span> curve &nbsp;<span style="color:#34D399">┆</span> p̂ = k/n (maximum) &nbsp;<span style="color:#fff">●</span> probe p</p></div>'+
    '<div><div data-sl></div><div style="display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 8px"><button class="btn" data-m="rel">L(p) / L(p̂)</button><button class="btn" data-m="log">log-likelihood ℓ(p)</button></div>'+
    '<div class="tbl-wrap"><table><tbody data-out></tbody></table></div><p class="note" data-msg style="margin:6px 0 0"></p></div></div>';
  const svg=el.querySelector('[data-s]'), out=el.querySelector('[data-out]'), msg=el.querySelector('[data-msg]'), slb=el.querySelector('[data-sl]');
  slb.innerHTML=sl('n','n (tosses)',1,60,1)+sl('k','k (ones)',0,st.n,1)+sl('p','probe p',0,1,0.01);
  const L0=44, R0=346, T0=14, B0=206, X=p=>L0+(R0-L0)*p;
  function draw(){
    const n=st.n, k=st.k, ph=k/n, lmax=ell(ph);
    const yv=v=>{ if(st.mode==='rel') return Math.exp(v-lmax); return Math.max(v,lmax-10); };
    const ylo=st.mode==='rel'?0:lmax-10, yhi=st.mode==='rel'?1:lmax;
    const Y=v=>B0-(B0-T0)*(yv(v)-ylo)/(yhi-ylo);
    let g='';
    for(let i=0;i<=4;i++){ const val=ylo+(yhi-ylo)*i/4, y=B0-(B0-T0)*i/4; g+='<line x1="'+L0+'" x2="'+R0+'" y1="'+y+'" y2="'+y+'" stroke="#2A3442"/><text x="'+(L0-5)+'" y="'+(y+4)+'" text-anchor="end" font-size="10" fill="#a3a3a3">'+(st.mode==='rel'?+val.toFixed(2):+val.toFixed(1))+'</text>'; }
    for(let i=0;i<=5;i++){ const pv=i/5; g+='<text x="'+X(pv)+'" y="'+(B0+15)+'" text-anchor="middle" font-size="10" fill="#a3a3a3">'+pv.toFixed(1)+'</text>'; }
    g+='<text x="'+((L0+R0)/2)+'" y="'+(B0+30)+'" text-anchor="middle" font-size="10.5" fill="#d4d4d4">p (Bernoulli parameter)</text>';
    g+='<text x="12" y="'+((B0+T0)/2)+'" text-anchor="middle" font-size="10.5" fill="#d4d4d4" transform="rotate(-90 12 '+((B0+T0)/2)+')">'+(st.mode==='rel'?'L(p) / L(p̂)':'log-likelihood ℓ(p)')+'</text>';
    g+='<line x1="'+X(ph)+'" x2="'+X(ph)+'" y1="'+T0+'" y2="'+B0+'" stroke="#34D399" stroke-dasharray="4 4"/><text x="'+Math.min(X(ph)+4,R0-60)+'" y="'+(T0+10)+'" font-size="10.5" fill="#34D399">p̂ = '+f(ph,3)+'</text>';
    let d=''; for(let i=0;i<=400;i++){ const p=i/400, v=ell(p); const y=(v===-Infinity)? B0 : Y(v); d+=(i?'L':'M')+X(p).toFixed(1)+','+y.toFixed(1); }
    g+='<path d="'+d+'" fill="none" stroke="#60A5FA" stroke-width="2.2"/>';
    const lp=ell(st.p), py=(lp===-Infinity)? B0 : Y(lp);
    g+='<line x1="'+X(st.p)+'" x2="'+X(st.p)+'" y1="'+py+'" y2="'+B0+'" stroke="#a3a3a3" stroke-dasharray="2 3"/><circle cx="'+X(st.p)+'" cy="'+py+'" r="5" fill="#fff" stroke="#60A5FA" stroke-width="2"/>';
    svg.innerHTML=g;
    let area=0; const N=4000; for(let i=0;i<N;i++){ area+=Math.exp(ell((i+.5)/N)); } area/=N;
    const R=(a,b)=>'<tr><td>'+a+'</td><td class="num mono">'+b+'</td></tr>';
    const interior=(k>0&&k<n);
    out.innerHTML=R('data: n, k (ones), n − k (zeros)',n+', '+k+', '+(n-k))+R('p̂ = k / n  (MLE)',f(ph,4))+R('L(p̂) = p̂ᵏ (1−p̂)ⁿ⁻ᵏ',f(Math.exp(lmax)))+R('ℓ(p̂) = k ln p̂ + (n−k) ln(1−p̂)',f(lmax))+
      R('ℓ″(p̂) = −n / (p̂(1−p̂))', interior? f(-n/(ph*(1-ph)),2)+'  (&lt; 0 ⇒ concave)':'n/a — boundary')+
      R('probe p',f(st.p,2))+R('L(p)',f(Math.exp(lp)))+R('ℓ(p)',f(lp))+R('L(p) / L(p̂)',f(Math.exp(lp-lmax)))+
      R('∫₀¹ L(p) dp  (if it were 1, L would be a density)',f(area));
    msg.textContent=(!interior)? ('Boundary case: '+(k===0?'no 1s observed ⇒ L(p) = (1−p)ⁿ only decreases, maximum at p = 0; the derivative is never 0 inside (0,1).':'all 1s ⇒ L(p) = pⁿ only increases, maximum at p = 1.')) : ('Increase n (keep k/n fixed): the curve gets narrower. More data means more confidence in p̂, but p̂ itself stays the same.');
    el.querySelectorAll('[data-m]').forEach(b=>{ const on=b.dataset.m===st.mode; b.style.borderColor=on?'#60A5FA':''; b.style.color=on?'#fff':'#a3a3a3'; });
  }
  slb.addEventListener('input',ev=>{ const t=ev.target; if(!t.dataset||!t.dataset.k) return; st[t.dataset.k]=+t.value;
    if(t.dataset.k==='n'){ if(st.k>st.n) st.k=st.n; const kk=slb.querySelector('input[data-k="k"]'); kk.max=st.n; kk.value=st.k; slb.querySelector('[data-v="k"]').textContent=st.k; }
    slb.querySelector('[data-v="'+t.dataset.k+'"]').textContent=t.value; draw(); });
  el.querySelectorAll('[data-m]').forEach(b=>b.addEventListener('click',()=>{ st.mode=b.dataset.m; draw(); }));
  draw();
}

/* ===== Widget (B23+): one-parameter MLE explorer — Exponential / Poisson / Pareto on your own data ===== */
function mlecurve(el){
  const lnfact=n=>{ let s=0; for(let i=2;i<=n;i++) s+=Math.log(i); return s; };
  const MODELS={
    exp:{name:'Exponential',sym:'λ',def:'1,2,3,4,5,6',
      check:x=>x.every(v=>v>=0)?'':'Exponential needs every xᵢ ≥ 0.',
      stats:x=>({n:x.length,S:x.reduce((a,b)=>a+b,0),C:0}),
      statLab:'Σ xᵢ', hat:s=>s.S>0? s.n/s.S : NaN, c:s=>s.n,
      ell:(t,s)=>s.n*Math.log(t)-t*s.S, formula:'λ̂ = n / Σxᵢ = 1 / x̄', form2:'ℓ(λ) = n ln λ − λ Σxᵢ',
      extra:(s,h)=>[['sample mean x̄ = Σxᵢ / n',s.S/s.n],['1 / x̄  (= λ̂, not the mean!)',s.n/s.S]]},
    pois:{name:'Poisson',sym:'λ',def:'0,1,1,1,1,2,2,2,2,2,2,3,3,3,3,3,3,3,3,3,4,4,4,4,4',
      check:x=>x.every(v=>v>=0&&Math.abs(v-Math.round(v))<1e-9)?'':'Poisson needs every xᵢ to be a non-negative integer.',
      stats:x=>({n:x.length,S:x.reduce((a,b)=>a+b,0),C:x.reduce((a,b)=>a+lnfact(Math.round(b)),0)}),
      statLab:'Σ xᵢ', hat:s=>s.S/s.n, c:s=>s.S,
      ell:(t,s)=>-s.n*t+s.S*Math.log(t)-s.C, formula:'λ̂ = Σxᵢ / n = x̄', form2:'ℓ(λ) = −nλ + (Σxᵢ) ln λ − Σ ln xᵢ!',
      extra:(s,h)=>[['sample mean x̄',s.S/s.n],['Σ ln xᵢ!  (constant, free of λ)',s.C]]},
    par:{name:'Pareto (x ≥ 1)',sym:'θ',def:'2.5,1.8,3.2,2.0,2.7',
      check:x=>x.every(v=>v>=1)?'':'Pareto (as defined here) needs every xᵢ ≥ 1.',
      stats:x=>({n:x.length,S:x.reduce((a,b)=>a+Math.log(b),0),C:0}),
      statLab:'Σ ln xᵢ', hat:s=>s.S>0? s.n/s.S : NaN, c:s=>s.n,
      ell:(t,s)=>s.n*Math.log(t)-(t+1)*s.S, formula:'θ̂ = n / Σ ln xᵢ', form2:'ℓ(θ) = n ln θ − (θ+1) Σ ln xᵢ',
      extra:(s,h)=>[['sample mean of ln xᵢ',s.S/s.n],['θ > 1 satisfied?',h>1?'yes':'no: supremum at the boundary']]}
  };
  const st={model:el.dataset.model||'exp', mode:el.dataset.mode||'log', txt:el.dataset.data||'', probe:null};
  if(!st.txt) st.txt=MODELS[st.model].def;
  const f=(v,d)=>{ if(v===-Infinity) return '−∞'; if(typeof v!=='number'||isNaN(v)) return '—'; const a=Math.abs(v); if(a!==0&&(a<1e-3||a>=1e6)) return v.toExponential(2); return (+v.toFixed(d===undefined?4:d)).toString(); };
  el.innerHTML='<div class="grid2" style="align-items:start"><div><svg data-s viewBox="0 0 360 250" style="width:100%;max-width:460px;display:block;background:#18202B;border:1px solid #2A3442;border-radius:8px" role="img" aria-label="likelihood of the single parameter for the typed data with the maximum marked"></svg>'+
    '<p class="note" style="margin:6px 0 0"><span style="color:#60A5FA">━</span> curve &nbsp;<span style="color:#34D399">┆</span> MLE &nbsp;<span style="color:#fff">●</span> probe &nbsp;<span style="color:#F87171">▒</span> not-allowed region (agar ho)</p></div>'+
    '<div><div data-mb style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px"></div>'+
    '<label style="display:flex;gap:8px;align-items:center;font-size:13px;margin:3px 0"><span class="mono" style="min-width:36px">data</span><input data-in type="text" style="flex:1;background:#18202B;color:#fff;border:1px solid #2A3442;border-radius:7px;padding:5px 8px;font:inherit;font-size:13px" aria-label="comma separated data"><button class="btn" data-ap>Apply</button></label>'+
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:6px 0"><button class="btn" data-m="rel">L(θ) / L(θ̂)</button><button class="btn" data-m="log">log-likelihood ℓ(θ)</button></div>'+
    '<label style="display:flex;gap:8px;align-items:center;font-size:13px;margin:3px 0"><span class="mono" style="min-width:36px" data-pl>probe</span><input data-pr type="range" style="flex:1;accent-color:#60A5FA"><span class="mono" data-pv style="min-width:44px;text-align:right"></span></label>'+
    '<div class="tbl-wrap"><table><tbody data-out></tbody></table></div><p class="note" data-msg style="margin:6px 0 0"></p></div></div>';
  const svg=el.querySelector('[data-s]'), out=el.querySelector('[data-out]'), msg=el.querySelector('[data-msg]'), inp=el.querySelector('[data-in]'), pr=el.querySelector('[data-pr]'), pv=el.querySelector('[data-pv]'), mb=el.querySelector('[data-mb]');
  Object.keys(MODELS).forEach(k=>{ const b=document.createElement('button'); b.className='btn'; b.dataset.mod=k; b.textContent=MODELS[k].name; mb.appendChild(b); });
  inp.value=st.txt;
  const L0=44,R0=346,T0=14,B0=206;
  let ctx=null;
  function build(){
    const M=MODELS[st.model]; const x=st.txt.split(/[ ,;]+/).filter(s=>s.length).map(Number);
    if(!x.length||x.some(v=>!isFinite(v))){ ctx=null; svg.innerHTML=''; out.innerHTML=''; msg.textContent='Could not read the data: type numbers separated by commas.'; return; }
    const bad=M.check(x); if(bad){ ctx=null; svg.innerHTML=''; out.innerHTML=''; msg.textContent=bad; return; }
    const s=M.stats(x), h=M.hat(s);
    if(!(h>0)){ ctx=null; svg.innerHTML=''; out.innerHTML=''; msg.textContent='The sufficient statistic is 0, so the derivative recipe fails (boundary case). Change the data.'; return; }
    const c=M.c(s), rel=r=>c*(Math.log(r)-r+1);
    let rlo=1,rhi=1; for(let r=1;r>0.005;r-=0.005){ if(rel(r)<-12) break; rlo=r; } for(let r=1;r<8;r+=0.01){ if(rel(r)<-12) break; rhi=r; }
    rlo=Math.max(0.01,rlo*0.9); rhi=rhi*1.1;
    ctx={M,s,h,x,lo:h*rlo,hi:h*rhi};
    const step=(ctx.hi-ctx.lo)/400; pr.min=ctx.lo; pr.max=ctx.hi; pr.step=step;
    if(st.probe===null||st.probe<ctx.lo||st.probe>ctx.hi) st.probe=Math.min(ctx.hi,Math.max(ctx.lo,h*1.5));
    pr.value=st.probe; el.querySelector('[data-pl]').textContent='probe '+M.sym;
    draw();
  }
  function draw(){
    if(!ctx) return; const {M,s,h,lo,hi}=ctx, lmax=M.ell(h,s), X=t=>L0+(R0-L0)*(t-lo)/(hi-lo);
    const yv=v=>st.mode==='rel'? Math.exp(v-lmax) : Math.max(v,lmax-12);
    const ylo=st.mode==='rel'?0:lmax-12, yhi=st.mode==='rel'?1:lmax, Y=v=>B0-(B0-T0)*(yv(v)-ylo)/(yhi-ylo);
    let g='';
    if(st.model==='par' && lo<1){ g+='<rect x="'+L0+'" y="'+T0+'" width="'+(X(1)-L0)+'" height="'+(B0-T0)+'" fill="#F87171" fill-opacity=".14"/><text x="'+(L0+4)+'" y="'+(T0+12)+'" font-size="10" fill="#fca5a5">θ ≤ 1 not allowed</text>'; }
    for(let i=0;i<=4;i++){ const val=ylo+(yhi-ylo)*i/4, y=B0-(B0-T0)*i/4; g+='<line x1="'+L0+'" x2="'+R0+'" y1="'+y+'" y2="'+y+'" stroke="#2A3442"/><text x="'+(L0-5)+'" y="'+(y+4)+'" text-anchor="end" font-size="10" fill="#a3a3a3">'+(st.mode==='rel'?+val.toFixed(2):+val.toFixed(1))+'</text>'; }
    for(let i=0;i<=5;i++){ const t=lo+(hi-lo)*i/5; g+='<text x="'+X(t)+'" y="'+(B0+15)+'" text-anchor="middle" font-size="10" fill="#a3a3a3">'+(+t.toPrecision(2))+'</text>'; }
    g+='<text x="'+((L0+R0)/2)+'" y="'+(B0+30)+'" text-anchor="middle" font-size="10.5" fill="#d4d4d4">'+M.sym+' (parameter)</text>';
    g+='<text x="12" y="'+((B0+T0)/2)+'" text-anchor="middle" font-size="10.5" fill="#d4d4d4" transform="rotate(-90 12 '+((B0+T0)/2)+')">'+(st.mode==='rel'?'L / L(MLE)':'log-likelihood ℓ')+'</text>';
    g+='<line x1="'+X(h)+'" x2="'+X(h)+'" y1="'+T0+'" y2="'+B0+'" stroke="#34D399" stroke-dasharray="4 4"/><text x="'+Math.min(X(h)+4,R0-72)+'" y="'+(T0+10)+'" font-size="10.5" fill="#34D399">'+M.sym+'̂ = '+f(h,3)+'</text>';
    let d=''; for(let i=0;i<=400;i++){ const t=lo+(hi-lo)*i/400; d+=(i?'L':'M')+X(t).toFixed(1)+','+Y(M.ell(t,s)).toFixed(1); }
    g+='<path d="'+d+'" fill="none" stroke="#60A5FA" stroke-width="2.2"/>';
    const lp=M.ell(st.probe,s); g+='<line x1="'+X(st.probe)+'" x2="'+X(st.probe)+'" y1="'+Y(lp)+'" y2="'+B0+'" stroke="#a3a3a3" stroke-dasharray="2 3"/><circle cx="'+X(st.probe)+'" cy="'+Y(lp)+'" r="5" fill="#fff" stroke="#60A5FA" stroke-width="2"/>';
    svg.innerHTML=g; pv.textContent=f(st.probe,3);
    const R=(a,b)=>'<tr><td>'+a+'</td><td class="num mono">'+b+'</td></tr>', c=M.c(s);
    let rows=R('model · n',M.name+' · '+s.n)+R('sufficient stat '+M.statLab,f(s.S,4))+R(M.formula,f(h,4))+R(M.form2.split('=')[0]+'at MLE — ℓ('+M.sym+'̂)',f(lmax,4))+
      R('ℓ″(MLE) = −c / '+M.sym+'̂²  (c = '+f(c,2)+')',f(-c/(h*h),3)+'  (&lt; 0 ⇒ concave)')+R('probe '+M.sym,f(st.probe,3))+R('ℓ(probe)',f(lp,4))+R('L(probe) / L(MLE)',f(Math.exp(lp-lmax),4));
    M.extra(s,h).forEach(r=>{ rows+=R(r[0],typeof r[1]==='number'?f(r[1],4):r[1]); });
    out.innerHTML=rows;
    msg.textContent='The curve has the same shape in every model: ℓ(θ) − ℓ(θ̂) = c·(ln r − r + 1), r = θ/θ̂. Only c changes (exponential, Pareto: c = n; Poisson: c = Σxᵢ). Larger c ⇒ narrower peak. Formula: '+M.form2+'.';
    el.querySelectorAll('[data-m]').forEach(b=>{ const on=b.dataset.m===st.mode; b.style.borderColor=on?'#60A5FA':''; b.style.color=on?'#fff':'#a3a3a3'; });
    el.querySelectorAll('[data-mod]').forEach(b=>{ const on=b.dataset.mod===st.model; b.style.borderColor=on?'#60A5FA':''; b.style.color=on?'#fff':'#a3a3a3'; });
  }
  el.querySelectorAll('[data-mod]').forEach(b=>b.addEventListener('click',()=>{ st.model=b.dataset.mod; st.txt=MODELS[st.model].def; inp.value=st.txt; st.probe=null; build(); }));
  el.querySelectorAll('[data-m]').forEach(b=>b.addEventListener('click',()=>{ st.mode=b.dataset.m; draw(); }));
  el.querySelector('[data-ap]').addEventListener('click',()=>{ st.txt=inp.value; st.probe=null; build(); });
  inp.addEventListener('keydown',ev=>{ if(ev.key==='Enter'){ st.txt=inp.value; st.probe=null; build(); } });
  pr.addEventListener('input',()=>{ st.probe=+pr.value; draw(); });
  build();
  el.querySelectorAll('[data-mod]').forEach(b=>{ const on=b.dataset.mod===st.model; b.style.borderColor=on?'#60A5FA':''; b.style.color=on?'#fff':'#a3a3a3'; });
}

/* ===== Widget (B24+): Beta prior -> posterior explorer (Bernoulli data, conjugate update) ===== */
function betaupd(el){
  const st={a:+(el.dataset.a||2), b:+(el.dataset.b||2), n:+(el.dataset.n||10), k:+(el.dataset.k||7), zoom:(el.dataset.zoom||'full')};
  if(st.k>st.n) st.k=st.n;
  function lgam(z){
    if(z<0.5) return Math.log(Math.PI/Math.sin(Math.PI*z))-lgam(1-z);
    z-=1; const c=[0.99999999999980993,676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,12.507343278686905,-0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];
    let x=c[0]; for(let i=1;i<9;i++) x+=c[i]/(z+i); const t=z+7.5;
    return 0.5*Math.log(2*Math.PI)+(z+0.5)*Math.log(t)-t+Math.log(x);
  }
  const lbeta=(a,b)=>lgam(a)+lgam(b)-lgam(a+b);
  const pdf=(x,a,b)=>Math.exp((a-1)*Math.log(x)+(b-1)*Math.log(1-x)-lbeta(a,b));
  const f=(v,d)=>{ if(typeof v!=='number'||isNaN(v)) return '—'; return (+v.toFixed(d===undefined?4:d)).toString(); };
  const PRE=[['P4/P5 · Beta(4,3), 13 pts, 8 ones',4,3,13,8],['P6/P7 · Beta(1,1), 100 pts, 10 ones',1,1,100,10],['P8 · Beta(1,1), 100 pts, 3 ones',1,1,100,3],['P8 · Beta(0.5,0.5), 100 pts, 3 ones',0.5,0.5,100,3],['P2 · Beta(3,4), 50 pts, 15 ones',3,4,50,15]];
  const sl=(key,lab,mn,mx,stp)=>'<label style="display:flex;gap:8px;align-items:center;font-size:13px;margin:3px 0"><span class="mono" style="min-width:74px">'+lab+'</span><input type="range" min="'+mn+'" max="'+mx+'" step="'+stp+'" value="'+st[key]+'" data-k="'+key+'" style="flex:1;accent-color:#60A5FA"><span class="mono" data-v="'+key+'" style="min-width:42px;text-align:right">'+st[key]+'</span></label>';
  el.innerHTML='<div class="grid2" style="align-items:start"><div><svg data-s viewBox="0 0 360 250" style="width:100%;max-width:460px;display:block;background:#18202B;border:1px solid #2A3442;border-radius:8px" role="img" aria-label="Prior, normalised likelihood and posterior Beta densities for the chosen prior and Bernoulli data, with posterior mean and mode marked"></svg>'+
    '<p class="note" style="margin:6px 0 0"><span style="color:#a3a3a3">┅</span> prior &nbsp;<span style="color:#60A5FA">┅</span> likelihood (area-normalised) &nbsp;<span style="color:#34D399">━</span> posterior &nbsp;<span style="color:#34D399">┆</span> post. mean &nbsp;<span style="color:#FBBF24">┆</span> post. mode</p></div>'+
    '<div><div data-pb style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px"></div><div data-sl></div>'+
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 8px"><button class="btn" data-z="full">x-axis: poora [0,1]</button><button class="btn" data-z="zoom">x-axis: zoom to posterior</button></div>'+
    '<div class="tbl-wrap"><table><tbody data-out></tbody></table></div><p class="note" data-msg style="margin:6px 0 0"></p></div></div>';
  const svg=el.querySelector('[data-s]'), out=el.querySelector('[data-out]'), msg=el.querySelector('[data-msg]'), slb=el.querySelector('[data-sl]'), pb=el.querySelector('[data-pb]');
  PRE.forEach((p,i)=>{ const b=document.createElement('button'); b.className='btn'; b.dataset.pre=i; b.textContent=p[0]; pb.appendChild(b); });
  function sliders(){ slb.innerHTML=sl('a','prior α',0.5,20,0.5)+sl('b','prior β',0.5,20,0.5)+sl('n','n (points)',0,200,1)+sl('k','k (ones)',0,st.n,1); const kk=slb.querySelector('input[data-k="k"]'); kk.max=st.n; }
  sliders();
  const L0=44,R0=346,T0=14,B0=206;
  function draw(){
    const a=st.a,b=st.b,n=st.n,k=st.k, A=a+k, B=b+n-k, pm=A/(A+B), sd=Math.sqrt(A*B/((A+B)*(A+B)*(A+B+1)));
    let x0=0,x1=1; if(st.zoom==='zoom'){ x0=Math.max(0,pm-5*sd); x1=Math.min(1,pm+5*sd); }
    const N=400, xs=[]; for(let i=0;i<N;i++) xs.push(x0+(x1-x0)*(i+0.5)/N);
    const post=xs.map(x=>pdf(x,A,B)), pri=xs.map(x=>pdf(x,a,b)), lik=xs.map(x=>pdf(x,k+1,n-k+1));
    const pk=Math.max.apply(null,post), cap=pk*1.6;
    const ymax=Math.min(Math.max(pk, Math.max.apply(null,lik.map(v=>Math.min(v,cap))), Math.max.apply(null,pri.map(v=>Math.min(v,cap))))*1.12, cap*1.12);
    const X=p=>L0+(R0-L0)*(p-x0)/(x1-x0), Y=v=>B0-(B0-T0)*Math.min(v,ymax)/ymax;
    let g='';
    for(let i=0;i<=4;i++){ const val=ymax*i/4, y=B0-(B0-T0)*i/4; g+='<line x1="'+L0+'" x2="'+R0+'" y1="'+y+'" y2="'+y+'" stroke="#2A3442"/><text x="'+(L0-5)+'" y="'+(y+4)+'" text-anchor="end" font-size="10" fill="#a3a3a3">'+f(val,val<10?1:0)+'</text>'; }
    for(let i=0;i<=5;i++){ const pv=x0+(x1-x0)*i/5; g+='<text x="'+X(pv)+'" y="'+(B0+15)+'" text-anchor="middle" font-size="10" fill="#a3a3a3">'+f(pv,(x1-x0)<0.3?3:2)+'</text>'; }
    g+='<text x="'+((L0+R0)/2)+'" y="'+(B0+30)+'" text-anchor="middle" font-size="10.5" fill="#d4d4d4">p (Bernoulli parameter)</text>';
    g+='<text x="12" y="'+((B0+T0)/2)+'" text-anchor="middle" font-size="10.5" fill="#d4d4d4" transform="rotate(-90 12 '+((B0+T0)/2)+')">density</text>';
    const path=(arr,col,w,dash)=>{ let d=''; arr.forEach((v,i)=>{ d+=(i?'L':'M')+X(xs[i]).toFixed(1)+','+Y(v).toFixed(1); }); return '<path d="'+d+'" fill="none" stroke="'+col+'" stroke-width="'+w+'"'+(dash?' stroke-dasharray="'+dash+'"':'')+'/>'; };
    g+=path(pri,'#a3a3a3',1.8,'4 4'); g+=path(lik,'#60A5FA',1.8,'2 3'); g+=path(post,'#34D399',2.6);
    const lines=[]; if(pm>=x0&&pm<=x1) lines.push([pm,'#34D399','mean']);
    const modeOK=(A>1&&B>1), md=modeOK?(A-1)/(A+B-2):null; if(modeOK&&md>=x0&&md<=x1) lines.push([md,'#FBBF24','mode']);
    lines.forEach((l,i)=>{ g+='<line x1="'+X(l[0])+'" x2="'+X(l[0])+'" y1="'+T0+'" y2="'+B0+'" stroke="'+l[1]+'" stroke-dasharray="4 4"/>'; });
    if(n>0){ const mle=k/n; if(mle>=x0&&mle<=x1) g+='<path d="M'+X(mle)+','+(B0)+' l-5,9 l10,0 z" fill="#60A5FA"/>'; }
    svg.innerHTML=g;
    const R=(u,v)=>'<tr><td>'+u+'</td><td class="num mono">'+v+'</td></tr>';
    const w=(a+b)/(a+b+n), prm=a/(a+b), mle=n>0?k/n:NaN;
    out.innerHTML=R('prior Beta(α, β)','Beta('+f(a,2)+', '+f(b,2)+')')+R('data: n, k (ones), n − k (zeros)',n+', '+k+', '+(n-k))+
      R('posterior Beta(α+k, β+n−k)','Beta('+f(A,2)+', '+f(B,2)+')')+R('check: α′+β′ = α+β+n',f(A+B,2)+' = '+f(a+b+n,2))+
      R('prior mean α/(α+β)',f(prm))+R('MLE k/n',n>0?f(mle):'—')+
      R('weight on prior mean w = (α+β)/(α+β+n)',f(w))+R('w·prior mean + (1−w)·MLE',n>0?f(w*prm+(1-w)*mle):'—')+
      R('<b>posterior mean α′/(α′+β′)</b>','<b>'+f(pm)+'</b>')+
      R('posterior mode (α′−1)/(α′+β′−2)', modeOK?f(md):'n/a (α′ ya β′ ≤ 1)')+R('posterior sd',f(sd));
    msg.textContent = n===0 ? 'n = 0: no data ⇒ posterior = prior, so the posterior mean equals the prior mean.' :
      (!modeOK ? 'α′ or β′ ≤ 1: the density is largest at a boundary (0 or 1), so the mode formula (α′−1)/(α′+β′−2) does not apply; only the mean is given.' :
       ((st.a===1&&st.b===1) ? 'Beta(1,1) = uniform prior ⇒ posterior mode = MLE = k/n, while the posterior mean (k+1)/(n+2) is pulled slightly towards 1/2.' :
        'Increase n: w falls and the posterior mean moves towards the MLE (the prior washes out). Decrease n: the posterior stays near the prior.'));
    el.querySelectorAll('[data-z]').forEach(bt=>{ const on=bt.dataset.z===st.zoom; bt.style.borderColor=on?'#60A5FA':''; bt.style.color=on?'#fff':'#a3a3a3'; });
  }
  slb.addEventListener('input',ev=>{ const t=ev.target; if(!t.dataset||!t.dataset.k) return; st[t.dataset.k]=+t.value;
    if(t.dataset.k==='n'){ if(st.k>st.n) st.k=st.n; const kk=slb.querySelector('input[data-k="k"]'); kk.max=st.n; kk.value=st.k; slb.querySelector('[data-v="k"]').textContent=st.k; }
    slb.querySelector('[data-v="'+t.dataset.k+'"]').textContent=t.value; draw(); });
  pb.addEventListener('click',ev=>{ const bt=ev.target.closest('button'); if(!bt||bt.dataset.pre===undefined) return; const p=PRE[+bt.dataset.pre]; st.a=p[1]; st.b=p[2]; st.n=p[3]; st.k=p[4]; sliders(); draw(); });
  el.querySelectorAll('[data-z]').forEach(bt=>bt.addEventListener('click',()=>{ st.zoom=bt.dataset.z; draw(); }));
  draw();
}

/* ===== Widget (B25+): 1-D two-component GMM — weighted densities, mixture and responsibility gamma_1(x) ===== */
function gmmresp(el){
  const st={pi:+(el.dataset.pi||0.3), m1:+(el.dataset.m1||0), m2:+(el.dataset.m2||1), v1:+(el.dataset.v1||1), v2:+(el.dataset.v2||2), x:+(el.dataset.x||1.2)};
  const N=(x,m,v)=>Math.exp(-(x-m)*(x-m)/(2*v))/Math.sqrt(2*Math.PI*v);
  const f=(v,d)=>{ if(typeof v!=='number'||isNaN(v)) return '—'; return (+v.toFixed(d===undefined?4:d)).toString(); };
  const PRE=[['2023 Jul Q12: π₁=.3, μ=(0,1), σ²=(1,2), x=1.2',.3,0,1,1,2,1.2],['2025 Feb Q11: π₁=.5, μ=(1,3), σ²=(1,1), x=1',.5,1,3,1,1,1],['2025 Oct Q15: π₁=.3, μ=(2,3), σ²=(1,1), x=1',.3,2,3,1,1,1],['Variant: π₁=.4, μ=(0,6), σ²=(1,2), x=3',.4,0,6,1,2,3]];
  const sl=(key,lab,mn,mx,stp)=>'<label style="display:flex;gap:8px;align-items:center;font-size:13px;margin:3px 0"><span class="mono" style="min-width:48px">'+lab+'</span><input type="range" min="'+mn+'" max="'+mx+'" step="'+stp+'" value="'+st[key]+'" data-k="'+key+'" style="flex:1;accent-color:#60A5FA"><span class="mono" data-v="'+key+'" style="min-width:40px;text-align:right">'+st[key]+'</span></label>';
  el.innerHTML='<div class="grid2" style="align-items:start"><div><svg data-s viewBox="0 0 360 310" style="width:100%;max-width:460px;display:block;background:#18202B;border:1px solid #2A3442;border-radius:8px" role="img" aria-label="Top: weighted component densities and mixture density of a two-component Gaussian mixture with the probe x marked. Bottom: responsibility of component 1 as a function of x with the 0.5 line"></svg>'+
    '<p class="note" style="margin:6px 0 0"><span style="color:#60A5FA">┅</span> π₁N₁ &nbsp;<span style="color:#FBBF24">┅</span> π₂N₂ &nbsp;<span style="color:#34D399">━</span> p(x)=π₁N₁+π₂N₂ (top) / γ₁(x) (bottom) &nbsp;<span style="color:#F87171">┆</span> probe x</p></div>'+
    '<div><div data-pb style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px"></div><div data-sl></div><div class="tbl-wrap"><table><tbody data-out></tbody></table></div><p class="note" data-msg style="margin:6px 0 0"></p></div></div>';
  const svg=el.querySelector('[data-s]'), out=el.querySelector('[data-out]'), msg=el.querySelector('[data-msg]'), slb=el.querySelector('[data-sl]'), pb=el.querySelector('[data-pb]');
  PRE.forEach((p,i)=>{ const b=document.createElement('button'); b.className='btn'; b.dataset.pre=i; b.textContent=p[0]; pb.appendChild(b); });
  function sliders(){ slb.innerHTML=sl('pi','π₁',0.05,0.95,0.05)+sl('m1','μ₁',-5,8,0.5)+sl('m2','μ₂',-5,8,0.5)+sl('v1','σ₁²',0.25,4,0.25)+sl('v2','σ₂²',0.25,4,0.25)+sl('x','probe x',-6,10,0.1); }
  sliders();
  const L0=40,R0=346;
  function draw(){
    const pi1=st.pi, pi2=1-st.pi, sd=Math.sqrt(Math.max(st.v1,st.v2));
    const x0=Math.min(st.m1,st.m2,st.x)-3.5*sd, x1=Math.max(st.m1,st.m2,st.x)+3.5*sd;
    const n=300, xs=[]; for(let i=0;i<n;i++) xs.push(x0+(x1-x0)*i/(n-1));
    const j1=xs.map(x=>pi1*N(x,st.m1,st.v1)), j2=xs.map(x=>pi2*N(x,st.m2,st.v2)), mix=j1.map((v,i)=>v+j2[i]);
    const gm=xs.map((x,i)=>mix[i]>0?j1[i]/mix[i]:0);
    const ymax=Math.max.apply(null,mix)*1.12;
    const X=p=>L0+(R0-L0)*(p-x0)/(x1-x0), Y1=v=>138-(138-14)*v/ymax, Y2=v=>268-(268-176)*v;
    let g='';
    g+='<line x1="'+L0+'" x2="'+R0+'" y1="138" y2="138" stroke="#3A4555"/><line x1="'+L0+'" x2="'+R0+'" y1="268" y2="268" stroke="#3A4555"/>';
    [0,0.5,1].forEach(v=>{ g+='<line x1="'+L0+'" x2="'+R0+'" y1="'+Y2(v)+'" y2="'+Y2(v)+'" stroke="'+(v===0.5?'#7f6a1f':'#2A3442')+'"'+(v===0.5?' stroke-dasharray="4 4"':'')+'/><text x="'+(L0-5)+'" y="'+(Y2(v)+4)+'" text-anchor="end" font-size="10" fill="#a3a3a3">'+v+'</text>'; });
    g+='<text x="'+(L0-5)+'" y="'+(Y1(ymax/1.12)+4)+'" text-anchor="end" font-size="10" fill="#a3a3a3">'+f(ymax/1.12,2)+'</text><text x="'+(L0-5)+'" y="142" text-anchor="end" font-size="10" fill="#a3a3a3">0</text>';
    for(let i=0;i<=5;i++){ const pv=x0+(x1-x0)*i/5; g+='<text x="'+X(pv)+'" y="284" text-anchor="middle" font-size="10" fill="#a3a3a3">'+f(pv,1)+'</text>'; }
    g+='<text x="'+((L0+R0)/2)+'" y="300" text-anchor="middle" font-size="10.5" fill="#d4d4d4">x</text>';
    g+='<text x="10" y="76" text-anchor="middle" font-size="10" fill="#d4d4d4" transform="rotate(-90 10 76)">density</text><text x="10" y="222" text-anchor="middle" font-size="10" fill="#d4d4d4" transform="rotate(-90 10 222)">γ₁(x)</text>';
    const P=(arr,Y,col,w,dash)=>{ let d=''; arr.forEach((v,i)=>{ d+=(i?'L':'M')+X(xs[i]).toFixed(1)+','+Y(v).toFixed(1); }); return '<path d="'+d+'" fill="none" stroke="'+col+'" stroke-width="'+w+'"'+(dash?' stroke-dasharray="'+dash+'"':'')+'/>'; };
    g+=P(j1,Y1,'#60A5FA',1.6,'4 4')+P(j2,Y1,'#FBBF24',1.6,'4 4')+P(mix,Y1,'#34D399',2.4)+P(gm,Y2,'#34D399',2.4);
    g+='<line x1="'+X(st.x)+'" x2="'+X(st.x)+'" y1="14" y2="268" stroke="#F87171" stroke-dasharray="3 3"/>';
    const a=pi1*N(st.x,st.m1,st.v1), b=pi2*N(st.x,st.m2,st.v2), px=a+b, gam=px>0?a/px:NaN;
    if(!isNaN(gam)) g+='<circle cx="'+X(st.x)+'" cy="'+Y2(gam)+'" r="4.5" fill="#F87171"/>';
    svg.innerHTML=g;
    const R=(u,v)=>'<tr><td>'+u+'</td><td class="num mono">'+v+'</td></tr>';
    out.innerHTML=R('N(x; μ₁, σ₁²)',f(N(st.x,st.m1,st.v1)))+R('N(x; μ₂, σ₂²)',f(N(st.x,st.m2,st.v2)))+
      R('π₁·N₁ (joint, comp 1)',f(a,5))+R('π₂·N₂ (joint, comp 2)',f(b,5))+R('p(x) = π₁N₁ + π₂N₂',f(px,5))+
      R('<b>γ₁ = π₁N₁ / p(x)</b>','<b>'+f(gam)+'</b>')+R('γ₂ = 1 − γ₁',f(1-gam))+R('odds γ₁/γ₂ = π₁N₁ / π₂N₂',f(b>0?a/b:Infinity,4))+
      R('MAP rule (γ₁ ≤ 0.5 ⇒ comp 2)',isNaN(gam)?'—':(gam>0.5?'component 1':'component 2'));
    msg.textContent = (px<1e-12) ? 'The probe x is far from both components: p(x) ≈ 0, so γ is numerically unstable (close to 0/0).' :
      (Math.abs(st.v1-st.v2)<1e-9 ? 'σ₁² = σ₂²: γ₁(x) is a smooth sigmoid and crosses 0.5 at exactly one point (x*).' :
       'σ₁² ≠ σ₂²: the larger-variance component wins in both tails, so γ₁ can cross 0.5 at two points.');
    el.querySelectorAll('[data-pb] button').forEach(()=>{});
  }
  slb.addEventListener('input',ev=>{ const t=ev.target; if(!t.dataset||!t.dataset.k) return; st[t.dataset.k]=+t.value; slb.querySelector('[data-v="'+t.dataset.k+'"]').textContent=t.value; draw(); });
  pb.addEventListener('click',ev=>{ const bt=ev.target.closest('button'); if(!bt||bt.dataset.pre===undefined) return; const p=PRE[+bt.dataset.pre]; st.pi=p[1]; st.m1=p[2]; st.m2=p[3]; st.v1=p[4]; st.v2=p[5]; st.x=p[6]; sliders(); draw(); });
  draw();
}

/* ===== B26 widgets: mstep (M-step explorer), gd1d (1-D gradient descent) ===== */
function mstepCalc(x,g){
  const n=x.length, g2=g.map(v=>1-v), out=[];
  [g,g2].forEach(gk=>{
    const N=gk.reduce((a,b)=>a+b,0);
    if(N<1e-9){ out.push({N:N,pi:N/n,mu:NaN,s2:NaN}); return; }
    const mu=gk.reduce((a,gv,i)=>a+gv*x[i],0)/N;
    const s2=gk.reduce((a,gv,i)=>a+gv*(x[i]-mu)*(x[i]-mu),0)/N;
    out.push({N:N,pi:N/n,mu:mu,s2:s2});
  });
  return out;
}
function gdIter(L,eta,w0,T){ const tr=[w0]; let w=w0; for(let t=0;t<T;t++){ w=w-eta*L*w; tr.push(w); } return tr; }

function mstep(el){
  const parse=s=>String(s||'').split(',').map(v=>+v.trim()).filter(v=>!isNaN(v));
  let x=parse(el.dataset.x||'1,2,6'), g=parse(el.dataset.g||'0.9,0.8,0.1');
  if(g.length!==x.length) g=x.map(()=>0.5);
  const START=[x.slice(),g.slice()];
  const PRE=[
    ['Start (page data)',START[0],START[1]],
    ['Ex1: x=1,2,6',[1,2,6],[0.9,0.8,0.1]],
    ['7.5 · EM soft (x=0,1,4,9)',[0,1,4,9],[1,1,0.9707,0]],
    ['7.5 · Lloyd (hard)',[0,1,4,9],[1,1,1,0]],
    ['Hard: round current γ₁',null,null],
    ['Sab γ₁ = 0.5',null,null]
  ];
  const f=(v,d)=>{ if(typeof v!=='number'||isNaN(v)) return '—'; return (+v.toFixed(d===undefined?3:d)).toString(); };
  el.innerHTML='<div class="grid2" style="align-items:start"><div><svg data-s viewBox="0 0 360 200" style="width:100%;max-width:460px;display:block;background:#18202B;border:1px solid #2A3442;border-radius:8px" role="img" aria-label="Two lanes of data points with circle area proportional to responsibility, triangles at the new means and bars of plus or minus sigma"></svg>'+
    '<p class="note" style="margin:6px 0 0"><span style="color:#60A5FA">●</span> component 1 (area ∝ γ₁) &nbsp;<span style="color:#FBBF24">●</span> component 2 (area ∝ γ₂) &nbsp;▲ new μ_k &nbsp;━ ±σ_k</p></div>'+
    '<div><div data-pb style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px"></div><div data-sl></div><div class="tbl-wrap"><table><thead><tr><th></th><th>comp 1</th><th>comp 2</th></tr></thead><tbody data-out></tbody></table></div><p class="note" data-msg style="margin:6px 0 0"></p></div></div>';
  const svg=el.querySelector('[data-s]'), out=el.querySelector('[data-out]'), msg=el.querySelector('[data-msg]'), slb=el.querySelector('[data-sl]'), pb=el.querySelector('[data-pb]');
  PRE.forEach((p,i)=>{ const b=document.createElement('button'); b.className='btn'; b.dataset.pre=i; b.textContent=p[0]; pb.appendChild(b); });
  function sliders(){
    slb.innerHTML=x.map((xv,i)=>'<label style="display:flex;gap:8px;align-items:center;font-size:13px;margin:3px 0"><span class="mono" style="min-width:64px">x='+f(xv,2)+'</span><input type="range" min="0" max="1" step="0.01" value="'+g[i]+'" data-i="'+i+'" aria-label="gamma 1 for point '+(i+1)+'" style="flex:1"><span class="mono" data-v="'+i+'" style="min-width:40px;text-align:right">'+f(g[i],2)+'</span></label>').join('');
  }
  function draw(){
    const r=mstepCalc(x,g), lo=Math.min.apply(null,x)-1.5, hi=Math.max.apply(null,x)+1.5, L0=24, R0=340;
    const X=v=>L0+(R0-L0)*(v-lo)/(hi-lo);
    let s='<line x1="'+L0+'" x2="'+R0+'" y1="62" y2="62" stroke="#2A3442"/><line x1="'+L0+'" x2="'+R0+'" y1="136" y2="136" stroke="#2A3442"/>';
    for(let i=0;i<=5;i++){ const v=lo+(hi-lo)*i/5; s+='<text x="'+X(v).toFixed(1)+'" y="192" text-anchor="middle" font-size="10" fill="#a3a3a3">'+f(v,1)+'</text>'; }
    s+='<text x="8" y="28" font-size="10" fill="#60A5FA">comp 1</text><text x="8" y="102" font-size="10" fill="#FBBF24">comp 2</text>';
    x.forEach((xv,i)=>{
      [[g[i],62,'#60A5FA'],[1-g[i],136,'#FBBF24']].forEach(a=>{
        const gm=a[0]; const rad=gm>0.004?Math.max(1.5,11*Math.sqrt(gm)):1.2;
        s+='<circle cx="'+X(xv).toFixed(1)+'" cy="'+a[1]+'" r="'+rad.toFixed(1)+'" fill="'+a[2]+'" fill-opacity="'+(gm>0.004?0.75:0.3)+'"/>';
      });
    });
    r.forEach((k,j)=>{
      const y=j===0?62:136, col=j===0?'#60A5FA':'#FBBF24';
      if(isNaN(k.mu)) return;
      const sd=Math.sqrt(Math.max(k.s2,0));
      s+='<polygon points="'+(X(k.mu)-6).toFixed(1)+','+(y+26)+' '+(X(k.mu)+6).toFixed(1)+','+(y+26)+' '+X(k.mu).toFixed(1)+','+(y+16)+'" fill="'+col+'" stroke="#fff" stroke-width="0.8"/>';
      s+='<line x1="'+X(k.mu-sd).toFixed(1)+'" x2="'+X(k.mu+sd).toFixed(1)+'" y1="'+(y+32)+'" y2="'+(y+32)+'" stroke="'+col+'" stroke-width="2.2"/>';
    });
    svg.innerHTML=s;
    const R=(u,a,b)=>'<tr><td>'+u+'</td><td class="num mono">'+a+'</td><td class="num mono">'+b+'</td></tr>';
    out.innerHTML=R('N_k = Σγ',f(r[0].N),f(r[1].N))+R('π_k = N_k/n',f(r[0].pi),f(r[1].pi))+R('<b>μ_k = Σγx / N_k</b>','<b>'+f(r[0].mu)+'</b>','<b>'+f(r[1].mu)+'</b>')+R('σ²_k = Σγ(x−μ_k)² / N_k',f(r[0].s2),f(r[1].s2));
    const hard=g.every(v=>v<1e-9||v>1-1e-9);
    msg.textContent = hard ? 'All γ ∈ {0,1}: N_k is the cluster size and μ_k the plain cluster average, which is the Lloyd update.' :
      ((r[0].N<1e-9||r[1].N<1e-9)?'One component has N_k ≈ 0: its μ and σ² are undefined (0/0).':'Soft γ: each point pulls μ_k in proportion to γ; π_k = N_k/n is a fractional cluster size.');
  }
  slb.addEventListener('input',ev=>{ const t=ev.target; if(t.dataset.i===undefined) return; g[+t.dataset.i]=+t.value; slb.querySelector('[data-v="'+t.dataset.i+'"]').textContent=f(+t.value,2); draw(); });
  pb.addEventListener('click',ev=>{
    const bt=ev.target.closest('button'); if(!bt||bt.dataset.pre===undefined) return; const k=+bt.dataset.pre, p=PRE[k];
    if(p[1]){ x=p[1].slice(); g=p[2].slice(); } else if(k===4){ g=g.map(v=>v>=0.5?1:0); } else { g=g.map(()=>0.5); }
    sliders(); draw();
  });
  sliders(); draw();
}

function gd1d(el){
  const L=+(el.dataset.L||4), w0=+(el.dataset.w0||1); let eta=+(el.dataset.eta||0.25); let k=eta*L;
  const f=(v,d)=>{ if(typeof v!=='number'||isNaN(v)) return '—'; if(!isFinite(v)) return '∞'; return (+v.toFixed(d===undefined?4:d)).toString(); };
  el.innerHTML='<div class="grid2" style="align-items:start"><div><svg data-s viewBox="0 0 360 230" style="width:100%;max-width:460px;display:block;background:#18202B;border:1px solid #2A3442;border-radius:8px" role="img" aria-label="Parabola with the successive gradient descent iterates marked"></svg>'+
    '<p class="note" style="margin:6px 0 0">━ f(w) = ½Lw² &nbsp; ● iterates w₀…w₈ (lal = pehla, neela baaki)</p></div>'+
    '<div><label style="display:flex;gap:8px;align-items:center;font-size:13px;margin:3px 0"><span class="mono" style="min-width:48px">η·L</span><input type="range" min="0.05" max="2.4" step="0.05" value="'+k+'" data-k aria-label="eta times L" style="flex:1"><span class="mono" data-kv style="min-width:40px;text-align:right"></span></label>'+
    '<div class="tbl-wrap"><table><tbody data-out></tbody></table></div><p class="note" data-msg style="margin:6px 0 0"></p></div></div>';
  const svg=el.querySelector('[data-s]'), out=el.querySelector('[data-out]'), msg=el.querySelector('[data-msg]'), sl=el.querySelector('[data-k]'), kv=el.querySelector('[data-kv]');
  function draw(){
    const eta2=k/L, tr=gdIter(L,eta2,w0,8), W=Math.max(Math.abs(w0)*1.15,0.5), L0=16,R0=344, B=206, T=16;
    const X=w=>L0+(R0-L0)*(w+W)/(2*W), fmax=0.5*L*W*W, Y=v=>B-(B-T)*Math.min(v,fmax)/fmax;
    let s='<line x1="'+L0+'" x2="'+R0+'" y1="'+B+'" y2="'+B+'" stroke="#3A4555"/><line x1="'+X(0)+'" x2="'+X(0)+'" y1="'+T+'" y2="'+B+'" stroke="#2A3442" stroke-dasharray="3 3"/>';
    let d=''; for(let i=0;i<=80;i++){ const w=-W+2*W*i/80; d+=(i?'L':'M')+X(w).toFixed(1)+','+Y(0.5*L*w*w).toFixed(1); }
    s+='<path d="'+d+'" fill="none" stroke="#34D399" stroke-width="2.2"/>';
    let path=''; tr.forEach((w,i)=>{ if(Math.abs(w)<=W*1.0){ path+=(path?'L':'M')+X(w).toFixed(1)+','+Y(0.5*L*w*w).toFixed(1); } });
    if(path) s+='<path d="'+path+'" fill="none" stroke="#8a8a8a" stroke-width="1" stroke-dasharray="3 3"/>';
    tr.forEach((w,i)=>{ if(Math.abs(w)<=W){ s+='<circle cx="'+X(w).toFixed(1)+'" cy="'+Y(0.5*L*w*w).toFixed(1)+'" r="'+(i===0?5:3.6)+'" fill="'+(i===0?'#F87171':'#60A5FA')+'"/>'; } });
    for(let i=0;i<=4;i++){ const w=-W+2*W*i/4; s+='<text x="'+X(w).toFixed(1)+'" y="222" text-anchor="middle" font-size="10" fill="#a3a3a3">'+f(w,2)+'</text>'; }
    svg.innerHTML=s; kv.textContent=f(k,2);
    const R=(u,v)=>'<tr><td>'+u+'</td><td class="num mono">'+v+'</td></tr>';
    out.innerHTML=R('L (curvature)',f(L,2))+R('η = (η·L)/L',f(eta2,4))+R('2/L (seema)',f(2/L,4))+R('error factor (1 − ηL)',f(1-k,2))+tr.slice(0,6).map((w,i)=>R('w_'+i,f(w,4))).join('');
    const kk=Math.round(k*1000)/1000;
    msg.textContent = kk<1 ? 'η < 1/L: the error shrinks monotonically from one side.' : kk===1 ? 'η = 1/L: reaches the minimum in one step (in this 1-D case).' : kk<2 ? '1/L < η < 2/L: it converges while zigzagging.' : kk===2 ? 'η = 2/L: w_t = ±w₀ (oscillation): it does not converge.' : 'η > 2/L: har step bada, diverge.';
  }
  sl.addEventListener('input',()=>{ k=+sl.value; draw(); });
  draw();
}

window.Q1W={drawChart,proj2d,vardir,gram2,kmstep,vcells,kmpp,bernlik,mlecurve,betaupd,gmmresp,mstep,gd1d};
})();
