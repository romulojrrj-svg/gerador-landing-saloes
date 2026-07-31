import type {
  SalonInteractiveQuizConfig,
  SalonInteractiveQuizOption,
  SalonInteractiveQuizPosition,
  SalonInteractiveQuizQuestion,
  SalonInteractiveQuizQuestionType,
  SalonInteractiveQuizTheme,
} from "@/types/salon";

const QUESTION_TYPES: SalonInteractiveQuizQuestionType[] = [
  "short_text",
  "long_text",
  "single_choice",
  "multiple_choice",
  "scale",
  "yes_no",
];

const POSITIONS: SalonInteractiveQuizPosition[] = [
  "after_services",
  "after_results",
  "before_faq",
  "before_cta",
];

export function createInteractiveQuizConfig(): SalonInteractiveQuizConfig {
  return {
    enabled: true,
    title: "Descubra quais aspectos merecem mais atenção",
    subtitle:
      "Responda algumas perguntas para que eu possa conhecer melhor seu momento e preparar uma orientação personalizada.",
    introText: "Leva aproximadamente 2 minutos.",
    estimatedTime: "2 minutos",
    startButtonLabel: "Começar o teste",
    flowTitle: "Uma conversa sobre o seu momento",
    contactIntro:
      "Informe seus dados para que eu possa analisar suas respostas e entrar em contato com uma orientação personalizada.",
    confirmationTitle: "Recebi suas respostas",
    confirmationText:
      "Vou analisar as informações e entrar em contato pelo WhatsApp informado.",
    consentText:
      "Autorizo o uso das informações enviadas para análise e contato relacionado a este atendimento.",
    privacyUrl: "",
    position: "after_services",
    contactNameRequired: true,
    defaultCountryCode: "+55",
    submitEndpoint: "",
    questions: [],
  };
}

