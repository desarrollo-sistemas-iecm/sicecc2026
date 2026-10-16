// Notificaciones model for SISEC CC 2026
import { getPool, sql } from '../config/db.js'

export const getNotificaciones = async (idsede, idusuario, idpermiso) => {
  const pool = await getPool()
  const request = pool.request()

  request.input('idsede', sql.Int, idsede)
  request.input('idusuario', sql.Int, idusuario)
  request.input('idpermiso', sql.Int, idpermiso)

  // Si idpermiso >= 2 (Admin o SuperAdmin), no vemos 'fecha_habilitada' ni 'archivo_actualizado'
  // porque el admin es quien las manda.
  const result = await request.query(`
    SELECT TOP 50 id, tipo, titulo, mensaje, idsede_origen, idsede_destino, idusuario_destino, leida, fecha_creacion
    FROM sisec_notificaciones
    WHERE 
      (idsede_destino = 0 OR idsede_destino = @idsede)
      AND (idusuario_destino = 0 OR idusuario_destino = @idusuario)
      AND (@idpermiso = 1 OR tipo NOT IN ('fecha_habilitada', 'archivo_actualizado'))
    ORDER BY fecha_creacion DESC
  `)

  return result.recordset
}

export const getSolicitudesPendientes = async () => {
  const pool = await getPool()
  const request = pool.request()

  // Solo SuperAdmin debería ver esto, tipo 'solicitud_fecha' y que no estén resueltas
  // Por ahora, asumimos que 'leida' = 0 significa pendiente en este contexto específico
  const result = await request.query(`
    SELECT id, tipo, titulo, mensaje, idsede_origen, leida, fecha_creacion
    FROM sisec_notificaciones
    WHERE tipo = 'solicitud_fecha' AND leida = 0
    ORDER BY fecha_creacion ASC
  `)

  return result.recordset
}

export const marcarComoLeida = async (id, idsede, idusuario) => {
  const pool = await getPool()
  const request = pool.request()

  request.input('id', sql.Int, id)
  request.input('idsede', sql.Int, idsede)
  request.input('idusuario', sql.Int, idusuario)

  await request.query(`
    UPDATE sisec_notificaciones
    SET leida = 1
    WHERE id = @id 
      AND (idsede_destino = 0 OR idsede_destino = @idsede)
      AND (idusuario_destino = 0 OR idusuario_destino = @idusuario)
  `)
}

export const marcarTodasComoLeidas = async (idsede, idusuario) => {
  const pool = await getPool()
  const request = pool.request()

  request.input('idsede', sql.Int, idsede)
  request.input('idusuario', sql.Int, idusuario)

  await request.query(`
    UPDATE sisec_notificaciones
    SET leida = 1
    WHERE (idsede_destino = 0 OR idsede_destino = @idsede)
      AND (idusuario_destino = 0 OR idusuario_destino = @idusuario)
  `)
}

export const crearNotificacion = async (payload) => {
  const pool = await getPool()
  const request = pool.request()

  request.input('tipo', sql.VarChar(30), payload.tipo)
  request.input('titulo', sql.VarChar(120), payload.titulo)
  request.input('mensaje', sql.VarChar(500), payload.mensaje)
  request.input('idsede_origen', sql.Int, payload.idsede_origen || 0)
  request.input('idsede_destino', sql.Int, payload.idsede_destino || 0)
  request.input('idusuario_destino', sql.Int, payload.idusuario_destino || 0)

  await request.query(`
    INSERT INTO sisec_notificaciones (tipo, titulo, mensaje, idsede_origen, idsede_destino, idusuario_destino, leida)
    VALUES (@tipo, @titulo, @mensaje, @idsede_origen, @idsede_destino, @idusuario_destino, 0)
  `)
}
