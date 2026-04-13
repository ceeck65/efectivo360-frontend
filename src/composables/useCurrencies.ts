import { ref, computed } from 'vue';
import { useApi } from './useApi';
import type { Currency, ApiResponse } from '@/types';

/**
 * @deprecated Este archivo está marcado para eliminación.
 * Usar el nuevo módulo HMVC: import { useStaffPayments } from '@modules/payments'
 * 
 * COMPOSABLE LEGACY: useCurrencies
 * 
 * Responsabilidad: Gestión de monedas del sistema
 * Solo usuarios con rol STAFF pueden acceder a este composable
 * 
 * TODO: Eliminar este archivo después de migrar todas las referencias al nuevo módulo.
 */
export function useCurrencies() {
  const { fetchApi } = useApi();

  // State
  const currencies = ref<Currency[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const activeCurrencies = computed(() =>
    currencies.value.filter(c => c.is_active).sort((a, b) => a.code.localeCompare(b.code))
  );

  const currenciesByCode = computed(() => {
    const map: Record<string, Currency> = {};
    currencies.value.forEach(c => {
      map[c.code] = c;
    });
    return map;
  });

  // Actions
  const loadCurrencies = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await fetchApi<{ count: number; next: string | null; previous: string | null; results: Currency[] }>(
        '/api/currencies/'
      );
      currencies.value = response.results || [];
    } catch (err: any) {
      error.value = err?.message || 'Error cargando monedas';
      if (err?.status === 403) {
        error.value = 'Acceso denegado. Solo Staff puede gestionar monedas.';
      }
    } finally {
      isLoading.value = false;
    }
  };

  const createCurrency = async (data: CurrencyFormData): Promise<Currency> => {
    const response = await fetchApi<ApiResponse<Currency>>(
      '/api/currencies/',
      {
        method: 'POST',
        data,
      }
    );
    return response.data;
  };

  const updateCurrency = async (id: number, data: CurrencyFormData): Promise<Currency> => {
    const response = await fetchApi<ApiResponse<Currency>>(
      `/api/currencies/${id}/`,
      {
        method: 'PUT',
        data,
      }
    );
    return response.data;
  };

  const deleteCurrency = async (id: number): Promise<void> => {
    await fetchApi(`/api/currencies/${id}/`, {
      method: 'DELETE',
    });
    currencies.value = currencies.value.filter(c => c.id !== id);
  };

  const toggleCurrencyStatus = async (id: number, isActive: boolean): Promise<void> => {
    await fetchApi(`/api/currencies/${id}/toggle/`, {
      method: 'POST',
      data: { is_active: isActive },
    });
    const currency = currencies.value.find(c => c.id === id);
    if (currency) {
      currency.is_active = isActive;
    }
  };

  return {
    // State
    currencies,
    isLoading,
    error,
    // Getters
    activeCurrencies,
    currenciesByCode,
    // Actions
    loadCurrencies,
    createCurrency,
    updateCurrency,
    deleteCurrency,
    toggleCurrencyStatus,
  };
}

// Form data type for currency
export interface CurrencyFormData {
  code: string;
  name: string;
  symbol: string;
  is_active: boolean;
  decimal_precision: number;
  symbol_position: 'prefix' | 'suffix';
  thousand_separator: string;
  decimal_separator: string;
}
