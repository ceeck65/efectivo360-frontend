<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { toast } from 'vue3-toastify';
import {
  CalendarClock, DollarSign, AlertTriangle, Loader2, HandCoins, Ban, PackageCheck,
} from 'lucide-vue-next';
import { useLayawayManagement, type LayawayListItem } from '@/composables/useLayawayManagement';
import type { LayawayStatus } from '@/composables/useLayaway';
import RegisterLayawayPaymentModal from './RegisterLayawayPaymentModal.vue';

const {
  layaways, loading, actingId, errorMessage,
  fetchLayaways, cancelLayaway,
} = useLayawayManagement();

// El backend no filtra por status server-side (ver useLayawayManagement.ts),
// así que el filtro de estado se aplica sobre la página ya cargada.
type StatusFilter = LayawayStatus | 'ALL';
const statusFilter = ref<StatusFilter>('ALL');
const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'Todos' },
  { value: 'ACTIVE', label: 'Activos' },
  { value: 'COMPLETED', label: 'Liquidados' },
  { value: 'EXPIRED', label: 'Vencidos' },
  { value: 'CANCELLED', label: 'Cancelados' },
];

const filteredLayaways = computed(() =>
  statusFilter.value === 'ALL' ? layaways.value : layaways.value.filter((l) => l.status === statusFilter.value)
);

// ── KPIs (calculados sobre la página cargada: no hay agregado en el backend) ──
const activeLayaways = computed(() => layaways.value.filter((l) => l.status === 'ACTIVE'));
const totalReservedUsd = computed(() =>
  activeLayaways.value.reduce((sum, l) => sum + Number(l.total_usd), 0)
);
const dueSoonCount = computed(() => {
  const now = new Date();
  const in7days = new Date(now);
  in7days.setDate(in7days.getDate() + 7);
  return activeLayaways.value.filter((l) => {
    const exp = new Date(`${l.expiration_date}T00:00:00`);
    return exp >= now && exp <= in7days;
  }).length;
});

