<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import Swal from 'sweetalert2'
import { CalendarPlus, Save, Users, Building2, MapPin, Contact, Clock, AlertCircle, CalendarDays, CheckCircle } from '@lucide/vue'
import api from '../services/api.js'
import { useToast } from '../composables/useToast.js'
import { useGsapAnimations } from '../composables/useGsapAnimations.js'
import { useDateRestrictions } from '../composables/useDateRestrictions.js'

import AppCard from '../components/ui/AppCard.vue'
import AppInput from '../components/ui/AppInput.vue'
import AppSelect from '../components/ui/AppSelect.vue'
import AppButton from '../components/ui/AppButton.vue'

const toast = useToast()
const { animarVista } = useGsapAnimations()

const vistaRef = ref(null)
const loadingCatalogos = ref(false)
const saving = ref(false)

const catalogos = reactive({
  cursos: [],
  tiposPublico: []
})

const {
  configs,
  loading: loadingConfig,
  loadRestrictions,
  isDateEnabled,
  isPastMonth,
  isGlobalDisabled,
  activeDistrictException,
  currentMonthName,
  currentYear,
  alertPastMonthBlocked
} = useDateRestrictions()

const form = reactive({
  convenio: false,
  tipo: 'taller',
  vertiente: '',
  idcatcurso: '',
  tipo_publico: '',
  lugar: '',
  direccion: '',
  colonia: '',
  cp: '',
  nombre_contacto: '',
  telefono_contacto: '',
  num_personas: '',
  fecha_programada: '',
  hora_programada: '',
  personal_distrito: ''
})

const vertientes = [
  { id: 3, descripcion: 'Hombres' },
  { id: 2, descripcion: 'Jovenes' },
  { id: 1, descripcion: 'Mujeres' },
  { id: 5, descripcion: 'Poblacion en general' }
]

const resetCatalogSelections = () => {
  form.vertiente = ''
  form.idcatcurso = ''
  form.tipo_publico = ''
}

const onVertienteChange = () => {
  form.idcatcurso = ''
}

const resetForm = () => {
  form.convenio = false
  form.tipo = 'taller'
  form.vertiente = ''
  form.idcatcurso = ''
  form.tipo_publico = ''
  form.lugar = ''
  form.direccion = ''
  form.colonia = ''
  form.cp = ''
  form.nombre_contacto = ''
  form.telefono_contacto = ''
  form.num_personas = ''
  form.fecha_programada = ''
  form.hora_programada = ''
  form.personal_distrito = ''
}

const normalizeInt = (value) => {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? null : parsed
}

const cursosTaller = computed(() => {
  const vertiente = normalizeInt(form.vertiente)
  if (!vertiente) return []
  return catalogos.cursos.filter((curso) => Number.parseInt(curso.idtipo, 10) === vertiente)
})

const cursosIntervencion = computed(() =>
  catalogos.cursos.filter((curso) => Number.parseInt(curso.idtipo, 10) === 4)
)

const loadCatalogos = async () => {
  loadingCatalogos.value = true
  try {
    const { data } = await api.get('/reportes/catalogos')
    const payload = data?.data ?? data ?? {}
    catalogos.cursos = payload.cursos ?? []
    catalogos.tiposPublico = payload.tiposPublico ?? []
  } catch (error) {
    toast.error('No se pudieron cargar los catálogos. Intenta nuevamente.')
  } finally {
    loadingCatalogos.value = false
  }
}

const validate = () => {
  // Básica validación frontend (además de los 'required' del HTML)
  if (form.tipo === 'taller' && (!form.vertiente || !form.idcatcurso)) return false
  if (form.tipo === 'intervencion' && (!form.idcatcurso || !form.tipo_publico)) return false
  if (!form.lugar || !form.direccion || !form.colonia || !form.cp) return false
  if (!form.nombre_contacto || !form.telefono_contacto || !form.num_personas) return false
  if (!form.fecha_programada || !form.hora_programada || !form.personal_distrito) return false
  return true
}

