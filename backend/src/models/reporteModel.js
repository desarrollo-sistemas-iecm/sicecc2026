// Reporte model for SISEC CC 2026
import { getPool, sql } from '../config/db.js'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Convenio filter:
 *   1 = Con convenio  → AND ti.convenio = 1
 *   2 = Sin convenio  → AND ti.convenio = 0
 *   0 = Todos         → (sin filtro)
 */
const buildConvenioFilter = (convenio) => {
  if (convenio === 1) return ' AND ti.convenio = 1'
  if (convenio === 2) return ' AND ti.convenio = 0'
  return ''
}

/**
 * Criterio filter (solo cuando admin elige dto o del).
 * Requiere que el query tenga JOIN sisec_usuarios u.
 */
const buildCriterioFilter = (criterio) => {
  if (criterio === 'dto') return ' AND ti.id_distrito = @distrito'
  if (criterio === 'del')
    return ' AND u.idsede IN (SELECT idsede FROM sisec_sedes WHERE iddelegacion = @delegacion)'
  return ''
}

/**
 * Permiso filter: el operador (permiso !== 2) sólo ve su propio distrito.
 */
const buildPermisoFilter = (permiso) => {
  if (permiso !== 2) return ' AND ti.id_distrito = @idsede'
  return ''
}

// ─── Columnas comunes para tipos 1, 2, 3 ─────────────────────────────────────
const COLS_DETALLE = [
  'Distrito', 'Curso', 'Institucion', 'Tipo Inst.',
  'Muj 0-12', 'Muj 13-16', 'Muj 17-20', 'Muj 21-30',
  'Muj 31-40', 'Muj 41-50', 'Muj 51-61', 'Muj +62',
  'Hom 0-12', 'Hom 13-16', 'Hom 17-20', 'Hom 21-30',
  'Hom 31-40', 'Hom 41-50', 'Hom 51-61', 'Hom +62',
  'Total Muj', 'Total Hom', 'TOTAL',
  'Dur. Hrs', 'Dur. Min', 'Fecha', 'Comentarios', 'Convenio', 'Modalidad'
]

// Índices de las columnas de edad en COLS_DETALLE
// [4..11] = pmujeres1-8  |  [12..19] = phombres1-8
// [20]    = Total Muj    |  [21]     = Total Hom    |  [22] = TOTAL

const mapRowDetalle = (row) => {
  const muj = [
    row.pmujeres1 || 0, row.pmujeres2 || 0, row.pmujeres3 || 0, row.pmujeres4 || 0,
    row.pmujeres5 || 0, row.pmujeres6 || 0, row.pmujeres7 || 0, row.pmujeres8 || 0,
  ]
  const hom = [
    row.phombres1 || 0, row.phombres2 || 0, row.phombres3 || 0, row.phombres4 || 0,
    row.phombres5 || 0, row.phombres6 || 0, row.phombres7 || 0, row.phombres8 || 0,
  ]
  const totalMuj = muj.reduce((a, b) => a + b, 0)
  const totalHom = hom.reduce((a, b) => a + b, 0)
  return [
    row.idsede,      row.curso,       row.institucion, row.tipoinstitucion,
    ...muj, ...hom,
    totalMuj,        totalHom,        totalMuj + totalHom,
    row.duracionhrs, row.duracionmin, row.fecha,        row.comentarios,
    row.convenio,    row.modalidad,
  ]
}

/**
 * Genera la fila de totales (suma de todas las columnas numéricas de edad y totales).
 * Cols 0-3 son texto → se etiquetan. Cols 4-22 son numéricos → se suman.
 * Cols 23-28 son metadata (fecha, etc.) → vacíos.
 */
