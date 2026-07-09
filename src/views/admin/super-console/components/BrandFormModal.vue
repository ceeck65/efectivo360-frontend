<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="$emit('close')" />
      <div class="relative bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-5">
          <h3 class="text-base font-semibold text-slate-800">{{ editing ? 'Editar Marca' : 'Nueva Marca' }}</h3>
          <button @click="$emit('close')" class="p-1 rounded-lg hover:bg-slate-100"><X class="w-4 h-4 text-slate-400" /></button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Nombre <span class="text-red-400">*</span></label>
            <input v-model="form.name" type="text" placeholder="Ej. Kraft Foods" @input="autoSlug"
              class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Slug</label>
            <input v-model="form.slug" type="text" placeholder="kraft-foods"
              class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
          </div>

          <!-- Logo Upload -->
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Logo de la Marca</label>
            <div class="flex items-start gap-4">
              <div
                class="relative w-24 h-24 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer transition-all"
                :class="uploading ? 'border-blue-300 bg-blue-50' : logoPreview ? 'border-slate-200 bg-white' : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50'"
                @click="triggerFileInput"
                @dragover.prevent="dragOver = true"
                @dragleave.prevent="dragOver = false"
                @drop.prevent="handleDrop"
              >
                <Loader2 v-if="uploading" class="w-6 h-6 animate-spin text-blue-500" />
                <template v-else-if="logoPreview">
                  <img :src="logoPreview" class="w-full h-full object-contain" alt="" />
                  <button @click.stop="removeLogo" class="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors">
                    <X class="w-3 h-3" />
                  </button>
                </template>
                <div v-else class="flex flex-col items-center gap-1 text-slate-400">
                  <ImagePlus class="w-6 h-6" />
                  <span class="text-[10px] font-medium">250×250</span>
                </div>
                <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="handleFile" />
              </div>
              <div class="flex-1 text-xs text-slate-500 space-y-1 pt-1">
                <p>Formato: <strong>WebP</strong> generada automáticamente</p>
                <p>Tamaño: <strong>250 × 250 px</strong></p>
                <p class="text-slate-400">Arrastra una imagen o haz clic para seleccionar</p>
              </div>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Descripcion</label>
            <textarea v-model="form.description" rows="2" placeholder="Opcional..." class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"></textarea>
          </div>

          <!-- Categories -->
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Categorias</label>
            <CategoryMultiTreeSelect
              v-model="selectedCategoryIds"
              :tree="categoryTree"
              placeholder="Asignar categorias..."
            />
            <div v-if="selectedCategoryIds.length > 0" class="flex flex-wrap gap-1.5 mt-3">
              <span v-for="id in selectedCategoryIds" :key="id"
                class="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-slate-100 text-slate-700 border border-slate-200/60 group">
                <span class="truncate max-w-[140px]">{{ getCategoryPath(id) }}</span>
                <button @click="removeCategory(id)" class="shrink-0 w-3.5 h-3.5 rounded-full hover:bg-slate-200 flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity">
                  <X class="w-2.5 h-2.5" />
                </button>
              </span>
            </div>
          </div>

          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="form.is_active" class="w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500/30" />
            <span class="text-xs text-slate-600">Marca activa</span>
          </label>
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <button @click="$emit('close')" class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 border border-slate-300 hover:bg-slate-50">Cancelar</button>
          <button @click="save" :disabled="saving || !form.name.trim()" class="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 flex items-center gap-2">
            <Save v-if="!saving" class="w-4 h-4" />
            <Loader2 v-else class="w-4 h-4 animate-spin" />
            {{ saving ? 'Guardando...' : (editing ? 'Actualizar' : 'Crear') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { X, Save, Loader2, ImagePlus } from 'lucide-vue-next';
import { useApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';
import CategoryMultiTreeSelect from './CategoryMultiTreeSelect.vue';

interface TreeNode { id: number; name: string; code: string; children?: TreeNode[]; parent_name?: string | null; parent_id?: number | null; }

const props = defineProps<{
  visible: boolean; editing?: any; categoryTree?: TreeNode[];
  saving?: boolean;
}>();

const emit = defineEmits<{
  close: []; save: [data: Record<string, any>];
}>();

const { fetchApi } = useApi();
const { error: notifyError } = useNotify();

const form = ref({ name: '', slug: '', logo_url: '', description: '', is_active: true });
const selectedCategoryIds = ref<number[]>([]);
const logoPreview = ref('');
const logoFile = ref<File | null>(null);
const uploading = ref(false);
const dragOver = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const flatCategoryMap = computed(() => {
  const map = new Map<number, TreeNode>();
  function walk(nodes: TreeNode[]) {
    for (const n of nodes) { map.set(n.id, n); if (n.children) walk(n.children); }
  }
  if (props.categoryTree) walk(props.categoryTree);
  return map;
});

function getCategoryPath(id: number): string {
  const node = flatCategoryMap.value.get(id);
  if (!node) return String(id);
  const parts: string[] = [node.name];
  let currentId: number | null | undefined = node.parent_id ?? undefined;
  const visited = new Set<number>();
  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const parent = flatCategoryMap.value.get(currentId);
    if (!parent) break;
    parts.unshift(parent.name);
    currentId = parent.parent_id ?? undefined;
  }
  return parts.length > 1 ? parts[parts.length - 1] + (parts.length > 1 ? ` ← ${parts[0]}` : '') : node.name;
}

function removeCategory(id: number) {
  selectedCategoryIds.value = selectedCategoryIds.value.filter(c => c !== id);
}

function autoSlug() {
  if (!props.editing) {
    form.value.slug = form.value.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
}

function triggerFileInput() {
  fileInput.value?.click();
}

function handleFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) processFile(file);
}

function handleDrop(e: DragEvent) {
  dragOver.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file && file.type.startsWith('image/')) processFile(file);
}

