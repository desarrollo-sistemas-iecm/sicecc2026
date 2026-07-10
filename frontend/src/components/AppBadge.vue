<script setup>
const props = defineProps({
  label: { type: String, default: '' },
  variant: { type: String, default: 'default' }
})

const variants = {
  default: 'bg-slate-100 text-slate-700',
  programada: 'bg-blue-100 text-blue-700',
  realizada: 'bg-green-100 text-green-700',
  norealizada: 'bg-red-100 text-red-700'
}
</script>

<template>
  <span class="inline-flex rounded-full px-3 py-1 text-xs font-semibold" :class="variants[props.variant] || variants.default">
    {{ props.label }}
  </span>
</template>
