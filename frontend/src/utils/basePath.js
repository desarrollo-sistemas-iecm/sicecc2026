// Helper para calcular la subruta dinámica de la aplicación en el navegador
export const getDynamicRouterBase = () => {
  const envBase = import.meta.env.VITE_BASE_PATH
  if (envBase) {
    return envBase.endsWith('/') ? envBase : `${envBase}/`
  }
  if (typeof window === 'undefined' || !window.location) {
    return '/sisec_2026/'
  }
  const segments = window.location.pathname.split('/').filter(Boolean)
  if (segments.length === 0) return '/'
  return `/${segments[0]}/`
}
