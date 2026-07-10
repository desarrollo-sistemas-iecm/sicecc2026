import {
  listActividadesBySede,
  marcarRealizada as updateRealizada,
  marcarNoRealizada as updateNoRealizada,
  reprogramarActividad as updateReprogramar,
  eliminarActividad as updateEliminar,
  getArchivosActuales,
  getDashboardMetrics,
  getAdminDashboardMetrics
} from '../models/actividadModel.js'
import { logger } from '../config/logger.js'

export const getAdminStats = async (req, res, next) => {
  try {
    const data = await getAdminDashboardMetrics()
    return res.json({ success: true, data })
  } catch (error) {
    return next(error)
  }
}

export const getDashboardStats = async (req, res, next) => {
  try {
    const data = await getDashboardMetrics(req.user.idsede)
    return res.json({ success: true, data })
  } catch (error) {
    return next(error)
  }
}

export const listActividades = async (req, res, next) => {
  try {
    const data = await listActividadesBySede(req.user.idsede)
    logger.info(`[ACTION]  📋 Actividades cargadas — Sede: ${req.user.idsede} | Total: ${data.length}`)
    return res.json({ success: true, data })
  } catch (error) {
    return next(error)
  }
}

export const marcarRealizada = async (req, res, next) => {
  try {
    const idcurso = Number(req.params.id)
    const archivos = await getArchivosActuales(idcurso)


    const anexo1 = req.files?.anexo1?.[0]?.filename || archivos.nombre_archivo || null
    const anexo2 = req.files?.anexo2?.[0]?.filename || archivos.nombre_archivo2 || null
    const imagen = req.files?.imagen?.[0]?.filename || archivos.nombre_archivo3 || null

    const payload = {
      modalidad: Number(req.body.modalidad),
      duracionhrs: Number(req.body.duracionhrs || 0),
      duracionmin: Number(req.body.duracionmin || 0),
      comentarios: req.body.comentarios || '',
      pmujeres1: Number(req.body.pmujeres1 || 0),
      pmujeres2: Number(req.body.pmujeres2 || 0),
      pmujeres3: Number(req.body.pmujeres3 || 0),
      pmujeres4: Number(req.body.pmujeres4 || 0),
      pmujeres5: Number(req.body.pmujeres5 || 0),
      pmujeres6: Number(req.body.pmujeres6 || 0),
      pmujeres7: Number(req.body.pmujeres7 || 0),
      pmujeres8: Number(req.body.pmujeres8 || 0),
      phombres1: Number(req.body.phombres1 || 0),
      phombres2: Number(req.body.phombres2 || 0),
      phombres3: Number(req.body.phombres3 || 0),
      phombres4: Number(req.body.phombres4 || 0),
      phombres5: Number(req.body.phombres5 || 0),
      phombres6: Number(req.body.phombres6 || 0),
      phombres7: Number(req.body.phombres7 || 0),
      phombres8: Number(req.body.phombres8 || 0),
      nombre_archivo: anexo1,
      nombre_archivo2: anexo2,
      nombre_archivo3: imagen
    }

    await updateRealizada(idcurso, payload)
    logger.info(`[ACTION]  ✔️  Actividad realizada — ID: ${idcurso} | Usuario: ${req.user.nombre}`)

    return res.json({
      success: true,
      carpeta: req.uploadContext?.folder || null,
      archivos: {
        nombre_archivo: anexo1,
        nombre_archivo2: anexo2,
        nombre_archivo3: imagen
      }
    })
  } catch (error) {
    return next(error)
  }
}

export const marcarNoRealizada = async (req, res, next) => {
  try {
    const idcurso = Number(req.params.id)
    const motivo = req.body.motivo_norealizada ?? req.body.motivo ?? ''
    if (!motivo || motivo.trim().length < 10) {
      return res.status(422).json({
        success: false,
        message: 'Datos invalidos',
        errors: [{ field: 'motivo', msg: 'El motivo es obligatorio' }]
      })
    }
    await updateNoRealizada(idcurso, motivo)
    logger.info(`[ACTION]  ❌ Actividad no realizada — ID: ${idcurso} | Motivo: ${motivo}`)
    return res.json({ success: true, message: 'Actividad actualizada' })
  } catch (error) {
    return next(error)
  }
}

export const reprogramarActividad = async (req, res, next) => {
  try {
    const idcurso = Number(req.params.id)
    const hora = req.body.hora_programada ?? req.body.hora
    await updateReprogramar(idcurso, req.body.fecha, hora)
    logger.info(`[ACTION]  📅 Actividad reprogramada — ID: ${idcurso} | Nueva fecha: ${req.body.fecha} ${hora}`)
    return res.json({ success: true, message: 'Actividad actualizada' })
  } catch (error) {
    return next(error)
  }
}

export const eliminarActividad = async (req, res, next) => {
  try {
    const idcurso = Number(req.params.id)
    await updateEliminar(idcurso)
    return res.json({ success: true })
  } catch (error) {
    return next(error)
  }
}
