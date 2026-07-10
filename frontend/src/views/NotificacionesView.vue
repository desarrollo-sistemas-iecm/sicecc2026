<script setup>
import { ref, onMounted, computed } from 'vue'
import { Bell, CheckCircle2, AlertCircle, FileEdit, CalendarRange, UploadCloud, Trash2 } from '@lucide/vue'
import api from '../services/api'
import Swal from 'sweetalert2'
import { useAuth } from '../composables/useAuth'
import AppCard from '../components/ui/AppCard.vue'
import AppButton from '../components/ui/AppButton.vue'

const { authStore } = useAuth()
const isOperador = authStore.user?.permiso === 1 || authStore.user?.idpermiso === 1

const notificaciones = ref([])
const loading = ref(true)

const dismissedIds = ref(JSON.parse(localStorage.getItem('sisec_dismissed_notifs') || '[]'))

const filteredNotificaciones = computed(() => {
  return notificaciones.value.filter(n => !dismissedIds.value.includes(n.id))
})

const limpiarNotificacionesVisualizadas = () => {
  const readIds = notificaciones.value.filter(n => n.leida).map(n => n.id)
  if (readIds.length === 0) return

  Swal.fire({
    title: '¿Limpiar bandeja?',
    text: 'Las notificaciones leídas se ocultarán de esta bandeja de entrada.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#6B2D8B',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Sí, limpiar',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      dismissedIds.value = [...new Set([...dismissedIds.value, ...readIds])]
      localStorage.setItem('sisec_dismissed_notifs', JSON.stringify(dismissedIds.value))
      Swal.fire('Limpiado', 'Las notificaciones visualizadas han sido ocultadas.', 'success')
    }
  })
}


const fetchNotificaciones = async () => {
  try {
    const { data } = await api.get('/notificaciones')
    if (data.success) {
      notificaciones.value = data.data
    }
  } catch (error) {
    console.error('Error fetching notifications:', error)
  } finally {
    loading.value = false
  }
}

const markAsRead = async (id) => {
  const notif = notificaciones.value.find(n => n.id === id)
  if (notif && notif.leida) return

  try {
    await api.patch(`/notificaciones/${id}/leer`)
    if (notif) notif.leida = true
  } catch (error) {
    console.error('Error marking as read:', error)
  }
}

onMounted(() => {
  fetchNotificaciones()
})

const handleSolicitarFecha = async () => {
  const { value: formValues } = await Swal.fire({
    title: 'Solicitar Fecha',
    html:
      '<div class="text-left space-y-4">' +
      '<label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Módulo</label>' +
      '<select id="swal-modulo" class="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm focus:border-iecm-morado focus:ring-iecm-morado">' +
      '<option value="programacion">Programación</option>' +
      '<option value="captura">Captura</option>' +
      '</select>' +
      '<label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mt-3">Fecha Solicitada</label>' +
      '<input id="swal-fecha" type="date" class="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm focus:border-iecm-morado focus:ring-iecm-morado">' +
      '</div>',
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Enviar Solicitud',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#6B2D8B',
    preConfirm: () => {
      return {
        modulo: document.getElementById('swal-modulo').value,
        fecha: document.getElementById('swal-fecha').value
      }
    }
  })

  if (formValues) {
    if (!formValues.fecha) {
      Swal.fire('Error', 'La fecha es obligatoria', 'error')
      return
    }
    try {
      const { data } = await api.post('/admin/restricciones/solicitar', {
        fecha_solicitada: formValues.fecha,
        modulo: formValues.modulo
      })
      if (data.success) {
        Swal.fire('Enviada', 'Tu solicitud fue enviada a la Administración.', 'success')
      }
    } catch (e) {
      Swal.fire('Error', 'No se pudo enviar la solicitud', 'error')
    }
  }
}

const handleSolicitarArchivo = async () => {
  const { value: file } = await Swal.fire({
    title: 'Solicitar Cambio de Archivo',
    text: 'Sube el nuevo archivo. La administración revisará y reemplazará el documento.',
    input: 'file',
    inputAttributes: {
      'accept': '.pdf,.jpg,.jpeg,.png,.gif',
      'aria-label': 'Selecciona tu archivo'
    },
    showCancelButton: true,
    confirmButtonText: 'Subir y Solicitar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#6B2D8B'
  })

  if (file) {
    Swal.fire({
      title: 'Enviando...',
      text: 'Subiendo archivo temporal',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    })

    try {
      const formData = new FormData()
      formData.append('archivo', file)

      const { data } = await api.post('/admin/archivos/solicitar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (data.success) {
        Swal.fire('Solicitud Enviada', 'El archivo ha sido enviado a la Administración para su revisión.', 'success')
      }
    } catch (e) {
      Swal.fire('Error', 'Hubo un problema enviando el archivo.', 'error')
    }
  }
}

