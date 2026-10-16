<script setup>
import { ArchiveX } from '@lucide/vue'

defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  isEmpty: {
    type: Boolean,
    default: false
  },
  emptyMessage: {
    type: String,
    default: 'No se encontraron registros.'
  }
})
</script>

<template>
  <div class="card-iecm overflow-hidden">
    <div class="w-full overflow-x-auto">
      <table class="w-full text-left text-sm text-iecm-texto dark:text-slate-300">
        <thead class="bg-[#EDE7F6] text-xs font-semibold uppercase tracking-wider text-iecm-morado-800 border-b border-iecm-gris-200 dark:bg-iecm-dark-header dark:text-iecm-dark-text dark:border-iecm-dark-border">
          <tr>
            <slot name="head"></slot>
          </tr>
        </thead>
        <tbody class="divide-y divide-iecm-gris-200 bg-white dark:bg-iecm-dark-card dark:divide-iecm-dark-border">
          <tr v-if="loading">
            <td colspan="100%" class="px-6 py-8 text-center text-iecm-texto-suave dark:text-iecm-dark-text-muted">
              <span class="inline-flex items-center gap-2">
                <span class="h-4 w-4 animate-spin rounded-full border-2 border-iecm-morado border-t-transparent dark:border-iecm-morado-400 dark:border-t-transparent"></span>
                Cargando datos...
              </span>
            </td>
          </tr>
          
          <tr v-else-if="isEmpty">
            <td colspan="100%" class="px-6 py-12 text-center">
              <div class="flex flex-col items-center justify-center text-iecm-texto-muted dark:text-slate-500">
                <ArchiveX class="h-10 w-10 mb-3 text-iecm-gris-300 dark:text-slate-600" />
                <p class="text-sm font-medium text-iecm-texto-suave dark:text-iecm-dark-text-muted">{{ emptyMessage }}</p>
              </div>
            </td>
          </tr>
          
          <slot name="body" v-else></slot>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style>
/* Filas alternadas, el componente que lo use debe aplicar la clase .tr-row a cada <tr> del body */
tbody tr.tr-row:nth-child(even) {
  background-color: #FBF9FD;
}
.dark tbody tr.tr-row:nth-child(even) {
  background-color: rgba(255, 255, 255, 0.02);
}
tbody tr.tr-row:hover {
  background-color: #F2ECF9;
}
.dark tbody tr.tr-row:hover {
  background-color: rgba(107, 45, 139, 0.16);
}
thead th {
  color: inherit !important;
}
</style>
