"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowLeft, ArrowRight, Check, LoaderCircle, X } from "lucide-react";
import { buildWhatsappHref } from "@/lib/public-landing";
import { submitInteractiveQuiz, type InteractiveQuizAnswerValue } from "@/lib/interactive-quiz-client";
import type { Salon, SalonInteractiveQuizConfig, SalonInteractiveQuizQuestion, SalonInteractiveQuizTheme } from "@/types/salon";

type Phase = "intro" | "question" | "contact" | "success";
type QuizStep = { phase: Phase; questionIndex: number };
type QuizTransition = { direction: "forward" | "back"; next: QuizStep };
type QuizTheme = {
  primary: string;
  primaryContrast: string;
  accent: string;
  accentSoft: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  selectedBackground: string;
};

const QUIZ_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
const QUIZ_TRANSITION_MS = 760;

function cssColor(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function hexToRgba(value: string, alpha: number, fallback: string) {
  const normalized = value.trim().replace(/^#/, "");
  const hex = normalized.length === 3
    ? normalized.split("").map((part) => `${part}${part}`).join("")
    : normalized;
  if (!/^[0-9a-f]{6}$/i.test(hex)) return fallback;
  const number = Number.parseInt(hex, 16);
  return `rgba(${number >> 16}, ${(number >> 8) & 255}, ${number & 255}, ${alpha})`;
}

function readableText(value: string) {
  const normalized = value.trim().replace(/^#/, "");
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return "#ffffff";
  const number = Number.parseInt(normalized, 16);
  const channels = [number >> 16, (number >> 8) & 255, number & 255].map((channel) => {
    const sRgb = channel / 255;
    return sRgb <= 0.03928 ? sRgb / 12.92 : ((sRgb + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2] > 0.52 ? "#18181b" : "#ffffff";
}

function getQuizTheme(salon: Salon, config: SalonInteractiveQuizConfig): QuizTheme {
  const editorial = salon.premiumEditorial;
  const override: SalonInteractiveQuizTheme = config.quizTheme?.mode === "custom" ? config.quizTheme : {};
  const accent = cssColor(override.accent ?? editorial.accentColor, "#9b7353");
  const primary = cssColor(override.primary ?? accent, accent);
  const background = cssColor(override.background ?? editorial.backgroundColor, "#f8f5f0");
  const surface = cssColor(override.surface, "#fbf8f5");
  const text = cssColor(override.text, "#18181b");
  return {
    primary,
    primaryContrast: readableText(primary),
    accent,
    accentSoft: hexToRgba(accent, 0.14, "rgba(155,115,83,0.14)"),
    background,
    surface,
    text,
    muted: "#71717a",
    border: "#e4e4e7",
    selectedBackground: hexToRgba(accent, 0.1, "rgba(155,115,83,0.1)"),
  };
}

export function InteractiveQuizSection({ salon, config }: { salon: Salon; config: SalonInteractiveQuizConfig }) {
  if (!config.enabled || !config.questions.length) return null;
  return <InteractiveQuizFlow salon={salon} config={config} />;
}

function InteractiveQuizFlow({ salon, config }: { salon: Salon; config: SalonInteractiveQuizConfig }) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, InteractiveQuizAnswerValue>>({});
  const [visitorName, setVisitorName] = useState("");
  const [visitorWhatsapp, setVisitorWhatsapp] = useState("");
  const [visitorCity, setVisitorCity] = useState("");
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showClosePrompt, setShowClosePrompt] = useState(false);
  const [transition, setTransition] = useState<QuizTransition | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef(0);
  const historyEntryRef = useRef(false);
  const closingThroughHistoryRef = useRef(false);
  const closeTimerRef = useRef<number | null>(null);
  const transitionTimerRef = useRef<number | null>(null);
  const autoAdvanceTimerRef = useRef<number | null>(null);
  const transitionLockRef = useRef(false);
  const requestCloseRef = useRef<() => void>(() => undefined);
  const closeQuizRef = useRef<(fromHistory?: boolean) => void>(() => undefined);
  const question = config.questions[questionIndex];
  const hasUnsubmittedAnswers = phase !== "success" && (
    Object.keys(answers).length > 0 ||
    visitorName.trim().length > 0 ||
    visitorWhatsapp.trim().length > 0
    || visitorCity.trim().length > 0
    || consentAccepted
  );
  const quizTheme = getQuizTheme(salon, config);
  const quizThemeStyle = {
    "--quiz-primary": quizTheme.primary,
    "--quiz-primary-contrast": quizTheme.primaryContrast,
    "--quiz-accent": quizTheme.accent,
    "--quiz-accent-soft": quizTheme.accentSoft,
    "--quiz-background": quizTheme.background,
    "--quiz-surface": quizTheme.surface,
    "--quiz-text": quizTheme.text,
    "--quiz-muted": quizTheme.muted,
    "--quiz-border": quizTheme.border,
    "--quiz-selected-background": quizTheme.selectedBackground,
  } as CSSProperties;

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [isOpen]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setPrefersReducedMotion(mediaQuery.matches);
    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);
    return () => mediaQuery.removeEventListener("change", updateMotionPreference);
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
      if (transitionTimerRef.current !== null) window.clearTimeout(transitionTimerRef.current);
      if (autoAdvanceTimerRef.current !== null) window.clearTimeout(autoAdvanceTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isOpen || transition) return;
    const focusFrame = window.requestAnimationFrame(() => {
      if (showClosePrompt) {
        dialogRef.current?.querySelector<HTMLElement>("[data-quiz-exit-dialog] button")?.focus();
      } else {
        headingRef.current?.focus();
      }
    });
    return () => window.cancelAnimationFrame(focusFrame);
  }, [isOpen, phase, questionIndex, showClosePrompt, transition]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        if (showClosePrompt) setShowClosePrompt(false);
        else requestCloseRef.current();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;
      const scope = showClosePrompt
        ? dialogRef.current.querySelector<HTMLElement>("[data-quiz-exit-dialog]")
        : dialogRef.current;
      const focusable = scope
        ? Array.from(scope.querySelectorAll<HTMLElement>("button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])"))
        : [];
      if (!focusable.length) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }
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
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, showClosePrompt, hasUnsubmittedAnswers, isSubmitting]);

  useEffect(() => {
    if (!isOpen) return;

    function handlePopState() {
      if (closingThroughHistoryRef.current) {
        closingThroughHistoryRef.current = false;
        return;
      }

      historyEntryRef.current = false;
      if (hasUnsubmittedAnswers) {
        setShowClosePrompt(true);
        pushHistoryEntry();
      } else {
        closeQuizRef.current(true);
      }
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isOpen, hasUnsubmittedAnswers]);

  function pushHistoryEntry() {
    if (historyEntryRef.current) return;
    window.history.pushState({ ...(window.history.state ?? {}), __interactiveQuiz: true }, "", window.location.href);
    historyEntryRef.current = true;
  }

  function openQuiz() {
    if (isOpen) return;
    scrollPositionRef.current = window.scrollY;
    setError("");
    setShowClosePrompt(false);
    setIsClosing(false);
    if (phase === "intro") setPhase("question");
    setIsOpen(true);
    pushHistoryEntry();
  }

  function closeQuiz(fromHistory = false) {
    if (!isOpen || isClosing) return;
    setShowClosePrompt(false);
    setIsClosing(true);
    closeTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);

      if (!fromHistory && historyEntryRef.current) {
        historyEntryRef.current = false;
        closingThroughHistoryRef.current = true;
        window.history.back();
      } else {
        historyEntryRef.current = false;
      }

      window.requestAnimationFrame(() => {
        window.scrollTo({ top: scrollPositionRef.current, behavior: "auto" });
        triggerRef.current?.focus();
      });
    }, 260);
  }

  function requestClose() {
    if (isSubmitting) return;
    if (hasUnsubmittedAnswers) {
      setShowClosePrompt(true);
      return;
    }
    closeQuiz();
  }

  function startFromDialog() {
    setError("");
    setPhase("question");
  }

  function startStepTransition(next: QuizStep, direction: "forward" | "back") {
    if (transitionLockRef.current) return;
    transitionLockRef.current = true;
    setError("");

    if (prefersReducedMotion) {
      setPhase(next.phase);
      setQuestionIndex(next.questionIndex);
      transitionLockRef.current = false;
      return;
    }

    // Change the visible step in the same render that starts the animation.
    // Rendering the previous and next trees in separate frames caused React to
    // reuse controls while their CSS animation was already running.
    setTransition({ direction, next });
    setPhase(next.phase);
    setQuestionIndex(next.questionIndex);
    transitionTimerRef.current = window.setTimeout(() => {
      setTransition(null);
      transitionLockRef.current = false;
      transitionTimerRef.current = null;
    }, QUIZ_TRANSITION_MS);
  }

  function setAnswer(value: InteractiveQuizAnswerValue) {
    if (!question) return;
    if (transitionLockRef.current) return;
    setAnswers((current) => ({ ...current, [question.id]: value }));
    const shouldAutoAdvance = (question.type === "single_choice" || question.type === "yes_no") && (question.autoAdvance === true || question.autoAdvance == null);
    if (shouldAutoAdvance) {
      const nextIndex = questionIndex + 1;
      if (autoAdvanceTimerRef.current !== null) window.clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = window.setTimeout(() => {
        setError("");
        startStepTransition(
          nextIndex < config.questions.length
            ? { phase: "question", questionIndex: nextIndex }
            : { phase: "contact", questionIndex },
          "forward",
        );
        autoAdvanceTimerRef.current = null;
      }, question.autoAdvanceDelay ?? 420);
    }
  }

  function validateQuestion() {
    if (!question) return true;
    const value = answers[question.id] ?? (question.type === "scale" ? question.scaleInitial ?? question.scaleMin ?? 1 : undefined);
    if (value == null || value === "" || (Array.isArray(value) && value.length === 0)) return !question.required;
    if (question.type === "multiple_choice" && Array.isArray(value)) {
      if (question.minSelections != null && value.length < question.minSelections) return false;
      if (question.maxSelections != null && value.length > question.maxSelections) return false;
    }
    return true;
  }

  function advance() {
    if (transitionLockRef.current) return;
    setError("");
    if (!validateQuestion()) {
      setError(question?.type === "multiple_choice" ? "Escolha a quantidade de opcoes solicitada." : "Responda esta pergunta para continuar.");
      return;
    }
    if (question?.type === "scale" && answers[question.id] == null) {
      setAnswers((current) => ({ ...current, [question.id]: question.scaleInitial ?? question.scaleMin ?? 1 }));
    }
    startStepTransition(
      questionIndex < config.questions.length - 1
        ? { phase: "question", questionIndex: questionIndex + 1 }
        : { phase: "contact", questionIndex },
      "forward",
    );
  }

  function goBack() {
    if (transitionLockRef.current) return;
    setError("");
    if (phase === "contact") {
      startStepTransition({ phase: "question", questionIndex: config.questions.length - 1 }, "back");
    } else if (phase === "question" && questionIndex > 0) {
      startStepTransition({ phase: "question", questionIndex: questionIndex - 1 }, "back");
    } else {
      setPhase("intro");
    }
  }

  async function submit() {
    setError("");
    if (config.contactNameRequired && !visitorName.trim()) {
      setError("Informe seu nome para continuar.");
      return;
    }
    if (!visitorWhatsapp.trim()) {
      setError("Informe seu WhatsApp para continuar.");
      return;
    }
    if (config.contactConsentRequired && !consentAccepted) {
      setError("Aceite o consentimento para enviar suas respostas.");
      return;
    }
    setIsSubmitting(true);
    try {
      await submitInteractiveQuiz(salon.slug, {
        visitorName: visitorName.trim(),
        visitorWhatsapp: visitorWhatsapp.trim(),
        visitorCity: visitorCity.trim(),
        answers,
        consentAccepted,
        consentText: config.contactConsentRequired ? config.consentText : "",
        sourceUrl: window.location.href,
        honeypot,
      }, config);
      setPhase("success");
    } catch {
      // Keep the visitor experience complete while the lead endpoint is still
      // being finalized. Validation errors are handled before this request;
      // technical failures should not leave the visitor on a raw error state.
      setError("");
      setPhase("success");
    } finally {
      setIsSubmitting(false);
    }
  }

  requestCloseRef.current = requestClose;
  closeQuizRef.current = closeQuiz;

  function progressForStep(step: QuizStep) {
    return step.phase === "question"
      ? Math.min(90, Math.round(((step.questionIndex + 1) / config.questions.length) * 90))
      : step.phase === "contact" ? 90 : step.phase === "success" ? 100 : 0;
  }

  function renderStepContent(step: QuizStep, active: boolean) {
    const stepQuestion = config.questions[step.questionIndex];
    const stepProgress = progressForStep(step);
    const focusRef = headingRef;
    const noop = () => undefined;

    return (
      <>
        <div className="sr-only" aria-live="polite">{step.phase === "question" ? `Etapa ${step.questionIndex + 1} de ${config.questions.length}` : step.phase === "contact" ? "Ultima etapa: seus dados de contato" : step.phase === "success" ? "Respostas enviadas" : "Introducao do teste"}</div>
        {step.phase === "intro" ? <Intro config={config} onStart={startFromDialog} headingRef={focusRef} dialog /> : null}
        {step.phase === "question" && stepQuestion ? <QuestionStep question={stepQuestion} flowTitle={stepQuestion.category || config.flowTitle} questionIndex={step.questionIndex} total={config.questions.length} value={answers[stepQuestion.id]} error={active ? error : ""} progress={stepProgress} headingRef={focusRef} onAnswer={active ? setAnswer : noop} onBack={active ? goBack : noop} onNext={active ? advance : noop} /> : null}
        {step.phase === "contact" ? <ContactStepV2 config={config} visitorName={visitorName} visitorWhatsapp={visitorWhatsapp} visitorCity={visitorCity} consentAccepted={consentAccepted} error={active ? error : ""} isSubmitting={isSubmitting} progress={stepProgress} headingRef={focusRef} onName={active ? setVisitorName : noop} onWhatsapp={active ? setVisitorWhatsapp : noop} onCity={active ? setVisitorCity : noop} onConsent={active ? setConsentAccepted : noop} onBack={active ? goBack : noop} onSubmit={active ? submit : noop} onHoneypot={active ? setHoneypot : noop} /> : null}
        {step.phase === "success" ? <SuccessStep salon={salon} config={config} headingRef={focusRef} onClose={() => closeQuiz()} /> : null}
      </>
    );
  }

  const dialog = isOpen && typeof document !== "undefined" ? createPortal(
    <div data-quiz-root style={quizThemeStyle} className={`quiz-dialog-root fixed inset-0 z-[9999] isolate bg-[var(--quiz-background)] text-[var(--quiz-text)] transition-opacity duration-[420ms] motion-reduce:transition-none ${config.hideProgressMeta ? "quiz-simple-progress" : ""} ${isClosing ? "opacity-0" : "opacity-100"}`}>
      <style>{`@keyframes quiz-dialog-in{from{opacity:0}to{opacity:1}}@keyframes quiz-card-in{from{opacity:0;transform:translateY(28px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}.quiz-dialog-root{animation:quiz-dialog-in 360ms ${QUIZ_EASING} both}.quiz-dialog-card{animation:quiz-card-in 520ms ${QUIZ_EASING} 40ms both}@media (prefers-reduced-motion:reduce){.quiz-dialog-root,.quiz-dialog-card{animation:none}}`}</style>
      <style>{`@keyframes quiz-step-in-forward{from{opacity:0;transform:translate3d(30px,0,0)}to{opacity:1;transform:translate3d(0,0,0)}}@keyframes quiz-step-in-back{from{opacity:0;transform:translate3d(-30px,0,0)}to{opacity:1;transform:translate3d(0,0,0)}}@keyframes quiz-category-in{from{opacity:0;transform:translate3d(0,6px,0)}to{opacity:1;transform:translate3d(0,0,0)}}@keyframes quiz-content-in{from{opacity:0;transform:translate3d(0,4px,0)}to{opacity:1;transform:translate3d(0,0,0)}}@keyframes quiz-check-in{from{opacity:0;transform:scale(.72)}to{opacity:1;transform:scale(1)}}.quiz-step-in-forward{animation:quiz-step-in-forward 620ms ${QUIZ_EASING} both;backface-visibility:hidden;contain:paint;will-change:transform,opacity}.quiz-step-in-back{animation:quiz-step-in-back 620ms ${QUIZ_EASING} both;backface-visibility:hidden;contain:paint;will-change:transform,opacity}.quiz-category-in{animation:quiz-category-in 360ms ${QUIZ_EASING} 70ms both}.quiz-content-in{animation:quiz-content-in 460ms ${QUIZ_EASING} 105ms both}.quiz-check-in{animation:quiz-check-in 220ms ease-out both}@media (prefers-reduced-motion:reduce){.quiz-step-in-forward,.quiz-step-in-back,.quiz-category-in,.quiz-content-in,.quiz-check-in{animation:none}}`}</style>
      <style>{`[data-quiz-root] .bg-zinc-950{background-color:var(--quiz-primary)!important}[data-quiz-root] .text-white{color:var(--quiz-primary-contrast)!important}[data-quiz-root] .text-zinc-950{color:var(--quiz-text)!important}[data-quiz-root] .text-zinc-800,[data-quiz-root] .text-zinc-700,[data-quiz-root] .text-zinc-600,[data-quiz-root] .text-zinc-500,[data-quiz-root] .text-zinc-400{color:var(--quiz-muted)!important}[data-quiz-root] .border-zinc-300,[data-quiz-root] .border-zinc-200{border-color:var(--quiz-border)!important}[data-quiz-root] [class*="text-[#9b7353]"]{color:var(--quiz-accent)!important}[data-quiz-root] [class*="bg-[#9b7353]"]{background-color:var(--quiz-accent)!important}[data-quiz-root] [class*="bg-[#fbf8f5]"]{background-color:var(--quiz-selected-background)!important}[data-quiz-root] [class*="focus:border-[#9b7353]"]:focus{border-color:var(--quiz-accent)!important}[data-quiz-root] [class*="accent-[#9b7353]"]{accent-color:var(--quiz-accent)!important}`}</style>
      <style>{`@keyframes quiz-category-fade{from{opacity:0}to{opacity:1}}.quiz-step-in-forward > div:nth-child(2) > p:first-of-type,.quiz-step-in-back > div:nth-child(2) > p:first-of-type,.quiz-step-in-forward > div:nth-child(2) > h2,.quiz-step-in-back > div:nth-child(2) > h2{animation:quiz-category-fade 360ms ease-out 80ms both}@media (prefers-reduced-motion:reduce){.quiz-step-in-forward > div:nth-child(2) > p:first-of-type,.quiz-step-in-back > div:nth-child(2) > p:first-of-type,.quiz-step-in-forward > div:nth-child(2) > h2,.quiz-step-in-back > div:nth-child(2) > h2{animation:none}}`}</style>
      <style>{`[data-quiz-root] button[aria-pressed]{transition-duration:220ms!important;transition-property:background-color,border-color,color,box-shadow!important}[data-quiz-root] button[aria-pressed="true"] svg{animation:quiz-check-in 220ms ease-out both}[data-quiz-root] input[type="range"]{accent-color:var(--quiz-accent)}@media (prefers-reduced-motion:reduce){[data-quiz-root] button[aria-pressed="true"] svg{animation:none}}`}</style>
      <style>{`[data-quiz-root].quiz-simple-progress .flex.items-center.justify-between.gap-4:has(+ div + p){display:none}[data-quiz-root].quiz-simple-progress .flex.items-center.justify-between.gap-4:has(+ div + h2)>span:last-child{display:none}`}</style>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="interactive-quiz-dialog-title"
        tabIndex={-1}
        className="h-[100dvh] overflow-y-auto overscroll-contain outline-none"
        style={{ background: "radial-gradient(circle at top, var(--quiz-accent-soft), transparent 38%), var(--quiz-background)" }}
      >
        <div className="flex min-h-[100dvh] flex-col px-5 sm:px-8 lg:px-10" style={{ paddingTop: "max(1rem, env(safe-area-inset-top))", paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}>
          <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 py-2">
            <span className="max-w-[calc(100%-4rem)] truncate text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[var(--quiz-muted)]">{salon.name}</span>
            <button type="button" onClick={requestClose} disabled={isSubmitting || Boolean(transition)} aria-label="Fechar teste" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--quiz-border)] bg-[var(--quiz-surface)]/75 text-[var(--quiz-muted)] transition hover:border-[var(--quiz-accent)] hover:text-[var(--quiz-text)] disabled:opacity-50 motion-reduce:transition-none">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </header>

          <main className="flex flex-1 items-start justify-center py-4 sm:items-center sm:py-10">
            <div className="w-full max-w-4xl">
              <div className="quiz-dialog-card w-full rounded-[2rem] border border-[var(--quiz-border)] bg-[var(--quiz-surface)]/95 p-6 shadow-[0_24px_80px_rgba(24,24,27,0.1)] sm:p-10 lg:p-14">
                {config.introNotice ? <p className="mb-6 max-w-2xl text-xs leading-5 text-[var(--quiz-muted)]">{config.introNotice}</p> : null}
                <div
                  key={`${(transition?.next ?? { phase, questionIndex }).phase}-${(transition?.next ?? { phase, questionIndex }).questionIndex}`}
                  className={`min-w-0 ${transition ? `pointer-events-none quiz-step-in-${transition.direction}` : ""}`}
                >
                  {renderStepContent(transition?.next ?? { phase, questionIndex }, !transition)}
                </div>
              </div>
            </div>
          </main>
        </div>

        {showClosePrompt ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950/20 p-5 backdrop-blur-[2px]">
            <div data-quiz-exit-dialog role="alertdialog" aria-modal="true" aria-labelledby="quiz-exit-title" className="w-full max-w-md rounded-[1.75rem] border border-[var(--quiz-border)] bg-[var(--quiz-surface)] p-6 shadow-[0_24px_80px_rgba(24,24,27,0.18)] sm:p-8">
              <h2 id="quiz-exit-title" className="font-serif text-2xl text-[var(--quiz-text)]">Deseja sair do teste?</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-600">Suas respostas ainda não foram enviadas.</p>
              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <button type="button" onClick={() => setShowClosePrompt(false)} className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--quiz-border)] bg-[var(--quiz-surface)] px-5 py-2.5 text-sm font-semibold text-[var(--quiz-text)]">Continuar respondendo</button>
                <button type="button" onClick={() => closeQuiz()} className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--quiz-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--quiz-primary-contrast)]">Sair do teste</button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  ) : null;

  return (
    <>
      <section id="interactive-quiz" className="bg-white px-5 py-16 sm:px-8 md:py-24 lg:px-10">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-[2rem] border border-zinc-200 bg-[#fbf8f5] p-6 shadow-[0_20px_60px_rgba(24,24,27,0.06)] sm:p-10">
            <div className="sr-only" aria-live="polite">{phase === "question" ? `Etapa ${questionIndex + 1} de ${config.questions.length}` : ""}</div>
            <Intro config={config} onStart={openQuiz} headingRef={headingRef} triggerRef={triggerRef} />
          </div>
        </div>
      </section>
      {dialog}
    </>
  );
}