function formatUSD(value: string | number): string {
  return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatDate(value: string): string {
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString('es-VE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

const statusBadge: Record<LayawayStatus, { label: string; class: string }> = {
  ACTIVE: { label: 'Activo', class: 'bg-blue-100 text-blue-700' },
  COMPLETED: { label: 'Liquidado', class: 'bg-emerald-100 text-emerald-700' },
  EXPIRED: { label: 'Vencido', class: 'bg-rose-100 text-rose-700' },
  CANCELLED: { label: 'Cancelado', class: 'bg-slate-100 text-slate-500' },
};

// ── Modal de abono ──
const paymentTarget = ref<LayawayListItem | null>(null);
function openPayment(row: LayawayListItem) {
  paymentTarget.value = row;
}
function closePayment() {
  paymentTarget.value = null;
}
function onPaid() {
  toast.success('Abono registrado correctamente');
  fetchLayaways();
}

// ── Cancelación (libera stock reservado) ──
const cancelTarget = ref<LayawayListItem | null>(null);
function askCancel(row: LayawayListItem) {
  cancelTarget.value = row;
}
function dismissCancel() {
  cancelTarget.value = null;
}
async function confirmCancel() {
  if (!cancelTarget.value) return;
  const updated = await cancelLayaway(cancelTarget.value.id);
  if (updated) {
    toast.success('Apartado cancelado: el stock reservado fue reintegrado al inventario');
    cancelTarget.value = null;
    fetchLayaways();
  } else {
    toast.error(errorMessage.value || 'No se pudo cancelar el apartado');
  }
}

onMounted(() => {
  fetchLayaways();
});
</script>

<template>
  <div class="p-4 md:p-6 space-y-4 max-w-[1400px] mx-auto">
    <div>
      <h1 class="text-lg font-black text-slate-800">Gestión de Apartados</h1>
      <p class="text-xs text-slate-400">Controla las reservas activas, sus abonos y vencimientos</p>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-2 lg:grid-cols-3 gap-3">
      <div class="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div class="flex items-center gap-2 text-blue-600">
          <CalendarClock :size="16" />
          <span class="text-[10px] font-bold uppercase tracking-wider">Apartados Activos</span>
        </div>
        <p class="mt-1.5 text-xl font-black text-slate-800">
          <template v-if="loading">…</template>
          <template v-else>{{ activeLayaways.length }}</template>
        </p>
      </div>
      <div class="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div class="flex items-center gap-2 text-emerald-600">
          <DollarSign :size="16" />
          <span class="text-[10px] font-bold uppercase tracking-wider">Total en Reserva</span>
        </div>
        <p class="mt-1.5 text-xl font-black text-slate-800">
          <template v-if="loading">…</template>
          <template v-else>${{ formatUSD(totalReservedUsd) }}</template>
        </p>
      </div>
      <div class="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div class="flex items-center gap-2 text-amber-500">
          <AlertTriangle :size="16" />
          <span class="text-[10px] font-bold uppercase tracking-wider">Próximos a Vencer (7 días)</span>
        </div>
        <p class="mt-1.5 text-xl font-black text-slate-800">
          <template v-if="loading">…</template>
          <template v-else>{{ dueSoonCount }}</template>
        </p>
      </div>
    </div>

    <!-- Filtro de estado -->
    <div class="rounded-xl border border-slate-200/80 bg-white p-3 flex items-center gap-2">
      <div class="flex bg-slate-50 p-0.5 rounded-lg border border-slate-200">
        <button v-for="opt in statusOptions" :key="opt.value" @click="statusFilter = opt.value"
          class="px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-all"
          :class="statusFilter === opt.value ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'">
          {{ opt.label }}
        </button>
      </div>
    </div>

    <!-- Tabla -->
    <div class="rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
              <th class="text-left font-bold px-3 py-2.5">Código</th>
              <th class="text-left font-bold px-3 py-2.5">Cliente</th>
              <th class="text-left font-bold px-3 py-2.5">Fecha Creación</th>
              <th class="text-left font-bold px-3 py-2.5">Fecha Límite</th>
              <th class="text-right font-bold px-3 py-2.5">Total</th>
              <th class="text-right font-bold px-3 py-2.5">Abonado / Pagado</th>
              <th class="text-center font-bold px-3 py-2.5">Estado</th>
              <th class="text-right font-bold px-3 py-2.5">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="loading">
              <td colspan="8" class="px-3 py-10 text-center text-slate-400">
                <Loader2 :size="20" class="animate-spin inline-block" />
              </td>
            </tr>
            <tr v-else-if="errorMessage">
              <td colspan="8" class="px-3 py-10 text-center text-rose-500">{{ errorMessage }}</td>
            </tr>
            <tr v-else-if="filteredLayaways.length === 0">
              <td colspan="8" class="px-3 py-10 text-center text-slate-400">No hay apartados con este filtro</td>
            </tr>
            <tr v-else v-for="row in filteredLayaways" :key="row.id" class="hover:bg-slate-50 transition-colors">
              <td class="px-3 py-2.5 font-mono font-bold text-slate-700">{{ row.reference }}</td>
              <td class="px-3 py-2.5 text-slate-600">{{ row.customer_name }}</td>
              <td class="px-3 py-2.5 text-slate-500 whitespace-nowrap">{{ formatDate(row.created_at) }}</td>
              <td class="px-3 py-2.5 text-slate-500 whitespace-nowrap">{{ formatDate(row.expiration_date) }}</td>
              <td class="px-3 py-2.5 text-right font-bold text-slate-800">${{ formatUSD(row.total_usd) }}</td>
              <td class="px-3 py-2.5 text-right">
                <p class="text-slate-700">${{ formatUSD(row.paid_usd) }} <span class="text-slate-400">({{ row.progress_percent }}%)</span></p>
                <p class="text-[10px] text-amber-600 font-bold" v-if="Number(row.balance_usd) > 0">Saldo ${{ formatUSD(row.balance_usd) }}</p>
              </td>
              <td class="px-3 py-2.5 text-center">
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold" :class="statusBadge[row.status].class">
                  {{ statusBadge[row.status].label }}
                </span>
              </td>
              <td class="px-3 py-2.5">
                <div class="flex justify-end gap-1">
                  <template v-if="row.status === 'ACTIVE'">
                    <button @click="openPayment(row)" :disabled="actingId === row.id"
                      class="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-bold text-blue-600 hover:bg-blue-50 disabled:opacity-40 transition-colors"
                      title="Registrar abono">
                      <HandCoins :size="14" /> Abono
                    </button>
                    <button @click="askCancel(row)" :disabled="actingId === row.id"
                      class="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-bold text-rose-500 hover:bg-rose-50 disabled:opacity-40 transition-colors"
                      title="Cancelar y reintegrar stock">
                      <Ban :size="14" /> Cancelar
                    </button>
                  </template>
                  <span v-else-if="row.status === 'COMPLETED'" class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600" title="Ya se liquidó automáticamente al saldar el último abono">
                    <PackageCheck :size="14" /> Listo para entregar
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <RegisterLayawayPaymentModal
      v-if="paymentTarget"
      :layaway="paymentTarget"
      @close="closePayment"
      @paid="onPaid"
    />

    <!-- Confirmación de cancelación -->
    <div v-if="cancelTarget" class="fixed inset-0 z-[60] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4" @click.self="dismissCancel">
      <div class="bg-white w-full max-w-sm rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] border border-slate-200/80 p-4 space-y-3">
        <div>
          <h3 class="text-sm font-black text-slate-800">Cancelar apartado {{ cancelTarget.reference }}</h3>
          <p class="text-[11px] text-slate-400 mt-0.5">
            Se reintegrará el stock reservado al inventario. Los abonos ya cobrados NO se revierten automáticamente.
          </p>
        </div>
        <div class="flex justify-end gap-2 pt-1">
          <button @click="dismissCancel" :disabled="actingId !== null"
            class="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 disabled:opacity-50 transition-colors">
            Volver
          </button>
          <button @click="confirmCancel" :disabled="actingId !== null"
            class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 transition-colors">
            <Loader2 v-if="actingId !== null" :size="14" class="animate-spin" />
            Confirmar Cancelación
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
