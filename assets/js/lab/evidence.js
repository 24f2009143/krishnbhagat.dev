/* KB-004 instrument: the recorded results of the practice simulation, all five settings.
   Data is copied from nerdhub/mlt/js/evidence.js (checked equal). Nothing is re-simulated:
   the simulation code is not in this repository. The students are simulated, not real. */

const NS = "http://www.w3.org/2000/svg";
function h(tag, attrs, text) { const e = document.createElement(tag); for (const k in attrs || {}) e.setAttribute(k, attrs[k]); if (text != null) e.textContent = text; return e; }
function s(tag, attrs, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
const sign = (x) => (x > 0 ? "+" : x < 0 ? "−" : "±") + Math.abs(x).toFixed(1);

export function mount(host, data) {
  const settings = data.settings;
  const names = settings[0].rows.map((r) => r[0]);
  const all = settings.flatMap((st) => st.rows.map((r) => r[3]));
  const lo = Math.floor(Math.min(...all) / 5) * 5 - 1, hi = Math.ceil(Math.max(...all) / 5) * 5 + 1;   // fixed scale across settings
  let cur = 0;

  const wrap = h("div", { class: "ex" });
  wrap.appendChild(h("p", { class: "ex__badge" }, `Simulated students · ${data.students.toLocaleString("en-US")} per setting · ${data.ideas} ideas · not real outcomes`));
  const choice = h("fieldset", { class: "inst-choice" });
  choice.appendChild(h("legend", {}, "Setting"));
  const radios = settings.map((st, k) => {
    const id = `ex-s${k}`;
    const r = h("input", { type: "radio", name: "ex-setting", id, value: String(k) });
    r.addEventListener("change", () => { cur = k; draw(); });
    choice.append(r, h("label", { for: id }, `${st.D} days · ${st.K} a day`));
    return r;
  });
  // two compositions: labels beside the rows (wide) or above them (narrow), chosen by the space available
  const narrowQ = matchMedia("(max-width: 560px)");
  let svg, rows, gapLine, gapText, X;
  function build() {
    const narrow = narrowQ.matches;
    const Wd = narrow ? 360 : 560, x0 = narrow ? 14 : 168, x1 = narrow ? 300 : 498, rh = narrow ? 30 : 19, top = narrow ? 22 : 14;
    X = (v) => x0 + (v - lo) / (hi - lo) * (x1 - x0);
    const H = top + names.length * rh + 14;
    const next = s("svg", { class: "ex__svg", viewBox: `0 0 ${Wd} ${H + 12}`, role: "img" });
    const axis = s("g", { class: "c-frag" }, next);
    s("line", { class: "ln dim", x1: X(0), y1: 4, x2: X(0), y2: H - 6 }, axis);
    for (const v of [lo + 1, 0, hi - 1]) {
      const t = s("text", { class: "tx dim", x: X(v), y: H + 6, "font-size": narrow ? "10" : "8", "text-anchor": "middle" }, axis);
      t.textContent = v === 0 ? "random" : (v > 0 ? "+" : "−") + Math.abs(v);
    }
    rows = names.map((nm, i) => {
      const y = top + i * rh;
      const g = s("g", { class: "c-frag ex__row" + (nm === "Adaptive (ours)" || nm === "Marks-weighted random" ? " is-key" : "") }, next);
      const t = narrow ? s("text", { class: "tx", x: x0, y: y - 8, "font-size": "10" }, g) : s("text", { class: "tx", x: x0 - 8, y: y + 3, "font-size": "8.5", "text-anchor": "end" }, g);
      t.textContent = nm;
      const stem = s("line", { class: "ln dim", y1: y, y2: y }, g);
      const ci = s("line", { class: "ln", y1: y, y2: y, "stroke-width": "3" }, g);
      const dot = s("circle", { class: nm.startsWith("Oracle") ? "ln bg" : "dot", cy: y, r: narrow ? "3.5" : "3" }, g);
      const val = s("text", { class: "tx dim", y: y + 3.5, "font-size": narrow ? "10" : "8" }, g);
      return { y, stem, ci, dot, val };
    });
    const gap = s("g", { class: "ex__gap" }, next);
    gapLine = s("path", { class: "ln" }, gap);
    gapText = s("text", { class: "nt", "font-size": narrow ? "12" : "10" }, gap);
    if (svg) svg.replaceWith(next); else wrap.appendChild(next);
    svg = next;
  }
  wrap.append(choice);
  build();
  const onNarrow = () => { build(); draw(); };
  narrowQ.addEventListener("change", onNarrow);
  const read = h("div", { class: "inst-read ex__read", "aria-live": "polite" });
  wrap.append(read);
  host.insertBefore(wrap, host.querySelector(".instrument__static"));

  const get = (st, nm) => st.rows.find((r) => r[0] === nm);
  function draw() {
    const st = settings[cur];
    radios[cur].checked = true;
    st.rows.forEach((r, i) => {
      const R = rows[i], v = r[3], c = r[4];
      R.stem.setAttribute("x1", X(0)); R.stem.setAttribute("x2", X(v));
      R.ci.setAttribute("x1", X(v - c)); R.ci.setAttribute("x2", X(v + c));
      R.dot.setAttribute("cx", X(v));
      R.val.setAttribute("x", X(Math.max(v, 0)) + 8); R.val.textContent = r[0] === "Random concept" ? "" : sign(v);
    });
    const mw = get(st, "Marks-weighted random"), ad = get(st, "Adaptive (ours)"), wk = get(st, "Weakest accuracy"), eq = get(st, "Adaptive, equal weights"), or = get(st, "Oracle (sees truth)");
    const ym = rows[names.indexOf("Marks-weighted random")].y, ya = rows[names.indexOf("Adaptive (ours)")].y, xr = Math.max(X(mw[3]), X(ad[3])) + 34;
    gapLine.setAttribute("d", `M${xr - 4} ${ym} H${xr} V${ya} H${xr - 4}`);
    gapText.setAttribute("x", xr + 5); gapText.setAttribute("y", (ym + ya) / 2 + 3);
    gapText.textContent = sign(+(ad[3] - mw[3]).toFixed(1));
    svg.setAttribute("aria-label", `${st.D} study days, ${st.K} questions a day: gain over random choice, in exam points. ` + st.rows.map((r) => `${r[0]} ${sign(r[3])}`).join("; "));
    read.replaceChildren(
      h("p", {}, `Choosing ideas in proportion to their marks gains ${sign(mw[3])} points over random. The full adaptive model gains ${sign(ad[3])}, so its memory model adds ${sign(+(ad[3] - mw[3]).toFixed(1))} on top.`),
      h("p", {}, `Working on the weakest topic first: ${sign(wk[3])}. The same adaptive model with every idea weighted equally: ${sign(eq[3])}. An oracle that sees what each simulated student truly knows: ${sign(or[3])}.`),
      h("p", { class: "ex__why" }, "Why marks matter so much here: weak ideas are often small ones, so time spent on them goes to marks that cannot be won back."),
    );
  }
  draw();
  return { pause() {}, destroy() { narrowQ.removeEventListener("change", onNarrow); wrap.remove(); } };
}
