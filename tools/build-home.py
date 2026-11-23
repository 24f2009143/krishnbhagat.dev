"""Offline authoring helper for krishnbhagat.dev's homepage. NOT a build step.

The site is plain static files. This script only (re)writes /index.html, whose
inline SVG geometry (wings, fragments, scenes) is easier to compute than to type.
Edit the geometry here, run it, and commit the resulting index.html.

    python3 tools/build-home.py              # writes ../index.html
    python3 tools/build-home.py /tmp/out.html

Every fragment is redrawn from material in /nerdhub/ (PDSA and MLT study sites).
"""
import math, os, re, sys

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "index.html")

def n(x):
    s = f"{x:.1f}"
    return s[:-2] if s.endswith(".0") else s

# ---------------------------------------------------------------- fragments
# Every fragment is redrawn from material that exists in /nerdhub/.
# (w, h, markup). Coordinates are local to the symbol's viewBox.

def heap_tree():
    vals = [2, 5, 10, 15, 7, 20, 25, 18, 19]          # PDSA heaps topic, min-heap example
    pos = [(75, 10), (37, 36), (113, 36), (18, 62), (56, 62), (94, 62), (132, 62), (9, 86), (27, 86)]
    s = []
    for i in range(len(vals)):
        for c in (2 * i + 1, 2 * i + 2):
            if c < len(vals):
                (x1, y1), (x2, y2) = pos[i], pos[c]
                s.append(f'<line class="ln" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}"/>')
    for (x, y), v in zip(pos, vals):
        s.append(f'<circle class="ln bg" cx="{x}" cy="{y}" r="7"/><text class="tx" x="{x}" y="{y + 2.6}" font-size="7" text-anchor="middle">{v}</text>')
    return 150, 96, "".join(s)

def heap_array():
    vals = [2, 5, 10, 15, 7, 20, 25, 18, 19]
    s = []
    for i, v in enumerate(vals):
        x = 4 + i * 16
        s.append(f'<rect class="ln" x="{x}" y="4" width="16" height="14"/><text class="tx" x="{x + 8}" y="14" font-size="7" text-anchor="middle">{v}</text>')
        s.append(f'<text class="tx dim" x="{x + 8}" y="27" font-size="5.5" text-anchor="middle">{i}</text>')
    return 152, 30, "".join(s)

def dtree():
    s = [
        '<line class="ln" x1="65" y1="20" x2="27" y2="42"/><line class="ln" x1="65" y1="20" x2="105" y2="48"/>',
        '<line class="ln" x1="27" y1="58" x2="12" y2="76"/><line class="ln" x1="27" y1="58" x2="44" y2="76"/>',
        '<text class="nt" x="38" y="29" font-size="7">yes</text><text class="nt" x="88" y="31" font-size="7">no</text>',
        '<rect class="ln bg" x="42" y="4" width="46" height="16" rx="3"/><text class="tx" x="65" y="15" font-size="7" text-anchor="middle">x₁ ≤ 3 ?</text>',
        '<rect class="ln bg" x="4" y="42" width="46" height="16" rx="3"/><text class="tx" x="27" y="53" font-size="7" text-anchor="middle">x₂ ≤ 5 ?</text>',
        '<circle class="ln bg" cx="105" cy="54" r="7"/><text class="tx" x="105" y="56.6" font-size="7" text-anchor="middle">B</text>',
        '<circle class="ln bg" cx="12" cy="80" r="6"/><text class="tx" x="12" y="82.4" font-size="6.5" text-anchor="middle">A</text>',
        '<circle class="ln bg" cx="44" cy="80" r="6"/><text class="tx" x="44" y="82.4" font-size="6.5" text-anchor="middle">B</text>',
    ]
    return 130, 90, "".join(s)

def graph():
    # PDSA graphs: relaxation, dist[u]=4, edge weight 3, dist[v] goes 10 -> 7
    N = {"s": (12, 44), "u": (52, 14), "v": (118, 24), "x": (60, 72), "t": (124, 70)}
    E = [("s", "u", 4), ("u", "v", 3), ("s", "x", 2), ("x", "t", 6), ("v", "t", 1), ("u", "x", 5)]
    s = []
    for a, b, w in E:
        (x1, y1), (x2, y2) = N[a], N[b]
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        hl = " hi" if (a, b) == ("u", "v") else ""
        s.append(f'<line class="ln{hl}" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}"/><text class="tx dim" x="{n(mx + 3)}" y="{n(my - 3)}" font-size="6">{w}</text>')
    for k, (x, y) in N.items():
        s.append(f'<circle class="ln bg" cx="{x}" cy="{y}" r="6"/><text class="tx" x="{x}" y="{y + 2.3}" font-size="6.5" text-anchor="middle">{k}</text>')
    s.append('<text class="nt" x="38" y="5" font-size="6.5">4</text>')
    s.append('<text class="nt" x="104" y="8" font-size="6.5"><tspan class="strike">10</tspan> 7</text>')
    return 136, 84, "".join(s)

