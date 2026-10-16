<script setup>
import { computed, ref, watch } from 'vue'
import Swal from 'sweetalert2'
import api from '../../services/api.js'
import AppModal from '../AppModal.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  actividad: { type: Object, default: null }
})

const emit = defineEmits(['close', 'saved'])

const modalidad = ref('')
const duracionhrs = ref('')
const duracionmin = ref('')
const comentarios = ref('')
const saving = ref(false)
const touched = ref(false)

const mujeres = ref(Array.from({ length: 8 }, () => 0))
const hombres = ref(Array.from({ length: 8 }, () => 0))

const anexo1 = ref(null)
const anexo2 = ref(null)
const imagen = ref(null)
const justSaved = ref(false)

const titulo = computed(() => (props.actividad?.curso ?? props.actividad?.taller ?? '').toUpperCase())
const archivoActual1 = ref('')
const archivoActual2 = ref('')
const archivoActual3 = ref('')
const carpetaActual = ref('')

const ageLabels = ['0-12', '13-16', '17-20', '21-30', '31-40', '41-50', '51-61', '>62']

const rowTotals = computed(() => {
  const totalMujeres = mujeres.value.reduce((acc, val) => acc + Number(val || 0), 0)
  const totalHombres = hombres.value.reduce((acc, val) => acc + Number(val || 0), 0)
  return { totalMujeres, totalHombres, totalGeneral: totalMujeres + totalHombres }
})

const colTotals = computed(() => {
  return ageLabels.map((_, idx) => Number(mujeres.value[idx] || 0) + Number(hombres.value[idx] || 0))
})

const isValidModalidad = computed(() => modalidad.value === '0' || modalidad.value === '1')
const isValidDuracion = computed(() => {
  const hrs = Number(duracionhrs.value)
  const min = Number(duracionmin.value)
  return Number.isFinite(hrs) && Number.isFinite(min) && hrs >= 0 && min >= 0
})
const hasPoblacion = computed(() => rowTotals.value.totalGeneral > 0)

const validateFile = (file, type) => {
  if (!file) return { ok: true }
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) return { ok: false, message: 'El archivo excede 5MB.' }
  if (type === 'pdf' && file.type !== 'application/pdf') {
    return { ok: false, message: 'El archivo debe ser PDF.' }
  }
  if (type === 'image' && !file.type.startsWith('image/')) {
    return { ok: false, message: 'La imagen debe ser JPG, PNG o GIF.' }
  }
  return { ok: true }
}

const filesValid = computed(() => {
  return (
    validateFile(anexo1.value, 'pdf').ok &&
    validateFile(anexo2.value, 'pdf').ok &&
    validateFile(imagen.value, 'image').ok
  )
})

const onFileChange = (type, event) => {
  const file = event.target.files?.[0] ?? null
  if (type === 'anexo1') anexo1.value = file
  if (type === 'anexo2') anexo2.value = file
  if (type === 'imagen') imagen.value = file
}

const getMimeType = (filename) => {
  const lower = String(filename || '').toLowerCase()
  if (lower.endsWith('.pdf')) return 'application/pdf'
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  if (lower.endsWith('.gif')) return 'image/gif'
  return 'application/octet-stream'
}

