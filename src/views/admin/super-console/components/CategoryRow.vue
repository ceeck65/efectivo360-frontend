<template>
  <div>
    <!-- Row -->
    <div
      class="flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50/80 transition-colors group"
      :style="{ paddingLeft: (depth * 20 + 12) + 'px' }"
    >
      <!-- Expand/Collapse -->
      <button
        v-if="hasChildren"
        @click="expanded = !expanded"
        class="shrink-0 w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-slate-600 transition-colors"
      >
        <ChevronRight
          class="w-3.5 h-3.5 transition-transform duration-150"
          :class="{ 'rotate-90': expanded }"
        />
      </button>
      <div v-else class="w-5 shrink-0" />

      <!-- Name + code -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1.5">
          <span class="text-sm font-medium text-slate-800 truncate">{{ category.name }}</span>
          <span v-if="category.parent_name" class="text-[10px] text-slate-400 font-mono truncate max-w-[140px]" :title="category.parent_name">
            ← {{ category.parent_name }}
          </span>
        </div>
        <div class="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span class="text-[10px] text-slate-400 font-mono">{{ category.code }}</span>
          <span v-if="childrenCount" class="text-[10px] text-slate-300">{{ childrenCount }} hijos</span>

          <!-- Inherited attributes -->
          <span
            v-for="attr in inheritedAttributes"
            :key="attr.key"
            class="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-500 font-normal"
            :title="'Heredado de: ' + attr.inherited_from"
          >
            <Lock class="w-2.5 h-2.5" />
            {{ attr.name }}
          </span>

          <!-- Own attributes -->
          <span
            v-for="attr in ownAttributes"
            :key="attr.key"
            class="inline-flex items-center px-1.5 py-0.5 text-[10px] rounded-full bg-blue-50 text-blue-600 font-normal"
          >
            {{ attr.name }}
          </span>
        </div>
      </div>

      <!-- Status -->
      <span
        class="shrink-0 w-1.5 h-1.5 rounded-full"
        :class="category.is_active ? 'bg-emerald-400' : 'bg-slate-300'"
        :title="category.is_active ? 'Activo' : 'Inactivo'"
      />

      <!-- Actions -->
      <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button @click="$emit('edit', category)" class="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Editar">
          <Pencil class="w-3.5 h-3.5" />
        </button>
        <button @click="$emit('toggle', category)" class="p-1 rounded-md text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors" :title="category.is_active ? 'Desactivar' : 'Activar'">
          <EyeOff v-if="category.is_active" class="w-3.5 h-3.5" />
          <Eye v-else class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- Children -->
    <div v-if="expanded && hasChildren">
      <CategoryRow
        v-for="child in category.children"
        :key="child.id"
        :category="child"
        :depth="depth + 1"
        @edit="$emit('edit', $event)"
        @toggle="$emit('toggle', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ChevronRight, Pencil, EyeOff, Eye, Lock } from 'lucide-vue-next';

interface CategoryNode {
  id: number;
  name: string;
  code: string;
  parent_id: number | null;
  parent_name: string | null;
  is_active: boolean;
  attributes?: Array<{
    key: string; name: string; type: string;
    is_required: boolean; inherited_from: string;
  }>;
  children?: CategoryNode[];
}

const props = defineProps<{
  category: CategoryNode;
  depth?: number;
}>();

defineEmits<{
  edit: [cat: CategoryNode];
  toggle: [cat: CategoryNode];
}>();

const depth = props.depth ?? 0;
const expanded = ref(props.depth !== undefined && props.depth < 2);

const attrs = computed(() => props.category.attributes || []);

const ownAttributes = computed(() => attrs.value.filter(a => a.inherited_from === 'self'));
const inheritedAttributes = computed(() => attrs.value.filter(a => a.inherited_from !== 'self'));

const hasChildren = computed(() => !!(props.category.children?.length));
const childrenCount = computed(() => {
  function count(node: CategoryNode): number {
    let c = (node.children || []).length;
    for (const ch of (node.children || [])) c += count(ch);
    return c;
  }
  return count(props.category);
});
</script>
