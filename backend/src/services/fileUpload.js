// File upload service for SISEC CC 2026
import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'
import { env } from '../config/env.js'
import { getActividadContext } from '../models/actividadModel.js'

const buildFolderName = (idcurso, idtipo) => {
  const now = new Date()
  const y = String(now.getFullYear())
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  return `${idcurso}_${idtipo}_${y}${m}${d}_${hh}${mm}${ss}`
}

export const prepareUploadContext = async (req, res, next) => {
  try {
    const idcurso = Number(req.params.id)
    const context = await getActividadContext(idcurso)
    if (!context) {
      return res.status(404).json({ success: false, message: 'Actividad no encontrada.' })
    }

    const distrito = req.user.idsede
    const baseDir = path.resolve(env.uploadPath, `DTO-${distrito}`)
    const folderName = buildFolderName(context.idcurso, context.idtipo)
    const destDir = path.join(baseDir, folderName)

    await fs.mkdir(destDir, { recursive: true })

    req.uploadContext = {
      dir: destDir,
      folder: folderName
    }

    return next()
  } catch (error) {
    return next(error)
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, req.uploadContext?.dir || env.uploadPath)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    let baseName = 'ARCHIVO'

    if (file.fieldname === 'anexo1') baseName = 'ANEXO1'
    if (file.fieldname === 'anexo2') baseName = 'ANEXO2'
    if (file.fieldname === 'imagen') baseName = 'IMAGEN'

    const now = new Date()
    const y = String(now.getFullYear())
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    const hh = String(now.getHours()).padStart(2, '0')
    const mm = String(now.getMinutes()).padStart(2, '0')
    const ss = String(now.getSeconds()).padStart(2, '0')
    const sede = String(req.user?.idsede ?? '0')

    cb(null, `${baseName}_D${sede}_${y}${m}${d}_${hh}${mm}${ss}${ext}`)
  }
})

const allowedExt = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.gif'])

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (!allowedExt.has(ext)) {
      return cb(new Error('Tipo de archivo no permitido.'))
    }
    return cb(null, true)
  }
})
