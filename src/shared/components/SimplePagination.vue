<template>
  <div class="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white border-t border-gray-200">
    <!-- Info -->
    <div class="text-sm text-gray-700">
      <span class="font-medium">{{ start }}</span>
      <span class="mx-1">-</span>
      <span class="font-medium">{{ end }}</span>
      <span class="mx-1">de</span>
      <span class="font-medium">{{ total }}</span>
    </div>

    <!-- Controls -->
    <div class="flex items-center gap-2">
      <!-- Page Size -->
      <div class="flex items-center gap-1">
        <span class="text-sm text-gray-600">Filas:</span>
        <select
          :value="pageSize"
          @change="handlePageSizeChange"
          class="border border-gray-300 rounded text-sm py-1 px-2"
        >
          <option v-for="s in pageSizeOptions" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>

      <!-- Page Buttons -->
      <div class="flex items-center gap-1">
        <button
          @click="$emit('update:page', 1)"
          :disabled="page <= 1"
          class="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40"
          title="Primera"
        >
          <ChevronsLeft class="w-4 h-4" />
        </button>
        <button
          @click="$emit('update:page', page - 1)"
          :disabled="page <= 1"
          class="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>
        
        <span class="px-2 text-sm">
          {{ page }} / {{ totalPages }}
        </span>
        
        <button
          @click="$emit('update:page', page + 1)"
          :disabled="page >= totalPages"
          class="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40"
        >
          <ChevronRight class="w-4 h-4" />
        </button>
        <button
          @click="$emit('update:page', totalPages)"
          :disabled="page >= totalPages"
          class="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40"
          title="Última"
        >
          <ChevronsRight class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-vue-next';

const props = withDefaults(defineProps<{
  page: number;
  pageSize: number;
  total: number;
  pageSizeOptions?: number[];
}>(), {
  pageSizeOptions: () => [10, 25, 50, 100, 250, 500]
});

const emit = defineEmits<{
  'update:page': [page: number];
  'update:pageSize': [size: number];
}>();

const totalPages = computed(() => Math.ceil(props.total / props.pageSize) || 1);
const start = computed(() => Math.max(1, (props.page - 1) * props.pageSize + 1));
const end = computed(() => Math.min(props.page * props.pageSize, props.total));

function handlePageSizeChange(event: Event) {
  const select = event.target as HTMLSelectElement;
  const newSize = Number(select.value);
  emit('update:pageSize', newSize);
}
</script>