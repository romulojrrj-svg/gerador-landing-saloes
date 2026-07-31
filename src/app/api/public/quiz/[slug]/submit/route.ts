import { NextRequest, NextResponse } from "next/server";
import { createQuizSubmission } from "@/lib/interactive-quiz-server";
import type { InteractiveQuizSubmissionPayload } from "@/lib/interactive-quiz-client";

type Context = { params: Promise<{ slug: string }> };

export async function POST(request: NextRequest, context: Context) {
  try {
    const body = (await request.json()) as InteractiveQuizSubmissionPayload;
    const { slug } = await context.params;
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
    const result = await createQuizSubmission(slug, body, ip);
    return NextResponse.json(result.ok ? { ok: true } : { ok: false, error: result.error }, { status: result.ok ? 201 : result.status });
  } catch {
    return NextResponse.json({ ok: false, error: "Nao foi possivel processar o envio." }, { status: 400 });
  }
}
