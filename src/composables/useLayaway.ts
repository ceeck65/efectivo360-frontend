import { ref } from 'vue';
import { apiClient } from '@/composables/useApi';
import { parseApiError } from '@/utils/parseApiError';

/** Porcentaje mínimo de abono inicial exigido por LayawayService (backend). */
export const LAYAWAY_MIN_DEPOSIT_PERCENT = 20;

export interface LayawayItemPayload {
  product_id: string;
  qty: number;
  unit_price_cents: number;
  // Backend stores this as an opaque label (apps/sales/services.py) — actual
  // stock math always comes from qty * conversion_factor, never from this string.
  pricing_mode: 'UNIDAD' | 'BULTO' | 'PESO' | 'VOLUMEN';
  conversion_factor: number;
}

export interface ProcessLayawayPayload {
  shift_id: number;
  client_id: string;
  terminal_id?: number | null;
  exchange_rate?: number;
  items: LayawayItemPayload[];
  initial_deposit_usd: number;
  expiration_days: number;
  gavetero_id?: string | null;
  notes?: string;
}

export interface LayawayPaymentDetail {
  id: number;
  is_initial_deposit: boolean;
  method_name: string;
  amount_usd: string;
  amount_ves: string;
  balance_after_usd: string;
  reference: string;
  created_at: string;
}

export interface LayawayLineItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price_usd: number;
  tax_amount_usd: number;
}

export type LayawayStatus = 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';

export interface LayawayDetail {
  id: number;
  reference: string;
  customer: number;
  customer_name: string;
  seller_name: string;
  items: LayawayLineItem[];
  total_usd: string;
  total_ves: string;
  initial_deposit_usd: string;
  balance_usd: string;
  paid_usd: string;
  progress_percent: number;
  exchange_rate: string;
  status: LayawayStatus;
  expiration_date: string;
  notes: string;
  sale_id: number | null;
  payments: LayawayPaymentDetail[];
  created_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
}

/**
 * Apartados del POS: un único POST a /api/v1/layaways/process/.
 * El backend congela precios, reserva stock (reserved_quantity, sin descontar
 * quantity física) y registra el abono inicial como primer LayawayPayment —
 * la mercancía no se descuenta/entrega hasta que el apartado llega a
 * balance_usd = 0 (LayawayService._complete_layaway genera la Sale real).
 */
export function useLayaway() {
  const isProcessing = ref(false);
  const errorMessage = ref<string | null>(null);

  function clearError() {
    errorMessage.value = null;
  }

  async function processLayaway(payload: ProcessLayawayPayload): Promise<LayawayDetail | null> {
    isProcessing.value = true;
    errorMessage.value = null;
    try {
      const { data } = await apiClient.post<LayawayDetail>('/api/v1/layaways/process/', payload);
      return data;
    } catch (error) {
      errorMessage.value = parseApiError(error);
      return null;
    } finally {
      isProcessing.value = false;
    }
  }

  return {
    isProcessing,
    errorMessage,
    clearError,
    processLayaway,
  };
}
