<template>
  <div class="flex flex-col">
    <!-- Loading State -->
    <div v-if="isLoading" class="p-8 text-center">
      <div class="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
      <p class="mt-2 text-gray-500">Cargando datos...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="p-8 text-center text-red-500">
      <p>{{ error }}</p>
      <button @click="fetchData" class="mt-2 text-blue-500 hover:underline">
        Reintentar
      </button>
    </div>

    <!-- Data Table -->
    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr
            v-for="(row, index) in rows"
            :key="index"
            class="hover:bg-gray-50"
          >
            <td
              v-for="column in columns"
              :key="column.key"
              class="px-6 py-4 whitespace-nowrap text-sm"
            >
              {{ row[column.key] }}
            </td>
          </tr>
          <tr v-if="rows.length === 0">
            <td :colspan="columns.length" class="px-6 py-12 text-center text-gray-500">
              No hay datos para mostrar
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <TablePagination
      v-if="totalRecords > 0"
      :current-page="currentPage"
      :page-size="pageSize"
      :total-records="totalRecords"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { fetchApi } from '@/composables/useApi';
import TablePagination from './TablePagination.vue';

interface Column {
  key: string;
  label: string;
}

interface Props {
  apiUrl: string;
  columns: Column[];
}

const props = defineProps<Props>();

const rows = ref<Record<string, unknown>[]>([]);
const currentPage = ref(1);
const pageSize = ref(100);
const totalRecords = ref(0);
const isLoading = ref(true);
const error = ref<string | null>(null);

async function fetchData() {
  isLoading.value = true;
  error.value = null;
  try {
    const params = new URLSearchParams({
      page: String(currentPage.value),
      page_size: String(pageSize.value),
    });
    const data = await fetchApi<{ results: Record<string, unknown>[]; count: number }>(
      `${props.apiUrl}?${params.toString()}`
    );
    rows.value = data.results || [];
    totalRecords.value = data.count || 0;
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Error al cargar datos';
  } finally {
    isLoading.value = false;
  }
}

function handlePageChange(page: number) {
  currentPage.value = page;
}

function handlePageSizeChange(size: number) {
  pageSize.value = size;
  currentPage.value = 1;
}

watch([currentPage, pageSize], () => {
  fetchData();
});

onMounted(() => {
  fetchData();
});
</script>