import { Router } from 'express'
import { auth } from '../middlewares/auth.js'
import { listNotificaciones, leerNotificacion, leerTodasNotificaciones, listSolicitudesPendientes } from '../controllers/notificacionesController.js'

const router = Router()

router.get('/', auth, listNotificaciones)
router.patch('/leer-todas', auth, leerTodasNotificaciones)
router.patch('/:id/leer', auth, leerNotificacion)
// Solo SuperAdmin debería acceder a las solicitudes pendientes (lo manejamos luego con roleGuard o simplemente asumiendo auth por ahora)
router.get('/solicitudes-pendientes', auth, listSolicitudesPendientes)

export default router
