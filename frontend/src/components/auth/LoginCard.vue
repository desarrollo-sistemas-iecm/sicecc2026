<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import BaseInput from '../ui/BaseInput.vue'
import PasswordInput from '../ui/PasswordInput.vue'
import BaseButton from '../ui/BaseButton.vue'
import AlertMessage from '../ui/AlertMessage.vue'
import { useLogin } from '../../composables/useLogin.js'
import { useLoginAnimations } from '../../composables/useLoginAnimations.js'
import { authService } from '../../services/authService.js'

const props = defineProps({
  scopeRef: {
    type: Object,
    default: null
  }
})

const router = useRouter()
const cardRef = ref(null)

const {
  usuario,
  contrasena,
  loading,
  isSuccess,
  errorMessage,
  isRateLimited,
  countdown,
  handleLogin
} = useLogin()

// Animaciones GSAP encapsuladas
const { triggerShake } = useLoginAnimations(props.scopeRef || cardRef, cardRef)

// Estado para bloque de última actualización
const isUltimaActHabilitado = ref(false)
const ultimaActFecha = ref('')

const formatDateString = (dateString) => {
  if (!dateString) return ''
  const parts = dateString.split('-')
  if (parts.length === 3) {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    const year = parts[0]
    const month = months[parseInt(parts[1], 10) - 1]
    const day = parts[2]
    return `${day}/${month}/${year}`
  }
  return dateString
}

onMounted(async () => {
  const config = await authService.getUltimaActualizacion()
  if (config?.habilitado) {
    isUltimaActHabilitado.value = true
    ultimaActFecha.value = config.fecha
  }
})

const onSubmit = async () => {
  await handleLogin({
    onSuccess: async (data) => {
      // Breve pausa para apreciar el estado de éxito animado en el botón
      setTimeout(async () => {
        if (data.mostrarAlertaLogin) {
          await Swal.fire({
            icon: 'info',
            title: 'Manual de Usuario',
            text: 'Por favor, consulte el manual de usuario en el menú lateral para una correcta navegación en el sistema.',
            confirmButtonColor: '#6B2D8B',
            confirmButtonText: 'Entendido'
          })
        }
        await router.push({ name: 'dashboard' })
      }, 550)
    },
    onError: () => {
      triggerShake()
    }
  })
}
</script>

<template>
  <div
    ref="cardRef"
    class="login-card relative z-10 w-[92vw] sm:w-[440px] max-w-full rounded-[28px] p-7 sm:p-9 md:p-10 transition-colors duration-300"
    style="
      background: radial-gradient(120% 120% at 50% 0%, rgba(35, 16, 68, 0.78) 0%, rgba(14, 7, 28, 0.88) 100%);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.09), 0 24px 64px -12px rgba(0, 0, 0, 0.85), 0 0 80px -20px rgba(107, 45, 139, 0.28);
    "
  >
    <!-- Borde biselado superior brillante -->
    <div class="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-iecm-morado-400/50 to-transparent pointer-events-none"></div>

    <!-- Encabezado de Sesión -->
    <div class="anim-header text-center mb-6 pt-1">
      <h2 class="text-2xl sm:text-[26px] font-bold text-white tracking-tight leading-tight">
        Iniciar sesión
      </h2>
      <p class="text-xs sm:text-sm text-slate-400 mt-1.5 font-normal">
        Ingresa tus credenciales para acceder al sistema.
      </p>
    </div>

    <!-- 3. Formulario Semántico -->
    <form @submit.prevent="onSubmit" class="space-y-4" novalidate>
      <!-- Mensaje de Error Accesible (role=alert) -->
      <transition
        enter-active-class="transition duration-250 ease-out"
        enter-from-class="opacity-0 -translate-y-2 scale-98"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0 scale-98"
      >
        <div v-if="errorMessage" class="anim-error">
          <AlertMessage variant="error" :message="errorMessage" />
        </div>
      </transition>

      <!-- Campo Usuario -->
      <div class="anim-field">
        <BaseInput
          id="login-usuario"
          v-model="usuario"
          label="Usuario del sistema"
          placeholder="Ej. dtto01"
          :disabled="loading || isRateLimited"
          required
          autocomplete="username"
          autocapitalize="off"
          spellcheck="false"
          :has-error="Boolean(errorMessage)"
        >
          <template #iconLeft>
            <svg
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </template>
        </BaseInput>
      </div>

      <!-- Campo Contraseña -->
      <div class="anim-field">
        <PasswordInput
          id="login-password"
          v-model="contrasena"
          label="Contraseña"
          placeholder="••••••••"
          :disabled="loading || isRateLimited"
          :has-error="Boolean(errorMessage)"
        />
      </div>

      <!-- Botón de Envío con Estados -->
      <div class="anim-btn pt-1.5">
        <BaseButton
          type="submit"
          :loading="loading"
          :success="isSuccess"
          :disabled="isRateLimited"
        >
          <span v-if="isRateLimited">Reintentar en {{ countdown }}s</span>
          <span v-else>Acceder al sistema</span>
        </BaseButton>
      </div>

      <!-- Bloque: Última actualización -->
      <div
        v-if="isUltimaActHabilitado"
        class="anim-update text-center pt-2 mt-4 border-t border-white/5"
      >
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <p class="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
            Última actualización:
            <span class="text-emerald-400 font-bold ml-0.5">{{ formatDateString(ultimaActFecha) }}</span>
          </p>
        </div>
      </div>
    </form>
  </div>
</template>
