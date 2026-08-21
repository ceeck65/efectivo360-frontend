import { ref } from 'vue';
import type { Customer } from '@/composables/useCustomers';

export function customerDisplayName(customer: Customer | null | undefined): string {
  if (!customer) return 'Consumidor Final';
  const name = [customer.first_name, customer.last_name].filter(Boolean).join(' ').trim();
  return name || 'Consumidor Final';
}

export interface FiscalInvoiceCheck {
  ok: boolean;
  missingFields: string[];
}

export interface CheckoutBlock {
  blocked: boolean;
  message?: string;
  /** true si el bloqueo se resuelve completando datos del cliente. */
  openCustomerModal?: boolean;
}

/**
 * Estado y reglas de negocio del POS que no viven bien dentro de PosMainView.vue
 * (cliente seleccionado, venta a crédito, requerimiento de factura fiscal) más las
 * validaciones estrictas que deben correr ANTES de disparar el checkout.
 *
 * Se instancia una sola vez en PosMainView.vue y se comparte con
 * CheckoutModal/CustomerSelectorModal vía props — no es un store global.
 */
export function usePos() {
  const selectedCustomer = ref<Customer | null>(null);
  const isCreditSale = ref(false);
  const requiresFiscalInvoice = ref(false);

  function selectCustomer(customer: Customer | null) {
    selectedCustomer.value = customer;
  }

  function resetForNewSale() {
    selectedCustomer.value = null;
    isCreditSale.value = false;
    requiresFiscalInvoice.value = false;
  }

  /** Regla Crédito: una venta a crédito exige cliente registrado (no "Consumidor Final"). */
  function validateCreditRule(): string | null {
    if (isCreditSale.value && !selectedCustomer.value) {
      return 'Las ventas a crédito requieren un cliente registrado obligatoriamente.';
    }
    return null;
  }

  /** Regla Factura Fiscal: exige RIF/CI, Razón Social y Dirección completos en el cliente. */
  function validateFiscalInvoiceRule(): FiscalInvoiceCheck {
    if (!requiresFiscalInvoice.value) return { ok: true, missingFields: [] };

    const customer = selectedCustomer.value;
    const missing: string[] = [];
    if (!customer?.identity_document?.trim()) missing.push('RIF/CI');
    if (!customer?.first_name?.trim()) missing.push('Razón Social / Nombre');
    if (!customer?.address?.trim()) missing.push('Dirección fiscal');

    return { ok: missing.length === 0, missingFields: missing };
  }

  /**
   * Corre ambas reglas antes de llamar al checkout. Si bloquea y
   * `openCustomerModal` es true, el llamador debe abrir el selector/formulario
   * de cliente en vez de solo mostrar el mensaje de error.
   */
  function validateBeforeCheckout(): CheckoutBlock {
    const creditError = validateCreditRule();
    if (creditError) {
      return { blocked: true, message: creditError, openCustomerModal: true };
    }

    const fiscalCheck = validateFiscalInvoiceRule();
    if (!fiscalCheck.ok) {
      return {
        blocked: true,
        message: `Para emitir factura fiscal, completa estos datos del cliente: ${fiscalCheck.missingFields.join(', ')}.`,
        openCustomerModal: true,
      };
    }

    return { blocked: false };
  }

  return {
    selectedCustomer,
    isCreditSale,
    requiresFiscalInvoice,
    selectCustomer,
    resetForNewSale,
    validateCreditRule,
    validateFiscalInvoiceRule,
    validateBeforeCheckout,
  };
}
