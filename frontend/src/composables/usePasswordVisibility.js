import { ref, onMounted, onBeforeUnmount } from 'vue'

/**
 * Composable para alternar la visibilidad de la contraseña.
 * Incluye política de seguridad: auto-oculta la contraseña cuando
 * la ventana pierde el foco (blur) o cambia de pestaña (visibilitychange).
 */
export function usePasswordVisibility() {
  const isVisible = ref(false)

  const toggleVisibility = () => {
    isVisible.value = !isVisible.value
  }

  const hidePassword = () => {
    isVisible.value = false
  }

  const handleBlur = () => {
    hidePassword()
  }

  const handleVisibilityChange = () => {
    if (document.hidden) {
      hidePassword()
    }
  }

  onMounted(() => {
    window.addEventListener('blur', handleBlur)
    document.addEventListener('visibilitychange', handleVisibilityChange)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('blur', handleBlur)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  })

  return {
    isVisible,
    toggleVisibility,
    hidePassword
  }
}
