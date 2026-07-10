<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Lock, User, Loader2 } from '@lucide/vue'
import { useAuth } from '../composables/useAuth.js'
import { useToast } from '../composables/useToast.js'
import api from '../services/api.js'
import { gsap } from 'gsap'
import Swal from 'sweetalert2'

const usuario = ref('')
const contrasena = ref('')
const loading = ref(false)
const { login } = useAuth()
const router = useRouter()
const toast = useToast()

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

const fetchConfigs = async () => {
  try {
    const { data } = await api.get('/admin/ultima-actualizacion-config')
    if (data.success) {
      isUltimaActHabilitado.value = data.habilitado
      ultimaActFecha.value = data.fecha
    }
  } catch (error) {
    console.error('Error fetching config on login:', error)
  }
}

const onSubmit = async () => {
  loading.value = true
  try {
    const { data } = await api.post('/auth/login', {
      usuario: usuario.value,
      contrasena: contrasena.value
    })
    login(data.token, data.user)
    toast.success('Bienvenido al sistema SISEC CC 2026.')

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
  } catch (error) {
    toast.error('Credenciales incorrectas. Verifica tu usuario y contrasena.')
  } finally {
    loading.value = false
  }
}


const canvasRef = ref(null)
let animFrameId = null

function initCanvas() {
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')

  const resize = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }
  resize()
  window.addEventListener('resize', resize)

  // Configuración de partículas
  const PARTICLE_COUNT = window.innerWidth < 640 ? 40 : 100
  const CONNECTION_DIST = window.innerWidth < 640 ? 100 : 140
  const COLORS = {
    particle: 'rgba(107, 45, 139,',   // morado IECM
    line: 'rgba(107, 45, 139,',
    accent: 'rgba(245, 166, 35,'      // dorado IECM (algunas partículas)
  }

  // Crear partículas
  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    radius: Math.random() * 2 + 1,
    isGold: i < 6   // 6 partículas doradas como acento
  }))

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Mover partículas
    particles.forEach(p => {
      p.x += p.vx
      p.y += p.vy
      if (p.x < 0 || p.x > canvas.width)  p.vx *= -1
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1
    })

    // Dibujar conexiones
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x
        const dy = particles[i].y - particles[j].y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < CONNECTION_DIST) {
          const alpha = (1 - dist / CONNECTION_DIST) * 0.35
          ctx.beginPath()
          ctx.strokeStyle = `${COLORS.line}${alpha})`
          ctx.lineWidth = 0.8
          ctx.moveTo(particles[i].x, particles[i].y)
          ctx.lineTo(particles[j].x, particles[j].y)
          ctx.stroke()
        }
      }
    }

    // Dibujar partículas
    particles.forEach(p => {
      ctx.beginPath()
      const color = p.isGold ? COLORS.accent : COLORS.particle
      ctx.fillStyle = `${color}${p.isGold ? 0.7 : 0.85})`
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
      ctx.fill()
      // Halo sutil
      ctx.beginPath()
      ctx.fillStyle = `${color}0.12)`
      ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2)
      ctx.fill()
    })

    animFrameId = requestAnimationFrame(draw)
  }

  draw()

  return () => window.removeEventListener('resize', resize)
}

onMounted(() => {
  fetchConfigs()
  const cleanup = initCanvas()
  onUnmounted(() => {
    cancelAnimationFrame(animFrameId)
    cleanup()
  })

  // El canvas hace fade in suave al montar
  gsap.fromTo(canvasRef.value, 
    { opacity: 0 }, 
    { opacity: 1, duration: 2, ease: 'power2.out' }
  )

  // Título exterior: entrada desde arriba con fade
  gsap.fromTo('.system-title', 
    { opacity: 0, y: -30 }, 
    { opacity: 1, y: 0, duration: 1, delay: 0.3, ease: 'power3.out' }
  )

  gsap.fromTo('.login-vignette', 
    { opacity: 0 }, 
    { opacity: 1, duration: 1.5, delay: 0.5, ease: 'power2.out' }
  )

  // Card: entrada desde abajo con fade
  gsap.fromTo('.login-card', 
    { opacity: 0, y: 40 }, 
    { opacity: 1, y: 0, duration: 0.7, delay: 0.2, ease: 'power3.out' }
  )

  // Logo: entrada con scale
  gsap.fromTo('.login-logo', 
    { opacity: 0, scale: 0.85 }, 
    { opacity: 1, scale: 1, duration: 0.5, delay: 0.5, ease: 'back.out(1.7)' }
  )

  // Campos y botón: stagger desde abajo
  gsap.fromTo('.login-field', 
    { opacity: 0, y: 20 }, 
    { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, delay: 0.7, ease: 'power2.out' }
  )
})
</script>