export function createPremiumEditorialV2DefaultQuizConfig(): SalonInteractiveQuizConfig {
  const options = (items: Array<[string, string]>): SalonInteractiveQuizOption[] =>
    items.map(([id, label], order) => ({ id, label, order }));

  return {
    enabled: false,
    introEyebrow: "CONSULTA INTERATIVA",
    introNotice: "Este question\u00e1rio possui car\u00e1ter informativo e n\u00e3o substitui uma avalia\u00e7\u00e3o profissional individual.",
    title: "Conte um pouco sobre seus objetivos",
    subtitle: "Responda algumas perguntas r\u00e1pidas para que eu possa conhecer melhor suas prefer\u00eancias e preparar um atendimento mais personalizado.",
    introText: "Leva aproximadamente 2 minutos.",
    estimatedTime: "2 minutos",
    startButtonLabel: "Come\u00e7ar minha an\u00e1lise",
    flowTitle: "CONHECENDO SEUS OBJETIVOS",
    contactIntro: "Preencha seus dados para que a profissional possa conhecer seus objetivos e entrar em contato.",
    contactSubmitLabel: "Enviar para an\u00e1lise",
    confirmationTitle: "Respostas recebidas!",
    confirmationText: "Obrigada por compartilhar seus objetivos. Suas respostas ser\u00e3o analisadas e o contato ser\u00e1 realizado pelo WhatsApp informado.",
    consentText: "Autorizo o envio das minhas respostas para an\u00e1lise e o contato pelo WhatsApp informado.",
    privacyUrl: "",
    position: "after_services",
    contactNameRequired: true,
    contactCityEnabled: true,
    contactCityRequired: false,
    contactConsentRequired: true,
    defaultCountryCode: "+55",
    submitEndpoint: "",
    notificationEnabled: false,
    notificationRecipientEmail: "",
    hideProgressMeta: true,
    questions: [
      {
        id: "areas-de-interesse",
        category: "SEUS OBJETIVOS",
        type: "multiple_choice",
        prompt: "Quais \u00e1reas ou aspectos voc\u00ea mais gostaria de valorizar?",
        helperText: "Selecione at\u00e9 3 op\u00e7\u00f5es.",
        required: true,
        minSelections: 1,
        maxSelections: 3,
        options: options([
          ["qualidade-pele", "Qualidade, textura e vi\u00e7o da pele"], ["manchas-marcas", "Manchas ou marcas"],
          ["linhas-expressao", "Linhas e sinais de express\u00e3o"], ["olhos-olheiras", "Regi\u00e3o dos olhos e olheiras"],
          ["labios", "L\u00e1bios"], ["contorno-facial", "Contorno facial, queixo ou mand\u00edbula"],
          ["nariz-perfil", "Nariz e perfil"], ["flacidez-facial", "Flacidez facial"],
          ["cuidados-corporais", "Cuidados corporais"], ["ainda-nao-sei", "Ainda n\u00e3o sei exatamente"],
        ]),
      },
      {
        id: "objetivo-principal",
        category: "O QUE VOC\u00ca BUSCA",
        type: "single_choice",
        prompt: "Qual destas op\u00e7\u00f5es representa melhor o que voc\u00ea procura?",
        required: true,
        autoAdvance: true,
        autoAdvanceDelay: 450,
        options: options([
          ["naturalidade", "Real\u00e7ar minha beleza com naturalidade"], ["qualidade-pele", "Melhorar a qualidade e o aspecto da pele"],
          ["suavizar-incomodo", "Suavizar algo que me incomoda"], ["definicao-equilibrio", "Trazer mais defini\u00e7\u00e3o e equil\u00edbrio"],
          ["sinais-tempo", "Prevenir ou suavizar sinais do tempo"], ["conhecer-possibilidades", "Conhecer possibilidades adequadas para mim"],
          ["entendendo", "Ainda estou tentando entender"],
        ]),
      },
      {
        id: "intensidade-mudanca",
        category: "SUA PREFER\u00caNCIA",
        type: "scale",
        prompt: "Quanto voc\u00ea gostaria que uma mudan\u00e7a fosse percept\u00edvel?",
        helperText: "Arraste ou toque para responder.",
        required: true,
        scaleMin: 1,
        scaleMax: 5,
        scaleInitial: 3,
        scaleShowValue: true,
        // The initial scale value is a valid answer. Visitors may keep it
        // without touching the control and continue normally.
        requireInteraction: false,
        scaleMinLabel: "Muito discreta",
        scaleMaxLabel: "Mais percept\u00edvel",
        options: [],
      },
      {
        id: "prazo-interesse",
        category: "SEU MOMENTO",
        type: "single_choice",
        prompt: "Quando voc\u00ea pensa em iniciar um cuidado ou procedimento?",
        required: true,
        autoAdvance: true,
        autoAdvanceDelay: 450,
        options: options([
          ["quanto-antes", "O quanto antes"], ["proximas-semanas", "Nas pr\u00f3ximas semanas"],
          ["proximos-meses", "Nos pr\u00f3ximos 2 ou 3 meses"], ["pesquisando", "Ainda estou pesquisando"], ["sem-data", "N\u00e3o tenho uma data definida"],
        ]),
      },
      {
        id: "criterios-escolha",
        category: "O QUE VOC\u00ca VALORIZA",
        type: "multiple_choice",
        prompt: "O que \u00e9 mais importante para voc\u00ea ao escolher uma profissional?",
        helperText: "Selecione at\u00e9 3 op\u00e7\u00f5es.",
        required: true,
        minSelections: 1,
        maxSelections: 3,
        options: options([
          ["naturalidade", "Naturalidade dos resultados"], ["seguranca", "Seguran\u00e7a"], ["atendimento-individualizado", "Atendimento individualizado"],
          ["formacao-experiencia", "Forma\u00e7\u00e3o e experi\u00eancia profissional"], ["explicacoes-claras", "Explica\u00e7\u00f5es claras"],
          ["acompanhamento", "Acompanhamento ap\u00f3s o atendimento"], ["recuperacao", "Recupera\u00e7\u00e3o tranquila"],
          ["durabilidade", "Durabilidade dos resultados"], ["pagamento", "Condi\u00e7\u00f5es e formas de pagamento"],
        ]),
      },
      {
        id: "principal-duvida",
        category: "SUAS D\u00daVIDAS",
        type: "single_choice",
        prompt: "O que mais gera d\u00favida ou inseguran\u00e7a antes de iniciar um atendimento?",
        required: true,
        autoAdvance: true,
        autoAdvanceDelay: 450,
        options: options([
          ["cuidado-adequado", "N\u00e3o saber qual cuidado \u00e9 mais adequado"], ["resultado-artificial", "Receio de um resultado artificial"],
          ["seguranca", "Seguran\u00e7a do procedimento"], ["recuperacao", "Desconforto ou recupera\u00e7\u00e3o"],
          ["duracao", "Tempo de dura\u00e7\u00e3o do resultado"], ["investimento", "Valor do investimento"],
          ["primeira-vez", "Nunca realizei e n\u00e3o sei como funciona"], ["nenhuma", "N\u00e3o tenho uma preocupa\u00e7\u00e3o espec\u00edfica"],
        ]),
      },
      {
        id: "relato-livre",
        category: "CONTE COM SUAS PALAVRAS",
        type: "long_text",
        prompt: "H\u00e1 algo espec\u00edfico que voc\u00ea gostaria de melhorar, valorizar ou compreender melhor?",
        helperText: "Esta resposta \u00e9 opcional.",
        placeholder: "Conte um pouco sobre o que voc\u00ea busca. N\u00e3o precisa escrever muito.",
        required: false,
        maxLength: 500,
        showCharacterCount: true,
        autoGrow: true,
        options: [],
      },
    ],
  };
}

