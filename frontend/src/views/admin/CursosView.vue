<script setup>
import { ref, onMounted, computed } from 'vue'
import { BookOpen, Search, Palette, Save, Check } from '@lucide/vue'
import api from '../../services/api'
import Swal from 'sweetalert2'
import AppCard from '../../components/ui/AppCard.vue'
import AppInput from '../../components/ui/AppInput.vue'
import AppSelect from '../../components/ui/AppSelect.vue'
import AppButton from '../../components/ui/AppButton.vue'
import AppBadge from '../../components/ui/AppBadge.vue'
import AppTable from '../../components/ui/AppTable.vue'

const cursos = ref([])
const loading = ref(true)
const search = ref('')
const selectedType = ref('')
const savingId = ref(null)

const loadCursos = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/admin/cursos')
    if (data.success) {
      cursos.value = data.data
    }
  } catch (error) {
    console.error('Error fetching cursos:', error)
    Swal.fire('Error', 'No se pudieron cargar los cursos del catálogo.', 'error')
  } finally {
    loading.value = false
  }
}

const getVertienteName = (idtipo) => {
  const types = {
    1: 'Talleres - Niñez',
    2: 'Talleres - Juventud',
    3: 'Talleres - Crianza',
    4: 'Intervenciones Educativas',
    5: 'Talleres - Ciudadanía'
  }
  return types[idtipo] || `Tipo ${idtipo}`
}

const getVertienteColor = (idtipo) => {
  if (idtipo === 4) return 'success'
  if (idtipo === 3) return 'warning'
  return 'info'
}

const filteredCursos = computed(() => {
  return cursos.value.filter(c => {
    const matchesSearch = c.descripcion.toLowerCase().includes(search.value.toLowerCase()) || String(c.idcurso).includes(search.value)
    const matchesType = !selectedType.value || Number(c.idtipo) === Number(selectedType.value)
    return matchesSearch && matchesType
  })
})

const updateColor = async (row, event) => {
  const newColor = event.target.value
  savingId.value = row.idcurso
  try {
    await api.put(`/admin/cursos/${row.idcurso}/color`, { color: newColor })
    row.color = newColor
  } catch (error) {
    console.error('Error updating curso color:', error)
    Swal.fire('Error', 'No se pudo guardar el color.', 'error')
  } finally {
    savingId.value = null
  }
}

const resetColor = async (row) => {
  savingId.value = row.idcurso
  try {
    await api.put(`/admin/cursos/${row.idcurso}/color`, { color: null })
    row.color = null
  } catch (error) {
    console.error('Error resetting curso color:', error)
    Swal.fire('Error', 'No se pudo restablecer el color.', 'error')
  } finally {
    savingId.value = null
  }
}

onMounted(() => {
  loadCursos()
})
</script>

<template>
  <div class="space-y-6">
    <header class="flex items-center justify-between mb-8">
      <div class="flex items-center gap-4">
        <div class="p-3 bg-iecm-morado-100 dark:bg-iecm-morado-950/30 text-iecm-morado-700 dark:text-iecm-morado-300 rounded-xl">
          <BookOpen class="w-6 h-6" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Catálogo de Cursos</h1>
          <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">Configura los colores identificadores y consulta el catálogo de talleres e intervenciones.</p>
        </div>
      </div>
    </header>

    <AppCard>
      <template #header>
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Filtros y Búsqueda</h2>
          <div class="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div class="w-full sm:w-64">
              <AppInput v-model="search" placeholder="Buscar por ID o descripción...">
                <template #icon><Search class="w-4 h-4" /></template>
              </AppInput>
            </div>
            <div class="w-full sm:w-48">
              <AppSelect v-model="selectedType" aria-label="Filtrar por Vertiente">
                <option value="">Todas las vertientes</option>
                <option value="1">Talleres - Niñez</option>
                <option value="2">Talleres - Juventud</option>
                <option value="3">Talleres - Crianza</option>
                <option value="4">Intervenciones</option>
                <option value="5">Talleres - Ciudadanía</option>
              </AppSelect>
            </div>
          </div>
        </div>
      </template>

      <AppTable :loading="loading" :is-empty="!loading && filteredCursos.length === 0" empty-message="No se encontraron cursos en el catálogo.">
        <template #head>
          <th class="px-6 py-3 text-left w-20">ID</th>
          <th class="px-6 py-3 text-left">Curso / Taller</th>
          <th class="px-6 py-3 text-left">Vertiente / Tipo</th>
          <th class="px-6 py-3 text-left w-32">Estado</th>
          <th class="px-6 py-3 text-center w-48">Color Asignado</th>
        </template>
        <template #body>
          <tr v-for="row in filteredCursos" :key="row.idcurso" class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <td class="px-6 py-4 font-bold text-slate-500 dark:text-slate-400">#{{ row.idcurso }}</td>
            <td class="px-6 py-4 font-medium text-slate-900 dark:text-white">{{ row.descripcion }}</td>
            <td class="px-6 py-4">
              <AppBadge :variant="getVertienteColor(row.idtipo)">{{ getVertienteName(row.idtipo) }}</AppBadge>
            </td>
            <td class="px-6 py-4">
              <AppBadge :variant="row.estatus === 1 ? 'success' : 'gray'">
                {{ row.estatus === 1 ? 'Activo' : 'Inactivo' }}
              </AppBadge>
            </td>
            <td class="px-6 py-4 text-center">
              <div class="flex items-center justify-center gap-4">
                <div class="relative w-10 h-10 rounded-full border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden flex items-center justify-center cursor-pointer transition-transform hover:scale-105" :style="{ backgroundColor: row.color || 'transparent' }">
                  <input
                    type="color"
                    :value="row.color || '#6B2D8B'"
                    @change="updateColor(row, $event)"
                    class="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    title="Seleccionar Color"
                  />
                  <Palette v-if="!row.color" class="w-5 h-5 text-slate-400" />
                  <Check v-else-if="savingId === row.idcurso" class="w-4 h-4 text-white animate-pulse" />
                </div>
                
                <button
                  v-if="row.color"
                  @click="resetColor(row)"
                  class="text-xs text-red-500 hover:text-red-700 font-semibold"
                  title="Restablecer a color automático"
                >
                  Restablecer
                </button>
                <span v-else class="text-xs text-slate-400 font-semibold italic">Automático</span>
              </div>
            </td>
          </tr>
        </template>
      </AppTable>
    </AppCard>
  </div>
</template>
