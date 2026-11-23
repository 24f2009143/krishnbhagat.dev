/* "Connected" links between specimens: opening the target specimen instead of only jumping to it.
   Without JS the links still work as plain anchors. Also opens a specimen named in the URL (#kb-005). */

function openSpecimen(id, focus) {
  const target = id && document.getElementById(id);
  if (!target || target.tagName !== "DETAILS") return false;
  target.open = true;
  const summary = target.querySelector("summary");
  target.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  if (focus && summary) summary.focus({ preventScroll: true });
  return true;
}

export function init(root = document) {
  const onClick = (e) => {
    const a = e.target.closest("a.specimen__rel-link");
    if (!a) return;
    const id = a.getAttribute("href").slice(1);
    if (openSpecimen(id, true)) {
      e.preventDefault();
      history.replaceState(null, "", "#" + id);
    }
  };
  root.addEventListener("click", onClick);
  if (/^#kb-\d+$/.test(location.hash)) openSpecimen(location.hash.slice(1), false);
  return () => root.removeEventListener("click", onClick);
}
