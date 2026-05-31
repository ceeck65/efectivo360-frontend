<template>
  <div class="space-y-6">

    <!-- ── Stepper Header ── -->
    <div class="bg-white dark:bg-[#141824] rounded-xl border border-slate-200 dark:border-white/[0.06] shadow-sm px-6 py-4">
      <div class="flex items-center gap-0">
        <button @click="step = 1" class="flex items-center gap-3 group">
          <span :class="['w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300', step === 1 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' : step > 1 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700']">
            {{ step > 1 ? '✓' : '1' }}
          </span>
          <div class="text-left">
            <p class="text-[11px] font-semibold uppercase tracking-widest" :class="step === 1 ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400'">Paso 1</p>
            <p class="text-sm font-medium" :class="step === 1 ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'">Taller de Categorías</p>
          </div>
        </button>

        <div class="w-20 h-px mx-4" :class="step > 1 ? 'bg-emerald-400/50' : 'bg-slate-200 dark:bg-slate-700'" />

        <button @click="step = 2" class="flex items-center gap-3 group">
          <span :class="['w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300', step === 2 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700']">2</span>
          <div class="text-left">
            <p class="text-[11px] font-semibold uppercase tracking-widest" :class="step === 2 ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400'">Paso 2</p>
            <p class="text-sm font-medium" :class="step === 2 ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'">Ensamblaje de Negocios</p>
          </div>
        </button>

        <div class="flex-1" />
        <span class="text-xs text-slate-400 font-mono">{{ step }} / 2</span>
      </div>
    </div>

    <!-- ── Loading ── -->
    <div v-if="loading" class="flex items-center justify-center py-16 text-sm text-slate-500 dark:text-slate-400">
      <RefreshCw class="w-5 h-5 animate-spin mr-2" /> Cargando datos del catálogo...
    </div>

    <!-- ════════════════════════════════════════════ -->
    <!-- STEP 1                                       -->
    <!-- ════════════════════════════════════════════ -->
    <div v-show="step === 1 && !loading">
      <div class="grid grid-cols-12 gap-5">

        <!-- Left: Tree Select -->
        <div class="col-span-4">
          <div class="bg-white dark:bg-[#141824] border border-slate-200 dark:border-white/[0.06] rounded-xl overflow-hidden shadow-sm">
            <div class="px-4 py-3 border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
              <h3 class="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Categorías</h3>
            </div>
            <div class="p-3">
              <p class="text-xs text-slate-500 mb-2">Árbol cargado: {{ categoryTree.length }} categorías</p>
              <CategoryTreeSelect
                v-model="selectedCategoryId"
                :tree="categoryTree"
                placeholder="Buscar y seleccionar..."
              />
            </div>
          </div>
        </div>

        <!-- Right: Attribute Manager -->
        <div class="col-span-8">
          <CategoryAttributeManager
            :key="selectedCategoryId || 0"
            :categoryId="selectedCategoryId"
          />
          <div v-if="!selectedCategoryId" class="flex items-center justify-center h-64 text-sm text-slate-400">
            Selecciona una categoría para gestionar sus atributos
          </div>
        </div>
      </div>

      <div class="flex justify-end mt-6">
        <button
          @click="saveStep1"
          :disabled="savingStep1"
          class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-emerald-900/30"
          :class="savingStep1 ? 'bg-emerald-600/50 text-emerald-200 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-500'"
        >
          <RefreshCw v-if="savingStep1" class="w-4 h-4 animate-spin" />
          <Save v-else class="w-4 h-4" />
          {{ savingStep1 ? 'Guardando...' : 'Guardar y continuar' }}
        </button>
      </div>
    </div>

    <!-- ════════════════════════════════════════════ -->
    <!-- STEP 2                                       -->
    <!-- ════════════════════════════════════════════ -->
    <div v-show="step === 2 && !loading">
      <div class="grid grid-cols-12 gap-5">

        <div class="col-span-4">
          <div class="bg-white dark:bg-[#141824] border border-slate-200 dark:border-white/[0.06] rounded-xl overflow-hidden shadow-sm">
            <div class="px-4 py-3 border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
              <h3 class="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Tipos de Negocio</h3>
              <span class="text-[11px] text-slate-400 font-mono">{{ businessTypes.length }}</span>
            </div>
            <div class="divide-y divide-slate-100 dark:divide-white/[0.06] max-h-[520px] overflow-y-auto">
              <button
                v-for="bt in businessTypes"
                :key="bt.id"
                @click="selectedBusinessType = bt"
                class="w-full text-left px-4 py-3.5 transition-colors duration-150"
                :class="selectedBusinessType?.id === bt.id ? 'bg-emerald-50 dark:bg-emerald-500/10 border-l-2 border-emerald-500' : 'hover:bg-slate-50 dark:hover:bg-white/[0.03] border-l-2 border-transparent'"
              >
                <p class="text-sm font-medium" :class="selectedBusinessType?.id === bt.id ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-900 dark:text-slate-200'">{{ bt.name }}</p>
                <p class="text-[11px] text-slate-400 mt-0.5 font-mono">{{ bt.code }}</p>
              </button>
            </div>
          </div>
        </div>

        <div class="col-span-8">
          <template v-if="selectedBusinessType">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h2 class="text-lg font-semibold text-slate-900 dark:text-white">{{ selectedBusinessType.name }}</h2>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Activa categorías para este negocio · Los hijos heredan automáticamente
                </p>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-xs text-slate-400 font-mono">{{ activeTotal }} categorías activas</span>
              </div>
            </div>

            <div class="bg-white dark:bg-[#141824] border border-slate-200 dark:border-white/[0.06] rounded-xl overflow-hidden shadow-sm">
              <!-- Search + Expand/Collapse -->
              <div class="flex items-center gap-2 px-3 py-2 border-b border-slate-100 dark:border-white/[0.06]">
                <div class="relative flex-1">
                  <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input v-model="searchQuery" type="text" placeholder="Buscar categoría..."
                    class="w-full h-8 pl-8 pr-3 text-xs border border-slate-200 dark:border-white/[0.06] rounded-lg bg-white dark:bg-[#141824] text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-blue-500/40 focus:border-blue-400" />
                  <button v-if="searchQuery" @click="searchQuery = ''"
                    class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X class="w-3.5 h-3.5" />
                  </button>
                </div>
                <button @click="expandAll"
                  class="text-[11px] font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors flex items-center gap-1">
                  <ChevronsDownUp class="w-3 h-3" /> Expandir
                </button>
                <button @click="collapseAll"
                  class="text-[11px] font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors flex items-center gap-1">
                  <ChevronsUpDown class="w-3 h-3" /> Colapsar
                </button>
              </div>
              <!-- Tree -->
              <div class="max-h-[460px] overflow-y-auto">
                <div v-if="categoryTree.length === 0" class="p-6 text-center text-sm text-slate-400">
                  No hay categorías disponibles
                </div>
                <BusinessCategoryRow
                  v-for="node in filteredTree"
                  :key="node.id"
                  :node="node"
                  :depth="0"
                  :business-type-id="selectedBusinessType.id"
                  :mappings="categoryMappings"
                  :search-query="searchQuery"
                  :expand-all-key="expandAllKey"
                  @toggle-node="onToggleNode"
                />
              </div>
            </div>
          </template>

          <template v-else>
            <div class="flex items-center justify-center h-64 text-sm text-slate-400">Selecciona un tipo de negocio para gestionar su matriz de categorías</div>
          </template>
        </div>
      </div>

      <div class="flex items-center justify-between mt-6">
        <button @click="step = 1" class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 transition-colors">
          <ArrowLeft class="w-4 h-4" /> Anterior
        </button>
        <button
          v-if="selectedBusinessType"
          @click="saveMatrix"
          :disabled="savingStep2"
          class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-emerald-900/30"
          :class="savingStep2 ? 'bg-emerald-600/50 text-emerald-200 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-500'"
        >
          <RefreshCw v-if="savingStep2" class="w-4 h-4 animate-spin" />
          <Save v-else class="w-4 h-4" />
          {{ savingStep2 ? 'Guardando...' : 'Guardar Matriz de ' + selectedBusinessType.name }}
        </button>
      </div>
    </div>

    <!-- ── Modal shell ── -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showModal = false" />
        <div class="relative bg-white dark:bg-[#141824] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-semibold text-slate-900 dark:text-white">{{ modalTitle }}</h3>
            <button @click="showModal = false" class="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"><X class="w-4 h-4 text-slate-400" /></button>
          </div>
          <p class="text-sm text-slate-500 dark:text-slate-400">{{ modalDescription }}</p>
          <div class="mt-6 flex justify-end gap-3">
            <button @click="showModal = false" class="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors">Cancelar</button>
            <button @click="showModal = false" class="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors">Guardar</button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ArrowLeft, Save, X, RefreshCw, Search, ChevronsDownUp, ChevronsUpDown } from 'lucide-vue-next';
import { useApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';
import CategoryTreeSelect from './CategoryTreeSelect.vue';
import CategoryAttributeManager from './CategoryAttributeManager.vue';
import BusinessCategoryRow from './BusinessCategoryRow.vue';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface BusinessType {
  id: number;
  name: string;
  code: string;
  icon?: string;
  description?: string;
  is_active?: boolean;
}

interface CategoryMapping {
  category_id: number;
  business_type_id: number;
  active: boolean;
}

// ─────────────────────────────────────────────
// Composables
// ─────────────────────────────────────────────
const { fetchApi } = useApi();
const { success: notifySuccess, error: notifyError } = useNotify();

// ─────────────────────────────────────────────
// State
// ─────────────────────────────────────────────
const savingStep1 = ref(false);
const loading = ref(true);
const step = ref(1);

const businessTypes = ref<BusinessType[]>([]);
const categoryTree = ref<any[]>([]);
const selectedBusinessType = ref<BusinessType | null>(null);
const selectedCategoryId = ref<number | null>(null);
const showModal = ref(false);
const modalTitle = ref('');
const modalDescription = ref('');

const categoryMappings = ref<CategoryMapping[]>([]);
const searchQuery = ref('');
const expandAllKey = ref(0);

function expandAll() { expandAllKey.value = expandAllKey.value === 1 ? 0 : 1; }
function collapseAll() { expandAllKey.value = expandAllKey.value === 2 ? 0 : 2; }

// ─────────────────────────────────────────────
// Computed
// ─────────────────────────────────────────────
const activeTotal = computed(() => {
  if (!selectedBusinessType.value) return 0;
  function countActive(tree: any[]): number {
    let c = 0;
    for (const node of tree) {
      const dm = categoryMappings.value.find(m => m.category_id === node.id && m.business_type_id === selectedBusinessType.value!.id);
      if (dm?.active) c++;
      if (node.children) c += countActive(node.children);
    }
    return c;
  }
  return countActive(categoryTree.value);
});

function onToggleNode(nodeId: number, active: boolean) {
  if (!selectedBusinessType.value) return;
  const mapping = categoryMappings.value.find(
    m => m.category_id === nodeId && m.business_type_id === selectedBusinessType.value!.id
  );
  if (mapping) {
    mapping.active = active;
  } else {
    categoryMappings.value.push({
      category_id: nodeId,
      business_type_id: selectedBusinessType.value!.id,
      active,
    });
  }
}

// ─────────────────────────────────────────────
// Filtered tree for search
// ─────────────────────────────────────────────
const filteredTree = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  if (!q) return categoryTree.value;
  function filter(nodes: any[]): any[] {
    return nodes.reduce((acc: any[], n: any) => {
      const match = n.name.toLowerCase().includes(q) || n.code.toLowerCase().includes(q);
      const filteredChildren = n.children ? filter(n.children) : [];
      if (match || filteredChildren.length) {
        acc.push({ ...n, children: filteredChildren });
      }
      return acc;
    }, []);
  }
  return filter(categoryTree.value);
});