def knn():
    a = [(14, 18), (24, 30), (12, 40), (30, 14), (20, 58), (36, 64)]
    b = [(80, 20), (92, 34), (74, 58), (96, 62), (86, 74), (70, 40)]
    s = ['<circle class="ln dash" cx="58" cy="44" r="19"/>']
    s += [f'<circle class="dot" cx="{x}" cy="{y}" r="2.6"/>' for x, y in a]
    s += [f'<circle class="ln" cx="{x}" cy="{y}" r="2.6"/>' for x, y in b]
    s += ['<circle class="dot" cx="44" cy="50" r="2.6"/><circle class="ln" cx="70" cy="40" r="2.6"/><circle class="ln" cx="66" cy="58" r="2.6"/>']
    s += ['<text class="tx" x="55.5" y="47" font-size="9">?</text><text class="nt" x="64" y="18" font-size="7">k = 3</text>']
    return 110, 84, "".join(s)

def regress():
    pts = [(16, 66), (26, 58), (34, 62), (46, 48), (56, 50), (66, 38), (78, 36), (88, 28), (100, 24), (110, 14)]
    s = ['<polyline class="ln dim" points="8,4 8,76 120,76"/>', '<line class="ln" x1="12" y1="70" x2="118" y2="14"/>']
    for x, y in pts:
        ly = 70 - (x - 12) * (56 / 106)
        s.append(f'<line class="ln dim dash" x1="{x}" y1="{y}" x2="{x}" y2="{n(ly)}"/><circle class="dot" cx="{x}" cy="{y}" r="2"/>')
    s.append('<text class="tx dim" x="98" y="84" font-size="6">x</text><text class="tx dim" x="0" y="8" font-size="6">y</text>')
    return 124, 86, "".join(s)

def lasso():
    s = ['<line class="ln dim" x1="6" y1="54" x2="96" y2="54"/><line class="ln dim" x1="50" y1="94" x2="50" y2="8"/>',
         '<polygon class="ln" points="50,32 72,54 50,76 28,54"/>',
         '<circle class="ln dash" cx="50" cy="54" r="22"/>']
    for k in (1.0, 1.55, 2.1):
        s.append(f'<ellipse class="ln dim" cx="76" cy="22" rx="{n(18 * k)}" ry="{n(8 * k)}" transform="rotate(-24 76 22)"/>')
    s += ['<circle class="dot hi" cx="50" cy="32" r="2.4"/><text class="nt" x="54" y="44" font-size="7">w₁ = 0</text>',
          '<text class="tx dim" x="6" y="88" font-size="6">L1 ◇  L2 ○</text>']
    return 100, 96, "".join(s)

def recur():
    s = ['<text class="tx" x="75" y="10" font-size="8.5" text-anchor="middle">T(n) = 2T(n/2) + n</text>']
    L = [[(75, 28, "n")], [(45, 44, "n/2"), (105, 44, "n/2")], [(30, 60, "n/4"), (60, 60, "n/4"), (90, 60, "n/4"), (120, 60, "n/4")]]
    for lv in range(2):
        for i, (x, y, _) in enumerate(L[lv]):
            for c in L[lv + 1][2 * i:2 * i + 2]:
                s.append(f'<line class="ln dim" x1="{x}" y1="{y + 3}" x2="{c[0]}" y2="{c[1] - 7}"/>')
    for lv in L:
        for x, y, t in lv:
            s.append(f'<text class="tx" x="{x}" y="{y}" font-size="6.5" text-anchor="middle">{t}</text>')
    s.append('<text class="nt" x="136" y="62" font-size="6.5">…</text>')
    return 150, 68, "".join(s)

def cv():
    s = []
    for i in range(5):
        for j in range(5):
            cls = "dot" if i == j else "ln"
            s.append(f'<rect class="{cls}" x="{4 + j * 18}" y="{4 + i * 11}" width="16" height="8"/>')
    s.append('<text class="nt" x="96" y="60" font-size="6.5" text-anchor="end">k = 5</text>')
    return 96, 64, "".join(s)

def entropy():
    return 124, 16, '<text class="tx" x="2" y="11" font-size="8.5">H(S) = −Σ p log₂ p</text>'

def relax():
    return 190, 16, '<text class="tx" x="2" y="11" font-size="8">dist[v] ← min(dist[v], dist[u] + w)</text>'

