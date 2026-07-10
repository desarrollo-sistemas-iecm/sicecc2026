// Central error handler for SISEC CC 2026
import { logger } from '../config/logger.js'

export const errorHandler = (err, req, res, next) => {
  logger.error(`[ERROR]   💥 Error en ${req.originalUrl} — ${err.message}`)
  const payload = { success: false, message: err.message }
  return res.status(err.status || 500).json(payload)
}
