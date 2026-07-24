// Actividad model for SISEC CC 2026
import path from 'path'
import fs from 'fs/promises'
import { getPool, sql } from '../config/db.js'
import { env } from '../config/env.js'

const findFolderForFile = async (baseDir, filename) => {
  if (!filename) return null
  try {
    const entries = await fs.readdir(baseDir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const candidate = path.join(baseDir, entry.name, filename)
      try {
        await fs.access(candidate)
        return entry.name
      } catch {
        continue
      }
    }
  } catch {
    return null
  }
  return null
}

function colorDesdeId(idcatcurso) {
  const hue = (idcatcurso * 137.5) % 360;
  return `hsl(${hue}, 65%, 55%)`;
}

export const listActividadesBySede = async (idsede) => {
  const pool = await getPool()
  const request = pool.request()

  request.input('idsede', sql.TinyInt, idsede)

  const result = await request.query(`
      SELECT ti.idcurso,
        ti.fecha,
        ti.fecha_alta,
        ti.hora_programada,
        ti.duracionhrs,
        ti.duracionmin,
        ti.status,
        ti.lugar AS institucion,
        cc.descripcion AS curso,
        ti.idcatcurso,
        ti.comentarios,
        ti.modalidad,
        ti.pmujeres1, ti.pmujeres2, ti.pmujeres3, ti.pmujeres4,
        ti.pmujeres5, ti.pmujeres6, ti.pmujeres7, ti.pmujeres8,
        ti.phombres1, ti.phombres2, ti.phombres3, ti.phombres4,
        ti.phombres5, ti.phombres6, ti.phombres7, ti.phombres8,
        ti.nombre_archivo, ti.nombre_archivo2, ti.nombre_archivo3,
        cc.color,
        u.idsede
    FROM sisecycc2024.dbo.sisec_talleres_intervenciones ti
      LEFT JOIN sisecycc2024.dbo.sisec_cat_cursos cc ON ti.idcatcurso = cc.idcurso
    INNER JOIN sisec_usuarios u ON ti.idusuario = u.idusuario
    WHERE u.idsede = @idsede AND ti.status IN (1, 3)
    ORDER BY ti.status, ti.fecha DESC
  `)

  const baseDir = path.resolve(env.uploadPath, `DTO-${idsede}`)

  return Promise.all(
    result.recordset.map(async (row) => {
      const target = row.nombre_archivo || row.nombre_archivo2 || row.nombre_archivo3
      const carpeta = await findFolderForFile(baseDir, target)
      const color = row.color || colorDesdeId(row.idcatcurso || 0)
      return { ...row, carpeta, color }
    })
  )
}

export const getActividadContext = async (idcurso) => {
  const pool = await getPool()
  const request = pool.request()

  request.input('idcurso', sql.Int, idcurso)

  const result = await request.query(`
    SELECT ti.idcurso, ti.idcatcurso, cc.idtipo
    FROM sisecycc2024.dbo.sisec_talleres_intervenciones ti
    LEFT JOIN sisecycc2024.dbo.sisec_cat_cursos cc ON ti.idcatcurso = cc.idcurso
    WHERE ti.idcurso = @idcurso
  `)

  return result.recordset[0]
}

export const getArchivosActuales = async (idcurso) => {
  const pool = await getPool()
  const request = pool.request()

  request.input('idcurso', sql.Int, idcurso)

  const result = await request.query(`
    SELECT nombre_archivo, nombre_archivo2, nombre_archivo3
    FROM sisecycc2024.dbo.sisec_talleres_intervenciones
    WHERE idcurso = @idcurso
  `)

  return result.recordset[0] || {}
}

export const marcarNoRealizada = async (idcurso, motivo) => {
  const pool = await getPool()
  const request = pool.request()

  request.input('idcurso', sql.Int, idcurso)
  request.input('motivo', sql.VarChar(250), motivo)

  await request.query(`
    UPDATE sisecycc2024.dbo.sisec_talleres_intervenciones
    SET motivo_norealizada = @motivo, status = 2
    WHERE idcurso = @idcurso
  `)
}