def figure():
    # abstract, architectural: a tapered spine, a ring for a head, a shoulder bar with a pivot joint
    # drawn like a drafting compass: head ring, a shoulder harness with two wing mounts,
    # an open tapered torso, a hinge, and two legs set wide enough to read as a stance
    s = ['<circle class="ln" cx="20" cy="10" r="5.5"/>',
         '<line class="ln" x1="20" y1="15.5" x2="20" y2="24"/>',
         '<line class="ln harness" x1="9" y1="27" x2="31" y2="27"/>',
         '<polygon class="ln bg torso" points="12.5,27 27.5,27 21.6,94 18.4,94"/>',
         '<line class="ln dim" x1="20" y1="31" x2="20" y2="90"/>',
         '<circle class="ln bg" cx="9" cy="27" r="2.6"/>',
         '<circle class="ln bg" cx="31" cy="27" r="2.6"/>',
         '<line class="ln" x1="20" y1="97" x2="6" y2="166"/>',
         '<line class="ln" x1="20" y1="97" x2="34" y2="166"/>',
         '<line class="ln dim" x1="10.5" y1="144" x2="29.5" y2="144"/>',
         '<circle class="ln bg" cx="20" cy="96" r="3"/>',
         '<line class="ln dim dash" x1="20" y1="170" x2="20" y2="198"/>']
    return 40, 200, "".join(s)

FRAGS = {
    "heap": heap_tree(), "array": heap_array(), "dtree": dtree(), "graph": graph(), "knn": knn(),
    "regress": regress(), "lasso": lasso(), "recur": recur(), "cv": cv(), "entropy": entropy(),
    "relax": relax(), "figure": figure(),
}
SOURCE = {  # catalogue captions: where each fragment came from
    "heap": "PDSA · heaps", "array": "PDSA · heap as array", "dtree": "MLT · decision trees", "graph": "PDSA · graphs",
    "knn": "MLT · k-NN", "regress": "MLT · linear regression", "lasso": "MLT · ridge / lasso", "recur": "PDSA · recurrences",
    "cv": "MLT · cross-validation", "entropy": "MLT · entropy", "relax": "PDSA · Dijkstra",
}

def sprite():
    out = []
    for k, (w, h, body) in FRAGS.items():
        out.append(f'<symbol id="f-{k}" viewBox="0 0 {w} {h}" overflow="visible">{body}</symbol>')
    return ("<svg class=\"sprite\" width=\"0\" height=\"0\" aria-hidden=\"true\" focusable=\"false\"><defs>"
            + "".join(out) + "</defs></svg>")

def use(k, x, y, rot=0, sc=1, cls=""):
    w, h, _ = FRAGS[k]
    c = f' class="{cls}"' if cls else ""
    return (f'<g{c} transform="translate({n(x)} {n(y)}) rotate({n(rot)}) scale({sc})">'
            f'<use href="#f-{k}" x="{n(-w / 2)}" y="{n(-h / 2)}" width="{w}" height="{h}"/></g>')

def fig(x, y, sc=1, rot=0):
    # shoulder joint of the figure is at (20,30) in the symbol
    return (f'<g class="c-ink" transform="translate({n(x)} {n(y)}) rotate({n(rot)}) scale({sc})">'
            f'<use href="#f-figure" x="-20" y="-27" width="40" height="200"/></g>')

# ---------------------------------------------------------------- wings
SPARS = [(-34, 430), (-20, 400), (-6, 350), (8, 285), (22, 210)]
ROOT = 11   # wings mount on the harness joints
RIBS = [110, 210, 300]
# panels: (fragment, between spar i and i+1, radius, scale)
LEFT = [("graph", 0, 330, .95), ("relax", 0, 175, .8), ("heap", 1, 300, .9), ("array", 1, 150, .78),
        ("recur", 2, 225, .85), ("heap", 3, 130, .55)]
RIGHT = [("dtree", 0, 330, .95), ("entropy", 0, 180, .85), ("regress", 1, 300, .9), ("lasso", 1, 150, .78),
         ("knn", 2, 225, .85), ("cv", 3, 130, .7)]

def pt(cx, cy, side, ang, r, sweep=0):
    a = math.radians(ang + sweep)
    return cx + side * (ROOT + r * math.cos(a)), cy + r * math.sin(a)