const getIcon = (tipo) => {
  switch (tipo) {
    case 'solicitud_fecha': return AlertCircle
    case 'fecha_habilitada': return CheckCircle2
    case 'archivo_actualizado': return FileEdit
    default: return Bell
  }
}

const getColor = (tipo) => {
  switch (tipo) {
    case 'solicitud_fecha': return 'text-amber-500 bg-amber-50 dark:bg-amber-950/20'
    case 'fecha_habilitada': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
    case 'archivo_actualizado': return 'text-blue-500 bg-blue-50 dark:bg-blue-950/20'
    default: return 'text-iecm-morado dark:text-iecm-morado-400 bg-iecm-morado-50 dark:bg-iecm-morado-950/10'
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(date)
}
</script>

<template>
  <div class="space-y-6 max-w-4xl mx-auto">
    <header class="flex justify-between items-end">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Tus Notificaciones</h1>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">Historial de avisos y alertas del sistema</p>
      </div>
      
      <div class="flex gap-2">
        <AppButton 
          v-if="filteredNotificaciones.some(n => n.leida)"
          @click="limpiarNotificacionesVisualizadas" 
          variant="outline" 
          size="sm" 
          class="border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
        >
          <template #icon><Trash2 class="w-4 h-4" /></template>
          Limpiar visualizadas
        </AppButton>

        <template v-if="isOperador">
          <AppButton @click="handleSolicitarFecha" variant="outline" size="sm" class="border-iecm-morado text-iecm-morado dark:text-iecm-morado-400 hover:bg-iecm-morado-50">
            <template #icon><CalendarRange class="w-4 h-4" /></template>
            Solicitar Fecha
          </AppButton>
          <AppButton @click="handleSolicitarArchivo" variant="outline" size="sm" class="border-iecm-morado text-iecm-morado dark:text-iecm-morado-400 hover:bg-iecm-morado-50">
            <template #icon><UploadCloud class="w-4 h-4" /></template>
            Solicitar Cambio de Archivo
          </AppButton>
        </template>
      </div>
    </header>


    <AppCard>
      <div v-if="loading" class="flex justify-center items-center py-20">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-iecm-morado"></div>
      </div>
      
      <div v-else-if="filteredNotificaciones.length === 0" class="flex flex-col justify-center items-center py-20 text-slate-400 dark:text-slate-500">
        <Bell class="w-16 h-16 mb-4 opacity-20" />
        <p class="text-lg font-medium">Bandeja vacía</p>
        <p class="text-sm mt-1">No tienes notificaciones por el momento.</p>
      </div>

      <div v-else class="divide-y divide-slate-100 dark:divide-white/5">
        <div 
          v-for="notif in filteredNotificaciones" 
          :key="notif.id"
          :class="['p-5 flex gap-4 transition-colors cursor-pointer', notif.leida ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50' : 'bg-blue-50/30 dark:bg-blue-950/15 hover:bg-blue-50/50 dark:hover:bg-blue-950/25']"
          @click="markAsRead(notif.id)"
        >

          <div :class="['w-12 h-12 rounded-full flex items-center justify-center shrink-0', getColor(notif.tipo)]">
            <component :is="getIcon(notif.tipo)" class="w-6 h-6" />
          </div>
          <div class="flex-1">
            <div class="flex justify-between items-start gap-4">
              <h3 :class="['font-semibold', notif.leida ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white']">
                {{ notif.titulo }}
              </h3>
              <span class="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">{{ formatDate(notif.fecha_creacion) }}</span>
            </div>
            <p class="text-sm text-slate-600 dark:text-slate-400 mt-1 whitespace-pre-wrap">{{ notif.mensaje }}</p>
          </div>
          <div class="w-3 flex shrink-0 justify-center items-center">
             <span v-if="!notif.leida" class="w-2.5 h-2.5 rounded-full bg-iecm-morado"></span>
          </div>
        </div>
      </div>
    </AppCard>
  </div>
</template>
