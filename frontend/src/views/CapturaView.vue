<script setup>
import { computed, onMounted, ref, watch, nextTick } from 'vue'
import Swal from 'sweetalert2'
import { CalendarRange, Search, ChevronUp, ChevronDown, CheckCircle, XCircle, CalendarClock } from '@lucide/vue'
import api from '../services/api.js'
import { useToast } from '../composables/useToast.js'
import { useGsapAnimations } from '../composables/useGsapAnimations.js'

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

const vistaRef = ref(null)
const loading = ref(false)
const rows = ref([])

const dateConfig = ref({
  habilitado: true,
  fecha_inicio: null,
  fecha_fin: null
})

const loadingConfig = ref(true)

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

const loadDateConfig = async () => {
  loadingConfig.value = true
  try {
    const { data } = await api.get('/admin/restricciones')
    if (data.success && data.data) {
      const configs = data.data.filter(c => c.modulo === 'captura')
      const globalConfig = configs.find(c => Number(c.idsede) === 0)
      const specificConfig = configs.find(c => Number(c.idsede) !== 0)
      
      let config = null
      if (specificConfig && globalConfig) {
        const globalTime = new Date(globalConfig.fecha_actualizado || 0).getTime()
        const specificTime = new Date(specificConfig.fecha_actualizado || 0).getTime()
        config = specificTime > globalTime ? specificConfig : globalConfig
      } else {
        config = specificConfig || globalConfig
      }
      
      if (config) {
        dateConfig.value = {
          habilitado: Boolean(config.habilitado),
          fecha_inicio: config.fecha_inicio,
          fecha_fin: config.fecha_fin
        }
      }
    }
  } catch (error) {
    console.error('Error cargando configuración de fechas')
  } finally {
    loadingConfig.value = false
  }
}

const solicitarExcepcion = async (row) => {
  try {
    const { data } = await api.post('/admin/restricciones/solicitar', {
      fecha_solicitada: row.fecha || new Date().toISOString().split('T')[0],
      modulo: 'captura'
    })
    if (data.success) {
      Swal.fire('Solicitud enviada', 'El Super Administrador revisará tu solicitud.', 'success')
    }
  } catch (error) {
    Swal.fire('Error', 'No se pudo enviar la solicitud.', 'error')
  }
}

