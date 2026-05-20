<template>
  <div class="p-6">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex justify-between items-center">
          <h1 class="text-2xl font-bold text-gray-900">Gestión de Planes de Suscripción</h1>
          <button
            @click="showCreateModal = true"
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4a2 2 0 01-2-2V6a2 2 0 01-2-2h16a2 2 0 012 2v16a2 2 0 012-2h-4z" />
            </svg>
            Crear Plan
          </button>
        </div>
      </div>

      <!-- Plans Table -->
      <div class="bg-white shadow-sm rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Módulos</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Límites</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="plan in plans" :key="plan.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ plan.name }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-500">{{ plan.sku }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-semibold text-gray-900">
                    <span v-if="plan.config?.is_courtesy" class="text-green-600">Gratis</span>
                    <div v-else class="space-y-1">
                      <div v-for="(price, frequency) in plan.prices" :key="String(frequency)" class="flex items-center gap-1">
                        <span class="font-medium">${{ price.amount }}</span>
                        <span class="text-gray-500 text-xs">({{ getFrequencyLabel(String(frequency)) }})</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex flex-wrap gap-1">
                    <template v-if="plan.modules_detail">
                      <span v-for="mod in plan.modules_detail" :key="mod.ulid"
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {{ mod.name }}
                      </span>
                    </template>
                    <template v-else>
                      <span v-for="module in plan.config.modules" :key="module"
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {{ getModuleName(module) }}
                      </span>
                    </template>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-500">
                    <div v-if="plan.config.limits.doc_limit === -1" class="text-green-600 font-medium">Ilimitado</div>
                    <div v-else>
                      <div>Documentos: {{ plan.config.limits.doc_limit || 'N/A' }}</div>
                      <div>Vaults: {{ plan.config.limits.vault_limit || 'N/A' }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <button
                    @click="togglePlanStatus(plan)"
                    :class="[
                      'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors',
                      plan.is_active
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    ]"
                  >
                    <span v-if="plan.is_active">Activo</span>
                    <span v-else>Inactivo</span>
                  </button>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex gap-2">
                    <button
                      @click="editPlan(plan)"
                      class="text-indigo-600 hover:text-indigo-900"
                    >
                      Editar
                    </button>
                    <button
                      @click="deletePlan(plan)"
                      class="text-red-600 hover:text-red-900"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Create/Edit Modal -->
      <div v-if="showCreateModal || showEditModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full z-50">
        <div class="flex items-center justify-center min-h-screen p-4">
          <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div class="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 class="text-lg font-medium text-gray-900">
                {{ showEditModal ? 'Editar Plan' : 'Crear Nuevo Plan' }}
              </h3>
              <button @click="closeModals" class="text-gray-400 hover:text-gray-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <PlanForm 
              :plan="currentPlan as Plan" 
              @submit="savePlan"
              @update:name="updatePlanField('name', $event)"
              @update:sku="updatePlanField('sku', $event)"
              @update:prices="updatePlanField('prices', $event)"
              @update:doc_limit="updatePlanLimit('doc_limit', $event)"
              @update:vault_limit="updatePlanLimit('vault_limit', $event)"
              @update:is_active="updatePlanField('is_active', $event)"
              @update:is_public="updatePlanField('is_public', $event)"
              @update:modules="updatePlanModules($event)"
              @update:is_trial="updatePlanConfig('is_trial', $event)"
              @update:has_promo="updatePlanConfig('has_promo', $event)"
              @update:is_courtesy="updatePlanConfig('is_courtesy', $event)"
            />
            
            <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                @click="closeModals"
                class="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import PlanForm from '@/components/PlanForm.vue'

// Types
interface Module {
  value: string
  label: string
}

interface Price {
  amount: string
  currency: string
}

interface Prices {
  [frequency: string]: Price
}

interface Limit {
  doc_limit: number
  vault_limit: number
}

interface Config {
  modules: string[]
  limits: Limit
  is_trial?: boolean
  has_promo?: boolean
  is_courtesy?: boolean
}

interface Plan {
  id: number
  name: string
  sku: string
  prices: Prices
  config: Config
  is_active: boolean
  is_public?: boolean
  sort_order: number
  ulid?: string
  modules_detail?: Array<{ id: number; ulid: string; name: string; slug: string }>
}

// Reactive data
const plans = ref<Plan[]>([])
const showCreateModal = ref(false)
const showEditModal = ref(false)
const currentPlan = ref<Partial<Plan>>({
  name: '',
  sku: '',
  prices: {},
  config: {
    modules: [],
    limits: {
      doc_limit: 500,
      vault_limit: 3
    },
    is_trial: false,
    has_promo: false,
    is_courtesy: false
  },
  is_active: true,
  is_public: true
})

const availableModules: Module[] = [
  { value: 'pos_base', label: 'POS Básico' },
  { value: 'pos_adv', label: 'POS Avanzado' },
  { value: 'inventory_full', label: 'Inventario Completo' },
  { value: 'inventory_adv', label: 'Inventario Avanzado' },
  { value: 'credits', label: 'Créditos' },
  { value: 'weight_calc', label: 'Cálculo de Peso' },
  { value: 'reports_pro', label: 'Reportes Profesionales' },
  { value: 'vaults_basic', label: 'Vaults Básicos' },
  { value: 'all', label: 'Todos los Módulos' }
]

