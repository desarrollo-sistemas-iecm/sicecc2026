// JWT auth middleware for SISEC CC 2026
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export const auth = (req, res, next) => {
  const header = req.headers.authorization
  if (!header) {
    return res.status(401).json({ success: false, message: 'Token requerido.' })
  }

  const token = header.replace('Bearer ', '')
  try {
    const decoded = jwt.verify(token, env.jwt.secret)
    req.user = decoded
    return next()
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token invalido o expirado.' })
  }
}
