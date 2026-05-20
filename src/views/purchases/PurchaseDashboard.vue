<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';
import { toast } from 'vue3-toastify';

const { fetchApi } = useApi();

// ---- State ----
const loading = ref(true);
const submitting = ref(false);
const showCreate = ref(false);
const errorMsg = ref('');
const searchQuery = ref('');
const statusFilter = ref('');

const summary = ref({ total_pending_usd: 0, orders_count: 0, pending_count: 0, by_status: {} as Record<string, number> });
const orders = ref<any[]>([]);
const vendors = ref<any[]>([]);

// Create form
const createForm = ref({
  vendor_id: null as number | null,
  invoice_number: '',
  control_number: '',
  payment_condition: 'CREDITO' as 'CONTADO' | 'CREDITO' | 'CONSIGNACION',
  total_amount_usd: 0,
  vault_id: null as number | null,
  payment_method: 'EFECTIVO_VES',
  reference_number: '',
  payment_data: {} as any,
});

// Pay modal
const showPayModal = ref(false);
const payingOrder = ref<any>(null);
const payForm = ref({
  vault_id: null as number | null,
  amount_usd: 0,
  payment_method: 'EFECTIVO_VES' as string,
  reference_number: '',
  rate_applied: 0,
  official_rate: 0,
});

// ---- Computed ----
const filteredOrders = computed(() => {
  let list = orders.value;
  if (statusFilter.value) list = list.filter(o => o.status === statusFilter.value);
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(o =>
      o.invoice_number?.toLowerCase().includes(q) ||
      o.vendor_name?.toLowerCase().includes(q)
    );
  }
  return list;
});

const canAbonar = (o: any) => o.status === 'POR_PAGAR' || o.status === 'CONSIGNACION_ABIERTA';

const needReference = computed(() =>
  !['EFECTIVO_USD', 'EFECTIVO_VES'].includes(payForm.value.payment_method)
);

const validPayAmount = computed(() => {
  if (!payingOrder.value) return true;
  if (payingOrder.value.payment_condition === 'CONSIGNACION') return payForm.value.amount_usd > 0;
  return payForm.value.amount_usd > 0 && payForm.value.amount_usd <= payingOrder.value.remaining_amount_usd;
});

const vaultOpts = [
  { id: 1, label: 'Caja Principal Bs (VES)' },
  { id: 2, label: 'Caja Principal USD' },
  { id: 3, label: 'Banco Provincial (VES)' },
  { id: 4, label: 'Cuenta Zelle (USD)' },
];

const paymentMethods = ['EFECTIVO_USD', 'EFECTIVO_VES', 'PAGO_MOVIL', 'TRANSFERENCIA', 'ZELLE'];

// ---- API ----
async function loadAll() {
  loading.value = true;
  try {
    const [s, o, v] = await Promise.all([
      fetchApi('/api/v1/purchases/orders/summary/') as any,
      fetchApi('/api/v1/purchases/orders/') as any,
      fetchApi('/api/v1/purchases/vendors/') as any,
    ]);
    summary.value = s || summary.value;
    orders.value = o?.results || o || [];
    vendors.value = v?.results || v || [];
  } catch (e) { errorMsg.value = 'Error al cargar datos'; }
  finally { loading.value = false; }
}

async function submitCreate() {
  if (!createForm.value.vendor_id || !createForm.value.total_amount_usd) {
    errorMsg.value = 'Proveedor y monto son requeridos.'; return;
  }
  submitting.value = true; errorMsg.value = '';
  try {
    const resp: any = await fetchApi('/api/v1/purchases/orders/', {
      method: 'POST', data: {
        vendor: createForm.value.vendor_id,
        invoice_number: createForm.value.invoice_number,
        control_number: createForm.value.control_number,
        payment_condition: createForm.value.payment_condition,
        total_amount_usd: createForm.value.total_amount_usd,
      },
    });
    const orderId = resp?.id;
    if (orderId && createForm.value.payment_condition === 'CONTADO') {
      await fetchApi(`/api/v1/purchases/orders/${orderId}/process/`, {
        method: 'POST', data: {
          vault_id: createForm.value.vault_id,
          payment_data: {
            payment_method: createForm.value.payment_method,
            reference_number: createForm.value.reference_number,
          },
        },
      });
      toast.success('Compra de contado procesada');
    } else if (orderId) {
      await fetchApi(`/api/v1/purchases/orders/${orderId}/process/`, { method: 'POST' });
      toast.success('Orden creada');
    }
    showCreate.value = false;
    resetCreateForm();
    await loadAll();
  } catch (e: any) { errorMsg.value = e?.data?.error || 'Error al procesar'; }
  finally { submitting.value = false; }
}