def wing(cx, cy, side, panels, state="built", sweep=0, hooks=False):
    """state: built | draft (construction drawing, parts still arriving)"""
    draft = state == "draft"
    sp = "ln spar dash" if draft else "ln spar"
    s = []
    tips = []
    for i, (ang, L) in enumerate(SPARS):
        x, y = pt(cx, cy, side, ang, L, sweep)
        tips.append((x, y))
        lead = " lead" if i == 0 else ""
        el = f'<line class="{sp}{lead}" x1="{n(cx + side * ROOT)}" y1="{n(cy)}" x2="{n(x)}" y2="{n(y)}"/>'
        s.append(dr(el, i) if hooks and not draft else el)
    edge = " ".join(f"{n(x)},{n(y)}" for x, y in tips)
    el = f'<polyline class="ln spar{" dash" if draft else ""}" points="{edge}"/>'
    s.append(dr(el, 5) if hooks and not draft else el)
    for ri, r in enumerate(RIBS):
        ps = [pt(cx, cy, side, a, r, sweep) for a, L in SPARS if L >= r]
        el = f'<polyline class="ln rib{" dash" if draft else ""}" points="{" ".join(f"{n(x)},{n(y)}" for x, y in ps)}"/>'
        s.append(dr(el, 6 + ri) if hooks and not draft else el)
        if not draft:
            js = "".join(f'<rect class="joint" x="{n(x - 2)}" y="{n(y - 2)}" width="4" height="4"/>' for x, y in ps)
            s.append(rv(js, 9 + ri) if hooks else js)
    for idx, (k, i, r, sc) in enumerate(panels):
        am = (SPARS[i][0] + SPARS[i + 1][0]) / 2
        x, y = pt(cx, cy, side, am, r, sweep)
        rot = side * (am + sweep)
        if draft and idx % 2 == 0:
            # target slot is drawn; the part is still in transit, rotated off-axis, with its path
            w, h, _ = FRAGS[k]
            s.append(f'<g transform="translate({n(x)} {n(y)}) rotate({n(rot)})"><rect class="ln slot" x="{n(-w * sc / 2)}" y="{n(-h * sc / 2)}" width="{n(w * sc)}" height="{n(h * sc)}"/></g>')
            ox, oy = x + side * 46, y + (58 if idx % 4 == 0 else -52)
            s.append(f'<path class="ln path" d="M{n(ox)} {n(oy)} Q{n((ox + x) / 2 + side * 30)} {n((oy + y) / 2)} {n(x)} {n(y)}"/>')
            r0 = rot + side * 13
            if hooks:
                # the motion layer moves this part a little way along its own construction path
                w, h, _ = FRAGS[k]
                qx, qy = (ox + x) / 2 + side * 30, (oy + y) / 2
                reach = .72 if idx % 4 == 0 else .48        # never fully locked
                s.append(f'<g class="c-frag" data-travel="{n(ox)} {n(oy)} {n(qx)} {n(qy)} {n(x)} {n(y)} {n(r0)} {n(rot)} {sc} {reach}" '
                         f'transform="translate({n(ox)} {n(oy)}) rotate({n(r0)}) scale({sc})">'
                         f'<use href="#f-{k}" x="{n(-w / 2)}" y="{n(-h / 2)}" width="{w}" height="{h}"/></g>')
            else:
                s.append(use(k, ox, oy, r0, sc, "c-frag"))
        else:
            u = use(k, x, y, rot, sc, "c-frag")
            s.append(rv(u, 12 + idx) if hooks and not draft else u)
    return "".join(s)

def draft_annotations(cx, cy, side):
    a = SPARS[4][0]
    x1, y1 = pt(cx, cy, side, a, 0)
    x2, y2 = pt(cx, cy, side, a, 210)
    # dimension line offset from spar 1, plus an angle arc at the root
    off = 14
    ux, uy = -math.sin(math.radians(a)) * off * -1, math.cos(math.radians(a)) * off
    s = [f'<line class="ln dim" x1="{n(x1 + ux)}" y1="{n(y1 + uy)}" x2="{n(x2 + ux)}" y2="{n(y2 + uy)}"/>',
         f'<text class="nt" x="{n((x1 + x2) / 2 + ux - 4)}" y="{n((y1 + y2) / 2 + uy + 18)}" font-size="11">r = 210</text>']
    r = 46
    p0 = pt(cx, cy, side, 0, r)
    p1 = pt(cx, cy, side, a, r)
    s.append(f'<path class="ln dim" d="M{n(p0[0])} {n(p0[1])} A{r} {r} 0 0 0 {n(p1[0])} {n(p1[1])}"/>')
    s.append(f'<line class="ln dim dash" x1="{n(cx + side * ROOT)}" y1="{cy}" x2="{n(p0[0] + side * 30)}" y2="{cy}"/>')
    s.append(f'<text class="nt" x="{n(p0[0] + side * 8)}" y="{n(cy + 34)}" font-size="11">+{a}°</text>')
    return "".join(s)

def sun(x, y, r, cls="c-sun"):
    if cls == "c-sun" and (x, y) == (SUNX, SUNY):
        # the far sun sits outside a phone's crop: draw a second, mobile-only position
        return sun(x, y, r, "c-sun d-only") + sun(835, 215, r, "c-sun m-only")
    return (f'<g class="{cls}"><circle class="ln sun-disc" cx="{x}" cy="{y}" r="{r}"/>'
            f'<circle class="ln" cx="{x}" cy="{y}" r="{n(r * .7)}" opacity=".45"/></g>')

def horizon(y, x1=0, x2=1200):
    return f'<line class="ln horizon" x1="{x1}" y1="{y}" x2="{x2}" y2="{y}"/>'

def caption(x, y, text, anchor="start"):
    return f'<text class="cap" x="{n(x)}" y="{n(y)}" text-anchor="{anchor}">{text}</text>'

def note(x, y, text, size=13, rot=0, cls=""):
    t = f' transform="rotate({rot} {n(x)} {n(y)})"' if rot else ""
    return f'<text class="nt {cls}" x="{n(x)}" y="{n(y)}" font-size="{size}"{t}>{text}</text>'

