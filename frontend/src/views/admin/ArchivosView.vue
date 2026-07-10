<script setup>
import { ref, onMounted, computed } from 'vue'
import { Folder, File, Trash2, Upload, ChevronLeft, ChevronRight, HardDrive, RefreshCw, Eye } from '@lucide/vue'
import api from '../../services/api'
import Swal from 'sweetalert2'
import AppCard from '../../components/ui/AppCard.vue'
import AppButton from '../../components/ui/AppButton.vue'
import AppBadge from '../../components/ui/AppBadge.vue'

const currentPath = ref('') // Root is empty string
const entries = ref([])
const loading = ref(true)

const loadTree = async (folder = '') => {
  loading.value = true
  try {
    const { data } = await api.get('/admin/archivos', { params: { folder } })
    if (data.success) {
      entries.value = data.data
      currentPath.value = folder
    }
  } catch (error) {
    Swal.fire('Error', 'No se pudieron cargar los archivos.', 'error')
  } finally {
    loading.value = false
  }
}

const goUp = () => {
  if (!currentPath.value) return
  const parts = currentPath.value.split('/')
  parts.pop()
  loadTree(parts.join('/'))
}

const goToFolder = (folderName) => {
  const newPath = currentPath.value ? `${currentPath.value}/${folderName}` : folderName
  loadTree(newPath)
}

const deleteFile = async (filepath) => {
  const result = await Swal.fire({
    title: '¿Eliminar archivo?',
    text: "Esta acción no se puede deshacer.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  })

  if (result.isConfirmed) {
    try {
      const { data } = await api.delete('/admin/archivos', { data: { filepath } })
      if (data.success) {
        Swal.fire('Eliminado', 'El archivo ha sido eliminado.', 'success')
        loadTree(currentPath.value)
      }
    } catch (error) {
      Swal.fire('Error', 'No se pudo eliminar el archivo.', 'error')
    }
  }
}

const fileInputRef = ref(null)
const replaceTarget = ref(null)

const triggerReplace = (filepath) => {
  replaceTarget.value = filepath
  if (fileInputRef.value) {
    fileInputRef.value.click()
  }
}

const viewFile = async (entry) => {
  try {
    Swal.fire({
      title: 'Cargando...',
      text: 'Obteniendo archivo para visualizar',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading()
      }
    })
    const response = await api.get(`/uploads/${entry.path}`, { responseType: 'blob' })
    Swal.close()
    
    const contentType = response.headers['content-type'] || 'application/octet-stream'
    const blob = new Blob([response.data], { type: contentType })
    const url = window.URL.createObjectURL(blob)
    window.open(url, '_blank')
  } catch (error) {
    Swal.close()
    Swal.fire('Error', 'No se pudo visualizar el archivo.', 'error')
  }
}

const handleFileReplace = async (event) => {
  const file = event.target.files[0]
  if (!file || !replaceTarget.value) return

  const formData = new FormData()
  formData.append('archivo', file)
  formData.append('filepath', replaceTarget.value)

  try {
    Swal.fire({
      title: 'Subiendo...',
      text: 'Reemplazando archivo',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading()
      }
    })

    const { data } = await api.post('/admin/archivos/replace', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    if (data.success) {
      Swal.fire('Reemplazado', 'El archivo ha sido actualizado correctamente.', 'success')
      loadTree(currentPath.value)
    }
  } catch (error) {
    Swal.fire('Error', 'No se pudo reemplazar el archivo.', 'error')
  } finally {
    event.target.value = null // reset
    replaceTarget.value = null
  }
}

const breadcrumbs = computed(() => {
  if (!currentPath.value) return ['Directorio Raíz']
  const parts = currentPath.value.split('/')
  return ['Directorio Raíz', ...parts]
})

const formatSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Intl.DateTimeFormat('es-MX', { 
    year: 'numeric', month: 'short', day: '2-digit', 
    hour: '2-digit', minute: '2-digit' 
  }).format(new Date(dateStr))
}

