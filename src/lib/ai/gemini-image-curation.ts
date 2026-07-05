import { GoogleGenAI } from "@google/genai";
import type { GeminiImageCurationPayload, GeminiImageCurationRequest } from "@/lib/ai/image-curation-schema";

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_INSTRUCTION = `Você é um curador de imagens para landing pages de salões de beleza.
Classifique imagens em logo, destaque inicial, nosso espaço, galeria e ignoradas.
Regras:
- Ignore panfletos, posts com texto, frases motivacionais, prints, memes, artes promocionais, imagens aleatórias, imagens sem relação com o salão, imagens embaçadas, cortadas, escuras, pixeladas ou ruins para landing.
- Nosso Espaço só recebe fotos reais de ambiente físico: recepção, interior, cadeira, maca, espelho, decoração, fachada boa, ambiente de atendimento.
- Destaque inicial pode ter 1, 2 ou 3 imagens. Não force 3.
- Logo só deve ser uma logo real. Nunca use panfleto como logo.
- Nenhuma imagem pode duplicar. Nenhuma imagem pode sumir.
- Imagens não classificadas devem ficar no Banco de fotos.
Retorne JSON estrito no formato pedido.`;

export async function curateImagesWithGemini(
  request: GeminiImageCurationRequest,
): Promise<GeminiImageCurationPayload> {
  if (!API_KEY) {
    throw new Error("GEMINI_API_KEY não configurada.");
  }

  const images = request.images.slice(0, 20);

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const response = await ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: JSON.stringify({
              salonName: request.salonName,
              businessType: request.businessType || "salão de beleza",
              language: request.language || "pt-BR",
              services: request.services || [],
              imageCount: images.length,
              images: images.map((image) => ({
                id: image.id,
                url: image.url,
                source: image.source,
                caption: image.caption,
                score: image.score,
                currentType: image.currentType,
              })),
            }),
          },
        ],
      },
    ],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          logoImageId: { type: ["string", "null"] },
          heroImageIds: { type: "array", items: { type: "string" } },
          spaceImageIds: { type: "array", items: { type: "string" } },
          galleryImageIds: { type: "array", items: { type: "string" } },
          ignoredImageIds: { type: "array", items: { type: "string" } },
          notes: {
            type: "object",
            properties: {
              hero: { type: "string" },
              space: { type: "string" },
              gallery: { type: "string" },
              ignored: { type: "string" },
            },
            required: ["hero", "space", "gallery", "ignored"],
          },
        },
        required: [
          "logoImageId",
          "heroImageIds",
          "spaceImageIds",
          "galleryImageIds",
          "ignoredImageIds",
          "notes",
        ],
      },
    },
  });

  const rawText = response.text ?? "{}";
  const parsed = JSON.parse(rawText) as Partial<GeminiImageCurationPayload>;

  return {
    logoImageId: parsed.logoImageId ?? null,
    heroImageIds: Array.isArray(parsed.heroImageIds) ? parsed.heroImageIds.filter(Boolean) : [],
    spaceImageIds: Array.isArray(parsed.spaceImageIds) ? parsed.spaceImageIds.filter(Boolean) : [],
    galleryImageIds: Array.isArray(parsed.galleryImageIds) ? parsed.galleryImageIds.filter(Boolean) : [],
    ignoredImageIds: Array.isArray(parsed.ignoredImageIds) ? parsed.ignoredImageIds.filter(Boolean) : [],
    notes: {
      hero: parsed.notes?.hero ?? "",
      space: parsed.notes?.space ?? "",
      gallery: parsed.notes?.gallery ?? "",
      ignored: parsed.notes?.ignored ?? "",
    },
  };
}
