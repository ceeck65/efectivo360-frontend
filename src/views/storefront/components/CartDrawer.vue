<script setup lang="ts">
import { ImageOff, MessageCircle, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-vue-next';
import { formatMoney, formatQuantity, priceIn, type CurrencyCode } from '../storefront';
import type { StoreCart } from '../useStoreCart';

const props = defineProps<{ cart: StoreCart; currencies: CurrencyCode[]; rate: number | null }>();
defineEmits<{ (e: 'checkout'): void }>();

function totalIn(code: CurrencyCode): number | null {
  let total = 0;
  for (const item of props.cart.state.items) {
    const line = priceIn(item, code, props.rate, item.quantity);
    if (line === null) return null;
    total += line;
  }
  return total;
}
</script>

<template>
  <Transition
    enter-active-class="transition-opacity duration-300"
    leave-active-class="transition-opacity duration-200"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div v-if="cart.state.open" class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm" @click="cart.state.open = false" />
  </Transition>

  <Transition
    enter-active-class="transition-transform duration-300 ease-out"
    leave-active-class="transition-transform duration-200 ease-in"
    enter-from-class="translate-x-full"
    leave-to-class="translate-x-full"
  >
    <aside
      v-if="cart.state.open"
      class="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl"
      role="dialog"
      aria-modal="true"
      aria-label="Carrito de compras"
    >
      <header class="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 class="flex items-center gap-2 text-lg font-bold text-slate-900">
          <ShoppingBag :size="20" class="text-[color:var(--brand)]" /> Tu carrito
          <span class="rounded-full bg-[color:var(--brand-soft)] px-2 py-0.5 text-xs font-semibold text-[color:var(--brand)]">{{ cart.count.value }}</span>
        </h2>
        <button type="button" class="rounded-full p-2 text-slate-500 hover:bg-slate-100" title="Cerrar" @click="cart.state.open = false">
          <X :size="18" />
        </button>
      </header>

      <div class="min-h-0 flex-1 overflow-y-auto px-5">
        <div v-if="!cart.state.items.length" class="flex h-full flex-col items-center justify-center text-center text-slate-400">
          <ShoppingBag :size="48" class="mb-3 text-slate-200" />
          <p class="font-medium text-slate-500">Tu carrito está vacío</p>
          <p class="text-sm">Agrega productos y arma tu pedido.</p>
          <button
            type="button"
            class="mt-4 rounded-xl bg-[color:var(--brand)] px-4 py-2 text-sm font-semibold text-[color:var(--on-brand)] hover:brightness-95"
            @click="cart.state.open = false"
          >
            Seguir comprando
          </button>
        </div>

        <ul v-else class="divide-y divide-slate-100">
          <li v-for="item in cart.state.items" :key="item.productId" class="flex gap-3 py-4">
            <div class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
              <img v-if="item.image" :src="item.image" :alt="item.name" class="h-full w-full object-contain" />
              <ImageOff v-else :size="20" class="text-slate-300" />
            </div>

            <div class="min-w-0 flex-1">
              <p class="line-clamp-2 text-sm font-semibold leading-snug text-slate-800">{{ item.name }}</p>
              <p class="text-xs text-slate-400">
                {{ formatMoney(item.priceUsd, 'USD') }} {{ item.unit ? `/ ${item.unit}` : 'c/u' }}
              </p>

              <div class="mt-2 flex items-center justify-between">
                <div class="flex items-center rounded-lg border border-slate-200">
                  <button type="button" class="p-1.5 text-slate-600 hover:bg-slate-100" title="Restar" @click="cart.step(item.productId, -1)">
                    <Minus :size="14" />
                  </button>
                  <span class="min-w-[2.5rem] px-1 text-center text-sm font-semibold">{{ formatQuantity(item.quantity, item.unit) }}</span>
                  <button
                    type="button"
                    class="p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                    :disabled="item.quantity >= item.stock"
                    title="Sumar"
                    @click="cart.step(item.productId, 1)"
                  >
                    <Plus :size="14" />
                  </button>
                </div>
                <div class="text-right">
                  <p class="text-sm font-bold text-slate-900">{{ formatMoney(priceIn(item, currencies[0], rate, item.quantity), currencies[0]) }}</p>
                  <p v-if="currencies[1]" class="text-[11px] text-slate-400">
                    {{ formatMoney(priceIn(item, currencies[1], rate, item.quantity), currencies[1]) }}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              class="self-start rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
              title="Eliminar"
              @click="cart.remove(item.productId)"
            >
              <Trash2 :size="16" />
            </button>
          </li>
        </ul>
      </div>

      <footer v-if="cart.state.items.length" class="shrink-0 space-y-3 border-t border-slate-100 bg-slate-50 px-5 py-4">
        <div class="space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-500">Total en {{ currencies[0] === 'USD' ? 'dólares' : 'bolívares' }}</span>
            <span class="text-xl font-extrabold text-slate-900">{{ formatMoney(totalIn(currencies[0]), currencies[0]) }}</span>
          </div>
          <div v-if="currencies[1]" class="flex items-center justify-between">
            <span class="text-sm text-slate-500">Total en {{ currencies[1] === 'USD' ? 'dólares' : 'bolívares' }}</span>
            <span class="text-base font-bold text-[color:var(--brand)]">{{ formatMoney(totalIn(currencies[1]), currencies[1]) }}</span>
          </div>
        </div>

        <button
          type="button"
          class="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 font-bold text-white shadow-sm transition hover:bg-emerald-600"
          @click="$emit('checkout')"
        >
          <MessageCircle :size="20" /> Enviar pedido por WhatsApp
        </button>
        <p class="text-center text-xs text-slate-400">Te respondemos para acordar el pago y la entrega.</p>
        <button type="button" class="w-full text-center text-xs font-medium text-slate-400 hover:text-red-600" @click="cart.clear()">
          Vaciar carrito
        </button>
      </footer>
    </aside>
  </Transition>
</template>
