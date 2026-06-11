<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <!-- Loading edit -->
    <div v-if="loadingEdit" class="flex items-center justify-center py-20">
      <Loader2 class="w-5 h-5 animate-spin text-slate-400" />
      <span class="ml-2 text-sm text-slate-400">Cargando producto...</span>
    </div>

    <template v-else>
      <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-slate-800">
          {{ isEditing ? 'Editar Producto' : 'Nuevo Producto' }}
        </h2>
        <p class="text-xs text-slate-500 mt-0.5">
          {{ isEditing ? 'Modifica los datos del producto' : 'Registra un nuevo producto en el catálogo' }}
        </p>
      </div>
      <button @click="resetForm" type="button" class="text-xs text-slate-400 hover:text-slate-600 transition-colors">
        Limpiar
      </button>
    </div>

    <!-- Tabs -->
    <div class="border-b border-slate-200">
      <nav class="flex gap-6">
        <button
          v-for="t in tabs"
          :key="t.key"
          @click="activeTab = t.key"
          class="pb-3 text-sm font-medium border-b-2 transition-colors"
          :class="activeTab === t.key
            ? 'border-blue-600 text-blue-700'
            : 'border-transparent text-slate-500 hover:text-slate-700'"
        >
          {{ t.label }}
        </button>
      </nav>
    </div>

    <!-- Banner informativo para tiendas -->
    <div v-if="!isStaff"
      class="rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-3 text-xs leading-relaxed text-blue-800">
      <p>
        <span class="font-semibold">🔒 Atributos globales verificados por Efectivo 360.</span>
        Los campos de identidad del producto (Nombre, SKU, código de barras, marca y categoría)
        están protegidos para mantener la estandarización del catálogo.
        Si requieres un cambio en los datos maestros, solicita una revisión al equipo de soporte.
      </p>
    </div>

    <!-- Tab: Datos Generales -->
    <div v-show="activeTab === 'general'" class="bg-white border border-slate-200 shadow-sm rounded-xl p-6 space-y-5">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Nombre -->
        <div class="sm:col-span-2">
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">
            Nombre <span class="text-red-400">*</span>
            <span v-if="!isStaff" class="ml-1.5 text-[10px] font-normal text-slate-400">(Solo lectura)</span>
          </label>
          <div class="relative">
            <input
              v-model="form.name"
              type="text"
              placeholder="Ej. Leche Pasteurizada 1L"
              :disabled="!isStaff"
              class="w-full h-10 px-3.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 transition-shadow
                disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:border-slate-200
                focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            <span v-if="!isStaff" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300">
              <Lock class="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        <!-- SKU -->
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">
            SKU <span class="text-red-400">*</span>
            <span v-if="!isStaff" class="ml-1.5 text-[10px] font-normal text-slate-400">(Solo lectura)</span>
          </label>
          <div class="relative">
            <input
              v-model="form.sku"
              type="text"
              placeholder="Ej. LEC-001"
              :disabled="!isStaff"
              class="w-full h-10 px-3.5 pr-8 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 transition-shadow
                disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:border-slate-200
                focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            <span v-if="!isStaff" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300">
              <Lock class="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        <!-- Código de barras -->
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">
            Código de barras
            <span v-if="!isStaff" class="ml-1.5 text-[10px] font-normal text-slate-400">(Solo lectura)</span>
          </label>
          <div class="relative">
            <input
              v-model="form.barcode"
              type="text"
              placeholder="Opcional"
              :disabled="!isStaff"
              class="w-full h-10 px-3.5 pr-8 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 transition-shadow
                disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:border-slate-200
                focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            <span v-if="!isStaff" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300">
              <Lock class="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        <!-- Marca -->
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">
            Marca
            <span v-if="!isStaff" class="ml-1.5 text-[10px] font-normal text-slate-400">(Solo lectura)</span>
          </label>
          <div class="relative">
            <select
              v-model="form.brand"
              :disabled="!isStaff"
              class="w-full h-10 pl-3.5 pr-8 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 transition-shadow
                disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:border-slate-200
                focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option :value="null">Seleccionar...</option>
              <option v-for="b in brands" :key="b.id" :value="b.id">{{ b.name }}</option>
            </select>
            <span v-if="!isStaff" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none">
              <Lock class="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        <!-- Categoría -->
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">
            Categoría
            <span v-if="!isStaff" class="ml-1.5 text-[10px] font-normal text-slate-400">(Solo lectura)</span>
          </label>
          <div class="relative">
            <input
              v-model="form.category"
              type="text"
              placeholder="Ej. LÁCTEOS"
              :disabled="!isStaff"
              class="w-full h-10 px-3.5 pr-8 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 transition-shadow
                disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:border-slate-200
                focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            <span v-if="!isStaff" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300">
              <Lock class="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        <!-- Descripción -->
        <div class="sm:col-span-2">
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">
            Descripción
            <span v-if="!isStaff" class="ml-1.5 text-[10px] font-normal text-slate-400">(Solo lectura)</span>
          </label>
          <textarea
            v-model="form.description"
            rows="3"
            placeholder="Descripción opcional del producto"
            :disabled="!isStaff"
            class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 transition-shadow resize-none
              disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:border-slate-200
              focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>

        <!-- Switch Activo / Inactivo (siempre editable) -->
        <div class="sm:col-span-2 flex items-center gap-3 pt-1">
          <button
            @click="form.is_active = !form.is_active"
            type="button"
            class="relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors"
            :class="form.is_active ? 'bg-emerald-500' : 'bg-slate-300'"
          >
            <span
              class="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform ring-0 transition-transform"
              :class="form.is_active ? 'translate-x-4' : 'translate-x-0.5'"
            />
          </button>
          <span class="text-sm text-slate-700">{{ form.is_active ? 'Activo' : 'Inactivo' }}</span>
        </div>
      </div>
    </div>

    <!-- Tab: Precios y Logística -->
    <div v-show="activeTab === 'prices'" class="bg-white border border-slate-200 shadow-sm rounded-xl p-6 space-y-5">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Unidad de compra -->
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Unidad de compra</label>
          <select
            v-model="form.default_purchase_unit"
            class="w-full h-10 px-3.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
          >
            <option value="UNIT">Unidad</option>
            <option value="BOX">Caja</option>
            <option value="BULK">Bulto</option>
            <option value="SACK">Saco</option>
            <option value="LOT">Lote</option>
            <option value="KG">KG</option>
            <option value="LITER">Litro</option>
          </select>
        </div>

        <!-- Unidades por empaque -->
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Unidades por empaque</label>
          <input
            v-model.number="form.units_per_package"
            type="number"
            min="0"
            step="0.0001"
            placeholder="Ej. 12"
            class="w-full h-10 px-3.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
          />
          <p class="mt-1 text-[10px] text-slate-400">Cantidad de unidades base por empaque de compra</p>
        </div>

        <!-- Precio USD y VES lado a lado -->
        <div class="sm:col-span-2">
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Precios de venta</label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">$</span>
              <input
                v-model.number="form.price_usd"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                class="w-full h-10 pl-8 pr-3.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
              />
            </div>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">Bs.</span>
              <input
                v-model.number="form.price_ves"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                class="w-full h-10 pl-10 pr-3.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
              />
            </div>
          </div>
        </div>

        <!-- Margen de Ganancia -->
        <div class="sm:col-span-2 border-t border-slate-100 pt-5 mt-1">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-xs font-semibold text-slate-700 uppercase tracking-wide">Margen de Ganancia</span>
            <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">EDUCATIVO</span>
          </div>

          <!-- Selector de tipo de margen -->
          <div class="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-3">
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                @click="form.margin_type = 'TRADITIONAL'"
                class="relative flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-medium transition-all"
                :class="form.margin_type === 'TRADITIONAL'
                  ? 'bg-white border-2 border-blue-500 shadow-sm text-blue-700'
                  : 'bg-transparent border-2 border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/60'"
              >
                <span class="text-sm font-bold">Tradicional</span>
                <span class="text-[10px] opacity-80">Suma simple</span>
              </button>
              <button
                type="button"
                @click="form.margin_type = 'FINANCIAL'"
                class="relative flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-medium transition-all"
                :class="form.margin_type === 'FINANCIAL'
                  ? 'bg-white border-2 border-emerald-500 shadow-sm text-emerald-700'
                  : 'bg-transparent border-2 border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/60'"
              >
                <span class="text-sm font-bold">Financiero</span>
                <span class="text-[10px] opacity-80">Protección de margen</span>
              </button>
            </div>
          </div>

          <!-- Porcentaje -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1.5">Margen (%)</label>
              <div class="relative">
                <input
                  v-model.number="form.profit_margin"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  placeholder="30"
                  class="w-full h-10 pr-8 pl-3.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                />
                <span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">%</span>
              </div>
            </div>
            <div class="flex items-end pb-1">
              <div v-if="form.cost_price_usd > 0 && form.profit_margin > 0"
                class="w-full rounded-lg bg-white border border-slate-200 px-3.5 py-2"
              >
                <p class="text-[10px] text-slate-400 uppercase tracking-wide">Precio sugerido</p>
                <p class="text-lg font-bold text-slate-800">
                  ${{ suggestedPrice }}
                  <span v-if="form.margin_type === 'FINANCIAL'"
                    class="text-[10px] font-normal text-emerald-600 ml-1.5">Protegido</span>
                  <span v-else class="text-[10px] font-normal text-amber-600 ml-1.5">Simple</span>
                </p>
              </div>
            </div>
          </div>

          <!-- Bloque educativo interactivo -->
          <div v-if="form.cost_price_usd > 0 && form.profit_margin > 0"
            class="mt-3 rounded-xl border p-4 text-xs leading-relaxed transition-colors"
            :class="form.margin_type === 'FINANCIAL'
              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
              : 'bg-amber-50/60 border-amber-200 text-amber-800'"
          >
            <!-- Fórmula visible -->
            <div class="flex items-start gap-2.5">
              <span class="mt-0.5 text-sm">{{ form.margin_type === 'FINANCIAL' ? '🛡️' : '⚠️' }}</span>
              <div class="space-y-1.5">
                <p class="text-xs font-semibold">
                  {{ form.margin_type === 'FINANCIAL'
                    ? 'Margen sobre Precio de Venta (Protección financiera)'
                    : 'Margen sobre Costo (Suma simple tradicional)' }}
                </p>
                <p class="text-[11px] opacity-90 font-mono">
                  {{ form.margin_type === 'FINANCIAL'
                    ? `Precio = $${form.cost_price_usd} ÷ (1 − ${form.profit_margin}%) = $${suggestedPrice}`
                    : `Precio = $${form.cost_price_usd} × (1 + ${form.profit_margin}%) = $${suggestedPrice}` }}
                </p>
              </div>
            </div>

            <!-- Comparación en vivo -->
            <div class="mt-3 flex flex-col sm:flex-row gap-2">
              <div class="flex-1 rounded-lg bg-white/70 border border-amber-200 px-3 py-2">
                <p class="text-[10px] font-semibold text-amber-700 uppercase">Tradicional</p>
                <p class="text-sm font-bold text-slate-800">${{ computePrice('TRADITIONAL') }}</p>
                <p class="text-[10px] text-slate-500">Con desc. 20%: ${{ applyDiscount('TRADITIONAL') }}</p>
              </div>
              <div class="flex-1 rounded-lg bg-white/70 border border-emerald-200 px-3 py-2">
                <p class="text-[10px] font-semibold text-emerald-700 uppercase">Financiero</p>
                <p class="text-sm font-bold text-slate-800">${{ computePrice('FINANCIAL') }}</p>
                <p class="text-[10px] text-slate-500">Con desc. 20%: ${{ applyDiscount('FINANCIAL') }}</p>
              </div>
            </div>

            <!-- Mensaje educativo -->
            <div class="mt-2.5 text-[11px] leading-relaxed"
              :class="form.margin_type === 'FINANCIAL' ? 'text-emerald-700' : 'text-amber-700'"
            >
              <template v-if="form.margin_type === 'FINANCIAL'">
                Con el método <strong>Financiero</strong>, si aplicas un 20% de descuento
                sobre el precio de ${{ computePrice('FINANCIAL') }}, recibes
                <strong>${{ applyDiscount('FINANCIAL') }}</strong> — justo tu costo de
                ${{ form.cost_price_usd }}. No pierdes dinero.
                El método <strong>Tradicional</strong> te daría ${{ applyDiscount('TRADITIONAL') }}
                <template v-if="Number(applyDiscount('TRADITIONAL')) < Number(form.cost_price_usd)">
                  , por debajo de tu costo.
                </template>
              </template>
              <template v-else>
                Con el método <strong>Tradicional</strong>, si aplicas un 20% de descuento,
                estarías vendiendo a <strong>${{ applyDiscount('TRADITIONAL') }}</strong>
                <template v-if="Number(applyDiscount('TRADITIONAL')) < Number(form.cost_price_usd)">
                  — <span class="text-red-600 font-semibold">por debajo de tu costo de
                  ${{ form.cost_price_usd }}</span>. Con el método
                  <strong>Financiero</strong> recibirías ${{ applyDiscount('FINANCIAL') }},
                  protegiendo tu margen.
                </template>
                <template v-else>
                  , aún sobre tu costo de ${{ form.cost_price_usd }}.
                </template>
              </template>
            </div>
          </div>

          <!-- Estado sin costo -->
          <div v-else class="mt-3 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
            <p class="text-[11px] text-slate-400">
              💡 Define un <strong>costo unitario</strong> y un <strong>margen</strong>
              para ver el precio sugerido y la comparación entre métodos.
            </p>
          </div>
        </div>

        <!-- Tipo de IVA -->
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Tipo de IVA</label>
          <select
            v-model="form.iva_type"
            class="w-full h-10 px-3.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
          >
            <option value="GENERAL">IVA General 16%</option>
            <option value="REDUCED">IVA Reducido 8%</option>
            <option value="AMPLIADO">IVA Ampliado 22%</option>
            <option value="EXENTO">Exento</option>
          </select>
        </div>

        <!-- Método de Inventario -->
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Método de inventario</label>
          <select
            v-model="form.inventory_method"
            class="w-full h-10 px-3.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
          >
            <option value="AVERAGE">📊 Promedio Ponderado</option>
            <option value="FIFO">📦 FIFO — PEPS</option>
            <option value="LIFO">📦 LIFO — UEPS</option>
          </select>
          <p class="mt-1.5 text-[10px] text-slate-400 leading-relaxed">
            <span class="font-medium">FIFO</span> ideal para perecederos (lácteos, carnes).
            <span class="font-medium">LIFO</span> y <span class="font-medium">Promedio</span> para no perecederos.
          </p>
        </div>

        <!-- Cuenta contable -->
        <div class="sm:col-span-2">
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Cuenta contable (Gavetero Inventario)</label>
          <input
            v-model="form.accounting_account_id"
            type="text"
            placeholder="Ej. 1.1.02.01"
            class="w-full h-10 px-3.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
          />
          <p class="mt-1 text-[10px] text-slate-400">Código del plan de cuentas contable (opcional)</p>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-3 pt-1">
      <button
        @click="$emit('cancel')"
        type="button"
        class="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-300 hover:bg-slate-50 transition-colors"
      >
        Cancelar
      </button>
      <button
        @click="handleSave"
        :disabled="!isValid || saving"
        class="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm inline-flex items-center gap-2"
      >
        <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
        <Save v-else class="w-4 h-4" />
        {{ isEditing ? 'Guardar Cambios' : 'Crear Producto' }}
      </button>
    </div> <!-- /actions -->
    </template> <!-- /v-else -->
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { Save, Loader2, Lock } from 'lucide-vue-next';
import { useApi } from '@/composables/useApi';
import { usePermissions } from '@/composables/usePermissions';

