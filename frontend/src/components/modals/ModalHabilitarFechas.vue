<script setup>
import { ref, computed, watch } from 'vue'
import AppModal from '../AppModal.vue'
import AppButton from '../ui/AppButton.vue'
import AppSelect from '../ui/AppSelect.vue'
import AppInput from '../ui/AppInput.vue'
import { CalendarDays, CalendarRange, Clock, Sparkles, Building, AlertCircle } from '@lucide/vue'
import api from '../../services/api'
import Swal from 'sweetalert2'

const props = defineProps({
  open: { type: Boolean, default: false },
  initialSede: { type: [Number, String], default: 0 },
  allowGlobal: { type: Boolean, default: true },
  title: { type: String, default: '' }
})

const emit = defineEmits(['close', 'saved'])

const saving = ref(false)

// Configuración del formulario
const modalidad = ref('mes_completo') // 'mes_completo' | 'rango_dias'
const idsede = ref(0)
const modulo = ref('ambos')

// Selección de mes completo
const meses = [
  { value: 0, label: 'Enero' },
  { value: 1, label: 'Febrero' },
  { value: 2, label: 'Marzo' },
  { value: 3, label: 'Abril' },
  { value: 4, label: 'Mayo' },
  { value: 5, label: 'Junio' },
  { value: 6, label: 'Julio' },
  { value: 7, label: 'Agosto' },
  { value: 8, label: 'Septiembre' },
  { value: 9, label: 'Octubre' },
  { value: 10, label: 'Noviembre' },
  { value: 11, label: 'Diciembre' }
]

const now = new Date()
// Por defecto sugerir el mes anterior si estamos en mes corriente (ej. si hoy es octubre, sugerir septiembre)
const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1
const mesSeleccionado = ref(prevMonth)
const anioSeleccionado = ref(now.getFullYear())

// Selección de rango de días
const fechaInicio = ref('')
const fechaFin = ref('')

// ¿Cuánto tiempo estará abierto? (Vigencia de la prórroga)
const vigenciaTipo = ref('5_dias') // '3_dias', '5_dias', '7_dias', 'fin_mes', 'personalizado'
const fechaLimitePersonalizada = ref('')

// Inicializar cuando se abre el modal
watch(() => props.open, (val) => {
  if (val) {
    idsede.value = Number(props.initialSede ?? 0)
    modalidad.value = 'mes_completo'
    modulo.value = 'ambos'
    vigenciaTipo.value = '5_dias'
    fechaLimitePersonalizada.value = ''
    
    // Configurar fechas por defecto para el rango
    const currentYear = now.getFullYear()
    const pad = (n) => String(n).padStart(2, '0')
    fechaInicio.value = `${currentYear}-${pad(prevMonth + 1)}-01`
    const lastDayPrev = new Date(currentYear, prevMonth + 1, 0).getDate()
    fechaFin.value = `${currentYear}-${pad(prevMonth + 1)}-${pad(lastDayPrev)}`
  }
})

// Fechas efectivas que se van a autorizar
const fechasEfectivas = computed(() => {
  const pad = (n) => String(n).padStart(2, '0')
  if (modalidad.value === 'mes_completo') {
    const y = anioSeleccionado.value
    const m = mesSeleccionado.value
    const lastDay = new Date(y, m + 1, 0).getDate()
    return {
      inicio: `${y}-${pad(m + 1)}-01`,
      fin: `${y}-${pad(m + 1)}-${pad(lastDay)}`,
      descripcion: `Todo el mes de ${meses[m].label} ${y}`
    }
  } else {
    return {
      inicio: fechaInicio.value,
      fin: fechaFin.value,
      descripcion: `Del ${fechaInicio.value || '...'} al ${fechaFin.value || '...'}`
    }
  }
})

