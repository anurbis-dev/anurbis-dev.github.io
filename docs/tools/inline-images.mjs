#!/usr/bin/env node
// Docs-only build helper (not part of the app bundle).
//
// PixisEditor's illustrated manual (docs/manual/*.html) is authored with normal
// relative <img src="assets/..."> paths, plus a shared <link href="assets/chrome.css">
// and <script src="assets/chrome.js"> for the page chrome (sidebar/header), so the
// source stays small, diffable, and free of duplicated CSS/JS across pages. The
// Claude/Artifact preview tool can only publish ONE self-contained file at a time
// (no adjacent files reachable), so this script inlines every local image into a
// `data:` URI and splices the shared CSS/JS files directly into <style>/<script>
// tags, writing a sibling `*.artifact.html` with everything embedded. Publish that
// generated file, keep editing the plain source.
//
// Usage: node docs/manual/tools/inline-images.mjs <page.html> [more.html ...]
//        node docs/manual/tools/inline-images.mjs --all   (every *.html in docs/manual, excluding *.artifact.html)

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { extname, join, dirname, resolve } from "node:path";

const MANUAL_DIR = resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));

const MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml" };

function inlineImages(htmlPath) {
  const dir = dirname(htmlPath);
  let html = readFileSync(htmlPath, "utf8");
  let count = 0;
  html = html.replace(/(src|href)="((?:assets|\.\/assets)\/[^"]+\.(?:png|jpe?g|webp|svg))"/g, (m, attr, relPath) => {
    const ext = extname(relPath).toLowerCase();
    const mime = MIME[ext];
    if (!mime) return m;
    const abs = join(dir, relPath);
    const data = readFileSync(abs);
    count++;
    return `${attr}="data:${mime};base64,${data.toString("base64")}"`;
  });
  html = html.replace(/<link rel="stylesheet" href="((?:assets|\.\/assets)\/[^"]+\.css)">/g, (m, relPath) => {
    const css = readFileSync(join(dir, relPath), "utf8");
    count++;
    return `<style>\n${css}\n</style>`;
  });
  html = html.replace(/<script src="((?:assets|\.\/assets)\/[^"]+\.js)"><\/script>/g, (m, relPath) => {
    const js = readFileSync(join(dir, relPath), "utf8");
    count++;
    return `<script>\n${js}\n</script>`;
  });
  const outPath = htmlPath.replace(/\.html$/, ".artifact.html");
  writeFileSync(outPath, html, "utf8");
  console.log(`${htmlPath} -> ${outPath} (${count} assets inlined, ${(html.length / 1024 / 1024).toFixed(2)} MB)`);
}

const args = process.argv.slice(2);
let files;
if (args[0] === "--all") {
  files = readdirSync(MANUAL_DIR)
    .filter((f) => f.endsWith(".html") && !f.endsWith(".artifact.html"))
    .map((f) => join(MANUAL_DIR, f));
} else {
  files = args.map((f) => resolve(f));
}
if (!files.length) {
  console.error("No input files. Usage: node inline-images.mjs <page.html> [...] | --all");
  process.exit(1);
}
files.forEach(inlineImages);
