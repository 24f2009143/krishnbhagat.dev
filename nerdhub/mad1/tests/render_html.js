#!/usr/bin/env node
/* Render an HTML snippet in headless Chrome (the same browser browser_test.js uses) and print the value of a JS
 * expression evaluated after load, as JSON. Used by assertions for HTML/CSS/DOM claims.
 * Usage: node tests/render_html.js page.html "getComputedStyle(document.querySelector('input')).borderTopColor" */
"use strict";
const fs = require("fs"), os = require("os"), path = require("path"), { execFileSync } = require("child_process");
const CHROME = process.env.CHROME || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find(p => fs.existsSync(p));
const [file, expr] = process.argv.slice(2);
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mad1-render-"));
const html = fs.readFileSync(file, "utf8") + '\n<script>window.addEventListener("load",function(){var v;try{v=(' + expr + ')}catch(e){v="ERROR "+e.message}var p=document.createElement("pre");p.id="__out";p.textContent=JSON.stringify(v);document.body.appendChild(p)});</script>';
const page = path.join(dir, "page.html"); fs.writeFileSync(page, html);
const dom = execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--no-first-run", "--user-data-dir=" + path.join(dir, "u"), "--virtual-time-budget=2000", "--dump-dom", "file://" + page], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
const m = dom.match(/<pre id="__out">([\s\S]*?)<\/pre>/);
if (!m) { console.error("no output"); process.exit(1); }
process.stdout.write(m[1].replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&") + "\n");
