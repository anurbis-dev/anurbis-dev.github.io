import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
};

const server = http.createServer((req, res) => {
  let u = decodeURIComponent((req.url || "/").split("?")[0]);
  if (u === "/") u = "/index.html";
  const f = path.resolve(root, "." + u.replace(/\//g, path.sep));
  if (!f.startsWith(root + path.sep) && f !== root) {
    res.writeHead(403);
    return res.end("403");
  }
  fs.readFile(f, (e, d) => {
    if (e) {
      res.writeHead(404);
      return res.end("404 " + u);
    }
    res.writeHead(200, { "Content-Type": types[path.extname(f)] || "application/octet-stream" });
    res.end(d);
  });
});

server.listen(4173, "127.0.0.1", () => {
  console.log("serving", root, "at http://127.0.0.1:4173/");
});