const route = useRoute();
const { fetchApi } = useApi();
const { isStaff: isStaffFromStore } = usePermissions();

const emit = defineEmits<{
  save: [payload: Record<string, any>];
  cancel: [];
}>();

const props = defineProps<{
  initialData?: Record<string, any> | null;
  brands?: { id: number | string; name: string }[];
  isStaff?: boolean;
}>();

const isEditing = computed(() => !!props.initialData || !!route.params.id);
const saving = ref(false);
const loadingEdit = ref(false);
const activeTab = ref<'general' | 'prices'>('general');

// isStaff: prop > store > false
const isStaff = computed(() => props.isStaff ?? isStaffFromStore.value);

const tabs: { key: 'general' | 'prices'; label: string }[] = [
  { key: 'general', label: 'Datos Generales' },
  { key: 'prices', label: 'Precios y Logística' },
];

// ── Helpers de cálculo de margen ──
function computePrice(marginType: 'TRADITIONAL' | 'FINANCIAL'): string {
  const cost = Number(form.cost_price_usd);
  const margin = Number(form.profit_margin);
  if (!cost || !margin) return '0.00';
  if (marginType === 'FINANCIAL') {
    const divisor = 1 - margin / 100;
    if (divisor <= 0.01) return '0.00';
    return (cost / divisor).toFixed(2);
  }
  return (cost * (1 + margin / 100)).toFixed(2);
}