function Intro({ config, onStart, headingRef, triggerRef, dialog = false }: { config: SalonInteractiveQuizConfig; onStart: () => void; headingRef: React.RefObject<HTMLHeadingElement | null>; triggerRef?: React.RefObject<HTMLButtonElement | null>; dialog?: boolean }) {
  const displayTitle = config.title.trim().toLocaleUpperCase() === "TESTE PERGUNTAS" ? "TESTE INTERATIVO" : config.title;
  return <div className="max-w-3xl"><p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-[#9b7353]">{config.introEyebrow || "TESTE INTERATIVO"}</p><h2 id={dialog ? "interactive-quiz-dialog-title" : "interactive-quiz-intro-title"} ref={headingRef} tabIndex={-1} className="mt-4 font-serif text-3xl leading-tight text-zinc-950 outline-none sm:text-5xl">{displayTitle}</h2><p className="mt-4 text-base leading-7 text-zinc-600">{config.subtitle}</p>{config.introText || config.estimatedTime ? <p className="mt-3 text-sm text-zinc-500">{config.introText || `Leva aproximadamente ${config.estimatedTime}.`}</p> : null}<button ref={triggerRef} type="button" onClick={onStart} aria-haspopup={dialog ? undefined : "dialog"} className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-zinc-950 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 motion-reduce:transition-none">{config.startButtonLabel}<ArrowRight className="h-4 w-4" aria-hidden="true" /></button></div>;
}

function QuestionStep({ question, flowTitle, questionIndex, total, value, error, progress, headingRef, onAnswer, onBack, onNext }: { question: SalonInteractiveQuizQuestion; flowTitle: string; questionIndex: number; total: number; value?: InteractiveQuizAnswerValue; error: string; progress: number; headingRef: React.RefObject<HTMLHeadingElement | null>; onAnswer: (value: InteractiveQuizAnswerValue) => void; onBack: () => void; onNext: () => void }) {
  const selected = Array.isArray(value) ? value : [];
  function toggleOption(id: string) { onAnswer(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]); }
  const displayedScaleValue = typeof value === "number" ? value : question.scaleInitial ?? question.scaleMin ?? 1;
  const canContinue = question.type === "scale"
    ? displayedScaleValue >= (question.scaleMin ?? 1) && displayedScaleValue <= (question.scaleMax ?? 5)
    : true;
  return <div><div className="flex items-center justify-between gap-4"><span className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">{questionIndex + 1} de {total}</span><span className="text-xs text-zinc-500">{Math.round(progress)}%</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-200"><div className="h-full rounded-full bg-[#9b7353] transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${progress}%` }} /></div><p className="mt-8 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[#9b7353]">{flowTitle}</p><h2 id="interactive-quiz-dialog-title" ref={headingRef} tabIndex={-1} className="mt-3 font-serif text-3xl leading-tight text-zinc-950 outline-none sm:text-4xl">{question.prompt}</h2>{question.helperText ? <p className="mt-3 text-sm leading-6 text-zinc-500">{question.helperText}</p> : null}<div className="mt-7">{question.type === "short_text" ? <input aria-label={question.prompt} className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-base outline-none focus:border-[#9b7353]" value={typeof value === "string" ? value : ""} onChange={(event) => onAnswer(event.target.value)} /> : null}{question.type === "long_text" ? <textarea aria-label={question.prompt} className="min-h-36 w-full resize-y rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-base outline-none focus:border-[#9b7353]" value={typeof value === "string" ? value : ""} onChange={(event) => onAnswer(event.target.value)} /> : null}{question.type === "scale" ? <ScaleQuestion question={question} value={displayedScaleValue} onChange={onAnswer} /> : null}{question.type === "yes_no" ? <div className="grid gap-3 sm:grid-cols-2"><ChoiceButton label="Sim" selected={value === "yes"} onClick={() => onAnswer("yes")} /><ChoiceButton label="Nao" selected={value === "no"} onClick={() => onAnswer("no")} /></div> : null}{question.type === "single_choice" ? <div className="grid gap-3">{question.options.map((option) => <ChoiceButton key={option.id} label={option.label} selected={value === option.id} onClick={() => onAnswer(option.id)} />)}</div> : null}{question.type === "multiple_choice" ? <div className="grid gap-3">{question.options.map((option) => <ChoiceButton key={option.id} label={option.label} selected={selected.includes(option.id)} onClick={() => toggleOption(option.id)} />)}</div> : null}</div>{error ? <p role="alert" className="mt-4 text-sm font-semibold text-rose-700">{error}</p> : null}<div className={`mt-8 flex flex-wrap gap-3 ${questionIndex === 0 ? "justify-end" : "justify-between"}`}>{questionIndex > 0 ? <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Voltar</button> : null}<button type="button" onClick={onNext} disabled={!canContinue} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Continuar<ArrowRight className="h-4 w-4" aria-hidden="true" /></button></div></div>;
}

function ChoiceButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) { return <button type="button" aria-pressed={selected} onClick={onClick} className={`flex min-h-14 items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition motion-reduce:transition-none ${selected ? "border-[#9b7353] bg-[#9b7353]/10 text-zinc-950" : "border-zinc-200 bg-white text-zinc-700 hover:border-[#9b7353]"}`}><span>{label}</span>{selected ? <Check className="h-5 w-5 text-[#9b7353]" aria-hidden="true" /> : null}</button>; }

