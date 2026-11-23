/* KB-005 instrument: the PDSA force layout, run in the browser.
   frHistory() is a step-by-step port of fr() in nerdhub/pdsa-quiz-2/js/core.js: same start ring,
   same constant k, same repulsion k²/L and attraction L²/k, same cooling (1 - it/260)·W/8 + 1.
   It records every step so the visitor can scrub through the run. Each frame is scaled to fit the
   box the way fr() scales its final answer. */
import { request, cancel } from "../core/raf.js";
import { prefersReducedMotion } from "../core/env.js";

const NS = "http://www.w3.org/2000/svg";
function el(tag, attrs, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
function h(tag, attrs, text) {
  const e = document.createElement(tag);
  for (const k in attrs || {}) e.setAttribute(k, attrs[k]);
  if (text != null) e.textContent = text;
  return e;
}

export function frHistory(ids, edges, W, H, iters) {
  const n = ids.length, R = Math.min(W, H) / 2 - 50, k = Math.sqrt(W * H / n) * 0.75;
  const x = new Float64Array(n), y = new Float64Array(n), fx = new Float64Array(n), fy = new Float64Array(n);
  ids.forEach((_, i) => { const a = 2 * Math.PI * i / n - Math.PI / 2; x[i] = W / 2 + R * Math.cos(a); y[i] = H / 2 + R * Math.sin(a); });
  const frames = [snapshot(x, y)], moves = [], temps = [];
  for (let it = 0; it < iters; it++) {
    fx.fill(0); fy.fill(0);
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const dx = x[i] - x[j], dy = y[i] - y[j], L = Math.sqrt(dx * dx + dy * dy) || 0.01, f = k * k / L;
      fx[i] += dx / L * f; fy[i] += dy / L * f; fx[j] -= dx / L * f; fy[j] -= dy / L * f;
    }
    for (const [a, b] of edges) {
      const dx = x[a] - x[b], dy = y[a] - y[b], L = Math.sqrt(dx * dx + dy * dy) || 0.01, f = L * L / k;
      fx[a] -= dx / L * f; fy[a] -= dy / L * f; fx[b] += dx / L * f; fy[b] += dy / L * f;
    }
    const t = (1 - it / iters) * W / 8 + 1;
    const mv = new Float64Array(2 * n);
    for (let i = 0; i < n; i++) {
      const L = Math.sqrt(fx[i] * fx[i] + fy[i] * fy[i]) || 0.01, m = Math.min(L, t);
      mv[2 * i] = fx[i] / L * m; mv[2 * i + 1] = fy[i] / L * m;
      x[i] += mv[2 * i]; y[i] += mv[2 * i + 1];
    }
    moves.push(mv); temps.push(t); frames.push(snapshot(x, y));
  }
  return { frames, moves, temps };
}
function snapshot(x, y) { const s = new Float64Array(2 * x.length); for (let i = 0; i < x.length; i++) { s[2 * i] = x[i]; s[2 * i + 1] = y[i]; } return s; }

