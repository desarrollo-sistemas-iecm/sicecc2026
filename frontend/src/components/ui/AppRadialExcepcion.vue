<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useAuthStore } from '../../stores/authStore.js'
import api from '../../services/api.js'
import { gsap } from 'gsap'
import { Clock, CalendarDays, AlertCircle, Sparkles, ShieldCheck, CheckCircle } from '@lucide/vue'

const authStore = useAuthStore()

// Estado
const loading = ref(false)
const rawConfigs = ref([])
const showMesVigenteTooltip = ref(false)
const showExcepcionTooltip = ref(false)

// Refs de elementos para animación GSAP
const mesVigenteRef = ref(null)
const excepcionRef = ref(null)
const animatedMesProgress = ref(0)
const animatedExcProgress = ref(0)

let checkInterval = null

// ── 1. CÁLCULO DEL RADIAL PERMANENTE DEL MES VIGENTE ──────────────────────
const nombresMeses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const mesVigenteInfo = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const monthIdx = now.getMonth() // 0-11
  const todayDay = now.getDate()
  const totalDays = new Date(year, monthIdx + 1, 0).getDate() // ej: 31 días en Octubre
  
  // Días que faltan para que se acabe el mes vigente (incluyendo el actual)
  const daysRemaining = Math.max(0, totalDays - todayDay)
  
  // Porcentaje restante del mes (de 100% el día 1 hacia 0% el fin de mes)
  const percentRemaining = Math.min(100, Math.max(0, Math.round(((totalDays - todayDay) / totalDays) * 100)))

  // Color dinámico según avance del mes:
  // - Principio de mes (verde)
  // - A mediados de mes (amarillo)
  // - Por acabar (rojo)
  let colorName = 'green'
  let strokeClass = 'stroke-emerald-500'
  let textClass = 'text-emerald-400'
  let bgClass = 'bg-emerald-500/10'
  let borderClass = 'border-emerald-500/30'
  let pingClass = 'bg-emerald-500'

  if (todayDay >= totalDays - 5 || percentRemaining <= 20) {
    // Últimos 5-6 días del mes: ROJO
    colorName = 'red'
    strokeClass = 'stroke-red-500'
    textClass = 'text-red-400'
    bgClass = 'bg-red-500/10'
    borderClass = 'border-red-500/30'
    pingClass = 'bg-red-500'
  } else if (todayDay >= 12 || percentRemaining <= 60) {
    // A mediados de mes: AMARILLO
    colorName = 'yellow'
    strokeClass = 'stroke-amber-400'
    textClass = 'text-amber-400'
    bgClass = 'bg-amber-500/10'
    borderClass = 'border-amber-500/30'
    pingClass = 'bg-amber-400'
  }

  return {
    monthName: nombresMeses[monthIdx],
    year,
    todayDay,
    totalDays,
    daysRemaining,
    percentRemaining,
    colorName,
    strokeClass,
    textClass,
    bgClass,
    borderClass,
    pingClass
  }
})

// ── 2. CÁLCULO DE HABILITACIONES ESPECIALES / MESES PASADOS (AMARILLO) ────
const fetchHabilitaciones = async () => {
  if (!authStore.isAuthenticated) return
  try {
    const { data } = await api.get('/admin/restricciones')
    if (data.success && data.data) {
      rawConfigs.value = data.data
    }
  } catch (error) {
    console.error('Error al consultar restricciones:', error)
  }
}

