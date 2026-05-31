<template>
  <div class="relative" ref="triggerRef">
    <button
      type="button"
      @click="open = !open"
      class="w-full min-h-[38px] px-3 py-2 text-sm border rounded-lg flex items-center gap-1.5 flex-wrap transition-colors cursor-pointer text-left"
      :class="modelValue.length > 0
        ? 'border-slate-300 bg-white'
        : 'border-slate-300 bg-slate-50 text-slate-400'"
    >
      <template v-if="modelValue.length > 0">
        <span class="text-xs text-slate-500">{{ modelValue.length }} seleccionadas</span>
      </template>
      <span v-else>{{ placeholder }}</span>
      <ChevronDown class="w-3.5 h-3.5 text-slate-400 ml-auto shrink-0 transition-transform duration-150" :class="{ 'rotate-180': open }" />
    </button>

    <div v-if="open" class="fixed z-[9999] bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden"
      :style="dropdownStyle">
      <div class="p-2 border-b border-slate-100">
        <div class="relative">
          <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input v-model="filter" type="text" placeholder="Buscar categoría..."
            class="w-full h-8 pl-8 pr-3 text-xs border border-slate-200 rounded-md bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400" />
        </div>
      </div>
      <div class="max-h-56 overflow-y-auto py-1">
        <div v-if="flatFiltered.length === 0" class="px-3 py-4 text-center text-xs text-slate-400">Sin resultados</div>
        <div v-for="node in flatFiltered" :key="node.id"
          class="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 transition-colors cursor-pointer"
          :style="{ paddingLeft: ((node._depth || 0) * 14 + 12) + 'px' }"
          @click="toggleNode(node)">
          <div class="w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors"
            :class="isSelected(node.id) ? 'bg-blue-500 border-blue-500' : 'border-slate-300 bg-white'">
            <Check v-if="isSelected(node.id)" class="w-3 h-3 text-white" />
          </div>
          <span class="text-sm text-slate-700 truncate flex-1">{{ node.name }}</span>
          <span class="text-[10px] text-slate-400 font-mono shrink-0">{{ node.code }}</span>
        </div>
      </div>
    </div>
    <div v-if="open" class="fixed inset-0 z-[9998]" @click="open = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { ChevronDown, Search, Check } from 'lucide-vue-next';

interface TreeNode {
  id: number; name: string; code: string;
  is_active?: boolean;
  children?: TreeNode[];
  _depth?: number;
}

const props = withDefaults(defineProps<{
  modelValue: number[];
  tree?: TreeNode[];
  placeholder?: string;
}>(), {
  placeholder: 'Asignar categorías...',
});

const emit = defineEmits<{ 'update:modelValue': [ids: number[]] }>();

const open = ref(false);
const filter = ref('');
const triggerRef = ref<HTMLElement | null>(null);

const flatTree = computed(() => {
  const list: (TreeNode & { _depth: number })[] = [];
  function walk(nodes: TreeNode[], depth: number) {
    for (const n of nodes) {
      if (n.is_active !== false) {
        list.push({ ...n, _depth: depth, children: undefined as any });
        if (n.children) walk(n.children, depth + 1);
      }
    }
  }
  if (props.tree) walk(props.tree, 0);
  return list;
});

const flatFiltered = computed(() => {
  if (!filter.value.trim()) return flatTree.value;
  const q = filter.value.toLowerCase();
  return flatTree.value.filter(n => n.name.toLowerCase().includes(q) || n.code.toLowerCase().includes(q));
});

function isSelected(id: number): boolean {
  return props.modelValue.includes(id);
}

function toggleNode(node: TreeNode & { _depth?: number }) {
  const ids = [...props.modelValue];
  const idx = ids.indexOf(node.id);
  if (idx >= 0) ids.splice(idx, 1);
  else ids.push(node.id);
  emit('update:modelValue', ids);
}

const dropdownStyle = ref<Record<string, string>>({});
function updatePos() {
  if (!triggerRef.value) return;
  const rect = triggerRef.value.getBoundingClientRect();
  dropdownStyle.value = { top: (rect.bottom + 4) + 'px', left: rect.left + 'px', width: Math.max(rect.width, 260) + 'px', maxHeight: '260px' };
}

watch(open, async (v) => { if (v) { await nextTick(); updatePos(); } });
onMounted(() => { window.addEventListener('resize', updatePos); document.addEventListener('scroll', updatePos, true); });
onUnmounted(() => { window.removeEventListener('resize', updatePos); document.removeEventListener('scroll', updatePos, true); });
</script>
