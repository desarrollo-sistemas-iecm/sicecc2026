import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore.js'
import DashboardView from '../views/DashboardView.vue'
import LoginView from '../views/LoginView.vue'
import ProgramacionView from '../views/ProgramacionView.vue'
import CapturaView from '../views/CapturaView.vue'
import EncuestaView from '../views/EncuestaView.vue'
import ReportesView from '../views/ReportesView.vue'
import AdministracionView from '../views/AdministracionView.vue'
import NotificacionesView from '../views/NotificacionesView.vue'

const routes = [
  { path: '/login', name: 'login', component: LoginView, meta: { requiresAuth: false } },
  { path: '/', name: 'dashboard', component: DashboardView, meta: { requiresAuth: true, roles: [1, 2, 3] } },
  { path: '/programacion', name: 'programacion', component: ProgramacionView, meta: { requiresAuth: true, roles: [1, 3] } },
  { path: '/captura', name: 'captura', component: CapturaView, meta: { requiresAuth: true, roles: [1, 3] } },
  { path: '/encuesta', name: 'encuesta', component: EncuestaView, meta: { requiresAuth: true, roles: [1, 3] } },
  { path: '/reportes', name: 'reportes', component: ReportesView, meta: { requiresAuth: true, roles: [1, 2, 3] } },
  { path: '/notificaciones', name: 'notificaciones', component: NotificacionesView, meta: { requiresAuth: true, roles: [1, 2, 3] } },
  { 
    path: '/administracion', 
    name: 'administracion', 
    component: AdministracionView, 
    meta: { requiresAuth: true, roles: [3] },
    redirect: '/administracion/usuarios',
    children: [
      { path: 'usuarios', name: 'admin-usuarios', component: () => import('../views/admin/UsuariosView.vue') },
      { path: 'restricciones', name: 'admin-restricciones', component: () => import('../views/admin/RestriccionesView.vue') },
      { path: 'archivos', name: 'admin-archivos', component: () => import('../views/admin/ArchivosView.vue') },
      { path: 'formatos', name: 'admin-formatos', component: () => import('../views/admin/FormatosView.vue') },
      { path: 'cursos', name: 'admin-cursos', component: () => import('../views/admin/CursosView.vue') }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach((to) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login' }
  }
  
  if (to.name === 'login' && authStore.isAuthenticated) {
    return { name: 'dashboard' }
  }

  // Verificación de roles (Permisos)
  if (to.meta.roles && authStore.isAuthenticated) {
    const userPermiso = Number(authStore.user?.permiso || authStore.user?.idpermiso)
    if (!to.meta.roles.includes(userPermiso)) {
      return { name: 'dashboard' } // Redirigir si no tiene permiso
    }
  }

  return true
})

export default router