// Resolver excepción activa para el usuario actual
const activeSpecialException = computed(() => {
  if (!rawConfigs.value.length) return null

  const userSede = Number(authStore.user?.idsede || 0)
  const isSuperOrAdmin = Number(authStore.user?.permiso || authStore.user?.idpermiso) >= 2
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  // Filtrar configuraciones habilitadas
  const habilitadas = rawConfigs.value.filter(c => c.habilitado && (c.modulo === 'captura' || c.modulo === 'programacion' || c.modulo === 'ambos'))

  // Buscar coincidencia para este operador (prioridad distrito, luego global)
  let matched = null
  if (!isSuperOrAdmin && userSede > 0) {
    matched = habilitadas.find(c => Number(c.idsede) === userSede)
  }
  if (!matched) {
    matched = habilitadas.find(c => Number(c.idsede) === 0)
  }

  // Para SuperAdmin o Admin: Si hay alguna de distrito, mostrar la más relevante
  if (isSuperOrAdmin && !matched) {
    matched = habilitadas.find(c => Number(c.idsede) > 0) || habilitadas[0]
  }

  if (!matched) return null

  // Validar si la ventana de prórroga aún está abierta
  // Si tiene fecha_limite, verificar contra hoy
  const fechaLimite = matched.fecha_limite || matched.fecha_fin
  if (fechaLimite && fechaLimite < todayStr) {
    return null // Ya expiró la ventana de captura
  }

  // Calcular días que le quedan a la prórroga
  let daysRemainingProrroga = 0
  let totalDiasProrroga = 5
  if (fechaLimite) {
    const [y, m, d] = fechaLimite.split('-').map(Number)
    const limitDate = new Date(y, m - 1, d)
    limitDate.setHours(23, 59, 59, 999)
    const diffMs = limitDate.getTime() - now.getTime()
    daysRemainingProrroga = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
    totalDiasProrroga = Math.max(daysRemainingProrroga, 5)
  }

  // Obtener nombre amigable del mes o rango autorizado
  let tituloMes = 'Mes Pasado'
  if (matched.fecha_inicio) {
    const [iy, im, id] = matched.fecha_inicio.split('-').map(Number)
    const [fy, fm, fd] = (matched.fecha_fin || matched.fecha_inicio).split('-').map(Number)
    const nombreMesInicio = nombresMeses[im - 1] || ''

    if (id === 1 && fd >= 28) {
      tituloMes = `${nombreMesInicio} ${iy}`
    } else {
      tituloMes = `${id} al ${fd} de ${nombreMesInicio}`
    }
  }

  const percentProgress = Math.min(100, Math.max(10, Math.round((daysRemainingProrroga / totalDiasProrroga) * 100)))

  return {
    ...matched,
    tituloMes,
    daysRemaining: daysRemainingProrroga,
    fechaLimite: fechaLimite,
    percentProgress,
    isGlobal: Number(matched.idsede) === 0,
    sedeNombre: Number(matched.idsede) === 0 ? 'Todos los Distritos' : `Distrito ${matched.idsede}`
  }
})

// Formatear módulo para mostrarlo amigable
const formatModulo = (mod) => {
  if (mod === 'programacion') return 'Programación'
  if (mod === 'captura') return 'Captura'
  if (mod === 'ambos') return 'Captura y Programación'
  return mod || 'Captura'
}

// ── 3. ANIMACIONES GSAP ───────────────────────────────────────────────────
watch(mesVigenteInfo, (val) => {
  if (val) {
    nextTick(() => {
      gsap.to(animatedMesProgress, {
        value: val.percentRemaining,
        duration: 1.2,
        ease: 'power2.out'
      })
    })
  }
}, { immediate: true })

watch(activeSpecialException, (val) => {
  if (val) {
    nextTick(() => {
      if (excepcionRef.value) {
        gsap.fromTo(excepcionRef.value,
          { scale: 0.8, opacity: 0, y: 15 },
          { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.5)' }
        )
      }
      gsap.to(animatedExcProgress, {
        value: val.percentProgress,
        duration: 1.2,
        ease: 'power2.out'
      })
    })
  }
}, { immediate: true })

