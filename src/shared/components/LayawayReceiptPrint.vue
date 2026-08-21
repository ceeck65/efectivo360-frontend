<script setup lang="ts">
import type { LayawayDetail } from '@/composables/useLayaway';
import type { ThermalReceiptBusiness, ThermalPrintSettings } from '@/composables/useThermalReceipt';

defineProps<{
  layaway: LayawayDetail;
  business: ThermalReceiptBusiness;
  /** Misma configuración oficial que usa ThermalReceiptPrint (usePrintSettings) —
   * único origen de verdad de ancho de papel/fuente/logo/encabezado-pie. */
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
function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString('es-VE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}
</script>

<template>
  <Teleport to="body">
    <div
      id="layaway-receipt"
      :class="[
        printSettings.paper_width === '58mm' ? 'paper-58mm' : 'paper-80mm',
        printSettings.font_family === 'sans-serif' ? 'font-sans-serif' : 'font-monospace',
      ]"
    >
      <!-- 1. Encabezado del emisor -->
      <section class="receipt-section receipt-center">
        <div v-if="printSettings.show_logo && business.logoUrl" class="receipt-logo-wrap">
          <img :src="business.logoUrl" alt="" class="receipt-logo" />
        </div>
        <p class="receipt-business-name">{{ business.name || 'Mi Negocio' }}</p>
        <p v-if="business.rif">RIF: {{ business.rif }}</p>
        <p v-if="business.address">{{ business.address }}</p>
        <p v-if="business.phone">Tel: {{ business.phone }}</p>
        <p v-if="printSettings.header_custom_text" class="receipt-custom-text">{{ printSettings.header_custom_text }}</p>
      </section>

      <div class="receipt-divider" />

      <!-- 2. Datos del apartado -->
      <section class="receipt-section receipt-center">
        <p class="receipt-strong">COMPROMISO DE RESERVA (APARTADO)</p>
        <p>N° {{ layaway.reference }}</p>
        <p>{{ formatDateTime(layaway.created_at) }}</p>
        <p v-if="layaway.seller_name">Atendido por: {{ layaway.seller_name }}</p>
      </section>

      <div class="receipt-divider" />

      <!-- 3. Cliente -->
      <section class="receipt-section">
        <p><span class="receipt-label">Cliente:</span> {{ layaway.customer_name }}</p>
      </section>

      <div class="receipt-divider" />

      <!-- 4. Detalle de ítems apartados -->
      <section class="receipt-section">
        <table class="receipt-table">
          <thead>
            <tr>
              <th class="receipt-col-qty">Cant</th>
              <th class="receipt-col-desc">Descripción</th>
              <th class="receipt-col-price">P.Unit</th>
              <th class="receipt-col-total">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="line in layaway.items" :key="line.product_id">
              <td class="receipt-col-qty">{{ line.quantity }}</td>
              <td class="receipt-col-desc">{{ line.product_name }}</td>
              <td class="receipt-col-price">{{ formatUSD(line.unit_price_usd) }}</td>
              <td class="receipt-col-total">{{ formatUSD(line.quantity * line.unit_price_usd) }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <div class="receipt-divider" />

      <!-- 5. Totales del apartado -->
      <section class="receipt-section">
        <div class="receipt-row receipt-strong receipt-total-row">
          <span>TOTAL APARTADO</span>
          <span>${{ formatUSD(layaway.total_usd) }}</span>
        </div>
        <template v-if="printSettings.show_bcv_rate">
          <div class="receipt-row">
            <span>Tasa BCV</span>
            <span>Bs. {{ formatVES(layaway.exchange_rate) }}</span>
          </div>
          <div class="receipt-row">
            <span>Total Bs.</span>
            <span>Bs. {{ formatVES(layaway.total_ves) }}</span>
          </div>
        </template>

        <div class="receipt-divider-thin" />

        <div class="receipt-row receipt-strong">
          <span>Abono Inicial</span>
          <span>${{ formatUSD(layaway.initial_deposit_usd) }}</span>
        </div>
        <div class="receipt-row receipt-strong receipt-total-row">
          <span>SALDO PENDIENTE</span>
          <span>${{ formatUSD(layaway.balance_usd) }}</span>
        </div>
      </section>

      <div class="receipt-divider" />

      <!-- 6. Fecha límite de retiro -->
      <section class="receipt-section receipt-center">
        <p class="receipt-strong">FECHA LÍMITE DE RETIRO</p>
        <p class="receipt-deadline">{{ formatDate(layaway.expiration_date) }}</p>
      </section>

      <div class="receipt-divider" />

      <!-- 7. Compromiso y firma -->
      <section class="receipt-section receipt-center">
        <p class="receipt-terms">
          Me comprometo a cancelar el saldo pendiente antes de la fecha límite
          indicada. Superada esta fecha sin cancelar, la tienda podrá disponer
          libremente de la mercancía reservada.
        </p>
        <div class="receipt-signature-line" />
        <p class="receipt-signature-label">Firma de conformidad del cliente</p>
      </section>

      <div class="receipt-divider" />

      <section class="receipt-section receipt-center receipt-footer">
        <p class="receipt-footer-message">{{ printSettings.footer_custom_text || '¡Gracias por su preferencia!' }}</p>
        <p class="receipt-powered-by">Desarrollado por Efectivo 360</p>
      </section>
    </div>
  </Teleport>
</template>

<style>
/* Mismo aislamiento de impresión que ThermalReceiptPrint.vue: el ticket solo
   existe en el DOM (Teleport a <body>) a la espera de @media print. */
#layaway-receipt {
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
  #layaway-receipt {
    display: block !important;
  }
  #layaway-receipt * {
    display: revert !important;
  }

  #layaway-receipt {
    margin: 0 auto;
    color: #000;
    background: #fff;
    line-height: 1.35;
  }

  #layaway-receipt.font-monospace {
    font-family: 'Courier New', Courier, monospace;
  }
  #layaway-receipt.font-sans-serif {
    font-family: system-ui, -apple-system, Helvetica, Arial, sans-serif;
  }

  #layaway-receipt.paper-58mm {
    width: 58mm;
    max-width: 58mm;
    font-size: 10px;
    padding: 2mm;
  }

  #layaway-receipt.paper-80mm {
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

  .receipt-custom-text {
    white-space: pre-line;
    margin-top: 2px;
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

  .receipt-table {
    width: 100%;
    border-collapse: collapse;
  }

  .receipt-table th,
  .receipt-table td {
    text-align: left;
    padding: 1px 2px;
    vertical-align: top;
  }

  .receipt-table thead th {
    border-bottom: 1px dashed #000;
    font-weight: bold;
  }

  .receipt-col-qty {
    width: 12%;
  }
  .receipt-col-desc {
    width: 46%;
    word-break: break-word;
  }
  .receipt-col-price,
  .receipt-col-total {
    width: 21%;
    text-align: right;
  }

  .receipt-deadline {
    font-size: 1.2em;
    font-weight: bold;
    margin-top: 2px;
  }

  .receipt-terms {
    font-size: 0.85em;
    text-align: left;
    margin-bottom: 6px;
  }

  .receipt-signature-line {
    border-bottom: 1px solid #000;
    margin: 14px 10px 2px 10px;
  }

  .receipt-signature-label {
    font-size: 0.8em;
  }

  .receipt-footer {
    margin-top: 4px;
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
