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
          <option value="CRYPTO">Bóveda Cripto</option>
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

    <!-- Vault Templates Grid -->
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
              <span class="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                TEMPLATE
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

          <!-- Financial Rules Preview -->
          <div v-if="vault.financial_rules && Object.keys(vault.financial_rules).length > 0" class="mb-4">
            <div class="bg-gray-50 p-3 rounded-lg">
              <p class="text-xs font-medium text-gray-700 mb-2">Reglas Financieras:</p>
              <div class="space-y-1">
                <div v-if="vault.financial_rules.min_amount" class="flex justify-between text-xs">
                  <span class="text-gray-600">Mínimo:</span>
                  <span>{{ formatCurrency(vault.financial_rules.min_amount, vault.default_currency) }}</span>
                </div>
                <div v-if="vault.financial_rules.max_amount" class="flex justify-between text-xs">
                  <span class="text-gray-600">Máximo:</span>
                  <span>{{ formatCurrency(vault.financial_rules.max_amount, vault.default_currency) }}</span>
                </div>
                <div v-if="vault.financial_rules.allowed_currencies" class="flex justify-between text-xs">
                  <span class="text-gray-600">Monedas:</span>
                  <span>{{ vault.financial_rules.allowed_currencies.join(', ') }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-2">
            <button
              @click="editVault(vault)"
              class="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 text-sm"
            >
              Editar
            </button>
            <button
              @click="cloneVault(vault)"
              class="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 text-sm"
            >
              Clonar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p class="text-gray-600 mt-4">Cargando templates...</p>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && filteredVaults.length === 0" class="text-center py-12">
      <div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Archive class="w-12 h-12 text-gray-400" />
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">No se encontraron templates</h3>
      <p class="text-gray-600 mb-4">
        {{ searchQuery || filterType || filterStatus ? 'Intenta ajustar los filtros' : 'Crea tu primer template de gavetero' }}
      </p>
      <button
        v-if="!searchQuery && !filterType && !filterStatus"
        @click="showCreateModal = true"
        class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        Crear Primer Template
      </button>
    </div>

    <!-- Create/Edit Modal -->
    <VaultTemplateModal
      v-if="showCreateModal || editingVault"
      :vault="editingVault"
      @close="closeModal"
      @saved="onVaultSaved"
    />

    <!-- Clone Modal -->
    <CloneVaultModal
      v-if="showCloneModal"
      :vault="cloningVault"
      @close="showCloneModal = false"
      @cloned="onVaultCloned"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Plus, Archive, DollarSign, Shield, CreditCard, Smartphone, Wallet, Building2, Bitcoin } from 'lucide-vue-next'
import { httpClient } from '@/core/services/axios.config'
import VaultTemplateModal from '@/components/vaults/VaultTemplateModal.vue'
import CloneVaultModal from '@/components/vaults/CloneVaultModal.vue'

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
const showCloneModal = ref(false)
const cloningVault = ref(null)

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

// Methods
const loadVaults = async () => {
  try {
    loading.value = true
    const response = await httpClient.get('/api/v1/vaults/', { params: { blueprint_mode: true } })
    vaults.value = response.data
  } catch (error) {
    console.error('Error loading vault templates:', error)
    showToast('Error al cargar los templates', 'error')
  } finally {
    loading.value = false
  }
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
  showToast('Template guardado exitosamente')
}

const cloneVault = (vault) => {
  cloningVault.value = vault
  showCloneModal.value = true
}

const onVaultCloned = () => {
  showCloneModal.value = false
  cloningVault.value = null
  showToast('Vault clonado exitosamente')
}

const getVaultIcon = (type) => {
  const icons = {
    CASH: DollarSign,
    SAFE: Shield,
    TERMINAL: CreditCard,
    MOBILE: Smartphone,
    PETTY: Wallet,
    BANK: Building2,
    CRYPTO: Bitcoin,
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
    CRYPTO: 'Bóveda Cripto',
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
