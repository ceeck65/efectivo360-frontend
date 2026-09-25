<script setup lang="ts">
import { computed, ref } from 'vue';
import { ImageOff, Minus, Plus, ShoppingCart } from 'lucide-vue-next';
import {
  formatMoney,
  formatQuantity,
  priceIn,
  quantityStep,
  type CurrencyCode,
  type StoreConfig,
  type StoreProduct,
} from '../storefront';

const props = defineProps<{
  product: StoreProduct;
  config: StoreConfig;
  href: string;
  primaryCode: CurrencyCode;
  secondaryCode: CurrencyCode | '';
  rate: number | null;
  inCart: number;
}>();
const emit = defineEmits<{
  (e: 'view', product: StoreProduct): void;
  (e: 'add', product: StoreProduct, quantity: number): void;
}>();

const step = computed(() => quantityStep(props.product));
const soldOut = computed(() => props.product.stock <= 0);
const quantity = ref(step.value);

const stockClass = computed(() =>
  soldOut.value
    ? 'bg-red-100 text-red-700'
    : props.product.stock <= (props.product.unit ? 1 : 5)
      ? 'bg-amber-100 text-amber-700'
      : 'bg-emerald-100 text-emerald-700'
);

const stockText = computed(() => {
  if (soldOut.value) return 'Agotado';
  return props.config.showStockQuantity ? formatQuantity(props.product.stock, props.product.unit) : 'Disponible';
});

const clamp = (value: number) => Math.min(Math.max(value, step.value), Math.max(props.product.stock, step.value));

function change(delta: number) {
  quantity.value = clamp(Math.round((quantity.value + delta * step.value) * 1000) / 1000);
}

function setQuantity(event: Event) {
  const input = event.target as HTMLInputElement;
  quantity.value = clamp(Number(input.value.replace(',', '.')) || step.value);
  input.value = String(quantity.value);
}

function add() {
  emit('add', props.product, quantity.value);
  quantity.value = step.value;
}
</script>

<template>
  <article
    class="grid grid-cols-[56px_minmax(0,1fr)] items-center gap-x-3 gap-y-2 border-b border-slate-100 px-3 py-3 transition-colors last:border-b-0 hover:bg-slate-50/70 md:grid-cols-[56px_112px_minmax(0,1fr)_96px_130px_190px]"
  >
    <a
      :href="href"
      class="row-span-2 flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-slate-100 md:row-span-1"
      :aria-label="`Ver detalles de ${product.name}`"
      @click.prevent="emit('view', product)"
    >
      <img
        v-if="product.image"
        :src="product.image"
        :alt="product.name"
        loading="lazy"
        class="h-full w-full"
        :class="config.imageFit === 'contain' ? 'bg-white object-contain p-1' : 'object-cover'"
      />
      <ImageOff v-else :size="20" class="text-slate-300" />
    </a>

    <span class="hidden truncate text-xs text-slate-500 md:block">{{ product.sku || '—' }}</span>

    <a :href="href" class="min-w-0 text-left" @click.prevent="emit('view', product)">
      <span v-if="product.category || product.brand" class="block truncate text-[11px] font-semibold uppercase tracking-wide text-[color:var(--brand)]">
        {{ [product.brand, product.category].filter(Boolean).join(' · ') }}
      </span>
      <span class="line-clamp-2 block text-sm font-semibold leading-snug text-slate-800">{{ product.name }}</span>
      <span class="block text-[11px] text-slate-400 md:hidden">
        <template v-if="product.sku">{{ product.sku }} · </template>
        <span :class="soldOut ? 'text-red-600' : ''">{{ stockText }}</span>
      </span>
    </a>

    <div class="col-start-2 flex items-center justify-between gap-2 md:contents">
      <span class="hidden w-fit justify-self-center rounded-full px-2.5 py-0.5 text-xs font-semibold md:block" :class="stockClass">
        {{ stockText }}
      </span>

      <div class="md:text-right">
        <p class="text-base font-extrabold leading-none text-slate-900">
          {{ formatMoney(priceIn(product, primaryCode, rate), primaryCode) }}
          <span v-if="product.unit" class="text-[11px] font-semibold text-slate-400">/ {{ product.unit }}</span>
        </p>
        <p v-if="secondaryCode" class="mt-1 text-[11px] text-slate-500">≈ {{ formatMoney(priceIn(product, secondaryCode, rate), secondaryCode) }}</p>
      </div>

      <div class="flex items-center justify-end gap-1.5">
        <div class="flex items-center rounded-lg border border-slate-200">
          <button type="button" class="p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30" :disabled="soldOut || quantity <= step" title="Restar" @click="change(-1)">
            <Minus :size="13" />
          </button>
          <input
            :value="quantity"
            type="text"
            inputmode="decimal"
            :disabled="soldOut"
            class="w-11 border-x border-slate-200 py-1 text-center text-sm font-semibold focus:outline-none"
            aria-label="Cantidad"
            @change="setQuantity"
          />
          <button type="button" class="p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30" :disabled="soldOut || quantity >= product.stock" title="Sumar" @click="change(1)">
            <Plus :size="13" />
          </button>
        </div>
        <button
          type="button"
          class="flex h-9 items-center gap-1.5 rounded-lg bg-[color:var(--brand)] px-3 text-sm font-semibold text-[color:var(--on-brand)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-white"
          :disabled="soldOut"
          :title="soldOut ? 'Producto agotado' : 'Añadir al carrito'"
          @click="add"
        >
          <ShoppingCart :size="15" />
          <span class="hidden lg:inline">{{ inCart ? `Añadir (${formatQuantity(inCart)})` : 'Añadir' }}</span>
        </button>
      </div>
    </div>
  </article>
</template>
