<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  Building2, Route, PackageSearch, BarChart3, Truck,
  FileText, Users, Warehouse, ShoppingCart,
  CheckCircle2, Sparkles, TrendingUp, Ticket, Zap, Monitor,
} from 'lucide-vue-next';
import { useTenantMetadata, type ModuleDefinition } from '@/composables/useTenantMetadata';
import { useTicketPackages, type TicketPackage } from '@/composables/useTicketPackages';
import { useForexRate } from '@/composables/useForexRate';
import { useNotify } from '@/composables/useNotify';
import { parseApiError } from '@/utils/parseApiError';

const router = useRouter();
const { knownModules, hasModule, acquireModule, ticketsDisponibles, applyTicketsRemaining } = useTenantMetadata();
const { packages: ticketPackages, isLoading: ticketsLoading, purchasingId, fetchPackages, purchasePackage } = useTicketPackages();
const { rateValue: tasaBCV } = useForexRate();
const notify = useNotify();

const processingId = ref<string | null>(null);
const filterCategory = ref<string | null>(null);
const showSuccessModal = ref(false);
const lastAcquired = ref<string>('');

// Tabs: "Módulos" vs "Recarga de Ventas"
const activeTab = ref<'modules' | 'tickets'>('modules');
watch(activeTab, (tab) => {
  if (tab === 'tickets' && ticketPackages.value.length === 0) {
    fetchPackages();
  }
}, { immediate: true });

const selectedPackage = ref<TicketPackage | null>(null);
const showPurchaseModal = ref(false);
const showTicketSuccessModal = ref(false);
const lastPurchaseTickets = ref(0);

