<script setup>
import { computed, reactive, ref, watch, onMounted } from 'vue'
import Swal from 'sweetalert2'
import { FileText, Save, Settings, UserCircle, MessageSquareQuote } from '@lucide/vue'
import api from '../services/api.js'
import { useAuthStore } from '../stores/authStore.js'
import { useGsapAnimations } from '../composables/useGsapAnimations.js'
import { useToast } from '../composables/useToast.js'

import AppCard from '../components/ui/AppCard.vue'
import AppInput from '../components/ui/AppInput.vue'
import AppSelect from '../components/ui/AppSelect.vue'
import AppButton from '../components/ui/AppButton.vue'

const authStore = useAuthStore()
const { animarVista } = useGsapAnimations()
const toast = useToast()

const vistaRef = ref(null)

const vertientes = [
  { id: 1, label: 'Mujeres' },
  { id: 2, label: 'Jóvenes' },
  { id: 3, label: 'Hombres' },
  { id: 5, label: 'Población en general' }
]

const escalaLikert = [
  { value: 1, label: 'Totalmente de acuerdo' },
  { value: 2, label: 'De acuerdo' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'En desacuerdo' },
  { value: 5, label: 'Totalmente en desacuerdo' }
]

const INTERVENCION_VERTIENTE_ID = 4

const form = reactive({
  tipo: '',
  vertiente: '',
  curso: '',
  folio: '',
  edad: '',
  genero: '',
  etiqueta3: '',
  etiqueta4: '',
  etiqueta5: '',
  etiqueta6: '',
  etiqueta7: '',
  etiqueta8: ''
})

const errors = reactive({})
const cursos = ref([])
const loadingCursos = ref(false)
const saving = ref(false)

const cursoSeleccionado = computed(() => {
  const found = cursos.value.find((item) => String(item.idcurso) === String(form.curso))
  return found?.descripcion || ''
})

const clearErrors = () => {
  Object.keys(errors).forEach((key) => {
    errors[key] = ''
  })
}

const resetAnswers = () => {
  form.edad = ''
  form.genero = ''
  form.etiqueta3 = ''
  form.etiqueta4 = ''
  form.etiqueta5 = ''
  form.etiqueta6 = ''
  form.etiqueta7 = ''
  form.etiqueta8 = ''
}

const resetCatalog = () => {
  form.vertiente = ''
  form.curso = ''
  form.folio = ''
  cursos.value = []
}

const loadCursos = async (vertienteId) => {
  if (!vertienteId) return
  loadingCursos.value = true
  try {
    const { data } = await api.get('/cursos', { params: { vertiente: vertienteId } })
    cursos.value = data?.data ?? []
  } catch (error) {
    toast.error('No se pudieron cargar los cursos. Intenta nuevamente.')
  } finally {
    loadingCursos.value = false
  }
}

const generateFolio = async () => {
  if (!form.tipo || !form.curso) return
  try {
    const { data } = await api.get('/encuestas/folio', {
      params: {
        distrito: authStore.user?.idsede,
        tipo: form.tipo
      }
    })
    form.folio = data?.folio || ''
  } catch (error) {
    toast.error('No se pudo generar el folio. Verifica la conexión.')
  }
}

const validate = () => {
  clearErrors()

  if (!form.tipo) errors.tipo = 'Selecciona un tipo.'
  if (form.tipo === 'T' && !form.vertiente) errors.vertiente = 'Selecciona una vertiente.'
  if (!form.curso) errors.curso = 'Selecciona un curso.'
  if (!form.folio) errors.folio = 'Genera el folio antes de guardar.'

  const edadNum = Number(form.edad)
  if (!form.edad || Number.isNaN(edadNum) || edadNum < 1 || edadNum > 120) {
    errors.edad = 'Edad válida requerida (1-120).'
  }

  if (!form.genero) errors.genero = 'Selecciona un género.'
  if (!form.etiqueta3) errors.etiqueta3 = 'P3 requerida.'
  if (!form.etiqueta4) errors.etiqueta4 = 'P4 requerida.'
  if (!form.etiqueta5) errors.etiqueta5 = 'P5 requerida.'
  if (!form.etiqueta6) errors.etiqueta6 = 'P6 requerida.'
  if (!form.etiqueta7) errors.etiqueta7 = 'P7 requerida.'
  if (!form.etiqueta8) errors.etiqueta8 = 'P8 requerida.'

  return Object.values(errors).every((value) => !value)
}

