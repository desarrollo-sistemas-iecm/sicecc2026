import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: JSON.parse(localStorage.getItem('sicec_token') || 'null'),
    user: JSON.parse(localStorage.getItem('sicec_user') || 'null'),
    tokenExpiry: JSON.parse(localStorage.getItem('sicec_token_expiry') || 'null')
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
    },
    clearSession() {
      this.token = null
      this.user = null
      this.tokenExpiry = null
      localStorage.removeItem('sicec_token')
      localStorage.removeItem('sicec_user')
      localStorage.removeItem('sicec_token_expiry')
    }
  }
})

const isExpired = (expiry) => {
  if (!expiry) return true
  return Date.now() > expiry
}