function applyDiscount(marginType: 'TRADITIONAL' | 'FINANCIAL'): string {
  const full = Number(computePrice(marginType));
  if (!full) return '0.00';
  return (full * 0.8).toFixed(2);
}

const suggestedPrice = computed(() => computePrice(form.margin_type as 'TRADITIONAL' | 'FINANCIAL'));

// ── Form state ──
const form = reactive({
  name: '',
  sku: '',
  barcode: null as string | null,
  brand: null as number | string | null,
  category: '',
  description: '',
  is_active: true,
  cost_price_usd: 0,
  profit_margin: 30,
  margin_type: 'TRADITIONAL',
  inventory_method: 'AVERAGE',
  default_purchase_unit: 'UNIT',
  units_per_package: 1,
  iva_type: 'GENERAL',
  price_usd: 0,
  price_ves: 0,
  accounting_account_id: '',
});

// ── Computed ──
const isValid = computed(() => form.name.trim().length > 0 && form.sku.trim().length > 0);

// ── Methods ──
function resetForm() {
  const defaults = {
    name: '', sku: '', barcode: null, brand: null, category: '', description: '',
    is_active: true, cost_price_usd: 0, profit_margin: 30, margin_type: 'TRADITIONAL',
    inventory_method: 'AVERAGE', default_purchase_unit: 'UNIT',
    units_per_package: 1, iva_type: 'GENERAL', price_usd: 0, price_ves: 0,
    accounting_account_id: '',
  };
  Object.assign(form, defaults);
}