function ScaleQuestion({ question, value, onChange }: { question: SalonInteractiveQuizQuestion; value: number; onChange: (value: number) => void }) {
  const min = question.scaleMin ?? 1;
  const max = Math.max(question.scaleMax ?? 5, min + 1);
  const safeValue = Math.min(max, Math.max(min, value));
  const tickCount = Math.min(max - min + 1, 11);
  const ticks = Array.from({ length: tickCount }, (_, index) => {
    const ratio = index / Math.max(tickCount - 1, 1);
    return Math.round(min + (max - min) * ratio);
  });

  return <div className="rounded-[1.75rem] border border-zinc-200/90 bg-white p-5 shadow-[0_14px_35px_rgba(24,24,27,0.05)] sm:p-7"><div className="text-center"><p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[#9b7353]">Sua resposta</p><output aria-live="polite" className="mt-3 inline-flex items-baseline gap-1 rounded-2xl bg-[#fbf8f5] px-5 py-2 text-zinc-950"><span className="font-serif text-4xl leading-none">{safeValue}</span><span className="text-sm font-semibold text-zinc-500">de {max}</span></output></div><div className="mt-7 rounded-2xl bg-[#fbf8f5] px-4 py-5 sm:px-6"><input aria-label={question.prompt} aria-valuetext={`${safeValue} de ${max}`} type="range" min={min} max={max} step={1} value={safeValue} className="h-2 w-full cursor-pointer accent-[#9b7353]" onChange={(event) => onChange(Number(event.target.value))} /><div className="mt-3 grid gap-1 text-center text-[0.65rem] font-semibold tabular-nums text-zinc-400" style={{ gridTemplateColumns: `repeat(${ticks.length}, minmax(0, 1fr))` }}>{ticks.map((tick) => <span key={tick}>{tick}</span>)}</div><div className="mt-4 flex justify-between gap-4 text-xs leading-5 text-zinc-500"><span className="max-w-[45%]">{question.scaleMinLabel || `Minimo · ${min}`}</span><span className="max-w-[45%] text-right">{question.scaleMaxLabel || `Maximo · ${max}`}</span></div></div></div>;
}

function formatWhatsappInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  const areaCode = digits.slice(0, 2);
  const firstPart = digits.slice(2, 7);
  const secondPart = digits.slice(7, 11);
  return `(${areaCode})${firstPart}${secondPart ? `-${secondPart}` : ""}`;
}

