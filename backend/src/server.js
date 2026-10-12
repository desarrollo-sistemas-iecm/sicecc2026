// Server bootstrap for SISEC CC 2026
import { createServer } from 'http'
import app from './app.js'
import { env } from './config/env.js'
import { connectDb } from './config/db.js'
import { logger, logError } from './config/logger.js'
import { initSocket } from './socket.js'

// Captura global de excepciones no controladas y promesas rechazadas
process.on('uncaughtException', (err) => {
  logger.error(`[UNCAUGHT_EXCEPTION] ${err.message}\n${err.stack}`)
  logError({
    message: err.message,
    where: 'Proceso Node.js (uncaughtException)',
    stack: err.stack
  })
})

process.on('unhandledRejection', (reason) => {
  const msg = reason instanceof Error ? reason.message : String(reason)
  const stack = reason instanceof Error ? reason.stack : ''
  logger.error(`[UNHANDLED_REJECTION] ${msg}\n${stack}`)
  logError({
    message: msg,
    where: 'Promesa no manejada (unhandledRejection)',
    stack: stack
  })
})

const startServer = async () => {
  let server = null
  try {
    await connectDb()

    // Importar e inicializar el servicio de Telegram al arranque para arrancar programadores periódicos
    await import('./services/telegram.service.js')

    const serverUrl = env.appUrl || `http://localhost:${env.port}`

    logger.info('╔══════════════════════════════════════╗')
    logger.info('║     SISEC CC 2026 — Backend API      ║')
    logger.info('╚══════════════════════════════════════╝')
    logger.info(`🌐 Ambiente     : ${env.nodeEnv}`)
    logger.info(`🚀 Servidor     : ${serverUrl}`)
    logger.info(`📦 Base de datos: ${env.db.database} @ ${env.db.server}`)
    logger.info('✅ Conexión BD  : Exitosa')
    logger.info('📋 Versión API  : v1')
    logger.info(`⏰ Inicio       : ${new Date().toISOString().replace('T', ' ').slice(0, 19)}`)
    logger.info('══════════════════════════════════════════')
  } catch (error) {
    logger.error('❌ ERROR DE CONEXIÓN A BASE DE DATOS')
    logger.error(`   Servidor : ${env.db.server}:${env.db.port}`)
    logger.error(`   BD       : ${env.db.database}`)
    logger.error(`   Error    : ${error.message}`)
    logger.error('   >> Revisa tus variables de entorno y acceso al servidor SQL.')
    logError({
      message: `Fallo de conexión a Base de Datos SQL Server: ${error.message}`,
      where: `Arranque de Servidor (Conexión BD: ${env.db.database} @ ${env.db.server}:${env.db.port})`,
      stack: error.stack
    })
  }

  server = createServer(app)
  const io = initSocket(server)
  app.set('io', io)

  server.listen(env.port, () => {
    logger.info(`[INFO]    🚀 Servidor escuchando en ${env.port}`)
  })
}

startServer()
