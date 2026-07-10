import { useToast as useVueToast } from 'vue-toastification'

export const useToast = () => {
  const toast = useVueToast()

  const defaultOptions = {
    timeout: 3000,
    closeOnClick: true,
    pauseOnFocusLoss: true,
    pauseOnHover: true,
    draggable: true,
    draggablePercent: 0.6,
    showCloseButtonOnHover: false,
    hideProgressBar: false,
    closeButton: 'button',
    icon: true,
    rtl: false
  }

  const success = (message, options = {}) => {
    toast.success(message, { ...defaultOptions, ...options })
  }

  const error = (message, options = {}) => {
    toast.error(message, { ...defaultOptions, timeout: 5000, ...options })
  }

  const warning = (message, options = {}) => {
    toast.warning(message, { ...defaultOptions, ...options })
  }

  const info = (message, options = {}) => {
    toast.info(message, { ...defaultOptions, ...options })
  }

  return {
    success,
    error,
    warning,
    info
  }
}
