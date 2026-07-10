<script setup>
defineProps({
  noPadding: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <div class="card-iecm overflow-hidden transition-colors duration-200">
    <div v-if="$slots.header" class="border-b border-iecm-morado-200 bg-iecm-morado-100 px-5 py-4 dark:bg-slate-800/50 dark:border-white/10">
      <slot name="header"></slot>
    </div>
    
    <div :class="['px-5 py-5', { 'p-0': noPadding }]">
      <slot></slot>
    </div>
    
    <div v-if="$slots.footer" class="border-t border-iecm-gris-200 bg-slate-50/50 px-5 py-3">
      <slot name="footer"></slot>
    </div>
  </div>
</template>
