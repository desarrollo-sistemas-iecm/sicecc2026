// Encuesta model for SISEC CC 2026
import { getPool, sql } from '../config/db.js'

export const getConsecutivoFolio = async (distrito, sufijo) => {
  const pool = await getPool()
  const request = pool.request()

  request.input('distrito', sql.Int, distrito)
  request.input('sufijo', sql.VarChar(6), `%${sufijo}`)

  const result = await request.query(`
    SELECT ISNULL(MAX(CAST(SUBSTRING(folio_encuesta, 3, 4) AS INT)), 0) + 1 AS consecutivo
    FROM sisecycc2024.dbo.sisec_encuestas
    WHERE id_distrito = @distrito
      AND folio_encuesta LIKE @sufijo
  `)

  return Number(result.recordset[0]?.consecutivo || 1)
}

export const folioExiste = async (folio) => {
  const pool = await getPool()
  const request = pool.request()

  request.input('folio', sql.VarChar(20), folio)

  const result = await request.query(`
    SELECT COUNT(*) AS total
    FROM sisecycc2024.dbo.sisec_encuestas
    WHERE folio_encuesta = @folio
  `)

  return Number(result.recordset[0]?.total || 0) > 0
}

export const getNumEncuesta = async (distrito) => {
  const pool = await getPool()
  const request = pool.request()

  request.input('distrito', sql.Int, distrito)

  const result = await request.query(`
    SELECT ISNULL(MAX(num_encuesta), 0) + 1 AS num_encuesta
    FROM sisecycc2024.dbo.sisec_encuestas
    WHERE id_distrito = @distrito
  `)

  return Number(result.recordset[0]?.num_encuesta || 1)
}

export const insertarEncuesta = async (payload) => {
  const pool = await getPool()
  const request = pool.request()

  request.input('folio_encuesta', sql.VarChar(20), payload.folio_encuesta)
  request.input('num_encuesta', sql.Int, payload.num_encuesta)
  request.input('tipo', sql.Int, payload.tipo)
  request.input('id_distrito', sql.Int, payload.id_distrito)
  request.input('edad', sql.TinyInt, payload.edad)
  request.input('genero', sql.TinyInt, payload.genero)
  request.input('etiqueta2', sql.TinyInt, payload.etiqueta2)
  request.input('etiqueta3', sql.TinyInt, payload.etiqueta3)
  request.input('etiqueta4', sql.TinyInt, payload.etiqueta4)
  request.input('etiqueta5', sql.TinyInt, payload.etiqueta5)
  request.input('etiqueta6', sql.TinyInt, payload.etiqueta6)
  request.input('etiqueta7', sql.TinyInt, payload.etiqueta7)
  request.input('fecha_alta', sql.VarChar(16), payload.fecha_alta)
  request.input('id_usuario', sql.Int, payload.id_usuario)
  request.input('status', sql.Bit, payload.status)

  const result = await request.query(`
    INSERT INTO sisecycc2024.dbo.sisec_encuestas (
      folio_encuesta, num_encuesta, tipo,
      id_distrito, edad, genero,
      etiqueta2, etiqueta3, etiqueta4, etiqueta5, etiqueta6, etiqueta7,
      fecha_alta, id_usuario, status
    )
    OUTPUT INSERTED.id_encuesta
    VALUES (
      @folio_encuesta, @num_encuesta, @tipo,
      @id_distrito, @edad, @genero,
      @etiqueta2, @etiqueta3, @etiqueta4, @etiqueta5, @etiqueta6, @etiqueta7,
      @fecha_alta, @id_usuario, @status
    )
  `)

  return result.recordset[0]?.id_encuesta
}
