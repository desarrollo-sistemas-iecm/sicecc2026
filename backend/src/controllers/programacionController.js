// Programacion controller for SISEC CC 2026
import { listProgramacionBySede, createProgramacion as createProgramacionModel } from '../models/programacionModel.js'
import { logger, logAction, userTag } from '../config/logger.js'

export const listProgramacion = async (req, res, next) => {
  try {
    const data = await listProgramacionBySede(req.user.idsede)
    return res.json({ success: true, data })
  } catch (error) {
    return next(error)
  }
}

export const createProgramacion = async (req, res, next) => {
  try {
    const toIntOrNull = (value) => {
      if (value === '' || value === null || value === undefined) return null
      const parsed = Number.parseInt(value, 10)
      return Number.isNaN(parsed) ? null : parsed
    }

    const now = new Date()
    const year = String(now.getFullYear())
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const fechaAlta = `${year}-${month}-${day}`
    const horaAlta = `${hours}:${minutes}`
    const horaProgramada = req.body.hora_programada ?? ''
    const [duracionhrs, duracionmin] = String(horaProgramada).split(':')
    const parsedHrs = Number.parseInt(duracionhrs, 10)
    const parsedMin = Number.parseInt(duracionmin, 10)
    const convenioValue = req.body.convenio ?? req.body.convenio_dele ?? null

    const payload = {
      ...req.body,
      idcatcurso: toIntOrNull(req.body.idcatcurso),
      vertiente: toIntOrNull(req.body.vertiente),
      idtipopublico: toIntOrNull(req.body.tipo_publico ?? req.body.idtipopublico),
      convenio: toIntOrNull(convenioValue),
      fecha: req.body.fecha ?? null,
      fecha_alta: fechaAlta,
      hora_alta: horaAlta,
      duracionhrs: Number.isNaN(parsedHrs) ? null : parsedHrs,
      duracionmin: Number.isNaN(parsedMin) ? null : parsedMin,
      idusuario: req.user.idUsuario,
      id_distrito: req.user.idsede,
      status: 1
    }

    const idcurso = await createProgramacionModel(payload)
    logAction(`📋 PROGRAMA NUEVO ➜ Programación creada — Curso: ${payload.idcatcurso} — ${userTag(req.user)}`)

    return res.status(201).json({ success: true, idcurso })
  } catch (error) {
    return next(error)
  }
}