def rv(markup, i, attrs=""):
    """A part that the motion layer may reveal. Static rendering is unchanged."""
    return f'<g class="rv" style="--i:{i}"{attrs}>{markup}</g>'

def dr(el, i):
    """Mark one stroked element as drawable (motion layer draws it on with dashoffset)."""
    return re.sub(r"^<(line|polyline|path)", lambda m: f'<{m.group(1)} data-draw style="--i:{i}"', el, count=1)

def stage(body, label):
    return (f'<div class="scene__stage" aria-hidden="true"><svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" focusable="false">'
            f'<g class="mz">{body}</g></svg></div>')

# ---------------------------------------------------------------- scenes
FX, FY = 600, 330           # figure's shoulder: shared anchor for scenes 01-03
SUNX, SUNY = 1105, 95       # the sun, far and small, until scene 04

def s01():
    return stage(horizon(FY + 169, 360, 840) + sun(SUNX, SUNY, 9) + fig(FX, FY), "idea")

def s02():
    b = [horizon(FY + 169, 360, 840), sun(SUNX, SUNY, 9), fig(FX, FY)]
    # loose, uncommitted fragments. Some repeat, some are unfinished, one failed.
    loose = [("graph", 300, 190, -11, 1.0, ""), ("dtree", 870, 300, 7, 1.0, ""), ("lasso", 420, 400, 14, .95, ""),
             ("regress", 800, 470, -5, .95, "d-only"), ("heap", 230, 330, 4, .9, "d-only"), ("knn", 760, 150, -18, .9, ""),
             ("recur", 1010, 430, 9, .9, "d-only"), ("relax", 470, 110, -3, 1.1, "d-only"), ("cv", 980, 250, 22, .85, "d-only")]
    for i, (k, x, y, r, sc, extra) in enumerate(loose):
        dx, dy = (FX - x) * .03, (FY - y) * .03          # drift: a few units toward the figure
        b.append(rv(f'<g data-drift="{n(dx)} {n(dy)}">{use(k, x, y, r, sc, f"c-frag {extra}".strip())}</g>', i))
    # repeats: the same attempt made again, slightly shifted
    b.append(rv(use("graph", 312, 202, -6, 1.0, "c-ghost"), 10))
    b.append(rv(use("graph", 324, 214, -1, 1.0, "c-ghost2"), 12))
    # unfinished: half a decision tree, clipped mid-construction
    b.append('<clipPath id="half"><rect x="-200" y="-200" width="190" height="400"/></clipPath>')
    b.append(rv(f'<g clip-path="url(#half)" transform="translate(140 445)">{use("dtree", 0, 0, -9, 1.1, "c-frag d-only")}</g>', 6))
    # failed and fading: an attempt that didn't fit
    b.append(rv(use("entropy", 980, 560, 6, 1.1, "c-fade d-only"), 9))
    b.append(rv(use("array", 640, 560, -2, 1.0, "c-frag"), 8))
    b.append(dr('<line class="ln strike-line" x1="575" y1="545" x2="705" y2="574"/>', 13))
    b.append(rv(note(712, 590, "didn’t fit. keep it.", 13, -2), 14))
    b.append(rv(note(110, 245, "why not greedy here?", 13, -4, "d-only"), 11))
    b.append(rv(note(880, 380, "try k = 5?", 13, 3), 11))
    return stage("".join(b), "experiment")

def s03():
    b = [horizon(FY + 169, 300, 900), sun(SUNX, SUNY, 12)]
    b.append(wing(FX, FY, -1, LEFT, "built", hooks=True))
    b.append(wing(FX, FY, 1, RIGHT, "draft", hooks=True))
    b.append(draft_annotations(FX, FY, 1))
    b.append(fig(FX, FY))
    b.append(rv(note(FX - 330, FY + 120, "locked in", 13, 0, "d-only"), 18))
    b.append(note(FX + 250, FY + 150, "still arriving", 13, 0, "d-only"))
    return stage("".join(b), "build")