const viewFile = async (filename) => {
  if (!filename || !props.actividad?.idsede || !carpetaActual.value) return
  try {
    const encoded = encodeURIComponent(filename)
    const dtoFolder = `DTO-${props.actividad.idsede}`
    const response = await api.get(`/uploads/${dtoFolder}/${carpetaActual.value}/${encoded}`, {
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(new Blob([response.data], { type: getMimeType(filename) }))
    window.open(url, '_blank', 'noopener')
    setTimeout(() => window.URL.revokeObjectURL(url), 1000)
  } catch (error) {
    await Swal.fire({
      icon: 'error',
      title: 'No se pudo abrir el archivo',
      text: 'Verifica que el archivo exista.'
    })
  }
}

const viewSelected = (file) => {
  if (!file) return
  const url = window.URL.createObjectURL(file)
  window.open(url, '_blank', 'noopener')
  setTimeout(() => window.URL.revokeObjectURL(url), 1000)
}

const resetState = () => {
  const rawModalidad = props.actividad?.modalidad
  if (rawModalidad === null || rawModalidad === undefined) {
    modalidad.value = ''
  } else if (rawModalidad === true) {
    modalidad.value = '1'
  } else if (rawModalidad === false) {
    modalidad.value = '0'
  } else {
    modalidad.value = String(rawModalidad)
  }
  if (!modalidad.value) {
    modalidad.value = '0'
  }
  duracionhrs.value = props.actividad?.duracionhrs ?? ''
  duracionmin.value = props.actividad?.duracionmin ?? ''
  comentarios.value = props.actividad?.comentarios ?? ''

  mujeres.value = [
    props.actividad?.pmujeres1 ?? 0,
    props.actividad?.pmujeres2 ?? 0,
    props.actividad?.pmujeres3 ?? 0,
    props.actividad?.pmujeres4 ?? 0,
    props.actividad?.pmujeres5 ?? 0,
    props.actividad?.pmujeres6 ?? 0,
    props.actividad?.pmujeres7 ?? 0,
    props.actividad?.pmujeres8 ?? 0
  ]
  hombres.value = [
    props.actividad?.phombres1 ?? 0,
    props.actividad?.phombres2 ?? 0,
    props.actividad?.phombres3 ?? 0,
    props.actividad?.phombres4 ?? 0,
    props.actividad?.phombres5 ?? 0,
    props.actividad?.phombres6 ?? 0,
    props.actividad?.phombres7 ?? 0,
    props.actividad?.phombres8 ?? 0
  ]

  anexo1.value = null
  anexo2.value = null
  imagen.value = null
  archivoActual1.value = props.actividad?.nombre_archivo || ''
  archivoActual2.value = props.actividad?.nombre_archivo2 || ''
  archivoActual3.value = props.actividad?.nombre_archivo3 || ''
  carpetaActual.value = props.actividad?.carpeta || ''
  saving.value = false
  touched.value = false
}

const clearState = () => {
  modalidad.value = ''
  duracionhrs.value = ''
  duracionmin.value = ''
  comentarios.value = ''
  mujeres.value = Array.from({ length: 8 }, () => 0)
  hombres.value = Array.from({ length: 8 }, () => 0)
  anexo1.value = null
  anexo2.value = null
  imagen.value = null
  archivoActual1.value = ''
  archivoActual2.value = ''
  archivoActual3.value = ''
  carpetaActual.value = ''
  saving.value = false
  touched.value = false
}

const applySavedArchivos = (archivos, carpeta) => {
  archivoActual1.value = archivos.nombre_archivo || archivoActual1.value
  archivoActual2.value = archivos.nombre_archivo2 || archivoActual2.value
  archivoActual3.value = archivos.nombre_archivo3 || archivoActual3.value
  carpetaActual.value = carpeta || carpetaActual.value
  anexo1.value = null
  anexo2.value = null
  imagen.value = null
  touched.value = false
}

const onClose = () => {
  if (justSaved.value) {
    clearState()
    justSaved.value = false
  } else {
    resetState()
  }
  emit('close')
}

const onSubmit = async () => {
  touched.value = true
  if (!isValidModalidad.value || !isValidDuracion.value || !hasPoblacion.value || !filesValid.value) return
  if (!props.actividad) return

  const confirm = await Swal.fire({
    title: '¿Guardar actividad como realizada?',
    text: 'Esta accion actualizara el registro y cambiara el status a realizada.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#7C3AED',
    confirmButtonText: 'Si, guardar',
    cancelButtonText: 'Cancelar'
  })

  if (!confirm.isConfirmed) return

  saving.value = true
  try {
    const formData = new FormData()
    formData.append('modalidad', modalidad.value)
    formData.append('duracionhrs', String(duracionhrs.value))
    formData.append('duracionmin', String(duracionmin.value))
    formData.append('comentarios', comentarios.value || '')

    mujeres.value.forEach((value, idx) => {
      formData.append(`pmujeres${idx + 1}`, String(value || 0))
    })
    hombres.value.forEach((value, idx) => {
      formData.append(`phombres${idx + 1}`, String(value || 0))
    })

    if (anexo1.value) formData.append('anexo1', anexo1.value)
    if (anexo2.value) formData.append('anexo2', anexo2.value)
    if (imagen.value) formData.append('imagen', imagen.value)

    const response = await api.put(`/actividades/${props.actividad.idcurso}/realizada`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    const archivos = response?.data?.archivos ?? {}
    const carpeta = response?.data?.carpeta ?? ''
    clearState()
    applySavedArchivos(archivos, carpeta)

    await Swal.fire({
      icon: 'success',
      title: 'Actividad registrada',
      text: 'La actividad fue marcada como realizada correctamente.',
      confirmButtonColor: '#7C3AED'
    })

    emit('saved', {
      idcurso: props.actividad.idcurso,
      status: 3,
      modalidad: Number(modalidad.value),
      duracionhrs: Number(duracionhrs.value),
      duracionmin: Number(duracionmin.value),
      comentarios: comentarios.value,
      pmujeres1: Number(mujeres.value[0] || 0),
      pmujeres2: Number(mujeres.value[1] || 0),
      pmujeres3: Number(mujeres.value[2] || 0),
      pmujeres4: Number(mujeres.value[3] || 0),
      pmujeres5: Number(mujeres.value[4] || 0),
      pmujeres6: Number(mujeres.value[5] || 0),
      pmujeres7: Number(mujeres.value[6] || 0),
      pmujeres8: Number(mujeres.value[7] || 0),
      phombres1: Number(hombres.value[0] || 0),
      phombres2: Number(hombres.value[1] || 0),
      phombres3: Number(hombres.value[2] || 0),
      phombres4: Number(hombres.value[3] || 0),
      phombres5: Number(hombres.value[4] || 0),
      phombres6: Number(hombres.value[5] || 0),
      phombres7: Number(hombres.value[6] || 0),
      phombres8: Number(hombres.value[7] || 0),
      nombre_archivo: archivoActual1.value,
      nombre_archivo2: archivoActual2.value,
      nombre_archivo3: archivoActual3.value,
      carpeta: carpetaActual.value
    })
    justSaved.value = true
  } catch (error) {
    await Swal.fire({
      icon: 'error',
      title: 'Error al guardar',
      text: error?.message || 'No se pudo guardar la actividad.'
    })
  } finally {
    saving.value = false
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      justSaved.value = false
      resetState()
    }
  }
)
</script>

<template>
  <AppModal :open="props.open" title="" maxWidth="max-w-6xl" @close="onClose">
    <div class="max-h-[85vh] overflow-y-auto px-1 pb-4 scrollbar-thin scrollbar-thumb-iecm-morado-200">
      <div class="space-y-8">
        
        <!-- Header -->
        <div class="flex items-start gap-4 p-4 bg-[#5B3166] text-white rounded-xl border border-[#5B3166]/30">
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 text-sm font-bold text-white shadow-sm border border-white/20">
            IECM
          </div>
          <div>
            <p class="text-xs uppercase tracking-wider font-semibold text-purple-200 mb-1">Captura de Actividad</p>
            <h3 class="text-lg font-bold text-white leading-tight">{{ titulo }}</h3>
          </div>
        </div>

        <!-- Inputs Básicos -->
        <div class="grid gap-6 md:grid-cols-2">
          <div>
            <label class="label-iecm">Modalidad *</label>
            <select 
              v-model="modalidad" 
              class="input-iecm"
              :class="{'border-red-400 focus:border-red-500 focus:ring-red-100': touched && !isValidModalidad}"
              @blur="touched = true"
            >
              <option value="" disabled>Selecciona una opción</option>
              <option value="0">Presencial</option>
              <option value="1">Virtual</option>
            </select>
            <p v-if="touched && !isValidModalidad" class="mt-1.5 text-xs text-red-600 font-medium">Selecciona una modalidad.</p>
          </div>
          
          <div>
            <label class="label-iecm">Duración *</label>
            <div class="grid grid-cols-2 gap-3">
              <div class="relative">
                <input 
                  v-model="duracionhrs" 
                  type="number" 
                  min="0" 
                  class="input-iecm pr-12 text-center font-medium" 
                  :class="{'border-red-400 focus:border-red-500 focus:ring-red-100': touched && !isValidDuracion}"
                  placeholder="00" 
                  @blur="touched = true" 
                />
                <span class="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-slate-400 dark:text-slate-500 pointer-events-none">hrs</span>
              </div>
              <div class="relative">
                <input 
                  v-model="duracionmin" 
                  type="number" 
                  min="0" 
                  class="input-iecm pr-12 text-center font-medium" 
                  :class="{'border-red-400 focus:border-red-500 focus:ring-red-100': touched && !isValidDuracion}"
                  placeholder="00" 
                  @blur="touched = true" 
                />
                <span class="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-slate-400 dark:text-slate-500 pointer-events-none">min</span>
              </div>
            </div>
            <p v-if="touched && !isValidDuracion" class="mt-1.5 text-xs text-red-600 font-medium">Ingresa duración válida.</p>
          </div>
        </div>

        <!-- Tabla de Población -->
        <div class="space-y-2">
          <label class="label-iecm">Población Beneficiada *</label>
          <div class="overflow-x-auto rounded-xl border border-iecm-gris-200 dark:border-white/10 shadow-sm">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                  <th class="border-b border-r border-slate-200 dark:border-white/10 px-3 py-2 text-left font-semibold uppercase tracking-wider text-xs" rowspan="3">Género</th>
                  <th class="border-b border-slate-200 dark:border-white/10 px-3 py-2 text-center font-semibold uppercase tracking-wider text-xs" colspan="9">Grupos de Edad</th>
                </tr>
                <tr class="text-slate-700 dark:text-slate-300">
                  <th class="border-b border-r border-slate-200 dark:border-white/10 bg-emerald-100/60 dark:bg-emerald-950/50 px-2 py-1.5 text-center font-semibold text-emerald-900 dark:text-emerald-300">Infantes</th>
                  <th class="border-b border-r border-slate-200 dark:border-white/10 bg-sky-100/60 dark:bg-sky-950/50 px-2 py-1.5 text-center font-semibold text-sky-900 dark:text-sky-300" colspan="2">Jóvenes</th>
                  <th class="border-b border-r border-slate-200 dark:border-white/10 bg-amber-100/60 dark:bg-amber-950/50 px-2 py-1.5 text-center font-semibold text-amber-900 dark:text-amber-300" colspan="4">Adultos</th>
                  <th class="border-b border-r border-slate-200 dark:border-white/10 bg-purple-100/60 dark:bg-purple-950/50 px-2 py-1.5 text-center font-semibold text-purple-900 dark:text-purple-300">Adultos Mayores</th>
                  <th class="border-b border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 text-center font-semibold text-slate-800 dark:text-slate-200" rowspan="2">TOTAL</th>
                </tr>
                <tr class="text-[11px] font-medium tracking-wide">
                  <th class="border-b border-r border-slate-200 dark:border-white/10 bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-950 dark:text-emerald-200 py-1.5">0-12</th>
                  <th class="border-b border-r border-slate-200 dark:border-white/10 bg-sky-100/80 dark:bg-sky-900/30 text-sky-950 dark:text-sky-200 py-1.5">13-16</th>
                  <th class="border-b border-r border-slate-200 dark:border-white/10 bg-sky-100/80 dark:bg-sky-900/30 text-sky-950 dark:text-sky-200 py-1.5">17-20</th>
                  <th class="border-b border-r border-slate-200 dark:border-white/10 bg-amber-100/80 dark:bg-amber-900/30 text-amber-950 dark:text-amber-200 py-1.5">21-30</th>
                  <th class="border-b border-r border-slate-200 dark:border-white/10 bg-amber-100/80 dark:bg-amber-900/30 text-amber-950 dark:text-amber-200 py-1.5">31-40</th>
                  <th class="border-b border-r border-slate-200 dark:border-white/10 bg-amber-100/80 dark:bg-amber-900/30 text-amber-950 dark:text-amber-200 py-1.5">41-50</th>
                  <th class="border-b border-r border-slate-200 dark:border-white/10 bg-amber-100/80 dark:bg-amber-900/30 text-amber-950 dark:text-amber-200 py-1.5">51-61</th>
                  <th class="border-b border-r border-slate-200 dark:border-white/10 bg-purple-100/80 dark:bg-purple-900/30 text-purple-950 dark:text-purple-200 py-1.5">&gt;62</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-white/5 bg-white dark:bg-slate-900">
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td class="border-r border-slate-100 dark:border-white/5 bg-rose-50/70 dark:bg-rose-950/30 px-3 py-2 font-semibold text-rose-800 dark:text-rose-300">Mujeres</td>
                  <td v-for="(_, idx) in ageLabels" :key="`m-${idx}`" class="border-r border-slate-100 dark:border-white/5 px-1 py-1.5">
                    <input
                      v-model.number="mujeres[idx]"
                      type="number"
                      min="0"
                      class="w-full min-w-[3.5rem] rounded-md border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-800 px-2 py-1.5 text-center text-sm font-semibold text-slate-800 dark:text-white transition-colors focus:border-iecm-morado focus:ring-1 focus:ring-iecm-morado focus:outline-none hover:border-slate-400 dark:hover:border-white/30"
                    />
                  </td>
                  <td class="px-3 py-2 text-center font-bold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/50">{{ rowTotals.totalMujeres }}</td>
                </tr>
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td class="border-r border-slate-100 dark:border-white/5 bg-blue-50/70 dark:bg-blue-950/30 px-3 py-2 font-semibold text-blue-800 dark:text-blue-300">Hombres</td>
                  <td v-for="(_, idx) in ageLabels" :key="`h-${idx}`" class="border-r border-slate-100 dark:border-white/5 px-1 py-1.5">
                    <input
                      v-model.number="hombres[idx]"
                      type="number"
                      min="0"
                      class="w-full min-w-[3.5rem] rounded-md border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-800 px-2 py-1.5 text-center text-sm font-semibold text-slate-800 dark:text-white transition-colors focus:border-iecm-morado focus:ring-1 focus:ring-iecm-morado focus:outline-none hover:border-slate-400 dark:hover:border-white/30"
                    />
                  </td>
                  <td class="px-3 py-2 text-center font-bold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/50">{{ rowTotals.totalHombres }}</td>
                </tr>
                <tr class="bg-slate-100 dark:bg-slate-800/80 border-t-2 border-slate-200 dark:border-white/10">
                  <td class="border-r border-slate-200 dark:border-white/10 px-3 py-3 font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-xs text-right">Totales</td>
                  <td v-for="(total, idx) in colTotals" :key="`t-${idx}`" class="border-r border-slate-200 dark:border-white/10 px-2 py-3 text-center font-bold text-slate-700 dark:text-slate-200">
                    {{ total }}
                  </td>
                  <td class="px-3 py-3 text-center font-black text-iecm-morado dark:text-purple-300 bg-iecm-morado-100/70 dark:bg-iecm-morado-950/50 text-base">{{ rowTotals.totalGeneral }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-if="touched && !hasPoblacion" class="mt-1.5 text-xs text-red-600 font-medium">Debes ingresar al menos un participante para poder guardar.</p>
        </div>

        <!-- Archivos Adjuntos -->
        <div class="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
          <h4 class="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
             Evidencia Documental
          </h4>
          <div class="grid gap-6 md:grid-cols-3">
            <!-- Anexo 1 -->
            <div class="p-4 rounded-xl border border-dashed" :class="validateFile(anexo1, 'pdf').ok ? 'border-slate-300 bg-slate-50 dark:bg-slate-900/40' : 'border-red-300 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20'">
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Formato registro talleres (PDF)</label>
              <input type="file" accept="application/pdf" class="block w-full text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-iecm-morado-50 dark:bg-iecm-morado-950/10 file:text-iecm-morado-700 dark:text-iecm-morado-300 hover:file:bg-iecm-morado-100 dark:bg-iecm-morado-950/30 transition-all cursor-pointer" @change="(e) => onFileChange('anexo1', e)" />
              
              <div class="mt-3 flex flex-col gap-1.5">
                <button v-if="anexo1" type="button" @click="viewSelected(anexo1)" class="text-xs text-left font-medium text-iecm-morado dark:text-iecm-morado-400 hover:underline flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Archivo nuevo seleccionado</button>
                <button v-if="archivoActual1" type="button" @click="viewFile(archivoActual1)" class="text-xs text-left font-medium text-slate-600 dark:text-slate-400 hover:text-iecm-morado hover:underline flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Ver archivo actual guardado</button>
              </div>
              <p v-if="!validateFile(anexo1, 'pdf').ok" class="mt-2 text-xs text-red-600 font-medium">{{ validateFile(anexo1, 'pdf').message }}</p>
            </div>

            <!-- Anexo 2 -->
            <div class="p-4 rounded-xl border border-dashed" :class="validateFile(anexo2, 'pdf').ok ? 'border-slate-300 bg-slate-50 dark:bg-slate-900/40' : 'border-red-300 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20'">
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Formato asistentes talleres (PDF)</label>
              <input type="file" accept="application/pdf" class="block w-full text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-iecm-morado-50 dark:bg-iecm-morado-950/10 file:text-iecm-morado-700 dark:text-iecm-morado-300 hover:file:bg-iecm-morado-100 dark:bg-iecm-morado-950/30 transition-all cursor-pointer" @change="(e) => onFileChange('anexo2', e)" />
              
              <div class="mt-3 flex flex-col gap-1.5">
                <button v-if="anexo2" type="button" @click="viewSelected(anexo2)" class="text-xs text-left font-medium text-iecm-morado dark:text-iecm-morado-400 hover:underline flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Archivo nuevo seleccionado</button>
                <button v-if="archivoActual2" type="button" @click="viewFile(archivoActual2)" class="text-xs text-left font-medium text-slate-600 dark:text-slate-400 hover:text-iecm-morado hover:underline flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Ver archivo actual guardado</button>
              </div>
              <p v-if="!validateFile(anexo2, 'pdf').ok" class="mt-2 text-xs text-red-600 font-medium">{{ validateFile(anexo2, 'pdf').message }}</p>
            </div>

            <!-- Imagen -->
            <div class="p-4 rounded-xl border border-dashed" :class="validateFile(imagen, 'image').ok ? 'border-slate-300 bg-slate-50 dark:bg-slate-900/40' : 'border-red-300 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20'">
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Evidencia Fotográfica (Imagen)</label>
              <input type="file" accept="image/*" class="block w-full text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-iecm-morado-50 dark:bg-iecm-morado-950/10 file:text-iecm-morado-700 dark:text-iecm-morado-300 hover:file:bg-iecm-morado-100 dark:bg-iecm-morado-950/30 transition-all cursor-pointer" @change="(e) => onFileChange('imagen', e)" />
              
              <div class="mt-3 flex flex-col gap-1.5">
                <button v-if="imagen" type="button" @click="viewSelected(imagen)" class="text-xs text-left font-medium text-iecm-morado dark:text-iecm-morado-400 hover:underline flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Imagen nueva seleccionada</button>
                <button v-if="archivoActual3" type="button" @click="viewFile(archivoActual3)" class="text-xs text-left font-medium text-slate-600 dark:text-slate-400 hover:text-iecm-morado hover:underline flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Ver imagen actual guardada</button>
              </div>
              <p v-if="!validateFile(imagen, 'image').ok" class="mt-2 text-xs text-red-600 font-medium">{{ validateFile(imagen, 'image').message }}</p>
            </div>
          </div>
        </div>

        <!-- Comentarios -->
        <div>
          <label class="label-iecm">Comentarios adicionales</label>
          <textarea v-model="comentarios" rows="3" class="input-iecm resize-y" placeholder="Opcional..."></textarea>
        </div>

        <!-- Acciones -->
        <div class="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-white/5">
          <button 
            type="button" 
            class="px-5 py-2.5 rounded-lg font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            @click="onClose"
          >
            Cancelar
          </button>
          <button
            class="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-iecm-morado text-white font-medium shadow-iecm-sm hover:bg-iecm-morado-800 transition-colors disabled:opacity-50 disabled:pointer-events-none"
            type="button"
            :disabled="saving || !isValidModalidad || !isValidDuracion || !hasPoblacion || !filesValid"
            @click="onSubmit"
          >
            <span v-if="saving" class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
            Guardar Captura
          </button>
        </div>

      </div>
    </div>
  </AppModal>
</template>
