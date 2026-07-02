import { NextResponse } from "next/server";
import { curateImportedCandidates } from "@/lib/image-curation";
import { collectPublicImages } from "@/lib/public-image-import";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      url?: string;
      useTestCandidates?: boolean;
    };
    const url = body.url?.trim();
    const result = await collectPublicImages("website", url ?? "", {
      useTestCandidates: body.useTestCandidates,
    });
    const candidates = result.success
      ? curateImportedCandidates(result.candidates).map((candidate) =>
          result.debug?.usedTestCandidates
            ? {
                ...candidate,
                reasons: [
                  "Candidata de teste para validar a curadoria em desenvolvimento.",
                  ...candidate.reasons,
                ],
              }
            : candidate,
        )
      : [];

    return NextResponse.json({
      success: result.success,
      source: "website",
      candidates,
      error: result.error,
      errorType: result.errorType,
      debug: result.debug,
      usedTestCandidates: result.debug?.usedTestCandidates ?? false,
    }, { status: result.success ? 200 : 400 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro interno ao buscar fotos publicas do site.";

    return NextResponse.json(
      {
        success: false,
        source: "website",
        candidates: [],
        error: message,
        errorType: "internal",
      },
      { status: 500 },
    );
  }
}
