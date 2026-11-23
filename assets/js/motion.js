/* The motion gate for the landing pages: should anything move at all?
   "full"    = run the motion layer
   "reduced" = keep the static composition exactly as drawn
   Only explicit signals reduce motion: the OS setting, or Save-Data. Device guesses
   (core count, memory) are used elsewhere only to skip nonessential effects. */
import { prefersReducedMotion, onReducedMotionChange, isConstrained } from "./core/env.js";

function saveData() {
  const c = navigator.connection;
  return Boolean(c && c.saveData);
}

export function motionLevel() {
  return prefersReducedMotion() || saveData() ? "reduced" : "full";
}

export function onMotionChange(callback) {
  return onReducedMotionChange(() => callback(motionLevel()));
}

/* For effects that add life but carry no meaning (e.g. drift). */
export function allowNonessential() {
  return !isConstrained();
}

export { prefersReducedMotion };
