import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import { env } from './config/env.js'
import { logger } from './config/logger.js'

let io = null
export const usuariosConectados = new Map() // idUsuario -> { socketId, username, idsede, idpermiso, sesionId }

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    transports: ['polling', 'websocket'],
    cors: {
      origin: (origin, callback) => {
        // Permitir localhost en desarrollo o el origen de CORS configurado
        if (!origin || origin.startsWith('http://localhost:') || origin === 'http://localhost') {
          return callback(null, true)
        }
        const corsOrigins = env.corsOrigin && env.corsOrigin.includes(',')
          ? env.corsOrigin.split(',').map(o => o.trim())
          : env.corsOrigin;
        const allowed = Array.isArray(corsOrigins) ? corsOrigins : [corsOrigins]
        if (allowed.includes(origin)) {
          return callback(null, true)
        }
        callback(null, false)
      },
      credentials: true
    }
  })

  // Middleware del handshake
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) {
      return next(new Error('Token de conexión no provisto.'))
    }
    try {
      const decoded = jwt.verify(token, env.jwt.secret)
      socket.usuario = decoded // Contiene idUsuario, nombre, idsede, permiso, sesionId
      next()
    } catch (err) {
      return next(new Error('Token de conexión inválido o expirado.'))
    }
  })

  io.on('connection', (socket) => {
    const { idUsuario, nombre, idsede, permiso, sesionId } = socket.usuario

    // Registrar en el mapa activo
    usuariosConectados.set(Number(idUsuario), {
      socketId: socket.id,
      username: nombre,
      idsede: Number(idsede),
      idpermiso: Number(permiso),
      sesionId
    })

    // Unir a sala privada y a salas por rol
    socket.join(`usuario_${idUsuario}`)
    if (Number(permiso) === 1) socket.join('operadores')
    if (Number(permiso) === 2) socket.join('admins')
    if (Number(permiso) === 3) socket.join('superadmins')

    logger.info(`[WS]       🔌 Usuario conectado: ${nombre} (Sede: ${idsede}) — Socket: ${socket.id}`)

    // Emitir presencia global a todos los clientes
    broadcastPresencia()

    socket.on('disconnect', () => {
      const active = usuariosConectados.get(Number(idUsuario))
      if (active && active.socketId === socket.id) {
        usuariosConectados.delete(Number(idUsuario))
        logger.info(`[WS]       🔌 Usuario desconectado: ${nombre} — Socket: ${socket.id}`)
        broadcastPresencia()
      }
    })
  })

  logger.info('[INFO]    🔌 Servidor Socket.io inicializado correctamente')
  return io
}

export const getIo = () => {
  if (!io) {
    throw new Error('Socket.io no ha sido inicializado. Llama initSocket primero.')
  }
  return io
}

// Emite la lista de ids de usuarios conectados a todos
const broadcastPresencia = () => {
  if (!io) return
  const conectados = Array.from(usuariosConectados.keys()).map(Number)
  io.emit('usuarios:estado', conectados)
  io.to('superadmins').emit('sesiones_actualizadas', Array.from(usuariosConectados.values()))
}

// Desconecta físicamente a un usuario específico en tiempo real
export const desconectarUsuario = (idUsuario, mensaje = 'Tu sesión ha sido invalidada.') => {
  const conectado = usuariosConectados.get(Number(idUsuario))
  if (conectado) {
    try {
      const socket = io.sockets.sockets.get(conectado.socketId)
      if (socket) {
        socket.emit('sesion:invalidada', { mensaje })
        socket.emit('logout_forced', { reason: mensaje, mensaje })
        socket.disconnect(true)
      }
    } catch (err) {
      logger.error(`[WS_ERROR] Error al desconectar socket para usuario ${idUsuario}: ${err.message}`)
    }
    usuariosConectados.delete(Number(idUsuario))
    broadcastPresencia()
  }
}
