import { reactive, ref } from 'vue';
import { fetchApi } from '@/composables/useApi';
import { parseApiError } from '@/utils/parseApiError';

export type CreditRowStatus = 'OVERDUE' | 'CURRENT' | 'SOLVENT';

export interface CreditPortfolioRow {
  credit_account_id: number;
  customer_id: string;
  identity_document: string;
  name: string;
  phone: string;
  balance_usd: string;
  credit_limit: string;
  total_charged_usd: string;
  due_date: string | null;
  status: CreditRowStatus;
  debt_status: string | null;
  last_charge_at: string | null;
  last_payment_at: string | null;
}

export interface CreditPortfolioFilters {
  search: string;
}

const SEARCH_DEBOUNCE_MS = 400;

/**
 * Cartera de cuentas por cobrar: GET /api/v1/reports/credit-portfolio/
 * (extendido con due_date/phone/status — ver apps/reports/views.py). Solo
 * trae cuentas con balance_usd > 0, tope 500 filas server-side (sin
 * paginación real), por eso no hay estado de paginación aquí.
 */
export function useCreditPortfolio() {
  const rows = ref<CreditPortfolioRow[]>([]);
  const totalBalanceUsd = ref('0');
  const totalCuentas = ref(0);
  const totalOverdue = ref(0);
  const loading = ref(false);
  const errorMessage = ref<string | null>(null);

  const filters = reactive<CreditPortfolioFilters>({ search: '' });

  async function fetchPortfolio() {
    loading.value = true;
    errorMessage.value = null;
    try {
      const params: Record<string, string> = {};
      if (filters.search.trim()) params.q = filters.search.trim();
      const res = await fetchApi<{
        total_cuentas: number;
        total_balance_usd: string;
        total_overdue: number;
        results: CreditPortfolioRow[];
      }>('/api/v1/reports/credit-portfolio/', { params });
      rows.value = res.results ?? [];
      totalBalanceUsd.value = res.total_balance_usd ?? '0';
      totalCuentas.value = res.total_cuentas ?? 0;
      totalOverdue.value = res.total_overdue ?? 0;
    } catch (error) {
      errorMessage.value = parseApiError(error);
      rows.value = [];
    } finally {
      loading.value = false;
    }
  }

  let searchTimer: ReturnType<typeof setTimeout> | null = null;
  function setSearch(value: string, delay = SEARCH_DEBOUNCE_MS) {
    filters.search = value;
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => fetchPortfolio(), delay);
  }

  return {
    rows,
    totalBalanceUsd,
    totalCuentas,
    totalOverdue,
    loading,
    errorMessage,
    filters,
    fetchPortfolio,
    setSearch,
  };
}
