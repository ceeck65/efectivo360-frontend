<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';
import { useAuthStore } from '@/stores/auth';
import { 
  Wallet,
  Settings,
  TrendingUp,
  RefreshCw,
  Inbox,
  BarChart3,
  Building2
} from 'lucide-vue-next';
import TreasuryApprovalInbox from './sections/TreasuryApprovalInbox.vue';
import TreasuryIncomeApprovalInbox from './sections/TreasuryIncomeApprovalInbox.vue';
import TreasuryKpiDashboard from './sections/TreasuryKpiDashboard.vue';
import CashFlowReport from './sections/CashFlowReport.vue';
import ProviderDebtsDashboard from './sections/ProviderDebtsDashboard.vue';
import CustomerDebtsDashboard from './sections/CustomerDebtsDashboard.vue';
import PaymentMethodConfigurator from './sections/PaymentMethodConfigurator.vue';
import VaultsSection from './sections/VaultsSection.vue';

const activeTab = ref<'inbox' | 'incomes' | 'debts' | 'cxc' | 'transactions' | 'reports' | 'configuration'>('inbox');
const configActiveTab = ref<"payment-methods" | "vaults">('payment-methods');

interface VaultSummary {
  balance: number;
  balance_suscriptions: number;
  balance_commissions: number;
  total_withdrawn: number;
  currency: string;
  recent_transactions: Transaction[];
}

interface Transaction {
  id: number;
  transaction_type: string;
  amount: number;
  currency: string;
  status: string;
  tenant_name: string | null;
  tenant_slug: string | null;
  plan_name: string;
  payment_reference: string | null;
  description: string | null;
  created_at: string;
  completed_at: string | null;
}

const authStore = useAuthStore();
const { fetchApi } = useApi();

const loading = ref(true);
const summary = ref<VaultSummary | null>(null);
const error = ref<string | null>(null);
const isAuthenticated = computed(() => !!authStore.user);
const isStaff = computed(() => authStore.user?.is_staff || false);

// Determine if user is platform staff (for display purposes)
const isPlatform = ref(false);

// Configuration tabs for horizontal layout
type ConfigTab = ['payment-methods', string, typeof Settings] | ['vaults', string, typeof Wallet];
const configTabs: ConfigTab[] = [
  ['payment-methods', 'Métodos de Pago', Settings],
  ['vaults', 'Gaveteros', Wallet]
];

// Transaction-related functions are defined in child components where they're used

const loadData = async () => {
  loading.value = true;
  error.value = null;
  try {
    const [summaryResp, platformResp] = await Promise.all([
      fetchApi<VaultSummary>('/api/v1/staff/vault-summary/'),
      fetchApi<{ is_platform: boolean }>('/api/v1/treasury/payment-methods/')
    ]);
    
    summary.value = summaryResp;
    isPlatform.value = platformResp.is_platform;
  } catch (e) {
    console.error('Error loading treasury data:', e);
    error.value = 'Failed to load treasury data. Please try again later.';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  if (isAuthenticated.value) {
    loadData();
  }
});
</script>

<template>
  <div class="min-h-screen bg-slate-50/50 p-3 sm:p-4 lg:p-6 dark:bg-[#0D0F14]">
<!-- Access denied for non-authenticated users -->
<div v-if="!isAuthenticated" class="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-3 sm:p-4 lg:p-6 text-center">
  <p class="text-red-600 dark:text-red-400">Debes iniciar sesión para acceder a esta sección.</p>
</div>

<!-- Content -->
<div v-else class="space-y-6">
<!-- Header -->
<div class="mb-6">
  <div class="flex items-center gap-3 mb-2">
    <div class="p-2 rounded-lg bg-cyan-500/20">
      <Wallet class="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
    </div>
    <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Tesorería</h1>
  </div>
<p class="text-slate-500 dark:text-slate-400">
  {{ isPlatform 
    ? 'Configura los métodos de pago y gaveteros de la plataforma' 
    : isStaff
      ? 'Configura los métodos de pago y gaveteros de tu negocio'
      : 'Visualiza los ingresos recientes de tu negocio'
  }}
