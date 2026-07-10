<script setup>
const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
  error: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <div>
    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">{{ props.label }}</label>
    <input
      type="date"
      class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
      :value="props.modelValue"
      @input="emit('update:modelValue', $event.target.value)"
    />
    <p v-if="props.error" class="mt-1 text-xs text-red-600">{{ props.error }}</p>
  </div>
</template>
