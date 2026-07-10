// XLSX report generator for SISEC CC 2026
import ExcelJS from 'exceljs'

const COLOR_TITULO   = 'FF6B21A8'   // purple-800
const COLOR_META     = 'FFF5F3FF'   // purple-50
const COLOR_HEADER   = 'FF7C3AED'   // purple-600
const COLOR_FILA_ALT = 'FFF5F3FF'   // purple-50
const COLOR_BORDE    = 'FFE5E7EB'   // gray-200
const COLOR_TOTALES  = 'FF4C1D95'   // purple-900 (fila de totales)

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
  celdaTitulo.font      = { bold: true, size: 13, color: { argb: 'FFFFFFFF' }, name: 'Calibri' }
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
  celdaMeta.font      = { italic: true, size: 9, color: { argb: 'FF6B21A8' }, name: 'Calibri' }
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

  // ── Rows 4+: Datos ─────────────────────────────────────────────────────────
  const totalFilas = datos.length
  datos.forEach((fila, index) => {
    const row = worksheet.addRow(fila)
    row.height = 16

    const esSummary   = summaryRows > 0 && index >= totalFilas - summaryRows
    const esAlternada = !esSummary && index % 2 === 0

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if (esSummary) {
        // ── Fila de totales: texto blanco sobre fondo morado oscuro ───────
        cell.font      = { bold: true, size: 10, color: { argb: 'FFFFFFFF' }, name: 'Calibri' }
        cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_TOTALES } }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
        cell.border    = { top: { style: 'medium', color: { argb: 'FFFFFFFF' } } }
      } else {
        cell.font      = { size: 10, name: 'Calibri' }
        cell.alignment = { vertical: 'middle' }
        cell.border    = { bottom: { style: 'hair', color: { argb: COLOR_BORDE } } }
        if (esAlternada) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_FILA_ALT } }
        }
        // Alinear números al centro
        if (typeof fila[colNumber - 1] === 'number') {
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
        }
      }
    })
  })

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
