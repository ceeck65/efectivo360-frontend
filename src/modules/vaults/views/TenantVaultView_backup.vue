<template>
  <div class="tenant-vault-view">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Mis Gaveteros</h1>
        <p class="text-gray-600 mt-1">Gestiona los gaveteros de tu negocio</p>
      </div>
      <button
        @click="showCreateModal = true"
        class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
      >
        <Plus class="w-4 h-4" />
        Nuevo Gavetero
      </button>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Total Gaveteros</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.total }}</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Archive class="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Activos</p>
            <p class="text-2xl font-bold text-green-600">{{ stats.active }}</p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <CheckCircle class="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Inactivos</p>
            <p class="text-2xl font-bold text-red-600">{{ stats.inactive }}</p>
          </div>
          <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
            <XCircle class="w-6 h-6 text-red-600" />
          </div>
        </div>
      </div>
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Personalizados</p>
            <p class="text-2xl font-bold text-purple-600">{{ stats.custom }}</p>
          </div>
          <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <Settings class="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white p-4 rounded-lg shadow mb-6">
      <div class="flex gap-4 items-center">
        <div class="flex-1">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar gaveteros..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          v-model="filterType"
          class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los tipos</option>
          <option value="CASH">Caja de Efectivo</option>
          <option value="SAFE">Caja Fuerte</option>
          <option value="TERMINAL">Terminal de Pago</option>
          <option value="MOBILE">Caja Móvil</option>
          <option value="PETTY">Caja Chica</option>
          <option value="BANK">Bóveda del Banco</option>
          <option value="CUSTOM">Personalizado</option>
        </select>
        <select
          v-model="filterStatus"
          class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los estados</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
      </div>
    </div>

    <!-- Vaults Grid -->
    <div v-if="!loading && filteredVaults.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="vault in filteredVaults"
        :key="vault.id"
        class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
      >
        <div class="p-6">
          <!-- Header -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <component :is="getVaultIcon(vault.vault_type)" class="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 class="font-semibold text-gray-900">{{ vault.name }}</h3>
                <p class="text-sm text-gray-500">{{ vault.code }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span
                :class="[
                  'px-2 py-1 text-xs rounded-full',
                  vault.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                ]"
              >
                {{ vault.is_active ? 'Activo' : 'Inactivo' }}
              </span>
              <span
                v-if="vault.vault_type === 'CUSTOM'"
                class="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full"
              >
                CUSTOM
              </span>
            </div>
          </div>

          <!-- Description -->
          <p class="text-gray-600 text-sm mb-4 line-clamp-2">{{ vault.description }}</p>

          <!-- Details -->
          <div class="space-y-2 mb-4">
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Tipo:</span>
              <span class="font-medium">{{ getVaultTypeName(vault.vault_type) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Moneda:</span>
              <span class="font-medium">{{ vault.default_currency }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Capacidad:</span>
              <span class="font-medium">
                {{ vault.max_capacity ? formatCurrency(vault.max_capacity, vault.default_currency) : 'Ilimitada' }}
              </span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Autorización:</span>
              <span class="font-medium">{{ vault.requires_authorization ? 'Sí' : 'No' }}</span>
            </div>
          </div>

          <!-- Balance (simulated) -->
          <div class="bg-gray-50 p-3 rounded-lg mb-4">
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600">Balance Actual:</span>
              <span class="font-semibold text-green-600">
                {{ formatCurrency(getRandomBalance(), vault.default_currency) }}
              </span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-2">
            <button
              @click="viewVaultDetails(vault)"
              class="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 text-sm"
            >
              Ver Detalles
            </button>
            <button
              v-if="vault.vault_type === 'CUSTOM'"
              @click="editVault(vault)"
              class="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 text-sm"
            >
              Editar
            </button>
            <button
              v-else
              @click="viewInheritedTemplate(vault)"
              class="flex-1 bg-purple-100 text-purple-700 px-3 py-2 rounded-lg hover:bg-purple-200 text-sm"
            >
              Ver Plantilla
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p class="text-gray-600 mt-4">Cargando gaveteros...</p>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && filteredVaults.length === 0" class="text-center py-12">
      <div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Archive class="w-12 h-12 text-gray-400" />
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">
        {{ vaults.length === 0 ? 'No tienes gaveteros configurados' : 'No se encontraron gaveteros' }}
      </h3>
      <p class="text-gray-600 mb-4" v-if="vaults.length === 0">
        Parece que eres nuevo. Los gaveteros del Blueprint deberían haber sido creados automáticamente.
        Si no ves ningún gavetero, contacta al soporte técnico.
      </p>
      <p class="text-gray-600 mb-4" v-else>
        {{ searchQuery || filterType || filterStatus ? 'Intenta ajustar los filtros' : 'Crea tu primer gavetero personalizado' }}
      </p>
      <div class="flex gap-4 justify-center" v-if="vaults.length === 0">
        <button
          @click="loadVaults"
          class="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
        >
          Recargar
        </button>
        <button
          @click="showCreateModal = true"
          class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Crear Gavetero Personalizado
        </button>
      </div>
      <button
        v-else-if="!searchQuery && !filterType && !filterStatus"
        @click="showCreateModal = true"
        class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        Crear Gavetero Personalizado
      </button>
    </div>

    <!-- Vault Details Modal -->
    <VaultDetailsModal
      v-if="showDetailsModal"
      :vault="selectedVault"
      @close="showDetailsModal = false"
    />

    <!-- Create/Edit Modal -->
    <VaultCustomModal
      v-if="showCreateModal || editingVault"
      :vault="editingVault"
      @close="closeModal"
      @saved="onVaultSaved"
    />

    <!-- Template View Modal -->
    <VaultTemplateViewModal
      v-if="showTemplateModal"
      :vault="selectedTemplate"
      @close="showTemplateModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Plus, Archive, CheckCircle, XCircle, Settings, DollarSign, Shield, CreditCard, Smartphone, Wallet, Building2 } from 'lucide-vue-next'
import { httpClient } from '@/core/services/axios.config'
import VaultDetailsModal from '@/components/vaults/VaultDetailsModal.vue'
import VaultCustomModal from '@/components/vaults/VaultCustomModal.vue'
import VaultTemplateViewModal from '@/components/vaults/VaultTemplateViewModal.vue'

// Toast notification fallback
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  console.log(`[${type.toUpperCase()}] ${message}`);
  // TODO: Implementar toast cuando vue-toastification esté disponible
};

// State
const loading = ref(false)
const vaults = ref([])
const searchQuery = ref('')
const filterType = ref('')
const filterStatus = ref('')
const showCreateModal = ref(false)
const editingVault = ref(null)
const showDetailsModal = ref(false)
const selectedVault = ref(null)
const showTemplateModal = ref(false)
const selectedTemplate = ref(null)

// Computed
const filteredVaults = computed(() => {
  let filtered = vaults.value

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(vault => 
      vault.name.toLowerCase().includes(query) ||
      vault.code.toLowerCase().includes(query) ||
      vault.description.toLowerCase().includes(query)
    )
  }

  // Type filter
  if (filterType.value) {
    filtered = filtered.filter(vault => vault.vault_type === filterType.value)
  }

  // Status filter
  if (filterStatus.value) {
    const isActive = filterStatus.value === 'true'
    filtered = filtered.filter(vault => vault.is_active === isActive)
  }

  return filtered
})

const stats = computed(() => ({
  total: vaults.value.length,
  active: vaults.value.filter(v => v.is_active).length,
  inactive: vaults.value.filter(v => !v.is_active).length,
  custom: vaults.value.filter(v => v.vault_type === 'CUSTOM').length,
}))

// Methods
const loadVaults = async () => {
  try {
    loading.value = true
    const response = await httpClient.get('/api/v1/vaults/my_vaults/')
    vaults.value = response.data
  } catch (error) {
    console.error('Error loading vaults:', error)
    showToast('Error al cargar los gaveteros', 'error')
  } finally {
    loading.value = false
  }
}

const viewVaultDetails = (vault) => {
  selectedVault.value = vault
  showDetailsModal.value = true
}

const editVault = (vault) => {
  editingVault.value = { ...vault }
}

const closeModal = () => {
  showCreateModal.value = false
  editingVault.value = null
}

const onVaultSaved = () => {
  closeModal()
  loadVaults()
  showToast('Gavetero guardado exitosamente')
}

const viewInheritedTemplate = (vault) => {
  selectedTemplate.value = vault
  showTemplateModal.value = true
}

const getVaultIcon = (type) => {
  const icons = {
    CASH: DollarSign,
    SAFE: Shield,
    TERMINAL: CreditCard,
    MOBILE: Smartphone,
    PETTY: Wallet,
    BANK: Building2,
    CUSTOM: Settings,
  }
  return icons[type] || Archive
}

const getVaultTypeName = (type) => {
  const names = {
    CASH: 'Caja de Efectivo',
    SAFE: 'Caja Fuerte',
    TERMINAL: 'Terminal de Pago',
    MOBILE: 'Caja Móvil',
    PETTY: 'Caja Chica',
    BANK: 'Bóveda del Banco',
    CUSTOM: 'Personalizado',
  }
  return names[type] || type
}

const formatCurrency = (amount, currency) => {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: currency === 'VES' ? 'VES' : 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

const getRandomBalance = () => {
  // Simulated balance for demo purposes
  return Math.floor(Math.random() * 1000000) + 10000
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
