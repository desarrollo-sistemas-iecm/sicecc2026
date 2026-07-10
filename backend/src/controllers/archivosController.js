import fs from 'fs/promises'
import path from 'path'
import { env } from '../config/env.js'
import { crearNotificacion } from '../models/notificacionModel.js'

// Navegación de directorios
export const getArchivosTree = async (req, res, next) => {
  try {
    const { folder = '' } = req.query
    const baseDir = path.resolve(env.uploadPath)
    const targetDir = path.resolve(baseDir, folder)

    // Seguridad: prevenir Path Traversal
    if (!targetDir.startsWith(baseDir)) {
      return res.status(403).json({ success: false, message: 'Ruta no permitida' })
    }

    let entries = []
    try {
      entries = await fs.readdir(targetDir, { withFileTypes: true })
    } catch (e) {
      // Directorio no existe o vacío
      entries = []
    }

    const items = []
    for (const entry of entries) {
      const isDir = entry.isDirectory()
      let size = 0
      let modified = null
      
      if (!isDir) {
        const stats = await fs.stat(path.join(targetDir, entry.name))
        size = stats.size
        modified = stats.mtime
      }

      items.push({
        name: entry.name,
        isDir,
        path: path.join(folder, entry.name).replace(/\\/g, '/'),
        size,
        modified
      })
    }

    // Ordenar carpetas primero
    items.sort((a, b) => {
      if (a.isDir === b.isDir) return a.name.localeCompare(b.name)
      return a.isDir ? -1 : 1
    })

    return res.json({ success: true, data: items })
  } catch (error) {
    return next(error)
  }
}

export const deleteArchivo = async (req, res, next) => {
  try {
    const { filepath } = req.body
    const baseDir = path.resolve(env.uploadPath)
    const targetPath = path.resolve(baseDir, filepath)

    if (!targetPath.startsWith(baseDir)) {
      return res.status(403).json({ success: false, message: 'Ruta no permitida' })
    }

    await fs.unlink(targetPath)

    // Aquí registraríamos en sisec_auditoria_archivos si la tabla existiera
    // y emitimos notificación
    await crearNotificacion({
      tipo: 'archivo_actualizado',
      titulo: 'Archivo eliminado por administrador',
      mensaje: `El archivo ${path.basename(filepath)} ha sido eliminado.`,
      idsede_origen: 0,
      idsede_destino: 0,
      idusuario_destino: 0
    })

    return res.json({ success: true, message: 'Archivo eliminado exitosamente' })
  } catch (error) {
    return next(error)
  }
}

export const replaceArchivo = async (req, res, next) => {
  try {
    const { filepath } = req.body
    const file = req.files?.archivo?.[0]

    if (!file) {
      return res.status(400).json({ success: false, message: 'No se proporcionó archivo de reemplazo' })
    }

    const baseDir = path.resolve(env.uploadPath)
    const targetPath = path.resolve(baseDir, filepath)

    if (!targetPath.startsWith(baseDir)) {
      // Eliminar el temp file
      await fs.unlink(file.path)
      return res.status(403).json({ success: false, message: 'Ruta no permitida' })
    }

    // Sobrescribir (Mover el archivo subido al targetPath)
    await fs.copyFile(file.path, targetPath)
    await fs.unlink(file.path)

    await crearNotificacion({
      tipo: 'archivo_actualizado',
      titulo: 'Archivo reemplazado por administrador',
      mensaje: `El archivo ${path.basename(filepath)} ha sido actualizado en sistema.`,
      idsede_origen: 0,
      idsede_destino: 0,
      idusuario_destino: 0
    })

    return res.json({ success: true, message: 'Archivo reemplazado exitosamente' })
  } catch (error) {
    return next(error)
  }
}
