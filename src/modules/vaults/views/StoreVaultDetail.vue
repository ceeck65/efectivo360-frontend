<template>
  <div class="space-y-6 p-6">
    <!-- Header -->
    <div class="flex items-start justify-between gap-4">
      <div class="flex items-center gap-4">
        <button
          @click="$router.back()"
          class="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 hover:bg-slate-50 dark:border-white/[0.06] dark:hover:bg-[#1a1f2e]"
        >
          <ArrowLeft class="h-4 w-4 text-slate-500" />
        </button>
        <div>
          <h1 class="flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            <Database class="h-8 w-8 text-cyan-500" />
            {{ vault?.tenant_name || 'StoreVault' }}
          </h1>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {{ vault?.tenant_slug }} · {{ vault?.ulid?.slice(0, 12) }}…
          </p>
        </div>
      </div>
      <div class="flex gap-2">
        <span
          v-if="stateId"
          class="inline-flex items-center gap-1.5 h-9 px-3 text-[11px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {{ stateId ? stateId.slice(0, 8) : '—' }}
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

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-600" />
    </div>

    <template v-else-if="vault">
      <!-- Schema Status Card -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div class="relative overflow-hidden rounded-xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-slate-50/90 p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.7)_inset,0_12px_40px_-12px_rgba(15,23,42,0.12)] dark:border-white/[0.07] dark:from-[#141824] dark:via-[#111620] dark:to-[#0c0f16] dark:shadow-[0_0_0_1px_rgba(56,189,248,0.06),0_20px_50px_-15px_rgba(0,0,0,0.55)]">
          <div class="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[3px] bg-gradient-to-r from-emerald-500/90 via-green-500/70 to-teal-600/50 opacity-95" />
          <div class="relative z-[2]">
            <p class="text-[11px] font-semibold uppercase leading-snug tracking-[0.12em] text-slate-500 dark:text-slate-400">Esquema PostgreSQL</p>
            <p class="mt-2 text-lg font-semibold tracking-tight text-slate-900 dark:text-white font-mono">{{ vault.schema_name }}</p>
            <div class="mt-2 flex items-center gap-2">
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                <span class="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Activo
              </span>
              <button
                @click="provisionSchema"
                :disabled="provisioning"
                class="text-[11px] text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 underline"
              >
                {{ provisioning ? 'Provisionando...' : 'Reprovisionar' }}
              </button>
            </div>
          </div>
        </div>

        <div class="relative overflow-hidden rounded-xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-slate-50/90 p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.7)_inset,0_12px_40px_-12px_rgba(15,23,42,0.12)] dark:border-white/[0.07] dark:from-[#141824] dark:via-[#111620] dark:to-[#0c0f16] dark:shadow-[0_0_0_1px_rgba(56,189,248,0.06),0_20px_50px_-15px_rgba(0,0,0,0.55)]">
          <div class="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[3px] bg-gradient-to-r from-purple-500/90 via-violet-500/70 to-indigo-600/50 opacity-95" />
          <div class="relative z-[2]">
            <p class="text-[11px] font-semibold uppercase leading-snug tracking-[0.12em] text-slate-500 dark:text-slate-400">State Version</p>
            <p class="mt-2 text-lg font-semibold tracking-tight text-slate-900 dark:text-white font-mono">{{ stateId?.slice(0, 16) ?? '—' }}</p>
          </div>
        </div>

        <div class="relative overflow-hidden rounded-xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-slate-50/90 p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.7)_inset,0_12px_40px_-12px_rgba(15,23,42,0.12)] dark:border-white/[0.07] dark:from-[#141824] dark:via-[#111620] dark:to-[#0c0f16] dark:shadow-[0_0_0_1px_rgba(56,189,248,0.06),0_20px_50px_-15px_rgba(0,0,0,0.55)]">
          <div class="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[3px] bg-gradient-to-r from-amber-500/90 via-orange-500/70 to-red-600/50 opacity-95" />
          <div class="relative z-[2]">
            <p class="text-[11px] font-semibold uppercase leading-snug tracking-[0.12em] text-slate-500 dark:text-slate-400">Módulos Habilitados</p>
            <p class="mt-2 text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              {{ enabledCount }} / {{ totalModules }}
            </p>
            <p class="mt-1 text-xs text-slate-400">del catálogo global</p>
          </div>
        </div>
      </div>

      <!-- Feature Flags Panel -->
      <div class="rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_0_0_rgba(255,255,255,0.7)_inset,0_12px_40px_-12px_rgba(15,23,42,0.12)] dark:border-white/[0.07] dark:bg-[#141824] dark:shadow-[0_0_0_1px_rgba(56,189,248,0.06),0_20px_50px_-15px_rgba(0,0,0,0.55)]">
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/[0.07]">
          <div>
            <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Feature Flags</h2>
            <p class="text-sm text-slate-500 dark:text-slate-400">
              Activa o desactiva módulos del catálogo para este tenant
            </p>
          </div>
          <button
            @click="saveFeatureFlags"
            :disabled="savingFlags || !flagsDirty"
            class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:opacity-50"
          >
            <Save :class="['h-4 w-4', savingFlags && 'animate-spin']" />
            {{ savingFlags ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
        </div>

        <div v-if="featureFlags.length === 0" class="px-6 py-8 text-center text-sm text-slate-400">
          No hay módulos en el catálogo global. Sincroniza el catálogo desde el GlobalVault.
        </div>

        <div v-else class="divide-y divide-slate-100 dark:divide-white/[0.06]">
          <div
            v-for="flag in featureFlags"
            :key="flag.slug"
            class="flex items-center justify-between px-6 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
          >
            <div class="flex items-center gap-3 min-w-0">
              <ToggleRight
                :class="[
                  'h-5 w-5 shrink-0 cursor-pointer transition-colors',
                  flag.enabled ? 'text-cyan-500' : 'text-slate-300 dark:text-slate-600'
                ]"
                @click="toggleFlag(flag.slug)"
              />
              <div class="min-w-0">
                <p class="text-sm font-medium text-slate-900 dark:text-white truncate">{{ flag.name }}</p>
                <p class="text-xs text-slate-400 truncate">{{ flag.description }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3 shrink-0 ml-4">
              <code class="text-[11px] font-mono text-slate-400 hidden sm:inline">{{ flag.slug }}</code>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  :checked="flag.enabled"
                  @change="toggleFlag(flag.slug)"
                  class="sr-only peer"
                />
                <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600" />
              </label>
            </div>
          </div>
        </div>

        <div class="px-6 py-3 border-t border-slate-200 dark:border-white/[0.07] text-xs text-slate-400 flex justify-between">
          <span>{{ enabledCount }} de {{ totalModules }} módulos activos</span>
          <button
            v-if="!flagsDirty"
            @click="refreshFlags"
            class="text-cyan-600 hover:text-cyan-700 dark:text-cyan-400"
          >
            Recargar flags
          </button>
          <span v-else class="text-amber-500">* Cambios sin guardar</span>
        </div>
      </div>

      <!-- State Viewer -->
      <details class="rounded-xl border border-slate-200/90 bg-white dark:border-white/[0.07] dark:bg-[#141824]">
        <summary class="px-6 py-3 cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
          State (JSON)
          <span class="ml-2 text-slate-400 font-mono text-[11px]">
            {{ stateId ? stateId.slice(0, 8) + '…' : '—' }} ·
            {{ vault.updated_at ? new Date(vault.updated_at).toLocaleString('es-VE') : '—' }}
          </span>
        </summary>
        <pre class="px-6 py-4 text-xs text-slate-600 dark:text-slate-400 overflow-x-auto max-h-96 overflow-y-auto font-mono">{{ JSON.stringify(vault.state, null, 2) }}</pre>
      </details>
    </template>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <Database class="h-12 w-12 mx-auto text-slate-300 mb-4" />
      <h3 class="text-lg font-medium text-slate-900 dark:text-white">StoreVault no encontrado</h3>
      <p class="text-slate-500 mt-1">Verifica que el ULID sea correcto y tengas permisos.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  Database,
  ArrowLeft,
  RefreshCw,
  ToggleRight,
  Save,
} from 'lucide-vue-next'
import { httpClient } from '@/core/services/axios.config'

interface StoreVaultData {
  id: number
  ulid: string
  tenant: number
  tenant_name: string
  tenant_slug: string
  schema_name: string
  state: {
    state_id: string
    tenant_name: string
    tenant_slug: string
    modules_enabled: string[]
    config: Record<string, unknown>
    metrics: Record<string, number>
    preferences: Record<string, unknown>
  }
  is_active: boolean
  created_at: string
  updated_at: string
}

interface FeatureFlag {
  slug: string
  name: string
  ulid: string
  description: string
  enabled: boolean
}

const route = useRoute()
const ulid = route.params.ulid as string

const loading = ref(false)
const savingFlags = ref(false)
const provisioning = ref(false)
const vault = ref<StoreVaultData | null>(null)
const featureFlags = ref<FeatureFlag[]>([])
const originalEnabledSlugs = ref<string[]>([])

const stateId = computed(() => vault.value?.state?.state_id ?? null)

const enabledCount = computed(() => featureFlags.value.filter(f => f.enabled).length)
const totalModules = computed(() => featureFlags.value.length)

const flagsDirty = computed(() => {
  const current = featureFlags.value.filter(f => f.enabled).map(f => f.slug).sort()
  const original = [...originalEnabledSlugs.value].sort()
  return JSON.stringify(current) !== JSON.stringify(original)
})

async function loadAll() {
  loading.value = true
  try {
    const { data } = await httpClient.get<StoreVaultData>(`/api/v1/store-vaults/${ulid}/`)
    vault.value = data
    await loadFeatureFlags()
  } catch (err) {
    console.error('Error loading StoreVault:', err)
    vault.value = null
  } finally {
    loading.value = false
  }
}

async function loadFeatureFlags() {
  try {
    const { data } = await httpClient.get<{ flags: FeatureFlag[]; enabled_count: number; total_count: number }>(
      `/api/v1/store-vaults/${ulid}/feature_flags/`
    )
    featureFlags.value = data.flags
    originalEnabledSlugs.value = data.flags.filter(f => f.enabled).map(f => f.slug)
  } catch (err) {
    console.error('Error loading feature flags:', err)
  }
}

function toggleFlag(slug: string) {
  const flag = featureFlags.value.find(f => f.slug === slug)
  if (flag) {
    flag.enabled = !flag.enabled
  }
}

async function saveFeatureFlags() {
  if (!stateId.value) return
  savingFlags.value = true
  try {
    const enabledSlugs = featureFlags.value.filter(f => f.enabled).map(f => f.slug)
    await httpClient.post(`/api/v1/store-vaults/${ulid}/update_feature_flags/`, {
      enabled_modules: enabledSlugs,
      state_id: stateId.value,
    })
    originalEnabledSlugs.value = [...enabledSlugs]
    await loadAll()
  } catch (err: any) {
    if (err?.response?.status === 409) {
      alert('Conflicto: el estado del vault cambió. Recargando datos...')
      await refreshFlags()
    } else {
      console.error('Error saving feature flags:', err)
    }
  } finally {
    savingFlags.value = false
  }
}

async function refreshFlags() {
  await loadFeatureFlags()
}

async function provisionSchema() {
  provisioning.value = true
  try {
    await httpClient.post(`/api/v1/store-vaults/${ulid}/provision_schema/`)
    alert('Esquema reprovisionado exitosamente.')
  } catch (err) {
    console.error('Error provisioning schema:', err)
  } finally {
    provisioning.value = false
  }
}

onMounted(loadAll)
</script>
