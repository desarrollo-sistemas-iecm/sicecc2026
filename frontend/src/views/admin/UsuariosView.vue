<script setup>
import { ref, onMounted, onUnmounted, computed, reactive, nextTick, watch } from 'vue'
import { Users, UserPlus, Edit, Trash2, Shield, Search, CalendarRange, Zap } from '@lucide/vue'
import api from '../../services/api'
import Swal from 'sweetalert2'
import { useAuthStore } from '../../stores/authStore.js'
import { gsap } from 'gsap'
import AppCard from '../../components/ui/AppCard.vue'
import AppInput from '../../components/ui/AppInput.vue'
import AppSelect from '../../components/ui/AppSelect.vue'
import AppButton from '../../components/ui/AppButton.vue'
import AppBadge from '../../components/ui/AppBadge.vue'
import AppTable from '../../components/ui/AppTable.vue'

const authStore = useAuthStore()
const usuarios = ref([])
const loading = ref(true)
const search = ref('')
const saving = ref(false)
const showForm = ref(false)
const isEditing = ref(false)

const form = reactive({
  idusuario: null,
  usuario: '',
  password: '',
  idpermiso: 1,
  idsede: 1
})

const distritos = Array.from({ length: 33 }, (_, i) => i + 1)
const permisos = [
  { id: 1, nombre: 'Operador' },
  { id: 2, nombre: 'Administrador' },
  { id: 3, nombre: 'Super Administrador' }
]

// --- KPIs de Conexión y Animación GSAP ---
const circleConectados = ref(null)
const circleDesconectados = ref(null)

const totalConectados = computed(() => usuarios.value.filter(u => u.conectado).length)
const totalDesconectados = computed(() => usuarios.value.length - totalConectados.value)

const pctConectados = computed(() => {
  if (usuarios.value.length === 0) return 0
  return (totalConectados.value / usuarios.value.length) * 100
})

const pctDesconectados = computed(() => {
  if (usuarios.value.length === 0) return 0
  return (totalDesconectados.value / usuarios.value.length) * 100
})

const animarConexiones = () => {
  nextTick(() => {
    const circ = 2 * Math.PI * 54
    if (circleConectados.value) {
      const offset = circ - (pctConectados.value / 100) * circ
      gsap.fromTo(circleConectados.value,
        { strokeDashoffset: circ },
        { strokeDashoffset: offset, duration: 1.2, ease: 'power3.out' }
      )
    }
    if (circleDesconectados.value) {
      const offset = circ - (pctDesconectados.value / 100) * circ
      gsap.fromTo(circleDesconectados.value,
        { strokeDashoffset: circ },
        { strokeDashoffset: offset, duration: 1.2, ease: 'power3.out' }
      )
    }
  })
}

watch([pctConectados, pctDesconectados], () => {
  animarConexiones()
})

const loadUsuarios = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/admin/usuarios')
    if (data.success) {
      usuarios.value = data.data
      animarConexiones()
    }
  } catch (error) {
    console.error('Error fetching usuarios:', error)
  } finally {
    loading.value = false
  }
}

const filteredUsuarios = computed(() => {
  if (!search.value) return usuarios.value
  const term = search.value.toLowerCase()
  return usuarios.value.filter(u => u.usuario.toLowerCase().includes(term))
})

const getPermisoName = (id) => permisos.find(p => p.id === id)?.nombre || 'Desconocido'
const getPermisoColor = (id) => {
  if (id === 3) return 'danger'
  if (id === 2) return 'warning'
  return 'info'
}

const resetForm = () => {
  form.idusuario = null
  form.usuario = ''
  form.password = ''
  form.idpermiso = 1
  form.idsede = 1
  isEditing.value = false
  showForm.value = false
}

const editUser = (user) => {
  form.idusuario = user.idusuario
  form.usuario = user.usuario
  form.password = '' // Don't fill password
  form.idpermiso = user.idpermiso
  form.idsede = user.idsede
  isEditing.value = true
  showForm.value = true
}