export function createInteractiveQuizQuestion(
  type: SalonInteractiveQuizQuestionType = "short_text",
  index = 0,
): SalonInteractiveQuizQuestion {
  const id = createStableId("quiz-question");
  const options = type === "single_choice" || type === "multiple_choice"
    ? [
        createInteractiveQuizOption("Opção 1", 0),
        createInteractiveQuizOption("Opção 2", 1),
      ]
    : [];

  return {
    id,
    type,
    prompt: `Pergunta ${index + 1}`,
    helperText: "",
    required: true,
    options,
    minSelections: type === "multiple_choice" ? 1 : undefined,
    maxSelections: undefined,
    scaleMin: 1,
    scaleMax: 5,
    scaleMinLabel: "Muito pouco",
    scaleMaxLabel: "Muito",
    scaleInitial: 3,
    scaleShowValue: true,
    requireInteraction: true,
  };
}

export function createInteractiveQuizOption(
  label = "Nova opção",
  order = 0,
): SalonInteractiveQuizOption {
  return {
    id: createStableId("quiz-option"),
    label,
    order,
  };
}

export function normalizeInteractiveQuizConfig(
  value: unknown,
): SalonInteractiveQuizConfig | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const input = value as Partial<SalonInteractiveQuizConfig>;
  const defaults = createInteractiveQuizConfig();
  const questions = Array.isArray(input.questions)
    ? input.questions
        .map((question, index) => normalizeQuestion(question, index))
        .filter((question): question is SalonInteractiveQuizQuestion => Boolean(question))
    : [];

  return {
    ...defaults,
    enabled: input.enabled === true,
    introEyebrow: stringValue(input.introEyebrow, defaults.introEyebrow ?? "TESTE INTERATIVO"),
    introNotice: stringValue(input.introNotice, defaults.introNotice ?? ""),
    title: stringValue(input.title, defaults.title),
    subtitle: stringValue(input.subtitle, defaults.subtitle),
    introText: stringValue(input.introText, defaults.introText),
    estimatedTime: stringValue(input.estimatedTime, defaults.estimatedTime),
    startButtonLabel: stringValue(input.startButtonLabel, defaults.startButtonLabel),
    flowTitle: stringValue(input.flowTitle, defaults.flowTitle),
    contactIntro: stringValue(input.contactIntro, defaults.contactIntro),
    contactSubmitLabel: typeof input.contactSubmitLabel === "string" ? input.contactSubmitLabel : undefined,
    confirmationTitle: stringValue(input.confirmationTitle, defaults.confirmationTitle),
    confirmationText: stringValue(input.confirmationText, defaults.confirmationText),
    consentText: stringValue(input.consentText, defaults.consentText),
    contactCityEnabled: input.contactCityEnabled === true,
    contactCityRequired: input.contactCityRequired === true,
    contactConsentRequired: input.contactConsentRequired === true,
    notificationEnabled: input.notificationEnabled === true,
    notificationRecipientEmail: stringValue(input.notificationRecipientEmail, ""),
    hideProgressMeta: input.hideProgressMeta === true,
    privacyUrl: stringValue(input.privacyUrl, ""),
    position: POSITIONS.includes(input.position as SalonInteractiveQuizPosition)
      ? (input.position as SalonInteractiveQuizPosition)
      : defaults.position,
    contactNameRequired: input.contactNameRequired !== false,
    defaultCountryCode: normalizeCountryCode(
      stringValue(input.defaultCountryCode, defaults.defaultCountryCode),
    ),
    submitEndpoint: stringValue(input.submitEndpoint, ""),
    quizTheme: normalizeQuizTheme(input.quizTheme),
    questions,
  };
}

