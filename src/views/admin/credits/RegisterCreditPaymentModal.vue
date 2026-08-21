<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { X, Loader2, Printer } from 'lucide-vue-next';
import type { CreditPortfolioRow } from '@/composables/useCreditPortfolio';
import { usePaymentInstallments, type PaymentInstallmentDetail } from '@/composables/usePaymentInstallments';
import { useForexRate } from '@/composables/useForexRate';
import { fetchPaymentMethods, type PaymentMethod } from '@/services/treasury.service';
import { useBusinessInfo, usePrintSettings, printThermalReceipt } from '@/composables/useThermalReceipt';
import CreditPaymentReceiptPrint from '@/shared/components/CreditPaymentReceiptPrint.vue';

const props = defineProps<{
  account: CreditPortfolioRow;
}>();

const emit = defineEmits<{
  close: [];
  paid: [payment: PaymentInstallmentDetail];
}>();

const { isProcessing, errorMessage, createPaymentInstallment } = usePaymentInstallments();
const { rateValue: tasaBCV, fetchForexRate } = useForexRate();
const business = useBusinessInfo();
const { settings: printSettings, logoUrl, fetchPrintSettings } = usePrintSettings();

const paymentMethods = ref<PaymentMethod[]>([]);
const selectedMethod = ref<PaymentMethod | null>(null);
const currency = ref<'USD' | 'VES'>('USD');
const amountInput = ref('');
const reference = ref('');
const notes = ref('');
const completedPayment = ref<PaymentInstallmentDetail | null>(null);
const balanceBeforeUsd = ref(0);

onMounted(async () => {
  await Promise.all([fetchForexRate(), fetchPrintSettings()]);
  business.logoUrl = logoUrl.value;
  try {
    paymentMethods.value = await fetchPaymentMethods();
    selectedMethod.value = paymentMethods.value[0] ?? null;
  } catch {
    paymentMethods.value = [];
  }
});

const amountUsd = computed(() => {
  const raw = parseFloat(amountInput.value.replace(/[^0-9.]/g, '')) || 0;
  return currency.value === 'USD' ? raw : raw / (tasaBCV.value || 1);
});
const amountVes = computed(() => {
  const raw = parseFloat(amountInput.value.replace(/[^0-9.]/g, '')) || 0;
  return currency.value === 'VES' ? raw : raw * tasaBCV.value;
});

const balanceUsd = computed(() => Number(props.account.balance_usd));
const exceedsBalance = computed(() => amountUsd.value > balanceUsd.value + 0.01);

const canSubmit = computed(() =>
  amountUsd.value > 0 && !exceedsBalance.value && !isProcessing.value
);