async function submitPayment() {
  if (!payForm.value.vault_id || !payForm.value.amount_usd) {
    errorMsg.value = 'Gavetero y monto requeridos.'; return;
  }
  if (!validPayAmount.value) { errorMsg.value = 'Monto supera el saldo pendiente.'; return; }
  submitting.value = true;
  try {
    await fetchApi(`/api/v1/purchases/orders/${payingOrder.value.id}/pay/`, {
      method: 'POST', data: {
        vault_id: payForm.value.vault_id,
        amount_usd: payForm.value.amount_usd,
        payment_data: {
          payment_method: payForm.value.payment_method,
          reference_number: payForm.value.reference_number,
          rate_applied: payForm.value.rate_applied || undefined,
          official_rate: payForm.value.official_rate || undefined,
        },
      },
    });
    toast.success('Abono registrado');
    showPayModal.value = false;
    await loadAll();
  } catch (e: any) { errorMsg.value = e?.data?.error || 'Error'; }
  finally { submitting.value = false; }
}

function openPay(order: any) {
  payingOrder.value = order;
  payForm.value = {
    vault_id: null, amount_usd: order.remaining_amount_usd || 0,
    payment_method: 'EFECTIVO_VES', reference_number: '',
    rate_applied: 0, official_rate: 0,
  };
  showPayModal.value = true;
}

function resetCreateForm() {
  createForm.value = {
    vendor_id: null, invoice_number: '', control_number: '',
    payment_condition: 'CREDITO', total_amount_usd: 0,
    vault_id: null, payment_method: 'EFECTIVO_VES', reference_number: '', payment_data: {},
  };
}

function statusBadge(s: string) {
  const map: Record<string, string> = {
    BORRADOR: 'bg-slate-100 text-slate-600',
    POR_PAGAR: 'bg-amber-50 text-amber-700',
    CONSIGNACION_ABIERTA: 'bg-purple-50 text-purple-700',
    PROCESADO_PAGADO: 'bg-emerald-50 text-emerald-700',
    ANULADO: 'bg-red-50 text-red-600',
  };
  return map[s] || 'bg-slate-100 text-slate-600';
}

function condBadge(c: string) {
  const map: Record<string, string> = {
    CONTADO: 'bg-blue-50 text-blue-700',
    CREDITO: 'bg-amber-50 text-amber-700',
    CONSIGNACION: 'bg-purple-50 text-purple-700',
  };
  return map[c] || 'bg-slate-100 text-slate-600';
}

