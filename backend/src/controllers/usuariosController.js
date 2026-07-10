import { listUsuarios, createUsuario, updateUsuario, deleteUsuario } from '../models/usuarioModel.js'

export const getUsuarios = async (req, res, next) => {
  try {
    const data = await listUsuarios()
    return res.json({ success: true, data })
  } catch (error) {
    return next(error)
  }
}

export const postUsuario = async (req, res, next) => {
  try {
    const data = await createUsuario(req.body)
    return res.json({ success: true, message: 'Usuario creado exitosamente', data })
  } catch (error) {
    if (error.message.includes('ya existe')) {
      return res.status(400).json({ success: false, message: error.message })
    }
    return next(error)
  }
}

export const putUsuario = async (req, res, next) => {
  try {
    await updateUsuario(Number(req.params.id), req.body)
    return res.json({ success: true, message: 'Usuario actualizado exitosamente' })
  } catch (error) {
    return next(error)
  }
}

export const delUsuario = async (req, res, next) => {
  try {
    await deleteUsuario(Number(req.params.id))
    return res.json({ success: true, message: 'Usuario eliminado exitosamente' })
  } catch (error) {
    return next(error)
  }
}