function formatUSD(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatVES(n: number): string {
  return n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function openPurchaseModal(pkg: TicketPackage) {
  selectedPackage.value = pkg;
  showPurchaseModal.value = true;
}

function closePurchaseModal() {
  if (purchasingId.value) return;
  showPurchaseModal.value = false;
  selectedPackage.value = null;
}

async function confirmPurchase() {
  if (!selectedPackage.value) return;
  try {
    const result = await purchasePackage(selectedPackage.value.id);
    applyTicketsRemaining(result.tickets_remaining);
    lastPurchaseTickets.value = result.tickets_remaining;
    showPurchaseModal.value = false;
    selectedPackage.value = null;
    showTicketSuccessModal.value = true;
    notify.success(`¡Recarga exitosa! Ahora tienes ${result.tickets_remaining.toLocaleString()} tickets disponibles.`);
  } catch (err) {
    notify.error(parseApiError(err));
  }
}

function goToPos() {
  showTicketSuccessModal.value = false;
  router.push('/admin/pos');
}

const iconMap: Record<string, any> = {
  Building2, Route, PackageSearch, BarChart3, Truck,
  FileText, Users, Warehouse,
};

const categoryLabels: Record<string, string> = {
  operaciones: 'Operaciones',
  reportes: 'Reportes y Análisis',
  ventas: 'Ventas y Clientes',
  administracion: 'Administración',
};

const categories = computed(() => {
  const set = new Set(knownModules.map(m => m.category));
  return Array.from(set);
});

const filteredModules = computed(() => {
  if (!filterCategory.value) return knownModules;
  return knownModules.filter(m => m.category === filterCategory.value);
});

const activeCount = computed(() => knownModules.filter(m => hasModule(m.key)).length);

async function handleAcquire(mod: ModuleDefinition) {
  processingId.value = mod.key;
  const ok = await acquireModule(mod.key);
  processingId.value = null;
  if (ok) {
    lastAcquired.value = mod.name;
    showSuccessModal.value = true;
  } else {
    notify.error('Error al adquirir el módulo. Intenta de nuevo.');
  }
}

function getBadgeClass(category: string): string {
  const map: Record<string, string> = {
    operaciones: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30',
    reportes: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30',
    ventas: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
    administracion: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
  };
  return map[category] || 'bg-slate-50 text-slate-600 border-slate-200';
}
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <ShoppingCart class="h-5 w-5 text-blue-600" />
          <h1 class="text-xl font-bold text-slate-900 dark:text-white">Marketplace</h1>
        </div>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          <template v-if="activeTab === 'modules'">
            Expande las capacidades de tu negocio. {{ activeCount }} de {{ knownModules.length }} módulos activos.
          </template>
          <template v-else>
            Recarga tickets de venta para tu POS. Tienes {{ ticketsDisponibles.toLocaleString() }} disponibles.
          </template>
        </p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex w-fit gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-white/[0.08] dark:bg-white/[0.03]">
      <button @click="activeTab = 'modules'"
        class="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all"
        :class="activeTab === 'modules'
          ? 'bg-white text-blue-700 shadow-sm dark:bg-[#141824] dark:text-blue-300'
          : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'">
        <PackageSearch class="h-3.5 w-3.5" />
        Módulos
      </button>
      <button @click="activeTab = 'tickets'"
        class="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all"
        :class="activeTab === 'tickets'
          ? 'bg-white text-blue-700 shadow-sm dark:bg-[#141824] dark:text-blue-300'
          : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'">
        <Ticket class="h-3.5 w-3.5" />
        Recarga de Ventas
      </button>
    </div>

    <template v-if="activeTab === 'modules'">
      <!-- Category Filter -->
      <div class="flex flex-wrap gap-2">
        <button @click="filterCategory = null"
          class="rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all"
          :class="!filterCategory
            ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-500/15 dark:text-blue-300'
            : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-white/10 dark:text-slate-400 dark:hover:border-white/25'">
          Todos
        </button>
        <button v-for="cat in categories" :key="cat" @click="filterCategory = cat"
          class="rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all"
          :class="filterCategory === cat
            ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-500/15 dark:text-blue-300'
            : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-white/10 dark:text-slate-400 dark:hover:border-white/25'">
          {{ categoryLabels[cat] || cat }}
        </button>
      </div>

      <!-- Module Catalog -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="mod in filteredModules" :key="mod.key"
          class="group relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md dark:border-white/[0.08] dark:bg-[#141824] dark:hover:border-white/20">

          <!-- Top Accent Bar -->
          <div class="pointer-events-none absolute inset-x-0 top-0 z-[1] h-1"
            :class="hasModule(mod.key)
              ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
              : 'bg-gradient-to-r from-slate-200 to-slate-300 dark:from-white/10 dark:to-white/5'" />

          <div class="flex flex-1 flex-col p-5 pt-6">
            <!-- Icon + Badge -->
            <div class="mb-3 flex items-start justify-between">
              <div class="flex h-11 w-11 items-center justify-center rounded-xl"
                :class="hasModule(mod.key)
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400'
                  : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'">
                <component :is="iconMap[mod.icon] || PackageSearch" class="h-5 w-5 stroke-[1.5]" />
              </div>
              <span class="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                :class="getBadgeClass(mod.category)">
                {{ categoryLabels[mod.category] || mod.category }}
              </span>
            </div>

            <!-- Content -->
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">{{ mod.name }}</h3>
            <p class="mt-1.5 flex-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {{ mod.description }}
            </p>

            <!-- Price -->
            <div class="mt-4 flex items-center gap-1.5">
              <span class="text-lg font-black text-slate-900 dark:text-white">${{ mod.price }}</span>
              <span class="text-[10px] text-slate-400 font-medium">/ mes</span>
            </div>

            <!-- Action Button -->
            <button v-if="hasModule(mod.key)" disabled
              class="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-emerald-200 bg-emerald-50 py-2.5 text-xs font-bold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 cursor-default">
              <CheckCircle2 class="h-4 w-4" />
              Activo
            </button>
            <button v-else @click="handleAcquire(mod)" :disabled="processingId === mod.key"
              class="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] disabled:opacity-60 disabled:cursor-wait">
              <Sparkles v-if="processingId !== mod.key" class="h-4 w-4" />
              <span v-else class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              {{ processingId === mod.key ? 'Procesando...' : 'Adquirir Módulo' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="filteredModules.length === 0"
        class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-sm text-slate-400 dark:border-white/10 dark:text-slate-500">
        <ShoppingCart class="mb-2 h-8 w-8" />
        No hay módulos en esta categoría
      </div>
    </template>

    <template v-else>
      <!-- Ticket Packages Catalog -->
      <div v-if="ticketsLoading" class="flex items-center justify-center py-16">
        <span class="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600 dark:border-white/10" />
      </div>
      <div v-else-if="ticketPackages.length === 0"
        class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-sm text-slate-400 dark:border-white/10 dark:text-slate-500">
        <Ticket class="mb-2 h-8 w-8" />
        No hay paquetes de ventas disponibles por ahora.
      </div>
      <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="pkg in ticketPackages" :key="pkg.id"
          class="group relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md dark:border-white/[0.08] dark:bg-[#141824] dark:hover:border-white/20">

          <div class="pointer-events-none absolute inset-x-0 top-0 z-[1] h-1 bg-gradient-to-r from-blue-400 to-indigo-500" />

          <div class="flex flex-1 flex-col p-5 pt-6">
            <div class="mb-3 flex items-start justify-between">
              <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                <Ticket class="h-5 w-5 stroke-[1.5]" />
              </div>
              <span class="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300">
                +{{ pkg.quantity.toLocaleString() }} Tickets
              </span>
            </div>

            <h3 class="text-sm font-bold text-slate-900 dark:text-white">{{ pkg.name }}</h3>
            <p class="mt-1.5 flex-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {{ pkg.description || 'Recarga de ventas para tu punto de venta.' }}
            </p>

            <div class="mt-4">
              <span class="text-lg font-black text-slate-900 dark:text-white">${{ formatUSD(Number(pkg.price_usd)) }}</span>
              <p v-if="tasaBCV > 0" class="text-[11px] font-medium text-slate-400">
                ≈ Bs. {{ formatVES(Number(pkg.price_usd) * tasaBCV) }}
              </p>
            </div>

            <button @click="openPurchaseModal(pkg)" :disabled="purchasingId === pkg.id"
              class="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] disabled:opacity-60 disabled:cursor-wait">
              <Zap v-if="purchasingId !== pkg.id" class="h-4 w-4" />
              <span v-else class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              {{ purchasingId === pkg.id ? 'Procesando...' : 'Comprar / Recargar' }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Success Modal -->
    <Teleport to="body">
      <div v-if="showSuccessModal" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showSuccessModal = false" />
        <div class="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-2xl dark:border-white/[0.08] dark:bg-[#141824]">
          <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/15">
            <TrendingUp class="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 class="text-lg font-bold text-slate-900 dark:text-white">¡Módulo Activado!</h3>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
            <strong class="text-slate-800 dark:text-white">{{ lastAcquired }}</strong> ya está disponible en tu panel. Disfruta de todas sus funciones.
          </p>
          <button @click="showSuccessModal = false"
            class="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 hover:from-emerald-500 hover:to-teal-500 transition-all">
            <CheckCircle2 class="h-4 w-4" />
            Continuar
          </button>
        </div>
      </div>
    </Teleport>

    <!-- Ticket Purchase Confirmation Modal -->
    <Teleport to="body">
      <div v-if="showPurchaseModal && selectedPackage" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closePurchaseModal" />
        <div class="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/[0.08] dark:bg-[#141824]">
          <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-500/15">
            <Ticket class="h-7 w-7 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 class="text-center text-lg font-bold text-slate-900 dark:text-white">Confirmar Recarga</h3>

          <div class="mt-4 space-y-2 rounded-xl bg-slate-50 p-4 text-sm dark:bg-white/[0.03]">
            <div class="flex items-center justify-between">
              <span class="text-slate-500 dark:text-slate-400">Paquete</span>
              <span class="font-semibold text-slate-900 dark:text-white">{{ selectedPackage.name }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-500 dark:text-slate-400">Tickets</span>
              <span class="font-semibold text-emerald-600 dark:text-emerald-400">+{{ selectedPackage.quantity.toLocaleString() }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-500 dark:text-slate-400">Precio</span>
              <span class="font-semibold text-slate-900 dark:text-white">${{ formatUSD(Number(selectedPackage.price_usd)) }}</span>
            </div>
            <div v-if="tasaBCV > 0" class="flex items-center justify-between text-xs text-slate-400">
              <span>Aprox. en bolívares</span>
              <span>Bs. {{ formatVES(Number(selectedPackage.price_usd) * tasaBCV) }}</span>
            </div>
          </div>

          <p class="mt-3 text-center text-xs text-slate-400">
            Saldo actual: {{ ticketsDisponibles.toLocaleString() }} tickets
          </p>

          <div class="mt-5 flex gap-2">
            <button @click="closePurchaseModal" :disabled="purchasingId === selectedPackage.id"
              class="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5">
              Cancelar
            </button>
            <button @click="confirmPurchase" :disabled="purchasingId === selectedPackage.id"
              class="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/25 hover:from-blue-500 hover:to-indigo-500 disabled:cursor-wait disabled:opacity-60">
              <span v-if="purchasingId === selectedPackage.id" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              {{ purchasingId === selectedPackage.id ? 'Procesando...' : 'Confirmar Compra' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Ticket Purchase Success Modal -->
    <Teleport to="body">
      <div v-if="showTicketSuccessModal" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showTicketSuccessModal = false" />
        <div class="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-2xl dark:border-white/[0.08] dark:bg-[#141824]">
          <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/15">
            <TrendingUp class="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 class="text-lg font-bold text-slate-900 dark:text-white">¡Recarga Exitosa!</h3>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Ahora tienes <strong class="text-slate-800 dark:text-white">{{ lastPurchaseTickets.toLocaleString() }}</strong> tickets disponibles.
          </p>
          <div class="mt-5 flex flex-col gap-2">
            <button @click="goToPos"
              class="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 hover:from-emerald-500 hover:to-teal-500 transition-all">
              <Monitor class="h-4 w-4" />
              Ir al POS a Vender
            </button>
            <button @click="showTicketSuccessModal = false"
              class="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              Seguir en el Marketplace
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