function formatUSD(n: number | string): string {
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function submit() {
  if (!canSubmit.value) return;
  balanceBeforeUsd.value = balanceUsd.value;

  const payload: Record<string, unknown> = {
    credit_account: props.account.credit_account_id,
    paid_at: new Date().toISOString(),
  };
  if (currency.value === 'USD') payload.amount_usd = Number(amountUsd.value.toFixed(2));
  else payload.amount_ves = Number(amountVes.value.toFixed(2));
  if (reference.value.trim()) payload.payment_voucher = reference.value.trim();

  const methodLabel = selectedMethod.value ? (selectedMethod.value.label || selectedMethod.value.name) : '';
  const notesParts = [methodLabel ? `Método: ${methodLabel}` : '', notes.value.trim()].filter(Boolean);
  if (notesParts.length) payload.notes = notesParts.join(' — ');

  const result = await createPaymentInstallment(payload as any);
  if (result) {
    completedPayment.value = result;
    emit('paid', result);
    if (printSettings.value.auto_print) printThermalReceipt();
  }
}

function printReceipt() {
  printThermalReceipt();
}

const methodLabelForReceipt = computed(() =>
  selectedMethod.value ? (selectedMethod.value.label || selectedMethod.value.name) : 'N/A'
);
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[70] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 print:hidden">
      <div class="bg-white w-full max-w-sm rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] border border-slate-200/80 flex flex-col overflow-hidden text-slate-800">

        <!-- ═══════ Éxito: recibo ═══════ -->
        <template v-if="completedPayment">
          <div class="p-5 space-y-4">
            <div class="text-center space-y-1">
              <p class="text-sm font-black text-emerald-600">Abono Registrado</p>
              <p class="text-2xl font-black text-slate-800">${{ formatUSD(completedPayment.applied_usd) }}</p>
              <p class="text-xs text-slate-500">Nuevo saldo: ${{ formatUSD(balanceBeforeUsd - Number(completedPayment.applied_usd)) }}</p>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <button @click="printReceipt"
                class="inline-flex items-center justify-center gap-1.5 h-11 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors">
                <Printer :size="15" /> Imprimir Recibo
              </button>
              <button @click="emit('close')"
                class="h-11 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                Cerrar
              </button>
            </div>
          </div>
        </template>

        <!-- ═══════ Formulario ═══════ -->
        <template v-else>
          <div class="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <div>
              <h3 class="text-sm font-black uppercase tracking-wider text-slate-800">Registrar Abono</h3>
              <p class="text-[10px] text-slate-400 font-medium">{{ account.name }}</p>
            </div>
            <button @click="emit('close')" class="text-slate-400 hover:text-slate-600">
              <X class="w-4 h-4" />
            </button>
          </div>

          <div class="p-4 space-y-3">
            <div class="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-center justify-between">
              <span class="text-xs font-bold text-amber-700">Saldo Pendiente</span>
              <span class="text-base font-black text-amber-700">${{ formatUSD(account.balance_usd) }}</span>
            </div>

            <div class="flex justify-between items-center bg-slate-50 p-1.5 rounded-xl border border-slate-200">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-2">Moneda</span>
              <div class="flex bg-white p-0.5 rounded-lg border border-slate-200 shadow-sm">
                <button @click="currency = 'USD'"
                  class="px-3 py-1 rounded-md text-xs font-black transition-all"
                  :class="currency === 'USD' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600'">USD ($)</button>
                <button @click="currency = 'VES'"
                  class="px-3 py-1 rounded-md text-xs font-bold transition-all"
                  :class="currency === 'VES' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600'">VES (Bs)</button>
              </div>
            </div>

            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Monto Abonado ({{ currency === 'USD' ? '$' : 'Bs.' }})</label>
              <div class="relative border-2 border-slate-300 bg-slate-50 rounded-xl px-3 py-2.5 flex items-center focus-within:border-blue-500 shadow-inner">
                <span class="text-sm font-black text-slate-500 mr-2">{{ currency === 'USD' ? '$' : 'Bs.' }}</span>
                <input v-model="amountInput" type="text" inputmode="decimal" placeholder="0.00"
                  class="bg-transparent text-right text-xl font-black text-slate-800 w-full focus:outline-none placeholder:text-slate-300" />
              </div>
              <p class="text-[11px] text-slate-400">
                Equivale a {{ currency === 'USD' ? `Bs. ${formatUSD(amountVes)}` : `$${formatUSD(amountUsd)}` }} · Tasa BCV Bs. {{ formatUSD(tasaBCV) }}
              </p>
              <p v-if="exceedsBalance" class="text-[11px] text-rose-600 font-semibold">El abono no puede superar el saldo pendiente.</p>
            </div>

            <div class="space-y-1.5">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Método de Pago</span>
              <div v-if="paymentMethods.length === 0" class="text-[11px] text-slate-400 text-center py-3 bg-slate-50 rounded-xl border border-slate-200">
                No hay métodos de pago configurados
              </div>
              <div v-else class="grid grid-cols-2 gap-2">
                <button v-for="m in paymentMethods" :key="m.id" @click="selectedMethod = m"
                  class="border-2 p-2 rounded-xl font-bold text-xs shadow-sm text-center transition-all"
                  :class="selectedMethod?.id === m.id ? 'border-blue-600 bg-blue-50 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-500'">
                  {{ m.label || m.name }}
                </button>
              </div>
            </div>

            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">N° de Referencia (opcional)</label>
              <input v-model="reference" type="text" placeholder="Ej: 0001234567"
                class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
            </div>
          </div>

          <div v-if="errorMessage" class="mx-3 mb-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p class="text-red-600 text-xs font-medium">{{ errorMessage }}</p>
          </div>

          <div class="p-3 bg-slate-50 border-t border-slate-200 flex gap-2 justify-end">
            <button @click="emit('close')" :disabled="isProcessing"
              class="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 disabled:opacity-50 transition-colors">
              Cancelar
            </button>
            <button @click="submit" :disabled="!canSubmit"
              class="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-black rounded-xl shadow-md transition-all">
              <Loader2 v-if="isProcessing" class="w-4 h-4 animate-spin inline" />
              {{ isProcessing ? 'Procesando…' : 'Registrar Abono' }}
            </button>
          </div>
        </template>
      </div>
    </div>
  </Teleport>

  <CreditPaymentReceiptPrint
    v-if="completedPayment"
    :payment="completedPayment"
    :customer-name="account.name"
    :method-label="methodLabelForReceipt"
    :balance-before-usd="balanceBeforeUsd"
    :balance-after-usd="balanceBeforeUsd - Number(completedPayment.applied_usd)"
    :business="business"
    :print-settings="printSettings"
  />
</template>
