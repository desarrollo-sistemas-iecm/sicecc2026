<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { CalendarDays, Save, CheckCircle, XCircle, Plus, Trash2, ShieldCheck, AlertCircle, Building, CalendarRange } from '@lucide/vue'
import api from '../../services/api'
import AppCard from '../../components/ui/AppCard.vue'
import ModalHabilitarFechas from '../../components/modals/ModalHabilitarFechas.vue'
import Swal from 'sweetalert2'

const restricciones = ref([])
const solicitudes = ref([])
const loading = ref(true)

const modalHabilitarOpen = ref(false)
const modalHabilitarSede = ref(0)
const modalHabilitarTitulo = ref('')
const modalAllowGlobal = ref(true)

const fetchRestricciones = async () => {
  try {
    const { data } = await api.get('/admin/restricciones')
    if (data.success) {
      restricciones.value = data.data
    }
  } catch (error) {
    console.error('Error fetching restricciones:', error)
  }
}

const fetchSolicitudes = async () => {
  try {
    const { data } = await api.get('/notificaciones/solicitudes-pendientes')
    if (data.success) {
      solicitudes.value = data.data
    }
  } catch (error) {
    console.error('Error fetching solicitudes:', error)
  }
}

const saveRestriccion = async (form) => {
  try {
    const { data } = await api.post('/admin/restricciones', form)
    if (data.success) {
      Swal.fire({
        icon: 'success',
        title: 'Guardado',
        text: 'La configuración de fechas ha sido actualizada.',
        confirmButtonColor: '#6B2D8B'
      })
      await fetchRestricciones()
    }
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Ocurrió un error al guardar la configuración.',
      confirmButtonColor: '#6B2D8B'
    })
  }
}

// Filtrar las excepciones específicas por distrito (idsede > 0)
const excepcionesDistritales = computed(() => {
  return restricciones.value.filter(r => Number(r.idsede) > 0)
})

// Eliminar / revocar una excepción de distrito
const deleteRestriccion = async (item) => {
  const result = await Swal.fire({
    title: '¿Revocar habilitación?',
    text: `Se eliminará el periodo especial para el Distrito ${item.idsede} (${item.modulo === 'programacion' ? 'Programación' : 'Captura'}).`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Sí, revocar',
    cancelButtonText: 'Cancelar'
  })

  if (result.isConfirmed) {
    try {
      await api.delete(`/admin/restricciones/${item.id}`)
      await fetchRestricciones()
      Swal.fire({
        icon: 'success',
        title: 'Revocado',
        text: 'La excepción del distrito ha sido eliminada con éxito.',
        confirmButtonColor: '#6B2D8B'
      })
    } catch (error) {
      Swal.fire('Error', 'No se pudo eliminar la excepción.', 'error')
    }
  }
}

// Modal interactivo para dar de alta una nueva excepción a un distrito o global
const abrirModalNuevaExcepcion = (sede = 0, isGlobal = true) => {
  modalHabilitarSede.value = sede
  modalAllowGlobal.value = isGlobal
  modalHabilitarTitulo.value = isGlobal && sede === 0 
    ? 'Habilitar Fechas (Mes Completo o Ciertos Días)' 
    : `Habilitar Fechas para Distrito ${sede}`
  modalHabilitarOpen.value = true
}

const handleAprobarSolicitud = async (solicitud) => {
  modalHabilitarSede.value = Number(solicitud.idsede_origen || 1)
  modalAllowGlobal.value = false
  modalHabilitarTitulo.value = `Aprobar Habilitación - Distrito ${solicitud.idsede_origen}`
  modalHabilitarOpen.value = true
  try {
    await api.patch(`/notificaciones/${solicitud.id}/leer`)
    await fetchSolicitudes()
  } catch (e) {}
}

const handleRechazarSolicitud = async (solicitud) => {
  try {
    await api.patch(`/notificaciones/${solicitud.id}/leer`)
    await fetchSolicitudes()
    Swal.fire({ icon: 'info', title: 'Rechazada', text: 'La solicitud ha sido descartada.', confirmButtonColor: '#6B2D8B' })
  } catch (error) {
    Swal.fire('Error', 'No se pudo rechazar la solicitud.', 'error')
  }
}

onMounted(async () => {
  await fetchRestricciones()
  await fetchSolicitudes()
  await fetchManualStatus()
  await fetchAlertaLoginStatus()
  await fetchUltimaActStatus()
  
  if (restricciones.value.length === 0) {
    // Valores por defecto
    restricciones.value = [
      { modulo: 'programacion', fecha_inicio: '', fecha_fin: '', habilitado: false },
      { modulo: 'captura', fecha_inicio: '', fecha_fin: '', habilitado: false }
    ]
  }
  loading.value = false
})