def s04():
    # smaller and higher than scene 03, on a visible climb off a raised horizon
    cx, cy, tilt, sweep, k = 690, 245, -12, -9, .68
    H = 672                                   # leaves room under the horizon at 1280x720 too
    # wide screens: the ground starts just before the take-off mark, clear of the text column
    b = [horizon(H, 540, 1200).replace('class="ln horizon"', 'class="ln horizon d-only"'),
         horizon(H).replace('class="ln horizon"', 'class="ln horizon m-only"')]
    b.append(sun(1080, 105, 34, "c-sun d-only") + sun(960, 110, 34, "c-sun m-only"))   # phones: fully inside 390px
    b.append(f'<g class="c-faint d-only">{use("graph", 230, 470, -4, 1.45)}</g>')
    b.append(caption(118, 395, "fig. a — PDSA graph, read as a map", "start").replace('class="cap"', 'class="cap d-only"'))
    b.append(f'<g class="c-land">{use("heap", 840, H - 86, 0, 1.75)}</g>')
    b.append(caption(840, H - 186, "fig. b — the heap [2, 5, 10, 15, 7, 20, 25, 18, 19]", "middle").replace('class="cap"', 'class="cap d-only"'))
    b.append(caption(840, H - 186, "fig. b — a heap from PDSA", "middle").replace('class="cap"', 'class="cap m-only"'))
    b.append(f'<g class="c-land d-only">{use("dtree", 1100, H - 68, 0, 1.5)}</g>')
    b.append(caption(1185, H - 152, "fig. c — MLT decision tree", "end").replace('class="cap"', 'class="cap d-only"'))
    # the climb: a take-off mark on the ground, a rising arc, two earlier positions left behind
    x0 = 590
    b.append(f'<g class="c-draft"><line class="ln" x1="{x0 - 7}" y1="{H - 7}" x2="{x0 + 7}" y2="{H + 7}"/>'
             f'<line class="ln" x1="{x0 - 7}" y1="{H + 7}" x2="{x0 + 7}" y2="{H - 7}"/></g>')
    fx, fy = cx, cy + 150 * k
    b.append(f'<path class="ln path climb" d="M{x0} {H} C {x0 + 30} {H - 150}, {n(fx - 90)} {n(fy + 110)}, {n(fx)} {n(fy)}"/>')
    for t, (gx, gy) in enumerate([(x0 + 38, H - 150), (x0 + 112, H - 262)]):
        b.append(f'<g class="c-ghost{"2" if t == 0 else ""}" data-at="{(.3, .55)[t]}" transform="translate({gx} {gy}) scale(.3)">'
                 f'<use href="#f-figure" x="-20" y="-27" width="40" height="200"/></g>')
    b.append(note(x0 + 18, H - 10, "left the ground here", 12, 0, "d-only"))
    # data-fly: the climb curve; the motion layer moves the figure along it (static = arrived)
    b.append(f'<g data-fly="{x0} {H} {x0 + 30} {H - 150} {n(fx - 90)} {n(fy + 110)} {n(fx)} {n(fy)}">'
             f'<g transform="translate({cx} {cy}) scale({k}) translate({-cx} {-cy}) rotate({tilt} {cx} {cy})">'
             + wing(cx, cy, -1, LEFT, "built", sweep) + wing(cx, cy, 1, RIGHT, "built", sweep) + fig(cx, cy) + "</g></g>")
    return stage("".join(b), "takeoff")

def s05():
    sx, sy, r = 790, 330, 175
    b = [horizon(742, 0, 1200)]
    # the sun as a blueprint: half of it still burns, half is construction drawing
    b.append(f'<g class="c-sun"><path class="ln sun-disc" d="M{sx} {sy + r} A{r} {r} 0 0 1 {sx} {sy - r}"/></g>')
    b.append('<g class="c-draft">'
             + rv(f'<path class="ln dash" d="M{sx} {sy - r} A{r} {r} 0 0 1 {sx} {sy + r}"/>', 0)
             + dr(f'<line class="ln dim" x1="{sx - r - 30}" y1="{sy}" x2="{sx + r + 30}" y2="{sy}"/>', 1)
             + dr(f'<line class="ln dim" x1="{sx}" y1="{sy - r - 30}" x2="{sx}" y2="{sy + r + 30}"/>', 2)
             + dr(f'<line class="ln" x1="{sx}" y1="{sy}" x2="{n(sx + r * math.cos(math.radians(-35)))}" y2="{n(sy + r * math.sin(math.radians(-35)))}"/>', 4)
             + rv(note(sx + 70, sy - 70, "r = ?", 14), 6)
             # an opening: a doorway drawn inside the sun
             + rv(f'<rect class="ln door" x="{sx - 42}" y="{sy - 40}" width="84" height="{r + 40 - 22}"/>', 5)
             + dr(f'<line class="ln dim" x1="{sx - 42}" y1="{sy - 52}" x2="{sx + 42}" y2="{sy - 52}"/>', 6)
             + rv(note(sx - 40, sy - 58, "84", 10), 7)
             + rv(note(sx + 50, sy + 70, "a door?", 13), 8)
             + '</g>')
    # a new system starts growing out of it: nodes with almost no connections yet
    nodes = [(1005, 250), (1060, 205), (1100, 290), (1040, 345), (1130, 180), (1150, 360)]
    g = ['<g class="c-draft d-only">']
    g.append(dr(f'<line class="ln" x1="{sx + r}" y1="{sy}" x2="1005" y2="250"/>', 7) + dr('<line class="ln" x1="1005" y1="250" x2="1060" y2="205"/>', 9))
    g.append(rv('<line class="ln dash" x1="1060" y1="205" x2="1100" y2="290"/>', 11))
    for j, (x, y) in enumerate(nodes):
        g.append(rv(f'<circle class="ln bg" cx="{x}" cy="{y}" r="6"/>', 8 + j))
    g.append(rv(note(1050, 410, "not built yet", 13), 14))
    g.append("</g>")
    b.append("".join(g))
    # the figure arrives, small, still carrying the same wings
    fx, fy = 470, 420
    b.append(f'<g transform="translate({fx} {fy}) scale(.34) translate({-fx} {-fy}) rotate(-14 {fx} {fy})">'
             + wing(fx, fy, -1, LEFT, "built", -7) + wing(fx, fy, 1, RIGHT, "built", -7) + fig(fx, fy) + "</g>")
    # and the loop: arriving here points back to the start
    b.append(rv(f'<path class="ln path" d="M{sx - 140} {sy + 140} C {sx - 300} {sy + 260}, 260 520, 150 400" marker-end="url(#arrow)"/>', 12))
    b.append('<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 1L9 5L0 9" class="ln"/></marker></defs>')
    b.append(rv(note(60, 380, "→ 01, again", 13), 14))
    return stage("".join(b), "next")

