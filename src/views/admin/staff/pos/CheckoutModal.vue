<template>
  <div class="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
    <div class="bg-white w-full max-w-md rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] border border-slate-200/80 relative z-10 flex flex-col overflow-hidden text-slate-800" @click.stop>

      <!-- Header -->
      <div class="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <div>
          <h3 class="text-sm font-black uppercase tracking-wider text-slate-800">Finalizar Venta</h3>
          <p class="text-[10px] text-slate-400 font-medium">Configure la divisa y modalidad de pago</p>
        </div>
        <div class="text-right">
          <span class="bg-emerald-50 border border-emerald-200 text-emerald-700 font-black px-3 py-1 rounded-xl text-base shadow-sm block">
            ${{ formatUSD(totalUsd) }}
          </span>
          <span class="text-[10px] text-slate-400 font-bold font-mono block mt-0.5">Bs. {{ formatVES(totalVes) }}</span>
        </div>
      </div>

      <!-- Cuerpo -->
      <div class="p-4 space-y-4 max-h-[75vh] overflow-y-auto">

        <!-- Selector de Moneda -->
        <div class="flex justify-between items-center bg-slate-50 p-1.5 rounded-xl border border-slate-200">
          <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-2">Moneda de Entrada</span>
          <div class="flex bg-white p-0.5 rounded-lg border border-slate-200 shadow-sm">
            <button @click="switchCurrency('USD')"
              class="px-3 py-1 rounded-md text-xs font-black transition-all"
              :class="selectedCurrency === 'USD' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'">USD ($)</button>
            <button @click="switchCurrency('VES')"
              class="px-3 py-1 rounded-md text-xs font-bold transition-all"
              :class="selectedCurrency === 'VES' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'">VES (Bs)</button>
          </div>
        </div>

        <!-- Métodos de Pago Dinámicos -->
        <div class="space-y-1.5">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Método de Pago</span>
          <div v-if="filteredMethods.length === 0" class="text-[11px] text-slate-400 text-center py-3 bg-slate-50 rounded-xl border border-slate-200">
            No hay métodos de pago disponibles para {{ selectedCurrency }}
          </div>
          <div v-else class="grid grid-cols-2 gap-2">
            <button v-for="m in filteredMethods" :key="m.id" @click="selectMethod(m)"
              class="border-2 p-2.5 rounded-xl font-bold text-xs shadow-sm text-center transition-all"
              :class="selectedMethod?.id === m.id ? 'border-blue-600 bg-blue-50 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-500'">
              <span class="block text-sm font-black">{{ m.label || m.name }}</span>
              <span class="text-[9px] text-slate-400 font-medium uppercase mt-0.5 block">{{ m.code }}</span>
            </button>
          </div>
        </div>

        <!-- Referencia para pagos electrónicos -->
        <div v-if="selectedMethod && needsReference(selectedMethod)" class="space-y-1">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            N° de Comprobante / Referencia <span class="text-rose-500">*</span>
          </span>
          <input v-model="reference"
            type="text" placeholder="Ingrese el número de referencia (mín. 4 dígitos)"
            class="w-full h-11 px-3 text-sm border border-slate-300 rounded-xl bg-white text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 shadow-sm" />
        </div>

        <!-- Monto a Recibir -->
        <div class="space-y-1">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Monto a Recibir</span>
          <div class="relative border-2 border-slate-300 bg-slate-50 rounded-xl px-3 py-2.5 flex items-center justify-between focus-within:border-blue-500 shadow-inner transition-all">
            <span class="text-sm font-black text-slate-500 mr-2">{{ selectedCurrency === 'USD' ? '$' : 'Bs.' }}</span>
            <input v-model="amountReceived" type="text" inputmode="decimal" placeholder="0.00"
              class="bg-transparent text-right text-xl font-black text-slate-800 w-full focus:outline-none placeholder:text-slate-300" readonly />
            <div class="flex gap-1 ml-2">
              <button @click="numpadQuick(20)" class="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 px-2 py-1 rounded-lg transition-all shadow-sm">$20</button>
              <button @click="numpadQuick(50)" class="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 px-2 py-1 rounded-lg transition-all shadow-sm">$50</button>
              <button @click="numpadQuick(100)" class="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 px-2 py-1 rounded-lg transition-all shadow-sm">$100</button>
            </div>
          </div>
        </div>

        <!-- Teclado Numérico -->
        <div class="grid grid-cols-4 gap-1.5 bg-slate-100 p-2 rounded-xl border border-slate-200 shadow-inner">
          <button v-for="k in numpadKeys" :key="k" @click="numpadPress(k)"
            class="rounded-lg shadow-sm text-sm transition-all active:translate-y-0.5 active:shadow-none"
            :class="numpadKeyClass(k)">
            <span v-if="k === '⌫'"><Trash2 class="w-3.5 h-3.5 mx-auto" /></span>
            <span v-else-if="k === '✓'">✓</span>
            <span v-else>{{ k }}</span>
          </button>
        </div>

        <!-- Vuelto -->
        <div class="min-h-[52px]">
          <div v-if="changeUSD > 0"
            class="bg-emerald-50 border border-emerald-300 rounded-xl px-3 py-2 text-center transition-all duration-300 shadow-sm">
            <span class="text-[9px] font-bold uppercase tracking-wider text-emerald-600 block">Vuelto a entregar</span>
            <p class="text-base font-black text-emerald-600">${{ formatUSD(changeUSD) }}</p>
            <p class="text-[10px] font-medium text-emerald-500 font-mono">o Bs. {{ formatVES(changeVES) }}</p>
          </div>
        </div>

        <!-- Toggle de Venta a Crédito -->
        <div class="border-t border-b border-slate-100 py-3 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-base">📅</span>
            <div>
              <span class="text-xs font-black text-slate-700 block">¿Registrar como Venta a Crédito?</span>
              <p class="text-[10px] text-slate-400">Asigna esta transacción al módulo de cuentas por cobrar</p>
            </div>
          </div>
          <input type="checkbox" v-model="isCreditSale" class="w-5 h-5 accent-blue-600 cursor-pointer rounded" />
        </div>

        <!-- Interfaz de Crédito -->
        <div v-if="isCreditSale" class="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">

          <!-- Buscador de Cliente -->
          <div class="space-y-1.5 relative">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Cliente Responsable (Obligatorio)</label>
            <div class="flex gap-1.5">
              <input v-model="customerSearch" type="text" placeholder="Buscar por RIF o Nombre..."
                class="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 shadow-sm" />
              <button @click="isRegisteringClient = !isRegisteringClient"
                class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2.5 rounded-lg text-xs shadow-sm transition-all">+ Nuevo</button>
            </div>
            <div v-if="filteredCustomers.length > 0 && customerSearch !== selectedCustomer?.name"
              class="absolute left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-xl max-h-32 overflow-y-auto z-20 mt-1 py-1 text-xs">
              <div v-for="c in filteredCustomers" :key="c.id" @click="selectCustomer(c)"
                class="px-3 py-2 hover:bg-slate-100 cursor-pointer flex justify-between">
                <span class="font-bold text-slate-700">{{ c.name }}</span>
                <span class="text-slate-400">{{ c.docId }}</span>
              </div>
            </div>
            <div v-if="selectedCustomer" class="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-black">C</div>
                <div>
                  <p class="text-xs font-bold text-slate-800">{{ selectedCustomer.name }}</p>
                  <p class="text-[9px] text-slate-400 font-mono">{{ selectedCustomer.docId }}</p>
                </div>
              </div>
              <button @click="selectedCustomer = null; customerSearch = ''" class="text-[10px] text-slate-400 hover:text-rose-500 font-semibold">Cambiar</button>
            </div>
          </div>

          <!-- Formulario de Registro Rápido -->
          <div v-if="isRegisteringClient" class="bg-white p-3 rounded-lg border border-slate-300 shadow-inner space-y-2 text-xs">
            <p class="font-black text-slate-700 uppercase text-[9px] tracking-wider text-blue-600">Registrar Nuevo Cliente</p>
            <input v-model="newClient.name" type="text" placeholder="Razón Social / Nombre Completo"
              class="w-full border border-slate-200 rounded p-2 text-xs focus:outline-none focus:border-blue-400" />
            <div class="grid grid-cols-2 gap-1.5">
              <input v-model="newClient.docId" type="text" placeholder="C.I. / RIF"
                class="w-full border border-slate-200 rounded p-2 text-xs focus:outline-none focus:border-blue-400" />
              <input v-model="newClient.phone" type="text" placeholder="Teléfono"
                class="w-full border border-slate-200 rounded p-2 text-xs focus:outline-none focus:border-blue-400" />
            </div>
            <div class="flex justify-end gap-1.5 pt-1">
              <button @click="isRegisteringClient = false" class="text-slate-400 font-bold px-2 py-1 text-xs">Cancelar</button>
              <button @click="handleRegisterClient"
                class="bg-emerald-600 text-white font-black px-3 py-1 rounded shadow-sm text-xs">Guardar</button>
            </div>
          </div>

          <!-- Modalidad del Crédito -->
          <div class="space-y-2 pt-2 border-t border-slate-200">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Modalidad del Crédito</label>
            <div class="grid grid-cols-2 gap-2 p-0.5 bg-slate-200/60 rounded-lg border border-slate-200">
              <button @click="creditType = 'total'; downPayment = '0.00'"
                class="py-1.5 rounded-md font-bold text-xs transition-all"
                :class="creditType === 'total' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'">Crédito Total</button>
              <button @click="creditType = 'abono'"
                class="py-1.5 rounded-md font-bold text-xs transition-all"
                :class="creditType === 'abono' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'">Con Abono</button>
            </div>
            <div v-if="creditType === 'abono'"
              class="relative border border-slate-300 bg-white rounded-lg p-2 flex items-center justify-between shadow-inner">
              <span class="text-xs font-bold text-slate-400">Monto Abono ({{ selectedCurrency === 'USD' ? '$' : 'Bs.' }})</span>
              <input v-model="downPayment" type="text" inputmode="decimal" placeholder="0.00"
                class="bg-transparent text-right font-black text-slate-800 w-28 focus:outline-none text-sm" />
            </div>
          </div>
        </div>
      </div>

      <!-- Error banner -->
      <div v-if="errorMessage" class="mx-3 mb-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
        <p class="flex-1 text-red-600 text-xs font-medium">{{ errorMessage }}</p>
        <button @click="$emit('clear-error')" aria-label="Cerrar error"
          class="shrink-0 text-red-400 hover:text-red-600 transition-colors">
          <X class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Footer -->
      <div class="p-3 bg-slate-50 border-t border-slate-200 flex gap-2 justify-end items-center">
        <div class="flex-1 text-[10px] text-slate-400 font-mono">
          Tasa BCV: Bs. {{ formatVES(tasaBcv) }}
        </div>
        <button @click="$emit('close')" :disabled="processing"
          class="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed">
          Cancelar
        </button>
        <button @click="confirm"
          :disabled="!canConfirm || processing"
          class="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-[0.98] disabled:shadow-none">
          {{ processing ? 'Procesando…' : (isCreditSale ? 'Procesar Crédito' : 'Procesar Pago') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Trash2, X } from 'lucide-vue-next';
import type { PaymentMethod } from '@/services/treasury.service';

interface CheckoutPayment {
  payment_method_id: string;
  gavetero_id: string;
  amount_usd: number;
  amount_ves: number;
  reference: string;
}

const props = defineProps<{
  totalUsd: number;
  totalVes: number;
  tasaBcv: number;
  paymentMethods: PaymentMethod[];
  processing?: boolean;
  errorMessage?: string | null;
}>();

const emit = defineEmits<{
  confirm: [payments: CheckoutPayment[]];
  close: [];
  'clear-error': [];
}>();

// Moneda
const selectedCurrency = ref<'USD' | 'VES'>('USD');
const amountReceived = ref('');
const reference = ref('');

// Método de pago seleccionado
const selectedMethod = ref<PaymentMethod | null>(null);

const filteredMethods = computed(() => {
  if (!props.paymentMethods || !Array.isArray(props.paymentMethods)) return [];

  const targetCurrency = selectedCurrency.value.toUpperCase().trim();

  return props.paymentMethods.filter(m => {
    if (!m.is_enabled) return false;
    const methodCurrency = (m.gavetero?.currency || m.currency || '').toUpperCase().trim();
    return methodCurrency === targetCurrency;
  });
});

// Auto-select first method when list changes
watch(filteredMethods, (list) => {
  if (list.length > 0 && (!selectedMethod.value || !list.some(m => m.id === selectedMethod.value?.id))) {
    selectedMethod.value = list[0];
  }
}, { immediate: true });

function selectMethod(m: PaymentMethod) {
  selectedMethod.value = m;
  reference.value = '';
}

const cashCodes = new Set(['cash']);
function needsReference(m: PaymentMethod): boolean {
  return !cashCodes.has(m.code?.toLowerCase());
}

// Numpad
const numpadKeys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '00', '0', '.', '⌫', '✓'];

