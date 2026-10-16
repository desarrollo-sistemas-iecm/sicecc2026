// ConfigFechas model for SISEC CC 2026
import { getPool, sql } from '../config/db.js'

export const getConfigFechas = async () => {
  const pool = await getPool()
  const result = await pool.request().query(`
    SELECT id, modulo, format(fecha_inicio, 'yyyy-MM-dd') as fecha_inicio, format(fecha_fin, 'yyyy-MM-dd') as fecha_fin, format(fecha_limite, 'yyyy-MM-dd') as fecha_limite, habilitado, idsede, fecha_actualizado
    FROM sisec_config_fechas
  `)
  return result.recordset
}

export const updateConfigFechas = async (modulo, fecha_inicio, fecha_fin, habilitado, idsede, idusuario_actualizo, fecha_limite = null) => {
  const pool = await getPool()
  const request = pool.request()

  request.input('modulo', sql.VarChar(20), modulo)
  request.input('fecha_inicio', sql.Date, fecha_inicio)
  request.input('fecha_fin', sql.Date, fecha_fin)
  request.input('fecha_limite', sql.Date, fecha_limite || null)
  request.input('habilitado', sql.Bit, habilitado)
  request.input('idsede', sql.Int, idsede)
  request.input('idusuario_actualizo', sql.Int, idusuario_actualizo)

  await request.query(`
    MERGE sisec_config_fechas AS target
    USING (SELECT @modulo AS modulo, @idsede AS idsede) AS source
    ON (target.modulo = source.modulo AND target.idsede = source.idsede)
    WHEN MATCHED THEN
        UPDATE SET 
            fecha_inicio = @fecha_inicio, 
            fecha_fin = @fecha_fin, 
            fecha_limite = @fecha_limite,
            habilitado = @habilitado, 
            fecha_actualizado = GETDATE(), 
            idusuario_actualizo = @idusuario_actualizo
    WHEN NOT MATCHED THEN
        INSERT (modulo, fecha_inicio, fecha_fin, fecha_limite, habilitado, idsede, fecha_actualizado, idusuario_actualizo)
        VALUES (@modulo, @fecha_inicio, @fecha_fin, @fecha_limite, @habilitado, @idsede, GETDATE(), @idusuario_actualizo);
  `)
}

export const deleteConfigFechasById = async (id) => {
  const pool = await getPool()
  const request = pool.request()
  request.input('id', sql.Int, id)
  await request.query(`
    DELETE FROM sisec_config_fechas WHERE id = @id AND idsede > 0
  `)
}

export const isFechaHabilitada = async (modulo, fechaSeleccionada, idsede = 0) => {
  const pool = await getPool()
  const request = pool.request()

  // 1. Verificar si el sistema está globalmente deshabilitado
  const globalCheck = await pool.request()
    .input('modulo', sql.VarChar(20), modulo)
    .query(`SELECT habilitado FROM sisec_config_fechas WHERE (modulo = @modulo OR modulo = 'ambos') AND idsede = 0`)

  const globalHabilitado = globalCheck.recordset.length > 0 ? Boolean(globalCheck.recordset[0].habilitado) : true

  // Si existe una excepción específica para el distrito activa, tiene prioridad sobre el bloqueo global
  request.input('modulo', sql.VarChar(20), modulo)
  request.input('fecha', sql.Date, fechaSeleccionada)
  request.input('idsede', sql.Int, idsede)

  const exceptionResult = await request.query(`
    SELECT TOP 1 habilitado 
    FROM sisec_config_fechas 
    WHERE (modulo = @modulo OR modulo = 'ambos')
      AND habilitado = 1 
      AND @fecha >= fecha_inicio 
      AND @fecha <= fecha_fin
      AND (fecha_limite IS NULL OR CAST(GETDATE() AS DATE) <= fecha_limite)
      AND (idsede = @idsede OR (idsede = 0 AND @idsede = 0))
  `)

  // Si hay una excepción activa que cubre la fecha y la fecha límite de la prórroga no ha expirado:
  if (exceptionResult.recordset.length > 0) {
    return true
  }

  // Si el sistema global está explícitamente apagado y no hay excepción que cubra la fecha:
  if (!globalHabilitado) {
    return false
  }

  // 2. Regla del Mes Vigente:
  // Si no hay excepción específica, pero la fecha corresponde al mes actual en curso:
  if (fechaSeleccionada) {
    const [yearStr, monthStr] = String(fechaSeleccionada).split('-')
    const actYear = Number(yearStr)
    const actMonth = Number(monthStr)

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // 1-12

    // Si la fecha es del mes y año vigente, está permitida
    if (actYear === currentYear && actMonth === currentMonth) {
      return true
    }
  }

  // 3. También verificar si la configuración global (idsede = 0) cubre la fecha:
  const globalRangeResult = await pool.request()
    .input('modulo', sql.VarChar(20), modulo)
    .input('fecha', sql.Date, fechaSeleccionada)
    .query(`
      SELECT TOP 1 habilitado 
      FROM sisec_config_fechas 
      WHERE (modulo = @modulo OR modulo = 'ambos')
        AND habilitado = 1 
        AND idsede = 0
        AND @fecha >= fecha_inicio 
        AND @fecha <= fecha_fin
        AND (fecha_limite IS NULL OR CAST(GETDATE() AS DATE) <= fecha_limite)
    `)

  return globalRangeResult.recordset.length > 0
}