# ---------------------------------------------------------------- lab drawings (small, inline)
def mini(k, w=220, h=130, sc=1.2, extra=""):
    return (f'<svg class="specimen__art" viewBox="0 0 {w} {h}" aria-hidden="true" focusable="false">'
            f'<g class="c-frag">{use(k, w / 2, h / 2, 0, sc)}</g>{extra}</svg>')

def mini_world():
    # nerdhub: two worlds joined by one edge (a graph node and a tree)
    return ('<svg class="specimen__art" viewBox="0 0 220 130" aria-hidden="true" focusable="false"><g class="c-frag">'
            + use("heap", 60, 64, 0, .8) + use("dtree", 165, 64, 0, .84)
            + '<line class="ln dash" x1="118" y1="46" x2="134" y2="46"/></g></svg>')

def mini_wing():
    s = '<svg class="specimen__art" viewBox="0 0 220 130" aria-hidden="true" focusable="false"><g transform="translate(110 66) scale(.245) translate(-600 -330)">'
    s += wing(600, 330, -1, LEFT, "built") + wing(600, 330, 1, RIGHT, "built") + fig(600, 330)
    return s + "</g></svg>"

def mini_empty():
    return ('<svg class="specimen__art" viewBox="0 0 220 130" aria-hidden="true" focusable="false"><g class="c-draft">'
            '<rect class="ln dash" x="70" y="22" width="80" height="86"/>'
            '<line class="ln dim" x1="60" y1="22" x2="60" y2="108"/><line class="ln dim" x1="56" y1="22" x2="64" y2="22"/><line class="ln dim" x1="56" y1="108" x2="64" y2="108"/>'
            '<text class="nt" x="110" y="70" font-size="14" text-anchor="middle">?</text></g></svg>')

DOOR = ('<svg class="lab__door" viewBox="0 0 40 64" aria-hidden="true" focusable="false"><g class="c-sun">'
        '<path class="ln" d="M4 62 V4 H36 V62"/><line class="ln" x1="0" y1="62" x2="40" y2="62"/></g></svg>')

def page():
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Krishn Bhagat — creative builder</title>
<meta name="description" content="Krishn Bhagat builds things to find out what they can become. A lab of experiments, notes and study sites, including nerdhub.">
<meta name="theme-color" content="#0a0c10">
<link rel="icon" href="data:,">
<link rel="preload" href="/assets/fonts/source-serif-4-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/tokens.css">
<link rel="stylesheet" href="/assets/css/base.css">
<link rel="stylesheet" href="/assets/css/home.css">
<script type="module" src="/assets/js/main.js"></script>
</head>
<body class="home">
<a class="nh-skip" href="#main">Skip to content</a>
{sprite()}
<header class="home-header">
  <div class="nh-wrap">
    <a class="home-mark" href="/" aria-label="Krishn Bhagat, home">KB</a>
    <nav class="home-nav" aria-label="Primary">
      <a href="#lab">Lab</a>
      <a href="/nerdhub/">nerdhub</a>
      <a href="https://github.com/krishnbhagat01">GitHub</a>
    </nav>
  </div>
</header>

