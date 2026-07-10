import { computed } from 'vue'

/**
 * Composable para calcular el porcentaje de tiempo restante y asignar una categoría
 * de color (semáforo de urgencia) según reglas de negocio porcentuales.
 * 
 * Reglas de negocio:
 * - 0% a 21% restante: Rojo (Urgente / Crítico)
 * - 22% a 50% restante: Naranja (Advertencia media)
 * - 51% a 99% restante: Amarillo (Preventivo)
 * - 100% restante: Verde (Normal / Completo)
 */
export function useUrgencyColor(fechaInicio, fechaFin) {
  const calculations = computed(() => {
    if (!fechaInicio || !fechaFin) {
      return {
        percentage: 0,
        daysRemaining: 0,
        colorName: 'red',
        classes: {
          text: 'text-red-500 dark:text-red-400',
          bg: 'bg-red-50 dark:bg-red-950/30',
          border: 'border-red-200 dark:border-red-500/20',
          stroke: 'stroke-red-500 dark:stroke-red-400'
        }
      }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const start = new Date(fechaInicio)
    start.setHours(0, 0, 0, 0)

    const end = new Date(fechaFin)
    end.setHours(0, 0, 0, 0)

    // Total de días del rango de habilitación (incluyendo extremos)
    const totalMs = end.getTime() - start.getTime()
    const totalDays = Math.max(1, Math.ceil(totalMs / (1000 * 60 * 60 * 24)) + 1)

    // Días restantes incluyendo el día de hoy
    const remainingMs = end.getTime() - today.getTime()
    const daysRemaining = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)) + 1)

    // Si ya expiró (end < hoy)
    const isExpired = end.getTime() < today.getTime()
    const finalDaysRemaining = isExpired ? 0 : daysRemaining

    // Calcular porcentaje
    let percentage = 0
    if (!isExpired) {
      percentage = Math.min(100, Math.max(0, Math.round((finalDaysRemaining / totalDays) * 100)))
    }

    // Mapear porcentaje a semáforo de colores
    let colorName = 'green'
    let classes = {}

    if (isExpired || percentage <= 21) {
      colorName = 'red'
      classes = {
        text: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-50 dark:bg-red-500/10',
        border: 'border-red-200 dark:border-red-500/20',
        stroke: 'stroke-red-500 dark:stroke-red-400'
      }
    } else if (percentage <= 50) {
      colorName = 'orange'
      classes = {
        text: 'text-orange-600 dark:text-orange-400',
        bg: 'bg-orange-50 dark:bg-orange-500/10',
        border: 'border-orange-200 dark:border-orange-500/20',
        stroke: 'stroke-orange-500 dark:stroke-orange-400'
      }
    } else if (percentage <= 99) {
      colorName = 'yellow'
      classes = {
        text: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-500/10',
        border: 'border-amber-200 dark:border-amber-500/20',
        stroke: 'stroke-amber-500 dark:stroke-amber-400'
      }
    } else {
      colorName = 'green'
      classes = {
        text: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-500/10',
        border: 'border-emerald-200 dark:border-emerald-500/20',
        stroke: 'stroke-emerald-500 dark:stroke-emerald-400'
      }
    }

    return {
      percentage,
      daysRemaining: finalDaysRemaining,
      colorName,
      classes,
      totalDays,
      isExpired
    }
  })

  return {
    calculations
  }
}