function normalizeQuizTheme(value: unknown): SalonInteractiveQuizTheme | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const input = value as SalonInteractiveQuizTheme;
  const mode = input.mode === "custom" ? "custom" : "inherit";
  const color = (candidate: unknown) => typeof candidate === "string" && candidate.trim().length > 0 ? candidate.trim() : undefined;
  return {
    mode,
    primary: color(input.primary),
    accent: color(input.accent),
    background: color(input.background),
    surface: color(input.surface),
    text: color(input.text),
  };
}

function normalizeQuestion(
  value: unknown,
  index: number,
): SalonInteractiveQuizQuestion | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const input = value as Partial<SalonInteractiveQuizQuestion>;
  const type = QUESTION_TYPES.includes(input.type as SalonInteractiveQuizQuestionType)
    ? (input.type as SalonInteractiveQuizQuestionType)
    : "short_text";
  const options = Array.isArray(input.options)
    ? input.options
        .map((option, optionIndex) => normalizeOption(option, optionIndex))
        .filter((option): option is SalonInteractiveQuizOption => Boolean(option))
    : [];
  const scaleMin = integerOr(input.scaleMin, 1);
  const scaleMax = Math.max(scaleMin + 1, integerOr(input.scaleMax, 5));
  const scaleInitial = clamp(integerOr(input.scaleInitial, 3), scaleMin, scaleMax);

  return {
    id: stringValue(input.id, `quiz-question-${index + 1}`),
    type,
    category: stringValue(input.category, ""),
    prompt: stringValue(input.prompt, `Pergunta ${index + 1}`),
    helperText: stringValue(input.helperText, ""),
    placeholder: stringValue(input.placeholder, ""),
    maxLength: input.maxLength == null ? undefined : Math.max(1, integerOr(input.maxLength, 500)),
    showCharacterCount: input.showCharacterCount === true,
    autoGrow: input.autoGrow === true,
    autoAdvance: input.autoAdvance === true,
    autoAdvanceDelay: input.autoAdvanceDelay == null ? undefined : Math.max(0, integerOr(input.autoAdvanceDelay, 450)),
    required: input.required !== false,
    options,
    minSelections: input.minSelections == null
      ? type === "multiple_choice"
        ? 1
        : undefined
      : Math.max(0, integerOr(input.minSelections, 0)),
    maxSelections: input.maxSelections == null
      ? undefined
      : Math.max(1, integerOr(input.maxSelections, 1)),
    scaleMin,
    scaleMax,
    scaleMinLabel: stringValue(input.scaleMinLabel, "Muito pouco"),
    scaleMaxLabel: stringValue(input.scaleMaxLabel, "Muito"),
    scaleInitial,
    scaleShowValue: input.scaleShowValue !== false,
    requireInteraction: input.requireInteraction !== false,
  };
}

function normalizeOption(
  value: unknown,
  index: number,
): SalonInteractiveQuizOption | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const input = value as Partial<SalonInteractiveQuizOption>;

  return {
    id: stringValue(input.id, `quiz-option-${index + 1}`),
    label: stringValue(input.label, `Opção ${index + 1}`),
    order: index,
  };
}

function stringValue(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function integerOr(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.round(value)
    : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeCountryCode(value: string) {
  const digits = value.replace(/[^0-9]/g, "");
  return digits ? `+${digits}` : "+55";
}

function createStableId(prefix: string) {
  const uuid = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  return `${prefix}-${uuid}`;
}
