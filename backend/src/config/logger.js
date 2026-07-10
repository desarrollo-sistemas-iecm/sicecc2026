// Logger configuration for SISEC CC 2026
import winston from 'winston'
import { env } from './env.js'

const formatter = winston.format.printf(({ level, message, timestamp }) => {
  return `[${timestamp}] ${message}`
})

export const logger = winston.createLogger({
  level: env.logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    formatter
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/app.log' })
  ]
})
