// Auditoria model for SISEC CC 2026
import { getPool, sql } from '../config/db.js'
import { logger } from '../config/logger.js'

export const registrarAuditoriaArchivo = async (idusuario, nombre_archivo, accion) => {
  try {
    const pool = await getPool()
    const request = pool.request()

    // Intentamos registrar en la tabla, si no existe o hay error, solo logueamos
    // ya que no debe bloquear el flujo principal.
    request.input('idusuario', sql.Int, idusuario)
    request.input('nombre_archivo', sql.VarChar(255), nombre_archivo)
    request.input('accion', sql.VarChar(50), accion)

    await request.query(`
      IF OBJECT_ID('sisecycc2024.dbo.sisec_auditoria_archivos', 'U') IS NOT NULL
      BEGIN
        INSERT INTO sisecycc2024.dbo.sisec_auditoria_archivos (idusuario, nombre_archivo, accion, fecha_registro)
        VALUES (@idusuario, @nombre_archivo, @accion, GETDATE())
      END
      ELSE
      BEGIN
        -- Si la tabla no existe localmente, podemos crearla al vuelo o ignorar (aqui ignoramos en SQL y logueamos)
        PRINT 'Tabla sisec_auditoria_archivos no existe'
      END
    `)
  } catch (error) {
    logger.error(`Error al registrar auditoria de archivo: ${error.message}`)
  }
}
