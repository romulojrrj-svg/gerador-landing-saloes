import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const staticApp = path.join(root, "static-export-app");
const maxAssetBytes = 20 * 1024 * 1024;
const prohibitedReferences = [
  "localhost",
  "127.0.0.1",
  "supabase.co",
  "vercel.app",
  "/api/",
  "service_role",
  "anon_key",
  "gemini",
  "admin_password",
  "c:\\users\\",
  "blob:",
  "data:image",
];

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const slug = requireSlug(args.slug);
  const version = normalizeVersion(args.version) ?? createVersion();
  const source = args.source ?? "supabase";

  if (source !== "supabase") {
    throw new Error("Esta primeira versao suporta apenas --source supabase.");
  }

  const env = await loadLocalEnv();
  const salonRow = await loadSalonFromSupabase(env, slug);
  const prepared = await prepareExport(salonRow, slug, version);
  const output = await buildStaticSite(prepared, slug, version);
  await validateExport(output.siteDir);
  const zipPath = await createZip(output.siteDir, output.versionDir, slug, version);
  const packageHash = await hashFile(zipPath);
  const report = await writeReports({ prepared, output, zipPath, packageHash });

  console.log(JSON.stringify({
    ok: true,
    slug,
    version,
    site: output.siteDir,
    zip: zipPath,
    manifest: report.manifestPath,
    report: report.reportPath,
    assetCount: prepared.assets.length,
    totalBytes: await directorySize(output.siteDir),
  }, null, 2));
}

function parseArgs(values) {
  const args = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith("--")) continue;
    const [key, inline] = value.slice(2).split("=", 2);
    args[key] = inline ?? values[index + 1];
    if (inline === undefined) index += 1;
  }
  return args;
}

function requireSlug(value) {
  if (!value || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    throw new Error("Use --slug com um slug valido, por exemplo: dra-julia-maia-2.");
  }
  return value;
}

function normalizeVersion(value) {
  if (!value) return null;
  if (!/^v?\d+(?:\.\d+){1,2}(?:[-+][a-z0-9.-]+)?$/i.test(value)) {
    throw new Error("A versao deve seguir o formato 1.0.0.");
  }
  return value.startsWith("v") ? value.slice(1) : value;
}

