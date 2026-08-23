<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="handleClose" />
      <div class="relative bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl">
        <!-- Header -->
        <div class="flex items-start justify-between px-5 py-4 border-b border-slate-200">
          <div class="min-w-0">
            <h3 class="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              <PackageOpen class="w-4 h-4 text-purple-500" /> Liquidar Consignación
            </h3>
            <p class="text-[11px] text-slate-400 mt-0.5 truncate">{{ supplierName }} — {{ item?.product_name }}</p>
          </div>
          <button @click="handleClose" class="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 shrink-0">
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="px-5 py-4 space-y-4">
          <!-- Sold summary -->
          <div class="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-1.5">
            <div class="flex justify-between text-xs">
              <span class="text-slate-500">SKU</span>
              <code class="font-mono text-slate-700">{{ item?.product_sku || '—' }}</code>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-slate-500">Vendidos por POS</span>
              <span class="font-semibold text-slate-800">{{ formatQty(item?.sold_units) }}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-slate-500">Ya liquidado</span>
              <span class="text-slate-600">{{ formatQty(item?.settled_units) }}</span>
            </div>
            <div class="flex justify-between items-baseline pt-1.5 mt-1 border-t border-slate-200">
              <span class="text-xs text-slate-500">Pendiente por Liquidar</span>
              <div class="text-right">
                <p class="text-base font-bold text-purple-700">{{ formatQty(pendingUnits) }} u.</p>
                <p class="text-[11px] text-slate-400">${{ pendingAmountUsd.toFixed(2) }} (${{ Number(item?.unit_cost_usd ?? 0).toFixed(2) }}/u.)</p>
              </div>
            </div>
          </div>

          <!-- Units to settle -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-medium text-slate-600">
                Unidades a Liquidar <span class="text-red-400">*</span>
              </label>
              <button type="button" @click="unitsToSettle = pendingUnits" class="text-[11px] text-blue-600 hover:underline">
                Liquidar todo
              </button>
            </div>
            <input
              ref="unitsInput"
              v-model.number="unitsToSettle"
              type="number" min="0.001" step="0.001"
              class="w-full h-11 px-3 text-base font-semibold border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500"
              @keydown.enter.prevent="submit"
            />
            <p class="text-[11px] text-slate-400 mt-1">
              = <strong class="text-slate-600">${{ amountUsd.toFixed(2) }}</strong>
              <span v-if="bcvRate > 0">(Bs. {{ (amountUsd * bcvRate).toFixed(2) }})</span>
            </p>
            <p v-if="exceedsPending" class="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
              <AlertTriangle class="w-3 h-3" /> No puede exceder las unidades pendientes por liquidar.
            </p>
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
                  ? 'bg-purple-50 border-purple-300 text-purple-700'
                  : !cashDrawerAvailable ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'">
                💵 Gavetero / Caja Activa
              </button>
              <button type="button" @click="origin = 'BANK_TRANSFER'"
                class="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold rounded-full border transition-colors"
                :class="origin === 'BANK_TRANSFER'
                  ? 'bg-purple-50 border-purple-300 text-purple-700'
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
                Se descontará de {{ turnoActivo.register_name ? `la Caja ${turnoActivo.register_name}` : 'tu caja activa' }} al entregar el efectivo al proveedor.
              </template>
            </div>
            <p v-else class="mt-2 text-[11px] text-slate-400">No afecta ningún gavetero.</p>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Notas (opcional)</label>
            <input v-model="notes" type="text" placeholder="Ej: Liquidación semanal"
              class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500" />
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-200 bg-slate-50/60 rounded-b-2xl">
          <button @click="handleClose" class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            Cancelar
          </button>
          <button @click="submit" :disabled="!canSubmit || saving"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm">
            <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
            <Check v-else class="w-4 h-4" />
            {{ saving ? 'Liquidando...' : 'Confirmar Liquidación' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { X, PackageOpen, Wallet, AlertTriangle, Loader2, Check } from 'lucide-vue-next';
import { useNotify } from '@/composables/useNotify';
import { useCajaStore } from '@/stores/caja';
import { useForexRate } from '@/composables/useForexRate';
import { useCxpStore, type ConsignmentItem } from '@/stores/cxp';

const props = defineProps<{
  visible: boolean;
  item: ConsignmentItem | null;
  supplierName: string;
}>();

const emit = defineEmits<{
  close: [];
  settled: [];
}>();

const { success, error: notifyError } = useNotify();
const cajaStore = useCajaStore();
const cxpStore = useCxpStore();
const { rateValue: bcvRate } = useForexRate();

const unitsInput = ref<HTMLInputElement | null>(null);
const unitsToSettle = ref<number | null>(null);
const origin = ref<'CASH_DRAWER' | 'BANK_TRANSFER'>('CASH_DRAWER');
const notes = ref('');
const saving = ref(false);

const turnoActivo = computed(() => cajaStore.turnoActivo);
const loadingBalance = ref(false);
const cashDrawerAvailable = computed(() => loadingBalance.value || !!turnoActivo.value);

const pendingUnits = computed(() => Number(props.item?.pending_units_to_settle ?? 0));
const pendingAmountUsd = computed(() => Number(props.item?.amount_to_pay_usd ?? 0));
const unitCost = computed(() => Number(props.item?.unit_cost_usd ?? 0));

const amountUsd = computed(() => Math.round((unitsToSettle.value || 0) * unitCost.value * 100) / 100);
const exceedsPending = computed(() => (unitsToSettle.value || 0) > pendingUnits.value + 0.0005);

const canSubmit = computed(() => {
  if (saving.value) return false;
  if (!props.item) return false;
  if (!unitsToSettle.value || unitsToSettle.value <= 0) return false;
  if (exceedsPending.value) return false;
  if (origin.value === 'CASH_DRAWER' && !turnoActivo.value) return false;
  return true;
});

function formatQty(v: number | undefined | null): string {
  return (Number(v) || 0).toLocaleString('es', { minimumFractionDigits: 0, maximumFractionDigits: 3 });
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
  unitsToSettle.value = pendingUnits.value || null;
  origin.value = 'CASH_DRAWER';
  notes.value = '';
  saving.value = false;
}

function extractErrorMessage(e: any): string {
  const data = e?.data;
  if (data && typeof data === 'object') {
    const firstKey = Object.keys(data)[0];
    const val = firstKey ? data[firstKey] : null;
    if (Array.isArray(val) && val.length) return String(val[0]);
    if (typeof val === 'string') return val;
  }
  return e?.message || 'Error al liquidar la consignación';
}

async function submit() {
  if (!canSubmit.value || !props.item) return;
  saving.value = true;
  try {
    const payload: Record<string, any> = {
      consignment_lot_id: props.item.id,
      units_to_settle: unitsToSettle.value,
      payment_source: origin.value,
      notes: notes.value.trim(),
    };
    if (origin.value === 'CASH_DRAWER') {
      payload.cash_session_id = cajaStore.turnoActivo?.id ?? null;
    }

    await cxpStore.settleConsignment(payload);

    success(`Liquidación de $${amountUsd.value.toFixed(2)} registrada a ${props.supplierName}.`);
    emit('settled');
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
    nextTick(() => unitsInput.value?.focus());
  }
});
</script>
