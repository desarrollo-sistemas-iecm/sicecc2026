// Encuestas routes for SISEC CC 2026
import { Router } from 'express'
import { body, query } from 'express-validator'
import { auth } from '../middlewares/auth.js'
import { validate, validateEncuesta } from '../middlewares/validate.js'
import { crearEncuesta, obtenerFolio } from '../controllers/encuestasController.js'

const router = Router()

router.get('/folio', auth, [query('tipo').isIn(['T', 'I']), query('distrito').optional().isInt()], validate, obtenerFolio)
router.post(
	'/',
	auth,
	[
		body('tipo').isInt({ min: 1 }),
		body('folio_encuesta').notEmpty(),
		body('edad').isInt({ min: 1, max: 120 }),
		body('genero').isInt({ min: 1 }),
		body('etiqueta2').isInt({ min: 1, max: 5 }),
		body('etiqueta3').isInt({ min: 1, max: 5 }),
		body('etiqueta4').isInt({ min: 1, max: 5 }),
		body('etiqueta5').isInt({ min: 1, max: 5 }),
		body('etiqueta6').isInt({ min: 1, max: 5 }),
		body('etiqueta7').isInt({ min: 1, max: 5 })
	],
	validateEncuesta,
	crearEncuesta
)

export default router
