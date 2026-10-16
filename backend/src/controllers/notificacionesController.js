import { getNotificaciones, marcarComoLeida, marcarTodasComoLeidas, getSolicitudesPendientes } from '../models/notificacionModel.js'

export const listNotificaciones = async (req, res, next) => {
  try {
    const idpermiso = Number(req.user.permiso || req.user.idpermiso)
    const data = await getNotificaciones(req.user.idsede, req.user.idusuario, idpermiso)
    return res.json({ success: true, data })
  } catch (error) {
    return next(error)
  }
}

export const leerNotificacion = async (req, res, next) => {
  try {
    await marcarComoLeida(Number(req.params.id), req.user.idsede, req.user.idusuario)
    return res.json({ success: true })
  } catch (error) {
    return next(error)
  }
}

export const leerTodasNotificaciones = async (req, res, next) => {
  try {
    await marcarTodasComoLeidas(req.user.idsede, req.user.idusuario)
    return res.json({ success: true })
  } catch (error) {
    return next(error)
  }
}

export const listSolicitudesPendientes = async (req, res, next) => {
  try {
    const data = await getSolicitudesPendientes()
    return res.json({ success: true, data })
  } catch (error) {
    return next(error)
  }
}
