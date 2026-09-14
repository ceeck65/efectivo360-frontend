<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Header -->
    <header class="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center gap-3">
      <button @click="goBack" class="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600">
        <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.7 5.3a1 1 0 0 1 0 1.4L9.42 10l3.3 3.3a1 1 0 1 1-1.42 1.4l-4-4a1 1 0 0 1 0-1.4l4-4a1 1 0 0 1 1.42 0Z" clip-rule="evenodd"/></svg>
      </button>
      <div class="min-w-0">
        <h1 class="text-base font-semibold text-slate-800 truncate">Recepción de Compra</h1>
        <p class="text-[11px] text-slate-400">Ingreso por empaques mayoristas — el stock entra en unidad base</p>
      </div>
    </header>

    <div class="max-w-4xl mx-auto px-4 sm:px-6 py-5 space-y-5">
      <!-- ── Datos de la factura ── -->
      <section class="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Proveedor</label>
          <select v-model="supplierId"
            class="w-full h-9 px-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option value="">{{ loadingSuppliers ? 'Cargando…' : 'Sin proveedor / Genérico' }}</option>
            <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">
            {{ invoiceRequired ? 'N° Factura *' : 'N° Nota (opcional)' }}
          </label>
          <input v-model.trim="invoiceNumber" type="text" placeholder="FACT-0000"
            class="w-full h-9 px-2.5 text-sm border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            :class="invoiceTouched && invoiceRequired && !invoiceNumber ? 'border-rose-400' : 'border-slate-300'"
            @blur="invoiceTouched = true" />
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Origen de fondos</label>
          <select v-model="paymentSource"
            class="w-full h-9 px-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option v-for="p in PAYMENT_SOURCES" :key="p.value" :value="p.value">{{ p.label }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Moneda de la factura</label>
          <div class="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            <button type="button" @click="currency = 'USD'"
              class="flex-1 h-8 text-xs font-semibold rounded-md transition-colors"
              :class="currency === 'USD' ? 'bg-blue-600 text-white' : 'text-slate-500'">$ USD</button>
            <button type="button" @click="currency = 'VES'"
              class="flex-1 h-8 text-xs font-semibold rounded-md transition-colors"
              :class="currency === 'VES' ? 'bg-blue-600 text-white' : 'text-slate-500'">Bs. VES</button>
          </div>
        </div>
        <p v-if="currency === 'VES'" class="sm:col-span-2 lg:col-span-4 text-[11px] text-slate-400">
          Tasa BCV: {{ exchangeRate ? `Bs. ${exchangeRate} / $` : 'no disponible' }}
        </p>
      </section>

      <!-- ── Buscador de productos ── -->
      <section class="bg-white border border-slate-200 rounded-xl p-4">
        <label class="block text-xs font-medium text-slate-600 mb-1">Agregar producto</label>
        <div class="relative" ref="searchRef">
          <input v-model="query" @input="onSearch" @focus="searchOpen = true" type="text"
            placeholder="Nombre o código de barras…"
            class="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
          <div v-if="searchOpen && (results.length || searching || notFound)"
            class="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            <p v-if="searching" class="px-3 py-2 text-sm text-slate-400">Buscando…</p>
            <p v-else-if="notFound" class="px-3 py-2 text-sm text-rose-500">Sin resultados en tu catálogo.</p>
            <button v-for="r in results" :key="r.product_id || r.sku"
              @click="addLine(r)"
              :disabled="!r.product_id"
              class="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
              <span class="flex-1 min-w-0">
                <span class="block truncate font-medium text-slate-800">{{ r.name }}</span>
                <span class="block text-[11px] text-slate-400 font-mono">
                  {{ r.barcode || `SKU: ${r.sku}` }}
                  <span v-if="!r.product_id"> · solo Banco Global (impórtalo primero)</span>
                  <span v-else> · Stock {{ fmtQty(r.stock) }}</span>
                </span>
              </span>
              <span class="text-blue-600 text-xs font-semibold shrink-0">Agregar</span>
            </button>
          </div>
        </div>
      </section>

      <!-- ── Renglones ── -->
      <section v-if="lines.length" class="space-y-3">
        <div v-for="(line, i) in lines" :key="line.key"
          class="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-sm font-semibold text-slate-800 truncate">{{ line.name }}</p>
              <p class="text-[11px] text-slate-400 font-mono">{{ line.sku }}</p>
            </div>
            <button @click="lines.splice(i, 1)" class="p-1 text-slate-400 hover:text-rose-500 shrink-0">
              <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 0 0-.89.55L7.38 4H4a1 1 0 0 0 0 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6a1 1 0 1 0 0-2h-3.38l-.73-1.45A1 1 0 0 0 11 2H9Zm-1 6a1 1 0 0 1 2 0v6a1 1 0 1 1-2 0V8Zm5-1a1 1 0 0 0-1 1v6a1 1 0 1 0 2 0V8a1 1 0 0 0-1-1Z" clip-rule="evenodd"/></svg>
            </button>
          </div>

          <div v-if="line.loadingOptions" class="text-xs text-slate-400">Cargando empaques…</div>
          <template v-else>
            <div class="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-3">
              <PosPackagingSelector
                v-model="line.code"
                v-model:quantity="line.quantity"
                :options="line.options"
                :base-unit="line.baseUnit"
                channel="WHOLESALE"
                label="Empaque mayorista"
                @change="(p) => onLineChange(line, p)"
              />
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">
                  Costo por {{ (line.selectedLabel || 'empaque').toLowerCase() }} ({{ currency === 'VES' ? 'Bs.' : '$' }})
                </label>
                <input v-model.number="line.unit_price" type="number" min="0" step="0.01" placeholder="0.00"
                  class="w-full h-10 px-2.5 text-sm text-right font-semibold border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
            </div>
            <div class="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
              <span>+{{ fmtQty(line.baseQuantity) }} {{ line.baseUnit }} al Kardex</span>
              <span class="font-semibold text-slate-700">Subtotal: ${{ lineTotalUsd(line).toFixed(2) }}</span>
            </div>
          </template>
        </div>
      </section>
      <p v-else class="text-center text-sm text-slate-400 py-8">
        Busca un producto para empezar la recepción.
      </p>

      <!-- ── Error ── -->
      <p v-if="errorMsg" class="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
        {{ errorMsg }}
      </p>
    </div>

    <!-- ── Footer fijo ── -->
    <footer class="sticky bottom-0 bg-white border-t border-slate-200 px-4 sm:px-6 py-3">
      <div class="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div class="flex items-center gap-4 text-xs text-slate-500">
          <span>Ítems <strong class="text-slate-700">{{ lines.length }}</strong></span>
          <span>Unidades base <strong class="text-emerald-600">+{{ fmtQty(totalBaseUnits) }}</strong></span>
          <span class="text-sm">Total <strong class="text-slate-900">${{ grandTotalUsd.toFixed(2) }}</strong>
            <span v-if="currency === 'VES' && exchangeRate" class="text-slate-400 text-xs">
              · Bs. {{ (grandTotalUsd * exchangeRate).toFixed(2) }}
            </span>
          </span>
        </div>
        <button @click="submit" :disabled="!canSubmit || submitting"
          class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <span v-if="submitting" class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
          {{ submitting ? 'Procesando…' : 'Procesar Factura e Ingresar a Inventario' }}
        </button>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
