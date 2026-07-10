// Auth controller for SISEC CC 2026
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { logger } from '../config/logger.js'
import { verifyCredentials } from '../models/authModel.js'
import { getPool } from '../config/db.js'

export const login = async (req, res, next) => {
  try {
    const { usuario, contrasena } = req.body
    const user = await verifyCredentials(usuario, contrasena)

    if (!user) {
      logger.info(`[AUTH]    ❌ Login fallido — Usuario: ${usuario} (credenciales incorrectas)`) 
      return res.status(401).json({ success: false, message: 'Credenciales incorrectas' })
    }

    const payload = {
      idUsuario: user.idUsuario,
      nombre: user.nombre,
      idsede: user.idsede,
      permiso: user.permiso
    }

    const token = jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn })

    // Validar si la alerta del manual de usuario en el login está habilitada
    let mostrarAlertaLogin = false
    try {
      const pool = await getPool()
      const alertResult = await pool.request().query(`
        SELECT habilitado, fecha_fin 
        FROM sisec_config_fechas 
        WHERE modulo = 'alerta_login'
      `)
      
      if (alertResult.recordset.length > 0) {
        const config = alertResult.recordset[0]
        if (config.habilitado) {
          const fechaFin = new Date(config.fecha_fin)
          const fechaActual = new Date()
          if (fechaActual <= fechaFin) {
            mostrarAlertaLogin = true
          }
        }
      } else {
        // Por defecto: activa hasta el 31 de diciembre del 2026
        const fechaFin = new Date('2026-12-31T23:59:59')
        const fechaActual = new Date()
        if (fechaActual <= fechaFin) {
          mostrarAlertaLogin = true
        }
      }
    } catch (dbError) {
      logger.error(`[AUTH_WARN] Error al consultar alerta_login en BD: ${dbError.message}`)
    }

    logger.info(`[AUTH]    ✅ Login exitoso — Usuario: ${user.nombre} | Sede: ${user.idsede} | Permiso: ${user.permiso}`)
    
    return res.json({ success: true, token, user: payload, mostrarAlertaLogin })
  } catch (error) {
    return next(error)
  }
}


export const logout = (req, res) => {
  const usuario = req.user?.nombre ?? 'desconocido'
  logger.info(`[AUTH]    🔒 Sesión cerrada — Usuario: ${usuario}`)
  return res.json({ success: true })
}