// Crédito
const isCreditSale = ref(false);
const creditType = ref<'total' | 'abono'>('total');
const downPayment = ref('0.00');

// Cliente
const customerSearch = ref('');
const selectedCustomer = ref<{ id: number; name: string; docId: string; phone?: string } | null>(null);
const isRegisteringClient = ref(false);
const newClient = ref({ name: '', docId: '', phone: '' });
const mockCustomers = ref([
  { id: 1, name: 'Inversiones Rigsa', docId: 'J-12345678', phone: '0412-5551234' },
  { id: 2, name: 'Mario Fernández', docId: 'V-14888999', phone: '0424-5559876' },
]);

const filteredCustomers = computed(() => {
  if (!customerSearch.value) return [];
  const q = customerSearch.value.toLowerCase();
  return mockCustomers.value.filter(
    (c) => c.name.toLowerCase().includes(q) || c.docId.includes(q)
  );
});

function switchCurrency(currency: 'USD' | 'VES') {
  selectedCurrency.value = currency;
  if (currency === 'USD') {
    amountReceived.value = props.totalUsd.toFixed(2);
  } else {
    amountReceived.value = (props.totalUsd * props.tasaBcv).toFixed(2);
  }
}

function selectCustomer(c: { id: number; name: string; docId: string; phone?: string }) {
  selectedCustomer.value = c;
  customerSearch.value = c.name;
}

