<template>
  <div class="space-y-6">
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm dark:border-white/[0.06] dark:bg-[#141824] p-6">
      <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">Configuración de Auto-Setup para Nuevos Tenants</h3>
      <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">Define qué atributos y categorías se activan automáticamente según el tipo de negocio.</p>

      <div v-if="loading" class="text-center py-8 text-slate-500">
        <RefreshCw class="mx-auto h-5 w-5 animate-spin mb-2" /> Cargando...
      </div>

      <div v-else class="space-y-4">
        <div v-for="bp in blueprints" :key="bp.id" class="border border-slate-200 rounded-lg p-4 dark:border-white/[0.06]">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/12 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-300">
                <Building2 class="h-5 w-5" />
              </div>
              <div>
                <h4 class="font-medium text-slate-900 dark:text-white">{{ bp.name }}</h4>
                <p class="text-xs text-slate-500 dark:text-slate-400">{{ bp.code }}</p>
              </div>
            </div>
            <button @click="openConfig(bp)" class="inline-flex items-center justify-center gap-2 h-8 px-3 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 dark:text-slate-300 dark:border-white/[0.06] dark:hover:bg-[#1a1f2e]">
              <Settings class="h-4 w-4" /> Configurar
            </button>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Atributos Activados</label>
              <div class="flex flex-wrap gap-1">
                <span v-for="feature in (bp.required_features || [])" :key="feature" class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {{ getFeatureName(feature) }}
                </span>
                <span v-if="!bp.required_features?.length" class="text-xs text-slate-400 italic">Ninguno</span>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Categorías Iniciales</label>
              <div class="flex flex-wrap gap-1">
                <span v-for="cat in ((bp.default_categories || []).slice(0, 3))" :key="cat" class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                  {{ getCategoryName(cat) }}
                </span>
                <span v-if="(bp.default_categories || []).length > 3" class="text-xs text-slate-400">+{{ (bp.default_categories || []).length - 3 }} más</span>
                <span v-if="!bp.default_categories?.length" class="text-xs text-slate-400 italic">Ninguna</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Config Modal -->
    <div v-if="configBp" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 dark:bg-[#141824] max-h-[80vh] overflow-hidden flex flex-col">
        <div class="border-b border-slate-200 p-6 dark:border-white/[0.06]">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Configurar Blueprint</h3>
              <p class="text-sm text-slate-500 dark:text-slate-400">{{ configBp.name }} ({{ configBp.code }})</p>
            </div>
            <button @click="configBp = null" class="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1a1f2e]">
              <X class="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div class="p-6 space-y-6 overflow-y-auto flex-1">
          <!-- Atributos Disponibles -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm font-medium text-slate-900 dark:text-white">
                Atributos Disponibles <span class="text-slate-400">({{ filteredAttributes.length }} de {{ availableAttributes.length }})</span>
              </h4>
              <div class="relative">
                <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  v-model="attrSearch"
                  type="text"
                  placeholder="Buscar atributos..."
                  class="pl-9 pr-4 py-1.5 text-sm border border-slate-200 rounded-lg w-48 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
            <div class="border border-slate-200 rounded-lg max-h-48 overflow-y-auto dark:border-white/[0.06]">
              <table class="w-full text-sm">
                <thead class="bg-slate-50 sticky top-0 dark:bg-[#1a1f2e]">
                  <tr>
                    <th class="px-3 py-2 text-left text-xs font-medium text-slate-500">ID</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-slate-500">Nombre</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-slate-500">Tipo</th>
                    <th class="px-3 py-2 text-center text-xs font-medium text-slate-500">Seleccionar</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-white/[0.06]">
                  <tr v-for="attr in filteredAttributes" :key="attr.id" class="hover:bg-slate-50 dark:hover:bg-[#1a1f2e]">
                    <td class="px-3 py-2 font-mono text-xs">{{ attr.id }}</td>
                    <td class="px-3 py-2">{{ attr.label }}</td>
                    <td class="px-3 py-2 text-xs text-slate-500">{{ attr.type_display }}</td>
                    <td class="px-3 py-2 text-center">
                      <input 
                        type="checkbox" 
                        :checked="configFeatures.includes(attr.id)"
                        @change="toggleFeature(attr.id)"
                        class="h-4 w-4 rounded border-slate-300 text-cyan-600"
                      />
                    </td>
                  </tr>
                  <tr v-if="!filteredAttributes.length">
                    <td colspan="4" class="px-3 py-4 text-center text-slate-400 italic">No hay atributos que coincidan</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="mt-2 text-xs text-slate-500">Selecciona los atributos que se activarán para este tipo de negocio</p>
          </div>

          <!-- Categorías Disponibles -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm font-medium text-slate-900 dark:text-white">
                Categorías Disponibles <span class="text-slate-400">({{ filteredCategories.length }} de {{ availableCategories.length }})</span>
              </h4>
              <div class="relative">
                <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  v-model="catSearch"
                  type="text"
                  placeholder="Buscar categorías..."
                  class="pl-9 pr-4 py-1.5 text-sm border border-slate-200 rounded-lg w-48 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div class="border border-slate-200 rounded-lg max-h-48 overflow-y-auto dark:border-white/[0.06]">
              <table class="w-full text-sm">
                <thead class="bg-slate-50 sticky top-0 dark:bg-[#1a1f2e]">
                  <tr>
                    <th class="px-3 py-2 text-left text-xs font-medium text-slate-500">Código</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-slate-500">Nombre</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-slate-500">Blueprint</th>
                    <th class="px-3 py-2 text-center text-xs font-medium text-slate-500">Seleccionar</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-white/[0.06]">
                  <tr v-for="cat in filteredCategories" :key="cat.id" class="hover:bg-slate-50 dark:hover:bg-[#1a1f2e]">
                    <td class="px-3 py-2 font-mono text-xs">{{ cat.code }}</td>
                    <td class="px-3 py-2">{{ cat.nombre }}</td>
                    <td class="px-3 py-2 text-xs text-slate-500">{{ getBlueprintName(cat.industry_blueprint_id) }}</td>
                    <td class="px-3 py-2 text-center">
                      <input 
                        type="checkbox" 
                        :checked="configCategories.includes(cat.code)"
                        @change="toggleCategory(cat.code)"
                        class="h-4 w-4 rounded border-slate-300 text-emerald-600"
                      />
                    </td>
                  </tr>
                  <tr v-if="!filteredCategories.length">
                    <td colspan="4" class="px-3 py-4 text-center text-slate-400 italic">No hay categorías que coincidan</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="mt-2 text-xs text-slate-500">Selecciona las categorías que se crearán automáticamente para nuevos tenants</p>
          </div>
        </div>
        
        <div class="border-t border-slate-200 p-6 flex justify-end gap-2 dark:border-white/[0.06]">
          <button @click="configBp = null" class="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50">Cancelar</button>
          <button @click="saveConfig" :disabled="saving" class="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:opacity-50">
            {{ saving ? 'Guardando...' : 'Guardar Configuración' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Building2, Settings, X, RefreshCw, Search } from 'lucide-vue-next';
import { useApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';

interface Blueprint {
  id: number;
  code: string;
  name: string;
  required_features?: string[];
  default_categories?: string[];
}

interface MasterAttribute {
  id: string;
  label: string;
  attr_type: string;
  type_display: string;
  unit: string;
  is_active: boolean;
  usage_count: number;
}

interface Category {
  id: number;
  code: string;
  nombre: string;
  industry_blueprint_id?: number;
  is_active?: boolean;
}

const { fetchApi } = useApi();
const { success: notifySuccess, error: notifyError } = useNotify();

const loading = ref(true);
const saving = ref(false);
const blueprints = ref<Blueprint[]>([]);
const allAttributes = ref<MasterAttribute[]>([]);
const allCategories = ref<Category[]>([]);
const configBp = ref<Blueprint | null>(null);
const configFeatures = ref<string[]>([]);
const configCategories = ref<string[]>([]);

const attrSearch = ref('');
const catSearch = ref('');

const availableAttributes = computed(() => allAttributes.value.filter(a => a.is_active !== false));
const availableCategories = computed(() => allCategories.value.filter(c => c.is_active !== false));

const filteredAttributes = computed(() => {
  if (!attrSearch.value.trim()) return availableAttributes.value;
  const q = attrSearch.value.toLowerCase();
  return availableAttributes.value.filter(a => 
    a.id.toLowerCase().includes(q) || 
    a.label.toLowerCase().includes(q)
  );
});

const filteredCategories = computed(() => {
  if (!catSearch.value.trim()) return availableCategories.value;
  const q = catSearch.value.toLowerCase();
  return availableCategories.value.filter(c => 
    c.code.toLowerCase().includes(q) || 
    c.nombre.toLowerCase().includes(q)
  );
});

function getFeatureName(id: string) {
  const attr = allAttributes.value.find(a => a.id === id);
  return attr?.label || id;
}

function getCategoryName(code: string) {
  const cat = allCategories.value.find(c => c.code === code);
  return cat?.nombre || code;
}

function getBlueprintName(id?: number) {
  if (!id) return '-';
  const bp = blueprints.value.find(b => b.id === id);
  return bp?.name || '-';
}

async function loadData() {
  loading.value = true;
  try {
    const [bpResult, attrResult, catResult] = await Promise.all([
      fetchApi<Blueprint[]>('/api/v1/industry-blueprints/'),
      fetchApi<MasterAttribute[]>('/api/v1/admin/master-attributes/'),
      fetchApi<Category[]>('/api/v1/categories/')
    ]);
    
    blueprints.value = Array.isArray(bpResult) ? bpResult : (bpResult as any).results || [];
    allAttributes.value = Array.isArray(attrResult) ? attrResult : (attrResult as any).results || [];
    allCategories.value = Array.isArray(catResult) ? catResult : (catResult as any).results || [];
  } catch (e) {
    notifyError('Error al cargar datos');
  } finally {
    loading.value = false;
  }
}

async function openConfig(bp: Blueprint) {
  attrSearch.value = '';
  catSearch.value = '';

  // Usar valores de la lista directamente como base
  const existingBp = blueprints.value.find(b => b.id === bp.id);
  configBp.value = existingBp || bp;
  configFeatures.value = [...(configBp.value.required_features || [])];
  configCategories.value = [...(configBp.value.default_categories || [])];

  // Fetch datos frescos y actualizar la lista
  try {
    const freshBp = await fetchApi<Blueprint>(`/api/v1/industry-blueprints/${bp.id}/`);
    const idx = blueprints.value.findIndex(b => b.id === bp.id);
    if (idx !== -1) {
      blueprints.value[idx] = freshBp;
    }
    configBp.value = freshBp;
    configFeatures.value = [...(freshBp.required_features || [])];
    configCategories.value = [...(freshBp.default_categories || [])];
  } catch (e) {
    // Mantener valores de la lista si el fetch falla
  }
}

function toggleFeature(code: string) {
  const idx = configFeatures.value.indexOf(code);
  if (idx > -1) configFeatures.value.splice(idx, 1);
  else configFeatures.value.push(code);
}

function toggleCategory(code: string) {
  const idx = configCategories.value.indexOf(code);
  if (idx > -1) configCategories.value.splice(idx, 1);
  else configCategories.value.push(code);
}

async function saveConfig() {
  if (!configBp.value || saving.value) return;

  saving.value = true;
  try {
    await fetchApi(`/api/v1/industry-blueprints/${configBp.value.id}/`, {
      method: 'PATCH',
      data: {
        required_features: configFeatures.value,
        default_categories: configCategories.value
      }
    });

    const updatedBp = await fetchApi<Blueprint>(`/api/v1/industry-blueprints/${configBp.value.id}/`);
    
    const idx = blueprints.value.findIndex(b => b.id === configBp.value!.id);
    if (idx !== -1) {
      blueprints.value[idx] = { ...blueprints.value[idx], ...updatedBp };
    }

    notifySuccess('Configuración guardada correctamente');
    configBp.value = null;
  } catch (e) {
    notifyError('Error al guardar configuración');
  } finally {
    saving.value = false;
  }
}

onMounted(loadData);
</script>