/**
 * Scan media/<folder>/ and write media/manifest.json.
 *
 * Usage (from landing repo root):
 *   node scripts/generate-media-manifest.mjs
 *
 * Folders:
 *   hero, works  — images (png jpg jpeg webp gif svg avif)
 *   features     — short demo videos (mp4 webm mov m4v)
 *
 * Feature file names should match data-feature on cards in index.html
 * (optional numeric prefix): layers.mp4, 01-animation.webm, single-file.mp4
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MEDIA = path.join(ROOT, "media");
const OUT = path.join(MEDIA, "manifest.json");

const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".avif"]);
const VIDEO_EXT = new Set([".mp4", ".webm", ".mov", ".m4v"]);

const FOLDERS = {
  hero: IMAGE_EXT,
  works: IMAGE_EXT,
  features: VIDEO_EXT,
};

function listFiles(dir, extSet) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    return [];
  }
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isFile() && extSet.has(path.extname(d.name).toLowerCase()))
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true, sensitivity: "base" }));
}

const manifest = {};
for (const [folder, extSet] of Object.entries(FOLDERS)) {
  manifest[folder] = listFiles(path.join(MEDIA, folder), extSet);
}

const next = JSON.stringify(manifest, null, 2) + "\n";
const prev = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
if (prev === next) {
  console.log("media/manifest.json unchanged");
  process.exit(0);
}
fs.writeFileSync(OUT, next, "utf8");
console.log("media/manifest.json updated");
for (const folder of Object.keys(FOLDERS)) {
  console.log(`  ${folder}: ${manifest[folder].length} file(s)`);
}
