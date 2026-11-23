/* Scroll-linked motion. Every value is computed from the current scroll position alone
   (never accumulated), so scrolling back reverses it exactly and a refresh lands in the
   right state. Native scrolling only: a passive listener asks the shared frame loop for
   one update; nothing runs when no scene with motion is near the viewport.

     02 [data-drift]   fragments drift a few units toward the figure, centred on rest
     03 [data-travel]  arriving parts move part-way along their own construction paths
     04 [data-fly]     the figure climbs its dotted path from the take-off mark;
        [data-at]      trail positions appear once the figure has passed them

   At rest (scene top at the viewport top) every effect equals the static drawing,
   except 03's parts, which stop short of their slots by design. */
import { request, cancel } from "../core/raf.js";
import { viewport, onResize } from "../core/env.js";
import { allowNonessential } from "../motion.js";

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);   // easeInOutQuad

function nums(str) { return str.trim().split(/\s+/).map(Number); }

/* Give an SVG element its own transform items once, so frames only set numbers. */
function ownTransforms(el, kinds) {
  const svg = el.ownerSVGElement;
  const list = el.transform.baseVal;
  list.clear();
  const items = [];
  for (const k of kinds) {
    const t = svg.createSVGTransform();
    if (k === "scale") t.setScale(1, 1); else if (k === "rotate") t.setRotate(0, 0, 0); else t.setTranslate(0, 0);
    list.appendItem(t);
    items.push(list.getItem(list.numberOfItems - 1));
  }
  return items;
}

export function init(scenes) {
  const tracks = [];

  for (const scene of scenes) {
    const fx = scene.dataset.fx.split(" ");
    const track = { scene, top: 0, h: 1, active: false, drift: [], travel: [], fly: null, trail: [], last: -1 };

    if (fx.includes("drift") && allowNonessential()) {
      for (const el of scene.querySelectorAll("[data-drift]")) {
        const [dx, dy] = nums(el.dataset.drift);
        if (!Number.isFinite(dx) || !Number.isFinite(dy)) continue;
        track.drift.push({ el, dx, dy, t: null, orig: el.getAttribute("transform") });
      }
    }
    if (fx.includes("travel")) {
      for (const el of scene.querySelectorAll("[data-travel]")) {
        const v = nums(el.dataset.travel);
        if (v.length !== 10 || v.some((x) => !Number.isFinite(x))) continue;
        track.travel.push({ el, v, items: null, orig: el.getAttribute("transform") });
      }
    }
    if (fx.includes("fly")) {
      const el = scene.querySelector("[data-fly]");
      const v = el ? nums(el.dataset.fly) : [];
      if (el && v.length === 8 && v.every(Number.isFinite)) {
        track.fly = { el, v, item: null, orig: el.getAttribute("transform") };
        for (const g of scene.querySelectorAll("[data-at]")) {
          const at = Number(g.dataset.at);
          if (Number.isFinite(at)) track.trail.push({ el: g, at, ahead: false });
        }
      }
    }
    if (track.drift.length || track.travel.length || track.fly) tracks.push(track);
  }
  if (!tracks.length) return () => {};

  // transform items are created once; frames only change their numbers
  for (const tr of tracks) {
    for (const d of tr.drift) d.t = ownTransforms(d.el, ["translate"])[0];
    for (const p of tr.travel) {
      p.items = ownTransforms(p.el, ["translate", "rotate", "scale"]);
      p.items[0].setTranslate(p.v[0], p.v[1]);          // start exactly where the static drawing has it
      p.items[1].setRotate(p.v[6], 0, 0);
      p.items[2].setScale(p.v[8], p.v[8]);
    }
    if (tr.fly) tr.fly.item = ownTransforms(tr.fly.el, ["translate"])[0];
  }

  function measure() {
    const y = window.scrollY;
    for (const tr of tracks) {
      const r = tr.scene.getBoundingClientRect();
      tr.top = r.top + y;
      tr.h = r.height || 1;
      tr.last = -1;
    }
  }

  function update() {
    const y = window.scrollY;
    const vh = viewport.h;
    for (const tr of tracks) {
      if (!tr.active) continue;
      const top = tr.top - y;
      if (tr.drift.length) {
        // -1 as the scene enters from below, 0 at rest (top = 0), +1 as it leaves above
        const f = Math.abs(top) < 1 ? 0 : top > 0 ? -Math.min(top / vh, 1) : Math.min(-top / tr.h, 1);
        for (const d of tr.drift) d.t.setTranslate(d.dx * f, d.dy * f);
      }
      // 0 when the scene's top is 85% down the viewport, 1 when it reaches the top
      const raw = clamp01((vh * 0.85 - top) / (vh * 0.85));
      const p = raw > 0.999 ? 1 : ease(raw);              // land exactly on the static pose at rest
      if (p === tr.last) continue;
      tr.last = p;
      for (const part of tr.travel) {
        const [ox, oy, qx, qy, x, yy, r0, r1, sc, reach] = part.v;
        const t = reach * p, u = 1 - t;
        part.items[0].setTranslate(u * u * ox + 2 * u * t * qx + t * t * x, u * u * oy + 2 * u * t * qy + t * t * yy);
        part.items[1].setRotate(r0 + (r1 - r0) * t, 0, 0);
        part.items[2].setScale(sc, sc);
      }
      if (tr.fly) {
        const [x0, y0, c1x, c1y, c2x, c2y, fx, fy] = tr.fly.v;
        const u = 1 - p;
        const bx = u * u * u * x0 + 3 * u * u * p * c1x + 3 * u * p * p * c2x + p * p * p * fx;
        const by = u * u * u * y0 + 3 * u * u * p * c1y + 3 * u * p * p * c2y + p * p * p * fy;
        tr.fly.item.setTranslate(bx - fx, by - fy);   // offset from the arrived (static) pose
        for (const g of tr.trail) {
          const ahead = p < g.at;
          if (ahead !== g.ahead) { g.ahead = ahead; g.el.classList.toggle("is-ahead", ahead); }
        }
      }
    }
  }

  const onScroll = () => request(update);
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const tr = tracks.find((t) => t.scene === e.target);
      if (tr) tr.active = e.isIntersecting;
    }
    request(update);
  }, { rootMargin: "25% 0px 25% 0px" });

  measure();
  for (const tr of tracks) io.observe(tr.scene);
  window.addEventListener("scroll", onScroll, { passive: true });
  const offResize = onResize(() => { measure(); request(update); });
  const onLoad = () => { measure(); request(update); };          // fonts/images can shift offsets
  window.addEventListener("load", onLoad);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(onLoad).catch(() => {});

  return function destroy() {
    io.disconnect();
    cancel(update);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("load", onLoad);
    offResize();
    for (const tr of tracks) {
      for (const d of tr.drift) restoreAttr(d.el, d.orig);
      for (const p of tr.travel) restoreAttr(p.el, p.orig);
      if (tr.fly) restoreAttr(tr.fly.el, tr.fly.orig);
      for (const g of tr.trail) g.el.classList.remove("is-ahead");
    }
  };
}

function restoreAttr(el, orig) {
  if (orig === null) el.removeAttribute("transform"); else el.setAttribute("transform", orig);
}
