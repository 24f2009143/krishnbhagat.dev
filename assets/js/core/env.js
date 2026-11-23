/* Environment facts the motion layer needs, cached so animation code never measures layout.
   Viewport size is read on resize only; subscribers are told after a short settle. */

const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

export const viewport = { w: window.innerWidth, h: window.innerHeight };

const resizeSubs = new Set();
let settle = 0;

function handleResize() {
  viewport.w = window.innerWidth;
  viewport.h = window.innerHeight;
  clearTimeout(settle);
  settle = setTimeout(() => { for (const fn of resizeSubs) fn(viewport); }, 120);
}

/* Subscribe to (settled) viewport changes. Returns an unsubscribe function. */
export function onResize(fn) {
  if (resizeSubs.size === 0) window.addEventListener("resize", handleResize, { passive: true });
  resizeSubs.add(fn);
  return () => {
    resizeSubs.delete(fn);
    if (resizeSubs.size === 0) { window.removeEventListener("resize", handleResize); clearTimeout(settle); }
  };
}

export function prefersReducedMotion() { return reducedQuery.matches; }

export function onReducedMotionChange(fn) {
  const handler = () => fn(reducedQuery.matches);
  reducedQuery.addEventListener("change", handler);
  return () => reducedQuery.removeEventListener("change", handler);
}

export function isHidden() { return document.hidden; }

/* Only signals that are reliable and explicit: the user asked to save data, or the
   browser reports very little memory. Ordinary phones are NOT treated as constrained. */
export function isConstrained() {
  const nav = navigator;
  if (nav.connection && nav.connection.saveData) return true;
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 2) return true;
  return false;
}
