<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import Swal from 'sweetalert2'
import { FileSpreadsheet, Loader2, Download, AlertCircle } from '@lucide/vue'
import api from '../services/api.js'
import { useAuthStore } from '../stores/authStore.js'
import { useToast } from '../composables/useToast.js'
import { useGsapAnimations } from '../composables/useGsapAnimations.js'

import AppCard from '../components/ui/AppCard.vue'
import AppButton from '../components/ui/AppButton.vue'
import AppSelect from '../components/ui/AppSelect.vue'
import AppInput from '../components/ui/AppInput.vue'

const toast = useToast()
const authStore = useAuthStore()
const { animarVista } = useGsapAnimations()
const vistaRef = ref(null)

// ── Permiso del usuario en sesión ────────────────────────────────────────────
const isAdmin = computed(() => Number(authStore.user?.permiso) >= 2)

// ── Catálogo de tipos de reporte ─────────────────────────────────────────────
const TIPOS_BASE = [
  { id: 1,  label: 'Talleres por vertiente' },
  { id: 2,  label: 'Intervenciones educativas' },
  { id: 3,  label: 'Talleres e intervenciones (todos)' },
  { id: 4,  label: 'Encuestas de satisfaccion' },
  { id: 5,  label: 'Grupos de Edad (Talleres)' },
  { id: 6,  label: 'Grupos de Edad (Intervenciones)' },
  { id: 7,  label: 'Actividades Programadas No Realizadas' },
  { id: 8,  label: 'Actividades Programadas Realizadas' },
  { id: 9,  label: 'Actividades Realizadas por Convenio' },
]

const TIPOS_ADMIN = [
  { id: 10, label: 'Avance acumulado por distrito' },
  { id: 11, label: 'Avance acumulado por distrito (con intervenciones)' },
  { id: 12, label: 'Concentrado de talleres por demarcacion territorial' },
  { id: 13, label: 'Concentrado de talleres por grupos de edad' },
]

const tiposReporte = computed(() =>
  isAdmin.value ? [...TIPOS_BASE, ...TIPOS_ADMIN] : TIPOS_BASE
)

// ── Catálogos de filtros ──────────────────────────────────────────────────────
const vertientes = [
  { id: 0, label: 'Todas' },
  { id: 1, label: 'Mujeres' },
  { id: 2, label: 'Jovenes' },
  { id: 3, label: 'Hombres' },
  { id: 4, label: 'Poblacion en general' }, // backend mapea 4 → idtipo 5
]

const criterios = [
  { id: 'dto', label: 'Por distrito' },
  { id: 'del', label: 'Por delegacion' },
]

const convenios = [
  { id: 0, label: 'Todos' },
  { id: 1, label: 'Con convenio' },
  { id: 2, label: 'Sin convenio' },
]

// ── Estado del formulario ────────────────────────────────────────────────────
const form = reactive({
  tipo:      '',
  vertiente: 0,
  criterio:  'dto',
  distrito:  0,
  delegacion: 0,
  convenio:  0,
  taller:    0,
  fechaInic: '',
  fechaFin:  '',
})

const errors          = reactive({})
const loadingCatalogos = ref(false)
const generating      = ref(false)

const catalogos = reactive({
  cursos:      [],
  sedes:       [],
  delegaciones: [],
})

// ── Computed: número de tipo seleccionado ────────────────────────────────────
const tipoN = computed(() => Number(form.tipo || 0))

// ── Reglas de visibilidad según sistema legado ───────────────────────────────
const showVertiente  = computed(() => tipoN.value === 1)
const showTaller     = computed(() => tipoN.value === 2)
const showConvenio   = computed(() => [1, 2, 3].includes(tipoN.value))
const showFechas     = computed(() => tipoN.value > 0 && ![4, 9].includes(tipoN.value))
const showCriterio   = computed(() => isAdmin.value && [1, 2, 3, 4, 5, 6, 7, 8].includes(tipoN.value))
const showDistrito   = computed(() => showCriterio.value && form.criterio === 'dto')
const showDelegacion = computed(() => showCriterio.value && form.criterio === 'del')

