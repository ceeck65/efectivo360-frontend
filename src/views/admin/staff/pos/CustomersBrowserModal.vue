<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { X, Search, SearchX, Phone, Mail, MapPin, Pencil, CreditCard, CalendarClock, ArrowLeft, Users, History, ArrowUpCircle, ArrowDownCircle } from 'lucide-vue-next';
import { useCustomers, type Customer } from '@/composables/useCustomers';
import { useCreditAccount } from '@/composables/useCreditAccount';
import { useLayawayManagement } from '@/composables/useLayawayManagement';
import type { LayawayStatus } from '@/composables/useLayaway';
import { fetchApi } from '@/composables/useApi';
import CustomerFormModal from '@/views/admin/customers/CustomerFormModal.vue';

const emit = defineEmits<{ close: [] }>();

// ═══════ Lista + buscador ═══════
const { customers, loading, fetchCustomers } = useCustomers();
const search = ref('');
let searchTimer: ReturnType<typeof setTimeout> | null = null;

function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => fetchCustomers(search.value.trim()), 300);
}

onMounted(() => fetchCustomers());

function initials(c: Customer): string {
  const first = (c.first_name || '').trim();
  const last = (c.last_name || '').trim();
  if (first && last) return (first[0] + last[0]).toUpperCase();
  if (first) return first.slice(0, 2).toUpperCase();
  return '??';
}
function displayName(c: Customer): string {
  return [c.first_name, c.last_name].filter(Boolean).join(' ') || 'Sin nombre';
}
function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
}
function formatUSD(n: number | string): string {
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ═══════ Selección + panel de detalle (en móvil, sustituye la lista) ═══════
const selected = ref<Customer | null>(null);
const mobileView = ref<'list' | 'detail'>('list');

function selectCustomer(c: Customer) {
  selected.value = c;
  mobileView.value = 'detail';
}
function backToList() {
  mobileView.value = 'list';
}

// ═══════ Estado Fiado/Crédito del cliente seleccionado ═══════
const { status: creditStatus, loading: creditLoading, fetchCreditStatus, reset: resetCreditStatus } = useCreditAccount();

const DEBT_STATUS_BADGE: Record<string, { label: string; class: string }> = {
  solvent: { label: 'Solvente', class: 'bg-emerald-100 text-emerald-700' },
  pending: { label: 'Pendiente', class: 'bg-amber-100 text-amber-700' },
  'over-limit': { label: 'Vencido / Sobre Límite', class: 'bg-rose-100 text-rose-700' },
};

// ═══════ Apartados del cliente seleccionado ═══════
const { layaways, loading: layawaysLoading, fetchLayaways } = useLayawayManagement();

const LAYAWAY_STATUS_BADGE: Record<LayawayStatus, { label: string; class: string }> = {
  ACTIVE: { label: 'Activo', class: 'bg-blue-100 text-blue-700' },
  COMPLETED: { label: 'Liquidado', class: 'bg-emerald-100 text-emerald-700' },
  EXPIRED: { label: 'Vencido', class: 'bg-rose-100 text-rose-700' },
  CANCELLED: { label: 'Cancelado', class: 'bg-slate-100 text-slate-500' },
};

// ═══════ Historial de Fiado/Crédito: cargos (ventas fiadas) + abonos ═══════
interface CreditChargeEntry {
  id: number;
  created_at: string;
  charge_usd: string;
  balance_after_usd: string;
  sale_id: number | null;
}
interface CreditInstallmentEntry {
  id: number;
  applied_usd: string;
  payment_voucher: string;
  notes: string;
  paid_at: string;
}
interface CreditHistoryRow {
  key: string;
  type: 'charge' | 'payment';
  date: string;
  amount: number;
  balanceAfter?: number;
  note?: string;
}

const creditCharges = ref<CreditChargeEntry[]>([]);
const creditInstallments = ref<CreditInstallmentEntry[]>([]);
const creditHistoryLoading = ref(false);

const creditHistory = computed<CreditHistoryRow[]>(() => {
  const charges: CreditHistoryRow[] = creditCharges.value.map((e) => ({
    key: `charge-${e.id}`,
    type: 'charge',
    date: e.created_at,
    amount: Number(e.charge_usd),
    balanceAfter: Number(e.balance_after_usd),
    note: e.sale_id ? `Venta #${e.sale_id}` : undefined,
  }));
  const payments: CreditHistoryRow[] = creditInstallments.value.map((e) => ({
    key: `payment-${e.id}`,
    type: 'payment',
    date: e.paid_at,
    amount: Number(e.applied_usd),
    note: e.payment_voucher || e.notes || undefined,
  }));
  return [...charges, ...payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
});

async function loadCreditHistory(customerId: string) {
  creditHistoryLoading.value = true;
  try {
    const res = await fetchApi<{ results: CreditChargeEntry[] }>('/api/v1/reports/credit-ledger/', {
      params: { customer_id: customerId },
    });
    creditCharges.value = res?.results ?? [];
  } catch {
    creditCharges.value = [];
  }
  try {
    const res = await fetchApi<{ installments: CreditInstallmentEntry[] }>('/api/receivables/customer-credit-statement/', {
      params: { customer_id: customerId },
    });
    creditInstallments.value = res?.installments ?? [];
  } catch {
    creditInstallments.value = [];
  }
  creditHistoryLoading.value = false;
}

watch(selected, (c) => {
  if (c) {
    fetchCreditStatus(c.id);
    fetchLayaways(c.id);
    loadCreditHistory(c.id);
  } else {
    resetCreditStatus();
    layaways.value = [];
    creditCharges.value = [];
    creditInstallments.value = [];
  }
});

// ═══════ Editar cliente sin salir del navegador de clientes ═══════
const showEditor = ref(false);

function onCustomerSaved(updated: Customer) {
  showEditor.value = false;
  selected.value = updated;
  const idx = customers.value.findIndex((c) => c.id === updated.id);
  if (idx !== -1) customers.value[idx] = updated;
}
</script>

<template>
  <div class="fixed inset-0 z-50 bg-white flex flex-col text-slate-800">

    <!-- Header -->
    <div class="shrink-0 p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <Users class="w-4 h-4 text-blue-600" />
        <div>
          <h2 class="text-sm font-black uppercase tracking-wider text-slate-800">Clientes</h2>
          <p class="text-[10px] text-slate-400 font-medium">Consulta datos, fiado/crédito y apartados sin salir del POS</p>
        </div>
      </div>
      <button @click="emit('close')" aria-label="Cerrar"
        class="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
        <X :size="20" />
      </button>
    </div>

    <div class="flex-1 flex min-h-0">

      <!-- ═══════ Columna: lista + buscador ═══════ -->
      <div class="w-full md:w-96 md:border-r md:border-slate-200 flex-col min-h-0"
        :class="mobileView === 'list' ? 'flex' : 'hidden md:flex'">
        <div class="p-3 shrink-0">
          <div class="relative">
            <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              v-model="search"
              @input="onSearchInput"
              type="text"
              autofocus
              placeholder="Buscar por RIF, Cédula, Nombre o Teléfono…"
              class="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto px-3 pb-3 min-h-0">
          <div v-if="loading" class="space-y-1.5">
            <div v-for="i in 5" :key="i" class="animate-pulse flex items-center gap-2.5 px-3 py-2 rounded-xl border border-slate-100">
              <div class="w-8 h-8 rounded-full bg-slate-200 shrink-0"></div>
              <div class="flex-1 space-y-1.5">
                <div class="h-2.5 w-2/3 bg-slate-200 rounded"></div>
                <div class="h-2 w-1/3 bg-slate-200 rounded"></div>
              </div>
            </div>
          </div>

          <div v-else-if="customers.length === 0" class="flex flex-col items-center gap-2.5 py-10 text-center">
            <SearchX :size="22" class="text-slate-300" />
            <p class="text-xs text-slate-400 font-medium max-w-[220px]">Ningún cliente coincide con esa búsqueda.</p>
          </div>

          <div v-else class="space-y-1.5">
            <button
              v-for="c in customers"
              :key="c.id"
              @click="selectCustomer(c)"
              class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition-colors"
              :class="selected?.id === c.id ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'"
            >
              <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 text-[11px] font-black">
                {{ initials(c) }}
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-xs font-bold text-slate-800 truncate">{{ displayName(c) }}</p>
                <span class="text-[10px] text-slate-500 font-mono font-semibold">{{ c.identity_document }}</span>
              </div>
              <span v-if="Number(c.saldo_deudor_usd) > 0" class="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600">
                Debe ${{ formatUSD(c.saldo_deudor_usd) }}
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- ═══════ Columna: detalle del cliente seleccionado ═══════ -->
      <div class="flex-1 flex-col min-h-0 overflow-y-auto p-4 space-y-4"
        :class="mobileView === 'detail' ? 'flex' : 'hidden md:flex'">

        <div v-if="!selected" class="h-full flex flex-col items-center justify-center gap-2 text-center text-slate-400">
          <Users :size="28" class="text-slate-300" />
          <p class="text-xs font-medium max-w-[240px]">Selecciona un cliente de la lista para ver su ficha completa.</p>
        </div>

        <template v-else>
          <button class="md:hidden inline-flex items-center gap-1 text-xs font-bold text-blue-600" @click="backToList">
            <ArrowLeft :size="14" /> Volver a la lista
          </button>

          <!-- Datos del cliente -->
          <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-11 h-11 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 text-sm font-black">
                {{ initials(selected) }}
              </div>
              <div class="min-w-0">
                <p class="text-sm font-black text-slate-800 truncate">{{ displayName(selected) }}</p>
                <p class="text-[11px] text-slate-500 font-mono font-semibold">{{ selected.identity_document }}</p>
                <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                  <span v-if="selected.phone" class="inline-flex items-center gap-1 text-[10px] text-slate-500">
                    <Phone :size="11" /> {{ selected.phone }}
                  </span>
                  <span v-if="selected.email" class="inline-flex items-center gap-1 text-[10px] text-slate-500">
                    <Mail :size="11" /> {{ selected.email }}
                  </span>
                  <span v-if="selected.address" class="inline-flex items-center gap-1 text-[10px] text-slate-500">
                    <MapPin :size="11" /> {{ selected.address }}
                  </span>
                </div>
              </div>
            </div>
            <button @click="showEditor = true" title="Editar datos del cliente"
              class="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <Pencil class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Fiado / Crédito -->
          <div class="bg-white border border-slate-200 rounded-xl p-4">
            <div class="flex items-center justify-between mb-3">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard :size="13" /> Fiado / Crédito
              </p>
              <span v-if="creditStatus" :class="(DEBT_STATUS_BADGE[creditStatus.debt_status] || DEBT_STATUS_BADGE.solvent).class"
                class="text-[10px] font-bold px-2 py-0.5 rounded-full">
                {{ (DEBT_STATUS_BADGE[creditStatus.debt_status] || DEBT_STATUS_BADGE.solvent).label }}
              </span>
            </div>
            <div v-if="creditLoading" class="text-[11px] text-slate-400 py-2 text-center">Consultando cuenta…</div>
            <div v-else-if="creditStatus" class="grid grid-cols-3 gap-2">
              <div class="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-center">
                <p class="text-[9px] text-slate-400 uppercase font-bold">Límite</p>
                <p class="text-sm font-black text-slate-700">${{ formatUSD(creditStatus.credit_limit) }}</p>
              </div>
              <div class="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-center">
                <p class="text-[9px] text-slate-400 uppercase font-bold">Deuda</p>
                <p class="text-sm font-black text-amber-600">${{ formatUSD(creditStatus.balance_usd) }}</p>
              </div>
              <div class="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-center">
                <p class="text-[9px] text-slate-400 uppercase font-bold">Disponible</p>
                <p class="text-sm font-black text-emerald-600">${{ formatUSD(creditStatus.available_credit_usd) }}</p>
              </div>
            </div>
            <p v-else class="text-[11px] text-rose-500 py-2 text-center">No se pudo consultar la cuenta de crédito.</p>

            <!-- Historial: ventas fiadas (cargos) + abonos registrados -->
            <div class="mt-3 pt-3 border-t border-dashed border-slate-200">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <History :size="12" /> Historial de Movimientos
              </p>
              <div v-if="creditHistoryLoading" class="text-[11px] text-slate-400 py-2 text-center">Consultando historial…</div>
              <p v-else-if="creditHistory.length === 0" class="text-[11px] text-slate-400 py-2 text-center">
                Sin ventas fiadas ni abonos registrados.
              </p>
              <div v-else class="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                <div v-for="row in creditHistory" :key="row.key"
                  class="flex items-center justify-between gap-2 border border-slate-100 rounded-lg px-2.5 py-2">
                  <div class="flex items-center gap-2 min-w-0">
                    <ArrowUpCircle v-if="row.type === 'charge'" :size="14" class="text-rose-500 shrink-0" />
                    <ArrowDownCircle v-else :size="14" class="text-emerald-500 shrink-0" />
                    <div class="min-w-0">
                      <p class="text-[11px] font-bold text-slate-700">
                        {{ row.type === 'charge' ? 'Venta Fiada' : 'Abono' }}
                      </p>
                      <p class="text-[10px] text-slate-400 truncate">
                        {{ formatDate(row.date) }}<span v-if="row.note"> · {{ row.note }}</span>
                      </p>
                    </div>
                  </div>
                  <div class="text-right shrink-0">
                    <p class="text-xs font-black" :class="row.type === 'charge' ? 'text-rose-600' : 'text-emerald-600'">
                      {{ row.type === 'charge' ? '+' : '-' }}${{ formatUSD(row.amount) }}
                    </p>
                    <p v-if="row.balanceAfter !== undefined" class="text-[9px] text-slate-400">
                      Saldo: ${{ formatUSD(row.balanceAfter) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Apartados -->
          <div class="bg-white border border-slate-200 rounded-xl p-4">
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <CalendarClock :size="13" /> Apartados
            </p>
            <div v-if="layawaysLoading" class="text-[11px] text-slate-400 py-2 text-center">Consultando apartados…</div>
            <p v-else-if="layaways.length === 0" class="text-[11px] text-slate-400 py-2 text-center">Este cliente no tiene apartados registrados.</p>
            <div v-else class="space-y-2">
              <div v-for="l in layaways" :key="l.id" class="border border-slate-200 rounded-lg px-3 py-2.5">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-xs font-bold text-slate-700 font-mono">{{ l.reference }}</span>
                  <span :class="LAYAWAY_STATUS_BADGE[l.status].class" class="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                    {{ LAYAWAY_STATUS_BADGE[l.status].label }}
                  </span>
                </div>
                <div class="flex items-center justify-between mt-1.5 text-[11px]">
                  <span class="text-slate-500">Total <span class="font-bold text-slate-700">${{ formatUSD(l.total_usd) }}</span></span>
                  <span class="text-slate-500">Saldo <span class="font-bold text-rose-600">${{ formatUSD(l.balance_usd) }}</span></span>
                  <span class="text-slate-400">Vence {{ l.expiration_date }}</span>
                </div>
                <div class="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div class="h-full bg-emerald-500" :style="{ width: `${Math.min(100, Number(l.progress_percent))}%` }"></div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Editor de cliente (reusa el mismo formulario de /admin/customers) -->
    <CustomerFormModal
      v-if="showEditor && selected"
      :customer="selected"
      @saved="onCustomerSaved"
      @close="showEditor = false"
    />
  </div>
</template>
