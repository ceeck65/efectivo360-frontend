<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-[100] flex justify-end">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="$emit('close')" />
      <!-- Panel -->
      <div class="relative w-full max-w-xl h-full bg-white flex flex-col shadow-2xl animate-slide-in">
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div class="min-w-0">
            <h3 class="text-sm font-semibold text-slate-800 truncate">Cronología de Gestión</h3>
            <p v-if="product" class="text-xs text-slate-400 truncate mt-0.5">{{ product.name }} · {{ product.sku }}</p>
          </div>
          <button @click="$emit('close')"
            class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Content -->
        <div v-if="loading" class="flex-1 flex items-center justify-center">
          <Loader2 class="w-5 h-5 animate-spin text-slate-400" />
        </div>

        <div v-else-if="error" class="flex-1 flex items-center justify-center text-sm text-rose-500 px-6 text-center">
          {{ error }}
        </div>

        <div v-else-if="movements.length === 0" class="flex-1 flex flex-col items-center justify-center text-slate-400 px-6">
          <Clock class="w-10 h-10 mb-3 opacity-40" />
          <p class="text-sm font-medium">Sin movimientos registrados</p>
          <p class="text-xs mt-1 text-center">Este producto Kardex aún no tiene entradas ni salidas.</p>
        </div>

        <div v-else class="flex-1 overflow-y-auto px-5 py-4">
          <div class="relative">
            <!-- Timeline line -->
            <div class="absolute left-[17px] top-2 bottom-2 w-0.5 bg-slate-200" />
            <!-- Entries -->
            <div v-for="m in movements" :key="m.id" class="relative flex gap-4 pb-6 last:pb-0">
              <!-- Direction icon -->
              <div class="relative z-10 flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center border-2"
                :class="isEntry(m) ? 'bg-green-50 border-green-200' : 'bg-rose-50 border-rose-200'">
                <ArrowDown v-if="isEntry(m)" class="w-4 h-4 text-green-600" />
                <ArrowUp v-else class="w-4 h-4 text-rose-600" />
              </div>
              <!-- Card -->
              <div class="flex-1 min-w-0 bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-slate-800">{{ movementLabel(m) }}</p>
                    <p v-if="m.reason" class="text-xs text-slate-500 mt-0.5">{{ m.reason }}</p>
                  </div>
                  <span class="text-xs text-slate-400 whitespace-nowrap">{{ formatDate(m.created_at) }}</span>
                </div>
                <div class="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                  <span class="text-slate-500">
                    Cantidad: <strong class="text-slate-700">{{ formatQty(m.quantity) }}</strong>
                  </span>
                  <span v-if="m.effective_quantity_in_uom" class="text-slate-500">
                    Efectivas: <strong class="text-slate-700">{{ formatQty(m.effective_quantity_in_uom) }} {{ m.uom_label }}</strong>
                  </span>
                  <span v-if="m.costo_bulto_entrada" class="text-slate-500">
                    Costo: <strong class="text-slate-700">${{ Number(m.costo_bulto_entrada).toFixed(2) }}</strong>
                  </span>
                  <span v-if="m.performed_by_name" class="text-slate-400 ml-auto">
                    {{ m.performed_by_name }}
                  </span>
                </div>
                <div v-if="m.entry_type === 'BULTO'" class="mt-2 text-[10px] text-amber-600 bg-amber-50 rounded px-2 py-0.5 inline-block">
                  Entrada por bulto
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useApi } from '@/composables/useApi';
import { X, Loader2, ArrowDown, ArrowUp, Clock } from 'lucide-vue-next';

interface ProductItem {
  id: string;
  name: string;
  sku: string;
  inventory_type: string;
}

interface MovementEntry {
  id: number;
  movement_type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'SALE' | 'CREDIT_NOTE';
  quantity: number;
  effective_quantity_in_uom?: number;
  uom_label?: string;
  reason: string;
  costo_bulto_entrada?: number;
  entry_type?: string;
  performed_by_name?: string;
  created_at: string;
}

const props = defineProps<{
  visible: boolean;
  product: ProductItem | null;
}>();

defineEmits<{ close: [] }>();

const { fetchApi } = useApi();
const loading = ref(false);
const error = ref('');
const movements = ref<MovementEntry[]>([]);

function isEntry(m: MovementEntry): boolean {
  return m.movement_type === 'IN' || m.movement_type === 'CREDIT_NOTE';
}

function movementLabel(m: MovementEntry): string {
  const labels: Record<string, string> = {
    IN: 'Inicialización de Inventario',
    OUT: 'Salida de Inventario',
    ADJUSTMENT: 'Ajuste Manual',
    SALE: 'Venta POS',
    CREDIT_NOTE: 'Nota de Crédito',
  };
  return labels[m.movement_type] ?? m.movement_type;
}

function formatQty(val: number | undefined | null): string {
  if (val == null) return '0';
  return Number(val.toFixed(4)).toLocaleString('es', { minimumFractionDigits: 0, maximumFractionDigits: 4 });
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
}

watch(() => [props.visible, props.product], async ([visible, raw]) => {
  if (!visible || !raw) return;
  const product = raw as ProductItem;
  loading.value = true;
  error.value = '';
  movements.value = [];
  try {
    const res = await fetchApi<any>(`/api/inventory-movements/?page_size=500&product=${product.id}`);
    movements.value = res.results ?? res ?? [];
  } catch (e) {
    error.value = 'Error al cargar el historial de movimientos.';
  } finally {
    loading.value = false;
  }
}, { immediate: false });
</script>
