<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="handleClose" />
      <div class="relative bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl">
        <!-- Header -->
        <div class="flex items-start justify-between px-5 py-4 border-b border-slate-200">
          <div class="flex items-center gap-3 min-w-0">
            <img v-if="product?.image" :src="product.image" alt=""
              class="w-11 h-11 rounded-lg object-cover border border-slate-200 flex-shrink-0" />
            <div v-else class="w-11 h-11 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
              <Package class="w-5 h-5 text-blue-500" />
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-slate-800 truncate">{{ product?.name || '—' }}</p>
              <div class="flex items-center gap-2 mt-0.5">
                <code class="text-[11px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{{ product?.sku || 'N/A' }}</code>
                <span class="text-[11px] text-slate-400">
                  Stock actual:
                  <strong :class="(product?.current_stock ?? 0) <= 0 ? 'text-rose-600' : 'text-slate-700'">
                    {{ formatQty(product?.current_stock) }}
                  </strong>
                </span>
              </div>
            </div>
          </div>
          <button @click="handleClose" class="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 shrink-0">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Body -->
        <div class="px-5 py-4 space-y-4">
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">
              Cantidad Comprada <span class="text-red-400">*</span>
            </label>
            <input
              ref="quantityInput"
              v-model.number="quantity"
              type="number"
              min="0.001"
              step="0.001"
              placeholder="Ej: 12, 24, 50"
              class="w-full h-11 px-3 text-base font-semibold border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
              @keydown.enter.prevent="submit"
            />
            <p class="text-[11px] text-slate-400 mt-1">Presiona <kbd class="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px]">Enter</kbd> para confirmar y cerrar</p>
          </div>

          <div v-if="loadingPrice" class="flex items-center gap-2 text-xs text-slate-400 py-2">
            <Loader2 class="w-3.5 h-3.5 animate-spin" /> Cargando costo actual...
          </div>
          <template v-else>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">Costo Anterior</label>
                <div class="h-10 px-3 flex items-center text-sm font-medium text-slate-500 bg-slate-50 border border-slate-200 rounded-lg">
                  ${{ previousCost.toFixed(2) }}
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">Nuevo Costo Unitario ($)</label>
                <input
                  v-model.number="newCost"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <!-- Margin alert -->
            <div v-if="showMarginAlert" class="rounded-lg border border-amber-300 bg-amber-50 p-3 flex items-start gap-2.5">
              <TrendingUp class="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div class="flex-1 min-w-0">
                <p class="text-xs text-amber-800 leading-relaxed">
                  El costo subió a <strong>${{ newCost?.toFixed(2) }}</strong>.
                  ¿Deseas ajustar el precio de venta a <strong>${{ suggestedPrice.toFixed(2) }}</strong> para mantener el margen habitual?
                </p>
                <label class="mt-2 flex items-center gap-2 text-xs text-amber-900 cursor-pointer select-none">
                  <input type="checkbox" v-model="updateSellingPrice"
                    class="w-3.5 h-3.5 rounded border-amber-300 text-amber-600 focus:ring-amber-500/30" />
                  Ajustar precio de venta automáticamente
                </label>
                <div v-if="updateSellingPrice" class="mt-2 flex items-center gap-2">
                  <span class="text-[11px] text-amber-700">Nuevo precio ($):</span>
                  <input
                    v-model.number="newSellingPrice"
                    type="number" min="0" step="0.01"
                    class="w-24 h-8 px-2 text-xs border border-amber-300 rounded-md bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    @input="priceManuallyEdited = true"
                  />
                </div>
              </div>
            </div>

            <div v-else-if="previousPrice > 0" class="text-[11px] text-slate-400">
              Precio de venta actual: <strong class="text-slate-600">${{ previousPrice.toFixed(2) }}</strong>
            </div>
          </template>

          <!-- Origen de Fondos -->
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1.5">Origen de Fondos</label>
            <div class="flex items-center gap-1.5 flex-wrap">
              <button v-for="opt in paymentSourceOptions" :key="opt.value" type="button"
                @click="paymentSource = opt.value"
                class="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold rounded-full border transition-colors"
                :class="paymentSource === opt.value
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'">
                <span>{{ opt.emoji }}</span> {{ opt.label }}
              </button>
            </div>

            <!-- Cash drawer feedback -->
            <div v-if="paymentSource === 'CASH_DRAWER'" class="mt-2 rounded-lg border p-2.5 text-[11px] leading-relaxed"
              :class="!turnoActivo ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-blue-50 border-blue-200 text-blue-700'">
              <template v-if="loadingBalance">
                <Loader2 class="w-3.5 h-3.5 inline animate-spin -mt-0.5 mr-1" /> Verificando caja abierta...
              </template>
              <template v-else-if="!turnoActivo">
                <AlertTriangle class="w-3.5 h-3.5 inline -mt-0.5 mr-1" />
                No tienes una caja abierta. Abre un turno antes de continuar.
              </template>
              <template v-else>
                <Wallet class="w-3.5 h-3.5 inline -mt-0.5 mr-1" />
                Se registrará un egreso de <strong>${{ totalAmount.toFixed(2) }}</strong>
                <span v-if="totalAmountVes != null">(Bs. {{ totalAmountVes.toFixed(2) }})</span>
                en tu caja abierta actual<span v-if="turnoActivo.register_name"> ({{ turnoActivo.register_name }})</span>.
                <div v-if="insufficientBalance" class="mt-1.5 flex items-start gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-1.5">
                  <AlertTriangle class="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    El saldo disponible en caja (${{ expectedCashUsd?.toFixed(2) }}) es menor al monto a egresar.
                    Puedes continuar si un Administrador lo aprueba.
                  </span>
                </div>
              </template>
            </div>

            <!-- Supplier credit -->
            <div v-else-if="paymentSource === 'SUPPLIER_CREDIT'" class="mt-2">
              <label class="block text-xs font-medium text-slate-600 mb-1">
                Proveedor <span class="text-red-400">*</span>
              </label>
              <select v-model="supplierId"
                class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                <option value="">{{ loadingSuppliers ? 'Cargando proveedores...' : 'Selecciona un proveedor...' }}</option>
                <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
              <p class="text-[11px] text-slate-400 mt-1">
                Se registrará como cuenta por pagar. No afecta la caja del turno.
              </p>
            </div>

            <p v-else class="mt-2 text-[11px] text-slate-400">
              No se afectará la caja operativa del turno actual.
            </p>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">N° Factura / Comprobante (opcional)</label>
            <input v-model="invoiceNumber" type="text" placeholder="Ej: 004589"
              class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Notas (opcional)</label>
            <input v-model="notes" type="text" placeholder="Ej: Re-compra en Mayorista"
              class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-200 bg-slate-50/60 rounded-b-2xl">
          <button @click="handleClose" class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            Cancelar
          </button>
          <button @click="submit" :disabled="!canSubmit || submitting"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm">
            <Loader2 v-if="submitting" class="w-4 h-4 animate-spin" />
            <PackagePlus v-else class="w-4 h-4" />
            {{ submitting ? 'Registrando...' : 'Reponer Stock' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { X, Package, Loader2, PackagePlus, TrendingUp, Wallet, AlertTriangle } from 'lucide-vue-next';
import { fetchApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';
import { useCajaStore } from '@/stores/caja';

type PaymentSource = 'CASH_DRAWER' | 'BANK_TRANSFER' | 'OWNER_POCKET' | 'SUPPLIER_CREDIT';

interface SupplierOption {
  id: string;
  name: string;
}

export interface RestockProduct {
  id: string;
  name: string;
  sku: string;
  image?: string | null;
  current_stock: number;
}

const props = defineProps<{
  visible: boolean;
  product: RestockProduct | null;
}>();

const emit = defineEmits<{
  close: [];
  success: [payload: { productId: string; newStock: number; quantity: number }];
}>();

const { success, error: notifyError } = useNotify();
const cajaStore = useCajaStore();

const quantityInput = ref<HTMLInputElement | null>(null);
const quantity = ref<number | null>(null);
const notes = ref('');
const submitting = ref(false);
const loadingPrice = ref(false);

const previousCost = ref(0);
const previousPrice = ref(0);
const newCost = ref<number | null>(null);
const updateSellingPrice = ref(true);
const newSellingPrice = ref<number | null>(null);
const priceManuallyEdited = ref(false);

// ── Financiamiento ──
const paymentSourceOptions: { value: PaymentSource; label: string; emoji: string }[] = [
  { value: 'CASH_DRAWER', label: 'Gavetero / Caja Activa', emoji: '💵' },
  { value: 'BANK_TRANSFER', label: 'Banco / Transferencia', emoji: '🏛️' },
  { value: 'OWNER_POCKET', label: 'Bolsillo del Dueño', emoji: '👤' },
  { value: 'SUPPLIER_CREDIT', label: 'Crédito Proveedor', emoji: '📝' },
];

const paymentSource = ref<PaymentSource>('CASH_DRAWER');
const invoiceNumber = ref('');
const exchangeRate = ref<number | null>(null);
const expectedCashUsd = ref<number | null>(null);
const loadingBalance = ref(false);
const suppliers = ref<SupplierOption[]>([]);
const loadingSuppliers = ref(false);
const supplierId = ref('');

const turnoActivo = computed(() => cajaStore.turnoActivo);

const habitualMarginPct = computed(() => (
  previousCost.value > 0 ? (previousPrice.value - previousCost.value) / previousCost.value : 0
));

const costIncreased = computed(() => (
  newCost.value != null && previousCost.value > 0 && newCost.value > previousCost.value
));

const suggestedPrice = computed(() => {
  if (newCost.value == null) return previousPrice.value;
  return Math.round(newCost.value * (1 + habitualMarginPct.value) * 100) / 100;
});

// Margin the merchant would be left with if the sale price stays unchanged
const marginIfPriceUnchanged = computed(() => {
  if (newCost.value == null || newCost.value <= 0) return null;
  return (previousPrice.value - newCost.value) / newCost.value;
});

const showMarginAlert = computed(() => (
  costIncreased.value &&
  marginIfPriceUnchanged.value != null &&
  marginIfPriceUnchanged.value < habitualMarginPct.value
));

watch(showMarginAlert, (isShown) => {
  if (isShown && !priceManuallyEdited.value) {
    updateSellingPrice.value = true;
    newSellingPrice.value = suggestedPrice.value;
  }
});

watch(suggestedPrice, (v) => {
  if (showMarginAlert.value && updateSellingPrice.value && !priceManuallyEdited.value) {
    newSellingPrice.value = v;
  }
});

const totalAmount = computed(() => {
  const qty = quantity.value ?? 0;
  const cost = newCost.value ?? previousCost.value ?? 0;
  return Math.round(qty * cost * 100) / 100;
});

const totalAmountVes = computed(() => (
  exchangeRate.value != null ? Math.round(totalAmount.value * exchangeRate.value * 100) / 100 : null
));

const insufficientBalance = computed(() => (
  paymentSource.value === 'CASH_DRAWER' &&
  expectedCashUsd.value != null &&
  totalAmount.value > expectedCashUsd.value
));

const canSubmit = computed(() => {
  if (!props.product || !quantity.value || quantity.value <= 0) return false;
  if (paymentSource.value === 'SUPPLIER_CREDIT' && !supplierId.value) return false;
  return true;
});

function formatQty(val: number | string | undefined | null): string {
  if (val == null) return '0,00';
  const n = Number(val);
  if (isNaN(n)) return '0,00';
  return n.toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function resetForm() {
  quantity.value = null;
  notes.value = '';
  previousCost.value = 0;
  previousPrice.value = 0;
  newCost.value = null;
  newSellingPrice.value = null;
  updateSellingPrice.value = true;
  priceManuallyEdited.value = false;
  paymentSource.value = 'CASH_DRAWER';
  invoiceNumber.value = '';
  supplierId.value = '';
  expectedCashUsd.value = null;
}

async function loadCurrentPrice(productId: string) {
  loadingPrice.value = true;
  try {
    const res = await fetchApi<any>(`/api/v1/products/${productId}/`);
    const defaultPres = (res?.presentations || []).find((p: any) => p.is_default) || res?.presentations?.[0];
    const anchor = defaultPres?.prices?.find((pr: any) => pr.is_anchor);
    previousCost.value = Number(anchor?.cost ?? 0);
    previousPrice.value = Number(anchor?.retail_price ?? 0);
    newCost.value = previousCost.value || null;
  } catch {
    previousCost.value = 0;
    previousPrice.value = 0;
  } finally {
    loadingPrice.value = false;
  }
}

async function loadExchangeRate() {
  try {
    const res = await fetchApi<any>('/api/v1/forex/bcv-rate/');
    exchangeRate.value = res?.rate ? Number(res.rate) : null;
  } catch {
    exchangeRate.value = null;
  }
}

async function loadCashDrawerContext() {
  loadingBalance.value = true;
  try {
    if (!cajaStore.turnoActivo) {
      await cajaStore.verificarTurnoActivo();
    }
    if (cajaStore.turnoActivo?.id) {
      const res = await fetchApi<any>(`/api/shifts/${cajaStore.turnoActivo.id}/expected-balance/`);
      expectedCashUsd.value = Number(res?.breakdown?.CASH_USD?.usd ?? res?.total?.usd ?? 0);
    } else {
      expectedCashUsd.value = null;
    }
  } catch {
    expectedCashUsd.value = null;
  } finally {
    loadingBalance.value = false;
  }
}

async function loadSuppliers() {
  if (suppliers.value.length > 0 || loadingSuppliers.value) return;
  loadingSuppliers.value = true;
  try {
    const res = await fetchApi<any>('/api/v1/purchases/suppliers/?page_size=200');
    const items = Array.isArray(res?.results) ? res.results : (Array.isArray(res) ? res : []);
    suppliers.value = items.map((s: any) => ({ id: s.id, name: s.name }));
  } catch {
    suppliers.value = [];
  } finally {
    loadingSuppliers.value = false;
  }
}

watch(paymentSource, (v) => {
  if (v === 'CASH_DRAWER') loadCashDrawerContext();
  else if (v === 'SUPPLIER_CREDIT') loadSuppliers();
});

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

function buildSuccessMessage(res: any, qtyLabel: string, productName: string): string {
  const base = `+${qtyLabel} unidades agregadas`;
  const financial = res?.financial;
  if (!financial) return `${base} a ${productName}`;

  const amount = Number(financial.amount_usd ?? res?.total_amount_usd ?? 0).toFixed(2);
  switch (financial.type) {
    case 'CASH_DRAWER_OUTFLOW': {
      const label = cajaStore.turnoActivo?.register_name || `#${financial.shift_id}`;
      return `${base}. Egreso de $${amount} registrado en Caja ${label}`;
    }
    case 'ACCOUNTS_PAYABLE': {
      const total = Number(financial.total_amount ?? amount).toFixed(2);
      return `${base}. Cuenta por pagar de $${total} registrada a ${financial.provider}`;
    }
    case 'OWNER_CAPITAL_CONTRIBUTION':
      return `${base}. Aporte de capital de $${amount} registrado (bolsillo del dueño)`;
    case 'BANK_TRANSFER':
      return `${base}. Egreso bancario de $${amount} registrado`;
    default:
      return `${base} a ${productName}`;
  }
}

async function submit() {
  if (!canSubmit.value || !props.product || submitting.value) return;
  submitting.value = true;
  try {
    const payload: Record<string, any> = {
      product_id: props.product.id,
      quantity: quantity.value,
      payment_source: paymentSource.value,
    };
    if (newCost.value != null && newCost.value !== previousCost.value) {
      payload.unit_cost_usd = newCost.value;
    }
    if (updateSellingPrice.value && newSellingPrice.value != null && showMarginAlert.value) {
      payload.update_selling_price = true;
      payload.new_selling_price_usd = newSellingPrice.value;
    }
    if (notes.value.trim()) payload.notes = notes.value.trim();
    if (invoiceNumber.value.trim()) payload.invoice_number = invoiceNumber.value.trim();
    if (paymentSource.value === 'CASH_DRAWER' && cajaStore.turnoActivo?.id) {
      payload.cash_drawer_id = cajaStore.turnoActivo.id;
    }
    if (paymentSource.value === 'SUPPLIER_CREDIT' && supplierId.value) {
      payload.supplier_id = supplierId.value;
    }

    const res = await fetchApi<any>('/api/v1/inventory/quick-restock/', {
      method: 'POST',
      data: payload,
    });

    const qty = quantity.value as number;
    const newStock = Number(res?.stock?.new_stock ?? (props.product.current_stock + qty));
    const qtyLabel = Number.isInteger(qty) ? String(qty) : qty.toFixed(2);

    success(buildSuccessMessage(res, qtyLabel, props.product.name));
    emit('success', { productId: props.product.id, newStock, quantity: qty });
    emit('close');
  } catch (e: any) {
    notifyError(extractErrorMessage(e));
  } finally {
    submitting.value = false;
  }
}

function handleClose() {
  if (submitting.value) return;
  emit('close');
}

watch(() => props.visible, (v) => {
  if (v && props.product) {
    resetForm();
    loadCurrentPrice(props.product.id);
    loadExchangeRate();
    loadCashDrawerContext();
    nextTick(() => quantityInput.value?.focus());
  }
});
</script>
