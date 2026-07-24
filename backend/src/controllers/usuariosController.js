import { listUsuarios, createUsuario, updateUsuario, deleteUsuario } from '../models/usuarioModel.js'
import { usuariosConectados, desconectarUsuario } from '../socket.js'
import { getPool, sql } from '../config/db.js'

export const getUsuarios = async (req, res, next) => {
  try {
    const data = await listUsuarios()
    const enrichedData = data.map(u => ({
      ...u,
      conectado: usuariosConectados.has(Number(u.idusuario))
    }))
    return res.json({ success: true, data: enrichedData })
  } catch (error) {
    return next(error)
  }
}

export const postUsuario = async (req, res, next) => {
  try {
    const data = await createUsuario(req.body)
    return res.json({ success: true, message: 'Usuario creado exitosamente', data })
  } catch (error) {
    if (error.message.includes('ya existe')) {
      return res.status(400).json({ success: false, message: error.message })
    }
    return next(error)
  }
}

export const putUsuario = async (req, res, next) => {
  try {
    await updateUsuario(Number(req.params.id), req.body)
    return res.json({ success: true, message: 'Usuario actualizado exitosamente' })
  } catch (error) {
    return next(error)
  }
}

export const delUsuario = async (req, res, next) => {
  try {
    await deleteUsuario(Number(req.params.id))
    return res.json({ success: true, message: 'Usuario eliminado exitosamente' })
  } catch (error) {
    return next(error)
  }
}

export const desconectarUsuarioEndpoint = async (req, res, next) => {
  try {
    const idUsuario = Number(req.params.id)

    // 1. Invalidar en base de datos: poner sesion_id = NULL
    const pool = await getPool()
    await pool.request()
      .input('idusuario', sql.Int, idUsuario)
      .query('UPDATE sisec_usuarios SET sesion_id = NULL WHERE idusuario = @idusuario')

    // 2. Desconectar físicamente el WebSocket
    desconectarUsuario(idUsuario, 'Tu cuenta ha sido cerrada por el administrador.')

    return res.json({ success: true, message: 'Usuario desconectado correctamente.' })
  } catch (error) {
    return next(error)
  }
}
