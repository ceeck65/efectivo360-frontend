<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="relative w-64">
        <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
        <input
          v-model="search"
          type="text"
          placeholder="Buscar planes..."
          class="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
        />
      </div>
      <button
        @click="openCreate"
        class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700"
      >
        <Plus class="h-4 w-4" />
        Nuevo Plan
      </button>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm dark:border-white/[0.06] dark:bg-[#141824]">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50/50 dark:bg-[#1a1f2e]/50">
            <tr>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">SKU</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Nombre</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Precio</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Límites</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Módulos</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Tenants</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right dark:text-slate-400">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-white/[0.06]">
            <tr v-if="loading">
              <td colspan="7" class="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                <RefreshCw class="mx-auto mb-2 h-5 w-5 animate-spin" />
                Cargando...
              </td>
            </tr>
            <tr v-else-if="filteredData.length === 0">
              <td colspan="7" class="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                No hay planes para mostrar.
              </td>
            </tr>
            <tr v-else v-for="plan in filteredData" :key="plan.id" :class="['hover:bg-slate-50/50 dark:hover:bg-[#1a1f2e]/50', !plan.is_active && 'opacity-50']">
              <td class="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">{{ plan.sku }}</td>
              <td class="px-6 py-4">
                <div class="font-medium text-slate-900 dark:text-white">{{ plan.name }}</div>
                <div v-if="plan.description" class="text-sm text-slate-500 dark:text-slate-400">{{ plan.description }}</div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm font-medium text-slate-900 dark:text-white">
                  <span v-if="plan.config?.is_courtesy" class="text-green-600 font-medium">Gratis</span>
                  <div v-else-if="plan.prices" class="space-y-1">
                    <div v-for="(price, freq) in plan.prices" :key="String(freq)" class="flex items-center gap-1">
                      <span class="font-medium">${{ (price as any).amount }}</span>
                      <span class="text-xs text-slate-500 dark:text-slate-400">({{ getFrequencyLabel(String(freq)) }})</span>
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                <div class="space-y-1">
                  <div v-if="plan.config?.limits?.doc_limit !== undefined">
                    Docs: {{ plan.config.limits.doc_limit === -1 ? '∞' : plan.config.limits.doc_limit }}
                  </div>
                  <div v-if="plan.config?.limits?.vault_limit !== undefined">
                    Vault: {{ plan.config.limits.vault_limit === -1 ? '∞' : plan.config.limits.vault_limit }}
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-wrap gap-1">
                  <span v-for="mod in (plan.config?.modules || []).slice(0, 2)" :key="mod"
                    class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300">
                    {{ getModuleName(mod) }}
                  </span>
                  <span v-if="(plan.config?.modules || []).length > 2" class="text-xs text-slate-400">
                    +{{ (plan.config?.modules || []).length - 2 }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{{ plan.tenant_count || 0 }}</td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button @click="openEdit(plan)" class="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" title="Editar Plan">
                    <Edit class="h-4 w-4" />
                  </button>
                  <button @click="toggleActive(plan)" :class="['p-1', plan.is_active ? 'text-green-600 hover:text-green-700' : 'text-slate-400 hover:text-slate-600']" :title="plan.is_active ? 'Desactivar' : 'Activar'">
                    <Power :class="['h-4 w-4', !plan.is_active && 'rotate-90']" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <SimplePagination
        v-if="total > 0"
        :page="page"
        :page-size="pageSize"
        :total="total"
        @update:page="page = $event; loadData()"
        @update:page-size="pageSize = $event; page = 1; loadData()"
      />
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 dark:bg-[#141824] max-h-[90vh] overflow-y-auto">
        <div class="border-b border-slate-200 p-6 dark:border-white/[0.06]">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">{{ editingItem ? 'Editar' : 'Crear' }} Plan</h3>
        </div>
        <div class="p-6 space-y-6">
          <!-- Basic Info -->
          <div class="space-y-4">
            <h4 class="text-sm font-medium text-slate-900 dark:text-white">Información Básica</h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">SKU *</label>
                <input v-model="form.sku" type="text" :disabled="!!editingItem" placeholder="Ej: COMPETENCIA" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300 disabled:bg-slate-100 dark:disabled:bg-[#1a1f2e]" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Nombre *</label>
                <input v-model="form.name" type="text" placeholder="Ej: Competencia" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Descripción (HTML)</label>
              <QuillEditor
                v-model:content="form.description"
                content-type="html"
                theme="snow"
                toolbar="full"
                class="bg-white rounded-lg border border-slate-200 dark:border-white/[0.06]"
                :style="{ minHeight: '180px' }"
              />
            </div>
          </div>

          <!-- Prices -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h4 class="text-sm font-medium text-slate-900 dark:text-white">Precios</h4>
              <button type="button" @click="addPrice" :disabled="form.config?.is_courtesy" class="inline-flex items-center gap-1 px-3 py-1 text-sm bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                <Plus class="h-3 w-3" /> Añadir
              </button>
            </div>
            <div v-for="(price, idx) in form.pricesList" :key="price.id" class="border border-slate-200 rounded-lg p-4 space-y-3 dark:border-white/[0.06]">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium">Precio #{{ idx + 1 }}</span>
                <button type="button" @click="removePrice(price.id)" class="text-red-600 hover:text-red-800"><X class="h-4 w-4" /></button>
              </div>
              <div class="grid grid-cols-3 gap-3">
                <div>
                  <label class="block text-xs font-medium text-slate-700 mb-1 dark:text-slate-300">Frecuencia</label>
                  <select v-model="price.frequency" :disabled="form.config?.is_courtesy" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg dark:border-white/[0.06] dark:bg-[#1a1f2e] disabled:bg-gray-100">
                    <option value="">Seleccionar...</option>
                    <option value="monthly">Mensual</option>
                    <option value="quarterly">Trimestral</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-700 mb-1 dark:text-slate-300">Monto</label>
                  <input v-model="price.amount" type="number" step="0.01" :disabled="form.config?.is_courtesy" placeholder="0.00" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg dark:border-white/[0.06] dark:bg-[#1a1f2e] disabled:bg-gray-100" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-700 mb-1 dark:text-slate-300">Moneda</label>
                  <select v-model="price.currency" :disabled="form.config?.is_courtesy" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg dark:border-white/[0.06] dark:bg-[#1a1f2e] disabled:bg-gray-100">
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="MXN">MXN</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Limits -->
          <div class="space-y-4">
            <h4 class="text-sm font-medium text-slate-900 dark:text-white">Límites</h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Límite de Documentos (-1 = ∞)</label>
                <input v-model.number="form.config.limits.doc_limit" type="number" min="-1" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Límite de Vault (-1 = ∞)</label>
                <input v-model.number="form.config.limits.vault_limit" type="number" min="-1" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300" />
              </div>
            </div>
          </div>

          <!-- Options -->
          <div class="space-y-4">
            <h4 class="text-sm font-medium text-slate-900 dark:text-white">Opciones</h4>
            <div class="space-y-3">
              <label class="flex items-center gap-2">
                <input type="checkbox" v-model="form.config.is_trial" class="h-4 w-4 rounded border-slate-300 text-cyan-600" />
                <span class="text-sm text-slate-700 dark:text-slate-300">Periodo de prueba</span>
              </label>
              <label class="flex items-center gap-2">
                <input type="checkbox" v-model="form.config.has_promo" class="h-4 w-4 rounded border-slate-300 text-cyan-600" />
                <span class="text-sm text-slate-700 dark:text-slate-300">Tiene promoción activa</span>
              </label>
              <label class="flex items-center gap-2">
                <input type="checkbox" v-model="form.config.is_courtesy" class="h-4 w-4 rounded border-slate-300 text-cyan-600" />
                <span class="text-sm text-slate-700 dark:text-slate-300">Plan de cortesía (gratis)</span>
              </label>
            </div>
          </div>

          <!-- Modules -->
          <div class="space-y-4">
            <h4 class="text-sm font-medium text-slate-900 dark:text-white">Módulos</h4>
            <div class="grid grid-cols-2 gap-3">
              <label v-for="mod in modules" :key="mod.ulid" class="flex items-center gap-2">
                <input type="checkbox" :checked="form.config.modules.includes(mod.ulid)" @change="toggleModule(mod.ulid)" class="h-4 w-4 rounded border-slate-300 text-cyan-600" />
                <span class="text-sm text-slate-700 dark:text-slate-300">{{ mod.name }}</span>
              </label>
            </div>
          </div>

          <!-- Active -->
          <div v-if="editingItem" class="flex items-center gap-3">
            <input id="plan-active" v-model="form.is_active" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-cyan-600" />
            <label for="plan-active" class="text-sm text-slate-700 dark:text-slate-300">Activo</label>
          </div>
        </div>
        <div class="border-t border-slate-200 p-6 flex justify-end gap-2 dark:border-white/[0.06]">
          <button @click="closeModal" class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 dark:text-slate-300 dark:border-white/[0.06] dark:hover:bg-[#1a1f2e]">
            Cancelar
          </button>
          <button @click="saveItem" :disabled="saving" class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:opacity-50">
            <RefreshCw v-if="saving" class="h-4 w-4 animate-spin" />
            <span>{{ saving ? 'Guardando...' : (editingItem ? 'Guardar cambios' : 'Crear Plan') }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Search, Plus, Edit, Power, RefreshCw, X } from 'lucide-vue-next';
import { SimplePagination } from '@/shared/index.js';
import { useApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';
import Swal from 'sweetalert2';
import { QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';

interface PlanPrice {
  id: string;
  frequency: string;
  amount: string;
  currency: string;
}

interface AppModule {
  ulid: string;
  name: string;
}

interface Plan {
  id: number;
  ulid: string;
  sku: string;
  name: string;
  description?: string;
  prices?: Record<string, { amount: string; currency: string }>;
  config?: {
    modules?: string[];
    limits?: { doc_limit?: number; vault_limit?: number };
    is_trial?: boolean;
    has_promo?: boolean;
    is_courtesy?: boolean;
  };
  is_active: boolean;
  tenant_count?: number;
}

const { fetchApi } = useApi();
const { success: notifySuccess, error: notifyError } = useNotify();

const loading = ref(true);
const saving = ref(false);
const data = ref<Plan[]>([]);
const modules = ref<AppModule[]>([]);
const search = ref('');
const page = ref(1);
const pageSize = ref(100);
const total = ref(0);

const showModal = ref(false);
const editingItem = ref<Plan | null>(null);

const defaultForm = () => ({
  sku: '',
  name: '',
  description: '',
  is_active: true,
  pricesList: [] as PlanPrice[],
  config: {
    modules: [] as string[],
    limits: { doc_limit: 100, vault_limit: 3 },
    is_trial: false,
    has_promo: false,
    is_courtesy: false
  }
});

const form = ref(defaultForm());

const filteredData = computed(() => {
  if (!search.value.trim()) return data.value;
  const q = search.value.toLowerCase();
  return data.value.filter(p => p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q));
});

function getFrequencyLabel(freq: string): string {
  const labels: Record<string, string> = { monthly: 'Mensual', quarterly: 'Trimestral', yearly: 'Anual', weekly: 'Semanal', biannual: 'Semestral' };
  return labels[freq] || freq;
}

function getModuleName(ulid: string) {
  const mod = modules.value.find(m => m.ulid === ulid);
  return mod?.name || ulid;
}

async function loadData() {
  loading.value = true;
  try {
    const [planResult, modResult] = await Promise.all([
      fetchApi<{ results: Plan[]; count: number }>(`/api/v1/subscription-plans/?page=${page.value}&page_size=${pageSize.value}`),
      fetchApi<AppModule[]>('/api/v1/app-modules/')
    ]);
    data.value = planResult.results || [];
    total.value = planResult.count || 0;
    modules.value = Array.isArray(modResult) ? modResult : (modResult as any).results || [];
  } catch (e) {
    notifyError('Error al cargar planes');
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  form.value = defaultForm();
  editingItem.value = null;
  showModal.value = true;
}

function openEdit(plan: Plan) {
  editingItem.value = plan;
  const pricesList: PlanPrice[] = [];
  if (plan.prices) {
    Object.entries(plan.prices).forEach(([freq, price]) => {
      pricesList.push({ id: Math.random().toString(36).substr(2, 9), frequency: freq, amount: (price as any).amount, currency: (price as any).currency });
    });
  }
  form.value = {
    sku: plan.sku,
    name: plan.name,
    description: plan.description || '',
    is_active: plan.is_active,
    pricesList,
    config: {
      modules: plan.config?.modules ? [...plan.config.modules] : [],
      limits: { doc_limit: plan.config?.limits?.doc_limit ?? 100, vault_limit: plan.config?.limits?.vault_limit ?? 3 },
      is_trial: plan.config?.is_trial ?? false,
      has_promo: plan.config?.has_promo ?? false,
      is_courtesy: plan.config?.is_courtesy ?? false
    }
  };
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  editingItem.value = null;
}

function addPrice() {
  form.value.pricesList.push({ id: Math.random().toString(36).substr(2, 9), frequency: '', amount: '', currency: 'USD' });
}

function removePrice(id: string) {
  form.value.pricesList = form.value.pricesList.filter(p => p.id !== id);
}

function toggleModule(ulid: string) {
  const idx = form.value.config.modules.indexOf(ulid);
  if (idx > -1) form.value.config.modules.splice(idx, 1);
  else form.value.config.modules.push(ulid);
}

async function saveItem() {
  if (!form.value.sku || !form.value.name || saving.value) {
    notifyError('SKU y nombre son obligatorios');
    return;
  }

  saving.value = true;
  try {
    const prices: Record<string, { amount: string; currency: string }> = {};
    form.value.pricesList.forEach(p => {
      if (p.frequency && p.amount) prices[p.frequency] = { amount: p.amount, currency: p.currency };
    });

    const payload = {
      sku: form.value.sku.toUpperCase(),
      name: form.value.name,
      description: form.value.description,
      prices,
      config: form.value.config,
      is_active: form.value.is_active
    };

    if (editingItem.value) {
      await fetchApi(`/api/v1/subscription-plans/${editingItem.value.ulid}/`, { method: 'PATCH', data: payload });
      notifySuccess('Plan actualizado correctamente');
    } else {
      await fetchApi('/api/v1/subscription-plans/', { method: 'POST', data: payload });
      notifySuccess('Plan creado correctamente');
    }
    closeModal();
    loadData();
  } catch (e) {
    notifyError(editingItem.value ? 'Error al actualizar plan' : 'Error al crear plan');
  } finally {
    saving.value = false;
  }
}

async function toggleActive(plan: Plan) {
  const result = await Swal.fire({
    title: plan.is_active ? '¿Desactivar Plan?' : '¿Activar Plan?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: plan.is_active ? '#ef4444' : '#22c55e',
    cancelButtonColor: '#64748b',
    confirmButtonText: plan.is_active ? 'Sí, desactivar' : 'Sí, activar'
  });

  if (result.isConfirmed) {
    try {
      await fetchApi(`/api/v1/subscription-plans/${plan.ulid}/`, { method: 'PATCH', data: { is_active: !plan.is_active } });
      plan.is_active = !plan.is_active;
      notifySuccess(plan.is_active ? 'Plan activado' : 'Plan desactivado');
    } catch (e) {
      notifyError('Error al actualizar estado');
    }
  }
}

onMounted(loadData);
</script>