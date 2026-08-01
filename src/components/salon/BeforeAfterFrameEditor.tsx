"use client";

import Image from "next/image";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  Layers3,
  Monitor,
  RotateCcw,
  Smartphone,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  DEFAULT_IMAGE_FRAME_ADJUSTMENT,
  IMAGE_FRAME_MAX_ZOOM,
  IMAGE_FRAME_MIN_ZOOM,
  getImageFrameStyle,
  normalizeImageFrameAdjustment,
  updateImageFrameAdjustment,
} from "@/lib/image-frame-adjustment";
import type {
  SalonBeforeAfterItem,
  SalonGalleryImage,
  SalonImageFrameAdjustment,
} from "@/types/salon";

type FrameSide = "before" | "after";
type PreviewMode = "compare" | "overlay";
type PreviewSize = "desktop" | "mobile";
type DragMode = "image" | "divider";

type BeforeAfterFrameEditorProps = {
  title: string;
  beforeImage?: SalonGalleryImage;
  afterImage?: SalonGalleryImage;
  beforeAdjustment?: SalonImageFrameAdjustment;
  afterAdjustment?: SalonImageFrameAdjustment;
  onApply: (
    patch: Pick<SalonBeforeAfterItem, "beforeAdjustment" | "afterAdjustment">,
  ) => void;
};

type DraftAdjustments = Record<FrameSide, SalonImageFrameAdjustment>;

