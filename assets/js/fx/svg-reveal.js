/* svg-reveal: a one-time drawing-on of a scene when it first comes into view.

   Opt-in markup (written by tools/build-home.py):
     [data-draw]  a stroked line/polyline/path that is drawn on with stroke-dashoffset
     .rv          a group that fades and settles in (CSS), staggered by --i
   init(scene) -> destroy()

   Safety: nothing is hidden until the scene is armed, arming happens only here, and the
   scene returns to its exact static markup once the reveal finishes (or on destroy). */
import { onResize } from "../core/env.js";

const DRAW_MS = 1100;   // per stroke
const STEP_MS = 110;    // stagger between strokes (CSS uses the same numbers)
const SETTLE_MS = 3200; // after this, the scene is handed back to its static state

/* Length of a stroke in screen pixels. With vector-effect: non-scaling-stroke the browser
   measures dashes on screen, so user-space length is scaled by the element's screen CTM. */
function screenLength(el) {
  if (typeof el.getTotalLength !== "function") return 0;
  let len = 0;
  try { len = el.getTotalLength(); } catch (e) { return 0; }
  if (!(len > 0) || !Number.isFinite(len)) return 0;
  const m = el.getScreenCTM && el.getScreenCTM();
  if (!m) return 0;                                   // not rendered (e.g. hidden on this breakpoint)
  const scale = Math.hypot(m.a, m.b) || 1;
  return Math.ceil(len * scale) + 2;
}

export function init(scene) {
  if (!scene || !("IntersectionObserver" in window)) return () => {};
  const strokes = Array.from(scene.querySelectorAll("[data-draw]"));
  let measured = [];
  let done = false;
  let timer = 0;
  let io = null;
  let offResize = () => {};

  function measure() {
    measured = [];
    for (const el of strokes) {
      const px = screenLength(el);
      if (!px) { el.style.strokeDasharray = ""; el.style.strokeDashoffset = ""; continue; }
      el.style.strokeDasharray = `${px} ${px}`;
      el.style.strokeDashoffset = String(px);
      measured.push(el);
    }
  }

  function restore() {
    for (const el of strokes) { el.style.strokeDasharray = ""; el.style.strokeDashoffset = ""; }
    delete scene.dataset.armed;
    delete scene.dataset.in;
  }

  function reveal() {
    if (done) return;
    done = true;
    if (io) { io.disconnect(); io = null; }
    offResize();
    scene.dataset.in = "";
    for (const el of measured) el.style.strokeDashoffset = "0";
    timer = setTimeout(restore, SETTLE_MS);       // hand the scene back to its static markup
  }

  try {
    measure();
    scene.dataset.armed = "";
    void scene.getBoundingClientRect();           // commit the start state once, before any reveal
    offResize = onResize(() => { if (!done) measure(); });
    io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) reveal();
    }, { threshold: 0.22 });
    io.observe(scene);
  } catch (err) {
    restore();
    throw err;
  }

  return function destroy() {
    if (io) { io.disconnect(); io = null; }
    offResize();
    clearTimeout(timer);
    done = true;
    restore();
  };
}

export const timing = { DRAW_MS, STEP_MS, SETTLE_MS };
