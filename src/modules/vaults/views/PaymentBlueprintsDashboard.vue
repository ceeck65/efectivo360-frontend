<template>
  <div class="space-y-6 p-6">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          <CreditCard class="h-8 w-8 text-cyan-500" />
          Blueprints de Métodos de Pago
        </h1>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Gestiona los moldes de pago y las plantillas de bóveda
        </p>
      </div>
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center gap-1.5 h-9 px-3 text-[11px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg">
          {{ totalCount }} blueprints
        </span>
        <button
          @click="loadAll"
          :disabled="loading"
          class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 dark:text-slate-300 dark:border-white/[0.06] dark:hover:bg-[#1a1f2e]"
        >
          <RefreshCw :class="['h-4 w-4', loading && 'animate-spin']" />
          Recargar
        </button>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-600" />
    </div>

    <template v-else>
      <!-- Summary Stats -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div v-for="stat in categoryStats" :key="stat.key"
          class="relative overflow-hidden rounded-xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-slate-50/90 p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.7)_inset,0_12px_40px_-12px_rgba(15,23,42,0.12)] dark:border-white/[0.07] dark:from-[#141824] dark:via-[#111620] dark:to-[#0c0f16] dark:shadow-[0_0_0_1px_rgba(56,189,248,0.06),0_20px_50px_-15px_rgba(0,0,0,0.55)]"
        >
          <div class="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[3px] bg-gradient-to-r opacity-95" :class="stat.bar" />
          <div class="relative z-[2] flex items-center justify-between">
            <div>
              <p class="text-[11px] font-semibold uppercase leading-snug tracking-[0.12em]" :class="stat.labelClass">{{ stat.label }}</p>
              <p class="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{{ stat.count }}</p>
            </div>
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1" :class="stat.iconWrap">
              <component :is="stat.icon" class="h-[18px] w-[18px]" stroke-width="1.5" :class="stat.iconColor" />
            </div>
          </div>
          <p class="mt-2 text-xs text-slate-400">{{ stat.availableCount }} disponibles para tiendas</p>
        </div>
      </div>

      <!-- Métodos de Pago -->
      <div class="rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_0_0_rgba(255,255,255,0.7)_inset,0_12px_40px_-12px_rgba(15,23,42,0.12)] dark:border-white/[0.07] dark:bg-[#141824] dark:shadow-[0_0_0_1px_rgba(56,189,248,0.06),0_20px_50px_-15px_rgba(0,0,0,0.55)]">
        <div class="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.07]">
          <div class="flex">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              @click="activeTab = tab.key"
              class="relative px-5 py-3 text-sm font-medium transition-colors"
              :class="activeTab === tab.key
                ? 'text-cyan-600 dark:text-cyan-400'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
            >
              <component :is="tab.icon" class="inline h-4 w-4 mr-1.5 -mt-0.5" />
              {{ tab.label }}
              <span class="ml-1.5 text-[11px] font-mono opacity-60">({{ tab.count }})</span>
              <span
                v-if="activeTab === tab.key"
                class="absolute inset-x-0 -bottom-px h-0.5 bg-cyan-500"
              />
            </button>
          </div>
          <div class="px-4">
            <button
              @click="openAddModal"
              class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700"
            >
              <Plus class="h-4 w-4" />
              Nuevo Blueprint
            </button>
          </div>
        </div>

        <div v-if="filteredBlueprints.length === 0" class="px-6 py-12 text-center">
          <CreditCard class="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p class="text-sm text-slate-400">No hay blueprints en esta categoría</p>
          <button @click="openAddModal" class="mt-3 text-sm text-cyan-600 hover:text-cyan-700 dark:text-cyan-400">
            + Crear primer blueprint
          </button>
        </div>

        <div v-else class="divide-y divide-slate-100 dark:divide-white/[0.06]">
          <div
            v-for="bp in filteredBlueprints"
            :key="bp.code"
            class="px-6 py-4 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <h3 class="text-sm font-semibold text-slate-900 dark:text-white">{{ bp.name }}</h3>
                  <code class="text-[11px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{{ bp.code }}</code>
                </div>
                <p class="mt-0.5 text-xs text-slate-500 line-clamp-1">{{ bp.description || 'Sin descripción' }}</p>

                <div class="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    v-if="bp.business_rules?.extra_commission"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                  >
                    <Percent class="h-3 w-3" />
                    Comisión extra
                  </span>
                  <span
                    v-if="bp.business_rules?.premium_only"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300"
                  >
                    <Crown class="h-3 w-3" />
                    Solo Premium
                  </span>
                  <span
                    v-if="bp.business_rules?.requires_receipt_photo"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                  >
                    <Camera class="h-3 w-3" />
                    Requiere foto
                  </span>
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <List class="h-3 w-3" />
                    {{ bp.config_schema?.fields?.length ?? 0 }} campos
                  </span>
                </div>
              </div>

              <div class="flex items-center gap-3 shrink-0">
                <label class="relative inline-flex items-center cursor-pointer" title="Disponible para tiendas">
                  <input
                    type="checkbox"
                    :checked="bp.is_available"
                    @change="toggleAvailability(bp.code)"
                    class="sr-only peer"
                  />
                  <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
                </label>
                <button
                  @click="openEditModal(bp)"
                  class="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 hover:bg-slate-50 dark:border-white/[0.06] dark:hover:bg-[#1a1f2e]"
                  title="Editar"
                >
                  <Pencil class="h-3.5 w-3.5 text-slate-500" />
                </button>

              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between px-6 py-3 border-t border-slate-200 dark:border-white/[0.07] text-xs text-slate-400">
          <span>{{ filteredBlueprints.length }} blueprints en {{ activeTabLabel }}</span>
          <span>Última actualización: {{ lastUpdated }}</span>
        </div>
      </div>
    </template>

    <!-- Add/Edit Modal -->
    <Teleport to="body">
      <div
        v-if="showModal"
        class="fixed inset-0 z-50 flex items-start justify-center pt-6 pb-8 overflow-y-auto"
      >
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="closeModal" />
        <div class="relative w-full max-w-3xl rounded-xl border border-slate-200/90 bg-white shadow-2xl dark:border-white/[0.07] dark:bg-[#141824]">
          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/[0.07]">
            <h2 class="text-lg font-semibold text-slate-900 dark:text-white">
              {{ editingBlueprint ? 'Editar Blueprint' : 'Nuevo Blueprint' }}
            </h2>
            <button @click="closeModal" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <X class="h-5 w-5" />
            </button>
          </div>

          <div class="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre</label>
                <input
                  v-model="form.name"
                  type="text"
                  class="w-full h-9 px-3 text-sm rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 dark:border-white/[0.07] dark:bg-[#1a1f2e] dark:text-white dark:focus:border-cyan-400"
                  placeholder="Ej: Stripe"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Slug</label>
                <input
                  v-model="form.slug"
                  type="text"
                  class="w-full h-9 px-3 text-sm rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 dark:border-white/[0.07] dark:bg-[#1a1f2e] dark:text-white dark:focus:border-cyan-400 font-mono"
                  placeholder="stripe"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Categoría</label>
                <select
                  v-model="form.category"
                  class="w-full h-9 px-3 text-sm rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 dark:border-white/[0.07] dark:bg-[#1a1f2e] dark:text-white dark:focus:border-cyan-400"
                >
                  <option value="digital">Digital (API)</option>
                  <option value="manual">Manual (Transferencia)</option>
                  <option value="crypto">Cripto</option>
                </select>
              </div>
              <div class="flex items-end pb-1">
                <label class="relative inline-flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" v-model="form.is_available" class="sr-only peer" />
                  <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
                  <span class="text-xs font-medium text-slate-600 dark:text-slate-400">Disponible para tiendas</span>
                </label>
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Descripción</label>
              <textarea
                v-model="form.description"
                rows="2"
                class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 dark:border-white/[0.07] dark:bg-[#1a1f2e] dark:text-white dark:focus:border-cyan-400 resize-none"
                placeholder="Descripción del método de pago..."
              />
            </div>

            <div>
              <div class="flex items-center justify-between mb-3">
                <label class="text-xs font-semibold text-slate-700 dark:text-slate-300">Campos de Configuración</label>
                <button
                  @click="addSchemaField"
                  class="inline-flex items-center gap-1 h-7 px-3 text-[11px] font-medium text-cyan-600 border border-cyan-200 rounded-md hover:bg-cyan-50 dark:text-cyan-400 dark:border-cyan-500/30 dark:hover:bg-cyan-500/10"
                >
                  <Plus class="h-3 w-3" />
                  Añadir Campo
                </button>
              </div>
              <p class="text-[11px] text-slate-400 mb-3">Define los campos que el SaaS o la tienda deben llenar para usar este método.</p>

              <div v-if="form.schemaFields.length === 0" class="text-center py-6 rounded-lg border border-dashed border-slate-200 dark:border-white/[0.07]">
                <List class="h-6 w-6 mx-auto text-slate-300 mb-2" />
                <p class="text-xs text-slate-400">Sin campos definidos.</p>
              </div>

              <div v-else class="space-y-3">
                <div
                  v-for="(field, idx) in form.schemaFields"
                  :key="idx"
                  class="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-white/[0.07] bg-slate-50/50 dark:bg-white/[0.02]"
                >
                  <div class="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div>
                      <label class="block text-[10px] text-slate-500 mb-0.5">Key</label>
                      <input
                        v-model="field.key"
                        type="text"
                        class="w-full h-8 px-2 text-xs font-mono rounded border border-slate-200 bg-white focus:ring-1 focus:ring-cyan-500/20 focus:border-cyan-500 dark:border-white/[0.07] dark:bg-[#1a1f2e] dark:text-white"
                        placeholder="public_key"
                      />
                    </div>
                    <div>
                      <label class="block text-[10px] text-slate-500 mb-0.5">Label</label>
                      <input
                        v-model="field.label"
                        type="text"
                        class="w-full h-8 px-2 text-xs rounded border border-slate-200 bg-white focus:ring-1 focus:ring-cyan-500/20 focus:border-cyan-500 dark:border-white/[0.07] dark:bg-[#1a1f2e] dark:text-white"
                        placeholder="Public Key"
                      />
                    </div>
                    <div>
                      <label class="block text-[10px] text-slate-500 mb-0.5">Tipo</label>
                      <select
                        v-model="field.type"
                        class="w-full h-8 px-2 text-xs rounded border border-slate-200 bg-white focus:ring-1 focus:ring-cyan-500/20 focus:border-cyan-500 dark:border-white/[0.07] dark:bg-[#1a1f2e] dark:text-white"
                      >
                        <option value="text">Texto</option>
                        <option value="password">Contraseña</option>
                        <option value="number">Número</option>
                        <option value="select">Select</option>
                      </select>
                    </div>
                    <div class="flex items-center gap-2 pt-4">
                      <label class="flex items-center gap-1 cursor-pointer">
                        <input type="checkbox" v-model="field.required" class="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500/20 dark:bg-slate-800 dark:border-slate-600" />
                        <span class="text-[10px] text-slate-500">Req.</span>
                      </label>
                      <button @click="removeSchemaField(idx)" class="ml-auto text-slate-400 hover:text-red-500">
                        <X class="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-3">Reglas de Negocio</label>
              <div class="space-y-3">
                <label class="flex items-center justify-between px-4 py-2.5 rounded-lg border border-slate-200 dark:border-white/[0.07] cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                  <div class="flex items-center gap-3">
                    <Percent class="h-4 w-4 text-amber-500" />
                    <div>
                      <p class="text-sm font-medium text-slate-900 dark:text-white">Cobrar comisión extra</p>
                      <p class="text-xs text-slate-400">Aplica un cargo adicional al usar este método</p>
                    </div>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" v-model="form.businessRules.extra_commission" class="sr-only peer" />
                    <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600" />
                  </label>
                </label>

                <label class="flex items-center justify-between px-4 py-2.5 rounded-lg border border-slate-200 dark:border-white/[0.07] cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                  <div class="flex items-center gap-3">
                    <Crown class="h-4 w-4 text-purple-500" />
                    <div>
                      <p class="text-sm font-medium text-slate-900 dark:text-white">Activar solo en Plan Premium</p>
                      <p class="text-xs text-slate-400">Restringido a suscripciones premium</p>
                    </div>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" v-model="form.businessRules.premium_only" class="sr-only peer" />
                    <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600" />
                  </label>
                </label>

                <label class="flex items-center justify-between px-4 py-2.5 rounded-lg border border-slate-200 dark:border-white/[0.07] cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                  <div class="flex items-center gap-3">
                    <Camera class="h-4 w-4 text-blue-500" />
                    <div>
                      <p class="text-sm font-medium text-slate-900 dark:text-white">Requiere foto de comprobante</p>
                      <p class="text-xs text-slate-400">El cliente debe adjuntar una imagen del pago</p>
                    </div>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" v-model="form.businessRules.requires_receipt_photo" class="sr-only peer" />
                    <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </label>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-white/[0.07]">
            <button
              @click="closeModal"
              class="h-9 px-4 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 dark:text-slate-300 dark:border-white/[0.06] dark:hover:bg-[#1a1f2e]"
            >
              Cancelar
            </button>
            <button
              @click="saveBlueprint"
              :disabled="saving || !form.name || !form.slug"
              class="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:opacity-50"
            >
              <Save :class="['h-4 w-4', saving && 'animate-spin']" />
              {{ saving ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>


  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  CreditCard, RefreshCw, Plus, Pencil, X, Save,
  Percent, Crown, Camera, Banknote, Bitcoin, Zap, List,
} from 'lucide-vue-next'
import { httpClient } from '@/core/services/axios.config'

interface BusinessRules {
  extra_commission: boolean
  premium_only: boolean
  requires_receipt_photo: boolean
}

interface ConfigField {
  key: string
  label: string
  type: 'text' | 'password' | 'number' | 'select'
  required: boolean
  placeholder?: string
  options?: { label: string; value: string }[]
  help_text?: string
}

interface ConfigSchema {
  fields: ConfigField[]
}

interface PaymentBlueprint {
  code: string
  name: string
  config_schema: ConfigSchema
}

interface CategoryStat {
  key: string; label: string; count: number; availableCount: number
  icon: unknown; bar: string; iconWrap: string; iconColor: string; labelClass: string
}

interface Tab {
  key: string; label: string; icon: unknown; count: number
}

const loading = ref(false)
const saving = ref(false)
const blueprints = ref<PaymentBlueprint[]>([])
const activeTab = ref('digital')
const showModal = ref(false)
const editingBlueprint = ref<PaymentBlueprint | null>(null)


const form = ref({
  name: '',
  slug: '',
  category: 'digital' as 'digital' | 'manual' | 'crypto',
  description: '',
  schemaFields: [] as ConfigField[],
  businessRules: { extra_commission: false, premium_only: false, requires_receipt_photo: false } as BusinessRules,
  is_available: true,
})

const bpList = computed(() =>
  (blueprints.value ?? []).map(bp => ({
    ...bp,
    slug: bp.code,
    category: inferCategory(bp.code),
    description: bp.name,
    business_rules: { extra_commission: false, premium_only: false, requires_receipt_photo: false } as BusinessRules,
    is_available: true,
  }))
)

const tabs = computed<Tab[]>(() => [
  { key: 'digital', label: 'Digitales (API)', icon: Zap, count: bpList.value.filter(b => b.category === 'digital').length },
  { key: 'manual', label: 'Manuales (Transferencias)', icon: Banknote, count: bpList.value.filter(b => b.category === 'manual').length },
  { key: 'crypto', label: 'Cripto', icon: Bitcoin, count: bpList.value.filter(b => b.category === 'crypto').length },
])

function inferCategory(code: string): 'digital' | 'manual' | 'crypto' {
  const manual = ['transfer', 'pagomovil', 'western_union', 'airtm', 'reserve', 'transfer_international']
  const crypto = ['crypto']
  if (crypto.includes(code)) return 'crypto'
  if (manual.includes(code)) return 'manual'
  return 'digital'
}

const activeTabLabel = computed(() => tabs.value.find(t => t.key === activeTab.value)?.label ?? '')
const filteredBlueprints = computed(() => bpList.value.filter(b => b.category === activeTab.value))
const totalCount = computed(() => bpList.value.length)

const lastUpdated = computed(() => {
  if (bpList.value.length === 0) return '—'
  return new Date().toLocaleString('es-VE')
})

const categoryStats = computed<CategoryStat[]>(() => [
  { key: 'digital', label: 'Digitales (API)', count: filteredByCategory('digital'), availableCount: filteredByCategory('digital', true), icon: Zap, bar: 'from-cyan-500/90 via-blue-500/70 to-indigo-600/50', iconWrap: 'bg-cyan-500/12 text-cyan-600 ring-cyan-500/25 dark:bg-cyan-500/10 dark:text-cyan-300 dark:ring-cyan-400/30', iconColor: '', labelClass: 'text-slate-500 dark:text-slate-400' },
  { key: 'manual', label: 'Manuales (Transferencias)', count: filteredByCategory('manual'), availableCount: filteredByCategory('manual', true), icon: Banknote, bar: 'from-emerald-500/90 via-green-500/70 to-teal-600/50', iconWrap: 'bg-emerald-500/12 text-emerald-600 ring-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/30', iconColor: '', labelClass: 'text-slate-500 dark:text-slate-400' },
  { key: 'crypto', label: 'Cripto', count: filteredByCategory('crypto'), availableCount: filteredByCategory('crypto', true), icon: Bitcoin, bar: 'from-purple-500/90 via-violet-500/70 to-indigo-600/50', iconWrap: 'bg-purple-500/12 text-purple-600 ring-purple-500/25 dark:bg-purple-500/10 dark:text-purple-300 dark:ring-purple-400/30', iconColor: '', labelClass: 'text-slate-500 dark:text-slate-400' },
])

function filteredByCategory(cat: string, availableOnly = false): number {
  return bpList.value.filter(b => b.category === cat && (!availableOnly || b.is_available)).length
}

function addSchemaField() {
  form.value.schemaFields.push({ key: '', label: '', type: 'text', required: false })
}

function removeSchemaField(idx: number) {
  form.value.schemaFields.splice(idx, 1)
}

function resetForm() {
  form.value = {
    name: '',
    slug: '',
    category: 'digital' as const,
    description: '',
    schemaFields: [],
    businessRules: { extra_commission: false, premium_only: false, requires_receipt_photo: false },
    is_available: true,
  }
  editingBlueprint.value = null
}

function openAddModal() {
  resetForm()
  showModal.value = true
}

function openEditModal(bp: PaymentBlueprint & Record<string, any>) {
  editingBlueprint.value = bp as any
  form.value = {
    name: bp.name,
    slug: bp.code,
    category: bp.category || 'digital',
    description: bp.description || bp.name,
    schemaFields: bp.config_schema?.fields ? JSON.parse(JSON.stringify(bp.config_schema.fields)) : [],
    businessRules: { extra_commission: false, premium_only: false, requires_receipt_photo: false },
    is_available: true,
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  resetForm()
}

async function loadAll() {
  loading.value = true
  try {
    const bpRes = await httpClient.get<{ blueprints: PaymentBlueprint[]; count: number }>(
      '/api/v1/global-vault/payment-blueprints/'
    )
    blueprints.value = bpRes.data.blueprints ?? []
  } catch (err) {
    console.error('Error loading data:', err)
    blueprints.value = []
  } finally {
    loading.value = false
  }
}

async function saveBlueprint() {
  if (!form.value.name || !form.value.slug) return
  saving.value = true
  try {
    const payload = {
      code: form.value.slug,
      name: form.value.name,
      config_schema: { fields: form.value.schemaFields },
    }

    const existing = editingBlueprint.value
    let updatedList: any[]

    if (existing) {
      updatedList = blueprints.value.map(b => b.code === existing.code ? payload : b)
    } else {
      if (blueprints.value.some(b => b.code === payload.code)) {
        alert('Ya existe un blueprint con ese slug.')
        saving.value = false
        return
      }
      updatedList = [...blueprints.value, payload]
    }

    await httpClient.post('/api/v1/global-vault/update-payment-blueprints/', { blueprints: updatedList })
    blueprints.value = updatedList
    closeModal()
  } catch (err) {
    console.error('Error saving blueprint:', err)
  } finally {
    saving.value = false
  }
}

async function toggleAvailability(code: string) {
  const updatedList = blueprints.value.map(b =>
    b.code === code ? { ...b, is_available: !(b as any).is_available } as any : b
  )
  try {
    await httpClient.post('/api/v1/global-vault/update-payment-blueprints/', { blueprints: updatedList })
    blueprints.value = updatedList
  } catch (err) {
    console.error('Error toggling availability:', err)
  }
}


onMounted(() => loadAll())
</script>
