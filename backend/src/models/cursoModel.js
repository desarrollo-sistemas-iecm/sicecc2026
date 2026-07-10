// Curso model for SISEC CC 2026
import { getPool, sql } from '../config/db.js'

export const listCursosByVertiente = async (vertiente) => {
  const pool = await getPool()
  const request = pool.request()

  request.input('vertiente', sql.Int, vertiente)

  const result = await request.query(`
    SELECT idcurso, descripcion
    FROM sisecycc2024.dbo.sisec_cat_cursos
    WHERE estatus = 1 AND idtipo = @vertiente
    ORDER BY descripcion
  `)

  return result.recordset
}
