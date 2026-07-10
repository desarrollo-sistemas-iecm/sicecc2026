<script setup>
import { onMounted, ref, computed } from 'vue'
import { LayoutDashboard, Users, CalendarCheck, BarChart2, ClipboardList, FileText, FileDown } from '@lucide/vue'
import { useGsapAnimations } from '../composables/useGsapAnimations.js'
import { useAuth } from '../composables/useAuth.js'
import { useToast } from '../composables/useToast.js'
import api from '../services/api.js'
import AppCard from '../components/ui/AppCard.vue'
import AppSelect from '../components/ui/AppSelect.vue'
import AppButton from '../components/ui/AppButton.vue'
import { useThemeStore } from '../stores/themeStore.js'

import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const { animarCards } = useGsapAnimations()
const { authStore } = useAuth()
const themeStore = useThemeStore()
const cardsRef = ref(null)

const isAdministrador = computed(() => authStore.isAdmin || authStore.isSuperAdmin)

const stats = ref({
  actividades_realizadas: 0,
  actividades_pendientes: 0,
  total_intervenciones: 0,
  total_talleres: 0,
  total_hombres: 0,
  total_mujeres: 0,
  total_encuestas: 0,
  grafica_distritos: []
})

const isLoading = ref(true)
let pollingInterval = null

const fetchMetrics = async (showLoading = true) => {
  if (showLoading) isLoading.value = true
  try {
    const endpoint = isAdministrador.value ? '/actividades/admin/dashboard/metricas' : '/actividades/dashboard/metricas'
    const { data } = await api.get(endpoint)
    if (data.success) {
      stats.value = data.data
    }
  } catch (error) {
    console.error('Error cargando métricas:', error)
  } finally {
    isLoading.value = false
  }
}

const metricas = computed(() => {
  if (isAdministrador.value) {
    return [
      { id: 1, title: 'Actividades Realizadas', value: stats.value.actividades_realizadas, icon: CalendarCheck, colorClass: 'text-emerald-600 bg-emerald-100 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20' },
      { id: 2, title: 'Talleres', value: stats.value.total_talleres, icon: BarChart2, colorClass: 'text-iecm-morado bg-iecm-morado-100 border-iecm-morado-200 dark:text-iecm-morado-300 dark:bg-iecm-morado-500/10 dark:border-iecm-morado-500/20' },
      { id: 3, title: 'Intervenciones', value: stats.value.total_intervenciones, icon: Users, colorClass: 'text-blue-600 bg-blue-100 border-blue-200 dark:text-blue-400 dark:bg-blue-500/10 dark:border-blue-500/20' },
      { id: 4, title: 'Encuestas', value: stats.value.total_encuestas || 0, icon: ClipboardList, colorClass: 'text-amber-600 bg-amber-100 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20' }
    ]
  }
  return [
    { id: 1, title: 'Actividades Realizadas', value: stats.value.actividades_realizadas, icon: CalendarCheck, colorClass: 'text-emerald-600 bg-emerald-100 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20' },
    { id: 2, title: 'Actividades Pendientes', value: stats.value.actividades_pendientes,  icon: LayoutDashboard, colorClass: 'text-amber-600 bg-amber-100 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20' },
    { id: 3, title: 'Intervenciones',         value: stats.value.total_intervenciones,   icon: Users, colorClass: 'text-blue-600 bg-blue-100 border-blue-200 dark:text-blue-400 dark:bg-blue-500/10 dark:border-blue-500/20' },
    { id: 4, title: 'Talleres',               value: stats.value.total_talleres,         icon: BarChart2, colorClass: 'text-iecm-morado bg-iecm-morado-100 border-iecm-morado-200 dark:text-iecm-morado-300 dark:bg-iecm-morado-500/10 dark:border-iecm-morado-500/20' },
  ]
})

const chartData = computed(() => {
  const distritos = stats.value.grafica_distritos || []
  const isDark = themeStore.isDark
  return {
    labels: distritos.map(d => `Dtto ${d.idsede}`),
    datasets: [{
      label: 'Actividades Realizadas',
      data: distritos.map(d => d.total_actividades),
      backgroundColor: isDark ? 'rgba(155, 89, 200, 0.85)' : 'rgba(107, 45, 139, 0.8)',
      borderRadius: 4
    }]
  }
})

const chartOptions = computed(() => {
  const isDark = themeStore.isDark
  const textColor = isDark ? '#94a3b8' : '#64748b'
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'
  
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { 
        beginAtZero: true, 
        ticks: { stepSize: 1, color: textColor },
        grid: { color: gridColor },
        title: {
          display: true,
          text: 'Actividades Realizadas',
          color: textColor,
          font: { size: 12, weight: 'bold' }
        }
      },
      x: { 
        ticks: { maxRotation: 45, minRotation: 45, color: textColor },
        grid: { color: gridColor }
      }
    }
  }
})