<template>
  <div class="fixed inset-0 z-50 w-full flex flex-col items-center justify-center p-4 overflow-hidden bg-[#080412]">
    
    <canvas ref="canvasRef" class="login-canvas"></canvas>
    <div class="login-vignette"></div>

    <!-- Título Protagonista Afuera -->
    <div class="system-title relative z-10 text-center mb-6 lg:mb-10 pointer-events-none">
      <h1 class="text-4xl sm:text-5xl lg:text-[4rem] font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-[#E0E0E0] drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
        SISEC CC 2026
      </h1>
      <p class="mt-3 text-sm sm:text-base text-[#D8B4E2] tracking-[0.25em] uppercase font-medium drop-shadow-md">
        Sistema de Seguimiento y Control
      </p>
    </div>

    <!-- Card Central -->
    <div class="login-card relative z-10 w-[92vw] sm:w-full max-w-[440px] bg-white rounded-[24px] p-[32px] md:p-[48px] shadow-[0_0_0_1px_rgba(107,45,139,0.2),0_40px_80px_rgba(0,0,0,0.7),0_0_80px_rgba(107,45,139,0.12)]">
      
      <!-- Logo y Branding -->
      <div class="login-logo flex flex-col items-center mb-6">
        <img 
          src="../assets/logos/iecm-negro.png" 
          alt="IECM Logo" 
          class="h-[60px] md:h-[80px] object-contain drop-shadow-sm"
        />
      </div>

      <!-- Títulos -->
      <div class="text-center mb-8">
        <h2 class="text-[28px] font-bold text-[#2D0F45] leading-tight mb-2">Iniciar sesión</h2>
        <p class="text-[14px] text-[#6B7280]">Ingresa tus credenciales para acceder al sistema.</p>
      </div>

      <!-- Formulario -->
      <form @submit.prevent="onSubmit" class="space-y-5">
        
        <!-- Usuario -->
        <div class="login-field relative group">
          <label class="sr-only">Usuario</label>
          <div class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <User class="w-5 h-5 text-[#9B59C8] transition-colors group-focus-within:text-[#6B2D8B]" />
          </div>
          <input
            v-model="usuario"
            type="text"
            required
            placeholder="Usuario (Ej. dtto01)"
            :disabled="loading"
            class="w-full h-[52px] pl-11 pr-4 bg-white text-[#2D0F45] text-[15px] border-[1.5px] border-[#E0E0E0] rounded-[12px] transition-all duration-200 outline-none focus:border-[#6B2D8B] focus:ring-[3px] focus:ring-[rgba(107,45,139,0.15)] disabled:bg-slate-50 disabled:text-slate-400 placeholder:text-slate-400"
          />
        </div>

        <!-- Contraseña -->
        <div class="login-field relative group">
          <label class="sr-only">Contraseña</label>
          <div class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <Lock class="w-5 h-5 text-[#9B59C8] transition-colors group-focus-within:text-[#6B2D8B]" />
          </div>
          <input
            v-model="contrasena"
            type="password"
            required
            placeholder="••••••••"
            :disabled="loading"
            class="w-full h-[52px] pl-11 pr-4 bg-white text-[#2D0F45] text-[15px] border-[1.5px] border-[#E0E0E0] rounded-[12px] transition-all duration-200 outline-none focus:border-[#6B2D8B] focus:ring-[3px] focus:ring-[rgba(107,45,139,0.15)] disabled:bg-slate-50 disabled:text-slate-400 placeholder:text-slate-400"
          />
        </div>

        <!-- Botón -->
        <div class="login-field pt-2">
          <button
            type="submit"
            :disabled="loading"
            class="relative w-full h-[52px] flex items-center justify-center text-white font-semibold text-[16px] rounded-[12px] bg-gradient-to-r from-[#6B2D8B] to-[#9B59C8] hover:from-[#5A2575] hover:to-[#8A4EB2] active:translate-y-0 hover:-translate-y-[1px] hover:shadow-[0_8px_20px_rgba(107,45,139,0.3)] transition-all duration-200 disabled:opacity-70 disabled:pointer-events-none"
          >
            <span v-if="!loading">Acceder al sistema</span>
            <Loader2 v-else class="w-6 h-6 animate-spin text-white/90" />
          </button>
        </div>

        <!-- Última actualización -->
        <div v-if="isUltimaActHabilitado" class="text-center mt-6 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
          <p class="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Última actualización</p>
          <p class="text-xs text-emerald-600 font-bold mt-0.5">{{ formatDateString(ultimaActFecha) }}</p>
        </div>

      </form>
    </div>

    <!-- Footer -->
    <div class="absolute bottom-6 inset-x-0 text-center pointer-events-none">
      <p class="text-[12px] text-white/60">
        &copy; 2026 Instituto Electoral de la Ciudad de México
      </p>
    </div>
  </div>
</template>

<style scoped>
/* Asegura tipografía Inter forzada dentro de este view específico por si no aplica global */
h2, p, input, button, span {
  font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
}

.login-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.login-vignette {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: radial-gradient(
    ellipse at center,
    transparent 30%,
    rgba(8, 4, 18, 0.75) 100%
  );
  pointer-events: none;
}
</style>