function createVersion() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `local-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

async function loadLocalEnv() {
  const content = await fs.readFile(path.join(root, ".env.local"), "utf8");
  const env = Object.fromEntries(content.split(/\r?\n/).flatMap((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return [];
    const separator = trimmed.indexOf("=");
    if (separator < 1) return [];
    const key = trimmed.slice(0, separator).trim();
    const raw = trimmed.slice(separator + 1).trim();
    const value = raw.replace(/^(['"])(.*)\1$/, "$2");
    return [[key, value]];
  }));

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase local nao configurado. Verifique NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
  }

  return env;
}

async function loadSalonFromSupabase(env, slug) {
  const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client
    .from("salons")
    .select("slug,name,status,language,city,country,address,description,booking_url,whatsapp,phone,instagram_url,business_hours,services,real_images,real_reviews,seo,cta,metadata,updated_at")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`Nao foi possivel ler o salao no Supabase: ${error.message}`);
  if (!data) throw new Error(`Salao ${slug} nao encontrado no Supabase.`);
  if (data.status !== "published") throw new Error("A exportacao estatica exige um salao publicado.");
  return data;
}

async function prepareExport(row, slug, version) {
  const metadata = record(row.metadata);
  const legacySalon = record(metadata.salon);
  const fields = { ...legacySalon, ...metadata };
  const sourceTemplate = fields.template;
  const sourceTemplateVersion = fields.templateVersion ?? legacySalon.templateVersion ?? null;
  const sourceDesignLocked = fields.designLocked ?? legacySalon.designLocked ?? null;

  if (sourceTemplate !== "premium_editorial") {
    throw new Error("Esta exportacao isolada suporta apenas o template premium atual.");
  }
  if (sourceTemplateVersion && sourceTemplateVersion !== "premium_v1") {
    throw new Error(`O templateVersion ${sourceTemplateVersion} nao possui exportador estatico registrado.`);
  }

  const customDomain = normalizeDomain(fields.customDomain);
  if (!customDomain) throw new Error("O salao precisa ter um dominio proprio valido para gerar canonical e sitemap.");
  const premium = sanitizePremiumEditorial(record(fields.premiumEditorial));
  const sourceImages = array(row.real_images).length
    ? array(row.real_images)
    : array(legacySalon.realImages).length
      ? array(legacySalon.realImages)
      : array(legacySalon.galleryImages);
  const imageById = new Map(sourceImages.map((image) => [string(image.id), image]).filter(([id]) => Boolean(id)));
  const requiredImageIds = new Set([
    premium.heroImageId,
    premium.aboutImageId,
    ...premium.beforeAfterItems.flatMap((item) => [item.beforeImageId, item.afterImageId]),
    ...premium.reviewScreenshotImages.map((item) => item.imageId),
  ].filter(Boolean));

  if (!requiredImageIds.size) {
    const fallback = sourceImages.find((image) => image.type !== "logo" && imageUrl(image));
    if (fallback?.id) requiredImageIds.add(String(fallback.id));
  }

  const assetSources = [];
  for (const imageId of requiredImageIds) {
    const image = imageById.get(imageId);
    if (!image) throw new Error(`Imagem obrigatoria ${imageId} nao foi encontrada no salao.`);
    assetSources.push({ id: imageId, url: requiredUrl(imageUrl(image), `imagem ${imageId}`), alt: string(image.alt) || `${row.name} imagem`, type: string(image.type), source: string(image.source), kind: "photo" });
  }

  for (const screenshot of premium.reviewScreenshotImages) {
    if (screenshot.imageId || !screenshot.imageUrl) continue;
    assetSources.push({ id: `review-${screenshot.id}`, url: requiredUrl(screenshot.imageUrl, `feedback ${screenshot.id}`), alt: screenshot.imageAlt || "Feedback de paciente", type: "review", source: "manual", kind: "photo" });
  }

  const horizontalLogoUrl = string(fields.horizontalLogoUrl);
  if (horizontalLogoUrl) {
    assetSources.push({ id: "horizontal-logo", url: requiredUrl(horizontalLogoUrl, "logo horizontal"), alt: `${row.name} — logo`, type: "logo", source: "manual", kind: "logo" });
  }

  const assetsDir = path.join(staticApp, "public", "assets", "images");
  await fs.rm(path.join(staticApp, "public", "assets"), { recursive: true, force: true });
  await fs.mkdir(assetsDir, { recursive: true });

  const assetResults = new Map();
  for (const source of dedupeAssetSources(assetSources)) {
    assetResults.set(source.id, await downloadAsset(source, assetsDir));
  }

  const fallbackImage = Array.from(assetResults.values()).find((asset) => asset.kind === "photo");
  if (!fallbackImage) throw new Error("Nenhuma foto publica foi localizada para o template premium.");
  await createOgImage(fallbackImage.sourceBuffer, assetsDir);
  await createFavicon(fallbackImage.sourceBuffer, path.join(staticApp, "public", "favicon.ico"));

  const dto = {
    slug,
    name: string(row.name),
    language: string(row.language) || "pt-BR",
    customDomain,
    template: "premium",
    templateVersion: "premium_v1",
    updatedAt: string(row.updated_at),
    location: string(legacySalon.location) || [string(row.city), string(row.country)].filter(Boolean).join(", "),
    address: string(row.address),
    bookingUrl: string(row.booking_url),
    whatsapp: string(row.whatsapp),
    whatsappMessage: string(fields.whatsappMessage),
    instagramUrl: string(row.instagram_url),
    horizontalLogo: assetResults.get("horizontal-logo") ? publicAsset(assetResults.get("horizontal-logo")) : null,
    images: Array.from(assetResults.values()).filter((asset) => asset.kind === "photo").map(publicAsset),
    services: array(row.services).map((service, index) => ({ id: string(service.id) || `service-${index + 1}`, title: string(service.title), description: string(service.description) || undefined })).filter((service) => service.title),
    testimonials: array(row.real_reviews).map((review, index) => ({ id: string(review.id) || `review-${index + 1}`, authorName: string(review.authorName) || string(review.author) || "", text: string(review.text), rating: numberOrUndefined(review.rating) })).filter((review) => review.text),
    googleRating: numberOrNull(fields.googleRating),
    premiumEditorial: {
      ...premium,
      reviewScreenshotImages: premium.reviewScreenshotImages.map((item) => ({ ...item, src: item.imageId ? undefined : publicAsset(assetResults.get(`review-${item.id}`))?.src })),
    },
    seo: sanitizeSeo(record(row.seo), row.name),
  };

  await fs.mkdir(path.join(staticApp, "data"), { recursive: true });
  await fs.writeFile(path.join(staticApp, "data", "salon.json"), `${JSON.stringify(dto, null, 2)}\n`, "utf8");
  await writeStaticPublicFiles(dto);

  return {
    dto,
    assets: Array.from(assetResults.values()),
    source: {
      template: sourceTemplate,
      templateVersion: sourceTemplateVersion ?? "legacy-premium-editorial->premium_v1",
      designLocked: sourceDesignLocked,
      updatedAt: string(row.updated_at),
    },
    version,
  };
}

function sanitizePremiumEditorial(value) {
  return {
    accentColor: string(value.accentColor) || "#9b7353",
    backgroundColor: string(value.backgroundColor) || "#f8f5f0",
    heroEyebrow: string(value.heroEyebrow), heroTitle: string(value.heroTitle), heroDescription: string(value.heroDescription), heroImageId: string(value.heroImageId) || undefined, aboutImageId: string(value.aboutImageId) || undefined,
    aboutTitle: string(value.aboutTitle), aboutRole: string(value.aboutRole), aboutText: string(value.aboutText), methodEyebrow: string(value.methodEyebrow), methodTitle: string(value.methodTitle), methodText: string(value.methodText),
    beforeAfterItems: array(value.beforeAfterItems).map((item, index) => ({ id: string(item.id) || `before-after-${index + 1}`, title: string(item.title), description: string(item.description) || undefined, beforeImageId: string(item.beforeImageId), afterImageId: string(item.afterImageId), order: numberOrUndefined(item.order) ?? index, enabled: item.enabled !== false })).filter((item) => item.beforeImageId && item.afterImageId),
    faqItems: array(value.faqItems).map((item, index) => ({ id: string(item.id) || `faq-${index + 1}`, question: string(item.question), answer: string(item.answer), order: numberOrUndefined(item.order) ?? index, enabled: item.enabled !== false })).filter((item) => item.question && item.answer),
    reviewDisplayType: value.reviewDisplayType === "screenshots" ? "screenshots" : "google",
    reviewEyebrow: string(value.reviewEyebrow), reviewTitle: string(value.reviewTitle), reviewDescription: string(value.reviewDescription),
    reviewScreenshotImages: array(value.reviewScreenshotImages).map((item, index) => ({ id: string(item.id) || `review-screenshot-${index + 1}`, imageId: string(item.imageId) || undefined, imageUrl: string(item.imageUrl) || undefined, imageAlt: string(item.imageAlt) || "Feedback de paciente", order: numberOrUndefined(item.order) ?? index })).filter((item) => item.imageId || item.imageUrl),
    finalCtaTitle: string(value.finalCtaTitle), finalCtaText: string(value.finalCtaText), finalCtaBackgroundColor: string(value.finalCtaBackgroundColor) || undefined, finalWhatsappButtonColor: string(value.finalWhatsappButtonColor) || undefined, finalWhatsappButtonTextColor: string(value.finalWhatsappButtonTextColor) || undefined, bookingButtonTextColor: string(value.bookingButtonTextColor) || undefined, instagramButtonTextColor: string(value.instagramButtonTextColor) || undefined,
    aboutLabel: string(value.aboutLabel) || undefined, servicesLabel: string(value.servicesLabel) || undefined, servicesTitle: string(value.servicesTitle) || undefined, resultsLabel: string(value.resultsLabel) || undefined, contactLabel: string(value.contactLabel) || undefined, bookAppointmentLabel: string(value.bookAppointmentLabel) || undefined, bookViaWhatsappLabel: string(value.bookViaWhatsappLabel) || undefined, reservationsLabel: string(value.reservationsLabel) || undefined, chatOnWhatsappLabel: string(value.chatOnWhatsappLabel) || undefined, bookOnFreshaLabel: string(value.bookOnFreshaLabel) || undefined,
  };
}

function sanitizeSeo(seo, name) { return { title: string(seo.title) || string(name), description: string(seo.description) }; }

function dedupeAssetSources(sources) { const seen = new Set(); return sources.filter((source) => { if (seen.has(source.id)) return false; seen.add(source.id); return true; }); }

async function downloadAsset(source, assetsDir) {
  const response = await fetch(source.url, { redirect: "follow", signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`Falha ao baixar ${source.id}: HTTP ${response.status}.`);
  const contentType = response.headers.get("content-type")?.toLowerCase() || "";
  if (!contentType.startsWith("image/")) throw new Error(`Asset ${source.id} nao retornou imagem (${contentType || "sem MIME"}).`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer.length || buffer.length > maxAssetBytes || looksLikeHtml(buffer)) throw new Error(`Asset ${source.id} e invalido ou excede 20 MB.`);
  const hash = createHash("sha256").update(buffer).digest("hex").slice(0, 12);
  const isSvg = contentType.includes("svg") || source.url.toLowerCase().split("?")[0].endsWith(".svg");

  if (source.kind === "logo" && isSvg) {
    const text = buffer.toString("utf8", 0, Math.min(buffer.length, 512)).trim().toLowerCase();
    if (!text.includes("<svg")) throw new Error("A logo SVG retornou conteudo invalido.");
    const filename = `logo-${hash}.svg`;
    await fs.writeFile(path.join(assetsDir, filename), buffer);
    return { ...source, sourceBuffer: buffer, src: `/assets/images/${filename}`, width: undefined, height: undefined, bytes: buffer.length };
  }

  const metadata = await sharp(buffer, { animated: false }).metadata();
  if (!metadata.width || !metadata.height) throw new Error(`Nao foi possivel validar as dimensoes de ${source.id}.`);
  if (source.kind === "logo") {
    const extension = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const filename = `logo-${hash}.${extension}`;
    await fs.writeFile(path.join(assetsDir, filename), buffer);
    return { ...source, sourceBuffer: buffer, src: `/assets/images/${filename}`, width: metadata.width, height: metadata.height, bytes: buffer.length };
  }

  const widths = [...new Set([480, 800, 1200, 1600, metadata.width].filter((width) => width <= Math.max(metadata.width, 480)))].sort((first, second) => first - second);
  const generated = [];
  for (const width of widths) {
    const filename = `image-${hash}-${width}.webp`;
    const outputPath = path.join(assetsDir, filename);
    const outputInfo = await sharp(buffer, { animated: false }).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 86, smartSubsample: true }).toFile(outputPath);
    generated.push({ width: outputInfo.width, height: outputInfo.height, filename, bytes: outputInfo.size });
  }
  const largest = generated.at(-1);
  return { ...source, sourceBuffer: buffer, src: `/assets/images/${largest.filename}`, srcSet: generated.map((item) => `/assets/images/${item.filename} ${item.width}w`).join(", "), width: largest.width, height: largest.height, bytes: generated.reduce((sum, item) => sum + item.bytes, 0), variants: generated };
}

function publicAsset(asset) { if (!asset) return undefined; return { id: asset.id, src: asset.src, srcSet: asset.srcSet, width: asset.width, height: asset.height, alt: asset.alt, type: asset.type, source: asset.source }; }
function looksLikeHtml(buffer) { return /^\s*(?:<!doctype html|<html|<head|<body)/i.test(buffer.toString("utf8", 0, Math.min(buffer.length, 256))); }
function requiredUrl(value, label) { if (!/^https:\/\//i.test(value) || /^(?:blob:|data:|file:|https?:\/\/(?:localhost|127\.0\.0\.1))/i.test(value)) throw new Error(`URL invalida para ${label}.`); return value; }
function imageUrl(image) { return string(image.src) || string(image.url); }
function normalizeDomain(value) { const domain = string(value).toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, ""); return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain) ? domain : ""; }
function array(value) { return Array.isArray(value) ? value.filter((item) => item && typeof item === "object") : []; }
function record(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function string(value) { return typeof value === "string" ? value.normalize("NFC").trim() : ""; }
function numberOrUndefined(value) { const number = typeof value === "number" ? value : Number(value); return Number.isFinite(number) ? number : undefined; }
function numberOrNull(value) { return numberOrUndefined(value) ?? null; }

async function createOgImage(buffer, assetsDir) { await sharp(buffer, { animated: false }).rotate().resize(1200, 630, { fit: "cover", position: "attention" }).webp({ quality: 88 }).toFile(path.join(assetsDir, "og-image.webp")); }
async function createFavicon(buffer, destination) { const png = await sharp(buffer, { animated: false }).rotate().resize(64, 64, { fit: "cover", position: "attention" }).png().toBuffer(); const header = Buffer.alloc(22); header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4); header.writeUInt8(64, 6); header.writeUInt8(64, 7); header.writeUInt16LE(1, 10); header.writeUInt16LE(32, 12); header.writeUInt32LE(png.length, 14); header.writeUInt32LE(22, 18); await fs.writeFile(destination, Buffer.concat([header, png])); }

async function writeStaticPublicFiles(dto) {
  const publicDir = path.join(staticApp, "public");
  const baseUrl = `https://${dto.customDomain}`;
  await fs.writeFile(path.join(publicDir, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml\n`);
  await fs.writeFile(path.join(publicDir, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${baseUrl}/</loc><lastmod>${new Date(dto.updatedAt || Date.now()).toISOString()}</lastmod></url></urlset>\n`);
  await fs.writeFile(path.join(publicDir, "site.webmanifest"), JSON.stringify({ name: dto.name, short_name: dto.name, start_url: "/", display: "standalone", background_color: dto.premiumEditorial.backgroundColor, theme_color: dto.premiumEditorial.accentColor, icons: [{ src: "/favicon.ico", sizes: "64x64", type: "image/x-icon" }] }, null, 2));
  await fs.writeFile(path.join(publicDir, "_headers"), `/_next/static/*\n  Cache-Control: public, max-age=31536000, immutable\n  X-Content-Type-Options: nosniff\n\n/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n  X-Content-Type-Options: nosniff\n\n/*\n  Cache-Control: public, max-age=0, must-revalidate\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n`);
}

