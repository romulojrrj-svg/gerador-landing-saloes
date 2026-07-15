import http from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = Object.fromEntries(process.argv.slice(2).flatMap((value, index, values) => value.startsWith("--") ? [[value.slice(2), values[index + 1]]] : []));
const slug = args.slug;
const port = Number(args.port || 4173);
const siteDir = args.dir ? path.resolve(root, args.dir) : path.join(root, "exports", slug || "", "latest", "site");

if (!await exists(siteDir)) throw new Error(`Pasta estatica nao encontrada: ${siteDir}`);

http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url || "/", "http://preview.local").pathname);
    const requested = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const candidate = path.resolve(siteDir, requested);
    if (!candidate.startsWith(siteDir)) throw new Error("Caminho invalido");
    const file = (await exists(candidate)) ? candidate : (await exists(path.join(candidate, "index.html")) ? path.join(candidate, "index.html") : path.join(siteDir, "404.html"));
    response.writeHead(file.endsWith(".html") ? 200 : 200, { "Content-Type": contentType(file), "Cache-Control": "no-store" });
    response.end(await fs.readFile(file));
  } catch { response.writeHead(404, { "Content-Type": "text/plain" }); response.end("Not found"); }
}).listen(port, "127.0.0.1", () => console.log(`Preview estatico: http://127.0.0.1:${port}`));

async function exists(value) { try { await fs.access(value); return true; } catch { return false; } }
function contentType(file) { const extension = path.extname(file).toLowerCase(); return ({ ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "application/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".xml": "application/xml; charset=utf-8", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".woff2": "font/woff2" })[extension] || "application/octet-stream"; }
