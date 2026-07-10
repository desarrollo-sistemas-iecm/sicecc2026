// ConfigFechas model for SISEC CC 2026
import { getPool, sql } from '../config/db.js'

export const getConfigFechas = async () => {
  const pool = await getPool()
  const result = await pool.request().query(`
    SELECT id, modulo, format(fecha_inicio, 'yyyy-MM-dd') as fecha_inicio, format(fecha_fin, 'yyyy-MM-dd') as fecha_fin, habilitado, idsede, fecha_actualizado
    FROM sisec_config_fechas
  `)
  return result.recordset
}

export const updateConfigFechas = async (modulo, fecha_inicio, fecha_fin, habilitado, idsede, idusuario_actualizo) => {
  const pool = await getPool()
  const request = pool.request()

  request.input('modulo', sql.VarChar(20), modulo)
  request.input('fecha_inicio', sql.Date, fecha_inicio)
  request.input('fecha_fin', sql.Date, fecha_fin)
  request.input('habilitado', sql.Bit, habilitado)
  request.input('idsede', sql.Int, idsede)
  request.input('idusuario_actualizo', sql.Int, idusuario_actualizo)

  // Si existe actualiza, si no inserta. Dado que Programacion y Captura comparten, podemos usar MERGE o simplemente hacer un Update/Insert
  // Asumiremos un UPSERT simple por modulo
  await request.query(`
    MERGE sisec_config_fechas AS target
    USING (SELECT @modulo AS modulo, @idsede AS idsede) AS source
    ON (target.modulo = source.modulo AND target.idsede = source.idsede)
    WHEN MATCHED THEN
        UPDATE SET 
            fecha_inicio = @fecha_inicio, 
            fecha_fin = @fecha_fin, 
            habilitado = @habilitado, 
            fecha_actualizado = GETDATE(), 
            idusuario_actualizo = @idusuario_actualizo
    WHEN NOT MATCHED THEN
        INSERT (modulo, fecha_inicio, fecha_fin, habilitado, idsede, fecha_actualizado, idusuario_actualizo)
        VALUES (@modulo, @fecha_inicio, @fecha_fin, @habilitado, @idsede, GETDATE(), @idusuario_actualizo);
  `)
}

export const isFechaHabilitada = async (modulo, fechaSeleccionada) => {
  const pool = await getPool()
  const request = pool.request()
  
  request.input('modulo', sql.VarChar(20), modulo)
  request.input('fecha', sql.Date, fechaSeleccionada)
  
  const result = await request.query(`
    SELECT TOP 1 habilitado 
    FROM sisec_config_fechas 
    WHERE modulo = @modulo 
      AND habilitado = 1 
      AND @fecha >= fecha_inicio 
      AND @fecha <= fecha_fin
  `)
  
  return result.recordset.length > 0
}
