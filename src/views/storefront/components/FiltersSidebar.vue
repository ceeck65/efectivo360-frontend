<script setup lang="ts">
import { computed, ref } from 'vue';
import { Calculator, Layers, RotateCcw, Search, Tags, Wallet } from 'lucide-vue-next';
import { formatMoney, type CategoryItem, type CurrencyCode, type StoreFilters } from '../storefront';

const props = defineProps<{
  enabled: StoreFilters;
  categories: CategoryItem[];
  brands: { name: string; count: number }[];
  totalCount: number;
  priceCeiling: number; // en USD
  affordableCount: number;
  rate: number | null;
  currencies: CurrencyCode[];
}>();
const emit = defineEmits<{ (e: 'reset'): void }>();

const categoryId = defineModel<string>('categoryId', { default: '' });
const selectedBrands = defineModel<string[]>('selectedBrands', { default: () => [] });
const budgetInput = defineModel<string>('budgetInput', { default: '' });
const budgetCurrency = defineModel<CurrencyCode>('budgetCurrency', { default: 'USD' });
const range = defineModel<[number, number]>('range', { default: () => [0, 0] });
const inStockOnly = defineModel<boolean>('inStockOnly', { default: false });

const QUICK_AMOUNTS: Record<CurrencyCode, number[]> = { USD: [5, 10, 20, 50], VES: [1000, 5000, 10000, 20000] };

const minValue = computed({
  get: () => range.value[0],
  set: (value: number) => {
    range.value = [Math.min(Number(value), range.value[1]), range.value[1]];
  },
});

const maxValue = computed({
  get: () => range.value[1],
  set: (value: number) => {
    range.value = [range.value[0], Math.max(Number(value), range.value[0])];
  },
});

const percent = (value: number) => (props.priceCeiling ? (value / props.priceCeiling) * 100 : 0);
const sliderStep = computed(() => (props.priceCeiling > 200 ? 1 : 0.5));

const budgetNumber = computed(() => parseFloat(String(budgetInput.value).replace(',', '.')));
const hasBudget = computed(() => budgetNumber.value > 0);

function setBudgetCurrency(code: CurrencyCode) {
  budgetCurrency.value = code;
  budgetInput.value = '';
}

// Marcas: buscador cuando la lista es larga (repuestos, ferreterías...).
const brandSearch = ref('');
const visibleBrands = computed(() => {
  const term = brandSearch.value.trim().toLowerCase();
  return term ? props.brands.filter((b) => b.name.toLowerCase().includes(term)) : props.brands;
});

function toggleBrand(name: string) {
  selectedBrands.value = selectedBrands.value.includes(name)
    ? selectedBrands.value.filter((b) => b !== name)
    : [...selectedBrands.value, name];
}

const hasActiveFilters = computed(
  () =>
    !!categoryId.value ||
    selectedBrands.value.length > 0 ||
    hasBudget.value ||
    inStockOnly.value ||
    range.value[0] > 0 ||
    range.value[1] < props.priceCeiling
);

function fromInput(event: Event): number {
  return Number((event.target as HTMLInputElement).value);
}
</script>