const categoriasFormatos = [
  {
    id: 1,
    nombre: 'Servicio Social',
    archivos: [
      { nombre: 'Formato de registro', archivo: 'Anexo01_SS.docx' },
      { nombre: 'Manifestación de no ser beneficiario/a de alguna beca que impida recibir el apoyo económico', archivo: 'Anexo02_SS.docx' },
      { nombre: 'Formato de reporte de avance en el proceso de reclutamiento de prestadores y prestadoras de servicio social', archivo: 'Anexo03_SS.docx' },
      { nombre: 'Formato para el reporte de bajas anticipadas y sustituciones de prestadores y prestadoras de servicio social', archivo: 'Anexo04_SS.docx' },
      { nombre: 'Formato de reporte de la capacitación otorgada a las y los prestadores de servicio social', archivo: 'Anexo05_SS.docx' },
      { nombre: 'Consideraciones generales para la coordinación de las actividades de las y los prestadores de servicio social', archivo: 'Anexo06_SS.docx' },
      { nombre: 'Lista de asistencia de el/la prestador(a) de servicio social', archivo: 'Anexo07_SS.docx' },
      { nombre: 'Formato para la solicitud de otorgamiento de apoyo económico a prestadores(as) de servicio social', archivo: 'Anexo08_SS.docx' },
      { nombre: 'Formato para la solicitud de expedición de Oficio de liberación para prestadores(as) de servicio social', archivo: 'Anexo09_SS.docx' }
    ]
  },
  {
    id: 2,
    nombre: 'Acciones Educativas',
    archivos: [
      { nombre: 'Formato para el registro de asistentes a talleres de formación ciudadana e intervenciones educativas', archivo: 'Anexo01_AE.docx' },
      { nombre: 'Formato para el registro del desarrollo de talleres de formación ciudadana e intervenciones educativas', archivo: 'Anexo02_AE.docx' },
      { nombre: 'Encuesta de satisfacción', archivo: 'Anexo03_AE.docx' },
      { nombre: 'Cedula de verificación de expediente fisico o digital distrital', archivo: 'Anexo04_AE.docx' }
    ]
  },
  {
    id: 3,
    nombre: 'Ludoteca Cívica',
    archivos: [
      { nombre: 'Formato para la gestión de acciones educativas de la Ludoteca Cívica dirigidas a la comunidad educativa y otros públicos', archivo: 'luci.docx' }
    ]
  },
  {
    id: 4,
    nombre: 'Vínculo Institucional (Demarcaciones Territoriales)',
    archivos: [
      { nombre: 'Modelo de Convenio', archivo: 'Anexo01_DT.docx' },
      { nombre: 'Modelo de Programa Anual de Trabajo', archivo: 'Anexo02_DT.docx' },
      { nombre: 'Procedimiento de vinculación', archivo: 'Anexo03_DT.docx' }
    ]
  },
  {
    id: 5,
    nombre: 'Lineamientos',
    archivos: [
      { nombre: 'Carta de autorización expresa y cesión de derechos_Padres', archivo: 'lineamientos1.docx' },
      { nombre: 'Formato de autorización expresa de las niñas, niños y adolescentes', archivo: 'lineamientos2.docx' }
    ]
  }
]

const selectedCategoriaId = ref('')
const selectedCategoria = computed(() => categoriasFormatos.find(c => c.id === Number(selectedCategoriaId.value)))

const descargando = ref({})

