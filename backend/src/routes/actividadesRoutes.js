// Actividades routes for SISEC CC 2026
import { Router } from 'express'
import { body } from 'express-validator'
import { auth } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import { prepareUploadContext, upload } from '../services/fileUpload.js'
import {
  listActividades,
  marcarRealizada,
  marcarNoRealizada,
  reprogramarActividad,
  eliminarActividad,
  getDashboardStats,
  getAdminStats
} from '../controllers/actividadesController.js'

const router = Router()

router.get('/admin/dashboard/metricas', auth, getAdminStats)
router.get('/dashboard/metricas', auth, getDashboardStats)
router.get('/', auth, listActividades)
router.put(
  '/:id/realizada',
  auth,
  prepareUploadContext,
  upload.fields([
    { name: 'anexo1', maxCount: 1 },
    { name: 'anexo2', maxCount: 1 },
    { name: 'imagen', maxCount: 1 }
  ]),
  [body('modalidad').isInt()],
  validate,
  marcarRealizada
)
router.put(
  '/:id/norealizada',
  auth,
  [body('motivo_norealizada').optional().isString(), body('motivo').optional().isString()],
  validate,
  marcarNoRealizada
)
router.put(
  '/:id/reprogramar',
  auth,
  [body('fecha').isISO8601(), body('hora_programada').optional().isString(), body('hora').optional().isString()],
  validate,
  reprogramarActividad
)
router.delete('/:id', auth, eliminarActividad)

export default router
