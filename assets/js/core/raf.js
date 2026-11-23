/* One shared requestAnimationFrame loop for the whole page.
   Work is requested per frame (request(fn)); a callback that needs another frame asks again.
   When nothing is queued, no frame is scheduled. While the tab is hidden, nothing runs;
   queued work resumes when the tab becomes visible. */

let queue = new Set();
let spare = new Set();
let frameId = 0;
let listening = false;

function frame(time) {
  frameId = 0;
  const run = queue;      // swap, so callbacks that re-request land in the next frame
  queue = spare;
  spare = run;
  for (const fn of run) fn(time);
  run.clear();
  if (queue.size === 0) stopListening();
}

function onVisibility() {
  if (document.hidden) {
    if (frameId) { cancelAnimationFrame(frameId); frameId = 0; }
  } else if (queue.size && !frameId) {
    frameId = requestAnimationFrame(frame);
  }
}

function stopListening() {
  if (listening) { document.removeEventListener("visibilitychange", onVisibility); listening = false; }
}

export function request(fn) {
  queue.add(fn);
  if (!listening) { document.addEventListener("visibilitychange", onVisibility); listening = true; }
  if (!frameId && !document.hidden) frameId = requestAnimationFrame(frame);
}

export function cancel(fn) {
  queue.delete(fn);
  if (queue.size === 0) {
    if (frameId) { cancelAnimationFrame(frameId); frameId = 0; }
    stopListening();
  }
}
