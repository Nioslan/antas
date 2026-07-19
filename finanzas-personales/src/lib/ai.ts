import type { FinanceState } from '../types/finance';
import { formatMoney, getCategoryLabel } from './categories';
import {
  buildCoachSnapshot,
  formatSnapshotForPrompt,
  type CoachSnapshot,
} from './coachAnalysis';
import { getOpenAiKey } from './storage';

const MODELS = ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'] as const;

export function sanitizeApiKey(raw: string): string {
  return raw
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\s+/g, '')
    .replace(/^Bearer/i, '');
}

function goalPlan(s: CoachSnapshot): string {
  if (s.goals.length === 0) {
    return 'No tenés metas todavía. Creá una concreta (ej: emergencia de 1 mes de gastos o un objetivo con monto). Con tu libre semanal actual, incluso apartar el 20% ya te arma un hábito.';
  }
  const g = s.goals[0];
  const left = Math.max(g.targetAmount - g.currentAmount, 0);
  const weeklySave = Math.max(s.weekLibre * 0.2, 0);
  if (left <= 0) {
    return `Tu meta "${g.name}" ya está cubierta. Podés crear otra o subir el monto objetivo.`;
  }
  if (weeklySave <= 0) {
    return `Para "${g.name}" te faltan ${formatMoney(left)}, pero esta semana el libre está en ${formatMoney(s.weekLibre)}. Primero estabilizá gastos (empezá por ${s.topWeekExpenses[0]?.label ?? 'la categoría más alta'}) y después volvé a aportar.`;
  }
  const weeks = Math.ceil(left / weeklySave);
  return `Meta "${g.name}": faltan ${formatMoney(left)}. Si apartás ~${formatMoney(weeklySave)}/semana (20% de tu libre), llegás en unas ${weeks} semana(s). Tip: el sábado ese 20% ya se suma solo a "Ahorro"; podés moverlo a la meta desde ahí.`;
}

