import fs from 'fs'
import path from 'path'
import { logger } from '../config/logger.js'
import { crearNotificacion } from '../models/notificacionModel.js'
import { registrarAuditoriaArchivo } from '../models/auditoriaModel.js'

export const listAdminFormatos = (req, res, next) => {
  try {
    const basePath = process.env.FORMATOS_PATH || './uploads/temp/Archivos/2026/'
    
    if (!fs.existsSync(basePath)) {
      fs.mkdirSync(basePath, { recursive: true })
    }

    const files = fs.readdirSync(basePath)
      .filter(file => file.endsWith('.docx'))
      .filter(file => fs.statSync(path.join(basePath, file)).isFile())

    return res.json({ success: true, data: files })
  } catch (error) {
    return next(error)
  }
}

export const uploadAdminFormato = async (req, res, next) => {
  try {
    if (!req.files || !req.files.archivo || req.files.archivo.length === 0) {
      return res.status(400).json({ success: false, message: 'No se envió ningún archivo.' })
    }

    const file = req.files.archivo[0]
    const nombreArchivo = file.originalname

    const safeNameRegex = /^[a-zA-Z0-9_\-\.]+\.docx$/
    if (!safeNameRegex.test(nombreArchivo)) {
      // Eliminar el archivo temporal subido por multer si no cumple
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path)
      return res.status(400).json({ success: false, message: 'Nombre de archivo inválido. Solo se permite .docx' })
    }

    const basePath = process.env.FORMATOS_PATH || './uploads/temp/Archivos/2026/'
    if (!fs.existsSync(basePath)) {
      fs.mkdirSync(basePath, { recursive: true })
    }

    const destPath = path.join(basePath, nombreArchivo)

    // Mover de temp a destino
    fs.renameSync(file.path, destPath)

    logger.info(`[ACTION] 📝 Formato subido por admin: ${nombreArchivo} por usuario ${req.user.idusuario}`)

    // Registrar en auditoría
    await registrarAuditoriaArchivo(req.user.idusuario, nombreArchivo, 'subir')

    // Notificar a todos los distritos (idsede_destino = 0, idusuario_destino = 0)
    await crearNotificacion({
      tipo: 'archivo_formatos_actualizado',
      titulo: 'Nuevo formato oficial disponible',
      mensaje: `Se ha actualizado el formato oficial: ${nombreArchivo}.`,
      idsede_origen: req.user.idsede || 0,
      idsede_destino: 0,
      idusuario_destino: 0
    })

    return res.json({ success: true, message: 'Archivo subido correctamente.' })
  } catch (error) {
    return next(error)
  }
}

export const deleteAdminFormato = async (req, res, next) => {
  try {
    const { archivo } = req.params

    const safeNameRegex = /^[a-zA-Z0-9_\-\.]+\.docx$/
    if (!safeNameRegex.test(archivo)) {
      return res.status(400).json({ success: false, message: 'Nombre de archivo inválido.' })
    }

    const basePath = process.env.FORMATOS_PATH || './uploads/temp/Archivos/2026/'
    const filePath = path.join(basePath, archivo)

    if (!filePath.startsWith(path.resolve(basePath))) {
      return res.status(403).json({ success: false, message: 'Acceso denegado.' })
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'El archivo no existe.' })
    }

    fs.unlinkSync(filePath)
    
    logger.info(`[ACTION] 🗑️ Formato eliminado por admin: ${archivo} por usuario ${req.user.idusuario}`)
    
    await registrarAuditoriaArchivo(req.user.idusuario, archivo, 'eliminar')

    return res.json({ success: true, message: 'Archivo eliminado correctamente.' })
  } catch (error) {
    return next(error)
  }
}
