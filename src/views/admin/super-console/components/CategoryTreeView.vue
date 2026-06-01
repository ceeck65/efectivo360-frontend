<template>
  <div class="space-y-5">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-slate-800">Categorías Inteligentes</h2>
        <p class="text-xs text-slate-500 mt-0.5">Árbol jerárquico con herencia de atributos</p>
      </div>
      <button
        @click="openCreate"
        class="inline-flex items-center gap-1.5 h-9 px-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors"
      >
        <Plus class="w-4 h-4" />
        Nueva Categoría
      </button>
    </div>

    <!-- Toolbar -->
    <div class="flex items-center gap-3">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          v-model="search"
          type="text"
          placeholder="Buscar categorías..."
          class="w-full h-9 pl-9 pr-4 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
      </div>
      <button
        @click="expandAll"
        class="text-xs text-slate-500 hover:text-slate-700 transition-colors whitespace-nowrap"
      >
        Expandir todo
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-16 text-slate-400">
      <Loader2 class="w-5 h-5 animate-spin mx-auto mb-2" />
      Cargando categorías...
    </div>

    <!-- Empty -->
    <div v-else-if="filteredRoots.length === 0" class="text-center py-16 text-sm text-slate-400">
      {{ search ? 'Sin resultados' : 'No hay categorías' }}
    </div>

    <!-- Tree -->
    <div v-else class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100">
      <CategoryRow
        v-for="cat in filteredRoots"
        :key="cat.id"
        :category="cat"
        :depth="0"
        @edit="openEdit"
        @toggle="toggleActive"
      />
    </div>

    <!-- Modal -->
    <CategoryFormModal
      :visible="showModal"
      :editing="editingCategory"
      :categories="flatList"
      :editingChildrenIds="editingChildrenIds"
      :saving="saving"
      @close="showModal = false; editingCategory = null"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Plus, Search, Loader2 } from 'lucide-vue-next';
import { useApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';
import CategoryRow from './CategoryRow.vue';
import CategoryFormModal from './CategoryFormModal.vue';

interface CategoryNode {
  id: number; name: string; code: string; icon?: string;
  parent_id: number | null; parent_name: string | null;
  is_active: boolean; description?: string;
  attributes?: any[]; children?: CategoryNode[];
}
interface FormData {
  name: string; code: string; parent_id: number | null;
  description: string; is_active: boolean; icon: string;
}

const { fetchApi } = useApi();
const { success, error: notifyError } = useNotify();

const roots = ref<CategoryNode[]>([]);
const loading = ref(true);
const search = ref('');
const showModal = ref(false);
const editingCategory = ref<CategoryNode | null>(null);
const saving = ref(false);

// Build a flat list and collect descendant IDs for circular prevention
const flatList = computed(() => {
  const list: { id: number; name: string; code: string; parent_id?: number }[] = [];
  function walk(nodes: CategoryNode[]) {
    for (const n of nodes) {
      list.push({ id: n.id, name: n.name, code: n.code, parent_id: n.parent_id ?? undefined });
      if (n.children) walk(n.children);
    }
  }
  walk(roots.value);
  return list;
});

const editingChildrenIds = computed(() => {
  if (!editingCategory.value) return new Set<number>();
  const ids = new Set<number>();
  function collect(node: CategoryNode) {
    ids.add(node.id);
    if (node.children) for (const c of node.children) collect(c);
  }
  collect(editingCategory.value);
  return ids;
});

const filteredRoots = computed(() => {
  if (!search.value.trim()) return roots.value;
  const q = search.value.toLowerCase();
  function filter(nodes: CategoryNode[]): CategoryNode[] {
    return nodes.reduce<CategoryNode[]>((acc, n) => {
      const match = n.name.toLowerCase().includes(q) || n.code.toLowerCase().includes(q);
      const filteredChildren = n.children ? filter(n.children) : [];
      if (match || filteredChildren.length > 0) {
        acc.push({ ...n, children: filteredChildren });
      }
      return acc;
    }, []);
  }
  return filter(roots.value);
});

async function loadData() {
  loading.value = true;
  try {
    const res = await fetchApi<any>('/api/v1/catalog/categories/?page_size=200');
    roots.value = Array.isArray(res?.results) ? res.results : (Array.isArray(res) ? res : []);
  } catch { roots.value = []; }
  finally { loading.value = false; }
}

function openCreate() {
  editingCategory.value = null;
  showModal.value = true;
}

function openEdit(cat: CategoryNode) {
  editingCategory.value = cat;
  showModal.value = true;
}

async function handleSave(data: FormData) {
  if (saving.value) return;
  saving.value = true;
  try {
    const payload: Record<string, any> = {
      name: data.name.trim(), code: data.code.trim(),
      parent: data.parent_id || null,
      description: data.description.trim(), is_active: data.is_active,
      icon: data.icon || '📦',
    };
    if (editingCategory.value) {
      await fetchApi(`/api/v1/catalog/categories/${editingCategory.value.id}/`, { method: 'PATCH', data: payload });
      success('Categoría actualizada');
    } else {
      await fetchApi('/api/v1/catalog/categories/', { method: 'POST', data: payload });
      success('Categoría creada');
    }
    showModal.value = false;
    editingCategory.value = null;
    await loadData();
  } catch (e: any) {
    notifyError(e?.response?.data?.error || e?.message || 'Error al guardar');
  } finally { saving.value = false; }
}

async function toggleActive(cat: CategoryNode) {
  try {
    await fetchApi(`/api/v1/catalog/categories/${cat.id}/`, { method: 'PATCH', data: { is_active: !cat.is_active } });
    cat.is_active = !cat.is_active;
    success(cat.is_active ? 'Categoría activada' : 'Categoría desactivada');
  } catch (e: any) {
    notifyError(e?.response?.data?.error || 'Error');
  }
}

function expandAll() {
  // Re-render with expanded state by toggling roots
  roots.value = [...roots.value];
}

onMounted(loadData);
</script>
