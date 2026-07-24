<script setup>
import { useRoute } from 'vue-router'
import { Users, CalendarRange, FolderOpen, FileText, BookOpen } from '@lucide/vue'

const route = useRoute()

const tabs = [
  { name: 'Gestión de Usuarios', path: '/administracion/usuarios', icon: Users },
  { name: 'Restricciones de Fechas', path: '/administracion/restricciones', icon: CalendarRange },
  { name: 'Explorador de Archivos', path: '/administracion/archivos', icon: FolderOpen },
  { name: 'Formatos Oficiales', path: '/administracion/formatos', icon: FileText },
  { name: 'Catálogo de Cursos', path: '/administracion/cursos', icon: BookOpen }
]
</script>

<template>
  <div class="space-y-6">
    <div class="flex border-b border-slate-200 dark:border-white/10 dark:border-white/10 gap-6">
      <router-link 
        v-for="tab in tabs" 
        :key="tab.path" 
        :to="tab.path"
        class="flex items-center gap-2 pb-3 border-b-2 transition-colors"
        :class="route.path === tab.path ? 'border-iecm-morado text-iecm-morado dark:text-iecm-morado-400 font-medium' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-700'"
      >
        <component :is="tab.icon" class="w-4 h-4" />
        {{ tab.name }}
      </router-link>
    </div>
    <router-view></router-view>
  </div>
</template>