export const reprogramarActividad = async (idcurso, fecha, hora) => {
  const pool = await getPool()
  const request = pool.request()

  request.input('idcurso', sql.Int, idcurso)
  request.input('fecha', sql.VarChar(10), fecha)
  request.input('hora', sql.VarChar(5), hora)

  await request.query(`
    UPDATE sisecycc2024.dbo.sisec_talleres_intervenciones
    SET fecha = @fecha, hora_programada = @hora
    WHERE idcurso = @idcurso
  `)
}

export const marcarRealizada = async (idcurso, payload) => {
  const pool = await getPool()
  const request = pool.request()

  request.input('idcurso', sql.Int, idcurso)
  request.input('modalidad', sql.Bit, payload.modalidad)
  request.input('duracionhrs', sql.Int, payload.duracionhrs)
  request.input('duracionmin', sql.Int, payload.duracionmin)
  request.input('comentarios', sql.VarChar(250), payload.comentarios)
  request.input('pmujeres1', sql.Int, payload.pmujeres1)
  request.input('pmujeres2', sql.Int, payload.pmujeres2)
  request.input('pmujeres3', sql.Int, payload.pmujeres3)
  request.input('pmujeres4', sql.Int, payload.pmujeres4)
  request.input('pmujeres5', sql.Int, payload.pmujeres5)
  request.input('pmujeres6', sql.Int, payload.pmujeres6)
  request.input('pmujeres7', sql.Int, payload.pmujeres7)
  request.input('pmujeres8', sql.Int, payload.pmujeres8)
  request.input('phombres1', sql.Int, payload.phombres1)
  request.input('phombres2', sql.Int, payload.phombres2)
  request.input('phombres3', sql.Int, payload.phombres3)
  request.input('phombres4', sql.Int, payload.phombres4)
  request.input('phombres5', sql.Int, payload.phombres5)
  request.input('phombres6', sql.Int, payload.phombres6)
  request.input('phombres7', sql.Int, payload.phombres7)
  request.input('phombres8', sql.Int, payload.phombres8)
  request.input('nombre_archivo', sql.VarChar(80), payload.nombre_archivo)
  request.input('nombre_archivo2', sql.VarChar(80), payload.nombre_archivo2)
  request.input('nombre_archivo3', sql.VarChar(80), payload.nombre_archivo3)

  await request.query(`
    UPDATE sisecycc2024.dbo.sisec_talleres_intervenciones
    SET modalidad = @modalidad,
        duracionhrs = @duracionhrs,
        duracionmin = @duracionmin,
        comentarios = @comentarios,
        pmujeres1 = @pmujeres1,
        pmujeres2 = @pmujeres2,
        pmujeres3 = @pmujeres3,
        pmujeres4 = @pmujeres4,
        pmujeres5 = @pmujeres5,
        pmujeres6 = @pmujeres6,
        pmujeres7 = @pmujeres7,
        pmujeres8 = @pmujeres8,
        phombres1 = @phombres1,
        phombres2 = @phombres2,
        phombres3 = @phombres3,
        phombres4 = @phombres4,
        phombres5 = @phombres5,
        phombres6 = @phombres6,
        phombres7 = @phombres7,
        phombres8 = @phombres8,
        nombre_archivo = @nombre_archivo,
        nombre_archivo2 = @nombre_archivo2,
        nombre_archivo3 = @nombre_archivo3,
        status = 3
    WHERE idcurso = @idcurso
  `)
}

export const eliminarActividad = async (idcurso) => {
  const pool = await getPool()
  const request = pool.request()

  request.input('idcurso', sql.Int, idcurso)

  await request.query(`
    UPDATE sisecycc2024.dbo.sisec_talleres_intervenciones
    SET status = 0
    WHERE idcurso = @idcurso
  `)
}