function applyInitialData(data: Record<string, any>) {
  form.name = data.name ?? '';
  form.sku = data.sku ?? '';
  form.barcode = data.barcode ?? null;
  form.brand = data.brand ?? null;
  form.category = data.category ?? '';
  form.description = data.description ?? '';
  form.is_active = data.is_active ?? true;
  form.cost_price_usd = data.cost_price_usd ?? 0;
  form.profit_margin = data.profit_margin ?? 30;
  form.margin_type = data.margin_type ?? 'TRADITIONAL';
  form.inventory_method = data.inventory_method ?? 'AVERAGE';
  form.default_purchase_unit = data.default_purchase_unit ?? 'UNIT';
  form.units_per_package = data.units_per_package ?? 1;
  form.iva_type = data.iva_type ?? 'GENERAL';
  form.price_usd = data.price_usd ?? 0;
  form.price_ves = data.price_ves ?? 0;
  form.accounting_account_id = data.accounting_account_id ?? '';
}

function handleSave() {
  if (!isValid.value || saving.value) return;
  saving.value = true;

  const payload = {
    name: form.name.trim(),
    sku: form.sku.trim().toUpperCase(),
    barcode: form.barcode?.trim() || null,
    brand: form.brand,
    category: form.category.trim().toUpperCase(),
    description: form.description.trim(),
    is_active: form.is_active,
    cost_price_usd: Number(form.cost_price_usd),
    profit_margin: Number(form.profit_margin),
    margin_type: form.margin_type,
    inventory_method: form.inventory_method,
    default_purchase_unit: form.default_purchase_unit,
    units_per_package: Number(form.units_per_package),
    iva_type: form.iva_type,
    price_usd: Number(form.price_usd),
    price_ves: Number(form.price_ves),
    accounting_account_id: form.accounting_account_id.trim(),
  };

  emit('save', payload);
}

onMounted(async () => {
  if (props.initialData) {
    applyInitialData(props.initialData);
  } else if (route.params.id) {
    loadingEdit.value = true;
    try {
      const res = await fetchApi<any>(`/api/v1/products/${route.params.id}/`);
      if (res) applyInitialData(res);
    } catch {
      // ignore — form stays empty
    } finally {
      loadingEdit.value = false;
    }
  }
});
</script>
