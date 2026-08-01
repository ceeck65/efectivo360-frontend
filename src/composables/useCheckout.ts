import { ref } from 'vue';
import { apiClient } from '@/composables/useApi';
import { parseApiError } from '@/utils/parseApiError';

export interface CheckoutItem {
  product_id: string;
  qty: number;
  unit_price_cents: number;
  pricing_mode: 'UNIDAD' | 'BULTO';
  conversion_factor: number;
}

export interface CheckoutPaymentPayload {
  gavetero_id: string;
  payment_method_id?: string;
  amount_usd?: number;
  amount_ves?: number;
  reference?: string;
}

export interface CheckoutPayload {
  shift_id: number;
  warehouse_id: string;
  exchange_rate: number;
  items: CheckoutItem[];
  payments: CheckoutPaymentPayload[];
  client_id?: string;
  is_credit?: boolean;
  reference?: string;
  notes?: string;
}

/**
 * Checkout del POS: un único POST a /api/v1/sales/checkout/.
 * El backend descuenta inventario, distribuye pagos en gaveteros y consume
 * el ticket del paquete transaccional del tenant de forma atómica en la misma
 * transacción — el frontend no debe volver a llamar a
 * PATCH /api/v1/tenants/update-settings/ para eso.
 */
export function useCheckout() {
  const isProcessing = ref(false);
  const errorMessage = ref<string | null>(null);

  function clearError() {
    errorMessage.value = null;
  }

  async function checkout(payload: CheckoutPayload): Promise<boolean> {
    isProcessing.value = true;
    errorMessage.value = null;
    try {
      await apiClient.post('/api/v1/sales/checkout/', payload);
      return true;
    } catch (error) {
      errorMessage.value = parseApiError(error);
      return false;
    } finally {
      isProcessing.value = false;
    }
  }

  return {
    isProcessing,
    errorMessage,
    clearError,
    checkout,
  };
}
