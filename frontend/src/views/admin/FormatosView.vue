<script setup>
import { onMounted, ref } from 'vue'
import { FileText, Upload, Trash2, FileDown } from '@lucide/vue'
import api from '../../services/api.js'
import Swal from 'sweetalert2'
import AppCard from '../../components/ui/AppCard.vue'
import AppButton from '../../components/ui/AppButton.vue'
import { useToast } from '../../composables/useToast.js'
import { useGsapAnimations } from '../../composables/useGsapAnimations.js'

const toast = useToast()
const { animarVista } = useGsapAnimations()
const vistaRef = ref(null)

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

const serverFiles = ref([])
const loading = ref(false)
const inputRefs = ref({})

const loadFiles = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/admin/formatos')
    if (data.success) {
      serverFiles.value = data.data
    }
  } catch (error) {
    toast.error('Error al cargar la lista de formatos del servidor.')
  } finally {
    loading.value = false
  }
}

const checkExists = (fileName) => {
  return serverFiles.value.includes(fileName)
}

const triggerUpload = (fileName) => {
  if (inputRefs.value[fileName]) {
    inputRefs.value[fileName].click()
  }
}

const onFileSelected = async (event, expectedFileName) => {
  const file = event.target.files[0]
  if (!file) return
  
  event.target.value = null // reset

  if (!file.name.endsWith('.docx')) {
    Swal.fire('Formato incorrecto', 'Solo se permiten archivos .docx', 'warning')
    return
  }

  // Prevenir renombrado si no coincide
  if (file.name !== expectedFileName) {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Nombre de archivo incorrecto',
      html: `El archivo que intentas subir se llama <strong>${file.name}</strong>, pero el sistema espera <strong>${expectedFileName}</strong>.<br><br>¿Estás seguro de continuar? (El archivo se guardará con su nombre original).`,
      showCancelButton: true,
      confirmButtonText: 'Continuar de todos modos',
      cancelButtonText: 'Cancelar'
    })
    if (!result.isConfirmed) return
  }

  // Si el archivo (sea el esperado u otro con el mismo nombre que se va a guardar) ya existe
  if (serverFiles.value.includes(file.name)) {
    const override = await Swal.fire({
      icon: 'question',
      title: 'Archivo existente',
      text: `Ya existe un archivo llamado ${file.name} en el servidor. ¿Deseas reemplazarlo?`,
      showCancelButton: true,
      confirmButtonText: 'Sí, reemplazar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33'
    })
    if (!override.isConfirmed) return
  }

  try {
    const formData = new FormData()
    formData.append('archivo', file)

    await api.post('/admin/formatos/subir', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    toast.success('Archivo subido correctamente')
    await loadFiles()
  } catch (error) {
    toast.error('No se pudo subir el archivo.')
  }
}

const confirmDelete = async (fileName) => {
  const result = await Swal.fire({
    icon: 'warning',
    title: '¿Eliminar formato?',
    text: `Estás a punto de eliminar el archivo ${fileName}. Esta acción no se puede deshacer y el formato ya no estará disponible para los distritos.`,
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#d33'
  })

  if (result.isConfirmed) {
    try {
      await api.delete(`/admin/formatos/${fileName}`)
      toast.success('Archivo eliminado correctamente')
      await loadFiles()
    } catch (error) {
      toast.error('No se pudo eliminar el archivo.')
    }
  }
}

onMounted(() => {
  loadFiles()
  if (vistaRef.value) animarVista(vistaRef.value)
})
</script>

<template>
  <div ref="vistaRef" class="space-y-6 max-w-5xl">
    <div class="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
      <div>
        <h2 class="text-xl font-bold text-slate-900 dark:text-white">Administración de Formatos</h2>
        <p class="text-slate-500 dark:text-slate-400 mt-1 text-sm">Gestiona los archivos oficiales que descargarán los distritos. Los archivos deben ser obligatoriamente en formato .docx.</p>
      </div>
      <div class="p-3 bg-iecm-morado-50 dark:bg-iecm-morado-950/10 rounded-xl">
        <FileText class="w-6 h-6 text-iecm-morado dark:text-iecm-morado-400" />
      </div>
    </div>

    <div v-if="loading" class="py-12 flex justify-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-iecm-morado"></div>
    </div>

    <div v-else class="space-y-6">
      <AppCard v-for="cat in categoriasFormatos" :key="cat.id" class="overflow-hidden">
        <template #header>
          <div class="flex items-center gap-2">
            <h3 class="font-bold text-iecm-morado-800 dark:text-iecm-morado-300">{{ cat.nombre }}</h3>
          </div>
        </template>
        
        <div class="divide-y divide-slate-100 dark:divide-white/5">
          <div v-for="archivo in cat.archivos" :key="archivo.archivo" class="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" 
                :class="checkExists(archivo.archivo) ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'">
                <FileText class="w-6 h-6" />
              </div>
              <div>
                <h4 class="font-bold text-slate-800 dark:text-slate-200">{{ archivo.nombre }}</h4>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="text-xs font-mono px-2 py-0.5 rounded-md" :class="checkExists(archivo.archivo) ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800' : 'bg-slate-200 text-slate-600 dark:text-slate-400'">
                    {{ archivo.archivo }}
                  </span>
                  <span v-if="!checkExists(archivo.archivo)" class="text-xs text-red-500 font-medium flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span> Faltante en servidor
                  </span>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <input 
                type="file" 
                class="hidden" 
                accept=".docx" 
                :ref="el => inputRefs[archivo.archivo] = el"
                @change="(e) => onFileSelected(e, archivo.archivo)" 
              />
              
              <template v-if="checkExists(archivo.archivo)">
                <AppButton variant="secondary" size="sm" @click="triggerUpload(archivo.archivo)">
                  <template #icon><Upload class="w-4 h-4" /></template>
                  Reemplazar
                </AppButton>
                <AppButton variant="ghost" size="sm" class="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" @click="confirmDelete(archivo.archivo)">
                  <template #icon><Trash2 class="w-4 h-4" /></template>
                </AppButton>
              </template>
              
              <template v-else>
                <AppButton variant="primary" size="sm" @click="triggerUpload(archivo.archivo)">
                  <template #icon><Upload class="w-4 h-4" /></template>
                  Subir archivo
                </AppButton>
              </template>
            </div>

          </div>
        </div>
      </AppCard>

      <!-- Mostrar archivos "huérfanos" (opcional pero buena práctica) -->
      <AppCard v-if="serverFiles.filter(f => !categoriasFormatos.some(c => c.archivos.some(a => a.archivo === f))).length > 0">
        <template #header>
          <div class="flex items-center gap-2">
            <h3 class="font-bold text-slate-800 dark:text-slate-200">Otros archivos (No enlazados en categorías)</h3>
          </div>
        </template>
        <div class="divide-y divide-slate-100 dark:divide-white/5">
          <div v-for="file in serverFiles.filter(f => !categoriasFormatos.some(c => c.archivos.some(a => a.archivo === f)))" :key="file" class="p-4 flex items-center justify-between">
             <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl flex items-center justify-center shrink-0">
                <FileText class="w-6 h-6" />
              </div>
              <div>
                <h4 class="font-bold text-slate-800 dark:text-slate-200">{{ file }}</h4>
              </div>
            </div>
            <AppButton variant="ghost" size="sm" class="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" @click="confirmDelete(file)">
              <template #icon><Trash2 class="w-4 h-4" /></template>
            </AppButton>
          </div>
        </div>
      </AppCard>

    </div>
  </div>
</template>
