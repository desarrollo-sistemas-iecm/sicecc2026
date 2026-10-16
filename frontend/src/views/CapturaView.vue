<script setup>
import { computed, onMounted, ref, watch, nextTick } from 'vue'
import Swal from 'sweetalert2'
import { CalendarRange, Search, ChevronUp, ChevronDown, CheckCircle, XCircle, CalendarClock, Lock, AlertCircle, CalendarDays } from '@lucide/vue'
import api from '../services/api.js'
import { useToast } from '../composables/useToast.js'
import { useGsapAnimations } from '../composables/useGsapAnimations.js'
import { useDateRestrictions } from '../composables/useDateRestrictions.js'

import AppCard from '../components/ui/AppCard.vue'
import AppTable from '../components/ui/AppTable.vue'
import AppInput from '../components/ui/AppInput.vue'
import AppSelect from '../components/ui/AppSelect.vue'
import AppButton from '../components/ui/AppButton.vue'

import ModalNoRealizada from '../components/modals/ModalNoRealizada.vue'
import ModalReprogramar from '../components/modals/ModalReprogramar.vue'
import ModalRealizada from '../components/modals/ModalRealizada.vue'

const toast = useToast()
const { animarVista, animarFilasTabla } = useGsapAnimations()

const {
  configs,
  loading: loadingConfig,
  loadRestrictions,
  isDateEnabled,
  isPastMonth,
  isCurrentMonth,
  isGlobalDisabled,
  activeDistrictException,
  currentMonthName,
  currentYear,
  alertPastMonthBlocked
} = useDateRestrictions()

// Estado principal de actividades
const rows = ref([])
const loading = ref(false)
const vistaRef = ref(null)
const dateConfig = computed(() => configs.value.find(c => c.modulo === 'programacion') || {})

// Filtros
const search = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const statusFilter = ref('')

// Paginación y Ordenamiento
const sortKey = ref('fecha')
const sortDir = ref('desc')
const page = ref(1)
const pageSize = ref(10)

// Modales
const reprogramarOpen = ref(false)
const noRealizadaOpen = ref(false)
const realizadaOpen = ref(false)
const activeRow = ref(null)

const loadProgramacion = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/actividades')
    rows.value = data?.data ?? []
    
    // Animar filas al terminar de cargar
    nextTick(() => {
      animarFilasTabla('.tr-row')
    })
  } catch (error) {
    toast.error('No se pudieron cargar los registros. Intenta nuevamente.')
  } finally {
    loading.value = false
  }
}

const checkCanActOnRow = async (row) => {
  if (isDateEnabled(row.fecha, 'captura', row.idsede)) {
    return true
  }

  if (isGlobalDisabled.value) {
    Swal.fire({
      icon: 'warning',
      title: 'Sistema Cerrado',
      text: 'El periodo de captura se encuentra inhabilitado globalmente en este momento.',
      confirmButtonColor: '#6B2D8B'
    })
    return false
  }

  await alertPastMonthBlocked(row, 'captura')
  return false
}

const formatHora = (row) => {
  const hasDuracion = Number.isFinite(row?.duracionhrs) && Number.isFinite(row?.duracionmin)
  if (hasDuracion) {
    const hrs = String(row.duracionhrs).padStart(2, '0')
    const min = String(row.duracionmin).padStart(2, '0')
    return `${hrs}:${min}`
  }
  return row?.hora_programada ?? '00:00'
}

const getCurso = (row) => row?.curso ?? row?.taller ?? ''
const getInstitucion = (row) => row?.institucion ?? row?.lugar ?? ''

const filteredRows = computed(() => {
  const term = search.value.trim().toLowerCase()
  const from = dateFrom.value
  const to = dateTo.value
  const status = statusFilter.value

  return rows.value.filter((row) => {
    const fecha = row.fecha ?? ''
    if (from && fecha < from) return false
    if (to && fecha > to) return false

    if (status === 'realizadas' && row.status !== 3) return false
    if (status === 'pendientes' && row.status === 3) return false

    if (!term) return true
    const haystack = `${getCurso(row)} ${getInstitucion(row)} ${row.fecha ?? ''} ${row.idcurso ?? ''}`.toLowerCase()
    return haystack.includes(term)
  })
})

