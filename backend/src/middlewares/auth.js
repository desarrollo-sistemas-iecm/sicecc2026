// JWT auth middleware for SISEC CC 2026
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { getPool, sql } from '../config/db.js'
import { logger } from '../config/logger.js'

export const auth = async (req, res, next) => {
  const header = req.headers.authorization
  if (!header) {
    return res.status(401).json({ success: false, message: 'Token requerido.' })
  }

  const token = header.replace('Bearer ', '')
  try {
    const decoded = jwt.verify(token, env.jwt.secret)
    
    // Validar sesion_id en la base de datos (Fail-Closed)
    const pool = await getPool()
    const result = await pool.request()
      .input('idusuario', sql.Int, decoded.idUsuario)
      .query('SELECT sesion_id FROM sisec_usuarios WHERE idusuario = @idusuario AND estado = 1')

    if (result.recordset.length === 0) {
      return res.status(401).json({ success: false, message: 'Usuario inexistente o inactivo.' })
    }

    const dbUser = result.recordset[0]
    if (dbUser.sesion_id !== decoded.sesionId) {
      return res.status(401).json({
        success: false,
        message: 'Tu sesión ha sido cerrada porque iniciaste sesión en otro dispositivo. Por favor, inicia sesión de nuevo.',
        code: 'SESION_INVALIDADA'
      })
    }

    req.user = decoded
    return next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token inválido o expirado.' })
    }
    
    // Fail-Closed: denegar el paso en caso de falla de base de datos o de red
    logger.error(`[AUTH_ERROR] Falla en authMiddleware (Fail-Closed): ${error.message}`)
    return res.status(500).json({
      success: false,
      message: 'No se pudo verificar el estado de la sesión, por favor intente de nuevo.'
    })
  }
}
