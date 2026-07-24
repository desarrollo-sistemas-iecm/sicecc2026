// Auth controller for SISEC CC 2026
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { env } from '../config/env.js'
import { logger, logSession, logWarn, userTag, getPerfilName } from '../config/logger.js'
import { verifyCredentials } from '../models/authModel.js'
import { getPool, sql } from '../config/db.js'
import { desconectarUsuario } from '../socket.js'

export const login = async (req, res, next) => {
  try {
    const { usuario, contrasena } = req.body
    const user = await verifyCredentials(usuario, contrasena)

    if (!user) {
      logWarn(`[AUTH]    ❌ Login fallido — Usuario: ${usuario} (credenciales incorrectas)`) 
      return res.status(401).json({ success: false, message: 'Credenciales incorrectas' })
    }

    const sesionId = crypto.randomUUID()

    // Si ya existe un socket activo para este usuario, desconectarlo forzosamente
    desconectarUsuario(user.idUsuario, 'Tu cuenta ha sido cerrada porque se inició sesión en otro dispositivo.')

    // Actualizar sesion_id en la base de datos
    const pool = await getPool()
    await pool.request()
      .input('sesionId', sql.VarChar(50), sesionId)
      .input('idusuario', sql.Int, user.idUsuario)
      .query('UPDATE sisec_usuarios SET sesion_id = @sesionId WHERE idusuario = @idusuario')

    const payload = {
      idUsuario: user.idUsuario,
      nombre: user.nombre,
      idsede: user.idsede,
      permiso: user.permiso,
      sesionId
    }

    const token = jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn })

    // Validar si la alerta del manual de usuario en el login está habilitada
    let mostrarAlertaLogin = false
    try {
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

    const ip = req.ip || req.headers['x-forwarded-for'] || '::1'
    logSession(`🟢 LOGIN ➜ ${user.nombre} (${usuario}) — ${getPerfilName(user.permiso)} | Sede=${user.idsede} — IP: ${ip}`)
    
    return res.json({ success: true, token, user: payload, mostrarAlertaLogin })
  } catch (error) {
    return next(error)
  }
}


export const logout = async (req, res, next) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || '::1'
    const nombre = req.user?.nombre || 'desconocido'
    const idUsuario = req.user?.idUsuario

    if (idUsuario) {
      // Remover sesion_id en la base de datos
      const pool = await getPool()
      await pool.request()
        .input('idusuario', sql.Int, idUsuario)
        .query('UPDATE sisec_usuarios SET sesion_id = NULL WHERE idusuario = @idusuario')

      // Desconectar el socket
      desconectarUsuario(idUsuario, 'Has cerrado tu sesión.')
    }

    logSession(`🔴 LOGOUT ➜ ${nombre} — IP: ${ip}`)
    return res.json({ success: true })
  } catch (error) {
    return next(error)
  }
}
