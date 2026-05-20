<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';
import { toast } from 'vue3-toastify';
import { useCurrency } from '@/lib/currency';
import { Check, X, Loader2, Clock, User, Tag, FileText } from 'lucide-vue-next';

const { fetchApi } = useApi();
const { formatAmount } = useCurrency();
const loading = ref(true);
const requests = ref<any[]>([]);
const paymentInstances = ref<any[]>([]);

const rejectModal = ref(false);
const rejectingId = ref<number | null>(null);
const rejectionReason = ref('');

const approveModal = ref(false);
const approvingId = ref<number | null>(null);
const selectedInstanceId = ref<number | null>(null);
const approving = ref(false);
const rejecting = ref(false);

const curReq = computed(() => requests.value.find((r: any) => r.id === approvingId.value) || null);

async function loadData() {
  loading.value = true;
  try {
    const [r, pi] = await Promise.all([
      fetchApi('/api/v1/incomes/requests/?status=PENDING') as any,
      fetchApi('/api/v1/treasury/payment-instances/?active=true') as any,
    ]);
    requests.value = r?.requests || [];
    paymentInstances.value = (pi?.instances || []).map((i: any) => ({
      id: i.id, label: i.label, blueprint_name: i.blueprint_name,
      vault_label: i.vault_label, currency_code: i.currency_code || '',
    }));
  } catch (e) { toast.error('Error al cargar'); }
  finally { loading.value = false; }
}

const filteredInstances = computed(() => {
  if (!curReq.value) return paymentInstances.value;
  return paymentInstances.value.filter((pi: any) =>
    !curReq.value.currency_code || pi.currency_code === curReq.value.currency_code
  );
});

function openReject(id: number) { rejectingId.value = id; rejectionReason.value = ''; rejectModal.value = true; }
function closeRejectModal() { rejectModal.value = false; rejectingId.value = null; rejectionReason.value = ''; }
async function submitReject() {
  if (!rejectionReason.value.trim()) { toast.info('Escribe un motivo'); return; }
  rejecting.value = true;
  try {
    await fetchApi(`/api/v1/incomes/requests/${rejectingId.value}/reject/`, { method: 'POST', data: { rejection_reason: rejectionReason.value } });
    toast.success('Solicitud rechazada');
    requests.value = requests.value.filter(r => r.id !== rejectingId.value);
    closeRejectModal();
  } catch (e) { toast.error('Error al rechazar'); }
  finally { rejecting.value = false; }
}

function openApprove(id: number) { approvingId.value = id; selectedInstanceId.value = null; approveModal.value = true; }
function closeApproveModal() { approveModal.value = false; approvingId.value = null; selectedInstanceId.value = null; }
async function submitApprove() {
  if (!selectedInstanceId.value) { toast.info('Selecciona un método de pago'); return; }
  approving.value = true;
  try {
    await fetchApi('/api/v1/treasury/approve-income/', { method: 'POST', data: { request_id: approvingId.value, payment_instance_id: selectedInstanceId.value } });
    toast.success('Ingreso aprobado y depositado');
    requests.value = requests.value.filter(r => r.id !== approvingId.value);
    closeApproveModal();
  } catch (e: any) { toast.error(e?.data?.error || 'Error al aprobar'); }
  finally { approving.value = false; }
}

