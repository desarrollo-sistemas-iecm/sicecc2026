import gsap from 'gsap'

export const useGsapAnimations = () => {
  const animarSidebar = (el) => {
    gsap.from(el, {
      x: -260,
      opacity: 0,
      duration: 0.5,
      ease: 'power3.out',
      clearProps: 'all'
    })
  }

  const animarVista = (el, done) => {
    gsap.fromTo(el,
      { opacity: 0, y: 12 },
      {
        opacity: 1,
        y: 0,
        duration: 0.3,
        ease: 'power2.out',
        onComplete: done
      }
    )
  }

  const animarFilasTabla = (selector) => {
    gsap.from(selector, {
      opacity: 0,
      y: 10,
      stagger: 0.04,
      duration: 0.4,
      ease: 'power2.out',
      clearProps: 'all'
    })
  }

  const animarCards = (selector) => {
    gsap.from(selector, {
      opacity: 0,
      y: 20,
      scale: 0.95,
      stagger: 0.08,
      duration: 0.5,
      ease: 'back.out(1.2)',
      clearProps: 'all'
    })
  }

  return {
    animarSidebar,
    animarVista,
    animarFilasTabla,
    animarCards
  }
}