onMounted(() => {
  fetchHabilitaciones()
  checkInterval = setInterval(fetchHabilitaciones, 45000)
  
  // Animación de entrada inicial del radial permanente
  nextTick(() => {
    if (mesVigenteRef.value) {
      gsap.fromTo(mesVigenteRef.value,
        { scale: 0.8, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
      )
    }
  })
})

onUnmounted(() => {
  if (checkInterval) clearInterval(checkInterval)
})
</script>

<template>
  <!-- Contenedor flotante en la esquina inferior derecha: APILADOS VERTICALMENTE -->
  <div v-if="authStore.isAuthenticated" class="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2.5 select-none pointer-events-auto">
    
    <!-- ═════════════════════════════════════════════════════════════════════ -->
    <!-- RADIAL 2: HABILITACIÓN ESPECIAL / MESES PASADOS (ARRIBA - AMARILLO)  -->
    <!-- ═════════════════════════════════════════════════════════════════════ -->
    <div v-if="activeSpecialException" class="relative flex flex-col items-end">
      <!-- Tooltip desplegable hacia la izquierda -->
      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="transform translate-x-2 opacity-0"
        enter-to-class="transform translate-x-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="transform translate-x-0 opacity-100"
        leave-to-class="transform translate-x-2 opacity-0"
      >
        <div 
          v-if="showExcepcionTooltip" 
          class="absolute right-full mr-3 bottom-0 w-80 bg-white/98 text-slate-800 dark:bg-slate-900/98 dark:text-white backdrop-blur-md border border-amber-500/40 shadow-2xl rounded-2xl p-4 text-left"
        >
          <div class="flex items-center gap-2 mb-2 pb-2 border-b border-amber-500/20">
            <Sparkles class="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <h4 class="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Habilitación Especial Activa
            </h4>
          </div>

          <!-- Leyenda solicitada por el usuario -->
          <div class="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-200 mb-3 text-xs font-medium leading-relaxed">
            El mes se habilitó para completar sus actividades.
          </div>

          <div class="space-y-2 text-xs">
            <div class="flex justify-between items-center">
              <span class="text-slate-500 dark:text-slate-400">Periodo habilitado:</span>
              <span class="font-bold text-slate-900 dark:text-white">{{ activeSpecialException.tituloMes }}</span>
            </div>
            <div class="flex justify-between items-center text-[11px]">
              <span class="text-slate-500 dark:text-slate-400">Fechas autorizadas:</span>
              <span class="text-slate-700 dark:text-slate-300 font-medium">Del {{ activeSpecialException.fecha_inicio }} al {{ activeSpecialException.fecha_fin }}</span>
            </div>
            <div class="flex justify-between items-center text-[11px]">
              <span class="text-slate-500 dark:text-slate-400">Módulo:</span>
              <span class="text-amber-600 dark:text-amber-400 font-bold">{{ formatModulo(activeSpecialException.modulo) }}</span>
            </div>
            <div class="flex justify-between items-center text-[11px]">
              <span class="text-slate-500 dark:text-slate-400">Destino:</span>
              <span class="text-slate-700 dark:text-slate-300">{{ activeSpecialException.sedeNombre }}</span>
            </div>
            <div class="flex justify-between items-center text-[11px]">
              <span class="text-slate-500 dark:text-slate-400">Ventana abierta hasta:</span>
              <span class="text-amber-600 dark:text-amber-300 font-bold">{{ activeSpecialException.fechaLimite }}</span>
            </div>
          </div>

          <!-- Barra de progreso miniatura -->
          <div class="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div class="h-full rounded-full bg-amber-500 dark:bg-amber-400 transition-all duration-500" :style="{ width: `${activeSpecialException.percentProgress}%` }"></div>
          </div>
          <div class="flex justify-between text-[10px] text-amber-600 dark:text-amber-400/90 mt-1.5 font-semibold">
            <span>Prórroga en curso</span>
            <span>{{ activeSpecialException.daysRemaining }} d restantes</span>
          </div>
        </div>
      </transition>

      <!-- Botón Flotante Radial Amarillo -->
      <div 
        ref="excepcionRef"
        class="w-[216px] bg-white/95 text-slate-800 border-amber-300 shadow-xl shadow-amber-900/10 dark:bg-[#1A152B]/95 dark:text-white dark:border-amber-400/40 dark:shadow-2xl dark:shadow-black/60 backdrop-blur-md border rounded-2xl p-2.5 flex items-center gap-2.5 cursor-pointer transition-all duration-300 hover:border-amber-400 hover:-translate-y-0.5"
        @mouseenter="showExcepcionTooltip = true"
        @mouseleave="showExcepcionTooltip = false"
        @click="showExcepcionTooltip = !showExcepcionTooltip"
      >
        <!-- SVG Radial Amarillo -->
        <div class="relative w-12 h-12 shrink-0 flex items-center justify-center">
          <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="16" fill="transparent" stroke="currentColor" stroke-width="3.5" class="text-amber-100 dark:text-[#2E2648]" />
            <circle 
              cx="18" 
              cy="18" 
              r="16" 
              fill="transparent" 
              stroke="currentColor" 
              stroke-width="3.5" 
              class="stroke-amber-400" 
              stroke-dasharray="100.5" 
              :stroke-dashoffset="100.5 - (100.5 * animatedExcProgress) / 100" 
              stroke-linecap="round" 
            />
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center leading-none">
            <span class="text-sm font-black text-amber-600 dark:text-amber-400 tracking-tighter">{{ activeSpecialException.daysRemaining }}</span>
            <span class="text-[8px] font-bold text-amber-700/80 dark:text-amber-300/80 uppercase">días</span>
          </div>
        </div>

        <div class="flex flex-col pr-1 text-left min-w-0">
          <div class="flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-ping"></span>
            <span class="text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Habilitado
            </span>
          </div>
          <span class="text-xs font-black text-slate-900 dark:text-white mt-0.5 leading-tight truncate">
            {{ activeSpecialException.tituloMes }}
          </span>
          <span class="text-[9px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
            {{ activeSpecialException.daysRemaining }} d restantes
          </span>
        </div>
      </div>
    </div>

    <!-- ═════════════════════════════════════════════════════════════════════ -->
    <!-- RADIAL 1: PERMANENTE DEL MES VIGENTE (ABAJO - VERDE/AMARILLO/ROJO)   -->
    <!-- ═════════════════════════════════════════════════════════════════════ -->
    <div class="relative flex flex-col items-end">
      <!-- Tooltip desplegable hacia la izquierda -->
      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="transform translate-x-2 opacity-0"
        enter-to-class="transform translate-x-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="transform translate-x-0 opacity-100"
        leave-to-class="transform translate-x-2 opacity-0"
      >
        <div 
          v-if="showMesVigenteTooltip" 
          class="absolute right-full mr-3 bottom-0 w-80 bg-white/98 text-slate-800 dark:bg-[#161126]/98 dark:text-white backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-2xl rounded-2xl p-4 text-left"
        >
          <div class="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200 dark:border-white/10">
            <Clock class="w-4 h-4 text-iecm-morado dark:text-iecm-morado-400" />
            <h4 class="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Cierre del Mes Vigente
            </h4>
          </div>

          <div class="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 dark:bg-purple-500/10 dark:border-purple-500/20 dark:text-purple-200 mb-3 text-xs leading-relaxed">
            Periodo regular abierto para <strong>{{ mesVigenteInfo.monthName }} {{ mesVigenteInfo.year }}</strong>. Faltan <strong>{{ mesVigenteInfo.daysRemaining }} días</strong> para el corte mensual.
          </div>

          <div class="space-y-1.5 text-xs">
            <div class="flex justify-between items-center">
              <span class="text-slate-500 dark:text-slate-400">Día en curso:</span>
              <span class="font-bold text-slate-900 dark:text-white">{{ mesVigenteInfo.todayDay }} de {{ mesVigenteInfo.totalDays }}</span>
            </div>
            <div class="flex justify-between items-center text-[11px]">
              <span class="text-slate-500 dark:text-slate-400">Estado del periodo:</span>
              <span class="font-bold" :class="mesVigenteInfo.textClass">
                {{ mesVigenteInfo.colorName === 'green' ? '🟢 Tiempo suficiente' : mesVigenteInfo.colorName === 'yellow' ? '🟡 Mediados de mes' : '🔴 Cierre próximo' }}
              </span>
            </div>
            <div class="flex justify-between items-center text-[11px]">
              <span class="text-slate-500 dark:text-slate-400">Último día de captura:</span>
              <span class="text-slate-700 dark:text-slate-300 font-semibold">{{ mesVigenteInfo.totalDays }} de {{ mesVigenteInfo.monthName }}</span>
            </div>
          </div>

          <!-- Barra de progreso mensual -->
          <div class="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              class="h-full rounded-full transition-all duration-500" 
              :class="mesVigenteInfo.colorName === 'red' ? 'bg-red-500' : mesVigenteInfo.colorName === 'yellow' ? 'bg-amber-400' : 'bg-emerald-500'" 
              :style="{ width: `${mesVigenteInfo.percentRemaining}%` }"
            ></div>
          </div>
          <div class="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 font-semibold">
            <span>Mes en curso</span>
            <span>{{ mesVigenteInfo.daysRemaining }} d para el cierre</span>
          </div>
        </div>
      </transition>

      <!-- Botón Flotante Radial Mes Vigente -->
      <div 
        ref="mesVigenteRef" 
        class="w-[216px] bg-white/95 text-slate-800 shadow-xl shadow-purple-950/5 border-slate-200 dark:bg-[#1A152B]/95 dark:text-white dark:border-[#2E2648] dark:shadow-2xl dark:shadow-black/60 backdrop-blur-md border rounded-2xl p-2.5 flex items-center gap-2.5 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 group"
        :class="mesVigenteInfo.borderClass"
        @mouseenter="showMesVigenteTooltip = true"
        @mouseleave="showMesVigenteTooltip = false"
        @click="showMesVigenteTooltip = !showMesVigenteTooltip"
      >
        <!-- SVG Radial Dinámico -->
        <div class="relative w-12 h-12 shrink-0 flex items-center justify-center">
          <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="16" fill="transparent" stroke="currentColor" stroke-width="3.5" class="text-slate-200 dark:text-[#2E2648]" />
            <circle 
              cx="18" 
              cy="18" 
              r="16" 
              fill="transparent" 
              stroke="currentColor" 
              stroke-width="3.5" 
              :class="mesVigenteInfo.strokeClass" 
              stroke-dasharray="100.5" 
              :stroke-dashoffset="100.5 - (100.5 * animatedMesProgress) / 100" 
              stroke-linecap="round" 
            />
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center leading-none">
            <span class="text-sm font-black text-slate-900 dark:text-white tracking-tighter">{{ mesVigenteInfo.daysRemaining }}</span>
            <span class="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase">días</span>
          </div>
        </div>

        <div class="flex flex-col pr-1 text-left min-w-0">
          <div class="flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full animate-ping" :class="mesVigenteInfo.pingClass"></span>
            <span class="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Mes Vigente
            </span>
          </div>
          <span class="text-xs font-bold text-slate-900 dark:text-slate-200 mt-0.5 leading-tight truncate">
            {{ mesVigenteInfo.monthName }}
          </span>
          <span class="text-[9px] font-semibold mt-0.5" :class="mesVigenteInfo.textClass">
            {{ mesVigenteInfo.daysRemaining }} días restantes
          </span>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.stroke-emerald-500 {
  stroke: #10b981;
}
.stroke-amber-400 {
  stroke: #fbbf24;
}
.stroke-red-500 {
  stroke: #ef4444;
}
.text-emerald-400 {
  color: #047857;
}
.dark .text-emerald-400 {
  color: #34d399;
}
.text-amber-400 {
  color: #b45309;
}
.dark .text-amber-400 {
  color: #fbbf24;
}
.text-red-400 {
  color: #b91c1c;
}
.dark .text-red-400 {
  color: #f87171;
}
</style>
