import { reactive, ref } from 'vue';
import { fetchApi } from '@/composables/useApi';
import { parseApiError } from '@/utils/parseApiError';
import type { LayawayDetail, LayawayStatus } from '@/composables/useLayaway';

export interface LayawayListItem {
  id: number;
  reference: string;
  customer: number;
  customer_name: string;
  seller_name: string;
  total_usd: string;
  initial_deposit_usd: string;
  balance_usd: string;
  paid_usd: string;
  progress_percent: number;
  status: LayawayStatus;
  expiration_date: string;
  created_at: string;
}

export interface AddLayawayPaymentPayload {
  amount_usd: number;
  gavetero_id?: string | null;
  method_code?: string;
  reference?: string;
}

interface PaginationState {
  page: number;
  pageSize: number;
  count: number;
  totalPages: number;
}

const DEFAULT_PAGE_SIZE = 50;

/**
 * Gestión administrativa de apartados: listado + abonos + cancelación.
 * El backend no filtra por status server-side (LayawayViewSet no tiene
 * filterset_fields) ni expone KPIs agregados, así que la lista trae un
 * page_size grande y el filtrado/las tarjetas de KPI se calculan en el
 * frontend sobre esa página (ver LayawaysView.vue).
 */
export function useLayawayManagement() {
  const layaways = ref<LayawayListItem[]>([]);
  const loading = ref(false);
  const actingId = ref<number | null>(null);
  const errorMessage = ref<string | null>(null);

  const pagination = reactive<PaginationState>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    count: 0,
    totalPages: 1,
  });

  function clearError() {
    errorMessage.value = null;
  }

  async function fetchLayaways(customerId?: string) {
    loading.value = true;
    errorMessage.value = null;
    try {
      const params: Record<string, string | number> = { page: pagination.page, page_size: pagination.pageSize };
      if (customerId) params.customer = customerId;
      const res = await fetchApi<{ count: number; results: LayawayListItem[] }>('/api/v1/layaways/', { params });
      layaways.value = res.results ?? [];
      pagination.count = res.count ?? 0;
      pagination.totalPages = Math.max(1, Math.ceil(pagination.count / pagination.pageSize));
    } catch (error) {
      errorMessage.value = parseApiError(error);
      layaways.value = [];
    } finally {
      loading.value = false;
    }
  }

  function setPage(page: number) {
    if (page < 1 || page > pagination.totalPages || page === pagination.page) return;
    pagination.page = page;
    fetchLayaways();
  }

  /** Registra un abono; si salda el balance el backend completa el apartado
   * automáticamente (genera la Sale real y descuenta stock reservado). */
  async function addPayment(layawayId: number, payload: AddLayawayPaymentPayload): Promise<LayawayDetail | null> {
    actingId.value = layawayId;
    errorMessage.value = null;
    try {
      const updated = await fetchApi<LayawayDetail>(`/api/v1/layaways/${layawayId}/add-payment/`, {
        method: 'POST',
        data: payload,
      });
      const row = layaways.value.find((l) => l.id === layawayId);
      if (row) {
        row.balance_usd = updated.balance_usd;
        row.paid_usd = updated.paid_usd;
        row.progress_percent = updated.progress_percent;
        row.status = updated.status;
      }
      return updated;
    } catch (error) {
      errorMessage.value = parseApiError(error);
      return null;
    } finally {
      actingId.value = null;
    }
  }

  /** Cancela un apartado ACTIVO y reintegra el stock reservado. No revierte
   * abonos ya cobrados (decisión manual, ver LayawayService.cancel_layaway). */
  async function cancelLayaway(layawayId: number): Promise<LayawayDetail | null> {
    actingId.value = layawayId;
    errorMessage.value = null;
    try {
      const updated = await fetchApi<LayawayDetail>(`/api/v1/layaways/${layawayId}/cancel/`, {
        method: 'POST',
      });
      const row = layaways.value.find((l) => l.id === layawayId);
      if (row) row.status = updated.status;
      return updated;
    } catch (error) {
      errorMessage.value = parseApiError(error);
      return null;
    } finally {
      actingId.value = null;
    }
  }

  return {
    layaways,
    loading,
    actingId,
    errorMessage,
    pagination,
    clearError,
    fetchLayaways,
    setPage,
    addPayment,
    cancelLayaway,
  };
}
