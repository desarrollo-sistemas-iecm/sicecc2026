import { defineStore } from 'pinia'
import { io } from 'socket.io-client'
import Swal from 'sweetalert2'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: JSON.parse(localStorage.getItem('sicec_token') || 'null'),
    user: JSON.parse(localStorage.getItem('sicec_user') || 'null'),
    tokenExpiry: JSON.parse(localStorage.getItem('sicec_token_expiry') || 'null'),
    socket: null
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token) && !isExpired(state.tokenExpiry),
    isOperador: (state) => state.user && Number(state.user.permiso || state.user.idpermiso) === 1,
    isAdmin: (state) => state.user && Number(state.user.permiso || state.user.idpermiso) === 2,
    isSuperAdmin: (state) => state.user && Number(state.user.permiso || state.user.idpermiso) === 3
  },
  actions: {
    setSession(token, user) {
      this.token = token
      this.user = user
      this.tokenExpiry = Date.now() + 2 * 60 * 60 * 1000
      localStorage.setItem('sicec_token', JSON.stringify(token))
      localStorage.setItem('sicec_user', JSON.stringify(user))
      localStorage.setItem('sicec_token_expiry', JSON.stringify(this.tokenExpiry))
      
      this.connectSocket()
    },
    clearSession() {
      this.disconnectSocket()
      this.token = null
      this.user = null
      this.tokenExpiry = null
      localStorage.removeItem('sicec_token')
      localStorage.removeItem('sicec_user')
      localStorage.removeItem('sicec_token_expiry')
    },
    logout() {
      this.clearSession()
    },
    connectSocket() {
      if (this.socket) {
        this.socket.disconnect()
        this.socket = null
      }

      let socketServer = window.location.origin
      let socketPath = '/socket.io/'
      const envApi = import.meta.env.VITE_API_URL
      const isLocalhost = typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

      if (envApi && /^https?:\/\//i.test(envApi)) {
        try {
          const urlObj = new URL(envApi)
          socketServer = urlObj.origin
          // Extrae el prefijo de la subcarpeta (ej. "/sisec_2026/api" -> "sisec_2026")
          const prefix = urlObj.pathname.replace(/\/api\/?$/, '').replace(/^\/+|\/+$/g, '')
          socketPath = prefix ? `/${prefix}/socket.io/` : '/socket.io/'
        } catch (e) {
          socketServer = envApi.replace(/\/api\/?$/, '')
          socketPath = '/socket.io/'
        }
      } else if (isLocalhost) {
        socketServer = 'http://localhost:3013'
        socketPath = '/socket.io/'
      }

      this.socket = io(socketServer, {
        path: socketPath,
        auth: { token: this.token },
        transports: ['polling', 'websocket'], // Crucial para proxies institucionales
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000
      })

      const handleForcedLogout = (mensaje) => {
        Swal.fire({
          icon: 'warning',
          title: 'Sesión Finalizada',
          text: mensaje || 'Tu sesión ha sido cerrada en otro dispositivo o por el administrador.',
          confirmButtonColor: '#6B2D8B', // morado IECM
          confirmButtonText: 'Entendido',
          allowOutsideClick: false,
          allowEscapeKey: false
        }).then(() => {
          this.clearSession()
          const loginUrl = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '') + '/login'
          window.location.href = loginUrl
        })
      }

      this.socket.on('sesion:invalidada', ({ mensaje }) => {
        handleForcedLogout(mensaje)
      })

      this.socket.on('logout_forced', (data) => {
        handleForcedLogout(data?.reason || data?.mensaje)
      })
    },
    disconnectSocket() {
      if (this.socket) {
        this.socket.disconnect()
        this.socket = null
      }
    }
  }
})

const isExpired = (expiry) => {
  if (!expiry) return true
  return Date.now() > expiry
}

// Auto-conectar si hay un token activo al instanciar el store
if (JSON.parse(localStorage.getItem('sicec_token') || 'null')) {
  setTimeout(() => {
    const store = useAuthStore()
    if (store.token) {
      store.connectSocket()
    }
  }, 100)
}
