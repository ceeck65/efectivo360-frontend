<script setup lang="ts">
import { ref, computed } from 'vue';
import { X, Check, Gift, Users } from 'lucide-vue-next';

interface TopUpPackage {
  id: string;
  label: string;
  transactions: number;
  price: number;
  popular?: boolean;
}

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm', pkg: TopUpPackage, referralCode: string): void;
}>();

const packages: TopUpPackage[] = [
  { id: 'recharge_250', label: 'Recarga 250', transactions: 250, price: 5, popular: true },
  { id: 'starter', label: 'Starter', transactions: 500, price: 15 },
  { id: 'basic', label: 'Básico', transactions: 1000, price: 25 },
  { id: 'premium', label: 'Premium', transactions: 2000, price: 40 },
  { id: 'unlimited', label: 'Full Ilimitado', transactions: -1, price: 99 },
];

const selectedId = ref<string>('basic');
const referralCode = ref<string>('');
const showReferral = ref(false);

const selectedPackage = computed(() => packages.find(p => p.id === selectedId.value)!);

function handleConfirm() {
  emit('confirm', selectedPackage.value, referralCode.value);
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="emit('close')" />
      <div class="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/[0.08] dark:bg-[#141824]">
        <div class="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-white/[0.06]">
          <div class="flex items-center gap-2">
            <Gift class="h-5 w-5 text-blue-600" />
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">Recargar Ventas</h2>
          </div>
          <button @click="emit('close')" class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors dark:hover:bg-white/10">
            <X class="h-4 w-4" />
          </button>
        </div>

        <div class="px-5 py-4 space-y-4">
          <p class="text-sm text-slate-500 dark:text-slate-400">
            Selecciona el paquete de ventas que deseas recargar. Una vez confirmado, se procesará el pago y las ventas se acreditarán a tu cuenta de inmediato.
          </p>

          <div class="space-y-2.5">
            <div
              v-for="pkg in packages"
              :key="pkg.id"
              @click="selectedId = pkg.id"
              class="relative flex items-center gap-4 rounded-xl border-2 p-4 cursor-pointer transition-all"
              :class="selectedId === pkg.id
                ? 'border-blue-500 bg-blue-50/60 dark:border-blue-500 dark:bg-blue-500/10'
                : 'border-slate-200 bg-white hover:border-slate-300 dark:border-white/[0.08] dark:bg-transparent dark:hover:border-white/20'"
            >
              <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
                :class="selectedId === pkg.id ? 'border-blue-500 bg-blue-500' : 'border-slate-300 dark:border-slate-500'">
                <Check v-if="selectedId === pkg.id" class="h-3.5 w-3.5 text-white" stroke-width="3" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold text-slate-900 dark:text-white">{{ pkg.label }}</span>
                  <span v-if="pkg.popular" class="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">Popular</span>
                </div>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {{ pkg.transactions === -1 ? 'Ventas ilimitadas' : `${pkg.transactions.toLocaleString()} ventas` }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-lg font-black text-slate-900 dark:text-white">${{ pkg.price }}</p>
                <p class="text-[10px] text-slate-400" v-if="pkg.transactions > 0">${{ (pkg.price / pkg.transactions * 100).toFixed(2) }}/venta</p>
              </div>
            </div>
          </div>

          <!-- Referral Code -->
          <div>
            <button @click="showReferral = !showReferral" class="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors dark:hover:text-slate-300">
              <Users class="h-3.5 w-3.5" />
              {{ showReferral ? 'Ocultar' : '¿Tienes un código de referido?' }}
            </button>
            <div v-if="showReferral" class="mt-2">
              <input
                v-model="referralCode"
                type="text"
                placeholder="Ingresa tu código de referido"
                class="w-full h-10 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:border-white/[0.08] dark:bg-transparent dark:text-white dark:placeholder:text-slate-500 dark:focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 border-t border-slate-100 px-5 py-4 dark:border-white/[0.06]">
          <button @click="emit('close')" class="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors dark:border-white/15 dark:text-slate-300 dark:hover:bg-white/10">
            Cancelar
          </button>
          <button @click="handleConfirm"
            class="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 hover:from-blue-500 hover:to-blue-600 transition-all active:scale-[0.98]">
            Recargar Ahora — ${{ selectedPackage.price }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
