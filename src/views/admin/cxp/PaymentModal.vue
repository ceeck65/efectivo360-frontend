<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="handleClose" />
      <div class="relative bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl">
        <!-- Header -->
        <div class="flex items-start justify-between px-5 py-4 border-b border-slate-200">
          <div class="min-w-0">
            <h3 class="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              <Landmark class="w-4 h-4 text-blue-500" /> Registrar Abono
            </h3>
            <p class="text-[11px] text-slate-400 mt-0.5 truncate">{{ debt?.provider_name }}</p>
          </div>
          <button @click="handleClose" class="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 shrink-0">
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="px-5 py-4 space-y-4">
          <!-- Debt summary -->
          <div class="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-1.5">
            <div class="flex justify-between text-xs">
              <span class="text-slate-500">Factura N°</span>
              <code class="font-mono text-slate-700">{{ debt?.invoice_number || '—' }}</code>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-slate-500">Vence</span>
              <span class="text-slate-700">{{ debt?.due_date || '—' }}</span>
            </div>
            <div class="flex justify-between items-baseline pt-1.5 mt-1 border-t border-slate-200">
              <span class="text-xs text-slate-500">Saldo Pendiente</span>
              <div class="text-right">
                <p class="text-base font-bold text-rose-600">${{ remainingUsd.toFixed(2) }}</p>
                <p v-if="bcvRate > 0" class="text-[11px] text-slate-400">Bs. {{ (remainingUsd * bcvRate).toFixed(2) }}</p>
              </div>
            </div>
          </div>

          <!-- Amount -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-medium text-slate-600">
                Monto a Abonar ({{ currency === 'VES' ? 'Bs.' : '$' }}) <span class="text-red-400">*</span>
              </label>
              <button type="button" @click="setFullAmount" class="text-[11px] text-blue-600 hover:underline">
                Pago total
              </button>
            </div>
            <input
              ref="amountInput"
              v-model.number="amountNative"
              type="number" min="0.01" step="0.01"
              class="w-full h-11 px-3 text-base font-semibold border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
              @keydown.enter.prevent="submit"
            />
            <p v-if="currency === 'VES'" class="text-[11px] text-slate-400 mt-1">= ${{ amountUsd.toFixed(2) }} USD</p>
            <p v-if="overpaying" class="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
              <AlertTriangle class="w-3 h-3" /> El monto supera el saldo pendiente.
            </p>
          </div>

          <!-- Currency -->
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Moneda del Pago</label>
            <div class="flex items-center gap-2">
              <div class="flex items-center rounded-full border border-slate-200 p-0.5 bg-slate-50">
                <button type="button" @click="currency = 'USD'"
                  class="px-3 py-1 text-[11px] font-semibold rounded-full transition-colors"
                  :class="currency === 'USD' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'">
                  $ USD
                </button>
                <button type="button" @click="currency = 'VES'"
                  class="px-3 py-1 text-[11px] font-semibold rounded-full transition-colors"
                  :class="currency === 'VES' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'">
                  Bs. VES
                </button>
              </div>
              <div v-if="currency === 'VES'" class="flex items-center gap-1.5">
                <label class="text-[11px] text-slate-500">Tasa BCV:</label>
                <input v-model.number="exchangeRate" type="number" min="0.0001" step="0.01"
                  @input="exchangeRateTouched = true"
                  class="w-24 h-7 px-2 text-xs text-right border border-slate-300 rounded-md bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          <!-- Origin -->
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1.5">Origen del Pago</label>
            <div class="flex items-center gap-1.5 flex-wrap">
              <button type="button" @click="origin = 'CASH_DRAWER'"
                :disabled="!cashDrawerAvailable"
                :title="!cashDrawerAvailable ? 'Debes abrir turno/gavetero para pagar en efectivo' : ''"
                class="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold rounded-full border transition-colors"
                :class="origin === 'CASH_DRAWER'
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : !cashDrawerAvailable ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'">
                💵 Gavetero / Caja Activa
              </button>
              <button type="button" @click="origin = 'BANK'"
                class="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold rounded-full border transition-colors"
                :class="origin === 'BANK'
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'">
                🏛️ Banco / Transferencia
              </button>
            </div>

            <div v-if="origin === 'CASH_DRAWER'" class="mt-2 text-[11px] rounded-lg px-2.5 py-1.5"
              :class="!turnoActivo ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-blue-50 text-blue-700 border border-blue-200'">
              <template v-if="loadingBalance">Verificando caja...</template>
              <template v-else-if="!turnoActivo">
                <AlertTriangle class="w-3 h-3 inline -mt-0.5 mr-0.5" /> No hay caja abierta.
              </template>
              <template v-else>
                <Wallet class="w-3 h-3 inline -mt-0.5 mr-0.5" />
                Se seleccionará {{ turnoActivo.register_name ? `la Caja ${turnoActivo.register_name}` : 'tu caja activa' }} y se generará el egreso automáticamente.
              </template>
            </div>
            <p v-else class="mt-2 text-[11px] text-slate-400">No afecta ningún gavetero.</p>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Notas (opcional)</label>
            <input v-model="notes" type="text" placeholder="Ej: Pago acordado con el proveedor"
              class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-200 bg-slate-50/60 rounded-b-2xl">
          <button @click="handleClose" class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            Cancelar
          </button>
          <button @click="submit" :disabled="!canSubmit || saving"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm">
            <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
            <Check v-else class="w-4 h-4" />
            {{ saving ? 'Registrando...' : 'Registrar Abono' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { X, Landmark, Wallet, AlertTriangle, Loader2, Check } from 'lucide-vue-next';
import { useNotify } from '@/composables/useNotify';
import { useCajaStore } from '@/stores/caja';
import { useForexRate } from '@/composables/useForexRate';
import { useCxpStore, type ProviderDebt } from '@/stores/cxp';

const props = defineProps<{
  visible: boolean;
  debt: ProviderDebt | null;
}>();

const emit = defineEmits<{
  close: [];
  paid: [payload: { debtId: string | number; purchaseId: string; newRemainingBalance: number }];
}>();

const { success, error: notifyError } = useNotify();
const cajaStore = useCajaStore();
const cxpStore = useCxpStore();
const { rateValue: bcvRateComposable } = useForexRate();

const amountInput = ref<HTMLInputElement | null>(null);
const amountNative = ref<number | null>(null);
const currency = ref<'USD' | 'VES'>('USD');
const exchangeRate = ref<number | null>(null);
const exchangeRateTouched = ref(false);
const origin = ref<'CASH_DRAWER' | 'BANK'>('CASH_DRAWER');
const notes = ref('');
const saving = ref(false);

const turnoActivo = computed(() => cajaStore.turnoActivo);
const loadingBalance = ref(false);
const cashDrawerAvailable = computed(() => loadingBalance.value || !!turnoActivo.value);
const bcvRate = computed(() => exchangeRate.value || bcvRateComposable.value || 0);

// The remaining balance on a Carga-Express-originated debt is always USD (see backend).
const remainingUsd = computed(() => Number(props.debt?.remaining_balance ?? 0));

const amountUsd = computed(() => {
  const n = amountNative.value || 0;
  if (currency.value === 'USD') return n;
  return bcvRate.value > 0 ? n / bcvRate.value : 0;
});

const overpaying = computed(() => amountUsd.value > remainingUsd.value + 0.01);

const paymentMethod = computed(() => {
  if (origin.value === 'CASH_DRAWER') return currency.value === 'VES' ? 'CASH_VES' : 'CASH_USD';
  return currency.value === 'VES' ? 'PAGO_MOVIL' : 'TRANSFER';
});

const canSubmit = computed(() => {
  if (saving.value) return false;
  if (!props.debt?.purchase_id) return false;
  if (!amountNative.value || amountNative.value <= 0) return false;
  if (overpaying.value) return false;
  if (currency.value === 'VES' && !(bcvRate.value > 0)) return false;
  if (origin.value === 'CASH_DRAWER' && !turnoActivo.value) return false;
  return true;
});

function setFullAmount() {
  amountNative.value = currency.value === 'USD'
    ? remainingUsd.value
    : Math.round(remainingUsd.value * bcvRate.value * 100) / 100;
}

async function loadCashDrawerContext() {
  loadingBalance.value = true;
  try {
    if (!cajaStore.turnoActivo) await cajaStore.verificarTurnoActivo();
  } finally {
    loadingBalance.value = false;
  }
}

function resetForm() {
  currency.value = 'USD';
  exchangeRate.value = bcvRateComposable.value > 0 ? bcvRateComposable.value : null;
  exchangeRateTouched.value = false;
  origin.value = 'CASH_DRAWER';
  notes.value = '';
  saving.value = false;
  amountNative.value = remainingUsd.value || null;
}

watch(currency, (v) => {
  // Re-seed the amount when switching currency so "Pago total" stays correct by default,
  // but don't clobber a value the user already typed for a partial payment.
  if (amountNative.value === remainingUsd.value || amountNative.value === Math.round(remainingUsd.value * bcvRate.value * 100) / 100) {
    setFullAmount();
  }
  if (v === 'VES' && !exchangeRate.value && bcvRateComposable.value > 0) {
    exchangeRate.value = bcvRateComposable.value;
  }
});

watch(bcvRateComposable, (v) => {
  if (currency.value === 'VES' && !exchangeRateTouched.value && v > 0) {
    exchangeRate.value = v;
  }
});

function extractErrorMessage(e: any): string {
  const data = e?.data;
  if (data && typeof data === 'object') {
    const firstKey = Object.keys(data)[0];
    const val = firstKey ? data[firstKey] : null;
    if (Array.isArray(val) && val.length) return String(val[0]);
    if (typeof val === 'string') return val;
  }
  return e?.message || 'Error al registrar el abono';
}

async function submit() {
  if (!canSubmit.value || !props.debt?.purchase_id) return;
  saving.value = true;
  try {
    const payload: Record<string, any> = {
      purchase_id: props.debt.purchase_id,
      payment_method: paymentMethod.value,
      notes: notes.value.trim(),
    };
    if (currency.value === 'VES') {
      payload.amount_ves = amountNative.value;
      payload.exchange_rate = exchangeRate.value;
    } else {
      payload.amount_usd = amountNative.value;
      if (exchangeRate.value) payload.exchange_rate = exchangeRate.value;
    }
    if (origin.value === 'CASH_DRAWER') {
      payload.cash_drawer_id = cajaStore.turnoActivo?.id ?? null;
    }

    const res = await cxpStore.registerPayment(payload);

    const amountLabel = amountUsd.value.toFixed(2);
    success(`Abono de $${amountLabel} registrado a ${props.debt.provider_name}.`);
    emit('paid', {
      debtId: props.debt.id,
      purchaseId: props.debt.purchase_id,
      newRemainingBalance: Number(res?.purchase?.pending_balance_usd ?? Math.max(0, remainingUsd.value - amountUsd.value)),
    });
    emit('close');
  } catch (e: any) {
    notifyError(extractErrorMessage(e));
  } finally {
    saving.value = false;
  }
}

function handleClose() {
  if (saving.value) return;
  emit('close');
}

watch(() => props.visible, (v) => {
  if (v) {
    resetForm();
    loadCashDrawerContext();
    nextTick(() => amountInput.value?.focus());
  }
});
</script>
