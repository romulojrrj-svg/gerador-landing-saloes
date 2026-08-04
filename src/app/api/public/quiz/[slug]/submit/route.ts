import { NextRequest, NextResponse } from "next/server";
import { createQuizSubmission } from "@/lib/interactive-quiz-server";
import type { InteractiveQuizSubmissionPayload } from "@/lib/interactive-quiz-client";

export const runtime = "nodejs";

type Context = { params: Promise<{ slug: string }> };

export async function POST(request: NextRequest, context: Context) {
  try {
    const body = (await request.json()) as InteractiveQuizSubmissionPayload;
    const { slug } = await context.params;
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
    const requestId = getRequestId(request);
    const result = await createQuizSubmission(slug, body, ip, requestId);
    return NextResponse.json(
      result.ok
        ? { ok: true, saved: true, id: result.id, duplicate: result.duplicate === true }
        : { ok: false, error: result.error },
      { status: result.ok ? (result.duplicate ? 200 : 201) : result.status },
    );
  } catch {
    return NextResponse.json({ ok: false, error: "Nao foi possivel processar o envio." }, { status: 400 });
  }
}

function getRequestId(request: NextRequest) {
  const headerValue = request.headers.get("x-request-id")?.trim() ?? "";
  return /^[A-Za-z0-9._:-]{1,100}$/.test(headerValue) ? headerValue : crypto.randomUUID();
}
