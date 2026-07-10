<script setup>
import { computed, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import Swal from 'sweetalert2'
import api from '../../services/api.js'
import AppModal from '../AppModal.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  actividad: { type: Object, default: null }
})

const emit = defineEmits(['close', 'saved'])

const toast = useToast()
const motivo = ref('')
const saving = ref(false)
const touched = ref(false)

const titulo = computed(() => (props.actividad?.curso ?? props.actividad?.taller ?? '').toUpperCase())
const isValid = computed(() => motivo.value.trim().length >= 10)

const resetState = () => {
  motivo.value = ''
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
    title: '¿Confirmar?',
    text: 'La actividad se marcara como no realizada.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#7C3AED',
    cancelButtonColor: '#6B7280',
    confirmButtonText: 'Si, guardar',
    cancelButtonText: 'Cancelar'
  })

  if (!result.isConfirmed) return

  saving.value = true
  try {
    await api.put(`/actividades/${props.actividad.idcurso}/norealizada`, {
      motivo_norealizada: motivo.value.trim()
    })
    toast.success('Actividad marcada como no realizada')
    emit('saved', props.actividad.idcurso)
    onClose()
  } catch (error) {
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error?.message || 'No se pudo actualizar la actividad.'
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
      <div class="flex items-start gap-4 p-4 bg-red-50 rounded-xl border border-red-100">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-500 text-sm font-bold text-white shadow-sm">
          IECM
        </div>
        <div>
          <p class="text-xs uppercase tracking-wider font-semibold text-red-600 mb-1">Cancelar Actividad</p>
          <h3 class="text-lg font-bold text-slate-900 dark:text-white leading-tight">{{ titulo }}</h3>
        </div>
      </div>

      <div>
        <label class="label-iecm">Motivo por el que no se realizó la actividad *</label>
        <textarea
          v-model="motivo"
          rows="4"
          class="input-iecm resize-y"
          :class="{'border-red-400 focus:border-red-500 focus:ring-red-100': touched && !isValid}"
          placeholder="Describe brevemente el motivo..."
          @blur="touched = true"
        ></textarea>
        <p v-if="touched && !isValid" class="mt-1.5 text-xs text-red-600 font-medium">El motivo es obligatorio (mínimo 10 caracteres).</p>
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
          class="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-red-600 text-white font-medium shadow-sm hover:bg-red-700 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          type="button"
          :disabled="saving || !isValid"
          @click="onSubmit"
        >
          <span v-if="saving" class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
          Confirmar Cancelación
        </button>
      </div>

    </div>
  </AppModal>
</template>
