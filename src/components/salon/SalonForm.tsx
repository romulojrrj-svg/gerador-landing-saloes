"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Clipboard,
  ExternalLink,
  FileText,
  Gauge,
  ImagePlus,
  Languages,
  LoaderCircle,
  Link2,
  MapPin,
  Search,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";
import {
  type ChangeEvent,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ensureCompleteSalon,
  formDataToInput,
  selectedServicesToSalonServices,
} from "@/lib/salon-storage";
import {
  mapSuggestedUseToImageType,
  mergeImageCandidates,
} from "@/lib/image-curation";
import {
  analyzeImageCandidates,
  applyLayoutImagePlan,
  buildChatGptCurationPrompt,
  createLocalImagePlan,
  validateChatGptCurationJson,
} from "@/lib/image-intelligence";
import {
  getAbsoluteAppUrl,
  getApproachMessage,
  getCommercialChecklist,
  getCommercialReadinessLabel,
  getPreviewPath,
  getPublicLandingPath,
} from "@/lib/mvp-commercial";
import { getSalonRepositoryStatus } from "@/lib/salon-repository";
import {
  calculateLandingReadiness,
  generateAssistedCopy,
} from "@/lib/copy-generator";
import type {
  Salon,
  SalonCopySuggestion,
  SalonFormInput,
  SalonGalleryImage,
  SalonImageCandidate,
  SalonImageSelectionSummary,
  SalonImageSource,
  SalonImageType,
  SalonLayoutImagePlan,
  SalonReviewSource,
  SalonSourceMaterial,
  SalonTestimonial,
} from "@/types/salon";

type SalonFormProps = {
  mode: "create" | "edit";
  initialSalon?: Salon;
  isSubmitting?: boolean;
  errorMessage?: string;
  successMessage?: string;
  submitLabel: string;
  cancelHref: string;
  onSubmit: (input: SalonFormInput) => void;
};

type ImageDestination = "logo" | "top" | "gallery" | "space" | "ignore";

const serviceOptions = [
  "Cabelo",
  "Coloracao",
  "Pele",
  "Noivas e eventos",
  "Unhas",
  "Maquiagem",
];

const vibeOptions = ["Editorial", "Luxo suave", "Minimalista", "Bem-estar"];

const positioningSuggestions = [
  "Salao de beleza completo para cuidar do visual em um so lugar.",
  "Beleza, cuidado e autoestima em uma experiencia pensada para voce.",
  "Cabelo, unhas e maquiagem com atendimento pratico e profissional.",
  "Atendimento de beleza para quem busca praticidade, qualidade e bom gosto.",
];

const isDevelopment = process.env.NODE_ENV === "development";

const testSalonPreset = {
  name: "Studio 365 Divas",
  location: "Tijuca, Rio de Janeiro",
  status: "published",
  language: "pt-BR",
  positioningLine: "Beauty, care and confidence in the heart of Oslo.",
  description: "Realçando sua melhor versão todos os dias",
  whatsapp: "+55 21 96444-0944",
  phone: "",
  instagramUrl: "https://www.instagram.com/studio365divas/",
  googleMapsUrl: "https://share.google/VTITrUA3rV3c7T7yl",
  websiteUrl: "",
  bookingUrl: "",
  city: "Rio de Janeiro",
  country: "Brasil",
  address: "Rua Conde de Bonfim, 255 - Loja 125",
  businessHours: "Terca a sabado, de 10:00 as 19:00",
  observedServices: "cabelo, unhas, maquiagem",
  services: ["Cabelo", "Unhas", "Maquiagem"],
  differentiators:
    "Atendimento pratico, ambiente acolhedor e foco em rotina e ocasioes especiais.",
  visualNotes:
    "Identidade feminina, urbana e comercial, com foco em resultado e acolhimento.",
  manualAssistantNotes:
    "Preset de desenvolvimento para testar copy assistida, CTA, publicacao e abordagem comercial.",
  notes:
    "Dados de exemplo para fluxo rapido de testes locais e validacao da landing publica.",
} as const satisfies {
  name: string;
  location: string;
  status: string;
  language: string;
  positioningLine: string;
  description: string;
  whatsapp: string;
  phone: string;
  instagramUrl: string;
  googleMapsUrl: string;
  websiteUrl: string;
  bookingUrl: string;
  city: string;
  country: string;
  address: string;
  businessHours: string;
  observedServices: string;
  services: readonly string[];
  differentiators: string;
  visualNotes: string;
  manualAssistantNotes: string;
  notes: string;
};

const testSalonImages: SalonGalleryImage[] = [
  {
    id: "dev-logo-365-divas",
    url: "https://dummyimage.com/480x180/111827/ffffff.png&text=Studio+365+Divas",
    src: "https://dummyimage.com/480x180/111827/ffffff.png&text=Studio+365+Divas",
    alt: "Logo Studio 365 Divas",
    type: "logo",
    source: "url",
    isReal: true,
    selectedForLanding: true,
    createdAt: "2026-06-28T00:00:00.000Z",
  },
  {
    id: "dev-hero-365-divas",
    url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1400&q=80",
    src: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1400&q=80",
    alt: "Ambiente principal do Studio 365 Divas",
    type: "hero",
    source: "url",
    isReal: true,
    selectedForLanding: true,
    createdAt: "2026-06-28T00:00:00.000Z",
  },
  {
    id: "dev-interior-365-divas",
    url: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=80",
    src: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=80",
    alt: "Espaco interno do Studio 365 Divas",
    type: "interior",
    source: "url",
    isReal: true,
    selectedForLanding: true,
    createdAt: "2026-06-28T00:00:00.000Z",
  },
  {
    id: "dev-gallery-365-divas",
    url: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80",
    src: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80",
    alt: "Detalhes de atendimento e beleza no Studio 365 Divas",
    type: "gallery",
    source: "url",
    isReal: true,
    selectedForLanding: true,
    createdAt: "2026-06-28T00:00:00.000Z",
  },
  {
    id: "dev-result-365-divas",
    url: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1200&q=80",
    src: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1200&q=80",
    alt: "Resultado de maquiagem e acabamento do Studio 365 Divas",
    type: "result",
    source: "url",
    isReal: true,
    selectedForLanding: true,
    createdAt: "2026-06-28T00:00:00.000Z",
  },
];

const testSalonReviews: SalonTestimonial[] = [
  {
    id: "dev-review-emma",
    authorName: "Emma L.",
    rating: 5,
    text: "Beautiful space, friendly team and very easy to book. The service felt professional from start to finish.",
    source: "google",
    reviewDate: "2026-06-10",
    isReal: true,
    selectedForLanding: true,
    quote:
      "Beautiful space, friendly team and very easy to book. The service felt professional from start to finish.",
    name: "Emma L.",
    role: "Review de teste",
  },
  {
    id: "dev-review-sofia",
    authorName: "Sofia M.",
    rating: 5,
    text: "Loved the atmosphere and the attention to detail. A great place for hair and beauty treatments in Oslo.",
    source: "google",
    reviewDate: "2026-06-14",
    isReal: true,
    selectedForLanding: true,
    quote:
      "Loved the atmosphere and the attention to detail. A great place for hair and beauty treatments in Oslo.",
    name: "Sofia M.",
    role: "Review de teste",
  },
  {
    id: "dev-review-ingrid",
    authorName: "Ingrid A.",
    rating: 4,
    text: "Clean, calm and elegant studio. The appointment was smooth and the result looked great.",
    source: "google",
    reviewDate: "2026-06-18",
    isReal: true,
    selectedForLanding: true,
    quote:
      "Clean, calm and elegant studio. The appointment was smooth and the result looked great.",
    name: "Ingrid A.",
    role: "Review de teste",
  },
];

const imageSourceOptions: Array<{ value: SalonImageSource; label: string }> = [
  { value: "url", label: "URL" },
  { value: "instagram", label: "Instagram" },
  { value: "google", label: "Google" },
  { value: "website", label: "Site" },
  { value: "manual", label: "Upload manual" },
  { value: "print", label: "Print" },
];

const imageTypeOptions: Array<{ value: SalonImageType; label: string }> = [
  { value: "logo", label: "Logo" },
  { value: "hero", label: "Destaque inicial" },
  { value: "gallery", label: "Galeria" },
  { value: "interior", label: "Nosso Espaço" },
];

const candidateSuggestedUseOptions = [
  { value: "logo", label: "Logo" },
  { value: "top", label: "Destaque inicial" },
  { value: "gallery", label: "Galeria" },
  { value: "space", label: "Nosso Espaço" },
  { value: "ignore", label: "Ignorar" },
];

const imageDestinationOptions: Array<{ value: ImageDestination; label: string }> = [
  { value: "logo", label: "Logo" },
  { value: "top", label: "Destaque inicial" },
  { value: "gallery", label: "Galeria" },
  { value: "space", label: "Nosso Espaço" },
  { value: "ignore", label: "Ignorar" },
];

const reviewSourceOptions: Array<{ value: SalonReviewSource; label: string }> = [
  { value: "google", label: "Google" },
  { value: "manual", label: "Manual" },
];

const defaultImageDraft = {
  url: "",
  alt: "",
  source: "url" as SalonImageSource,
  type: "gallery" as SalonImageType,
  sourceUrl: "",
  selectedForLanding: true,
};

const defaultReviewDraft = {
  authorName: "",
  rating: 5,
  text: "",
  reviewDate: "",
  source: "google" as SalonReviewSource,
  sourceUrl: "",
  selectedForLanding: true,
};