export const getDashboardMetrics = async (idsede) => {
  const pool = await getPool()
  const request = pool.request()

  request.input('idsede', sql.TinyInt, idsede)

  const result = await request.query(`
    SELECT
      SUM(CASE WHEN ti.status = 3 THEN 1 ELSE 0 END) AS actividades_realizadas,
      SUM(CASE WHEN ti.status = 1 THEN 1 ELSE 0 END) AS actividades_pendientes,
      SUM(CASE WHEN cc.idtipo = 4 AND ti.status = 3 THEN 1 ELSE 0 END) AS total_intervenciones,
      SUM(CASE WHEN cc.idtipo != 4 AND cc.idtipo IS NOT NULL AND ti.status = 3 THEN 1 ELSE 0 END) AS total_talleres,
      SUM(
        ISNULL(ti.phombres1, 0) + ISNULL(ti.phombres2, 0) + ISNULL(ti.phombres3, 0) + ISNULL(ti.phombres4, 0) +
        ISNULL(ti.phombres5, 0) + ISNULL(ti.phombres6, 0) + ISNULL(ti.phombres7, 0) + ISNULL(ti.phombres8, 0)
      ) AS total_hombres,
      SUM(
        ISNULL(ti.pmujeres1, 0) + ISNULL(ti.pmujeres2, 0) + ISNULL(ti.pmujeres3, 0) + ISNULL(ti.pmujeres4, 0) +
        ISNULL(ti.pmujeres5, 0) + ISNULL(ti.pmujeres6, 0) + ISNULL(ti.pmujeres7, 0) + ISNULL(ti.pmujeres8, 0)
      ) AS total_mujeres
    FROM sisecycc2024.dbo.sisec_talleres_intervenciones ti
    INNER JOIN sisec_usuarios u ON ti.idusuario = u.idusuario
    LEFT JOIN sisecycc2024.dbo.sisec_cat_cursos cc ON ti.idcatcurso = cc.idcurso
    WHERE u.idsede = @idsede AND ti.status IN (1, 3)
  `)

  return result.recordset[0] || { 
    actividades_realizadas: 0, 
    actividades_pendientes: 0, 
    total_intervenciones: 0, 
    total_talleres: 0, 
    total_hombres: 0, 
    total_mujeres: 0 
  }
}

export const getAdminDashboardMetrics = async () => {
  const pool = await getPool()
  
  // 1. Métricas Globales
  const globalQuery = await pool.request().query(`
    SELECT
      ISNULL(SUM(CASE WHEN ti.status = 3 THEN 1 ELSE 0 END), 0) AS actividades_realizadas,
      ISNULL(SUM(CASE WHEN ti.status = 1 THEN 1 ELSE 0 END), 0) AS actividades_pendientes,
      ISNULL(SUM(CASE WHEN cc.idtipo = 4 AND ti.status = 3 THEN 1 ELSE 0 END), 0) AS total_intervenciones,
      ISNULL(SUM(CASE WHEN cc.idtipo != 4 AND cc.idtipo IS NOT NULL AND ti.status = 3 THEN 1 ELSE 0 END), 0) AS total_talleres,
      -- Conteo total encuestas usando la otra tabla sisecycc2024.dbo.sisec_encuestas
      (SELECT COUNT(*) FROM sisecycc2024.dbo.sisec_encuestas) AS total_encuestas
    FROM sisecycc2024.dbo.sisec_talleres_intervenciones ti
    INNER JOIN sisec_usuarios u ON ti.idusuario = u.idusuario
    LEFT JOIN sisecycc2024.dbo.sisec_cat_cursos cc ON ti.idcatcurso = cc.idcurso
    WHERE ti.status IN (1, 3)
  `)

  // 2. Gráfica de Avance por Distrito (solo IDs de sede del 1 al 33)
  const distritosQuery = await pool.request().query(`
    SELECT
      u.idsede,
      SUM(CASE WHEN ti.status = 3 THEN 1 ELSE 0 END) as total_actividades
    FROM sisec_usuarios u
    LEFT JOIN sisecycc2024.dbo.sisec_talleres_intervenciones ti 
      ON u.idusuario = ti.idusuario
    WHERE u.idsede BETWEEN 1 AND 33
    GROUP BY u.idsede
    ORDER BY u.idsede ASC
  `)

  const globalMetrics = globalQuery.recordset[0] || {
    actividades_realizadas: 0,
    actividades_pendientes: 0,
    total_intervenciones: 0,
    total_talleres: 0,
    total_encuestas: 0
  }

  return {
    ...globalMetrics,
    grafica_distritos: distritosQuery.recordset
  }
}
