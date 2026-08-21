import { ref } from 'vue';
import { fetchApi } from '@/composables/useApi';
import { parseApiError } from '@/utils/parseApiError';

export interface CreditStatus {
  customer_id: string;
  customer_name: string;
  credit_limit: string | number;
  balance_usd: string | number;
  available_credit_usd: string | number;
  debt_status: string;
}

/**
 * GET /api/receivables/credit-status/?customer_id=<id> — siempre devuelve 200
 * (limit/balance en 0 si el cliente aún no tiene CreditAccount), a diferencia
 * de /api/credit-accounts/by-customer/ que da 404. Ideal para consultar en
 * vivo desde el checkout del POS.
 */
export function useCreditAccount() {
  const status = ref<CreditStatus | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchCreditStatus(customerId: string): Promise<CreditStatus | null> {
    loading.value = true;
    error.value = null;
    try {
      const data = await fetchApi<CreditStatus>('/api/receivables/credit-status/', {
        params: { customer_id: customerId },
      });
      status.value = data;
      return data;
    } catch (e) {
      console.error('Error fetching credit:', e);
      error.value = parseApiError(e);
      status.value = null;
      return null;
    } finally {
      loading.value = false;
    }
  }

  function reset() {
    status.value = null;
    error.value = null;
  }

  return {
    status,
    loading,
    error,
    fetchCreditStatus,
    reset,
  };
}
