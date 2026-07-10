// Reportes controller for SISEC CC 2026
import { getCatalogosReportes } from '../models/catalogoModel.js'
import { ejecutarReporte } from '../models/reporteModel.js'
import { generarXLSX } from '../services/reporteGenerator.js'
import { logger } from '../config/logger.js'

// Tipos exclusivos para administrador (permiso 2)
const TIPOS_SOLO_ADMIN = [10, 11, 12, 13]

export const catalogosReportes = async (req, res, next) => {
  try {
    const data = await getCatalogosReportes()
    return res.json({ success: true, data })
  } catch (error) {
    return next(error)
  }
}

export const generarReporte = async (req, res, next) => {
  try {
    const permiso = Number(req.user.permiso || 0)
    const tipo    = Number(req.body.tipo)

    // Guard: tipos exclusivos de admin
    if (TIPOS_SOLO_ADMIN.includes(tipo) && permiso !== 2) {
      logger.warn(`[REPORT]  🚫 Acceso denegado — Tipo: ${tipo} | Usuario: ${req.user.nombre} | Permiso: ${permiso}`)
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para generar este tipo de reporte.'
      })
    }

    const filtros = {
      tipo,
      vertiente:  Number(req.body.vertiente  || 0),
      criterio:   req.body.criterio           || '',
      distrito:   Number(req.body.distrito    || 0),
      delegacion: Number(req.body.delegacion  || 0),
      convenio:   Number(req.body.convenio    || 0),
      taller:     Number(req.body.taller      || 0),
      fechaInic:  req.body.fechaInic          || null,
      fechaFin:   req.body.fechaFin           || null,
      permiso,
      idsede:     Number(req.user.idsede      || 0)
    }

    const { titulo, columnas, filas, summaryRows = 0 } = await ejecutarReporte(filtros)

    if (!filas || filas.length === 0) {
      logger.warn(`[REPORT]  ⚠️  Sin resultados — Tipo: ${tipo} | Usuario: ${req.user.nombre}`)
      return res.status(404).json({
        success: false,
        message: 'Sin resultados para los filtros seleccionados'
      })
    }

    const meta = {
      fechaInic: filtros.fechaInic,
      fechaFin:  filtros.fechaFin
    }

    const workbook = await generarXLSX(titulo, columnas, filas, meta, summaryRows)

    // Nombre de archivo: SISEC_{tipo}_{DD-MM-YYYY}.xlsx
    const hoy  = new Date()
    const dd   = String(hoy.getDate()).padStart(2, '0')
    const mm   = String(hoy.getMonth() + 1).padStart(2, '0')
    const yyyy = hoy.getFullYear()
    const fileName = `SISEC_${tipo}_${dd}-${mm}-${yyyy}.xlsx`

    logger.info(
      `[REPORT]  📊 Reporte generado — Tipo: ${tipo} | Usuario: ${req.user.nombre} | Registros: ${filas.length}`
    )

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)

    await workbook.xlsx.write(res)
    res.end()
  } catch (error) {
    return next(error)
  }
}