const buildSummaryRow = (filas) => {
  const sums = new Array(19).fill(0)   // índices 4..22 → 19 columnas numéricas
  filas.forEach((fila) => {
    for (let i = 0; i < 19; i++) {
      sums[i] += Number(fila[4 + i]) || 0
    }
  })
  return [
    'TOTALES', `${filas.length} registros`, '', '',
    ...sums,
    '', '', '', '', '', '',   // Dur.Hrs, Dur.Min, Fecha, Comentarios, Convenio, Modalidad
  ]
}

/**
 * Devuelve las filas de detalle + la fila de totales,
 * más el conteo de filas de resumen para que el generador las estile.
 */
const computeFilasDetalle = (recordset) => {
  const filas = recordset.map(mapRowDetalle)
  filas.push(buildSummaryRow(filas))
  return { filas, summaryRows: 1 }
}

// ─── SELECT base de detalle (tipos 1, 2, 3) ──────────────────────────────────
const SELECT_DETALLE = `
  SELECT u.idsede,
         cat.descripcion AS curso,
         ti.lugar AS institucion,
         CASE WHEN ti.tipoinstitucion = 1 THEN 'Publica' ELSE 'Privada' END AS tipoinstitucion,
         ti.pmujeres1, ti.pmujeres2, ti.pmujeres3, ti.pmujeres4,
         ti.pmujeres5, ti.pmujeres6, ti.pmujeres7, ti.pmujeres8,
         ti.phombres1, ti.phombres2, ti.phombres3, ti.phombres4,
         ti.phombres5, ti.phombres6, ti.phombres7, ti.phombres8,
         ti.duracionhrs, ti.duracionmin,
         ti.fecha, ti.comentarios, ti.convenio,
         CASE WHEN ti.modalidad = 1 THEN 'Presencial' ELSE 'Virtual' END AS modalidad
  FROM sisecycc2024.dbo.sisec_talleres_intervenciones ti
  JOIN sisec_usuarios u ON ti.idusuario = u.idusuario
  JOIN sisecycc2024.dbo.sisec_cat_cursos cat ON ti.idcatcurso = cat.idcurso
`

// ─── SELECT agrupado por grupos de edad (tipos 5 y 6) ────────────────────────
const SELECT_GRUPOS_EDAD = `
  SELECT
    SUM(ti.pmujeres1) AS m1,
    SUM(ti.pmujeres2) + SUM(ti.pmujeres3) AS m2,
    SUM(ti.pmujeres4) + SUM(ti.pmujeres5) + SUM(ti.pmujeres6) + SUM(ti.pmujeres7) AS m3,
    SUM(ti.pmujeres8) AS m4,
    SUM(ti.phombres1) AS h1,
    SUM(ti.phombres2) + SUM(ti.phombres3) AS h2,
    SUM(ti.phombres4) + SUM(ti.phombres5) + SUM(ti.phombres6) + SUM(ti.phombres7) AS h3,
    SUM(ti.phombres8) AS h4
  FROM sisecycc2024.dbo.sisec_talleres_intervenciones ti
  JOIN sisec_usuarios u ON ti.idusuario = u.idusuario
  JOIN sisecycc2024.dbo.sisec_cat_cursos cat ON ti.idcatcurso = cat.idcurso
  JOIN sisec_tipos_cursos_y_talleres tip ON cat.idtipo = tip.idtipo
`

const buildFilasEdad = (row) => {
  const r = row || {}
  return [
    ['0-12 años',  r.m1 || 0, r.h1 || 0, (r.m1 || 0) + (r.h1 || 0)],
    ['13-20 años', r.m2 || 0, r.h2 || 0, (r.m2 || 0) + (r.h2 || 0)],
    ['21-61 años', r.m3 || 0, r.h3 || 0, (r.m3 || 0) + (r.h3 || 0)],
    ['62+ años',   r.m4 || 0, r.h4 || 0, (r.m4 || 0) + (r.h4 || 0)],
  ]
}

// ─────────────────────────────────────────────────────────────────────────────