async function buildStaticSite(prepared, slug, version) {
  const versionDir = path.join(root, "exports", slug, `${timestamp()}_${version}`);
  const siteDir = path.join(versionDir, "site");
  await fs.mkdir(versionDir, { recursive: true });
  execFileSync(process.execPath, [path.join(root, "node_modules", "next", "dist", "bin", "next"), "build", "--webpack"], { cwd: staticApp, stdio: "inherit", env: { ...process.env, NODE_ENV: "production" } });
  await fs.cp(path.join(staticApp, "out"), siteDir, { recursive: true, errorOnExist: true });
  await fs.mkdir(path.join(root, "exports", slug, "latest"), { recursive: true });
  await fs.rm(path.join(root, "exports", slug, "latest"), { recursive: true, force: true });
  await fs.cp(siteDir, path.join(root, "exports", slug, "latest", "site"), { recursive: true });
  return { versionDir, siteDir, slug, version, prepared };
}

async function validateExport(siteDir) {
  for (const required of ["index.html", "404.html", "robots.txt", "sitemap.xml", "site.webmanifest", "favicon.ico", "_headers", "assets/images/og-image.webp"]) {
    try { await fs.access(path.join(siteDir, required)); } catch { throw new Error(`Saida estatica incompleta: ${required} nao encontrado.`); }
  }
  const files = await listFiles(siteDir);
  if (files.some((file) => file.endsWith(".map"))) throw new Error("Source maps publicos foram encontrados no pacote.");
  const searchable = files.filter((file) => /\.(?:html|js|css|json|xml|txt|webmanifest)$/i.test(file));
  for (const file of searchable) {
    const content = (await fs.readFile(file, "utf8")).toLowerCase();
    const tokens = file.endsWith(".js")
      ? ["supabase.co", "vercel.app", "service_role", "anon_key", "gemini", "admin_password", "c:\\users\\"]
      : prohibitedReferences;
    const hit = tokens.find((token) => content.includes(token));
    if (hit) throw new Error(`Referencia proibida encontrada em ${path.relative(siteDir, file)}: ${hit}`);
    if (file.endsWith(".html") && content.includes("/_next/image")) {
      throw new Error(`Otimização de imagem em runtime encontrada em ${path.relative(siteDir, file)}.`);
    }
  }
}

