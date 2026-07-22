import winston from 'winston';
import path from 'path';
import { env } from './env.js';

const { createLogger, format, transports } = winston;
const { combine, timestamp, printf } = format;

// ─── ANSI Color Codes ────────────────────────────────────────────
const C = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  // Foreground
  green:   '\x1b[32m',
  blue:    '\x1b[34m',
  cyan:    '\x1b[36m',
  yellow:  '\x1b[33m',
  red:     '\x1b[31m',
  magenta: '\x1b[35m',
  white:   '\x1b[37m',
  gray:    '\x1b[90m',
  // Bright
  greenBright:  '\x1b[92m',
  blueBright:   '\x1b[94m',
  cyanBright:   '\x1b[96m',
  yellowBright: '\x1b[93m',
  redBright:    '\x1b[91m',
  // Background
  bgGreen:  '\x1b[42m',
  bgBlue:   '\x1b[44m',
  bgYellow: '\x1b[43m',
  bgRed:    '\x1b[41m',
  bgCyan:   '\x1b[46m',
  bgMagenta:'\x1b[45m',
};

// ─── Perfiles de usuario ──────────────────────────────────────────
export const PERFILES = {
  1: 'Operador',
  2: 'Administrador',
};

export const getPerfilName = (perfil) => PERFILES[perfil] || `Perfil ${perfil}`;

// ─── Sanitización de Datos Sensibles ────────────────────────────────
const backendPath = path.resolve(process.cwd()).replace(/\\/g, '/');

export const sanitizeErrorText = (text) => {
  if (typeof text !== 'string') return text;

  let sanitized = text;

  // 1. Ocultar credenciales y secretos configurados en env
  if (env.db?.password) {
    sanitized = sanitized.split(env.db.password).join('***');
  }
  if (env.telegram?.botToken) {
    sanitized = sanitized.split(env.telegram.botToken).join('***');
  }
  if (env.jwt?.secret) {
    sanitized = sanitized.split(env.jwt.secret).join('***');
  }
  if (env.db?.user) {
    sanitized = sanitized.split(env.db.user).join('***');
  }

  // 2. Limpiar IPs/Hosts conocidos
  if (env.db?.server) {
    sanitized = sanitized.split(env.db.server).join('[db_host]');
  }

  // 3. Convertir rutas absolutas del backend en relativas
  sanitized = sanitized.replace(/\\/g, '/');
  sanitized = sanitized.split(backendPath).join('.');

  // Ocultar cualquier otra ruta de xampp/htdocs si existiera
  sanitized = sanitized.replace(/c:\/xampp\/htdocs\/[^\/]+\/[^\/]+/gi, '[workspace]');

  return sanitized;
};

// ─── Formato para consola (con colores) ──────────────────────────
const consoleFormat = printf(({ level, message, timestamp, category }) => {
  const ts = `${C.gray}${timestamp}${C.reset}`;
  const sanitizedMsg = sanitizeErrorText(message);

  switch (category) {
    case 'session':
      return `${ts} ${C.bgGreen}${C.bold} SESIÓN ${C.reset} ${C.greenBright}${sanitizedMsg}${C.reset}`;
    case 'action':
      return `${ts} ${C.bgBlue}${C.bold} ACCIÓN ${C.reset} ${C.blueBright}${sanitizedMsg}${C.reset}`;
    case 'query':
      return `${ts} ${C.bgCyan}${C.bold} CONSULT ${C.reset} ${C.cyanBright}${sanitizedMsg}${C.reset}`;
    case 'warn':
      return `${ts} ${C.bgYellow}${C.bold} AVISO  ${C.reset} ${C.yellowBright}${sanitizedMsg}${C.reset}`;
    case 'error':
      return `${ts} ${C.bgRed}${C.bold} ERROR  ${C.reset} ${C.redBright}${sanitizedMsg}${C.reset}`;
    case 'system':
      return `${ts} ${C.bgMagenta}${C.bold} SYSTEM ${C.reset} ${C.magenta}${sanitizedMsg}${C.reset}`;
    default:
      return `${ts} [${level}]: ${sanitizedMsg}`;
  }
});

