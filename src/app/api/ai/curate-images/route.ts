import { NextRequest, NextResponse } from "next/server";
import { curateImagesWithProvider } from "@/lib/ai/image-curation-provider";
import type { GeminiImageCurationRequest } from "@/lib/ai/image-curation-schema";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<GeminiImageCurationRequest>;

    const images = Array.isArray(body.images) ? body.images : [];
    const limitedImages = images.slice(0, 20);

    if (!body.salonName?.trim()) {
      return NextResponse.json(
        { success: false, error: "Nome do salão é obrigatório." },
        { status: 400 },
      );
    }

    if (!limitedImages.length) {
      return NextResponse.json(
        { success: false, error: "Nenhuma imagem para curar." },
        { status: 400 },
      );
    }

    const payload = await curateImagesWithProvider({
      salonId: body.salonId,
      salonName: body.salonName,
      businessType: body.businessType,
      language: body.language,
      services: body.services,
      images: limitedImages,
    });

    return NextResponse.json({ success: true, data: payload });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Falha ao curar imagens com IA.",
      },
      { status: 500 },
    );
  }
}
