/* Load the site's data exactly as the browser does (core.js registration functions, manifest order) into a node VM.
 * Used by validate.js, gen_counts.js and dump_data.js. loadData({fixture:true}) also loads tests/fixture/fixture.js. */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.resolve(__dirname, "..");
function loadData(opt) {
  opt = opt || {};
  const noop = () => {};
  const docStub = { addEventListener: noop, querySelector: () => null, querySelectorAll: () => [], createElement: () => ({ style: {} }), documentElement: { dataset: {} } };
  const ctx = { console, document: docStub, window: {}, localStorage: { getItem: () => null, setItem: noop, removeItem: noop }, setTimeout, Math, JSON, Date };
  ctx.window = ctx; vm.createContext(ctx);
  const missing = [];
  function run(rel) {
    const f = path.join(ROOT, rel);
    if (!fs.existsSync(f)) { missing.push(rel); return; }
    vm.runInContext(fs.readFileSync(f, "utf8"), ctx, { filename: rel });
  }
  ["js/core.js", "js/data/manifest.js", "js/data/glossary.js", "js/data/refreshers.js"].forEach(run);
  if (opt.fixture) run("tests/fixture/fixture.js");
  const files = ctx.APP.dataFiles();
  files.forEach(run);
  return { APP: ctx.APP, files, missing, ROOT };
}
module.exports = { loadData, ROOT };
