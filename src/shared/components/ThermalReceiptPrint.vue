<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import QRCode from 'qrcode';
import type { SaleDetail } from '@/composables/useSalesHistory';
import type { ThermalReceiptBusiness, ThermalPrintSettings } from '@/composables/useThermalReceipt';

const props = defineProps<{
  sale: SaleDetail;
  business: ThermalReceiptBusiness;
  /** Configuración oficial del tenant (usePrintSettings) — única fuente de verdad
   * de qué secciones mostrar. No agregues props para overridear esto por caller. */
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
function shortHash(hash: string): string {
  return hash ? hash.slice(0, 8).toUpperCase() : '—';
}

/** "FACTURA" si la venta tiene número fiscal correlativo; "COMPROBANTE DE VENTA" si no. */
const documentTitle = computed(() =>
  props.sale.invoice_number ? 'FACTURA' : 'COMPROBANTE DE VENTA'
);

const controlNumber = computed(() =>
  props.sale.invoice_number || `#${shortHash(props.sale.public_hash)}`
);

const hasCustomerInfo = computed(() =>
  Boolean(props.sale.customer_document || props.sale.customer_address || props.sale.customer_phone)
);

/** Venta con saldo pendiente (crédito total o con abono parcial): exige firma de compromiso. */
const isCreditSale = computed(() => Number(props.sale.balance_usd) > 0);

function lineTaxSuffix(taxType: string): string {
  return taxType === 'EXENTO' ? 'E' : 'G';
}

/** Subtotal pre-impuesto en Bs. (exento + base imponible), previo al IVA. */
const subtotalVes = computed(() => {
  const tb = props.sale.tax_breakdown;
  if (!tb) return 0;
  return Number(tb.exento) + Number(tb.base_imponible);
});

const footerMessage = computed(() => props.printSettings.footer_custom_text || '¡Gracias por su compra!');

const copies = computed(() => {
  const n = Number(props.printSettings.copies_count);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
});

/** QR de verificación: codifica el hash público de la venta. Se regenera si cambia
 * la venta o se activa show_qr_code (no vale la pena generarlo si está oculto). */
const qrDataUrl = ref('');
watch(
  () => [props.sale.public_hash, props.printSettings.show_qr_code] as const,
  async ([hash, show]) => {
    if (!show || !hash) {
      qrDataUrl.value = '';
      return;
    }
    try {
      qrDataUrl.value = await QRCode.toDataURL(hash, { margin: 0, width: 96 });
    } catch {
      qrDataUrl.value = '';
    }
  },
  { immediate: true }
);
</script>

<template>
  <Teleport to="body">
    <div
      id="thermal-receipt"
      :class="[
        printSettings.paper_width === '58mm' ? 'paper-58mm' : 'paper-80mm',
        printSettings.font_family === 'sans-serif' ? 'font-sans-serif' : 'font-monospace',
      ]"
    >
      <div v-for="copyIndex in copies" :key="copyIndex" class="receipt-copy">
        <!-- 1. Encabezado del emisor -->
        <section class="receipt-section receipt-center">
          <div v-if="printSettings.show_logo && business.logoUrl" class="receipt-logo-wrap">
            <img :src="business.logoUrl" alt="" class="receipt-logo" />
          </div>
          <p class="receipt-business-name">{{ business.name || 'Mi Negocio' }}</p>
          <p v-if="business.rif">RIF: {{ business.rif }}</p>
          <p v-if="business.address">{{ business.address }}</p>
          <p v-if="business.phone">Tel: {{ business.phone }}</p>
          <p v-if="business.condition">{{ business.condition }}</p>
          <p v-if="printSettings.header_custom_text" class="receipt-custom-text">{{ printSettings.header_custom_text }}</p>
        </section>

        <div class="receipt-divider" />

        <!-- 2. Datos del documento -->
        <section class="receipt-section receipt-center">
          <p class="receipt-strong">{{ documentTitle }}</p>
          <p>N° {{ controlNumber }}</p>
          <p>{{ formatDateTime(sale.sold_at) }}</p>
          <p v-if="printSettings.show_cashier_name && sale.seller_name">Cajero: {{ sale.seller_name }}</p>
        </section>

        <div class="receipt-divider" />

        <!-- 3. Datos del cliente -->
        <section class="receipt-section">
          <p><span class="receipt-label">Cliente:</span> {{ sale.customer_name }}</p>
          <template v-if="hasCustomerInfo">
            <p v-if="sale.customer_document"><span class="receipt-label">RIF/CI:</span> {{ sale.customer_document }}</p>
            <p v-if="sale.customer_address"><span class="receipt-label">Dir:</span> {{ sale.customer_address }}</p>
            <p v-if="sale.customer_phone"><span class="receipt-label">Tel:</span> {{ sale.customer_phone }}</p>
          </template>
        </section>

        <div class="receipt-divider" />

        <!-- 4. Detalle de ítems -->
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
              <tr v-for="line in sale.lines" :key="line.id">
                <td class="receipt-col-qty">{{ line.quantity }}</td>
                <td class="receipt-col-desc">
                  {{ line.product_name || `Producto #${line.product}` }}
                  <span class="receipt-tax-suffix">({{ lineTaxSuffix(line.tax_type) }})</span>
                </td>
                <td class="receipt-col-price">{{ formatUSD(line.price_applied_usd) }}</td>
                <td class="receipt-col-total">{{ formatUSD(Number(line.quantity) * Number(line.price_applied_usd)) }}</td>
              </tr>
            </tbody>
          </table>
          <p class="receipt-tax-legend">(E) Exento &nbsp; (G) Gravable 16%</p>
        </section>

        <div class="receipt-divider" />

        <!-- 5. Totales y desglose fiscal -->
        <section class="receipt-section">
          <template v-if="printSettings.show_tax_breakdown">
            <div class="receipt-row">
              <span>Subtotal</span>
              <span>Bs. {{ formatVES(subtotalVes) }}</span>
            </div>
            <div class="receipt-row">
              <span>Monto Exento</span>
              <span>Bs. {{ formatVES(sale.tax_breakdown?.exento || 0) }}</span>
            </div>
            <div class="receipt-row">
              <span>Base Imponible (G 16%)</span>
              <span>Bs. {{ formatVES(sale.tax_breakdown?.base_imponible || 0) }}</span>
            </div>
            <div class="receipt-row">
              <span>IVA (16%)</span>
              <span>Bs. {{ formatVES(sale.tax_breakdown?.iva_total || 0) }}</span>
            </div>
            <div class="receipt-divider-thin" />
          </template>

          <div class="receipt-row receipt-strong receipt-total-row">
            <span>TOTAL USD</span>
            <span>${{ formatUSD(sale.total_usd) }}</span>
          </div>
          <template v-if="printSettings.show_bcv_rate">
            <div class="receipt-row">
              <span>Tasa BCV</span>
              <span>Bs. {{ formatVES(sale.exchange_rate) }}</span>
            </div>
            <div class="receipt-row receipt-strong receipt-total-row">
              <span>TOTAL VES</span>
              <span>Bs. {{ formatVES(sale.total_ves) }}</span>
            </div>
          </template>
        </section>

        <div class="receipt-divider" />

        <!-- 6. Métodos de pago -->
        <section class="receipt-section">
          <p class="receipt-label">Forma de Pago</p>
          <div v-for="p in sale.payments" :key="p.id" class="receipt-row">
            <span>{{ p.method_name }}</span>
            <span>
              <template v-if="Number(p.amount_usd) > 0">${{ formatUSD(p.amount_usd) }}</template>
              <template v-if="Number(p.amount_usd) > 0 && Number(p.amount_ves) > 0"> / </template>
              <template v-if="Number(p.amount_ves) > 0">Bs. {{ formatVES(p.amount_ves) }}</template>
            </span>
          </div>
          <p v-if="sale.reference" class="receipt-reference">Ref: {{ sale.reference }}</p>
        </section>

        <template v-if="isCreditSale">
          <div class="receipt-divider" />
          <section class="receipt-section receipt-center">
            <p class="receipt-strong">SALDO PENDIENTE: ${{ formatUSD(sale.balance_usd) }}</p>
            <p class="receipt-terms">
              Recibí conforme la mercancía descrita y me comprometo a cancelar el
              saldo pendiente indicado según lo acordado con la tienda.
            </p>
            <div class="receipt-signature-line" />
            <p class="receipt-signature-label">Firma de conformidad del cliente</p>
          </section>
        </template>

        <div class="receipt-divider" />

        <!-- 7. Pie de página -->
        <section class="receipt-section receipt-center receipt-footer">
          <p class="receipt-footer-message">{{ footerMessage }}</p>
          <div v-if="printSettings.show_qr_code && qrDataUrl" class="receipt-qr-wrap">
            <img :src="qrDataUrl" alt="" class="receipt-qr" />
          </div>
          <p class="receipt-powered-by">Desarrollado por Efectivo 360</p>
        </section>

        <div v-if="copyIndex < copies" class="receipt-copy-cut">✂ - - - - - - - - - - - - - - - - - - - - - - - -</div>
      </div>
    </div>
  </Teleport>
