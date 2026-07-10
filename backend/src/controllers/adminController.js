import { getConfigFechas, updateConfigFechas } from '../models/configFechasModel.js'
import { crearNotificacion } from '../models/notificacionModel.js'

export const listConfigFechas = async (req, res, next) => {
  try {
    const allData = await getConfigFechas()
    const data = allData.filter(d => d.modulo !== 'manual' && d.modulo !== 'alerta_login' && d.modulo !== 'ultima_actualizacion')


    // Si es superadmin o admin, pueden ver todas (o al menos las que necesiten administrar)
    // Para simplificar: el frontend de admin asume que devuelve las globales si no se dice nada, o todas.
    // Pero para los operadores (idpermiso = 1), solo devolvemos las aplicables a su idsede.
    const userPermiso = Number(req.user.permiso || req.user.idpermiso)
    const userSede = Number(req.user.idsede)

    if (userPermiso === 1) {
      // Filtrar para obtener solo la aplicable al operador
      const filtered = []
      const modulos = ['programacion', 'captura']
      for (const mod of modulos) {
        const configsMod = data.filter(d => d.modulo === mod)
        const specific = configsMod.find(d => d.idsede === userSede)
        const global = configsMod.find(d => d.idsede === 0)
        if (specific) filtered.push(specific)
        if (global) filtered.push(global)
      }
      return res.json({ success: true, data: filtered })
    }

    return res.json({ success: true, data })
  } catch (error) {
    return next(error)
  }
}

export const saveConfigFechas = async (req, res, next) => {
  try {
    const { modulo, fecha_inicio, fecha_fin, habilitado, idsede = 0 } = req.body
    
    // Guardamos para ambos ya que el requerimiento dicta que comparten la habilitación
    await updateConfigFechas('programacion', fecha_inicio, fecha_fin, habilitado, idsede, req.user.idusuario)
    await updateConfigFechas('captura', fecha_inicio, fecha_fin, habilitado, idsede, req.user.idusuario)
    
    // Notificamos: Si idsede es 0, es a todos. Si no, a la sede específica.
    await crearNotificacion({
      tipo: 'fecha_habilitada',
      titulo: idsede === 0 ? 'Nuevo periodo de captura/programación habilitado' : `Fechas habilitadas (Distrito ${idsede})`,
      mensaje: `Se ha habilitado el periodo del ${fecha_inicio} al ${fecha_fin}.`,
      idsede_origen: 0,
      idsede_destino: idsede,
      idusuario_destino: 0
    })

    return res.json({ success: true, message: 'Configuración actualizada' })
  } catch (error) {
    return next(error)
  }
}

export const requestFechaExcepcion = async (req, res, next) => {
  try {
    const { fecha_solicitada, modulo } = req.body
    
    await crearNotificacion({
      tipo: 'solicitud_fecha',
      titulo: `Solicitud de habilitación de fecha: Dtto ${req.user.idsede}`,
      mensaje: `El Distrito ${req.user.idsede} solicita habilitar la fecha ${fecha_solicitada} en el módulo de ${modulo}.`,
      idsede_origen: req.user.idsede,
      idsede_destino: 0, // SuperAdmins
      idusuario_destino: 0
    })

    return res.json({ success: true, message: 'Solicitud enviada al Super Administrador' })
  } catch (error) {
    return next(error)
  }
}

import { getPool, sql } from '../config/db.js'

export const getManualConfig = async (req, res, next) => {
  try {
    const pool = await getPool()
    const result = await pool.request().query(`
      SELECT habilitado FROM sisec_config_fechas WHERE modulo = 'manual'
    `)
    const habilitado = result.recordset.length > 0 ? Boolean(result.recordset[0].habilitado) : false
    return res.json({ success: true, habilitado })
  } catch (error) {
    return next(error)
  }
}

export const saveManualConfig = async (req, res, next) => {
  try {
    const { habilitado } = req.body
    const pool = await getPool()
    const request = pool.request()
    request.input('habilitado', sql.Bit, habilitado)
    request.input('idusuario', sql.Int, req.user.idusuario)

    await request.query(`
      MERGE sisec_config_fechas AS target
      USING (SELECT 'manual' AS modulo, 0 AS idsede) AS source
      ON (target.modulo = source.modulo AND target.idsede = source.idsede)
      WHEN MATCHED THEN
          UPDATE SET 
              habilitado = @habilitado, 
              fecha_actualizado = GETDATE(), 
              idusuario_actualizo = @idusuario
      WHEN NOT MATCHED THEN
          INSERT (modulo, fecha_inicio, fecha_fin, habilitado, idsede, fecha_actualizado, idusuario_actualizo)
          VALUES ('manual', '2026-01-01', '2026-12-31', @habilitado, 0, GETDATE(), @idusuario);
    `)
    return res.json({ success: true, message: 'Configuración del manual actualizada' })
  } catch (error) {
    return next(error)
  }
}

