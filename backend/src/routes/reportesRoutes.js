// Reportes routes for SISEC CC 2026
import { Router } from 'express'
import { body } from 'express-validator'
import { auth } from '../middlewares/auth.js'
import { validateReporte } from '../middlewares/validate.js'
import { catalogosReportes, generarReporte } from '../controllers/reportesController.js'

const router = Router()

// Tipos que NO requieren filtro de fechas
const TIPOS_SIN_FECHA = [4, 9]

router.get('/catalogos', auth, catalogosReportes)

router.post(
  '/generar',
  auth,
  [
    body('tipo')
      .isInt({ min: 1, max: 14 })
      .withMessage('Tipo de reporte invalido'),

    // Fecha inicial: requerida solo para tipos que sí usan fechas
    body('fechaInic')
      .if((value, { req }) => !TIPOS_SIN_FECHA.includes(Number(req.body.tipo)))
      .notEmpty()
      .withMessage('Fecha inicial requerida')
      .isDate()
      .withMessage('Fecha inicial invalida'),

    // Fecha final: requerida + validación de rango
    body('fechaFin')
      .if((value, { req }) => !TIPOS_SIN_FECHA.includes(Number(req.body.tipo)))
      .notEmpty()
      .withMessage('Fecha final requerida')
      .isDate()
      .withMessage('Fecha final invalida')
      .custom((val, { req }) => {
        if (val && req.body.fechaInic && val < req.body.fechaInic) {
          throw new Error('Fecha final debe ser mayor o igual a fecha inicial')
        }
        return true
      }),
  ],
  validateReporte,
  generarReporte
)

export default router