</template>

<style>
/* Fuera de impresión: el ticket nunca se ve en pantalla, solo existe en el DOM
   (vía Teleport a <body>) a la espera de @media print. */
#thermal-receipt {
  display: none;
}

@media print {
  @page {
    margin: 0;
    size: auto;
  }

  /* Aísla la impresión: oculta todo el DOM de la app y muestra solo el ticket.
     #thermal-receipt cuelga directo de <body> (Teleport), así que no hay
     ancestros intermedios que además deban re-mostrarse. */
  body * {
    display: none !important;
  }
  #thermal-receipt {
    display: block !important;
  }
  #thermal-receipt * {
    display: revert !important;
  }

  #thermal-receipt {
    margin: 0 auto;
    color: #000;
    background: #fff;
    line-height: 1.35;
  }

  #thermal-receipt.font-monospace {
    font-family: 'Courier New', Courier, monospace;
  }
  #thermal-receipt.font-sans-serif {
    font-family: system-ui, -apple-system, Helvetica, Arial, sans-serif;
  }

  #thermal-receipt.paper-58mm {
    width: 58mm;
    max-width: 58mm;
    font-size: 10px;
    padding: 2mm;
  }

  #thermal-receipt.paper-80mm {
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

  .receipt-tax-suffix {
    font-size: 0.9em;
    color: #000;
  }

  .receipt-tax-legend {
    font-size: 0.85em;
    margin-top: 2px;
  }

  .receipt-reference {
    margin-top: 2px;
    font-size: 0.95em;
  }

  .receipt-terms {
    font-size: 0.85em;
    text-align: left;
    margin: 4px 0;
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

  .receipt-qr-wrap {
    display: flex;
    justify-content: center;
    margin: 4px 0;
  }

  .receipt-qr {
    width: 20mm;
    height: 20mm;
  }

  .receipt-powered-by {
    font-size: 0.8em;
    margin-top: 2px;
  }

  .receipt-copy-cut {
    text-align: center;
    margin: 6px 0;
    font-size: 0.85em;
  }
}
</style>
