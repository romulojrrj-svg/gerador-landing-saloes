import { GoogleGenAI } from "@google/genai";
import type {
  GeminiImageCurationPayload,
  GeminiImageCurationRequest,
} from "@/lib/ai/image-curation-schema";

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_INSTRUCTION = `Voce e um curador rigoroso de imagens para landing pages de saloes de beleza.
Classifique imagens apenas em destaque inicial, nosso espaco, galeria e ignoradas.
Regra principal: e melhor deixar uma secao vazia do que usar imagem errada.
Regras:
- Nunca escolha logo automaticamente. Retorne logoImageId sempre null.
- Ignore panfletos, posts com texto, frases motivacionais, prints, memes, artes promocionais, imagens aleatorias, imagens sem relacao com o salao, imagens embacadas, cortadas, escuras, pixeladas ou ruins para landing.
- Nosso Espaco e extremamente restrito: use somente fotos em que o ambiente fisico seja o assunto principal. Cadeiras, espelhos, recepcao, bancadas, decoracao, fachada ou estacoes de atendimento sao exemplos validos.
- Nao coloque em Nosso Espaco closes de cabelo, unha, sobrancelha, maquiagem, procedimento, pessoa como assunto principal ou foto em que o salao aparece apenas como fundo borrado.
- Destaque inicial pode ter 1, 2 ou 3 imagens fortes. Nao force 3.
- Topo precisa de nitidez, bom enquadramento, boa resolucao e forca visual. Nao use screenshot, story, avatar, imagem cortada, thumbnail, imagem estreita demais ou baixa qualidade.
- Galeria aceita fotos boas de servico, resultado e ambiente, mas ainda rejeita imagens ruins, duplicadas, prints, stories, avatares, logos e imagens irrelevantes.
- Se nao houver imagem adequada para uma secao, deixe a secao vazia.
- Nenhuma imagem pode duplicar.
Retorne JSON estrito no formato pedido.`;

export async function curateImagesWithGemini(
  request: GeminiImageCurationRequest,
): Promise<GeminiImageCurationPayload> {
  if (!API_KEY) {
    throw new Error("GEMINI_API_KEY nao configurada.");
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
              businessType: request.businessType || "salao de beleza",
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
      temperature: 0.15,
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

  return sanitizeGeminiCurationPayload(parsed, images);
}

function sanitizeGeminiCurationPayload(
  payload: Partial<GeminiImageCurationPayload>,
  images: GeminiImageCurationRequest["images"],
): GeminiImageCurationPayload {
  const imageMap = new Map(images.map((image) => [image.id, image]));
  const usedIds = new Set<string>();
  const invalidIds = images.filter((image) => isInvalidImage(image)).map((image) => image.id);

  const heroImageIds = takeOnce(
    uniqueIds(payload.heroImageIds).filter((id) => {
      const image = imageMap.get(id);
      return image ? isStrongTopImage(image) : false;
    }),
    usedIds,
  ).slice(0, 3);

  const spaceImageIds = takeOnce(
    uniqueIds(payload.spaceImageIds).filter((id) => {
      const image = imageMap.get(id);
      return image ? isRealSpaceImage(image) : false;
    }),
    usedIds,
  );

  const galleryImageIds = takeOnce(
    uniqueIds(payload.galleryImageIds).filter((id) => {
      const image = imageMap.get(id);
      return image ? isUsableGalleryImage(image) : false;
    }),
    usedIds,
  ).slice(0, 8);

  const ignoredImageIds = takeOnce(
    uniqueIds([...invalidIds, ...uniqueIds(payload.ignoredImageIds)]).filter(
      (id) => imageMap.has(id) && !usedIds.has(id),
    ),
    new Set<string>(),
  );

  return {
    logoImageId: null,
    heroImageIds,
    spaceImageIds,
    galleryImageIds,
    ignoredImageIds,
    notes: {
      hero: payload.notes?.hero ?? "",
      space: payload.notes?.space ?? "",
      gallery: payload.notes?.gallery ?? "",
      ignored: payload.notes?.ignored ?? "",
    },
  };
}

function uniqueIds(values: string[] | undefined) {
  const ids: string[] = [];

  for (const value of values ?? []) {
    const id = typeof value === "string" ? value.trim() : "";

    if (id && !ids.includes(id)) {
      ids.push(id);
    }
  }

  return ids;
}

function takeOnce(ids: string[], usedIds: Set<string>) {
  const nextIds: string[] = [];

  for (const id of ids) {
    if (usedIds.has(id)) {
      continue;
    }

    usedIds.add(id);
    nextIds.push(id);
  }

  return nextIds;
}

function isStrongTopImage(image: GeminiImageCurationRequest["images"][number]) {
  const score = image.score ?? 0;
  const text = imageText(image);

  return (
    !isInvalidImage(image) &&
    score >= 68 &&
    !containsAny(text, weakTopTerms) &&
    image.currentType !== "logo"
  );
}

function isRealSpaceImage(image: GeminiImageCurationRequest["images"][number]) {
  const score = image.score ?? 0;
  const text = imageText(image);

  return (
    !isInvalidImage(image) &&
    score >= 58 &&
    image.currentType !== "logo" &&
    (image.currentType === "interior" ||
      (countMatches(text, spaceTerms) >= 2 &&
        !containsAny(text, serviceCloseupTerms)))
  );
}

function isUsableGalleryImage(image: GeminiImageCurationRequest["images"][number]) {
  return !isInvalidImage(image) && image.currentType !== "logo" && (image.score ?? 0) >= 42;
}

function isInvalidImage(image: GeminiImageCurationRequest["images"][number]) {
  const text = imageText(image);

  return image.currentType === "logo" || containsAny(text, invalidTerms);
}

function imageText(image: GeminiImageCurationRequest["images"][number]) {
  return `${image.id} ${image.url} ${image.source ?? ""} ${image.caption ?? ""} ${
    image.currentType ?? ""
  }`.toLowerCase();
}

function containsAny(value: string, terms: readonly string[]) {
  return terms.some((term) => value.includes(term));
}

function countMatches(value: string, terms: readonly string[]) {
  return terms.reduce((count, term) => (value.includes(term) ? count + 1 : count), 0);
}

const invalidTerms = [
  "logo",
  "avatar",
  "profile",
  "perfil",
  "highlight",
  "story",
  "stories",
  "destaque",
  "print",
  "screenshot",
  "reel",
  "thumbnail",
  "icon",
  "placeholder",
  "promo",
  "flyer",
  "poster",
  "sale",
  "offer",
  "desconto",
  "blur",
  "blurry",
  "pixel",
] as const;

const weakTopTerms = [
  ...invalidTerms,
  "close-up",
  "closeup",
  "close up",
  "crop",
  "cropped",
  "cortada",
  "unha close",
  "nail close",
  "sobrancelha close",
] as const;

const spaceTerms = [
  "interior",
  "inside",
  "space",
  "espaco",
  "ambiente",
  "reception",
  "recepcao",
  "chair",
  "cadeira",
  "mirror",
  "espelho",
  "station",
  "bancada",
  "decor",
  "decoracao",
  "room",
  "sala",
  "fachada",
  "salon interior",
] as const;

const serviceCloseupTerms = [
  "hair",
  "cabelo",
  "nail",
  "unha",
  "brow",
  "sobrancelha",
  "lash",
  "cilios",
  "makeup",
  "maquiagem",
  "procedure",
  "procedimento",
  "resultado",
  "result",
  "before",
  "after",
  "antes",
  "depois",
  "close",
] as const;
