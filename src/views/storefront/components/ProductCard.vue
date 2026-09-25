<script setup lang="ts">
import { computed } from 'vue';
import { Eye, ImageOff, ShoppingCart } from 'lucide-vue-next';
import { formatMoney, formatQuantity, priceIn, type CurrencyCode, type StoreConfig, type StoreProduct } from '../storefront';

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
  (e: 'add', product: StoreProduct): void;
}>();

const soldOut = computed(() => props.product.stock <= 0);
const lowStock = computed(() => !soldOut.value && props.product.stock <= (props.product.unit ? 1 : 5));

const badge = computed(() => {
  if (soldOut.value) return { label: 'Agotado', class: 'bg-red-500 text-white' };
  if (lowStock.value) return { label: 'Últimas unidades', class: 'bg-amber-400 text-amber-950' };
  return null;
});

const unitSuffix = computed(() => (props.product.unit ? ` / ${props.product.unit}` : ''));
</script>

<template>
  <article class="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl">
    <a
      :href="href"
      class="relative block aspect-square overflow-hidden bg-slate-100"
      :class="config.imageFit === 'contain' ? 'bg-white' : ''"
      :aria-label="`Ver detalles de ${product.name}`"
      @click.prevent="emit('view', product)"
    >
      <img
        v-if="product.image"
        :src="product.image"
        :alt="product.name"
        loading="lazy"
        class="absolute inset-0 h-full w-full transition duration-500 group-hover:scale-105"
        :class="config.imageFit === 'contain' ? 'object-contain p-3' : 'object-cover'"
      />
      <span v-else class="absolute inset-0 flex items-center justify-center text-slate-300">
        <ImageOff :size="36" />
      </span>

      <span v-if="badge" class="absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[11px] font-bold shadow" :class="badge.class">
        {{ badge.label }}
      </span>
    </a>

    <div class="flex flex-1 flex-col p-3 sm:p-4">
      <p v-if="product.category || product.brand" class="truncate text-[11px] font-semibold uppercase tracking-wide text-[color:var(--brand)]">
        {{ [product.brand, product.category].filter(Boolean).join(' · ') }}
      </p>
      <h3 class="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-slate-800 sm:text-base">
        <a :href="href" class="hover:underline" @click.prevent="emit('view', product)">{{ product.name }}</a>
      </h3>
      <p v-if="config.showSku && product.sku" class="mt-0.5 text-xs text-slate-400">Cód.: {{ product.sku }}</p>
      <p v-if="config.showStockQuantity && !soldOut" class="mt-0.5 text-xs text-emerald-600">
        {{ formatQuantity(product.stock, product.unit) }} disponibles
      </p>

      <div class="mt-3">
        <p class="text-xl font-extrabold leading-none text-slate-900 sm:text-2xl">
          {{ formatMoney(priceIn(product, primaryCode, rate), primaryCode) }}<span class="text-xs font-semibold text-slate-400">{{ unitSuffix }}</span>
        </p>
        <p v-if="secondaryCode" class="mt-1 text-xs text-slate-500">
          ≈ {{ formatMoney(priceIn(product, secondaryCode, rate), secondaryCode) }}
        </p>
      </div>

      <div class="mt-auto grid grid-cols-2 gap-2 pt-3">
        <button
          type="button"
          class="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-2 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 sm:text-sm"
          title="Ver detalles"
          @click="emit('view', product)"
        >
          <Eye :size="15" /> <span>Detalles</span>
        </button>
        <button
          type="button"
          class="flex items-center justify-center gap-1.5 rounded-xl bg-[color:var(--brand)] px-2 py-2 text-xs font-semibold text-[color:var(--on-brand)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-white sm:text-sm"
          :disabled="soldOut"
          :title="soldOut ? 'Producto agotado' : 'Agregar al carrito'"
          @click="emit('add', product)"
        >
          <ShoppingCart :size="15" />
          <span>{{ soldOut ? 'Agotado' : inCart ? `Agregar (${formatQuantity(inCart)})` : 'Agregar' }}</span>
        </button>
      </div>
    </div>
  </article>
</template>
