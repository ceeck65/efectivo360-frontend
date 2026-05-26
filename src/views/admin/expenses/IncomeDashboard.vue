<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';
import { useCurrency } from '@/lib/currency';
import { toast } from 'vue3-toastify';
import { X, TrendingUp } from 'lucide-vue-next';
import Swal from 'sweetalert2';

const { fetchApi } = useApi();
const { formatAmount } = useCurrency();
const loading = ref(true), saving = ref(false), wizard = ref(false);
const categories = ref<any[]>([]), history = ref<any[]>([]);

const w = ref({
  category_slug: '',
  source_name: '', amount: 0, currency_code: 'VES',
  description: '', deposit_proof: '',
});

async function loadAll() {
  loading.value = true;
  try {
    const [h] = await Promise.all([
      fetchApi('/api/v1/incomes/requests/?status=') as any,
    ]);
    history.value = h?.requests || [];
    categories.value = [
      { slug: 'inyeccion-capital', name: 'Inyección de Capital' },
      { slug: 'alquiler-espacios', name: 'Alquiler de Espacios / Stands' },
      { slug: 'venta-activos', name: 'Venta de Activos / Mobiliario' },
      { slug: 'servicios-terceros', name: 'Prestación de Servicios a Terceros' },
      { slug: 'comisiones', name: 'Comisiones por Intermediación' },
      { slug: 'devoluciones-proveedores', name: 'Devoluciones de Proveedores' },
      { slug: 'otros-ingresos', name: 'Otros Ingresos Diversos' },
    ];
  } catch (e) { toast.error('Error al cargar'); }
  finally { loading.value = false; }
}

function openWizard() { wizard.value = true; w.value = { category_slug: '', source_name: '', amount: 0, currency_code: 'VES', description: '', deposit_proof: '' }; }
function closeWizard() { wizard.value = false; }

async function submitIncome() {
  if (!w.value.amount || w.value.amount <= 0) { toast.info('Ingresa un monto'); return; }
  if (!w.value.source_name.trim()) { toast.info('Ingresa el nombre del aportante'); return; }
  saving.value = true;
  try {
    await fetchApi('/api/v1/incomes/requests/', { method: 'POST', data: { ...w.value } });
    closeWizard();
    await Swal.fire({ icon: 'success', title: '¡Listo!', text: 'Solicitud de ingreso enviada a Tesorería', timer: 3000, timerProgressBar: true, showConfirmButton: false });
    await loadAll();
  } catch (e) { toast.error('Error al enviar la solicitud'); }
  finally { saving.value = false; }
}

onMounted(loadAll);
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-4 sm:py-6 space-y-8">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-slate-900 dark:text-white">Ingresos Directos Diversos</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Registra entradas administrativas de dinero</p>
      </div>
      <button @click="openWizard" class="inline-flex items-center gap-2 h-10 px-5 text-sm font-medium text-white bg-cyan-600 rounded-xl hover:bg-cyan-700 transition-colors shadow-sm">
        <TrendingUp class="h-4 w-4" />Registrar Ingreso
      </button>
    </div>

    <!-- History table -->
    <div v-if="history.length > 0" class="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/[0.06]">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 dark:bg-white/[0.04] text-left">
          <tr>
            <th class="px-4 py-3 font-medium text-slate-500 whitespace-nowrap">Aportante</th>
            <th class="px-4 py-3 font-medium text-slate-500 whitespace-nowrap">Categoría</th>
            <th class="px-4 py-3 font-medium text-slate-500 text-right whitespace-nowrap">Monto</th>
            <th class="px-4 py-3 font-medium text-slate-500 whitespace-nowrap">Estado</th>
            <th class="px-4 py-3 font-medium text-slate-500 whitespace-nowrap">Fecha</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-white/[0.04]">
          <tr v-for="r in history" :key="r.id" class="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
            <td class="px-4 py-3 font-medium text-slate-900 dark:text-white">{{ r.source_name }}</td>
            <td class="px-4 py-3 text-slate-600 dark:text-slate-400">{{ r.category_name || '—' }}</td>
            <td class="px-4 py-3 text-right font-mono text-slate-900 dark:text-white">{{ formatAmount(r.amount, r.currency_code) }}</td>
            <td class="px-4 py-3"><span :class="['inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium', r.status === 'pending' ? 'bg-amber-100 text-amber-700' : r.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500']">{{ r.status === 'pending' ? 'Pendiente' : r.status === 'completed' ? 'Completado' : 'Cancelado' }}</span></td>
            <td class="px-4 py-3 text-xs text-slate-500">{{ new Date(r.created_at).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' }) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else-if="!loading" class="text-center py-16 rounded-2xl border border-dashed border-slate-200 dark:border-white/[0.08]">
      <TrendingUp class="mx-auto h-10 w-10 text-slate-300 mb-4" />
      <p class="text-slate-500">No hay ingresos registrados aún</p>
    </div>

    <!-- Wizard Modal -->
    <Teleport to="body">
      <div v-if="wizard" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="closeWizard">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg dark:border-white/[0.06] dark:bg-[#141824]">
          <div class="flex items-center justify-between border-b border-slate-200 px-4 sm:px-6 py-4 dark:border-white/[0.06]">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Registrar Ingreso</h3>
            <button @click="closeWizard" class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06]"><X class="h-5 w-5" /></button>
          </div>
          <div class="p-4 sm:p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Categoría</label>
              <select v-model="w.category_slug" class="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white">
                <option value="">Seleccionar...</option>
                <option v-for="c in categories" :key="c.slug" :value="c.slug">{{ c.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Aportante <span class="text-red-500">*</span></label>
              <input v-model="w.source_name" type="text" placeholder="Ej: Socio Juan Pérez, Arrendatario Stand A" class="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white" />
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Monto <span class="text-red-500">*</span></label>
                <input v-model.number="w.amount" type="number" step="0.01" min="0" class="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Moneda</label>
                <select v-model="w.currency_code" class="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white">
                  <option value="VES">VES</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Descripción</label>
              <textarea v-model="w.description" rows="2" placeholder="Detalle del ingreso..." class="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm resize-none dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white"></textarea>
            </div>
          </div>
          <div class="border-t border-slate-200 px-4 sm:px-6 py-4 flex items-center justify-end gap-3 flex-wrap dark:border-white/[0.06]">
            <button @click="closeWizard" class="h-9 px-4 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 dark:text-slate-300 dark:bg-transparent dark:border-white/[0.08]">Cancelar</button>
            <button @click="submitIncome" :disabled="saving" class="h-9 px-4 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:opacity-50">Enviar a Tesorería</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
