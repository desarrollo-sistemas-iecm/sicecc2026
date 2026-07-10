// API routes index for SISEC CC 2026
import { Router } from 'express'
import authRoutes from './authRoutes.js'
import formatosRoutes from './formatosRoutes.js'
import programacionRoutes from './programacionRoutes.js'
import cursosRoutes from './cursosRoutes.js'
import actividadesRoutes from './actividadesRoutes.js'
import encuestasRoutes from './encuestasRoutes.js'
import reportesRoutes from './reportesRoutes.js'
import uploadsRoutes from './uploadsRoutes.js'
import notificacionesRoutes from './notificacionesRoutes.js'
import adminRoutes from './adminRoutes.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/formatos', formatosRoutes)
router.use('/programacion', programacionRoutes)
router.use('/cursos', cursosRoutes)
router.use('/actividades', actividadesRoutes)
router.use('/encuestas', encuestasRoutes)
router.use('/reportes', reportesRoutes)
router.use('/uploads', uploadsRoutes)
router.use('/notificaciones', notificacionesRoutes)
router.use('/admin', adminRoutes)

export default router
