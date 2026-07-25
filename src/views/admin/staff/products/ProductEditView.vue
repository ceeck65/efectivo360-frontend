<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useApi } from '@/composables/useApi'
import { useNotify } from '@/composables/useNotify'
import {
  Loader2, Save, X, Package, DollarSign, TrendingUp,
  ShieldCheck, Pencil, Trash2, Plus, ChevronDown,
  GripVertical, BadgeCheck, Hash, Barcode, FileText,
  ImagePlus, Tag, Layers, Percent, Globe, Building2,
  Warehouse, Truck, Scale, Thermometer,
} from 'lucide-vue-next'

const { fetchApi } = useApi()
const { success: notifySuccess, error: notifyError } = useNotify()
const route = useRoute()
const router = useRouter()

const activeTab = ref('general')
const isLoading = ref(true)
const isSaving = ref(false)
const bcvRate = ref(0)

const form = reactive({
  id: '',
  name: '',
  sku: '',
  barcode: '',
  description: '',
  image: '',
  brand_name: '',
  brand_id: '',
  category_name: '',
  category_id: '',
  is_active: true,
  tax_rate_id: '',
  product_type_id: '',
  is_igtf_applicable: false,
  is_fractionable: false,
  requires_weight: false,
  sale_type: 'UNIT',
  behavior_type: 'STANDARD',
  minimum_stock: 0,
  measurement_type: 'UNIDAD',
  container_type: 'CAJA',
  weight_container: 'SACO',
  liquid_container: 'BIDON',
  cantidad_contenedores: 1,
  capacidad_por_contenedor: 1,
  cost_price_usd: 0,
  cost_price_ves: 0,
  initial_physical_stock: 0,
  initial_cost_price: 0,
  suggested_price: 0,
  suggested_price_ves: 0,
  profit_margin: 30,
  margin_type: 'TRADITIONAL',
  inventory_method: 'AVERAGE',
  default_purchase_unit: 'UNIT',
  units_per_package: 1,
})

const presentations = ref([])
const globalProduct = ref(null)
const totalStock = ref(0)
const productImage = ref('')
const selectedImageFile = ref<File | null>(null)
const variants = ref<VariantRow[]>([])

interface VariantRow {
  id: string
  sku: string
  barcode: string
  stock: number
  price_base: number
  attribute_values: Record<string, string>
}

interface DynamicAttribute {
  id: string | number
  code: string
  label: string
  attr_type: string
  unit?: string
  options: { value: string; label: string }[]
}

const categoryAttributes = ref<DynamicAttribute[]>([])
const loadingAttributes = ref(false)

const productUlid = computed(() => route.params.id)

const anchorPrice = computed(() => {
  const anchor = presentations.value
    .flatMap(p => p.prices || [])
    .find(pr => pr.is_anchor)
  return anchor?.retail_price || 0
})

const tabs = [
  { key: 'general', label: 'Datos Generales', icon: FileText },
  { key: 'prices', label: 'Presentaciones y Precios', icon: DollarSign },
  { key: 'logistics', label: 'Logística e Impuestos', icon: Truck },
  { key: 'variants', label: 'Variantes', icon: Layers },
]

onMounted(async () => {
  try {
    const res = await fetchApi(`/api/v1/products/${productUlid.value}/`)
    applyProductData(res)
    const rateRes = await fetchApi('/api/v1/forex/bcv-rate/').catch(() => null)
    if (rateRes?.rate) bcvRate.value = rateRes.rate
  } catch (e) {
    notifyError('Error al cargar el producto')
    router.back()
  } finally {
    isLoading.value = false
  }
})

async function loadCategoryAttributes() {
  const catId = form.category_id
  if (!catId) {
    categoryAttributes.value = []
    return
  }
  loadingAttributes.value = true
  try {
    const res = await fetchApi<any>(
      `/api/v1/catalog/smart-categories/${catId}/attributes/`
    )
    categoryAttributes.value = (Array.isArray(res) ? res : []).map(a => ({
      id: a.id,
      code: a.code,
      label: a.label,
      attr_type: a.attr_type,
      unit: a.unit,
      options: a.options || [],
    }))
  } catch {
    categoryAttributes.value = []
  } finally {
    loadingAttributes.value = false
  }
}

