#!/usr/bin/env node
/* Print the loaded data as JSON (for the Python gates). Usage: node tests/dump_data.js [--fixture] */
"use strict";
const { loadData } = require("./load_data");
const { APP } = loadData({ fixture: process.argv.includes("--fixture") });
process.stdout.write(JSON.stringify({ manifest: APP.manifest, topics: APP.topics, packs: APP.packs, refreshers: APP.refreshers, glossary: APP.glossary }));