function spendingAdvice(s: CoachSnapshot): string {
  const top = s.topWeekExpenses[0];
  if (!top) {
    return `Esta semana casi no hay gastos cargados. Registrá comida, gasolina y transporte apenas pasen: sin eso el coach adivina mal.`;
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
  if (s.avgDailySpendWeek > 0) {
    lines.push(
      `Vas a un ritmo de ~${formatMoney(s.avgDailySpendWeek)}/día en gastos. Poné un tope diario un poco menor y miralo al final del día.`
    );
  }
  return lines.join(' ');
}

function weekHealth(s: CoachSnapshot): string {
  const delta = s.weekLibre - s.prevWeekLibre;
  let compare = 'parecida a la anterior';
  if (delta > 0) compare = `mejor que la pasada (+${formatMoney(delta)})`;
  else if (delta < 0) compare = `más justa que la pasada (${formatMoney(delta)})`;

  let verdict = 'vas equilibrado';
  if (s.weekLibre < 0) verdict = 'esta semana estás en rojo: los gastos superan a los ingresos';
  else if (s.savingsRateWeek >= 20)
    verdict = 'muy bien: estás dejando más del 20% libre';
  else if (s.savingsRateWeek >= 10) verdict = 'aceptable, pero se puede apretar un poco más';
  else if (s.weekIngreso > 0) verdict = 'el margen es chico: casi todo lo que entra se va';

  return [
    `Semana: ingresos ${formatMoney(s.weekIngreso)}, gastos ${formatMoney(s.weekGasto)}, libre ${formatMoney(s.weekLibre)} (${s.savingsRateWeek.toFixed(0)}% de lo que entró).`,
    `Hoy libre ${formatMoney(s.dayLibre)}. En mano (Ahora) tenés ${formatMoney(s.cashNow)}.`,
    `La semana viene ${compare}. En resumen, ${verdict}.`,
    s.saturdayBonus > 0
      ? `Bono sábado estimado: +${formatMoney(s.saturdayBonus)} a Ahora${s.bonusAlreadyApplied ? ' (ya aplicado)' : ''}.`
      : 'Si cerrás la semana con libre positivo, el sábado se suma el 20% a Ahora.',
  ].join(' ');
}

function actionPlan(s: CoachSnapshot): string {
  const actions: string[] = [];
  if (s.weekLibre < 0) {
    actions.push(
      `1) Congelá ocio/compras 48h y revisá ${s.topWeekExpenses[0]?.label ?? 'gastos'} hoy.`
    );
    actions.push('2) Cargá todo lo pendiente para no engañarte con el libre.');
    actions.push('3) El próximo ingreso, primero cubrí lo esencial y después el resto.');
  } else {
    actions.push(
      `1) Tope esta semana en ${s.topWeekExpenses[0]?.label ?? 'gastos variables'}: no pases de ${formatMoney(
        (s.topWeekExpenses[0]?.amount ?? s.weekGasto) * 0.85
      )}.`
    );
    actions.push(
      `2) Apartá ${formatMoney(Math.max(s.weekLibre * 0.2, 0))} hacia tu meta o dejalo que el sábado vaya a Ahorro.`
    );
    actions.push(
      '3) Anotá cada gasto con nota corta (dónde/en qué) para afinar el coach.'
    );
  }
  return `Plan concreto:\n${actions.join('\n')}`;
}

function localCoachReply(state: FinanceState, userMessage: string): string {
  const s = buildCoachSnapshot(state);
  const msg = userMessage
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (state.transactions.length === 0) {
    return 'Todavía no hay historial. Cargá al menos: un ingreso de la semana y 2–3 gastos con categoría y nota. Con eso te armo diagnóstico (dónde se va la plata, cuánto te queda y un plan de 3 pasos).';
  }

  if (
    msg.includes('meta') ||
    msg.includes('ahorro') ||
    msg.includes('ahorrar') ||
    msg.includes('llegar')
  ) {
    return `${goalPlan(s)}\n\n${actionPlan(s)}`;
  }

  if (
    msg.includes('gast') ||
    msg.includes('comida') ||
    msg.includes('gasolina') ||
    msg.includes('donde') ||
    msg.includes('más') ||
    msg.includes('mas') ||
    msg.includes('categoria')
  ) {
    return `${spendingAdvice(s)}\n\nMes: libre ${formatMoney(s.monthLibre)}. ${actionPlan(s)}`;
  }

  if (
    msg.includes('plan') ||
    msg.includes('tip') ||
    msg.includes('consejo') ||
    msg.includes('semana') ||
    msg.includes('que hago') ||
    msg.includes('ayud')
  ) {
    return `${weekHealth(s)}\n\n${spendingAdvice(s)}\n\n${actionPlan(s)}`;
  }

  if (
    msg.includes('ahora') ||
    msg.includes('bolsillo') ||
    msg.includes('efectivo') ||
    msg.includes('sabado') ||
    msg.includes('sábado') ||
    msg.includes('bono')
  ) {
    return `En Ahorro tenés ${formatMoney(s.cashNow)}. El bono del sábado (20% del libre semanal) sería ${formatMoney(s.saturdayBonus)} sobre un libre de ${formatMoney(s.weekLibreForBonus)}${s.bonusAlreadyApplied ? ' y ya se aplicó esta semana' : ' y se aplica al abrir la app sábado/domingo'}. Usá ese bono para meta o colchón, no para gasto chico.`;
  }

  if (
    msg.includes('ingreso') ||
    msg.includes('sueldo') ||
    msg.includes('ganar') ||
    msg.includes('cobr')
  ) {
    const top = s.biggestIncome;
    return [
      `Esta semana entraron ${formatMoney(s.weekIngreso)}${
        top
          ? `, el más alto fue ${getCategoryLabel('giro', top.category)} por ${formatMoney(top.amount)}`
          : ''
      }.`,
      `Después de gastos te quedan ${formatMoney(s.weekLibre)} libres (${s.savingsRateWeek.toFixed(0)}%).`,
      s.weekLibre > 0
        ? `Regla simple: del próximo ingreso, primero apartá ${formatMoney(Math.max(s.weekLibre * 0.2, s.weekIngreso * 0.1))} y el resto viví el mes.`
        : 'Con margen negativo, el próximo ingreso primero tapa huecos y recién después gasto flexible.',
    ].join(' ');
  }

  if (
    msg.includes('hoy') ||
    msg.includes('libre') ||
    msg.includes('como voy') ||
    msg.includes('cómo voy') ||
    msg.includes('resumen') ||
    msg.includes('diagnost')
  ) {
    return `${weekHealth(s)}\n\n${spendingAdvice(s)}`;
  }

  return `${weekHealth(s)}\n\n${spendingAdvice(s)}\n\n${goalPlan(s)}\n\n${actionPlan(s)}`;
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
  userMessage: string
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
        reply: `${localCoachReply(state, userMessage)}\n\n⚠️ OpenAI falló: ${detail}`,
        usedAi: false,
      };
    }
  }
  return { reply: localCoachReply(state, userMessage), usedAi: false };
}

export function dailyInsight(state: FinanceState): string {
  if (state.transactions.length === 0) {
    return 'Empezá cargando un ingreso y un gasto de la semana. Después el coach te arma un diagnóstico real.';
  }
  const s = buildCoachSnapshot(state);
  const top = s.topWeekExpenses[0];
  return [
    `Libre semanal ${formatMoney(s.weekLibre)} (${s.savingsRateWeek.toFixed(0)}% de lo que entró).`,
    top
      ? `Más se te va en ${top.label} (${formatMoney(top.amount)}).`
      : 'Todavía faltan gastos cargados para ver fugas.',
    s.saturdayBonus > 0
      ? `Bono sábado estimado: ${formatMoney(s.saturdayBonus)}.`
      : 'Si cerrás en positivo, el sábado suma un % a Ahorro.',
  ].join(' ');
}
