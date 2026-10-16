import {
  listActividadesBySede,
  marcarRealizada as updateRealizada,
  marcarNoRealizada as updateNoRealizada,
  reprogramarActividad as updateReprogramar,
  eliminarActividad as updateEliminar,
  getArchivosActuales,
  getDashboardMetrics,
  getAdminDashboardMetrics,
  getActividadContext
} from '../models/actividadModel.js'
import { isFechaHabilitada } from '../models/configFechasModel.js'
import { logger, logAction, logQuery, userTag } from '../config/logger.js'

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
    logQuery(`📋 ACTIVIDADES CARGADAS ➜ Sede: ${req.user.idsede} | Total: ${data.length} — ${userTag(req.user)}`)
    return res.json({ success: true, data })
  } catch (error) {
    return next(error)
  }
}

export const marcarRealizada = async (req, res, next) => {
  try {
    const idcurso = Number(req.params.id)
    const ctx = await getActividadContext(idcurso)

    // Validar restricción de fecha para operadores (permiso = 1)
    const userPermiso = Number(req.user.permiso || req.user.idpermiso)
    if (userPermiso === 1 && ctx?.fecha) {
      const habilitada = await isFechaHabilitada('captura', ctx.fecha, req.user.idsede)
      if (!habilitada) {
        return res.status(403).json({
          success: false,
          message: `La actividad con fecha ${ctx.fecha} corresponde a un periodo pasado cerrado. Solicita una excepción al Super Administrador.`
        })
      }
    }

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

    const subType = ctx && ctx.idtipo === 4 ? 'intervenciones' : 'talleres'

    await updateRealizada(idcurso, payload)
    logAction(`✔️ ACT COMPLETA ➜ Actividad realizada — ID: ${idcurso} — ${userTag(req.user)}`, subType)

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
    const ctx = await getActividadContext(idcurso)

    const userPermiso = Number(req.user.permiso || req.user.idpermiso)
    if (userPermiso === 1 && ctx?.fecha) {
      const habilitada = await isFechaHabilitada('captura', ctx.fecha, req.user.idsede)
      if (!habilitada) {
        return res.status(403).json({
          success: false,
          message: `La actividad con fecha ${ctx.fecha} corresponde a un periodo pasado cerrado. Solicita una excepción al Super Administrador.`
        })
      }
    }

    const motivo = req.body.motivo_norealizada ?? req.body.motivo ?? ''
    if (!motivo || motivo.trim().length < 10) {
      return res.status(422).json({
        success: false,
        message: 'Datos invalidos',
        errors: [{ field: 'motivo', msg: 'El motivo es obligatorio' }]
      })
    }
    await updateNoRealizada(idcurso, motivo)
    logAction(`❌ ACT NO COMPLETA ➜ Actividad no realizada — ID: ${idcurso} | Motivo: ${motivo} — ${userTag(req.user)}`)
    return res.json({ success: true, message: 'Actividad actualizada' })
  } catch (error) {
    return next(error)
  }
}

export const reprogramarActividad = async (req, res, next) => {
  try {
    const idcurso = Number(req.params.id)
    const ctx = await getActividadContext(idcurso)

    const userPermiso = Number(req.user.permiso || req.user.idpermiso)
    if (userPermiso === 1) {
      // Validar si la actividad original estaba en periodo permitido
      if (ctx?.fecha) {
        const origenHabilitada = await isFechaHabilitada('captura', ctx.fecha, req.user.idsede)
        if (!origenHabilitada) {
          return res.status(403).json({
            success: false,
            message: `La actividad original (${ctx.fecha}) corresponde a un periodo pasado cerrado. Solicita una excepción al Super Administrador.`
          })
        }
      }

      // Validar si la nueva fecha de reprogramación está habilitada
      if (req.body.fecha) {
        const destinoHabilitada = await isFechaHabilitada('programacion', req.body.fecha, req.user.idsede)
        if (!destinoHabilitada) {
          return res.status(403).json({
            success: false,
            message: `La nueva fecha seleccionada (${req.body.fecha}) no se encuentra habilitada para este periodo.`
          })
        }
      }
    }

    const hora = req.body.hora_programada ?? req.body.hora
    await updateReprogramar(idcurso, req.body.fecha, hora)
    logAction(`📅 ACT REPROGRAMADA ➜ Actividad reprogramada — ID: ${idcurso} a ${req.body.fecha} ${hora} — ${userTag(req.user)}`)
    return res.json({ success: true, message: 'Actividad actualizada' })
  } catch (error) {
    return next(error)
  }
}

export const eliminarActividad = async (req, res, next) => {
  try {
    const idcurso = Number(req.params.id)
    await updateEliminar(idcurso)
    logAction(`🗑️ ACT ELIMINADA ➜ Actividad eliminada — ID: ${idcurso} — ${userTag(req.user)}`)
    return res.json({ success: true })
  } catch (error) {
    return next(error)
  }
}
