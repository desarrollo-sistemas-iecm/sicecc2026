<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { LayoutDashboard, CalendarDays, Edit3, ClipboardList, BarChart3, LogOut, Menu, X, ChevronLeft, ChevronRight, Settings } from '@lucide/vue'
import { useAuth } from '../composables/useAuth.js'
import { useGsapAnimations } from '../composables/useGsapAnimations.js'
import AppBadge from './ui/AppBadge.vue'
import api from '../services/api.js'
import Swal from 'sweetalert2'


const router = useRouter()
const route = useRoute()
const { authStore, logout } = useAuth()
const { animarSidebar } = useGsapAnimations()

const sidebarRef = ref(null)
const isMobileOpen = ref(false)
const isCollapsed = ref(false)
const canvasRef = ref(null)
let animFrameId = null

const userName = computed(() => authStore.user?.nombre ?? 'Usuario')
const userRoleName = computed(() => {
  if (authStore.isSuperAdmin) return 'Super Admin'
  if (authStore.isAdmin) return 'Administrador'
  return 'Distrito'
})

const menuItems = computed(() => {
  const allItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: [1, 2, 3], activeColor: 'text-blue-400', hoverColor: 'group-hover:text-blue-400' },
    { name: 'Programacion', path: '/programacion', icon: CalendarDays, roles: [1, 3], activeColor: 'text-emerald-400', hoverColor: 'group-hover:text-emerald-400' },
    { name: 'Captura', path: '/captura', icon: Edit3, roles: [1, 3], activeColor: 'text-amber-400', hoverColor: 'group-hover:text-amber-400' },
    { name: 'Encuesta', path: '/encuesta', icon: ClipboardList, roles: [1, 3], activeColor: 'text-rose-400', hoverColor: 'group-hover:text-rose-400' },
    { name: 'Reportes', path: '/reportes', icon: BarChart3, roles: [1, 2, 3], activeColor: 'text-teal-400', hoverColor: 'group-hover:text-teal-400' },
    { name: 'Administracion', path: '/administracion', icon: Settings, roles: [3], activeColor: 'text-purple-400', hoverColor: 'group-hover:text-purple-400' },
  ]
  const userPermiso = Number(authStore.user?.permiso || authStore.user?.idpermiso)
  return allItems.filter(item => item.roles.includes(userPermiso))
})

const handleLogout = () => {
  logout()
  router.push({ name: 'login' })
}

function initCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return () => {}
  const ctx = canvas.getContext('2d')
  const parent = canvas.parentElement

  const resize = () => {
    canvas.width = parent.clientWidth
    canvas.height = parent.clientHeight
  }
  
  const observer = new ResizeObserver(() => resize())
  observer.observe(parent)

  const PARTICLE_COUNT = 35
  const CONNECTION_DIST = 90
  const COLORS = {
    particle: 'rgba(107, 45, 139,',
    line: 'rgba(107, 45, 139,'
  }

  const particles = Array.from({ length: 40 }, () => ({
    x: Math.random() * 256,
    y: Math.random() * window.innerHeight,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    radius: Math.random() * 1.5 + 1
  }))

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    particles.forEach(p => {
      p.x += p.vx
      p.y += p.vy
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1
    })

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x
        const dy = particles[i].y - particles[j].y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < CONNECTION_DIST) {
          const alpha = (1 - dist / CONNECTION_DIST) * 0.25
          ctx.beginPath()
          ctx.strokeStyle = `${COLORS.line}${alpha})`
          ctx.lineWidth = 0.8
          ctx.moveTo(particles[i].x, particles[i].y)
          ctx.lineTo(particles[j].x, particles[j].y)
          ctx.stroke()
        }
      }
    }

    particles.forEach(p => {
      ctx.beginPath()
      ctx.fillStyle = `${COLORS.particle}0.6)`
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
      ctx.fill()
    })

    animFrameId = requestAnimationFrame(draw)
  }

  draw()
  return () => observer.disconnect()
}

const windowWidth = ref(window.innerWidth)

