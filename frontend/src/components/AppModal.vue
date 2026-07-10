<script setup>
const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
  maxWidth: { type: String, default: 'max-w-lg' }
})
const emit = defineEmits(['close'])
</script>

<template>
  <div v-if="props.open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div class="w-full rounded-lg bg-white dark:bg-slate-900 p-6 shadow-xl" :class="props.maxWidth">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">{{ props.title }}</h3>
        <button class="text-slate-400 dark:text-slate-500" @click="emit('close')">Cerrar</button>
      </div>
      <div class="mt-4">
        <slot />
      </div>
    </div>
  </div>
</template>