function handleRegisterClient() {
  if (!newClient.value.name || !newClient.value.docId) return;
  const created = { id: Date.now(), ...newClient.value };
  mockCustomers.value.push(created);
  selectCustomer(created);
  newClient.value = { name: '', docId: '', phone: '' };
  isRegisteringClient.value = false;
}

// Init amount on mount
watch(selectedCurrency, (c) => {
  if (c === 'USD') amountReceived.value = props.totalUsd.toFixed(2);
  else amountReceived.value = (props.totalUsd * props.tasaBcv).toFixed(2);
}, { immediate: true });

const receivedUSD = computed(() => {
  if (selectedCurrency.value === 'VES') return 0;
  const raw = amountReceived.value.replace(/[^0-9.]/g, '');
  return parseFloat(raw) || 0;
});

const changeUSD = computed(() => Math.max(0, receivedUSD.value - props.totalUsd));
const changeVES = computed(() => changeUSD.value * props.tasaBcv);

const canConfirm = computed(() => {
  if (isCreditSale.value && !selectedCustomer.value) return false;
  if (!selectedMethod.value) return false;
  if (needsReference(selectedMethod.value) && reference.value.trim().length < 4) return false;
  if (selectedCurrency.value === 'USD' && receivedUSD.value <= 0) return false;
  return true;
});

