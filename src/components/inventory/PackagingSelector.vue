<template>
  <div class="space-y-2">
    <label v-if="label" class="block text-sm font-medium text-slate-700">{{ label }}</label>

    <!-- Loading / empty -->
    <div v-if="loading" class="flex items-center gap-2 text-sm text-slate-400 py-2">
      <Loader2 class="w-4 h-4 animate-spin" /> Cargando empaques…
    </div>
    <p v-else-if="error" class="text-sm text-rose-500 py-1">{{ error }}</p>
    <p v-else-if="!resolvedOptions.length" class="text-sm text-slate-400 py-1">
      Este producto no tiene empaques disponibles.
    </p>

    <template v-else>
      <!-- ── Variante GRID ── -->
      <div v-if="variant === 'grid'" class="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <button
          v-for="opt in resolvedOptions"
          :key="opt.code"
          type="button"
          :disabled="disabled"
          @click="selectCode(opt.code)"
          class="flex flex-col items-center text-center gap-1 px-2 py-3 rounded-xl border text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          :class="opt.code === modelValue
            ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500/30'
            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'"
        >
          <component :is="iconFor(opt.icon)" class="w-5 h-5" />
          <span class="font-semibold leading-tight">{{ opt.label }}</span>
          <span class="text-[10px] text-slate-400">{{ factorSuffix(opt) }}</span>
        </button>
      </div>

      <!-- ── Variante DROPDOWN ── -->
      <div v-else class="relative" ref="ddRef">
        <button
          type="button"
          :disabled="disabled"
          @click="open = !open"
          class="w-full h-11 pl-3 pr-9 flex items-center gap-2 text-sm border border-slate-300 rounded-xl bg-white text-slate-800 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <component :is="iconFor(selectedOption?.icon)" class="w-4 h-4 text-slate-500 shrink-0" />
          <span v-if="selectedOption" class="truncate">
            {{ selectedOption.label }}
            <span class="text-slate-400">{{ factorSuffix(selectedOption) }}</span>
          </span>
          <span v-else class="text-slate-400">Selecciona un empaque</span>
          <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        </button>

        <div v-if="open"
          class="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-64 overflow-y-auto py-1">
          <button
            v-for="opt in resolvedOptions"
            :key="opt.code"
            type="button"
            @click="selectCode(opt.code); open = false"
            class="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors"
            :class="opt.code === modelValue ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700'"
          >
            <component :is="iconFor(opt.icon)" class="w-4 h-4 shrink-0" />
            <span class="flex-1 truncate">{{ opt.label }}</span>
            <span class="text-xs text-slate-400 shrink-0">{{ factorSuffix(opt) }}</span>
            <Check v-if="opt.code === modelValue" class="w-4 h-4 shrink-0" />
          </button>
        </div>
      </div>

      <!-- ── Cantidad + equivalencia en unidades base ── -->
      <div v-if="showQuantity" class="flex items-end gap-3 pt-1">
        <div class="flex-1">
          <label class="block text-xs font-medium text-slate-500 mb-1">
            Cantidad de {{ selectedOption?.label?.toLowerCase() || 'empaques' }}
          </label>
          <input
            :value="quantity"
            @input="onQuantityInput"
            @blur="onQuantityBlur"
            type="number"
            :step="allowDecimals ? '0.001' : '1'"
            :min="allowDecimals ? '0.001' : '1'"
            :disabled="disabled || !selectedOption"
            class="w-full h-10 px-3 text-sm text-right font-semibold border rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-40"
            :class="qtyError ? 'border-rose-400' : 'border-slate-300'"
          />
        </div>
        <div class="pb-2 text-right">
          <p class="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Ingresa al Kardex</p>
          <p class="text-base font-bold text-emerald-600 leading-tight">
            {{ formattedBaseUnits }} {{ baseUnit }}
          </p>
        </div>
      </div>
      <p v-if="qtyError" class="text-xs text-rose-500">{{ qtyError }}</p>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * PackagingSelector — selector reutilizable de tipo de empaque + cantidad.
 *
 * Consume el catálogo centralizado vía usePackagingOptions. Nada hardcoded:
 * las opciones, los factores y las reglas de decimales vienen del backend.
 *
 * Uso mínimo:
 *   <PackagingSelector v-model="code" :product-id="productUlid"
 *      v-model:quantity="qty" @change="onChange" />
 *
 * O con opciones ya cargadas por el padre:
 *   <PackagingSelector v-model="code" :options="opts" v-model:quantity="qty" />
 */
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { Loader2, ChevronDown, Check } from 'lucide-vue-next';
import {
  usePackagingOptions,
  iconFor,
  calculateBaseUnits,
  validateQuantity,
  type ProductPackagingOption,
} from '@/composables/usePackagingOptions';

