// Express app for SISEC CC 2026
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import path from 'path'
import { fileURLToPath } from 'url'
import { env } from './config/env.js'
import { logger } from './config/logger.js'
import routes from './routes/index.js'
import { errorHandler } from './middlewares/errorHandler.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// Modificamos helmet para permitir que cargue recursos locales y scripts inline de Vue si es necesario en producción
app.use(
  helmet({
    contentSecurityPolicy: false // O configuraciones personalizadas si es estricto en producción
  })
)
// Configuración de CORS dinámica para soportar múltiples orígenes
const corsOrigins = env.corsOrigin && env.corsOrigin.includes(',') 
  ? env.corsOrigin.split(',').map(o => o.trim()) 
  : env.corsOrigin;

app.use(cors({
  origin: (origin, callback) => {
    // Permitir solicitudes sin origen (como Postman o peticiones del mismo servidor)
    // y permitir cualquier puerto de localhost en desarrollo
    if (!origin || origin.startsWith('http://localhost:') || origin === 'http://localhost') {
      return callback(null, true)
    }
    
    const allowed = Array.isArray(corsOrigins) ? corsOrigins : [corsOrigins]
    if (allowed.includes(origin)) {
      return callback(null, true)
    }
    
    callback(null, false)
  },
  credentials: true
}))
app.use(express.json())
app.use(morgan('dev'))

// Rutas de la API (soporte estándar directo y bajo subruta)
const apiPrefixes = ['/api', '/sisec_2026/api', '/sicec_2026/api']
apiPrefixes.forEach((prefix) => {
  app.use(prefix, routes)
  app.use(prefix, (req, res) => {
    res.status(404).json({ success: false, message: 'Ruta de API no encontrada' })
  })
})

// Servir archivos estáticos del frontend (compilados en backend/public)
const publicPath = path.join(__dirname, '../public')
app.use(express.static(publicPath, { redirect: false }))
app.use('/sisec_2026', express.static(publicPath, { redirect: false }))
app.use('/sicec_2026', express.static(publicPath, { redirect: false }))

// Middleware fallback para soportar Vue Router en modo History
// Protege explícitamente las rutas de /api y /socket.io para no entregarles index.html
app.use((req, res, next) => {
  if (
    req.method === 'GET' &&
    !req.path.startsWith('/api') &&
    !req.path.includes('/api/') &&
    !req.path.includes('/socket.io') &&
    req.headers.accept &&
    req.headers.accept.includes('text/html')
  ) {
    return res.sendFile(path.join(publicPath, 'index.html'))
  }
  next()
})

// Manejo de recursos no encontrados final
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Recurso no encontrado' })
})

app.use(errorHandler)

logger.info('[INFO]    ✅ App inicializada')

export default app
