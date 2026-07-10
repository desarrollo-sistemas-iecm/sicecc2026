// Formatos routes for SISEC CC 2026
import { Router } from 'express'
import { auth } from '../middlewares/auth.js'
import { listFormatos, downloadFormato } from '../controllers/formatosController.js'

const router = Router()

router.get('/', auth, listFormatos)
router.get('/descargar/:archivo', auth, downloadFormato)

export default router