const ultimaActHabilitada = ref(false)
const ultimaActFecha = ref('')

const fetchUltimaActStatus = async () => {
  try {
    const { data } = await api.get('/admin/ultima-actualizacion-config')
    if (data.success) {
      ultimaActHabilitada.value = data.habilitado
      ultimaActFecha.value = data.fecha
    }
  } catch (error) {
    console.error('Error fetching last update config:', error)
  }
}

const saveUltimaActStatus = async () => {
  try {
    const { data } = await api.post('/admin/ultima-actualizacion-config', { 
      habilitado: ultimaActHabilitada.value,
      fecha: ultimaActFecha.value
    })
    if (data.success) {
      Swal.fire({
        icon: 'success',
        title: 'Actualizado',
        text: 'La configuración de última actualización ha sido actualizada.',
        confirmButtonColor: '#6B2D8B'
      })
    }
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Ocurrió un error al guardar la configuración.',
      confirmButtonColor: '#6B2D8B'
    })
  }
}


const manualHabilitado = ref(false)
const manualLoading = ref(true)
const alertaLoginHabilitada = ref(false)

const fetchAlertaLoginStatus = async () => {
  try {
    const { data } = await api.get('/admin/alerta-login-config')
    if (data.success) {
      alertaLoginHabilitada.value = data.habilitado
    }
  } catch (error) {
    console.error('Error fetching login alert status:', error)
  }
}

const saveAlertaLoginStatus = async () => {
  try {
    const { data } = await api.post('/admin/alerta-login-config', { 
      habilitado: alertaLoginHabilitada.value,
      fecha_fin: '2026-12-31'
    })
    if (data.success) {
      Swal.fire({
        icon: 'success',
        title: 'Actualizado',
        text: 'La visibilidad de la alerta de login ha sido actualizada.',
        confirmButtonColor: '#6B2D8B'
      })
    }
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Ocurrió un error al guardar la configuración de la alerta.',
      confirmButtonColor: '#6B2D8B'
    })
  }
}

const fetchManualStatus = async () => {
  try {
    const { data } = await api.get('/admin/manual-config')
    if (data.success) {
      manualHabilitado.value = data.habilitado
    }
  } catch (error) {
    console.error('Error fetching manual status:', error)
  } finally {
    manualLoading.value = false
  }
}

const saveManualStatus = async () => {
  try {
    const { data } = await api.post('/admin/manual-config', { habilitado: manualHabilitado.value })
    if (data.success) {
      Swal.fire({
        icon: 'success',
        title: 'Actualizado',
        text: 'La visibilidad del manual de usuario ha sido actualizada.',
        confirmButtonColor: '#6B2D8B'
      })
    }
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Ocurrió un error al guardar la configuración del manual.',
      confirmButtonColor: '#6B2D8B'
    })
  }
}


const generalConfig = ref({
  fecha_inicio: '',
  fecha_fin: '',
  habilitado: true
})

// Populate from first found record
const setConfigFromData = () => {
  const record = restricciones.value.find(r => r.modulo === 'programacion') || restricciones.value[0]
  if (record) {
    generalConfig.value.fecha_inicio = record.fecha_inicio
    generalConfig.value.fecha_fin = record.fecha_fin
    generalConfig.value.habilitado = Boolean(record.habilitado)
  }
}

// Watch for changes when loaded
watch(restricciones, () => {
  if (restricciones.value.length > 0) {
    setConfigFromData()
  }
}, { deep: true })
</script>

