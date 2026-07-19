import type { FinanceState } from '../types/finance';
import { formatMoney, getCategoryLabel } from './categories';
import {
  buildCoachSnapshot,
  formatSnapshotForPrompt,
  type CoachSnapshot,
} from './coachAnalysis';
import { daysUntil, nextDueDate } from './fixedExpenses';
import { clampBonusPercent } from './saturdayBonus';
import { getOpenAiKey } from './storage';

const MODELS = ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'] as const;

export type CoachOptions = {
  saturdayBonusPercent?: number;
  saturdayBonusEnabled?: boolean;
};

type CoachIntent =
  | 'greeting'
  | 'help'
  | 'howto'
  | 'concepts'
  | 'diagnosis'
  | 'spending'
  | 'goals'
  | 'plan'
  | 'save_how_much'
  | 'ahorro'
  | 'bonus'
  | 'income'
  | 'fixed'
  | 'month'
  | 'thanks'
  | 'fallback';

export function sanitizeApiKey(raw: string): string {
  return raw
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\s+/g, '')
    .replace(/^Bearer/i, '');
}

function normalizeMsg(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[¿?¡!.,;:()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasAny(msg: string, words: string[]): boolean {
  return words.some((w) => msg.includes(w));
}

function scorePatterns(msg: string, patterns: string[]): number {
  let score = 0;
  for (const p of patterns) {
    if (msg.includes(p)) score += p.length >= 6 ? 3 : 2;
  }
  return score;
}

/** Detecta la intención de preguntas típicas del coach (sin OpenAI). */
export function detectCoachIntent(userMessage: string): CoachIntent {
  const msg = normalizeMsg(userMessage);
  if (!msg) return 'fallback';

  const scores: Record<CoachIntent, number> = {
    greeting: 0,
    help: 0,
    howto: 0,
    concepts: 0,
    diagnosis: 0,
    spending: 0,
    goals: 0,
    plan: 0,
    save_how_much: 0,
    ahorro: 0,
    bonus: 0,
    income: 0,
    fixed: 0,
    month: 0,
    thanks: 0,
    fallback: 0,
  };

  scores.greeting += scorePatterns(msg, [
    'hola',
    'buenas',
    'buen dia',
    'buenos dias',
    'hey',
    'que tal',
    'como estas',
  ]);
  scores.thanks += scorePatterns(msg, [
    'gracias',
    'thank',
    'perfecto',
    'genial',
    'dale gracias',
  ]);
  scores.help += scorePatterns(msg, [
    'ayuda',
    'ayudame',
    'que podes',
    'que puedes',
    'que haces',
    'para que servis',
    'opciones',
    'menu',
  ]);
  scores.howto += scorePatterns(msg, [
    'como uso',
    'como se usa',
    'como funciona la app',
    'tutorial',
    'empezar',
    'por donde empiezo',
    'primeros pasos',
  ]);
  scores.concepts += scorePatterns(msg, [
    'que es libre',
    'que es el libre',
    'que significa libre',
    'que es ahorro',
    'que es el ahorro',
    'que es una meta',
    'que es el bono',
    'que es bono',
    'explicame libre',
    'explicame ahorro',
    'explicame',
  ]);
  if (
    (msg.includes('que es') || msg.includes('que significa') || msg.includes('explic')) &&
    (msg.includes('libre') || msg.includes('ahorro') || msg.includes('meta') || msg.includes('bono'))
  ) {
    scores.concepts += 4;
  }
  scores.diagnosis += scorePatterns(msg, [
    'diagnost',
    'como voy',
    'como ando',
    'resumen',
    'situacion',
    'balance',
    'estado',
    'salud financiera',
  ]);
  if (msg === 'hoy' || msg.startsWith('hoy ') || msg.endsWith(' hoy')) {
    scores.diagnosis += 3;
  }
  if (msg.includes('libre') && !msg.includes('que es libre')) {
    scores.diagnosis += 2;
  }
  scores.spending += scorePatterns(msg, [
    'gasto',
    'gastos',
    'gastando',
    'comida',
    'gasolina',
    'transporte',
    'categoria',
    'categorias',
    'donde se me va',
    'donde se va',
    'en que se me va',
    'fuga',
    'mas plata',
    'mas dinero',
  ]);
  scores.goals += scorePatterns(msg, [
    'meta',
    'metas',
    'objetivo',
    'ahorrar para',
    'llegar a',
    'llegar mas rapido',
    'cumplir',
  ]);
  scores.plan += scorePatterns(msg, [
    'plan',
    'pasos',
    'consejo',
    'consejos',
    'tip',
    'tips',
    'recomend',
    'que hago',
    'que deberia',
    'estrategia',
  ]);
  scores.save_how_much += scorePatterns(msg, [
    'cuanto apart',
    'cuanto deberia apart',
    'cuanto ahorr',
    'cuanto puedo ahorr',
    'cuanto me conviene apart',
    'porcentaje',
    'regla del',
  ]);
  scores.ahorro += scorePatterns(msg, [
    'efectivo',
    'bolsillo',
    'cash',
    'pestaña ahorro',
    'en ahorro',
    'mi ahorro',
    'tengo en ahorro',
  ]);
  // "ahora" era el nombre viejo de la pestaña
  if (/\bahora\b/.test(msg) && !msg.includes('ahorrar')) scores.ahorro += 3;
  if (msg.includes('ahorro') && !msg.includes('ahorrar') && !msg.includes('ahorro para')) {
    scores.ahorro += 3;
  }
  scores.bonus += scorePatterns(msg, [
    'bono',
    'bonus',
    'sabado',
    'bono del sabado',
    'porcentaje del sabado',
  ]);
  scores.income += scorePatterns(msg, [
    'ingreso',
    'ingresos',
    'sueldo',
    'salario',
    'cobre',
    'cobrar',
    'cobro',
    'gane',
    'ganar',
    'plata que entra',
  ]);
  scores.fixed += scorePatterns(msg, [
    'fijo',
    'fijos',
    'renta',
    'alquiler',
    'luz',
    'agua',
    'internet',
    'factura',
    'facturas',
    'vencimiento',
    'cuenta a pagar',
    'pago fijo',
  ]);
  scores.month += scorePatterns(msg, [
    'mes',
    'mensual',
    'este mes',
    'del mes',
  ]);

  let best: CoachIntent = 'fallback';
  let bestScore = 0;
  (Object.keys(scores) as CoachIntent[]).forEach((intent) => {
    if (intent === 'fallback') return;
    if (scores[intent] > bestScore) {
      bestScore = scores[intent];
      best = intent;
    }
  });
  return bestScore >= 2 ? best : 'fallback';
}

function recommendedSave(s: CoachSnapshot, percent: number): number {
  if (s.weekLibre <= 0) return 0;
  const fromLibre = s.weekLibre * (clampBonusPercent(percent) / 100);
  const fromIncome = s.weekIngreso > 0 ? s.weekIngreso * 0.1 : 0;
  return Math.round(Math.max(fromLibre, fromIncome) * 100) / 100;
}

function goalPlan(s: CoachSnapshot, percent: number): string {
  const pct = clampBonusPercent(percent);
  if (s.goals.length === 0) {
    return `No tenés metas todavía. Creá una concreta (ej: emergencia de 1 mes de gastos o un viaje con monto). Con tu libre semanal, apartar ~${pct}% ya te arma el hábito.`;
  }
  const g = s.goals[0];
  const left = Math.max(g.targetAmount - g.currentAmount, 0);
  const weeklySave = recommendedSave(s, pct);
  if (left <= 0) {
    return `Tu meta "${g.name}" ya está cubierta. Podés crear otra o subir el monto objetivo.`;
  }
  if (weeklySave <= 0) {
    return `Para "${g.name}" te faltan ${formatMoney(left)}, pero esta semana el libre está en ${formatMoney(s.weekLibre)}. Primero estabilizá gastos (empezá por ${s.topWeekExpenses[0]?.label ?? 'la categoría más alta'}) y después volvé a aportar.`;
  }
  const weeks = Math.ceil(left / weeklySave);
  return `Meta "${g.name}": llevás ${formatMoney(g.currentAmount)} de ${formatMoney(g.targetAmount)} (faltan ${formatMoney(left)}). Si apartás ~${formatMoney(weeklySave)}/semana (~${pct}% de tu libre), llegás en unas ${weeks} semana(s). Tip: el sábado ese % puede sumarse solo en Ahorro; después lo movés a la meta.`;
}

function spendingAdvice(s: CoachSnapshot): string {
  const top = s.topWeekExpenses[0];
  if (!top) {
    return 'Esta semana casi no hay gastos cargados. Registrá comida, gasolina y transporte apenas pasen: sin eso el coach adivina mal.';
  }
  const cut = Math.round(top.amount * 0.15 * 100) / 100;
  const lines = [
    `Tu mayor gasto de la semana es ${top.label}: ${formatMoney(top.amount)} (${top.share.toFixed(0)}% de lo que salió).`,
    `Si lo bajás un 15% (~${formatMoney(cut)}), tu libre semanal pasaría a ~${formatMoney(s.weekLibre + cut)}.`,
  ];
  if (s.topWeekExpenses[1]) {
    lines.push(
      `Segundo foco: ${s.topWeekExpenses[1].label} (${formatMoney(s.topWeekExpenses[1].amount)}).`
    );
  }
  if (s.biggestExpense) {
    lines.push(
      `El gasto más grande suelto fue ${getCategoryLabel('gasto', s.biggestExpense.category)} por ${formatMoney(s.biggestExpense.amount)}${s.biggestExpense.note ? ` (${s.biggestExpense.note})` : ''}.`
    );
  }
  if (s.avgDailySpendWeek > 0) {
    lines.push(
      `Vas a un ritmo de ~${formatMoney(s.avgDailySpendWeek)}/día. Poné un tope un poco menor y miralo al final del día.`
    );
  }
  return lines.join(' ');
}

function weekHealth(
  s: CoachSnapshot,
  percent: number,
  bonusEnabled: boolean
): string {
  const pct = clampBonusPercent(percent);
  const delta = s.weekLibre - s.prevWeekLibre;
  let compare = 'parecida a la anterior';
  if (delta > 0) compare = `mejor que la pasada (+${formatMoney(delta)})`;
  else if (delta < 0) compare = `más justa que la pasada (${formatMoney(delta)})`;

  let verdict = 'vas equilibrado';
  if (s.weekLibre < 0) {
    verdict = 'esta semana estás en rojo: los gastos superan a los ingresos';
  } else if (s.savingsRateWeek >= 20) {
    verdict = 'muy bien: estás dejando más del 20% libre';
  } else if (s.savingsRateWeek >= 10) {
    verdict = 'aceptable, pero se puede apretar un poco más';
  } else if (s.weekIngreso > 0) {
    verdict = 'el margen es chico: casi todo lo que entra se va';
  }

  const bonusLine = !bonusEnabled
    ? 'El bono del sábado está apagado en Ajustes/Ahorro.'
    : s.saturdayBonus > 0
      ? `Bono sábado estimado (${pct}%): +${formatMoney(s.saturdayBonus)} a Ahorro${s.bonusAlreadyApplied ? ' (ya aplicado)' : ''}.`
      : `Si cerrás la semana con libre positivo, el sábado se suma el ${pct}% a Ahorro.`;

  return [
    `Semana: ingresos ${formatMoney(s.weekIngreso)}, gastos ${formatMoney(s.weekGasto)}, libre ${formatMoney(s.weekLibre)} (${s.savingsRateWeek.toFixed(0)}% de lo que entró).`,
    `Hoy libre ${formatMoney(s.dayLibre)}. En Ahorro tenés ${formatMoney(s.cashNow)}.`,
    `La semana viene ${compare}. En resumen, ${verdict}.`,
    bonusLine,
  ].join(' ');
}

function actionPlan(s: CoachSnapshot, percent: number): string {
  const save = recommendedSave(s, percent);
  const actions: string[] = [];
  if (s.weekLibre < 0) {
    actions.push(
      `1) Congelá ocio/compras 48h y revisá ${s.topWeekExpenses[0]?.label ?? 'gastos'} hoy.`
    );
    actions.push('2) Cargá todo lo pendiente para no engañarte con el libre.');
    actions.push(
      '3) El próximo ingreso, primero cubrí lo esencial y después el resto.'
    );
  } else {
    actions.push(
      `1) Tope esta semana en ${s.topWeekExpenses[0]?.label ?? 'gastos variables'}: no pases de ${formatMoney(
        (s.topWeekExpenses[0]?.amount ?? s.weekGasto) * 0.85
      )}.`
    );
    actions.push(
      save > 0
        ? `2) Apartá ${formatMoney(save)} hacia tu meta o dejalo que el sábado vaya a Ahorro.`
        : '2) Esta semana el libre está justo: priorizá no sumar gastos nuevos.'
    );
    actions.push(
      '3) Anotá cada gasto con nota corta (dónde/en qué) para afinar el coach.'
    );
  }
  return `Plan concreto:\n${actions.join('\n')}`;
}

function fixedAdvice(state: FinanceState): string {
  const active = state.fixedExpenses.filter((f) => f.enabled);
  if (active.length === 0) {
    return 'No tenés gastos fijos cargados. En la pestaña Fijos agregá renta, luz, agua, internet… Tocá Pagar cuando los pagues y, si querés, activá los avisos con el switch.';
  }
  const upcoming = active
    .map((f) => {
      const due = nextDueDate(f.dueDay);
      return { f, due, days: daysUntil(due) };
    })
    .sort((a, b) => a.days - b.days);

  const soon = upcoming.filter((u) => u.days <= 7);
  const totalMonth = active.reduce((sum, f) => sum + f.amount, 0);
  const lines = [
    `Tenés ${active.length} fijo(s) activos · ~${formatMoney(totalMonth)}/mes.`,
  ];
  if (soon.length > 0) {
    lines.push(
      'Próximos 7 días: ' +
        soon
          .slice(0, 4)
          .map((u) => {
            const when =
              u.days === 0
                ? 'hoy'
                : u.days === 1
                  ? 'mañana'
                  : `en ${u.days} días`;
            return `${u.f.name} ${formatMoney(u.f.amount)} (${when})`;
          })
          .join(' · ')
    );
  } else {
    const next = upcoming[0];
    lines.push(
      `El más cercano es ${next.f.name} (${formatMoney(next.f.amount)}) en ${next.days} día(s).`
    );
  }
  lines.push(
    'Tip: dejá ese monto aparte en Ahorro antes del vencimiento para no comerse el libre de la semana.'
  );
  return lines.join(' ');
}

function conceptsGuide(): string {
  return [
    'Conceptos clave de la app:',
    '• Libre = ingresos − gastos (del día/semana/mes). Es tu margen real.',
    '• Ahorro = plata que apartás a mano (efectivo/colchón). El sábado puede sumar un % del libre.',
    '• Metas = objetivos con monto (viaje, emergencia…). Les aportás desde tu margen.',
    '• Fijos = cuentas recurrentes con día de pago y avisos.',
    'Preguntame cosas como: “¿cómo voy?”, “¿dónde se me va la plata?”, “¿cuánto aparto?”, “revisá mis fijos”.',
  ].join('\n');
}

function howtoGuide(): string {
  return [
    'Para que el coach te oriente bien:',
    '1) En Movimientos cargá tus ingresos (giro) y gastos con categoría.',
    '2) En Fijos cargá renta/servicios y tocá Pagar cuando corresponda.',
    '3) En Ahorro mirá tu colchón y el bono del sábado (podés cambiar el %).',
    '4) En Metas poné un objetivo concreto y aportale cuando puedas.',
    '5) Volvé al Coach y pedime un diagnóstico o un plan de 3 pasos.',
  ].join('\n');
}

function emptyHistoryReply(intent: CoachIntent): string {
  if (intent === 'greeting') {
    return '¡Hola! Soy tu coach de finanzas. Todavía no hay movimientos cargados. Empezá con un ingreso y 2–3 gastos de la semana y después pedime un diagnóstico.';
  }
  if (intent === 'howto' || intent === 'help' || intent === 'concepts') {
    return `${howtoGuide()}\n\n${conceptsGuide()}`;
  }
  return 'Todavía no hay historial. Cargá al menos: un ingreso de la semana y 2–3 gastos con categoría y nota. Con eso te armo diagnóstico (dónde se va la plata, cuánto te queda y un plan de 3 pasos).';
}

function localCoachReply(
  state: FinanceState,
  userMessage: string,
  options: CoachOptions = {}
): string {
  const percent = clampBonusPercent(options.saturdayBonusPercent ?? 20);
  const bonusEnabled = options.saturdayBonusEnabled !== false;
  const intent = detectCoachIntent(userMessage);
  const s = buildCoachSnapshot(state, percent);

  if (intent === 'greeting') {
    if (state.transactions.length === 0) return emptyHistoryReply(intent);
    return `¡Hola! Con lo que cargaste esta semana: libre ${formatMoney(s.weekLibre)}, en Ahorro ${formatMoney(s.cashNow)}. Pedime un diagnóstico, dónde se te va la plata, un plan, o revisemos fijos/metas.`;
  }
  if (intent === 'thanks') {
    return 'De nada. Cuando cargues más movimientos o quieras ajustar el plan, avisame.';
  }
  if (intent === 'help') {
    return [
      'Puedo ayudarte sin OpenAI con tu historial real:',
      '• Diagnóstico de la semana / mes',
      '• Dónde se te va más la plata',
      '• Cuánto apartar y plan de 3 pasos',
      '• Metas, Ahorro, bono del sábado y fijos',
      '• Explicarte libre, Ahorro y cómo usar la app',
      '',
      'Probá: “Dame un diagnóstico”, “¿Dónde se me va más la plata?”, “¿Cuánto debería apartar?”.',
    ].join('\n');
  }
  if (intent === 'howto') return howtoGuide();
  if (intent === 'concepts') return conceptsGuide();

  if (state.transactions.length === 0) {
    return emptyHistoryReply(intent);
  }

  switch (intent) {
    case 'goals':
      return `${goalPlan(s, percent)}\n\n${actionPlan(s, percent)}`;
    case 'spending':
      return `${spendingAdvice(s)}\n\nMes: gastos ${formatMoney(s.monthGasto)}, libre ${formatMoney(s.monthLibre)}.\n\n${actionPlan(s, percent)}`;
    case 'plan':
      return `${weekHealth(s, percent, bonusEnabled)}\n\n${spendingAdvice(s)}\n\n${actionPlan(s, percent)}`;
    case 'save_how_much': {
      const save = recommendedSave(s, percent);
      if (s.weekLibre <= 0) {
        return `Esta semana el libre está en ${formatMoney(s.weekLibre)}, así que no conviene apartar ahora. Primero bajá ${s.topWeekExpenses[0]?.label ?? 'gastos'} y cargá todo. Cuando vuelva el margen, apuntá a ~${percent}% del libre.`;
      }
      return [
        `Te conviene apartar ~${formatMoney(save)} esta semana (~${percent}% de tu libre de ${formatMoney(s.weekLibre)}).`,
        s.goals[0]
          ? `Si eso va a "${s.goals[0].name}", acelerás la meta sin dejar el bolsillo en cero.`
          : 'Si no tenés meta, dejalo en Ahorro como colchón.',
        bonusEnabled
          ? `El sábado, si el bono está activo, se puede sumar solo ese ${percent}% a Ahorro.`
          : 'El bono del sábado está apagado; podés activarlo en Ahorro.',
        '',
        actionPlan(s, percent),
      ].join('\n');
    }
    case 'ahorro':
      return [
        `En Ahorro tenés ${formatMoney(s.cashNow)}.`,
        bonusEnabled
          ? `Bono del sábado (${percent}% del libre): ${formatMoney(s.saturdayBonus)} sobre un libre de ${formatMoney(s.weekLibreForBonus)}${s.bonusAlreadyApplied ? ' · ya aplicado esta semana' : ' · se aplica al abrir la app sábado/domingo'}.`
          : 'El bono del sábado está apagado; en Ahorro podés activarlo y elegir el %.',
        'Usá ese colchón para meta o imprevistos, no para gasto chico del día a día.',
      ].join(' ');
    case 'bonus':
      if (!bonusEnabled) {
        return 'El bono del sábado está apagado. En Ahorro podés activarlo y elegir qué % del libre semanal se suma solo.';
      }
      return [
        `Bono del sábado: ${percent}% del libre semanal.`,
        `Libre base: ${formatMoney(s.weekLibreForBonus)} → bono estimado ${formatMoney(s.saturdayBonus)}.`,
        s.bonusAlreadyApplied
          ? 'Esta semana ya se aplicó.'
          : 'Se aplica al abrir la app el sábado o domingo.',
        `Ahora en Ahorro tenés ${formatMoney(s.cashNow)}.`,
      ].join(' ');
    case 'income': {
      const top = s.biggestIncome;
      return [
        `Esta semana entraron ${formatMoney(s.weekIngreso)}${
          top
            ? `, el más alto fue ${getCategoryLabel('giro', top.category)} por ${formatMoney(top.amount)}`
            : ''
        }.`,
        `Después de gastos te quedan ${formatMoney(s.weekLibre)} libres (${s.savingsRateWeek.toFixed(0)}%).`,
        s.weekLibre > 0
          ? `Regla simple: del próximo ingreso, primero apartá ${formatMoney(recommendedSave(s, percent))} y con el resto viví la semana.`
          : 'Con margen negativo, el próximo ingreso primero tapa huecos y recién después gasto flexible.',
      ].join(' ');
    }
    case 'fixed':
      return `${fixedAdvice(state)}\n\nLibre de esta semana: ${formatMoney(s.weekLibre)}. En Ahorro: ${formatMoney(s.cashNow)}.`;
    case 'month':
      return [
        `Mes: ingresos ${formatMoney(s.monthIngreso)}, gastos ${formatMoney(s.monthGasto)}, libre ${formatMoney(s.monthLibre)}.`,
        s.topMonthExpenses[0]
          ? `Donde más se te va en el mes: ${s.topMonthExpenses[0].label} (${formatMoney(s.topMonthExpenses[0].amount)}, ${s.topMonthExpenses[0].share.toFixed(0)}%).`
          : 'Todavía faltan gastos del mes para ver el ranking.',
        '',
        weekHealth(s, percent, bonusEnabled),
        '',
        actionPlan(s, percent),
      ].join('\n');
    case 'diagnosis':
      return `${weekHealth(s, percent, bonusEnabled)}\n\n${spendingAdvice(s)}`;
    case 'fallback':
    default:
      return `${weekHealth(s, percent, bonusEnabled)}\n\n${spendingAdvice(s)}\n\n${goalPlan(s, percent)}\n\n${actionPlan(s, percent)}`;
  }
}

function explainOpenAiError(status: number, body: string): string {
  let code = '';
  let message = '';
  try {
    const parsed = JSON.parse(body) as {
      error?: { code?: string; message?: string; type?: string };
    };
    code = parsed.error?.code ?? parsed.error?.type ?? '';
    message = parsed.error?.message ?? '';
  } catch {
    message = body.slice(0, 180);
  }

  if (status === 401 || code === 'invalid_api_key') {
    return 'La API key no es válida o está mal pegada. Generá una nueva en platform.openai.com/api-keys, copiala completa (empieza con sk-) y guardala de nuevo en Ajustes.';
  }
  if (status === 429 || code === 'insufficient_quota' || /quota|billing|credit/i.test(message)) {
    return 'Tu cuenta de OpenAI no tiene crédito/quota para la API (es distinto de ChatGPT Plus). Cargá crédito en platform.openai.com/settings/organization/billing y volvé a intentar.';
  }
  if (status === 403) {
    return 'OpenAI rechazó el acceso (403). Revisá que la key tenga permiso de usar Chat Completions y que tu organización esté activa.';
  }
  if (status === 404 || /model/i.test(message)) {
    return 'El modelo no está disponible para tu cuenta. Probá de nuevo: la app intentará otro modelo.';
  }
  if (!status && /network|fetch|Failed/i.test(message)) {
    return 'No hubo conexión con OpenAI. Revisá el Wi‑Fi/datos e intentá otra vez.';
  }
  return message
    ? `OpenAI respondió ${status || 'error'}: ${message}`
    : `OpenAI respondió error ${status || 'desconocido'}.`;
}

async function callOpenAi(
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[]
): Promise<{ ok: true; content: string } | { ok: false; status: number; body: string }> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.55,
      messages,
    }),
  });

  const body = await res.text();
  if (!res.ok) return { ok: false, status: res.status, body };

  try {
    const data = JSON.parse(body) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content?.trim() ?? '';
    if (!content) return { ok: false, status: 500, body: 'Respuesta vacía' };
    return { ok: true, content };
  } catch {
    return { ok: false, status: 500, body };
  }
}

