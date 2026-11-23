/* Entry point for the landing pages (/ and /nerdhub/).
   Everything here is enhancement: pages are complete without it. */
import { motionLevel, onMotionChange } from "./motion.js";

const root = document.documentElement;
root.classList.add("js");
root.dataset.motion = motionLevel();
onMotionChange((level) => { root.dataset.motion = level; });

/* Phase 2+: pages with [data-hero] will lazy-load ./hero-canvas.js here. */
