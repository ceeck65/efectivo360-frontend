import { ref } from 'vue';
import { fetchApi } from '@/composables/useApi';
import { parseApiError } from '@/utils/parseApiError';

export type DebtStatus = 'solvent' | 'pending' | 'over-limit';

export interface Customer {
  id: string;
  identity_document: string;
  first_name: string;
  last_name: string;
  address: string;
  phone: string;
  email: string;
  saldo_deudor_usd: string;
  credit_limit_usd: string;
  credit_days: number;
  debt_status: DebtStatus;
  created_at: string;
  updated_at: string;
}

export interface CustomerFormPayload {
  identity_document: string;
  first_name: string;
  last_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  credit_limit_usd?: number | string;
  credit_days?: number;
}

const BASE_URL = '/api/v1/customers/';

/**
 * CRUD de clientes: `/api/v1/customers/`. El backend expone credit_limit_usd/
 * credit_days como passthrough de invoicing.CreditAccount (no viven en Customer),
 * pero desde el frontend se editan como si fueran un solo formulario.
 */
export function useCustomers() {
  const customers = ref<Customer[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchCustomers(search = ''): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const params: Record<string, string> = {};
      if (search.trim()) params.search = search.trim();
      const res = await fetchApi<{ results?: Customer[] } | Customer[]>(BASE_URL, { params });
      customers.value = Array.isArray(res) ? res : (res.results ?? []);
    } catch (e) {
      error.value = parseApiError(e);
      customers.value = [];
    } finally {
      loading.value = false;
    }
  }

  async function createCustomer(data: CustomerFormPayload): Promise<Customer | null> {
    error.value = null;
    try {
      const created = await fetchApi<Customer>(BASE_URL, { method: 'POST', data });
      customers.value = [created, ...customers.value];
      return created;
    } catch (e) {
      error.value = parseApiError(e);
      return null;
    }
  }

  async function updateCustomer(id: string, data: Partial<CustomerFormPayload>): Promise<Customer | null> {
    error.value = null;
    try {
      const updated = await fetchApi<Customer>(`${BASE_URL}${id}/`, { method: 'PATCH', data });
      const idx = customers.value.findIndex((c) => c.id === id);
      if (idx !== -1) customers.value[idx] = updated;
      return updated;
    } catch (e) {
      error.value = parseApiError(e);
      return null;
    }
  }

  async function deleteCustomer(id: string): Promise<boolean> {
    error.value = null;
    try {
      await fetchApi(`${BASE_URL}${id}/`, { method: 'DELETE' });
      customers.value = customers.value.filter((c) => c.id !== id);
      return true;
    } catch (e) {
      error.value = parseApiError(e);
      return false;
    }
  }

  return {
    customers,
    loading,
    error,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  };
}
