import api from './api.js'

/**
 * Servicio de Autenticación
 * Capa de abstracción sobre la API REST.
 * Maneja credenciales, cabeceras seguras y normalización de errores.
 */
export const authService = {
  /**
   * Realiza la solicitud de login al backend.
   * @param {Object} credentials - { usuario, contrasena }
   * @returns {Promise<Object>} Datos de sesión y permisos
   */
  async login({ usuario, contrasena }) {
    try {
      const response = await api.post('/auth/login', {
        usuario: String(usuario).trim(),
        contrasena: String(contrasena)
      }, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      })
      return response.data
    } catch (error) {
      const status = error.response?.status
      const data = error.response?.data

      // Error 429: Demasiados intentos (Rate Limit)
      if (status === 429) {
        const retryAfter = error.response?.headers?.['retry-after'] || 60
        const err = new Error(data?.message || 'Demasiados intentos fallidos. Por seguridad, tu acceso ha sido suspendido temporalmente.')
        err.status = 429
        err.retryAfter = Number(retryAfter)
        throw err
      }

      // Error de red / backend no disponible
      if (!error.response) {
        const err = new Error('No se pudo establecer conexión con el servidor. Verifica tu conexión de red o contacta a soporte.')
        err.status = 0
        throw err
      }

      // Error genérico 401/400 (Credenciales inválidas)
      const err = new Error(data?.message || 'Usuario o contraseña incorrectos.')
      err.status = status || 401
      throw err
    }
  },

  /**
   * Consulta si la fecha de última actualización está habilitada para mostrar.
   */
  async getUltimaActualizacion() {
    try {
      const response = await api.get('/admin/ultima-actualizacion-config')
      return response.data
    } catch (error) {
      return { habilitado: false, fecha: '' }
    }
  }
}
