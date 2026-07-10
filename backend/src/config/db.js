// SQL Server connection for SISEC CC 2026
import sql from 'mssql'
import { env } from './env.js'
import { logger } from './logger.js'

const config = {
  user: env.db.user,
  password: env.db.password,
  server: env.db.server,
  database: env.db.database,
  port: env.db.port,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
}

let poolPromise = null

export const connectDb = async () => {
  try {
    if (!poolPromise) {
      poolPromise = sql.connect(config)
    }
    return await poolPromise
  } catch (error) {
    logger.error(`[ERROR]   💥 Error de conexion BD — ${error.message}`)
    poolPromise = null
    throw error
  }
}

export const getPool = async () => {
  return connectDb()
}

export { sql }
