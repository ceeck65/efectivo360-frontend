<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="handleClose" />
      <div class="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-scale-in">
        <!-- Header -->
        <div class="flex items-start gap-3 p-4 border-b border-slate-100">
          <div class="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden flex-shrink-0">
            <img v-if="product?.image" :src="product.image" :alt="product.name" class="w-full h-full object-cover"
              @error="($event.target as HTMLImageElement).style.display='none'" />
            <div v-else class="w-full h-full flex items-center justify-center text-slate-300">
              <Scale class="w-5 h-5" />
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-sm font-bold text-slate-900 truncate">{{ product?.name }}</h3>
            <p class="text-[11px] text-slate-500 mt-0.5">${{ pricePerUnit.toFixed(2) }} / {{ unitLabel }}</p>
          </div>
          <button @click="handleClose" class="p-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0">
            <X class="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div class="p-4 space-y-3.5">
          <!-- Mode toggle -->
          <div class="flex items-center rounded-full border border-slate-200 p-0.5 bg-slate-50 w-fit mx-auto">
            <button type="button" @click="entryMode = 'QTY'"
              class="px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors"
              :class="entryMode === 'QTY' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'">
              {{ unitLabel }}
            </button>
            <button type="button" @click="entryMode = 'AMOUNT'"
              class="px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors"
              :class="entryMode === 'AMOUNT' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'">
              Monto
            </button>
          </div>

          <!-- QTY mode -->
          <div v-if="entryMode === 'QTY'">
            <label class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 text-center">
              Cantidad ({{ unitLabel }})
            </label>
            <input ref="qtyInputRef" v-model.number="qtyInput" type="number" min="0" step="0.001" placeholder="0.000"
              class="w-full h-14 px-3 text-2xl font-black text-center border border-slate-300 rounded-xl bg-white text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
              @keydown.enter="confirm" />
            <div class="grid grid-cols-4 gap-2 mt-2.5">
              <button v-for="p in qtyPresets" :key="p.label" type="button" @click="pickQtyPreset(p.value)"
                class="h-9 rounded-lg text-xs font-semibold border border-slate-200 bg-slate-50 text-slate-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors">
                {{ p.label }}
              </button>
            </div>
          </div>

          <!-- AMOUNT mode -->
          <div v-else>
            <div class="flex items-center justify-center rounded-full border border-slate-200 p-0.5 bg-slate-50 w-fit mx-auto mb-2.5">
              <button type="button" @click="amountCurrency = 'USD'"
                class="px-3 py-1 text-[11px] font-semibold rounded-full transition-colors"
                :class="amountCurrency === 'USD' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'">
                $ USD
              </button>
              <button type="button" @click="amountCurrency = 'VES'"
                class="px-3 py-1 text-[11px] font-semibold rounded-full transition-colors"
                :class="amountCurrency === 'VES' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'">
                Bs. VES
              </button>
            </div>
            <label class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 text-center">
              Presupuesto del Cliente ({{ amountCurrency === 'VES' ? 'Bs.' : '$' }})
            </label>
            <input ref="amountInputRef" v-model.number="amountInput" type="number" min="0" step="0.01" placeholder="0.00"
              class="w-full h-14 px-3 text-2xl font-black text-center border border-slate-300 rounded-xl bg-white text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
              @keydown.enter="confirm" />
            <p v-if="amountCurrency === 'VES' && !bcvRate" class="text-[10px] text-amber-600 font-medium mt-1 text-center">
              No hay tasa BCV disponible ahora mismo.
            </p>
            <div class="grid grid-cols-4 gap-2 mt-2.5">
              <button v-for="p in amountPresets" :key="p" type="button" @click="pickAmountPreset(p)"
                class="h-9 rounded-lg text-xs font-semibold border border-slate-200 bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-colors">
                {{ amountCurrency === 'VES' ? `Bs. ${formatVES(p)}` : `$${p.toFixed(2)}` }}
              </button>
            </div>
          </div>

          <!-- Resolved breakdown preview -->
          <div class="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-center">
            <p v-if="entryMode === 'QTY'" class="text-sm font-bold text-slate-800">
              {{ formatQty3(resolvedQty) }} {{ unitLabel }} × ${{ pricePerUnit.toFixed(2) }}/{{ unitLabel }} = ${{ resolvedAmountUsd.toFixed(2) }}
            </p>
            <p v-else-if="amountCurrency === 'VES'" class="text-sm font-bold text-slate-800">
              {{ formatVES(amountInput || 0) }} Bs ( ${{ resolvedAmountUsd.toFixed(2) }} ) ➔ {{ formatQty3(resolvedQty) }} {{ unitLabel }}
            </p>
            <p v-else class="text-sm font-bold text-slate-800">
              ${{ (amountInput || 0).toFixed(2) }} ➔ {{ formatQty3(resolvedQty) }} {{ unitLabel }}
            </p>
            <p v-if="exceedsStock" class="text-[11px] text-rose-600 font-semibold mt-1 flex items-center justify-center gap-1">
              <AlertTriangle class="w-3 h-3 shrink-0" />
              Excede el stock disponible ({{ formatQty3(product?.maxStock || 0) }} {{ unitLabel }})
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50/60">
          <button @click="handleClose" class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            Cancelar
          </button>
          <button @click="confirm" :disabled="!canConfirm"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm">
            <Scale class="w-4 h-4" />
            {{ isEdit ? 'Actualizar Cantidad' : 'Agregar al Carrito' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { X, Scale, AlertTriangle } from 'lucide-vue-next';
import { unitsLabelFor } from '@/composables/usePackageTypes';
import type { DisplayCurrency } from '@/stores/posDisplay';

export interface WeightModalProduct {
  id: string;
  name: string;
  image?: string;
  barcode?: string;
  /** 'PESO' | 'VOLUMEN' — anything else falls back to the PESO/Kg presentation. */
  sale_unit: string;
  /** Precio por Kg/L. */
  price_usd: number;
  maxStock: number;
}

const props = defineProps<{
  visible: boolean;
  product: WeightModalProduct | null;
  /** Present when re-opening the calculator to adjust an existing cart line. */
  initialQty?: number | null;
  /** Tasa BCV oficial (Bs. por 1 USD) — viene de PosMainView (useForexRate), no se vuelve a pedir aquí. */
  bcvRate: number;
  /** Moneda de visualización activa del POS (posDisplayStore) — precarga la pestaña "Monto" con esta moneda al abrir. */
  defaultCurrency?: DisplayCurrency;
}>();

const emit = defineEmits<{
  close: [];
  confirm: [qty: number];
}>();

type EntryMode = 'QTY' | 'AMOUNT';
type AmountCurrency = 'USD' | 'VES';
const entryMode = ref<EntryMode>('QTY');
const amountCurrency = ref<AmountCurrency>('USD');
const qtyInput = ref<number | null>(null);
const amountInput = ref<number | null>(null);
const qtyInputRef = ref<HTMLInputElement | null>(null);
const amountInputRef = ref<HTMLInputElement | null>(null);

const AMOUNT_PRESETS_USD = [1, 2, 5, 10];
const AMOUNT_PRESETS_VES = [200, 500, 1000, 2000];

const isEdit = computed(() => props.initialQty != null);
const unitLabel = computed(() => unitsLabelFor(props.product?.sale_unit));
const pricePerUnit = computed(() => props.product?.price_usd || 0);

const qtyPresets = computed(() => {
  const isVolume = props.product?.sale_unit === 'VOLUMEN';
  return [
    { label: isVolume ? '100ml' : '100g', value: 0.1 },
    { label: isVolume ? '250ml' : '250g', value: 0.25 },
    { label: isVolume ? '500ml' : '500g', value: 0.5 },
    { label: isVolume ? '1 L' : '1 Kg', value: 1 },
  ];
});

const amountPresets = computed(() => (amountCurrency.value === 'VES' ? AMOUNT_PRESETS_VES : AMOUNT_PRESETS_USD));

/** El monto tal como se ingresó en la pestaña Monto, convertido a USD — monto_usd = monto_bs / bcvRate cuando la moneda es VES. */
const enteredAmountUsd = computed(() => {
  if (amountCurrency.value === 'USD') return amountInput.value || 0;
  if (!props.bcvRate || props.bcvRate <= 0) return 0;
  return (amountInput.value || 0) / props.bcvRate;
});

const resolvedQty = computed(() => {
  if (entryMode.value === 'QTY') {
    return Math.round((qtyInput.value || 0) * 1000) / 1000;
  }
  if (pricePerUnit.value <= 0) return 0;
  return Math.round((enteredAmountUsd.value / pricePerUnit.value) * 1000) / 1000;
});

/** Monto USD equivalente a lo ya resuelto — para el resumen inferior, en ambos modos. */
const resolvedAmountUsd = computed(() => {
  if (entryMode.value === 'QTY') return Math.round(resolvedQty.value * pricePerUnit.value * 100) / 100;
  return Math.round(enteredAmountUsd.value * 100) / 100;
});

const exceedsStock = computed(() => !!props.product && resolvedQty.value > props.product.maxStock);
const canConfirm = computed(() => resolvedQty.value > 0 && !exceedsStock.value);

function formatQty3(v: number): string {
  return (v || 0).toLocaleString('es', { minimumFractionDigits: 0, maximumFractionDigits: 3 });
}
function formatVES(v: number): string {
  return (v || 0).toLocaleString('es-VE', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function pickQtyPreset(v: number) {
  entryMode.value = 'QTY';
  qtyInput.value = v;
}
function pickAmountPreset(v: number) {
  entryMode.value = 'AMOUNT';
  amountInput.value = v;
}

// Switching currency mid-entry would leave a stale number under a new symbol — reset it.
watch(amountCurrency, () => { amountInput.value = null; });

function confirm() {
  if (!canConfirm.value) return;
  emit('confirm', resolvedQty.value);
}

function handleClose() {
  emit('close');
}

watch(() => props.visible, (v) => {
  if (!v) return;
  entryMode.value = 'QTY';
  amountCurrency.value = props.defaultCurrency ?? 'USD';
  qtyInput.value = props.initialQty ?? null;
  amountInput.value = null;
  nextTick(() => qtyInputRef.value?.focus());
});
</script>
