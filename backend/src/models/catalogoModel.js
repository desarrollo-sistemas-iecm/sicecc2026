// Catalogo model for SISEC CC 2026
import { getPool } from '../config/db.js'

export const getCatalogosReportes = async () => {
  const pool = await getPool()

  // Sedes de distritos (máximo 33 distritos)
  const sedes = await pool.request().query(`
    SELECT idsede, descripcion, iddelegacion
    FROM sisec_sedes
    WHERE idsede <= 33
    ORDER BY idsede
  `)

  // Delegaciones (máximo 17)
  const delegaciones = await pool.request().query(`
    SELECT iddelegacion, descripcion
    FROM sisec_delegaciones
    WHERE iddelegacion <= 17
    ORDER BY iddelegacion
  `)

  // Catálogo de cursos activos (se filtra en frontend por idtipo)
  const cursos = await pool.request().query(`
    SELECT idcurso, descripcion, idtipo
    FROM sisecycc2024.dbo.sisec_cat_cursos
    WHERE estatus = 1
    ORDER BY idtipo, descripcion
  `)

  // Catálogo de tipos de público (para intervenciones educativas)
  const tiposPublico = await pool.request().query(`
    SELECT idtipopublico, descripcion
    FROM sisecycc2024.dbo.sisec_cat_tipos_publico
    WHERE estatus = 1
    ORDER BY idtipopublico
  `)

  return {
    sedes: sedes.recordset,
    delegaciones: delegaciones.recordset,
    cursos: cursos.recordset,
    tiposPublico: tiposPublico.recordset
  }
}
