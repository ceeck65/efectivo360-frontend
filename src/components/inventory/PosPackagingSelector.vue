<template>
  <div class="space-y-1.5">
    <label v-if="label" class="block text-xs font-medium text-slate-600">{{ label }}</label>

    <div class="flex items-stretch gap-2">
      <!-- ── Selector de empaque (dropdown Tailwind, sin librerías) ── -->
      <div class="relative flex-1 min-w-0" ref="ddRef">
        <button
          type="button"
          :disabled="disabled || !visibleOptions.length"
          @click="open = !open"
          class="w-full h-10 pl-2.5 pr-8 flex items-center gap-2 text-sm border rounded-lg bg-white text-slate-800 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          :class="open ? 'border-blue-500' : 'border-slate-300'"
        >
          <component :is="iconFor(selected?.icon)" class="w-4 h-4 text-slate-500 shrink-0" />
          <span v-if="selected" class="truncate">
            {{ selected.label }}
            <span v-if="factorLabel(selected)" class="text-slate-400">· {{ factorLabel(selected) }}</span>
          </span>
          <span v-else class="text-slate-400">Selecciona empaque</span>
          <svg class="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
               viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 1 1 1.08 1.04l-4.25 4.4a.75.75 0 0 1-1.08 0l-4.25-4.4a.75.75 0 0 1 .02-1.06Z" clip-rule="evenodd" />
          </svg>
        </button>

        <ul v-if="open"
            class="absolute z-30 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg py-1">
          <li v-for="opt in visibleOptions" :key="opt.code">
            <button
              type="button"
              @click="select(opt)"
              class="w-full flex items-center gap-2.5 px-2.5 py-2 text-left text-sm transition-colors"
              :class="opt.code === modelValue ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'"
            >
              <span class="w-7 h-7 shrink-0 grid place-items-center rounded-md"
                    :class="opt.code === modelValue ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'">
                <component :is="iconFor(opt.icon)" class="w-4 h-4" />
              </span>
              <span class="flex-1 min-w-0">
                <span class="block truncate font-medium">{{ opt.label }}</span>
                <span v-if="factorLabel(opt)" class="block text-[11px] text-slate-400">{{ factorLabel(opt) }}</span>
              </span>
              <span v-if="!opt.configured" class="text-[10px] text-slate-300 shrink-0">catálogo</span>
              <svg v-if="opt.code === modelValue" class="w-4 h-4 text-blue-600 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.79 6.8-6.79a1 1 0 0 1 1.4 0Z" clip-rule="evenodd" />
              </svg>
            </button>
          </li>
        </ul>
      </div>

      <!-- ── Cantidad de empaques (step según allow_decimals) ── -->
      <input
        :value="quantity"
        @input="onQtyInput"
        @blur="onQtyBlur"
        type="number"
        inputmode="decimal"
        :step="stepAttr"
        :min="minAttr"
        :disabled="disabled || !selected"
        class="w-24 h-10 px-2.5 text-sm text-right font-semibold border rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-40"
        :class="qtyError ? 'border-rose-400' : 'border-slate-300'"
        :aria-invalid="!!qtyError"
      />
    </div>

    <!-- ── Etiqueta reactiva: equivalencia canónica en Kardex ── -->
    <p class="flex items-center justify-between text-[11px]">
      <span v-if="qtyError" class="text-rose-500">{{ qtyError }}</span>
      <span v-else-if="!selected" class="text-slate-400">Elige un empaque para calcular la equivalencia.</span>
      <span v-else class="text-slate-500">
        {{ prettyQty }} {{ selected.label.toLowerCase() }}{{ Number(quantity) === 1 ? '' : 's' }}
        <span class="text-slate-300">·</span> factor {{ prettyFactor(selected) }}
      </span>
      <span v-if="selected" class="font-semibold text-emerald-600 shrink-0">
        = {{ prettyBase }} {{ resolvedBaseUnit }}
        <span class="text-slate-400 font-normal">al Kardex</span>
      </span>
    </p>
  </div>
</template>

<script setup lang="ts">
/**
 * PosPackagingSelector — selector CONTROLADO de empaque + cantidad.
 *
 * No hace fetch: recibe `options` ya resueltas (del composable
 * usePackagingOptions → loadForProduct, o de un endpoint del padre).
 * Todo el catálogo, factores y regla de decimales vienen del backend.
 *
 *   <PosPackagingSelector
 *     v-model="line.code"
 *     v-model:quantity="line.quantity"
 *     :options="line.options"
 *     :base-unit="line.baseUnit"
 *     @change="onLineChange" />
 */
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import {
  iconFor,
  calculateBaseUnits,
  validateQuantity,
  type ProductPackagingOption,
} from '@/composables/usePackagingOptions';

