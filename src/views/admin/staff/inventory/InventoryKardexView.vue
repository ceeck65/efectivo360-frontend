<template>
  <div class="space-y-5">
    <div>
      <h2 class="text-lg font-semibold text-slate-800">Kárdex de Inventario</h2>
      <p class="text-xs text-slate-500 mt-0.5">Auditoría de movimientos de stock</p>
    </div>

    <!-- Filters -->
    <div class="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Almacén</label>
          <select v-model="filter.warehouse" class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option value="">Todos</option>
            <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
          </select>
        </div>
        <div>
          <label class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Tipo</label>
          <select v-model="filter.type" class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option value="">Todos</option>
            <option value="IN">Entradas</option>
            <option value="OUT">Salidas</option>
          </select>
        </div>
        <div>
          <label class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Desde</label>
          <input v-model="filter.dateFrom" type="date" class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <div>
          <label class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Hasta</label>
          <input v-model="filter.dateTo" type="date" class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
      </div>
    </div>

    <!-- Table -->
    <div v-if="loading" class="text-center py-16 text-slate-400"><Loader2 class="w-5 h-5 animate-spin mx-auto mb-2" /> Cargando kárdex...</div>

    <div v-else class="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">Fecha</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Producto</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Almacén</th>
              <th class="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase w-24">Tipo</th>
              <th class="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase w-24">Cantidad</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase hidden lg:table-cell">Razón</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase hidden lg:table-cell">Ref.</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="mov in filteredMovements" :key="mov.id" class="hover:bg-slate-50/50 transition-colors">
              <td class="px-4 py-3 whitespace-nowrap text-xs text-slate-500">{{ formatDate(mov.created_at) }}</td>
              <td class="px-4 py-3">
                <span class="text-slate-800 font-medium">{{ mov.product_name || mov.product }}</span>
              </td>
              <td class="px-4 py-3 hidden md:table-cell text-xs text-slate-500">{{ mov.warehouse_name || mov.warehouse_to }}</td>
              <td class="px-4 py-3 text-center">
                <span :class="mov.type === 'IN'
                  ? 'inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200'">
                  {{ mov.type === 'IN' ? 'Entrada' : 'Salida' }}
                </span>
              </td>
              <td class="px-4 py-3 text-right font-mono text-sm"
                :class="mov.type === 'IN' ? 'text-emerald-700' : 'text-rose-700'">
                {{ mov.type === 'IN' ? '+' : '−' }}{{ formatQty(mov.quantity) }}
              </td>
              <td class="px-4 py-3 hidden lg:table-cell text-xs text-slate-500">{{ mov.reason }}</td>
              <td class="px-4 py-3 hidden lg:table-cell text-xs text-slate-400 font-mono">{{ mov.reference_id ? mov.reference_id.slice(0, 8) + '…' : '—' }}</td>
            </tr>
            <tr v-if="filteredMovements.length === 0">
              <td colspan="7" class="px-4 py-12 text-center text-sm text-slate-400 italic">No hay movimientos</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { Loader2 } from 'lucide-vue-next';

interface Movement {
  id: string; product: string; product_name?: string;
  warehouse_to?: string; warehouse_name?: string;
  quantity: number; type: 'IN' | 'OUT'; reason: string;
  reference_id?: string; created_at: string;
}

const loading = ref(false);
const movements = ref<Movement[]>([]);
const warehouses = ref<any[]>([]);

const filter = reactive({ warehouse: '', type: '', dateFrom: '', dateTo: '' });

const filteredMovements = computed(() => {
  return movements.value.filter(m => {
    if (filter.type && m.type !== filter.type) return false;
    return true;
  });
});

function formatDate(d: string): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatQty(v: number): string {
  return (v || 0).toLocaleString('es-VE', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}
</script>