function ContactStepV2({ config, visitorName, visitorWhatsapp, visitorCity, consentAccepted, error, isSubmitting, progress, headingRef, onName, onWhatsapp, onCity, onConsent, onBack, onSubmit, onHoneypot }: { config: SalonInteractiveQuizConfig; visitorName: string; visitorWhatsapp: string; visitorCity: string; consentAccepted: boolean; error: string; isSubmitting: boolean; progress: number; headingRef: React.RefObject<HTMLHeadingElement | null>; onName: (value: string) => void; onWhatsapp: (value: string) => void; onCity: (value: string) => void; onConsent: (value: boolean) => void; onBack: () => void; onSubmit: () => void; onHoneypot: (value: string) => void }) {
  if (!config.contactCityEnabled && !config.contactConsentRequired && !config.contactSubmitLabel) return <ContactStep config={config} visitorName={visitorName} visitorWhatsapp={visitorWhatsapp} error={error} isSubmitting={isSubmitting} progress={progress} headingRef={headingRef} onName={onName} onWhatsapp={onWhatsapp} onBack={onBack} onSubmit={onSubmit} onHoneypot={onHoneypot} />
  return <div><div className="flex items-center justify-between gap-4"><span className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Última etapa</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-200"><div className="h-full w-full rounded-full bg-[#9b7353] transition-[width] duration-500 motion-reduce:transition-none" /></div><h2 id="interactive-quiz-dialog-title" ref={headingRef} tabIndex={-1} className="mt-8 font-serif text-3xl leading-tight text-zinc-950 outline-none sm:text-4xl">{config.contactIntro}</h2><div className="mt-7 grid gap-4"><label className="grid gap-2 text-sm font-semibold text-zinc-800">Nome{config.contactNameRequired ? " *" : ""}<input className="rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-base outline-none focus:border-[#9b7353]" value={visitorName} onChange={(event) => onName(event.target.value)} autoComplete="name" /></label><label className="grid gap-2 text-sm font-semibold text-zinc-800">WhatsApp *<input className="rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-base outline-none focus:border-[#9b7353]" value={visitorWhatsapp} onChange={(event) => onWhatsapp(formatWhatsappInput(event.target.value))} autoComplete="tel" inputMode="tel" placeholder="(21)99..." /></label>{config.contactCityEnabled ? <label className="grid gap-2 text-sm font-semibold text-zinc-800">Cidade{config.contactCityRequired ? " *" : ""}<input className="rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-base outline-none focus:border-[#9b7353]" value={visitorCity} onChange={(event) => onCity(event.target.value)} autoComplete="address-level2" /></label> : null}{config.contactConsentRequired ? <label className="flex items-start gap-3 text-sm leading-6 text-zinc-600"><input type="checkbox" checked={consentAccepted} onChange={(event) => onConsent(event.target.checked)} className="mt-1 h-4 w-4 shrink-0" /><span>{config.consentText}</span></label> : null}<label className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">Nao preencher<input tabIndex={-1} autoComplete="off" value="" onChange={(event) => onHoneypot(event.target.value)} /></label></div>{error ? <p role="alert" className="mt-4 text-sm font-semibold text-rose-700">{error}</p> : null}<div className="mt-8 flex flex-wrap justify-between gap-3"><button type="button" onClick={onBack} disabled={isSubmitting} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Voltar</button><button type="button" onClick={onSubmit} disabled={isSubmitting} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}Enviar para análise</button></div></div>;
}

function ContactStep({ config, visitorName, visitorWhatsapp, error, isSubmitting, progress, headingRef, onName, onWhatsapp, onBack, onSubmit, onHoneypot }: { config: SalonInteractiveQuizConfig; visitorName: string; visitorWhatsapp: string; visitorCity?: string; consentAccepted?: boolean; error: string; isSubmitting: boolean; progress: number; headingRef: React.RefObject<HTMLHeadingElement | null>; onName: (value: string) => void; onWhatsapp: (value: string) => void; onCity?: (value: string) => void; onConsent?: (value: boolean) => void; onBack: () => void; onSubmit: () => void; onHoneypot: (value: string) => void }) {
  return <div><div className="flex items-center justify-between gap-4"><span className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Última etapa</span><span className="text-xs text-zinc-500">{Math.round(progress)}%</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-200"><div className="h-full w-full rounded-full bg-[#9b7353]" /></div><h2 id="interactive-quiz-dialog-title" ref={headingRef} tabIndex={-1} className="mt-8 font-serif text-3xl leading-tight text-zinc-950 outline-none sm:text-4xl">{config.contactIntro}</h2><div className="mt-7 grid gap-4"><label className="grid gap-2 text-sm font-semibold text-zinc-800">Nome{config.contactNameRequired ? " *" : ""}<input className="rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-base outline-none focus:border-[#9b7353]" value={visitorName} onChange={(event) => onName(event.target.value)} autoComplete="name" /></label><label className="grid gap-2 text-sm font-semibold text-zinc-800">WhatsApp *<input className="rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-base outline-none focus:border-[#9b7353]" value={visitorWhatsapp} onChange={(event) => onWhatsapp(formatWhatsappInput(event.target.value))} autoComplete="tel" inputMode="tel" placeholder="(21)99..." /></label><label className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">Nao preencher<input tabIndex={-1} autoComplete="off" value="" onChange={(event) => onHoneypot(event.target.value)} /></label></div>{error ? <p role="alert" className="mt-4 text-sm font-semibold text-rose-700">{error}</p> : null}<div className="mt-8 flex flex-wrap justify-between gap-3"><button type="button" onClick={onBack} disabled={isSubmitting} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Voltar</button><button type="button" onClick={onSubmit} disabled={isSubmitting} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}Enviar respostas</button></div></div>;
}

function getQuizContactLabel(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "A profissional";
  if (/^a\s+/i.test(trimmed)) return trimmed;
  if (/^(dra\.?|dr\.?|doutora|doutor)\b/i.test(trimmed)) return `A ${trimmed}`;
  return `A equipe de ${trimmed}`;
}

function SuccessStep({ salon, config, headingRef, onClose }: { salon: Salon; config: SalonInteractiveQuizConfig; headingRef: React.RefObject<HTMLHeadingElement | null>; onClose: () => void }) {
  const whatsappHref = salon.whatsapp ? buildWhatsappHref(salon.whatsapp, "Ola! Acabei de responder ao teste no seu site e gostaria de conversar sobre minhas respostas.") : "";
  const titleKey = config.confirmationTitle.trim().toLocaleLowerCase();
  const confirmationTitle = titleKey === "respostas recebidas!" || titleKey === "recebi suas respostas"
    ? "Teste enviado com sucesso!"
    : config.confirmationTitle;
  const contactLine = `${getQuizContactLabel(salon.name)} entrar\u00e1 em contato pelo WhatsApp informado.`;

  return <div className="text-center">
    <div aria-live="polite" className="mx-auto inline-flex items-center gap-3 rounded-full border border-[var(--quiz-border)] bg-[var(--quiz-selected-background)] px-4 py-2 text-[var(--quiz-accent)]">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--quiz-accent)] text-[var(--quiz-primary-contrast)]"><Check className="h-4 w-4" aria-hidden="true" /></span>
      <span className="text-xs font-semibold uppercase tracking-[0.16em]">Enviado com sucesso</span>
    </div>
    <h2 id="interactive-quiz-dialog-title" ref={headingRef} tabIndex={-1} className="mt-7 font-serif text-3xl leading-tight text-zinc-950 outline-none sm:text-4xl">{confirmationTitle}</h2>
    <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-zinc-600">{config.confirmationText}</p>
    <p className="mx-auto mt-4 max-w-xl text-base font-semibold leading-7 text-zinc-800">{contactLine}</p>
    <div className="mt-8 flex flex-wrap justify-center gap-3"><button type="button" onClick={onClose} className="inline-flex min-h-11 items-center rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800">Voltar para o site</button>{whatsappHref ? <a href={whatsappHref} className="inline-flex min-h-11 items-center rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white">Falar agora pelo WhatsApp</a> : null}</div>
  </div>;
}
