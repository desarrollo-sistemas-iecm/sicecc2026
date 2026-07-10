<script setup>
import { computed, useId } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'text'
  },
  error: {
    type: String,
    default: ''
  },
  placeholder: {
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
const inputId = useId()

const onInput = (e) => {
  emit('update:modelValue', e.target.value)
}

const onBlur = (e) => {
  emit('blur', e)
}

const inputClasses = computed(() => {
  const base = 'input-iecm'
  const state = props.error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : ''
  const disabled = props.disabled ? 'bg-slate-50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 cursor-not-allowed' : ''
  
  return `${base} ${state} ${disabled}`
})
</script>

<template>
  <div class="w-full">
    <label v-if="label" :for="inputId" class="label-iecm">
      {{ label }} <span v-if="required" class="text-red-500">*</span>
    </label>
    
    <div class="relative">
      <!-- Icon slot left -->
      <div v-if="$slots.icon" class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
        <slot name="icon"></slot>
      </div>
      
      <input
        :id="inputId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :class="[inputClasses, $slots.icon ? 'pl-10' : '']"
        @input="onInput"
        @blur="onBlur"
        v-bind="$attrs"
      />
    </div>
    
    <p v-if="error" class="mt-1.5 text-xs text-red-600 font-medium">
      {{ error }}
    </p>
  </div>
</template>
