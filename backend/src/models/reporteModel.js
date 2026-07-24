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
    return ' AND u.idsede IN (SELECT idsede FROM sisecycc2024.dbo.sisec_sedes WHERE iddelegacion = @delegacion)'
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
  'Num', 'Distrito', 'ID', 'Taller o Intervención', 'Presencial', 'Virtual', 'Institución', 'Género',
  '0-12', '13-16', '17-20', '21-30', '31-40', '41-50', '51-61', '>62', 'TOTAL',
  'Duración', 'Fecha', 'Comentarios', 'Convenio'
]

function hslToHex(h, s, l) {
  l /= 100
  const a = (s * Math.min(l, 1 - l)) / 100
  const f = (n) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, '0')
  }
  return `${f(0)}${f(8)}${f(4)}`.toUpperCase()
}

function colorDesdeId(idcatcurso) {
  const hue = (idcatcurso * 137.5) % 360
  return hslToHex(hue, 65, 55)
}

function formatColorToARGB(colorStr, idcatcurso) {
  if (!colorStr) {
    return 'FF' + colorDesdeId(idcatcurso)
  }
  const clean = colorStr.replace('#', '').trim()
  if (clean.length === 6) {
    return 'FF' + clean.toUpperCase()
  }
  if (clean.length === 8) {
    return clean.toUpperCase()
  }
  return 'FF' + colorDesdeId(idcatcurso)
}

const mapRowDetalle = (row, index) => {
  const num = index + 1
  const m = [
    row.pmujeres1 || 0, row.pmujeres2 || 0, row.pmujeres3 || 0, row.pmujeres4 || 0,
    row.pmujeres5 || 0, row.pmujeres6 || 0, row.pmujeres7 || 0, row.pmujeres8 || 0,
  ]
  const hom = [
    row.phombres1 || 0, row.phombres2 || 0, row.phombres3 || 0, row.phombres4 || 0,
    row.phombres5 || 0, row.phombres6 || 0, row.phombres7 || 0, row.phombres8 || 0,
  ]
  const totalM = m.reduce((a, b) => a + b, 0)
  const totalH = hom.reduce((a, b) => a + b, 0)
  
  const duracion = `${row.duracionhrs || 0}:${String(row.duracionmin || 0).padStart(2, '0')}`
  const presencial = row.modalidad === 0 ? 'SI' : ''
  const virtual = row.modalidad === 1 ? 'SI' : ''
  const convenio = row.convenio === 1 ? 'SI' : 'NO'
  
  const argbColor = formatColorToARGB(row.color, row.idcatcurso)

  const rowM = [
    num,
    row.idsede,
    row.idcurso,
    row.curso,
    presencial,
    virtual,
    row.institucion,
    'M',
    ...m,
    totalM,
    duracion,
    row.fecha,
    row.comentarios,
    convenio,
    argbColor // Elemento extra para pasar color a exceljs
  ]
  
  const rowH = [
    num,
    row.idsede,
    row.idcurso,
    row.curso,
    presencial,
    virtual,
    row.institucion,
    'H',
    ...hom,
    totalH,
    duracion,
    row.fecha,
    row.comentarios,
    convenio,
    argbColor // Elemento extra para pasar color a exceljs
  ]
  
  return [rowM, rowH]
}

const computeFilasDetalle = (recordset) => {
  const filas = []
  recordset.forEach((row, idx) => {
    const [rowM, rowH] = mapRowDetalle(row, idx)
    filas.push(rowM)
    filas.push(rowH)
  })

  // Fila de Totales Generales al final de la tabla (columnas de edad y total de edad: de índice 8 a 16)
  const sums = new Array(9).fill(0) // 8 rangos de edad + 1 total
  filas.forEach((fila) => {
    for (let i = 0; i < 9; i++) {
      sums[i] += Number(fila[8 + i]) || 0
    }
  })

  const summaryRow = [
    'TOTALES',
    '',
    '',
    `${recordset.length} registros`,
    '',
    '',
    '',
    '',
    ...sums,
    '', // Duración
    '', // Fecha
    '', // Comentarios
    '',  // Convenio
    null // color
  ]
  filas.push(summaryRow)
  return { filas, summaryRows: 1 }
}

