<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronRight, Sun, Moon } from '@lucide/vue'
import AppNotifications from './AppNotifications.vue'
import { useThemeStore } from '../stores/themeStore.js'

const route = useRoute()
const themeStore = useThemeStore()

// Genera un breadcrumb simple basado en la ruta actual
const currentRouteName = computed(() => {
  const name = route.name
  if (!name) return 'Panel'
  return name.charAt(0).toUpperCase() + name.slice(1)
})
</script>

<template>
  <header class="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-iecm-gris-200 bg-white/95 backdrop-blur-md px-6 shadow-[0_1px_4px_0_rgba(107,45,139,0.05)] lg:px-8 pl-16 lg:pl-8 dark:bg-iecm-dark-card/95 dark:border-iecm-dark-border dark:text-iecm-dark-text transition-colors duration-200">
    
    <!-- Breadcrumbs -->
    <div class="flex items-center gap-2 text-sm text-iecm-texto-suave dark:text-iecm-dark-text-muted">
      <!-- REEMPLAZAR: colocar logo-iecm-isotipo.png aquí si se desea un mini logo -->
      <span class="font-medium text-iecm-morado dark:text-iecm-morado-300">SISEC CC</span>
      <ChevronRight class="w-4 h-4 text-iecm-texto-muted dark:text-slate-500" />
      <span class="font-semibold text-iecm-texto dark:text-white">{{ currentRouteName }}</span>
    </div>

    <!-- Acciones Topbar -->
    <div class="flex items-center gap-2">
      <!-- Botón de Alternar Tema -->
      <button 
        @click="themeStore.toggleTheme"
        class="p-2 rounded-xl text-iecm-texto-suave hover:bg-iecm-gris-100 hover:text-iecm-morado dark:text-iecm-dark-text-muted dark:hover:bg-iecm-dark-elevated dark:hover:text-white transition-colors"
        title="Alternar tema claro/oscuro"
      >
        <Sun v-if="themeStore.isDark" class="w-5 h-5 text-amber-400" />
        <Moon v-else class="w-5 h-5 text-iecm-morado-700" />
      </button>
      
      <AppNotifications class="ml-1" />
    </div>
  </header>
</template>
