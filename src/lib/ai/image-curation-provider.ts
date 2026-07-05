import { curateImagesWithGemini } from "@/lib/ai/gemini-image-curation";
import type { GeminiImageCurationPayload, GeminiImageCurationRequest } from "@/lib/ai/image-curation-schema";

export async function curateImagesWithProvider(
  request: GeminiImageCurationRequest,
): Promise<GeminiImageCurationPayload> {
  const provider = process.env.IMAGE_CURATION_PROVIDER || "gemini";

  if (provider !== "gemini") {
    throw new Error(`Provedor de curadoria nao suportado: ${provider}`);
  }

  return curateImagesWithGemini(request);
}
