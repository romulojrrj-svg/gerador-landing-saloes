import { NextRequest, NextResponse } from "next/server";
import { getAdminAuthCookieName, isAdminSessionCookieValid } from "@/lib/admin-auth";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { normalizeSlug } from "@/lib/salon-storage";

const BUCKET_NAME = "salon-assets";
const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

export async function POST(request: NextRequest) {
  const authError = await ensureAdminRequest(request);

  if (authError) {
    return authError;
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Supabase Storage nao configurado. Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY antes de enviar fotos locais.",
      },
      { status: 503 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const salonName = String(formData.get("salonName") ?? "").trim();
  const salonSlug = String(formData.get("salonSlug") ?? "").trim();
  const imageId = String(formData.get("imageId") ?? "").trim();

  if (!(file instanceof File)) {
    return NextResponse.json(
      {
        success: false,
        error: "Selecione um arquivo de imagem valido.",
      },
      { status: 400 },
    );
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      {
        success: false,
        error: "Envie a foto em PNG, JPG, JPEG ou WebP.",
      },
      { status: 400 },
    );
  }

  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json(
      {
        success: false,
        error: "A foto excede o limite de 8 MB.",
      },
      { status: 400 },
    );
  }

  const client = getSupabaseAdminClient();

  if (!client) {
    return NextResponse.json(
      {
        success: false,
        error: "Cliente administrativo do Supabase indisponivel.",
      },
      { status: 503 },
    );
  }

  const bucketResult = await ensureBucket(client);

  if (!bucketResult.ok) {
    return NextResponse.json(
      {
        success: false,
        error: bucketResult.error,
      },
      { status: 500 },
    );
  }

  const entitySlug = normalizeSlug(salonSlug || salonName || "salon");
  const extension = guessExtension(file);
  const safeFileName = sanitizeFileName(file.name, extension);
  const filePath = `gallery-images/${entitySlug}/${Date.now()}-${normalizeSlug(imageId || "image")}-${safeFileName}`;
  const arrayBuffer = await file.arrayBuffer();
  const uploadResult = await client.storage
    .from(BUCKET_NAME)
    .upload(filePath, Buffer.from(arrayBuffer), {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: true,
    });

  if (uploadResult.error) {
    return NextResponse.json(
      {
        success: false,
        error: uploadResult.error.message,
      },
      { status: 500 },
    );
  }

  const { data } = client.storage.from(BUCKET_NAME).getPublicUrl(filePath);

  return NextResponse.json({
    success: true,
    url: data.publicUrl,
    path: filePath,
    bucket: BUCKET_NAME,
  });
}

async function ensureAdminRequest(request: NextRequest) {
  const cookieValue = request.cookies.get(getAdminAuthCookieName())?.value;
  const authenticated = await isAdminSessionCookieValid(cookieValue);

  if (authenticated) {
    return null;
  }

  return NextResponse.json(
    {
      success: false,
      error: "Acesso interno nao autenticado.",
    },
    { status: 401 },
  );
}

async function ensureBucket(client: NonNullable<ReturnType<typeof getSupabaseAdminClient>>) {
  const buckets = await client.storage.listBuckets();

  if (buckets.error) {
    return {
      ok: false as const,
      error: buckets.error.message,
    };
  }

  const exists = buckets.data.some((bucket) => bucket.name === BUCKET_NAME);

  if (exists) {
    return { ok: true as const };
  }

  const created = await client.storage.createBucket(BUCKET_NAME, {
    public: true,
    fileSizeLimit: "8MB",
    allowedMimeTypes: Array.from(ALLOWED_MIME_TYPES),
  });

  if (created.error) {
    return {
      ok: false as const,
      error: created.error.message,
    };
  }

  return { ok: true as const };
}

function guessExtension(file: File) {
  if (file.type === "image/png") {
    return "png";
  }

  if (file.type === "image/webp") {
    return "webp";
  }

  return "jpg";
}

function sanitizeFileName(fileName: string, fallbackExtension: string) {
  const normalized = fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!normalized) {
    return `gallery-image.${fallbackExtension}`;
  }

  return normalized.includes(".") ? normalized : `${normalized}.${fallbackExtension}`;
}
