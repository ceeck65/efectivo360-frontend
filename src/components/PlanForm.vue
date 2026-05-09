<template>
  <form @submit.prevent="$emit('submit', planData)" class="space-y-6">
    <!-- Basic Fields -->
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <div>
        <label class="block text-sm font-medium text-gray-700">Nombre</label>
        <input
          :value="planData.name"
          @input="handleNameInput"
          type="text"
          required
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">SKU</label>
        <input
          :value="planData.sku"
          @input="handleSkuInput"
          type="text"
          required
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>
    </div>
    
    <!-- Dynamic Prices Section -->
    <div class="space-y-4">
      <div class="flex justify-between items-center">
        <label class="block text-sm font-medium text-gray-700">Precios</label>
        <button
          type="button"
          @click="addPrice"
          :disabled="planData.config?.is_courtesy"
          class="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Añadir Precio
        </button>
      </div>
      
      <div v-if="planData.config?.is_courtesy" class="bg-yellow-50 border border-yellow-200 rounded-md p-3">
        <p class="text-sm text-yellow-800">Los precios están deshabilitados porque este es un plan de cortesía (costo $0).</p>
      </div>
      
      <div v-if="pricesList.length === 0 && !planData.config?.is_courtesy" class="text-gray-500 text-sm">
        No hay precios configurados. Haz clic en "Añadir Precio" para agregar uno.
      </div>
      
      <div v-for="(price, index) in pricesList" :key="price.id" class="border border-gray-200 rounded-lg p-4 space-y-3">
        <div class="flex justify-between items-center">
          <h4 class="text-sm font-medium text-gray-900">Precio #{{ index + 1 }}</h4>
          <button
            type="button"
            @click="removePrice(price.id)"
            class="text-red-600 hover:text-red-800 text-sm"
          >
            Eliminar
          </button>
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700">Frecuencia</label>
            <select
              :value="price.frequency"
              @input="updatePriceFrequency(price.id, $event)"
              :disabled="planData.config?.is_courtesy"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
            >
              <option value="">Seleccionar...</option>
              <option value="monthly">Mensual</option>
              <option value="quarterly">Trimestral</option>
              <option value="yearly">Anual</option>
              <option value="weekly">Semanal</option>
              <option value="biannual">Semestral</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">Monto</label>
            <input
              :value="price.amount"
              @input="updatePriceAmount(price.id, $event)"
              type="number"
              step="0.01"
              min="0"
              :disabled="planData.config?.is_courtesy"
              placeholder="0.00"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">Moneda</label>
            <select
              :value="price.currency"
              @input="updatePriceCurrency(price.id, $event)"
              :disabled="planData.config?.is_courtesy"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="MXN">MXN</option>
              <option value="COP">COP</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Modules Section -->
    <div class="space-y-4">
      <label class="block text-sm font-medium text-gray-700">Módulos Disponibles</label>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <label v-for="module in availableModules" :key="module.value" class="flex items-center space-x-2">
          <input
            type="checkbox"
            :value="module.value"
            :checked="planData.config?.modules?.includes(module.value) || false"
            @input="toggleModule(module.value)"
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span class="text-sm text-gray-700">{{ module.label }}</span>
        </label>
      </div>
    </div>

    <!-- Limits Section -->
    <div class="space-y-4">
      <label class="block text-sm font-medium text-gray-700">Límites</label>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Límite de Documentos</label>
          <input
            :value="planData.config?.limits?.doc_limit"
            @input="handleDocLimitInput"
            type="number"
            placeholder="-1 para ilimitado"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Límite de Vaults</label>
          <input
            :value="planData.config?.limits?.vault_limit"
            @input="handleVaultLimitInput"
            type="number"
            placeholder="-1 para ilimitado"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>
    </div>

    <!-- Status and Promotions Section -->
    <div class="space-y-4">
      <label class="block text-sm font-medium text-gray-700">Estado y Promociones</label>
      <div class="space-y-3">
        <label class="flex items-center">
          <input
            type="checkbox"
            :checked="planData.config?.is_trial || false"
            @input="handleTrialInput"
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span class="ml-2 text-sm text-gray-700">Activar periodo de prueba</span>
        </label>
        
        <label class="flex items-center">
          <input
            type="checkbox"
            :checked="planData.config?.has_promo || false"
            @input="handlePromoInput"
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span class="ml-2 text-sm text-gray-700">Tiene promoción activa</span>
        </label>
        
        <label class="flex items-center">
          <input
            type="checkbox"
            :checked="planData.config?.is_courtesy || false"
            @input="handleCourtesyInput"
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span class="ml-2 text-sm text-gray-700">Es un plan de cortesía</span>
        </label>
      </div>
    </div>

    <!-- Status Toggle -->
    <div class="flex items-center space-x-3">
      <label class="flex items-center">
        <input
          type="checkbox"
          :checked="planData.is_active"
          @input="handleActiveInput"
          class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span class="ml-2 text-sm text-gray-700">Plan Activo</span>
      </label>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

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