export const ejecutarReporte = async (filters) => {
  const pool = await getPool()
  const request = pool.request()

  // Frontend vertiente: 0=Todos, 1=Mujeres, 2=Jovenes, 3=Hombres, 4=PobGeneral(→idtipo=5)
  const vertienteIdtipo = filters.vertiente === 4 ? 5 : filters.vertiente

  request.input('fechaInic',  sql.VarChar(10), filters.fechaInic  ?? null)
  request.input('fechaFin',   sql.VarChar(10), filters.fechaFin   ?? null)
  request.input('vertiente',  sql.Int, vertienteIdtipo)
  request.input('distrito',   sql.Int, filters.distrito)
  request.input('delegacion', sql.Int, filters.delegacion)
  request.input('taller',     sql.Int, filters.taller)
  request.input('idsede',     sql.Int, filters.idsede)

  const convenioFilter = buildConvenioFilter(filters.convenio)
  const criterioFilter  = buildCriterioFilter(filters.criterio)
  const permisoFilter   = buildPermisoFilter(filters.permiso)

  // ── Fecha base filter (reutilizable) ────────────────────────────────────
  const fechaFilter = ' AND ti.fecha >= @fechaInic AND ti.fecha <= @fechaFin'

  switch (filters.tipo) {

    // ── TIPO 1: Talleres por vertiente ──────────────────────────────────────
    case 1: {
      // Vertiente: 0 → idtipo IN (1,2,3,5) | 1-3 → idtipo = @vertiente | 4 → idtipo = 5
      const vertienteSQL = vertienteIdtipo === 0
        ? 'AND cat.idtipo IN (1, 2, 3, 5)'
        : 'AND cat.idtipo = @vertiente'

      const sqlQuery = `
        ${SELECT_DETALLE}
        WHERE ti.status = 3
          ${vertienteSQL}
          ${filters.taller > 0 ? 'AND ti.idcatcurso = @taller' : ''}
          ${convenioFilter}
          ${criterioFilter}
          ${permisoFilter}
          ${fechaFilter}
        ORDER BY u.idsede, ti.fecha
      `
      const result = await request.query(sqlQuery)
      const { filas, summaryRows } = computeFilasDetalle(result.recordset)
      return {
        titulo: 'Talleres por vertiente',
        columnas: COLS_DETALLE,
        filas,
        summaryRows
      }
    }

    // ── TIPO 2: Intervenciones educativas ───────────────────────────────────
    case 2: {
      const sqlQuery = `
        ${SELECT_DETALLE}
        WHERE ti.status = 3
          AND cat.idtipo = 4
          ${filters.taller > 0 ? 'AND ti.idcatcurso = @taller' : ''}
          ${convenioFilter}
          ${criterioFilter}
          ${permisoFilter}
          ${fechaFilter}
        ORDER BY u.idsede, ti.fecha
      `
      const result = await request.query(sqlQuery)
      const colsInt = [...COLS_DETALLE]
      colsInt[1] = 'Intervencion'
      const { filas, summaryRows } = computeFilasDetalle(result.recordset)
      return {
        titulo: 'Intervenciones educativas',
        columnas: colsInt,
        filas,
        summaryRows
      }
    }

    // ── TIPO 3: Talleres + Intervenciones (todos) ───────────────────────────
    case 3: {
      const sqlQuery = `
        SELECT u.idsede,
               cat.descripcion AS curso,
               tip.descripcion AS vertiente,
               ti.lugar AS institucion,
               CASE WHEN ti.tipoinstitucion = 1 THEN 'Publica' ELSE 'Privada' END AS tipoinstitucion,
               ti.pmujeres1, ti.pmujeres2, ti.pmujeres3, ti.pmujeres4,
               ti.pmujeres5, ti.pmujeres6, ti.pmujeres7, ti.pmujeres8,
               ti.phombres1, ti.phombres2, ti.phombres3, ti.phombres4,
               ti.phombres5, ti.phombres6, ti.phombres7, ti.phombres8,
               ti.duracionhrs, ti.duracionmin,
               ti.fecha, ti.comentarios, ti.convenio,
               CASE WHEN ti.modalidad = 1 THEN 'Presencial' ELSE 'Virtual' END AS modalidad
        FROM sisecycc2024.dbo.sisec_talleres_intervenciones ti
        JOIN sisec_usuarios u ON ti.idusuario = u.idusuario
        JOIN sisecycc2024.dbo.sisec_cat_cursos cat ON ti.idcatcurso = cat.idcurso
        JOIN sisec_tipos_cursos_y_talleres tip ON cat.idtipo = tip.idtipo
        WHERE ti.status = 3
          ${convenioFilter}
          ${criterioFilter}
          ${permisoFilter}
          ${fechaFilter}
        ORDER BY u.idsede, tip.idtipo, ti.fecha
      `
      const result = await request.query(sqlQuery)

      // Tipo 3 tiene una columna extra (Vertiente) en pos. 2, ajustar helper inline
      const COLS3 = [
        'Distrito', 'Curso', 'Vertiente', 'Institucion', 'Tipo Inst.',
        'Muj 0-12', 'Muj 13-16', 'Muj 17-20', 'Muj 21-30',
        'Muj 31-40', 'Muj 41-50', 'Muj 51-61', 'Muj +62',
        'Hom 0-12', 'Hom 13-16', 'Hom 17-20', 'Hom 21-30',
        'Hom 31-40', 'Hom 41-50', 'Hom 51-61', 'Hom +62',
        'Total Muj', 'Total Hom', 'TOTAL',
        'Dur. Hrs', 'Dur. Min', 'Fecha', 'Comentarios', 'Convenio', 'Modalidad'
      ]

      const filas3 = result.recordset.map((row) => {
        const muj = [
          row.pmujeres1||0, row.pmujeres2||0, row.pmujeres3||0, row.pmujeres4||0,
          row.pmujeres5||0, row.pmujeres6||0, row.pmujeres7||0, row.pmujeres8||0,
        ]
        const hom = [
          row.phombres1||0, row.phombres2||0, row.phombres3||0, row.phombres4||0,
          row.phombres5||0, row.phombres6||0, row.phombres7||0, row.phombres8||0,
        ]
        const totalMuj = muj.reduce((a, b) => a + b, 0)
        const totalHom = hom.reduce((a, b) => a + b, 0)
        return [
          row.idsede, row.curso, row.vertiente, row.institucion, row.tipoinstitucion,
          ...muj, ...hom,
          totalMuj, totalHom, totalMuj + totalHom,
          row.duracionhrs, row.duracionmin, row.fecha, row.comentarios,
          row.convenio, row.modalidad,
        ]
      })

      // Fila de totales: cols 0-4 texto, cols 5-23 numéricos (19 valores)
      const sums3 = new Array(19).fill(0)
      filas3.forEach((f) => { for (let i = 0; i < 19; i++) sums3[i] += Number(f[5 + i]) || 0 })
      filas3.push([
        'TOTALES', `${filas3.length} registros`, '', '', '',
        ...sums3,
        '', '', '', '', '', '',
      ])

      return {
        titulo: 'Talleres e intervenciones (todos)',
        columnas: COLS3,
        filas: filas3,
        summaryRows: 1
      }
    }

    // ── TIPO 4: Encuestas de satisfacción (sin fechas, sin criterio) ────────
    case 4: {
      // Usa request separado porque no necesita @fechaInic / @fechaFin
      const reqEnc = pool.request()
      reqEnc.input('idsede', sql.Int, filters.idsede)

      const sqlQuery = `
        SELECT enc.id_distrito,
               enc.folio_encuesta,
               enc.edad,
               enc.genero,
               enc.etiqueta2,
               enc.etiqueta3,
               enc.etiqueta4,
               enc.etiqueta5,
               enc.etiqueta6,
               enc.etiqueta7,
               enc.fecha_alta
        FROM sisecycc2024.dbo.sisec_encuestas enc
        ${filters.permiso !== 2 ? 'WHERE enc.id_distrito = @idsede' : ''}
        ORDER BY enc.id_distrito, enc.id_encuesta
      `
      const result = await reqEnc.query(sqlQuery)
      return {
        titulo: 'Encuestas de satisfaccion',
        columnas: ['Distrito', 'Folio', 'Edad', 'Genero', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'Fecha alta'],
        filas: result.recordset.map((row) => [
          row.id_distrito, row.folio_encuesta, row.edad,      row.genero,
          row.etiqueta2,   row.etiqueta3,      row.etiqueta4, row.etiqueta5,
          row.etiqueta6,   row.etiqueta7,      row.fecha_alta
        ])
      }
    }

    // ── TIPO 5: Grupos de Edad — Talleres (idproyecto = 1) ──────────────────
    case 5: {
      const sqlQuery = `
        ${SELECT_GRUPOS_EDAD}
        WHERE ti.status = 3
          AND tip.idproyecto = 1
          ${permisoFilter}
          ${fechaFilter}
      `
      const result = await request.query(sqlQuery)
      return {
        titulo: 'Grupos de Edad — Talleres',
        columnas: ['Grupo de edad', 'Mujeres', 'Hombres', 'Total'],
        filas: buildFilasEdad(result.recordset[0])
      }
    }

    // ── TIPO 6: Grupos de Edad — Intervenciones (idproyecto = 2) ───────────
    case 6: {
      const sqlQuery = `
        ${SELECT_GRUPOS_EDAD}
        WHERE ti.status = 3
          AND tip.idproyecto = 2
          ${permisoFilter}
          ${fechaFilter}
      `
      const result = await request.query(sqlQuery)
      return {
        titulo: 'Grupos de Edad — Intervenciones',
        columnas: ['Grupo de edad', 'Mujeres', 'Hombres', 'Total'],
        filas: buildFilasEdad(result.recordset[0])
      }
    }

    // ── TIPO 7: Actividades Programadas NO Realizadas (status != 3) ─────────
    case 7: {
      const sqlQuery = `
        SELECT u.idsede AS distrito,
               cat.descripcion AS curso,
               tip.descripcion AS vertiente,
               ti.fecha,
               ti.lugar AS institucion,
               CASE ti.status
                 WHEN 1 THEN 'Programada'
                 WHEN 2 THEN 'En proceso'
                 ELSE 'Pendiente'
               END AS estatus
        FROM sisecycc2024.dbo.sisec_talleres_intervenciones ti
        JOIN sisec_usuarios u ON ti.idusuario = u.idusuario
        JOIN sisecycc2024.dbo.sisec_cat_cursos cat ON ti.idcatcurso = cat.idcurso
        JOIN sisec_tipos_cursos_y_talleres tip ON cat.idtipo = tip.idtipo
        WHERE ti.status != 3
          ${criterioFilter}
          ${permisoFilter}
          ${fechaFilter}
        ORDER BY u.idsede, ti.fecha
      `
      const result = await request.query(sqlQuery)
      return {
        titulo: 'Actividades Programadas No Realizadas',
        columnas: ['Distrito', 'Curso', 'Vertiente', 'Fecha', 'Institucion', 'Estatus'],
        filas: result.recordset.map((row) => [
          row.distrito, row.curso, row.vertiente, row.fecha, row.institucion, row.estatus
        ])
      }
    }

    // ── TIPO 8: Actividades Programadas Realizadas (status = 3) ────────────
    case 8: {
      const sqlQuery = `
        SELECT u.idsede AS distrito,
               cat.descripcion AS curso,
               tip.descripcion AS vertiente,
               ti.fecha,
               ti.lugar AS institucion,
               CASE WHEN ti.convenio = 1 THEN 'Si' ELSE 'No' END AS convenio,
               (ti.pmujeres1 + ti.pmujeres2 + ti.pmujeres3 + ti.pmujeres4 +
                ti.pmujeres5 + ti.pmujeres6 + ti.pmujeres7 + ti.pmujeres8) AS total_mujeres,
               (ti.phombres1 + ti.phombres2 + ti.phombres3 + ti.phombres4 +
                ti.phombres5 + ti.phombres6 + ti.phombres7 + ti.phombres8) AS total_hombres
        FROM sisecycc2024.dbo.sisec_talleres_intervenciones ti
        JOIN sisec_usuarios u ON ti.idusuario = u.idusuario
        JOIN sisecycc2024.dbo.sisec_cat_cursos cat ON ti.idcatcurso = cat.idcurso
        JOIN sisec_tipos_cursos_y_talleres tip ON cat.idtipo = tip.idtipo
        WHERE ti.status = 3
          ${criterioFilter}
          ${permisoFilter}
          ${fechaFilter}
        ORDER BY u.idsede, tip.idtipo, ti.fecha
      `
      const result = await request.query(sqlQuery)
      return {
        titulo: 'Actividades Programadas Realizadas',
        columnas: ['Distrito', 'Curso', 'Vertiente', 'Fecha', 'Institucion', 'Convenio', 'Total Mujeres', 'Total Hombres'],
        filas: result.recordset.map((row) => [
          row.distrito, row.curso, row.vertiente, row.fecha, row.institucion,
          row.convenio, row.total_mujeres, row.total_hombres
        ])
      }
    }

    // ── TIPO 9: Actividades Realizadas por Convenio (sin fechas, sin dto/del) ─
    case 9: {
      // Sin filtro de fechas. El filtro de permiso se aplica pero NO el criterio.
      const sqlQuery = `
        SELECT
          CASE WHEN ti.convenio = 1 THEN 'Con convenio' ELSE 'Sin convenio' END AS tipo_convenio,
          tip.descripcion AS vertiente,
          COUNT(*) AS total_actividades,
          SUM(ti.pmujeres1 + ti.pmujeres2 + ti.pmujeres3 + ti.pmujeres4 +
              ti.pmujeres5 + ti.pmujeres6 + ti.pmujeres7 + ti.pmujeres8) AS total_mujeres,
          SUM(ti.phombres1 + ti.phombres2 + ti.phombres3 + ti.phombres4 +
              ti.phombres5 + ti.phombres6 + ti.phombres7 + ti.phombres8) AS total_hombres
        FROM sisecycc2024.dbo.sisec_talleres_intervenciones ti
        JOIN sisec_usuarios u ON ti.idusuario = u.idusuario
        JOIN sisecycc2024.dbo.sisec_cat_cursos cat ON ti.idcatcurso = cat.idcurso
        JOIN sisec_tipos_cursos_y_talleres tip ON cat.idtipo = tip.idtipo
        WHERE ti.status = 3
          ${permisoFilter}
        GROUP BY ti.convenio, tip.idtipo, tip.descripcion
        ORDER BY tip.idtipo, ti.convenio
      `
      const result = await request.query(sqlQuery)
      return {
        titulo: 'Actividades Realizadas por Convenio',
        columnas: ['Convenio', 'Vertiente', 'Total actividades', 'Total mujeres', 'Total hombres'],
        filas: result.recordset.map((row) => [
          row.tipo_convenio, row.vertiente, row.total_actividades, row.total_mujeres, row.total_hombres
        ])
      }
    }

    // ── TIPO 10/11: Avance acumulado por distrito (solo admin) ─────────────
    case 10:
    case 11: {
      const includeIntervenciones = filters.tipo === 11
      const sqlQuery = `
        SELECT
          ti.id_distrito,
          SUM(CASE WHEN cat.idtipo = 1 THEN 1 ELSE 0 END) AS mujeres,
          SUM(CASE WHEN cat.idtipo = 2 THEN 1 ELSE 0 END) AS jovenes,
          SUM(CASE WHEN cat.idtipo = 3 THEN 1 ELSE 0 END) AS hombres,
          SUM(CASE WHEN cat.idtipo = 5 THEN 1 ELSE 0 END) AS pob_general,
          SUM(CASE WHEN cat.idtipo = 4 THEN 1 ELSE 0 END) AS intervenciones
        FROM sisecycc2024.dbo.sisec_talleres_intervenciones ti
        JOIN sisecycc2024.dbo.sisec_cat_cursos cat ON ti.idcatcurso = cat.idcurso
        WHERE ti.status = 3
          ${fechaFilter}
        GROUP BY ti.id_distrito
        ORDER BY ti.id_distrito
      `
      const result = await request.query(sqlQuery)
      const filas = result.recordset.map((row) => {
        const talleres = row.mujeres + row.jovenes + row.hombres + row.pob_general
        const total = talleres + (includeIntervenciones ? row.intervenciones : 0)
        const porcentaje = total ? Number(((total * 100) / 33).toFixed(2)) : 0
        return [
          row.id_distrito, row.mujeres, row.jovenes, row.hombres, row.pob_general,
          row.intervenciones, total, porcentaje
        ]
      })
      return {
        titulo: includeIntervenciones
          ? 'Avance acumulado por distrito (con intervenciones)'
          : 'Avance acumulado por distrito',
        columnas: ['Distrito', 'Mujeres', 'Jovenes', 'Hombres', 'Pob. Gral.', 'Intervenciones', 'Total', '% Avance'],
        filas
      }
    }

    // ── TIPO 12: Concentrado de talleres por demarcación territorial ────────
    case 12: {
      const sqlQuery = `
        SELECT
          del.descripcion AS delegacion,
          del.iddelegacion,
          COUNT(ti.idcurso) AS total,
          SUM(CASE WHEN ti.convenio = 1 THEN 1 ELSE 0 END) AS con_convenio,
          SUM(CASE WHEN ti.convenio = 0 THEN 1 ELSE 0 END) AS sin_convenio,
          SUM(ti.pmujeres1 + ti.pmujeres2 + ti.pmujeres3 + ti.pmujeres4 +
              ti.pmujeres5 + ti.pmujeres6 + ti.pmujeres7 + ti.pmujeres8) AS total_mujeres,
          SUM(ti.phombres1 + ti.phombres2 + ti.phombres3 + ti.phombres4 +
              ti.phombres5 + ti.phombres6 + ti.phombres7 + ti.phombres8) AS total_hombres
        FROM sisec_delegaciones del
        LEFT JOIN sisec_sedes sed ON sed.iddelegacion = del.iddelegacion
        JOIN sisec_usuarios u ON u.idsede = sed.idsede
        JOIN sisecycc2024.dbo.sisec_talleres_intervenciones ti ON ti.idusuario = u.idusuario
        WHERE del.iddelegacion < 17
          AND ti.status = 3
          ${fechaFilter}
        GROUP BY del.descripcion, del.iddelegacion
        ORDER BY del.iddelegacion
      `
      const result = await request.query(sqlQuery)
      return {
        titulo: 'Concentrado de talleres por demarcacion territorial',
        columnas: ['Delegacion', 'ID Del.', 'Total', 'Con convenio', 'Sin convenio', 'Total mujeres', 'Total hombres'],
        filas: result.recordset.map((row) => [
          row.delegacion, row.iddelegacion, row.total,
          row.con_convenio, row.sin_convenio,
          row.total_mujeres, row.total_hombres
        ])
      }
    }

    // ── TIPO 13: Concentrado de talleres por grupos de edad ─────────────────
    case 13: {
      const sqlQuery = `
        SELECT
          cat.descripcion AS curso,
          cat.idtipo,
          tip.descripcion AS vertiente,
          SUM(ti.pmujeres1) AS muj_0_12,   SUM(ti.pmujeres2) AS muj_13_16,
          SUM(ti.pmujeres3) AS muj_17_20,  SUM(ti.pmujeres4) AS muj_21_30,
          SUM(ti.pmujeres5) AS muj_31_40,  SUM(ti.pmujeres6) AS muj_41_50,
          SUM(ti.pmujeres7) AS muj_51_61,  SUM(ti.pmujeres8) AS muj_mas_62,
          SUM(ti.phombres1) AS hom_0_12,   SUM(ti.phombres2) AS hom_13_16,
          SUM(ti.phombres3) AS hom_17_20,  SUM(ti.phombres4) AS hom_21_30,
          SUM(ti.phombres5) AS hom_31_40,  SUM(ti.phombres6) AS hom_41_50,
          SUM(ti.phombres7) AS hom_51_61,  SUM(ti.phombres8) AS hom_mas_62,
          COUNT(*) AS total_acciones
        FROM sisecycc2024.dbo.sisec_cat_cursos cat
        JOIN sisecycc2024.dbo.sisec_talleres_intervenciones ti ON ti.idcatcurso = cat.idcurso
        JOIN sisec_tipos_cursos_y_talleres tip ON cat.idtipo = tip.idtipo
        WHERE ti.status = 3
          ${fechaFilter}
        GROUP BY cat.descripcion, cat.idtipo, tip.descripcion
        ORDER BY cat.idtipo, cat.descripcion
      `
      const result = await request.query(sqlQuery)
      return {
        titulo: 'Concentrado de talleres por grupos de edad',
        columnas: [
          'Curso', 'Vertiente',
          'Muj 0-12',  'Muj 13-16', 'Muj 17-20', 'Muj 21-30',
          'Muj 31-40', 'Muj 41-50', 'Muj 51-61', 'Muj +62',
          'Hom 0-12',  'Hom 13-16', 'Hom 17-20', 'Hom 21-30',
          'Hom 31-40', 'Hom 41-50', 'Hom 51-61', 'Hom +62',
          'Total acciones'
        ],
        filas: result.recordset.map((row) => [
          row.curso,     row.vertiente,
          row.muj_0_12,  row.muj_13_16, row.muj_17_20, row.muj_21_30,
          row.muj_31_40, row.muj_41_50, row.muj_51_61, row.muj_mas_62,
          row.hom_0_12,  row.hom_13_16, row.hom_17_20, row.hom_21_30,
          row.hom_31_40, row.hom_41_50, row.hom_51_61, row.hom_mas_62,
          row.total_acciones
        ])
      }
    }

    // ── TIPO 14 (legacy): Programadas, realizadas y no realizadas ───────────
    case 14: {
      const sqlQuery = `
        SELECT
          cat.descripcion AS curso,
          tip.descripcion AS vertiente,
          ti.status,
          COUNT(*) AS total
        FROM sisecycc2024.dbo.sisec_cat_cursos cat
        LEFT JOIN sisecycc2024.dbo.sisec_talleres_intervenciones ti ON ti.idcatcurso = cat.idcurso
        JOIN sisec_tipos_cursos_y_talleres tip ON cat.idtipo = tip.idtipo
        WHERE ti.fecha >= @fechaInic AND ti.fecha <= @fechaFin
        GROUP BY cat.idcurso, cat.descripcion, tip.descripcion, ti.status
        ORDER BY cat.descripcion, ti.status
      `
      const result = await request.query(sqlQuery)
      return {
        titulo: 'Programadas, realizadas y no realizadas',
        columnas: ['Curso', 'Vertiente', 'Status', 'Total'],
        filas: result.recordset.map((row) => [row.curso, row.vertiente, row.status, row.total])
      }
    }

    default:
      return { titulo: 'Reporte', columnas: [], filas: [] }
  }
}
