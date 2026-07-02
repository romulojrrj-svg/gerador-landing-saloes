import { NextResponse } from "next/server";
import { curateImportedCandidates } from "@/lib/image-curation";
import { collectBrowserImages } from "@/lib/browser-image-import";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      url?: string;
      maxPosts?: number;
      maxScrolls?: number;
      maxOpenedPosts?: number;
    };
    const url = body.url?.trim() ?? "";
    const result = await collectBrowserImages("instagram", url, {
      maxPosts: body.maxPosts,
      maxScrolls: body.maxScrolls,
      maxOpenedPosts: body.maxOpenedPosts,
    });
    const candidates = result.success
      ? curateImportedCandidates(result.candidates)
      : [];

    return NextResponse.json(
      {
        success: result.success,
        source: "instagram",
        candidates,
        error: result.error,
        errorType: result.errorType,
        debug: result.debug,
      },
      { status: result.success ? 200 : 400 },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro interno ao coletar imagens do Instagram com o navegador local.";

    return NextResponse.json(
      {
        success: false,
        source: "instagram",
        candidates: [],
        error: message,
        errorType: "internal",
      },
      { status: 500 },
    );
  }
}