const checkRestrictions = async (row) => {
  if (!dateConfig.value.habilitado) {
    const { isConfirmed } = await Swal.fire({
      icon: 'warning',
      title: 'Sistema Cerrado',
      text: 'El periodo de captura se encuentra inhabilitado. ¿Deseas solicitar una excepción al Super Administrador para esta actividad?',
      showCancelButton: true,
      confirmButtonText: 'Solicitar Excepción',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#6B2D8B'
    })
    
    if (isConfirmed) {
      await solicitarExcepcion(row)
    }
    return false
  }

  // Verificar rango
  if (dateConfig.value.fecha_inicio && dateConfig.value.fecha_fin) {
    const today = new Date().toISOString().split('T')[0] // Assuming checking against current date of capture attempt
    // Si la regla dice que no puedes capturar hoy si hoy no está en rango:
    if (today < dateConfig.value.fecha_inicio || today > dateConfig.value.fecha_fin) {
      const { isConfirmed } = await Swal.fire({
        icon: 'warning',
        title: 'Fecha fuera de rango',
        text: `Hoy (${today}) estás fuera del rango de captura habilitado (${dateConfig.value.fecha_inicio} a ${dateConfig.value.fecha_fin}). ¿Deseas solicitar una excepción?`,
        showCancelButton: true,
        confirmButtonText: 'Solicitar Excepción',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#6B2D8B'
      })
      
      if (isConfirmed) {
        await solicitarExcepcion(row)
      }
      return false
    }
  }
  return true
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
    if (key === 'curso') return getCurso(row)
    if (key === 'institucion') return getInstitucion(row)
    if (key === 'fecha') return row.fecha ?? ''
    if (key === 'fecha_alta') return row.fecha_alta ?? ''
    if (key === 'hora') return formatHora(row)
    return row[key] ?? ''
  }

  return [...filteredRows.value].sort((a, b) => {
    const left = String(getValue(a)).toLowerCase()
    const right = String(getValue(b)).toLowerCase()
    if (left < right) return -1 * dir
    if (left > right) return 1 * dir
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
  if (await checkRestrictions(row)) {
    activeRow.value = row
    reprogramarOpen.value = true
  }
}

const openNoRealizada = async (row) => {
  if (await checkRestrictions(row)) {
    activeRow.value = row
    noRealizadaOpen.value = true
  }
}

const openRealizada = async (row) => {
  if (await checkRestrictions(row)) {
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
  loadDateConfig()
  if (vistaRef.value) animarVista(vistaRef.value)
})
</script>

<template>
  <div ref="vistaRef" class="space-y-6">
    <!-- Encabezado (Header banner) -->
    <div class="rounded-2xl bg-gradient-iecm px-6 py-6 text-white shadow-iecm-sm flex flex-wrap items-center justify-between gap-6 relative overflow-hidden">
      <!-- Decoración de fondo -->
      <div class="absolute right-0 top-0 w-64 h-64 bg-white dark:bg-slate-900 opacity-5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3"></div>
      
      <div class="flex items-start gap-4 relative z-10">
        <div class="p-3 bg-white dark:bg-slate-800 rounded-xl border border-white/20 dark:border-white/10 shadow-sm">
          <CalendarRange class="w-8 h-8 text-iecm-morado dark:text-iecm-morado-300" />
        </div>
        <div>
          <h2 class="text-2xl font-bold tracking-tight">Captura de Actividades</h2>
          <p class="text-purple-100 text-sm mt-1 max-w-lg">
            Listado y gestión de actividades programadas y realizadas.
          </p>
        </div>
      </div>
    </div>

    <!-- Alerta de Restricciones -->
    <div v-if="!loadingConfig && !dateConfig.habilitado" class="bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 p-4 rounded-r-lg max-w-4xl">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-amber-700">
            <strong>Aviso:</strong> El periodo de captura se encuentra inhabilitado. Si necesitas registrar, el sistema enviará una solicitud de excepción.
          </p>
        </div>
      </div>
    </div>
    <div v-else-if="!loadingConfig && dateConfig.fecha_inicio && dateConfig.fecha_fin" class="bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500 p-4 rounded-r-lg max-w-4xl">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-blue-700">
            <strong>Periodo habilitado:</strong> Sólo se pueden capturar actividades entre el {{ dateConfig.fecha_inicio }} y el {{ dateConfig.fecha_fin }}.
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
            placeholder="Buscar por institución, curso..."
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

      <!-- Tabla -->
      <AppTable :loading="loading" :is-empty="!loading && pagedRows.length === 0" empty-message="No se encontraron actividades con los filtros aplicados.">
        <template #head>
          <th class="px-6 py-3">#</th>
          <th class="px-6 py-3 cursor-pointer hover:bg-iecm-morado-100 dark:hover:bg-slate-700/50 transition-colors" @click="toggleSort('curso')">
            <div class="flex items-center gap-2">
              Curso
              <ChevronUp v-if="sortKey === 'curso' && sortDir === 'asc'" class="w-3 h-3" />
              <ChevronDown v-else-if="sortKey === 'curso' && sortDir === 'desc'" class="w-3 h-3" />
            </div>
          </th>
          <th class="px-6 py-3 cursor-pointer hover:bg-iecm-morado-100 dark:hover:bg-slate-700/50 transition-colors" @click="toggleSort('institucion')">
            <div class="flex items-center gap-2">
              Institución
              <ChevronUp v-if="sortKey === 'institucion' && sortDir === 'asc'" class="w-3 h-3" />
              <ChevronDown v-else-if="sortKey === 'institucion' && sortDir === 'desc'" class="w-3 h-3" />
            </div>
          </th>
          <th class="px-6 py-3 cursor-pointer hover:bg-iecm-morado-100 dark:hover:bg-slate-700/50 transition-colors" @click="toggleSort('fecha')">
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
          <tr v-for="(row, index) in pagedRows" :key="row.idcurso" class="tr-row">
            <td class="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">{{ (page - 1) * pageSize + index + 1 }}</td>
            <td class="px-6 py-4 font-medium text-iecm-morado-800 dark:text-iecm-morado-300">{{ getCurso(row) }}</td>
            <td class="px-6 py-4">{{ getInstitucion(row) }}</td>
            <td class="px-6 py-4">
              <div class="flex flex-col">
                <span class="font-medium text-slate-900 dark:text-white">{{ row.fecha }}</span>
                <span class="text-xs text-slate-500 dark:text-slate-400">{{ formatHora(row) }}</span>
              </div>
            </td>
            <td class="px-6 py-4 text-center">
              <AppButton 
                v-if="row.status === 1" 
                variant="ghost" 
                size="sm" 
                class="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600"
                title="Marcar como no realizada"
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
                class="text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-600"
                title="Reprogramar fecha"
                @click="openReprogramar(row)"
              >
                <template #icon><CalendarClock class="w-5 h-5" /></template>
              </AppButton>
            </td>
            <td class="px-6 py-4 text-center">
              <AppButton 
                v-if="row.status === 1" 
                variant="secondary" 
                size="sm"
                class="min-w-[100px]"
                @click="openRealizada(row)"
              >
                <template #icon><CheckCircle class="w-4 h-4 text-emerald-500" /></template>
                Capturar
              </AppButton>
              <AppButton 
                v-else-if="row.status === 3" 
                variant="ghost" 
                size="sm"
                class="text-iecm-morado dark:text-iecm-morado-400 min-w-[100px]"
                @click="openRealizada(row)"
              >
                Editar
              </AppButton>
            </td>
          </tr>
        </template>
      </AppTable>

      <!-- Footer Paginación -->
      <template #footer>
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
          <span class="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Mostrando <span class="text-slate-900 dark:text-white">{{ pagedRows.length }}</span> de <span class="text-slate-900 dark:text-white">{{ sortedRows.length }}</span> registros
          </span>
          <div class="flex items-center gap-2">
            <AppButton variant="secondary" size="sm" :disabled="page <= 1" @click="page = Math.max(1, page - 1)">
              Anterior
            </AppButton>
            <span class="text-sm font-medium text-slate-700 dark:text-slate-300 px-2">
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
