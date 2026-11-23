/* Motion preferences shared by landing-page effects.
   Small on purpose: answers "should we animate at all, and how much?" */

const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

export function prefersReducedMotion() {
  return reducedQuery.matches;
}

/* Heuristic for devices where a continuous canvas is not worth the battery. */
export function isLowPower() {
  const nav = navigator;
  const conn = nav.connection || {};
  if (conn.saveData) return true;
  if (nav.deviceMemory && nav.deviceMemory <= 4) return true;
  if (nav.hardwareConcurrency && nav.hardwareConcurrency <= 4) return true;
  return false;
}

/* "full" = run effects, "reduced" = static frame only. */
export function motionLevel() {
  return prefersReducedMotion() || isLowPower() ? "reduced" : "full";
}

export function onMotionChange(callback) {
  reducedQuery.addEventListener("change", () => callback(motionLevel()));
}
