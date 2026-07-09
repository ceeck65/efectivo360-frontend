<template>
  <div class="max-w-4xl mx-auto space-y-6 p-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-slate-800">Nuevo Producto Multi-Moneda</h2>
        <p class="text-xs text-slate-500 mt-0.5">
          Registro con matriz dinámica de presentaciones y precios
        </p>
      </div>
    </div>

    <!-- ─── Exchange Rate Banner ─── -->
    <div class="flex items-center gap-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
      <div class="flex-1">
        <label class="block text-[10px] font-semibold text-amber-700 uppercase tracking-wider mb-1">
          Tasa de Cambio ({{ baseCurrency }} → {{ localCurrency }})
        </label>
        <input
          v-model.number="exchangeRate"
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          class="w-full max-w-xs h-9 px-3 text-sm border border-amber-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
        />
      </div>
      <div class="text-right">
        <p class="text-[10px] text-amber-600">Moneda Base</p>
        <p class="text-sm font-bold text-amber-800">{{ baseCurrency }}</p>
      </div>
    </div>

    <!-- ─── Master Product Fields ─── -->
    <div class="bg-white border border-slate-200 shadow-sm rounded-xl p-6 space-y-4">
      <h3 class="text-xs font-semibold text-slate-600 uppercase tracking-wider">Datos del Producto</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="sm:col-span-2">
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Nombre *</label>
          <input v-model="form.name" type="text" placeholder="Ej. Leche Pasteurizada 1L"
            class="w-full h-10 px-3.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">SKU *</label>
          <input v-model="form.sku" type="text" placeholder="Ej. LEC-001"
            class="w-full h-10 px-3.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Código de Barras</label>
          <input v-model="form.barcode" type="text" placeholder="EAN-13"
            class="w-full h-10 px-3.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Marca</label>
          <select v-model="form.brand_id"
            class="w-full h-10 px-3.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
            <option :value="null">Seleccionar...</option>
            <option v-for="b in brands" :key="b.id" :value="b.id">{{ b.name }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Categoría *</label>
          <select v-model="form.category_id"
            class="w-full h-10 px-3.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
            <option :value="null">Seleccionar...</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div class="sm:col-span-2">
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Descripción</label>
          <textarea v-model="form.description" rows="2" placeholder="Descripción opcional"
            class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div class="sm:col-span-2">
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Imagen</label>
          <input type="file" accept="image/*" @change="onImageSelect"
            class="w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
        </div>
      </div>
    </div>

    <!-- ─── Presentations + Prices Matrix ─── -->
    <div class="bg-white border border-slate-200 shadow-sm rounded-xl p-6 space-y-6">
      <div class="flex items-center justify-between">
        <h3 class="text-xs font-semibold text-slate-600 uppercase tracking-wider">
          Presentaciones y Precios
        </h3>
        <button @click="addPresentation" type="button"
          class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors">
          + Agregar Presentación
        </button>
      </div>

      <div v-for="(pres, pIdx) in presentations" :key="pIdx"
        class="border border-slate-200 rounded-xl p-4 space-y-4">

        <!-- Presentation header -->
        <div class="flex items-center justify-between">
          <span class="text-sm font-semibold text-slate-700">Presentación {{ pIdx + 1 }}</span>
          <button @click="removePresentation(pIdx)" type="button"
            class="text-xs text-red-500 hover:text-red-700 transition-colors"
            :disabled="presentations.length <= 1">
            Eliminar
          </button>
        </div>

        <!-- Presentation fields -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label class="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Nombre *</label>
            <input v-model="pres.name" type="text" placeholder="Unidad"
              class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label class="block text-[10px] font-semibold text-slate-500 uppercase mb-1">SKU</label>
            <input v-model="pres.sku" type="text" placeholder="LEC-001-UN"
              class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label class="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Uds. por Paquete</label>
            <input v-model.number="pres.units_per_package" type="number" min="1" step="1" placeholder="1"
              class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label class="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Código Barras</label>
            <input v-model="pres.barcode" type="text" placeholder="EAN-13"
              class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>

        <!-- Default toggle -->
        <label class="inline-flex items-center gap-2 cursor-pointer">
          <input type="checkbox" v-model="pres.is_default" class="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
          <span class="text-xs text-slate-600">Presentación por defecto</span>
        </label>

        <!-- Prices grid -->
        <div class="bg-slate-50 rounded-xl p-3 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Precios por Moneda</span>
            <button @click="addPrice(pIdx)" type="button"
              class="text-[10px] font-medium text-blue-600 hover:text-blue-800 transition-colors">
              + Agregar moneda
            </button>
          </div>

          <div v-for="(price, prIdx) in pres.prices" :key="prIdx"
            class="grid grid-cols-5 gap-2 items-end">

            <div>
              <label class="block text-[9px] font-semibold text-slate-400 uppercase mb-0.5">Moneda</label>
              <select v-model="price.currency_code"
                class="w-full h-8 px-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option v-for="c in activeCurrencies" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>
            <div>
              <label class="block text-[9px] font-semibold text-slate-400 uppercase mb-0.5">
                Costo
                <span v-if="price.currency_code !== baseCurrency && exchangeRate > 0" class="text-amber-500">
                  ({{ computeAnchor(pIdx, prIdx, 'cost') }} {{ baseCurrency }})
                </span>
              </label>
              <input v-model.number="price.cost_price" type="number" min="0" step="0.01" placeholder="0.00"
                @input="onPriceInput(pIdx, prIdx, 'cost')"
                class="w-full h-8 px-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label class="block text-[9px] font-semibold text-slate-400 uppercase mb-0.5">
                Precio Base
                <span v-if="price.currency_code !== baseCurrency && exchangeRate > 0" class="text-amber-500">
                  ({{ computeAnchor(pIdx, prIdx, 'base') }} {{ baseCurrency }})
                </span>
              </label>
              <input v-model.number="price.base_price" type="number" min="0" step="0.01" placeholder="0.00"
                @input="onPriceInput(pIdx, prIdx, 'base')"
                class="w-full h-8 px-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label class="block text-[9px] font-semibold text-slate-400 uppercase mb-0.5">Margen %</label>
              <div class="relative">
                <input v-model.number="price.profit_margin" type="number" min="0" max="100" step="0.5" placeholder="30"
                  class="w-full h-8 pr-5 pl-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                <span class="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">%</span>
              </div>
            </div>
            <div class="flex items-end pb-1">
              <button @click="removePrice(pIdx, prIdx)" type="button"
                class="w-full h-8 text-[10px] text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                :disabled="pres.prices.length <= 1">
                Quitar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── Tenant Config ─── -->
    <div class="bg-white border border-slate-200 shadow-sm rounded-xl p-6 space-y-4">
      <h3 class="text-xs font-semibold text-slate-600 uppercase tracking-wider">Configuración de Tienda</h3>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Tipo de IVA</label>
          <select v-model="form.iva_type"
            class="w-full h-10 px-3.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
            <option value="GENERAL">General 16%</option>
            <option value="REDUCED">Reducido 8%</option>
            <option value="EXEMPT">Exento</option>
            <option value="ADDITIONAL">Adicional</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Tipo de Venta</label>
          <select v-model="form.sale_type"
            class="w-full h-10 px-3.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
            <option value="UNIT">Unidad</option>
            <option value="WEIGHT">Peso</option>
            <option value="LIQUID">Líquido</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Tipo de Inventario</label>
          <select v-model="form.inventory_type"
            class="w-full h-10 px-3.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
            <option value="PHYSICAL">Físico</option>
            <option value="SERVICE">Servicio</option>
            <option value="COMBO">Combo</option>
          </select>
        </div>
      </div>
    </div>

    <!-- ─── Submit ─── -->
    <div class="flex justify-end gap-3">
      <button type="button" @click="$emit('cancel')"
        class="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-300 hover:bg-slate-50 transition-colors">
        Cancelar
      </button>
      <button @click="handleSubmit" :disabled="submitting || !isValid"
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm">
        <svg v-if="submitting" class="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        {{ submitting ? 'Registrando...' : 'Registrar Producto' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';

const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'created', data: Record<string, any>): void;
}>();

