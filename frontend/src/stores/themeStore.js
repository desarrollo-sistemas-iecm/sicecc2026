import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // Inicialización (por defecto MODO CLARO de inicio)
  if (!localStorage.getItem('theme_initialized_light')) {
    localStorage.setItem('theme', 'light')
    localStorage.setItem('theme_initialized_light', '1')
  }

  const isDark = ref(localStorage.getItem('theme') === 'dark')

  const applyTheme = () => {
    if (isDark.value) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const toggleTheme = () => {
    isDark.value = !isDark.value
    applyTheme()
  }

  return {
    isDark,
    toggleTheme,
    applyTheme
  }
})