async function openAiReply(
  state: FinanceState,
  userMessage: string,
  apiKey: string
): Promise<string> {
  const snapshot = buildCoachSnapshot(state);
  const context = formatSnapshotForPrompt(snapshot);
  const history = state.chatHistory
    .slice(-10)
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role,
      content: m.content,
    }));

  const messages = [
    {
      role: 'system',
      content: `Sos "Coach Finanzas", un asesor de dinero personal práctico y cercano (español rioplatense). 

Tu estilo:
- Usá SOLO las cifras del contexto. Nunca inventes montos.
- Respondé con diagnóstico + 2 o 3 acciones concretas y medibles (montos, categorías, plazos).
- Sé humano, claro y directo. Evitá frases genéricas tipo "ahorra más".
- Si faltan datos, pedí exactamente qué registrar.
- Tené en cuenta: libre = ingresos − gastos; pestaña Ahorro = efectivo manual; los sábados se suma un % del libre semanal a Ahorro; las metas se alimentan con ese margen.
- Longitud: 140–220 palabras. Podés usar viñetas cortas.

Contexto del usuario:
${context}`,
    },
    ...history,
    { role: 'user', content: userMessage },
  ];

  let lastError = { status: 0, body: 'Sin respuesta' };
  for (const model of MODELS) {
    const result = await callOpenAi(apiKey, model, messages);
    if (result.ok) return result.content;
    lastError = { status: result.status, body: result.body };
    // Si la key es inválida o no hay crédito, no sirve probar otros modelos
    if (result.status === 401 || result.status === 429 || result.status === 403) {
      break;
    }
  }

  throw new Error(explainOpenAiError(lastError.status, lastError.body));
}