const props = withDefaults(defineProps<{
  brands?: { id: string; name: string }[];
  categories?: { id: string; name: string }[];
  baseCurrency?: string;
  localCurrency?: string;
  activeCurrencies?: string[];
}>(), {
  brands: () => [],
  categories: () => [],
  baseCurrency: 'USD',
  localCurrency: 'VES',
  activeCurrencies: () => ['USD', 'VES'],
});

const { fetchApi } = useApi();
const submitting = ref(false);
const exchangeRate = ref(0);
const selectedImage = ref<File | null>(null);

// ── Form ──
const form = reactive({
  name: '',
  sku: '',
  barcode: '',
  description: '',
  brand_id: null as string | null,
  category_id: null as string | null,
  iva_type: 'GENERAL',
  sale_type: 'UNIT',
  inventory_type: 'PHYSICAL',
  is_igtf_applicable: false,
  is_fractionable: false,
  requires_weight: false,
  behavior_type: 'STANDARD',
});

// ── Presentations Matrix ──
interface PriceRow {
  currency_code: string;
  cost_price: number;
  base_price: number;
  profit_margin: number;
}

interface PresentationRow {
  name: string;
  sku: string;
  units_per_package: number;
  barcode: string;
  is_default: boolean;
  prices: PriceRow[];
}

