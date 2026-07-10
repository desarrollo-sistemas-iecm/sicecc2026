// Auth routes for SISEC CC 2026
import { Router } from 'express'
import { body } from 'express-validator'
import { login, logout } from '../controllers/authController.js'
import { validate } from '../middlewares/validate.js'

const router = Router()

router.post(
  '/login',
  [body('usuario').notEmpty(), body('contrasena').notEmpty()],
  validate,
  login
)

router.post('/logout', logout)

export default router
