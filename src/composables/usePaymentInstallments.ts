import { ref } from 'vue';
import { fetchApi } from '@/composables/useApi';
import { parseApiError } from '@/utils/parseApiError';

export interface CreatePaymentInstallmentPayload {
  credit_account: number;
  amount_usd?: number;
  amount_ves?: number;
  payment_voucher?: string;
  paid_at: string;
  notes?: string;
}

export interface PaymentInstallmentDetail {
  id: number;
  credit_account: number;
  invoice: number | null;
  invoice_number: string | null;
  amount_usd: string;
  amount_ves: string;
  exchange_rate_at_payment: string;
  applied_usd: string;
  applied_ves: string;
  payment_method: number | null;
  payment_voucher: string;
  paid_at: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

/**
 * Abonos a CreditAccount: POST /api/payment-installments/ (sin "invoice",
 * PaymentInstallmentSerializer.create() aplica el pago directo a
 * CreditAccount.apply_payment_usd — reduce balance_usd atómicamente). El
 * campo payment_method (FK a invoicing.PaymentMethodFK) queda vacío porque
 * ese catálogo no tiene filas cargadas hoy; el método elegido en el modal se
 * anota en `notes` para no perder el dato.
 */
export function usePaymentInstallments() {
  const isProcessing = ref(false);
  const errorMessage = ref<string | null>(null);

  function clearError() {
    errorMessage.value = null;
  }

  async function createPaymentInstallment(payload: CreatePaymentInstallmentPayload): Promise<PaymentInstallmentDetail | null> {
    isProcessing.value = true;
    errorMessage.value = null;
    try {
      return await fetchApi<PaymentInstallmentDetail>('/api/payment-installments/', {
        method: 'POST',
        data: payload,
      });
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
    createPaymentInstallment,
  };
}
