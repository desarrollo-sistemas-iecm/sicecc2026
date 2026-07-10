<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useAuthStore } from '../../stores/authStore.js'
import { useUrgencyColor } from '../../composables/useUrgencyColor.js'
import api from '../../services/api.js'
import { gsap } from 'gsap'
import { AlertCircle, Clock, CalendarDays } from '@lucide/vue'

const authStore = useAuthStore()
const isOperador = computed(() => authStore.isOperador)

const exceptions = ref([])
const activeException = ref(null)
const showTooltip = ref(false)
const indicatorRef = ref(null)
const animatedProgress = ref(0)
const loading = ref(false)

// Polling interval to check restrictions
let checkInterval = null

const fetchHabilitaciones = async () => {
  if (!isOperador.value) {
    exceptions.value = []
    activeException.value = null
    return
  }

  loading.value = true
  try {
    const { data } = await api.get('/admin/restricciones')
    if (data.success && data.data) {
      const now = new Date()
      now.setHours(0, 0, 0, 0)

      const activeList = []
      const modulos = ['programacion', 'captura']
      
      for (const mod of modulos) {
        const configsMod = data.data.filter(d => d.modulo === mod)
        
        // Encontrar global y específico del operador
        const global = configsMod.find(c => Number(c.idsede) === 0)
        const specific = configsMod.find(c => Number(c.idsede) === Number(authStore.user?.idsede))
        
        let resolved = null
        if (specific && global) {
          const globalTime = new Date(global.fecha_actualizado || 0).getTime()
          const specificTime = new Date(specific.fecha_actualizado || 0).getTime()
          // Si el específico se configuró después de la global, toma prioridad; si no, la global manda
          resolved = specificTime > globalTime ? specific : global
        } else {
          resolved = specific || global
        }
        
        if (resolved && resolved.habilitado) {
          const end = new Date(resolved.fecha_fin)
          end.setHours(0, 0, 0, 0)
          
          if (end.getTime() >= now.getTime()) {
            const { calculations } = useUrgencyColor(resolved.fecha_inicio, resolved.fecha_fin)
            activeList.push({
              ...resolved,
              ...calculations.value
            })
          }
        }
      }

      exceptions.value = activeList

      if (activeList.length > 0) {
        // Ordenar por menor porcentaje restante para mostrar el más urgente
        const sorted = [...activeList].sort((a, b) => a.percentage - b.percentage)
        activeException.value = sorted[0]
      } else {
        activeException.value = null
      }
    }
  } catch (error) {
    console.error('Error al consultar habilitaciones:', error)
  } finally {
    loading.value = false
  }
}

// Formatear módulo para mostrarlo amigable
const formatModulo = (mod) => {
  if (mod === 'programacion') return 'Programación'
  if (mod === 'captura') return 'Captura'
  return mod
}

// Observar cuando aparece o cambia la excepción activa para disparar las animaciones GSAP
watch(activeException, (newVal, oldVal) => {
  if (newVal && !oldVal) {
    // Animación de entrada
    nextTick(() => {
      if (indicatorRef.value) {
        gsap.fromTo(indicatorRef.value, 
          { scale: 0, opacity: 0, y: 30 },
          { scale: 1, opacity: 1, y: 0, duration: 0.6, ease: 'back.out(1.6)' }
        )
      }
      // Relleno animado inicial del radial SVG
      animatedProgress.value = 0
      gsap.to(animatedProgress, {
        value: newVal.percentage,
        duration: 1.5,
        ease: 'power2.out'
      })
    })
  } else if (newVal && oldVal && newVal.percentage !== oldVal.percentage) {
    // Animación de cambio de porcentaje
    gsap.to(animatedProgress, {
      value: newVal.percentage,
      duration: 1.2,
      ease: 'power2.out'
    })
  }
}, { immediate: true })

// Escuchar cambios de sesión y cargar
watch(() => authStore.token, () => {
  fetchHabilitaciones()
})

onMounted(() => {
  fetchHabilitaciones()
  // Validar excepciones cada 60 segundos
  checkInterval = setInterval(fetchHabilitaciones, 60000)
})

onUnmounted(() => {
  if (checkInterval) clearInterval(checkInterval)
})
</script>

