import { ref, onMounted, onBeforeUnmount } from 'vue'
import { gsap } from 'gsap'

/**
 * Composable que encapsula todas las animaciones GSAP de la pantalla de Login.
 * Implementa gestión estricta de memoria (gsap.context + ctx.revert)
 * y accesibilidad mediante gsap.matchMedia para prefers-reduced-motion.
 */
export function useLoginAnimations(scopeRef, cardRef) {
  let ctx = null
  let mm = null

  // Shake de la tarjeta ante error de credenciales
  const triggerShake = () => {
    if (!cardRef.value) return

    // Respeto a usuarios con reducción de movimiento
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.fromTo(cardRef.value, { opacity: 0.6 }, { opacity: 1, duration: 0.25 })
      return
    }

    gsap.killTweensOf(cardRef.value)
    gsap.fromTo(
      cardRef.value,
      { x: 0 },
      {
        x: -12,
        duration: 0.06,
        repeat: 5,
        yoyo: true,
        ease: 'power2.inOut',
        onComplete: () => {
          gsap.to(cardRef.value, { x: 0, duration: 0.1, ease: 'power2.out' })
        }
      }
    )
  }

  onMounted(() => {
    if (!scopeRef.value) return

    ctx = gsap.context(() => {
      mm = gsap.matchMedia()

      // ── Caso 1: Movimiento estándar permitido ──────────────────────────
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

        // Entrada principal en cascada
        tl.fromTo(
          '.anim-logo-center',
          { opacity: 0, y: -22, scale: 0.94 },
          { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'back.out(1.3)' },
          0.05
        )
        .fromTo(
          '.anim-system-title',
          { opacity: 0, y: -20 },
          { opacity: 1, y: 0, duration: 0.8 },
          '-=0.55'
        )
        .fromTo(
          cardRef.value,
          { opacity: 0, y: 36, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 0.9, clearProps: 'transform' },
          '-=0.55'
        )
        .fromTo(
          '.anim-header',
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.4 },
          '-=0.45'
        )
        .fromTo(
          '.anim-field',
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.45, stagger: 0.08 },
          '-=0.25'
        )
        .fromTo(
          '.anim-btn',
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.45 },
          '-=0.2'
        )
        .fromTo(
          '.anim-update',
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.4 },
          '-=0.2'
        )

        // ── Microinteracción de Tilt 3D siguiendo el puntero (solo en desktop) ──
        if (window.matchMedia('(pointer: fine)').matches && cardRef.value) {
          const card = cardRef.value
          const xSetter = gsap.quickTo(card, 'rotationY', { duration: 0.45, ease: 'power2.out' })
          const ySetter = gsap.quickTo(card, 'rotationX', { duration: 0.45, ease: 'power2.out' })

          const handleMouseMove = (e) => {
            const rect = card.getBoundingClientRect()
            const cardX = e.clientX - rect.left - rect.width / 2
            const cardY = e.clientY - rect.top - rect.height / 2
            // Rango sutil: máximo +-4 grados
            const rotY = (cardX / (rect.width / 2)) * 3.5
            const rotX = -(cardY / (rect.height / 2)) * 3.5
            xSetter(rotY)
            ySetter(rotX)
          }

          const handleMouseLeave = () => {
            xSetter(0)
            ySetter(0)
          }

          card.addEventListener('mousemove', handleMouseMove)
          card.addEventListener('mouseleave', handleMouseLeave)
        }
      })

      // ── Caso 2: prefers-reduced-motion activo (A11y) ─────────────────────
      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.fromTo(
          ['.anim-logo-center', '.anim-system-title', cardRef.value, '.anim-field', '.anim-btn'],
          { opacity: 0 },
          { opacity: 1, duration: 0.4, stagger: 0.04, ease: 'none' }
        )
      })
    }, scopeRef.value)
  })

  onBeforeUnmount(() => {
    if (mm) mm.revert()
    if (ctx) ctx.revert()
  })

  return {
    triggerShake
  }
}
