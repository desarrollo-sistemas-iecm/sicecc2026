import { Router } from 'express'
import { auth } from '../middlewares/auth.js'
import multer from 'multer'
import { listConfigFechas, saveConfigFechas, requestFechaExcepcion, getManualConfig, saveManualConfig, getAlertaLoginConfig, saveAlertaLoginConfig, getUltimaActualizacionConfig, saveUltimaActualizacionConfig } from '../controllers/adminController.js'
import { getUsuarios, postUsuario, putUsuario, delUsuario, desconectarUsuarioEndpoint } from '../controllers/usuariosController.js'
import { getArchivosTree, deleteArchivo, replaceArchivo } from '../controllers/archivosController.js'
import { listAdminFormatos, uploadAdminFormato, deleteAdminFormato } from '../controllers/adminFormatosController.js'

const upload = multer({ dest: 'uploads/temp/' })

const router = Router()

// Middleware básico para proteger rutas de Super Admin (idpermiso = 3)
const isSuperAdmin = (req, res, next) => {
  if (req.user && Number(req.user.permiso || req.user.idpermiso) >= 2) {
    // Actually, allowing admins (2) and superadmins (3)
    return next()
  }
  return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere nivel de Administrador.' })
}

// Rutas de Restricciones
router.get('/restricciones', auth, listConfigFechas)
router.post('/restricciones', auth, isSuperAdmin, saveConfigFechas)
router.post('/restricciones/solicitar', auth, requestFechaExcepcion)

// Configuración del Manual de Usuario
router.get('/manual-config', auth, getManualConfig)
router.post('/manual-config', auth, isSuperAdmin, saveManualConfig)

// Configuración de la Alerta del Manual en el Login
router.get('/alerta-login-config', auth, getAlertaLoginConfig)
router.post('/alerta-login-config', auth, isSuperAdmin, saveAlertaLoginConfig)

// Configuración de la Última Actualización del Código
router.get('/ultima-actualizacion-config', getUltimaActualizacionConfig)
router.post('/ultima-actualizacion-config', auth, isSuperAdmin, saveUltimaActualizacionConfig)




// Rutas de Usuarios
router.get('/usuarios', auth, isSuperAdmin, getUsuarios)
router.post('/usuarios', auth, isSuperAdmin, postUsuario)
router.put('/usuarios/:id', auth, isSuperAdmin, putUsuario)
router.delete('/usuarios/:id', auth, isSuperAdmin, delUsuario)
router.put('/usuarios/:id/desconectar', auth, isSuperAdmin, desconectarUsuarioEndpoint)

// Rutas de Archivos
router.get('/archivos', auth, isSuperAdmin, getArchivosTree)
router.delete('/archivos', auth, isSuperAdmin, deleteArchivo)
router.post('/archivos/replace', auth, isSuperAdmin, upload.fields([{ name: 'archivo', maxCount: 1 }]), replaceArchivo)

// Solicitud de cambio de archivo por el operador
router.post('/archivos/solicitar', auth, upload.fields([{ name: 'archivo', maxCount: 1 }]), async (req, res, next) => {
  try {
    const file = req.files?.archivo?.[0]
    if (!file) {
      return res.status(400).json({ success: false, message: 'No se subió ningún archivo' })
    }
    
    // Aquí el archivo se queda en uploads/temp/
    // Enviamos notificación al Super Admin
    const { crearNotificacion } = await import('../models/notificacionModel.js')
    await crearNotificacion({
      tipo: 'solicitud_archivo',
      titulo: `Solicitud de cambio de archivo: Dtto ${req.user.idsede}`,
      mensaje: `El Distrito ${req.user.idsede} solicita reemplazar un archivo. Archivo temporal: ${file.filename}`,
      idsede_origen: req.user.idsede,
      idsede_destino: 0,
      idusuario_destino: 0
    })

    return res.json({ success: true, message: 'Solicitud enviada' })
  } catch (error) {
    return next(error)
  }
})

// Rutas de Formatos (Admin)
router.get('/formatos', auth, isSuperAdmin, listAdminFormatos)
router.post('/formatos/subir', auth, isSuperAdmin, upload.fields([{ name: 'archivo', maxCount: 1 }]), uploadAdminFormato)
router.delete('/formatos/:archivo', auth, isSuperAdmin, deleteAdminFormato)

export default router
