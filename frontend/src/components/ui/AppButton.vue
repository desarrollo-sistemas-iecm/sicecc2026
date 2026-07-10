<script setup>
import { computed } from 'vue'
import { Loader2 } from '@lucide/vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary', // primary, secondary, danger, ghost
  },
  size: {
    type: String,
    default: 'md', // sm, md, lg
  },
  loading: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    default: 'button',
  },
})

const classes = computed(() => {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none active:scale-95'
  
  const variants = {
    primary: 'bg-iecm-morado text-white shadow-iecm-sm hover:bg-iecm-morado-800 focus:ring-iecm-morado hover:animate-pulso-boton',
    secondary: 'border border-iecm-gris-200 dark:border-white/10 bg-white dark:bg-slate-900 text-iecm-texto dark:text-slate-300 hover:border-iecm-morado hover:text-iecm-morado focus:ring-iecm-morado dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-iecm-morado-400 dark:hover:text-iecm-morado-400',
    danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700 focus:ring-red-600',
    ghost: 'text-iecm-texto dark:text-slate-300 hover:bg-iecm-gris-200 focus:ring-iecm-gris-200 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus:ring-slate-800',
  }
  
  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  }
  
  return `${base} ${variants[props.variant]} ${sizes[props.size]}`
})
</script>

<template>
  <button
    :type="type"
    :class="classes"
    :disabled="disabled || loading"
  >
    <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
    <slot name="icon" v-else></slot>
    <slot></slot>
  </button>
</template>