const descargarArchivo = async (nombreArchivo) => {
  descargando.value[nombreArchivo] = true
  try {
    const { token } = authStore
    const response = await fetch(`/api/formatos/descargar/${nombreArchivo}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    if (!response.ok) throw new Error('No encontrado')

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = nombreArchivo
    a.click()
    URL.revokeObjectURL(url)

    useToast().success(`Descargando ${nombreArchivo}`)
  } catch (error) {
    useToast().error('No se pudo descargar el archivo. Intenta de nuevo.')
  } finally {
    descargando.value[nombreArchivo] = false
  }
}

onMounted(async () => {
  await fetchMetrics()
  if (cardsRef.value && cardsRef.value.children) {
    animarCards(cardsRef.value.children)
  }
  
  // Polling de 60 segundos
  pollingInterval = setInterval(() => {
    fetchMetrics(false)
  }, 60000)
})

import { onUnmounted } from 'vue'
onUnmounted(() => {
  if (pollingInterval) clearInterval(pollingInterval)
})
</script>

<template>
  <div class="space-y-8">
    <header>
      <h1 class="text-3xl font-bold text-slate-900 tracking-tight dark:text-white">Bienvenido, {{ authStore.user?.nombre || 'Usuario' }}</h1>
      <p class="mt-2 text-slate-500 text-lg dark:text-slate-400">
        Aquí tienes un resumen general del progreso de tus actividades.
      </p>
    </header>

    <div ref="cardsRef" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <AppCard 
        v-for="metrica in metricas" 
        :key="metrica.id" 
        class="dashboard-card relative overflow-hidden group"
      >
        <div class="flex flex-col h-full min-h-[180px] justify-between relative z-10">
          <!-- Icono de agua decorativo -->
          <component :is="metrica.icon" class="absolute -bottom-6 -right-4 w-32 h-32 opacity-[0.03] text-slate-900 dark:text-white pointer-events-none" />
          
          <div class="flex justify-between items-start">
            <div :class="['w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm', metrica.colorClass]">
              <component :is="metrica.icon" class="w-7 h-7" />
            </div>
          </div>
          
          <div class="mt-auto pt-6">
            <p class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 dark:text-slate-400">{{ metrica.title }}</p>
            <p class="text-5xl font-black text-slate-900 tracking-tight dark:text-white">
              <span v-if="isLoading" class="animate-pulse bg-slate-200 dark:bg-slate-800 text-transparent rounded">0000</span>
              <span v-else>{{ metrica.value }}</span>
            </p>
          </div>
        </div>
        
        <!-- Hover highlight (bottom edge) -->
        <div class="absolute bottom-0 inset-x-0 h-1 bg-iecm-morado transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
      </AppCard>
    </div>

    <!-- Gráfica Admin -->
    <div v-if="isAdministrador" class="mt-8">
      <AppCard>
        <template #header>
          <div class="flex justify-between items-center">
            <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Avance por Distrito Territorial</h2>
            <span class="text-xs text-slate-400 dark:text-slate-500">Actualización en vivo</span>
          </div>
        </template>
        <div class="h-[400px] p-4">
           <Bar v-if="!isLoading && chartData.labels?.length > 0" :key="themeStore.isDark" :data="chartData" :options="chartOptions" />
           <div v-else class="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
             <BarChart2 class="w-12 h-12 mb-3 opacity-30 animate-pulse" />
             <p>Cargando métricas de distritos...</p>
           </div>
        </div>
      </AppCard>
    </div>

    <!-- Nueva sección de formatos -->
    <section class="dashboard-formatos mt-10">
      <AppCard>
        <template #header>
          <div class="flex items-center gap-2">
            <FileText class="w-5 h-5 text-iecm-morado dark:text-iecm-morado-400" />
            <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Formatos y Documentos Oficiales</h2>
          </div>
        </template>

        <div class="p-6">
          <p class="text-slate-500 mb-6 dark:text-slate-400">Selecciona una categoría para descargar los documentos oficiales vigentes.</p>
          
          <div class="max-w-md mb-8">
            <AppSelect v-model="selectedCategoriaId" label="Categoría de Formatos">
              <option value="" disabled>Selecciona una categoría...</option>
              <option v-for="cat in categoriasFormatos" :key="cat.id" :value="cat.id">{{ cat.nombre }}</option>
            </AppSelect>
          </div>

          <!-- Estado vacío si no hay selección -->
          <div v-if="!selectedCategoria" class="flex flex-col items-center justify-center py-12 text-center bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-white/5 border-dashed">
            <div class="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center border dark:border-white/10 shadow-sm text-slate-400 dark:text-slate-500 mb-4">
              <FileText class="w-8 h-8" />
            </div>
            <h3 class="text-lg font-medium text-slate-900 dark:text-white">Ninguna categoría seleccionada</h3>
            <p class="text-slate-500 dark:text-slate-400 max-w-sm mt-1">Selecciona una categoría en el menú superior para ver y descargar los formatos disponibles.</p>
          </div>

          <!-- Lista de archivos -->
          <div v-else class="space-y-4">
            <div v-for="archivo in selectedCategoria.archivos" :key="archivo.archivo" class="flex items-center justify-between p-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl hover:border-iecm-morado-300 dark:hover:border-iecm-morado-600 transition-colors shadow-sm">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0">
                  <FileDown class="w-6 h-6" />
                </div>
                <div>
                  <h4 class="font-bold text-slate-800 dark:text-slate-200">{{ archivo.nombre }}</h4>
                  <p class="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{{ archivo.archivo }}</p>
                </div>
              </div>
              <AppButton 
                variant="primary" 
                size="sm" 
                :disabled="descargando[archivo.archivo]" 
                @click="descargarArchivo(archivo.archivo)"
              >
                <span v-if="descargando[archivo.archivo]" class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2"></span>
                <span v-else class="mr-2"><FileDown class="w-4 h-4" /></span>
                Descargar
              </AppButton>
            </div>
          </div>
        </div>
      </AppCard>
    </section>

  </div>
</template>

<style scoped>
/* Asegura que GSAP agarre bien los elementos al montar */
.dashboard-card {
  visibility: visible;
}
</style>