const cursosFiltrados = computed(() => {
  if (!showTaller.value) return []
  return catalogos.cursos.filter((c) => Number(c.idtipo) === 4)
})

watch(() => form.tipo, () => {
  form.vertiente  = 0
  form.taller     = 0
  form.convenio   = 0
  form.criterio   = 'dto'
  form.distrito   = 0
  form.delegacion = 0
  clearErrors()
})

const loadCatalogos = async () => {
  loadingCatalogos.value = true
  try {
    const { data } = await api.get('/reportes/catalogos')
    const payload = data?.data ?? data ?? {}
    catalogos.cursos       = payload.cursos       ?? []
    catalogos.sedes        = payload.sedes         ?? []
    catalogos.delegaciones = payload.delegaciones  ?? []
  } catch {
    toast.error('No se pudieron cargar los catálogos. Intenta nuevamente.')
  } finally {
    loadingCatalogos.value = false
  }
}

const clearErrors = () => {
  Object.keys(errors).forEach((k) => { errors[k] = '' })
}

const validate = () => {
  clearErrors()

  if (!form.tipo) {
    errors.tipo = 'Selecciona un tipo de reporte.'
    return false
  }

  if (showFechas.value) {
    if (!form.fechaInic) errors.fechaInic = 'Fecha inicial requerida.'
    if (!form.fechaFin)  errors.fechaFin  = 'Fecha final requerida.'
    if (form.fechaInic && form.fechaFin && form.fechaFin < form.fechaInic) {
      errors.fechaFin = 'La fecha final debe ser mayor o igual a la inicial.'
    }
  }

  if (showDistrito.value   && !form.distrito)   errors.distrito   = 'Selecciona un distrito.'
  if (showDelegacion.value && !form.delegacion) errors.delegacion = 'Selecciona una delegacion.'

  return Object.values(errors).every((v) => !v)
}