export const getAlertaLoginConfig = async (req, res, next) => {
  try {
    const pool = await getPool()
    const result = await pool.request().query(`
      SELECT habilitado, format(fecha_fin, 'yyyy-MM-dd') as fecha_fin 
      FROM sisec_config_fechas 
      WHERE modulo = 'alerta_login'
    `)
    if (result.recordset.length > 0) {
      return res.json({ 
        success: true, 
        habilitado: Boolean(result.recordset[0].habilitado),
        fecha_fin: result.recordset[0].fecha_fin
      })
    } else {
      // Valor por defecto: habilitado hasta 2026-12-31
      return res.json({ 
        success: true, 
        habilitado: true,
        fecha_fin: '2026-12-31'
      })
    }
  } catch (error) {
    return next(error)
  }
}

export const saveAlertaLoginConfig = async (req, res, next) => {
  try {
    const { habilitado, fecha_fin = '2026-12-31' } = req.body
    const pool = await getPool()
    const request = pool.request()
    request.input('habilitado', sql.Bit, habilitado)
    request.input('fecha_fin', sql.Date, fecha_fin)
    request.input('idusuario', sql.Int, req.user.idusuario)

    await request.query(`
      MERGE sisec_config_fechas AS target
      USING (SELECT 'alerta_login' AS modulo, 0 AS idsede) AS source
      ON (target.modulo = source.modulo AND target.idsede = source.idsede)
      WHEN MATCHED THEN
          UPDATE SET 
              habilitado = @habilitado, 
              fecha_fin = @fecha_fin,
              fecha_actualizado = GETDATE(), 
              idusuario_actualizo = @idusuario
      WHEN NOT MATCHED THEN
          INSERT (modulo, fecha_inicio, fecha_fin, habilitado, idsede, fecha_actualizado, idusuario_actualizo)
          VALUES ('alerta_login', '2026-01-01', @fecha_fin, @habilitado, 0, GETDATE(), @idusuario);
    `)
    return res.json({ success: true, message: 'Configuración de alerta de login actualizada' })
  } catch (error) {
    return next(error)
  }
}

export const getUltimaActualizacionConfig = async (req, res, next) => {
  try {
    const pool = await getPool()
    const result = await pool.request().query(`
      SELECT habilitado, format(fecha_fin, 'yyyy-MM-dd') as fecha_fin 
      FROM sisec_config_fechas 
      WHERE modulo = 'ultima_actualizacion'
    `)
    if (result.recordset.length > 0) {
      return res.json({ 
        success: true, 
        habilitado: Boolean(result.recordset[0].habilitado),
        fecha: result.recordset[0].fecha_fin
      })
    } else {
      const hoy = new Date().toISOString().split('T')[0]
      return res.json({ 
        success: true, 
        habilitado: false,
        fecha: hoy
      })
    }
  } catch (error) {
    return next(error)
  }
}

export const saveUltimaActualizacionConfig = async (req, res, next) => {
  try {
    const { habilitado, fecha } = req.body
    const pool = await getPool()
    const request = pool.request()
    request.input('habilitado', sql.Bit, habilitado)
    request.input('fecha_fin', sql.Date, fecha)
    request.input('idusuario', sql.Int, req.user.idusuario)

    await request.query(`
      MERGE sisec_config_fechas AS target
      USING (SELECT 'ultima_actualizacion' AS modulo, 0 AS idsede) AS source
      ON (target.modulo = source.modulo AND target.idsede = source.idsede)
      WHEN MATCHED THEN
          UPDATE SET 
              habilitado = @habilitado, 
              fecha_fin = @fecha_fin,
              fecha_actualizado = GETDATE(), 
              idusuario_actualizo = @idusuario
      WHEN NOT MATCHED THEN
          INSERT (modulo, fecha_inicio, fecha_fin, habilitado, idsede, fecha_actualizado, idusuario_actualizo)
          VALUES ('ultima_actualizacion', '2026-01-01', @fecha_fin, @habilitado, 0, GETDATE(), @idusuario);
    `)
    return res.json({ success: true, message: 'Configuración de última actualización guardada' })
  } catch (error) {
    return next(error)
  }
}



