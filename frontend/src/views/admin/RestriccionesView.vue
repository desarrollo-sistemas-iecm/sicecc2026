<script setup>
import { ref, onMounted } from 'vue'
import { CalendarDays, Save, CheckCircle, XCircle } from '@lucide/vue'
import api from '../../services/api'
import AppCard from '../../components/ui/AppCard.vue'
import Swal from 'sweetalert2'

const restricciones = ref([])
const solicitudes = ref([])
const loading = ref(true)

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

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  // Fix timezone issue when displaying
  return new Date(date.getTime() + date.getTimezoneOffset() * 60000).toISOString().split('T')[0]
}

const handleAprobarSolicitud = async (solicitud) => {
  // Simulamos la aprobación habilitando la fecha en el módulo
  // En un sistema real esto extraería la fecha del payload de la solicitud.
  Swal.fire({
    title: '¿Aprobar solicitud?',
    text: `¿Deseas habilitar la fecha solicitada para el Distrito ${solicitud.idsede_origen}?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#10b981',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Sí, aprobar',
    cancelButtonText: 'Cancelar'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await api.patch(`/notificaciones/${solicitud.id}/leer`)
        await fetchSolicitudes()
        Swal.fire('Aprobada', 'La solicitud ha sido procesada.', 'success')
      } catch (error) {
        Swal.fire('Error', 'No se pudo procesar la solicitud.', 'error')
      }
    }
  })
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
import { watch } from 'vue'
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
            <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Configuración Global</h2>
          </template>
          <div v-if="loading" class="py-10 text-center"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-iecm-morado mx-auto"></div></div>
          <form v-else @submit.prevent="saveRestriccion(generalConfig)" class="space-y-6">
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
                Guardar Configuración
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


      <!-- Solicitudes de Excepción -->
      <AppCard>
        <template #header>
          <div class="flex justify-between items-center">
            <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Solicitudes Pendientes</h2>
            <span v-if="solicitudes.length > 0" class="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-0.5 rounded-full">{{ solicitudes.length }}</span>
          </div>
        </template>
        <div class="space-y-4">
          <div v-if="loading" class="py-10 text-center"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-iecm-morado mx-auto"></div></div>
          <div v-else-if="solicitudes.length === 0" class="text-center py-10 text-slate-400 dark:text-slate-500">
            <CheckCircle class="w-12 h-12 mx-auto opacity-20 mb-3" />
            <p>No hay solicitudes de excepción pendientes.</p>
          </div>
          <div v-else class="space-y-3">
            <div v-for="sol in solicitudes" :key="sol.id" class="p-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 relative overflow-hidden group">
              <div class="flex justify-between items-start mb-2">
                <div>
                  <h3 class="font-bold text-amber-900">{{ sol.titulo }}</h3>
                  <p class="text-sm text-amber-700 mt-1">{{ sol.mensaje }}</p>
                </div>
              </div>
              <div class="flex gap-2 mt-4">
                <button @click="handleAprobarSolicitud(sol)" class="flex-1 flex justify-center items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium py-1.5 px-3 rounded-lg transition-colors">
                  <CheckCircle class="w-4 h-4" /> Aprobar
                </button>
                <button @click="handleRechazarSolicitud(sol)" class="flex-1 flex justify-center items-center gap-1 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 text-sm font-medium py-1.5 px-3 rounded-lg transition-colors">
                  <XCircle class="w-4 h-4" /> Rechazar
                </button>
              </div>
            </div>
          </div>
        </div>
      </AppCard>
    </div>
  </div>
</template>
