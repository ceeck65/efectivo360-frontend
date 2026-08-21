import { ref } from 'vue';
import { fetchApi } from '@/composables/useApi';
import { parseApiError } from '@/utils/parseApiError';

export interface TicketPackage {
  id: string;
  name: string;
  quantity: number;
  price_usd: string;
  description: string;
  created_at: string;
}

export interface TicketPurchaseHistoryEntry {
  id: string;
  package: string;
  package_name: string;
  quantity: number;
  price_usd: string;
  tickets_before: number;
  tickets_after: number;
  purchased_by: string | null;
  created_at: string;
}

export interface TicketPackagePurchaseResponse {
  tenant: Record<string, unknown>;
  tickets_remaining: number;
  purchase: TicketPurchaseHistoryEntry;
}

interface DrfPage<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Marketplace de paquetes de tickets: GET /api/v1/tenant/ticket-packages/ (Staff los crea
 * desde el Django Admin) y POST .../purchase/ para la recarga atómica del tenant actual.
 */
export function useTicketPackages() {
  const packages = ref<TicketPackage[]>([]);
  const isLoading = ref(false);
  const purchasingId = ref<string | null>(null);
  const error = ref<string | null>(null);

  async function fetchPackages(): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      const data = await fetchApi<DrfPage<TicketPackage> | TicketPackage[]>(
        '/api/v1/tenant/ticket-packages/'
      );
      packages.value = Array.isArray(data) ? data : data.results;
    } catch (err) {
      error.value = parseApiError(err);
    } finally {
      isLoading.value = false;
    }
  }

  /** Lanza el error normalizado si falla; el llamador decide cómo notificarlo. */
  async function purchasePackage(id: string): Promise<TicketPackagePurchaseResponse> {
    purchasingId.value = id;
    try {
      return await fetchApi<TicketPackagePurchaseResponse>(
        `/api/v1/tenant/ticket-packages/${id}/purchase/`,
        { method: 'POST' }
      );
    } finally {
      purchasingId.value = null;
    }
  }

  return {
    packages,
    isLoading,
    purchasingId,
    error,
    fetchPackages,
    purchasePackage,
  };
}
