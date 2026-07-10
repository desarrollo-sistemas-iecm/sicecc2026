// Validation middleware for SISEC CC 2026
import { validationResult } from 'express-validator'

export const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() })
  }
  return next()
}

export const validateEncuesta = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Datos invalidos',
      errors: errors.array().map((error) => ({ field: error.path, msg: error.msg }))
    })
  }
  return next()
}

export const validateReporte = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Datos invalidos',
      errors: errors.array().map((error) => ({ field: error.path, msg: error.msg }))
    })
  }
  return next()
}
