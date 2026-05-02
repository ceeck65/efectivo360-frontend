<template>
  <div class="staff-blueprint-view">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Blueprint de Gaveteros</h1>
        <p class="text-gray-600 mt-1">Gestiona las plantillas de gaveteros para todos los tenants</p>
      </div>
      <button
        @click="showCreateModal = true"
        class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
      >
        <Plus class="w-4 h-4" />
        Nuevo Template
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p class="text-gray-600 mt-4">Cargando templates...</p>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading && vaults.length === 0" class="text-center py-12">
      <h3 class="text-lg font-medium text-gray-900 mb-2">No se encontraron templates</h3>
      <p class="text-gray-600">Crea tu primer template de gavetero</p>
    </div>

    <!-- Vaults Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="vault in filteredVaults"
        :key="vault?.id || vault?.code || Math.random()"
        class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
      >
        <div class="p-6">
          <h3 class="font-semibold text-gray-900">{{ vault?.name || 'Sin nombre' }}</h3>
          <p class="text-gray-600 text-sm">{{ vault?.description || 'Sin descripción' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Plus } from 'lucide-vue-next'
import { httpClient } from '@/core/services/axios.config'

// State
const loading = ref(false)
const vaults = ref([])
const showCreateModal = ref(false)

// Computed
const filteredVaults = computed(() => {
  return vaults.value.filter(vault => vault && typeof vault === 'object')
})

// Methods
const loadVaults = async () => {
  try {
    loading.value = true
    const response = await httpClient.get('/api/v1/vaults/', { params: { blueprint_mode: true } })
    vaults.value = response.data
  } catch (error) {
    console.error('Error loading vault templates:', error)
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadVaults()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
