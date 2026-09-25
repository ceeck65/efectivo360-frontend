<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Check, ImageOff, Layers, Link2, MessageCircle, Minus, Plus, ShoppingCart, X, ZoomIn } from 'lucide-vue-next';
import {
  formatMoney,
  formatQuantity,
  priceIn,
  quantityStep,
  type CurrencyCode,
  type StoreConfig,
  type StoreProduct,
} from '../storefront';
import ImageLightbox from './ImageLightbox.vue';

const props = defineProps<{
  product: StoreProduct;
  config: StoreConfig;
  shareUrl: string;
  primaryCode: CurrencyCode;
  secondaryCode: CurrencyCode | '';
  rate: number | null;
}>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'add', product: StoreProduct, quantity: number): void;
  (e: 'whatsapp', product: StoreProduct, quantity: number): void;
}>();

const step = computed(() => quantityStep(props.product));
const quantity = ref(step.value);
const lightboxOpen = ref(false);
const copied = ref(false);

const soldOut = computed(() => props.product.stock <= 0);
const badge = computed(() => {
  if (soldOut.value) return { label: 'Agotado', class: 'bg-red-100 text-red-700' };
  if (props.product.stock <= (props.product.unit ? 1 : 5)) return { label: 'Últimas unidades', class: 'bg-amber-100 text-amber-700' };
  return { label: 'Disponible', class: 'bg-emerald-100 text-emerald-700' };
});

const hasWholesale = computed(
  () => !!props.product.wholesalePriceUsd && !!props.product.wholesaleMinQty && props.product.wholesaleMinQty > 1
);
const unitSuffix = computed(() => (props.product.unit ? ` / ${props.product.unit}` : ''));

watch(
  () => props.product.id,
  () => {
    quantity.value = step.value;
    lightboxOpen.value = false;
  }
);

const clamp = (value: number) => Math.min(Math.max(value, step.value), Math.max(props.product.stock, step.value));

function change(delta: number) {
  quantity.value = clamp(Math.round((quantity.value + delta * step.value) * 1000) / 1000);
}

function setQuantity(event: Event) {
  const input = event.target as HTMLInputElement;
  quantity.value = clamp(Number(input.value.replace(',', '.')) || step.value);
  input.value = String(quantity.value);
}

// ---------- Zoom con lupa al pasar el cursor (solo mouse/trackpad) ----------
const canHoverZoom = typeof window !== 'undefined' && window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;
const zooming = ref(false);
const zoomPos = ref({ x: 50, y: 50 });

function onMouseMove(event: MouseEvent) {
  if (!canHoverZoom || !props.product.image) return;
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  zoomPos.value = {
    x: ((event.clientX - rect.left) / rect.width) * 100,
    y: ((event.clientY - rect.top) / rect.height) * 100,
  };
  zooming.value = true;
}

