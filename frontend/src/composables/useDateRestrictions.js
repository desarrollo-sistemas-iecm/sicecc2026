import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/authStore'
import api from '../services/api'
import Swal from 'sweetalert2'

export function useDateRestrictions() {
  const authStore = useAuthStore()
  const loading = ref(false)
  const configs = ref([])

  // Obtener fecha actual en formato local
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1 // 1 a 12
  const currentYearMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}` // ej: "2026-10"

  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  const currentMonthName = nombresMeses[currentMonth - 1]

  const loadRestrictions = async () => {
    loading.value = true
    try {
      const { data } = await api.get('/admin/restricciones')
      if (data.success && data.data) {
        configs.value = data.data
      }
    } catch (e) {
      console.error('Error cargando restricciones de fechas:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * Determina si una fecha pertenece a un mes anterior al mes vigente.
   * @param {string} dateStr 'YYYY-MM-DD'
   */
  const getYearMonth = (dateStr) => {
    if (!dateStr) return ''
    const s = String(dateStr).trim()
    if (s.includes('/')) {
      const parts = s.split('/')
      if (parts.length === 3) {
        const y = parts[2].length === 4 ? parts[2] : parts[0]
        const m = parts[1].padStart(2, '0')
        return `${y}-${m}`
      }
    }
    return s.slice(0, 7)
  }

  /**
   * Determina si una fecha pertenece a un mes anterior al mes vigente.
   * @param {string} dateStr 'YYYY-MM-DD'
   */
  const isPastMonth = (dateStr) => {
    const ym = getYearMonth(dateStr)
    if (!ym) return false
    return ym < currentYearMonth
  }

  /**
   * Determina si una fecha pertenece al mes vigente.
   * @param {string} dateStr 'YYYY-MM-DD'
   */
  const isCurrentMonth = (dateStr) => {
    const ym = getYearMonth(dateStr)
    if (!ym) return false
    return ym === currentYearMonth
  }

  /**
   * Encuentra si existe una excepción activa (específica de distrito o global) que cubra dateStr.
   * @param {string} dateStr 'YYYY-MM-DD'
   * @param {string} modulo 'captura' | 'programacion'
   * @param {number|null} rowSede
   */
  const getCoveringException = (dateStr, modulo = 'captura', rowSede = null) => {
    if (!dateStr || !configs.value.length) return null
    const userSede = rowSede !== null && rowSede !== undefined ? Number(rowSede) : Number(authStore.user?.idsede || 0)
    const today = new Date().toISOString().slice(0, 10)

    const list = configs.value.filter(c => (c.modulo === modulo || c.modulo === 'ambos') && c.habilitado)

    const isVigente = (c) => {
      if (!c.fecha_limite) return true
      return today <= c.fecha_limite
    }

    // 1. Prioridad: Excepción específica del distrito
    if (userSede > 0) {
      const distMatch = list.find(c => Number(c.idsede) === userSede && dateStr >= c.fecha_inicio && dateStr <= c.fecha_fin && isVigente(c))
      if (distMatch) return distMatch
    }

    // 2. Cobertura global (idsede = 0)
    const globalMatch = list.find(c => Number(c.idsede) === 0 && dateStr >= c.fecha_inicio && dateStr <= c.fecha_fin && isVigente(c))
    if (globalMatch) return globalMatch

    return null
  }

  /**
   * Comprueba si el sistema global está deshabilitado
   */
  const isGlobalDisabled = computed(() => {
    const global = configs.value.find(c => Number(c.idsede) === 0)
    return global ? !global.habilitado : false
  })

  /**
   * Comprueba si el distrito tiene una excepción activa
   */
  const activeDistrictException = computed(() => {
    const userSede = Number(authStore.user?.idsede || 0)
    if (!userSede) return null
    const today = new Date().toISOString().slice(0, 10)
    return configs.value.find(c => Number(c.idsede) === userSede && c.habilitado && (!c.fecha_limite || today <= c.fecha_limite))
  })

  /**
   * Comprueba si una fecha está permitida para capturar/editar/programar.
   * @param {string} dateStr 'YYYY-MM-DD'
   * @param {string} modulo 'captura' | 'programacion'
   * @param {number|null} rowSede
   */
  const isDateEnabled = (dateStr, modulo = 'captura', rowSede = null) => {
    // Si hay una excepción activa que cubre la fecha: SIEMPRE HABILITADO
    const exception = getCoveringException(dateStr, modulo, rowSede)
    if (exception) return true

    // Si el sistema global está apagado y no hay excepción: BLOQUEADO
    if (isGlobalDisabled.value) return false

    // Si es del mes vigente: HABILITADO
    if (isCurrentMonth(dateStr)) return true

    // Si es de un mes pasado y no tiene excepción: BLOQUEADO (aplica a todos los usuarios, requiere habilitación)
    if (isPastMonth(dateStr)) return false

    // Fechas futuras: permitidas en programación si el sistema no está cerrado
    return modulo === 'programacion'
  }

  /**
   * Muestra la alerta de advertencia y permite solicitar excepción
   */
  const alertPastMonthBlocked = async (row, modulo = 'captura') => {
    const fecha = row?.fecha || row
    let mesNombre = ''
    if (fecha) {
      const parts = fecha.split('-')
      if (parts.length >= 2) {
        const m = parseInt(parts[1], 10)
        mesNombre = nombresMeses[m - 1] || ''
      }
    }

    const { isConfirmed } = await Swal.fire({
      icon: 'warning',
      title: 'Periodo de Mes Pasado Concluido',
      html: `
        <div class="text-left text-sm space-y-2">
          <p>Esta actividad corresponde a <strong class="text-iecm-morado">${mesNombre || 'un mes anterior'} (${fecha})</strong>, cuyo periodo regular de captura y edición ya ha concluido.</p>
          <p class="text-slate-500">Actualmente sólo se encuentran habilitados los registros del <strong>mes vigente (${currentMonthName} ${currentYear})</strong>.</p>
          <div class="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400 text-xs">
            Si requieres registrar o editar información de este mes anterior, debes solicitar una habilitación de fechas al <strong>Super Administrador</strong>.
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Solicitar Habilitación al Super Admin',
      cancelButtonText: 'Cerrar',
      confirmButtonColor: '#6B2D8B',
      cancelButtonColor: '#64748b'
    })

    if (isConfirmed) {
      try {
        const { data } = await api.post('/admin/restricciones/solicitar', {
          fecha_solicitada: fecha,
          modulo
        })
        if (data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Solicitud Enviada',
            text: 'Tu solicitud de habilitación ha sido notificada al Super Administrador.',
            confirmButtonColor: '#6B2D8B'
          })
        }
      } catch (err) {
        Swal.fire('Error', 'No se pudo enviar la solicitud. Intenta de nuevo más tarde.', 'error')
      }
    }
  }

  return {
    configs,
    loading,
    loadRestrictions,
    isDateEnabled,
    isPastMonth,
    isCurrentMonth,
    isGlobalDisabled,
    activeDistrictException,
    currentYear,
    currentMonth,
    currentMonthName,
    alertPastMonthBlocked
  }
}
