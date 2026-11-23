/* KB-006 instrument: the recursion tree of T(n) = a·T(n/b) + n^d, level by level.
   Every number is computed from a, b, d and n = b^levels:
     level i has a^i subproblems of size n/b^i, each doing (n/b^i)^d work,
     so the level does a^i·(n/b^i)^d = n^d·(a/b^d)^i in total.
   The verdict uses the same comparison as P.widgets.master in nerdhub/pdsa-quiz-2/js/widgets.js. */

function h(tag, attrs, text) {
  const e = document.createElement(tag);
  for (const k in attrs || {}) e.setAttribute(k, attrs[k]);
  if (text != null) e.textContent = text;
  return e;
}
const SUP = { 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹", ".": "·" };
const pow = (e) => (Math.abs(e) < 1e-12 ? "1" : Math.abs(e - 1) < 1e-12 ? "n" : "n" + String(+e.toFixed(3)).split("").map((c) => SUP[c] || c).join(""));
const num = (x) => (Math.abs(x - Math.round(x)) < 1e-9 ? Math.round(x).toLocaleString("en-US").replace(/,/g, " ") : x.toPrecision(3));

export function verdict(a, b, d) {
  const c = Math.log(a) / Math.log(b);
  if (Math.abs(d - c) < 1e-9) return { c, res: "O(" + (Math.abs(d) < 1e-12 ? "log n" : Math.abs(d - 1) < 1e-12 ? "n log n" : pow(d) + " log n") + ")", why: "every level does the same work", kind: "equal" };
  if (d < c) return { c, res: "O(" + pow(c) + ")", why: "the leaves do the most work", kind: "leaves" };
  return { c, res: "O(" + pow(d) + ")", why: "the root does the most work", kind: "root" };
}
/* The polynomial form of the master theorem, T(n) = a·T(n/b) + Θ(n^d), holds for a ≥ 1, b > 1, d ≥ 0,
   and in this form the three cases are decided by d against log_b a alone (no regularity condition).
   The level table also needs whole subproblem counts and sizes, so a and b must be integers and n = b^L. */
export function check(a, b, d) {
  if (![a, b, d].every(Number.isFinite)) return "Choose numbers for a, b and d.";
  if (!Number.isInteger(a) || a < 1) return "a must be a whole number of subproblems, at least 1.";
  if (!Number.isInteger(b) || b < 2) return "b must be a whole number greater than 1, so each subproblem is smaller.";
  if (d < 0) return "d must be at least 0: the extra work cannot shrink below a constant.";
  if (a > 8 || b > 4 || d > 3) return "This table supports a up to 8, b up to 4 and d up to 3.";
  return null;
}
export function levels(a, b, d, L) {
  const n = Math.pow(b, L), rows = [];
  for (let i = 0; i <= L; i++) {
    const count = Math.pow(a, i), size = n / Math.pow(b, i), per = Math.pow(size, d);
    rows.push({ i, count, size, per, total: count * per });
  }
  return { n, rows };
}
const recText = (a, b, d) => `T(n) = ${a === 1 ? "" : a}T(n/${b}) + ${d ? pow(d) : "1"}`;

export function mount(host, data) {
  const L = data.levels;
  const [a0, b0, d0] = data.presets[data.start];
  let a = a0, b = b0, d = d0, sel = null;

  const wrap = h("div", { class: "rx" });
  const presets = h("fieldset", { class: "inst-choice" });
  presets.appendChild(h("legend", {}, "Try a recurrence"));
  const radios = data.presets.map(([pa, pb, pd], k) => {
    const id = `rx-p${k}`;
    const r = h("input", { type: "radio", name: "rx-preset", id, value: String(k) });
    const lab = h("label", { for: id }, recText(pa, pb, pd));
    presets.append(r, lab);
    r.addEventListener("change", () => { [a, b, d] = data.presets[k]; sel = null; sync(); render(); });
    return r;
  });
  const abd = h("div", { class: "rx__abd" });
  const mk = (name, values, label) => {
    const lab = h("label", {}, "");
    lab.append(h("span", {}, label));
    const s = h("select", { "aria-label": name });
    for (const v of values) s.appendChild(h("option", { value: String(v) }, String(v)));
    lab.appendChild(s);
    abd.appendChild(lab);
    return s;
  };
  const sa = mk("a, the number of subproblems", [1, 2, 3, 4, 5, 6, 7, 8], "a");
  const sb = mk("b, how much smaller each subproblem is", [2, 3, 4], "b");
  const sd = mk("d, the exponent of the extra work", [0, 0.5, 1, 1.5, 2, 3], "d");
  for (const s of [sa, sb, sd]) s.addEventListener("change", () => { a = parseFloat(sa.value); b = parseFloat(sb.value); d = parseFloat(sd.value); sel = null; sync(); render(); });
  const reset = h("button", { type: "button", class: "inst-btn" }, "Reset");
  reset.addEventListener("click", () => { [a, b, d] = data.presets[data.start]; sel = null; sync(); render(); });
  abd.appendChild(reset);

  const assume = h("p", { class: "inst-note" }, "Assumes T(n) = a·T(n/b) + Θ(nᵈ) with a ≥ 1, b > 1 and d ≥ 0. Here n is a power of b, so every size is a whole number.");
  const head = h("p", { class: "instrument__q" });
  const tableWrap = h("div", { class: "instrument__tablewrap" });
  const ratio = h("p", { class: "inst-read" });
  const verdictP = h("p", { class: "instrument__verdict" });
  const read = h("p", { class: "inst-read inst-read--topic", "aria-live": "polite" });
  wrap.append(presets, abd, assume, head, tableWrap, ratio, verdictP, read);
  host.insertBefore(wrap, host.querySelector(".instrument__static"));

  function sync() {
    sa.value = String(a); sb.value = String(b); sd.value = String(d);
    radios.forEach((r, k) => { const [pa, pb, pd] = data.presets[k]; r.checked = pa === a && pb === b && pd === d; });
  }

  function render() {
    const problem = check(a, b, d);
    if (problem) {
      // no table and no verdict unless the theorem's assumptions hold
      head.textContent = "";
      tableWrap.replaceChildren(h("p", { class: "inst-read rx__invalid", role: "alert" }, problem));
      ratio.textContent = ""; verdictP.textContent = ""; read.textContent = "";
      return;
    }
    const { n, rows } = levels(a, b, d, L);
    const v = verdict(a, b, d);
    const max = Math.max(...rows.map((r) => r.total));
    const sum = rows.reduce((s, r) => s + r.total, 0);
    head.textContent = `${recText(a, b, d)}, with n = ${num(n)}`;
    const t = h("table", { class: "instrument__table rx__table" });
    t.appendChild(h("caption", {}, "Work at each level of the recursion tree. Choose a level to read it."));
    const th = h("tr");
    for (const c of ["level", "subproblems", "size of each", "work in each", "level total", ""]) th.appendChild(h("th", { scope: "col" }, c));
    t.appendChild(h("thead")).appendChild(th);
    const tb = t.appendChild(h("tbody"));
    for (const r of rows) {
      const leaf = r.i === L;
      const tr = h("tr", leaf ? { class: "is-leaf" } : {});
      const cell = h("th", { scope: "row" });
      const btn = h("button", { type: "button", class: "rx__lvl", "aria-pressed": String(sel === r.i) }, leaf ? "leaves" : `level ${r.i}`);
      btn.addEventListener("click", () => { sel = sel === r.i ? null : r.i; render(); });
      cell.appendChild(btn); tr.appendChild(cell);
      for (const x of [r.count, r.size, r.per, r.total]) tr.appendChild(h("td", {}, num(x)));
      const bar = h("td", { class: "rx__barcell", "aria-hidden": "true" });
      const fill = h("span", { class: "rx__bar" + (r.total === max ? " is-max" : "") });
      fill.style.width = (100 * r.total / max).toFixed(1) + "%";
      bar.appendChild(fill); tr.appendChild(bar);
      if (sel === r.i) tr.classList.add("is-sel");
      tb.appendChild(tr);
    }
    const tf = h("tr", { class: "rx__sum" });
    tf.append(h("th", { scope: "row" }, "sum"), h("td", {}, ""), h("td", {}, ""), h("td", {}, ""), h("td", {}, num(sum)), h("td", {}, ""));
    t.appendChild(h("tfoot")).appendChild(tf);
    tableWrap.replaceChildren(t);

    const r = a / Math.pow(b, d);
    ratio.textContent = `Each level's total is a ÷ bᵈ = ${a} ÷ ${num(Math.pow(b, d))} = ${num(r)} times the level above it. `
      + (Math.abs(r - 1) < 1e-9 ? "So every level costs the same, and there are about log n of them."
        : r > 1 ? "So the totals grow toward the leaves, and the bottom level outweighs the rest."
        : "So the totals shrink toward the leaves, and the top level outweighs the rest.");
    verdictP.textContent = `log${sub(b)} ${a} = ${String(+v.c.toFixed(3))} against d = ${d}: ${v.why}, so T(n) = ${v.res}.`;

    if (sel == null) { read.textContent = ""; return; }
    const row = rows[sel];
    read.textContent = sel === L
      ? `The leaves: ${num(row.count)} subproblems of size 1, each a constant amount of work. That is a^levels = n^(log_b a) = ${num(row.count)}: the part the leaves contribute.`
      : `Level ${sel}: ${num(row.count)} subproblem${row.count === 1 ? "" : "s"} of size ${num(row.size)}, each doing ${d === 1 ? num(row.per) : num(row.size) + "^" + d + " = " + num(row.per)} work, so ${num(row.total)} in total — that is nᵈ·(a/bᵈ)^${sel} = ${num(Math.pow(n, d))}·${num(r)}^${sel}.`;
  }
  const sub = (x) => String(x).split("").map((c) => "₀₁₂₃₄₅₆₇₈₉"[+c] || c).join("");

  sync();
  render();
  return { pause() {}, destroy() { wrap.remove(); } };
}
