import { ref, onMounted, onBeforeUnmount } from 'vue'

/**
 * Composable para detectar el estado de la tecla Bloq Mayús (Caps Lock).
 * Mejora la experiencia de usuario advirtiendo sobre mayúsculas no intencionadas.
 */
export function useCapsLock() {
  const isCapsLockOn = ref(false)

  const handleKeyEvent = (event) => {
    if (event.getModifierState) {
      isCapsLockOn.value = event.getModifierState('CapsLock')
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyEvent)
    window.addEventListener('keyup', handleKeyEvent)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeyEvent)
    window.removeEventListener('keyup', handleKeyEvent)
  })

  return {
    isCapsLockOn,
    checkCapsLock: handleKeyEvent
  }
}
