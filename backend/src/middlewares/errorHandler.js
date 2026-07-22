// Central error handler for SISEC CC 2026
import { logError, logWarn, userTag } from '../config/logger.js';

export const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Error interno del servidor';
  const user = req.user ? ` — ${userTag(req.user)}` : '';

  if (status >= 500) {
    let errMsg = `❌ [${req.method}] ${req.originalUrl} — ${message}${user}`;
    if (err.stack) {
      const shortStack = err.stack.split('\n').slice(0, 4).join('\n    ');
      errMsg += `\n   ${shortStack}`;
    }
    logError(errMsg);
  } else {
    logWarn(`⚠️  [${req.method}] ${req.originalUrl} — ${status} ${message}${user}`);
  }

  return res.status(status).json({ success: false, message });
};
