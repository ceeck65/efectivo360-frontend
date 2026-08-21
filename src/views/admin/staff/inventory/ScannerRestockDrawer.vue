<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-[100] flex justify-end">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="handleBackdropClick" />
      <div class="relative w-full max-w-md h-full bg-white flex flex-col shadow-2xl animate-slide-in">
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div class="min-w-0">
            <h3 class="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              <Zap class="w-4 h-4 text-amber-500" /> Entrada Rápida (Lector)
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">Pistolea un código de barras para reponer stock sin usar el ratón</p>
          </div>
          <button @click="$emit('close')" class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <!-- Scan step -->
          <template v-if="!matchedProduct">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Código de Barras / SKU</label>
              <div class="relative">
                <ScanBarcode class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  ref="scanInput"
                  v-model="code"
                  type="text"
                  placeholder="Esperando lectura..."
                  autocomplete="off"
                  class="w-full h-11 pl-9 pr-3 text-sm font-medium border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                  @keydown.enter.prevent="handleScan"
                />
                <Loader2 v-if="searching" class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />
              </div>
              <p v-if="notFound" class="text-xs text-rose-500 mt-1.5 flex items-center gap-1">
                <AlertTriangle class="w-3.5 h-3.5" /> No se encontró ningún producto para "{{ lastCode }}"
              </p>
            </div>

            <!-- Multiple matches -->
            <div v-if="results.length > 1" class="border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden">
              <button v-for="p in results" :key="p.id" @click="selectProduct(p)"
                class="w-full text-left px-3 py-2.5 hover:bg-blue-50/50 transition-colors flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                  <img v-if="p.image" :src="p.image" class="w-full h-full object-cover" alt="" />
                  <Package v-else class="w-4 h-4 text-slate-300" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-slate-800 truncate">{{ p.name }}</p>
                  <p class="text-[11px] text-slate-400 font-mono">{{ p.sku }}</p>
                </div>
              </button>
            </div>
          </template>

          <!-- Confirm step -->
          <template v-else>
            <div class="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
              <img v-if="matchedProduct.image" :src="matchedProduct.image" alt=""
                class="w-11 h-11 rounded-lg object-cover border border-slate-200 flex-shrink-0" />
              <div v-else class="w-11 h-11 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                <Package class="w-5 h-5 text-blue-500" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-semibold text-slate-800 truncate">{{ matchedProduct.name }}</p>
                <div class="flex items-center gap-2 mt-0.5">
                  <code class="text-[11px] font-mono bg-white text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">{{ matchedProduct.sku }}</code>
                  <span class="text-[11px] text-slate-400">Stock: <strong class="text-slate-600">{{ formatQty(matchedProduct.current_stock) }}</strong></span>
                </div>
              </div>
              <button @click="backToScan" class="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white transition-colors" title="Cambiar producto">
                <RotateCcw class="w-4 h-4" />
              </button>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Cantidad</label>
              <div class="relative">
                <input
                  ref="qtyInput"
                  v-model.number="qty"
                  type="number"
                  min="0.001"
                  step="0.001"
                  :disabled="submitting"
                  class="w-full h-11 px-3 text-base font-semibold border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 disabled:opacity-50"
                  @keydown.enter.prevent="confirmRestock"
                />
                <Loader2 v-if="submitting" class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-blue-500" />
              </div>
              <p class="text-[11px] text-slate-400 mt-1">
                <kbd class="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px]">Enter</kbd>
                confirma y queda listo para el siguiente código
              </p>
            </div>
          </template>
        </div>

        <!-- Recent scans log -->
        <div v-if="recentEntries.length > 0" class="border-t border-slate-200 px-5 py-3">
          <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Últimas reposiciones</p>
          <div class="space-y-1.5 max-h-40 overflow-y-auto">
            <div v-for="(entry, i) in recentEntries" :key="i" class="flex items-center justify-between text-xs">
              <span class="text-slate-600 truncate">{{ entry.name }}</span>
              <span class="text-emerald-600 font-semibold shrink-0 ml-2">+{{ entry.qty }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue';
import { X, Zap, ScanBarcode, Loader2, Package, AlertTriangle, RotateCcw } from 'lucide-vue-next';
import { apiClient, fetchApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';

interface ScanProduct {
  id: string;
  name: string;
  sku: string;
  image?: string | null;
  current_stock: number;
}

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{
  close: [];
  restocked: [payload: { productId: string; newStock: number }];
}>();

const { success, error: notifyError } = useNotify();

const scanInput = ref<HTMLInputElement | null>(null);
const qtyInput = ref<HTMLInputElement | null>(null);

const code = ref('');
const lastCode = ref('');
const searching = ref(false);
const notFound = ref(false);
const results = ref<ScanProduct[]>([]);
const matchedProduct = ref<ScanProduct | null>(null);
const qty = ref<number | null>(null);
const submitting = ref(false);
const recentEntries = ref<{ name: string; qty: string }[]>([]);

function formatQty(val: number | undefined | null): string {
  if (val == null) return '0,00';
  return Number(val).toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function handleScan() {
  const term = code.value.trim();
  notFound.value = false;
  results.value = [];
  if (!term) return;

  searching.value = true;
  lastCode.value = term;
  try {
    const res = await apiClient.get('/api/products/', { params: { search: term, page_size: 8 } });
    const data = res.data;
    const items: any[] = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
    const mapped: ScanProduct[] = items.map((item: any) => ({
      id: item.id,
      name: item.name ?? item.effective_name ?? '',
      sku: item.sku ?? item.effective_sku ?? '',
      image: item.image ?? null,
      current_stock: Number(item.current_stock ?? item.base_unit_stock ?? 0),
    }));

    if (mapped.length === 1) {
      selectProduct(mapped[0]);
    } else if (mapped.length === 0) {
      notFound.value = true;
      code.value = '';
    } else {
      results.value = mapped;
    }
  } catch {
    notFound.value = true;
  } finally {
    searching.value = false;
  }
}

function selectProduct(p: ScanProduct) {
  matchedProduct.value = p;
  results.value = [];
  code.value = '';
  qty.value = null;
  nextTick(() => qtyInput.value?.focus());
}

function backToScan() {
  matchedProduct.value = null;
  qty.value = null;
  nextTick(() => scanInput.value?.focus());
}

function extractErrorMessage(e: any): string {
  const data = e?.data;
  if (data && typeof data === 'object') {
    const firstKey = Object.keys(data)[0];
    const val = firstKey ? data[firstKey] : null;
    if (Array.isArray(val) && val.length) return String(val[0]);
    if (typeof val === 'string') return val;
  }
  return e?.message || 'Error al registrar la reposición';
}

async function confirmRestock() {
  if (!matchedProduct.value || !qty.value || qty.value <= 0 || submitting.value) return;
  submitting.value = true;
  try {
    const res = await fetchApi<any>('/api/v1/inventory/quick-restock/', {
      method: 'POST',
      data: { product_id: matchedProduct.value.id, quantity: qty.value },
    });
    const newStock = Number(res?.stock?.new_stock ?? (matchedProduct.value.current_stock + qty.value));
    const qtyLabel = Number.isInteger(qty.value) ? String(qty.value) : qty.value.toFixed(2);

    recentEntries.value.unshift({ name: matchedProduct.value.name, qty: qtyLabel });
    if (recentEntries.value.length > 8) recentEntries.value.pop();

    success(`+${qtyLabel} unidades agregadas a ${matchedProduct.value.name}`);
    emit('restocked', { productId: matchedProduct.value.id, newStock });

    // Reset for the next barcode — no mouse needed
    matchedProduct.value = null;
    qty.value = null;
    code.value = '';
    nextTick(() => scanInput.value?.focus());
  } catch (e: any) {
    notifyError(extractErrorMessage(e));
  } finally {
    submitting.value = false;
  }
}

function handleBackdropClick() {
  if (!matchedProduct.value) emit('close');
}

watch(() => props.visible, (v) => {
  if (v) {
    code.value = '';
    lastCode.value = '';
    notFound.value = false;
    results.value = [];
    matchedProduct.value = null;
    qty.value = null;
    nextTick(() => scanInput.value?.focus());
  }
});
</script>
