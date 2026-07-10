<script setup>
import { computed, useId } from 'vue'
import { ChevronDown } from '@lucide/vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  error: {
    type: String,
    default: ''
  },
  required: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'blur'])
const selectId = useId()

const onChange = (e) => {
  emit('update:modelValue', e.target.value)
}

const onBlur = (e) => {
  emit('blur', e)
}

const selectClasses = computed(() => {
  const base = 'input-iecm appearance-none pr-10'
  const state = props.error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : ''
  const disabled = props.disabled ? 'bg-slate-50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 cursor-not-allowed' : ''
  
  return `${base} ${state} ${disabled}`
})
</script>

<template>
  <div class="w-full">
    <label v-if="label" :for="selectId" class="label-iecm">
      {{ label }} <span v-if="required" class="text-red-500">*</span>
    </label>
    
    <div class="relative">
      <select
        :id="selectId"
        :value="modelValue"
        :disabled="disabled"
        :class="selectClasses"
        @change="onChange"
        @blur="onBlur"
        v-bind="$attrs"
      >
        <slot></slot>
      </select>
      
      <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 dark:text-slate-500">
        <ChevronDown class="w-4 h-4" />
      </div>
    </div>
    
    <p v-if="error" class="mt-1.5 text-xs text-red-600 font-medium">
      {{ error }}
    </p>
  </div>
</template>
