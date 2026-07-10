// Formatos controller for SISEC CC 2026
import fs from 'fs'
import path from 'path'

export const listFormatos = (req, res) => {
  res.json({ success: true, data: [] })
}

export const downloadFormato = (req, res) => {
  const { archivo } = req.params

  // Validación anti path traversal y extensión
  const safeNameRegex = /^[a-zA-Z0-9_\-\.]+\.docx$/
  if (!safeNameRegex.test(archivo)) {
    return res.status(400).json({ success: false, message: 'Nombre de archivo inválido.' })
  }

  const basePath = process.env.FORMATOS_PATH || './uploads/temp/Archivos/2026/'
  const filePath = path.resolve(basePath, archivo)

  // Extra validación: asegurarse de que no escapó el directorio base
  if (!filePath.startsWith(path.resolve(basePath))) {
    return res.status(403).json({ success: false, message: 'Acceso denegado.' })
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, error: 'Archivo no encontrado' })
  }

  res.download(filePath, archivo, (err) => {
    if (err) {
      // Evitar crash por cancelación de cliente
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Error al descargar el archivo' })
      }
    }
  })
}