const sortedRows = computed(() => {
  const key = sortKey.value
  const dir = sortDir.value === 'asc' ? 1 : -1

  const getValue = (row) => {
    if (key === 'idcurso') return Number(row.idcurso || 0)
    if (key === 'curso') return getCurso(row)
    if (key === 'institucion') return getInstitucion(row)
    if (key === 'fecha') return row.fecha ?? ''
    if (key === 'fecha_alta') return row.fecha_alta ?? ''
    if (key === 'hora') return formatHora(row)
    return row[key] ?? ''
  }

  const getTier = (row) => {
    const isCurrent = isCurrentMonth(row.fecha)
    const isPending = row.status === 1
    const isPast = isPastMonth(row.fecha)

    // 1) Mes vigente que faltan de capturar (al principio absoluto)
    if (isCurrent && isPending) return 1
    // 2) Mes vigente ya capturadas
    if (isCurrent && !isPending) return 2
    // 3) Meses pasados que faltan de capturar (después de todo el mes vigente)
    if (isPast && isPending) return 3
    // 4) Meses pasados ya capturadas
    if (isPast && !isPending) return 4
    // 5) Otras fechas (futuras pendientes)
    if (isPending) return 5
    // 6) Otras fechas (futuras ya capturadas)
    return 6
  }

  return [...filteredRows.value].sort((a, b) => {
    // 1) Prioridad por grupos (Mes vigente primero con pendientes al inicio, meses pasados después)
    const tierA = getTier(a)
    const tierB = getTier(b)
    if (tierA !== tierB) {
      return tierA - tierB
    }

    // 2) Orden secundario por columna seleccionada (por defecto fecha)
    const valA = getValue(a)
    const valB = getValue(b)
    if (typeof valA === 'number' && typeof valB === 'number') {
      return (valA - valB) * dir
    }
    const left = String(valA).toLowerCase()
    const right = String(valB).toLowerCase()
    if (left !== right) {
      return (left < right ? -1 : 1) * dir
    }

    // Desempate por hora si coinciden fechas
    if (key === 'fecha') {
      const horaA = formatHora(a)
      const horaB = formatHora(b)
      if (horaA !== horaB) {
        return (horaA < horaB ? -1 : 1) * dir
      }
    }

    return 0
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(sortedRows.value.length / pageSize.value)))
const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return sortedRows.value.slice(start, start + pageSize.value)
})

const toggleSort = (key) => {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
  nextTick(() => animarFilasTabla('.tr-row'))
}

const openReprogramar = async (row) => {
  if (await checkCanActOnRow(row)) {
    activeRow.value = row
    reprogramarOpen.value = true
  }
}

const openNoRealizada = async (row) => {
  if (await checkCanActOnRow(row)) {
    activeRow.value = row
    noRealizadaOpen.value = true
  }
}

const openRealizada = async (row) => {
  if (await checkCanActOnRow(row)) {
    activeRow.value = row
    realizadaOpen.value = true
  }
}

const updateRow = (update) => {
  rows.value = rows.value.map((row) => (row.idcurso === update.idcurso ? { ...row, ...update } : row))
  toast.success('Actividad actualizada correctamente')
}

const removeRow = (idcurso) => {
  rows.value = rows.value.filter((row) => row.idcurso !== idcurso)
  toast.success('Actividad cancelada/borrada correctamente')
}

watch([search, dateFrom, dateTo, statusFilter, pageSize], () => {
  page.value = 1
  nextTick(() => animarFilasTabla('.tr-row'))
})

watch(page, () => {
  nextTick(() => animarFilasTabla('.tr-row'))
})

onMounted(() => {
  loadProgramacion()
  loadRestrictions()
  if (vistaRef.value) animarVista(vistaRef.value)
})
</script>