const props = withDefaults(defineProps<{
  modelValue: string | null;          // code del empaque seleccionado
  quantity?: number | string;         // cantidad de empaques (v-model:quantity)
  productId?: string;                 // ULID: si se pasa, el componente carga las opciones
  options?: ProductPackagingOption[]; // o el padre inyecta las opciones ya resueltas
  channel?: 'RETAIL' | 'DETAL' | 'WHOLESALE' | null;
  variant?: 'dropdown' | 'grid';
  label?: string;
  showQuantity?: boolean;
  disabled?: boolean;
  autoSelectDefault?: boolean;        // preseleccionar el default de compra
}>(), {
  quantity: 1,
  channel: null,
  variant: 'dropdown',
  showQuantity: true,
  disabled: false,
  autoSelectDefault: true,
});

const emit = defineEmits<{
  (e: 'update:modelValue', code: string): void;
  (e: 'update:quantity', qty: number): void;
  (e: 'change', payload: { option: ProductPackagingOption | null; quantity: number; baseUnits: number }): void;
}>();

const {
  loading, error, productOptions, productMeta,
  loadForProduct,
} = usePackagingOptions();

const open = ref(false);
const ddRef = ref<HTMLElement | null>(null);
const qtyError = ref('');

// Opciones efectivas: prop `options` gana; si no, las cargadas por productId.
const resolvedOptions = computed<ProductPackagingOption[]>(() => {
  const base = props.options?.length ? props.options : productOptions.value;
  if (!props.channel) return base;
  return base.filter((o) =>
    props.channel === 'WHOLESALE' ? o.allow_wholesale : o.allow_retail,
  );
});

const selectedOption = computed(
  () => resolvedOptions.value.find((o) => o.code === props.modelValue) || null,
);
const allowDecimals = computed(() => selectedOption.value?.allow_decimals ?? true);
const baseUnit = computed(() => productMeta.value.base_unit || 'UND');

const baseUnits = computed(() => {
  if (!selectedOption.value) return 0;
  return calculateBaseUnits(selectedOption.value.conversion_factor, props.quantity ?? 0);
});
const formattedBaseUnits = computed(() =>
  Number(baseUnits.value.toFixed(3)).toLocaleString('es-VE'),
);

function factorSuffix(opt: ProductPackagingOption): string {
  const f = parseFloat(opt.conversion_factor);
  if (!Number.isFinite(f) || f === 1) return '';
  return `x${Number(f.toFixed(3))} ${baseUnit.value}`;
}

function selectCode(code: string) {
  emit('update:modelValue', code);
}

function onQuantityInput(ev: Event) {
  const raw = (ev.target as HTMLInputElement).value;
  const res = validateQuantity(raw, allowDecimals.value);
  qtyError.value = res.valid ? '' : res.message;
  // no auto-corregimos mientras escribe (solo en blur); emitimos el número crudo
  const n = parseFloat(raw);
  emit('update:quantity', Number.isFinite(n) ? n : 0);
}

function onQuantityBlur() {
  const res = validateQuantity(props.quantity ?? 0, allowDecimals.value);
  if (!res.valid && res.normalized > 0) {
    // auto-corrige: p.ej. 2.5 cajas → 2 cajas cuando allow_decimals=false
    emit('update:quantity', res.normalized);
    qtyError.value = '';
  } else {
    qtyError.value = res.valid ? '' : res.message;
  }
}

// Emitir `change` consolidado
watch([selectedOption, () => props.quantity], () => {
  emit('change', {
    option: selectedOption.value,
    quantity: Number(props.quantity) || 0,
    baseUnits: baseUnits.value,
  });
});

// Preselección del default de compra cuando aún no hay selección
watch(resolvedOptions, (opts) => {
  if (!props.autoSelectDefault || props.modelValue) return;
  const def = opts.find((o) => o.is_default_purchase) || opts.find((o) => o.is_direct) || opts[0];
  if (def) emit('update:modelValue', def.code);
}, { immediate: true });

// Carga por productId
watch(() => props.productId, (id) => {
  if (id && !props.options?.length) loadForProduct(id);
}, { immediate: true });

// Cerrar dropdown al hacer click fuera
function onClickOutside(e: MouseEvent) {
  if (ddRef.value && !ddRef.value.contains(e.target as Node)) open.value = false;
}
onMounted(() => document.addEventListener('click', onClickOutside));
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside));
</script>
