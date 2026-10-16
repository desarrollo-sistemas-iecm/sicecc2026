<script setup>
const model = defineModel({ type: [String, Number], default: '' })

defineProps({
  id: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  hideLabel: {
    type: Boolean,
    default: true
  },
  type: {
    type: String,
    default: 'text'
  },
  placeholder: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  required: {
    type: Boolean,
    default: false
  },
  autocomplete: {
    type: String,
    default: 'off'
  },
  autocapitalize: {
    type: String,
    default: 'off'
  },
  spellcheck: {
    type: String,
    default: 'false'
  },
  hasError: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <div class="relative w-full group">
    <!-- Etiqueta accesible -->
    <label
      :for="id"
      :class="[
        hideLabel
          ? 'sr-only'
          : 'block text-xs font-medium uppercase tracking-wider text-slate-300 mb-1.5'
      ]"
    >
      {{ label }}
    </label>

    <!-- Contenedor del Input con Iconos -->
    <div class="relative flex items-center">
      <!-- Ícono Izquierdo -->
      <div
        v-if="$slots.iconLeft"
        class="absolute left-4 z-10 flex items-center pointer-events-none text-slate-400 group-focus-within:text-iecm-morado-400 transition-colors duration-200"
      >
        <slot name="iconLeft" />
      </div>

      <!-- Campo Input -->
      <input
        :id="id"
        v-model="model"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :autocomplete="autocomplete"
        :autocapitalize="autocapitalize"
        :spellcheck="spellcheck"
        :class="[
          'w-full h-12 text-sm text-white placeholder-slate-500 rounded-xl transition-all duration-200 outline-none border',
          'bg-slate-900/60 backdrop-blur-md',
          $slots.iconLeft ? 'pl-11' : 'pl-4',
          $slots.iconRight ? 'pr-11' : 'pr-4',
          hasError
            ? 'border-red-500/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
            : 'border-white/10 hover:border-white/20 focus:border-iecm-morado-400 focus:ring-2 focus:ring-iecm-morado-500/30 shadow-inner',
          disabled ? 'opacity-50 cursor-not-allowed bg-slate-950/40' : ''
        ]"
      />

      <!-- Ícono Derecho / Acción (Botón de ojo, etc.) -->
      <div v-if="$slots.iconRight" class="absolute right-3.5 z-10 flex items-center">
        <slot name="iconRight" />
      </div>
    </div>
  </div>
</template>
