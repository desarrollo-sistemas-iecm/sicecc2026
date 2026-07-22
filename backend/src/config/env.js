// Environment loader for SISEC CC 2026
import dotenv from 'dotenv'
import os from 'os'

const envName = process.env.NODE_ENV || 'development'
const envFile = `.env.${envName}`

dotenv.config({ path: envFile })

// Función para obtener la IP activa de la máquina
const getLocalIp = () => {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address
      }
    }
  }
  return 'localhost'
}

const ip = getLocalIp()

// Si la máquina tiene la IP del servidor de desarrollo, forzamos puerto 3005
const resolvedPort = (ip === '145.0.40.48')
  ? 3005
  : (parseInt(process.env.PORT, 10) || 3000)

export const env = {
  nodeEnv: envName,
  port: resolvedPort,
  ip: ip,
  db: {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT || 1433)
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN
  },
  corsOrigin: process.env.CORS_ORIGIN,
  logLevel: process.env.LOG_LEVEL || 'info',
  uploadPath: process.env.UPLOAD_PATH || './uploads',
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID
  }
}