function draftFromSaved(
  beforeAdjustment?: SalonImageFrameAdjustment,
  afterAdjustment?: SalonImageFrameAdjustment,
): DraftAdjustments {
  return {
    before:
      normalizeImageFrameAdjustment(beforeAdjustment) ??
      DEFAULT_IMAGE_FRAME_ADJUSTMENT,
    after:
      normalizeImageFrameAdjustment(afterAdjustment) ??
      DEFAULT_IMAGE_FRAME_ADJUSTMENT,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function BeforeAfterFrameEditor({
  title,
  beforeImage,
  afterImage,
  beforeAdjustment,
  afterAdjustment,
  onApply,
}: BeforeAfterFrameEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSide, setActiveSide] = useState<FrameSide>("before");
  const [draft, setDraft] = useState<DraftAdjustments>(() =>
    draftFromSaved(beforeAdjustment, afterAdjustment),
  );
  const [dividerPosition, setDividerPosition] = useState(50);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("compare");
  const [previewSize, setPreviewSize] = useState<PreviewSize>("desktop");
  const [overlayOpacity, setOverlayOpacity] = useState(50);
  const [showGuides, setShowGuides] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    mode: DragMode;
    pointerId: number;
    startX: number;
    startY: number;
    startOffsetX: number;
    startOffsetY: number;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLElement>("[data-frame-editor-title]")?.focus();
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeEditor();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function openEditor(side: FrameSide, opener: HTMLButtonElement) {
    openerRef.current = opener;
    setDraft(draftFromSaved(beforeAdjustment, afterAdjustment));
    setActiveSide(side);
    setDividerPosition(50);
    setPreviewMode("compare");
    setShowGuides(false);
    setShowGrid(false);
    setIsOpen(true);
  }

  function closeEditor() {
    setIsOpen(false);
    requestAnimationFrame(() => openerRef.current?.focus());
  }

  function updateActiveAdjustment(
    patch: Partial<SalonImageFrameAdjustment>,
  ) {
    setDraft((current) => ({
      ...current,
      [activeSide]:
        updateImageFrameAdjustment(current[activeSide], patch) ??
        DEFAULT_IMAGE_FRAME_ADJUSTMENT,
    }));
  }

  function resetSide(side: FrameSide) {
    setDraft((current) => ({
      ...current,
      [side]: DEFAULT_IMAGE_FRAME_ADJUSTMENT,
    }));
  }

  function resetBoth() {
    if (!window.confirm("Redefinir o enquadramento dos dois lados?")) return;
    setDraft({
      before: DEFAULT_IMAGE_FRAME_ADJUSTMENT,
      after: DEFAULT_IMAGE_FRAME_ADJUSTMENT,
    });
  }

  function applyAdjustments() {
    onApply({
      beforeAdjustment: normalizeImageFrameAdjustment(draft.before),
      afterAdjustment: normalizeImageFrameAdjustment(draft.after),
    });
    closeEditor();
  }

  function updateDivider(clientX: number) {
    const bounds = previewRef.current?.getBoundingClientRect();
    if (!bounds || !bounds.width) return;
    setDividerPosition(
      clamp(((clientX - bounds.left) / bounds.width) * 100, 0, 100),
    );
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    const isDivider = Boolean(target.closest("[data-divider-handle]"));
    const current = draft[activeSide];

    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      mode: isDivider ? "divider" : "image",
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startOffsetX: current.offsetX,
      startOffsetY: current.offsetY,
    };

    if (isDivider) updateDivider(event.clientX);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (drag.mode === "divider") {
      updateDivider(event.clientX);
      return;
    }

    const bounds = previewRef.current?.getBoundingClientRect();
    if (!bounds) return;

    updateActiveAdjustment({
      offsetX: drag.startOffsetX + ((event.clientX - drag.startX) / bounds.width) * 2,
      offsetY: drag.startOffsetY + ((event.clientY - drag.startY) / bounds.height) * 2,
    });
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    }
  }

  function handleKeyboard(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
      return;
    }

    event.preventDefault();
    const step = event.shiftKey ? 0.08 : 0.02;
    updateActiveAdjustment({
      offsetX:
        event.key === "ArrowLeft"
          ? draft[activeSide].offsetX - step
          : event.key === "ArrowRight"
            ? draft[activeSide].offsetX + step
            : draft[activeSide].offsetX,
      offsetY:
        event.key === "ArrowUp"
          ? draft[activeSide].offsetY - step
          : event.key === "ArrowDown"
            ? draft[activeSide].offsetY + step
            : draft[activeSide].offsetY,
    });
  }

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    updateActiveAdjustment({
      zoom: draft[activeSide].zoom + (event.deltaY > 0 ? -0.08 : 0.08),
    });
  }

  const activeAdjustment = draft[activeSide];
  const frameWidth = previewSize === "mobile" ? "max-w-[22rem]" : "max-w-5xl";

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button
          ref={openerRef}
          type="button"
          onClick={(event) => openEditor("before", event.currentTarget)}
          disabled={!beforeImage}
          className="rounded-full border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 transition hover:border-teal-400 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Ajustar foto do Antes
        </button>
        <button
          type="button"
          onClick={(event) => openEditor("after", event.currentTarget)}
          disabled={!afterImage}
          className="rounded-full border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 transition hover:border-teal-400 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Ajustar foto do Depois
        </button>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-zinc-950/70 p-3 sm:p-6">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="before-after-frame-editor-title"
            className="mx-auto flex min-h-[calc(100dvh-1.5rem)] w-full max-w-7xl flex-col rounded-[1.75rem] bg-white shadow-2xl sm:min-h-[calc(100dvh-3rem)]"
          >
            <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4 sm:px-7">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
                  Ajuste visual
                </p>
                <h2
                  id="before-after-frame-editor-title"
                  data-frame-editor-title
                  tabIndex={-1}
                  className="mt-1 font-serif text-2xl text-zinc-950 outline-none sm:text-3xl"
                >
                  {title}
                </h2>
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  Ajuste o enquadramento sem alterar o arquivo original.
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 text-zinc-700 transition hover:border-zinc-400"
                aria-label="Fechar editor de enquadramento"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto p-5 lg:grid-cols-[minmax(0,1fr)_19rem] lg:p-7">
              <div className="min-w-0">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2" role="tablist" aria-label="Lado da imagem">
                    {(["before", "after"] as FrameSide[]).map((side) => (
                      <button
                        key={side}
                        type="button"
                        role="tab"
                        aria-selected={activeSide === side}
                        onClick={() => setActiveSide(side)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeSide === side ? "bg-zinc-950 text-white" : "border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400"}`}
                      >
                        {side === "before" ? "Antes" : "Depois"}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewSize("desktop")}
                      aria-pressed={previewSize === "desktop"}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold ${previewSize === "desktop" ? "border-teal-500 bg-teal-50 text-teal-900" : "border-zinc-200 text-zinc-600"}`}
                    >
                      <Monitor className="h-3.5 w-3.5" /> Desktop
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewSize("mobile")}
                      aria-pressed={previewSize === "mobile"}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold ${previewSize === "mobile" ? "border-teal-500 bg-teal-50 text-teal-900" : "border-zinc-200 text-zinc-600"}`}
                    >
                      <Smartphone className="h-3.5 w-3.5" /> Mobile
                    </button>
                  </div>
                </div>

                <div
                  ref={previewRef}
                  tabIndex={0}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  onKeyDown={handleKeyboard}
                  onWheel={handleWheel}
                  className={`relative mx-auto aspect-[4/5] w-full touch-none select-none overflow-hidden rounded-[1.5rem] bg-zinc-200 outline-none ring-offset-4 focus-visible:ring-2 focus-visible:ring-teal-600 ${frameWidth}`}
                  aria-label="Prévia do comparador. Use as setas para mover a imagem selecionada."
                >
                  <EditorImage image={afterImage} adjustment={draft.after} alt={`${title} depois`} />
                  {previewMode === "compare" ? (
                    <div
                      className="absolute inset-0 overflow-hidden"
                      style={{ clipPath: `inset(0 ${100 - dividerPosition}% 0 0)` }}
                    >
                      <EditorImage image={beforeImage} adjustment={draft.before} alt={`${title} antes`} />
                    </div>
                  ) : (
                    <div className="absolute inset-0" style={{ opacity: overlayOpacity / 100 }}>
                      <EditorImage image={beforeImage} adjustment={draft.before} alt={`${title} antes`} />
                    </div>
                  )}

                  {showGrid ? (
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,transparent_33.333%,rgba(255,255,255,.65)_33.333%,rgba(255,255,255,.65)_33.6%,transparent_33.6%,transparent_66.666%,rgba(255,255,255,.65)_66.666%,rgba(255,255,255,.65)_67%,transparent_67%),linear-gradient(to_bottom,transparent_33.333%,rgba(255,255,255,.65)_33.333%,rgba(255,255,255,.65)_33.6%,transparent_33.6%,transparent_66.666%,rgba(255,255,255,.65)_66.666%,rgba(255,255,255,.65)_67%,transparent_67%)]" />
                  ) : null}
                  {showGuides ? (
                    <>
                      <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-white/80 shadow-sm" />
                      <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-white/80 shadow-sm" />
                    </>
                  ) : null}

                  {previewMode === "compare" ? (
                    <div
                      data-divider-handle
                      className="pointer-events-none absolute inset-y-0 z-20 w-px bg-white shadow-[0_0_0_1px_rgba(24,24,27,0.12)]"
                      style={{ left: `${dividerPosition}%` }}
                    >
                      <button
                        type="button"
                        data-divider-handle
                        aria-label="Arrastar divisor do comparador"
                        className="pointer-events-auto absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/95 text-zinc-900 shadow-xl"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <ChevronRight className="-ml-2 h-4 w-4" />
                      </button>
                    </div>
                  ) : null}
                  <span className="absolute left-3 top-3 z-30 rounded-full bg-white/90 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-zinc-800 shadow-sm">
                    Antes
                  </span>
                  <span className="absolute right-3 top-3 z-30 rounded-full bg-zinc-950/75 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white shadow-sm">
                    Depois
                  </span>
                </div>
                <p className="mt-3 text-center text-xs leading-5 text-zinc-500">
                  Aumente o zoom para criar o recorte e arraste a imagem selecionada nos dois eixos. Use as setas para ajustes finos ou a roda do mouse para zoom.
                </p>
              </div>

              <aside className="grid content-start gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="grid gap-2">
                  <p className="text-sm font-semibold text-zinc-950">
                    Ajustando: {activeSide === "before" ? "Antes" : "Depois"}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewMode("compare")}
                      aria-pressed={previewMode === "compare"}
                      className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold ${previewMode === "compare" ? "border-teal-500 bg-teal-50 text-teal-900" : "border-zinc-200 bg-white text-zinc-700"}`}
                    >
                      Comparador
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMode("overlay")}
                      aria-pressed={previewMode === "overlay"}
                      className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold ${previewMode === "overlay" ? "border-teal-500 bg-teal-50 text-teal-900" : "border-zinc-200 bg-white text-zinc-700"}`}
                    >
                      <Layers3 className="mr-1 inline h-3.5 w-3.5" /> Sobreposição
                    </button>
                  </div>
                </div>

                {previewMode === "compare" ? (
                  <label className="grid gap-2 text-xs font-semibold text-zinc-700">
                    Divisor: {Math.round(dividerPosition)}%
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={dividerPosition}
                      onChange={(event) => setDividerPosition(Number(event.target.value))}
                      className="accent-teal-700"
                    />
                  </label>
                ) : (
                  <label className="grid gap-2 text-xs font-semibold text-zinc-700">
                    Opacidade do Antes: {Math.round(overlayOpacity)}%
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={overlayOpacity}
                      onChange={(event) => setOverlayOpacity(Number(event.target.value))}
                      className="accent-teal-700"
                    />
                  </label>
                )}

                <label className="grid gap-2 text-xs font-semibold text-zinc-700">
                  Zoom: {activeAdjustment.zoom.toFixed(2)}x
                  <input
                    type="range"
                    min={IMAGE_FRAME_MIN_ZOOM}
                    max={IMAGE_FRAME_MAX_ZOOM}
                    step="0.01"
                    value={activeAdjustment.zoom}
                    onChange={(event) => updateActiveAdjustment({ zoom: Number(event.target.value) })}
                    className="accent-teal-700"
                  />
                </label>

                {activeAdjustment.zoom > 2.25 ? (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-950">
                    Esta aproximação pode reduzir a nitidez da imagem na página.
                  </p>
                ) : null}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => updateActiveAdjustment({ offsetX: 0, offsetY: 0 })}
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700"
                  >
                    Centralizar
                  </button>
                  <button
                    type="button"
                    onClick={() => resetSide(activeSide)}
                    className="flex items-center justify-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Redefinir
                  </button>
                </div>
                <button
                  type="button"
                  onClick={resetBoth}
                  className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700"
                >
                  Redefinir as duas
                </button>

                <div className="grid gap-2 border-t border-zinc-200 pt-3 text-xs font-semibold text-zinc-700">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={showGuides} onChange={(event) => setShowGuides(event.target.checked)} />
                    <span className="flex items-center gap-1"><Grid3X3 className="h-3.5 w-3.5" /> Guias centrais</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={showGrid} onChange={(event) => setShowGrid(event.target.checked)} />
                    Mostrar grade de terços
                  </label>
                </div>
              </aside>
            </div>

            <div className="flex flex-wrap justify-end gap-3 border-t border-zinc-200 px-5 py-4 sm:px-7">
              <button
                type="button"
                onClick={closeEditor}
                className="rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={applyAdjustments}
                className="flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white"
              >
                <Check className="h-4 w-4" /> Aplicar ajustes
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function EditorImage({
  image,
  adjustment,
  alt,
}: {
  image?: SalonGalleryImage;
  adjustment?: SalonImageFrameAdjustment;
  alt: string;
}) {
  if (!image) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-zinc-200 px-6 text-center text-sm font-medium text-zinc-500">
        Foto não selecionada
      </div>
    );
  }

  return (
    <Image
      src={image.src}
      alt={alt}
      fill
      unoptimized
      sizes="(max-width: 1024px) 100vw, 60vw"
      className="pointer-events-none select-none object-cover object-center"
      style={getImageFrameStyle(adjustment)}
      draggable={false}
    />
  );
}
