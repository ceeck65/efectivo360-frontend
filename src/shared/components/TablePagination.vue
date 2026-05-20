<template>
  <div class="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
    <div class="flex items-center justify-between w-full">
      <!-- Info de registros -->
      <div class="text-sm text-gray-700">
        <span class="font-medium">{{ startRecord }}</span>
        <span class="mx-1">-</span>
        <span class="font-medium">{{ endRecord }}</span>
        <span class="mx-1">de</span>
        <span class="font-medium">{{ totalRecords }}</span>
        <span class="ml-1">registros</span>
      </div>

      <!-- Selector de registros por página -->
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-600">Mostrar:</span>
        <select
          :value="pageSize"
          @change="handlePageSizeChange"
          class="border border-gray-300 rounded-md text-sm py-1.5 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option v-for="size in pageSizeOptions" :key="size" :value="size">
            {{ size }}
          </option>
        </select>
      </div>

      <!-- Controles de paginación -->
      <nav class="flex items-center gap-1">
        <!-- Primera página -->
        <button
          @click="goToPage(1)"
          :disabled="currentPage === 1"
          class="p-2 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Primera página"
        >
          <ChevronsLeft class="w-4 h-4" />
        </button>

        <!-- Página anterior -->
        <button
          @click="goToPage(currentPage - 1)"
          :disabled="currentPage === 1"
          class="p-2 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Página anterior"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>

        <!-- Números de página -->
        <template v-for="page in visiblePages" :key="page">
          <button
            v-if="page !== '...'"
            @click="goToPage(page as number)"
            :class="[
              'min-w-[36px] h-8 px-2 rounded-md text-sm font-medium transition-colors',
              page === currentPage
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            ]"
          >
            {{ page }}
          </button>
          <span
            v-else
            class="px-1 text-gray-400"
          >
            ...
          </span>
        </template>

        <!-- Página siguiente -->
        <button
          @click="goToPage(currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="p-2 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Página siguiente"
        >
          <ChevronRight class="w-4 h-4" />
        </button>

        <!-- Última página -->
        <button
          @click="goToPage(totalPages)"
          :disabled="currentPage === totalPages"
          class="p-2 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Última página"
        >
          <ChevronsRight class="w-4 h-4" />
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-vue-next';

interface Props {
  currentPage: number;
  pageSize: number;
  totalRecords: number;
  pageSizeOptions?: number[];
}

const props = withDefaults(defineProps<Props>(), {
  pageSizeOptions: () => [10, 25, 50, 100, 250, 500],
});

const emit = defineEmits<{
  (e: 'page-change', page: number): void;
  (e: 'page-size-change', size: number): void;
}>();

const totalPages = computed(() => Math.ceil(props.totalRecords / props.pageSize));

const startRecord = computed(() => {
  if (props.totalRecords === 0) return 0;
  return (props.currentPage - 1) * props.pageSize + 1;
});

const endRecord = computed(() => {
  return Math.min(props.currentPage * props.pageSize, props.totalRecords);
});

const visiblePages = computed(() => {
  const pages: (number | string)[] = [];
  const total = totalPages.value;
  const current = props.currentPage;

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    // Always show first page
    pages.push(1);

    if (current > 3) {
      pages.push('...');
    }

    // Show pages around current
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (current < total - 2) {
      pages.push('...');
    }

    // Always show last page
    pages.push(total);
  }

  return pages;
});

function goToPage(page: number): void {
  if (page >= 1 && page <= totalPages.value && page !== props.currentPage) {
    emit('page-change', page);
  }
}

function handlePageSizeChange(event: Event): void {
  const size = parseInt((event.target as HTMLSelectElement).value, 10);
  emit('page-size-change', size);
}
</script>