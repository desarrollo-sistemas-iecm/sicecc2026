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
  <header class="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-iecm-gris-200 bg-white/80 backdrop-blur-md px-6 shadow-sm lg:px-8 pl-16 lg:pl-8 dark:bg-slate-900 dark:border-white/10 dark:text-slate-200 transition-colors duration-200">
    
    <!-- Breadcrumbs -->
    <div class="flex items-center gap-2 text-sm text-iecm-texto dark:text-slate-400">
      <!-- REEMPLAZAR: colocar logo-iecm-isotipo.png aquí si se desea un mini logo -->
      <span class="font-medium text-iecm-morado-600 dark:text-iecm-morado-400">SISEC CC</span>
      <ChevronRight class="w-4 h-4 text-slate-400 dark:text-slate-500" />
      <span class="font-semibold text-slate-800 dark:text-white">{{ currentRouteName }}</span>
    </div>

    <!-- Acciones Topbar -->
    <div class="flex items-center gap-2">
      <!-- Botón de Alternar Tema -->
      <button 
        @click="themeStore.toggleTheme"
        class="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-iecm-morado dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
        title="Alternar tema claro/oscuro"
      >
        <Sun v-if="themeStore.isDark" class="w-5 h-5 text-amber-400" />
        <Moon v-else class="w-5 h-5" />
      </button>
      
      <AppNotifications class="ml-1" />
    </div>
  </header>
</template>