const deleteUser = async (id) => {
  const result = await Swal.fire({
    title: '¿Eliminar usuario?',
    text: "Esta acción no se puede deshacer.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  })

  if (result.isConfirmed) {
    try {
      await api.delete(`/admin/usuarios/${id}`)
      await loadUsuarios()
      Swal.fire('Eliminado', 'El usuario ha sido eliminado.', 'success')
    } catch (error) {
      Swal.fire('Error', 'No se pudo eliminar el usuario.', 'error')
    }
  }
}

const forceDisconnect = async (user) => {
  const result = await Swal.fire({
    title: `¿Desconectar a ${user.usuario}?`,
    text: "Se cerrará su sesión de inmediato en todos sus dispositivos en tiempo real.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Sí, desconectar',
    cancelButtonText: 'Cancelar'
  })

  if (result.isConfirmed) {
    try {
      await api.put(`/admin/usuarios/${user.idusuario}/desconectar`)
      Swal.fire('Desconectado', 'El usuario ha sido desconectado.', 'success')
      await loadUsuarios()
    } catch (error) {
      Swal.fire('Error', 'No se pudo desconectar al usuario.', 'error')
    }
  }
}

const habilitarFechas = async (user) => {
  const { value: formValues } = await Swal.fire({
    title: `Habilitar Fechas para Distrito ${user.idsede}`,
    html:
      '<div class="text-left space-y-4">' +
      '<label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Módulo</label>' +
      '<select id="swal-modulo-admin" class="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm">' +
      '<option value="programacion">Programación</option>' +
      '<option value="captura">Captura</option>' +
      '</select>' +
      '<div class="grid grid-cols-2 gap-4 mt-3">' +
      '<div><label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Inicio</label><input id="swal-inicio" type="date" class="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm"></div>' +
      '<div><label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Fin</label><input id="swal-fin" type="date" class="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm"></div>' +
      '</div>' +
      '</div>',
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Habilitar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#10b981',
    preConfirm: () => {
      return {
        modulo: document.getElementById('swal-modulo-admin').value,
        fecha_inicio: document.getElementById('swal-inicio').value,
        fecha_fin: document.getElementById('swal-fin').value,
        habilitado: true,
        idsede: user.idsede
      }
    }
  })

  if (formValues) {
    if (!formValues.fecha_inicio || !formValues.fecha_fin) {
      Swal.fire('Error', 'Ambas fechas son obligatorias', 'error')
      return
    }
    try {
      const { data } = await api.post('/admin/restricciones', formValues)
      if (data.success) {
        Swal.fire('Habilitado', 'Se han habilitado las fechas para este distrito.', 'success')
      }
    } catch (e) {
      Swal.fire('Error', 'No se pudo aplicar la configuración', 'error')
    }
  }
}

const onSubmit = async () => {
  saving.value = true
  try {
    if (form.idpermiso === 3) {
      form.idsede = 0 // Super Admins don't belong to a district generally, or we set to 0
    }
    
    if (isEditing.value) {
      const payload = { idsede: form.idsede, idpermiso: form.idpermiso }
      if (form.password) payload.password = form.password
      
      await api.put(`/admin/usuarios/${form.idusuario}`, payload)
      Swal.fire('Actualizado', 'Usuario actualizado correctamente', 'success')
    } else {
      if (!form.password || !form.usuario) {
        Swal.fire('Error', 'Usuario y contraseña son requeridos', 'error')
        return
      }
      await api.post('/admin/usuarios', form)
      Swal.fire('Creado', 'Usuario creado correctamente', 'success')
    }
    resetForm()
    await loadUsuarios()
  } catch (error) {
    if (error.response?.data?.message) {
      Swal.fire('Error', error.response.data.message, 'error')
    } else {
      Swal.fire('Error', 'No se pudo guardar el usuario.', 'error')
    }
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadUsuarios()

  // Escuchar actualizaciones de presencia del WebSocket
  authStore.socket?.on('usuarios:estado', (conectadosList) => {
    usuarios.value = usuarios.value.map(u => ({
      ...u,
      conectado: conectadosList.includes(Number(u.idusuario))
    }))
    animarConexiones()
  })
})

onUnmounted(() => {
  authStore.socket?.off('usuarios:estado')
})
</script>

<template>
  <div class="space-y-6">
    <header class="flex items-center justify-between mb-8">
      <div class="flex items-center gap-4">
        <div class="p-3 bg-iecm-morado-100 dark:bg-iecm-morado-950/30 text-iecm-morado-700 dark:text-iecm-morado-300 rounded-xl">
          <Users class="w-6 h-6" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Gestión de Usuarios</h1>
          <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">Administra los accesos y permisos del sistema.</p>
        </div>
      </div>
      <AppButton @click="showForm = true" variant="primary" v-if="!showForm">
        <template #icon><UserPlus class="w-4 h-4" /></template>
        Nuevo Usuario
      </AppButton>
    </header>

    <AppCard v-if="showForm" class="mb-6 border-iecm-morado-200 dark:border-iecm-morado-500/30 shadow-md">
      <template #header>
        <div class="flex items-center gap-2">
          <Shield class="w-5 h-5 text-iecm-morado dark:text-iecm-morado-400" />
          <h2 class="text-lg font-semibold text-slate-900 dark:text-white">{{ isEditing ? 'Editar Usuario' : 'Nuevo Usuario' }}</h2>
        </div>
      </template>

      <form @submit.prevent="onSubmit" class="space-y-6">
        <div class="grid md:grid-cols-2 gap-6">
          <AppInput v-model="form.usuario" label="Nombre de Usuario (Login)" :disabled="isEditing" required />
          <AppInput v-model="form.password" type="password" :label="isEditing ? 'Nueva Contraseña (dejar en blanco si no cambia)' : 'Contraseña'" :required="!isEditing" />
          
          <AppSelect v-model.number="form.idpermiso" label="Nivel de Permiso" required>
            <option v-for="p in permisos" :key="p.id" :value="p.id">{{ p.nombre }}</option>
          </AppSelect>
          
          <AppSelect v-model.number="form.idsede" label="Distrito Territorial (Sede)" required :disabled="form.idpermiso === 3">
            <option value="0" v-if="form.idpermiso === 3">Sede Central (0)</option>
            <option v-for="d in distritos" :key="d" :value="d">Distrito {{ d }}</option>
          </AppSelect>
        </div>
        <div class="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
          <AppButton type="button" variant="outline" @click="resetForm">Cancelar</AppButton>
          <AppButton type="submit" variant="primary" :loading="saving">Guardar Usuario</AppButton>
        </div>
      </form>
    </AppCard>

    <!-- Resumen de Conexiones (Radiales) -->
    <AppCard class="mb-6">
      <template #header>
        <h3 class="text-slate-900 dark:text-white text-sm font-semibold tracking-wide">
          Resumen de Conexiones
        </h3>
      </template>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-10 sm:gap-16 py-4">
        
        <!-- Radial Conectados -->
        <div class="flex flex-col items-center">
          <div class="relative flex items-center justify-center w-32 h-32">
            <!-- Background track -->
            <svg class="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" class="stroke-emerald-100 dark:stroke-emerald-950/20" stroke-width="8" />
            </svg>
            <!-- Animated progress -->
            <svg class="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              <defs>
                <linearGradient id="gradConectados" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#34d399" />
                  <stop offset="100%" stop-color="#10b981" />
                </linearGradient>
              </defs>
              <circle
                ref="circleConectados"
                cx="60" cy="60" r="54"
                fill="none"
                stroke="url(#gradConectados)"
                stroke-width="8"
                stroke-linecap="round"
                stroke-dasharray="339.292"
                stroke-dashoffset="339.292"
                style="filter: drop-shadow(0 0 8px rgba(52,211,153,0.35));"
              />
            </svg>
            <!-- Center Text -->
            <div class="absolute flex flex-col items-center justify-center">
              <span class="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tighter">
                {{ Math.round(pctConectados) }}%
              </span>
              <span class="text-[9px] text-slate-400 dark:text-white/40 font-semibold uppercase tracking-wider mt-0.5">
                Conectados
              </span>
            </div>
          </div>
          <!-- Label -->
          <div class="mt-3 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)] animate-pulse"></span>
            <span class="text-sm font-bold text-slate-700 dark:text-white/80">{{ totalConectados }}</span>
            <span class="text-xs text-slate-400 dark:text-white/40">En línea</span>
          </div>
        </div>

        <!-- Divider -->
        <div class="hidden sm:block w-px h-24 bg-slate-200 dark:bg-white/10"></div>

        <!-- Radial Desconectados -->
        <div class="flex flex-col items-center">
          <div class="relative flex items-center justify-center w-32 h-32">
            <!-- Background track -->
            <svg class="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" class="stroke-slate-200 dark:stroke-white/5" stroke-width="8" />
            </svg>
            <!-- Animated progress -->
            <svg class="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              <defs>
                <linearGradient id="gradDesconectados" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#94a3b8" />
                  <stop offset="100%" stop-color="#475569" />
                </linearGradient>
              </defs>
              <circle
                ref="circleDesconectados"
                cx="60" cy="60" r="54"
                fill="none"
                stroke="url(#gradDesconectados)"
                stroke-width="8"
                stroke-linecap="round"
                stroke-dasharray="339.292"
                stroke-dashoffset="339.292"
                style="filter: drop-shadow(0 0 8px rgba(148,163,184,0.35));"
              />
            </svg>
            <!-- Center Text -->
            <div class="absolute flex flex-col items-center justify-center">
              <span class="text-xl font-extrabold text-slate-650 dark:text-slate-400 tracking-tighter">
                {{ Math.round(pctDesconectados) }}%
              </span>
              <span class="text-[9px] text-slate-400 dark:text-white/40 font-semibold uppercase tracking-wider mt-0.5">
                Desconectados
              </span>
            </div>
          </div>
          <!-- Label -->
          <div class="mt-3 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-slate-400 shadow-[0_0_6px_rgba(148,163,184,0.5)]"></span>
            <span class="text-sm font-bold text-slate-700 dark:text-white/80">{{ totalDesconectados }}</span>
            <span class="text-xs text-slate-400 dark:text-white/40">Desconectados</span>
          </div>
        </div>
      </div>
      <div class="text-center text-xs text-slate-400 dark:text-slate-500 pb-3">
        Total Usuarios: {{ usuarios.length }} | Conectados: {{ totalConectados }} | Desconectados: {{ totalDesconectados }}
      </div>
    </AppCard>

    <AppCard>
      <template #header>
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Directorio de Usuarios</h2>
          <div class="w-full sm:w-64">
            <AppInput v-model="search" placeholder="Buscar usuario...">
              <template #icon><Search class="w-4 h-4" /></template>
            </AppInput>
          </div>
        </div>
      </template>

      <AppTable :loading="loading" :is-empty="!loading && filteredUsuarios.length === 0" empty-message="No se encontraron usuarios.">
        <template #head>
          <th class="px-6 py-3 text-left">Usuario</th>
          <th class="px-6 py-3 text-left">Sede / Distrito</th>
          <th class="px-6 py-3 text-left">Nivel de Permiso</th>
          <th class="px-6 py-3 text-left">Estado</th>
          <th class="px-6 py-3 text-left">Fecha Registro</th>
          <th class="px-6 py-3 text-right">Acciones</th>
        </template>
        <template #body>
          <tr v-for="row in filteredUsuarios" :key="row.idusuario" class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <td class="px-6 py-4 font-medium text-slate-900 dark:text-white">{{ row.usuario }}</td>
            <td class="px-6 py-4 text-slate-600 dark:text-slate-400">
              <span v-if="row.idsede === 0">Sede Central</span>
              <span v-else>Distrito {{ row.idsede }}</span>
            </td>
            <td class="px-6 py-4">
              <AppBadge :variant="getPermisoColor(row.idpermiso)">{{ getPermisoName(row.idpermiso) }}</AppBadge>
            </td>
            <td class="px-6 py-4">
              <AppBadge :variant="row.conectado ? 'success' : 'gray'">
                <span class="inline-block w-1.5 h-1.5 rounded-full mr-1.5" :class="row.conectado ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'"></span>
                {{ row.conectado ? 'Conectado' : 'Desconectado' }}
              </AppBadge>
            </td>
            <td class="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm">{{ row.fecha_registro }}</td>
            <td class="px-6 py-4 text-right">
              <div class="flex justify-end gap-2">
                <template v-if="row.idpermiso === 1">
                  <button @click="habilitarFechas(row)" class="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors" title="Habilitar Fechas">
                    <CalendarRange class="w-4 h-4" />
                  </button>
                </template>
                <button v-if="row.conectado && row.idusuario !== authStore.user?.idUsuario" @click="forceDisconnect(row)" class="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition-colors" title="Desconectar Forzosamente">
                  <Zap class="w-4 h-4" />
                </button>
                <button @click="editUser(row)" class="p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Editar">
                  <Edit class="w-4 h-4" />
                </button>
                <button @click="deleteUser(row.idusuario)" class="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors" title="Eliminar">
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        </template>
      </AppTable>
    </AppCard>
  </div>
</template>