// Fecha límite de vigencia de la prórroga
const fechaLimiteEfectiva = computed(() => {
  const pad = (n) => String(n).padStart(2, '0')
  const base = new Date()
  
  if (vigenciaTipo.value === '3_dias') {
    base.setDate(base.getDate() + 3)
    return `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}`
  }
  if (vigenciaTipo.value === '5_dias') {
    base.setDate(base.getDate() + 5)
    return `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}`
  }
  if (vigenciaTipo.value === '7_dias') {
    base.setDate(base.getDate() + 7)
    return `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}`
  }
  if (vigenciaTipo.value === 'fin_mes') {
    const lastDay = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate()
    return `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(lastDay)}`
  }
  if (vigenciaTipo.value === 'personalizado') {
    return fechaLimitePersonalizada.value
  }
  return ''
})

// Cálculo de días que estará abierta la ventana
const diasAbiertoCalculados = computed(() => {
  if (!fechaLimiteEfectiva.value) return 0
  const [y, m, d] = fechaLimiteEfectiva.value.split('-').map(Number)
  const target = new Date(y, m - 1, d)
  target.setHours(23, 59, 59, 999)
  const today = new Date()
  const diff = target.getTime() - today.getTime()
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)))
})

// Lista de opciones de distrito
const sedesList = computed(() => {
  const items = []
  if (props.allowGlobal) {
    items.push({ value: 0, label: '🌐 Todos los Distritos (Habilitación General)' })
  }
  for (let i = 1; i <= 33; i++) {
    items.push({ value: i, label: `Distrito ${i}` })
  }
  return items
})

const modalTitle = computed(() => {
  if (props.title) return props.title
  if (idsede.value === 0) return 'Habilitar Fechas Globales (Todos los Distritos)'
  return `Habilitar Fechas para Distrito ${idsede.value}`
})

