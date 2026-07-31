"use client";

import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  Plus,
  Trash2,
} from "lucide-react";
import {
  createInteractiveQuizConfig,
  createInteractiveQuizOption,
  createInteractiveQuizQuestion,
  normalizeInteractiveQuizConfig,
} from "@/lib/interactive-quiz";
import type {
  SalonInteractiveQuizConfig,
  SalonInteractiveQuizOption,
  SalonInteractiveQuizQuestion,
  SalonInteractiveQuizQuestionType,
} from "@/types/salon";
import { InteractiveQuizLeads } from "@/components/salon/InteractiveQuizLeads";

const typeLabels: Record<SalonInteractiveQuizQuestionType, string> = {
  short_text: "Resposta curta",
  long_text: "Resposta longa",
  single_choice: "Escolha unica",
  multiple_choice: "Multipla escolha",
  scale: "Escala deslizante",
  yes_no: "Sim ou nao",
};

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-teal-700";

export function InteractiveQuizBuilder({
  config,
  onChange,
  salonSlug,
}: {
  config?: SalonInteractiveQuizConfig;
  onChange: (config?: SalonInteractiveQuizConfig) => void;
  salonSlug?: string;
}) {
  const normalized = config ? normalizeInteractiveQuizConfig(config) : undefined;

  function enable() {
    onChange({ ...(normalized ?? createInteractiveQuizConfig()), enabled: true });
  }

  function patchConfig(patch: Partial<SalonInteractiveQuizConfig>) {
    if (!normalized) return;
    onChange({ ...normalized, ...patch });
  }

  function addQuestion() {
    const next = createInteractiveQuizQuestion(
      "short_text",
      normalized?.questions.length ?? 0,
    );
    onChange({
      ...(normalized ?? createInteractiveQuizConfig()),
      enabled: true,
      questions: [...(normalized?.questions ?? []), next],
    });
  }

  function updateQuestion(id: string, patch: Partial<SalonInteractiveQuizQuestion>) {
    if (!normalized) return;
    onChange({
      ...normalized,
      questions: normalized.questions.map((question) =>
        question.id === id ? { ...question, ...patch } : question,
      ),
    });
  }

  function moveQuestion(id: string, direction: -1 | 1) {
    if (!normalized) return;
    const questions = [...normalized.questions];
    const index = questions.findIndex((question) => question.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= questions.length) return;
    const [question] = questions.splice(index, 1);
    questions.splice(target, 0, question);
    onChange({ ...normalized, questions });
  }

  function duplicateQuestion(question: SalonInteractiveQuizQuestion) {
    if (!normalized) return;
    const copy = createInteractiveQuizQuestion(question.type, normalized.questions.length);
    onChange({
      ...normalized,
      questions: [
        ...normalized.questions,
        { ...copy, prompt: `${question.prompt} (copia)`, helperText: question.helperText, required: question.required, options: question.options.map((option) => ({ ...option, id: `${option.id}-copy-${Date.now()}` })), minSelections: question.minSelections, maxSelections: question.maxSelections, scaleMin: question.scaleMin, scaleMax: question.scaleMax, scaleMinLabel: question.scaleMinLabel, scaleMaxLabel: question.scaleMaxLabel, scaleInitial: question.scaleInitial, scaleShowValue: question.scaleShowValue, requireInteraction: question.requireInteraction },
      ],
    });
  }

  function removeQuestion(id: string) {
    if (!normalized || !window.confirm("Excluir esta pergunta?")) return;
    onChange({
      ...normalized,
      questions: normalized.questions.filter((question) => question.id !== id),
    });
  }

  function updateOption(questionId: string, optionId: string, patch: Partial<SalonInteractiveQuizOption>) {
    if (!normalized) return;
    onChange({
      ...normalized,
      questions: normalized.questions.map((question) =>
        question.id === questionId
          ? { ...question, options: question.options.map((option) => option.id === optionId ? { ...option, ...patch } : option) }
          : question,
      ),
    });
  }

  function moveOption(questionId: string, optionId: string, direction: -1 | 1) {
    if (!normalized) return;
    onChange({
      ...normalized,
      questions: normalized.questions.map((question) => {
        if (question.id !== questionId) return question;
        const options = [...question.options];
        const index = options.findIndex((option) => option.id === optionId);
        const target = index + direction;
        if (index < 0 || target < 0 || target >= options.length) return question;
        const [option] = options.splice(index, 1);
        options.splice(target, 0, option);
        return { ...question, options: options.map((item, order) => ({ ...item, order })) };
      }),
    });
  }

  function addOption(questionId: string) {
    if (!normalized) return;
    onChange({
      ...normalized,
      questions: normalized.questions.map((question) =>
        question.id === questionId
          ? { ...question, options: [...question.options, createInteractiveQuizOption("Nova opcao", question.options.length)] }
          : question,
      ),
    });
  }

  function removeOption(questionId: string, optionId: string) {
    if (!normalized) return;
    onChange({
      ...normalized,
      questions: normalized.questions.map((question) =>
        question.id === questionId
          ? { ...question, options: question.options.filter((option) => option.id !== optionId) }
          : question,
      ),
    });
  }

  return (
    <section className="mt-8 rounded-3xl border border-zinc-200 bg-zinc-50/70 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-teal-800">Premium Editorial 2</p>
          <h3 className="mt-2 text-xl font-semibold text-zinc-950">Teste interativo</h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-600">Configure um questionario opcional para transformar respostas em um lead contextualizado. O sistema nao calcula resultados.</p>
        </div>
        <label className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800">
          <input type="checkbox" checked={Boolean(normalized?.enabled)} onChange={(event) => event.target.checked ? enable() : patchConfig({ enabled: false })} />
          Ativar teste
        </label>
      </div>

      {normalized ? (
        <div className="mt-6 grid gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Etiqueta da secao" value={normalized.introEyebrow} onChange={(value) => patchConfig({ introEyebrow: value })} />
            <Field label="Titulo da secao" value={normalized.title} onChange={(value) => patchConfig({ title: value })} />
            <Field label="Subtitulo" value={normalized.subtitle} onChange={(value) => patchConfig({ subtitle: value })} />
            <TextField label="Texto introdutorio" value={normalized.introText} onChange={(value) => patchConfig({ introText: value })} />
            <Field label="Tempo estimado" value={normalized.estimatedTime} onChange={(value) => patchConfig({ estimatedTime: value })} />
            <Field label="Texto do botao inicial" value={normalized.startButtonLabel} onChange={(value) => patchConfig({ startButtonLabel: value })} />
            <Field label="Titulo do fluxo" value={normalized.flowTitle} onChange={(value) => patchConfig({ flowTitle: value })} />
            <TextField label="Texto antes do contato" value={normalized.contactIntro} onChange={(value) => patchConfig({ contactIntro: value })} />
            <TextField label="Titulo de confirmacao" value={normalized.confirmationTitle} onChange={(value) => patchConfig({ confirmationTitle: value })} />
            <TextField label="Mensagem de confirmacao" value={normalized.confirmationText} onChange={(value) => patchConfig({ confirmationText: value })} />
            <TextField label="Aviso informativo" value={normalized.introNotice} onChange={(value) => patchConfig({ introNotice: value })} />
            <TextField label="Texto do consentimento" value={normalized.consentText} onChange={(value) => patchConfig({ consentText: value })} />
            <Field label="Link de privacidade (opcional)" value={normalized.privacyUrl} onChange={(value) => patchConfig({ privacyUrl: value })} />
            <Field label="Pais padrao (DDI)" value={normalized.defaultCountryCode} onChange={(value) => patchConfig({ defaultCountryCode: value })} />
            <label className="grid gap-2 text-sm font-semibold text-zinc-800">Posicao na landing<select className={inputClass} value={normalized.position} onChange={(event) => patchConfig({ position: event.target.value as SalonInteractiveQuizConfig["position"] })}><option value="after_services">Depois dos servicos</option><option value="after_results">Depois dos resultados</option><option value="before_faq">Antes do FAQ</option><option value="before_cta">Antes do CTA final</option></select></label>
            <label className="flex items-center gap-2 self-end pb-3 text-sm font-semibold text-zinc-800"><input type="checkbox" checked={normalized.contactNameRequired} onChange={(event) => patchConfig({ contactNameRequired: event.target.checked })} /> Nome obrigatorio</label>
            <label className="flex items-center gap-2 self-end pb-3 text-sm font-semibold text-zinc-800"><input type="checkbox" checked={normalized.contactCityEnabled === true} onChange={(event) => patchConfig({ contactCityEnabled: event.target.checked })} /> Capturar cidade</label>
            <label className="flex items-center gap-2 self-end pb-3 text-sm font-semibold text-zinc-800"><input type="checkbox" checked={normalized.contactConsentRequired === true} onChange={(event) => patchConfig({ contactConsentRequired: event.target.checked })} /> Exigir consentimento</label>
            <label className="flex items-center gap-2 self-end pb-3 text-sm font-semibold text-zinc-800"><input type="checkbox" checked={normalized.notificationEnabled === true} onChange={(event) => patchConfig({ notificationEnabled: event.target.checked })} /> Notificacoes por e-mail</label>
            <Field label="E-mail de notificacao" value={normalized.notificationRecipientEmail} onChange={(value) => patchConfig({ notificationRecipientEmail: value })} />
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h4 className="font-semibold text-zinc-950">Perguntas</h4><p className="text-xs text-zinc-500">Uma pergunta por etapa, com IDs estaveis.</p></div>
              <button type="button" onClick={addQuestion} className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white"><Plus className="h-4 w-4" />Adicionar pergunta</button>
            </div>
            <div className="mt-4 grid gap-4">
              {normalized.questions.map((question, index) => (
                <QuestionEditor key={question.id} question={question} index={index} total={normalized.questions.length} onChange={(patch) => updateQuestion(question.id, patch)} onMove={(direction) => moveQuestion(question.id, direction)} onDuplicate={() => duplicateQuestion(question)} onRemove={() => removeQuestion(question.id)} onOptionChange={(optionId, patch) => updateOption(question.id, optionId, patch)} onOptionMove={(optionId, direction) => moveOption(question.id, optionId, direction)} onOptionAdd={() => addOption(question.id)} onOptionRemove={(optionId) => removeOption(question.id, optionId)} />
              ))}
              {!normalized.questions.length ? <p className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500">Adicione a primeira pergunta para ativar o fluxo.</p> : null}
            </div>
          </div>

          <details className="rounded-2xl border border-zinc-200 bg-white p-4">
            <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-zinc-900"><Eye className="h-4 w-4" />Previa rapida</summary>
            <div className="mt-4 rounded-2xl bg-[#f8f5f0] p-5"><p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#9b7353]">{normalized.title}</p><h4 className="mt-2 font-serif text-2xl text-zinc-950">{normalized.subtitle}</h4><p className="mt-3 text-sm leading-6 text-zinc-600">{normalized.introText}</p><button type="button" className="mt-4 rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white">{normalized.startButtonLabel}</button></div>
          </details>
          {salonSlug ? <InteractiveQuizLeads slug={salonSlug} config={normalized} /> : null}
        </div>
      ) : null}
    </section>
  );
}

function QuestionEditor({ question, index, total, onChange, onMove, onDuplicate, onRemove, onOptionChange, onOptionMove, onOptionAdd, onOptionRemove }: { question: SalonInteractiveQuizQuestion; index: number; total: number; onChange: (patch: Partial<SalonInteractiveQuizQuestion>) => void; onMove: (direction: -1 | 1) => void; onDuplicate: () => void; onRemove: () => void; onOptionChange: (optionId: string, patch: Partial<SalonInteractiveQuizOption>) => void; onOptionMove: (optionId: string, direction: -1 | 1) => void; onOptionAdd: () => void; onOptionRemove: (optionId: string) => void }) {
  const isChoice = question.type === "single_choice" || question.type === "multiple_choice";
  return <article className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><span className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Etapa {index + 1}</span><div className="flex items-center gap-1"><button type="button" onClick={() => onMove(-1)} disabled={index === 0} aria-label="Subir pergunta" className="rounded-lg border border-zinc-200 bg-white p-2 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button><button type="button" onClick={() => onMove(1)} disabled={index === total - 1} aria-label="Descer pergunta" className="rounded-lg border border-zinc-200 bg-white p-2 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button><button type="button" onClick={onDuplicate} aria-label="Duplicar pergunta" className="rounded-lg border border-zinc-200 bg-white p-2"><Copy className="h-4 w-4" /></button><button type="button" onClick={onRemove} aria-label="Excluir pergunta" className="rounded-lg border border-rose-200 bg-white p-2 text-rose-700"><Trash2 className="h-4 w-4" /></button></div></div><div className="mt-4 grid gap-3 md:grid-cols-2"><TextField label="Enunciado" value={question.prompt} onChange={(value) => onChange({ prompt: value })} /><Field label="Categoria" value={question.category} onChange={(value) => onChange({ category: value })} /><label className="grid gap-2 text-sm font-semibold text-zinc-800">Tipo<select className={inputClass} value={question.type} onChange={(event) => onChange({ type: event.target.value as SalonInteractiveQuizQuestionType })}>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><Field label="Texto auxiliar (opcional)" value={question.helperText} onChange={(value) => onChange({ helperText: value })} /><Field label="Placeholder (opcional)" value={question.placeholder} onChange={(value) => onChange({ placeholder: value })} /><label className="flex items-center gap-2 self-end pb-3 text-sm font-semibold text-zinc-800"><input type="checkbox" checked={question.required} onChange={(event) => onChange({ required: event.target.checked })} /> Obrigatoria</label></div>{isChoice ? <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-3"><div className="flex items-center justify-between gap-3"><h5 className="text-sm font-semibold">Alternativas</h5><button type="button" onClick={onOptionAdd} className="text-xs font-semibold text-teal-800">Adicionar opcao</button></div><div className="mt-3 grid gap-2">{question.options.map((option, optionIndex) => <div key={option.id} className="flex items-center gap-2"><input className={inputClass} value={option.label} onChange={(event) => onOptionChange(option.id, { label: event.target.value })} /><button type="button" onClick={() => onOptionMove(option.id, -1)} disabled={optionIndex === 0} aria-label="Subir alternativa" className="rounded-lg border border-zinc-200 p-2 disabled:opacity-30"><ArrowUp className="h-3 w-3" /></button><button type="button" onClick={() => onOptionMove(option.id, 1)} disabled={optionIndex === question.options.length - 1} aria-label="Descer alternativa" className="rounded-lg border border-zinc-200 p-2 disabled:opacity-30"><ArrowDown className="h-3 w-3" /></button><button type="button" onClick={() => onOptionRemove(option.id)} aria-label="Excluir alternativa" className="p-2 text-rose-700"><Trash2 className="h-3 w-3" /></button></div>)}</div>{question.type === "multiple_choice" ? <div className="mt-3 grid gap-3 sm:grid-cols-2"><NumberField label="Minimo de escolhas" value={question.minSelections} onChange={(value) => onChange({ minSelections: value })} /><NumberField label="Maximo de escolhas" value={question.maxSelections} onChange={(value) => onChange({ maxSelections: value })} /></div> : null}</div> : null}{question.type === "scale" ? <div className="mt-4 grid gap-3 rounded-xl border border-zinc-200 bg-white p-3 sm:grid-cols-2"><NumberField label="Minimo" value={question.scaleMin} onChange={(value) => onChange({ scaleMin: value })} /><NumberField label="Maximo" value={question.scaleMax} onChange={(value) => onChange({ scaleMax: value })} /><Field label="Rotulo minimo" value={question.scaleMinLabel} onChange={(value) => onChange({ scaleMinLabel: value })} /><Field label="Rotulo maximo" value={question.scaleMaxLabel} onChange={(value) => onChange({ scaleMaxLabel: value })} /><NumberField label="Valor inicial" value={question.scaleInitial} onChange={(value) => onChange({ scaleInitial: value })} /><label className="flex items-center gap-2 self-end pb-3 text-sm font-semibold"><input type="checkbox" checked={question.scaleShowValue !== false} onChange={(event) => onChange({ scaleShowValue: event.target.checked })} /> Mostrar valor</label></div> : null}</article>;
}

function Field({ label, value, onChange }: { label: string; value?: string; onChange: (value: string) => void }) { return <label className="grid gap-2 text-sm font-semibold text-zinc-800"><span>{label}</span><input className={inputClass} value={value ?? ""} onChange={(event) => onChange(event.target.value)} /></label>; }
function TextField({ label, value, onChange }: { label: string; value?: string; onChange: (value: string) => void }) { return <label className="grid gap-2 text-sm font-semibold text-zinc-800"><span>{label}</span><textarea className={`${inputClass} min-h-20 resize-y`} value={value ?? ""} onChange={(event) => onChange(event.target.value)} /></label>; }
function NumberField({ label, value, onChange }: { label: string; value?: number; onChange: (value: number) => void }) { return <label className="grid gap-2 text-sm font-semibold text-zinc-800"><span>{label}</span><input className={inputClass} type="number" value={value ?? ""} onChange={(event) => onChange(Number(event.target.value))} /></label>; }
