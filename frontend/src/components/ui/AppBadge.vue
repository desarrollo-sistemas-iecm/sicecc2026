<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'neutral', // success, warning, danger, info, neutral
  }
})

const classes = computed(() => {
  const base = 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap'
  
  const variants = {
    success: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    warning: 'bg-iecm-dorado-100 text-iecm-dorado-600 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    danger:  'bg-red-100 text-red-800 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
    info:    'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
    neutral: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300 dark:border-white/10',
  }
  
  return `${base} ${variants[props.variant]}`
})
</script>

<template>
  <span :class="classes">
    <slot name="icon"></slot>
    <slot></slot>
  </span>
</template>