onMounted(loadData);
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Ingresos Pendientes</h3>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{{ requests.length }} solicitud(es)</p>
      </div>
    </div>

    <div v-if="loading" class="text-center py-12"><Loader2 class="mx-auto h-6 w-6 animate-spin text-slate-400" /><p class="mt-3 text-sm text-slate-400">Cargando...</p></div>
    <div v-else-if="requests.length === 0" class="text-center py-16 rounded-2xl border border-dashed border-slate-200 dark:border-white/[0.08]">
      <Check class="mx-auto h-10 w-10 text-emerald-400 mb-4" />
      <h4 class="text-base font-medium text-slate-600 dark:text-slate-400 mb-2">No hay ingresos pendientes</h4>
      <p class="text-sm text-slate-500">Todas las solicitudes de ingreso han sido procesadas.</p>
    </div>

    <div v-else class="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/[0.06]">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 dark:bg-white/[0.04] text-left">
          <tr>
            <th class="px-4 py-3 font-medium text-slate-500">Solicitante</th>
            <th class="px-4 py-3 font-medium text-slate-500">Categoría</th>
            <th class="px-4 py-3 font-medium text-slate-500">Aportante</th>
            <th class="px-4 py-3 font-medium text-slate-500 text-right">Monto</th>
            <th class="px-4 py-3 font-medium text-slate-500">Fecha</th>
            <th class="px-4 py-3 font-medium text-slate-500">Descripción</th>
            <th class="px-4 py-3 font-medium text-slate-500 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-white/[0.04]">
          <tr v-for="r in requests" :key="r.id" class="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
            <td class="px-4 py-3"><div class="flex items-center gap-2"><User class="h-4 w-4 text-slate-400" /><span class="font-medium text-slate-900 dark:text-white">{{ r.requested_by_name }}</span></div></td>
            <td class="px-4 py-3"><span v-if="r.category_name" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 dark:bg-white/[0.06] dark:text-slate-300"><Tag class="h-3 w-3" /> {{ r.category_name }}</span><span v-else class="text-slate-400">—</span></td>
            <td class="px-4 py-3 text-slate-700 dark:text-slate-300">{{ r.source_name || '—' }}</td>
            <td class="px-4 py-3 text-right"><span class="font-mono font-semibold text-slate-900 dark:text-white">{{ formatAmount(r.amount, r.currency_code) }}</span><span class="text-xs text-slate-400 ml-1">{{ r.currency_code }}</span></td>
            <td class="px-4 py-3 text-slate-500 text-xs"><div class="flex items-center gap-1"><Clock class="h-3 w-3" />{{ new Date(r.created_at).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}</div></td>
            <td class="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-[200px] truncate"><div class="flex items-center gap-1"><FileText class="h-3.5 w-3.5 shrink-0" /><span class="truncate">{{ r.description || '—' }}</span></div></td>
            <td class="px-4 py-3 text-right"><div class="flex items-center justify-end gap-2">
              <button @click="openApprove(r.id)" class="inline-flex items-center gap-1 h-8 px-3 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"><Check class="h-3.5 w-3.5" />Aprobar</button>
              <button @click="openReject(r.id)" class="inline-flex items-center gap-1 h-8 px-3 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"><X class="h-3.5 w-3.5" />Rechazar</button>
            </div></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Reject Modal -->
    <Teleport to="body"><div v-if="rejectModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="closeRejectModal"><div class="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md dark:border-white/[0.06] dark:bg-[#141824]"><div class="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-white/[0.06]"><h3 class="text-lg font-semibold text-slate-900 dark:text-white">Rechazar Ingreso</h3><button @click="closeRejectModal" class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06]"><X class="h-5 w-5" /></button></div><div class="p-6 space-y-4"><div><label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Motivo <span class="text-red-500">*</span></label><textarea v-model="rejectionReason" rows="3" placeholder="Explica por qué se rechaza..." class="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm resize-none dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white"></textarea></div></div><div class="border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3 dark:border-white/[0.06]"><button @click="closeRejectModal" class="h-9 px-4 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 dark:text-slate-300 dark:bg-transparent dark:border-white/[0.08]">Cancelar</button><button @click="submitReject" :disabled="rejecting" class="h-9 px-4 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"><Loader2 v-if="rejecting" class="h-4 w-4 animate-spin inline mr-1" />Confirmar</button></div></div></div></Teleport>

    <!-- Approve Modal -->
    <Teleport to="body"><div v-if="approveModal && curReq" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="closeApproveModal"><div class="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md dark:border-white/[0.06] dark:bg-[#141824]"><div class="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-white/[0.06]"><h3 class="text-lg font-semibold text-slate-900 dark:text-white">Aprobar y Depositar Ingreso</h3><button @click="closeApproveModal" class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06]"><X class="h-5 w-5" /></button></div><div class="p-6 space-y-4"><div class="rounded-xl bg-slate-50 dark:bg-white/[0.04] p-4 space-y-2"><div class="flex justify-between items-center"><span class="text-sm text-slate-500">Aportante</span><span class="text-sm font-medium text-slate-900 dark:text-white">{{ curReq.source_name }}</span></div><div class="flex justify-between items-center"><span class="text-sm text-slate-500">Monto</span><span class="text-sm font-mono font-bold text-slate-900 dark:text-white">{{ formatAmount(curReq.amount, curReq.currency_code) }}</span></div><div class="flex justify-between items-center" v-if="curReq.description"><span class="text-sm text-slate-500">Descripción</span><span class="text-sm text-slate-700 dark:text-slate-300 text-right max-w-[220px] truncate">{{ curReq.description }}</span></div></div><div><label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Método de Pago / Cuenta Destino <span class="text-red-500">*</span></label><select v-model="selectedInstanceId" class="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white"><option :value="null">Seleccionar...</option><option v-for="pi in filteredInstances" :key="pi.id" :value="pi.id">{{ pi.label }} ({{ pi.blueprint_name }} {{ pi.vault_label ? '— ' + pi.vault_label : '' }})</option></select><p v-if="filteredInstances.length === 0" class="text-xs text-amber-600 mt-1">No hay métodos configurados para {{ curReq.currency_code }}.</p></div></div><div class="border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3 dark:border-white/[0.06]"><button @click="closeApproveModal" class="h-9 px-4 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 dark:text-slate-300 dark:bg-transparent dark:border-white/[0.08]">Cancelar</button><button @click="submitApprove" :disabled="approving" class="h-9 px-4 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 dark:bg-cyan-600 dark:hover:bg-cyan-700"><Loader2 v-if="approving" class="h-4 w-4 animate-spin inline mr-1" />Depositar Ingreso</button></div></div></div></Teleport>
  </div>
</template>
