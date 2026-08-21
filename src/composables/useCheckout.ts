import { ref } from 'vue';
import { apiClient } from '@/composables/useApi';
import { parseApiError } from '@/utils/parseApiError';
import { forceTicketsExhausted } from '@/composables/useTenantMetadata';
import type { SaleDetail } from '@/composables/useSalesHistory';

// Coincide con el mensaje que arma ProcessSaleService cuando tickets_disponibles llega a 0.
const TICKET_LIMIT_PATTERN = /l[ií]mite.*tickets?|tickets?.*l[ií]mite/i;

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

  /** Devuelve la venta creada (para el modal de éxito) o null si falló. */
  async function checkout(payload: CheckoutPayload): Promise<SaleDetail | null> {
    isProcessing.value = true;
    errorMessage.value = null;
    try {
      const { data } = await apiClient.post<SaleDetail>('/api/v1/sales/checkout/', payload);
      return data;
    } catch (error: any) {
      const message = parseApiError(error);
      errorMessage.value = message;

      const status = error?.response?.status ?? error?.status;
      if ((status === 400 || status === 422) && TICKET_LIMIT_PATTERN.test(message)) {
        // El backend ya rechazó la venta sin descontar tickets: sincroniza la UI a 0 en
        // todos los componentes (sidebar, header del POS, dashboard) sin esperar un refetch.
        forceTicketsExhausted();
      }

      return null;
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