interface PlanPrice {
  id: string
  frequency: string
  amount: string
  currency: string
}

interface Plan {
  id?: number
  name: string
  sku: string
  prices: Prices
  config: Config
  is_active: boolean
  is_public?: boolean
  sort_order?: number
  ulid?: string
}

interface Props {
  plan: Plan
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [plan: Plan]
  'update:name': [value: string]
  'update:sku': [value: string]
  'update:prices': [value: Prices]
  'update:doc_limit': [value: number]
  'update:vault_limit': [value: number]
  'update:is_active': [value: boolean]
  'update:is_public': [value: boolean]
  'update:modules': [value: string[]]
  'update:is_trial': [value: boolean]
  'update:has_promo': [value: boolean]
  'update:is_courtesy': [value: boolean]
}>()

const availableModules: Module[] = [
  { value: 'pos_base', label: 'POS Básico' },
  { value: 'pos_adv', label: 'POS Avanzado' },
  { value: 'inventory_full', label: 'Inventario Completo' },
  { value: 'inventory_adv', label: 'Inventario Avanzado' },
  { value: 'credits', label: 'Créditos' },
  { value: 'weight_calc', label: 'Cálculo de Peso' },
  { value: 'reports_pro', label: 'Reportes Profesionales' },
  { value: 'reports_basic', label: 'Reportes Básicos' },
  { value: 'vaults_basic', label: 'Vaults Básicos' },
  { value: 'vaults_adv', label: 'Vaults Avanzados' },
  { value: 'all', label: 'Todos los Módulos' }
]

const planData = computed<Plan>(() => ({
  ...props.plan,
  config: props.plan.config || { modules: [], limits: { doc_limit: 500, vault_limit: 3 }, is_trial: false, has_promo: false, is_courtesy: false },
  prices: props.plan.prices || {}
}))

// Convert prices object to array for editing
const pricesList = ref<PlanPrice[]>([])

// Initialize prices list from plan data
const initializePricesList = () => {
  const prices = planData.value.prices || {}
  pricesList.value = Object.entries(prices).map(([frequency, price]) => ({
    id: Math.random().toString(36).substr(2, 9),
    frequency,
    amount: price.amount,
    currency: price.currency
  }))
}

// Initialize on component mount
initializePricesList()

const handleNameInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:name', target.value)
}

const handleSkuInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:sku', target.value)
}

// Dynamic prices handlers
const addPrice = () => {
  const newPrice: PlanPrice = {
    id: Math.random().toString(36).substr(2, 9),
    frequency: '',
    amount: '',
    currency: 'USD'
  }
  pricesList.value.push(newPrice)
}

const removePrice = (id: string) => {
  const index = pricesList.value.findIndex(p => p.id === id)
  if (index > -1) {
    pricesList.value.splice(index, 1)
    updatePricesObject()
  }
}

const updatePriceFrequency = (id: string, event: Event) => {
  const target = event.target as HTMLSelectElement
  const price = pricesList.value.find(p => p.id === id)
  if (price) {
    price.frequency = target.value
    updatePricesObject()
  }
}

const updatePriceAmount = (id: string, event: Event) => {
  const target = event.target as HTMLInputElement
  const price = pricesList.value.find(p => p.id === id)
  if (price) {
    price.amount = target.value
    updatePricesObject()
  }
}

const updatePriceCurrency = (id: string, event: Event) => {
  const target = event.target as HTMLSelectElement
  const price = pricesList.value.find(p => p.id === id)
  if (price) {
    price.currency = target.value
    updatePricesObject()
  }
}

const updatePricesObject = () => {
  const prices: Prices = {}
  pricesList.value.forEach(price => {
    if (price.frequency && price.amount) {
      prices[price.frequency] = {
        amount: price.amount,
        currency: price.currency
      }
    }
  })
  emit('update:prices', prices)
}

const handleDocLimitInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:doc_limit', parseInt(target.value))
}

const handleVaultLimitInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:vault_limit', parseInt(target.value))
}

const handleActiveInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:is_active', target.checked)
}

const handleTrialInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:is_trial', target.checked)
}

const handlePromoInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:has_promo', target.checked)
}

const handleCourtesyInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:is_courtesy', target.checked)
  
  // If courtesy is enabled, clear all prices
  if (target.checked) {
    pricesList.value = []
    emit('update:prices', {})
  }
}

const toggleModule = (moduleValue: string) => {
  const currentModules = [...(planData.value.config?.modules || [])]
  const index = currentModules.indexOf(moduleValue)
  
  if (index > -1) {
    currentModules.splice(index, 1)
  } else {
    currentModules.push(moduleValue)
  }
  
  emit('update:modules', currentModules)
}
</script>