onMounted(() => {
  window.addEventListener('resize', () => {
    windowWidth.value = window.innerWidth
  })
  
  if (sidebarRef.value && window.innerWidth > 1024) {
    animarSidebar(sidebarRef.value)
  }
  const cleanup = initCanvas()
  
  if (authStore.isAuthenticated) {
    fetchSidebarConfigs()
  }

  onUnmounted(() => {
    cancelAnimationFrame(animFrameId)
    cleanup()
    window.removeEventListener('resize', () => {})
  })
})

const isManualHabilitado = ref(false)
const isUltimaActHabilitado = ref(false)
const ultimaActFecha = ref('')

const fetchSidebarConfigs = async () => {
  try {
    if (!authStore.isAuthenticated) return
    const manualRes = await api.get('/admin/manual-config')
    if (manualRes.data.success) {
      isManualHabilitado.value = manualRes.data.habilitado
    }
    const updateRes = await api.get('/admin/ultima-actualizacion-config')
    if (updateRes.data.success) {
      isUltimaActHabilitado.value = updateRes.data.habilitado
      ultimaActFecha.value = updateRes.data.fecha
    }
  } catch (error) {
    console.error('Error fetching sidebar configs:', error)
  }
}

const verManual = async () => {
  try {
    const response = await api.get('/uploads/manual/descargar', { responseType: 'blob' })
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    window.open(url, '_blank')
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'No disponible',
      text: 'El manual de usuario no está habilitado o no se encuentra en el servidor.',
      confirmButtonColor: '#6B2D8B'
    })
  }
}

const formatDateString = (dateString) => {
  if (!dateString) return ''
  const parts = dateString.split('-')
  if (parts.length === 3) {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    const year = parts[0]
    const month = months[parseInt(parts[1], 10) - 1]
    const day = parts[2]
    return `${day}/${month}/${year}`
  }
  return dateString
}

watch(() => authStore.isAuthenticated, (newVal) => {
  if (newVal) {
    fetchSidebarConfigs()
  }
})



const isDesktop = computed(() => windowWidth.value >= 1024)
const effectiveCollapsed = computed(() => isDesktop.value && isCollapsed.value)

// Cerrar sidebar en móvil al cambiar de ruta
router.afterEach(() => {
  isMobileOpen.value = false
})
</script>