<main id="main">
  <!-- The story. Each scene is one state of the same drawing (shared 1200×800 coordinates).
       The text carries the meaning; the drawings are decorative (aria-hidden). -->
  <section class="scene scene--idea" id="idea" data-scene="01" aria-labelledby="t-idea">
    {s01()}
    <div class="scene__text nh-wrap">
      <h1 class="idea__name" id="t-idea">Krishn Bhagat</h1>
      <p class="idea__role">Creative builder</p>
      <a class="scroll-cue" href="#experiment">what are the wings made of? <span aria-hidden="true">↓</span></a>
    </div>
  </section>

  <section class="scene scene--experiment" id="experiment" data-scene="02" data-fx="reveal drift" aria-labelledby="t-exp">
    {s02()}
    <div class="scene__text nh-wrap">
      <p class="chapter">02 — Experiment</p>
      <h2 class="scene__title" id="t-exp">I try things.</h2>
      <p class="scene__lede">Most of them don’t fit anything yet. I keep them anyway.</p>
    </div>
  </section>

  <section class="scene scene--build" id="build" data-scene="03" data-fx="reveal travel" aria-labelledby="t-build">
    {s03()}
    <div class="scene__text nh-wrap">
      <p class="chapter">03 — Build</p>
      <h2 class="scene__title" id="t-build">Every attempt becomes a part.</h2>
      <p class="scene__lede">A heap, a graph, a decision tree: things I worked out once now hold the structure up.</p>
    </div>
  </section>

  <section class="scene scene--takeoff" id="takeoff" data-scene="04" data-fx="fly" aria-labelledby="t-takeoff">
    {s04()}
    <div class="scene__text nh-wrap">
      <p class="chapter">04 — Takeoff</p>
      <h2 class="scene__title" id="t-takeoff">Then it carries you.</h2>
      <p class="scene__lede">Not because the wings were given. Because they were made.</p>
    </div>
  </section>

  <section class="scene scene--next" id="next" data-scene="05" data-fx="reveal" aria-labelledby="t-next">
    {s05()}
    <div class="scene__text nh-wrap">
      <p class="chapter">05 — The next idea</p>
      <h2 class="scene__title" id="t-next">The sun was never the finish.</h2>
      <p class="scene__lede">Get close to one idea and it turns into the drawing for the next one.</p>
    </div>
  </section>

  <section class="lab" id="lab" data-scene="06" aria-labelledby="t-lab">
    <div class="nh-wrap">
      <header class="lab__head">
        {DOOR}
        <div>
          <p class="chapter">06 — The lab</p>
          <h2 class="lab__title" id="t-lab">Things I’ve made, and things I’m still making.</h2>
        </div>
      </header>

      <div class="lab__floor">
        <div class="specimens">
          <details class="specimen" id="kb-001">
            <summary>
              {mini_world()}
              <span class="specimen__label"><span class="specimen__no">KB-001</span> a world of study sites</span>
              <span class="specimen__hint">inspect</span>
            </summary>
            <div class="specimen__body">
              <h3>nerdhub</h3>
              <p>Study sites I built for my own courses: notes, past-paper practice, mocks and flashcards. The heap and the decision tree in the wings above came from here.</p>
              <ul class="specimen__doors">
                <li><a href="/nerdhub/pdsa-quiz-2/">PDSA Quiz 2</a> <span>5 topics · 159 past questions from 10 papers</span></li>
                <li><a href="/nerdhub/mlt/">MLT</a> <span>13 topics · 35 pages of Quiz 1 notes</span></li>
              </ul>
              <a class="nh-btn nh-btn--ghost" href="/nerdhub/">Enter nerdhub →</a>
              <p class="specimen__fine">The study sites ask for an IITM student sign-in.</p>
            </div>
          </details>

          <details class="specimen" id="kb-002">
            <summary>
              {mini_wing()}
              <span class="specimen__label"><span class="specimen__no">KB-002</span> a pair of wings</span>
              <span class="specimen__hint">inspect</span>
            </summary>
            <div class="specimen__body">
              <h3>This site</h3>
              <p>Drawn by hand in SVG, with no framework. Every fragment in the wings is redrawn from something worked out in nerdhub: a heap, a shortest-path graph, a recurrence, a decision tree, a regression fit, a nearest-neighbour sketch.</p>
              <a class="nh-btn nh-btn--ghost" href="https://github.com/krishnbhagat01/krishnbhagat.dev">Source on GitHub →</a>
            </div>
          </details>

          <details class="specimen specimen--empty" id="kb-003">
            <summary>
              {mini_empty()}
              <span class="specimen__label"><span class="specimen__no">KB-003</span> not built yet</span>
              <span class="specimen__hint">inspect</span>
            </summary>
            <div class="specimen__body">
              <p>Reserved for whatever comes next.</p>
            </div>
          </details>
        </div>

        <aside class="notebook" aria-labelledby="t-notebook">
          <h3 class="notebook__title" id="t-notebook">Notebook</h3>
          <ol class="notebook__log">
            <li><time datetime="2026-11-22">22 Nov 2026</time> Initial site: home, nerdhub, PDSA Quiz 2 and MLT study sites.</li>
            <li><time datetime="2026-11-22">22 Nov 2026</time> Cloud sync for MLT and PDSA, limited to IITM accounts. Firestore rules. Privacy page.</li>
            <li><time datetime="2026-11-22">22 Nov 2026</time> Sign-in wall and an owner-only admin page.</li>
            <li><time datetime="2026-11-23">23 Nov 2026</time> Started drawing the wings.</li>
          </ol>
        </aside>
      </div>
    </div>
  </section>
</main>

<footer class="home-footer">
  <div class="nh-wrap">
    <span>© Krishn Bhagat</span>
    <a href="https://github.com/krishnbhagat01">github.com/krishnbhagat01</a>
  </div>
</footer>
</body>
</html>
"""

open(OUT, "w").write(page())
print("wrote", OUT)
