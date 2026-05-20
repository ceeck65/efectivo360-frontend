<template>
  <div class="space-y-6 p-6">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          <Archive class="h-8 w-8 text-cyan-500" />
          GlobalVault SaaS
        </h1>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {{ vault?.description ?? 'Catálogo maestro de métodos de pago y tipos de bóvedas' }}
        </p>
      </div>
      <div class="flex gap-2">
        <span
          v-if="stateId"
          class="inline-flex items-center gap-1.5 h-9 px-3 text-[11px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg"
          :title="'state_id: ' + stateId"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {{ stateId.slice(0, 8) }}
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

    <template v-else-if="vault">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div class="relative overflow-hidden rounded-xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-slate-50/90 p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.7)_inset,0_12px_40px_-12px_rgba(15,23,42,0.12)] dark:border-white/[0.07] dark:from-[#141824] dark:via-[#111620] dark:to-[#0c0f16] dark:shadow-[0_0_0_1px_rgba(56,189,248,0.06),0_20px_50px_-15px_rgba(0,0,0,0.55)]">
          <div class="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[3px] bg-gradient-to-r from-cyan-500/90 via-blue-500/70 to-indigo-600/50 opacity-95" />
          <div class="relative z-[2]">
            <p class="text-[11px] font-semibold uppercase leading-snug tracking-[0.12em] text-slate-500 dark:text-slate-400">Métodos de Pago</p>
            <p class="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{{ paymentMethodCount }}</p>
          </div>
        </div>
        <div class="relative overflow-hidden rounded-xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-slate-50/90 p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.7)_inset,0_12px_40px_-12px_rgba(15,23,42,0.12)] dark:border-white/[0.07] dark:from-[#141824] dark:via-[#111620] dark:to-[#0c0f16] dark:shadow-[0_0_0_1px_rgba(56,189,248,0.06),0_20px_50px_-15px_rgba(0,0,0,0.55)]">
          <div class="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[3px] bg-gradient-to-r from-emerald-500/90 via-green-500/70 to-teal-600/50 opacity-95" />
          <div class="relative z-[2]">
            <p class="text-[11px] font-semibold uppercase leading-snug tracking-[0.12em] text-slate-500 dark:text-slate-400">Plantillas de Bóveda</p>
            <p class="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{{ vaultTemplateCount }}</p>
          </div>
        </div>
        <div class="relative overflow-hidden rounded-xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-slate-50/90 p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.7)_inset,0_12px_40px_-12px_rgba(15,23,42,0.12)] dark:border-white/[0.07] dark:from-[#141824] dark:via-[#111620] dark:to-[#0c0f16] dark:shadow-[0_0_0_1px_rgba(56,189,248,0.06),0_20px_50px_-15px_rgba(0,0,0,0.55)]">
          <div class="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[3px] bg-gradient-to-r from-purple-500/90 via-violet-500/70 to-indigo-600/50 opacity-95" />
          <div class="relative z-[2]">
            <p class="text-[11px] font-semibold uppercase leading-snug tracking-[0.12em] text-slate-500 dark:text-slate-400">Locale / Moneda</p>
            <p class="mt-2 text-lg font-semibold tracking-tight text-slate-900 dark:text-white font-mono">{{ localeLabel }}</p>
          </div>
        </div>
      </div>

      <details class="rounded-xl border border-slate-200/90 bg-white dark:border-white/[0.07] dark:bg-[#141824]">
        <summary class="px-6 py-3 cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
          Data (JSON)
          <span class="ml-2 text-slate-400 font-mono text-[11px]">· {{ vault.data?.state_id?.slice(0, 8) ?? '—' }}…</span>
        </summary>
        <pre class="px-6 py-4 text-xs text-slate-600 dark:text-slate-400 overflow-x-auto max-h-96 overflow-y-auto font-mono">{{ JSON.stringify(vault.data, null, 2) }}</pre>
      </details>
    </template>

    <div v-else class="text-center py-12">
      <Archive class="h-12 w-12 mx-auto text-slate-300 mb-4" />
      <h3 class="text-lg font-medium text-slate-900 dark:text-white">No se pudo cargar el GlobalVault</h3>
      <p class="text-slate-500 mt-1">Verifica que tengas permisos de staff para acceder.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Archive, RefreshCw } from 'lucide-vue-next'
import { httpClient } from '@/core/services/axios.config'

interface GlobalVault {
  id: number
  ulid: string
  name: string
  description: string
  data: {
    state_id: string
    payment_methods: Record<string, unknown>[]
    vault_templates: Record<string, unknown>[]
    global_config: {
      default_locale?: string
      default_currency?: string
    }
  }
  created_at: string
  updated_at: string
}

const loading = ref(false)
const vault = ref<GlobalVault | null>(null)

const stateId = computed(() => vault.value?.data?.state_id ?? null)
const paymentMethodCount = computed(() => vault.value?.data?.payment_methods?.length ?? 0)
const vaultTemplateCount = computed(() => vault.value?.data?.vault_templates?.length ?? 0)
const localeLabel = computed(() => {
  const cfg = vault.value?.data?.global_config
  if (!cfg) return '—'
  return `${cfg.default_locale ?? '—'} / ${cfg.default_currency ?? '—'}`
})

async function loadAll() {
  loading.value = true
  try {
    const { data } = await httpClient.get<GlobalVault>('/api/v1/global-vault/instance/')
    vault.value = data
  } catch (err) {
    console.error('Error loading GlobalVault:', err)
    vault.value = null
  } finally {
    loading.value = false
  }
}

onMounted(loadAll)
</script>
