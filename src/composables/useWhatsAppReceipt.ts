import { ref } from 'vue';
import { apiClient } from '@/composables/useApi';
import { parseApiError } from '@/utils/parseApiError';

export interface WhatsAppMessageLog {
  id: string;
  sale: number | null;
  phone_number: string;
  message_type: 'text' | 'template';
  status: 'SENT' | 'FAILED';
  provider_message_id: string;
  error_message: string;
  created_at: string;
}

/** Envía el comprobante de una venta por WhatsApp vía POST /api/v1/sales/{id}/send-whatsapp-receipt/. */
export function useWhatsAppReceipt() {
  const isSending = ref(false);
  const errorMessage = ref<string | null>(null);

  function clearError() {
    errorMessage.value = null;
  }

  async function sendReceipt(saleId: number, phone: string): Promise<WhatsAppMessageLog | null> {
    isSending.value = true;
    errorMessage.value = null;
    try {
      const { data } = await apiClient.post<WhatsAppMessageLog>(
        `/api/v1/sales/${saleId}/send-whatsapp-receipt/`,
        { phone }
      );
      return data;
    } catch (error: any) {
      // El backend devuelve el WhatsAppMessageLog (con error_message) incluso cuando
      // el envío falla (502) — solo caemos a parseApiError si no vino ese cuerpo.
      const data = error?.response?.data;
      if (data?.error_message) {
        errorMessage.value = data.error_message;
        return data as WhatsAppMessageLog;
      }
      errorMessage.value = parseApiError(error);
      return null;
    } finally {
      isSending.value = false;
    }
  }

  return { isSending, errorMessage, clearError, sendReceipt };
}
