import { ref, computed } from 'vue'
import { authService } from '../services/authService.js'
import { useAuth } from './useAuth.js'

/**
 * Composable para la lógica de negocio y estado del formulario de login.
 * Aplica políticas estrictas de seguridad:
 * - Limpieza de contraseña en memoria tras submit.
 * - Manejo de HTTP 429 con cuenta regresiva.
 * - Validación UX sin exponer datos sensibles.
 */
export function useLogin() {
  const { login: setSession } = useAuth()

  const usuario = ref('')
  const contrasena = ref('')
  const loading = ref(false)
  const isSuccess = ref(false)
  const errorMessage = ref('')
  const isRateLimited = ref(false)
  const countdown = ref(0)
  let countdownTimer = null

  // Validación de formulario en cliente como apoyo de UX
  const isFormValid = computed(() => {
    return usuario.value.trim().length > 0 && contrasena.value.length > 0
  })

  const startRateLimitCountdown = (seconds = 60) => {
    isRateLimited.value = true
    countdown.value = seconds

    if (countdownTimer) clearInterval(countdownTimer)
    countdownTimer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(countdownTimer)
        countdownTimer = null
        isRateLimited.value = false
        errorMessage.value = ''
      }
    }, 1000)
  }

  const handleLogin = async ({ onSuccess, onError }) => {
    if (loading.value || isRateLimited.value) return
    if (!isFormValid.value) {
      errorMessage.value = 'Por favor completa todos los campos requeridos.'
      if (onError) onError()
      return
    }

    loading.value = true
    errorMessage.value = ''

    // Copiamos las credenciales para la llamada y limpiamos la contraseña del estado inmediatamente
    const payload = {
      usuario: usuario.value,
      contrasena: contrasena.value
    }
    // Política de seguridad: limpiar de inmediato el campo de contraseña
    contrasena.value = ''

    try {
      const data = await authService.login(payload)
      isSuccess.value = true
      
      // Persistir sesión a través del store oficial
      setSession(data.token, data.user)

      if (onSuccess) {
        await onSuccess(data)
      }
    } catch (err) {
      isSuccess.value = false

      if (err.status === 429) {
        errorMessage.value = err.message
        startRateLimitCountdown(err.retryAfter || 60)
      } else {
        errorMessage.value = err.message || 'Usuario o contraseña incorrectos.'
      }

      if (onError) {
        onError(err)
      }
    } finally {
      loading.value = false
    }
  }

  return {
    usuario,
    contrasena,
    loading,
    isSuccess,
    errorMessage,
    isRateLimited,
    countdown,
    isFormValid,
    handleLogin
  }
}
