// Auth model for SISEC CC 2026
import bcrypt from 'bcryptjs'
import { getPool, sql } from '../config/db.js'

const isBcryptHash = (value = '') => value.startsWith('$2a$') || value.startsWith('$2b$') || value.startsWith('$2y$')

export const verifyCredentials = async (usuario, contrasena) => {
  const pool = await getPool()
  const request = pool.request()

  const userInput = String(usuario ?? '').trim()
  const passInput = String(contrasena ?? '').trim()

  request.input('usuario', sql.VarChar(10), userInput)

  const result = await request.query(`
    SELECT idusuario, idsede, idpermiso, usuario, password, pass2, estado
    FROM sisec_usuarios
    WHERE usuario = @usuario AND estado = 1
  `)

  const row = result.recordset[0]
  if (!row) {
    return null
  }

  const stored = String(row.password ?? '').trim()
  const storedAlt = String(row.pass2 ?? '').trim()
  let valid = false

  if (isBcryptHash(stored)) {
    valid = await bcrypt.compare(passInput, stored)
  } else {
    valid = passInput === stored || passInput === storedAlt
  }

  if (!valid) {
    return null
  }

  return {
    idUsuario: row.idusuario,
    idsede: row.idsede,
    permiso: row.idpermiso,
    nombre: row.usuario
  }
}