// Simple notification functions
const showSuccess = (message: string) => {
  const notification = document.createElement('div')
  notification.textContent = message
  notification.className = 'fixed top-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50'
  document.body.appendChild(notification)
  
  setTimeout(() => {
    document.body.removeChild(notification)
  }, 3000)
}

const showError = (message: string) => {
  const notification = document.createElement('div')
  notification.textContent = message
  notification.className = 'fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50'
  document.body.appendChild(notification)
  
  setTimeout(() => {
    document.body.removeChild(notification)
  }, 3000)
}

// Helper functions
const getFrequencyLabel = (frequency: string): string => {
  const labels: { [key: string]: string } = {
    'monthly': 'Mensual',
    'quarterly': 'Trimestral',
    'yearly': 'Anual',
    'weekly': 'Semanal',
    'biannual': 'Semestral'
  }
  return labels[frequency] || frequency
}

const updatePlanField = (field: keyof Plan, value: any) => {
  if (currentPlan.value) {
    (currentPlan.value as any)[field] = value
  }
}

const updatePlanConfig = (field: keyof Config, value: any) => {
  if (!currentPlan.value?.config) {
    currentPlan.value!.config = {
      modules: [],
      limits: { doc_limit: 500, vault_limit: 3 },
      is_trial: false,
      has_promo: false,
      is_courtesy: false
    }
  }
  (currentPlan.value.config as any)[field] = value
}

const updatePlanLimit = (limitType: 'doc_limit' | 'vault_limit', value: number) => {
  if (!currentPlan.value?.config) {
    currentPlan.value!.config = {
      modules: [],
      limits: { doc_limit: 500, vault_limit: 3 },
      is_trial: false,
      has_promo: false,
      is_courtesy: false
    }
  }
  if (!currentPlan.value.config.limits) {
    currentPlan.value.config.limits = { doc_limit: 500, vault_limit: 3 }
  }
  currentPlan.value.config.limits[limitType] = value
}

const updatePlanModules = (modules: string[]) => {
  if (!currentPlan.value?.config) {
    currentPlan.value!.config = {
      modules: [],
      limits: { doc_limit: 500, vault_limit: 3 },
      is_trial: false,
      has_promo: false,
      is_courtesy: false
    }
  }
  currentPlan.value.config.modules = modules
}

// API functions
const apiCall = async (url: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      ...options
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('API call failed:', error)
    throw error
  }
}

const loadPlans = async () => {
  try {
    const data = await apiCall('/api/v1/subscription-plans/')
    plans.value = data.results || data
  } catch (error) {
    showError('Error cargando planes: ' + (error as Error).message)
  }
}

const savePlan = async () => {
  try {
    const url = showEditModal.value 
      ? `/api/v1/subscription-plans/${currentPlan.value.id}/`
      : '/api/v1/subscription-plans/'
    
    const method = showEditModal.value ? 'PUT' : 'POST'
    const data = {
      ...currentPlan.value,
      prices: currentPlan.value.prices || {}
    }
    
    await apiCall(url, {
      method,
      body: JSON.stringify(data)
    })
    
    showSuccess(showEditModal.value ? 'Plan actualizado correctamente' : 'Plan creado correctamente')
    closeModals()
    await loadPlans()
  } catch (error) {
    showError('Error guardando plan: ' + (error as Error).message)
  }
}

const togglePlanStatus = async (plan: Plan) => {
  try {
    await apiCall(`/api/v1/subscription-plans/${plan.id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: !plan.is_active })
    })
    
    showSuccess('Plan actualizado correctamente')
    await loadPlans()
  } catch (error) {
    showError('Error actualizando plan: ' + (error as Error).message)
  }
}

const deletePlan = async (plan: Plan) => {
  if (!confirm(`¿Estás seguro de que quieres eliminar el plan "${plan.name}"?`)) {
    return
  }
  
  try {
    await apiCall(`/api/v1/subscription-plans/${plan.id}/`, {
      method: 'DELETE'
    })
    
    showSuccess('Plan eliminado correctamente')
    await loadPlans()
  } catch (error) {
    showError('Error eliminando plan: ' + (error as Error).message)
  }
}

const editPlan = (plan: Plan) => {
  currentPlan.value = { ...plan }
  showEditModal.value = true
  showCreateModal.value = false
}

const closeModals = () => {
  showCreateModal.value = false
  showEditModal.value = false
  currentPlan.value = {
    name: '',
    sku: '',
    prices: {},
    config: {
      modules: [],
      limits: {
        doc_limit: 500,
        vault_limit: 3
      },
      is_trial: false,
      has_promo: false,
      is_courtesy: false
    },
    is_active: true,
    is_public: true
  }
}

const getModuleName = (moduleValue: string): string => {
  const module = availableModules.find(m => m.value === moduleValue)
  return module ? module.label : moduleValue
}

onMounted(() => {
  loadPlans()
})
</script>
