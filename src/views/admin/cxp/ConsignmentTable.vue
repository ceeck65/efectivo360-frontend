<template>
  <div class="space-y-4">
    <div v-if="cxpStore.loadingConsignments" class="text-center py-12 text-sm text-slate-400">Cargando...</div>

    <div v-else-if="cxpStore.consignmentsError"
      class="text-center py-16 rounded-2xl border border-dashed border-amber-200 bg-amber-50/50">
      <AlertTriangle class="w-6 h-6 mx-auto mb-2 text-amber-400" />
      <p class="text-sm text-amber-700">{{ cxpStore.consignmentsError }}</p>
    </div>

    <div v-else-if="cxpStore.consignmentSuppliers.length === 0"
      class="text-center py-16 rounded-2xl border border-dashed border-slate-200">
      <PackageOpen class="w-6 h-6 mx-auto mb-2 text-slate-300" />
      <p class="text-sm text-slate-400">No hay mercancía en consignación pendiente por liquidar</p>
    </div>

    <template v-else>
      <div class="rounded-2xl border border-purple-200 bg-purple-50/50 px-5 py-3 flex items-center justify-between">
        <span class="text-xs font-medium text-purple-700">Total pendiente por liquidar (todos los proveedores)</span>
        <div class="text-right">
          <p class="text-lg font-bold text-purple-700">{{ formatAmount(cxpStore.consignmentTotalUsd, 'USD') }}</p>
          <p v-if="cxpStore.consignmentTotalVes != null" class="text-[11px] text-purple-500">{{ formatAmount(cxpStore.consignmentTotalVes, 'VES') }}</p>
        </div>
      </div>

      <div v-for="group in cxpStore.consignmentSuppliers" :key="group.supplier_id || 'sin-proveedor'"
        class="rounded-xl border border-slate-200 overflow-hidden">
        <div class="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
          <span class="text-sm font-semibold text-slate-800">{{ group.supplier_name }}</span>
          <div class="text-right">
            <span class="text-sm font-bold text-slate-800">{{ formatAmount(group.total_pending_usd, 'USD') }}</span>
            <span v-if="group.total_pending_ves != null" class="text-[11px] text-slate-400 ml-1.5">
              ({{ formatAmount(group.total_pending_ves, 'VES') }})
            </span>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-white border-b border-slate-100 text-left">
              <tr>
                <th class="px-4 py-2.5 font-medium text-slate-500 text-xs whitespace-nowrap">Fecha Recepción</th>
                <th class="px-4 py-2.5 font-medium text-slate-500 text-xs whitespace-nowrap">Producto</th>
                <th class="px-4 py-2.5 font-medium text-slate-500 text-xs text-right whitespace-nowrap">Recibidos</th>
                <th class="px-4 py-2.5 font-medium text-slate-500 text-xs text-right whitespace-nowrap">Vendidos POS</th>
                <th class="px-4 py-2.5 font-medium text-slate-500 text-xs text-right whitespace-nowrap">Pend. Liquidar</th>
                <th class="px-4 py-2.5 font-medium text-slate-500 text-xs text-right whitespace-nowrap">Monto a Pagar</th>
                <th class="px-4 py-2.5 font-medium text-slate-500 text-xs text-right whitespace-nowrap"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="item in group.items" :key="item.id" class="hover:bg-slate-50/50 transition-colors">
                <td class="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{{ formatDate(item.received_at) }}</td>
                <td class="px-4 py-3">
                  <p class="text-sm font-medium text-slate-800">{{ item.product_name }}</p>
                  <code class="text-[10px] font-mono text-slate-400">{{ item.product_sku }}</code>
                </td>
                <td class="px-4 py-3 text-right text-slate-700">{{ formatQty(item.received_units) }}</td>
                <td class="px-4 py-3 text-right text-slate-700">{{ formatQty(item.sold_units) }}</td>
                <td class="px-4 py-3 text-right">
                  <span class="font-semibold" :class="item.pending_units_to_settle > 0 ? 'text-purple-700' : 'text-slate-400'">
                    {{ formatQty(item.pending_units_to_settle) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  <p class="font-mono font-semibold text-slate-900">{{ formatAmount(item.amount_to_pay_usd, 'USD') }}</p>
                  <p v-if="item.equiv_ves != null" class="text-[10px] text-slate-400">{{ formatAmount(item.equiv_ves, 'VES') }}</p>
                </td>
                <td class="px-4 py-3 text-right">
                  <button
                    :disabled="item.pending_units_to_settle <= 0"
                    @click="$emit('settle', item, group.supplier_name)"
                    class="inline-flex items-center gap-1 h-8 px-3 text-xs font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-purple-600 transition-colors">
                    💵 Liquidar Vendidos
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { AlertTriangle, PackageOpen } from 'lucide-vue-next';
import { useCurrency } from '@/lib/currency';
import { useCxpStore, type ConsignmentItem } from '@/stores/cxp';

defineEmits<{
  settle: [item: ConsignmentItem, supplierName: string];
}>();

const cxpStore = useCxpStore();
const { formatAmount } = useCurrency();

function formatQty(v: number): string {
  return (v || 0).toLocaleString('es', { minimumFractionDigits: 0, maximumFractionDigits: 3 });
}

function formatDate(v: string): string {
  if (!v) return '—';
  try {
    return new Date(v).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return v;
  }
}
</script>