const props = withDefaults(defineProps<{
  options: ProductPackagingOption[];
  modelValue: string | null;           // `code` del empaque seleccionado
  quantity: number | string;           // nº de empaques
  baseUnit?: string | null;            // 'UND' | 'KG' | 'LITRO'
  channel?: 'RETAIL' | 'DETAL' | 'WHOLESALE' | null;
  label?: string;
  disabled?: boolean;
  autoSelectDefault?: boolean;
}>(), {
  baseUnit: 'UND',
  channel: null,
  disabled: false,
  autoSelectDefault: true,
});

const emit = defineEmits<{
  (e: 'update:modelValue', code: string): void;
  (e: 'update:quantity', qty: number): void;
  (e: 'change', payload: {
    option: ProductPackagingOption | null;
    packagingConfigId: string | null;
    quantity: number;
    baseQuantity: number;
  }): void;
}>();

const open = ref(false);
const ddRef = ref<HTMLElement | null>(null);
const qtyError = ref('');

const visibleOptions = computed(() => {
  if (!props.channel) return props.options ?? [];
  return (props.options ?? []).filter((o) =>
    props.channel === 'WHOLESALE' ? o.allow_wholesale : o.allow_retail,
  );
});

const selected = computed(
  () => visibleOptions.value.find((o) => o.code === props.modelValue) ?? null,
);
const allowDecimals = computed(() => selected.value?.allow_decimals ?? true);
const resolvedBaseUnit = computed(() => props.baseUnit || 'UND');

const stepAttr = computed(() => (allowDecimals.value ? '0.001' : '1'));
const minAttr = computed(() => (allowDecimals.value ? '0.001' : '1'));

const baseQuantity = computed(() =>
  selected.value
    ? calculateBaseUnits(selected.value.conversion_factor, props.quantity ?? 0)
    : 0,
);

const prettyQty = computed(() => fmt(Number(props.quantity) || 0));
const prettyBase = computed(() => fmt(baseQuantity.value));

function fmt(n: number): string {
  return Number(n.toFixed(3)).toLocaleString('es-VE');
}
function prettyFactor(o: ProductPackagingOption): string {
  return Number(parseFloat(o.conversion_factor).toFixed(3)).toString();
}
function factorLabel(o: ProductPackagingOption): string {
  const f = parseFloat(o.conversion_factor);
  return !Number.isFinite(f) || f === 1 ? '' : `x${prettyFactor(o)} ${resolvedBaseUnit.value}`;
}

function select(opt: ProductPackagingOption) {
  open.value = false;
  emit('update:modelValue', opt.code);
  // revalidar la cantidad contra la nueva regla de decimales
  const res = validateQuantity(props.quantity ?? 0, opt.allow_decimals);
  qtyError.value = res.valid ? '' : res.message;
}

function onQtyInput(ev: Event) {
  const raw = (ev.target as HTMLInputElement).value;
  const res = validateQuantity(raw, allowDecimals.value);
  qtyError.value = res.valid ? '' : res.message;
  const n = parseFloat(raw);
  emit('update:quantity', Number.isFinite(n) ? n : 0);
}

function onQtyBlur() {
  const res = validateQuantity(props.quantity ?? 0, allowDecimals.value);
  if (!res.valid && res.normalized > 0) {
    emit('update:quantity', res.normalized); // 2.5 cajas → 2 cajas
    qtyError.value = '';
  } else {
    qtyError.value = res.valid ? '' : res.message;
  }
}

// `change` consolidado — el padre obtiene el packaging_config_id para el POST.
watch([selected, () => props.quantity], () => {
  emit('change', {
    option: selected.value,
    packagingConfigId: selected.value?.packaging_config_id ?? null,
    quantity: Number(props.quantity) || 0,
    baseQuantity: baseQuantity.value,
  });
});

// Preselección del default de compra
watch(visibleOptions, (opts) => {
  if (!props.autoSelectDefault || props.modelValue) return;
  const def = opts.find((o) => o.is_default_purchase)
    || opts.find((o) => o.is_direct)
    || opts[0];
  if (def) emit('update:modelValue', def.code);
}, { immediate: true });

function onClickOutside(e: MouseEvent) {
  if (ddRef.value && !ddRef.value.contains(e.target as Node)) open.value = false;
}
onMounted(() => document.addEventListener('click', onClickOutside));
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside));
</script>