function applyProductData(data) {
  form.id = data.id || ''
  form.sku = data.effective_sku || data.global_product?.sku || ''
  form.name = data.effective_name || data.global_product?.official_name || ''
  form.barcode = data.global_product?.sku || form.sku
  form.is_active = data.is_active ?? true
  form.tax_rate_id = data.tax_rate_id || ''
  form.product_type_id = data.product_type_id || ''
  form.is_igtf_applicable = data.is_igtf_applicable ?? false
  form.is_fractionable = data.is_fractionable ?? false
  form.requires_weight = data.requires_weight ?? false
  form.sale_type = data.sale_type || 'UNIT'
  form.behavior_type = data.behavior_type || 'STANDARD'
  form.minimum_stock = data.minimum_stock || 0
  form.container_type = data.container_type || 'CAJA'
  form.capacidad_por_contenedor = data.container_capacity ?? 1
  form.cantidad_contenedores = data.containers_count ?? 1
  globalProduct.value = data.global_product || null
  form.brand_name = data.brand_name || data.global_product?.brand?.name || ''
  form.brand_id = data.brand_id || data.global_product?.brand?.ulid || ''
  form.category_name = data.category_name || data.global_product?.smart_category?.name || ''
  form.category_id = data.category_id || data.global_product?.smart_category?.ulid || ''
  totalStock.value = data.total_stock ?? 0
  productImage.value = data.image || ''
  loadCategoryAttributes()

  const presList = (data.presentations || []).map(p => ({
    id: p.id,
    name: p.name || 'UNIDAD',
    sku: p.sku || '',
    units_per_package: parseFloat(p.units_per_package ?? p.multiplier ?? 1),
    barcode: p.barcode || '',
    is_base_unit: p.is_base_unit || false,
    is_default: p.is_default || false,
    expanded: false,
    prices: (p.prices || []).map(pr => ({
      id: pr.id,
      currency_code: pr.currency_code || pr.currency?.code || 'USD',
      cost: parseFloat(pr.cost || 0),
      retail_price: parseFloat(pr.retail_price || 0),
      profit_margin: parseFloat(pr.profit_margin || 0),
      is_anchor: pr.is_anchor || false,
    })),
  }))

  if (presList.length === 0) {
    presList.push({
      id: null,
      name: 'UNIDAD',
      sku: form.sku,
      units_per_package: 1,
      barcode: form.barcode,
      is_base_unit: true,
      is_default: true,
      expanded: true,
      prices: [
        { id: null, currency_code: 'USD', cost: 0, retail_price: 0, profit_margin: 30, is_anchor: true },
        { id: null, currency_code: 'VES', cost: 0, retail_price: 0, profit_margin: 30, is_anchor: false },
      ],
    })
  }

  presentations.value = presList

  variants.value = (data.variants || []).map((v: any) => ({
    id: v.id || '',
    sku: v.sku || '',
    barcode: v.barcode || '',
    stock: Number(v.stock) || 0,
    price_base: Number(v.price_base) || 0,
    attribute_values: v.attribute_values || {},
  }))
}

function getPrice(presentation, currencyCode) {
  return presentation.prices.find(p => p.currency_code === currencyCode)
}

function ensurePrice(presentation, currencyCode) {
  let price = getPrice(presentation, currencyCode)
  if (!price) {
    price = { id: null, currency_code: currencyCode, cost: 0, retail_price: 0, profit_margin: 30, is_anchor: currencyCode === 'USD' }
    presentation.prices.push(price)
  }
  return price
}

function recalcRetailPrice(presentation, currencyCode) {
  const price = getPrice(presentation, currencyCode)
  if (!price) return
  if (form.margin_type === 'TRADITIONAL') {
    price.retail_price = parseFloat((price.cost * (1 + price.profit_margin / 100)).toFixed(2))
  } else {
    if (price.profit_margin >= 100) return
    price.retail_price = parseFloat((price.cost / (1 - price.profit_margin / 100)).toFixed(2))
  }
}

function recalcMargin(presentation, currencyCode) {
  const price = getPrice(presentation, currencyCode)
  if (!price || price.cost <= 0) return
  if (form.margin_type === 'TRADITIONAL') {
    price.profit_margin = parseFloat((((price.retail_price - price.cost) / price.cost) * 100).toFixed(2))
  } else {
    price.profit_margin = parseFloat((((price.retail_price - price.cost) / price.retail_price) * 100).toFixed(2))
  }
}

function addPresentation() {
  presentations.value.push({
    id: null,
    name: 'NUEVA',
    sku: form.sku,
    units_per_package: 1,
    barcode: '',
    is_base_unit: false,
    is_default: false,
    expanded: true,
    prices: [
      { id: null, currency_code: 'USD', cost: 0, retail_price: 0, profit_margin: 30, is_anchor: false },
      { id: null, currency_code: 'VES', cost: 0, retail_price: 0, profit_margin: 30, is_anchor: false },
    ],
  })
}

function removePresentation(index) {
  presentations.value.splice(index, 1)
}

function togglePresentation(index) {
  presentations.value[index].expanded = !presentations.value[index].expanded
}

const fileInput = ref<HTMLInputElement | null>(null)

function triggerFileSelect() {
  fileInput.value?.click()
}