const onSubmit = async () => {
  if (!validate()) {
    toast.warning('Completa todos los campos obligatorios antes de guardar.')
    return
  }

  const { isConfirmed } = await Swal.fire({
    title: '¿Guardar encuesta?',
    html: `<b>Folio:</b> ${form.folio}<br><small class="text-slate-500 dark:text-slate-400">${cursoSeleccionado.value}</small>`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#6B2D8B', // iecm-morado
    cancelButtonColor: '#94a3b8',
    confirmButtonText: 'Sí, guardar',
    cancelButtonText: 'Cancelar',
    customClass: { popup: 'rounded-2xl', confirmButton: 'rounded-lg', cancelButton: 'rounded-lg' }
  })

  if (!isConfirmed) return

  saving.value = true
  try {
    const payload = {
      tipo: Number(form.curso),
      vertiente: form.vertiente ? Number(form.vertiente) : null,
      folio_encuesta: form.folio,
      edad: Number(form.edad),
      genero: Number(form.genero),
      etiqueta2: Number(form.etiqueta3),
      etiqueta3: Number(form.etiqueta4),
      etiqueta4: Number(form.etiqueta5),
      etiqueta5: Number(form.etiqueta6),
      etiqueta6: Number(form.etiqueta7),
      etiqueta7: Number(form.etiqueta8)
    }

    const { data } = await api.post('/encuestas', payload)

    toast.success(`Encuesta guardada correctamente. Folio: ${data?.folio_encuesta || form.folio}`)

    resetCatalog()
    resetAnswers()
    form.tipo = ''
    clearErrors()
  } catch (error) {
    toast.error(error?.response?.data?.message || 'Error al guardar la encuesta.')
  } finally {
    saving.value = false
  }
}

watch(
  () => form.tipo,
  async (value) => {
    resetCatalog()
    resetAnswers()
    if (value === 'I') {
      form.vertiente = String(INTERVENCION_VERTIENTE_ID)
      await loadCursos(INTERVENCION_VERTIENTE_ID)
    }
  }
)

watch(
  () => form.vertiente,
  async (value) => {
    if (form.tipo === 'T' && value) {
      form.curso = ''
      form.folio = ''
      await loadCursos(Number(value))
    }
  }
)

watch(
  () => form.curso,
  async (value) => {
    if (value) {
      await generateFolio()
    }
  }
)

onMounted(() => {
  if (vistaRef.value) animarVista(vistaRef.value)
})
</script>

