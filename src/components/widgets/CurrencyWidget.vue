<script setup lang="ts">
import { ref, computed } from 'vue';
import { DollarSign, Coins, Globe } from 'lucide-vue-next';

type Currency = 'VES' | 'USD' | 'COP';

interface CurrencyRate {
  code: Currency;
  symbol: string;
  name: string;
  rate: number;
  flag: string;
}

const props = defineProps<{
  rates?: CurrencyRate[];
  defaultCurrency?: Currency;
}>();

const emit = defineEmits<{
  'currency-change': [currency: Currency];
}>();

const rates = props.rates || [
  { code: 'VES', symbol: 'Bs.', name: 'Bolívar', rate: 36.5, flag: '🇻🇪' },
  { code: 'USD', symbol: '$', name: 'Dólar', rate: 1, flag: '🇺🇸' },
  { code: 'COP', symbol: '$', name: 'Peso', rate: 4100, flag: '🇨🇴' },
];

const selectedCurrency = ref<Currency>(props.defaultCurrency || 'USD');

const currentRate = computed(() => rates.find(r => r.code === selectedCurrency.value));

const selectCurrency = (currency: Currency) => {
  selectedCurrency.value = currency;
  emit('currency-change', currency);
};

const currencyIcons: Record<Currency, any> = {
  VES: Coins,
  USD: DollarSign,
  COP: Globe,
};
</script>

<template>
  <div class="relative overflow-hidden rounded-xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-slate-50/90 p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.7)_inset,0_12px_40px_-12px_rgba(15,23,42,0.12)] backdrop-blur-xl transition-all duration-300 hover:shadow-[0_24px_50px_-18px_rgba(30,64,175,0.15)] dark:border-white/[0.07] dark:from-[#141824] dark:via-[#111620] dark:to-[#0a0d14] dark:shadow-[0_0_0_1px_rgba(56,189,248,0.06),0_20px_50px_-15px_rgba(0,0,0,0.55)] dark:hover:shadow-[0_0_0_1px_rgba(30,64,175,0.1),0_28px_55px_-18px_rgba(0,0,0,0.55)]">
    <!-- Top accent bar -->
    <div class="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[3px] bg-gradient-to-r opacity-95 from-corporate-blue via-corporate-blueLight to-corporate-gray" />
    <!-- Glow effect -->
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(30,64,175,0.08),transparent_60%)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(59,130,246,0.07),transparent_55%)]" />
    
    <div class="relative z-[2]">
      <!-- Header -->
      <div class="mb-4 flex items-start gap-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-corporate-blue/12 text-corporate-blue ring-1 ring-corporate-blue/25 dark:bg-corporate-blue/10 dark:text-corporate-blueLight dark:ring-corporate-blue/30" aria-hidden>
          <DollarSign class="h-[18px] w-[18px] stroke-[1.5]" />
        </div>
        <div class="min-w-0 flex-1">
          <h3 class="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">Moneda</h3>
          <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Conversión instantánea</p>
        </div>
      </div>

      <!-- Current Selection -->
      <div class="mb-4 rounded-lg border border-slate-200/80 bg-white/60 px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.04]">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-2xl">{{ currentRate?.flag }}</span>
            <div>
              <p class="text-sm font-semibold text-slate-900 dark:text-white">{{ currentRate?.name }}</p>
              <p class="text-[11px] text-slate-500 dark:text-slate-400">{{ currentRate?.code }}</p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-lg font-semibold text-corporate-blue dark:text-corporate-blueLight">{{ currentRate?.symbol }}1</p>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">Tasa base</p>
          </div>
        </div>
      </div>

      <!-- Currency Selector -->
      <div class="space-y-2">
        <button
          v-for="rate in rates"
          :key="rate.code"
          @click="selectCurrency(rate.code)"
          :class="[
            'flex w-full items-center justify-between rounded-lg border px-3 py-2.5 transition-all',
            selectedCurrency === rate.code
              ? 'border-corporate-blue/50 bg-corporate-blue/10 shadow-sm'
              : 'border-slate-200/80 bg-white/60 hover:border-slate-300/80 hover:bg-slate-50/80 dark:border-white/[0.06] dark:bg-white/[0.04] dark:hover:border-white/[0.10] dark:hover:bg-white/[0.06]'
          ]"
        >
          <div class="flex items-center gap-3">
            <component 
              :is="currencyIcons[rate.code]" 
              class="h-4 w-4 shrink-0"
              :class="selectedCurrency === rate.code ? 'text-corporate-blue dark:text-corporate-blueLight' : 'text-slate-400 dark:text-slate-500'"
            />
            <span class="text-sm font-medium text-slate-700 dark:text-slate-300">{{ rate.name }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-slate-500 dark:text-slate-400">{{ rate.flag }}</span>
            <span class="text-xs font-mono text-slate-400 dark:text-slate-500">{{ rate.code }}</span>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>
