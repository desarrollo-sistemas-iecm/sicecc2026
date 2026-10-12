// Central error handler for SISEC CC 2026
import { logError, logWarn, userTag } from '../config/logger.js';

export const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Error interno del servidor';
  const userStr = req.user ? userTag(req.user) : 'Anónimo';
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'desconocida';

  if (status >= 500) {
    logError({
      message: message,
      where: `[${req.method}] ${req.originalUrl}`,
      user: userStr,
      ip: ip,
      status: status,
      stack: err.stack || ''
    });
  } else {
    logWarn(`⚠️  [${req.method}] ${req.originalUrl} — ${status} ${message} — ${userStr}`);
  }

  return res.status(status).json({ success: false, message });
};
