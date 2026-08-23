<template>
  <div class="max-w-6xl mx-auto px-4 py-8 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h2 class="text-2xl font-bold text-slate-900">Cuentas por Pagar</h2>
        <p class="text-sm text-slate-400 mt-1">Deudas con proveedores y mercancía en consignación</p>
      </div>

      <div class="relative" ref="newDebtMenuRef">
        <button @click="showNewDebtMenu = !showNewDebtMenu"
          class="inline-flex items-center gap-2 h-10 px-5 text-sm font-medium text-white bg-cyan-600 rounded-xl hover:bg-cyan-700 transition-colors">
          <Plus class="h-4 w-4" /> Nueva Deuda <ChevronDown class="h-3.5 w-3.5" />
        </button>
        <div v-if="showNewDebtMenu"
          class="absolute right-0 top-full mt-1.5 w-72 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-20">
          <button @click="goToPurchaseCredit"
            class="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors flex items-start gap-3">
            <Package class="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <span>
              <span class="block text-sm font-medium text-slate-800">Compra de Mercancía</span>
              <span class="block text-xs text-slate-400">Factura de inventario con crédito de proveedor</span>
            </span>
          </button>
          <button @click="openOperationalDebtModal"
            class="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors flex items-start gap-3">
            <Receipt class="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              <span class="block text-sm font-medium text-slate-800">Gasto Operativo / Servicio</span>
              <span class="block text-xs text-slate-400">Alquiler, servicios, fletes — no inventariable</span>
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="rounded-2xl border border-slate-200 bg-white p-5">
        <div class="flex items-center gap-2 mb-2">
          <TrendingDown class="h-4 w-4 text-rose-500" />
          <span class="text-xs font-medium text-slate-500">Total Pendiente</span>
        </div>
        <div class="text-xl font-bold font-mono text-rose-600">{{ formatAmount(cxpStore.kpi.total_pending, 'USD') }}</div>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-5">
        <div class="flex items-center gap-2 mb-2">
          <Clock class="h-4 w-4 text-amber-500" />
          <span class="text-xs font-medium text-slate-500">Vencidas</span>
        </div>
        <div class="text-xl font-bold font-mono text-amber-600">{{ cxpStore.kpi.overdue_count }} facturas</div>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-5">
        <div class="flex items-center gap-2 mb-2">
          <Building2 class="h-4 w-4 text-blue-500" />
          <span class="text-xs font-medium text-slate-500">Próx. 7 días</span>
        </div>
        <div class="text-xl font-bold font-mono text-blue-600">{{ cxpStore.kpi.due_in_7_days }} facturas</div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex items-center gap-1 border-b border-slate-200">
      <button @click="activeTab = 'debts'"
        class="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px"
        :class="activeTab === 'debts' ? 'border-cyan-600 text-cyan-700' : 'border-transparent text-slate-500 hover:text-slate-700'">
        📄 Facturas a Crédito
      </button>
      <button @click="activeTab = 'consignments'"
        class="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px"
        :class="activeTab === 'consignments' ? 'border-cyan-600 text-cyan-700' : 'border-transparent text-slate-500 hover:text-slate-700'">
        📦 Mercancía en Consignación
      </button>
    </div>

    <!-- ── Tab: Facturas a Crédito ─────────────────────────────────── -->
    <div v-if="activeTab === 'debts'" class="space-y-4">
      <select v-model="statusFilter" @change="cxpStore.loadDebts(statusFilter)"
        class="h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm">
        <option value="UNPAID">Pendientes</option>
        <option value="PARTIALLY_PAID">Parcialmente Pagadas</option>
        <option value="PAID">Pagadas</option>
        <option value="">Todas</option>
      </select>

      <div v-if="cxpStore.loadingDebts" class="text-center py-12 text-sm text-slate-400">Cargando...</div>
      <div v-else-if="cxpStore.debts.length === 0" class="text-center py-16 rounded-2xl border border-dashed border-slate-200">
        <p class="text-sm text-slate-400">No hay deudas registradas</p>
      </div>

      <div v-else class="overflow-x-auto rounded-xl border border-slate-200">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 text-left">
            <tr>
              <th class="px-4 py-3 font-medium text-slate-500 whitespace-nowrap">Proveedor</th>
              <th class="px-4 py-3 font-medium text-slate-500 whitespace-nowrap">Factura</th>
              <th class="px-4 py-3 font-medium text-slate-500 text-right whitespace-nowrap">Total</th>
              <th class="px-4 py-3 font-medium text-slate-500 text-right whitespace-nowrap">Restante</th>
              <th class="px-4 py-3 font-medium text-slate-500 whitespace-nowrap">Vence</th>
              <th class="px-4 py-3 font-medium text-slate-500 whitespace-nowrap">Estado</th>
              <th class="px-4 py-3 font-medium text-slate-500 text-right whitespace-nowrap"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="d in cxpStore.debts" :key="d.id" class="hover:bg-slate-50 transition-colors">
              <td class="px-4 py-3 font-medium text-slate-900">{{ d.provider_name }}</td>
              <td class="px-4 py-3 font-mono text-xs text-slate-500">{{ d.invoice_number }}</td>
              <td class="px-4 py-3 text-right font-mono text-slate-700">{{ formatAmount(d.total_amount, d.currency_code) }}</td>
              <td class="px-4 py-3 text-right font-mono font-semibold text-slate-900">{{ formatAmount(d.remaining_balance, d.currency_code) }}</td>
              <td class="px-4 py-3 text-xs" :class="isOverdue(d) ? 'text-red-500 font-medium' : 'text-slate-500'">{{ d.due_date }}</td>
              <td class="px-4 py-3">
                <span :class="['inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium', statusBadgeClass(d.status)]">
                  {{ d.status }}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <button v-if="d.status !== 'PAID' && d.purchase_id" @click="openPayment(d)"
                    class="inline-flex items-center gap-1 h-8 px-3 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                    <Landmark class="h-3.5 w-3.5" /> Abonar
                  </button>
                  <span v-else-if="d.status !== 'PAID'" class="text-[10px] text-slate-400" title="Deuda operativa registrada manualmente — sin factura de inventario vinculada">
                    Sin factura vinculada
                  </span>
                  <button @click="openDetail(d)"
                    class="inline-flex items-center gap-1 h-8 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    <Eye class="h-3.5 w-3.5" /> Ver
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── Tab: Mercancía en Consignación ──────────────────────────── -->
    <ConsignmentTable v-else @settle="openConsignmentSettle" />

    <!-- Payment Modal -->
    <PaymentModal :visible="showPaymentModal" :debt="paymentDebt" @close="showPaymentModal = false" @paid="onPaid" />

    <!-- Consignment Settle Modal -->
    <ConsignmentSettleModal
      :visible="showConsignmentSettleModal"
      :item="consignmentSettleItem"
      :supplier-name="consignmentSettleSupplierName"
      @close="showConsignmentSettleModal = false"
      @settled="onConsignmentSettled"
    />

    <!-- Operational Debt Modal (Gasto Operativo / Servicio) -->
    <Teleport to="body">
      <div v-if="showOperationalDebtModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="showOperationalDebtModal = false">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md">
          <div class="flex items-center justify-between border-b px-6 py-4">
            <div>
              <h3 class="text-base font-semibold text-slate-800">Gasto Operativo / Servicio</h3>
              <p class="text-xs text-slate-400 mt-0.5">Alquiler, servicios, fletes — deuda no inventariable</p>
            </div>
            <button @click="showOperationalDebtModal = false"><X class="h-5 w-5 text-slate-400" /></button>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Proveedor / Beneficiario</label>
              <input v-model="operationalForm.provider_name" placeholder="Ej: Inmobiliaria XYZ"
                class="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">N° Factura / Referencia</label>
              <input v-model="operationalForm.invoice_number" placeholder="Ej: ALQ-08-2026"
                class="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm" />
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">Monto</label>
                <input v-model.number="operationalForm.total_amount" type="number" min="0" step="0.01"
                  class="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm" />
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">Moneda</label>
                <select v-model="operationalForm.currency_code" class="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm">
                  <option value="VES">VES</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Vence</label>
              <input v-model="operationalForm.due_date" type="date" class="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm" />
            </div>
          </div>
          <div class="border-t px-6 py-4 flex items-center justify-end gap-3">
            <button @click="showOperationalDebtModal = false" class="h-9 px-4 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg">
              Cancelar
            </button>
            <button @click="submitOperationalDebt" :disabled="savingOperationalDebt"
              class="h-9 px-4 text-sm font-medium text-white bg-cyan-600 rounded-lg disabled:opacity-50">
              {{ savingOperationalDebt ? 'Guardando...' : 'Registrar' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Detail Modal -->
    <Teleport to="body">
      <div v-if="showDetailModal && detailDebt" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="closeDetail">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg">
          <div class="flex items-center justify-between border-b px-6 py-4">
            <h3 class="text-lg font-semibold">Detalle de Deuda</h3>
            <button @click="closeDetail"><X class="h-5 w-5 text-slate-400" /></button>
          </div>
          <div class="p-6 space-y-4">
            <div v-if="detailLoading" class="text-center py-6 text-sm text-slate-400">Cargando...</div>
            <template v-else>
              <div class="rounded-xl bg-slate-50 p-4 space-y-2">
                <div class="flex justify-between"><span class="text-sm text-slate-500">Proveedor</span><span>{{ detailDebt.provider_name }}</span></div>
                <div class="flex justify-between"><span class="text-sm text-slate-500">Factura</span><span class="font-mono">{{ detailDebt.invoice_number }}</span></div>
                <div class="flex justify-between"><span class="text-sm text-slate-500">Total</span><span class="font-bold">{{ formatAmount(detailDebt.total_amount, detailDebt.currency_code) }}</span></div>
                <div class="flex justify-between"><span class="text-sm text-slate-500">Pagado</span><span class="font-semibold text-emerald-600">{{ formatAmount(detailDebt.total_amount - detailDebt.remaining_balance, detailDebt.currency_code) }}</span></div>
                <div class="flex justify-between"><span class="text-sm text-slate-500">Restante</span><span class="font-bold text-rose-600">{{ formatAmount(detailDebt.remaining_balance, detailDebt.currency_code) }}</span></div>
                <div class="flex justify-between"><span class="text-sm text-slate-500">Vence</span><span :class="isOverdue(detailDebt) ? 'text-red-500' : ''">{{ detailDebt.due_date }}</span></div>
                <div class="flex justify-between"><span class="text-sm text-slate-500">Estado</span><span>{{ detailDebt.status }}</span></div>
              </div>
              <h4 class="font-semibold mt-4">Historial de Pagos</h4>
              <div v-if="detailPayments.length === 0" class="text-sm text-slate-400 py-3 text-center">Sin abonos registrados</div>
              <div v-else class="space-y-2 max-h-64 overflow-y-auto pr-1">
                <div v-for="p in detailPayments" :key="p.id" class="rounded-lg border border-slate-100 bg-white px-4 py-3">
                  <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span class="font-semibold font-mono">{{ formatAmount(p.amount_to_pay, detailDebt.currency_code) }}</span>
                    <span :class="['inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium', paymentStatusClass(p.status)]">
                      {{ p.status === 'APPROVED' ? 'Aprobado' : p.status === 'REJECTED' ? 'Rechazado' : 'Pendiente' }}
                    </span>
                  </div>
                  <div class="text-xs text-slate-400 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                    <span>{{ p.requested_by_name }} · {{ new Date(p.created_at).toLocaleString('es-VE') }}</span>
                    <span v-if="p.payment_method_name" class="text-slate-500">· {{ p.payment_method_name }}</span>
                  </div>
                  <p v-if="p.rejection_reason" class="text-xs text-red-400 mt-1">Motivo: {{ p.rejection_reason }}</p>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRouter } from 'vue-router';
import { fetchApi } from '@/composables/useApi';
import { useCurrency } from '@/lib/currency';
import { useNotify } from '@/composables/useNotify';
import { useCxpStore, type ProviderDebt, type ConsignmentItem } from '@/stores/cxp';
import {
  X, Plus, ChevronDown, Clock, Building2, TrendingDown, Eye, Package, Receipt, Landmark,
} from 'lucide-vue-next';
import PaymentModal from './PaymentModal.vue';
import ConsignmentTable from './ConsignmentTable.vue';
import ConsignmentSettleModal from './ConsignmentSettleModal.vue';

const router = useRouter();
const { formatAmount } = useCurrency();
const { success, error: notifyError } = useNotify();
const cxpStore = useCxpStore();

const activeTab = ref<'debts' | 'consignments'>('debts');
const statusFilter = ref('UNPAID');

// ── "+ Nueva Deuda" menu ──
const showNewDebtMenu = ref(false);
const newDebtMenuRef = ref<HTMLElement | null>(null);

function goToPurchaseCredit() {
  showNewDebtMenu.value = false;
  router.push({ path: '/admin/inventory/purchases/new', query: { payment_source: 'SUPPLIER_CREDIT' } });
}

function openOperationalDebtModal() {
  showNewDebtMenu.value = false;
  showOperationalDebtModal.value = true;
}

function onClickOutsideNewDebtMenu(e: MouseEvent) {
  if (newDebtMenuRef.value && !newDebtMenuRef.value.contains(e.target as Node)) {
    showNewDebtMenu.value = false;
  }
}

// ── Operational debt (Gasto Operativo / Servicio) ──
const showOperationalDebtModal = ref(false);
const savingOperationalDebt = ref(false);
const operationalForm = ref({ provider_name: '', invoice_number: '', total_amount: 0, currency_code: 'VES', due_date: '' });

async function submitOperationalDebt() {
  savingOperationalDebt.value = true;
  try {
    await cxpStore.createOperationalDebt(operationalForm.value);
    success('Deuda operativa registrada');
    showOperationalDebtModal.value = false;
    operationalForm.value = { provider_name: '', invoice_number: '', total_amount: 0, currency_code: 'VES', due_date: '' };
    await cxpStore.loadDebts(statusFilter.value);
  } catch {
    notifyError('Error al guardar la deuda');
  } finally {
    savingOperationalDebt.value = false;
  }
}

// ── Payment modal ──
const showPaymentModal = ref(false);
const paymentDebt = ref<ProviderDebt | null>(null);

function openPayment(debt: ProviderDebt) {
  paymentDebt.value = debt;
  showPaymentModal.value = true;
}

async function onPaid() {
  showPaymentModal.value = false;
  await cxpStore.loadDebts(statusFilter.value);
}

// ── Consignment settle modal ──
const showConsignmentSettleModal = ref(false);
const consignmentSettleItem = ref<ConsignmentItem | null>(null);
const consignmentSettleSupplierName = ref('');

function openConsignmentSettle(item: ConsignmentItem, supplierName: string) {
  consignmentSettleItem.value = item;
  consignmentSettleSupplierName.value = supplierName;
  showConsignmentSettleModal.value = true;
}

async function onConsignmentSettled() {
  showConsignmentSettleModal.value = false;
  await cxpStore.loadConsignments();
}

// ── Detail modal ──
const showDetailModal = ref(false);
const detailDebt = ref<any>(null);
const detailPayments = ref<any[]>([]);
const detailLoading = ref(false);

async function openDetail(debt: ProviderDebt) {
  showDetailModal.value = true;
  detailLoading.value = true;
  detailDebt.value = debt;
  detailPayments.value = [];
  try {
    const d: any = await fetchApi(`/api/v1/cxp/debts/${debt.id}/detail/`);
    detailDebt.value = d;
    detailPayments.value = d?.payments || [];
  } catch {
    notifyError('Error al cargar el detalle');
  } finally {
    detailLoading.value = false;
  }
}
function closeDetail() {
  showDetailModal.value = false;
  detailDebt.value = null;
  detailPayments.value = [];
}

// ── Helpers ──
function isOverdue(d: { due_date: string; status: string }): boolean {
  return new Date(d.due_date) < new Date() && d.status !== 'PAID';
}
function statusBadgeClass(s: string): string {
  if (s === 'PAID') return 'bg-emerald-50 text-emerald-700';
  if (s === 'PARTIALLY_PAID') return 'bg-amber-50 text-amber-700';
  return 'bg-slate-100 text-slate-600';
}
function paymentStatusClass(s: string): string {
  if (s === 'APPROVED') return 'bg-emerald-50 text-emerald-700';
  if (s === 'REJECTED') return 'bg-red-50 text-red-600';
  return 'bg-amber-50 text-amber-700';
}

watch(activeTab, (tab) => {
  if (tab === 'consignments' && cxpStore.consignmentSuppliers.length === 0 && !cxpStore.consignmentsError) {
    cxpStore.loadConsignments();
  }
});

onMounted(() => {
  cxpStore.loadDebts(statusFilter.value);
  document.addEventListener('click', onClickOutsideNewDebtMenu);
});
onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutsideNewDebtMenu);
});
</script>
