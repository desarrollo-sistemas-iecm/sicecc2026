<script setup>
defineProps({
  variant: {
    type: String,
    default: 'error',
    validator: (v) => ['error', 'warning', 'info'].includes(v)
  },
  message: {
    type: String,
    required: true
  }
})
</script>

<template>
  <div
    role="alert"
    aria-live="polite"
    class="flex items-start gap-3 p-3.5 rounded-xl text-xs font-medium transition-all duration-200 border"
    :class="{
      'bg-red-500/10 border-red-500/25 text-red-200': variant === 'error',
      'bg-amber-500/10 border-amber-500/25 text-amber-200': variant === 'warning',
      'bg-blue-500/10 border-blue-500/25 text-blue-200': variant === 'info'
    }"
  >
    <!-- Ícono SVG inline según variante -->
    <div class="shrink-0 mt-0.5">
      <!-- Error (Exclamación con círculo) -->
      <svg
        v-if="variant === 'error'"
        class="w-4 h-4 text-red-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>

      <!-- Warning / CapsLock (Triángulo) -->
      <svg
        v-else-if="variant === 'warning'"
        class="w-4 h-4 text-amber-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    </div>

    <!-- Mensaje accesible -->
    <div class="flex-1 leading-relaxed">
      <span>{{ message }}</span>
    </div>
  </div>
</template>