<template>
  <div class="space-y-5">
    <!-- Categorías -->
    <section v-if="enabled.categories && categories.length" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 class="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
        <Layers :size="16" class="text-[color:var(--brand)]" /> Categorías
      </h3>
      <ul class="max-h-96 space-y-1 overflow-y-auto pr-1">
        <li>
          <button
            type="button"
            class="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors"
            :class="!categoryId ? 'bg-[color:var(--brand)] font-semibold text-[color:var(--on-brand)]' : 'text-slate-600 hover:bg-slate-100'"
            @click="categoryId = ''"
          >
            <span class="flex items-center gap-2"><Layers :size="16" /> Todas</span>
            <span class="rounded-full px-2 text-xs" :class="!categoryId ? 'bg-white/25' : 'bg-slate-100 text-slate-500'">{{ totalCount }}</span>
          </button>
        </li>
        <li v-for="category in categories" :key="category.id">
          <button
            type="button"
            class="flex w-full items-center justify-between rounded-xl py-2 pr-3 text-sm transition-colors"
            :class="
              categoryId === category.id
                ? 'bg-[color:var(--brand)] font-semibold text-[color:var(--on-brand)]'
                : 'text-slate-600 hover:bg-slate-100'
            "
            :style="{ paddingLeft: `${12 + category.depth * 16}px` }"
            @click="categoryId = categoryId === category.id ? '' : category.id"
          >
            <span class="flex min-w-0 items-center gap-2">
              <span v-if="category.icon" class="w-4 shrink-0 text-center" aria-hidden="true">{{ category.icon }}</span>
              <span class="truncate">{{ category.name }}</span>
            </span>
            <span
              class="rounded-full px-2 text-xs"
              :class="categoryId === category.id ? 'bg-white/25' : 'bg-slate-100 text-slate-500'"
            >
              {{ category.count }}
            </span>
          </button>
        </li>
      </ul>
    </section>

    <!-- Marcas -->
    <section v-if="enabled.brands && brands.length > 1" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 class="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
        <Tags :size="16" class="text-[color:var(--brand)]" /> Marcas
      </h3>
      <div v-if="brands.length > 8" class="relative mb-2">
        <Search :size="14" class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          v-model="brandSearch"
          type="search"
          placeholder="Buscar marca..."
          class="w-full rounded-lg border border-slate-200 py-1.5 pl-8 pr-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-ring)]"
        />
      </div>
      <ul class="max-h-60 space-y-1 overflow-y-auto pr-1">
        <li v-for="brand in visibleBrands" :key="brand.name">
          <label class="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
            <span class="flex min-w-0 items-center gap-2">
              <input
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300 accent-[color:var(--brand)]"
                :checked="selectedBrands.includes(brand.name)"
                @change="toggleBrand(brand.name)"
              />
              <span class="truncate">{{ brand.name }}</span>
            </span>
            <span class="text-xs text-slate-400">{{ brand.count }}</span>
          </label>
        </li>
      </ul>
    </section>

    <!-- Simulador de presupuesto -->
    <section v-if="enabled.budget" class="rounded-2xl border border-[color:var(--brand-ring)] bg-[color:var(--brand-soft)] p-4 shadow-sm">
      <h3 class="mb-1 flex items-center gap-2 text-sm font-bold text-slate-800">
        <Calculator :size="16" class="text-[color:var(--brand)]" /> ¿Cuánto quieres gastar?
      </h3>
      <p class="mb-3 text-xs text-slate-500">Ingresa tu presupuesto y te mostramos lo que puedes comprar.</p>

      <div v-if="currencies.length > 1" class="mb-2 flex rounded-xl bg-white/70 p-0.5">
        <button
          v-for="code in currencies"
          :key="code"
          type="button"
          class="flex-1 rounded-lg py-1 text-xs font-semibold transition-colors"
          :class="budgetCurrency === code ? 'bg-[color:var(--brand)] text-[color:var(--on-brand)] shadow-sm' : 'text-slate-500 hover:text-slate-700'"
          @click="setBudgetCurrency(code)"
        >
          {{ code === 'USD' ? '$ Dólares' : 'Bs. Bolívares' }}
        </button>
      </div>

      <div class="relative">
        <Wallet :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          v-model="budgetInput"
          type="text"
          inputmode="decimal"
          :placeholder="budgetCurrency === 'USD' ? 'Ej. 20' : 'Ej. 1.000'"
          class="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-ring)]"
        />
      </div>

      <div class="mt-2 flex flex-wrap gap-1.5">
        <button
          v-for="amount in QUICK_AMOUNTS[budgetCurrency]"
          :key="amount"
          type="button"
          class="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-[color:var(--brand)] ring-1 ring-[color:var(--brand-ring)] hover:bg-[color:var(--brand-soft)]"
          @click="budgetInput = String(amount)"
        >
          {{ formatMoney(amount, budgetCurrency) }}
        </button>
      </div>

      <p v-if="hasBudget" class="mt-3 rounded-lg bg-white/80 px-3 py-2 text-xs text-slate-600">
        Con <strong class="text-[color:var(--brand)]">{{ formatMoney(budgetNumber, budgetCurrency) }}</strong>
        <template v-if="rate && budgetCurrency === 'USD'"> (≈ {{ formatMoney(budgetNumber * rate, 'VES') }})</template>
        <template v-else-if="rate"> (≈ {{ formatMoney(budgetNumber / rate, 'USD') }})</template>
        puedes comprar <strong class="text-[color:var(--brand)]">{{ affordableCount }}</strong>
        producto{{ affordableCount === 1 ? '' : 's' }}.
      </p>
    </section>

    <!-- Rango de precios -->
    <section v-if="enabled.price && priceCeiling > 1" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 class="mb-3 text-sm font-bold text-slate-800">Rango de precios</h3>

      <div class="relative h-6">
        <div class="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-slate-200" />
        <div
          class="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[color:var(--brand)]"
          :style="{ left: `${percent(minValue)}%`, right: `${100 - percent(maxValue)}%` }"
        />
        <input
          type="range"
          min="0"
          :max="priceCeiling"
          :step="sliderStep"
          :value="minValue"
          class="range-input"
          aria-label="Precio mínimo"
          @input="minValue = fromInput($event)"
        />
        <input
          type="range"
          min="0"
          :max="priceCeiling"
          :step="sliderStep"
          :value="maxValue"
          class="range-input"
          aria-label="Precio máximo"
          @input="maxValue = fromInput($event)"
        />
      </div>

      <div class="mt-2 flex items-center justify-between text-xs font-medium text-slate-600">
        <span>{{ formatMoney(minValue, 'USD') }}</span>
        <span>{{ formatMoney(maxValue, 'USD') }}</span>
      </div>
      <div v-if="rate" class="flex items-center justify-between text-[11px] text-slate-400">
        <span>{{ formatMoney(minValue * rate, 'VES') }}</span>
        <span>{{ formatMoney(maxValue * rate, 'VES') }}</span>
      </div>
    </section>

    <!-- Disponibilidad -->
    <section v-if="enabled.stock" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <label class="flex cursor-pointer items-center gap-3 text-sm text-slate-700">
        <input v-model="inStockOnly" type="checkbox" class="h-4 w-4 rounded border-slate-300 accent-[color:var(--brand)]" />
        Solo productos en stock
      </label>
    </section>

    <button
      v-if="hasActiveFilters"
      type="button"
      class="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
      @click="emit('reset')"
    >
      <RotateCcw :size="15" /> Limpiar filtros
    </button>
  </div>
</template>

<style scoped>
/* Dos sliders superpuestos: solo los "pulgares" reciben clics. */
.range-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  background: transparent;
  pointer-events: none;
  appearance: none;
  -webkit-appearance: none;
}

.range-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  pointer-events: auto;
  height: 18px;
  width: 18px;
  border-radius: 9999px;
  border: 3px solid var(--brand);
  background: #fff;
  box-shadow: 0 1px 4px rgb(0 0 0 / 0.25);
  cursor: grab;
}

.range-input::-moz-range-thumb {
  pointer-events: auto;
  height: 12px;
  width: 12px;
  border-radius: 9999px;
  border: 3px solid var(--brand);
  background: #fff;
  box-shadow: 0 1px 4px rgb(0 0 0 / 0.25);
  cursor: grab;
}

.range-input::-webkit-slider-runnable-track { background: transparent; }
.range-input::-moz-range-track { background: transparent; }
</style>