async function createZip(siteDir, versionDir, slug, version) {
  const zipPath = path.join(versionDir, `${slug}-v${version}.zip`);
  execFileSync("tar", ["-a", "-c", "-f", zipPath, "."], { cwd: siteDir, stdio: "inherit" });
  return zipPath;
}

async function writeReports({ prepared, output, zipPath, packageHash }) {
  const totalBytes = await directorySize(output.siteDir);
  const manifest = { slug: prepared.dto.slug, salon: prepared.dto.name, domain: prepared.dto.customDomain, template: prepared.dto.template, templateVersion: prepared.dto.templateVersion, sourceTemplate: prepared.source.template, sourceTemplateVersion: prepared.source.templateVersion, sourceDesignLocked: prepared.source.designLocked, exportedAt: new Date().toISOString(), salonUpdatedAt: prepared.source.updatedAt, version: output.version, assetCount: prepared.assets.length, siteBytes: totalBytes, zipBytes: (await fs.stat(zipPath)).size, packageSha256: packageHash, gitCommit: gitCommit(), validations: { prohibitedReferences: "passed", staticOutput: "passed", runtimeDependencies: "none", allowedBundlerLiterals: ["The generic Next runtime contains /_next/image as an inert route helper; exported HTML uses local img assets and never references the optimizer.", "The generic URL polyfill contains localhost and /api/ parser literals only. They are not links, fetch calls, HTML references, or runtime data dependencies."] } };
  const manifestPath = path.join(output.versionDir, "export-manifest.json");
  const reportPath = path.join(output.versionDir, "export-report.txt");
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await fs.writeFile(reportPath, `Exportacao estatica pronta para Cloudflare Pages\n\nSlug: ${manifest.slug}\nDominio: ${manifest.domain}\nTemplate: ${manifest.templateVersion}\nVersao: ${manifest.version}\nAssets: ${manifest.assetCount}\nTamanho do site: ${manifest.siteBytes} bytes\nZIP: ${path.basename(zipPath)}\n\nDeploy manual:\n1. No Cloudflare Pages, abra o projeto da cliente.\n2. Use Direct Upload e envie o conteudo de site/ ou o ZIP gerado.\n3. Teste o endereco pages.dev antes de promover o dominio.\n4. Nao altere DNS por este processo.\n`, "utf8");
  return { manifestPath, reportPath };
}

function timestamp() { const date = new Date(); const pad = (value) => String(value).padStart(2, "0"); return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`; }
function gitCommit() { try { return execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim(); } catch { return null; } }
async function hashFile(file) { const buffer = await fs.readFile(file); return createHash("sha256").update(buffer).digest("hex"); }
async function listFiles(directory) { const entries = await fs.readdir(directory, { withFileTypes: true }); const files = await Promise.all(entries.map(async (entry) => entry.isDirectory() ? listFiles(path.join(directory, entry.name)) : [path.join(directory, entry.name)])); return files.flat(); }
async function directorySize(directory) { return (await listFiles(directory)).reduce(async (totalPromise, file) => (await totalPromise) + (await fs.stat(file)).size, Promise.resolve(0)); }

main().catch((error) => { console.error(`\n[export:salon] ${error instanceof Error ? error.message : String(error)}`); process.exitCode = 1; });