function onFileSelected(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  selectedImageFile.value = file
  const reader = new FileReader()
  reader.onload = (ev) => {
    productImage.value = ev.target?.result as string
  }
  reader.readAsDataURL(file)
  target.value = ''
}

function buildEmptyAttributeValues(): Record<string, string> {
  const vals: Record<string, string> = {}
  for (const attr of categoryAttributes.value) {
    vals[String(attr.id)] = ''
  }
  return vals
}

function addVariantRow() {
  variants.value.push({
    id: '',
    sku: '',
    barcode: '',
    stock: 0,
    price_base: 0,
    attribute_values: buildEmptyAttributeValues(),
  })
}

function removeVariantRow(index: number) {
  variants.value.splice(index, 1)
}

async function saveProduct() {
  if (!form.name.trim()) {
    notifyError('El nombre del producto es obligatorio')
    return
  }

  isSaving.value = true
  try {
    const payload: Record<string, any> = {
      is_active: form.is_active,
      container_type: form.container_type,
      container_capacity: parseInt(form.capacidad_por_contenedor) || undefined,
      containers_count: parseInt(form.cantidad_contenedores) || undefined,
      presentations: presentations.value.map(p => {
        const presPayload = {
          id: p.id || undefined,
          name: p.name,
          sku: p.sku || form.sku,
          multiplier: parseFloat(p.units_per_package) || 1,
          barcode: p.barcode || '',
          is_base_unit: p.is_base_unit || false,
          is_default: p.is_default || false,
          prices: p.prices.map(pr => ({
            currency: pr.currency_code,
            cost: parseFloat(pr.cost) || 0,
            retail_price: parseFloat(pr.retail_price) || 0,
            profit_margin: parseFloat(pr.profit_margin) || 0,
            is_anchor: pr.is_anchor || false,
          })),
        }
        return presPayload
      }),
    }

    if (selectedImageFile.value) {
      const fd = new FormData()
      fd.append('image', selectedImageFile.value)
      fd.append('is_active', String(form.is_active))
      fd.append('container_type', form.container_type)
      fd.append('container_capacity', String(form.capacidad_por_contenedor))
      fd.append('containers_count', String(form.cantidad_contenedores))
      fd.append('presentations', JSON.stringify(payload.presentations))
      if (variants.value.length > 0) {
        fd.append('variants', JSON.stringify(variants.value.map(v => ({
          sku: v.sku,
          barcode: v.barcode || '',
          stock: v.stock || 0,
          price_base: v.price_base || 0,
          attribute_values: v.attribute_values || {},
        }))))
      }
      await fetchApi(`/api/v1/products/${productUlid.value}/`, {
        method: 'PATCH',
        data: fd,
      })
      selectedImageFile.value = null
    } else {
      if (variants.value.length > 0) {
        payload.variants = variants.value.map(v => ({
          sku: v.sku,
          barcode: v.barcode || '',
          stock: v.stock || 0,
          price_base: v.price_base || 0,
          attribute_values: v.attribute_values || {},
        }))
      }
      await fetchApi(`/api/v1/products/${productUlid.value}/`, {
        method: 'PATCH',
        data: payload,
      })
    }

    notifySuccess('Producto actualizado exitosamente')
    const res = await fetchApi(`/api/v1/products/${productUlid.value}/`)
    applyProductData(res)
  } catch (e) {
    const drfData = e?.response?.data ?? e?.data
    if (drfData && typeof drfData === 'object') {
      const msgs = Object.values(drfData).flat().filter(Boolean).join('. ')
      if (msgs) notifyError(msgs)
      else notifyError('Error al guardar el producto')
    } else {
      notifyError(e?.message || 'Error al guardar el producto')
    }
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50/50 pb-20">

    <!-- STICKY HEADER -->
    <header class="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-6 py-3 backdrop-blur shadow-sm">
      <div class="mx-auto flex max-w-7xl items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center">
            <img
              v-if="productImage"
              :src="productImage"
              :alt="form.name"
              class="h-full w-full object-cover"
              @error="(e) => { e.target.style.display = 'none'; (e.target.nextElementSibling || e.target.parentElement.querySelector('.fallback')).style.display = 'flex' }"
            />
            <span v-show="!productImage" class="fallback text-base text-slate-400">📦</span>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-lg font-bold text-slate-900">{{ form.name || 'Cargando...' }}</h1>
              <span
                class="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                :class="form.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'"
              >
                {{ form.is_active ? 'Activo' : 'Inactivo' }}
              </span>
            </div>
            <p class="text-xs text-slate-500">
              SKU: <span class="font-mono font-medium text-slate-700">{{ form.sku }}</span>
              <span class="mx-1.5 text-slate-300">|</span>
              Stock total: <span class="font-medium" :class="totalStock > 0 ? 'text-slate-700' : 'text-rose-600'">{{ Number(totalStock).toLocaleString('es-VE') }} uds</span>
              <span class="mx-1.5 text-slate-300">|</span>
              Precio ancla: <span class="font-medium text-emerald-600">${{ anchorPrice.toFixed(2) }}</span>
              <span class="mx-1.5 text-slate-300">|</span>
              Tasa BCV: <span class="font-medium text-slate-700">Bs. {{ bcvRate.toFixed(2) }}</span>
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button
            @click="router.push('/admin/staff/products')"
            class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <X class="w-4 h-4" />
            Cancelar
          </button>
          <button
            @click="saveProduct"
            :disabled="isSaving || isLoading"
            class="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
          >
            <Save class="w-4 h-4" />
            {{ isSaving ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
        </div>
      </div>
    </header>

    <!-- LOADING -->
    <div v-if="isLoading" class="flex items-center justify-center py-32">
      <Loader2 class="w-6 h-6 animate-spin text-blue-500" />
      <span class="ml-3 text-sm text-slate-500">Cargando producto...</span>
    </div>

    <!-- MAIN BODY -->
    <main v-else class="mx-auto max-w-7xl px-6 pt-6">

      <!-- TABS -->
      <div class="border-b border-slate-200 mb-6">
        <nav class="-mb-px flex space-x-8">
          <button
            v-for="t in tabs" :key="t.key"
            @click="activeTab = t.key"
            :class="[
              activeTab === t.key
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300',
              'border-b-2 py-3 px-1 text-sm flex items-center gap-2 transition-colors'
            ]"
          >
            <component :is="t.icon" class="w-4 h-4" />
            {{ t.label }}
          </button>
        </nav>
      </div>

      <!-- TAB 1: DATOS GENERALES -->
      <div v-show="activeTab === 'general'" class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- Global Identity Card -->
        <div class="lg:col-span-2 bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
          <div class="bg-amber-50/80 border-b border-amber-200 px-5 py-3 flex items-center gap-2">
            <ShieldCheck class="w-4 h-4 text-amber-600" />
            <span class="text-xs font-semibold text-amber-700 uppercase tracking-wider">Identidad Global (Catálogo Verificado)</span>
          </div>
          <div class="p-5 space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nombre del Producto</label>
              <input :value="form.name" readonly
                class="w-full h-10 px-3.5 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">SKU Maestro</label>
                <input :value="form.sku" readonly
                  class="w-full h-10 px-3.5 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed font-mono"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Código de Barras</label>
                <input :value="form.barcode" readonly
                  class="w-full h-10 px-3.5 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed font-mono"
                />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Marca Global</label>
                <input :value="form.brand_name || '—'" readonly
                  class="w-full h-10 px-3.5 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Categoría Global</label>
                <input :value="form.category_name || '—'" readonly
                  class="w-full h-10 px-3.5 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Tenant Customization Card -->
        <div class="lg:col-span-1 bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
          <div class="bg-blue-50/80 border-b border-blue-200 px-5 py-3 flex items-center gap-2">
            <Building2 class="w-4 h-4 text-blue-600" />
            <span class="text-xs font-semibold text-blue-700 uppercase tracking-wider">Configuración Local</span>
          </div>
          <div class="p-5 space-y-4">
            <!-- Image -->
            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Imagen del Producto</label>
              <div
                class="relative flex flex-col items-center justify-center w-full h-44 rounded-xl border-2 border-dashed cursor-pointer transition-colors overflow-hidden"
                :class="productImage ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-300 bg-slate-50 hover:border-slate-400'"
                @click="triggerFileSelect"
              >
                <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileSelected" />
                <div v-if="isSaving && selectedImageFile" class="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
                  <Loader2 class="w-6 h-6 animate-spin text-blue-600" />
                </div>
                <img
                  v-if="productImage"
                  :src="productImage"
                  class="max-h-full max-w-full object-contain p-2"
                  alt="Preview"
                  @error="(e) => { e.target.style.display = 'none'; productImage = '' }"
                />
                <div v-if="!productImage" class="flex flex-col items-center gap-2 text-slate-400">
                  <ImagePlus class="w-8 h-8" />
                  <span class="text-xs font-medium">Sin imagen disponible</span>
                </div>
              </div>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Descripción</label>
              <textarea v-model="form.description" rows="3" placeholder="Descripción del producto..."
                class="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
            </div>
            <div>
              <label class="flex items-center gap-3 cursor-pointer">
                <div class="relative">
                  <input type="checkbox" v-model="form.is_active" class="sr-only peer" />
                  <div class="w-9 h-5 bg-slate-200 rounded-full peer-checked:bg-emerald-500 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:shadow after:transition-all peer-checked:after:translate-x-4"></div>
                </div>
                <span class="text-sm font-medium text-slate-700">Producto Activo</span>
              </label>
            </div>
            <!-- Stock Summary -->
            <div class="border-t border-slate-100 pt-3">
              <div class="flex items-center justify-between text-sm">
                <span class="text-slate-500 font-medium">Stock Real</span>
                <span class="font-bold" :class="totalStock > 0 ? 'text-slate-800' : 'text-rose-600'">
                  {{ Number(totalStock).toLocaleString('es-VE') }} uds
                </span>
              </div>
              <div class="flex items-center justify-between text-sm mt-1.5">
                <span class="text-slate-500 font-medium">Stock Mínimo</span>
                <span class="font-bold text-slate-800">{{ Number(form.minimum_stock).toLocaleString('es-VE') }} uds</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- TAB 2: PRESENTACIONES Y PRECIOS -->
      <div v-show="activeTab === 'prices'" class="space-y-6">

        <!-- Margin Type Selector -->
        <div class="bg-white border border-slate-200 shadow-sm rounded-xl p-5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Percent class="w-4 h-4 text-slate-500" />
              <span class="text-sm font-semibold text-slate-700">Método de Cálculo de Margen</span>
            </div>
            <div class="flex gap-2">
              <button
                @click="form.margin_type = 'TRADITIONAL'"
                :class="form.margin_type === 'TRADITIONAL' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'"
                class="px-4 py-1.5 text-xs font-semibold rounded-lg border transition-colors"
              >
                Margen Tradicional
              </button>
              <button
                @click="form.margin_type = 'FINANCIAL'"
                :class="form.margin_type === 'FINANCIAL' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'"
                class="px-4 py-1.5 text-xs font-semibold rounded-lg border transition-colors"
              >
                Margen Financiero
              </button>
            </div>
          </div>
        </div>

        <!-- Presentations Table -->
        <div class="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div class="flex items-center gap-2">
              <Layers class="w-4 h-4 text-slate-500" />
              <span class="text-sm font-semibold text-slate-700">Matriz de Presentaciones</span>
              <span class="text-xs text-slate-400">({{ presentations.length }})</span>
            </div>
            <button @click="addPresentation"
              class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Plus class="w-3.5 h-3.5" />
              Agregar Presentación
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-slate-200 bg-slate-50/80">
                  <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-8"></th>
                  <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Presentación</th>
                  <th class="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Unidades</th>
                  <th class="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Costo USD</th>
                  <th class="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Margen %</th>
                  <th class="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Precio Venta USD</th>
                  <th class="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Precio Venta VES</th>
                  <th class="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ancla</th>
                  <th class="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-16"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(pres, i) in presentations" :key="pres.id || i"
                  class="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                >
                  <td class="px-4 py-3">
                    <button @click="togglePresentation(i)" class="text-slate-400 hover:text-slate-600">
                      <ChevronDown class="w-4 h-4 transition-transform" :class="pres.expanded ? 'rotate-0' : '-rotate-90'" />
                    </button>
                  </td>
                  <td class="px-4 py-3">
                    <input v-model="pres.name"
                      class="w-28 px-2 py-1 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                      placeholder="UNIDAD"
                    />
                  </td>
                  <td class="px-3 py-3 text-center">
                    <input v-model.number="pres.units_per_package" type="number" step="0.001" min="0"
                      class="w-20 px-2 py-1 text-sm border border-slate-200 rounded-md bg-white text-center focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                    />
                  </td>
                  <td class="px-3 py-3">
                    <div class="flex justify-end">
                      <input
                        :value="getPrice(pres, 'USD')?.cost ?? 0"
                        @input="(e) => { const p = ensurePrice(pres, 'USD'); p.cost = parseFloat(e.target.value) || 0; recalcRetailPrice(pres, 'USD') }"
                        type="number" step="0.01" min="0"
                        class="w-24 px-2 py-1 text-sm border border-slate-200 rounded-md bg-white text-right focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                      />
                    </div>
                  </td>
                  <td class="px-3 py-3">
                    <div class="flex justify-end">
                      <input
                        :value="getPrice(pres, 'USD')?.profit_margin ?? 30"
                        @input="(e) => { const p = ensurePrice(pres, 'USD'); p.profit_margin = parseFloat(e.target.value) || 0; recalcRetailPrice(pres, 'USD') }"
                        type="number" step="0.01" min="0"
                        class="w-20 px-2 py-1 text-sm border border-slate-200 rounded-md bg-white text-right focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                      />
                    </div>
                  </td>
                  <td class="px-3 py-3 text-right font-medium text-emerald-700">
                    ${{ (getPrice(pres, 'USD')?.retail_price ?? 0).toFixed(2) }}
                  </td>
                  <td class="px-3 py-3 text-right font-medium text-blue-700">
                    Bs. {{ (getPrice(pres, 'VES')?.retail_price ?? 0).toFixed(2) }}
                  </td>
                  <td class="px-3 py-3 text-center">
                    <BadgeCheck v-if="getPrice(pres, 'USD')?.is_anchor" class="w-4 h-4 text-emerald-500 mx-auto" />
                  </td>
                  <td class="px-3 py-3 text-center">
                    <button @click="removePresentation(i)" class="text-rose-400 hover:text-rose-600 transition-colors">
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Expanded presentation detail -->
        <div v-for="(pres, i) in presentations.filter(p => p.expanded)" :key="'detail-' + (pres.id || i)"
          class="bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-4"
        >
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Package class="w-4 h-4 text-slate-400" />
              {{ pres.name || 'Presentación' }}
              <span v-if="pres.is_default" class="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">DEFAULT</span>
            </h3>
            <span class="text-xs text-slate-400">SKU: {{ pres.sku || form.sku }}</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-3">
              <h4 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Precio USD</h4>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-[10px] font-medium text-slate-400 mb-1">Costo</label>
                  <div class="relative">
                    <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
                    <input
                      :value="getPrice(pres, 'USD')?.cost ?? 0"
                      @input="(e) => { const p = ensurePrice(pres, 'USD'); p.cost = parseFloat(e.target.value) || 0; recalcRetailPrice(pres, 'USD') }"
                      type="number" step="0.01" min="0"
                      class="w-full h-9 pl-6 pr-3 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label class="block text-[10px] font-medium text-slate-400 mb-1">Margen %</label>
                  <input
                    :value="getPrice(pres, 'USD')?.profit_margin ?? 30"
                    @input="(e) => { const p = ensurePrice(pres, 'USD'); p.profit_margin = parseFloat(e.target.value) || 0; recalcRetailPrice(pres, 'USD') }"
                    type="number" step="0.01" min="0"
                    class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label class="block text-[10px] font-medium text-slate-400 mb-1">Precio Venta</label>
                <div class="relative">
                  <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
                  <input
                    :value="getPrice(pres, 'USD')?.retail_price ?? 0"
                    @input="(e) => { const p = ensurePrice(pres, 'USD'); p.retail_price = parseFloat(e.target.value) || 0; recalcMargin(pres, 'USD') }"
                    type="number" step="0.01" min="0"
                    class="w-full h-9 pl-6 pr-3 text-sm border border-slate-300 rounded-lg bg-white font-medium text-emerald-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div class="space-y-3">
              <h4 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Precio VES</h4>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-[10px] font-medium text-slate-400 mb-1">Costo</label>
                  <div class="relative">
                    <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">Bs.</span>
                    <input
                      :value="getPrice(pres, 'VES')?.cost ?? 0"
                      @input="(e) => { const p = ensurePrice(pres, 'VES'); p.cost = parseFloat(e.target.value) || 0; recalcRetailPrice(pres, 'VES') }"
                      type="number" step="0.01" min="0"
                      class="w-full h-9 pl-8 pr-3 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label class="block text-[10px] font-medium text-slate-400 mb-1">Margen %</label>
                  <input
                    :value="getPrice(pres, 'VES')?.profit_margin ?? 30"
                    @input="(e) => { const p = ensurePrice(pres, 'VES'); p.profit_margin = parseFloat(e.target.value) || 0; recalcRetailPrice(pres, 'VES') }"
                    type="number" step="0.01" min="0"
                    class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label class="block text-[10px] font-medium text-slate-400 mb-1">Precio Venta</label>
                <div class="relative">
                  <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">Bs.</span>
                  <input
                    :value="getPrice(pres, 'VES')?.retail_price ?? 0"
                    @input="(e) => { const p = ensurePrice(pres, 'VES'); p.retail_price = parseFloat(e.target.value) || 0; recalcMargin(pres, 'VES') }"
                    type="number" step="0.01" min="0"
                    class="w-full h-9 pl-8 pr-3 text-sm border border-slate-300 rounded-lg bg-white font-medium text-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- TAB 3: LOGÍSTICA E IMPUESTOS -->
      <div v-show="activeTab === 'logistics'" class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- Tax & Fiscal -->
        <div class="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
          <div class="bg-indigo-50/80 border-b border-indigo-200 px-5 py-3 flex items-center gap-2">
            <Scale class="w-4 h-4 text-indigo-600" />
            <span class="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Configuración Fiscal</span>
          </div>
          <div class="p-5 space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tasa de IVA</label>
              <select v-model="form.tax_rate_id"
                class="w-full h-10 px-3.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Exento</option>
                <option value="GENERAL">General 16%</option>
                <option value="REDUCED">Reducido 8%</option>
                <option value="WITHHELD">Percibido</option>
              </select>
            </div>
            <label class="flex items-center gap-3 cursor-pointer">
              <div class="relative">
                <input type="checkbox" v-model="form.is_igtf_applicable" class="sr-only peer" />
                <div class="w-9 h-5 bg-slate-200 rounded-full peer-checked:bg-indigo-500 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:shadow after:transition-all peer-checked:after:translate-x-4"></div>
              </div>
              <span class="text-sm font-medium text-slate-700">Aplicar IGTF</span>
            </label>
          </div>
        </div>

        <!-- Measurement -->
        <div class="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
          <div class="bg-teal-50/80 border-b border-teal-200 px-5 py-3 flex items-center gap-2">
            <Scale class="w-4 h-4 text-teal-600" />
            <span class="text-xs font-semibold text-teal-700 uppercase tracking-wider">Unidades y Mediciones</span>
          </div>
          <div class="p-5 space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tipo de Medición</label>
              <div class="flex gap-2">
                <button
                  v-for="m in [{v:'UNIDAD',l:'Unidad'},{v:'PESO',l:'Peso'},{v:'LIQUIDO',l:'Líquido'}]" :key="m.v"
                  @click="form.measurement_type = m.v"
                  :class="form.measurement_type === m.v ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'"
                  class="px-4 py-2 text-xs font-semibold rounded-lg border transition-colors flex-1 text-center"
                >
                  {{ m.l }}
                </button>
              </div>
            </div>
            <div v-if="form.measurement_type === 'UNIDAD'" class="grid grid-cols-2 gap-3">
              <div v-for="c in [{v:'CAJA',l:'Caja'},{v:'BULTO',l:'Bulto'},{v:'PAQUETE',l:'Paquete'}]" :key="c.v">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" :value="c.v" v-model="form.container_type" class="text-blue-500" />
                  <span class="text-sm text-slate-700">{{ c.l }}</span>
                </label>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Cant. Contenedores</label>
                <input v-model.number="form.cantidad_contenedores" type="number" step="1" min="0"
                  class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Capacidad x Contenedor</label>
                <input v-model.number="form.capacidad_por_contenedor" type="number" step="0.001" min="0"
                  class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Inventory -->
        <div class="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
          <div class="bg-emerald-50/80 border-b border-emerald-200 px-5 py-3 flex items-center gap-2">
            <Warehouse class="w-4 h-4 text-emerald-600" />
            <span class="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Inventario</span>
          </div>
          <div class="p-5 space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Método de Inventario</label>
              <select v-model="form.inventory_method"
                class="w-full h-10 px-3.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="AVERAGE">Promedio Ponderado</option>
                <option value="FIFO">FIFO (PEPS)</option>
                <option value="LIFO">LIFO (UEPS)</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Unidad de Compra por Defecto</label>
              <select v-model="form.default_purchase_unit"
                class="w-full h-10 px-3.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="UNIT">Unidad</option>
                <option value="BOX">Caja</option>
                <option value="BULK">Granel</option>
                <option value="SACK">Saco</option>
                <option value="LOT">Lote</option>
                <option value="KG">Kilogramo</option>
                <option value="LITER">Litro</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Unidades por Empaque</label>
              <input v-model.number="form.units_per_package" type="number" step="0.001" min="0"
                class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Stock Mínimo</label>
              <input v-model.number="form.minimum_stock" type="number" step="0.001" min="0"
                class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <!-- Sale Type -->
        <div class="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
          <div class="bg-purple-50/80 border-b border-purple-200 px-5 py-3 flex items-center gap-2">
            <Tag class="w-4 h-4 text-purple-600" />
            <span class="text-xs font-semibold text-purple-700 uppercase tracking-wider">Tipo de Venta</span>
          </div>
          <div class="p-5 space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tipo</label>
              <select v-model="form.sale_type"
                class="w-full h-10 px-3.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="UNIT">Por Unidad</option>
                <option value="WEIGHT">Por Peso</option>
                <option value="BULK">Por Volumen</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Comportamiento</label>
              <select v-model="form.behavior_type"
                class="w-full h-10 px-3.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="STANDARD">Estándar</option>
                <option value="SERVICE">Servicio</option>
                <option value="CONSUMIBLE">Consumible</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tipo de Producto</label>
              <select v-model="form.product_type_id"
                class="w-full h-10 px-3.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar...</option>
                <option value="STOCK">Inventario</option>
                <option value="VARIANT">Variante</option>
                <option value="BUNDLE">Paquete</option>
                <option value="SERVICE">Servicio</option>
              </select>
            </div>
          </div>
        </div>

      </div>

      <!-- TAB 4: VARIANTES -->
      <div v-show="activeTab === 'variants'" class="space-y-6">
        <div class="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-fuchsia-50/50">
            <div class="flex items-center gap-2">
              <Layers class="w-4 h-4 text-fuchsia-600" />
              <span class="text-sm font-semibold text-slate-700">Matriz de Variantes</span>
              <span class="text-xs text-slate-400">({{ variants.length }})</span>
            </div>
            <button @click="addVariantRow"
              :disabled="categoryAttributes.length === 0"
              class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-fuchsia-600 bg-fuchsia-50 border border-fuchsia-200 rounded-lg hover:bg-fuchsia-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus class="w-3.5 h-3.5" />
              Agregar Variante
            </button>
          </div>

          <div v-if="loadingAttributes" class="p-12 text-center text-sm text-slate-400">
            Cargando atributos de la categoría...
          </div>

          <div v-else-if="categoryAttributes.length === 0" class="p-12 text-center">
            <Layers class="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p class="text-sm font-medium text-slate-500">No hay atributos configurados para esta categoría</p>
            <p class="text-xs text-slate-400 mt-1">Las variantes se crean a partir de los atributos de la categoría del producto.</p>
          </div>

          <div v-else-if="variants.length === 0" class="p-12 text-center">
            <Layers class="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p class="text-sm font-medium text-slate-500">No hay variantes configuradas</p>
            <p class="text-xs text-slate-400 mt-1">Agrega variantes para gestionar {{ categoryAttributes.map(a => a.label).join(', ') }}.</p>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-slate-200 bg-slate-50/80">
                  <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                  <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">SKU</th>
                  <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Código Barras</th>
                  <th v-for="attr in categoryAttributes" :key="attr.id"
                    class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider"
                  >{{ attr.label }}</th>
                  <th class="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock</th>
                  <th class="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Precio Base USD</th>
                  <th class="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-16"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(v, i) in variants" :key="v.id || i"
                  class="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                >
                  <td class="px-4 py-3 text-sm text-slate-500">{{ i + 1 }}</td>
                  <td class="px-4 py-3">
                    <input v-model="v.sku" type="text" placeholder="SKU"
                      class="w-32 px-2 py-1 text-sm border border-slate-200 rounded-md bg-white font-mono focus:outline-none focus:ring-1 focus:ring-fuchsia-400 focus:border-fuchsia-400"
                    />
                  </td>
                  <td class="px-4 py-3">
                    <input v-model="v.barcode" type="text" placeholder="Código"
                      class="w-28 px-2 py-1 text-sm border border-slate-200 rounded-md bg-white font-mono focus:outline-none focus:ring-1 focus:ring-fuchsia-400 focus:border-fuchsia-400"
                    />
                  </td>
                  <td v-for="attr in categoryAttributes" :key="attr.id" class="px-4 py-3">
                    <select v-if="attr.attr_type === 'select'"
                      v-model="v.attribute_values[String(attr.id)]"
                      class="w-full min-w-[100px] h-7 px-2 text-[11px] border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-fuchsia-400 focus:border-fuchsia-400 appearance-none cursor-pointer"
                    >
                      <option value="">Seleccionar...</option>
                      <option v-for="opt in (attr.options || [])" :key="opt.value" :value="opt.value">
                        {{ opt.label }}
                      </option>
                    </select>
                    <input v-else-if="attr.attr_type === 'decimal'"
                      v-model.number="v.attribute_values[String(attr.id)]" type="number" step="0.01" min="0" placeholder="0.00"
                      class="w-full min-w-[80px] h-7 px-2 text-[11px] border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-fuchsia-400 focus:border-fuchsia-400"
                    />
                    <input v-else-if="attr.attr_type === 'number'"
                      v-model.number="v.attribute_values[String(attr.id)]" type="number" step="1" min="0" placeholder="0"
                      class="w-full min-w-[80px] h-7 px-2 text-[11px] border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-fuchsia-400 focus:border-fuchsia-400"
                    />
                    <input v-else
                      v-model="v.attribute_values[String(attr.id)]" type="text" :placeholder="attr.label"
                      class="w-full min-w-[80px] h-7 px-2 text-[11px] border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-fuchsia-400 focus:border-fuchsia-400"
                    />
                  </td>
                  <td class="px-4 py-3 text-right">
                    <input v-model.number="v.stock" type="number" step="1" min="0"
                      class="w-16 px-2 py-1 text-sm border border-slate-200 rounded-md bg-white text-right focus:outline-none focus:ring-1 focus:ring-fuchsia-400 focus:border-fuchsia-400"
                    />
                  </td>
                  <td class="px-4 py-3 text-right">
                    <div class="relative inline-block">
                      <span class="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
                      <input v-model.number="v.price_base" type="number" step="0.01" min="0"
                        class="w-24 pl-4 pr-2 py-1 text-sm border border-slate-200 rounded-md bg-white text-right focus:outline-none focus:ring-1 focus:ring-fuchsia-400 focus:border-fuchsia-400"
                      />
                    </div>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <button @click="removeVariantRow(i)" class="text-rose-400 hover:text-rose-600 transition-colors">
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </main>
  </div>
</template>
