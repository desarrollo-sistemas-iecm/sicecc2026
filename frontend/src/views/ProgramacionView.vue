<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import Swal from 'sweetalert2'
import { CalendarPlus, Save, Users, Building2, MapPin, Contact, Clock } from '@lucide/vue'
import api from '../services/api.js'
import { useToast } from '../composables/useToast.js'
import { useGsapAnimations } from '../composables/useGsapAnimations.js'

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

const dateConfig = ref({
  habilitado: true,
  fecha_inicio: null,
  fecha_fin: null
})

const loadingConfig = ref(true)

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

const loadDateConfig = async () => {
  loadingConfig.value = true
  try {
    const { data } = await api.get('/admin/restricciones')
    if (data.success && data.data) {
      const configs = data.data.filter(c => c.modulo === 'programacion')
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

const solicitarExcepcion = async (fecha) => {
  try {
    const { data } = await api.post('/admin/restricciones/solicitar', {
      fecha_solicitada: fecha,
      modulo: 'programacion'
    })
    if (data.success) {
      Swal.fire('Solicitud enviada', 'El Super Administrador revisará tu solicitud.', 'success')
    }
  } catch (error) {
    Swal.fire('Error', 'No se pudo enviar la solicitud.', 'error')
  }
}

const onSubmit = async () => {
  if (!dateConfig.value.habilitado) {
    const { isConfirmed } = await Swal.fire({
      icon: 'warning',
      title: 'Sistema Cerrado',
      text: 'El periodo de captura y programación se encuentra inhabilitado. ¿Deseas solicitar una excepción al Super Administrador para esta fecha?',
      showCancelButton: true,
      confirmButtonText: 'Solicitar Excepción',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#6B2D8B'
    })
    
    if (isConfirmed) {
      await solicitarExcepcion(form.fecha_programada)
    }
    return
  }

  // Verificar rango si está habilitado pero tiene fechas limitantes
  if (dateConfig.value.fecha_inicio && dateConfig.value.fecha_fin) {
    if (form.fecha_programada < dateConfig.value.fecha_inicio || form.fecha_programada > dateConfig.value.fecha_fin) {
      const { isConfirmed } = await Swal.fire({
        icon: 'warning',
        title: 'Fecha fuera de rango',
        text: `La fecha seleccionada (${form.fecha_programada}) está fuera del rango habilitado (${dateConfig.value.fecha_inicio} a ${dateConfig.value.fecha_fin}). ¿Deseas solicitar una excepción?`,
        showCancelButton: true,
        confirmButtonText: 'Solicitar Excepción',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#6B2D8B'
      })
      
      if (isConfirmed) {
        await solicitarExcepcion(form.fecha_programada)
      }
      return
    }
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
  loadDateConfig()
  if (vistaRef.value) animarVista(vistaRef.value)
})
</script>

<template>
  <div ref="vistaRef" class="space-y-6 max-w-4xl mx-auto">
    <!-- Encabezado (Header banner) -->
    <div class="rounded-2xl bg-gradient-iecm px-6 py-6 text-white shadow-iecm-sm flex flex-wrap items-center justify-between gap-6 relative overflow-hidden">
      <!-- Decoración de fondo -->
      <div class="absolute right-0 top-0 w-64 h-64 bg-white dark:bg-slate-900 opacity-5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3"></div>
      
      <div class="flex items-start gap-4 relative z-10">
        <div class="p-3 bg-white dark:bg-slate-800 rounded-xl border border-white/20 dark:border-white/10 shadow-sm">
          <CalendarPlus class="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 class="text-2xl font-bold tracking-tight">Programación de Actividad</h2>
          <p class="text-purple-100 text-sm mt-1 max-w-lg">
            Registra un nuevo taller o intervención educativa en el calendario.
          </p>
        </div>
      </div>
    </div>

    <!-- Alerta de Restricciones -->
    <div v-if="!loadingConfig && !dateConfig.habilitado" class="bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 p-4 rounded-r-lg">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-amber-700">
            <strong>Aviso:</strong> El periodo de programación se encuentra inhabilitado. Si necesitas registrar una actividad, se enviará una solicitud de excepción al administrador.
          </p>
        </div>
      </div>
    </div>
    <div v-else-if="!loadingConfig && dateConfig.fecha_inicio && dateConfig.fecha_fin" class="bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500 p-4 rounded-r-lg">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-blue-700">
            <strong>Periodo habilitado:</strong> Sólo se pueden programar actividades entre el {{ dateConfig.fecha_inicio }} y el {{ dateConfig.fecha_fin }}.
          </p>
        </div>
      </div>
    </div>

    <form @submit.prevent="onSubmit" class="space-y-6">
      
      <!-- Sección 1: Tipo de Actividad -->
      <AppCard>
        <template #header>
          <div class="flex items-center gap-2">
            <Building2 class="w-5 h-5 text-iecm-morado dark:text-iecm-morado-400" />
            <h3 class="font-semibold text-iecm-morado-800 dark:text-iecm-morado-300">1. Tipo de Actividad</h3>
          </div>
        </template>
        
        <div class="grid md:grid-cols-2 gap-6">
          <div class="md:col-span-2">
            <label class="flex items-center gap-3 p-4 bg-iecm-gris dark:bg-slate-950 border border-iecm-gris-200 dark:border-white/10 rounded-xl cursor-pointer hover:border-iecm-morado-300 transition-colors">
              <div class="relative flex items-center justify-center">
                <input v-model="form.convenio" type="checkbox" class="peer sr-only" />
                <div class="w-5 h-5 rounded border-2 border-slate-300 peer-checked:border-iecm-morado peer-checked:bg-iecm-morado transition-all"></div>
                <div class="absolute inset-0 flex items-center justify-center opacity-0 peer-checked:opacity-100 transition-opacity">
                  <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>
                </div>
              </div>
              <span class="font-medium text-slate-700 dark:text-slate-300">Se realiza mediante Convenio con delegación</span>
            </label>
          </div>

          <AppSelect v-model="form.tipo" label="Tipo" required @change="resetCatalogSelections">
            <option value="taller">Taller</option>
            <option value="intervencion">Intervención educativa</option>
          </AppSelect>

          <template v-if="form.tipo === 'taller'">
            <AppSelect v-model="form.vertiente" label="Vertiente" required @change="onVertienteChange">
              <option value="" disabled>Selecciona una vertiente</option>
              <option v-for="item in vertientes" :key="item.id" :value="item.id">{{ item.descripcion }}</option>
            </AppSelect>

            <AppSelect v-model="form.idcatcurso" label="Taller" required class="md:col-span-2">
              <option value="" disabled>{{ form.vertiente ? 'Selecciona un taller' : 'Selecciona una vertiente primero' }}</option>
              <option v-for="curso in cursosTaller" :key="curso.idcurso" :value="curso.idcurso">{{ curso.descripcion }}</option>
            </AppSelect>
          </template>

          <template v-if="form.tipo === 'intervencion'">
            <AppSelect v-model="form.idcatcurso" label="Intervención Educativa" required>
              <option value="" disabled>{{ loadingCatalogos ? 'Cargando...' : 'Selecciona una intervención' }}</option>
              <option v-for="curso in cursosIntervencion" :key="curso.idcurso" :value="curso.idcurso">{{ curso.descripcion }}</option>
            </AppSelect>

            <AppSelect v-model="form.tipo_publico" label="Tipo de público" required>
              <option value="" disabled>{{ loadingCatalogos ? 'Cargando...' : 'Selecciona el público' }}</option>
              <option v-for="item in catalogos.tiposPublico" :key="item.idtipopublico ?? item.id" :value="item.idtipopublico ?? item.id">{{ item.descripcion }}</option>
            </AppSelect>
          </template>
        </div>
      </AppCard>

      <!-- Sección 2: Ubicación y Contacto -->
      <AppCard>
        <template #header>
          <div class="flex items-center gap-2">
            <MapPin class="w-5 h-5 text-iecm-morado dark:text-iecm-morado-400" />
            <h3 class="font-semibold text-iecm-morado-800 dark:text-iecm-morado-300">2. Ubicación y Datos de Contacto</h3>
          </div>
        </template>
        
        <div class="grid md:grid-cols-2 gap-6">
          <AppInput v-model="form.lugar" label="Nombre de la Institución / Lugar" required class="md:col-span-2" />
          <AppInput v-model="form.direccion" label="Calle y número" required />
          <AppInput v-model="form.colonia" label="Colonia" required />
          <AppInput v-model="form.cp" label="Código Postal" maxlength="6" required />
          <div class="hidden md:block"></div> <!-- spacer -->

          <div class="md:col-span-2 border-t border-slate-100 dark:border-white/5 pt-4 mt-2 grid md:grid-cols-2 gap-6">
            <AppInput v-model="form.nombre_contacto" label="Nombre del Contacto" required>
              <template #icon><Contact class="w-4 h-4" /></template>
            </AppInput>
            <AppInput v-model="form.telefono_contacto" label="Teléfono de Contacto" required />
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
            <Clock class="w-5 h-5 text-iecm-morado dark:text-iecm-morado-400" />
            <h3 class="font-semibold text-iecm-morado-800 dark:text-iecm-morado-300">3. Fecha y Personal</h3>
          </div>
        </template>
        
        <div class="grid md:grid-cols-2 gap-6">
          <AppInput 
            v-model="form.fecha_programada" 
            type="date" 
            label="Fecha programada" 
            required 
            :min="dateConfig?.fecha_inicio" 
            :max="dateConfig?.fecha_fin"
          />
          <AppInput v-model="form.hora_programada" type="time" label="Hora programada" required />
          
          <div class="md:col-span-2">
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

      <div class="flex justify-end pt-4 pb-8">
        <AppButton type="submit" variant="primary" size="lg" :loading="saving" class="min-w-[200px]">
          <template #icon v-if="!saving"><Save class="w-5 h-5" /></template>
          Guardar Programación
        </AppButton>
      </div>

    </form>
  </div>
</template>