// ─── SELECT base de detalle (tipos 1, 2, 3) ──────────────────────────────────
const SELECT_DETALLE = `
  SELECT u.idsede,
         ti.idcurso,
         cat.descripcion AS curso,
         cat.color,
         cat.idcurso AS idcatcurso,
         ti.lugar AS institucion,
         ti.pmujeres1, ti.pmujeres2, ti.pmujeres3, ti.pmujeres4,
         ti.pmujeres5, ti.pmujeres6, ti.pmujeres7, ti.pmujeres8,
         ti.phombres1, ti.phombres2, ti.phombres3, ti.phombres4,
         ti.phombres5, ti.phombres6, ti.phombres7, ti.phombres8,
         ti.duracionhrs, ti.duracionmin,
         ti.fecha, ti.comentarios, ti.convenio,
         ti.modalidad
  FROM sisecycc2024.dbo.sisec_talleres_intervenciones ti
  JOIN sisecycc2024.dbo.sisec_usuarios u ON ti.idusuario = u.idusuario
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
  JOIN sisecycc2024.dbo.sisec_usuarios u ON ti.idusuario = u.idusuario
  JOIN sisecycc2024.dbo.sisec_cat_cursos cat ON ti.idcatcurso = cat.idcurso
  JOIN sisecycc2024.dbo.sisec_tipos_cursos_y_talleres tip ON cat.idtipo = tip.idtipo
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
      colsInt[3] = 'Intervención'
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
        ${SELECT_DETALLE}
        WHERE ti.status = 3
          ${convenioFilter}
          ${criterioFilter}
          ${permisoFilter}
          ${fechaFilter}
        ORDER BY u.idsede, ti.fecha
      `
      const result = await request.query(sqlQuery)
      const { filas, summaryRows } = computeFilasDetalle(result.recordset)
      return {
        titulo: 'Reporte de Talleres e Intervenciones Educativas',
        columnas: COLS_DETALLE,
        filas,
        summaryRows
      }
    }

    // ── TIPO 4: Encuestas de satisfacción (sin fechas, sin criterio) ────────
    case 4: {
      const reqEnc = pool.request()
      reqEnc.input('idsede', sql.Int, filters.idsede)

      const sqlQuery = `
        SELECT enc.id_distrito,
               enc.folio_encuesta,
               enc.edad,
               enc.genero,
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
        titulo: 'Reporte de encuestas aplicadas',
        columnas: ['Distrito', 'Folio', 'Edad', 'Género', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'Fecha de captura'],
        filas: result.recordset.map((row) => [
          row.id_distrito, 
          row.folio_encuesta, 
          row.edad,      
          row.genero,
          row.etiqueta3,   
          row.etiqueta4,      
          row.etiqueta5, 
          row.etiqueta6,
          row.etiqueta7,   
          null, // etiqueta8 (no existente en tabla local)
          row.fecha_alta
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
        JOIN sisecycc2024.dbo.sisec_usuarios u ON ti.idusuario = u.idusuario
        JOIN sisecycc2024.dbo.sisec_cat_cursos cat ON ti.idcatcurso = cat.idcurso
        JOIN sisecycc2024.dbo.sisec_tipos_cursos_y_talleres tip ON cat.idtipo = tip.idtipo
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
         JOIN sisecycc2024.dbo.sisec_usuarios u ON ti.idusuario = u.idusuario
         JOIN sisecycc2024.dbo.sisec_cat_cursos cat ON ti.idcatcurso = cat.idcurso
         JOIN sisecycc2024.dbo.sisec_tipos_cursos_y_talleres tip ON cat.idtipo = tip.idtipo
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
        JOIN sisecycc2024.dbo.sisec_usuarios u ON ti.idusuario = u.idusuario
        JOIN sisecycc2024.dbo.sisec_cat_cursos cat ON ti.idcatcurso = cat.idcurso
        JOIN sisecycc2024.dbo.sisec_tipos_cursos_y_talleres tip ON cat.idtipo = tip.idtipo
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
        const talleres = (row.mujeres || 0) + (row.hombres || 0) + (row.jovenes || 0) + (row.pob_general || 0)
        const total = talleres + (includeIntervenciones ? (row.intervenciones || 0) : 0)
        const porcentaje = total ? Number(((total * 100) / 33).toFixed(2)) : 0
        return [
          row.id_distrito, 
          row.mujeres || 0, 
          row.hombres || 0, 
          row.jovenes || 0, 
          row.pob_general || 0, 
          talleres, 
          row.intervenciones || 0, 
          total, 
          porcentaje
        ]
      })

      // Fila de totales: sumamos columnas numéricas 1 a 7
      const sums = new Array(7).fill(0)
      filas.forEach((f) => {
        for (let i = 0; i < 7; i++) {
          sums[i] += Number(f[1 + i]) || 0
        }
      })
      filas.push([
        'TOTALES',
        ...sums,
        '' // porcentaje vacío al final
      ])

      return {
        titulo: includeIntervenciones
          ? 'Reporte de Avance Acumulado por Distrito (con Intervenciones)'
          : 'Reporte de Avance Acumulado por Distrito',
        columnas: ['DTTO', 'Mujeres', 'Hombres', 'Jóvenes', 'Población en General', 'Total Talleres', 'Intervenciones', 'Total de Acciones', '% Avance'],
        filas,
        summaryRows: 1
      }
    }

    // ── TIPO 12: Concentrado de talleres por demarcación territorial ────────
    case 12: {
      const sqlQuery = `
        SELECT
          del.descripcion AS delegacion,
          del.iddelegacion,
          COUNT(ti.idcurso) AS total_acciones,
          SUM(CASE WHEN ti.convenio = 1 THEN 1 ELSE 0 END) AS con_convenio,
          SUM(CASE WHEN ti.convenio = 0 THEN 1 ELSE 0 END) AS sin_convenio,
          SUM(ti.pmujeres1) AS m1, SUM(ti.pmujeres2) AS m2, SUM(ti.pmujeres3) AS m3, SUM(ti.pmujeres4) AS m4,
          SUM(ti.pmujeres5) AS m5, SUM(ti.pmujeres6) AS m6, SUM(ti.pmujeres7) AS m7, SUM(ti.pmujeres8) AS m8,
          SUM(ti.phombres1) AS h1, SUM(ti.phombres2) AS h2, SUM(ti.phombres3) AS h3, SUM(ti.phombres4) AS h4,
          SUM(ti.phombres5) AS h5, SUM(ti.phombres6) AS h6, SUM(ti.phombres7) AS h7, SUM(ti.phombres8) AS h8
        FROM sisecycc2024.dbo.sisec_delegaciones del
        LEFT JOIN sisecycc2024.dbo.sisec_sedes sed ON sed.iddelegacion = del.iddelegacion
        JOIN sisecycc2024.dbo.sisec_usuarios u ON u.idsede = sed.idsede
        JOIN sisecycc2024.dbo.sisec_talleres_intervenciones ti ON ti.idusuario = u.idusuario
        WHERE del.iddelegacion < 17
          AND ti.status = 3
          ${fechaFilter}
        GROUP BY del.descripcion, del.iddelegacion
        ORDER BY del.iddelegacion
      `
      const result = await request.query(sqlQuery)
      const filas = result.recordset.map((row) => {
        const m = [
          row.m1||0, row.m2||0, row.m3||0, row.m4||0,
          row.m5||0, row.m6||0, row.m7||0, row.m8||0
        ]
        const h = [
          row.h1||0, row.h2||0, row.h3||0, row.h4||0,
          row.h5||0, row.h6||0, row.h7||0, row.h8||0
        ]
        const subM = m.reduce((a, b) => a + b, 0)
        const subH = h.reduce((a, b) => a + b, 0)
        return [
          row.iddelegacion,
          row.delegacion,
          row.total_acciones,
          row.con_convenio,
          row.sin_convenio,
          ...m,
          subM,
          ...h,
          subH
        ]
      })

      // Fila de totales: sumamos cols 2 a 22
      const sums = new Array(21).fill(0)
      filas.forEach((f) => {
        for (let i = 0; i < 21; i++) {
          sums[i] += Number(f[2 + i]) || 0
        }
      })
      filas.push([
        'TOTALES',
        '',
        ...sums
      ])

      return {
        titulo: 'Reporte de talleres impartidos por convenio por demarcación territorial',
        columnas: [
          'Clave', 'Demarcación Territorial', 'Total de acciones', 'Con convenio', 'Sin convenio',
          'Muj 0-12', 'Muj 13-16', 'Muj 17-20', 'Muj 21-30', 'Muj 31-40', 'Muj 41-50', 'Muj 51-61', 'Muj +62', 'Subtotal Muj',
          'Hom 0-12', 'Hom 13-16', 'Hom 17-20', 'Hom 21-30', 'Hom 31-40', 'Hom 41-50', 'Hom 51-61', 'Hom +62', 'Subtotal Hom'
        ],
        filas,
        summaryRows: 1
      }
    }

    // ── TIPO 13: Concentrado de talleres por grupos de edad ─────────────────
    case 13: {
      const sqlQuery = `
        SELECT
          cat.descripcion AS curso,
          CASE
            WHEN cat.idtipo = 1 THEN 'Mujeres'
            WHEN cat.idtipo = 2 THEN 'Jóvenes'
            WHEN cat.idtipo = 3 THEN 'Hombres'
            WHEN cat.idtipo = 4 THEN 'Intervenciones'
            WHEN cat.idtipo = 5 THEN 'Población en General'
          END AS vertiente,
          COUNT(ti.idcurso) AS total_acciones,
          SUM(ti.pmujeres1) AS muj_0_12,   SUM(ti.pmujeres2) AS muj_13_16,
          SUM(ti.pmujeres3) AS muj_17_20,  SUM(ti.pmujeres4) AS muj_21_30,
          SUM(ti.pmujeres5) AS muj_31_40,  SUM(ti.pmujeres6) AS muj_41_50,
          SUM(ti.pmujeres7) AS muj_51_61,  SUM(ti.pmujeres8) AS muj_mas_62,
          SUM(ti.phombres1) AS hom_0_12,   SUM(ti.phombres2) AS hom_13_16,
          SUM(ti.phombres3) AS hom_17_20,  SUM(ti.phombres4) AS hom_21_30,
          SUM(ti.phombres5) AS hom_31_40,  SUM(ti.phombres6) AS hom_41_50,
          SUM(ti.phombres7) AS hom_51_61,  SUM(ti.phombres8) AS hom_mas_62
        FROM sisecycc2024.dbo.sisec_cat_cursos cat
        INNER JOIN sisecycc2024.dbo.sisec_talleres_intervenciones ti ON ti.idcatcurso = cat.idcurso
        WHERE ti.status = 3
          ${fechaFilter}
        GROUP BY cat.descripcion, cat.idtipo
        ORDER BY cat.idtipo, cat.descripcion
      `
      const result = await request.query(sqlQuery)
      const filas = result.recordset.map((row, idx) => {
        const m = [
          row.muj_0_12||0, row.muj_13_16||0, row.muj_17_20||0, row.muj_21_30||0,
          row.muj_31_40||0, row.muj_41_50||0, row.muj_51_61||0, row.muj_mas_62||0
        ]
        const h = [
          row.hom_0_12||0, row.hom_13_16||0, row.hom_17_20||0, row.hom_21_30||0,
          row.hom_31_40||0, row.hom_41_50||0, row.hom_51_61||0, row.hom_mas_62||0
        ]
        const subM = m.reduce((a, b) => a + b, 0)
        const subH = h.reduce((a, b) => a + b, 0)
        return [
          idx + 1,
          row.curso,
          row.vertiente,
          row.total_acciones,
          ...m,
          subM,
          ...h,
          subH
        ]
      })

      // Fila de totales: sumamos cols 3 a 21
      const sums = new Array(19).fill(0)
      filas.forEach((f) => {
        for (let i = 0; i < 19; i++) {
          sums[i] += Number(f[3 + i]) || 0
        }
      })
      filas.push([
        'TOTALES',
        '',
        '',
        ...sums
      ])

      return {
        titulo: 'Reporte de talleres e intervenciones por grupo de edad y género',
        columnas: [
          'Num', 'Nombre de taller o intervención', 'Vertientes', 'Número de Talleres o Intervenciones',
          'Muj 0-12', 'Muj 13-16', 'Muj 17-20', 'Muj 21-30', 'Muj 31-40', 'Muj 41-50', 'Muj 51-61', 'Muj +62', 'Total Muj',
          'Hom 0-12', 'Hom 13-16', 'Hom 17-20', 'Hom 21-30', 'Hom 31-40', 'Hom 41-50', 'Hom 51-61', 'Hom +62', 'Total Hom'
        ],
        filas,
        summaryRows: 1
      }
    }

    // ── TIPO 14 (legacy): Programadas, realizadas y no realizadas ───────────
    case 14: {
      const sqlQuery = `
        SELECT
          cat.idcurso,
          cat.descripcion AS curso,
          tip.descripcion AS vertiente,
          SUM(CASE WHEN ti.status IN (1,2,3) THEN 1 ELSE 0 END) AS programadas,
          SUM(CASE WHEN ti.status = 3 THEN 1 ELSE 0 END) AS realizadas,
          SUM(CASE WHEN ti.status = 2 THEN 1 ELSE 0 END) AS norealizadas
        FROM sisecycc2024.dbo.sisec_cat_cursos cat
        LEFT JOIN sisecycc2024.dbo.sisec_talleres_intervenciones ti ON cat.idcurso = ti.idcatcurso
          AND ti.fecha >= @fechaInic AND ti.fecha <= @fechaFin
        JOIN sisecycc2024.dbo.sisec_tipos_cursos_y_talleres tip ON cat.idtipo = tip.idtipo
        GROUP BY cat.idcurso, cat.descripcion, tip.descripcion
        ORDER BY cat.idcurso
      `
      const result = await request.query(sqlQuery)
      const filas = result.recordset.map((row, idx) => [
        idx + 1,
        row.idcurso,
        row.curso,
        row.vertiente,
        row.programadas || 0,
        row.realizadas || 0,
        row.norealizadas || 0
      ])

      // Fila de totales: sumamos cols 4, 5, 6
      const sums = [0, 0, 0]
      filas.forEach((f) => {
        sums[0] += f[4]
        sums[1] += f[5]
        sums[2] += f[6]
      })
      filas.push([
        'TOTAL',
        '',
        '',
        '',
        ...sums
      ])

      return {
        titulo: 'Reporte de talleres programados, realizados y no realizados',
        columnas: ['Num', 'ID', 'Nombre de taller', 'Vertientes', 'Programadas', 'Realizadas', 'No realizadas'],
        filas,
        summaryRows: 1
      }
    }

    default:
      return { titulo: 'Reporte', columnas: [], filas: [] }
  }
}