export function mount(host, data) {
  const { W, H, iterations: N } = data;
  const ids = data.nodes.map((nd) => nd[0]);
  const idx = Object.fromEntries(ids.map((v, i) => [v, i]));
  const label = Object.fromEntries(data.nodes.map((nd) => [nd[0], nd[2]]));
  const full = Object.fromEntries(data.nodes.map((nd) => [nd[0], nd[1]]));
  const edgeList = [];
  for (const v of ids) for (const u of data.uses[v]) edgeList.push([idx[v], idx[u]]);
  const run = frHistory(ids, edgeList, W, H, N);
  const n = ids.length;

  // --- display transform: fit each frame into the box, as fr() does at the end
  const disp = new Float64Array(2 * n);
  let sx = 1, sy = 1;
  function fit(frame) {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (let i = 0; i < n; i++) { const X = frame[2 * i], Y = frame[2 * i + 1]; if (X < x0) x0 = X; if (X > x1) x1 = X; if (Y < y0) y0 = Y; if (Y > y1) y1 = Y; }
    sx = x1 === x0 ? 1 : (W - 80) / (x1 - x0); sy = y1 === y0 ? 1 : (H - 68) / (y1 - y0);
    for (let i = 0; i < n; i++) {
      disp[2 * i] = x1 === x0 ? W / 2 : 40 + (frame[2 * i] - x0) * sx;
      disp[2 * i + 1] = y1 === y0 ? H / 2 : 34 + (frame[2 * i + 1] - y0) * sy;
    }
  }

  // --- build the instrument
  const wrap = h("div", { class: "lx" });
  const svg = el("svg", { class: "lx__svg", viewBox: `-34 -30 ${W + 68} ${H + 60}`, role: "img",
    "aria-label": "PDSA topic graph laid out by fr(); positions change with the step control" }, null);
  el("path", { d: "M0 1L9 5L0 9", class: "ln" }, el("marker", { id: "lx-arrow", viewBox: "0 0 10 10", refX: "8", refY: "5", markerWidth: "5", markerHeight: "5", orient: "auto" }, el("defs", {}, svg)));
  const gE = el("g", { class: "c-frag" }, svg), gA = el("g", { class: "lx__moves" }, svg), gN = el("g", { class: "c-frag" }, svg);
  const lines = edgeList.map(([a, b]) => ({ a, b, node: el("line", { class: "ln lx__edge" }, gE) }));
  const arrows = ids.map(() => el("line", { class: "ln lx__move", "marker-end": "url(#lx-arrow)" }, gA));
  const nodes = ids.map((v, i) => {
    const g = el("g", { class: "lx__node", "data-id": v }, gN);
    const c = el("circle", { class: "ln bg", r: "7" }, g);
    const t = el("text", { class: "tx", "font-size": "9" }, g); t.textContent = label[v];
    g.addEventListener("click", () => select(select.cur === v ? null : v));
    return { g, c, t };
  });

  const controls = h("div", { class: "lx__controls" });
  const back = h("button", { type: "button", class: "inst-btn", "aria-label": "One step back" }, "‹ step");
  const play = h("button", { type: "button", class: "inst-btn inst-btn--main" }, "Play");
  const fwd = h("button", { type: "button", class: "inst-btn", "aria-label": "One step forward" }, "step ›");
  const reset = h("button", { type: "button", class: "inst-btn" }, "Reset");
  const scrubLabel = h("label", { class: "inst-scrub" });
  const scrubText = h("span", {}, "");
  const range = h("input", { type: "range", min: "0", max: String(N), step: "1", value: "0" });
  scrubLabel.append(scrubText, range);
  controls.append(back, play, fwd, scrubLabel, reset);

  const read = h("p", { class: "inst-read", "aria-live": "polite" });
  const topicRow = h("div", { class: "lx__topics", role: "group", "aria-label": "Inspect a topic" });
  const topicBtns = ids.map((v) => {
    const b = h("button", { type: "button", class: "inst-chip", "aria-pressed": "false" }, label[v]);
    b.addEventListener("click", () => select(select.cur === v ? null : v));
    topicRow.appendChild(b);
    return b;
  });
  const topicRead = h("p", { class: "inst-read inst-read--topic", "aria-live": "polite" }, "Pick a topic to see what it builds on and what builds on it.");
  const note = h("p", { class: "inst-note" }, "Each frame is rescaled to fit the box, as fr() does with its final answer, so distances are not comparable from one frame to the next.");
  wrap.append(svg, note, controls, read, topicRow, topicRead);
  host.insertBefore(wrap, host.querySelector(".instrument__static"));

  // --- state and drawing
  let step = 0, playing = false, last = 0;
  const usedBy = (v) => ids.filter((w) => data.uses[w].includes(v));

  function draw() {
    fit(run.frames[step]);
    const cx = disp.reduce((s, v, i) => (i % 2 ? s : s + v), 0) / n, cy = disp.reduce((s, v, i) => (i % 2 ? s + v : s), 0) / n;
    for (const L of lines) {
      L.node.setAttribute("x1", disp[2 * L.a].toFixed(1)); L.node.setAttribute("y1", disp[2 * L.a + 1].toFixed(1));
      L.node.setAttribute("x2", disp[2 * L.b].toFixed(1)); L.node.setAttribute("y2", disp[2 * L.b + 1].toFixed(1));
    }
    for (let i = 0; i < n; i++) {
      const X = disp[2 * i], Y = disp[2 * i + 1], nd = nodes[i];
      nd.g.setAttribute("transform", `translate(${X.toFixed(1)} ${Y.toFixed(1)})`);
      const dx = X - cx, dy = Y - cy, Ln = Math.hypot(dx, dy) || 1;
      nd.t.setAttribute("x", (dx / Ln * 13).toFixed(1));
      nd.t.setAttribute("y", (dy / Ln * 13 + 3).toFixed(1));
      nd.t.setAttribute("text-anchor", dx > 6 ? "start" : dx < -6 ? "end" : "middle");
      const ar = arrows[i];
      if (step < N) {
        const mv = run.moves[step];
        ar.setAttribute("x1", X.toFixed(1)); ar.setAttribute("y1", Y.toFixed(1));
        ar.setAttribute("x2", (X + mv[2 * i] * sx).toFixed(1)); ar.setAttribute("y2", (Y + mv[2 * i + 1] * sy).toFixed(1));
        ar.style.display = "";
      } else ar.style.display = "none";
    }
    range.value = String(step);
    scrubText.textContent = step === 0 ? "start" : `step ${step} of ${N}`;
    if (!playing) read.textContent = step === N
      ? "Finished. Each node has settled where the pushes and pulls balance; fr() then scales the result to fit."
      : `Next step: every pair of nodes pushes apart, every edge pulls together, and no node may move more than ${run.temps[step].toFixed(1)} px. The marks show where each node goes next.`;
  }

  function select(v) {
    select.cur = v;
    for (let i = 0; i < n; i++) {
      const on = v === ids[i];
      const near = v && (data.uses[v].includes(ids[i]) || data.uses[ids[i]].includes(v));
      nodes[i].g.classList.toggle("is-sel", on);
      nodes[i].g.classList.toggle("is-dim", Boolean(v) && !on && !near);
      topicBtns[i].setAttribute("aria-pressed", String(on));
    }
    for (const L of lines) L.node.classList.toggle("is-sel", Boolean(v) && (ids[L.a] === v || ids[L.b] === v));
    if (!v) { topicRead.textContent = "Pick a topic to see what it builds on and what builds on it."; return; }
    const u = data.uses[v].map((w) => label[w]), b = usedBy(v).map((w) => label[w]);
    topicRead.textContent = `${full[v]}. Builds on: ${u.length ? u.join(", ") : "nothing earlier"}. Used by: ${b.length ? b.join(", ") : "nothing later"}.`;
  }
  select.cur = null;

  function tick(time) {
    if (!playing) return;
    if (time - last >= 16) { last = time; step = Math.min(N, step + 1); draw(); }
    if (step >= N) { stop(); draw(); return; }
    request(tick);
  }
  function start() {
    if (step >= N) step = 0;
    if (prefersReducedMotion()) { step = N; draw(); return; }   // no animation: show the result
    playing = true; play.textContent = "Pause"; read.setAttribute("aria-live", "off"); request(tick);
  }
  function stop() { playing = false; play.textContent = step >= N ? "Play again" : "Play"; read.setAttribute("aria-live", "polite"); cancel(tick); }

  play.addEventListener("click", () => (playing ? stop() : start()));
  back.addEventListener("click", () => { stop(); step = Math.max(0, step - 1); draw(); });
  fwd.addEventListener("click", () => { stop(); step = Math.min(N, step + 1); draw(); });
  reset.addEventListener("click", () => { stop(); step = 0; select(null); draw(); play.textContent = "Play"; });
  range.addEventListener("input", () => { stop(); step = +range.value; draw(); });

  // pause when the instrument scrolls out of view
  const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => { for (const e of es) if (!e.isIntersecting && playing) stop(); }) : null;
  if (io) io.observe(wrap);

  draw();
  return { pause: stop, destroy() { stop(); if (io) io.disconnect(); wrap.remove(); } };
}