export async function testOpenAiKey(
  rawKey: string
): Promise<{ ok: boolean; message: string }> {
  const apiKey = sanitizeApiKey(rawKey);
  if (!apiKey) {
    return { ok: false, message: 'Pegá una API key primero.' };
  }
  if (!apiKey.startsWith('sk-')) {
    return {
      ok: false,
      message: 'La clave debería empezar con sk-. Revisá que hayas copiado la API key completa.',
    };
  }

  try {
    const result = await callOpenAi(apiKey, 'gpt-4o-mini', [
      {
        role: 'user',
        content: 'Responde solo: OK',
      },
    ]);
    if (result.ok) {
      return { ok: true, message: 'Conexión OK. La clave funciona con OpenAI.' };
    }
    // fallback model
    const fallback = await callOpenAi(apiKey, 'gpt-3.5-turbo', [
      { role: 'user', content: 'Responde solo: OK' },
    ]);
    if (fallback.ok) {
      return { ok: true, message: 'Conexión OK (modelo alternativo).' };
    }
    return {
      ok: false,
      message: explainOpenAiError(fallback.status, fallback.body),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error de red';
    return {
      ok: false,
      message: /network|fetch|Failed/i.test(msg)
        ? 'No se pudo conectar. Revisá internet e intentá de nuevo.'
        : msg,
    };
  }
}

export async function askFinanceCoach(
  state: FinanceState,
  userMessage: string,
  options: CoachOptions = {}
): Promise<{ reply: string; usedAi: boolean }> {
  const keyRaw = await getOpenAiKey();
  const key = keyRaw ? sanitizeApiKey(keyRaw) : null;
  if (key) {
    try {
      const reply = await openAiReply(state, userMessage, key);
      return { reply, usedAi: true };
    } catch (e) {
      const detail = e instanceof Error ? e.message : 'Error desconocido';
      return {
        reply: `${localCoachReply(state, userMessage, options)}\n\n⚠️ OpenAI falló: ${detail}`,
        usedAi: false,
      };
    }
  }
  return {
    reply: localCoachReply(state, userMessage, options),
    usedAi: false,
  };
}

export function dailyInsight(
  state: FinanceState,
  options: CoachOptions = {}
): string {
  if (state.transactions.length === 0) {
    return 'Empezá cargando un ingreso y un gasto de la semana. Después el coach te arma un diagnóstico real.';
  }
  const percent = clampBonusPercent(options.saturdayBonusPercent ?? 20);
  const s = buildCoachSnapshot(state, percent);
  const top = s.topWeekExpenses[0];
  return [
    `Libre semanal ${formatMoney(s.weekLibre)} (${s.savingsRateWeek.toFixed(0)}% de lo que entró).`,
    top
      ? `Más se te va en ${top.label} (${formatMoney(top.amount)}).`
      : 'Todavía faltan gastos cargados para ver fugas.',
    s.saturdayBonus > 0
      ? `Bono sábado estimado (${percent}%): ${formatMoney(s.saturdayBonus)}.`
      : 'Si cerrás en positivo, el sábado suma un % a Ahorro.',
  ].join(' ');
}
