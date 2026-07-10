// Cursos controller for SISEC CC 2026
import { listCursosByVertiente } from '../models/cursoModel.js'

export const listarCursos = async (req, res, next) => {
  try {
    const vertiente = Number(req.query.vertiente)
    const data = await listCursosByVertiente(vertiente)
    return res.json({ success: true, data })
  } catch (error) {
    return next(error)
  }
}
