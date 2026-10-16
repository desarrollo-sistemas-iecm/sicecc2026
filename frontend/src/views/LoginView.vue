<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { gsap } from 'gsap'
import LoginCard from '../components/auth/LoginCard.vue'

// Contenedor raíz para scope de GSAP
const rootScopeRef = ref(null)
const canvasRef = ref(null)
let animFrameId = null

// ── FONDO DE PARTÍCULAS / NODOS ORIGINAL INTACTO ─────────────────────────────
function initCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return () => {}
  const ctx = canvas.getContext('2d')

  const resize = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }
  resize()
  window.addEventListener('resize', resize)

  const PARTICLE_COUNT = window.innerWidth < 640 ? 40 : 100
  const CONNECTION_DIST = window.innerWidth < 640 ? 100 : 140
  const COLORS = {
    particle: 'rgba(107, 45, 139,',   // morado IECM
    line: 'rgba(107, 45, 139,',
    accent: 'rgba(245, 166, 35,'      // dorado IECM
  }

  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    radius: Math.random() * 2 + 1,
    isGold: i < 6
  }))

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    particles.forEach((p) => {
      p.x += p.vx
      p.y += p.vy
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1
    })

    // Conexiones de red
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

    // Dibujar nodos
    particles.forEach((p) => {
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
  const cleanupCanvas = initCanvas()

  // Fade-in suave del canvas de fondo
  if (canvasRef.value) {
    gsap.fromTo(
      canvasRef.value,
      { opacity: 0 },
      { opacity: 1, duration: 1.8, ease: 'power2.out' }
    )
  }

  onUnmounted(() => {
    cancelAnimationFrame(animFrameId)
    cleanupCanvas()
  })
})
</script>

<template>
  <main
    ref="rootScopeRef"
    class="fixed inset-0 z-50 w-full min-h-screen flex flex-col items-center justify-center p-4 overflow-x-hidden overflow-y-auto bg-[#080412] select-none"
  >
    <!-- Canvas de partículas intacto -->
    <canvas ref="canvasRef" class="login-canvas" aria-hidden="true"></canvas>

    <!-- Viñeta radial oscura para contraste -->
    <div class="login-vignette" aria-hidden="true"></div>

    <!-- Encabezado con Logo y Título Protagonista Centrados -->
    <header class="relative z-10 flex flex-col items-center text-center mb-5 sm:mb-8 pointer-events-none">
      <!-- Logo Institucional IECM Centrado Arriba del Título (elevado) -->
      <div class="anim-logo-center -mt-3 sm:-mt-6 mb-6 sm:mb-8">
        <img
          src="../assets/logos/Logotipos-blanco.png"
          alt="Instituto Electoral de la Ciudad de México"
          class="w-28 sm:w-36 md:w-40 lg:w-44 h-auto object-contain filter drop-shadow-[0_4px_20px_rgba(0,0,0,0.7)]"
          loading="eager"
        />
      </div>

      <!-- Título y Subtítulo del Sistema -->
      <div class="anim-system-title">
        <h1 class="text-3xl sm:text-5xl lg:text-[3.75rem] font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">
          SISECyCC 2026
        </h1>
        <p class="mt-2 sm:mt-2.5 text-xs sm:text-sm text-[#D8B4E2] tracking-[0.28em] uppercase font-semibold drop-shadow-md">
          SISTEMA DE SEGUIMIENTO Y CONTROL
        </p>
      </div>
    </header>

    <!-- Tarjeta Rediseñada Modular (LoginCard) -->
    <LoginCard :scope-ref="rootScopeRef" />

    <!-- Pie Institucional -->
    <footer class="mt-8 sm:mt-10 relative z-10 text-center pointer-events-none">
      <p class="text-[11px] sm:text-xs text-white/45 tracking-wide">
        &copy; 2026 Instituto Electoral de la Ciudad de México
      </p>
    </footer>
  </main>
</template>

<style scoped>
.login-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

.login-vignette {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: radial-gradient(
    ellipse at center,
    transparent 25%,
    rgba(8, 4, 18, 0.78) 100%
  );
  pointer-events: none;
}
</style>
