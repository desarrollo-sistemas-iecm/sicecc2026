import { getPool, sql } from '../config/db.js'
import bcrypt from 'bcryptjs'

export const listUsuarios = async () => {
  const pool = await getPool()
  const result = await pool.request().query(`
    SELECT idusuario, usuario, idsede, idpermiso, estado, 
           'N/A' as fecha_registro
    FROM sisec_usuarios
    WHERE estado = 1
    ORDER BY idsede ASC, idpermiso ASC
  `)
  return result.recordset
}

export const createUsuario = async (payload) => {
  const pool = await getPool()
  const request = pool.request()

  // Limitar a 10 caracteres para cumplir con la restricción VARCHAR(10) de la BD
  const cleanUsuario = String(payload.usuario ?? '').trim().substring(0, 10)
  const cleanPassword = String(payload.password ?? '').trim().substring(0, 10)

  request.input('usuario', sql.VarChar(10), cleanUsuario)
  
  // Validar si el usuario ya existe
  const existResult = await request.query(`
    SELECT idusuario FROM sisec_usuarios WHERE usuario = @usuario
  `)
  if (existResult.recordset.length > 0) {
    throw new Error('El nombre de usuario ya existe.')
  }

  // Obtener el siguiente idusuario disponible (al no ser columna IDENTITY)
  const maxResult = await pool.request().query(`
    SELECT ISNULL(MAX(idusuario), 0) + 1 AS nextId FROM sisec_usuarios
  `)
  const nextId = maxResult.recordset[0].nextId

  request.input('idusuario', sql.TinyInt, nextId)
  request.input('password', sql.VarChar(10), cleanPassword)
  request.input('idsede', sql.TinyInt, payload.idsede)
  request.input('idpermiso', sql.TinyInt, payload.idpermiso)

  await request.query(`
    INSERT INTO sisec_usuarios (idusuario, usuario, password, pass2, idsede, idpermiso, estado)
    VALUES (@idusuario, @usuario, @password, @password, @idsede, @idpermiso, 1)
  `)
  return { idusuario: nextId }
}

export const updateUsuario = async (id, payload) => {
  const pool = await getPool()
  const request = pool.request()

  request.input('id', sql.Int, id)
  request.input('idsede', sql.TinyInt, payload.idsede)
  request.input('idpermiso', sql.TinyInt, payload.idpermiso)

  let query = `
    UPDATE sisec_usuarios
    SET idsede = @idsede, idpermiso = @idpermiso
  `

  if (payload.password) {
    const cleanPassword = String(payload.password ?? '').trim().substring(0, 10)
    request.input('password', sql.VarChar(10), cleanPassword)
    query += `, password = @password, pass2 = @password`
  }

  query += ` WHERE idusuario = @id`

  await request.query(query)
}

export const deleteUsuario = async (id) => {
  const pool = await getPool()
  const request = pool.request()
  
  request.input('id', sql.Int, id)
  // Soft delete
  await request.query(`
    UPDATE sisec_usuarios SET estado = 0 WHERE idusuario = @id
  `)
}
