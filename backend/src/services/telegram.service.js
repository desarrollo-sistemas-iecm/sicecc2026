import axios from 'axios';
import { env } from '../config/env.js';

const AMBIENTE_EMOJI = {
  local: '💻',
  development: '🧪',
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
const detallesLogins = [];
const detallesLogouts = [];

// Map en memoria para deduplicar alertas de errores (5 minutos)
const recentErrors = new Map();

export function registrarEvento(tipo, detail = null) {
  if (tipo === 'sesiones') {
    if (detail) {
      if (detail.includes('LOGIN')) {
        detallesLogins.push(detail);
      } else if (detail.includes('LOGOUT')) {
        detallesLogouts.push(detail);
      }
    }
  } else {
    if (contadores[tipo] !== undefined) {
      contadores[tipo]++;
    }
    // Si se completa un taller o intervención, se suma al general de actividades realizadas
    if (tipo === 'intervenciones' || tipo === 'talleres') {
      contadores.actividades_realizadas++;
    }
  }
}

export async function enviarResumenSesiones() {
  const total = detallesLogins.length + detallesLogouts.length;
  if (total === 0) return; // no mandar si no hubo sesiones

  const ambiente = env.nodeEnv || 'desconocido';
  const emoji = AMBIENTE_EMOJI[ambiente] || '⚙️';
  
  const now = new Date();
  const start = new Date(now.getTime() - 10 * 60 * 1000);
  const formatTime = (d) => d.toTimeString().split(' ')[0].slice(0, 8); // HH:mm:ss
  const rangeStr = `${formatTime(start)} - ${formatTime(now)}`;

  const formatLista = (lista) => {
    if (lista.length === 0) return '  Ninguno';
    const limite = 15;
    let res = lista.slice(0, limite).map(s => `  • ${s.split('➜ ').slice(1).join('➜ ') || s}`).join('\n');
    if (lista.length > limite) {
      res += `\n  ... y ${lista.length - limite} más`;
    }
    return res;
  };

  const mensaje = `${emoji} *[${ambiente.toUpperCase()}]*\n` +
    `👥 *Resumen de Sesiones - SICEC CC*\n` +
    `🕐 Periodo (10 min): ${rangeStr}\n\n` +
    `🟢 *Sesiones iniciadas: ${detallesLogins.length}*\n` +
    `${formatLista(detallesLogins)}\n\n` +
    `🔴 *Sesiones cerradas: ${detallesLogouts.length}*\n` +
    `${formatLista(detallesLogouts)}`;

  try {
    await enviarMensajeTelegram(mensaje);
    
    // Reiniciar listas únicamente tras un envío exitoso
    detallesLogins.length = 0;
    detallesLogouts.length = 0;
  } catch (err) {
    console.error('Error enviando resumen de sesiones a Telegram:', err.message);
  }
}

export async function enviarResumenActividad() {
  const total = contadores.actividades_realizadas + 
                contadores.talleres + 
                contadores.intervenciones + 
                contadores.encuestas + 
                contadores.consultas;
  if (total === 0) return; // no mandar si no hubo actividad

  const ambiente = env.nodeEnv || 'desconocido';
  const emoji = AMBIENTE_EMOJI[ambiente] || '⚙️';
  
  const now = new Date();
  const start = new Date(now.getTime() - 2 * 60 * 1000);
  const formatTime = (d) => d.toTimeString().split(' ')[0].slice(0, 8); // HH:mm:ss
  const rangeStr = `${formatTime(start)} - ${formatTime(now)}`;

  const mensaje = `${emoji} *[${ambiente.toUpperCase()}]*\n` +
    `📊 *Resumen de Actividad - SICEC CC*\n` +
    `🕐 Periodo (2 min): ${rangeStr}\n\n` +
    `✅ Actividades realizadas: ${contadores.actividades_realizadas}\n` +
    `📚 Talleres: ${contadores.talleres}\n` +
    `👥 Intervenciones: ${contadores.intervenciones}\n` +
    `📝 Encuestas: ${contadores.encuestas}\n\n` +
    `🔵 Consultas/Reportes: ${contadores.consultas}`;

  try {
    await enviarMensajeTelegram(mensaje);
    
    // Reiniciar contadores de actividad únicamente tras un envío exitoso
    contadores.actividades_realizadas = 0;
    contadores.talleres = 0;
    contadores.intervenciones = 0;
    contadores.encuestas = 0;
    contadores.consultas = 0;
  } catch (err) {
    console.error('Error enviando resumen de actividad a Telegram:', err.message);
  }
}

// 1. Iniciar el temporizador para enviar resumen de actividad cada 2 minutos
setInterval(enviarResumenActividad, 2 * 60 * 1000);

// 2. Iniciar el temporizador para enviar resumen de sesiones cada 10 minutos exactos
function iniciarCronSesiones() {
  const now = new Date();
  const next10Min = new Date(now);
  const minutes = Math.ceil((now.getMinutes() + 0.1) / 10) * 10;
  next10Min.setMinutes(minutes % 60);
  next10Min.setSeconds(0);
  next10Min.setMilliseconds(0);
  if (minutes >= 60) {
    next10Min.setHours(next10Min.getHours() + 1);
  }
  
  const delay = next10Min.getTime() - now.getTime();
  
  setTimeout(() => {
    enviarResumenSesiones();
    setInterval(enviarResumenSesiones, 10 * 60 * 1000);
  }, delay);
}

iniciarCronSesiones();

export async function enviarAlertaWarn(message) {
  const ambiente = env.nodeEnv || 'desconocido';
  const emoji = AMBIENTE_EMOJI[ambiente] || '⚙️';
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);

  const mensaje = `${emoji} *[${ambiente.toUpperCase()}]*\n` +
    `⚠️ *Aviso / Advertencia - SICEC CC*\n` +
    `🕐 ${timestamp}\n\n` +
    `\`\`\`text\n${message}\n\`\`\``;

  await enviarMensajeTelegram(mensaje);
}

export async function enviarAlertaError(message) {
  const ambiente = env.nodeEnv || 'desconocido';
  const emoji = AMBIENTE_EMOJI[ambiente] || '⚙️';
  
  // Deduplicación por ambiente y mensaje de error
  const claveDedup = `${ambiente}:${message}`;
  const now = Date.now();

  if (recentErrors.has(claveDedup)) {
    const lastSent = recentErrors.get(claveDedup);
    if (now - lastSent < 5 * 60 * 1000) {
      return;
    }
  }
  recentErrors.set(claveDedup, now);

  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  
  const mensaje = `${emoji} *[${ambiente.toUpperCase()}]*\n` +
    `🔴 *Error de Servidor - SICEC CC*\n` +
    `🕐 ${timestamp}\n\n` +
    `\`\`\`text\n${message}\n\`\`\``;

  await enviarMensajeTelegram(mensaje);
}

export async function enviarMensajeTelegram(text) {
  try {
    const token = env.telegram?.botToken;
    const chatId = env.telegram?.chatId;
    if (!token || !chatId) return;

    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: 'Markdown'
    });
  } catch (err) {
    console.error('Error enviando mensaje a Telegram:', err.message);
  }
}
