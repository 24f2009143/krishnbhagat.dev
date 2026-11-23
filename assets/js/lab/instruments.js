/* Loads a specimen's instrument the first time its specimen is opened.
   Each instrument is its own module; if one fails to load or mount, its static content
   (already in the HTML) stays, and the rest of the Lab is unaffected. */

const modules = {
  layout: () => import("./layout.js"),
  recursion: () => import("./recursion.js"),
  evidence: () => import("./evidence.js"),
};

export function init(root = document) {
  const cleanups = [];
  for (const host of root.querySelectorAll("[data-instrument]")) {
    const specimen = host.closest("details");
    let api = null;
    let state = "idle";

    const mount = async () => {
      if (state !== "idle") return;
      state = "loading";
      try {
        const data = JSON.parse(host.querySelector(".instrument__data").textContent);
        const load = modules[host.dataset.instrument];
        if (!load) throw new Error("unknown instrument " + host.dataset.instrument);
        const mod = await load();
        api = mod.mount(host, data) || {};
        host.classList.add("is-live");
        state = "live";
      } catch (err) {
        state = "failed";
        host.classList.remove("is-live");
        console.warn("instrument unavailable; static content kept:", host.dataset.instrument, err);
      }
    };

    const onToggle = () => {
      if (specimen.open) mount();
      else if (api && api.pause) api.pause();
    };
    if (!specimen || specimen.open) mount();
    if (specimen) {
      specimen.addEventListener("toggle", onToggle);
      cleanups.push(() => specimen.removeEventListener("toggle", onToggle));
    }
  }
  return () => cleanups.forEach((fn) => fn());
}