const onSubmit = async () => {
  if (!isDateEnabled(form.fecha_programada, 'programacion')) {
    if (isGlobalDisabled.value) {
      Swal.fire({
        icon: 'warning',
        title: 'Sistema Cerrado',
        text: 'El periodo de captura y programación se encuentra inhabilitado globalmente en este momento.',
        confirmButtonColor: '#6B2D8B'
      })
      return
    }

    await alertPastMonthBlocked(form.fecha_programada, 'programacion')
    return
  }

  saving.value = true
  try {
    const payload = {
      convenio: form.convenio ? 1 : 0,
      vertiente: form.tipo === 'taller' ? normalizeInt(form.vertiente) : null,
      tipo_publico: form.tipo === 'intervencion' ? normalizeInt(form.tipo_publico) : null,
      idcatcurso: normalizeInt(form.idcatcurso),
      lugar: form.lugar.trim() || null,
      direccion: form.direccion.trim() || null,
      colonia: form.colonia.trim() || null,
      cp: form.cp.trim() || null,
      nombre_contacto: form.nombre_contacto.trim() || null,
      telefono_contacto: form.telefono_contacto.trim() || null,
      num_personas: normalizeInt(form.num_personas),
      fecha: form.fecha_programada || null,
      hora_programada: form.hora_programada || null,
      personal_distrito: form.personal_distrito.trim() || null
    }

    await api.post('/programacion', payload)
    
    await Swal.fire({
      icon: 'success',
      title: 'Programación guardada',
      text: 'La actividad fue registrada correctamente.',
      confirmButtonColor: '#6B2D8B',
      customClass: { popup: 'rounded-2xl', confirmButton: 'rounded-lg' }
    })
    resetForm()
  } catch (error) {
    toast.error('Verifica la información e intenta de nuevo.')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadCatalogos()
  loadRestrictions()
  if (vistaRef.value) animarVista(vistaRef.value)
})
</script>

