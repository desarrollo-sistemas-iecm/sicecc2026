import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // Inicialización (por defecto oscuro si no hay preferencia guardada)
  const isDark = ref(localStorage.getItem('theme') !== 'light')

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
