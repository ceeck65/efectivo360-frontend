<template>
  <div class="relative" ref="triggerRef">
    <!-- Selected display -->
    <button
      type="button"
      @click="open = !open"
      class="w-full h-9 px-3 text-sm border rounded-lg flex items-center justify-between transition-colors"
      :class="selectedNode
        ? 'border-slate-300 bg-white text-slate-800'
        : 'border-slate-300 bg-slate-50 text-slate-400'"
    >
      <span class="truncate text-left pr-2">
        {{ selectedNode ? breadcrumb : (tree?.length ? `${tree.length} categorías · ${placeholder}` : placeholder) }}
      </span>
      <ChevronDown class="w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-150" :class="{ 'rotate-180': open }" />
    </button>

    <!-- Dropdown panel -->
    <div
      v-if="open"
      data-tree-dropdown
      class="fixed bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden"
      :style="dropdownStyle"
    >
      <!-- Search -->
      <div class="p-2 border-b border-slate-100">
        <div class="relative">
          <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            v-model="filter"
            type="text"
            placeholder="Buscar categoría..."
            class="w-full h-8 pl-8 pr-3 text-xs border border-slate-200 rounded-md bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
      </div>

      <!-- Tree list -->
      <div class="max-h-60 overflow-y-auto py-1">
        <div v-if="filteredNodes.length === 0" class="px-3 py-4 text-center text-xs text-slate-400">
          Sin resultados
        </div>
        <div v-else>
          <button
            v-for="node in filteredNodes"
            :key="node.id"
            @click="selectNode(node)"
            class="w-full text-left px-3 py-1.5 text-sm hover:bg-blue-50 transition-colors flex items-center gap-2"
            :style="{ paddingLeft: (node._depth * 12 + 12) + 'px' }"
            :class="selectedNode?.id === node.id ? 'bg-blue-50 text-blue-700' : 'text-slate-700'"
          >
            <!-- Depth dots -->
            <span v-if="node._depth > 0" class="text-slate-300 text-[10px] shrink-0">
              {{ '·'.repeat(Math.min(node._depth, 3)) }}
            </span>
            <span v-if="(node as any).icon" class="shrink-0">{{ (node as any).icon }}</span>
            <span class="truncate">{{ node.name }}</span>
            <span class="text-[10px] text-slate-400 font-mono ml-auto shrink-0">{{ node.code }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { ChevronDown, Search } from 'lucide-vue-next';

interface TreeNode {
  id: number; name: string; code: string; icon?: string;
  parent_id: number | null; parent_name?: string | null;
  is_active?: boolean;
  children?: TreeNode[];
  _depth?: number;
}

const props = withDefaults(defineProps<{
  modelValue?: number | null;
  placeholder?: string;
  tree?: TreeNode[];
}>(), {
  placeholder: 'Seleccionar categoría...',
});

const emit = defineEmits<{
  'update:modelValue': [id: number | null];
}>();

const open = ref(false);
const filter = ref('');
const triggerRef = ref<HTMLElement | null>(null);

// Build flat list with depth info for search
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

const filteredNodes = computed(() => {
  if (!filter.value.trim()) return flatTree.value;
  const q = filter.value.toLowerCase();
  return flatTree.value.filter(n => n.name.toLowerCase().includes(q) || n.code.toLowerCase().includes(q));
});

const selectedNode = computed(() => {
  if (!props.modelValue) return null;
  return flatTree.value.find(n => n.id === props.modelValue) || null;
});

const breadcrumb = computed(() => {
  if (!selectedNode.value) return '';
  const parts: string[] = [selectedNode.value.name];
  let currentId = selectedNode.value.parent_id;
  const maxDepth = 5;
  for (let i = 0; currentId && i < maxDepth; i++) {
    const parent = flatTree.value.find(n => n.id === currentId);
    if (!parent) break;
    parts.unshift(parent.name);
    currentId = parent.parent_id ?? null;
  }
  return parts.join(' › ');
});

function selectNode(node: TreeNode & { _depth?: number }) {
  emit('update:modelValue', node.id);
  open.value = false;
  filter.value = '';
}

const dropdownStyle = ref<Record<string, string>>({});

function updateDropdownPos() {
  if (!triggerRef.value) return;
  const rect = triggerRef.value.getBoundingClientRect();
  dropdownStyle.value = {
    top: (rect.bottom + 4) + 'px',
    left: rect.left + 'px',
    width: rect.width + 'px',
    maxHeight: '260px',
    zIndex: '9999',
  };
}

function onOutsideClick(e: MouseEvent) {
  const target = e.target as Node;
  if (triggerRef.value?.contains(target)) return;
  // Check if click is inside the dropdown panel
  const panel = document.querySelector('[data-tree-dropdown]');
  if (panel?.contains(target)) return;
  open.value = false;
}

watch(open, async (val) => {
  if (val) {
    await nextTick();
    updateDropdownPos();
  } else {
    filter.value = '';
  }
});

onMounted(() => document.addEventListener('click', onOutsideClick, true));
onUnmounted(() => document.removeEventListener('click', onOutsideClick, true));
</script>
