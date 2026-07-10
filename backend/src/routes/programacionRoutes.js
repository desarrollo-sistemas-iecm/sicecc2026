// Programacion routes for SISEC CC 2026
import { Router } from 'express'
import { body } from 'express-validator'
import { auth } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import { listProgramacion, createProgramacion } from '../controllers/programacionController.js'

const router = Router()

router.get('/', auth, listProgramacion)
router.post(
  '/',
  auth,
  [
    body('idcatcurso').optional({ nullable: true }).isInt(),
    body('vertiente').optional({ nullable: true }).isInt(),
    body('tipo_publico').optional({ nullable: true }).isInt(),
    body('fecha').optional().isISO8601(),
    body('hora_programada').optional().isString()
  ],
  validate,
  createProgramacion
)

export default router
