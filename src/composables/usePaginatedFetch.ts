import { ref, watch } from 'vue';
import { fetchApi } from '@/composables/useApi';

export function usePaginatedFetch<T>(apiPath: string) {
  const data = ref<T[]>([]);
  const currentPage = ref(1);
  const pageSize = ref(100);
  const total = ref(0);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function load() {
    isLoading.value = true;
    error.value = null;
    try {
      const params = new URLSearchParams({
        page: String(currentPage.value),
        page_size: String(pageSize.value),
      });
      const result = await fetchApi<{ results: T[]; count: number }>(`${apiPath}?${params}`);
      data.value = result.results || [];
      total.value = result.count || 0;
    } catch (e: any) {
      error.value = e.message || 'Error loading data';
      data.value = [];
      total.value = 0;
    } finally {
      isLoading.value = false;
    }
  }

  function setPage(page: number) {
    currentPage.value = page;
  }

  function setPageSize(size: number) {
    pageSize.value = size;
    currentPage.value = 1;
  }

  // Auto-fetch on mount and when page/size changes
  watch([currentPage, pageSize], () => load(), { immediate: true });

  return {
    data,
    currentPage,
    pageSize,
    total,
    isLoading,
    error,
    load,
    setPage,
    setPageSize,
  };
}