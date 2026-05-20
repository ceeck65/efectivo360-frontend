import { ref, watch } from 'vue';
import { fetchApi } from '@/composables/useApi';

export interface PaginationOptions {
  /** URL base de la API */
  url: string;
  /** Página inicial */
  initialPage?: number;
  /** Tamaño de página inicial */
  initialPageSize?: number;
  /** Params adicionales para la запрос */
  extraParams?: Record<string, unknown>;
}

export interface UsePaginationReturn {
  /** Página actual */
  currentPage: ReturnType<typeof ref<number>>;
  /** Tamaño de página */
  pageSize: ReturnType<typeof ref<number>>;
  /** Total de registros */
  totalRecords: ReturnType<typeof ref<number>>;
  /** Cargando datos */
  isLoading: ReturnType<typeof ref<boolean>>;
  /** Datos obtenidos */
  data: ReturnType<typeof ref<unknown[]>>;
  /** Error si existe */
  error: ReturnType<typeof ref<string | null>>;
  /** Obtener datos */
  fetch: () => Promise<void>;
  /** Cambiar página */
  goToPage: (page: number) => void;
  /** Cambiar tamaño de página */
  setPageSize: (size: number) => void;
}

export function usePagination(options: PaginationOptions): UsePaginationReturn {
  const {
    url,
    initialPage = 1,
    initialPageSize = 100,
    extraParams = {}
  } = options;

  const currentPage = ref(initialPage);
  const pageSize = ref(initialPageSize);
  const totalRecords = ref(0);
  const isLoading = ref(false);
  const data = ref<unknown[]>([]);
  const error = ref<string | null>(null);

  async function fetch(): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      const params = new URLSearchParams({
        page: String(currentPage.value),
        page_size: String(pageSize.value),
        ...Object.fromEntries(
          Object.entries(extraParams).map(([k, v]) => [k, String(v)])
        )
      });

      const response = await fetchApi<{ results: unknown[]; count: number }>(
        `${url}?${params.toString()}`
      );

      data.value = response.results || [];
      totalRecords.value = response.count || 0;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error fetching data';
      data.value = [];
      totalRecords.value = 0;
    } finally {
      isLoading.value = false;
    }
  }

  function goToPage(page: number): void {
    if (page >= 1 && page <= Math.ceil(totalRecords.value / pageSize.value)) {
      currentPage.value = page;
    }
  }

  function setPageSize(size: number): void {
    pageSize.value = size;
    currentPage.value = 1;
  }

  // Auto-fetch cuando cambia página o tamaño
  watch([currentPage, pageSize], () => {
    fetch();
  });

  // Fetch inicial
  fetch();

  return {
    currentPage,
    pageSize,
    totalRecords,
    isLoading,
    data,
    error,
    fetch,
    goToPage,
    setPageSize,
  };
}

export function usePaginatedData<T>(
  url: string,
  initialPageSize = 100
) {
  const pagination = usePagination({
    url,
    initialPageSize,
  });

  return {
    ...pagination,
    data: pagination.data as ReturnType<typeof ref<T[]>>,
  };
}