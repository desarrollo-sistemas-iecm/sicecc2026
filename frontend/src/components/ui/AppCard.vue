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
    <div v-if="$slots.header" class="border-b border-[#5B3166]/30 bg-[#5B3166] px-5 py-4 text-white [&_h1]:!text-white [&_h2]:!text-white [&_h3]:!text-white [&_h4]:!text-white [&_h5]:!text-white [&_p]:!text-purple-100 [&_span]:!text-purple-100 [&_svg]:!text-purple-200 [&_.label-iecm]:!text-purple-100 dark:bg-iecm-dark-header dark:border-iecm-dark-border dark:text-iecm-dark-text dark:[&_h1]:!text-white dark:[&_h2]:!text-white dark:[&_h3]:!text-white dark:[&_h4]:!text-white dark:[&_p]:!text-iecm-dark-text-muted dark:[&_span]:!text-iecm-dark-text-muted dark:[&_svg]:!text-iecm-morado-400 dark:[&_.label-iecm]:!text-iecm-dark-text-muted">
      <slot name="header"></slot>
    </div>
    
    <div :class="['px-5 py-5', { 'p-0': noPadding }]">
      <slot></slot>
    </div>
    
    <div v-if="$slots.footer" class="border-t border-iecm-gris-200 bg-iecm-gris/60 px-5 py-3 dark:border-iecm-dark-border dark:bg-iecm-dark-header/40">
      <slot name="footer"></slot>
    </div>
  </div>
</template>
