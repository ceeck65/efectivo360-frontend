<script setup lang="ts">
import type { PaymentInstallmentDetail } from '@/composables/usePaymentInstallments';
import type { ThermalReceiptBusiness, ThermalPrintSettings } from '@/composables/useThermalReceipt';

defineProps<{
  payment: PaymentInstallmentDetail;
  customerName: string;
  methodLabel: string;
  balanceBeforeUsd: number;
  balanceAfterUsd: number;
  business: ThermalReceiptBusiness;
  printSettings: ThermalPrintSettings;
}>();

function formatUSD(value: string | number): string {
  return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatVES(value: string | number): string {
  return Number(value).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('es-VE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
</script>

<template>
  <Teleport to="body">
    <div
      id="credit-payment-receipt"
      :class="[
        printSettings.paper_width === '58mm' ? 'paper-58mm' : 'paper-80mm',
        printSettings.font_family === 'sans-serif' ? 'font-sans-serif' : 'font-monospace',
      ]"
    >
      <section class="receipt-section receipt-center">
        <div v-if="printSettings.show_logo && business.logoUrl" class="receipt-logo-wrap">
          <img :src="business.logoUrl" alt="" class="receipt-logo" />
        </div>
        <p class="receipt-business-name">{{ business.name || 'Mi Negocio' }}</p>
        <p v-if="business.rif">RIF: {{ business.rif }}</p>
        <p v-if="business.address">{{ business.address }}</p>
      </section>

      <div class="receipt-divider" />

      <section class="receipt-section receipt-center">
        <p class="receipt-strong">RECIBO DE ABONO A CRÉDITO</p>
        <p>N° {{ payment.id }}</p>
        <p>{{ formatDateTime(payment.paid_at) }}</p>
      </section>

      <div class="receipt-divider" />

      <section class="receipt-section">
        <p><span class="receipt-label">Cliente:</span> {{ customerName }}</p>
        <p><span class="receipt-label">Método:</span> {{ methodLabel }}</p>
        <p v-if="payment.payment_voucher"><span class="receipt-label">Referencia:</span> {{ payment.payment_voucher }}</p>
      </section>

      <div class="receipt-divider" />

      <section class="receipt-section">
        <div class="receipt-row">
          <span>Saldo Anterior</span>
          <span>${{ formatUSD(balanceBeforeUsd) }}</span>
        </div>
        <div class="receipt-row receipt-strong receipt-total-row">
          <span>ABONO RECIBIDO</span>
          <span>${{ formatUSD(payment.applied_usd) }}</span>
        </div>
        <div v-if="Number(payment.amount_usd) > 0 && Number(payment.amount_ves) > 0" class="receipt-row">
          <span></span>
          <span>${{ formatUSD(payment.amount_usd) }} + Bs. {{ formatVES(payment.amount_ves) }}</span>
        </div>
        <div class="receipt-row">
          <span>Tasa BCV</span>
          <span>Bs. {{ formatVES(payment.exchange_rate_at_payment) }}</span>
        </div>
        <div class="receipt-divider-thin" />
        <div class="receipt-row receipt-strong receipt-total-row">
          <span>SALDO PENDIENTE</span>
          <span>${{ formatUSD(balanceAfterUsd) }}</span>
        </div>
      </section>

      <div class="receipt-divider" />

      <section class="receipt-section receipt-center receipt-footer">
        <p class="receipt-footer-message">{{ printSettings.footer_custom_text || '¡Gracias por su pago!' }}</p>
        <p class="receipt-powered-by">Desarrollado por Efectivo 360</p>
      </section>
    </div>
  </Teleport>
</template>

<style>
#credit-payment-receipt {
  display: none;
}

@media print {
  @page {
    margin: 0;
    size: auto;
  }

  body * {
    display: none !important;
  }
  #credit-payment-receipt {
    display: block !important;
  }
  #credit-payment-receipt * {
    display: revert !important;
  }

  #credit-payment-receipt {
    margin: 0 auto;
    color: #000;
    background: #fff;
    line-height: 1.35;
  }

  #credit-payment-receipt.font-monospace {
    font-family: 'Courier New', Courier, monospace;
  }
  #credit-payment-receipt.font-sans-serif {
    font-family: system-ui, -apple-system, Helvetica, Arial, sans-serif;
  }

  #credit-payment-receipt.paper-58mm {
    width: 58mm;
    max-width: 58mm;
    font-size: 10px;
    padding: 2mm;
  }

  #credit-payment-receipt.paper-80mm {
    width: 80mm;
    max-width: 80mm;
    font-size: 12px;
    padding: 3mm;
  }

  .receipt-section {
    padding: 2px 0;
  }

  .receipt-center {
    text-align: center;
  }

  .receipt-logo-wrap {
    display: flex;
    justify-content: center;
    margin-bottom: 2px;
  }

  .receipt-logo {
    max-height: 15mm;
    max-width: 70%;
    object-fit: contain;
  }

  .receipt-business-name {
    font-weight: bold;
    text-transform: uppercase;
    font-size: 1.1em;
  }

  .receipt-strong {
    font-weight: bold;
  }

  .receipt-label {
    font-weight: bold;
  }

  .receipt-divider {
    border-bottom: 1px dashed #000;
    margin: 4px 0;
  }

  .receipt-divider-thin {
    border-bottom: 1px dashed #000;
    margin: 2px 0;
  }

  .receipt-row {
    display: flex;
    justify-content: space-between;
    gap: 6px;
  }

  .receipt-total-row {
    font-size: 1.05em;
  }

  .receipt-footer-message {
    white-space: pre-line;
  }

  .receipt-powered-by {
    font-size: 0.8em;
    margin-top: 2px;
  }
}
</style>