/**
 * PurchaseEntryView — recepción de compra por empaques del catálogo.
 *
 * Envía al backend la estructura unificada
 *   items: [{ product_id, packaging_config_id, quantity, unit_price }]
 * a POST /api/v1/purchases/express-entry/. El backend resuelve el factor
 * efectivo (ProductPackagingConfig) y escribe el Kardex en unidad base.
 * Nada de factores ni nombres de empaque hardcoded en este archivo.
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { fetchApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';
import { useForexRate } from '@/composables/useForexRate';
import PosPackagingSelector from '@/components/inventory/PosPackagingSelector.vue';
import type { ProductPackagingOption } from '@/composables/usePackagingOptions';

const router = useRouter();
const { success, error: notifyError } = useNotify();
const { rateValue } = useForexRate();

const PAYMENT_SOURCES = [
  { value: 'CASH_DRAWER', label: '💵 Gavetero / Caja' },
  { value: 'CAPITAL_INJECTION', label: '🤝 Aporte de Socio' },
  { value: 'SUPPLIER_CREDIT', label: '📝 Crédito Proveedor' },
  { value: 'CONSIGNMENT', label: '📦 Consignación' },
] as const;

// ── Cabecera ──
interface SupplierOption { id: string; name: string; rif: string }
const suppliers = ref<SupplierOption[]>([]);
const loadingSuppliers = ref(false);
const supplierId = ref('');
const invoiceNumber = ref('');
const invoiceTouched = ref(false);
const paymentSource = ref<string>('CAPITAL_INJECTION');
const currency = ref<'USD' | 'VES'>('USD');
const exchangeRate = computed(() => (rateValue.value > 0 ? Number(rateValue.value.toFixed(2)) : 0));
const invoiceRequired = computed(() => paymentSource.value !== 'CONSIGNMENT');

// ── Buscador ──
interface LookupHit {
  product_id: string | null;
  global_product_id: string | null;
  name: string;
  sku: string;
  barcode: string;
  stock: number;
}
const query = ref('');
const results = ref<LookupHit[]>([]);
const searching = ref(false);
const notFound = ref(false);
const searchOpen = ref(false);
const searchRef = ref<HTMLElement | null>(null);
let searchTimer: ReturnType<typeof setTimeout> | null = null;

// ── Renglones ──
interface Line {
  key: number;
  product_id: string;
  name: string;
  sku: string;
  options: ProductPackagingOption[];
  baseUnit: string;
  loadingOptions: boolean;
  code: string | null;
  quantity: number;
  unit_price: number | null;
  packaging_config_id: string | null;
  baseQuantity: number;
  selectedLabel: string;
}
const lines = ref<Line[]>([]);
let lineSeq = 0;

const submitting = ref(false);
const errorMsg = ref('');

// ── Data loading ──
async function loadSuppliers() {
  loadingSuppliers.value = true;
  try {
    const res = await fetchApi<any>('/api/v1/purchases/suppliers/?page_size=200');
    const items = Array.isArray(res?.results) ? res.results : (Array.isArray(res) ? res : []);
    suppliers.value = items.map((s: any) => ({ id: s.id, name: s.name, rif: s.rif || '' }));
  } catch {
    suppliers.value = [];
  } finally {
    loadingSuppliers.value = false;
  }
}

function onSearch() {
  notFound.value = false;
  if (searchTimer) clearTimeout(searchTimer);
  const term = query.value.trim();
  if (!term) { results.value = []; return; }
  searchTimer = setTimeout(async () => {
    searching.value = true;
    try {
      const res = await fetchApi<any>('/api/v1/catalog/lookup/', { params: { q: term } });
      const items = Array.isArray(res?.results) ? res.results : [];
      results.value = items.map((r: any): LookupHit => ({
        product_id: r.product_id ?? null,
        global_product_id: r.global_product_id ?? null,
        name: r.name,
        sku: r.sku,
        barcode: r.barcode || '',
        stock: Number(r.current_stock ?? r.stock ?? 0),
      }));
      notFound.value = results.value.length === 0;
    } catch {
      results.value = [];
      notFound.value = true;
    } finally {
      searching.value = false;
    }
  }, 300);
}

async function addLine(hit: LookupHit) {
  if (!hit.product_id) return;
  query.value = '';
  results.value = [];
  searchOpen.value = false;

  const line: Line = {
    key: ++lineSeq,
    product_id: hit.product_id,
    name: hit.name,
    sku: hit.barcode || hit.sku,
    options: [],
    baseUnit: 'UND',
    loadingOptions: true,
    code: null,
    quantity: 1,
    unit_price: null,
    packaging_config_id: null,
    baseQuantity: 0,
    selectedLabel: '',
  };
  lines.value.push(line);

  try {
    const res = await fetchApi<any>(`/api/v1/products/${hit.product_id}/packaging-options/`);
    // Solo empaques mayoristas para esta vista (Bulto, Saco, Cesta, Contenedor…).
    line.options = (res.options ?? []).filter((o: ProductPackagingOption) => o.allow_wholesale);
    if (!line.options.length) line.options = res.options ?? [];
    line.baseUnit = res.base_unit || 'UND';
  } catch {
    notifyError('No se pudieron cargar los empaques del producto.');
  } finally {
    line.loadingOptions = false;
  }
}

function onLineChange(line: Line, p: {
  option: ProductPackagingOption | null;
  packagingConfigId: string | null;
  quantity: number;
  baseQuantity: number;
}) {
  line.packaging_config_id = p.packagingConfigId;
  line.baseQuantity = p.baseQuantity;
  line.selectedLabel = p.option?.label ?? '';
}

// ── Cálculos ──
function toUsd(nativeAmount: number): number {
  if (currency.value !== 'VES') return nativeAmount;
  return exchangeRate.value > 0 ? nativeAmount / exchangeRate.value : 0;
}
function lineTotalUsd(line: Line): number {
  return toUsd((line.unit_price || 0) * (line.quantity || 0));
}
const totalBaseUnits = computed(() => lines.value.reduce((s, l) => s + (l.baseQuantity || 0), 0));
const grandTotalUsd = computed(() => lines.value.reduce((s, l) => s + lineTotalUsd(l), 0));

const canSubmit = computed(() => {
  if (!lines.value.length) return false;
  if (invoiceRequired.value && !invoiceNumber.value.trim()) return false;
  if (['SUPPLIER_CREDIT', 'CONSIGNMENT'].includes(paymentSource.value) && !supplierId.value) return false;
  if (currency.value === 'VES' && !exchangeRate.value) return false;
  return lines.value.every((l) => l.code && (l.quantity || 0) > 0 && (l.unit_price || 0) > 0);
});

// ── Envío ──
async function submit() {
  invoiceTouched.value = true;
  if (!canSubmit.value) {
    errorMsg.value = 'Completa proveedor / factura / precios antes de procesar.';
    return;
  }
  errorMsg.value = '';
  submitting.value = true;
  try {
    const payload = {
      supplier_id: supplierId.value || null,
      invoice_number: invoiceNumber.value.trim() || null,
      payment_source: paymentSource.value,
      currency: currency.value,
      exchange_rate: currency.value === 'VES' ? exchangeRate.value : null,
      items: lines.value.map((l) => ({
        product_id: l.product_id,
        packaging_config_id: l.packaging_config_id,   // null → el backend usa unidad base
        quantity: l.quantity,                          // nº de empaques
        unit_price: l.unit_price,                      // costo por empaque
      })),
    };
    const res = await fetchApi<any>('/api/v1/purchases/express-entry/', { method: 'POST', data: payload });
    success(`Factura procesada. +${totalBaseUnits.value.toLocaleString('es-VE')} unidades al inventario.`);
    router.push('/admin/inventory');
    return res;
  } catch (e: any) {
    errorMsg.value = e?.data ? JSON.stringify(e.data) : (e?.message || 'Error al procesar la factura.');
    notifyError(errorMsg.value);
  } finally {
    submitting.value = false;
  }
}

function goBack() { router.back(); }
function fmtQty(n: number): string {
  return Number((n || 0).toFixed(3)).toLocaleString('es-VE');
}

// ── Click-outside del buscador ──
function onClickOutside(e: MouseEvent) {
  if (searchRef.value && !searchRef.value.contains(e.target as Node)) searchOpen.value = false;
}
onMounted(() => {
  loadSuppliers();
  document.addEventListener('click', onClickOutside);
});
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside));
</script>