const onSubmit = async () => {
  if (!fechasEfectivas.value.inicio || !fechasEfectivas.value.fin) {
    Swal.fire('Atención', 'Debes especificar el rango de fechas a autorizar.', 'warning')
    return
  }
  if (!fechaLimiteEfectiva.value) {
    Swal.fire('Atención', 'Debes definir cuánto tiempo estará abierta la prórroga.', 'warning')
    return
  }

  saving.value = true
  try {
    const payload = {
      modulo: modulo.value,
      fecha_inicio: fechasEfectivas.value.inicio,
      fecha_fin: fechasEfectivas.value.fin,
      fecha_limite: fechaLimiteEfectiva.value,
      idsede: Number(idsede.value),
      habilitado: true
    }

    const { data } = await api.post('/admin/restricciones', payload)
    if (data.success) {
      await Swal.fire({
        icon: 'success',
        title: 'Habilitación Registrada',
        html: `
          <div class="text-left text-sm space-y-2">
            <p>Se ha habilitado correctamente:</p>
            <p class="font-semibold text-iecm-morado"><strong>Periodo de actividades:</strong> ${fechasEfectivas.value.descripcion}</p>
            <p><strong>Destino:</strong> ${Number(idsede.value) === 0 ? 'Todos los distritos' : 'Distrito ' + idsede.value}</p>
            <p><strong>Ventana abierta:</strong> ${diasAbiertoCalculados.value} días restantes (hasta el ${fechaLimiteEfectiva.value}).</p>
            <p class="text-xs text-slate-500 mt-2">Los operadores verán el radial amarillo indicando la leyenda de actividades habilitadas.</p>
          </div>
        `,
        confirmButtonColor: '#10b981'
      })
      emit('saved', payload)
      emit('close')
    }
  } catch (error) {
    console.error('Error al guardar habilitación:', error)
    Swal.fire('Error', error?.response?.data?.message || 'No se pudo guardar la habilitación.', 'error')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <AppModal :open="props.open" :title="modalTitle" maxWidth="max-w-2xl" @close="emit('close')">
    <div class="space-y-5 text-slate-700 dark:text-slate-300">
      
      <!-- Selector de Destino (si se permite global) -->
      <div v-if="props.allowGlobal">
        <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
          <Building class="w-3.5 h-3.5 text-iecm-morado" />
          Destino de la Habilitación
        </label>
        <select 
          v-model.number="idsede" 
          class="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-iecm-morado/40"
        >
          <option v-for="s in sedesList" :key="s.value" :value="s.value">{{ s.label }}</option>
        </select>
      </div>

      <!-- Selector de Módulo -->
      <div>
        <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
          Módulo a Habilitar
        </label>
        <div class="grid grid-cols-3 gap-2">
          <button
            type="button"
            @click="modulo = 'ambos'"
            class="px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center"
            :class="modulo === 'ambos' ? 'bg-iecm-morado text-white border-iecm-morado shadow-sm' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'"
          >
            Ambos (Captura y Prog.)
          </button>
          <button
            type="button"
            @click="modulo = 'captura'"
            class="px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center"
            :class="modulo === 'captura' ? 'bg-iecm-morado text-white border-iecm-morado shadow-sm' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'"
          >
            Solo Captura
          </button>
          <button
            type="button"
            @click="modulo = 'programacion'"
            class="px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center"
            :class="modulo === 'programacion' ? 'bg-iecm-morado text-white border-iecm-morado shadow-sm' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'"
          >
            Solo Programación
          </button>
        </div>
      </div>

      <!-- Paso 1: Selección de Actividades (Mes Completo vs Ciertos Días) -->
      <div class="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-white/10 space-y-3">
        <div class="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/5">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <CalendarDays class="w-4 h-4 text-iecm-morado" />
            1. ¿Qué periodo de actividades deseas autorizar?
          </span>
          <!-- Selector tipo tabs -->
          <div class="flex p-0.5 bg-slate-200 dark:bg-slate-900 rounded-lg text-xs">
            <button
              type="button"
              @click="modalidad = 'mes_completo'"
              class="px-2.5 py-1 rounded-md font-semibold transition-all"
              :class="modalidad === 'mes_completo' ? 'bg-white dark:bg-slate-800 text-iecm-morado dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'"
            >
              Mes Completo
            </button>
            <button
              type="button"
              @click="modalidad = 'rango_dias'"
              class="px-2.5 py-1 rounded-md font-semibold transition-all"
              :class="modalidad === 'rango_dias' ? 'bg-white dark:bg-slate-800 text-iecm-morado dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'"
            >
              Ciertos Días
            </button>
          </div>
        </div>

        <!-- Opción A: Mes Completo -->
        <div v-if="modalidad === 'mes_completo'" class="grid grid-cols-2 gap-3 pt-1">
          <div>
            <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Mes</label>
            <select
              v-model.number="mesSeleccionado"
              class="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white font-medium"
            >
              <option v-for="m in meses" :key="m.value" :value="m.value">{{ m.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Año</label>
            <input
              v-model.number="anioSeleccionado"
              type="number"
              min="2024"
              max="2030"
              class="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white font-medium"
            />
          </div>
          <div class="col-span-2 text-xs text-iecm-morado dark:text-iecm-morado-300 font-semibold bg-purple-50 dark:bg-iecm-morado-950/30 p-2.5 rounded-lg border border-iecm-morado/15">
            ✓ Autorizará registrar y editar actividades del: <strong>{{ fechasEfectivas.inicio }}</strong> al <strong>{{ fechasEfectivas.fin }}</strong>.
          </div>
        </div>

        <!-- Opción B: Ciertos Días (Rango Específico) -->
        <div v-else class="grid grid-cols-2 gap-3 pt-1">
          <div>
            <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Fecha Inicio de Actividades</label>
            <input
              v-model="fechaInicio"
              type="date"
              class="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white font-medium"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Fecha Fin de Actividades</label>
            <input
              v-model="fechaFin"
              type="date"
              class="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white font-medium"
            />
          </div>
          <div class="col-span-2 text-xs text-slate-500 dark:text-slate-400">
            Solo se permitirán actividades cuya fecha esté dentro de este rango autorizado.
          </div>
        </div>
      </div>

      <!-- Paso 2: Vigencia de la Prórroga (¿Cuánto tiempo estará abierto?) -->
      <div class="p-4 bg-amber-50/60 dark:bg-amber-950/20 rounded-2xl border border-amber-200/70 dark:border-amber-800/40 space-y-3">
        <div class="flex items-center gap-2 pb-2 border-b border-amber-200/40 dark:border-white/5">
          <Clock class="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span class="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
            2. ¿Cuánto tiempo estará abierto para capturar? (Radial Amarillo)
          </span>
        </div>

        <p class="text-xs text-slate-600 dark:text-slate-300">
          Determina la duración de la ventana de captura. Durante este lapso, los operadores verán el <strong>radial amarillo</strong> indicando los días restantes.
        </p>

        <div class="grid grid-cols-3 sm:grid-cols-5 gap-2">
          <button
            type="button"
            @click="vigenciaTipo = '3_dias'"
            class="px-2.5 py-2 rounded-xl text-xs font-semibold border transition-all text-center"
            :class="vigenciaTipo === '3_dias' ? 'bg-amber-500 text-white border-amber-600 shadow-sm' : 'bg-white dark:bg-slate-900 border-amber-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-amber-100/50'"
          >
            3 Días
          </button>
          <button
            type="button"
            @click="vigenciaTipo = '5_dias'"
            class="px-2.5 py-2 rounded-xl text-xs font-semibold border transition-all text-center"
            :class="vigenciaTipo === '5_dias' ? 'bg-amber-500 text-white border-amber-600 shadow-sm' : 'bg-white dark:bg-slate-900 border-amber-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-amber-100/50'"
          >
            5 Días
          </button>
          <button
            type="button"
            @click="vigenciaTipo = '7_dias'"
            class="px-2.5 py-2 rounded-xl text-xs font-semibold border transition-all text-center"
            :class="vigenciaTipo === '7_dias' ? 'bg-amber-500 text-white border-amber-600 shadow-sm' : 'bg-white dark:bg-slate-900 border-amber-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-amber-100/50'"
          >
            7 Días
          </button>
          <button
            type="button"
            @click="vigenciaTipo = 'fin_mes'"
            class="px-2.5 py-2 rounded-xl text-xs font-semibold border transition-all text-center"
            :class="vigenciaTipo === 'fin_mes' ? 'bg-amber-500 text-white border-amber-600 shadow-sm' : 'bg-white dark:bg-slate-900 border-amber-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-amber-100/50'"
          >
            Fin de Mes
          </button>
          <button
            type="button"
            @click="vigenciaTipo = 'personalizado'"
            class="px-2.5 py-2 rounded-xl text-xs font-semibold border transition-all text-center"
            :class="vigenciaTipo === 'personalizado' ? 'bg-amber-500 text-white border-amber-600 shadow-sm' : 'bg-white dark:bg-slate-900 border-amber-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-amber-100/50'"
          >
            Manual
          </button>
        </div>

        <div v-if="vigenciaTipo === 'personalizado'" class="pt-2">
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Fecha Límite de Cierre de la Prórroga</label>
          <input
            v-model="fechaLimitePersonalizada"
            type="date"
            class="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white font-medium"
          />
        </div>

        <!-- Preview del Radial Amarillo -->
        <div class="mt-2 p-3 bg-amber-100/60 dark:bg-amber-900/30 rounded-xl border border-amber-300/60 dark:border-amber-700/50 flex items-center gap-3">
          <div class="relative w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-slate-900 text-amber-400 font-black text-sm border-2 border-amber-400 shadow-sm">
            {{ diasAbiertoCalculados }}d
          </div>
          <div class="text-xs leading-snug">
            <p class="font-bold text-amber-900 dark:text-amber-200">
              Radial Amarillo Activo: {{ diasAbiertoCalculados }} días disponibles
            </p>
            <p class="text-amber-800 dark:text-amber-300 text-[11px]">
              Leyenda: <em>"El mes se habilitó para completar sus actividades (abierto hasta el {{ fechaLimiteEfectiva }})"</em>
            </p>
          </div>
        </div>
      </div>

      <!-- Acciones del Modal -->
      <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
        <button
          type="button"
          @click="emit('close')"
          class="px-4 py-2.5 rounded-xl font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm"
        >
          Cancelar
        </button>
        <AppButton
          type="button"
          variant="primary"
          :loading="saving"
          @click="onSubmit"
          class="min-w-[140px] shadow-md shadow-iecm-morado/20"
        >
          Habilitar Fechas
        </AppButton>
      </div>

    </div>
  </AppModal>
</template>