export function SalonForm({
  mode,
  initialSalon,
  isSubmitting,
  errorMessage,
  successMessage,
  submitLabel,
  cancelHref,
  onSubmit,
}: SalonFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [realImages, setRealImages] = useState<SalonGalleryImage[]>(() =>
    getInitialRealImages(initialSalon),
  );
  const [realReviews, setRealReviews] = useState<SalonTestimonial[]>(() =>
    getInitialRealReviews(initialSalon),
  );
  const [imageCandidates, setImageCandidates] = useState<SalonImageCandidate[]>(
    () => initialSalon?.imageCandidates ?? [],
  );
  const [imageSelectionSummary, setImageSelectionSummary] =
    useState<SalonImageSelectionSummary | undefined>(
      () => initialSalon?.imageSelectionSummary,
    );
  const [layoutImagePlan, setLayoutImagePlan] = useState<
    SalonLayoutImagePlan | undefined
  >(() => initialSalon?.layoutImagePlan);
  const [copySuggestion, setCopySuggestion] = useState<
    SalonCopySuggestion | undefined
  >(() => initialSalon?.copySuggestions ?? initialSalon?.generatedCopy);
  const [appliedCopy, setAppliedCopy] = useState<
    SalonCopySuggestion | undefined
  >(() =>
    initialSalon?.generatedCopy?.status === "applied"
      ? initialSalon.generatedCopy
      : initialSalon?.copySuggestions?.status === "applied"
        ? initialSalon.copySuggestions
        : undefined,
  );
  const [copyHistory, setCopyHistory] = useState<SalonCopySuggestion[]>(
    () => initialSalon?.copyHistory ?? [],
  );
  const [copyMessage, setCopyMessage] = useState("");
  const repositoryStatus = getSalonRepositoryStatus();
  const availableServices = Array.from(
    new Set([...serviceOptions, ...(initialSalon?.selectedServices ?? [])]),
  );
  const selectedServices = initialSalon?.selectedServices ?? [];
  const selectedVibe = initialSalon?.visualStyle ?? "Luxo suave";
  const readinessSalon = useMemo(
    () => ensureCompleteSalon(initialSalon ?? {}),
    [initialSalon],
  );
  const readiness = calculateLandingReadiness(readinessSalon);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitCurrentForm();
  }

  function submitCurrentForm(overrides?: {
    copySuggestion?: SalonCopySuggestion;
    appliedCopy?: SalonCopySuggestion;
    copyHistory?: SalonCopySuggestion[];
    galleryImages?: SalonGalleryImage[];
    testimonials?: SalonTestimonial[];
  }) {
    const currentForm = formRef.current;

    if (!currentForm) {
      return;
    }

    const formData = new FormData(currentForm);
    const input = formDataToInput(formData);
    const nextCopySuggestion = overrides?.copySuggestion ?? copySuggestion;
    const nextAppliedCopy = overrides?.appliedCopy ?? appliedCopy;
    const nextCopyHistory = overrides?.copyHistory ?? copyHistory;

    onSubmit({
      ...input,
      galleryImages: overrides?.galleryImages ?? realImages,
      imageCandidates,
      imageSelectionSummary,
      layoutImagePlan,
      testimonials: overrides?.testimonials ?? realReviews,
      sourceMaterials: buildSourceMaterials(
        overrides?.galleryImages ?? realImages,
        overrides?.testimonials ?? realReviews,
      ),
      copySuggestions: nextCopySuggestion,
      generatedCopy: nextAppliedCopy,
      copyHistory: nextCopyHistory,
      lastGeneratedAt: nextCopySuggestion?.generatedAt,
      lastAppliedAt: nextAppliedCopy?.appliedAt,
    });
  }

  function buildDraftSalonFromForm() {
    const currentForm = formRef.current;
    const input = currentForm
      ? formDataToInput(new FormData(currentForm))
      : undefined;

    if (!input) {
      return ensureCompleteSalon(initialSalon ?? {});
    }

    return ensureCompleteSalon({
      ...(initialSalon ?? {}),
      name: input.name,
      location: input.location,
      city: input.city,
      country: input.country,
      status: input.status,
      language: input.language,
      landingLanguage: input.language,
      positioningLine: input.positioningLine,
      description: input.description,
      visualStyle: input.visualStyle,
      brandTone: input.brandTone,
      instagramUrl: input.instagramUrl,
      googleMapsUrl: input.googleMapsUrl,
      googleBusinessUrl: input.googleMapsUrl,
      websiteUrl: input.websiteUrl,
      bookingUrl: input.bookingUrl,
      whatsapp: input.whatsapp,
      phone: input.phone,
      selectedServices: input.selectedServices,
      services: selectedServicesToSalonServices(
        input.selectedServices,
        input.language,
      ),
      galleryImages: realImages.length ? realImages : initialSalon?.galleryImages,
      imageCandidates,
      imageSelectionSummary,
      layoutImagePlan,
      testimonials: realReviews,
      businessHours: input.businessHours,
      address: input.address,
      extractedBusinessInfo: input.extractedBusinessInfo,
      manualAssistantNotes: input.manualAssistantNotes,
      notes: input.notes,
    });
  }

  function fillFormField(name: string, value: string) {
    const currentForm = formRef.current;

    if (!currentForm) {
      return;
    }

    const field = currentForm.elements.namedItem(name);

    if (
      field instanceof HTMLInputElement ||
      field instanceof HTMLTextAreaElement ||
      field instanceof HTMLSelectElement
    ) {
      field.value = value;
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  function fillCheckboxGroup(name: string, values: readonly string[]) {
    const currentForm = formRef.current;

    if (!currentForm) {
      return;
    }

    const checkboxes = currentForm.querySelectorAll<HTMLInputElement>(
      `input[type="checkbox"][name="${name}"]`,
    );

    checkboxes.forEach((checkbox) => {
      checkbox.checked = values.includes(checkbox.value);
      checkbox.dispatchEvent(new Event("change", { bubbles: true }));
      checkbox.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }

  function getFormFieldValue(name: string) {
    const currentForm = formRef.current;

    if (!currentForm) {
      return "";
    }

    const field = currentForm.elements.namedItem(name);

    if (
      field instanceof HTMLInputElement ||
      field instanceof HTMLTextAreaElement ||
      field instanceof HTMLSelectElement
    ) {
      return field.value;
    }

    return "";
  }

  function handleFillTestData() {
    fillFormField("name", testSalonPreset.name);
    fillFormField("location", testSalonPreset.location);
    fillFormField("status", testSalonPreset.status);
    fillFormField("language", testSalonPreset.language);
    fillFormField("positioningLine", testSalonPreset.positioningLine);
    fillFormField("description", testSalonPreset.description);
    fillFormField("whatsapp", testSalonPreset.whatsapp);
    fillFormField("phone", testSalonPreset.phone);
    fillFormField("instagramUrl", testSalonPreset.instagramUrl);
    fillFormField("googleMapsUrl", testSalonPreset.googleMapsUrl);
    fillFormField("websiteUrl", testSalonPreset.websiteUrl);
    fillFormField("bookingUrl", testSalonPreset.bookingUrl);
    fillFormField("city", testSalonPreset.city);
    fillFormField("country", testSalonPreset.country);
    fillFormField("address", testSalonPreset.address);
    fillFormField("businessHours", testSalonPreset.businessHours);
    fillFormField("observedServices", testSalonPreset.observedServices);
    fillFormField("differentiators", testSalonPreset.differentiators);
    fillFormField("visualNotes", testSalonPreset.visualNotes);
    fillFormField("manualAssistantNotes", testSalonPreset.manualAssistantNotes);
    fillFormField("notes", testSalonPreset.notes);
    fillCheckboxGroup("services", testSalonPreset.services);
    const nextImages = mergePresetImages(realImages, testSalonImages);
    const nextReviews = mergePresetReviews(realReviews, testSalonReviews);

    setRealImages(nextImages);
    setRealReviews(nextReviews);

    if (mode === "create") {
      submitCurrentForm({
        galleryImages: nextImages,
        testimonials: nextReviews,
      });
    }
  }

  function handleGenerateCopy() {
    const suggestion = generateAssistedCopy(buildDraftSalonFromForm());
    const nextHistory = copySuggestion
      ? [copySuggestion, ...copyHistory].slice(0, 8)
      : copyHistory;

    setCopySuggestion(suggestion);
    setCopyHistory(nextHistory);
    setCopyMessage("Sugestoes geradas. Revise e edite antes de aplicar.");
  }

  function handleApplyCopy() {
    if (!copySuggestion) {
      setCopyMessage("Gere sugestoes antes de aplicar.");
      return;
    }

    const appliedSuggestion: SalonCopySuggestion = {
      ...copySuggestion,
      status: "applied",
      appliedAt: new Date().toISOString(),
    };
    const nextHistory = [
      appliedSuggestion,
      ...copyHistory.filter((item) => item.id !== appliedSuggestion.id),
    ].slice(0, 8);

    setCopySuggestion(appliedSuggestion);
    setAppliedCopy(appliedSuggestion);
    setCopyHistory(nextHistory);
    setCopyMessage("Sugestoes aplicadas e salvas na landing.");
    submitCurrentForm({
      copySuggestion: appliedSuggestion,
      appliedCopy: appliedSuggestion,
      copyHistory: nextHistory,
    });
  }

  function handleDiscardCopy() {
    if (copySuggestion) {
      setCopyHistory([copySuggestion, ...copyHistory].slice(0, 8));
    }

    setCopySuggestion(undefined);
    setAppliedCopy(undefined);
    setCopyMessage("Sugestoes descartadas nesta edicao.");
  }

  return (
    <form ref={formRef} className="grid gap-5" onSubmit={handleSubmit}>
      <BasicInfoSection
        initialSalon={initialSalon}
        onFillSuggestion={fillFormField}
        onFillTestData={handleFillTestData}
      />

      <ContactSection initialSalon={initialSalon} />

      <ServicesSection
        availableServices={availableServices}
        initialSalon={initialSalon}
        selectedServices={selectedServices}
      />

      {mode === "edit" || isDevelopment ? (
        <>
          <RealImagesSection
            images={realImages}
            salonName={initialSalon?.name}
            getFieldValue={getFormFieldValue}
            candidates={imageCandidates}
            selectionSummary={imageSelectionSummary}
            layoutImagePlan={layoutImagePlan}
            onChange={setRealImages}
            onCandidatesChange={setImageCandidates}
            onSelectionChange={setImageSelectionSummary}
            onLayoutPlanChange={setLayoutImagePlan}
          />
          <RealReviewsSection reviews={realReviews} onChange={setRealReviews} />
        </>
      ) : null}

      {mode === "edit" ? (
        <>
          <CopyAssistantSection
            salon={readinessSalon}
            suggestion={copySuggestion}
            readiness={readiness}
            message={copyMessage}
            onGenerate={handleGenerateCopy}
            onApply={handleApplyCopy}
            onDiscard={handleDiscardCopy}
            onChange={setCopySuggestion}
          />
        </>
      ) : null}

      {mode === "edit" && initialSalon ? (
        <CommercialApproachSection
          salon={initialSalon}
          storageLabel={repositoryStatus.label}
        />
      ) : null}

      <AdvancedSection
        initialSalon={initialSalon}
        selectedVibe={selectedVibe}
      />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
        <Link href={cancelHref} className="btn btn-secondary px-6 py-3">
          <ArrowLeft className="h-4 w-4" />
          {mode === "edit" ? "Voltar para previa" : "Cancelar"}
        </Link>
        {mode === "edit" && initialSalon ? (
          <Link
            href={`/p/${initialSalon.slug}`}
            target="_blank"
            className="btn btn-secondary px-6 py-3"
          >
            Abrir pagina publica
            <ExternalLink className="h-4 w-4" />
          </Link>
        ) : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary px-6 py-3 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Salvando..." : submitLabel}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {successMessage ? (
        <p className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-950">
          <Check className="mr-2 inline h-4 w-4" />
          {successMessage}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-950">
          {errorMessage}
        </p>
      ) : null}
    </form>
  );
}

function BasicInfoSection({
  initialSalon,
  onFillSuggestion,
  onFillTestData,
}: {
  initialSalon?: Salon;
  onFillSuggestion: (name: string, value: string) => void;
  onFillTestData: () => void;
}) {
  return (
    <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-950/5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-100 text-zinc-950">
          <Building2 className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-2xl font-semibold text-zinc-950">
            Dados principais
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-500">
            O minimo para montar uma landing comercial rapida.
          </p>
        </div>
        </div>
        {isDevelopment ? (
          <button
            type="button"
            onClick={onFillTestData}
            className="btn btn-secondary shrink-0 px-4 py-2 text-sm"
          >
            <Sparkles className="h-4 w-4" />
            Preencher salão teste
          </button>
        ) : null}
      </div>

      <div className="mt-7 grid gap-5 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-zinc-800">
            Nome do salao
          </span>
          <input
            name="name"
            type="text"
            defaultValue={initialSalon?.name ?? ""}
            placeholder="Oslo Beauty Studio"
            required
            className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-teal-700 focus:bg-white"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-zinc-800">
            Localizacao exibida
          </span>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              name="location"
              type="text"
              defaultValue={initialSalon?.location ?? ""}
              placeholder="Frogner, Oslo"
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-3 pl-11 pr-4 text-sm text-zinc-950 outline-none transition focus:border-teal-700 focus:bg-white"
            />
          </div>
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-zinc-800">
            Status da landing
          </span>
          <select
            name="status"
            defaultValue={initialSalon?.status === "published" ? "published" : "draft"}
            className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-teal-700 focus:bg-white"
          >
            <option value="draft">Rascunho</option>
            <option value="published">Publicado</option>
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-zinc-800">Idioma</span>
          <div className="relative">
            <Languages className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <select
              name="language"
              defaultValue={initialSalon?.language ?? "en"}
              className="w-full appearance-none rounded-2xl border border-zinc-200 bg-zinc-50 py-3 pl-11 pr-4 text-sm text-zinc-950 outline-none transition focus:border-teal-700 focus:bg-white"
            >
              <option value="pt-BR">Portugues do Brasil</option>
              <option value="en">Ingles</option>
              <option value="es">Espanhol</option>
              <option value="fr">Frances</option>
              <option value="no">Noruegues</option>
            </select>
          </div>
        </label>
        <label className="grid gap-2 md:col-span-2">
          <span className="text-sm font-semibold text-zinc-800">
            Frase de posicionamento opcional
          </span>
          <textarea
            name="positioningLine"
            rows={3}
            defaultValue={initialSalon?.positioningLine ?? ""}
            placeholder="Opcional"
            className="resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-6 text-zinc-950 outline-none transition focus:border-teal-700 focus:bg-white"
          />
          <span className="text-xs leading-5 text-zinc-500">
            Nao sabe o que escrever? Deixe em branco e gere textos depois.
          </span>
          <div className="flex flex-wrap gap-2 pt-1">
            {positioningSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onFillSuggestion("positioningLine", suggestion)}
                className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-900"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </label>
        <label className="grid gap-2 md:col-span-2">
          <span className="text-sm font-semibold text-zinc-800">
            Descricao opcional
          </span>
          <textarea
            name="description"
            rows={4}
            defaultValue={initialSalon?.description ?? ""}
            placeholder="Opcional"
            className="resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-6 text-zinc-950 outline-none transition focus:border-teal-700 focus:bg-white"
          />
          <span className="text-xs leading-5 text-zinc-500">
            Nao sabe o que escrever? Deixe em branco e gere textos depois.
          </span>
        </label>
      </div>
    </section>
  );
}

function ContactSection({ initialSalon }: { initialSalon?: Salon }) {
  return (
    <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-950/5">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-800">
          <Link2 className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-2xl font-semibold text-zinc-950">
            Links e contato
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-500">
            Cidade, pais e endereco podem ficar em branco se o Google Maps ja
            estiver preenchido.
          </p>
        </div>
      </div>

      <div className="mt-7 grid gap-4 md:grid-cols-2">
        <InputField name="whatsapp" label="WhatsApp" defaultValue={initialSalon?.whatsapp} />
        <InputField name="phone" label="Telefone" defaultValue={initialSalon?.phone} />
        <InputField name="instagramUrl" label="Instagram" type="url" defaultValue={initialSalon?.instagramUrl} />
        <InputField name="googleMapsUrl" label="Google Maps" type="url" defaultValue={initialSalon?.googleMapsUrl} />
        <InputField name="websiteUrl" label="Site" type="url" defaultValue={initialSalon?.websiteUrl} />
        <InputField name="bookingUrl" label="Link de agendamento" type="url" defaultValue={initialSalon?.bookingUrl} />
        <InputField name="city" label="Cidade" defaultValue={initialSalon?.city} />
        <InputField name="country" label="Pais" defaultValue={initialSalon?.country} />
        <div className="md:col-span-2">
          <InputField name="address" label="Endereco" defaultValue={initialSalon?.address} />
        </div>
      </div>
    </section>
  );
}

function ServicesSection({
  availableServices,
  initialSalon,
  selectedServices,
}: {
  availableServices: string[];
  initialSalon?: Salon;
  selectedServices: string[];
}) {
  return (
    <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-950/5">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-zinc-950">
          <Gauge className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-2xl font-semibold text-zinc-950">Servicos</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-500">
            Se voce ainda nao souber os servicos exatos do salao, deixe em
            branco ou use categorias gerais. A landing nao deve inventar
            servicos especificos.
          </p>
        </div>
      </div>

      <div className="mt-7 grid gap-5">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-zinc-800">
            Servicos observados/manual
          </span>
          <textarea
            name="observedServices"
            rows={3}
            defaultValue={initialSalon?.extractedBusinessInfo?.observedServices ?? ""}
            placeholder="Ex.: cabelo, unhas, maquiagem, sobrancelhas, noivas"
            className="resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-6 text-zinc-950 outline-none transition focus:border-teal-700 focus:bg-white"
          />
        </label>

        <div>
          <p className="text-sm font-semibold text-zinc-800">
            Atalhos opcionais
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {availableServices.map((service) => (
              <label
                key={service}
                className="flex cursor-pointer items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-700 transition has-[:checked]:border-teal-700 has-[:checked]:bg-teal-50 has-[:checked]:text-teal-900"
              >
                <input
                  type="checkbox"
                  name="services"
                  value={service}
                  defaultChecked={selectedServices.includes(service)}
                  className="h-4 w-4 accent-teal-700"
                />
                {service}
              </label>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CopyAssistantSection({
  salon,
  suggestion,
  readiness,
  message,
  onGenerate,
  onApply,
  onDiscard,
  onChange,
}: {
  salon: Salon;
  suggestion?: SalonCopySuggestion;
  readiness: ReturnType<typeof calculateLandingReadiness>;
  message: string;
  onGenerate: () => void;
  onApply: () => void;
  onDiscard: () => void;
  onChange: Dispatch<SetStateAction<SalonCopySuggestion | undefined>>;
}) {
  const [copyFeedback, setCopyFeedback] = useState("");

  function updateSuggestion(updates: Partial<SalonCopySuggestion>) {
    onChange((current) =>
      current
        ? {
            ...current,
            ...updates,
            status: current.status === "applied" ? "draft" : current.status,
          }
        : current,
    );
  }

  async function handleCopyProspectingMessage() {
    if (!suggestion?.prospectingMessage) {
      setCopyFeedback("Gere sugestoes para criar a mensagem.");
      return;
    }

    const copied = await copyTextToClipboard(suggestion.prospectingMessage);
    setCopyFeedback(
      copied
        ? "Mensagem de prospeccao copiada."
        : "Nao foi possivel copiar a mensagem.",
    );
  }

  return (
    <section
      id="copy-assistant"
      className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-950/5"
    >
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-800">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-2xl font-semibold text-zinc-950">
            Gerador assistido de textos
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-500">
            Use os dados cadastrados para gerar e revisar uma copy mais
            comercial antes de aplicar.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {readiness.items.map((item) => (
          <div
            key={item.id}
            className={`rounded-2xl px-4 py-3 text-xs font-semibold ${
              item.ok
                ? "bg-teal-50 text-teal-950 ring-1 ring-teal-100"
                : "bg-amber-50 text-amber-950 ring-1 ring-amber-100"
            }`}
          >
            {item.label}
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={onGenerate} className="btn btn-primary px-5 py-3">
          <Sparkles className="h-4 w-4" />
          {suggestion ? "Regenerar" : "Gerar sugestoes"}
        </button>
        <button type="button" onClick={onApply} className="btn btn-secondary px-5 py-3">
          Aplicar sugestoes na landing
        </button>
        <button type="button" onClick={onDiscard} className="btn btn-secondary px-5 py-3">
          Descartar
        </button>
        <button
          type="button"
          onClick={handleCopyProspectingMessage}
          className="btn btn-secondary px-5 py-3"
        >
          <Clipboard className="h-4 w-4" />
          Copiar mensagem de prospeccao
        </button>
      </div>

      {message ? (
        <p className="mt-4 rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-950">
          {message}
        </p>
      ) : null}
      {copyFeedback ? (
        <p className="mt-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-800">
          {copyFeedback}
        </p>
      ) : null}

      {suggestion ? (
        <div className="mt-6 grid gap-4">
          <TextInput
            label="Titulo principal"
            value={suggestion.headline}
            onChange={(value) => updateSuggestion({ headline: value })}
          />
          <TextAreaInput
            label="Subtitulo"
            value={suggestion.subheadline}
            rows={3}
            onChange={(value) => updateSuggestion({ subheadline: value })}
          />
          <TextAreaInput
            label="Sobre o salao"
            value={suggestion.aboutText}
            rows={4}
            onChange={(value) => updateSuggestion({ aboutText: value })}
          />
          <TextAreaInput
            label="Introducao dos servicos"
            value={suggestion.servicesIntroText}
            rows={3}
            onChange={(value) => updateSuggestion({ servicesIntroText: value })}
          />
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-950">
            Ao alterar o nome do servico, revise tambem a descricao antes de
            aplicar.
          </p>
          <div className="grid gap-3">
            {suggestion.serviceDescriptions.map((serviceCopy, index) => (
              <div
                key={serviceCopy.serviceId}
                className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4"
              >
                <TextInput
                  label="Nome publico do servico"
                  value={serviceCopy.title}
                  onChange={(value) =>
                    onChange((current) =>
                      current
                        ? {
                            ...current,
                            serviceDescriptions: current.serviceDescriptions.map(
                              (item, itemIndex) =>
                                itemIndex === index ? { ...item, title: value } : item,
                            ),
                          }
                        : current,
                    )
                  }
                />
                <div className="mt-3">
                  <TextAreaInput
                    label="Descricao do servico"
                    value={serviceCopy.description}
                    rows={3}
                    onChange={(value) =>
                      onChange((current) =>
                        current
                          ? {
                              ...current,
                              serviceDescriptions: current.serviceDescriptions.map(
                                (item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, description: value }
                                    : item,
                              ),
                            }
                          : current,
                      )
                    }
                  />
                </div>
              </div>
            ))}
          </div>
          <TextAreaInput
            label="CTA final"
            value={suggestion.ctaText}
            rows={3}
            onChange={(value) => updateSuggestion({ ctaText: value })}
          />
          <TextInput
            label="Botao do CTA"
            value={suggestion.ctaButtonLabel}
            onChange={(value) => updateSuggestion({ ctaButtonLabel: value })}
          />
          <TextAreaInput
            label="Mensagem de prospeccao"
            value={suggestion.prospectingMessage}
            rows={4}
            onChange={(value) => updateSuggestion({ prospectingMessage: value })}
          />
        </div>
      ) : (
        <div className="mt-6 rounded-[1.5rem] border border-dashed border-zinc-300 bg-zinc-50 p-5 text-sm leading-6 text-zinc-500">
          Nenhuma sugestao gerada ainda para {salon.name}. Gere a primeira
          versao quando ja tiver o minimo do cadastro.
        </div>
      )}
    </section>
  );
}

function CommercialApproachSection({
  salon,
  storageLabel,
}: {
  salon: Salon;
  storageLabel: "Local" | "Servidor local" | "Supabase";
}) {
  const [feedback, setFeedback] = useState("");
  const previewPath = getPreviewPath(salon.slug);
  const publicPath = getPublicLandingPath(salon.slug);
  const previewUrl = getAbsoluteAppUrl(previewPath);
  const publicUrl = getAbsoluteAppUrl(publicPath);
  const checklist = getCommercialChecklist(salon);
  const readinessLabel = getCommercialReadinessLabel(salon);
  const approachMessage = getApproachMessage(salon);

  async function handleCopyPublicLink() {
    const copied = await copyTextToClipboard(publicUrl);
    setFeedback(
      copied ? "Link publico copiado." : "Nao foi possivel copiar o link publico.",
    );
  }

  async function handleCopyMessage() {
    const copied = await copyTextToClipboard(approachMessage);
    setFeedback(
      copied
        ? "Mensagem de abordagem copiada."
        : "Nao foi possivel copiar a mensagem de abordagem.",
    );
  }

  return (
    <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-950/5">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-800">
          <Clipboard className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-zinc-950">
                Abordagem comercial
              </h2>
              <p className="mt-1 text-sm leading-6 text-zinc-500">
                Link publico, preview interno e mensagem prontos para abordar o
                salao.
              </p>
            </div>
            <span className="rounded-full bg-zinc-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white">
              {readinessLabel}
            </span>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-semibold text-zinc-950">
                Links da landing
              </p>
              <div className="mt-4 grid gap-3 text-xs leading-5 text-zinc-600">
                <div>
                  <p className="font-semibold text-zinc-900">Preview interno</p>
                  <p className="break-all">{previewUrl}</p>
                </div>
                <div>
                  <p className="font-semibold text-zinc-900">Link publico</p>
                  <p className="break-all">{publicUrl}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleCopyPublicLink}
                  className="btn btn-secondary px-4 py-2"
                >
                  <Clipboard className="h-4 w-4" />
                  Copiar link publico
                </button>
                <Link
                  href={publicPath}
                  target="_blank"
                  className="btn btn-secondary px-4 py-2"
                >
                  Abrir landing publica
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
              {storageLabel !== "Supabase" ? (
                <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-950">
                  {storageLabel === "Servidor local"
                    ? "Este link funciona em qualquer dispositivo conectado ao mesmo dev server. Para envio externo real, ainda sera preciso publicar com deploy."
                    : "Este link so funciona neste navegador/ambiente local. Para enviar ao cliente, publique usando Supabase e deploy."}
                </p>
              ) : null}
            </div>

            <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-semibold text-zinc-950">
                Pronto para abordar?
              </p>
              <div className="mt-4 grid gap-2">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-2xl px-4 py-3 text-xs font-semibold ${
                      item.ok
                        ? "bg-teal-50 text-teal-950 ring-1 ring-teal-100"
                        : "bg-amber-50 text-amber-950 ring-1 ring-amber-100"
                    }`}
                  >
                    {item.label}: {item.ok ? "ok" : "falta"}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-950">
                  Mensagem de abordagem
                </p>
                <p className="mt-3 text-sm leading-7 text-zinc-700">
                  {approachMessage}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="btn btn-primary px-4 py-2"
              >
                <Clipboard className="h-4 w-4" />
                Copiar mensagem de abordagem
              </button>
            </div>
          </div>

          {feedback ? (
            <p className="mt-4 rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-950">
              {feedback}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function RealImagesSection({
  images,
  candidates,
  selectionSummary,
  layoutImagePlan,
  salonName,
  getFieldValue,
  onChange,
  onCandidatesChange,
  onSelectionChange,
  onLayoutPlanChange,
}: {
  images: SalonGalleryImage[];
  candidates: SalonImageCandidate[];
  selectionSummary?: SalonImageSelectionSummary;
  layoutImagePlan?: SalonLayoutImagePlan;
  salonName?: string;
  getFieldValue: (name: string) => string;
  onChange: Dispatch<SetStateAction<SalonGalleryImage[]>>;
  onCandidatesChange: Dispatch<SetStateAction<SalonImageCandidate[]>>;
  onSelectionChange: Dispatch<
    SetStateAction<SalonImageSelectionSummary | undefined>
  >;
  onLayoutPlanChange: Dispatch<SetStateAction<SalonLayoutImagePlan | undefined>>;
}) {
  const [draft, setDraft] = useState(defaultImageDraft);
  const [message, setMessage] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const [collectorDebug, setCollectorDebug] = useState<string[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [loadingSource, setLoadingSource] = useState<string | null>(null);
  const [chatGptPrompt, setChatGptPrompt] = useState("");
  const [chatGptJson, setChatGptJson] = useState("");
  const [chatGptValidationMessage, setChatGptValidationMessage] = useState("");
  const [validatedPlan, setValidatedPlan] = useState<SalonLayoutImagePlan | undefined>(
    undefined,
  );

  function addImage() {
    const url = draft.url.trim();

    if (!url) {
      setMessage("Cole uma URL de imagem antes de adicionar.");
      return;
    }

    const image: SalonGalleryImage = {
      id: createLocalId("image"),
      url,
      src: url,
      alt:
        draft.alt.trim() ||
        `${salonName || "Salao"} - ${draft.type === "logo" ? "logo" : "foto real"}`,
      type: draft.type,
      source: draft.source,
      sourceUrl: draft.sourceUrl.trim() || undefined,
      originalPostUrl:
        draft.source === "instagram" ? draft.sourceUrl.trim() || undefined : undefined,
      isReal: true,
      selectedForLanding:
        draft.type === "hero" ? true : draft.selectedForLanding,
      createdAt: new Date().toISOString(),
    };

    onChange((current) => normalizeHeroImages([...current, image]));
    setDraft(defaultImageDraft);
    setMessage("Imagem adicionada. Salve as alteracoes para gravar.");
  }

  function updateImage(id: string, updates: Partial<SalonGalleryImage>) {
    onChange((current) =>
      normalizeHeroImages(
        current.map((image) =>
          image.id === id
            ? {
                ...image,
                ...updates,
                selectedForLanding:
                  updates.type === "hero"
                    ? true
                    : updates.selectedForLanding ?? image.selectedForLanding,
              }
            : image,
        ),
      ),
    );
  }

  function setHeroImage(id: string) {
    onChange((current) =>
      current.map((image) => ({
        ...image,
        type: image.id === id ? "hero" : image.type === "hero" ? "gallery" : image.type,
        selectedForLanding: image.id === id ? true : image.selectedForLanding,
      })),
    );
    onLayoutPlanChange((current) => setImagePlanDestination(current, id, "top"));
  }

  function removeImage(id: string) {
    onChange((current) => current.filter((image) => image.id !== id));
    onLayoutPlanChange((current) => removeImageFromPlan(current, id));
  }

  function setImageDestination(id: string, destination: ImageDestination) {
    onChange((current) =>
      normalizeHeroImages(
        current.map((image) =>
          image.id === id
            ? {
                ...image,
                type: imageDestinationToType(destination),
                selectedForLanding: destination !== "ignore",
              }
            : image,
        ),
      ),
    );
    onLayoutPlanChange((current) => setImagePlanDestination(current, id, destination));
  }

  function moveImageInPlan(id: string, direction: -1 | 1) {
    onLayoutPlanChange((current) => moveImageWithinPlan(current, id, direction));
  }

  function updateSpaceSettings(
    updates: Partial<Pick<
      SalonLayoutImagePlan,
      "spaceEnabled" | "spaceTitle" | "spaceDescription"
    >>,
  ) {
    onLayoutPlanChange((current) => updatePlanSpaceSettings(current, updates));
  }

  async function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxBytes = 2 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      setMessage("Envie um arquivo jpg, jpeg, png ou webp.");
      event.currentTarget.value = "";
      return;
    }

    if (file.size > maxBytes) {
      setMessage("O arquivo excede o limite de 2 MB para armazenamento local.");
      event.currentTarget.value = "";
      return;
    }

    setUploadingFile(true);
    setMessage("");

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const image: SalonGalleryImage = {
        id: createLocalId("image"),
        url: dataUrl,
        src: dataUrl,
        alt:
          draft.alt.trim() ||
          `${salonName || "Salao"} - ${draft.type === "logo" ? "logo" : "foto real"}`,
        type: draft.type,
        source: "manual",
        sourceUrl: undefined,
        originalPostUrl: undefined,
        isReal: true,
        selectedForLanding: draft.type === "hero" ? true : draft.selectedForLanding,
        createdAt: new Date().toISOString(),
      };

      onChange((current) => normalizeHeroImages([...current, image]));
      setMessage(
        "Upload local concluido. A imagem foi salva neste navegador. Salve as alteracoes para gravar.",
      );
      setDraft((current) => ({
        ...current,
        alt: "",
        source: "manual",
      }));
    } catch {
      setMessage("Nao foi possivel processar o arquivo enviado.");
    } finally {
      setUploadingFile(false);
      event.currentTarget.value = "";
    }
  }

  function buildDraftSalonForIntelligence() {
    return ensureCompleteSalon({
      name: getFieldValue("name").trim() || salonName || "Salao",
      location: getFieldValue("location").trim(),
      city: getFieldValue("city").trim(),
      country: getFieldValue("country").trim(),
      language: (getFieldValue("language").trim() || "pt-BR") as Salon["language"],
      description: getFieldValue("description").trim(),
      instagramUrl: getFieldValue("instagramUrl").trim(),
      googleMapsUrl: getFieldValue("googleMapsUrl").trim(),
      websiteUrl: getFieldValue("websiteUrl").trim(),
      services: [],
      selectedServices: [],
      galleryImages: images,
      imageCandidates: candidates,
      imageSelectionSummary: selectionSummary,
      layoutImagePlan,
    });
  }

  async function importCandidates(
    source: "instagram" | "google" | "website" | "all",
    options?: { useTestCandidates?: boolean; browserMode?: boolean },
  ) {
    const sourceUrls = {
      instagram: getFieldValue("instagramUrl").trim(),
      google: getFieldValue("googleMapsUrl").trim(),
      website: getFieldValue("websiteUrl").trim(),
    };
    const requestedSources =
      source === "all"
        ? (["instagram", "google", "website"] as const)
            .filter((key) => sourceUrls[key])
            .map((key) => ({
              source: key,
              endpoint:
                options?.browserMode && key !== "website"
                  ? `browser-${key}-images`
                  : `${key}-images`,
            }))
        : sourceUrls[source]
          ? [
              {
                source,
                endpoint:
                  options?.browserMode && source !== "website"
                    ? `browser-${source}-images`
                    : `${source}-images`,
              },
            ]
          : [];

    if (!requestedSources.length) {
      setImportMessage(
        source === "instagram"
          ? "Preencha o link do Instagram antes de analisar."
          : source === "google"
            ? "Preencha o link do Google Maps antes de analisar."
            : source === "website"
              ? "Preencha o site do salao antes de analisar."
              : "Preencha Instagram, Google Maps ou site antes de analisar tudo.",
      );
      return;
    }

    setLoadingSource(source);
    setImportMessage(
      options?.browserMode
        ? source === "all"
          ? "Abrindo navegador local para analisar Instagram e Google. O site continua como apoio rapido quando houver link."
          : `Abrindo navegador local para analisar ${source}...`
        : source === "all"
          ? "Buscando imagens publicas em Instagram, Google e site..."
          : `Buscando imagens publicas em ${source}...`,
    );
    setCollectorDebug([]);

    const imported: SalonImageCandidate[] = [];
    const failures: string[] = [];
    let usedTestCandidates = false;

    try {
      for (const currentSource of requestedSources) {
        try {
          const response = await fetch(`/api/import/${currentSource.endpoint}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url: sourceUrls[currentSource.source],
              useTestCandidates: options?.useTestCandidates,
            }),
          });
          const payload = (await response.json()) as {
            success: boolean;
            source: "instagram" | "google" | "website";
            error?: string;
            errorType?:
              | "missing_url"
              | "invalid_url"
              | "blocked"
              | "no_images"
              | "internal";
            debug?: {
              notes?: string[];
              usedTestCandidates?: boolean;
              rawCandidates?: number;
              filteredCandidates?: number;
              stats?: Record<string, number>;
            };
            candidates?: SalonImageCandidate[];
            usedTestCandidates?: boolean;
          };

          const debugNotes = payload.debug?.notes ?? [];
          const stats = payload.debug?.stats;
          const statsSummary =
            stats && Object.keys(stats).length
              ? [
                  stats.rawCandidates != null ? `brutas=${stats.rawCandidates}` : null,
                  stats.filteredCandidates != null
                    ? `aceitas=${stats.filteredCandidates}`
                    : null,
                  stats.feedImages != null ? `feed=${stats.feedImages}` : null,
                  stats.postsOpened != null ? `posts=${stats.postsOpened}` : null,
                  stats.highlightIgnored != null
                    ? `highlights=${stats.highlightIgnored}`
                    : null,
                  stats.avatarIgnored != null ? `avatar=${stats.avatarIgnored}` : null,
                  stats.rejected != null ? `rejeitadas=${stats.rejected}` : null,
                ]
                  .filter(Boolean)
                  .join(", ")
              : "";

          if (isDevelopment && (debugNotes.length || statsSummary)) {
            setCollectorDebug((current) => [
              ...current,
              `${currentSource.source}${options?.browserMode && currentSource.source !== "website" ? " (navegador)" : " (rapido)"}: ${[
                ...debugNotes,
                statsSummary,
              ]
                .filter(Boolean)
                .join(" | ")}`,
            ]);
          }

          if (payload.usedTestCandidates) {
            usedTestCandidates = true;
          }

          if (!response.ok || !payload.success || !payload.candidates?.length) {
            failures.push(
              formatCollectorError(
                currentSource.source,
                payload.errorType,
                payload.error,
                payload.usedTestCandidates,
              ),
            );
            continue;
          }

          imported.push(...payload.candidates);
        } catch {
          failures.push(
            `Nao foi possivel buscar fotos automaticamente em ${currentSource.source}.`,
          );
        }
      }

      if (!imported.length) {
        setImportMessage(
          failures[0] ||
            "Nenhuma imagem util foi encontrada. Tente colar URLs manualmente, fazer upload ou usar candidatas de teste em desenvolvimento.",
        );
        return;
      }

      onCandidatesChange((current) =>
        analyzeImageCandidates(mergeImageCandidates(current, imported)),
      );
      onSelectionChange(undefined);
      onLayoutPlanChange(undefined);
      setImportMessage(
        `${imported.length} candidata(s) coletada(s). Revise score, sugestao e justificativas antes de aplicar.` +
          (usedTestCandidates
            ? " A fonte real bloqueou ou nao expôs imagens suficientes, entao o sistema carregou candidatas de teste explicitamente."
            : "") +
          (failures.length ? ` ${failures[0]}` : ""),
      );
    } finally {
      setLoadingSource(null);
    }
  }

  function updateCandidate(
    id: string,
    updates: Partial<SalonImageCandidate>,
  ) {
    onCandidatesChange((current) =>
      analyzeImageCandidates(
        current.map((candidate) =>
          candidate.id === id
            ? {
                ...candidate,
                ...updates,
              }
            : candidate,
        ),
      ),
    );
  }

  function applyCandidate(candidate: SalonImageCandidate, type: SalonImageType) {
    const imageId = `image-${candidate.id}`;
    const destination = imageTypeToDestination(type);
    const image: SalonGalleryImage = {
      id: imageId,
      url: candidate.imageUrl,
      src: candidate.imageUrl,
      alt:
        candidate.alt ||
        candidate.title ||
        `${salonName || "Salao"} - ${type === "logo" ? "logo" : "foto real"}`,
      type,
      source: candidate.source,
      sourceUrl: candidate.sourceUrl ?? candidate.pageUrl,
      originalPostUrl: candidate.originalPostUrl,
      isReal: true,
      selectedForLanding: true,
      createdAt: new Date().toISOString(),
    };

    onChange((current) => {
      const existingIndex = current.findIndex(
        (existing) => existing.src === image.src,
      );

      if (existingIndex >= 0) {
        const nextImages = [...current];
        nextImages[existingIndex] = {
          ...nextImages[existingIndex],
          ...image,
          id: nextImages[existingIndex].id,
        };
        return normalizeHeroImages(nextImages);
      }

      return normalizeHeroImages([...current, image]);
    });

    updateCandidate(candidate.id, {
      status: "applied",
      suggestedUse: destinationToSuggestedUse(destination),
    });
    onSelectionChange((current) => ({
      logoId: type === "logo" ? candidate.id : current?.logoId,
      heroId: type === "hero" ? candidate.id : current?.heroId,
      interiorIds:
        type === "interior"
          ? Array.from(new Set([...(current?.interiorIds ?? []), candidate.id]))
          : current?.interiorIds ?? [],
      resultIds:
        type === "result"
          ? Array.from(new Set([...(current?.resultIds ?? []), candidate.id]))
          : current?.resultIds ?? [],
      galleryIds:
        type === "gallery" || type === "service"
          ? Array.from(new Set([...(current?.galleryIds ?? []), candidate.id]))
          : current?.galleryIds ?? [],
      ignoredIds: current?.ignoredIds ?? [],
      selectedAt: current?.selectedAt ?? new Date().toISOString(),
      appliedAt: new Date().toISOString(),
    }));
    onLayoutPlanChange((current) => setImagePlanDestination(current, image.id, destination));
    setImportMessage("Imagem candidata aplicada na landing. Salve as alteracoes para gravar.");
  }

  function rejectCandidate(id: string) {
    updateCandidate(id, { status: "rejected" });
    onSelectionChange((current) => ({
      logoId: current?.logoId,
      heroId: current?.heroId,
      interiorIds: current?.interiorIds ?? [],
      resultIds: current?.resultIds ?? [],
      galleryIds: current?.galleryIds ?? [],
      ignoredIds: Array.from(new Set([...(current?.ignoredIds ?? []), id])),
      selectedAt: current?.selectedAt,
      appliedAt: current?.appliedAt,
    }));
  }

  function resetCandidate(id: string) {
    updateCandidate(id, { status: "new" });
    onSelectionChange((current) =>
      current
        ? {
            ...current,
            logoId: current.logoId === id ? undefined : current.logoId,
            heroId: current.heroId === id ? undefined : current.heroId,
            interiorIds: current.interiorIds.filter((item) => item !== id),
            resultIds: current.resultIds.filter((item) => item !== id),
            galleryIds: current.galleryIds.filter((item) => item !== id),
            ignoredIds: current.ignoredIds.filter((item) => item !== id),
          }
        : current,
    );
  }

  function generateLocalAutomaticPreview() {
    if (!candidates.length) {
      setImportMessage("Analise fontes publicas antes de gerar a previa local.");
      return;
    }

    const { analyzedCandidates, plan, selectionSummary: nextSelectionSummary } =
      createLocalImagePlan(candidates);

    onCandidatesChange(analyzedCandidates);
    onSelectionChange(nextSelectionSummary);
    onLayoutPlanChange(plan);
    setValidatedPlan(undefined);
    setChatGptValidationMessage("");
    setImportMessage(
      [
        "Previa local automatica gerada. Revise logo, destaque inicial, galeria e Nosso Espaco antes de aplicar.",
        ...plan.warnings,
      ].join(" "),
    );
  }

  function selectAutomatically() {
    if (!candidates.length) {
      setImportMessage("Analise fontes publicas antes de selecionar automaticamente.");
      return;
    }

    const { analyzedCandidates, plan, selectionSummary: nextSelectionSummary } =
      createLocalImagePlan(candidates);
    onCandidatesChange(analyzedCandidates);
    onSelectionChange(nextSelectionSummary);
    onLayoutPlanChange(plan);
    setImportMessage(
      [
        "Selecao automatica concluida. Revise os destinos simples antes de aplicar na landing.",
        ...plan.warnings,
      ].join(" "),
    );
  }

  function applyAutomaticSelection() {
    if (!candidates.length) {
      setImportMessage("Analise fontes publicas antes de aplicar uma selecao automatica.");
      return;
    }

    if (layoutImagePlan) {
      const appliedPlan = applyLayoutImagePlan({
        currentImages: images,
        candidates,
        plan: layoutImagePlan,
        salonName: salonName || "Salao",
      });

      onChange(appliedPlan.images);
      onCandidatesChange(appliedPlan.updatedCandidates);
      onSelectionChange(appliedPlan.selectionSummary);
      onLayoutPlanChange(appliedPlan.plan);
      setImportMessage(
        "Plano de imagens aplicado na landing. Logo, destaque inicial, galeria e Nosso Espaco foram atualizados.",
      );
      return;
    }

    const { analyzedCandidates, plan } = createLocalImagePlan(candidates);
    const applied = applyLayoutImagePlan({
      currentImages: images,
      candidates: analyzedCandidates,
      plan,
      salonName: salonName || "Salao",
    });

    onChange(applied.images);
    onCandidatesChange(applied.updatedCandidates);
    onSelectionChange(applied.selectionSummary);
    onLayoutPlanChange(applied.plan);
    setImportMessage("Selecao automatica aplicada. Salve as alteracoes para gravar.");
  }

  async function handleCopyPrompt() {
    if (!chatGptPrompt.trim()) {
      setImportMessage("Gere o prompt da curadoria antes de copiar.");
      return;
    }

    try {
      await navigator.clipboard.writeText(chatGptPrompt);
      setImportMessage("Prompt copiado. Cole no ChatGPT Plus e traga de volta apenas o JSON.");
    } catch {
      setImportMessage(
        "Nao foi possivel copiar automaticamente. Use o textarea para copiar manualmente.",
      );
    }
  }

  function handleExportPrompt() {
    if (!candidates.length) {
      setImportMessage("Colete imagens antes de exportar a curadoria para o ChatGPT.");
      return;
    }

    const draftSalon = buildDraftSalonForIntelligence();
    const analyzed = analyzeImageCandidates(candidates);
    const prompt = buildChatGptCurationPrompt(draftSalon, analyzed);

    onCandidatesChange(analyzed);
    setChatGptPrompt(prompt);
    setImportMessage(
      "Prompt gerado. Copie, cole no ChatGPT Plus e depois traga de volta apenas o JSON.",
    );
  }

  function handleValidateChatGptPlan() {
    const validation = validateChatGptCurationJson(chatGptJson, candidates);

    if (!validation.ok) {
      setValidatedPlan(undefined);
      setChatGptValidationMessage(validation.error);
      return;
    }

    setValidatedPlan(validation.plan);
    setChatGptValidationMessage(
      `Curadoria valida: destaque ${validation.summary.topCount}, galeria ${validation.summary.galleryCount}, Nosso Espaco ${validation.summary.spaceCount}, ignoradas ${validation.summary.ignoredCount}.`,
    );
  }

  function handleApplyChatGptPlan() {
    if (!validatedPlan) {
      setChatGptValidationMessage("Valide a curadoria antes de aplicar na landing.");
      return;
    }

    const analyzed = analyzeImageCandidates(candidates);
    const applied = applyLayoutImagePlan({
      currentImages: images,
      candidates: analyzed,
      plan: validatedPlan,
      salonName: salonName || "Salao",
    });

    onCandidatesChange(applied.updatedCandidates);
    onChange(applied.images);
    onSelectionChange(applied.selectionSummary);
    onLayoutPlanChange(applied.plan);
    setImportMessage(
      "Curadoria do ChatGPT aplicada na landing. Salve as alteracoes para gravar.",
    );
  }

  const hasSelectedCandidates = candidates.some(
    (candidate) => candidate.status === "selected" || candidate.status === "applied",
  ) || Boolean(layoutImagePlan);

  return (
    <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-950/5">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-100 text-zinc-950">
          <ImagePlus className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-2xl font-semibold text-zinc-950">
            Logo e fotos reais
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-500">
            Cole a URL da logo, da imagem principal e das fotos reais que devem
            entrar na landing.
          </p>
        </div>
      </div>

      <div className="mt-7 grid gap-5 lg:grid-cols-[1fr_0.86fr]">
        <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm font-semibold text-zinc-950">
            Adicionar logo ou imagem por URL
          </p>
          <div className="mt-4 grid gap-4">
            <TextInput
              label="URL da imagem"
              value={draft.url}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  url: value,
                }))
              }
            />
            <TextInput
              label="Descricao da imagem"
              value={draft.alt}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  alt: value,
                }))
              }
            />
            <div className="grid gap-4 md:grid-cols-2">
              <SelectInput
                label="Origem"
                value={draft.source}
                options={imageSourceOptions}
                onChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    source: value as SalonImageSource,
                  }))
                }
              />
              <SelectInput
                label="Uso"
                value={draft.type}
                options={imageTypeOptions}
                onChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    type: value as SalonImageType,
                  }))
                }
              />
            </div>
            <TextInput
              label="Link da fonte, se houver"
              value={draft.sourceUrl}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  sourceUrl: value,
                }))
              }
            />
            <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700">
              <input
                type="checkbox"
                checked={draft.selectedForLanding}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    selectedForLanding: event.currentTarget.checked,
                  }))
                }
                className="h-4 w-4 accent-teal-700"
              />
              Usar na landing
            </label>
            <button
              type="button"
              onClick={addImage}
              className="btn btn-primary px-5 py-3"
            >
              <ImagePlus className="h-4 w-4" />
              Adicionar imagem real
            </button>
            {message ? (
              <p className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-950">
                {message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm font-semibold text-zinc-950">
            Upload manual de arquivo
          </p>
          <p className="mt-2 text-xs leading-5 text-zinc-500">
            Uploads locais sao salvos apenas neste navegador. Para uso real em
            producao, sera necessario storage em nuvem.
          </p>
          <label className="mt-4 grid gap-2">
            <span className="text-sm font-semibold text-zinc-800">
              Arquivo local
            </span>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={(event) => void handleFileSelected(event)}
              disabled={uploadingFile}
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700 outline-none transition file:mr-3 file:rounded-full file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-zinc-800 hover:file:bg-zinc-200"
            />
          </label>
          <p className="mt-3 text-xs leading-5 text-zinc-500">
            Limite local: 2 MB. Use o campo de URL se quiser evitar base64 no
            armazenamento local.
          </p>

          <div className="my-5 h-px bg-zinc-200" />

          <p className="text-sm font-semibold text-zinc-950">
            Coletor automatico de imagens
          </p>
          <p className="mt-2 text-xs leading-5 text-zinc-500">
            Analise Instagram, Google Maps e site do salao para montar
            candidatas, ranquear automaticamente e sugerir onde cada foto deve
            entrar na landing.
          </p>
          {isDevelopment ? (
            <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Busca com navegador local
              </p>
              <p className="mt-2 text-xs leading-5 text-zinc-500">
                Modo principal para Instagram. Abre um navegador local, permite
                login manual se necessario e tenta coletar as imagens visiveis da
                pagina.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => void importCandidates("instagram", { browserMode: true })}
                  disabled={loadingSource !== null}
                  className="btn btn-primary justify-center px-4 py-3 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loadingSource === "instagram" ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Analisar Instagram com navegador
                </button>
                <button
                  type="button"
                  onClick={() => void importCandidates("google", { browserMode: true })}
                  disabled={loadingSource !== null}
                  className="btn btn-secondary justify-center px-4 py-3 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loadingSource === "google" ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Analisar Google com navegador
                </button>
                <button
                  type="button"
                  onClick={() => void importCandidates("all", { browserMode: true })}
                  disabled={loadingSource !== null}
                  className="btn btn-secondary justify-center px-4 py-3 disabled:cursor-not-allowed disabled:opacity-70 sm:col-span-2"
                >
                  {loadingSource === "all" ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Analisar tudo com navegador
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-950">
              Coleta Instagram com navegador local disponivel apenas em
              desenvolvimento/local. Em producao, mantenha o fluxo manual por
              URL ou importe as imagens antes do deploy.
            </div>
          )}

          <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Busca rapida
            </p>
            <p className="mt-2 text-xs leading-5 text-zinc-500">
              Fallback por HTML publico. Mais leve, mas menos confiavel para
              Instagram e Google.
            </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => void importCandidates("instagram")}
              disabled={loadingSource !== null}
              className="btn btn-secondary justify-center px-4 py-3 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loadingSource === "instagram" ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Busca rapida no Instagram
            </button>
            <button
              type="button"
              onClick={() => void importCandidates("google")}
              disabled={loadingSource !== null}
              className="btn btn-secondary justify-center px-4 py-3 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loadingSource === "google" ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Busca rapida no Google
            </button>
            <button
              type="button"
              onClick={() => void importCandidates("all")}
              disabled={loadingSource !== null}
              className="btn btn-primary justify-center px-4 py-3 disabled:cursor-not-allowed disabled:opacity-70 sm:col-span-2"
            >
              {loadingSource === "all" ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Busca rapida em tudo
            </button>
            {isDevelopment ? (
              <button
                type="button"
                onClick={() => void importCandidates("all", { useTestCandidates: true })}
                disabled={loadingSource !== null}
                className="btn min-h-11 justify-center border-dashed border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
              >
                <Sparkles className="h-4 w-4" />
                Usar candidatas de teste
              </button>
            ) : null}
          </div>
          </div>
          <p className="mt-4 text-xs leading-5 text-zinc-500">
            O fluxo manual por URL e upload continua disponivel quando a coleta
            automatica nao encontrar fotos boas o suficiente.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={generateLocalAutomaticPreview}
              disabled={!candidates.length}
              className="btn btn-secondary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4" />
              Gerar previa local automatica
            </button>
            <button
              type="button"
              onClick={selectAutomatically}
              disabled={!candidates.length}
              className="btn btn-secondary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4" />
              Selecionar melhores automaticamente
            </button>
            <button
              type="button"
              onClick={applyAutomaticSelection}
              disabled={!hasSelectedCandidates}
              className="btn btn-primary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" />
              Aplicar selecao automatica na landing
            </button>
          </div>
          <p className="mt-4 text-xs leading-5 text-zinc-500">
            Logo nunca vira hero nem entra na galeria. Se a coleta nao trouxer
            fotos com contexto comercial suficiente, o sistema prefere nao
            aplicar automaticamente.
          </p>
          <p className="mt-2 text-xs leading-5 text-zinc-500">
            Este fluxo nao usa API paga. A analise do ChatGPT e manual: copie o
            prompt, cole no ChatGPT Plus e depois cole o JSON de volta.
          </p>
          {importMessage ? (
            <p className="mt-4 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700">
              {importMessage}
            </p>
          ) : null}
          <div className="mt-4 rounded-2xl border border-zinc-200 bg-white px-4 py-3">
            <label className="flex items-center gap-3 text-sm font-semibold text-zinc-800">
              <input
                type="checkbox"
                checked={Boolean(layoutImagePlan?.spaceEnabled)}
                onChange={(event) =>
                  updateSpaceSettings({
                    spaceEnabled: event.currentTarget.checked,
                  })
                }
                className="h-4 w-4 accent-teal-700"
              />
              Mostrar seção Nosso Espaço
            </label>
            <div className="mt-3 grid gap-3">
              <TextInput
                label="Título da seção"
                value={layoutImagePlan?.spaceTitle ?? "Nosso Espaço"}
                onChange={(value) =>
                  updateSpaceSettings({
                    spaceTitle: value,
                  })
                }
              />
              <TextInput
                label="Descrição curta"
                value={
                  layoutImagePlan?.spaceDescription ??
                  "Conheça um pouco do ambiente e dos detalhes do salão."
                }
                onChange={(value) =>
                  updateSpaceSettings({
                    spaceDescription: value,
                  })
                }
              />
            </div>
          </div>
          {layoutImagePlan ? (
            <div className="mt-4 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-xs leading-5 text-zinc-600">
              <p className="font-semibold text-zinc-900">
                Resumo da curadoria atual ({layoutImagePlan.mode === "chatgpt_manual" ? "ChatGPT manual" : "local automatico"})
              </p>
              <ul className="mt-2 grid gap-1">
                <li>Logo: {layoutImagePlan.logoImageId || "nao definida"}</li>
                <li>Destaque inicial: {(layoutImagePlan.topImageIds ?? []).length}</li>
                <li>Galeria: {layoutImagePlan.galleryImageIds.length}</li>
                <li>Nosso Espaco: {layoutImagePlan.spaceEnabled ? (layoutImagePlan.spaceImageIds ?? []).length : 0}</li>
                <li>Ignoradas: {layoutImagePlan.ignoredImageIds.length}</li>
              </ul>
              {layoutImagePlan.summary ? (
                <p className="mt-3 text-zinc-700">{layoutImagePlan.summary}</p>
              ) : null}
              {layoutImagePlan.warnings.length ? (
                <ul className="mt-3 grid gap-1 text-amber-800">
                  {layoutImagePlan.warnings.map((warning) => (
                    <li key={warning}>- {warning}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
          {isDevelopment && collectorDebug.length ? (
            <div className="mt-4 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-xs leading-5 text-zinc-500">
              <p className="font-semibold text-zinc-800">Debug da coleta</p>
              <ul className="mt-2 grid gap-1">
                {collectorDebug.map((line) => (
                  <li key={line}>• {line}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      {candidates.length ? (
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm font-semibold text-zinc-950">
              Exportar curadoria para ChatGPT
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Gere um prompt copiavel com IDs, URLs, score local e contexto das imagens coletadas.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExportPrompt}
                className="btn btn-secondary px-4 py-2 text-sm"
              >
                <FileText className="h-4 w-4" />
                Exportar curadoria para ChatGPT
              </button>
              <button
                type="button"
                onClick={() => void handleCopyPrompt()}
                disabled={!chatGptPrompt.trim()}
                className="btn btn-primary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Clipboard className="h-4 w-4" />
                Copiar prompt para ChatGPT
              </button>
            </div>
            <label className="mt-4 grid gap-2">
              <span className="text-sm font-semibold text-zinc-800">
                Prompt gerado
              </span>
              <textarea
                value={chatGptPrompt}
                onChange={(event) => setChatGptPrompt(event.currentTarget.value)}
                rows={16}
                className="min-h-[18rem] rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-xs leading-6 text-zinc-700 outline-none transition focus:border-teal-500"
              />
            </label>
          </div>

          <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm font-semibold text-zinc-950">
              Aplicar curadoria do ChatGPT
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Cole o JSON devolvido pelo ChatGPT, valide os IDs e depois aplique o plano na landing.
            </p>
            <label className="mt-4 grid gap-2">
              <span className="text-sm font-semibold text-zinc-800">
                JSON da curadoria
              </span>
              <textarea
                value={chatGptJson}
                onChange={(event) => setChatGptJson(event.currentTarget.value)}
                rows={16}
                className="min-h-[18rem] rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-xs leading-6 text-zinc-700 outline-none transition focus:border-teal-500"
              />
            </label>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleValidateChatGptPlan}
                className="btn btn-secondary px-4 py-2 text-sm"
              >
                Validar curadoria
              </button>
              <button
                type="button"
                onClick={handleApplyChatGptPlan}
                disabled={!validatedPlan}
                className="btn btn-primary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CheckCircle2 className="h-4 w-4" />
                Aplicar na landing
              </button>
            </div>
            {chatGptValidationMessage ? (
              <p className="mt-4 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700">
                {chatGptValidationMessage}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {candidates.length ? (
        <div className="mt-6 rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-zinc-950">
                Imagens candidatas para revisao
              </p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">
                Score, confianca e justificativas ajudam a decidir o melhor uso
                de cada imagem antes de aplicar na landing.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-600 ring-1 ring-zinc-200">
                {candidates.length} candidata(s)
              </span>
              {selectionSummary?.heroId ? (
                <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-900 ring-1 ring-teal-100">
                  Destaque inicial sugerido
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {candidates.map((candidate) => (
              <article
                key={candidate.id}
                className="grid gap-4 rounded-[1.5rem] border border-zinc-200 bg-white p-4 sm:grid-cols-[9rem_1fr]"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-zinc-200">
                  <Image
                    src={candidate.imageUrl}
                    alt={candidate.alt || candidate.title || "Imagem candidata"}
                    fill
                    sizes="9rem"
                    className="object-cover"
                  />
                </div>
                <div className="grid gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-zinc-950">
                        {getCandidateSourceLabel(candidate.source)}
                      </p>
                      <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-700">
                        Score {candidate.score}
                      </span>
                      <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-700">
                        {getConfidenceLabel(candidate.confidence)}
                      </span>
                      <span className={getCandidateStatusClassName(candidate.status)}>
                        {getCandidateStatusLabel(candidate.status)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-zinc-500">
                      Sugestao atual:{" "}
                      <span className="font-semibold text-zinc-700">
                        {getSuggestedUseLabel(suggestedUseToDestination(candidate.suggestedUse))}
                      </span>
                    </p>
                    {candidate.collectorOrigin ? (
                      <p className="mt-1 text-[11px] leading-5 text-zinc-400">
                        Origem: {getCollectorOriginLabel(candidate.collectorOrigin)}
                      </p>
                    ) : null}
                    {candidate.width && candidate.height ? (
                      <p className="mt-1 text-[11px] leading-5 text-zinc-400">
                        {candidate.width} x {candidate.height}
                      </p>
                    ) : null}
                  </div>

                  <SelectInput
                    label="Destino na landing"
                    value={suggestedUseToDestination(candidate.suggestedUse)}
                    options={candidateSuggestedUseOptions}
                    onChange={(value) =>
                      updateCandidate(candidate.id, {
                        suggestedUse: destinationToSuggestedUse(value as ImageDestination),
                        status: value === "ignore" ? "rejected" : "selected",
                      })
                    }
                  />

                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-xs leading-5 text-zinc-600">
                    <p className="font-semibold text-zinc-800">Justificativas</p>
                    <ul className="mt-2 grid gap-1">
                      {candidate.reasons.map((reason) => (
                        <li key={reason}>• {reason}</li>
                      ))}
                    </ul>
                    {candidate.warnings?.length ? (
                      <ul className="mt-3 grid gap-1 text-amber-800">
                        {candidate.warnings.map((warning) => (
                          <li key={warning}>! {warning}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        applyCandidate(
                          candidate,
                          mapSuggestedUseToImageType(
                            candidate.suggestedUse,
                            candidate.id,
                            selectionSummary,
                          ),
                        )
                      }
                      className="btn btn-primary min-h-10 px-3 py-2 text-xs"
                    >
                      Aplicar agora
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateCandidate(candidate.id, { status: "selected" })
                      }
                      className="btn btn-secondary min-h-10 px-3 py-2 text-xs"
                    >
                      Selecionar
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        applyCandidate(candidate, "hero")
                      }
                      className="btn btn-secondary min-h-10 px-3 py-2 text-xs"
                    >
                      Destaque inicial
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        applyCandidate(candidate, "gallery")
                      }
                      className="btn btn-secondary min-h-10 px-3 py-2 text-xs"
                    >
                      Usar na galeria
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        applyCandidate(candidate, "interior")
                      }
                      className="btn btn-secondary min-h-10 px-3 py-2 text-xs"
                    >
                      Nosso Espaço
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        applyCandidate(candidate, "logo")
                      }
                      className="btn btn-secondary min-h-10 px-3 py-2 text-xs"
                    >
                      Logo
                    </button>
                    <button
                      type="button"
                      onClick={() => rejectCandidate(candidate.id)}
                      className="btn btn-secondary min-h-10 px-3 py-2 text-xs"
                    >
                      Rejeitar
                    </button>
                    {candidate.status !== "new" ? (
                      <button
                        type="button"
                        onClick={() => resetCandidate(candidate.id)}
                        className="btn min-h-10 border-zinc-200 bg-zinc-100 px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-200"
                      >
                        Resetar
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-950">
              Imagens reais cadastradas
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Escolha se cada imagem vai para logo, destaque inicial, galeria,
              Nosso Espaco ou fica fora da landing.
            </p>
          </div>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600">
            {images.length} imagem(ns)
          </span>
        </div>

        {images.length ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {images.map((image) => (
              <article
                key={image.id}
                className="grid gap-4 rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4 sm:grid-cols-[9rem_1fr]"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-zinc-200">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="9rem"
                    className="object-cover"
                  />
                  {image.type === "hero" ? (
                    <span className="absolute left-2 top-2 rounded-full bg-zinc-950/80 px-2 py-1 text-[11px] font-semibold text-white">
                      Principal
                    </span>
                  ) : null}
                </div>
                <div className="grid gap-3">
                  {(() => {
                    const destination = getImageDestination(image, layoutImagePlan);
                    const canOrder =
                      destination === "top" ||
                      destination === "gallery" ||
                      destination === "space";

                    return (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200">
                          {getDestinationLabel(destination)}
                        </span>
                        {canOrder ? (
                          <>
                            <button
                              type="button"
                              onClick={() => moveImageInPlan(image.id, -1)}
                              className="btn btn-secondary min-h-8 px-2.5 py-1.5 text-xs"
                              aria-label="Mover imagem para cima"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveImageInPlan(image.id, 1)}
                              className="btn btn-secondary min-h-8 px-2.5 py-1.5 text-xs"
                              aria-label="Mover imagem para baixo"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : null}
                      </div>
                    );
                  })()}
                  <TextInput
                    label="Descricao"
                    value={image.alt}
                    onChange={(value) => updateImage(image.id, { alt: value })}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <SelectInput
                      label="Destino"
                      value={getImageDestination(image, layoutImagePlan)}
                      options={imageDestinationOptions}
                      onChange={(value) =>
                        setImageDestination(image.id, value as ImageDestination)
                      }
                    />
                    <SelectInput
                      label="Origem"
                      value={image.source}
                      options={imageSourceOptions}
                      onChange={(value) =>
                        updateImage(image.id, { source: value as SalonImageSource })
                      }
                    />
                  </div>
                  <label className="flex items-center gap-3 text-sm font-semibold text-zinc-700">
                    <input
                      type="checkbox"
                      checked={image.selectedForLanding}
                      onChange={(event) =>
                        updateImage(image.id, {
                          selectedForLanding: event.currentTarget.checked,
                        })
                      }
                      className="h-4 w-4 accent-teal-700"
                    />
                    Usar na landing
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {image.type !== "logo" ? (
                      <button
                        type="button"
                        onClick={() => setHeroImage(image.id)}
                        className="btn btn-secondary min-h-10 px-3 py-2 text-xs"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Mandar para destaque
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => removeImage(image.id)}
                      className="btn min-h-10 border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-950 hover:bg-rose-100"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remover
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-[1.5rem] border border-dashed border-zinc-300 bg-zinc-50 p-5 text-sm leading-6 text-zinc-500">
            Nenhuma foto real adicionada ainda.
          </div>
        )}
      </div>
    </section>
  );
}

function RealReviewsSection({
  reviews,
  onChange,
}: {
  reviews: SalonTestimonial[];
  onChange: Dispatch<SetStateAction<SalonTestimonial[]>>;
}) {
  const [draft, setDraft] = useState(defaultReviewDraft);
  const [message, setMessage] = useState("");

  function addReview() {
    if (!draft.authorName.trim() || !draft.text.trim()) {
      setMessage("Informe nome do cliente e texto da avaliacao.");
      return;
    }

    const review: SalonTestimonial = {
      id: createLocalId("review"),
      authorName: draft.authorName.trim(),
      rating: Number(draft.rating) || 5,
      text: draft.text.trim(),
      source: draft.source,
      sourceUrl: draft.sourceUrl.trim() || undefined,
      reviewDate: draft.reviewDate || undefined,
      isReal: true,
      selectedForLanding: draft.selectedForLanding,
      quote: draft.text.trim(),
      name: draft.authorName.trim(),
      role: draft.source === "google" ? "Google" : "Review manual",
    };

    onChange((current) => [...current, review]);
    setDraft(defaultReviewDraft);
    setMessage("Review real adicionado. Salve as alteracoes para gravar.");
  }

  function updateReview(id: string, updates: Partial<SalonTestimonial>) {
    onChange((current) =>
      current.map((review) =>
        review.id === id
          ? {
              ...review,
              ...updates,
              quote: updates.text ?? review.text,
              name: updates.authorName ?? review.authorName,
            }
          : review,
      ),
    );
  }

  function removeReview(id: string) {
    onChange((current) => current.filter((review) => review.id !== id));
  }

  return (
    <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-950/5">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-zinc-950">
          <Star className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-2xl font-semibold text-zinc-950">
            Reviews reais
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-500">
            Cadastre avaliacoes reais que podem aparecer na landing publica.
          </p>
        </div>
      </div>

      <div className="mt-7 rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Nome do cliente"
            value={draft.authorName}
            onChange={(value) =>
              setDraft((current) => ({
                ...current,
                authorName: value,
              }))
            }
          />
          <SelectInput
            label="Nota"
            value={String(draft.rating)}
            options={[5, 4, 3, 2, 1].map((rating) => ({
              value: String(rating),
              label: `${rating} estrelas`,
            }))}
            onChange={(value) =>
              setDraft((current) => ({
                ...current,
                rating: Number(value),
              }))
            }
          />
          <div className="md:col-span-2">
            <TextAreaInput
              label="Texto da avaliacao"
              value={draft.text}
              rows={3}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  text: value,
                }))
              }
            />
          </div>
          <TextInput
            label="Data, opcional"
            type="date"
            value={draft.reviewDate}
            onChange={(value) =>
              setDraft((current) => ({
                ...current,
                reviewDate: value,
              }))
            }
          />
          <SelectInput
            label="Origem"
            value={draft.source}
            options={reviewSourceOptions}
            onChange={(value) =>
              setDraft((current) => ({
                ...current,
                source: value as SalonReviewSource,
              }))
            }
          />
          <div className="md:col-span-2">
            <TextInput
              label="Link da avaliacao, opcional"
              value={draft.sourceUrl}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  sourceUrl: value,
                }))
              }
            />
          </div>
          <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700">
            <input
              type="checkbox"
              checked={draft.selectedForLanding}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  selectedForLanding: event.currentTarget.checked,
                }))
              }
              className="h-4 w-4 accent-teal-700"
            />
            Mostrar na landing
          </label>
          <button
            type="button"
            onClick={addReview}
            className="btn btn-primary px-5 py-3"
          >
            <Star className="h-4 w-4" />
            Adicionar review real
          </button>
        </div>

        {message ? (
          <p className="mt-4 rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-950">
            {message}
          </p>
        ) : null}
      </div>

      <div className="mt-6 grid gap-3">
        {reviews.length ? (
          reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4"
            >
              <div className="grid gap-3 md:grid-cols-[1fr_8rem_9rem_10rem]">
                <input
                  value={review.authorName}
                  onChange={(event) =>
                    updateReview(review.id, {
                      authorName: event.currentTarget.value,
                    })
                  }
                  className="rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-teal-700"
                />
                <SelectInput
                  label=""
                  value={String(review.rating ?? 5)}
                  options={[5, 4, 3, 2, 1].map((rating) => ({
                    value: String(rating),
                    label: `${rating} estrelas`,
                  }))}
                  onChange={(value) =>
                    updateReview(review.id, {
                      rating: Number(value),
                    })
                  }
                />
                <SelectInput
                  label=""
                  value={review.source}
                  options={reviewSourceOptions}
                  onChange={(value) =>
                    updateReview(review.id, {
                      source: value as SalonReviewSource,
                    })
                  }
                />
                <input
                  type="date"
                  value={review.reviewDate ?? ""}
                  onChange={(event) =>
                    updateReview(review.id, {
                      reviewDate: event.currentTarget.value || undefined,
                    })
                  }
                  className="rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-teal-700"
                />
              </div>
              <textarea
                rows={3}
                value={review.text}
                onChange={(event) =>
                  updateReview(review.id, { text: event.currentTarget.value })
                }
                className="mt-3 w-full resize-none rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm leading-6 text-zinc-950 outline-none transition focus:border-teal-700"
              />
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-3 text-sm font-semibold text-zinc-700">
                  <input
                    type="checkbox"
                    checked={review.selectedForLanding}
                    onChange={(event) =>
                      updateReview(review.id, {
                        selectedForLanding: event.currentTarget.checked,
                      })
                    }
                    className="h-4 w-4 accent-teal-700"
                  />
                  Mostrar na landing
                </label>
                <button
                  type="button"
                  onClick={() => removeReview(review.id)}
                  className="btn min-h-10 border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-950 hover:bg-rose-100"
                >
                  <Trash2 className="h-4 w-4" />
                  Remover review
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-zinc-300 bg-zinc-50 p-5 text-sm leading-6 text-zinc-500">
            Nenhum review real adicionado ainda.
          </div>
        )}
      </div>
    </section>
  );
}

function AdvancedSection({
  initialSalon,
  selectedVibe,
}: {
  initialSalon?: Salon;
  selectedVibe: string;
}) {
  return (
    <details className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-950/5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-950">
            <FileText className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-2xl font-semibold text-zinc-950">Avancado</h2>
            <p className="mt-1 text-sm leading-6 text-zinc-500">
              Tom da marca, estilo visual, automacao futura e notas internas.
            </p>
          </div>
        </div>
        <ChevronDown className="h-5 w-5 text-zinc-400" />
      </summary>

      <div className="mt-7 grid gap-6">
        <div>
          <p className="text-sm font-semibold text-zinc-800">Estilo visual</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-4">
            {vibeOptions.map((vibe) => (
              <label
                key={vibe}
                className="flex cursor-pointer items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 px-4 py-3 text-center text-sm font-semibold text-zinc-700 transition has-[:checked]:border-zinc-950 has-[:checked]:bg-zinc-950 has-[:checked]:text-white"
              >
                <input
                  type="radio"
                  name="visualStyle"
                  value={vibe}
                  defaultChecked={selectedVibe === vibe}
                  className="sr-only"
                />
                {vibe}
              </label>
            ))}
          </div>
        </div>

        <InputField
          name="brandTone"
          label="Tom da marca"
          defaultValue={initialSalon?.brandTone}
          placeholder="Opcional"
        />

        <ExtractedProfileSection initialSalon={initialSalon} />

        <section className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm font-semibold text-zinc-950">Automacao futura</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Controles visuais para integracoes futuras. Nenhuma busca real e
            executada nesta etapa.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              "Analisar Instagram",
              "Analisar Google",
              "Sugerir reviews",
              "Sugerir fotos",
              "Gerar texto da landing",
            ].map((action) => (
              <span
                key={action}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm"
              >
                <Sparkles className="h-3.5 w-3.5 text-teal-700" />
                {action}
                <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                  Em breve
                </span>
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm font-semibold text-zinc-950">
            Dados do Outscraper e observacoes internas
          </p>
          <textarea
            name="notes"
            rows={4}
            defaultValue={initialSalon?.notes ?? ""}
            placeholder="Cole aqui observacoes, categoria do Google, contexto comercial e pontos uteis para abordagem."
            className="mt-4 w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm leading-6 text-zinc-950 outline-none transition focus:border-teal-700 focus:bg-white"
          />
        </section>
      </div>
    </details>
  );
}

function ExtractedProfileSection({ initialSalon }: { initialSalon?: Salon }) {
  const info = initialSalon?.extractedBusinessInfo;

  return (
    <section className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-teal-800 ring-1 ring-zinc-200">
          <FileText className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-lg font-semibold text-zinc-950">
            Informacoes complementares
          </h3>
          <p className="mt-1 text-sm leading-6 text-zinc-500">
            Use este bloco apenas quando precisar guardar contexto interno ou
            detalhes adicionais do perfil.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <InputField
          name="businessHours"
          label="Horario de funcionamento"
          defaultValue={info?.businessHours ?? initialSalon?.businessHours}
          placeholder="Ex.: terca a sabado, com hora marcada"
        />
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-zinc-800">
            Diferenciais do salao
          </span>
          <textarea
            name="differentiators"
            rows={3}
            defaultValue={info?.differentiators ?? ""}
            placeholder="Ex.: atendimento rapido, ambiente confortavel, especialidade em noivas"
            className="resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm leading-6 text-zinc-950 outline-none transition focus:border-teal-700 focus:bg-white"
          />
        </label>
        <label className="grid gap-2 md:col-span-2">
          <span className="text-sm font-semibold text-zinc-800">
            Observacoes sobre o estilo visual
          </span>
          <textarea
            name="visualNotes"
            rows={3}
            defaultValue={info?.visualNotes ?? ""}
            placeholder="Ex.: feed colorido, foco em resultados, ambiente moderno"
            className="resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm leading-6 text-zinc-950 outline-none transition focus:border-teal-700 focus:bg-white"
          />
        </label>
        <label className="grid gap-2 md:col-span-2">
          <span className="text-sm font-semibold text-zinc-800">
            Notas tecnicas internas
          </span>
          <textarea
            name="manualAssistantNotes"
            rows={3}
            defaultValue={initialSalon?.manualAssistantNotes ?? ""}
            placeholder="Anote decisoes de curadoria e pontos para revisar antes de publicar."
            className="resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm leading-6 text-zinc-950 outline-none transition focus:border-teal-700 focus:bg-white"
          />
        </label>
      </div>
    </section>
  );
}

function InputField({
  name,
  label,
  defaultValue,
  placeholder = "",
  type = "text",
}: {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-zinc-800">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-teal-700 focus:bg-white"
      />
    </label>
  );
}

function TextInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="grid gap-2">
      {label ? <span className="text-sm font-semibold text-zinc-800">{label}</span> : null}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-teal-700"
      />
    </label>
  );
}

function TextAreaInput({
  label,
  value,
  rows,
  onChange,
}: {
  label: string;
  value: string;
  rows: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-zinc-800">{label}</span>
      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        className="resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm leading-6 text-zinc-950 outline-none transition focus:border-teal-700"
      />
    </label>
  );
}

function SelectInput({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      {label ? <span className="text-sm font-semibold text-zinc-800">{label}</span> : null}
      <select
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-teal-700"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function getInitialRealImages(salon?: Salon) {
  return (salon?.galleryImages ?? salon?.gallery ?? []).filter((image) => image.isReal);
}

function getInitialRealReviews(salon?: Salon) {
  return (salon?.testimonials ?? []).filter((review) => review.isReal);
}

function normalizeHeroImages(images: SalonGalleryImage[]) {
  let hasHeroImage = false;

  return images.map((image) => {
    if (image.type !== "hero") {
      return image;
    }

    if (hasHeroImage) {
      return {
        ...image,
        type: "gallery" as SalonImageType,
      };
    }

    hasHeroImage = true;

    return image;
  });
}

function mergePresetImages(
  currentImages: SalonGalleryImage[],
  presetImages: SalonGalleryImage[],
) {
  const merged = [...currentImages];

  for (const presetImage of presetImages) {
    if (merged.some((image) => image.src === presetImage.src)) {
      continue;
    }

    merged.push(presetImage);
  }

  return normalizeHeroImages(merged);
}

function mergePresetReviews(
  currentReviews: SalonTestimonial[],
  presetReviews: SalonTestimonial[],
) {
  const merged = [...currentReviews];

  for (const presetReview of presetReviews) {
    if (
      merged.some(
        (review) =>
          review.authorName === presetReview.authorName &&
          review.text === presetReview.text,
      )
    ) {
      continue;
    }

    merged.push(presetReview);
  }

  return merged;
}

function buildSourceMaterials(
  images: SalonGalleryImage[],
  reviews: SalonTestimonial[],
): SalonSourceMaterial[] {
  return [
    ...images.map((image) => ({
      id: `material-${image.id}`,
      title: image.alt || "Imagem real",
      type: "image" as const,
      source: image.source,
      sourceUrl: image.sourceUrl || image.url,
      notes: getImageTypeLabel(image.type),
      createdAt: image.createdAt || new Date().toISOString(),
    })),
    ...reviews.map((review) => ({
      id: `material-${review.id}`,
      title: review.authorName || "Review real",
      type: "review" as const,
      source: review.source,
      sourceUrl: review.sourceUrl,
      notes: review.text,
      createdAt: review.reviewDate || new Date().toISOString(),
    })),
  ];
}

function createSimpleImagePlan(plan?: SalonLayoutImagePlan): SalonLayoutImagePlan {
  const topImageIds = getPlanTopImageIds(plan);
  const spaceImageIds = getPlanSpaceImageIds(plan);

  return {
    mode: plan?.mode ?? "local_auto",
    logoImageId: plan?.logoImageId ?? null,
    topImageIds,
    heroImageId: topImageIds.length === 1 ? topImageIds[0] : null,
    heroMosaicImageIds: topImageIds.length > 1 ? topImageIds.slice(0, 3) : [],
    galleryImageIds: uniqueIds(plan?.galleryImageIds ?? []),
    spaceEnabled: Boolean(plan?.spaceEnabled),
    spaceTitle: plan?.spaceTitle || "Nosso Espaço",
    spaceDescription:
      plan?.spaceDescription ||
      "Conheça um pouco do ambiente e dos detalhes do salão.",
    spaceImageIds,
    experienceImageIds: spaceImageIds,
    resultImageIds: [],
    ignoredImageIds: uniqueIds(plan?.ignoredImageIds ?? []),
    summary: plan?.summary,
    warnings: plan?.warnings ?? [],
    generatedAt: plan?.generatedAt,
    appliedAt: plan?.appliedAt,
    updatedAt: new Date().toISOString(),
  };
}

function setImagePlanDestination(
  currentPlan: SalonLayoutImagePlan | undefined,
  imageId: string,
  destination: ImageDestination,
) {
  const plan = removeImageFromPlan(currentPlan, imageId) ?? createSimpleImagePlan();

  if (destination === "logo") {
    return syncLegacyImagePlan({
      ...plan,
      logoImageId: imageId,
    });
  }

  if (destination === "top") {
    return syncLegacyImagePlan({
      ...plan,
      topImageIds: [...(plan.topImageIds ?? []), imageId],
    });
  }

  if (destination === "gallery") {
    return syncLegacyImagePlan({
      ...plan,
      galleryImageIds: [...plan.galleryImageIds, imageId],
    });
  }

  if (destination === "space") {
    return syncLegacyImagePlan({
      ...plan,
      spaceEnabled: true,
      spaceImageIds: [...(plan.spaceImageIds ?? []), imageId],
    });
  }

  return syncLegacyImagePlan({
    ...plan,
    ignoredImageIds: [...plan.ignoredImageIds, imageId],
  });
}

function removeImageFromPlan(
  currentPlan: SalonLayoutImagePlan | undefined,
  imageId: string,
) {
  if (!currentPlan) {
    return undefined;
  }

  const plan = createSimpleImagePlan(currentPlan);

  return syncLegacyImagePlan({
    ...plan,
    logoImageId: imageMatchesPlanId(imageId, plan.logoImageId ?? "")
      ? null
      : plan.logoImageId,
    topImageIds: removeMatchingImageId(plan.topImageIds ?? [], imageId),
    galleryImageIds: removeMatchingImageId(plan.galleryImageIds, imageId),
    spaceImageIds: removeMatchingImageId(plan.spaceImageIds ?? [], imageId),
    ignoredImageIds: removeMatchingImageId(plan.ignoredImageIds, imageId),
  });
}

function moveImageWithinPlan(
  currentPlan: SalonLayoutImagePlan | undefined,
  imageId: string,
  direction: -1 | 1,
) {
  if (!currentPlan) {
    return currentPlan;
  }

  const plan = createSimpleImagePlan(currentPlan);

  return syncLegacyImagePlan({
    ...plan,
    topImageIds: moveInMatchingList(plan.topImageIds ?? [], imageId, direction),
    galleryImageIds: moveInMatchingList(plan.galleryImageIds, imageId, direction),
    spaceImageIds: moveInMatchingList(plan.spaceImageIds ?? [], imageId, direction),
  });
}

function updatePlanSpaceSettings(
  currentPlan: SalonLayoutImagePlan | undefined,
  updates: Partial<Pick<
    SalonLayoutImagePlan,
    "spaceEnabled" | "spaceTitle" | "spaceDescription"
  >>,
) {
  return syncLegacyImagePlan({
    ...createSimpleImagePlan(currentPlan),
    ...updates,
  });
}

function syncLegacyImagePlan(plan: SalonLayoutImagePlan): SalonLayoutImagePlan {
  const topImageIds = uniqueIds(plan.topImageIds ?? []);
  const galleryImageIds = uniqueIds(plan.galleryImageIds).filter(
    (id) => !containsMatchingImageId(topImageIds, id),
  );
  const spaceImageIds = uniqueIds(plan.spaceImageIds ?? []).filter(
    (id) =>
      !containsMatchingImageId(topImageIds, id) &&
      !containsMatchingImageId(galleryImageIds, id),
  );
  const ignoredImageIds = uniqueIds(plan.ignoredImageIds).filter(
    (id) =>
      !containsMatchingImageId(topImageIds, id) &&
      !containsMatchingImageId(galleryImageIds, id) &&
      !containsMatchingImageId(spaceImageIds, id) &&
      !imageMatchesPlanId(id, plan.logoImageId ?? ""),
  );

  return {
    ...plan,
    topImageIds,
    heroImageId: topImageIds.length === 1 ? topImageIds[0] : null,
    heroMosaicImageIds: topImageIds.length > 1 ? topImageIds.slice(0, 3) : [],
    galleryImageIds,
    spaceImageIds,
    experienceImageIds: spaceImageIds,
    resultImageIds: [],
    ignoredImageIds,
    updatedAt: new Date().toISOString(),
  };
}

function getImageDestination(
  image: SalonGalleryImage,
  plan?: SalonLayoutImagePlan,
): ImageDestination {
  if (!image.selectedForLanding) {
    return "ignore";
  }

  const simplePlan = plan ? createSimpleImagePlan(plan) : undefined;

  if (simplePlan?.logoImageId && imageMatchesPlanId(image.id, simplePlan.logoImageId)) {
    return "logo";
  }

  if (containsMatchingImageId(simplePlan?.topImageIds ?? [], image.id)) {
    return "top";
  }

  if (containsMatchingImageId(simplePlan?.galleryImageIds ?? [], image.id)) {
    return "gallery";
  }

  if (containsMatchingImageId(simplePlan?.spaceImageIds ?? [], image.id)) {
    return "space";
  }

  if (containsMatchingImageId(simplePlan?.ignoredImageIds ?? [], image.id)) {
    return "ignore";
  }

  return imageTypeToDestination(image.type);
}

function imageDestinationToType(destination: ImageDestination): SalonImageType {
  switch (destination) {
    case "logo":
      return "logo";
    case "top":
      return "hero";
    case "space":
      return "interior";
    default:
      return "gallery";
  }
}

function imageTypeToDestination(type: SalonImageType): ImageDestination {
  switch (type) {
    case "logo":
      return "logo";
    case "hero":
      return "top";
    case "interior":
      return "space";
    default:
      return "gallery";
  }
}

function suggestedUseToDestination(
  use: SalonImageCandidate["suggestedUse"],
): ImageDestination {
  switch (use) {
    case "logo":
      return "logo";
    case "top":
    case "hero":
    case "hero_mosaic":
      return "top";
    case "space":
    case "experience":
    case "interior":
    case "facade":
      return "space";
    case "ignore":
      return "ignore";
    default:
      return "gallery";
  }
}

function destinationToSuggestedUse(
  destination: ImageDestination,
): SalonImageCandidate["suggestedUse"] {
  switch (destination) {
    case "logo":
      return "logo";
    case "top":
      return "top";
    case "space":
      return "space";
    case "ignore":
      return "ignore";
    default:
      return "gallery";
  }
}

function getPlanTopImageIds(plan?: SalonLayoutImagePlan) {
  if (!plan) {
    return [];
  }

  return uniqueIds(
    plan.topImageIds?.length
      ? plan.topImageIds
      : [
          ...(plan.heroImageId ? [plan.heroImageId] : []),
          ...(plan.heroMosaicImageIds ?? []),
        ],
  );
}

function getPlanSpaceImageIds(plan?: SalonLayoutImagePlan) {
  if (!plan) {
    return [];
  }

  return uniqueIds(
    plan.spaceImageIds?.length ? plan.spaceImageIds : plan.experienceImageIds ?? [],
  );
}

function getDestinationLabel(destination: ImageDestination) {
  return (
    imageDestinationOptions.find((option) => option.value === destination)?.label ??
    destination
  );
}

function uniqueIds(ids: string[]) {
  return Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)));
}

function removeMatchingImageId(ids: string[], imageId: string) {
  return ids.filter((id) => !imageMatchesPlanId(imageId, id));
}

function containsMatchingImageId(ids: string[], imageId: string) {
  return ids.some((id) => imageMatchesPlanId(imageId, id));
}

function moveInMatchingList(ids: string[], imageId: string, direction: -1 | 1) {
  const nextIds = [...ids];
  const index = nextIds.findIndex((id) => imageMatchesPlanId(imageId, id));

  if (index < 0) {
    return nextIds;
  }

  const nextIndex = index + direction;

  if (nextIndex < 0 || nextIndex >= nextIds.length) {
    return nextIds;
  }

  const [item] = nextIds.splice(index, 1);
  nextIds.splice(nextIndex, 0, item);
  return nextIds;
}

function imageMatchesPlanId(imageId: string, planId: string) {
  if (!planId) {
    return false;
  }

  return imageId === planId || imageId === `image-${planId}` || imageId.endsWith(planId);
}

function getImageTypeLabel(type: SalonImageType) {
  return imageTypeOptions.find((item) => item.value === type)?.label ?? type;
}

function getSuggestedUseLabel(use: SalonImageCandidate["suggestedUse"]) {
  return (
    candidateSuggestedUseOptions.find((item) => item.value === use)?.label ?? use
  );
}

function getCandidateSourceLabel(source: SalonImageCandidate["source"]) {
  switch (source) {
    case "instagram":
      return "Instagram";
    case "google":
      return "Google";
    default:
      return "Site";
  }
}

function getConfidenceLabel(confidence: SalonImageCandidate["confidence"]) {
  switch (confidence) {
    case "high":
      return "Confianca alta";
    case "medium":
      return "Confianca media";
    case "low":
      return "Confianca baixa";
    default:
      return "Confianca incerta";
  }
}

function getCandidateStatusLabel(status: SalonImageCandidate["status"]) {
  switch (status) {
    case "selected":
      return "Selecionada";
    case "rejected":
      return "Rejeitada";
    case "applied":
      return "Aplicada";
    default:
      return "Nova";
  }
}

function getCandidateStatusClassName(status: SalonImageCandidate["status"]) {
  switch (status) {
    case "selected":
      return "rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-900 ring-1 ring-amber-100";
    case "rejected":
      return "rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-900 ring-1 ring-rose-100";
    case "applied":
      return "rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-900 ring-1 ring-teal-100";
    default:
      return "rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-700";
  }
}

function getCollectorOriginLabel(
  origin: NonNullable<SalonImageCandidate["collectorOrigin"]>,
) {
  switch (origin) {
    case "feed":
      return "Feed";
    case "post":
      return "Post aberto";
    case "carousel":
      return "Carrossel";
    case "highlight":
      return "Destaque/story";
    case "avatar":
      return "Avatar/perfil";
    default:
      return "Desconhecido";
  }
}

function formatCollectorError(
  source: "instagram" | "google" | "website",
  errorType?: "missing_url" | "invalid_url" | "blocked" | "no_images" | "internal",
  message?: string,
  usedTestCandidates?: boolean,
) {
  if (usedTestCandidates) {
    return "A fonte real nao liberou imagens uteis. Candidatas de teste foram carregadas para validar a curadoria em desenvolvimento.";
  }

  if (message) {
    return message;
  }

  switch (errorType) {
    case "missing_url":
      return source === "instagram"
        ? "Preencha o link do Instagram antes de buscar."
        : source === "google"
          ? "Preencha o link do Google Maps antes de buscar."
          : "Preencha o site do salao antes de buscar.";
    case "invalid_url":
      return "O link informado parece invalido para essa fonte.";
    case "blocked":
      return "A fonte respondeu, mas bloqueou a coleta publica de imagens.";
    case "no_images":
      return "Nenhuma imagem publica util foi encontrada nesse link.";
    default:
      return "Nao foi possivel concluir a coleta automatica dessa fonte.";
  }
}

function createLocalId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now().toString(36)}`;
}

async function copyTextToClipboard(text: string) {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Arquivo invalido."));
    };

    reader.onerror = () => {
      reject(new Error("Falha ao ler arquivo."));
    };

    reader.readAsDataURL(file);
  });
}
