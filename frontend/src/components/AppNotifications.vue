<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Bell, CheckCircle2, AlertCircle, FileEdit, X, Trash2 } from '@lucide/vue'
import { useRouter } from 'vue-router'
import api from '../services/api'

const router = useRouter()
const notificaciones = ref([])
const showDropdown = ref(false)
const unreadCount = ref(0)
const dismissedIds = ref([])
let pollingInterval = null

const fetchNotificaciones = async () => {
  try {
    const { data } = await api.get('/notificaciones')
    if (data.success) {
      dismissedIds.value = JSON.parse(localStorage.getItem('sisec_dismissed_notifs') || '[]')
      const filtered = data.data.filter(n => !dismissedIds.value.includes(n.id))
      notificaciones.value = filtered
      unreadCount.value = filtered.filter(n => !n.leida).length
    }
  } catch (error) {
    console.error('Error fetching notifications:', error)
  }
}

const markAsRead = async (id) => {
  try {
    await api.patch(`/notificaciones/${id}/leer`)
    const index = notificaciones.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notificaciones.value[index].leida = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    }
  } catch (error) {
    console.error('Error marking as read:', error)
  }
}

const limpiarTodas = async () => {
  if (notificaciones.value.length === 0) return
  try {
    await api.patch('/notificaciones/leer-todas')
  } catch (error) {
    console.error('Error al marcar leídas:', error)
  }
  const allIds = notificaciones.value.map(n => n.id)
  dismissedIds.value = [...new Set([...dismissedIds.value, ...allIds])]
  localStorage.setItem('sisec_dismissed_notifs', JSON.stringify(dismissedIds.value))
  notificaciones.value = []
  unreadCount.value = 0
}

const dismissSingle = async (id) => {
  try {
    await api.patch(`/notificaciones/${id}/leer`)
  } catch (error) {
    console.error('Error al descartar:', error)
  }
  dismissedIds.value = [...new Set([...dismissedIds.value, id])]
  localStorage.setItem('sisec_dismissed_notifs', JSON.stringify(dismissedIds.value))
  notificaciones.value = notificaciones.value.filter(n => n.id !== id)
  unreadCount.value = notificaciones.value.filter(n => !n.leida).length
}

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
  if (showDropdown.value) {
    fetchNotificaciones()
  }
}

const closeDropdown = () => {
  showDropdown.value = false
}

const goToAll = () => {
  closeDropdown()
  router.push('/notificaciones')
}

onMounted(() => {
  fetchNotificaciones()
  pollingInterval = setInterval(fetchNotificaciones, 30000)
})

onUnmounted(() => {
  if (pollingInterval) clearInterval(pollingInterval)
})

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
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  }).format(date)
}
</script>

<template>
  <div class="relative">
    <button 
      @click="toggleDropdown"
      class="relative p-2 text-slate-500 dark:text-slate-400 hover:text-iecm-morado transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
    >
      <Bell class="w-5 h-5" />
      <span 
        v-if="unreadCount > 0" 
        class="absolute top-0 right-0 flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>

    <!-- Overlay para cerrar dropdown en móviles o clic fuera -->
    <div v-if="showDropdown" class="fixed inset-0 z-40" @click="closeDropdown"></div>

    <!-- Dropdown -->
    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <div 
        v-if="showDropdown" 
        class="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-iecm-dark-card rounded-xl shadow-2xl border border-iecm-gris-200 dark:border-iecm-dark-border z-50 overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div class="px-4 py-3 border-b border-iecm-gris-200 dark:border-iecm-dark-border flex justify-between items-center bg-iecm-gris-100 dark:bg-iecm-dark-header">
          <div class="flex items-center gap-2">
            <h3 class="font-semibold text-iecm-texto dark:text-iecm-dark-text">Notificaciones</h3>
            <span class="text-xs font-medium text-iecm-texto-muted dark:text-iecm-dark-text-muted bg-iecm-gris-200 dark:bg-iecm-dark-elevated px-2 py-0.5 rounded-full">{{ unreadCount }} nuevas</span>
          </div>
          <button 
            v-if="notificaciones.length > 0"
            @click.stop="limpiarTodas"
            type="button"
            class="inline-flex items-center gap-1.5 text-xs font-semibold text-iecm-texto-muted hover:text-red-600 dark:text-iecm-dark-text-muted dark:hover:text-red-400 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
            title="Limpiar todas las notificaciones"
          >
            <Trash2 class="w-3.5 h-3.5" />
            <span>Limpiar</span>
          </button>
        </div>

        <div class="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
          <div v-if="notificaciones.length === 0" class="text-center py-8 text-iecm-texto-muted dark:text-iecm-dark-text-muted">
            <Bell class="w-8 h-8 mx-auto opacity-20 mb-2" />
            <p class="text-sm">No tienes notificaciones</p>
          </div>
          
          <div 
            v-for="notif in notificaciones.slice(0, 10)" 
            :key="notif.id"
            :class="['flex gap-3 p-3 rounded-lg transition-colors group cursor-pointer relative items-start', notif.leida ? 'hover:bg-iecm-gris dark:hover:bg-iecm-dark-elevated/40' : 'bg-purple-50/50 dark:bg-iecm-morado-950/30 hover:bg-purple-50 dark:hover:bg-iecm-morado-950/50']"
            @click="markAsRead(notif.id)"
          >
            <div :class="['w-10 h-10 rounded-full flex items-center justify-center shrink-0', getColor(notif.tipo)]">
              <component :is="getIcon(notif.tipo)" class="w-5 h-5" />
            </div>
            <div class="flex-1 min-w-0 pr-1">
              <p :class="['text-sm truncate', notif.leida ? 'text-iecm-texto-suave dark:text-iecm-dark-text-muted font-medium' : 'text-iecm-texto dark:text-white font-semibold']">
                {{ notif.titulo }}
              </p>
              <p class="text-xs text-iecm-texto-muted dark:text-iecm-dark-text-muted mt-0.5 line-clamp-2 leading-snug">
                {{ notif.mensaje }}
              </p>
              <p class="text-[10px] text-iecm-texto-muted/80 dark:text-iecm-dark-text-muted/80 mt-1 font-medium">
                {{ formatDate(notif.fecha_creacion) }}
              </p>
            </div>
            <div class="flex items-center gap-1 shrink-0 self-center">
              <span v-if="!notif.leida" class="w-2 h-2 rounded-full bg-iecm-morado"></span>
              <button 
                @click.stop="dismissSingle(notif.id)"
                class="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-all cursor-pointer"
                title="Eliminar notificación"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div class="p-2 border-t border-iecm-gris-200 dark:border-iecm-dark-border bg-iecm-gris-100 dark:bg-iecm-dark-header">
          <button 
            @click="goToAll"
            class="w-full text-center py-2 text-sm text-iecm-morado dark:text-iecm-morado-300 hover:text-iecm-morado-800 dark:hover:text-white font-medium rounded-lg hover:bg-iecm-morado/10 transition-colors"
          >
            Ver todas las notificaciones
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
