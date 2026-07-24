// XLSX report generator for SISEC CC 2026
import ExcelJS from 'exceljs'

const COLOR_TITULO   = 'FFFFFFFF'   // white
const COLOR_META     = 'FFFFFFFF'   // white
const COLOR_HEADER   = 'FF6B7280'   // gray-500
const COLOR_FILA_ALT = 'FFF9FAFB'   // gray-50
const COLOR_BORDE    = 'FFE5E7EB'   // gray-200
const COLOR_TOTALES  = 'FF4ADE80'   // vibrant green-400 (fila de totales)

function getContrastColor(hexColor) {
  const r = parseInt(hexColor.substr(0, 2), 16)
  const g = parseInt(hexColor.substr(2, 2), 16)
  const b = parseInt(hexColor.substr(4, 2), 16)
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000
  return (yiq >= 128) ? 'FF000000' : 'FFFFFFFF' // negro o blanco
}

/**
 * Genera un Workbook de ExcelJS con título, fila de metadata, cabeceras y datos.
 *
 * @param {string}   titulo      - Título del reporte (row 1)
 * @param {string[]} columnas    - Nombres de las columnas (row 3)
 * @param {Array[]}  datos       - Filas de datos (arrays de valores)
 * @param {object}   meta        - { fechaInic, fechaFin } para la fila de metadata
 * @param {number}   summaryRows - Últimas N filas son de totales (se estilan diferente)
 * @returns {ExcelJS.Workbook}
 */
export const generarXLSX = async (titulo, columnas, datos, meta = {}, summaryRows = 0) => {
  const workbook  = new ExcelJS.Workbook()
  workbook.creator   = 'SISEC CC 2026'
  workbook.created   = new Date()
  workbook.modified  = new Date()

  const worksheet = workbook.addWorksheet('Reporte', {
    pageSetup: { fitToPage: true, fitToWidth: 1, orientation: 'landscape' }
  })

  const numCols = columnas.length

  // ── Row 1: Título ──────────────────────────────────────────────────────────
  worksheet.mergeCells(1, 1, 1, numCols)
  const celdaTitulo = worksheet.getCell('A1')
  celdaTitulo.value     = titulo.toUpperCase()
  celdaTitulo.font      = { bold: true, size: 13, color: { argb: 'FF000000' }, name: 'Calibri' }
  celdaTitulo.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_TITULO } }
  celdaTitulo.alignment = { horizontal: 'center', vertical: 'middle' }
  worksheet.getRow(1).height = 26

  // ── Row 2: Metadata (periodo + fecha generación) ───────────────────────────
  worksheet.mergeCells(2, 1, 2, numCols)
  const celdaMeta = worksheet.getCell('A2')
  const ahora     = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })

  let periodoText = ''
  if (meta.fechaInic && meta.fechaFin) {
    periodoText = `Periodo: ${meta.fechaInic} al ${meta.fechaFin}  |  `
  }
  celdaMeta.value     = `${periodoText}Generado el: ${ahora}`
  celdaMeta.font      = { italic: true, size: 9, color: { argb: 'FF4B5563' }, name: 'Calibri' }
  celdaMeta.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_META } }
  celdaMeta.alignment = { horizontal: 'center', vertical: 'middle' }
  worksheet.getRow(2).height = 16

  // ── Row 3: Cabeceras ───────────────────────────────────────────────────────
  const filaCabecera = worksheet.addRow(columnas)
  filaCabecera.height = 20
  filaCabecera.eachCell((cell) => {
    cell.font      = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10, name: 'Calibri' }
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER } }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    cell.border    = {
      bottom: { style: 'thin', color: { argb: COLOR_BORDE } },
      right:  { style: 'thin', color: { argb: 'FFFFFFFF' } }
    }
  })

  const esDetalle = columnas.length === 21 && columnas[7] === 'Género'

  // ── Rows 4+: Datos ─────────────────────────────────────────────────────────
  const totalFilas = datos.length
  datos.forEach((fila, index) => {
    const esSummary   = summaryRows > 0 && index >= totalFilas - summaryRows
    const esAlternada = !esSummary && (esDetalle ? Math.floor(index / 2) % 2 === 0 : index % 2 === 0)

    const colorCurso = esDetalle ? fila[21] : null
    const filaDatos  = esDetalle ? fila.slice(0, 21) : fila

    const row = worksheet.addRow(filaDatos)
    row.height = 18 // un poco más alto para mejorar legibilidad

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if (esSummary) {
        // ── Fila de totales: texto negro sobre fondo verde claro ───────
        cell.font      = { bold: true, size: 10, color: { argb: 'FF000000' }, name: 'Calibri' }
        cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_TOTALES } }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
        cell.border    = {
          top:    { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          left:   { style: 'thin', color: { argb: 'FF000000' } },
          right:  { style: 'thin', color: { argb: 'FF000000' } }
        }
      } else {
        cell.font      = { size: 10, name: 'Calibri' }
        cell.alignment = { vertical: 'middle' }
        cell.border    = {
          top:    { style: 'thin', color: { argb: COLOR_BORDE } },
          bottom: { style: 'thin', color: { argb: COLOR_BORDE } },
          left:   { style: 'thin', color: { argb: COLOR_BORDE } },
          right:  { style: 'thin', color: { argb: COLOR_BORDE } }
        }
        if (esAlternada) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_FILA_ALT } }
        }
        // Alinear números al centro
        if (typeof filaDatos[colNumber - 1] === 'number') {
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
        }

        // Pintar el fondo del número de fila (columna 1) con el color de curso asignado
        if (esDetalle && colNumber === 1 && colorCurso) {
          const cleanHex = colorCurso.substring(2)
          const textARGB = getContrastColor(cleanHex)
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorCurso } }
          cell.font = { bold: true, size: 10, color: { argb: textARGB }, name: 'Calibri' }
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
        }
      }
    })
  })

  // ── Combinación de celdas para reportes de detalle (M/H agrupados) ─────────
  if (esDetalle) {
    const numDatos = totalFilas - summaryRows
    for (let i = 0; i < numDatos; i += 2) {
      const rA = 4 + i
      const rB = 4 + i + 1

      const colsToMerge = [
        { col: 1, align: 'center' },  // Num
        { col: 2, align: 'center' },  // Distrito
        { col: 3, align: 'center' },  // ID
        { col: 4, align: 'left' },    // Taller o Intervención
        { col: 5, align: 'center' },  // Presencial
        { col: 6, align: 'center' },  // Virtual
        { col: 7, align: 'left' },    // Institución
        { col: 18, align: 'center' }, // Duración
        { col: 19, align: 'center' }, // Fecha
        { col: 20, align: 'left' },   // Comentarios
        { col: 21, align: 'center' }, // Convenio
      ]

      colsToMerge.forEach(({ col, align }) => {
        worksheet.mergeCells(rA, col, rB, col)
        const cell = worksheet.getCell(rA, col)
        cell.alignment = { vertical: 'middle', horizontal: align, wrapText: true }
      })
    }
  }

  // ── Anchos de columna (estimación por contenido) ───────────────────────────
  worksheet.columns.forEach((col, idx) => {
    // Tomar el header como referencia mínima
    const headerLen = (columnas[idx] || '').length
    let maxLen = Math.max(headerLen, 8)

    // Revisar las primeras 200 filas para estimar el ancho
    datos.slice(0, 200).forEach((fila) => {
      const val = fila[idx]
      if (val !== null && val !== undefined) {
        const len = String(val).length
        if (len > maxLen) maxLen = len
      }
    })

    col.width = Math.min(maxLen + 2, 40)   // máximo 40 chars
  })

  return workbook
}

