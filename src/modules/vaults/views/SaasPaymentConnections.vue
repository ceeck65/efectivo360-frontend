<template>
  <div class="space-y-6 p-6">
    <!-- Header -->
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          <Globe class="h-8 w-8 text-cyan-500" />
          Conexiones de Pago — SaaS
        </h1>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Configura dónde recibes el dinero de las suscripciones. Elige un Blueprint y llena tus credenciales.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center gap-1.5 h-9 px-3 text-[11px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg">
          {{ connections.length }} conexiones
        </span>
        <button
          @click="loadData"
          :disabled="loading"
          class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 dark:text-slate-300 dark:border-white/[0.06] dark:hover:bg-[#1a1f2e]"
        >
          <RefreshCw :class="['h-4 w-4', loading && 'animate-spin']" />
          Recargar
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-600" />
    </div>

    <template v-else>
      <!-- Available Blueprints (no connection yet) -->
      <div
        v-if="availableBlueprints.length > 0"
        class="rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_0_0_rgba(255,255,255,0.7)_inset,0_12px_40px_-12px_rgba(15,23,42,0.12)] dark:border-white/[0.07] dark:bg-[#141824] dark:shadow-[0_0_0_1px_rgba(56,189,248,0.06),0_20px_50px_-15px_rgba(0,0,0,0.55)]"
      >
        <div class="px-6 py-3 border-b border-slate-200 dark:border-white/[0.07]">
          <h2 class="text-sm font-semibold text-slate-900 dark:text-white">Blueprints Disponibles</h2>
          <p class="text-xs text-slate-400">Selecciona un blueprint para crear una nueva conexión</p>
        </div>
        <div class="divide-y divide-slate-100 dark:divide-white/[0.06]">
          <div
            v-for="bp in availableBlueprints"
            :key="bp.slug"
            class="flex items-center justify-between px-6 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.03]"
          >
            <div class="flex items-center gap-3">
              <component :is="categoryIcon(bp.category)" class="h-5 w-5" :class="categoryColor(bp.category)" />
              <div>
                <p class="text-sm font-medium text-slate-900 dark:text-white">{{ bp.name }}</p>
                <code class="text-[11px] font-mono text-slate-400">{{ bp.slug }}</code>
              </div>
            </div>
            <button
              @click="startNewConnection(bp)"
              class="h-8 px-3 text-xs font-medium text-cyan-600 border border-cyan-200 rounded-md hover:bg-cyan-50 dark:text-cyan-400 dark:border-cyan-500/30 dark:hover:bg-cyan-500/10"
            >
              + Conectar
            </button>
          </div>
        </div>
        <div v-if="availableBlueprints.length === 0 && connections.length === 0" class="px-6 py-8 text-center text-sm text-slate-400">
          No hay blueprints disponibles. Crea algunos en el Administrador de Blueprints.
        </div>
      </div>

      <!-- Existing Connections -->
      <div class="rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_0_0_rgba(255,255,255,0.7)_inset,0_12px_40px_-12px_rgba(15,23,42,0.12)] dark:border-white/[0.07] dark:bg-[#141824] dark:shadow-[0_0_0_1px_rgba(56,189,248,0.06),0_20px_50px_-15px_rgba(0,0,0,0.55)]">
        <div class="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-white/[0.07]">
          <h2 class="text-sm font-semibold text-slate-900 dark:text-white">Conexiones Configuradas</h2>
          <span class="text-xs text-slate-400">{{ connections.length }} conexiones</span>
        </div>

        <div v-if="connections.length === 0" class="px-6 py-8 text-center text-sm text-slate-400">
          <Plug class="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
          Sin conexiones configuradas. Elige un blueprint arriba para empezar.
        </div>

        <div v-else class="divide-y divide-slate-100 dark:divide-white/[0.06]">
          <div
            v-for="(conn, idx) in connections"
            :key="conn.blueprint_slug + '-' + idx"
            class="px-6 py-4 hover:bg-slate-50 dark:hover:bg-white/[0.03]"
          >
            <!-- Connection header -->
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="flex h-8 w-8 items-center justify-center rounded-lg" :class="conn.is_active ? 'bg-emerald-100 dark:bg-emerald-500/15' : 'bg-slate-100 dark:bg-slate-800'">
                  <component :is="categoryIcon(getBlueprint(conn.blueprint_slug)?.category ?? 'digital')" class="h-4 w-4" :class="conn.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'" />
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <p class="text-sm font-semibold text-slate-900 dark:text-white">{{ conn.label || conn.blueprint_slug }}</p>
                    <code class="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">{{ conn.blueprint_slug }}</code>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <label class="relative inline-flex items-center cursor-pointer" title="Activar/Desactivar">
                  <input
                    type="checkbox"
                    :checked="conn.is_active"
                    @change="toggleConnection(idx)"
                    class="sr-only peer"
                  />
                  <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
                </label>
                <button
                  @click="removeConnection(idx)"
                  class="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-slate-200 hover:bg-red-50 dark:border-white/[0.06] dark:hover:bg-red-500/10"
                  title="Eliminar"
                >
                  <Trash2 class="h-3 w-3 text-slate-400 hover:text-red-500" />
                </button>
              </div>
            </div>

            <!-- Credential fields -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-11">
              <div v-for="field in getFields(conn.blueprint_slug)" :key="field.key" class="flex items-center gap-2">
                <span class="text-xs text-slate-500 min-w-[90px]">{{ field.label }}:</span>
                <span v-if="field.type === 'password'" class="text-xs font-mono text-slate-700 dark:text-slate-300">••••••••</span>
                <span v-else class="text-xs font-mono text-slate-700 dark:text-slate-300 truncate">{{ conn.credentials?.[field.key] ?? '—' }}</span>
              </div>
              <div v-if="getFields(conn.blueprint_slug).length === 0" class="text-xs text-slate-400 italic col-span-2">
                Sin campos de configuración
              </div>
            </div>

            <!-- Edit button -->
            <div class="mt-2 ml-11">
              <button
                @click="editConnection(idx)"
                class="text-xs text-cyan-600 hover:text-cyan-700 dark:text-cyan-400"
              >
                Editar credenciales
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Add/Edit Connection Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-start justify-center pt-16 pb-8 overflow-y-auto">
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="closeModal" />
        <div class="relative w-full max-w-lg rounded-xl border border-slate-200/90 bg-white shadow-2xl dark:border-white/[0.07] dark:bg-[#141824]">
          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/[0.07]">
            <h2 class="text-lg font-semibold text-slate-900 dark:text-white">
              {{ editingIndex !== null ? 'Editar Conexión' : 'Nueva Conexión' }}
            </h2>
            <button @click="closeModal" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <X class="h-5 w-5" />
            </button>
          </div>

          <div class="px-6 py-5 space-y-4">
            <div v-if="!editingBlueprintData">
              <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Blueprint</label>
              <select
                v-model="connectionForm.blueprint_slug"
                class="w-full h-9 px-3 text-sm rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 dark:border-white/[0.07] dark:bg-[#1a1f2e] dark:text-white"
              >
                <option value="">Seleccionar...</option>
                <option v-for="bp in allBlueprints" :key="bp.slug" :value="bp.slug">{{ bp.name }} ({{ bp.slug }})</option>
              </select>
            </div>
            <div v-else>
              <p class="text-sm font-medium text-slate-900 dark:text-white">{{ editingBlueprintData.name }}</p>
              <code class="text-[11px] font-mono text-slate-400">{{ editingBlueprintData.slug }}</code>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Etiqueta</label>
              <input
                v-model="connectionForm.label"
                type="text"
                class="w-full h-9 px-3 text-sm rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 dark:border-white/[0.07] dark:bg-[#1a1f2e] dark:text-white"
                placeholder="Ej: Stripe Producción"
              />
            </div>

            <template v-if="currentBlueprint">
              <div v-for="field in currentBlueprint.config_schema?.fields ?? []" :key="field.key" class="space-y-1">
                <label class="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  {{ field.label }}
                  <span v-if="field.required" class="text-red-400">*</span>
                </label>
                <input
                  v-if="field.type !== 'select'"
                  :type="field.type === 'password' ? 'password' : field.type === 'number' ? 'number' : 'text'"
                  v-model="connectionForm.credentials[field.key]"
                  :placeholder="field.placeholder || field.label"
                  class="w-full h-9 px-3 text-sm rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 dark:border-white/[0.07] dark:bg-[#1a1f2e] dark:text-white"
                />
                <select
                  v-else
                  v-model="connectionForm.credentials[field.key]"
                  class="w-full h-9 px-3 text-sm rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 dark:border-white/[0.07] dark:bg-[#1a1f2e] dark:text-white"
                >
                  <option value="">Seleccionar...</option>
                  <option v-for="opt in field.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
              </div>
              <div v-if="(currentBlueprint.config_schema?.fields ?? []).length === 0" class="text-xs text-slate-400 italic">
                Este blueprint no requiere configuración adicional.
              </div>
            </template>
          </div>

          <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-white/[0.07]">
            <button
              @click="closeModal"
              class="h-9 px-4 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 dark:text-slate-300 dark:border-white/[0.06] dark:hover:bg-[#1a1f2e]"
            >
              Cancelar
            </button>
            <button
              @click="saveConnection"
              :disabled="saving || !connectionForm.blueprint_slug"
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
  Globe, RefreshCw, Plug, Trash2, X, Save,
  Zap, Banknote, Bitcoin,
} from 'lucide-vue-next'
import { httpClient } from '@/core/services/axios.config'

interface ConfigField {
  key: string; label: string; type: string; required: boolean
  placeholder?: string; options?: { label: string; value: string }[]
}

interface PaymentBlueprint {
  slug: string; name: string; category: string
  config_schema: { fields: ConfigField[] }
  is_available: boolean
}

interface PaymentConnection {
  blueprint_slug: string
  label: string
  credentials: Record<string, string>
  is_active: boolean
}

const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const editingIndex = ref<number | null>(null)
const allBlueprints = ref<PaymentBlueprint[]>([])
const connections = ref<PaymentConnection[]>([])
const editingBlueprintData = ref<PaymentBlueprint | null>(null)

const connectionForm = ref({
  blueprint_slug: '',
  label: '',
  credentials: {} as Record<string, string>,
})

const availableBlueprints = computed(() =>
  allBlueprints.value.filter(bp =>
    bp.is_available && !connections.value.some(c => c.blueprint_slug === bp.slug)
  )
)

const currentBlueprint = computed(() =>
  allBlueprints.value.find(bp => bp.slug === connectionForm.value.blueprint_slug) ?? null
)

function getBlueprint(slug: string): PaymentBlueprint | undefined {
  return allBlueprints.value.find(bp => bp.slug === slug)
}

function getFields(slug: string): ConfigField[] {
  return getBlueprint(slug)?.config_schema?.fields ?? []
}

function categoryIcon(cat: string) {
  return cat === 'digital' ? Zap : cat === 'crypto' ? Bitcoin : Banknote
}

function categoryColor(cat: string) {
  return cat === 'digital' ? 'text-cyan-500' : cat === 'crypto' ? 'text-purple-500' : 'text-emerald-500'
}

async function loadData() {
  loading.value = true
  try {
    const { data } = await httpClient.get<{
      connections: PaymentConnection[]
      blueprints: PaymentBlueprint[]
      count: number
    }>('/api/v1/global-vault/saas-payment-connections/')
    connections.value = data.connections
    allBlueprints.value = data.blueprints
  } catch (err) {
    console.error('Error loading:', err)
  } finally {
    loading.value = false
  }
}

async function saveAll() {
  try {
    await httpClient.post('/api/v1/global-vault/update-saas-payment-connections/', {
      connections: connections.value,
    })
  } catch (err) {
    console.error('Error saving:', err)
  }
}

function resetForm() {
  connectionForm.value = { blueprint_slug: '', label: '', credentials: {} }
  editingIndex.value = null
  editingBlueprintData.value = null
}

function startNewConnection(bp: PaymentBlueprint) {
  resetForm()
  connectionForm.value.blueprint_slug = bp.slug
  editingBlueprintData.value = bp
  showModal.value = true
}

function editConnection(idx: number) {
  const conn = connections.value[idx]
  editingIndex.value = idx
  connectionForm.value = {
    blueprint_slug: conn.blueprint_slug,
    label: conn.label,
    credentials: { ...conn.credentials },
  }
  editingBlueprintData.value = getBlueprint(conn.blueprint_slug) ?? null
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  resetForm()
}

async function saveConnection() {
  if (!connectionForm.value.blueprint_slug) return
  saving.value = true
  try {
    const conn: PaymentConnection = {
      blueprint_slug: connectionForm.value.blueprint_slug,
      label: connectionForm.value.label,
      credentials: connectionForm.value.credentials,
      is_active: true,
    }

    if (editingIndex.value !== null) {
      connections.value[editingIndex.value] = conn
    } else {
      connections.value.push(conn)
    }

    await saveAll()
    closeModal()
  } catch (err) {
    console.error('Error saving connection:', err)
  } finally {
    saving.value = false
  }
}

async function toggleConnection(idx: number) {
  connections.value[idx].is_active = !connections.value[idx].is_active
  await saveAll()
}

async function removeConnection(idx: number) {
  connections.value.splice(idx, 1)
  await saveAll()
}

onMounted(loadData)
</script>
