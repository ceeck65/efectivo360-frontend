<script setup lang="ts">
import { 
   Wallet, 
   CreditCard, 
   Building2, 
   AlertCircle
} from 'lucide-vue-next';

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

const props = defineProps<{
   transactions: Transaction[];
}>();

// Reference props to avoid "unused" warnings
const transactions = props.transactions;

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
      return Building2;
    case 'withdrawal':
      return Wallet;
    case 'refund':
      return AlertCircle;
    default:
      return Wallet;
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
</script>

<template>
  <div class="bg-white dark:bg-[#141824] rounded-xl border border-slate-200 dark:border-white/[0.06] p-6 shadow-sm">
    <div class="flex items-start justify-between mb-4">
      <div class="flex items-center gap-3">
        <div class="p-2 rounded-lg bg-cyan-500/20">
          <TrendingUp class="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
        </div>
        <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Ingresos Recientes</h2>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-slate-50 dark:bg-[#1a1f2e]">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Tipo</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Tienda</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Plan</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Monto</th>
            <th class="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Estado</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Fecha</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-white/[0.06]">
          <tr v-for="tx in transactions" :key="tx.id" class="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <component :is="getTransactionIcon(tx.transaction_type)" class="h-4 w-4 text-slate-400" />
                <span class="text-sm text-slate-600 dark:text-slate-300">{{ getTransactionLabel(tx.transaction_type) }}</span>
              </div>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <Building2 class="h-4 w-4 text-slate-500" />
                <span class="text-sm text-white">{{ tx.tenant_name || 'N/A' }}</span>
              </div>
            </td>
            <td class="px-4 py-3">
              <span class="text-sm text-slate-300">{{ tx.plan_name || '-' }}</span>
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
          <tr v-if="!transactions.length">
            <td colspan="6" class="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
              No hay transacciones recientes
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>