<script setup>
import { computed, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import Swal from 'sweetalert2'
import api from '../../services/api.js'
import AppModal from '../AppModal.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  actividad: { type: Object, default: null },
  dateConfig: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['close', 'saved'])

const toast = useToast()
const fecha = ref('')
const horas = ref('')
const minutos = ref('')
const saving = ref(false)
const touched = ref(false)

const titulo = computed(() => (props.actividad?.curso ?? props.actividad?.taller ?? '').toUpperCase())
const hoy = new Date().toISOString().slice(0, 10)

const horaValue = computed(() => `${String(horas.value).padStart(2, '0')}:${String(minutos.value).padStart(2, '0')}`)
const fechaValida = computed(() => Boolean(fecha.value) && fecha.value >= hoy)
const horasValidas = computed(() => {
  const value = Number.parseInt(horas.value, 10)
  return Number.isInteger(value) && value >= 0 && value <= 23
})
const minutosValidos = computed(() => {
  const value = Number.parseInt(minutos.value, 10)
  return Number.isInteger(value) && value >= 0 && value <= 59
})
const isValid = computed(() => fechaValida.value && horasValidas.value && minutosValidos.value)

const resetState = () => {
  const hora = props.actividad?.hora_programada ?? ''
  const [h, m] = String(hora).split(':')
  fecha.value = props.actividad?.fecha ?? ''
  horas.value = h ?? ''
  minutos.value = m ?? ''
  saving.value = false
  touched.value = false
}

const onClose = () => {
  resetState()
  emit('close')
}

const onSubmit = async () => {
  touched.value = true
  if (!isValid.value || !props.actividad) return

  const result = await Swal.fire({
    title: '¿Reprogramar actividad?',
    text: `Nueva fecha: ${fecha.value} ${horaValue.value}`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#7C3AED',
    cancelButtonText: 'Cancelar',
    confirmButtonText: 'Si, reprogramar'
  })

  if (!result.isConfirmed) return

  saving.value = true
  try {
    await api.put(`/actividades/${props.actividad.idcurso}/reprogramar`, {
      fecha: fecha.value,
      hora_programada: horaValue.value
    })
    toast.success('Actividad reprogramada correctamente')
    emit('saved', {
      idcurso: props.actividad.idcurso,
      fecha: fecha.value,
      hora_programada: horaValue.value
    })
    onClose()
  } catch (error) {
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error?.message || 'No se pudo reprogramar la actividad.'
    })
  } finally {
    saving.value = false
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      resetState()
    }
  }
)
</script>

<template>
  <AppModal :open="props.open" title="" maxWidth="max-w-xl" @close="onClose">
    <div class="space-y-6">
      
      <!-- Header -->
      <div class="flex items-start gap-4 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-100">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-sm font-bold text-white shadow-sm">
          IECM
        </div>
        <div>
          <p class="text-xs uppercase tracking-wider font-semibold text-amber-700 mb-1">Reprogramar Actividad</p>
          <h3 class="text-lg font-bold text-slate-900 dark:text-white leading-tight">{{ titulo }}</h3>
        </div>
      </div>

      <div class="grid gap-5 md:grid-cols-2">
        <div>
          <label class="label-iecm">Nueva Fecha programada *</label>
          <input 
            v-model="fecha" 
            type="date" 
            class="input-iecm" 
            :class="{'border-red-400 focus:border-red-500 focus:ring-red-100': touched && !fechaValida}"
            :min="props.dateConfig?.fecha_inicio"
            :max="props.dateConfig?.fecha_fin"
            @blur="touched = true" 
          />
          <p v-if="touched && !fechaValida" class="mt-1.5 text-xs text-red-600 font-medium">La fecha es obligatoria y no puede ser menor a hoy.</p>
        </div>
        
        <div>
          <label class="label-iecm">Nueva Hora *</label>
          <div class="grid grid-cols-2 gap-3">
            <div class="relative">
              <input 
                v-model="horas" 
                type="number" 
                min="0" 
                max="23" 
                class="input-iecm pr-10 text-center font-medium" 
                :class="{'border-red-400 focus:border-red-500 focus:ring-red-100': touched && !horasValidas}"
                placeholder="00" 
                @blur="touched = true" 
              />
              <span class="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-slate-400 dark:text-slate-500 pointer-events-none">hrs</span>
            </div>
            <div class="relative">
              <input 
                v-model="minutos" 
                type="number" 
                min="0" 
                max="59" 
                class="input-iecm pr-10 text-center font-medium" 
                :class="{'border-red-400 focus:border-red-500 focus:ring-red-100': touched && !minutosValidos}"
                placeholder="00" 
                @blur="touched = true" 
              />
              <span class="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-slate-400 dark:text-slate-500 pointer-events-none">min</span>
            </div>
          </div>
          <p v-if="touched && (!horasValidas || !minutosValidos)" class="mt-1.5 text-xs text-red-600 font-medium">Hora (0-23) y minutos (0-59) válidos.</p>
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
        <button 
          type="button" 
          class="px-5 py-2.5 rounded-lg font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" 
          @click="onClose"
        >
          Cancelar
        </button>
        <button
          class="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-amber-500 text-white font-medium shadow-sm hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          type="button"
          :disabled="saving || !isValid"
          @click="onSubmit"
        >
          <span v-if="saving" class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
          Confirmar Reprogramación
        </button>
      </div>

    </div>
  </AppModal>
</template>