onMounted(() => {
  loadTree()
})
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div class="flex items-center gap-4">
        <div class="p-3 bg-iecm-morado-100 dark:bg-iecm-morado-950/30 text-iecm-morado-700 dark:text-iecm-morado-300 rounded-xl">
          <HardDrive class="w-6 h-6" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Gestión de Archivos</h1>
          <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">Explora, elimina y reemplaza los archivos del sistema.</p>
        </div>
      </div>
    </header>

    <AppCard>
      <div class="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100 dark:border-white/5">
        <div class="flex items-center gap-2 overflow-x-auto text-sm">
          <template v-for="(crumb, index) in breadcrumbs" :key="index">
            <span v-if="index > 0"><ChevronRight class="w-4 h-4 text-slate-400 dark:text-slate-500" /></span>
            <span :class="['whitespace-nowrap', index === breadcrumbs.length - 1 ? 'font-semibold text-iecm-morado dark:text-iecm-morado-400' : 'text-slate-500 dark:text-slate-400']">
              {{ crumb }}
            </span>
          </template>
        </div>
        
        <div class="flex items-center gap-2">
          <AppButton v-if="currentPath" @click="goUp" variant="outline" size="sm">
            <template #icon><ChevronLeft class="w-4 h-4" /></template>
            Atrás
          </AppButton>
          <AppButton @click="loadTree(currentPath)" variant="outline" size="sm" title="Refrescar">
            <template #icon><RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" /></template>
          </AppButton>
        </div>
      </div>

      <div v-if="loading" class="py-20 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-iecm-morado mx-auto"></div>
        <p class="mt-4 text-sm text-slate-500 dark:text-slate-400">Cargando directorio...</p>
      </div>

      <div v-else-if="entries.length === 0" class="py-20 text-center text-slate-400 dark:text-slate-500">
        <Folder class="w-16 h-16 mx-auto opacity-20 mb-4" />
        <p class="text-lg font-medium">Directorio vacío</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div 
          v-for="entry in entries" 
          :key="entry.name"
          class="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-white/10 hover:border-iecm-morado hover:shadow-sm transition-all group relative bg-white dark:bg-slate-900"
        >
          <!-- Icono (Carpeta o Archivo) -->
          <div 
            class="w-12 h-12 flex items-center justify-center rounded-lg shrink-0 cursor-pointer"
            :class="entry.isDir ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400'"
            @click="entry.isDir ? goToFolder(entry.name) : null"
          >
            <Folder v-if="entry.isDir" class="w-6 h-6" />
            <File v-else class="w-6 h-6" />
          </div>

          <!-- Información -->
          <div class="flex-1 min-w-0" @click="entry.isDir ? goToFolder(entry.name) : null" :class="{ 'cursor-pointer': entry.isDir }">
            <p class="font-semibold text-slate-800 dark:text-slate-200 truncate" :title="entry.name">{{ entry.name }}</p>
            <div class="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <span v-if="!entry.isDir">{{ formatSize(entry.size) }}</span>
              <span v-if="!entry.isDir">&bull;</span>
              <span v-if="!entry.isDir">{{ formatDate(entry.modified) }}</span>
              <span v-else>Carpeta</span>
            </div>
          </div>

          <!-- Acciones para Archivos -->
          <div v-if="!entry.isDir" class="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button @click.stop="viewFile(entry)" class="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg" title="Visualizar archivo">
              <Eye class="w-4 h-4" />
            </button>
            <button @click.stop="triggerReplace(entry.path)" class="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg" title="Reemplazar archivo">
              <Upload class="w-4 h-4" />
            </button>
            <button @click.stop="deleteFile(entry.path)" class="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg" title="Eliminar archivo">
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </AppCard>

    <!-- Hidden file input for replacing files -->
    <input type="file" ref="fileInputRef" class="hidden" @change="handleFileReplace" accept=".pdf,.jpg,.jpeg,.png,.gif" />
  </div>
</template>
