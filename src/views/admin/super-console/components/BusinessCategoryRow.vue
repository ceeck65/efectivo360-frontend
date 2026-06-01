<template>
  <div>
    <!-- Row -->
    <div
      class="flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50/80 transition-colors group border-b border-slate-50"
      :style="{ paddingLeft: ((depth ?? 0) * 16 + 12) + 'px' }"
    >
      <!-- Expand/Collapse -->
      <button
        v-if="hasChildren"
        @click="expanded = !expanded"
        class="shrink-0 w-4 h-4 flex items-center justify-center rounded text-slate-400 hover:text-slate-600 transition-colors"
      >
        <ChevronRight class="w-3 h-3 transition-transform duration-150" :class="{ 'rotate-90': expanded }" />
      </button>
      <div v-else class="w-4 shrink-0" />

      <!-- Name + code -->
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-slate-800 truncate">
          <span v-if="(node as any).icon" class="mr-1.5">{{ (node as any).icon }}</span>{{ node.name }}
        </p>
        <p class="text-[10px] text-slate-400 font-mono truncate">{{ node.code }}</p>
      </div>

      <!-- Status indicator -->
      <span
        v-if="inherited"
        class="shrink-0 text-[10px] text-slate-400 italic flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-50"
      >
        <Lock class="w-2.5 h-2.5" /> heredada
      </span>
      <span
        v-else-if="hasChildren && isOn"
        class="shrink-0 text-[10px] text-emerald-600 flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50"
      >
        {{ activeDescendants }} hijos
      </span>

      <!-- Toggle -->
      <button
        @click="toggle"
        :disabled="inherited"
        :class="[
          'relative shrink-0 w-10 h-5 rounded-full transition-colors duration-200',
          isOn ? 'bg-emerald-500' : 'bg-slate-300',
          inherited ? 'opacity-40 cursor-not-allowed' : ''
        ]"
      >
        <span
          :class="[
            'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200',
            isOn ? 'translate-x-5' : 'translate-x-0'
          ]"
        />
      </button>
    </div>

    <!-- Children -->
    <div v-if="expanded && hasChildren">
      <BusinessCategoryRow
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :depth="(depth ?? 0) + 1"
        :business-type-id="businessTypeId"
        :parent-active="isOn"
        :mappings="mappings"
        :search-query="searchQuery"
        :expand-all-key="expandAllKey"
        @toggle-node="(nodeId, active) => $emit('toggleNode', nodeId, active)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ChevronRight, Lock } from 'lucide-vue-next';

interface TreeNode {
  id: number; name: string; code: string; icon?: string;
  is_active?: boolean; children?: TreeNode[];
}

interface CategoryMapping {
  category_id: number; business_type_id: number; active: boolean;
}

const props = defineProps<{
  node: TreeNode;
  depth?: number;
  businessTypeId: number;
  parentActive?: boolean;
  mappings: CategoryMapping[];
  searchQuery?: string;
  expandAllKey?: number;
}>();

const emit = defineEmits<{
  toggleNode: [nodeId: number, active: boolean];
}>();

const hasChildren = computed(() => !!(props.node.children?.length));
const expanded = ref(false);

function matchesQuery(node: TreeNode, q: string): boolean {
  if (node.name.toLowerCase().includes(q) || node.code.toLowerCase().includes(q)) return true;
  if (node.children) return node.children.some((c) => matchesQuery(c, q));
  return false;
}

function isExpandedByDefault(d: number): boolean {
  return d < 2;
}

watch(
  () => [props.searchQuery, props.expandAllKey, props.depth, props.node],
  () => {
    const q = (props.searchQuery || '').toLowerCase().trim();
    const key = props.expandAllKey ?? 0;

    if (key === 1) {
      // Expand All
      expanded.value = hasChildren.value;
    } else if (key === 2) {
      // Collapse All
      expanded.value = false;
    } else if (q) {
      // Search mode: expand if node or any descendant matches
      expanded.value = matchesQuery(props.node, q);
    } else {
      // Default: expand first two levels
      expanded.value = isExpandedByDefault(props.depth ?? 0);
    }
  },
  { immediate: true }
);

const directMapping = computed(() =>
  props.mappings.find(m => m.category_id === props.node.id && m.business_type_id === props.businessTypeId)
);

const isOn = computed(() => directMapping.value?.active ?? false);

// Inherited: parent is active but this node has no direct mapping (or mapping is inactive)
// If parent is active and there's no explicit OFF mapping, the node inherits
const inherited = computed(() => {
  if (!props.parentActive) return false;
  return !directMapping.value || !directMapping.value.active;
});

const activeDescendants = computed(() => {
  function count(n: TreeNode): number {
    let c = 0;
    if (n.children) {
      for (const ch of n.children) {
        const dm = props.mappings.find(m => m.category_id === ch.id && m.business_type_id === props.businessTypeId);
        if (dm?.active) c++;
        c += count(ch);
      }
    }
    return c;
  }
  return count(props.node);
});

function toggle() {
  if (inherited.value) return;
  emit('toggleNode', props.node.id, !isOn.value);
}
</script>