// ─── Formato para archivos (sin colores) ─────────────────────────
const fileFormat = printf(({ level, message, timestamp, category }) => {
  const cat = category ? `[${category.toUpperCase()}]` : `[${level.toUpperCase()}]`;
  const sanitizedMsg = sanitizeErrorText(message);
  return `${timestamp} ${cat} ${sanitizedMsg}`;
});

// ─── Logger principal ────────────────────────────────────────────
export const logger = createLogger({
  level: env.logLevel || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    fileFormat
  ),
  transports: [
    // Consola con colores
    new transports.Console({
      format: combine(
        timestamp({ format: 'HH:mm:ss' }),
        consoleFormat
      )
    }),
    // Archivo de errores
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), fileFormat)
    }),
    // Archivo combinado (todo)
    new transports.File({
      filename: 'logs/combined.log',
      format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), fileFormat)
    }),
    // Archivo de actividad de usuarios
    new transports.File({
      filename: 'logs/activity.log',
      format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), fileFormat)
    }),
  ]
});

// ─── Métodos especializados ──────────────────────────────────────

/** 🟢 Login / Logout / Sesión */
export const logSession = (message) => {
  logger.info(message, { category: 'session' });
  import('../services/telegram.service.js')
    .then(({ registrarEvento }) => registrarEvento('sesiones', message))
    .catch(err => console.error('Error al registrar sesión en Telegram:', err.message));
};

/** 🔵 Captura / Guardado / Modificación de datos */
export const logAction = (message, subType = 'capturas') => {
  logger.info(message, { category: 'action' });
  import('../services/telegram.service.js')
    .then(({ registrarEvento }) => registrarEvento(subType))
    .catch(err => console.error('Error al registrar acción en Telegram:', err.message));
};

/** 🔵 Consulta de datos (lectura) */
export const logQuery = (message) => {
  logger.info(message, { category: 'query' });
  import('../services/telegram.service.js')
    .then(({ registrarEvento }) => registrarEvento('consultas'))
    .catch(err => console.error('Error al registrar consulta en Telegram:', err.message));
};

/** 🟡 Advertencia */
export const logWarn = (message) => {
  const sanitizedMsg = sanitizeErrorText(message);
  logger.warn(sanitizedMsg, { category: 'warn' });
  import('../services/telegram.service.js')
    .then(({ enviarAlertaWarn }) => enviarAlertaWarn(sanitizedMsg))
    .catch(err => console.error('Error al enviar advertencia a Telegram:', err.message));
};

/** 🔴 Error */
export const logError = (message) => {
  const sanitizedMsg = sanitizeErrorText(message);
  logger.error(sanitizedMsg, { category: 'error' });
  import('../services/telegram.service.js')
    .then(({ enviarAlertaError }) => enviarAlertaError(sanitizedMsg))
    .catch(err => console.error('Error al enviar error a Telegram:', err.message));
};

/** 🟣 Sistema (arranque, etc.) */
export const logSystem = (message) => {
  logger.info(message, { category: 'system' });
};

// Helper para identificar al usuario en logs
export const userTag = (user) => {
  if (!user) return '[anónimo]';
  const id = user.idUsuario || user.idusuario || user.id;
  const parts = [`id=${id || 'desconocido'}`];
  if (user.nombre) parts.push(user.nombre);
  
  const perfil = user.permiso !== undefined ? user.permiso : user.perfil;
  if (perfil !== undefined) {
    parts.push(getPerfilName(perfil));
  }
  
  if (user.idsede !== undefined) {
    parts.push(`Sede=${user.idsede}`);
  }
  return `[${parts.join(' | ')}]`;
};
