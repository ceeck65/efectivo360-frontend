import { reactive, ref } from 'vue';
import { fetchApi } from '@/composables/useApi';
import { parseApiError } from '@/utils/parseApiError';

export type SaleStatus = 'REALIZADA' | 'ANULADA';
export type SaleStatusFilter = SaleStatus | 'ALL';

export interface SaleListItem {
  id: number;
  public_hash: string;
  sold_at: string;
  customer_name: string;
  total_usd: string;
  total_ves: string;
  exchange_rate: string;
  status: SaleStatus;
  seller: string | null;
  items_count: number;
}

export interface SaleLineDetail {
  id: number;
  sale: number;
  product: number;
  product_name: string | null;
  product_category: string;
  quantity: string;
  unit_used: number;
  unit_label: string | null;
  price_applied_usd: string;
  price_applied_ves: string;
  tax_amount: string;
  /** EXENTO, IVA_16, IVA_8 o IVA_22 — para el sufijo (E)/(G) del ticket térmico. */
  tax_type: string;
}

export interface SalePaymentDetail {
  id: number;
  method_code: string | null;
  method_name: string;
  amount_usd: string;
  amount_ves: string;
}

/** Desglose fiscal SENIAT (ver apps.sales.services.compute_sale_tax_breakdown). */
export interface SaleTaxBreakdown {
  exento: string;
  base_general: string;
  iva_general: string;
  base_reducido: string;
  iva_reducido: string;
  base_imponible: string;
  iva_total: string;
}

export interface SaleDetail {
  id: number;
  sold_at: string;
  seller: number | null;
  seller_name: string | null;
  customer: number | null;
  customer_name: string;
  customer_document: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  invoice_number: string | null;
  public_hash: string;
  reference: string;
  notes: string;
  lines: SaleLineDetail[];
  payments: SalePaymentDetail[];
  total_usd: string;
  total_ves: string;
  total_paid_usd: string;
  balance_usd: string;
  exchange_rate: string;
  status: SaleStatus;
  tax_breakdown: SaleTaxBreakdown;
}

export interface SalesSummary {
  total_sales_count: number;
  total_amount_usd: string;
  total_amount_ves: string;
  voided_sales_count: number;
}

export interface SalesHistoryFilters {
  start_date: string | null;
  end_date: string | null;
  status: SaleStatusFilter;
  search: string;
  shift_id: number | null;
}

interface PaginationState {
  page: number;
  pageSize: number;
  count: number;
  totalPages: number;
}

const DEFAULT_PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 400;

function buildFilterParams(filters: SalesHistoryFilters) {
  const params: Record<string, string | number> = {};
  if (filters.status && filters.status !== 'ALL') params.status = filters.status;
  if (filters.start_date) params.start_date = filters.start_date;
  if (filters.end_date) params.end_date = filters.end_date;
  if (filters.search.trim()) params.search = filters.search.trim();
  if (filters.shift_id) params.shift_id = filters.shift_id;
  return params;
}

/**
 * Historial de ventas del POS: listado paginado + resumen + anulación.
 * `fetchSales`/`fetchSummary` comparten los mismos filtros para que la
 * tabla y las tarjetas de KPI siempre reflejen el mismo conjunto de datos.
 */
export function useSalesHistory() {
  const sales = ref<SaleListItem[]>([]);
  const summary = ref<SalesSummary | null>(null);
  const loading = ref(false);
  const summaryLoading = ref(false);
  const voidingId = ref<number | null>(null);
  const errorMessage = ref<string | null>(null);

  const pagination = reactive<PaginationState>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    count: 0,
    totalPages: 1,
  });

  const filters = reactive<SalesHistoryFilters>({
    start_date: null,
    end_date: null,
    status: 'ALL',
    search: '',
    shift_id: null,
  });

  async function fetchSales() {
    loading.value = true;
    errorMessage.value = null;
    try {
      const params = { ...buildFilterParams(filters), page: pagination.page, page_size: pagination.pageSize };
      const res = await fetchApi<{ count: number; results: SaleListItem[] }>('/api/v1/sales/', { params });
      sales.value = res.results ?? [];
      pagination.count = res.count ?? 0;
      pagination.totalPages = Math.max(1, Math.ceil(pagination.count / pagination.pageSize));
    } catch (error) {
      errorMessage.value = parseApiError(error);
      sales.value = [];
    } finally {
      loading.value = false;
    }
  }

  async function fetchSummary() {
    summaryLoading.value = true;
    try {
      const params = buildFilterParams(filters);
      summary.value = await fetchApi<SalesSummary>('/api/v1/sales/summary/', { params });
    } catch (error) {
      // El resumen es un complemento visual: si falla, no bloquea la tabla.
      summary.value = null;
    } finally {
      summaryLoading.value = false;
    }
  }

  async function fetchSaleDetail(saleId: number): Promise<SaleDetail | null> {
    try {
      return await fetchApi<SaleDetail>(`/api/v1/sales/${saleId}/`);
    } catch (error) {
      errorMessage.value = parseApiError(error);
      return null;
    }
  }

  /** Refresca tabla + resumen a la vez (mismo filtro), volviendo a página 1. */
  async function refresh(resetPage = true) {
    if (resetPage) pagination.page = 1;
    await Promise.all([fetchSales(), fetchSummary()]);
  }

  function setPage(page: number) {
    if (page < 1 || page > pagination.totalPages || page === pagination.page) return;
    pagination.page = page;
    fetchSales();
  }

  let searchTimer: ReturnType<typeof setTimeout> | null = null;
  /** Actualiza el texto de búsqueda con debounce antes de recargar. */
  function setSearch(value: string, delay = SEARCH_DEBOUNCE_MS) {
    filters.search = value;
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      refresh();
    }, delay);
  }

  /**
   * Anula una venta REALIZADA. Al confirmarse en el backend, actualiza la fila
   * localmente (evita esperar un refetch completo) y refresca el resumen.
   */
  async function voidSale(saleId: number, reason: string): Promise<boolean> {
    voidingId.value = saleId;
    errorMessage.value = null;
    try {
      const updated = await fetchApi<SaleDetail>(`/api/v1/sales/${saleId}/void/`, {
        method: 'POST',
        data: { reason },
      });
      const row = sales.value.find((s) => s.id === saleId);
      if (row) row.status = updated.status;
      fetchSummary();
      return true;
    } catch (error) {
      errorMessage.value = parseApiError(error);
      return false;
    } finally {
      voidingId.value = null;
    }
  }

  return {
    sales,
    summary,
    loading,
    summaryLoading,
    voidingId,
    errorMessage,
    pagination,
    filters,
    fetchSales,
    fetchSummary,
    fetchSaleDetail,
    voidSale,
    refresh,
    setPage,
    setSearch,
  };
}
