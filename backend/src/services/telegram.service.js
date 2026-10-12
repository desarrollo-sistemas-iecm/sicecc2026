import axios from 'axios';
import { env } from '../config/env.js';
import { sanitizeErrorText } from '../config/logger.js';

const AMBIENTE_EMOJI = {
  local: '💻',
  development: '🧪',
  staging: '🧪',
  production: '🚨'
};

// Contadores en memoria para resumen de actividad
const contadores = {
  actividades_realizadas: 0,
  talleres: 0,
  intervenciones: 0,
  encuestas: 0,
  consultas: 0
};

function escapeHtml(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function registrarEvento(tipo, detail = null) {
  // Las sesiones ya no se acumulan ni se resumen
  if (tipo === 'sesiones') {
    return;
  }

  if (contadores[tipo] !== undefined) {
    contadores[tipo]++;
  }
  // Si se completa un taller o intervención, se suma al general de actividades realizadas
  if (tipo === 'intervenciones' || tipo === 'talleres') {
    contadores.actividades_realizadas++;
  }
}

/**
 * 📊 Resumen de Actividad
 * Se dispara exclusivamente de Lunes a Viernes a las 09:00 hrs y a las 18:00 hrs (2 veces al día).
 */
export async function enviarResumenActividad(turno = null) {
  const ambiente = env.nodeEnv || 'desconocido';
  const emoji = AMBIENTE_EMOJI[ambiente] || '⚙️';
  
  const now = new Date();
  const fechaStr = now.toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit' });
  const horaStr = now.toLocaleTimeString('es-MX', { timeZone: 'America/Mexico_City', hour12: false });

  const tituloTurno = turno ? `\n🏷️ <b>Corte:</b> ${escapeHtml(turno)}` : '';

  const mensaje = `${emoji} <b>[${ambiente.toUpperCase()}]</b>\n` +
    `📊 <b>Resumen de Actividad - SICEC CC</b>\n` +
    `🕐 <b>Fecha y Hora:</b> ${fechaStr} ${horaStr}${tituloTurno}\n\n` +
    `✅ <b>Actividades realizadas:</b> ${contadores.actividades_realizadas}\n` +
    `📚 <b>Talleres:</b> ${contadores.talleres}\n` +
    `👥 <b>Intervenciones:</b> ${contadores.intervenciones}\n` +
    `📝 <b>Encuestas:</b> ${contadores.encuestas}\n\n` +
    `🔵 <b>Consultas / Reportes:</b> ${contadores.consultas}`;

  try {
    await enviarMensajeTelegram(mensaje);
    
    // Reiniciar contadores de actividad únicamente tras un envío exitoso
    contadores.actividades_realizadas = 0;
    contadores.talleres = 0;
    contadores.intervenciones = 0;
    contadores.encuestas = 0;
    contadores.consultas = 0;
  } catch (err) {
    import('../config/logger.js').then(({ logger }) => {
      logger.error(`[TELEGRAM_ERROR] Error enviando resumen de actividad: ${err.message}`);
    }).catch(() => {});
  }
}

/**
 * 📈 Acumulado Histórico Global
 * Se dispara exclusivamente los VIERNES a las 09:00 hrs.
 */
export async function enviarResumenHistorico() {
  try {
    const { getAdminDashboardMetrics } = await import('../models/actividadModel.js');
    const metrics = await getAdminDashboardMetrics();

    const ambiente = env.nodeEnv || 'desconocido';
    const emoji = AMBIENTE_EMOJI[ambiente] || '⚙️';
    const now = new Date();
    const fechaStr = now.toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit' });
    const horaStr = now.toLocaleTimeString('es-MX', { timeZone: 'America/Mexico_City', hour12: false });

    const mensaje = `${emoji} <b>[${ambiente.toUpperCase()}]</b>\n` +
      `📈 <b>Acumulado Histórico Global - SICEC CC</b>\n` +
      `🗓️ <b>Corte Semanal (Viernes):</b> ${fechaStr} ${horaStr}\n\n` +
      `✅ <b>Actividades realizadas:</b> ${metrics.actividades_realizadas}\n` +
      `📚 <b>Talleres:</b> ${metrics.total_talleres}\n` +
      `👥 <b>Intervenciones:</b> ${metrics.total_intervenciones}\n` +
      `📝 <b>Encuestas:</b> ${metrics.total_encuestas}`;

    await enviarMensajeTelegram(mensaje);
  } catch (err) {
    import('../config/logger.js').then(({ logger }) => {
      logger.error(`[TELEGRAM_ERROR] Error enviando resumen histórico: ${err.message}`);
    }).catch(() => {});
  }
}

/**
 * ⏰ Programador Automático de Horarios Fijos:
 * - Resumen de Actividad: Lunes a Viernes a las 09:00 y a las 18:00 hrs.
 * - Acumulado Histórico: Solo los Viernes a las 09:00 hrs.
 * - Resumen de Sesiones: Removido completamente.
 */
const marcasEjecucion = {
  actividad: '',
  historico: ''
};

function verificarProgramadores() {
  const now = new Date();
  const day = now.getDay(); // 0: Domingo, 1: Lunes, ..., 5: Viernes, 6: Sábado
  const hours = now.getHours();
  const minutes = now.getMinutes();

  const fechaStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const claveHora = `${fechaStr}-${String(hours).padStart(2, '0')}`;

  // 1. Resumen de Actividad: Lunes a Viernes a las 09:00 y a las 18:00
  const esLunesAViernes = day >= 1 && day <= 5;
  const esHoraActividad = (hours === 9 || hours === 18) && minutes === 0;

  if (esLunesAViernes && esHoraActividad && marcasEjecucion.actividad !== claveHora) {
    marcasEjecucion.actividad = claveHora;
    const turno = hours === 9 ? '🌅 Turno Matutino (09:00 hrs)' : '🌆 Turno Vespertino (18:00 hrs)';
    enviarResumenActividad(turno).catch(err => {
      import('../config/logger.js').then(({ logger }) => {
        logger.error(`[TELEGRAM_SCHEDULER] Error al enviar resumen de actividad: ${err.message}`);
      }).catch(() => {});
    });
  }

  // 2. Acumulado Histórico: Solo los Viernes a las 09:00
  const esViernes = day === 5;
  const esHoraHistorico = hours === 9 && minutes === 0;

  if (esViernes && esHoraHistorico && marcasEjecucion.historico !== claveHora) {
    marcasEjecucion.historico = claveHora;
    enviarResumenHistorico().catch(err => {
      import('../config/logger.js').then(({ logger }) => {
        logger.error(`[TELEGRAM_SCHEDULER] Error al enviar acumulado histórico: ${err.message}`);
      }).catch(() => {});
    });
  }
}

// Intervalo de comprobación cada 20 segundos
setInterval(verificarProgramadores, 20 * 1000);

export async function enviarAlertaWarn(message) {
  const ambiente = env.nodeEnv || 'desconocido';
  const emoji = AMBIENTE_EMOJI[ambiente] || '⚙️';
  const now = new Date();
  const fechaStr = now.toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit' });
  const horaStr = now.toLocaleTimeString('es-MX', { timeZone: 'America/Mexico_City', hour12: false });

  const mensaje = `${emoji} <b>[${ambiente.toUpperCase()}]</b>\n` +
    `⚠️ <b>Aviso / Advertencia - SICEC CC</b>\n` +
    `🕐 <b>Fecha y Hora:</b> ${fechaStr} ${horaStr}\n\n` +
    `<pre>${escapeHtml(sanitizeErrorText(message))}</pre>`;

  await enviarMensajeTelegram(mensaje);
}

/**
 * 🚨 Alerta de Errores Críticos
 * Se despacha INMEDIATAMENTE al ocurrir cualquier fallo (sin deduplicación).
 * Especifica con claridad DÓNDE se originó y CUÁL ES EL ERROR EXPLÍCITAMENTE.
 */
export async function enviarAlertaError(errorInfo) {
  const ambiente = env.nodeEnv || 'desconocido';
  const emoji = AMBIENTE_EMOJI[ambiente] || '🚨';
  const now = new Date();
  const fechaStr = now.toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit' });
  const horaStr = now.toLocaleTimeString('es-MX', { timeZone: 'America/Mexico_City', hour12: false });

  let mensajeError = '';
  let donde = 'Módulo interno del servidor';
  let usuario = null;
  let ip = null;
  let stack = null;

  if (typeof errorInfo === 'object' && errorInfo !== null) {
    mensajeError = errorInfo.message || errorInfo.error || JSON.stringify(errorInfo);
    donde = errorInfo.where || errorInfo.origen || donde;
    usuario = errorInfo.user || errorInfo.usuario || null;
    ip = errorInfo.ip || null;
    stack = errorInfo.stack || null;
  } else {
    const raw = String(errorInfo || 'Error no especificado');
    mensajeError = raw;
    
    // Si viene en formato con separador "—"
    if (raw.includes('—')) {
      const parts = raw.split('—').map(p => p.trim());
      if (parts.length >= 2) {
        donde = parts[0].replace(/^[❌⚠️💥\s]+/, '').replace(/^\[ERROR\]\s*/i, '').trim();
        mensajeError = parts[1];
        if (parts[2]) {
          usuario = parts[2];
        }
      }
    }
  }

  // Sanitizar todos los datos para no comprometer credenciales ni rutas locales
  const sanitizedMsg = sanitizeErrorText(mensajeError);
  const sanitizedDonde = sanitizeErrorText(donde);
  const sanitizedUser = usuario ? sanitizeErrorText(usuario) : null;
  const sanitizedStack = stack ? sanitizeErrorText(stack) : null;

  let cuerpoMensaje = `${emoji} <b>[${ambiente.toUpperCase()}] 🚨 ERROR CRÍTICO EN SERVIDOR</b>\n` +
    `🕐 <b>Fecha y Hora:</b> ${fechaStr} ${horaStr}\n\n` +
    `📍 <b>¿Dónde se disparó?</b>\n` +
    `• <b>Origen / Ruta:</b> <code>${escapeHtml(sanitizedDonde)}</code>\n`;

  if (sanitizedUser) {
    cuerpoMensaje += `• <b>Usuario:</b> ${escapeHtml(sanitizedUser)}\n`;
  }
  if (ip) {
    cuerpoMensaje += `• <b>IP del Cliente:</b> <code>${escapeHtml(ip)}</code>\n`;
  }

  cuerpoMensaje += `\n💥 <b>Error explícito:</b>\n` +
    `<pre>${escapeHtml(sanitizedMsg)}</pre>`;

  if (sanitizedStack) {
    const stackLines = sanitizedStack
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0 && !l.includes('node:internal') && !l.includes('node_modules'))
      .slice(0, 4)
      .join('\n');

    if (stackLines) {
      cuerpoMensaje += `\n\n📋 <b>Ubicación en código (Stack):</b>\n` +
        `<pre>${escapeHtml(stackLines)}</pre>`;
    }
  }

  // Envío inmediato a la API de Telegram
  await enviarMensajeTelegram(cuerpoMensaje);
}

export async function enviarMensajeTelegram(text) {
  try {
    const token = env.telegram?.botToken;
    const chatId = env.telegram?.chatId;
    if (!token || !chatId) return;

    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: 'HTML'
    });

    import('../config/logger.js').then(({ logger }) => {
      logger.info('[TELEGRAM] Mensaje enviado correctamente');
    }).catch(() => {});
  } catch (err) {
    import('../config/logger.js').then(({ logger }) => {
      logger.error(`[TELEGRAM_ERROR] Error enviando a la API de Telegram: ${err.message}`);
    }).catch(() => {});
  }
}
