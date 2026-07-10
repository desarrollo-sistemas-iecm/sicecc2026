// Uploads routes for SISEC CC 2026
import { Router } from 'express'
import { auth } from '../middlewares/auth.js'
import { descargarArchivo, descargarManual } from '../controllers/uploadsController.js'

const router = Router()

router.get('/manual/descargar', auth, descargarManual)
router.get('/:carpeta/:sede/:archivo', auth, descargarArchivo)


export default router
