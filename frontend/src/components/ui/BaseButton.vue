<script setup>
defineProps({
  type: {
    type: String,
    default: 'button'
  },
  loading: {
    type: Boolean,
    default: false
  },
  success: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading || success"
    class="relative w-full h-12 px-6 flex items-center justify-center font-semibold text-sm rounded-xl text-white transition-all duration-200 outline-none select-none overflow-hidden"
    :class="[
      success
        ? 'bg-emerald-600 shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400'
        : 'bg-gradient-to-r from-iecm-morado to-iecm-morado-500 hover:from-iecm-morado-700 hover:to-iecm-morado-400 active:scale-[0.99] shadow-lg shadow-iecm-morado/35 hover:shadow-iecm-glow',
      'focus-visible:ring-2 focus-visible:ring-iecm-morado-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
      disabled || loading ? 'opacity-65 cursor-not-allowed pointer-events-none' : ''
    ]"
  >
    <!-- Efecto resplandor sutil superior -->
    <span class="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"></span>

    <!-- 1. Estado Éxito (Check SVG con animación) -->
    <span
      v-if="success"
      class="inline-flex items-center gap-2 font-bold tracking-wide animate-scale-check"
    >
      <svg
        class="w-5 h-5 text-white animate-bounce"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
      <span>Acceso concedido</span>
    </span>

    <!-- 2. Estado Cargando (Spinner SVG) -->
    <span
      v-else-if="loading"
      class="inline-flex items-center gap-2.5 font-medium tracking-wide text-white/90"
    >
      <svg
        class="w-5 h-5 animate-spin text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span>Autenticando...</span>
    </span>

    <!-- 3. Estado Reposo -->
    <span v-else class="inline-flex items-center gap-2">
      <slot>Acceder al sistema</slot>
    </span>
  </button>
</template>

<style scoped>
@keyframes scaleCheck {
  0% { transform: scale(0.85); opacity: 0; }
  60% { transform: scale(1.08); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
.animate-scale-check {
  animation: scaleCheck 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
</style>