<template>
  <div ref="vistaRef" class="space-y-6">
    <!-- Encabezado (Header banner) -->
    <div class="rounded-2xl bg-[#403166] dark:bg-[#231A38] px-6 py-6 text-white shadow-iecm-sm flex flex-wrap items-center justify-between gap-6 relative overflow-hidden">
      <!-- Decoración de fondo -->
      <div class="absolute right-0 top-0 w-64 h-64 bg-white/5 opacity-20 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3"></div>
      
      <div class="flex items-start gap-4 relative z-10">
        <div class="p-3 bg-white/15 rounded-xl border border-white/20 shadow-sm">
          <CalendarRange class="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 class="text-2xl font-bold tracking-tight text-white">Captura de Actividades</h2>
          <p class="text-purple-200 text-sm mt-1 max-w-lg">
            Listado y gestión de actividades programadas y realizadas.
          </p>
        </div>
      </div>
    </div>

    <!-- Alerta de Restricciones Inteligente (Mes Vigente y Excepciones) -->
    <div v-if="!loadingConfig" class="max-w-4xl">
      <!-- Caso 1: Sistema cerrado globalmente -->
      <div v-if="isGlobalDisabled" class="bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm">
        <div class="flex items-center gap-3">
          <AlertCircle class="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
          <p class="text-sm text-slate-900 dark:text-red-100">
            <strong class="font-bold text-red-900 dark:text-red-300">Sistema cerrado:</strong> El periodo de captura y edición se encuentra inhabilitado globalmente.
          </p>
        </div>
      </div>

      <!-- Caso 2: Excepción específica de distrito activa -->
      <div v-else-if="activeDistrictException" class="bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm">
        <div class="flex items-center gap-3">
          <CalendarClock class="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <p class="text-sm text-slate-900 dark:text-amber-100">
            <strong class="font-bold text-amber-900 dark:text-amber-300">Habilitación especial activa:</strong> Tu distrito cuenta con periodo autorizado para capturar y editar actividades del <strong class="font-semibold text-slate-900 dark:text-white">{{ activeDistrictException.fecha_inicio }}</strong> al <strong class="font-semibold text-slate-900 dark:text-white">{{ activeDistrictException.fecha_fin }}</strong>.
          </p>
        </div>
      </div>

      <!-- Caso 3: Operación regular en Mes Vigente -->
      <div v-else class="bg-emerald-50 dark:bg-emerald-950/30 border-l-4 border-emerald-500 p-4 rounded-r-lg shadow-sm">
        <div class="flex items-center gap-3">
          <CalendarDays class="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p class="text-sm text-slate-900 dark:text-emerald-100">
            <strong class="font-bold text-emerald-900 dark:text-emerald-300">Mes vigente habilitado:</strong> Captura y edición abierta para actividades de <strong class="font-semibold text-slate-900 dark:text-white">{{ currentMonthName }} {{ currentYear }}</strong>. Las actividades de meses concluidos se muestran atenuadas y requieren habilitación del Super Administrador.
          </p>
        </div>
      </div>
    </div>

    <AppCard>
      <!-- Filtros -->
      <template #header>
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <AppInput
            v-model="search"
            placeholder="Buscar por ID, institución, curso..."
            label="Buscar"
          >
            <template #icon><Search class="w-4 h-4" /></template>
          </AppInput>
          
          <AppInput v-model="dateFrom" type="date" label="Desde fecha" />
          <AppInput v-model="dateTo" type="date" label="Hasta fecha" />
          
          <AppSelect v-model="statusFilter" label="Estado">
            <option value="">Todas</option>
            <option value="pendientes">Pendientes</option>
            <option value="realizadas">Realizadas</option>
          </AppSelect>
          
          <AppSelect v-model.number="pageSize" label="Mostrar filas">
            <option :value="10">10 filas</option>
            <option :value="20">20 filas</option>
            <option :value="50">50 filas</option>
          </AppSelect>
        </div>
      </template>

      <AppTable :loading="loading" :is-empty="!loading && pagedRows.length === 0" empty-message="No se encontraron actividades con los filtros aplicados.">
        <template #head>
          <th class="w-1.5 p-0 bg-transparent"></th>
          <th class="px-6 py-3">#</th>
          <th class="px-6 py-3 cursor-pointer hover:bg-iecm-morado/15 dark:hover:bg-iecm-dark-elevated transition-colors" @click="toggleSort('idcurso')">
            <div class="flex items-center gap-2">
              ID
              <ChevronUp v-if="sortKey === 'idcurso' && sortDir === 'asc'" class="w-3 h-3" />
              <ChevronDown v-else-if="sortKey === 'idcurso' && sortDir === 'desc'" class="w-3 h-3" />
            </div>
          </th>
          <th class="px-6 py-3 cursor-pointer hover:bg-iecm-morado/15 dark:hover:bg-iecm-dark-elevated transition-colors" @click="toggleSort('curso')">
            <div class="flex items-center gap-2">
              Curso
              <ChevronUp v-if="sortKey === 'curso' && sortDir === 'asc'" class="w-3 h-3" />
              <ChevronDown v-else-if="sortKey === 'curso' && sortDir === 'desc'" class="w-3 h-3" />
            </div>
          </th>
          <th class="px-6 py-3 cursor-pointer hover:bg-iecm-morado/15 dark:hover:bg-iecm-dark-elevated transition-colors" @click="toggleSort('institucion')">
            <div class="flex items-center gap-2">
              Institución
              <ChevronUp v-if="sortKey === 'institucion' && sortDir === 'asc'" class="w-3 h-3" />
              <ChevronDown v-else-if="sortKey === 'institucion' && sortDir === 'desc'" class="w-3 h-3" />
            </div>
          </th>
          <th class="px-6 py-3 cursor-pointer hover:bg-iecm-morado/15 dark:hover:bg-iecm-dark-elevated transition-colors" @click="toggleSort('fecha')">
            <div class="flex items-center gap-2">
              Prog.
              <ChevronUp v-if="sortKey === 'fecha' && sortDir === 'asc'" class="w-3 h-3" />
              <ChevronDown v-else-if="sortKey === 'fecha' && sortDir === 'desc'" class="w-3 h-3" />
            </div>
          </th>
          <th class="px-6 py-3 text-center">No Realizada</th>
          <th class="px-6 py-3 text-center">Reprogramar</th>
          <th class="px-6 py-3 text-center">Capturar</th>
        </template>

        <template #body>
          <tr 
            v-for="(row, index) in pagedRows" 
            :key="row.idcurso" 
            class="tr-row transition-all duration-200"
            :class="{
              'opacity-65 bg-slate-100/80 dark:bg-iecm-dark-header/40': !isDateEnabled(row.fecha, 'captura', row.idsede)
            }"
          >
            <td class="w-1.5 p-0 cursor-help" :style="{ backgroundColor: row.color }" title="Color identificador del curso"></td>
            <td class="px-6 py-4 font-medium text-iecm-texto-muted dark:text-iecm-dark-text-muted">{{ (page - 1) * pageSize + index + 1 }}</td>
            <td class="px-6 py-4 font-medium text-iecm-texto-muted dark:text-iecm-dark-text-muted">{{ row.idcurso }}</td>
            <td class="px-6 py-4 font-medium text-iecm-morado-900 dark:text-iecm-morado-300">{{ getCurso(row) }}</td>
            <td class="px-6 py-4">{{ getInstitucion(row) }}</td>
            <td class="px-6 py-4">
              <div class="flex flex-col">
                <div class="flex items-center gap-1.5">
                  <span class="font-medium text-iecm-texto dark:text-iecm-dark-text">{{ row.fecha }}</span>
                  <span 
                    v-if="!isDateEnabled(row.fecha, 'captura', row.idsede)"
                    class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800/50"
                    title="Periodo concluido para este mes"
                  >
                    <Lock class="w-2.5 h-2.5" />
                    Mes cerrado
                  </span>
                </div>
                <span class="text-xs text-iecm-texto-muted dark:text-iecm-dark-text-muted">{{ formatHora(row) }}</span>
              </div>
            </td>
            <td class="px-6 py-4 text-center">
              <AppButton 
                v-if="row.status === 1" 
                variant="ghost" 
                size="sm" 
                :class="isDateEnabled(row.fecha, 'captura', row.idsede) ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-700 dark:hover:text-red-300' : 'text-slate-400 dark:text-slate-600 opacity-60 hover:bg-slate-100 dark:hover:bg-iecm-dark-elevated'"
                :title="isDateEnabled(row.fecha, 'captura', row.idsede) ? 'Marcar como no realizada' : 'Mes cerrado - Clic para solicitar habilitación'"
                @click="openNoRealizada(row)"
              >
                <template #icon><XCircle class="w-5 h-5" /></template>
              </AppButton>
            </td>
            <td class="px-6 py-4 text-center">
              <AppButton 
                v-if="row.status === 1" 
                variant="ghost" 
                size="sm" 
                :class="isDateEnabled(row.fecha, 'captura', row.idsede) ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-700 dark:hover:text-amber-300' : 'text-slate-400 dark:text-slate-600 opacity-60 hover:bg-slate-100 dark:hover:bg-iecm-dark-elevated'"
                :title="isDateEnabled(row.fecha, 'captura', row.idsede) ? 'Reprogramar fecha' : 'Mes cerrado - Clic para solicitar habilitación'"
                @click="openReprogramar(row)"
              >
                <template #icon><CalendarClock class="w-5 h-5" /></template>
              </AppButton>
            </td>
            <td class="px-6 py-4 text-center">
              <AppButton 
                v-if="row.status === 1" 
                :variant="isDateEnabled(row.fecha, 'captura', row.idsede) ? 'secondary' : 'ghost'"
                size="sm"
                :class="isDateEnabled(row.fecha, 'captura', row.idsede) ? 'min-w-[100px]' : 'min-w-[100px] text-slate-400 opacity-60'"
                :title="!isDateEnabled(row.fecha, 'captura', row.idsede) ? 'Mes cerrado - Clic para solicitar habilitación' : 'Capturar actividad'"
                @click="openRealizada(row)"
              >
                <template #icon>
                  <Lock v-if="!isDateEnabled(row.fecha, 'captura', row.idsede)" class="w-3.5 h-3.5 text-slate-400" />
                  <CheckCircle v-else class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </template>
                Capturar
              </AppButton>
              <AppButton 
                v-else-if="row.status === 3" 
                variant="ghost" 
                size="sm" 
                :class="isDateEnabled(row.fecha, 'captura', row.idsede) ? 'text-iecm-morado dark:text-iecm-morado-300 min-w-[100px]' : 'text-slate-400 opacity-60 min-w-[100px]'"
                :title="!isDateEnabled(row.fecha, 'captura', row.idsede) ? 'Mes cerrado - Clic para solicitar habilitación' : 'Editar actividad'"
                @click="openRealizada(row)"
              >
                <template #icon>
                  <Lock v-if="!isDateEnabled(row.fecha, 'captura', row.idsede)" class="w-3.5 h-3.5 text-slate-400 mr-1" />
                </template>
                Editar
              </AppButton>
            </td>
          </tr>
        </template>
      </AppTable>

      <!-- Footer Paginación -->
      <template #footer>
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
          <span class="text-sm text-iecm-texto-muted dark:text-iecm-dark-text-muted font-medium">
            Mostrando <span class="text-iecm-texto dark:text-iecm-dark-text font-bold">{{ pagedRows.length }}</span> de <span class="text-iecm-texto dark:text-iecm-dark-text font-bold">{{ sortedRows.length }}</span> registros
          </span>
          <div class="flex items-center gap-2">
            <AppButton variant="secondary" size="sm" :disabled="page <= 1" @click="page = Math.max(1, page - 1)">
              Anterior
            </AppButton>
            <span class="text-sm font-medium text-iecm-texto dark:text-iecm-dark-text px-2">
              Página {{ page }} de {{ totalPages }}
            </span>
            <AppButton variant="secondary" size="sm" :disabled="page >= totalPages" @click="page = Math.min(totalPages, page + 1)">
              Siguiente
            </AppButton>
          </div>
        </div>
      </template>
    </AppCard>

    <!-- Modales de Lógica de Negocio (sin tocar lógica interna, solo se muestran) -->
    <ModalNoRealizada
      :open="noRealizadaOpen"
      :actividad="activeRow"
      @close="noRealizadaOpen = false"
      @saved="(id) => removeRow(id)"
    />

    <ModalReprogramar
      :open="reprogramarOpen"
      :actividad="activeRow"
      :date-config="dateConfig"
      @close="reprogramarOpen = false"
      @saved="(update) => updateRow(update)"
    />

    <ModalRealizada
      :open="realizadaOpen"
      :actividad="activeRow"
      @close="realizadaOpen = false"
      @saved="async () => loadProgramacion()"
    />
  </div>
</template>
