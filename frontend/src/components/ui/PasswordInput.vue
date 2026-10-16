<script setup>
import { computed } from 'vue'
import BaseInput from './BaseInput.vue'
import AlertMessage from './AlertMessage.vue'
import { usePasswordVisibility } from '../../composables/usePasswordVisibility.js'
import { useCapsLock } from '../../composables/useCapsLock.js'

const model = defineModel({ type: String, default: '' })

defineProps({
  id: {
    type: String,
    default: 'password-input'
  },
  label: {
    type: String,
    default: 'Contraseña'
  },
  placeholder: {
    type: String,
    default: '••••••••'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  required: {
    type: Boolean,
    default: true
  },
  hasError: {
    type: Boolean,
    default: false
  }
})

const { isVisible, toggleVisibility } = usePasswordVisibility()
const { isCapsLockOn } = useCapsLock()

const inputType = computed(() => (isVisible.value ? 'text' : 'password'))
const toggleLabel = computed(() => (isVisible.value ? 'Ocultar contraseña' : 'Mostrar contraseña'))
</script>

<template>
  <div class="space-y-1.5 w-full">
    <BaseInput
      :id="id"
      v-model="model"
      :label="label"
      :type="inputType"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :has-error="hasError"
      autocomplete="current-password"
      autocapitalize="off"
      spellcheck="false"
    >
      <!-- Ícono de Candado Izquierdo (SVG inline) -->
      <template #iconLeft>
        <svg
          class="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </template>

      <!-- Botón de Ojo Derecho Accesible con Animación Crossfade -->
      <template #iconRight>
        <button
          type="button"
          :aria-label="toggleLabel"
          :aria-pressed="isVisible"
          :disabled="disabled"
          @click="toggleVisibility"
          class="p-1 rounded-lg text-slate-400 hover:text-white focus-visible:text-white focus-visible:ring-2 focus-visible:ring-iecm-morado-400 focus-visible:outline-none transition-all duration-200"
        >
          <!-- Ícono Ojo visible (cuando la contraseña está descubierta) -->
          <svg
            v-if="isVisible"
            class="w-5 h-5 transition-transform duration-200 scale-100 rotate-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>

          <!-- Ícono Ojo tachado (cuando la contraseña está oculta) -->
          <svg
            v-else
            class="w-5 h-5 transition-transform duration-200 scale-100 rotate-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
            <line x1="2" x2="22" y1="2" y2="22" />
          </svg>
        </button>
      </template>
    </BaseInput>

    <!-- Aviso de Bloq Mayús activo accesible -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <AlertMessage
        v-if="isCapsLockOn"
        variant="warning"
        message="Aviso: La tecla Bloq Mayús está activada."
      />
    </transition>
  </div>
</template>