// ─────────────────────────────────────────────
// Save Step 1
// ─────────────────────────────────────────────
async function saveStep1() {
  // Attributes are now saved directly via CategoryAttributeManager endpoints.
  // This function just navigates to Step 2.
  step.value = 2;
}

// ─────────────────────────────────────────────
// Save Step 2 — business-type-to-category mappings
// ─────────────────────────────────────────────
const savingStep2 = ref(false);

async function saveMatrix() {
  if (!selectedBusinessType.value || savingStep2.value) return;
  savingStep2.value = true;

  try {
    const activeMappings = categoryMappings.value.filter(
      m => m.business_type_id === selectedBusinessType.value!.id && m.active
    );
    const activeIds = new Set(activeMappings.map(m => m.category_id));

    // Map category IDs to names from the tree (fallback: use IDs)
    function flatNames(tree: any[]): string[] {
      const names: string[] = [];
      for (const n of tree) {
        if (activeIds.has(n.id)) names.push(n.name);
        if (n.children) names.push(...flatNames(n.children));
      }
      return names;
    }
    const names = flatNames(categoryTree.value);

    await fetchApi(`/api/v1/industry-blueprints/${selectedBusinessType.value.id}/`, {
      method: 'PATCH',
      data: { default_categories: names },
    });

    notifySuccess(`Matriz de ${selectedBusinessType.value.name} guardada correctamente`);
  } catch (e: any) {
    notifyError(e?.response?.data?.error || e?.message || 'Error al guardar matriz');
    console.error(e);
  } finally {
    savingStep2.value = false;
  }
}

async function loadCategoryTree() {
  try {
    const res = await fetchApi<any>('/api/v1/catalog/categories/?page_size=200');
    const results: any[] = res?.results || res || [];
    categoryTree.value = Array.isArray(results) ? results : [];
  } catch {
    categoryTree.value = [];
  }
  // Fallback: if catalog API returned nothing, tree stays empty (shown as "No hay categorías")
}

async function loadData() {
  try {
    const bpRes = await fetchApi<any>('/api/v1/industry-blueprints/?page=1&page_size=100');
    const bpList: any[] = bpRes?.results || bpRes || [];
    businessTypes.value = bpList
      .filter((b: any) => b.is_active !== false)
      .map((b: any) => ({
        id: b.id, name: b.name, code: b.code,
        icon: b.icon || '', description: b.description || '',
      }));

    // Build initial categoryMappings from IndustryBlueprint.default_categories
    bpList.forEach((bp: any) => {
      const savedNames: string[] = bp?.default_categories || [];
      if (!savedNames.length) return;
      savedNames.forEach((name: string) => {
        function findInTree(tree: any[]): any {
          for (const n of tree) {
            if (n.name.toLowerCase() === name.toLowerCase()) return n;
            if (n.children) {
              const found = findInTree(n.children);
              if (found) return found;
            }
          }
          return null;
        }
        const cat = findInTree(categoryTree.value);
        if (cat) {
          categoryMappings.value.push({
            category_id: cat.id,
            business_type_id: bp.id,
            active: true,
          });
        }
      });
    });
  } catch (e) {
    console.error('Error loading data', e);
  }
}

onMounted(async () => {
  loading.value = true;
  await loadCategoryTree();
  await loadData();
  loading.value = false;
});
</script>
