// Server bootstrap for SISEC CC 2026
import { createServer } from 'http'
import app from './app.js'
import { env } from './config/env.js'
import { connectDb } from './config/db.js'
import { logger } from './config/logger.js'
import { initSocket } from './socket.js'

const startServer = async () => {
  let server = null
  try {
    await connectDb()

    // Importar e inicializar el servicio de Telegram al arranque para arrancar programadores periódicos
    await import('./services/telegram.service.js')

    let serverUrl = `http://localhost:${env.port}`
    if (env.nodeEnv === 'production') {
      serverUrl = 'https://aplicaciones.iecm.mx/sicec_2026'
    } else if (env.ip === '145.0.40.48') {
      serverUrl = `http://145.0.40.48:${env.port}/sicec_2026`
    }

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
  }

  server = createServer(app)
  initSocket(server)

  server.listen(env.port, () => {
    logger.info(`[INFO]    🚀 Servidor escuchando en ${env.port}`)
  })
}

startServer()
