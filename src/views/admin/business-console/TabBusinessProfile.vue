<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-base font-semibold text-slate-800">Perfil y Rubros</h3>
      <p class="text-xs text-slate-500 mt-0.5">Gestiona el tipo de negocio y las categorías disponibles</p>
    </div>

    <!-- Case A: No primary blueprint -->
    <template v-if="!primaryBlueprint">
      <div class="bg-slate-50 border border-slate-200 rounded-xl p-5">
        <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Rubro Principal</p>
        <div class="flex flex-col items-center text-center py-6">
          <div class="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-3">
            <HelpCircle class="w-7 h-7 text-slate-300" />
          </div>
          <p class="text-sm font-medium text-slate-600">Sin actividad comercial configurada</p>
          <p class="text-xs text-slate-400 mt-1 max-w-xs">Selecciona el rubro principal de tu empresa para activar las categorías inteligentes.</p>
          <button @click="showBlueprintModal = true"
            class="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors">
            <Plus class="w-4 h-4" /> Configurar Actividad Comercial
          </button>
        </div>
      </div>
      <div class="bg-slate-50 border border-slate-200 rounded-xl p-5">
        <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Categorías Activas</p>
        <p class="text-xs text-slate-400 italic">Por favor, define la actividad principal de tu empresa para cargar el árbol de categorías inteligentes.</p>
      </div>
    </template>

    <!-- Case B: Primary blueprint assigned -->
    <template v-else>
      <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-slate-100">
              <span v-if="primaryBlueprint.icon">{{ primaryBlueprint.icon }}</span>
              <Store v-else class="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p class="text-sm font-medium text-slate-800">{{ primaryBlueprint.name }}</p>
              <p v-if="primaryBlueprint.description" class="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{{ primaryBlueprint.description }}</p>
              <p class="text-[11px] text-slate-400 font-mono">{{ primaryBlueprint.code }}</p>
            </div>
          </div>
          <button @click="showBlueprintModal = true"
            class="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
            <Pencil class="w-3 h-3" /> Cambiar
          </button>
        </div>
      </div>

      <!-- Active Categories (dynamic tenant tree) -->
      <div>
        <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Categorías Activas</p>
        <div v-if="loadingTree" class="text-xs text-slate-400 py-4">Cargando...</div>
        <div v-else-if="categoryTree.length === 0" class="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center">
          <p class="text-xs text-slate-400 italic">Este rubro no tiene categorías asociadas.</p>
        </div>
        <div v-else class="bg-white border border-slate-200 rounded-xl p-4 max-h-72 overflow-y-auto shadow-sm space-y-1">
          <div v-for="cat in categoryTree" :key="cat.id">
            <div class="flex items-center gap-2 py-1">
              <span v-if="cat.icon" class="text-base leading-none shrink-0">{{ cat.icon }}</span>
              <FolderOpen v-else class="w-4 h-4 text-blue-400 shrink-0" />
              <span class="text-sm font-medium text-slate-700">{{ cat.name }}</span>
              <span v-if="cat.code" class="text-[10px] text-slate-400 font-mono">{{ cat.code }}</span>
            </div>
            <div v-if="cat.children?.length" class="ml-6 border-l-2 border-slate-100 pl-3 space-y-0.5 py-0.5">
              <div v-for="ch in cat.children" :key="ch.id" class="flex items-center gap-1.5 py-0.5">
                <span v-if="ch.icon" class="text-sm leading-none shrink-0">{{ ch.icon }}</span>
                <span v-else class="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                <span class="text-xs text-slate-600">{{ ch.name }}</span>
                <span v-if="ch.code" class="text-[10px] text-slate-400 font-mono">{{ ch.code }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Additional Complementary Categories (root SmartCategories) -->
      <div>
        <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Categorías Adicionales Complementarias</p>
        <p class="text-xs text-slate-400 mb-3 leading-relaxed">¿Vendes artículos que no pertenecen a tu rubro principal? Activa categorías globales específicas para expandir tu catálogo (Ej: Calzado, Textil, Ferretería).</p>
        <div v-if="loadingExtensions" class="text-xs text-slate-400 py-4">Cargando categorías disponibles...</div>
        <div v-else-if="categoryExtensions.length === 0" class="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center">
          <p class="text-xs text-slate-400 italic">Todas las categorías disponibles ya están incluidas en tu rubro actual.</p>
        </div>
        <div v-else class="space-y-2">
          <div v-for="ext in categoryExtensions" :key="ext.id"
            class="rounded-xl border transition-all duration-150 overflow-hidden"
            :class="ext.is_active ? 'border-blue-200 bg-blue-50/50' : 'border-slate-200 bg-white'">
            <!-- Root row -->
            <div
              class="w-full flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
              @click="toggleExpand(ext.id)">
              <!-- Expand/collapse arrow -->
              <span v-if="ext.children?.length" class="text-xs text-slate-400 w-3 shrink-0 text-center">
                {{ expandedExtensions.has(ext.id) ? '▼' : '▶' }}
              </span>
              <span v-else class="w-3 shrink-0" />
              <!-- Toggle checkbox -->
              <div class="relative w-5 h-5 shrink-0" @click.stop>
                <div v-if="toggling.has(ext.id)"
                  class="absolute inset-0 flex items-center justify-center">
                  <Loader2 class="w-4 h-4 animate-spin text-blue-500" />
                </div>
                <input v-else type="checkbox" :checked="ext.is_active"
                  @change="toggleCategoryRoot(ext)"
                  class="w-4 h-4 rounded border-slate-300 text-blue-500 cursor-pointer" />
              </div>
              <span v-if="ext.icon" class="text-base leading-none shrink-0">{{ ext.icon }}</span>
              <span v-else class="w-4 h-4 shrink-0" />
              <span class="text-sm font-medium text-slate-700">{{ ext.name }}</span>
            </div>
            <!-- Children rows -->
            <div v-if="ext.children?.length && expandedExtensions.has(ext.id)" class="border-t border-slate-100">
              <div v-for="ch in ext.children" :key="ch.id"
                class="w-full flex items-center gap-3 px-4 py-2.5 pl-12">
                <div class="relative w-4 h-4 shrink-0">
                  <div v-if="toggling.has(ch.id)"
                    class="absolute inset-0 flex items-center justify-center">
                    <Loader2 class="w-3.5 h-3.5 animate-spin text-blue-500" />
                  </div>
                  <input v-else type="checkbox" :checked="ch.is_active"
                    @change="toggleCategoryRoot(ch)"
                    class="w-3.5 h-3.5 rounded border-slate-300 text-blue-500 cursor-pointer" />
                </div>
                <span v-if="ch.icon" class="text-sm leading-none shrink-0">{{ ch.icon }}</span>
                <span v-else class="w-3.5 h-3.5 rounded-full bg-slate-300 shrink-0" />
                <span class="text-xs text-slate-600">{{ ch.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <SelectBlueprintModal v-if="showBlueprintModal"
      @selected="onBlueprintSelected" @cancel="showBlueprintModal = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import * as AllIcons from 'lucide-vue-next';
import SelectBlueprintModal from './components/SelectBlueprintModal.vue';
import { useApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';

const { Plus, HelpCircle, Pencil, FolderOpen, Store, Loader2 } = AllIcons;

interface Blueprint {
  id: number;
  name: string;
  code: string;
  icon?: string;
  description?: string;
}

interface CategoryExtension {
  id: number;
  name: string;
  code: string;
  icon?: string;
  is_active: boolean;
  children?: CategoryExtension[];
}

interface CategoryNode {
  id: number;
  name: string;
  code: string;
  icon?: string;
  children?: CategoryNode[];
}

const props = defineProps<{
  tenantId: string;
}>();

const { fetchApi } = useApi();
const { success, error: notifyError } = useNotify();

const showBlueprintModal = ref(false);
const loadingTree = ref(true);
const loadingExtensions = ref(true);
const primaryBlueprint = ref<Blueprint | null>(null);
const categoryTree = ref<CategoryNode[]>([]);
const categoryExtensions = ref<CategoryExtension[]>([]);
const toggling = ref(new Set<number>());
const expandedExtensions = ref(new Set<number>());

function toggleExpand(id: number) {
  const next = new Set(expandedExtensions.value);
  if (next.has(id)) next.delete(id); else next.add(id);
  expandedExtensions.value = next;
}

onMounted(async () => {
  try {
    const info = await fetchApi<any>('/api/v1/tenants/settings/info/');
    primaryBlueprint.value = info?.business_type || null;

    if (primaryBlueprint.value && props.tenantId) {
      await Promise.all([loadCategories(), loadExtensions()]);
    }
  } catch {
    // silent
  } finally {
    loadingTree.value = false;
    loadingExtensions.value = false;
  }
});

async function loadCategories() {
  try {
    const data = await fetchApi<CategoryNode[]>(
      `/api/v1/catalog/categories/?tenant_id=${encodeURIComponent(props.tenantId)}`
    );
    categoryTree.value = Array.isArray(data) ? data : [];
  } catch {
    categoryTree.value = [];
  }
}

async function loadExtensions() {
  try {
    const res = await fetchApi<CategoryExtension[]>('/api/v1/tenants/categories/available-extensions/');
    const list = Array.isArray(res) ? res : [];
    categoryExtensions.value = list;
  } catch {
    categoryExtensions.value = [];
  }
}



async function onBlueprintSelected(bp: Blueprint) {
  primaryBlueprint.value = bp;
  showBlueprintModal.value = false;
  categoryExtensions.value = [];
  await Promise.all([loadCategories(), loadExtensions()]);
}

async function toggleCategoryRoot(ext: CategoryExtension) {
  if (toggling.value.has(ext.id)) return;
  toggling.value = new Set(toggling.value).add(ext.id);
  try {
    await fetchApi<any>('/api/v1/catalog/categories/toggle/', {
      method: 'POST',
      data: { category_id: ext.id },
    });
    // Refresh both tree and extensions so is_active stays in sync
    await Promise.all([loadCategories(), loadExtensions()]);
    success(ext.is_active ? 'Categoría adicional desactivada' : 'Categoría adicional activada');
  } catch {
    notifyError('Error al cambiar extensión de categoría');
  } finally {
    const t = new Set(toggling.value);
    t.delete(ext.id);
    toggling.value = t;
  }
}
</script>