<template>
  <div v-if="activeException" class="fixed bottom-6 right-6 z-50 flex flex-col items-end">
    <!-- Tooltip con listado completo de excepciones -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform translate-y-2 opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform translate-y-2 opacity-0"
    >
      <div v-if="showTooltip" class="mb-3 w-80 bg-slate-900 border border-white/10 shadow-2xl rounded-2xl p-4 text-left select-none text-white">
        <div class="flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
          <Clock class="w-4 h-4 text-iecm-morado-300" />
          <h4 class="text-xs font-black uppercase tracking-wider text-slate-400">
            {{ exceptions.some(e => Number(e.idsede) !== 0) ? 'Excepciones de Fecha' : 'Periodo Habilitado' }}
          </h4>
        </div>
        
        <div class="space-y-3">
          <div v-for="exc in exceptions" :key="exc.modulo" class="p-2.5 rounded-xl border border-white/5 bg-slate-800/40 hover:bg-slate-800/60 transition-colors">
            <div class="flex justify-between items-center mb-1">
              <span class="text-xs font-bold text-slate-200">
                {{ formatModulo(exc.modulo) }}
                <span v-if="Number(exc.idsede) === 0" class="text-[9px] font-normal text-slate-400 block">(Periodo General)</span>
                <span v-else class="text-[9px] font-semibold text-amber-400 block">(Excepción Especial)</span>
              </span>
              <span class="text-[10px] font-black px-2 py-0.5 rounded-full" :class="[exc.classes.bg, exc.classes.text]">
                {{ exc.daysRemaining }} d restante{{ exc.daysRemaining !== 1 ? 's' : '' }}
              </span>
            </div>
            
            <p class="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
              <CalendarDays class="w-3 h-3 text-slate-500" />
              Del {{ exc.fecha_inicio }} al {{ exc.fecha_fin }}
            </p>
            
            <!-- Barra de progreso miniatura -->
            <div class="w-full bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div class="h-full rounded-full transition-all duration-500" :class="exc.colorName === 'red' ? 'bg-red-500' : exc.colorName === 'orange' ? 'bg-orange-500' : exc.colorName === 'yellow' ? 'bg-amber-500' : 'bg-emerald-500'" :style="{ width: `${exc.percentage}%` }"></div>
            </div>
            
            <div class="flex justify-between text-[9px] text-slate-500 mt-1 font-semibold">
              <span>Habilitado</span>
              <span>{{ exc.percentage }}% tiempo disp.</span>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Indicador Flotante Principal -->
    <div 
      ref="indicatorRef" 
      class="bg-slate-900 border border-white/10 shadow-2xl rounded-2xl p-3 flex items-center gap-3 cursor-pointer select-none transition-all duration-300 hover:shadow-cyan-900/10 hover:border-white/20 hover:-translate-y-0.5 group"
      @mouseenter="showTooltip = true"
      @mouseleave="showTooltip = false"
    >
      <!-- SVG Anillo Radial -->
      <div class="relative w-14 h-14 shrink-0 flex items-center justify-center">
        <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
          <!-- Fondo del trazo circular (gris oscuro) -->
          <circle 
            cx="18" 
            cy="18" 
            r="16" 
            fill="transparent" 
            stroke="currentColor" 
            stroke-width="3.5" 
            class="text-slate-800" 
          />
          <!-- Relleno dinámico (según el % animado) -->
          <circle 
            cx="18" 
            cy="18" 
            r="16" 
            fill="transparent" 
            stroke="currentColor" 
            stroke-width="3.5" 
            :class="activeException.classes.stroke" 
            stroke-dasharray="100.5" 
            :stroke-dashoffset="100.5 - (100.5 * animatedProgress) / 100" 
            stroke-linecap="round" 
          />
        </svg>
        <!-- Número de días en el centro -->
        <div class="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span class="text-base font-black text-white tracking-tighter">{{ activeException.daysRemaining }}</span>
          <span class="text-[9px] font-bold text-slate-400 uppercase tracking-tight">días</span>
        </div>
      </div>

      <!-- Texto descriptivo lateral -->
      <div class="flex flex-col pr-1 text-left">
        <div class="flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full animate-ping" :class="activeException.colorName === 'red' ? 'bg-red-500' : activeException.colorName === 'orange' ? 'bg-orange-500' : activeException.colorName === 'yellow' ? 'bg-amber-500' : 'bg-emerald-500'"></span>
          <span class="text-[9px] font-black uppercase tracking-wider text-slate-500">
            {{ Number(activeException.idsede) === 0 ? 'Periodo General' : 'Excepción Activa' }}
          </span>
        </div>
        <span class="text-xs font-bold text-slate-200 mt-0.5 leading-tight">
          {{ formatModulo(activeException.modulo) }}
        </span>
        <span class="text-[9px] font-semibold text-slate-400 mt-0.5">
          {{ activeException.percentage }}% tiempo restante
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stroke-red-500 {
  stroke: #ef4444;
}
.stroke-orange-500 {
  stroke: #f97316;
}
.stroke-amber-500 {
  stroke: #f59e0b;
}
.stroke-emerald-500 {
  stroke: #10b981;
}
</style>