function processFile(file: File) {
  logoFile.value = file;
  const reader = new FileReader();
  reader.onload = (e) => { logoPreview.value = e.target?.result as string; };
  reader.readAsDataURL(file);
}

function removeLogo() {
  logoFile.value = null;
  logoPreview.value = '';
  form.value.logo_url = '';
}

async function uploadLogo(brandId: string): Promise<{ url: string; path: string } | null> {
  if (!logoFile.value) return { url: form.value.logo_url, path: '' };
  uploading.value = true;
  try {
    const fd = new FormData();
    fd.append('image', logoFile.value);
    fd.append('brand_id', brandId);
    const res = await fetchApi<{ url: string; path: string }>('/api/v1/catalog/brands/upload-logo/', {
      method: 'POST',
      data: fd,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res || null;
  } catch {
    notifyError('Error al subir logo');
    return null;
  } finally {
    uploading.value = false;
  }
}

function fillForm(ed: any) {
  form.value = { name: ed.name || '', slug: ed.slug || '', logo_url: ed.logo || '', description: ed.description || '', is_active: ed.is_active ?? true };
  selectedCategoryIds.value = (ed.category_ids || ed.smart_categories || []).map((c: any) => typeof c === 'object' ? c.id : c);
  logoPreview.value = ed.logo || '';
  logoFile.value = null;
}

function resetForm() {
  form.value = { name: '', slug: '', logo_url: '', description: '', is_active: true };
  selectedCategoryIds.value = [];
  logoPreview.value = '';
  logoFile.value = null;
  uploading.value = false;
}

watch(() => props.visible, (v) => {
  if (v && !props.editing) resetForm();
  if (v && props.editing) fillForm(props.editing);
});

async function save() {
  const logoResult = await uploadLogo(props.editing?.id || form.value.slug || Date.now().toString());
  emit('save', {
    name: form.value.name.trim(),
    slug: form.value.slug.trim(),
    description: form.value.description.trim(),
    logo_path: logoResult?.path || '',
    category_ids: selectedCategoryIds.value,
  });
}
</script>
