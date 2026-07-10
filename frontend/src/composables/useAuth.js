import { useAuthStore } from '../stores/authStore.js'

export const useAuth = () => {
  const authStore = useAuthStore()
  const login = (token, user) => authStore.setSession(token, user)
  const logout = () => authStore.clearSession()

  return {
    authStore,
    login,
    logout
  }
}