<template>
  <div ref="vistaRef" class="space-y-6 max-w-5xl mx-auto pb-12">
    <!-- Encabezado con Folio (Header banner) -->
    <div class="rounded-2xl bg-[#403166] dark:bg-[#231A38] px-6 py-6 text-white shadow-iecm-sm flex flex-wrap items-center justify-between gap-6 relative overflow-hidden">
      <!-- Decoración de fondo -->
      <div class="absolute right-0 top-0 w-64 h-64 bg-white/5 opacity-20 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3"></div>
      
      <div class="flex items-start gap-4 relative z-10">
        <div class="p-3 bg-white/15 rounded-xl border border-white/20 shadow-sm">
          <FileText class="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 class="text-2xl font-bold tracking-tight text-white">Encuesta de satisfacción</h2>
          <p class="text-purple-200 text-sm mt-1 max-w-lg">
            Captura de opiniones de los asistentes al taller o intervención educativa.
          </p>
        </div>
      </div>

      <div class="rounded-xl bg-white/15 border border-white/20 px-5 py-3 min-w-[140px] shadow-sm relative z-10">
        <p class="text-xs uppercase text-purple-200 font-semibold tracking-wider mb-1">Folio Actual</p>
        <p class="text-2xl font-bold font-mono text-white">{{ form.folio || '—' }}</p>
      </div>
    </div>

    <form @submit.prevent="onSubmit" class="space-y-6">
      
      <div class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        
        <!-- Bloque 1: Configuración -->
        <AppCard>
          <template #header>
            <div class="flex items-center gap-2">
              <Settings class="w-5 h-5 text-iecm-morado dark:text-iecm-morado-400" />
              <h3 class="font-semibold text-iecm-morado-800 dark:text-iecm-morado-300">1. Datos de la Actividad</h3>
            </div>
          </template>
          
          <div class="grid gap-4 sm:grid-cols-2">
            <AppSelect v-model="form.tipo" label="Tipo" required :error="errors.tipo">
              <option value="" disabled>Selecciona una opción</option>
              <option value="T">Taller</option>
              <option value="I">Intervención educativa</option>
            </AppSelect>

            <AppSelect v-if="form.tipo === 'T'" v-model="form.vertiente" label="Vertiente" required :error="errors.vertiente">
              <option value="" disabled>Selecciona una vertiente</option>
              <option v-for="item in vertientes" :key="item.id" :value="item.id">{{ item.label }}</option>
            </AppSelect>

            <AppSelect v-model="form.curso" :label="form.tipo === 'I' ? 'Intervención' : 'Taller'" required :error="errors.curso" class="sm:col-span-2">
              <option value="" disabled>{{ loadingCursos ? 'Cargando...' : form.tipo ? 'Selecciona una opción' : 'Selecciona un tipo primero' }}</option>
              <option v-for="curso in cursos" :key="curso.idcurso" :value="curso.idcurso">{{ curso.descripcion }}</option>
            </AppSelect>

            <AppInput v-model="form.folio" label="Folio Autogenerado" readonly disabled class="sm:col-span-2" :error="errors.folio" />
          </div>
        </AppCard>

        <!-- Bloque 2: Datos Personales -->
        <AppCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UserCircle class="w-5 h-5 text-iecm-morado dark:text-iecm-morado-400" />
              <h3 class="font-semibold text-iecm-morado-800 dark:text-iecm-morado-300">2. Perfil del Asistente</h3>
            </div>
          </template>

          <div class="space-y-6">
            <AppInput 
              v-model="form.edad" 
              type="number" 
              min="1" 
              max="120" 
              label="P1. Edad" 
              required 
              :error="errors.edad" 
            />

            <div>
              <label class="label-iecm">P2. Género *</label>
              <div class="grid grid-cols-3 gap-3 mt-2">
                <label class="flex items-center justify-center gap-2 p-3 border border-slate-200 dark:border-white/10 rounded-lg cursor-pointer transition-colors hover:border-iecm-morado has-[:checked]:border-iecm-morado has-[:checked]:bg-iecm-morado-50 dark:has-[:checked]:bg-iecm-morado-950/30 has-[:checked]:text-iecm-morado dark:has-[:checked]:text-iecm-morado-400">
                  <input v-model="form.genero" type="radio" value="2" class="sr-only" /> <!-- 2: Femenino (según uso común IECM o ajustar al legado) -->
                  <span class="text-sm font-medium">Mujer</span>
                </label>
                <label class="flex items-center justify-center gap-2 p-3 border border-slate-200 dark:border-white/10 rounded-lg cursor-pointer transition-colors hover:border-iecm-morado has-[:checked]:border-iecm-morado has-[:checked]:bg-iecm-morado-50 dark:has-[:checked]:bg-iecm-morado-950/30 has-[:checked]:text-iecm-morado dark:has-[:checked]:text-iecm-morado-400">
                  <input v-model="form.genero" type="radio" value="1" class="sr-only" /> <!-- 1: Masculino -->
                  <span class="text-sm font-medium">Hombre</span>
                </label>
                <label class="flex items-center justify-center gap-2 p-3 border border-slate-200 dark:border-white/10 rounded-lg cursor-pointer transition-colors hover:border-iecm-morado has-[:checked]:border-iecm-morado has-[:checked]:bg-iecm-morado-50 dark:has-[:checked]:bg-iecm-morado-950/30 has-[:checked]:text-iecm-morado dark:has-[:checked]:text-iecm-morado-400">
                  <input v-model="form.genero" type="radio" value="3" class="sr-only" />
                  <span class="text-sm font-medium">Otro</span>
                </label>
              </div>
              <p v-if="errors.genero" class="mt-1.5 text-xs text-red-600 font-medium">{{ errors.genero }}</p>
            </div>
          </div>
        </AppCard>

      </div>

      <!-- Bloque 3: Cuestionario -->
      <AppCard>
        <template #header>
          <div class="flex items-center gap-2">
            <MessageSquareQuote class="w-5 h-5 text-iecm-morado dark:text-iecm-morado-400" />
            <h3 class="font-semibold text-iecm-morado-800 dark:text-iecm-morado-300">3. Cuestionario de Satisfacción</h3>
          </div>
        </template>

        <div class="space-y-4">
          <!-- Iterar preguntas para no repetir tanto código HTML -->
          <div 
            v-for="(pregunta, index) in [
              { id: 'etiqueta3', texto: 'P3. La acción educativa cumplió con mis expectativas.' },
              { id: 'etiqueta4', texto: 'P4. Las personas que impartieron la acción educativa trataron el tema de forma clara.' },
              { id: 'etiqueta5', texto: 'P5. La temática abordada es aplicable a mi vida personal o laboral.' },
              { id: 'etiqueta6', texto: 'P6. El formato previsto para el desarrollo de la actividad educativa motiva mi participación.' },
              { id: 'etiqueta7', texto: 'P7. Las dudas, inquietudes y comentarios fueron atendidos adecuadamente.' },
              { id: 'etiqueta8', texto: 'P8. ¿Consideras que esta actividad del IECM contribuye a la consolidación de la cultura democrática entre las personas habitantes de la Ciudad de México?', dashed: true }
            ]" 
            :key="pregunta.id"
            :class="[
              'p-5 rounded-xl border transition-colors',
              pregunta.dashed ? 'border-dashed border-slate-300 bg-slate-50/50 dark:bg-slate-900/20' : 'border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 hover:border-iecm-morado-200 dark:hover:border-iecm-morado-500/50 hover:bg-iecm-morado-50/30'
            ]"
          >
            <p class="text-sm font-medium text-slate-800 dark:text-slate-200 mb-4">{{ pregunta.texto }} <span class="text-red-500">*</span></p>
            
            <div class="grid grid-cols-2 md:grid-cols-5 gap-2">
              <label 
                v-for="item in escalaLikert" 
                :key="`${pregunta.id}-${item.value}`" 
                class="flex flex-col items-center justify-center p-3 text-center border border-slate-200 dark:border-white/10 rounded-lg cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 has-[:checked]:border-iecm-morado has-[:checked]:bg-iecm-morado-50 dark:has-[:checked]:bg-iecm-morado-950/30 has-[:checked]:shadow-sm"
              >
                <input v-model="form[pregunta.id]" type="radio" :value="String(item.value)" class="sr-only" />
                <div class="w-4 h-4 rounded-full border-2 border-slate-300 mb-2 flex items-center justify-center">
                  <div class="w-2 h-2 rounded-full bg-iecm-morado opacity-0 transition-opacity" :class="{'opacity-100': form[pregunta.id] === String(item.value)}"></div>
                </div>
                <span class="text-[11px] leading-tight font-medium text-slate-600 dark:text-slate-400" :class="{'text-iecm-morado dark:text-iecm-morado-400 font-semibold': form[pregunta.id] === String(item.value)}">{{ item.label }}</span>
              </label>
            </div>
            <p v-if="errors[pregunta.id]" class="mt-2 text-xs text-red-600 font-medium">{{ errors[pregunta.id] }}</p>
          </div>
        </div>

        <template #footer>
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p class="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span class="text-red-500">*</span> Campos obligatorios
            </p>
            <AppButton type="submit" variant="primary" size="lg" :loading="saving" class="w-full sm:w-auto min-w-[200px]">
              <template #icon v-if="!saving"><Save class="w-5 h-5" /></template>
              Guardar Encuesta
            </AppButton>
          </div>
        </template>
      </AppCard>

    </form>
  </div>
</template>
