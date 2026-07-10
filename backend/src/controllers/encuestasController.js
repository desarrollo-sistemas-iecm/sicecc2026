// Encuestas controller for SISEC CC 2026
import {
  folioExiste,
  getConsecutivoFolio,
  getNumEncuesta,
  insertarEncuesta
} from '../models/encuestaModel.js'
import { logger } from '../config/logger.js'

const buildFolio = (distrito, consecutivo, sufijo) => {
  const dist = String(distrito).padStart(2, '0')
  const seq = String(consecutivo).padStart(4, '0')
  return `${dist}${seq}${sufijo}`
}

export const obtenerFolio = async (req, res, next) => {
  try {
    const tipo = String(req.query.tipo || '').toUpperCase()
    const distrito = Number(req.query.distrito || req.user.idsede)
    const sufijo = tipo === 'I' ? 'I26' : 'T26'
    const consecutivo = await getConsecutivoFolio(distrito, sufijo)
    const folio = buildFolio(distrito, consecutivo, sufijo)

    return res.json({ success: true, folio })
  } catch (error) {
    return next(error)
  }
}

export const crearEncuesta = async (req, res, next) => {
  try {
    const distrito = req.user.idsede
    const idUsuario = req.user.idUsuario
    const now = new Date()
    const year = String(now.getFullYear())
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const fechaAlta = `${year}-${month}-${day} ${hours}:${minutes}`
    const numEncuesta = await getNumEncuesta(distrito)
    let folio = String(req.body.folio_encuesta || '').trim()

    if (!folio) {
      return res.status(422).json({
        success: false,
        message: 'Datos invalidos',
        errors: [{ field: 'folio_encuesta', msg: 'Folio requerido' }]
      })
    }

    if (await folioExiste(folio)) {
      logger.warn(`[ACTION]  ⚠️  Folio duplicado detectado — ${folio} | Recalculando...`)
      const sufijo = folio.slice(-3)
      const consecutivo = await getConsecutivoFolio(distrito, sufijo)
      const nuevoFolio = buildFolio(distrito, consecutivo, sufijo)

      if (await folioExiste(nuevoFolio)) {
        return res.status(409).json({
          success: false,
          message: 'Folio duplicado. Intenta nuevamente.'
        })
      }

      folio = nuevoFolio
      logger.info(`[ACTION]  📝 Folio recalculado — ${folio}`)
    }

    const payload = {
      folio_encuesta: folio,
      num_encuesta: numEncuesta,
      tipo: Number(req.body.tipo),
      id_distrito: distrito,
      edad: Number(req.body.edad),
      genero: Number(req.body.genero),
      etiqueta2: Number(req.body.etiqueta2),
      etiqueta3: Number(req.body.etiqueta3),
      etiqueta4: Number(req.body.etiqueta4),
      etiqueta5: Number(req.body.etiqueta5),
      etiqueta6: Number(req.body.etiqueta6),
      etiqueta7: Number(req.body.etiqueta7),
      fecha_alta: fechaAlta,
      id_usuario: idUsuario,
      status: 0
    }

    await insertarEncuesta(payload)
    logger.info(`[ACTION]  📝 Encuesta guardada — Folio: ${folio} | Usuario: ${req.user.nombre} | Distrito: ${distrito}`)

    return res.status(201).json({
      success: true,
      message: 'Encuesta guardada correctamente',
      folio_encuesta: folio
    })
  } catch (error) {
    logger.error(`[ERROR]   💥 Error en POST /api/encuestas — ${error.message}`)
    return next(error)
  }
}
