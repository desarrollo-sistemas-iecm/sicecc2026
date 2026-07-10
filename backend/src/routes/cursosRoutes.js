// Cursos routes for SISEC CC 2026
import { Router } from 'express'
import { query } from 'express-validator'
import { auth } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import { listarCursos } from '../controllers/cursosController.js'

const router = Router()

router.get('/', auth, [query('vertiente').isInt()], validate, listarCursos)

export default router