const downloadBlob = (blob, filename) => {
  const url  = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href  = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

const onGenerate = async () => {
  if (!validate()) return

  const tipoLabel  = tiposReporte.value.find((t) => t.id === tipoN.value)?.label ?? 'Reporte'
  const fechaTxt   = showFechas.value
    ? `Del ${form.fechaInic} al ${form.fechaFin}`
    : 'Sin filtro de fecha'

  const { isConfirmed } = await Swal.fire({
    title:             '¿Generar reporte?',
    html:              `<b>${tipoLabel}</b><br><small class="text-slate-500 dark:text-slate-400">${fechaTxt}</small>`,
    icon:              'question',
    showCancelButton:  true,
    confirmButtonColor: '#6B2D8B', // iecm-morado
    cancelButtonColor:  '#94a3b8',
    confirmButtonText: 'Sí, generar',
    cancelButtonText:  'Cancelar',
    customClass: {
      popup: 'rounded-2xl',
      confirmButton: 'rounded-lg',
      cancelButton: 'rounded-lg'
    }
  })
  
  if (!isConfirmed) return

  generating.value = true
  try {
    const payload = {
      tipo:      tipoN.value,
      vertiente: showVertiente.value  ? Number(form.vertiente || 0) : 0,
      criterio:  showCriterio.value   ? (form.criterio || null)     : null,
      distrito:  showDistrito.value   ? Number(form.distrito || 0)  : 0,
      delegacion: showDelegacion.value ? Number(form.delegacion || 0) : 0,
      convenio:  showConvenio.value   ? Number(form.convenio || 0)  : 0,
      taller:    showTaller.value     ? Number(form.taller || 0)    : 0,
      fechaInic: showFechas.value     ? form.fechaInic              : null,
      fechaFin:  showFechas.value     ? form.fechaFin               : null,
    }

    const response = await api.post('/reportes/generar', payload, { responseType: 'blob' })

    const ct = response.headers['content-type'] ?? ''
    if (ct.includes('application/json')) {
      const text   = await response.data.text()
      const parsed = JSON.parse(text)
      throw new Error(parsed?.message || 'Error al generar el reporte')
    }

    const hoy  = new Date()
    const dd   = String(hoy.getDate()).padStart(2, '0')
    const mm   = String(hoy.getMonth() + 1).padStart(2, '0')
    const yyyy = hoy.getFullYear()
    const filename = `SISEC_${tipoN.value}_${dd}-${mm}-${yyyy}.xlsx`

    downloadBlob(new Blob([response.data]), filename)
    toast.success('Reporte descargado correctamente en Excel.')
  } catch (err) {
    const msg = err?.message ?? 'No se pudo generar el reporte.'
    if (msg.toLowerCase().includes('sin resultados') || msg.toLowerCase().includes('resultado')) {
      toast.warning('No se encontraron registros con los filtros seleccionados.')
    } else {
      toast.error(msg)
    }
  } finally {
    generating.value = false
  }
}

onMounted(() => {
  loadCatalogos()
  if (vistaRef.value) animarVista(vistaRef.value)
})
</script>

<template>
  <div ref="vistaRef" class="space-y-6 max-w-5xl mx-auto">
    <!-- Encabezado (Header banner) -->
    <div class="rounded-2xl bg-[#403166] dark:bg-[#231A38] px-6 py-6 text-white shadow-iecm-sm flex flex-wrap items-center justify-between gap-6 relative overflow-hidden">
      <!-- Decoración de fondo -->
      <div class="absolute right-0 top-0 w-64 h-64 bg-white/5 opacity-20 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3"></div>
      
      <div class="flex items-start gap-4 relative z-10">
        <div class="p-3 bg-white/15 rounded-xl border border-white/20 shadow-sm">
          <FileSpreadsheet class="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 class="text-2xl font-bold tracking-tight text-white">Generación de Reportes</h2>
          <p class="text-purple-200 text-sm mt-1 max-w-lg">
            Configura los filtros y exporta la información en formato Excel (.xlsx).
          </p>
        </div>
      </div>
    </div>

    <!-- Formulario Principal en AppCard -->
    <AppCard>
      <form @submit.prevent="onGenerate" class="space-y-8">
        
        <!-- Bloque Principal: Tipo de Reporte -->
        <div class="bg-iecm-gris dark:bg-slate-950 p-5 rounded-xl border border-iecm-gris-200 dark:border-white/10">
          <AppSelect
            v-model="form.tipo"
            label="1. Tipo de reporte"
            required
            :error="errors.tipo"
          >
            <option value="" disabled>— Selecciona el reporte a generar —</option>
            <optgroup label="Reportes generales (Todos)">
              <option v-for="t in TIPOS_BASE" :key="t.id" :value="t.id">{{ t.label }}</option>
            </optgroup>
            <optgroup v-if="isAdmin" label="Reportes de administrador">
              <option v-for="t in TIPOS_ADMIN" :key="t.id" :value="t.id">{{ t.label }}</option>
            </optgroup>
          </AppSelect>
        </div>

        <!-- Bloque 2: Filtros Dinámicos (solo si hay tipo seleccionado) -->
        <div v-if="tipoN > 0" class="px-2">
          <h3 class="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 border-b border-slate-200 dark:border-white/10 pb-2">
            2. Filtros Específicos
          </h3>
          
          <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            
            <!-- Vertiente -->
            <AppSelect
              v-if="showVertiente"
              v-model="form.vertiente"
              label="Vertiente"
            >
              <option v-for="v in vertientes" :key="v.id" :value="v.id">{{ v.label }}</option>
            </AppSelect>

            <!-- Taller / Intervención -->
            <AppSelect
              v-if="showTaller"
              v-model="form.taller"
              label="Intervención educativa"
            >
              <option :value="0">Todas las intervenciones</option>
              <option v-for="c in cursosFiltrados" :key="c.idcurso" :value="c.idcurso">
                {{ c.descripcion }}
              </option>
            </AppSelect>

            <!-- Convenio -->
            <AppSelect
              v-if="showConvenio"
              v-model="form.convenio"
              label="Convenio"
            >
              <option v-for="c in convenios" :key="c.id" :value="c.id">{{ c.label }}</option>
            </AppSelect>

            <!-- Criterio Admin -->
            <div v-if="showCriterio" class="lg:col-span-3 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-white/10">
              <label class="label-iecm !mb-3">Alcance geográfico</label>
              <div class="flex gap-8">
                <label v-for="c in criterios" :key="c.id" class="flex items-center gap-2.5 cursor-pointer group">
                  <div class="relative flex items-center justify-center">
                    <input v-model="form.criterio" type="radio" :value="c.id" class="peer sr-only" />
                    <div class="w-5 h-5 rounded-full border-2 border-slate-300 peer-checked:border-iecm-morado peer-checked:bg-iecm-morado transition-all"></div>
                    <div class="absolute w-2 h-2 rounded-full bg-white dark:bg-slate-900 opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                  </div>
                  <span class="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-iecm-morado transition-colors">{{ c.label }}</span>
                </label>
              </div>

              <!-- Select dependiente del criterio -->
              <div class="mt-4 grid md:grid-cols-2 gap-4">
                <AppSelect
                  v-if="showDistrito"
                  v-model="form.distrito"
                  label="Distrito"
                  required
                  :error="errors.distrito"
                >
                  <option :value="0" disabled>— Todos los distritos —</option>
                  <option v-for="s in catalogos.sedes" :key="s.idsede" :value="s.idsede">
                    {{ s.idsede }} — {{ s.descripcion }}
                  </option>
                </AppSelect>

                <AppSelect
                  v-if="showDelegacion"
                  v-model="form.delegacion"
                  label="Delegación"
                  required
                  :error="errors.delegacion"
                >
                  <option :value="0" disabled>— Todas las delegaciones —</option>
                  <option v-for="d in catalogos.delegaciones" :key="d.iddelegacion" :value="d.iddelegacion">
                    {{ d.descripcion }}
                  </option>
                </AppSelect>
              </div>
            </div>

            <!-- Fechas -->
            <template v-if="showFechas">
              <AppInput
                v-model="form.fechaInic"
                type="date"
                label="Fecha inicial"
                required
                :error="errors.fechaInic"
              />
              <AppInput
                v-model="form.fechaFin"
                type="date"
                label="Fecha final"
                required
                :error="errors.fechaFin"
                :min="form.fechaInic || undefined"
              />
            </template>

            <!-- Badge Informativo si no lleva fechas -->
            <div v-else-if="tipoN > 0" class="lg:col-span-3 flex items-start gap-3 p-4 bg-iecm-dorado-100/50 border border-iecm-dorado-100 rounded-xl text-amber-800">
              <AlertCircle class="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
              <div class="text-sm">
                <p class="font-medium">Sin filtro de fechas</p>
                <p class="opacity-90 mt-0.5">Este tipo de reporte se genera contemplando todo el histórico de registros. No es necesario seleccionar un rango de fechas.</p>
              </div>
            </div>

          </div>
        </div>

        <!-- Footer Actions -->
        <div class="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-white/5">
          <div class="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <template v-if="loadingCatalogos">
              <Loader2 class="w-4 h-4 animate-spin text-iecm-morado dark:text-iecm-morado-400" />
              Cargando catálogos...
            </template>
            <template v-else-if="!form.tipo">
              <AlertCircle class="w-4 h-4 text-slate-400 dark:text-slate-500" />
              Selecciona el tipo de reporte primero.
            </template>
            <template v-else>
              <span class="inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              Listo para generar
            </template>
          </div>

          <AppButton
            type="submit"
            variant="primary"
            size="lg"
            :loading="generating || loadingCatalogos"
            :disabled="!form.tipo"
            class="min-w-[200px]"
          >
            <template #icon v-if="!generating">
              <Download class="w-5 h-5" />
            </template>
            Generar Excel
          </AppButton>
        </div>
        
      </form>
    </AppCard>
  </div>
</template>
