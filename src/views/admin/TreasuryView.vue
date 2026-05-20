<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';
import { useAuthStore } from '@/stores/auth';
import { 
  Wallet, 
  TrendingUp, 
  CreditCard, 
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Building2,
  Calendar,
  DollarSign
} from 'lucide-vue-next';

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

const isStaff = computed(() => authStore.user?.is_staff || false);

import { useCurrency } from '@/lib/currency';

const { formatAmount: formatCurrency } = useCurrency();

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('es-VE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getTransactionIcon = (type: string) => {
  switch (type) {
    case 'subscription':
      return CreditCard;
    case 'commission':
      return TrendingUp;
    case 'withdrawal':
      return ArrowUpRight;
    case 'refund':
      return ArrowDownLeft;
    default:
      return DollarSign;
  }
};

const getTransactionLabel = (type: string) => {
  switch (type) {
    case 'subscription':
      return 'Suscripción';
    case 'commission':
      return 'Comisión';
    case 'withdrawal':
      return 'Retiro';
    case 'refund':
      return 'Reembolso';
    default:
      return type;
  }
};

const getStatusClass = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-emerald-500/20 text-emerald-400';
    case 'pending':
      return 'bg-amber-500/20 text-amber-400';
    case 'failed':
      return 'bg-red-500/20 text-red-400';
    case 'cancelled':
      return 'bg-slate-500/20 text-slate-400';
    default:
      return 'bg-slate-500/20 text-slate-400';
  }
};

const loadData = async () => {
  try {
    loading.value = true;
    const data = await fetchApi<VaultSummary>('/api/v1/staff/vault-summary/');
    summary.value = data;
  } catch (e) {
    console.error('Error loading vault summary:', e);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  if (!isStaff.value) {
    return;
  }
  loadData();
});
</script>

<template>
  <div class="min-h-screen bg-slate-50/50 p-6 dark:bg-[#0D0F14]">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-2">
        <div class="p-2 rounded-lg bg-cyan-500/20">
          <Wallet class="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
        </div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Tesorería</h1>
      </div>
      <p class="text-slate-500 dark:text-slate-400">Balance y transacciones del Platform Vault</p>
    </div>

    <!-- Access denied for non-staff -->
    <div v-if="!isStaff" class="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-6 text-center">
      <p class="text-red-600 dark:text-red-400">No tienes acceso a esta sección. Solo el staff puede verla.</p>
    </div>

    <!-- Loading -->
    <div v-else-if="loading" class="flex items-center justify-center py-20">
      <RefreshCw class="h-8 w-8 text-cyan-400 animate-spin" />
    </div>

    <!-- Content -->
    <div v-else-if="summary" class="space-y-6">
      <!-- Balance Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Total Balance -->
        <div class="bg-white dark:bg-[#141824] rounded-xl border border-slate-200 dark:border-white/[0.06] p-5 shadow-sm">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm text-slate-500 dark:text-slate-400">Balance Total</span>
            <Wallet class="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div class="text-2xl font-bold text-slate-900 dark:text-white">
            {{ formatCurrency(summary.balance, summary.currency) }}
          </div>
          <div class="text-xs text-slate-400 dark:text-slate-500 mt-1">Disponible para retiro</div>
        </div>

        <!-- Subscriptions -->
        <div class="bg-white dark:bg-[#141824] rounded-xl border border-slate-200 dark:border-white/[0.06] p-5 shadow-sm">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm text-slate-500 dark:text-slate-400">Suscripciones</span>
            <CreditCard class="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div class="text-2xl font-bold text-slate-900 dark:text-white">
            {{ formatCurrency(summary.balance_suscriptions, summary.currency) }}
          </div>
          <div class="text-xs text-slate-400 dark:text-slate-500 mt-1">Ingresos por planes</div>
        </div>

        <!-- Commissions -->
        <div class="bg-white dark:bg-[#141824] rounded-xl border border-slate-200 dark:border-white/[0.06] p-5 shadow-sm">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm text-slate-500 dark:text-slate-400">Comisiones</span>
            <TrendingUp class="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div class="text-2xl font-bold text-slate-900 dark:text-white">
            {{ formatCurrency(summary.balance_commissions, summary.currency) }}
          </div>
          <div class="text-xs text-slate-400 dark:text-slate-500 mt-1">Ingresos por comisiones</div>
        </div>

        <!-- Withdrawn -->
        <div class="bg-white dark:bg-[#141824] rounded-xl border border-slate-200 dark:border-white/[0.06] p-5 shadow-sm">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm text-slate-500 dark:text-slate-400">Total Retirado</span>
            <ArrowUpRight class="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div class="text-2xl font-bold text-slate-900 dark:text-white">
            {{ formatCurrency(summary.total_withdrawn, summary.currency) }}
          </div>
          <div class="text-xs text-slate-400 dark:text-slate-500 mt-1">Histórico de retiros</div>
        </div>
      </div>

      <!-- Recent Transactions -->
      <div class="bg-white dark:bg-[#141824] rounded-xl border border-slate-200 dark:border-white/[0.06] overflow-hidden shadow-sm">
        <div class="p-5 border-b border-slate-200 dark:border-white/[0.06]">
          <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Ingresos Recientes</h2>
          <p class="text-sm text-slate-500 dark:text-slate-400">Últimas transacciones del Platform Vault</p>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-slate-50 dark:bg-[#1a1f2e]">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tipo</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tienda</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Plan</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Monto</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estado</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fecha</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-white/[0.06]">
              <tr v-for="tx in summary.recent_transactions" :key="tx.id" class="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <component :is="getTransactionIcon(tx.transaction_type)" class="h-4 w-4 text-slate-400" />
                    <span class="text-sm text-slate-600 dark:text-slate-300">{{ getTransactionLabel(tx.transaction_type) }}</span>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <Building2 class="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <span class="text-sm text-slate-900 dark:text-white">{{ tx.tenant_name || 'N/A' }}</span>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <span class="text-sm text-slate-600 dark:text-slate-300">{{ tx.plan_name || '-' }}</span>
                </td>
                <td class="px-4 py-3 text-right">
                  <span class="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    +{{ formatCurrency(tx.amount, tx.currency) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center">
                  <span :class="['inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', getStatusClass(tx.status)]">
                    {{ tx.status }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Calendar class="h-4 w-4" />
                    <span class="text-sm">{{ formatDate(tx.created_at) }}</span>
                  </div>
                </td>
              </tr>
              <tr v-if="!summary.recent_transactions.length">
                <td colspan="6" class="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                  No hay transacciones recientes
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>