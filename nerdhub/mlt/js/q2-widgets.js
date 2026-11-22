/* Quiz 2 interactive explorers. Each widget takes a <div data-widget="..."> and builds itself.
   They sit on the slate explorer panel (.q1.q1w) and add themselves to window.Q1W. */
(function () {
  const C = { grid: '#2A3442', axis: '#4A5566', text: '#A3ABB8', ink: '#E6E9EF', a: '#60A5FA', b: '#FBBF24', good: '#34D399', bad: '#F87171', hl: '#FFE066' };
  const f = (v, d) => (Math.abs(v) < 1e-12 ? 0 : v).toFixed(d == null ? 3 : d);
  const nums = s => s.split(';').filter(Boolean).map(r => r.split(',').map(Number));
  function shell(el, title) {
    el.innerHTML = '<div class="w2"><div class="w2t">' + title + '</div><div class="w2g"><div class="w2p"></div><div class="w2side"><div class="w2c"></div><div class="w2r"></div></div></div></div>';
    return { plot: el.querySelector('.w2p'), ctl: el.querySelector('.w2c'), out: el.querySelector('.w2r') };
  }
  function slider(host, label, min, max, step, val, on) {
    const row = document.createElement('label'); row.className = 'w2s';
    row.innerHTML = '<span>' + label + '</span><input type="range" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '"><b></b>';
    const inp = row.querySelector('input'), b = row.querySelector('b');
    const upd = () => { b.textContent = (+inp.value).toFixed(step < 1 ? (step < 0.1 ? 2 : 1) : 0); on(+inp.value); };
    inp.addEventListener('input', upd); host.appendChild(row); b.textContent = (+val).toFixed(step < 1 ? (step < 0.1 ? 2 : 1) : 0);
    return inp;
  }
  function button(host, txt, on) { const b = document.createElement('button'); b.type = 'button'; b.className = 'w2b'; b.textContent = txt; b.addEventListener('click', on); host.appendChild(b); return b; }
  function table(rows) { return '<table class="w2tab">' + rows.map(r => '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>').join('') + '</table>'; }
  /* plotting frame */
  function frame(W, H, xr, yr, pad) {
    pad = pad || [34, 12, 14, 26];
    const X = x => pad[0] + (W - pad[0] - pad[1]) * (x - xr[0]) / (xr[1] - xr[0]);
    const Y = y => H - pad[3] - (H - pad[2] - pad[3]) * (y - yr[0]) / (yr[1] - yr[0]);
    function axes(xt, yt, xl, yl) {
      let g = '';
      xt.forEach(t => { g += '<line x1="' + X(t) + '" y1="' + pad[2] + '" x2="' + X(t) + '" y2="' + (H - pad[3]) + '" stroke="' + C.grid + '"/><text x="' + X(t) + '" y="' + (H - pad[3] + 15) + '" fill="' + C.text + '" font-size="10" text-anchor="middle">' + t + '</text>'; });
      yt.forEach(t => { g += '<line x1="' + pad[0] + '" y1="' + Y(t) + '" x2="' + (W - pad[1]) + '" y2="' + Y(t) + '" stroke="' + C.grid + '"/><text x="' + (pad[0] - 5) + '" y="' + (Y(t) + 3) + '" fill="' + C.text + '" font-size="10" text-anchor="end">' + t + '</text>'; });
      if (xl) g += '<text x="' + (W - pad[1]) + '" y="' + (H - 2) + '" fill="' + C.text + '" font-size="10" text-anchor="end">' + xl + '</text>';
      if (yl) g += '<text x="' + (pad[0] + 6) + '" y="' + (pad[2] + 11) + '" fill="' + C.text + '" font-size="10">' + yl + '</text>';
      return g;
    }
    return { X, Y, axes, W, H };
  }
  const svg = (W, H, inner, label) => '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + label + '" style="width:100%;height:auto;display:block">' + inner + '</svg>';
  const ticks = (a, b, n) => { const s = (b - a) / n, o = []; for (let i = 0; i <= n; i++) o.push(+(a + i * s).toFixed(2)); return o; };
  function solve(A, y) { /* Gaussian elimination with partial pivoting */
    const n = y.length, M = A.map((r, i) => r.concat([y[i]]));
    for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r; [M[c], M[p]] = [M[p], M[c]];
      for (let r = 0; r < n; r++) { if (r === c) continue; const k = M[r][c] / M[c][c]; for (let j = c; j <= n; j++) M[r][j] -= k * M[c][j]; } }
    return M.map((r, i) => r[n] / r[i]);
  }

  /* ---------- Linear regression: residuals and SSE ---------- */
  function lsq(el) {
    const P = nums(el.dataset.points || '1,2;2,3;3,5;4,4;5,6'), n = P.length;
    const mx = P.reduce((s, p) => s + p[0], 0) / n, my = P.reduce((s, p) => s + p[1], 0) / n;
    const sxx = P.reduce((s, p) => s + (p[0] - mx) ** 2, 0), sxy = P.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0);
    const w1 = sxy / sxx, w0 = my - w1 * mx;
    const S = shell(el, 'Fit a line by hand, then compare with least squares');
    let st = { w: 0.5, b: 1 };
    const xs = P.map(p => p[0]), ys = P.map(p => p[1]);
    const xr = [Math.min(0, ...xs) - 0.5, Math.max(...xs) + 0.5], yr = [Math.min(0, ...ys) - 1, Math.max(...ys) + 1.5];
    const sw = slider(S.ctl, 'slope w', -1, 3, 0.05, st.w, v => { st.w = v; draw(); });
    const sb = slider(S.ctl, 'intercept b', -3, 5, 0.05, st.b, v => { st.b = v; draw(); });
    button(S.ctl, 'Set to least squares', () => { st.w = w1; st.b = w0; sw.value = w1; sb.value = w0; sw.dispatchEvent(new Event('input')); sb.dispatchEvent(new Event('input')); });
    function draw() {
      const F = frame(420, 280, xr, yr);
      let g = F.axes(ticks(Math.ceil(xr[0]), Math.floor(xr[1]), Math.floor(xr[1]) - Math.ceil(xr[0])), ticks(Math.ceil(yr[0]), Math.floor(yr[1]), 4), 'x', 'y');
      let sse = 0;
      P.forEach(p => { const yh = st.w * p[0] + st.b; sse += (p[1] - yh) ** 2; g += '<line x1="' + F.X(p[0]) + '" y1="' + F.Y(p[1]) + '" x2="' + F.X(p[0]) + '" y2="' + F.Y(yh) + '" stroke="' + C.bad + '" stroke-width="2" stroke-dasharray="3 2"/>'; });
      g += '<line x1="' + F.X(xr[0]) + '" y1="' + F.Y(st.w * xr[0] + st.b) + '" x2="' + F.X(xr[1]) + '" y2="' + F.Y(st.w * xr[1] + st.b) + '" stroke="' + C.a + '" stroke-width="2.5"/>';
      g += '<line x1="' + F.X(xr[0]) + '" y1="' + F.Y(w1 * xr[0] + w0) + '" x2="' + F.X(xr[1]) + '" y2="' + F.Y(w1 * xr[1] + w0) + '" stroke="' + C.hl + '" stroke-width="1.5" stroke-dasharray="6 4" opacity=".75"/>';
      P.forEach(p => { g += '<circle cx="' + F.X(p[0]) + '" cy="' + F.Y(p[1]) + '" r="4.5" fill="' + C.ink + '"/>'; });
      S.plot.innerHTML = svg(420, 280, g, 'Data points, your line and the least-squares line') + '<p class="w2k"><i style="background:' + C.a + '"></i>your line <i style="background:' + C.hl + '"></i>least squares <i style="background:' + C.bad + '"></i>residuals</p>';
      let best = 0; P.forEach(p => { best += (p[1] - (w1 * p[0] + w0)) ** 2; });
      S.out.innerHTML = table([['your SSE', f(sse)], ['least-squares SSE', f(best)], ['least-squares w', f(w1)], ['least-squares b', f(w0)]]) +
        '<p class="w2n">' + (sse - best < 1e-6 ? 'You are at the minimum: no other line has a smaller sum of squared residuals.' : 'Your SSE is ' + f(sse - best) + ' above the minimum. The dashed yellow line is the best possible.') + '</p>';
    }
    draw();
  }

  /* ---------- Ridge and lasso: coefficient paths ---------- */
  function shrink(el) {
    const sxx = +(el.dataset.sxx || 4), sxy = +(el.dataset.sxy || 8), lmax = +(el.dataset.lmax || 24);
    const ridge = l => sxy / (sxx + l), lasso = l => Math.sign(sxy) * Math.max(0, Math.abs(sxy) - l / 2) / sxx;
    const S = shell(el, 'How the penalty shrinks one weight (one feature)');
    let lam = 4;
    slider(S.ctl, 'penalty λ', 0, lmax, 0.5, lam, v => { lam = v; draw(); });
    function draw() {
      const w0 = sxy / sxx, F = frame(420, 260, [0, lmax], [0, w0 * 1.1]);
      let g = F.axes(ticks(0, lmax, 4), ticks(0, +(w0).toFixed(1), 4), 'λ', 'w');
      let pr = '', pl = '';
      for (let i = 0; i <= 120; i++) { const l = lmax * i / 120; pr += (i ? 'L' : 'M') + F.X(l).toFixed(1) + ' ' + F.Y(ridge(l)).toFixed(1); pl += (i ? 'L' : 'M') + F.X(l).toFixed(1) + ' ' + F.Y(lasso(l)).toFixed(1); }
      g += '<path d="' + pr + '" fill="none" stroke="' + C.a + '" stroke-width="2.5"/><path d="' + pl + '" fill="none" stroke="' + C.b + '" stroke-width="2.5"/>';
      g += '<line x1="' + F.X(lam) + '" y1="14" x2="' + F.X(lam) + '" y2="234" stroke="' + C.text + '" stroke-dasharray="3 3"/>';
      g += '<circle cx="' + F.X(lam) + '" cy="' + F.Y(ridge(lam)) + '" r="5" fill="' + C.a + '"/><circle cx="' + F.X(lam) + '" cy="' + F.Y(lasso(lam)) + '" r="5" fill="' + C.b + '"/>';
      S.plot.innerHTML = svg(420, 260, g, 'Ridge and lasso weight as the penalty grows') + '<p class="w2k"><i style="background:' + C.a + '"></i>ridge <i style="background:' + C.b + '"></i>lasso</p>';
      S.out.innerHTML = table([['$\\sum x_i^2$', sxx], ['$\\sum x_iy_i$', sxy], ['least squares ($\\lambda=0$)', f(w0)], ['ridge $\\frac{\\sum xy}{\\sum x^2+\\lambda}$', f(ridge(lam))], ['lasso', f(lasso(lam))]]) +
        '<p class="w2n">' + (lasso(lam) === 0 ? 'Lasso has set the weight to exactly 0 (it does so once λ ≥ 2|Σxy| = ' + f(2 * Math.abs(sxy), 1) + '). Ridge only gets closer to 0 and never reaches it.' : 'Ridge divides the weight down smoothly; lasso subtracts a fixed amount and will hit exactly 0 at λ = ' + f(2 * Math.abs(sxy), 1) + '.') + '</p>';
      if (window.renderMathInElement) try { window.renderMathInElement(S.out, { delimiters: [{ left: '$', right: '$', display: false }], throwOnError: false }); } catch (e) { }
    }
    draw();
  }

  /* ---------- Kernel regression: prediction curve ---------- */
  function kreg(el) {
    const P = nums(el.dataset.points || '0,1;1,3;2,2;3,5;4,4'), n = P.length;
    const S = shell(el, 'Kernel regression: same data, different kernels');
    let st = { kind: 'poly', p: 2, sig: 1, xq: 2.5 };
    const sel = document.createElement('label'); sel.className = 'w2s'; sel.innerHTML = '<span>kernel</span><select><option value="lin">linear $x^Tx\'$</option><option value="poly" selected>polynomial $(1+xx\')^p$</option><option value="gauss">Gaussian</option></select><b></b>';
    S.ctl.appendChild(sel); sel.querySelector('select').addEventListener('change', e => { st.kind = e.target.value; draw(); });
    slider(S.ctl, 'degree p', 1, 4, 1, st.p, v => { st.p = v; draw(); });
    slider(S.ctl, 'Gaussian σ', 0.3, 3, 0.1, st.sig, v => { st.sig = v; draw(); });
    slider(S.ctl, 'new point x', -0.5, 4.5, 0.1, st.xq, v => { st.xq = v; draw(); });
    const k = (a, b) => st.kind === 'lin' ? a * b : st.kind === 'poly' ? Math.pow(1 + a * b, st.p) : Math.exp(-((a - b) ** 2) / (2 * st.sig * st.sig));
    function draw() {
      const K = P.map(p => P.map(q => k(p[0], q[0]))), Kr = K.map((r, i) => r.map((v, j) => v + (i === j ? 1e-6 : 0)));
      const al = solve(Kr, P.map(p => p[1])), pred = x => P.reduce((s, p, i) => s + al[i] * k(p[0], x), 0);
      const F = frame(420, 260, [-0.5, 4.5], [-1, 7]);
      let g = F.axes([0, 1, 2, 3, 4], [0, 2, 4, 6], 'x', 'y'), d = '';
      for (let i = 0; i <= 160; i++) { const x = -0.5 + 5 * i / 160, y = Math.max(-1, Math.min(7, pred(x))); d += (i ? 'L' : 'M') + F.X(x).toFixed(1) + ' ' + F.Y(y).toFixed(1); }
      g += '<path d="' + d + '" fill="none" stroke="' + C.a + '" stroke-width="2.5"/>';
      P.forEach(p => { g += '<circle cx="' + F.X(p[0]) + '" cy="' + F.Y(p[1]) + '" r="4.5" fill="' + C.ink + '"/>'; });
      const yq = pred(st.xq); g += '<line x1="' + F.X(st.xq) + '" y1="14" x2="' + F.X(st.xq) + '" y2="234" stroke="' + C.text + '" stroke-dasharray="3 3"/><circle cx="' + F.X(st.xq) + '" cy="' + F.Y(Math.max(-1, Math.min(7, yq))) + '" r="5.5" fill="' + C.hl + '"/>';
      S.plot.innerHTML = svg(420, 260, g, 'Training points and the kernel regression prediction curve') + '<p class="w2k"><i style="background:' + C.a + '"></i>prediction $\\sum_i\\alpha_ik(x_i,x)$ <i style="background:' + C.hl + '"></i>new point</p>';
      S.out.innerHTML = table(P.map((p, i) => ['$\\alpha_' + (i + 1) + '$ (x = ' + p[0] + ')', f(al[i])]).concat([['prediction at x = ' + st.xq.toFixed(1), f(yq)]])) +
        '<p class="w2n">' + (st.kind === 'lin' ? 'The linear kernel without a bias gives a straight line through the origin, so it cannot pass through every point.' : st.kind === 'gauss' ? 'Small σ: the curve hugs each point and falls back towards 0 between and beyond them. Large σ: smoother.' : 'Degree ' + st.p + ': the curve is a polynomial of degree at most ' + st.p + '. With ' + n + ' points, degree ' + (n - 1) + ' or more can pass through all of them.') + '</p>';
      if (window.renderMathInElement) try { window.renderMathInElement(el, { delimiters: [{ left: '$', right: '$', display: false }], throwOnError: false }); } catch (e) { }
    }
    draw();
  }

  /* ---------- k-NN: neighbours, vote and decision regions ---------- */
  function knn(el) {
    const P = nums(el.dataset.points || '1,1,0;1.5,2,0;2,1.2,0;2.5,2.6,0;3,1,0;4,3.5,1;4.5,2.5,1;5,4,1;3.5,3.2,1;2.2,3.6,1;5.5,3,1;3.2,2.2,0'), xr = [0, 6.5], yr = [0, 4.8];
    const S = shell(el, 'k-NN: click the plot to move the new point');
    let st = { k: 3, q: [3.4, 2.6] };
    slider(S.ctl, 'k', 1, P.length, 1, st.k, v => { st.k = v; draw(); });
    const near = q => P.map((p, i) => ({ i, d: Math.hypot(p[0] - q[0], p[1] - q[1]), y: p[2] })).sort((a, b) => a.d - b.d || a.i - b.i);
    const vote = (nb, kk) => { const c1 = nb.slice(0, kk).filter(o => o.y === 1).length, c0 = kk - c1; return { c0, c1, y: c1 > c0 ? 1 : c0 > c1 ? 0 : -1 }; };
    function draw() {
      const F = frame(420, 300, xr, yr, [24, 10, 10, 20]);
      let g = '';
      const nx = 42, ny = 30;
      for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const x = xr[0] + (i + 0.5) * (xr[1] - xr[0]) / nx, y = yr[0] + (j + 0.5) * (yr[1] - yr[0]) / ny; const v = vote(near([x, y]), st.k).y;
        if (v >= 0) g += '<rect x="' + F.X(xr[0] + i * (xr[1] - xr[0]) / nx).toFixed(1) + '" y="' + F.Y(yr[0] + (j + 1) * (yr[1] - yr[0]) / ny).toFixed(1) + '" width="' + ((F.X(1) - F.X(0)) * (xr[1] - xr[0]) / nx + .6).toFixed(1) + '" height="' + ((F.Y(0) - F.Y(1)) * (yr[1] - yr[0]) / ny + .6).toFixed(1) + '" fill="' + (v ? C.b : C.a) + '" opacity=".13"/>'; }
      const nb = near(st.q), v = vote(nb, st.k), rk = nb[st.k - 1].d;
      g += '<circle cx="' + F.X(st.q[0]) + '" cy="' + F.Y(st.q[1]) + '" r="' + (F.X(rk) - F.X(0)).toFixed(1) + '" fill="none" stroke="' + C.text + '" stroke-dasharray="4 3"/>';
      nb.slice(0, st.k).forEach(o => { const p = P[o.i]; g += '<line x1="' + F.X(st.q[0]) + '" y1="' + F.Y(st.q[1]) + '" x2="' + F.X(p[0]) + '" y2="' + F.Y(p[1]) + '" stroke="' + C.ink + '" stroke-width="1" opacity=".6"/>'; });
      P.forEach(p => { g += p[2] ? '<rect x="' + (F.X(p[0]) - 5) + '" y="' + (F.Y(p[1]) - 5) + '" width="10" height="10" fill="' + C.b + '"/>' : '<circle cx="' + F.X(p[0]) + '" cy="' + F.Y(p[1]) + '" r="5.5" fill="' + C.a + '"/>'; });
      g += '<path d="M' + F.X(st.q[0]) + ' ' + (F.Y(st.q[1]) - 9) + ' l8 15 h-16z" fill="' + C.hl + '" stroke="#16202E"/>';
      S.plot.innerHTML = svg(420, 300, g, 'Training points of two classes, the new point and its k nearest neighbours') + '<p class="w2k"><i style="background:' + C.a + '"></i>class 0 <i style="background:' + C.b + '"></i>class 1 <i style="background:' + C.hl + '"></i>new point; shading = prediction everywhere</p>';
      S.plot.querySelector('svg').addEventListener('click', ev => { const r = ev.currentTarget.getBoundingClientRect(), sx = (ev.clientX - r.left) / r.width * 420, sy = (ev.clientY - r.top) / r.height * 300;
        st.q = [xr[0] + (sx - 24) / (420 - 34) * (xr[1] - xr[0]), yr[0] + (300 - 20 - sy) / (300 - 30) * (yr[1] - yr[0])]; draw(); });
      S.out.innerHTML = table([['new point', '(' + f(st.q[0], 2) + ', ' + f(st.q[1], 2) + ')'], ['votes for class 0', v.c0], ['votes for class 1', v.c1], ['prediction', v.y < 0 ? 'tie' : 'class ' + v.y], ['distance to k-th neighbour', f(rk)]]) +
        '<p class="w2n">' + (st.k === 1 ? 'k = 1: every training point is its own nearest neighbour, so training error is 0 and the regions are jagged.' : st.k >= P.length - 1 ? 'k close to n: almost every point votes, so the prediction becomes the majority class everywhere.' : 'Raise k to see the regions smooth out; lower it to see them become jagged.') + (v.y < 0 ? ' The vote is tied: the exam question will state the tie rule.' : '') + '</p>';
    }
    draw();
  }

  /* ---------- Decision trees: entropy and information gain ---------- */
  function entropy(el) {
    const S = shell(el, 'Entropy and information gain of one split');
    const H = p => (p <= 0 || p >= 1) ? 0 : -p * Math.log2(p) - (1 - p) * Math.log2(1 - p);
    let st = { a: +(el.dataset.a || 6), b: +(el.dataset.b || 2), c: +(el.dataset.c || 1), d: +(el.dataset.d || 5) };
    slider(S.ctl, 'Yes child: label 1', 0, 12, 1, st.a, v => { st.a = v; draw(); });
    slider(S.ctl, 'Yes child: label 0', 0, 12, 1, st.b, v => { st.b = v; draw(); });
    slider(S.ctl, 'No child: label 1', 0, 12, 1, st.c, v => { st.c = v; draw(); });
    slider(S.ctl, 'No child: label 0', 0, 12, 1, st.d, v => { st.d = v; draw(); });
    function draw() {
      const nY = st.a + st.b, nN = st.c + st.d, n = nY + nN;
      const pP = n ? (st.a + st.c) / n : 0, pY = nY ? st.a / nY : 0, pN = nN ? st.c / nN : 0;
      const EP = H(pP), EY = H(pY), EN = H(pN), g_ = n ? nY / n : 0, IG = EP - g_ * EY - (1 - g_) * EN;
      const F = frame(420, 250, [0, 1], [0, 1.05]);
      let g = F.axes([0, 0.25, 0.5, 0.75, 1], [0, 0.5, 1], 'p = proportion of label 1', 'E'), d = '';
      for (let i = 0; i <= 100; i++) { const p = i / 100; d += (i ? 'L' : 'M') + F.X(p).toFixed(1) + ' ' + F.Y(H(p)).toFixed(1); }
      g += '<path d="' + d + '" fill="none" stroke="' + C.text + '" stroke-width="2"/>';
      const mk = (p, e, col, lab) => '<circle cx="' + F.X(p) + '" cy="' + F.Y(e) + '" r="6" fill="' + col + '"/><text x="' + (F.X(p) + 8) + '" y="' + (F.Y(e) - 8) + '" fill="' + col + '" font-size="11">' + lab + '</text>';
      if (n) g += mk(pP, EP, C.hl, 'parent');
      if (nY) g += mk(pY, EY, C.a, 'Yes');
      if (nN) g += mk(pN, EN, C.b, 'No');
      S.plot.innerHTML = svg(420, 250, g, 'Entropy curve with the parent and the two children marked');
      S.out.innerHTML = table([['parent', (st.a + st.c) + ' ones / ' + n + ', E = ' + f(EP)], ['Yes child', st.a + ' / ' + nY + ', E = ' + f(EY)], ['No child', st.c + ' / ' + nN + ', E = ' + f(EN)], ['γ = share going Yes', f(g_)], ['information gain', '<b>' + f(IG) + '</b>']]) +
        '<p class="w2n">IG = E(parent) − γ·E(Yes) − (1−γ)·E(No). ' + (IG < 1e-9 ? 'Zero gain: both children have the same mix as the parent, so the question tells you nothing.' : EY === 0 && EN === 0 ? 'Both children are pure: the gain equals the parent entropy, the most possible.' : 'Make a child purer (closer to p = 0 or 1) to raise the gain.') + '</p>';
    }
    draw();
  }

  /* ---------- Gaussian Naive Bayes in one feature ---------- */
  function gnb(el) {
    const S = shell(el, 'Gaussian Naive Bayes with one feature');
    let st = { pi: 0.5, m0: 0, m1: 3, s0: 1, s1: 1, x: 1.5 };
    slider(S.ctl, 'P(y = 1)', 0.05, 0.95, 0.05, st.pi, v => { st.pi = v; draw(); });
    slider(S.ctl, 'μ for class 0', -2, 5, 0.1, st.m0, v => { st.m0 = v; draw(); });
    slider(S.ctl, 'μ for class 1', -2, 5, 0.1, st.m1, v => { st.m1 = v; draw(); });
    slider(S.ctl, 'σ for class 0', 0.4, 2.5, 0.1, st.s0, v => { st.s0 = v; draw(); });
    slider(S.ctl, 'σ for class 1', 0.4, 2.5, 0.1, st.s1, v => { st.s1 = v; draw(); });
    slider(S.ctl, 'new point x', -4, 7, 0.1, st.x, v => { st.x = v; draw(); });
    const N = (x, m, s) => Math.exp(-((x - m) ** 2) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI));
    function draw() {
      const j0 = x => (1 - st.pi) * N(x, st.m0, st.s0), j1 = x => st.pi * N(x, st.m1, st.s1), post = x => j1(x) / (j0(x) + j1(x) || 1e-300);
      const xr = [-4, 7]; let ymax = 0; for (let i = 0; i <= 200; i++) { const x = xr[0] + 11 * i / 200; ymax = Math.max(ymax, j0(x), j1(x)); }
      const F = frame(420, 170, xr, [0, ymax * 1.1], [30, 10, 10, 20]), G = frame(420, 120, xr, [0, 1], [30, 10, 8, 22]);
      let g = F.axes([-4, -2, 0, 2, 4, 6], [], 'x', 'P(y)·p(x|y)'), p0 = '', p1 = '', pp = '';
      const bd = []; let prev = null;
      for (let i = 0; i <= 220; i++) { const x = xr[0] + 11 * i / 220; p0 += (i ? 'L' : 'M') + F.X(x).toFixed(1) + ' ' + F.Y(j0(x)).toFixed(1); p1 += (i ? 'L' : 'M') + F.X(x).toFixed(1) + ' ' + F.Y(j1(x)).toFixed(1); pp += (i ? 'L' : 'M') + G.X(x).toFixed(1) + ' ' + G.Y(post(x)).toFixed(1);
        const s = post(x) >= 0.5; if (prev !== null && s !== prev) bd.push(x); prev = s; }
      g += '<path d="' + p0 + '" fill="none" stroke="' + C.a + '" stroke-width="2.5"/><path d="' + p1 + '" fill="none" stroke="' + C.b + '" stroke-width="2.5"/>';
      let h = G.axes([-4, -2, 0, 2, 4, 6], [0, 0.5, 1], '', 'P(y=1|x)') + '<path d="' + pp + '" fill="none" stroke="' + C.good + '" stroke-width="2.5"/>';
      bd.forEach(x => { g += '<line x1="' + F.X(x) + '" y1="10" x2="' + F.X(x) + '" y2="150" stroke="' + C.text + '" stroke-dasharray="3 3"/>'; h += '<line x1="' + G.X(x) + '" y1="8" x2="' + G.X(x) + '" y2="98" stroke="' + C.text + '" stroke-dasharray="3 3"/>'; });
      h += '<circle cx="' + G.X(st.x) + '" cy="' + G.Y(post(st.x)) + '" r="5.5" fill="' + C.hl + '"/>';
      S.plot.innerHTML = svg(420, 170, g, 'Prior times class density for both classes') + svg(420, 120, h, 'Posterior probability of class 1') + '<p class="w2k"><i style="background:' + C.a + '"></i>class 0 <i style="background:' + C.b + '"></i>class 1 <i style="background:' + C.good + '"></i>P(y=1|x); dashed = decision boundary</p>';
      const q = post(st.x);
      S.out.innerHTML = table([['P(y=1 | x = ' + st.x.toFixed(1) + ')', f(q)], ['prediction', q >= 0.5 ? 'class 1' : 'class 0'], ['decision boundaries', bd.length ? bd.map(x => f(x, 2)).join(' and ') : 'none in view']]) +
        '<p class="w2n">' + (Math.abs(st.s0 - st.s1) < 1e-9 ? 'Equal σ: one boundary, a straight cut. With equal priors it sits halfway between the means; a larger prior pushes it towards the other class.' : 'Different σ: the wider class wins in both tails, so there can be two boundaries (a quadratic boundary).') + '</p>';
    }
    draw();
  }

  /* ---------- Cross-validation folds ---------- */
  function folds(el) {
    const S = shell(el, 'k-fold cross-validation: who trains, who validates');
    let st = { n: +(el.dataset.n || 12), k: +(el.dataset.k || 4), m: 1 };
    const sn = slider(S.ctl, 'data points n', 4, 20, 1, st.n, v => { st.n = v; if (st.k > v) { st.k = v; sk.value = v; sk.dispatchEvent(new Event('input')); } sk.max = v; draw(); });
    const sk = slider(S.ctl, 'folds k', 2, st.n, 1, st.k, v => { st.k = Math.min(v, st.n); draw(); });
    slider(S.ctl, 'settings tried', 1, 6, 1, st.m, v => { st.m = v; draw(); });
    function draw() {
      const n = st.n, k = st.k, fold = i => Math.floor(i * k / n), cw = Math.min(28, 380 / n), rh = Math.min(24, 230 / k), W = 40 + n * cw + 10, Hh = 24 + k * rh;
      let g = '';
      for (let r = 0; r < k; r++) { g += '<text x="34" y="' + (24 + r * rh + rh * 0.68) + '" fill="' + C.text + '" font-size="10" text-anchor="end">run ' + (r + 1) + '</text>';
        for (let i = 0; i < n; i++) { const v = fold(i) === r; g += '<rect x="' + (40 + i * cw + 1) + '" y="' + (24 + r * rh + 2) + '" width="' + (cw - 2) + '" height="' + (rh - 4) + '" rx="2" fill="' + (v ? C.hl : C.a) + '" opacity="' + (v ? 1 : .45) + '"/>'; } }
      for (let i = 0; i < n; i++) g += '<text x="' + (40 + i * cw + cw / 2) + '" y="16" fill="' + C.text + '" font-size="9" text-anchor="middle">' + (i + 1) + '</text>';
      const sizes = []; for (let r = 0; r < k; r++) { let c = 0; for (let i = 0; i < n; i++) if (fold(i) === r) c++; sizes.push(c); }
      const even = sizes.every(s => s === sizes[0]);
      S.plot.innerHTML = svg(W, Hh, g, 'One row per training run; yellow cells are the validation points of that run') + '<p class="w2k"><i style="background:' + C.hl + '"></i>validation <i style="background:' + C.a + ';opacity:.45"></i>training</p>';
      S.out.innerHTML = table([['models trained', k + ' per setting × ' + st.m + ' = <b>' + k * st.m + '</b>'], ['validation size', even ? sizes[0] + ' each' : sizes.join(', ')], ['training size', even ? (n - sizes[0]) + ' each' : sizes.map(s => n - s).join(', ')], ['name', k === n ? 'leave-one-out (LOOCV)' : k + '-fold']]) +
        '<p class="w2n">Every point is a validation point exactly once. The CV error is the average of the ' + k + ' validation errors. ' + (k === n ? 'With k = n each model trains on n − 1 points.' : 'Training size is n(k−1)/k when k divides n.') + '</p>';
    }
    draw();
  }

  /* ---------- Logistic regression in one feature ---------- */
  function logit(el) {
    const P = nums(el.dataset.points || '-2,0;-1.2,0;-0.5,0;0.3,1;-0.2,1;0.8,0;1.2,1;2,1');
    const S = shell(el, 'Logistic regression: move w and b, watch the loss');
    let st = { w: 1.5, b: 0 };
    const sw = slider(S.ctl, 'weight w', -4, 6, 0.1, st.w, v => { st.w = v; draw(); });
    const sb = slider(S.ctl, 'bias b', -3, 3, 0.1, st.b, v => { st.b = v; draw(); });
    button(S.ctl, 'Take 20 gradient steps', () => { for (let t = 0; t < 20; t++) { let gw = 0, gb = 0; P.forEach(p => { const e = 1 / (1 + Math.exp(-(st.w * p[0] + st.b))) - p[1]; gw += e * p[0]; gb += e; }); st.w -= 0.5 * gw; st.b -= 0.5 * gb; }
      st.w = Math.max(-4, Math.min(6, st.w)); st.b = Math.max(-3, Math.min(3, st.b)); sw.value = st.w; sb.value = st.b; sw.dispatchEvent(new Event('input')); sb.dispatchEvent(new Event('input')); });
    const sg = z => 1 / (1 + Math.exp(-z));
    function draw() {
      const F = frame(420, 250, [-3, 3], [-0.08, 1.08]);
      let g = F.axes([-3, -2, -1, 0, 1, 2, 3], [0, 0.5, 1], 'x', 'p = σ(wx + b)'), d = '';
      for (let i = 0; i <= 150; i++) { const x = -3 + 6 * i / 150; d += (i ? 'L' : 'M') + F.X(x).toFixed(1) + ' ' + F.Y(sg(st.w * x + st.b)).toFixed(1); }
      g += '<path d="' + d + '" fill="none" stroke="' + C.good + '" stroke-width="2.5"/>';
      if (Math.abs(st.w) > 1e-9) { const xb = -st.b / st.w; if (xb > -3 && xb < 3) g += '<line x1="' + F.X(xb) + '" y1="12" x2="' + F.X(xb) + '" y2="224" stroke="' + C.text + '" stroke-dasharray="3 3"/>'; }
      let loss = 0, acc = 0;
      P.forEach(p => { const q = sg(st.w * p[0] + st.b); loss += p[1] ? -Math.log(Math.max(q, 1e-12)) : -Math.log(Math.max(1 - q, 1e-12)); if ((q >= 0.5 ? 1 : 0) === p[1]) acc++;
        g += '<circle cx="' + F.X(p[0]) + '" cy="' + F.Y(p[1]) + '" r="5" fill="' + (p[1] ? C.b : C.a) + '"/>'; });
      S.plot.innerHTML = svg(420, 250, g, 'Labelled points and the sigmoid curve') + '<p class="w2k"><i style="background:' + C.a + '"></i>label 0 <i style="background:' + C.b + '"></i>label 1 <i style="background:' + C.good + '"></i>predicted P(y=1); dashed = boundary wx + b = 0</p>';
      S.out.innerHTML = table([['total log-loss', f(loss)], ['training accuracy', acc + ' / ' + P.length], ['boundary x', Math.abs(st.w) > 1e-9 ? f(-st.b / st.w, 2) : 'none']]) +
        '<p class="w2n">Each point costs −log of the probability given to its true label, so a confident wrong answer is very expensive. The data here are not separable, so the loss cannot reach 0.</p>';
    }
    draw();
  }

  window.Q1W = Object.assign(window.Q1W || {}, { lsq, shrink, kreg, knn, entropy, gnb, folds, logit });
})();