<template>
  <div ref="vistaRef" class="space-y-6 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Encabezado (Header banner) -->
    <div class="rounded-2xl bg-[#403166] dark:bg-[#231A38] px-6 py-6 text-white shadow-iecm-sm flex flex-wrap items-center justify-between gap-6 relative overflow-hidden">
      <!-- Decoración de fondo -->
      <div class="absolute right-0 top-0 w-64 h-64 bg-white/5 opacity-20 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3"></div>
      
      <div class="flex items-start gap-4 relative z-10">
        <div class="p-3 bg-white/15 rounded-xl border border-white/20 shadow-sm">
          <CalendarPlus class="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 class="text-2xl font-bold tracking-tight text-white">Programación de Actividad</h2>
          <p class="text-purple-200 text-sm mt-1 max-w-lg">
            Registra un nuevo taller o intervención educativa en el calendario.
          </p>
        </div>
      </div>
    </div>

    <!-- Alerta de Restricciones Inteligente (Mes Vigente y Excepciones) -->
    <div v-if="!loadingConfig" class="w-full">
      <!-- Caso 1: Sistema cerrado globalmente -->
      <div v-if="isGlobalDisabled" class="bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm">
        <div class="flex items-center gap-3">
          <AlertCircle class="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
          <p class="text-sm text-slate-900 dark:text-red-100">
            <strong class="font-bold text-red-900 dark:text-red-300">Sistema cerrado:</strong> El periodo de programación se encuentra inhabilitado globalmente.
          </p>
        </div>
      </div>

      <!-- Caso 2: Excepción específica de distrito activa -->
      <div v-else-if="activeDistrictException" class="bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm">
        <div class="flex items-center gap-3">
          <CalendarClock class="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <p class="text-sm text-slate-900 dark:text-amber-100">
            <strong class="font-bold text-amber-900 dark:text-amber-300">Habilitación especial activa:</strong> Tu distrito cuenta con periodo autorizado para programar actividades del <strong class="font-semibold text-slate-900 dark:text-white">{{ activeDistrictException.fecha_inicio }}</strong> al <strong class="font-semibold text-slate-900 dark:text-white">{{ activeDistrictException.fecha_fin }}</strong>.
          </p>
        </div>
      </div>

      <!-- Caso 3: Operación regular en Mes Vigente -->
      <div v-else class="bg-emerald-50 dark:bg-emerald-950/30 border-l-4 border-emerald-500 p-4 rounded-r-lg shadow-sm">
        <div class="flex items-center gap-3">
          <CalendarDays class="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p class="text-sm text-slate-900 dark:text-emerald-100">
            <strong class="font-bold text-emerald-900 dark:text-emerald-300">Mes vigente habilitado:</strong> Puedes programar actividades para <strong class="font-semibold text-slate-900 dark:text-white">{{ currentMonthName }} {{ currentYear }}</strong>. Las actividades para meses anteriores requieren habilitación del Super Administrador.
          </p>
        </div>
      </div>
    </div>

    <form @submit.prevent="onSubmit" class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      <!-- Zona Principal: Secciones del Formulario (col-span-8) -->
      <div class="lg:col-span-8 space-y-6">

        <!-- Sección 1: Tipo de Actividad -->
        <AppCard>
          <template #header>
            <div class="flex items-center gap-2">
              <Building2 class="w-5 h-5 text-purple-200 dark:text-iecm-morado-400" />
              <h3 class="font-semibold text-white dark:text-iecm-morado-300">1. Tipo de Actividad</h3>
            </div>
          </template>
          
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-5">
            <!-- Convenio (fila completa) -->
            <div class="col-span-full">
              <label class="flex items-center gap-3 p-4 bg-iecm-gris dark:bg-iecm-dark-header border border-iecm-gris-200 dark:border-iecm-dark-border rounded-xl cursor-pointer hover:border-iecm-morado transition-colors">
                <div class="relative flex items-center justify-center">
                  <input v-model="form.convenio" type="checkbox" class="peer sr-only" />
                  <div class="w-5 h-5 rounded border-2 border-slate-300 peer-checked:border-iecm-morado peer-checked:bg-iecm-morado transition-all"></div>
                  <div class="absolute inset-0 flex items-center justify-center opacity-0 peer-checked:opacity-100 transition-opacity">
                    <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                </div>
                <span class="font-medium text-iecm-texto dark:text-iecm-dark-text">Se realiza mediante Convenio con delegación</span>
              </label>
            </div>

            <!-- Tipo -->
            <div class="col-span-1">
              <AppSelect v-model="form.tipo" label="Tipo" required @change="resetCatalogSelections">
                <option value="taller">Taller</option>
                <option value="intervencion">Intervención educativa</option>
              </AppSelect>
            </div>

            <!-- Caso Taller -->
            <template v-if="form.tipo === 'taller'">
              <div class="col-span-1">
                <AppSelect v-model="form.vertiente" label="Vertiente" required @change="onVertienteChange">
                  <option value="" disabled>Selecciona una vertiente</option>
                  <option v-for="item in vertientes" :key="item.id" :value="item.id">{{ item.descripcion }}</option>
                </AppSelect>
              </div>

              <div class="col-span-full xl:col-span-3">
                <AppSelect v-model="form.idcatcurso" label="Taller" required>
                  <option value="" disabled>{{ form.vertiente ? 'Selecciona un taller' : 'Selecciona una vertiente primero' }}</option>
                  <option v-for="curso in cursosTaller" :key="curso.idcurso" :value="curso.idcurso">{{ curso.descripcion }}</option>
                </AppSelect>
              </div>
            </template>

            <!-- Caso Intervención Educativa -->
            <template v-if="form.tipo === 'intervencion'">
              <div class="col-span-1 md:col-span-2 xl:col-span-2">
                <AppSelect v-model="form.idcatcurso" label="Intervención Educativa" required>
                  <option value="" disabled>{{ loadingCatalogos ? 'Cargando...' : 'Selecciona una intervención' }}</option>
                  <option v-for="curso in cursosIntervencion" :key="curso.idcurso" :value="curso.idcurso">{{ curso.descripcion }}</option>
                </AppSelect>
              </div>

              <div class="col-span-1">
                <AppSelect v-model="form.tipo_publico" label="Tipo de público" required>
                  <option value="" disabled>{{ loadingCatalogos ? 'Cargando...' : 'Selecciona el público' }}</option>
                  <option v-for="item in catalogos.tiposPublico" :key="item.idtipopublico ?? item.id" :value="item.idtipopublico ?? item.id">{{ item.descripcion }}</option>
                </AppSelect>
              </div>
            </template>
          </div>
        </AppCard>

        <!-- Sección 2: Ubicación y Contacto -->
        <AppCard>
          <template #header>
            <div class="flex items-center gap-2">
              <MapPin class="w-5 h-5 text-purple-200 dark:text-iecm-morado-400" />
              <h3 class="font-semibold text-white dark:text-iecm-morado-300">2. Ubicación y Datos de Contacto</h3>
            </div>
          </template>
          
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-5">
            <!-- Institución / Lugar (fila completa) -->
            <div class="col-span-full">
              <AppInput v-model="form.lugar" label="Nombre de la Institución / Lugar" required />
            </div>

            <!-- Calle y número (2 columnas) -->
            <div class="col-span-1 md:col-span-2 xl:col-span-2">
              <AppInput v-model="form.direccion" label="Calle y número" required />
            </div>

            <!-- Colonia -->
            <div class="col-span-1">
              <AppInput v-model="form.colonia" label="Colonia" required />
            </div>

            <!-- Código Postal -->
            <div class="col-span-1">
              <AppInput v-model="form.cp" label="Código Postal" maxlength="6" required />
            </div>

            <!-- Subtítulo / Separador Contacto -->
            <div class="col-span-full border-t border-slate-100 dark:border-white/5 pt-3 mt-1">
              <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Contact class="w-4 h-4 text-iecm-morado dark:text-iecm-morado-400" />
                <span>Datos del Contacto y Aforo</span>
              </div>
            </div>

            <!-- Nombre de contacto -->
            <div class="col-span-1 md:col-span-2 xl:col-span-1">
              <AppInput v-model="form.nombre_contacto" label="Nombre del Contacto" required>
                <template #icon><Contact class="w-4 h-4" /></template>
              </AppInput>
            </div>

            <!-- Teléfono de contacto -->
            <div class="col-span-1">
              <AppInput v-model="form.telefono_contacto" label="Teléfono de Contacto" required />
            </div>

            <!-- Número estimado de personas -->
            <div class="col-span-1">
              <AppInput v-model="form.num_personas" type="number" min="1" label="Núm. estimado de personas a atender" required>
                <template #icon><Users class="w-4 h-4" /></template>
              </AppInput>
            </div>
          </div>
        </AppCard>

        <!-- Sección 3: Programación -->
        <AppCard>
          <template #header>
            <div class="flex items-center gap-2">
              <Clock class="w-5 h-5 text-purple-200 dark:text-iecm-morado-400" />
              <h3 class="font-semibold text-white dark:text-iecm-morado-300">3. Fecha y Personal</h3>
            </div>
          </template>
          
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-5">
            <!-- Fecha programada -->
            <div class="col-span-1">
              <AppInput 
                v-model="form.fecha_programada" 
                type="date" 
                label="Fecha programada" 
                required 
              />
            </div>

            <!-- Hora programada -->
            <div class="col-span-1">
              <AppInput v-model="form.hora_programada" type="time" label="Hora programada" required />
            </div>

            <!-- Tip de ayuda en xl -->
            <div class="hidden xl:flex items-center p-3 bg-purple-50/60 dark:bg-iecm-morado-950/20 rounded-xl border border-iecm-morado/15 text-xs text-slate-600 dark:text-slate-400 gap-2.5">
              <Clock class="w-4 h-4 text-iecm-morado dark:text-iecm-morado-400 shrink-0" />
              <span>Horario de programación según disponibilidad del personal distrital.</span>
            </div>
            
            <!-- Personal del distrito (fila completa) -->
            <div class="col-span-full">
              <label class="label-iecm">Nombre de las personas que atenderán el compromiso (Órgano Desconcentrado) *</label>
              <textarea
                v-model="form.personal_distrito"
                rows="3"
                required
                class="input-iecm resize-y"
                placeholder="Escribe los nombres aquí..."
              ></textarea>
            </div>
          </div>
        </AppCard>

      </div>

      <!-- Zona Lateral: Panel Sticky de Resumen y Acciones (col-span-4) -->
      <aside class="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
        <!-- Tarjeta de Resumen -->
        <AppCard>
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Clock class="w-5 h-5 text-purple-200 dark:text-iecm-morado-400" />
                <h3 class="font-semibold text-white">Resumen de Actividad</h3>
              </div>
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/20">
                {{ form.tipo === 'taller' ? 'Taller' : 'Intervención' }}
              </span>
            </div>
          </template>

          <div class="space-y-4 text-sm">
            <!-- Badge Convenio si aplica -->
            <div v-if="form.convenio" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 w-full">
              <CheckCircle class="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Mediante Convenio con delegación</span>
            </div>

            <!-- Taller / Intervención Seleccionada -->
            <div class="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-white/5 space-y-1">
              <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                {{ form.tipo === 'taller' ? 'Taller seleccionado' : 'Intervención seleccionada' }}
              </span>
              <p class="font-semibold text-slate-900 dark:text-white text-xs leading-relaxed">
                <template v-if="form.tipo === 'taller'">
                  {{ cursosTaller.find(c => c.idcurso === normalizeInt(form.idcatcurso))?.descripcion || 'Selecciona vertiente y taller' }}
                </template>
                <template v-else>
                  {{ cursosIntervencion.find(c => c.idcurso === normalizeInt(form.idcatcurso))?.descripcion || 'Selecciona una intervención' }}
                </template>
              </p>
              <p v-if="form.tipo === 'taller' && form.vertiente" class="text-[11px] text-iecm-morado dark:text-iecm-morado-300 font-medium">
                Vertiente: {{ vertientes.find(v => v.id === normalizeInt(form.vertiente))?.descripcion || '' }}
              </p>
              <p v-else-if="form.tipo === 'intervencion' && form.tipo_publico" class="text-[11px] text-iecm-morado dark:text-iecm-morado-300 font-medium">
                Público: {{ catalogos.tiposPublico.find(tp => (tp.idtipopublico ?? tp.id) === normalizeInt(form.tipo_publico))?.descripcion || '' }}
              </p>
            </div>

            <!-- Ubicación y Lugar -->
            <div class="space-y-1">
              <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1">
                <MapPin class="w-3.5 h-3.5 text-slate-400" />
                Sede / Ubicación
              </span>
              <p class="font-medium text-slate-800 dark:text-slate-200 text-xs">
                {{ form.lugar || 'Institución no definida' }}
              </p>
              <p v-if="form.direccion || form.colonia" class="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {{ [form.direccion, form.colonia, form.cp ? 'CP ' + form.cp : ''].filter(Boolean).join(', ') }}
              </p>
            </div>

            <!-- Fecha y Hora -->
            <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
              <div>
                <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <CalendarDays class="w-3.5 h-3.5 text-slate-400" />
                  Fecha
                </span>
                <p class="font-semibold text-slate-900 dark:text-white text-xs mt-0.5">
                  {{ form.fecha_programada || 'Pendiente' }}
                </p>
              </div>
              <div>
                <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <Clock class="w-3.5 h-3.5 text-slate-400" />
                  Hora
                </span>
                <p class="font-semibold text-slate-900 dark:text-white text-xs mt-0.5">
                  {{ form.hora_programada || 'Pendiente' }}
                </p>
              </div>
            </div>

            <!-- Personas estimadas y Contacto -->
            <div v-if="form.num_personas || form.nombre_contacto" class="pt-2 border-t border-slate-100 dark:border-white/5 space-y-1.5">
              <div v-if="form.num_personas" class="flex items-center justify-between text-xs">
                <span class="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Users class="w-3.5 h-3.5 text-slate-400" /> Aforo estimado:
                </span>
                <span class="font-semibold text-slate-800 dark:text-slate-200">{{ form.num_personas }} personas</span>
              </div>
              <div v-if="form.nombre_contacto" class="flex items-center justify-between text-xs">
                <span class="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Contact class="w-3.5 h-3.5 text-slate-400" /> Contacto:
                </span>
                <span class="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[140px]">{{ form.nombre_contacto }}</span>
              </div>
            </div>

            <!-- Botones de Acción -->
            <div class="pt-4 border-t border-slate-100 dark:border-white/5 space-y-2.5">
              <AppButton 
                type="submit" 
                variant="primary" 
                size="lg" 
                :loading="saving" 
                class="w-full justify-center shadow-lg shadow-iecm-morado/20"
              >
                <template #icon v-if="!saving"><Save class="w-5 h-5" /></template>
                Guardar Programación
              </AppButton>
              <button
                type="button"
                @click="resetForm"
                class="w-full py-2 text-xs font-medium text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors text-center cursor-pointer"
              >
                Limpiar formulario
              </button>
            </div>
          </div>
        </AppCard>

        <!-- Indicador de Mes Vigente / Ayuda -->
        <div class="p-4 bg-purple-50/70 dark:bg-iecm-morado-950/20 border border-iecm-morado/20 rounded-2xl text-xs text-slate-600 dark:text-slate-300 space-y-2">
          <div class="flex items-center gap-2 text-iecm-morado dark:text-iecm-morado-300 font-semibold">
            <CalendarDays class="w-4 h-4 shrink-0" />
            <span>Programación en Mes Vigente</span>
          </div>
          <p class="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            El sistema registra automáticamente la fecha de alta institucional. Verifica que todos los datos y la disponibilidad sean correctos antes de enviar.
          </p>
        </div>
      </aside>

    </form>
  </div>
</template>
