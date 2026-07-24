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
      }
      let socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:3005'
      socketUrl = socketUrl.replace('/api', '')

      this.socket = io(socketUrl, {
        auth: { token: this.token },
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000
      })

      this.socket.on('sesion:invalidada', ({ mensaje }) => {
        Swal.fire({
          icon: 'warning',
          title: 'Sesión Finalizada',
          text: mensaje || 'Tu sesión ha sido cerrada porque se inició sesión en otro dispositivo o por el administrador.',
          confirmButtonColor: '#6B2D8B', // morado IECM
          confirmButtonText: 'Entendido',
          allowOutsideClick: false,
          allowEscapeKey: false
        }).then(() => {
          this.clearSession()
          window.location.href = '/login'
        })
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