async function share() {
  const data = { title: props.product.name, url: props.shareUrl };
  try {
    if (navigator.share) {
      await navigator.share(data);
      return;
    }
    await navigator.clipboard.writeText(props.shareUrl);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch {
    // El usuario canceló o el navegador no permite compartir.
  }
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm sm:items-center sm:p-4"
    role="dialog"
    aria-modal="true"
    :aria-label="product.name"
    @click.self="emit('close')"
  >
    <div class="relative max-h-[94dvh] w-full max-w-4xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
      <button
        type="button"
        class="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 text-slate-600 shadow hover:bg-slate-100"
        title="Cerrar"
        @click="emit('close')"
      >
        <X :size="18" />
      </button>

      <div class="grid md:grid-cols-2">
        <!-- Imagen -->
        <div class="bg-slate-50 p-4 sm:p-6">
          <div
            class="relative aspect-square overflow-hidden rounded-2xl"
            :class="[product.image ? (canHoverZoom ? 'cursor-zoom-in' : 'cursor-pointer') : '', config.imageFit === 'contain' ? 'bg-white' : 'bg-slate-100']"
            @click="product.image && (lightboxOpen = true)"
            @mousemove="onMouseMove"
            @mouseleave="zooming = false"
          >
            <template v-if="product.image">
              <img
                :src="product.image"
                :alt="product.name"
                class="h-full w-full"
                :class="config.imageFit === 'contain' ? 'object-contain p-4' : 'object-cover'"
              />
              <div
                v-if="zooming"
                class="pointer-events-none absolute inset-0 bg-white bg-[length:200%_200%] bg-no-repeat"
                :style="{ backgroundImage: `url(${product.image})`, backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%` }"
              />
              <span
                v-else
                class="pointer-events-none absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[10px] font-medium text-white"
              >
                <ZoomIn :size="12" /> Ampliar
              </span>
            </template>
            <span v-else class="flex h-full items-center justify-center text-slate-300"><ImageOff :size="48" /></span>
          </div>
        </div>

        <!-- Ficha -->
        <div class="flex flex-col p-5 sm:p-8">
          <p v-if="product.category" class="text-xs font-bold uppercase tracking-wider text-[color:var(--brand)]">
            {{ product.category }}
          </p>
          <h2 class="mt-1 pr-8 text-xl font-extrabold leading-tight text-slate-900 sm:text-2xl">{{ product.name }}</h2>

          <dl class="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
            <div v-if="product.brand" class="flex gap-1.5">
              <dt class="text-slate-400">Marca</dt>
              <dd class="font-medium text-slate-700">{{ product.brand }}</dd>
            </div>
            <div v-if="config.showSku && product.sku" class="flex gap-1.5">
              <dt class="text-slate-400">Código</dt>
              <dd class="font-medium text-slate-700">{{ product.sku }}</dd>
            </div>
            <div class="flex items-center gap-1.5">
              <dt class="text-slate-400">Stock</dt>
              <dd class="flex items-center gap-1.5">
                <span class="rounded-full px-2 py-0.5 text-xs font-bold" :class="badge.class">{{ badge.label }}</span>
                <span v-if="config.showStockQuantity && !soldOut" class="text-xs text-slate-500">
                  ({{ formatQuantity(product.stock, product.unit) }} disponibles)
                </span>
              </dd>
            </div>
          </dl>

          <div class="mt-4">
            <p class="text-3xl font-extrabold text-slate-900">
              {{ formatMoney(priceIn(product, primaryCode, rate), primaryCode) }}<span class="text-sm font-semibold text-slate-400">{{ unitSuffix }}</span>
            </p>
            <p v-if="secondaryCode" class="text-sm text-slate-500">≈ {{ formatMoney(priceIn(product, secondaryCode, rate), secondaryCode) }}</p>
            <p
              v-if="hasWholesale"
              class="mt-1.5 inline-flex items-center gap-1.5 rounded-lg bg-[color:var(--brand-soft)] px-2.5 py-1 text-xs font-semibold text-[color:var(--brand)]"
            >
              <Layers :size="13" /> Al mayor: {{ formatMoney(product.wholesalePriceUsd, 'USD') }} c/u desde {{ product.wholesaleMinQty }} unidades
            </p>
          </div>

          <p class="mt-4 text-sm leading-relaxed text-slate-600">
            ¿Tienes dudas sobre este producto? Escríbenos por WhatsApp y te ayudamos.
          </p>

          <div v-if="product.variants.length" class="mt-4">
            <p class="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">Opciones disponibles</p>
            <ul class="space-y-1">
              <li
                v-for="variant in product.variants"
                :key="variant.id"
                class="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
              >
                <span class="font-medium text-slate-700">{{ variant.name }}</span>
                <span class="flex items-center gap-2 text-xs text-slate-500">
                  <span v-if="variant.priceUsd">{{ formatMoney(priceIn({ priceUsd: variant.priceUsd }, primaryCode, rate), primaryCode) }}</span>
                  <span :class="variant.stock > 0 ? 'text-emerald-600' : 'text-red-600'">
                    {{ variant.stock > 0 ? (config.showStockQuantity ? `${formatQuantity(variant.stock)} disp.` : 'Disponible') : 'Agotada' }}
                  </span>
                </span>
              </li>
            </ul>
            <p class="mt-1 text-xs text-slate-400">Indícanos por WhatsApp qué opción prefieres.</p>
          </div>

          <div class="mt-auto space-y-3 pt-6">
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center rounded-xl border border-slate-200">
                <button
                  type="button"
                  class="p-2.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                  :disabled="soldOut || quantity <= step"
                  title="Restar"
                  @click="change(-1)"
                >
                  <Minus :size="16" />
                </button>
                <input
                  :value="quantity"
                  type="text"
                  inputmode="decimal"
                  :disabled="soldOut"
                  class="w-14 border-x border-slate-200 py-2 text-center text-sm font-semibold focus:outline-none"
                  aria-label="Cantidad"
                  @change="setQuantity"
                />
                <button
                  type="button"
                  class="p-2.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                  :disabled="soldOut || quantity >= product.stock"
                  title="Sumar"
                  @click="change(1)"
                >
                  <Plus :size="16" />
                </button>
              </div>
              <p class="text-right text-sm text-slate-500">
                Subtotal
                <strong class="block text-base text-slate-900">{{ formatMoney(priceIn(product, primaryCode, rate, quantity), primaryCode) }}</strong>
              </p>
            </div>

            <button
              type="button"
              class="flex w-full items-center justify-center gap-2 rounded-xl bg-[color:var(--brand)] py-3 font-semibold text-[color:var(--on-brand)] shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-white"
              :disabled="soldOut"
              @click="emit('add', product, quantity)"
            >
              <ShoppingCart :size="18" /> Añadir al carrito
            </button>
            <button
              type="button"
              class="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300"
              :disabled="soldOut"
              @click="emit('whatsapp', product, quantity)"
            >
              <MessageCircle :size="18" /> Comprar directo por WhatsApp
            </button>
            <button
              type="button"
              class="flex w-full items-center justify-center gap-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-800"
              @click="share"
            >
              <component :is="copied ? Check : Link2" :size="14" /> {{ copied ? 'Enlace copiado' : 'Compartir este producto' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <ImageLightbox v-if="lightboxOpen && product.image" :images="[product.image]" @close="lightboxOpen = false" />
  </div>
</template>