</p>
</div>

  <!-- Loading State -->
  <div v-if="loading" class="text-center py-12">
    <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
    <p class="mt-4 text-slate-500 dark:text-slate-400">Cargando datos de tesorería...</p>
  </div>

  <!-- Error State -->
  <div v-if="error && !loading" class="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-3 sm:p-4 lg:p-6 text-center">
    <p class="text-red-600 dark:text-red-400">{{ error }}</p>
    <button @click="loadData" class="mt-3 px-4 py-2 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg">
      <RefreshCw class="h-4 w-4 inline-block mr-2" /> Recargar
    </button>
  </div>

  <!-- KPI Dashboard (auto-loads its own data) -->
  <TreasuryKpiDashboard />

  <!-- Tabs Container -->
  <div class="border-t border-slate-200 dark:border-white/[0.06] pt-6 mt-6">
  <div class="flex gap-4 overflow-x-auto flex-nowrap whitespace-nowrap border-b border-slate-200 dark:border-white/[0.06] mb-6">
    <button
      @click="activeTab = 'inbox'"
      :class="[
        'px-2 sm:px-3 py-3 text-base font-medium border-b-2 -mb-px transition-colors',
        activeTab === 'inbox'
          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
          : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
      ]"
    >
      <div class="flex items-center gap-3">
        <Inbox class="h-5 w-5" />
        <span>Aprobar Egresos</span>
      </div>
    </button>
    <button
      @click="activeTab = 'incomes'"
      :class="[
        'px-2 sm:px-3 py-3 text-base font-medium border-b-2 -mb-px transition-colors',
        activeTab === 'incomes'
          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
          : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
      ]"
    >
      <div class="flex items-center gap-3">
        <TrendingUp class="h-5 w-5" />
        <span>Aprobar Ingresos</span>
      </div>
    </button>
    <button
      @click="activeTab = 'debts'"
      :class="[
        'px-2 sm:px-3 py-3 text-base font-medium border-b-2 -mb-px transition-colors',
        activeTab === 'debts'
          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
          : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
      ]"
    >
      <div class="flex items-center gap-3">
        <Building2 class="h-5 w-5" />
        <span>CXP</span>
      </div>
    </button>
    <button
      @click="activeTab = 'cxc'"
      :class="[
        'px-2 sm:px-3 py-3 text-base font-medium border-b-2 -mb-px transition-colors',
        activeTab === 'cxc'
          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
          : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
      ]"
    >
      <div class="flex items-center gap-3">
        <TrendingUp class="h-5 w-5" />
        <span>CXC</span>
      </div>
    </button>
    <button
      @click="activeTab = 'transactions'"
      :class="[
        'px-2 sm:px-3 py-3 text-base font-medium border-b-2 -mb-px transition-colors',
        activeTab === 'transactions'
          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
          : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
      ]"
    >
      <div class="flex items-center gap-3">
        <TrendingUp class="h-5 w-5" />
        <span>Ingresos Recientes</span>
      </div>
    </button>
    <button
      @click="activeTab = 'reports'"
      :class="[
        'px-2 sm:px-3 py-3 text-base font-medium border-b-2 -mb-px transition-colors',
        activeTab === 'reports'
          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
          : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
      ]"
    >
      <div class="flex items-center gap-3">
        <BarChart3 class="h-5 w-5" />
        <span>Reportes</span>
      </div>
    </button>
    <button
      @click="activeTab = 'configuration'"
      :class="[
        'px-2 sm:px-3 py-3 text-base font-medium border-b-2 -mb-px transition-colors',
        activeTab === 'configuration'
          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
          : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
      ]"
    >
      <div class="flex items-center gap-3">
        <Settings class="h-5 w-5" />
        <span>Configuración</span>
      </div>
    </button>
  </div>

  <!-- Tab Content -->
  <div class="space-y-6">
    <TreasuryApprovalInbox v-if="activeTab === 'inbox'" />
    <TreasuryIncomeApprovalInbox v-if="activeTab === 'incomes'" />
    <ProviderDebtsDashboard v-if="activeTab === 'debts'" />
    <CustomerDebtsDashboard v-if="activeTab === 'cxc'" />
    <CashFlowReport v-if="activeTab === 'reports'" />
    <RecentTransactionsSection v-if="activeTab === 'transactions'" :transactions="summary?.recent_transactions || []" />
    <div v-if="activeTab === 'configuration'" class="mt-8">
      <!-- Configuration Header -->
      <div class="flex items-center mb-5">
        <div class="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <Settings class="h-6 w-6 text-blue-500 dark:text-blue-400" />
        </div>
        <div class="ml-3">
          <h2 class="text-xl font-bold text-slate-900 dark:text-white">Configuración de Tesorería</h2>
          <p class="text-sm text-slate-500">Administra métodos de pago y gaveteros</p>
        </div>
      </div>
      <!-- Sub-tabs -->
      <div class="flex gap-3 border-b border-slate-200 dark:border-white/[0.06] mb-5">
        <button v-for="tab in configTabs" :key="tab[0]"
          @click="configActiveTab = tab[0]"
          :class="['px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors', configActiveTab === tab[0] ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700']">
          <component :is="tab[2]" class="h-4 w-4 inline mr-1.5" />{{ tab[1] }}
        </button>
      </div>
      <div class="space-y-6">
        <PaymentMethodConfigurator v-if="configActiveTab === 'payment-methods'" />
        <VaultsSection v-if="configActiveTab === 'vaults'" />
      </div>
    </div>
  </div>
</div>

  <!-- Empty State (when not loading, no error, but no summary) -->
  <div v-if="!loading && !error && !summary" class="text-center py-12">
    <p class="text-slate-500 dark:text-slate-400">No hay datos de tesorería disponibles.</p>
    <button @click="loadData" class="mt-4 px-4 py-2 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg">
      <RefreshCw class="h-4 w-4 inline-block mr-2" /> Intentar nuevamente
    </button>
  </div>
</div>
  </div>
</template>