function fmtUSD(v: number) { return `$${Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }

onMounted(loadAll);
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-6 space-y-6 text-sm">
    <!-- Error banner -->
    <div v-if="errorMsg" class="flex items-center justify-between bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-xs">
      <span>⚠ {{ errorMsg }}</span>
      <button @click="errorMsg = ''" class="text-red-400 hover:text-red-600 font-bold ml-3">&times;</button>
    </div>

    <!-- KPI cards -->
    <div class="grid grid-cols-3 gap-3">
      <div class="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/[0.06] dark:bg-[#141824]">
        <div class="text-xs text-slate-500 mb-1">Cuentas por Pagar</div>
        <div class="text-xl font-bold font-mono text-amber-600">{{ fmtUSD(summary.total_pending_usd) }}</div>
      </div>
      <div class="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/[0.06] dark:bg-[#141824]">
        <div class="text-xs text-slate-500 mb-1">Consignaciones Activas</div>
        <div class="text-xl font-bold font-mono text-purple-600">{{ summary.by_status?.CONSIGNACION_ABIERTA || 0 }}</div>
      </div>
      <div class="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/[0.06] dark:bg-[#141824]">
        <div class="text-xs text-slate-500 mb-1">Total Órdenes</div>
        <div class="text-xl font-bold font-mono text-slate-700 dark:text-slate-300">{{ summary.orders_count }}</div>
      </div>
    </div>

    <!-- Controls -->
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <div class="flex items-center gap-2">
        <input v-model="searchQuery" type="text" placeholder="Buscar factura o proveedor..." class="h-9 w-56 px-3 rounded-lg border border-slate-200 bg-white text-xs dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white" />
        <select v-model="statusFilter" class="h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white">
          <option value="">Todos los estados</option>
          <option value="BORRADOR">Borrador</option>
          <option value="POR_PAGAR">Por Pagar</option>
          <option value="CONSIGNACION_ABIERTA">Consignación Activa</option>
          <option value="PROCESADO_PAGADO">Pagado</option>
          <option value="ANULADO">Anulado</option>
        </select>
      </div>
      <button @click="showCreate = !showCreate" class="inline-flex items-center gap-1.5 h-9 px-4 text-xs font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-700">
        <span class="text-base leading-none">+</span> Nueva Compra
      </button>
    </div>

    <!-- Create form -->
    <div v-if="showCreate" class="rounded-xl border border-slate-200 bg-white p-5 space-y-4 dark:border-white/[0.06] dark:bg-[#141824]">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-slate-900 dark:text-white">Nueva Compra</h3>
        <button @click="showCreate = false" class="text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Proveedor *</label>
          <select v-model="createForm.vendor_id" class="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white">
            <option :value="null">Seleccionar...</option>
            <option v-for="v in vendors" :key="v.id" :value="v.id">{{ v.name }} ({{ v.rif }})</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Condición</label>
          <select v-model="createForm.payment_condition" class="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white">
            <option value="CONTADO">Contado</option>
            <option value="CREDITO">Crédito</option>
            <option value="CONSIGNACION">Consignación</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">N° Factura</label>
          <input v-model="createForm.invoice_number" class="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white" />
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">N° Control Fiscal</label>
          <input v-model="createForm.control_number" class="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white" />
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Monto USD *</label>
          <input v-model.number="createForm.total_amount_usd" type="number" step="0.01" min="0" class="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white" />
        </div>
      </div>

      <!-- Treasury fields (only for CONTADO) -->
      <div v-if="createForm.payment_condition === 'CONTADO'" class="border-t border-slate-100 pt-4 space-y-3 dark:border-white/[0.04]">
        <p class="text-xs text-amber-600 font-medium">Pago inmediato requerido — seleccioná gavetero y método.</p>
        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Gavetero *</label>
            <select v-model="createForm.vault_id" class="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white">
              <option :value="null">Seleccionar...</option>
              <option v-for="v in vaultOpts" :key="v.id" :value="v.id">{{ v.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Método</label>
            <select v-model="createForm.payment_method" class="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white">
              <option v-for="m in paymentMethods" :key="m" :value="m">{{ m }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Referencia</label>
            <input v-model="createForm.reference_number" class="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white" />
          </div>
        </div>
      </div>
      <div v-else class="border-t border-slate-100 pt-3 dark:border-white/[0.04]">
        <p class="text-xs text-slate-500">
          {{ createForm.payment_condition === 'CREDITO' ? 'La orden se creará en estado "Por Pagar". Los abonos se registran posteriormente.' : 'La orden se creará en "Consignación Abierta". El saldo se desconoce al recibir.' }}
        </p>
      </div>

      <div class="flex justify-end gap-2">
        <button @click="showCreate = false" class="h-9 px-4 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 dark:text-slate-400 dark:border-white/[0.08]">Cancelar</button>
        <button @click="submitCreate" :disabled="submitting" class="h-9 px-4 text-xs font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-700 disabled:opacity-60">{{ submitting ? '...' : 'Procesar Compra' }}</button>
      </div>
    </div>

    <!-- Orders table (Tight Design) -->
    <div v-if="loading" class="text-center py-12 text-xs text-slate-400">Cargando...</div>
    <div v-else-if="filteredOrders.length === 0" class="text-center py-12 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">No hay órdenes</div>

    <div v-else class="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/[0.06]">
      <table class="w-full text-xs">
        <thead class="bg-slate-50 dark:bg-white/[0.04] text-left">
          <tr>
            <th class="px-3 py-2 font-medium text-slate-500">Factura</th>
            <th class="px-3 py-2 font-medium text-slate-500">Proveedor</th>
            <th class="px-3 py-2 font-medium text-slate-500">RIF</th>
            <th class="px-3 py-2 font-medium text-slate-500">Condición</th>
            <th class="px-3 py-2 font-medium text-slate-500 text-right">Total</th>
            <th class="px-3 py-2 font-medium text-slate-500 text-right">Pendiente</th>
            <th class="px-3 py-2 font-medium text-slate-500">Estado</th>
            <th class="px-3 py-2 font-medium text-slate-500 text-right"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-white/[0.04]">
          <tr v-for="o in filteredOrders" :key="o.id" class="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
            <td class="px-3 py-2 font-mono text-slate-700 dark:text-slate-300">{{ o.invoice_number || '—' }}</td>
            <td class="px-3 py-2 font-medium text-slate-900 dark:text-white">{{ o.vendor_name || '—' }}</td>
            <td class="px-3 py-2 text-slate-500 font-mono">{{ o.vendor_rif || '—' }}</td>
            <td class="px-3 py-2"><span :class="['inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium', condBadge(o.payment_condition)]">{{ o.payment_condition }}</span></td>
            <td class="px-3 py-2 text-right font-mono text-slate-700 dark:text-slate-300">{{ fmtUSD(o.total_amount_usd) }}</td>
            <td class="px-3 py-2 text-right font-mono font-semibold" :class="o.remaining_amount_usd > 0 ? 'text-amber-600' : 'text-emerald-600'">{{ fmtUSD(o.remaining_amount_usd) }}</td>
            <td class="px-3 py-2"><span :class="['inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium', statusBadge(o.status)]">{{ o.status }}</span></td>
            <td class="px-3 py-2 text-right">
              <button v-if="canAbonar(o)" @click="openPay(o)" class="inline-flex items-center gap-1 h-7 px-3 text-[10px] font-medium text-white bg-slate-700 rounded-lg hover:bg-slate-600">Abonar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pay modal -->
    <Teleport to="body">
      <div v-if="showPayModal && payingOrder" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="showPayModal = false">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm dark:border-white/[0.06] dark:bg-[#141824]">
          <div class="flex items-center justify-between border-b border-slate-200 px-5 py-3 dark:border-white/[0.06]">
            <h3 class="text-sm font-semibold text-slate-900 dark:text-white">Registrar Abono</h3>
            <button @click="showPayModal = false" class="text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
          </div>
          <div class="p-5 space-y-3">
            <div class="rounded-lg bg-slate-50 dark:bg-white/[0.04] p-3 space-y-1.5 text-xs">
              <div class="flex justify-between"><span class="text-slate-500">Proveedor</span><span class="font-medium text-slate-900 dark:text-white">{{ payingOrder.vendor_name }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Factura</span><span class="font-mono">{{ payingOrder.invoice_number || '—' }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Saldo pendiente</span><span class="font-bold text-amber-600">{{ fmtUSD(payingOrder.remaining_amount_usd) }}</span></div>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Monto a abonar *</label>
              <input v-model.number="payForm.amount_usd" type="number" step="0.01" min="0" class="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white" />
              <p v-if="!validPayAmount && payForm.amount_usd > 0" class="text-[10px] text-red-500 mt-1">Supera el saldo pendiente</p>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">Gavetero *</label>
                <select v-model="payForm.vault_id" class="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white">
                  <option :value="null">Seleccionar...</option>
                  <option v-for="v in vaultOpts" :key="v.id" :value="v.id">{{ v.label }}</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">Método</label>
                <select v-model="payForm.payment_method" class="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white">
                  <option v-for="m in paymentMethods" :key="m" :value="m">{{ m }}</option>
                </select>
              </div>
            </div>
            <div v-if="needReference">
              <label class="block text-xs font-medium text-slate-600 mb-1">N° Referencia</label>
              <input v-model="payForm.reference_number" class="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">Tasa Oficial</label>
                <input v-model.number="payForm.official_rate" type="number" step="0.0001" class="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white" />
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">Tasa Aplicada</label>
                <input v-model.number="payForm.rate_applied" type="number" step="0.0001" class="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white" />
              </div>
            </div>
          </div>
          <div class="border-t border-slate-200 px-5 py-3 flex items-center justify-end gap-2 dark:border-white/[0.06]">
            <button @click="showPayModal = false" class="h-8 px-3 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 dark:text-slate-400 dark:border-white/[0.08]">Cancelar</button>
            <button @click="submitPayment" :disabled="submitting || !validPayAmount" class="h-8 px-3 text-xs font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-700 disabled:opacity-50">{{ submitting ? '...' : 'Registrar Abono' }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
