// Uploads controller for SISEC CC 2026
import path from 'path'
import fs from 'fs'
import { env } from '../config/env.js'

import { getPool } from '../config/db.js'

export const descargarArchivo = (req, res) => {
  const { carpeta, sede, archivo } = req.params
  const filePath = path.resolve(env.uploadPath, carpeta, sede, archivo)

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'Archivo no encontrado.' })
  }

  return res.download(filePath)
}

export const descargarManual = async (req, res, next) => {
  try {
    const pool = await getPool()
    const result = await pool.request().query(`
      SELECT habilitado FROM sisec_config_fechas WHERE modulo = 'manual'
    `)
    const habilitado = result.recordset.length > 0 ? Boolean(result.recordset[0].habilitado) : false

    // Si no está habilitado y el usuario no es admin/superadmin (idpermiso >= 2), denegar
    const userPermiso = Number(req.user.permiso || req.user.idpermiso)
    if (!habilitado && userPermiso < 2) {
      return res.status(403).json({ success: false, message: 'El manual de usuario no está habilitado actualmente.' })
    }

    const filePath = path.resolve(env.uploadPath, 'Manual_SISEC_CC_2026.pdf')
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Archivo de manual no encontrado en el servidor.' })
    }

    return res.download(filePath, 'Manual_SISEC_CC_2026.pdf')
  } catch (error) {
    return next(error)
  }
}