function numpadPress(k: string) {
  if (k === '✓') { confirm(); return; }
  if (k === '⌫') { amountReceived.value = amountReceived.value.slice(0, -1); return; }
  if (k === '.' && amountReceived.value.includes('.')) return;
  amountReceived.value += k;
}

function numpadQuick(amount: number) {
  amountReceived.value = amount.toFixed(2);
}

function numpadKeyClass(k: string): string {
  if (k === '⌫') return 'bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-bold py-2.5 flex items-center justify-center';
  if (k === '✓') return 'bg-emerald-500 hover:bg-emerald-600 text-white font-black py-2.5 shadow-md col-span-2';
  return 'bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-black py-2.5';
}

function confirm() {
  if (!canConfirm.value || !selectedMethod.value || props.processing) return;

  const amountUsd = selectedCurrency.value === 'USD' ? receivedUSD.value : 0;
  const amountVes = selectedCurrency.value === 'VES'
    ? parseFloat(amountReceived.value.replace(/[^0-9.]/g, '')) || 0
    : 0;

  const payments: CheckoutPayment[] = [{
    payment_method_id: selectedMethod.value.id,
    gavetero_id: selectedMethod.value.gavetero?.id || '',
    amount_usd: amountUsd,
    amount_ves: amountVes,
    reference: needsReference(selectedMethod.value) ? reference.value.trim() : '',
  }];

  emit('confirm', payments);
}

function formatUSD(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatVES(n: number): string {
  return n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
</script>