<template>
  <!-- Hamburger móbil -->
  <button 
    v-if="!isMobileOpen"
    class="lg:hidden fixed top-4 left-4 z-50 p-2 bg-iecm-morado text-white rounded-md shadow-md"
    @click="isMobileOpen = true"
  >
    <Menu class="w-6 h-6" />
  </button>

  <!-- Overlay móbil -->
  <div 
    v-if="isMobileOpen" 
    class="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
    @click="isMobileOpen = false"
  ></div>

  <!-- Sidebar -->
  <aside 
    ref="sidebarRef"
    :class="[
      'fixed inset-y-0 left-0 z-40 bg-[#080412] text-white flex flex-col transition-all duration-300 overflow-hidden lg:sticky lg:top-0 lg:h-screen lg:shrink-0',
      isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      effectiveCollapsed ? 'w-20' : 'w-64'
    ]"
  >
    <!-- Fondo Canvas -->
    <canvas ref="canvasRef" class="absolute inset-0 w-full h-full z-0 pointer-events-none opacity-60"></canvas>
    
    <!-- Contenido encima del canvas -->
    <div class="relative z-10 flex flex-col h-full w-full">
      <!-- Logo area -->
      <div class="h-24 flex items-center justify-between px-4 relative">
        <img v-if="!effectiveCollapsed" src="../assets/logos/iecm-blanco.png" alt="IECM Logo Blanco" class="w-[85%] max-w-[200px] h-auto object-contain transition-all duration-300 drop-shadow-md mx-auto" />
        <div v-else class="w-10 h-10 rounded-full bg-iecm-morado-600 flex items-center justify-center font-bold text-white text-sm shadow-[0_0_10px_rgba(107,45,139,0.5)] mx-auto">
          IE
        </div>
        
        <!-- Botón cerrar (Móvil) -->
        <button 
          @click="isMobileOpen = false"
          class="lg:hidden p-1.5 text-iecm-dorado hover:bg-iecm-morado-800 rounded-lg transition-colors absolute right-4"
        >
          <X class="w-6 h-6" />
        </button>
        
        <!-- Toggle Collapse Button (Desktop) -->
        <button 
          @click="isCollapsed = !isCollapsed"
          class="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-iecm-morado border border-iecm-morado-400 text-white rounded-full items-center justify-center shadow-[0_0_10px_rgba(107,45,139,0.5)] hover:bg-white hover:text-iecm-morado hover:border-transparent transition-all z-50 cursor-pointer"
        >
          <component :is="isCollapsed ? 'ChevronRight' : 'ChevronLeft'" class="w-3 h-3" />
        </button>
      </div>

      <!-- Navegación -->
      <nav class="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 space-y-1.5 scrollbar-thin scrollbar-thumb-iecm-morado-600 scrollbar-track-transparent">
        <RouterLink 
          v-for="item in menuItems" 
          :key="item.path" 
          :to="item.path"
          class="group flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200"
          :class="[
            route.path === item.path ? 'bg-white/15 text-white shadow-sm' : 'text-white/90 hover:bg-white/8 hover:text-white',
            effectiveCollapsed ? 'justify-center' : 'gap-3'
          ]"
          :title="effectiveCollapsed ? item.name : ''"
        >
          <component 
            :is="item.icon" 
            class="w-5 h-5 opacity-90 shrink-0 transition-colors duration-200" 
            :class="route.path === item.path ? item.activeColor : `text-white/80 ${item.hoverColor}`"
          />
          <span v-if="!effectiveCollapsed" class="whitespace-nowrap">{{ item.name }}</span>
        </RouterLink>
      </nav>

      <!-- Botón Manual de Usuario -->
      <div v-if="isManualHabilitado || authStore.isSuperAdmin || authStore.isAdmin" class="px-4 py-2">
        <button
          type="button"
          @click="verManual"
          class="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-white hover:bg-iecm-morado-800/40 transition-all w-full cursor-pointer"
          :class="effectiveCollapsed ? 'justify-center' : 'gap-3'"
          title="Ver manual de usuario"
        >
          <ClipboardList class="w-5 h-5 opacity-90 shrink-0 text-red-500" />
          <span v-if="!effectiveCollapsed" class="whitespace-nowrap">Ver manual de usuario</span>
        </button>
      </div>


      <!-- Footer de usuario -->
      <div class="p-4 bg-[#0A0516]/80 backdrop-blur-md">
        <!-- Última actualización -->
        <div v-if="isUltimaActHabilitado && !effectiveCollapsed" class="text-center mb-3 px-2 py-1.5 bg-slate-900/60 border border-iecm-morado-900/40 rounded-lg">
          <p class="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Última actualización</p>
          <p class="text-xs text-emerald-400 font-bold mt-0.5">{{ formatDateString(ultimaActFecha) }}</p>
        </div>

        <div class="flex items-center gap-3 mb-4" :class="effectiveCollapsed ? 'justify-center px-0' : 'px-2'">

          <div class="h-10 w-10 shrink-0 rounded-full bg-iecm-morado-800 flex items-center justify-center border border-iecm-morado-500 font-bold text-white shadow-[0_0_10px_rgba(107,45,139,0.3)]">
            {{ userName.charAt(0).toUpperCase() }}
          </div>
          <div v-if="!effectiveCollapsed" class="min-w-0 flex-1 transition-opacity duration-300">
            <p class="truncate text-sm font-semibold text-white">{{ userName }}</p>
            <AppBadge :variant="authStore.isSuperAdmin ? 'danger' : (authStore.isAdmin ? 'warning' : 'info')" class="mt-0.5 scale-90 origin-left">
              {{ userRoleName }}
            </AppBadge>
          </div>
        </div>
        
        <button
          type="button"
          @click="handleLogout"
          class="flex items-center justify-center rounded-lg bg-iecm-morado-900/50 hover:bg-red-900/40 hover:text-red-400 border border-transparent hover:border-red-900/50 transition-all text-iecm-morado-200"
          :class="effectiveCollapsed ? 'w-full py-2.5' : 'w-full gap-2 px-4 py-2.5 text-sm font-medium'"
          :title="effectiveCollapsed ? 'Cerrar sesión' : ''"
        >
          <LogOut class="w-4 h-4 shrink-0" />
          <span v-if="!effectiveCollapsed" class="whitespace-nowrap">Cerrar sesión</span>
        </button>
      </div>
    </div>
  </aside>
</template>