const presentations = reactive<PresentationRow[]>([
  {
    name: 'Unidad',
    sku: '',
    units_per_package: 1,
    barcode: '',
    is_default: true,
    prices: [
      { currency_code: 'USD', cost_price: 0, base_price: 0, profit_margin: 30 },
      { currency_code: 'VES', cost_price: 0, base_price: 0, profit_margin: 30 },
    ],
  },
]);

// ── Computed ──
const isValid = computed(() => {
  return form.name.trim() && form.sku.trim() && form.category_id
    && presentations.every(p => p.name.trim());
});

// ── Methods ──

function addPresentation() {
  presentations.push({
    name: '',
    sku: '',
    units_per_package: 1,
    barcode: '',
    is_default: false,
    prices: [
      { currency_code: 'USD', cost_price: 0, base_price: 0, profit_margin: 30 },
      { currency_code: 'VES', cost_price: 0, base_price: 0, profit_margin: 30 },
    ],
  });
}

function removePresentation(index: number) {
  if (presentations.length > 1) presentations.splice(index, 1);
}

function addPrice(pIdx: number) {
  const used = new Set(presentations[pIdx].prices.map(p => p.currency_code));
  const next = props.activeCurrencies.find(c => !used.has(c));
  if (next) {
    presentations[pIdx].prices.push({
      currency_code: next,
      cost_price: 0,
      base_price: 0,
      profit_margin: 30,
    });
  }
}

function removePrice(pIdx: number, prIdx: number) {
  if (presentations[pIdx].prices.length > 1) {
    presentations[pIdx].prices.splice(prIdx, 1);
  }
}

function computeAnchor(pIdx: number, prIdx: number, field: 'cost' | 'base'): string {
  const price = presentations[pIdx].prices[prIdx];
  if (price.currency_code === props.baseCurrency || !exchangeRate.value) return '—';
  const val = field === 'cost' ? price.cost_price : price.base_price;
  return (val / exchangeRate.value).toFixed(2);
}

function onPriceInput(pIdx: number, prIdx: number, field: 'cost' | 'base') {
  // Trigger reactivity for computed display
}

function onImageSelect(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files?.length) {
    selectedImage.value = target.files[0];
  }
}

async function handleSubmit() {
  if (!isValid.value) return;
  submitting.value = true;

  try {
    const formData = new FormData();

    formData.append('name', form.name);
    formData.append('sku', form.sku);
    formData.append('barcode', form.barcode || '');
    formData.append('description', form.description || '');

    if (form.brand_id) formData.append('brand_id', form.brand_id);
    if (form.category_id) formData.append('category_id', form.category_id);

    formData.append('exchange_rate', String(exchangeRate.value));
    formData.append('tenant_base_currency', props.baseCurrency);

    formData.append('iva_type', form.iva_type);
    formData.append('sale_type', form.sale_type);
    formData.append('inventory_type', form.inventory_type);
    formData.append('behavior_type', form.behavior_type);
    formData.append('is_igtf_applicable', String(form.is_igtf_applicable));
    formData.append('is_fractionable', String(form.is_fractionable));
    formData.append('requires_weight', String(form.requires_weight));

    if (selectedImage.value) {
      formData.append('image', selectedImage.value);
    }

    formData.append('presentations', JSON.stringify(presentations));

    const result = await fetchApi('/api/v1/products/', {
      method: 'POST',
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    emit('created', result as Record<string, any>);
  } catch (err: any) {
    console.error('Product creation failed:', err);
    alert(err?.message || 'Error al crear el producto');
  } finally {
    submitting.value = false;
  }
}
</script>
