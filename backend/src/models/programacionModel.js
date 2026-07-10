// Programacion model for SISEC CC 2026
import { getPool, sql } from '../config/db.js'

export const createProgramacion = async (payload) => {
  const pool = await getPool()
  const request = pool.request()

  request.input('idcatcurso', sql.Int, payload.idcatcurso)
  request.input('vertiente', sql.Int, payload.vertiente)
  request.input('idtipopublico', sql.Int, payload.idtipopublico)
  request.input('fecha', sql.VarChar(10), payload.fecha)
  request.input('lugar', sql.VarChar(150), payload.lugar)
  request.input('direccion', sql.VarChar(50), payload.direccion)
  request.input('colonia', sql.VarChar(50), payload.colonia)
  request.input('cp', sql.VarChar(6), payload.cp)
  request.input('iddelegacion', sql.Int, payload.iddelegacion)
  request.input('tipoinstitucion', sql.Int, payload.tipoinstitucion)
  request.input('duracionhrs', sql.Int, payload.duracionhrs)
  request.input('duracionmin', sql.Int, payload.duracionmin)
  request.input('comentarios', sql.VarChar(250), payload.comentarios)
  request.input('convenio', sql.Int, payload.convenio)
  request.input('idusuario', sql.Int, payload.idusuario)
  request.input('fecha_alta', sql.VarChar(10), payload.fecha_alta)
  request.input('hora_alta', sql.VarChar(10), payload.hora_alta)
  request.input('status', sql.Int, payload.status)
  request.input('nombre_contacto', sql.VarChar(80), payload.nombre_contacto)
  request.input('telefono_contacto', sql.VarChar(30), payload.telefono_contacto)
  request.input('num_personas', sql.Int, payload.num_personas)
  request.input('personal_distrito', sql.VarChar(250), payload.personal_distrito)
  request.input('id_distrito', sql.TinyInt, payload.id_distrito)

  const result = await request.query(`
    INSERT INTO sisecycc2024.dbo.sisec_talleres_intervenciones (
      idcatcurso, vertiente, idtipopublico, fecha, lugar, direccion, colonia, cp, iddelegacion,
      tipoinstitucion, duracionhrs, duracionmin, comentarios, convenio, idusuario,
      fecha_alta, hora_alta, status, nombre_contacto, telefono_contacto, num_personas,
      personal_distrito, id_distrito
    )
    OUTPUT INSERTED.idcurso
    VALUES (
      @idcatcurso, @vertiente, @idtipopublico, @fecha, @lugar, @direccion, @colonia, @cp, @iddelegacion,
      @tipoinstitucion, @duracionhrs, @duracionmin, @comentarios, @convenio, @idusuario,
      @fecha_alta, @hora_alta, @status, @nombre_contacto, @telefono_contacto, @num_personas,
      @personal_distrito, @id_distrito
    )
  `)

  return result.recordset[0]?.idcurso
}

export const listProgramacionBySede = async (idsede) => {
  const pool = await getPool()
  const request = pool.request()

  request.input('idsede', sql.TinyInt, idsede)

  const result = await request.query(`
    SELECT ti.idcurso,
           COALESCE(ti.fecha_alta, ti.fecha) AS fecha,
        ti.lugar AS institucion,
           ti.duracionhrs,
           ti.duracionmin,
           COALESCE(ti.hora_alta, ti.hora_programada) AS hora_programada,
           ti.status,
        cc.descripcion AS curso,
           ti.idcatcurso
    FROM sisecycc2024.dbo.sisec_talleres_intervenciones ti
      LEFT JOIN sisecycc2024.dbo.sisec_cat_cursos cc ON ti.idcatcurso = cc.idcurso
    INNER JOIN sisec_usuarios u ON ti.idusuario = u.idusuario
    WHERE u.idsede = @idsede AND ti.status IN (1, 3)
    ORDER BY COALESCE(ti.fecha_alta, ti.fecha) DESC
  `)

  return result.recordset
}
