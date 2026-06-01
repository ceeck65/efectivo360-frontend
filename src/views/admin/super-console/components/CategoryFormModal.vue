<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="$emit('close')" />
      <div class="relative bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-xl">
        <div class="flex items-center justify-between mb-5">
          <h3 class="text-base font-semibold text-slate-800">
            {{ editing ? 'Editar Categoría' : 'Nueva Categoría' }}
          </h3>
          <button @click="$emit('close')" class="p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <X class="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div class="space-y-4">
          <!-- Emoji + Name row -->
          <div class="flex items-end gap-3">
            <div class="relative shrink-0">
              <button type="button" @click.stop="showEmojiPicker = !showEmojiPicker"
                class="w-12 h-12 rounded-xl bg-slate-50 border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 transition-all flex items-center justify-center cursor-pointer text-2xl"
                :class="form.icon ? 'border-blue-300 bg-blue-50' : ''">
                <span v-if="form.icon">{{ form.icon }}</span>
                <Smile v-else class="w-5 h-5 text-slate-400" />
              </button>
              <div v-if="showEmojiPicker" class="absolute top-full left-0 mt-2 z-50" @click.stop>
                <VuemojiPicker @emojiClick="onEmojiSelect" />
              </div>
            </div>
            <div class="flex-1">
              <label class="block text-xs font-medium text-slate-600 mb-1">Nombre <span class="text-red-400">*</span></label>
              <input v-model="form.name" type="text" placeholder="Ej. Harinas" class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
            </div>
          </div>

          <!-- Code -->
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Código <span class="text-red-400">*</span></label>
            <input v-model="form.code" type="text" placeholder="Ej. harinas" class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
          </div>

          <!-- Parent Selector -->
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Categoría Superior (Padre)</label>
            <select v-model="form.parent_id" class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none cursor-pointer">
              <option :value="null" class="text-slate-400">Ninguna (Categoría Principal)</option>
              <option
                v-for="opt in availableParents"
                :key="opt.id"
                :value="opt.id"
                :disabled="opt.id === editing?.id || isDescendant(opt.id)"
              >{{ opt.name }}</option>
            </select>
            <p class="text-[10px] text-slate-400 mt-1">Dejar vacío si es categoría raíz.</p>
          </div>

          <!-- Description -->
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Descripción</label>
            <textarea v-model="form.description" rows="2" placeholder="Opcional..." class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"></textarea>
          </div>

          <!-- Active -->
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="form.is_active" class="w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500/30" />
            <span class="text-xs text-slate-600">Categoría activa</span>
          </label>
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <button @click="$emit('close')" class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 border border-slate-300 hover:bg-slate-50 transition-colors">Cancelar</button>
          <button @click="$emit('save', form)" :disabled="saving || !form.name.trim()" class="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 transition-colors flex items-center gap-2">
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
import { ref, watch, computed } from 'vue';
import { X, Save, Loader2, Smile } from 'lucide-vue-next';
import { VuemojiPicker } from 'vuemoji-picker';

interface CategoryOption {
  id: number;
  name: string;
  code: string;
  icon?: string;
}

interface FormData {
  name: string; code: string; parent_id: number | null;
  description: string; is_active: boolean; icon: string;
}

const props = defineProps<{
  visible: boolean;
  editing?: CategoryOption | null;
  categories: CategoryOption[];
  editingChildrenIds?: Set<number>;
  saving?: boolean;
}>();

defineEmits<{
  close: [];
  save: [data: FormData];
}>();

const form = ref<FormData>({
  name: '', code: '', parent_id: null,
  description: '', is_active: true, icon: '',
});

const showEmojiPicker = ref(false);

function onEmojiSelect(detail: any) {
  form.value.icon = detail.unicode;
  showEmojiPicker.value = false;
}

watch(() => props.editing, (cat) => {
  if (cat) {
    form.value = {
      name: cat.name || '', code: cat.code || '',
      parent_id: (cat as any).parent_id ?? null,
      description: (cat as any).description || '', is_active: (cat as any).is_active ?? true,
      icon: (cat as any).icon || '',
    };
  }
}, { immediate: true });

const escapedIds = computed(() => props.editingChildrenIds || new Set());

function isDescendant(id: number): boolean {
  return escapedIds.value.has(id);
}

const availableParents = computed(() =>
  props.categories.filter(c => c.id !== props.editing?.id)
);
</script>