<template>
  <div class="space-y-6">
    <header class="flex items-center gap-4 mb-8">
      <div class="p-3 bg-iecm-morado-100 dark:bg-iecm-morado-950/30 text-iecm-morado-700 dark:text-iecm-morado-300 rounded-xl">
        <CalendarDays class="w-6 h-6" />
      </div>
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Restricciones de Fechas</h1>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">Configura los periodos habilitados para captura y programación en el sistema.</p>
      </div>
    </header>

    <div class="grid lg:grid-cols-2 gap-6">
      <div class="space-y-6">
        <!-- Configuración General -->
        <AppCard>
          <template #header>
            <div class="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Configuración Global (Todos los Distritos)</h2>
                <p class="text-xs text-slate-500 dark:text-slate-400">Aplica para todos los distritos de forma general</p>
              </div>
              <button
                type="button"
                @click="abrirModalNuevaExcepcion(0, true)"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-iecm-morado hover:bg-iecm-morado-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                title="Abrir asistente para habilitar un mes completo o ciertos días para todos los distritos"
              >
                <CalendarRange class="w-4 h-4" />
                Habilitar Mes o Días
              </button>
            </div>
          </template>
          <div v-if="loading" class="py-10 text-center"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-iecm-morado mx-auto"></div></div>
          <form v-else @submit.prevent="saveRestriccion(generalConfig)" class="space-y-6">
            <div class="p-3.5 bg-purple-50/80 dark:bg-iecm-morado-950/20 border border-iecm-morado/20 rounded-xl text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <p class="font-bold text-iecm-morado dark:text-iecm-morado-300 flex items-center gap-1.5 text-xs">
                <AlertCircle class="w-4 h-4 shrink-0" />
                Regla Automática del Mes Vigente:
              </p>
              <p class="leading-relaxed">
                Por defecto, el sistema mantiene habilitado automáticamente el <strong>mes actual en curso</strong> para capturas y programaciones. Si requieres abrir meses anteriores (ej. Septiembre) o un rango extraordinario para <strong>TODOS los distritos</strong>, configura este periodo general.
              </p>
            </div>

            <div class="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-200 dark:border-white/10">
              <div>
                <p class="font-medium text-slate-900 dark:text-white">Estado del Sistema</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">Habilitar o inhabilitar globalmente las fechas</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="generalConfig.habilitado" class="sr-only peer">
                <div class="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fecha Inicio</label>
                <input type="date" v-model="generalConfig.fecha_inicio" required :disabled="!generalConfig.habilitado" class="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm focus:border-iecm-morado focus:ring-iecm-morado disabled:bg-slate-100 dark:bg-slate-800 disabled:text-slate-500 dark:text-slate-400" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fecha Fin</label>
                <input type="date" v-model="generalConfig.fecha_fin" required :disabled="!generalConfig.habilitado" class="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm focus:border-iecm-morado focus:ring-iecm-morado disabled:bg-slate-100 dark:bg-slate-800 disabled:text-slate-500 dark:text-slate-400" />
              </div>
            </div>

            <div class="pt-4">
              <button type="submit" class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-iecm-morado text-white rounded-lg hover:bg-iecm-morado-700 transition-colors font-medium cursor-pointer">
                <Save class="w-5 h-5" />
                Guardar Configuración Global
              </button>
            </div>
          </form>
        </AppCard>

        <!-- Manual de Usuario Config -->
        <AppCard>
          <template #header>
            <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Manual de Usuario y Alertas</h2>
          </template>
          <div v-if="manualLoading" class="py-10 text-center"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-iecm-morado mx-auto"></div></div>
          <div v-else class="space-y-4">
            <!-- Visibilidad del Botón del Manual -->
            <div class="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-200 dark:border-white/10">
              <div>
                <p class="font-medium text-slate-900 dark:text-white">Visibilidad del Manual</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">Permitir a todos los usuarios ver y descargar el manual</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="manualHabilitado" @change="saveManualStatus" class="sr-only peer">
                <div class="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <!-- Visibilidad de la Alerta en Login -->
            <div class="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-200 dark:border-white/10">
              <div>
                <p class="font-medium text-slate-900 dark:text-white">Alerta de manual al iniciar sesión</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">Mostrar recordatorio al iniciar sesión (Válido hasta el 31 de Dic, 2026)</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="alertaLoginHabilitada" @change="saveAlertaLoginStatus" class="sr-only peer">
                <div class="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <!-- Etiqueta de Última Actualización de Código -->
            <div class="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-200 dark:border-white/10 space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium text-slate-900 dark:text-white">Etiqueta de Última Actualización</p>
                  <p class="text-xs text-slate-500 dark:text-slate-400">Mostrar la fecha de última modificación del código en el menú lateral</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" v-model="ultimaActHabilitada" @change="saveUltimaActStatus" class="sr-only peer">
                  <div class="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
              <div v-if="ultimaActHabilitada" class="grid grid-cols-1 gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
                <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400">Fecha de Última Modificación</label>
                <div class="flex gap-2">
                  <input type="date" v-model="ultimaActFecha" class="rounded-lg border-slate-300 border px-3 py-1.5 text-sm focus:border-iecm-morado focus:ring-iecm-morado flex-1" />
                  <button type="button" @click="saveUltimaActStatus" class="px-4 py-1.5 bg-iecm-morado hover:bg-iecm-morado-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer">
                    Actualizar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </AppCard>
      </div>

      <!-- Columna 2: Excepciones por Distrito y Solicitudes Pendientes -->
      <div class="space-y-6">
        <!-- Habilitaciones por Distrito (Excepciones) -->
        <AppCard>
          <template #header>
            <div class="flex justify-between items-center flex-wrap gap-2">
              <div>
                <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Habilitaciones por Distrito</h2>
                <p class="text-xs text-slate-500 dark:text-slate-400">Permisos para distritos específicos (ej. autorizar Septiembre)</p>
              </div>
              <button 
                type="button" 
                @click="abrirModalNuevaExcepcion"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-iecm-morado hover:bg-iecm-morado-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <Plus class="w-4 h-4" />
                Habilitar Distrito
              </button>
            </div>
          </template>

          <div v-if="loading" class="py-10 text-center"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-iecm-morado mx-auto"></div></div>
          
          <div v-else-if="excepcionesDistritales.length === 0" class="text-center py-8 text-slate-400 dark:text-slate-500">
            <Building class="w-10 h-10 mx-auto opacity-20 mb-2" />
            <p class="text-sm font-medium">No hay excepciones distritales configuradas.</p>
            <p class="text-xs text-slate-500 mt-1">Todos los distritos operan bajo el mes vigente o periodo global.</p>
          </div>

          <div v-else class="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            <div 
              v-for="exc in excepcionesDistritales" 
              :key="exc.id" 
              class="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-slate-900/40 hover:border-iecm-morado/40 transition-colors"
            >
              <div class="flex items-center gap-3">
                <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-iecm-morado-100 dark:bg-iecm-morado-950/40 text-iecm-morado-700 dark:text-iecm-morado-300 font-bold text-xs">
                  D{{ exc.idsede }}
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-sm text-slate-900 dark:text-white">Distrito {{ exc.idsede }}</span>
                    <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300">
                      {{ exc.modulo === 'programacion' ? 'Programación' : 'Captura' }}
                    </span>
                  </div>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Periodo: <strong class="text-slate-700 dark:text-slate-300">{{ exc.fecha_inicio }}</strong> al <strong class="text-slate-700 dark:text-slate-300">{{ exc.fecha_fin }}</strong>
                  </p>
                  <p v-if="exc.fecha_limite" class="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1">
                    <span>⏰</span> Ventana abierta hasta: <strong>{{ exc.fecha_limite }}</strong>
                  </p>
                </div>
              </div>

              <button 
                type="button"
                @click="deleteRestriccion(exc)"
                class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                title="Revocar excepción para este distrito"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </AppCard>

        <!-- Solicitudes de Excepción -->
        <AppCard>
          <template #header>
            <div class="flex justify-between items-center">
              <div>
                <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Solicitudes de Distritos</h2>
                <p class="text-xs text-slate-500 dark:text-slate-400">Peticiones de operadores para habilitar fechas</p>
              </div>
              <span v-if="solicitudes.length > 0" class="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-0.5 rounded-full">{{ solicitudes.length }}</span>
            </div>
          </template>
          <div class="space-y-4">
            <div v-if="loading" class="py-10 text-center"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-iecm-morado mx-auto"></div></div>
            <div v-else-if="solicitudes.length === 0" class="text-center py-8 text-slate-400 dark:text-slate-500">
              <CheckCircle class="w-10 h-10 mx-auto opacity-20 mb-2" />
              <p class="text-sm font-medium">No hay solicitudes de excepción pendientes.</p>
            </div>
            <div v-else class="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              <div v-for="sol in solicitudes" :key="sol.id" class="p-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 relative overflow-hidden group">
                <div class="flex justify-between items-start mb-2">
                  <div>
                    <h3 class="font-bold text-amber-900 dark:text-amber-300 text-sm">{{ sol.titulo }}</h3>
                    <p class="text-xs text-amber-700 dark:text-amber-400 mt-1">{{ sol.mensaje }}</p>
                  </div>
                </div>
                <div class="flex gap-2 mt-3">
                  <button @click="handleAprobarSolicitud(sol)" class="flex-1 flex justify-center items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors cursor-pointer">
                    <CheckCircle class="w-4 h-4" /> Aprobar y Habilitar
                  </button>
                  <button @click="handleRechazarSolicitud(sol)" class="flex-1 flex justify-center items-center gap-1 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors cursor-pointer">
                    <XCircle class="w-4 h-4" /> Descartar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </AppCard>
      </div>
    </div>

    <!-- Modal Interactivo para Habilitar Mes Completo o Ciertos Días (Distrital o Global) -->
    <ModalHabilitarFechas
      :open="modalHabilitarOpen"
      :initial-sede="modalHabilitarSede"
      :allow-global="modalAllowGlobal"
      :title="modalHabilitarTitulo"
      @close="modalHabilitarOpen = false"
      @saved="() => { modalHabilitarOpen = false; fetchRestricciones(); fetchSolicitudes(); }"
    />
  </div>
</template>
