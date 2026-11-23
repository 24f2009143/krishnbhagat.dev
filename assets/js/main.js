/* Entry point for the landing pages (/ and /nerdhub/).
   Everything here is enhancement: pages are complete without it. The static composition
   is the product; motion is added only after the modules load and arm successfully. */
import { motionLevel, onMotionChange } from "./motion.js";

const root = document.documentElement;
root.classList.add("js");
root.dataset.motion = motionLevel();

let teardown = [];
let starting = null;

function stop() {
  for (const fn of teardown) { try { fn(); } catch (e) { /* keep tearing down */ } }
  teardown = [];
  root.classList.remove("motion-on");
}

async function start() {
  const scenes = Array.from(document.querySelectorAll("[data-fx]"));
  if (!scenes.length || motionLevel() !== "full" || !("IntersectionObserver" in window)) return;
  try {
    const [reveal, choreo] = await Promise.all([
      import("./fx/svg-reveal.js"),
      import("./fx/scroll-choreography.js"),
    ]);
    if (motionLevel() !== "full") return;            // preference changed while loading
    root.classList.add("motion-on");
    for (const scene of scenes) {
      if (!scene.dataset.fx.split(" ").includes("reveal")) continue;
      try { teardown.push(reveal.init(scene)); } catch (e) { console.warn("reveal skipped", e); }
    }
    try { teardown.push(choreo.init(scenes)); } catch (e) { console.warn("scroll motion skipped", e); }
  } catch (e) {
    console.warn("motion layer unavailable; static page kept", e);
    stop();
  }
}

onMotionChange((level) => {
  root.dataset.motion = level;
  if (level === "full") { if (!teardown.length) starting = start(); } else { stop(); }
});

starting = start();

/* The Lab's instruments and specimen links are interactions, not decoration, so they load
   regardless of the motion preference (each instrument handles reduced motion itself).
   Each module loads on its own: one failing leaves the others, and the static Lab, intact. */
if (document.getElementById("lab")) {
  for (const load of [() => import("./lab/instruments.js"), () => import("./lab/links.js")]) {
    load().then((m) => m.init()).catch((e) => console.warn("lab module unavailable; static Lab kept", e));
  }
}
