<template>
  <div class="fixed inset-0 z-50 bg-slate-50 flex flex-col overflow-hidden">
    <!-- Top bar -->
    <header class="shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between">
      <div class="flex items-center gap-3 min-w-0">
        <button @click="goBack" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0">
          <ArrowLeft class="w-4 h-4" />
        </button>
        <div class="min-w-0">
          <h1 class="text-base font-semibold text-slate-800 truncate">Ingreso de Factura de Compra</h1>
          <p class="text-[11px] text-slate-400 truncate">Re-compra Express con unidades de empaque</p>
        </div>
      </div>
    </header>

    <!-- Financial header bar -->
    <div class="shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 py-3">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Proveedor</label>
          <div class="flex gap-1.5">
            <select v-model="supplierId"
              class="flex-1 min-w-0 h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
              <option value="">{{ loadingSuppliers ? 'Cargando...' : 'Sin proveedor / Genérico' }}</option>
              <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }} ({{ s.rif }})</option>
            </select>
            <button @click="showQuickSupplier = true"
              class="shrink-0 h-9 px-2.5 rounded-lg border border-slate-300 text-slate-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center gap-1 text-xs font-medium"
              title="Nuevo proveedor">
              <Plus class="w-3.5 h-3.5" /> Nuevo
            </button>
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">
            {{ invoiceNumberLabel }} <span v-if="invoiceNumberRequired" class="text-red-400">*</span>
            <span v-else class="text-slate-400 font-normal">(opcional)</span>
          </label>
          <input v-model="invoiceNumber" type="text" :placeholder="invoiceNumberRequired ? 'Ej: FACT-8849' : 'Ej: CONS-001'"
            class="w-full h-9 px-3 text-sm border rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            :class="invoiceTouched && invoiceNumberRequired && !invoiceNumber.trim() ? 'border-rose-400' : 'border-slate-300'"
            @blur="invoiceTouched = true" />
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Flete / Transporte ({{ currencySymbol }})</label>
          <input v-model.number="freightAmount" type="number" min="0" step="0.01" placeholder="0.00"
            class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
          <p v-if="currency === 'VES'" class="text-[10px] text-slate-400 mt-0.5">= ${{ toUsd(freightAmount || 0).toFixed(2) }} USD</p>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Descuento Global ({{ currencySymbol }})</label>
          <input v-model.number="discountAmount" type="number" min="0" step="0.01" placeholder="0.00"
            class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
          <p v-if="currency === 'VES'" class="text-[10px] text-slate-400 mt-0.5">= ${{ toUsd(discountAmount || 0).toFixed(2) }} USD</p>
        </div>
      </div>

      <div class="mt-3 flex flex-col sm:flex-row sm:items-center gap-2 flex-wrap">
        <span class="text-xs font-medium text-slate-600 shrink-0">Moneda:</span>
        <div class="flex items-center rounded-full border border-slate-200 p-0.5 bg-slate-50 shrink-0">
          <button type="button" @click="currency = 'USD'"
            class="px-3 py-1 text-[11px] font-semibold rounded-full transition-colors"
            :class="currency === 'USD' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'">
            $ USD
          </button>
          <button type="button" @click="currency = 'VES'"
            class="px-3 py-1 text-[11px] font-semibold rounded-full transition-colors"
            :class="currency === 'VES' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'">
            Bs. VES
          </button>
        </div>
        <div v-if="currency === 'VES'" class="flex items-center gap-1.5">
          <label class="text-[11px] text-slate-500">Tasa BCV (Bs/$):</label>
          <input v-model.number="exchangeRate" type="number" min="0.0001" step="0.01"
            @input="exchangeRateTouched = true"
            class="w-24 h-7 px-2 text-xs text-right border border-slate-300 rounded-md bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
      </div>

      <div class="mt-3 flex flex-col gap-2">
        <div class="flex flex-col sm:flex-row sm:items-center gap-2">
          <span class="text-xs font-medium text-slate-600 shrink-0">Origen de Fondos / Modalidad:</span>
          <div class="flex items-center gap-1.5 flex-wrap">
            <button v-for="opt in paymentSourceOptions" :key="opt.value" type="button"
              :disabled="opt.value === 'CASH_DRAWER' && !cashDrawerAvailable"
              :title="opt.value === 'CASH_DRAWER' && !cashDrawerAvailable
                ? 'Debes abrir turno/gavetero para registrar egresos en efectivo'
                : ''"
              @click="paymentSource = opt.value"
              class="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold rounded-full border transition-colors"
              :class="paymentSource === opt.value
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : (opt.value === 'CASH_DRAWER' && !cashDrawerAvailable)
                  ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'">
              <span>{{ opt.emoji }}</span> {{ opt.label }}
            </button>
          </div>
        </div>

        <div class="flex items-center gap-1.5 text-[11px] rounded-lg px-2.5 py-1.5 w-fit" :class="badgeClass">
          <Loader2 v-if="paymentSource === 'CASH_DRAWER' && loadingBalance" class="w-3.5 h-3.5 shrink-0 animate-spin" />
          <AlertTriangle v-else-if="badgeIcon === 'alert'" class="w-3.5 h-3.5 shrink-0" />
          <Wallet v-else-if="badgeIcon === 'wallet'" class="w-3.5 h-3.5 shrink-0" />
          <Handshake v-else-if="badgeIcon === 'handshake'" class="w-3.5 h-3.5 shrink-0" />
          <FileText v-else-if="badgeIcon === 'file'" class="w-3.5 h-3.5 shrink-0" />
          <PackageOpen v-else-if="badgeIcon === 'package'" class="w-3.5 h-3.5 shrink-0" />
          <span>{{ badgeText }}</span>
        </div>

        <select v-if="paymentSource === 'SUPPLIER_CREDIT' || paymentSource === 'CONSIGNMENT'" v-model="supplierId"
          class="h-7 px-2 text-[11px] border border-slate-300 rounded-full bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 w-fit"
          :class="!supplierId ? 'border-rose-300 text-rose-600' : ''">
          <option value="">{{ paymentSource === 'CONSIGNMENT' ? 'Selecciona proveedor consignante...' : 'Selecciona proveedor para la CxP...' }}</option>
          <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </div>
    </div>

    <!-- Quick entry bar -->
    <div class="shrink-0 bg-slate-100 border-b border-slate-200 px-4 sm:px-6 py-2.5">
      <div class="relative max-w-xl" ref="quickEntryContainerRef">
        <ScanBarcode class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          ref="quickEntryInput"
          v-model="quickEntryQuery"
          type="text"
          autofocus
          placeholder="Escribe código de barras o nombre del producto..."
          class="w-full h-10 pl-9 pr-9 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
          @keydown.down.prevent="highlightNext"
          @keydown.up.prevent="highlightPrev"
          @keydown.enter.prevent="handleQuickEntryEnter"
        />
        <Loader2 v-if="searching" class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />

        <div v-if="searchResults.length > 0"
          class="absolute z-30 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
          <button v-for="(p, i) in searchResults" :key="p.product_id || p.global_product_id || i"
            @click="addProductRow(p)" @mouseenter="highlightedIndex = i"
            class="w-full text-left px-3 py-2.5 border-b border-slate-100 last:border-0 flex items-center gap-3 transition-colors"
            :class="i === highlightedIndex ? 'bg-blue-50' : 'hover:bg-slate-50'">
            <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
              <img v-if="p.image" :src="p.image" class="w-full h-full object-cover" alt="" />
              <Package v-else class="w-4 h-4 text-slate-300" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5">
                <p class="text-sm font-medium text-slate-800 truncate">{{ p.name }}</p>
                <span v-if="isNewLocal(p)"
                  class="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-semibold rounded bg-blue-50 text-blue-600 border border-blue-200 shrink-0">
                  <Globe2 class="w-2.5 h-2.5" /> Banco Global
                </span>
              </div>
              <p class="text-[11px] text-slate-400 font-mono">
                {{ p.barcode || `SKU: ${p.sku}` }}
                <span v-if="!isNewLocal(p)">· Stock: {{ formatQty(p.stock) }}</span>
              </p>
            </div>
          </button>
        </div>
        <div v-else-if="notFound"
          class="absolute z-30 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm text-rose-500">
          No se encontró ningún producto para "{{ lastQuery }}"
        </div>
      </div>
    </div>

    <!-- Grid -->
    <div class="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
      <div class="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr>
                <th class="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase min-w-[220px]">Producto</th>
                <th class="text-left px-2 py-3 text-xs font-semibold text-slate-500 uppercase w-28">Empaque</th>
                <th class="text-right px-2 py-3 text-xs font-semibold text-slate-500 uppercase w-24">Factor Conv.</th>
                <th class="text-right px-2 py-3 text-xs font-semibold text-slate-500 uppercase w-24">Cant. Comprada</th>
                <th class="text-right px-2 py-3 text-xs font-semibold text-slate-500 uppercase w-32">Total Unidades</th>
                <th class="text-right px-2 py-3 text-xs font-semibold text-slate-500 uppercase w-28">Costo Empaque ({{ currencySymbol }})</th>
                <th class="text-right px-2 py-3 text-xs font-semibold text-slate-500 uppercase w-28">Costo Unit.</th>
                <th class="text-right px-2 py-3 text-xs font-semibold text-slate-500 uppercase w-24">% Margen</th>
                <th class="text-right px-2 py-3 text-xs font-semibold text-slate-500 uppercase w-32">Precio Venta POS</th>
                <th class="text-center px-2 py-3 w-10"><span class="sr-only">Acción</span></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="(row, i) in rows" :key="row.key" class="hover:bg-slate-50/50 transition-colors">
                <td class="px-3 py-2.5">
                  <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                      <img v-if="row.product.image" :src="row.product.image" class="w-full h-full object-cover" alt="" />
                      <Package v-else class="w-4 h-4 text-slate-300" />
                    </div>
                    <div class="min-w-0">
                      <p class="text-sm font-medium text-slate-800 truncate max-w-[220px]">{{ row.product.name }}</p>
                      <div class="flex items-center gap-1.5 mt-0.5">
                        <code v-if="row.product.barcode" class="text-[10px] font-mono text-slate-400">{{ row.product.barcode }}</code>
                        <span v-else class="inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold rounded bg-amber-50 text-amber-600 border border-amber-200 font-mono">
                          SKU: {{ row.product.sku }}
                        </span>
                        <span class="inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold rounded bg-slate-100 text-slate-500 border border-slate-200">
                          Venta: {{ row.product.sale_unit }}
                        </span>
                        <span v-if="isNewLocal(row.product)"
                          class="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-semibold rounded bg-blue-50 text-blue-600 border border-blue-200"
                          title="Se importará al Catálogo del tenant solo al procesar la factura">
                          <Globe2 class="w-2.5 h-2.5" /> Nuevo · Banco Global
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-2 py-2.5">
                  <select v-model="row.purchase_unit_name"
                    class="w-full h-8 px-2 text-xs border border-slate-200 rounded-md bg-transparent text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-400">
                    <option v-for="opt in packageOptionsFor(row.product.sale_unit)" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                  </select>
                </td>
                <td class="px-2 py-2.5">
                  <input v-model.number="row.conversion_factor" type="number" min="0.001" step="0.001"
                    @input="recalcPriceFromMargin(row)"
                    class="w-full h-8 px-2 text-xs text-right border border-slate-200 rounded-md bg-transparent text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                </td>
                <td class="px-2 py-2.5">
                  <input :ref="(el) => setQtyRef(row.key, el)"
                    v-model.number="row.packages_quantity" type="number" min="0.001" step="0.001"
                    class="w-full h-8 px-2 text-xs text-right font-semibold border border-slate-200 rounded-md bg-transparent text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    @keydown.enter.prevent="focusQuickEntry" />
                </td>
                <td class="px-2 py-2.5 text-right">
                  <span class="text-sm font-semibold text-emerald-600">+{{ formatQty(unitsAdded(row)) }} {{ unitsLabelFor(row.product.sale_unit) }}</span>
                  <p class="text-[10px] text-slate-400 leading-tight">
                    {{ formatQty(row.packages_quantity) }} {{ row.purchase_unit_name || 'u' }} × {{ row.conversion_factor }}
                  </p>
                </td>
                <td class="px-2 py-2.5">
                  <input v-model.number="row.package_cost" type="number" min="0" step="0.01"
                    @input="recalcPriceFromMargin(row)"
                    class="w-full h-8 px-2 text-xs text-right border border-slate-200 rounded-md bg-transparent text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                  <p v-if="currency === 'VES'" class="text-[10px] text-slate-400 leading-tight">
                    = ${{ toUsd(row.package_cost || 0).toFixed(2) }} USD
                  </p>
                </td>
                <td class="px-2 py-2.5 text-right">
                  <span class="text-xs font-medium text-slate-700">${{ unitCostUsd(row).toFixed(2) }}</span>
                  <p class="text-[10px] text-slate-400">/ {{ row.product.sale_unit }}</p>
                </td>
                <td class="px-2 py-2.5" :class="isLowMargin(row) ? 'bg-amber-50' : ''">
                  <div class="relative">
                    <input v-model.number="row.target_margin_percentage" type="number" min="0" step="0.5"
                      placeholder="30"
                      @input="recalcPriceFromMargin(row)"
                      class="w-full h-8 pl-2 pr-5 text-xs text-right border rounded-md bg-transparent text-slate-800 focus:outline-none focus:ring-1"
                      :class="isLowMargin(row) ? 'border-amber-300 focus:ring-amber-500' : 'border-slate-200 focus:ring-blue-400'" />
                    <span class="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">%</span>
                  </div>
                </td>
                <td class="px-2 py-2.5" :class="isLowMargin(row) ? 'bg-amber-50' : ''">
                  <p class="text-[10px] text-slate-400 text-right mb-0.5">Actual: ${{ row.product.current_price.toFixed(2) }}</p>
                  <input v-model.number="row.new_selling_price_usd" type="number" min="0" step="0.01"
                    placeholder="Nuevo precio"
                    @input="recalcMarginFromPrice(row)"
                    class="w-full h-8 px-2 text-xs text-right border rounded-md bg-white text-slate-800 focus:outline-none focus:ring-1"
                    :class="isLowMargin(row) ? 'border-amber-300 focus:ring-amber-500' : 'border-slate-200 focus:ring-blue-400'" />
                  <p v-if="isLowMargin(row)" class="text-[10px] text-amber-700 mt-0.5 flex items-center gap-0.5">
                    <AlertTriangle class="w-3 h-3 shrink-0" /> Margen bajo (&lt;15%)
                  </p>
                </td>
                <td class="px-2 py-2.5 text-center">
                  <button @click="removeRow(i)" class="p-1.5 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
              <tr v-if="rows.length === 0">
                <td colspan="10" class="px-4 py-16 text-center text-slate-400">
                  <ScanBarcode class="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p class="text-sm">Escanea o busca un producto arriba para empezar la factura</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Sticky footer -->
    <div class="shrink-0 bg-white border-t border-slate-200 px-4 sm:px-6 py-3">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div class="flex items-center gap-5 text-xs text-slate-500">
          <span>Total Ítems: <strong class="text-slate-700">{{ rows.length }}</strong></span>
          <span>Total Unidades Nuevas: <strong class="text-emerald-600">+{{ formatQty(totalUnitsAdded) }}</strong></span>
          <span class="text-sm">TOTAL A PAGAR: <strong class="text-slate-900 text-base">${{ grandTotal.toFixed(2) }}</strong></span>
        </div>
        <button @click="submit" :disabled="!canSubmit || submitting"
          class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm">
          <Loader2 v-if="submitting" class="w-4 h-4 animate-spin" />
          <PackageCheck v-else class="w-4 h-4" />
          {{ submitting ? 'Procesando...' : `Procesar Factura y Despachar a Inventario ($${grandTotal.toFixed(2)})` }}
        </button>
      </div>
    </div>

    <QuickProductCreateModal
      :visible="showQuickCreate"
      :barcode="quickCreateBarcode"
      @close="showQuickCreate = false"
      @created="onQuickCreateSuccess"
    />

    <QuickSupplierModal
      :visible="showQuickSupplier"
      @close="showQuickSupplier = false"
      @created="onSupplierCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDebounceFn } from '@vueuse/core';
import {
  ArrowLeft, ScanBarcode, Loader2, Package, Trash2, PackageCheck, Wallet, AlertTriangle, Plus,
  Handshake, FileText, PackageOpen, Globe2,
} from 'lucide-vue-next';
import { fetchApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';
import { useCajaStore } from '@/stores/caja';
import { useForexRate } from '@/composables/useForexRate';
import QuickProductCreateModal, { type QuickCreatedProduct } from './QuickProductCreateModal.vue';
import QuickSupplierModal, { type QuickCreatedSupplier } from './QuickSupplierModal.vue';
import { packageOptionsFor, directPackageFor, unitsLabelFor } from '@/composables/usePackageTypes';

type PaymentSource = 'CASH_DRAWER' | 'CAPITAL_INJECTION' | 'SUPPLIER_CREDIT' | 'CONSIGNMENT';
type Currency = 'USD' | 'VES';

// Matches the backend's strict `package_type` enum (apps/purchases/serializers.py).
// Anything outside this set (e.g. any of the measure-specific labels from
// usePackageTypes) still submits fine via the free-text `purchase_unit_name`
// legacy alias — see submit()'s payload mapping below.
const KNOWN_BACKEND_PACKAGE_TYPES = new Set(['BULTO', 'CAJA', 'SACO', 'PIPA', 'GALON', 'UNIDAD']);

interface SearchProduct {
  /** Local Product ULID — set only when this product already exists in the tenant's DB. */
  product_id: string | null;
  /** GlobalProduct ULID — set only when this is a Banco Global hit not yet cloned to
   *  the tenant. Selecting it never calls a local-creation endpoint; the clone happens
   *  once, inside PurchaseExpressEntrySerializer.create(), when the invoice is processed. */
  global_product_id: string | null;
  name: string;
  sku: string;
  /** Real printed/scanned barcode. Empty when the product genuinely has none (manually created). */
  barcode: string;
  image: string | null;
  stock: number;
  sale_unit: string;
  purchase_unit_name: string;
  conversion_factor: number;
  current_cost: number;
  current_price: number;
  tax_type?: string;
}

interface GridRow {
  key: number;
  product: SearchProduct;
  purchase_unit_name: string;
  conversion_factor: number;
  packages_quantity: number;
  /** In the invoice's `currency` (native) — converted to USD via toUsd() for all math. */
  package_cost: number;
  target_margin_percentage: number | null;
  new_selling_price_usd: number | null;
}

interface SupplierOption {
  id: string;
  name: string;
  rif: string;
}

const router = useRouter();
const route = useRoute();
const { success, error: notifyError } = useNotify();
const cajaStore = useCajaStore();

// ── Header state ──
const suppliers = ref<SupplierOption[]>([]);
const loadingSuppliers = ref(true);
const supplierId = ref('');
const showQuickSupplier = ref(false);
const invoiceNumber = ref('');
const invoiceTouched = ref(false);
const controlNumber = ref('');
const freightAmount = ref<number>(0);
const discountAmount = ref<number>(0);

const paymentSourceOptions: { value: PaymentSource; label: string; emoji: string }[] = [
  { value: 'CASH_DRAWER', label: 'Gavetero / Caja', emoji: '💵' },
  { value: 'CAPITAL_INJECTION', label: 'Aporte de Socio', emoji: '🤝' },
  { value: 'SUPPLIER_CREDIT', label: 'Crédito Proveedor', emoji: '📝' },
  { value: 'CONSIGNMENT', label: 'Consignación', emoji: '📦' },
];
const paymentSource = ref<PaymentSource>('CASH_DRAWER');

const invoiceNumberRequired = computed(() => paymentSource.value !== 'CONSIGNMENT');
const invoiceNumberLabel = computed(() => (
  paymentSource.value === 'CONSIGNMENT' ? 'N° Nota / Control Consignación' : 'N° Factura / Control'
));

const turnoActivo = computed(() => cajaStore.turnoActivo);
const loadingBalance = ref(false);
const expectedCashUsd = ref<number | null>(null);

// ── Currency / BCV rate ──
// useForexRate() fetches the current rate on its own mount hook — no manual call needed.
const { rateValue: bcvRate } = useForexRate();
const currency = ref<Currency>('USD');
const exchangeRate = ref<number | null>(null);
const exchangeRateTouched = ref(false);
const currencySymbol = computed(() => (currency.value === 'VES' ? 'Bs.' : '$'));

/** Converts a native-currency amount (per `currency`) to USD. No-op when currency is USD. */
function toUsd(nativeAmount: number): number {
  if (currency.value !== 'VES') return nativeAmount;
  const rate = exchangeRate.value || 0;
  return rate > 0 ? nativeAmount / rate : 0;
}

watch(currency, (v) => {
  if (v === 'VES' && !exchangeRate.value && bcvRate.value > 0) {
    exchangeRate.value = bcvRate.value;
  }
});
watch(bcvRate, (v) => {
  if (currency.value === 'VES' && !exchangeRateTouched.value && v > 0) {
    exchangeRate.value = v;
  }
});

// ── Quick entry ──
const quickEntryInput = ref<HTMLInputElement | null>(null);
const quickEntryContainerRef = ref<HTMLElement | null>(null);
const quickEntryQuery = ref('');
const searching = ref(false);
const notFound = ref(false);
const lastQuery = ref('');
const searchResults = ref<SearchProduct[]>([]);
const highlightedIndex = ref(-1);

// ── Grid state ──
const rows = ref<GridRow[]>([]);
let rowKeySeq = 0;
const qtyRefs: Record<number, HTMLInputElement> = {};

function setQtyRef(key: number, el: unknown) {
  if (el) qtyRefs[key] = el as HTMLInputElement;
  else delete qtyRefs[key];
}

/** GET /api/v1/products/:id/ — always an existing local product (used by the "Reponer" deep link). */
function mapProduct(item: any): SearchProduct {
  const defaultPres = (item.presentations || []).find((p: any) => p.is_default) || item.presentations?.[0];
  const anchor = defaultPres?.prices?.find((pr: any) => pr.is_anchor);
  return {
    product_id: item.id,
    global_product_id: null,
    name: item.effective_name || item.global_product?.official_name || 'Producto',
    sku: item.effective_sku || item.global_product?.sku || '',
    barcode: defaultPres?.barcode || '',
    image: item.image || null,
    stock: Number(item.total_stock ?? 0),
    sale_unit: item.sale_unit || 'UNIDAD',
    purchase_unit_name: item.purchase_unit_name || item.container_type || '',
    conversion_factor: Number(item.default_conversion_factor || item.container_capacity || 1) || 1,
    current_cost: Number(anchor?.cost ?? 0),
    current_price: Number(anchor?.retail_price ?? 0),
  };
}

/**
 * Flat item shape from GET /api/v1/catalog/lookup/ (?barcode= single hit, or ?q= list
 * under `results`). 100% read-only endpoint — a GLOBAL hit means the product lives only
 * in the Banco Global and has `product_id: null` / `global_product_id` set; it is NOT
 * cloned into the tenant by searching or selecting it.
 */
function mapCatalogLookupProduct(res: any): SearchProduct {
  return {
    product_id: res.product_id ?? null,
    global_product_id: res.global_product_id ?? null,
    name: res.name,
    sku: res.sku,
    barcode: res.barcode || '',
    image: res.image ?? null,
    stock: Number(res.current_stock ?? 0),
    sale_unit: res.sale_unit || 'UNIDAD',
    purchase_unit_name: res.purchase_unit_name || '',
    conversion_factor: Number(res.default_conversion_factor || 1) || 1,
    current_cost: Number(res.cost_price_usd ?? 0),
    current_price: Number(res.price_usd ?? 0),
    tax_type: res.tax_type || '',
  };
}

/** True when this product only exists in the Banco Global — selecting it queues an
 *  import that only happens if/when the invoice is processed. */
function isNewLocal(product: SearchProduct): boolean {
  return !product.product_id;
}

// A scanned code is all digits/dashes; a typed product name never looks like this.
const BARCODE_SHAPE = /^[0-9\s-]{4,}$/;
function looksLikeBarcode(term: string): boolean {
  return BARCODE_SHAPE.test(term.trim());
}

/** Gentle two-note chime — distinct from an error buzz — cued when quick-create opens. */
function playSoftTone() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    [880, 1175].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = now + i * 0.11;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.12, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.2);
    });
    setTimeout(() => ctx.close(), 500);
  } catch { /* best-effort chime, never block the flow */ }
}

const showQuickCreate = ref(false);
const quickCreateBarcode = ref('');

function openQuickCreate(barcode: string) {
  playSoftTone();
  quickCreateBarcode.value = barcode;
  showQuickCreate.value = true;
  quickEntryQuery.value = '';
  searchResults.value = [];
  notFound.value = false;
}

function onQuickCreateSuccess(product: QuickCreatedProduct) {
  showQuickCreate.value = false;
  // Registro Rápido always creates the local Product synchronously — this row
  // is local from the start, not a Banco Global reference.
  const { id, ...rest } = product;
  addProductRow({ ...rest, product_id: id, global_product_id: null });
}

/**
 * GET /api/v1/catalog/lookup/?barcode= — exact-match lookup, used for every
 * barcode-shaped scan/entry. 100% read-only: a GLOBAL hit is NOT cloned into
 * the tenant here — it only gets added to the in-memory grid, and only
 * becomes a real local Product if/when "Procesar Factura" is clicked.
 * 200: product exists locally, or exists in the Banco Global (not yet local) —
 *      confirm with a chime + row insert + toast.
 * 404: not found anywhere — open Registro Rápido to create it.
 */
async function handleBarcodeScan(barcode: string) {
  if (showQuickCreate.value) return;
  searching.value = true;
  notFound.value = false;
  try {
    const res = await fetchApi<any>('/api/v1/catalog/lookup/', { params: { barcode } });
    const product = mapCatalogLookupProduct(res);
    playSoftTone();
    addProductRow(product);
    success(
      isNewLocal(product)
        ? 'Producto del Banco Global agregado. Se importará al procesar la factura.'
        : 'Producto local agregado a la factura.',
    );
  } catch (e: any) {
    if (e?.status === 404) {
      openQuickCreate(barcode);
    } else {
      notifyError(extractErrorMessage(e));
      lastQuery.value = barcode;
      notFound.value = true;
    }
  } finally {
    searching.value = false;
  }
}

function onSupplierCreated(supplier: QuickCreatedSupplier) {
  suppliers.value.push(supplier);
  supplierId.value = supplier.id;
  showQuickSupplier.value = false;
}

const debouncedSearch = useDebounceFn(async (term: string) => {
  // Barcode-shaped input is an exact scan, not a fuzzy name search — route it
  // through the dedicated Catálogo Global lookup instead.
  if (looksLikeBarcode(term)) {
    await handleBarcodeScan(term);
    return;
  }
  searching.value = true;
  notFound.value = false;
  try {
    // Pure read: GET /api/v1/catalog/lookup/?q= — merges local-tenant products
    // with Banco Global hits, without cloning any of them into the tenant.
    const res = await fetchApi<any>('/api/v1/catalog/lookup/', { params: { q: term } });
    const items = Array.isArray(res?.results) ? res.results : [];
    const mapped = items.map(mapCatalogLookupProduct);
    searchResults.value = mapped;
    highlightedIndex.value = mapped.length > 0 ? 0 : -1;
    if (mapped.length === 0) {
      lastQuery.value = term;
      notFound.value = true;
    }
  } catch {
    searchResults.value = [];
    lastQuery.value = term;
    notFound.value = true;
  } finally {
    searching.value = false;
  }
}, 300);

watch(quickEntryQuery, (v) => {
  notFound.value = false;
  if (!v.trim()) { searchResults.value = []; return; }
  debouncedSearch(v.trim());
});

function highlightNext() {
  if (searchResults.value.length === 0) return;
  highlightedIndex.value = (highlightedIndex.value + 1) % searchResults.value.length;
}
function highlightPrev() {
  if (searchResults.value.length === 0) return;
  highlightedIndex.value = (highlightedIndex.value - 1 + searchResults.value.length) % searchResults.value.length;
}

function handleQuickEntryEnter() {
  const term = quickEntryQuery.value.trim();
  if (searchResults.value.length === 0) {
    // Scanner Enter can fire before the debounce resolves — don't make it wait.
    if (term && looksLikeBarcode(term) && !showQuickCreate.value) handleBarcodeScan(term);
    return;
  }
  const idx = highlightedIndex.value >= 0 ? highlightedIndex.value : 0;
  const product = searchResults.value[idx];
  if (product) addProductRow(product);
}

function habitualMarginPct(product: SearchProduct): number | null {
  if (!product.current_cost || product.current_cost <= 0) return null;
  return ((product.current_price - product.current_cost) / product.current_cost) * 100;
}

function addProductRow(product: SearchProduct) {
  // Keep the product's own habitual package only if it's actually valid for its
  // measure (e.g. a PESO product historically bought in SACO); otherwise default
  // to the "direct" option for that measure — never a package from another
  // measure, and never its stale conversion factor (a "direct" package is 1:1).
  const validPackages = packageOptionsFor(product.sale_unit).map((opt) => opt.value);
  const hasValidHabitualPackage = validPackages.includes(product.purchase_unit_name);
  const defaultPurchaseUnitName = hasValidHabitualPackage
    ? product.purchase_unit_name
    : directPackageFor(product.sale_unit);
  const conversionFactor = hasValidHabitualPackage && product.conversion_factor > 0
    ? product.conversion_factor
    : 1;
  const key = ++rowKeySeq;
  const seedCostUsd = Math.round(product.current_cost * conversionFactor * 100) / 100;
  rows.value.push({
    key,
    product,
    purchase_unit_name: defaultPurchaseUnitName,
    conversion_factor: conversionFactor,
    packages_quantity: 1,
    // Seed cost in the invoice's current currency so the field reads naturally.
    package_cost: currency.value === 'VES' ? seedCostUsd * (exchangeRate.value || 0) : seedCostUsd,
    target_margin_percentage: habitualMarginPct(product),
    new_selling_price_usd: null,
  });

  quickEntryQuery.value = '';
  searchResults.value = [];
  notFound.value = false;
  highlightedIndex.value = -1;

  nextTick(() => qtyRefs[key]?.focus());
}

function focusQuickEntry() {
  nextTick(() => quickEntryInput.value?.focus());
}

function removeRow(i: number) {
  rows.value.splice(i, 1);
}

// ── Per-row derived values (index/row-based helpers, matching PurchaseForm.vue convention) ──
function unitsAdded(row: GridRow): number {
  return (row.packages_quantity || 0) * (row.conversion_factor || 0);
}

function unitCostUsd(row: GridRow): number {
  if (!row.conversion_factor) return 0;
  return toUsd(row.package_cost || 0) / row.conversion_factor;
}

/** Margin → price. Triggered by editing margin, or by cost/factor inputs that shift unit cost. */
function recalcPriceFromMargin(row: GridRow) {
  if (row.target_margin_percentage == null) return;
  const cost = unitCostUsd(row);
  if (cost <= 0) return;
  row.new_selling_price_usd = Math.round(cost * (1 + row.target_margin_percentage / 100) * 100) / 100;
}

/** Price → margin. Triggered by editing the selling price directly. */
function recalcMarginFromPrice(row: GridRow) {
  if (row.new_selling_price_usd == null) return;
  const cost = unitCostUsd(row);
  if (cost <= 0) return;
  row.target_margin_percentage = Math.round(((row.new_selling_price_usd - cost) / cost) * 100 * 100) / 100;
}

function isLowMargin(row: GridRow): boolean {
  return row.target_margin_percentage != null && row.target_margin_percentage < 15;
}

const totalUnitsAdded = computed(() => rows.value.reduce((s, r) => s + unitsAdded(r), 0));
const itemsSubtotal = computed(() => rows.value.reduce((s, r) => s + (r.packages_quantity || 0) * toUsd(r.package_cost || 0), 0));
const grandTotal = computed(() => Math.max(0, itemsSubtotal.value + toUsd(freightAmount.value || 0) - toUsd(discountAmount.value || 0)));

const insufficientBalance = computed(() => (
  paymentSource.value === 'CASH_DRAWER' &&
  expectedCashUsd.value != null &&
  grandTotal.value > expectedCashUsd.value
));

// Treated as available while the check is still in flight, so the pill doesn't
// flash disabled→enabled on first render.
const cashDrawerAvailable = computed(() => loadingBalance.value || !!turnoActivo.value);

const badgeIcon = computed(() => {
  if (paymentSource.value === 'CASH_DRAWER') {
    if (!turnoActivo.value || insufficientBalance.value) return 'alert';
    return 'wallet';
  }
  if (paymentSource.value === 'CAPITAL_INJECTION') return 'handshake';
  if (paymentSource.value === 'SUPPLIER_CREDIT') return 'file';
  if (paymentSource.value === 'CONSIGNMENT') return 'package';
  return null;
});

const badgeText = computed(() => {
  switch (paymentSource.value) {
    case 'CASH_DRAWER': {
      if (loadingBalance.value) return 'Verificando caja...';
      if (!turnoActivo.value) return 'No hay caja abierta.';
      if (insufficientBalance.value) {
        return `Saldo insuficiente en caja ($${expectedCashUsd.value?.toFixed(2)}). Puedes continuar si un Administrador lo aprueba.`;
      }
      const label = turnoActivo.value.register_name ? `la Caja ${turnoActivo.value.register_name}` : 'tu caja activa';
      return `Se debitará del gavetero de ${label}.`;
    }
    case 'CAPITAL_INJECTION':
      return 'Inyección externa de capital. No afecta la caja del día.';
    case 'SUPPLIER_CREDIT':
      return 'Se generará una Cuenta por Pagar (CxP) a este proveedor.';
    case 'CONSIGNMENT':
      return 'Entrada de mercancía sin egreso financiero inmediato. Se liquidará según venta.';
    default:
      return '';
  }
});

const badgeClass = computed(() => {
  if (paymentSource.value === 'CASH_DRAWER') {
    if (!turnoActivo.value) return 'bg-rose-50 text-rose-700 border border-rose-200';
    if (insufficientBalance.value) return 'bg-amber-50 text-amber-700 border border-amber-200';
    return 'bg-blue-50 text-blue-700 border border-blue-200';
  }
  if (paymentSource.value === 'CAPITAL_INJECTION') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (paymentSource.value === 'SUPPLIER_CREDIT') return 'bg-slate-50 text-slate-700 border border-slate-200';
  if (paymentSource.value === 'CONSIGNMENT') return 'bg-purple-50 text-purple-700 border border-purple-200';
  return 'bg-slate-50 text-slate-600 border border-slate-200';
});

const canSubmit = computed(() => {
  if (submitting.value) return false;
  if (rows.value.length === 0) return false;
  if (invoiceNumberRequired.value && !invoiceNumber.value.trim()) return false;
  if (paymentSource.value === 'CASH_DRAWER' && !turnoActivo.value) return false;
  if ((paymentSource.value === 'SUPPLIER_CREDIT' || paymentSource.value === 'CONSIGNMENT') && !supplierId.value) return false;
  if (currency.value === 'VES' && !(exchangeRate.value && exchangeRate.value > 0)) return false;
  return rows.value.every((r) => r.conversion_factor > 0 && r.packages_quantity > 0);
});

function formatQty(v: number): string {
  return (v || 0).toLocaleString('es', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// ── Data loading ──
async function loadSuppliers() {
  loadingSuppliers.value = true;
  try {
    const res = await fetchApi<any>('/api/v1/purchases/suppliers/?page_size=200');
    const items = Array.isArray(res?.results) ? res.results : (Array.isArray(res) ? res : []);
    suppliers.value = items.map((s: any) => ({ id: s.id, name: s.name, rif: s.rif }));
  } catch {
    suppliers.value = [];
  } finally {
    loadingSuppliers.value = false;
  }
}

async function loadCashDrawerContext() {
  loadingBalance.value = true;
  try {
    if (!cajaStore.turnoActivo) await cajaStore.verificarTurnoActivo();
    if (cajaStore.turnoActivo?.id) {
      const res = await fetchApi<any>(`/api/shifts/${cajaStore.turnoActivo.id}/expected-balance/`);
      expectedCashUsd.value = Number(res?.breakdown?.CASH_USD?.usd ?? res?.total?.usd ?? 0);
    } else {
      expectedCashUsd.value = null;
    }
  } catch {
    expectedCashUsd.value = null;
  } finally {
    loadingBalance.value = false;
  }
}

watch(paymentSource, (v) => {
  if (v === 'CASH_DRAWER' && expectedCashUsd.value == null) loadCashDrawerContext();
});

// ── Submit ──
const submitting = ref(false);

function extractErrorMessage(e: any): string {
  const data = e?.data;
  if (data && typeof data === 'object') {
    const firstKey = Object.keys(data)[0];
    const val = firstKey ? data[firstKey] : null;
    if (Array.isArray(val) && val.length) return String(val[0]);
    if (typeof val === 'string') return val;
  }
  return e?.message || 'Error al procesar la factura';
}

function buildSuccessMessage(res: any): string {
  const financial = res?.financial;
  const base = `Factura #${res?.purchase?.invoice_number || invoiceNumber.value} procesada. +${formatQty(totalUnitsAdded.value)} unidades agregadas al inventario`;
  if (!financial) return `${base}.`;
  const amount = Number(financial.amount_usd ?? res?.purchase?.total_amount_usd ?? 0).toFixed(2);
  switch (financial.type) {
    case 'CASH_DRAWER_OUTFLOW': {
      const label = cajaStore.turnoActivo?.register_name || `#${financial.shift_id}`;
      return `${base}. Egreso de $${amount} registrado en Caja ${label}.`;
    }
    case 'ACCOUNTS_PAYABLE': {
      const total = Number(financial.total_amount ?? amount).toFixed(2);
      return `${base}. Cuenta por pagar de $${total} registrada a ${financial.provider}.`;
    }
    case 'EQUITY_CONTRIBUTION':
      return `${base}. Aporte de socio de $${amount} registrado (no afecta la caja del día).`;
    case 'CONSIGNMENT':
      return `${base} en consignación, sin egreso financiero. Se liquidará según venta.`;
    default:
      return `${base}.`;
  }
}

async function submit() {
  invoiceTouched.value = true;
  if (!canSubmit.value) return;
  submitting.value = true;
  try {
    const payload = {
      supplier_id: supplierId.value || null,
      invoice_number: invoiceNumber.value.trim(),
      control_number: controlNumber.value.trim(),
      currency: currency.value,
      exchange_rate: currency.value === 'VES' ? exchangeRate.value : null,
      freight_amount: freightAmount.value || 0,
      discount_amount: discountAmount.value || 0,
      payment_source: paymentSource.value,
      cash_drawer_id: paymentSource.value === 'CASH_DRAWER' ? (cajaStore.turnoActivo?.id ?? null) : null,
      items: rows.value.map((r) => ({
        // Exactly one of these is set — global_product_id defers local creation
        // to the backend's own atomic transaction, at the moment of processing.
        product_id: r.product.product_id,
        global_product_id: r.product.global_product_id,
        // Strict backend enum when it matches; otherwise falls back to the free-text alias.
        package_type: KNOWN_BACKEND_PACKAGE_TYPES.has(r.purchase_unit_name) ? r.purchase_unit_name : null,
        purchase_unit_name: r.purchase_unit_name,
        conversion_factor: r.conversion_factor,
        packages_quantity: r.packages_quantity,
        package_cost: r.package_cost,
        target_margin_percentage: r.target_margin_percentage,
        new_selling_price_usd: r.new_selling_price_usd,
      })),
    };

    const res = await fetchApi<any>('/api/v1/purchases/express-entry/', {
      method: 'POST',
      data: payload,
    });

    success(buildSuccessMessage(res));
    router.push('/admin/staff/inventory');
  } catch (e: any) {
    notifyError(extractErrorMessage(e));
  } finally {
    submitting.value = false;
  }
}

function goBack() {
  router.push('/admin/staff/inventory');
}

function onClickOutsideQuickEntry(e: MouseEvent) {
  if (quickEntryContainerRef.value && !quickEntryContainerRef.value.contains(e.target as Node)) {
    searchResults.value = [];
    notFound.value = false;
  }
}

/** Auto-inserts the product passed via ?product_id= (e.g. "Reponer" from Existencias). */
async function loadInitialProduct(productId: string) {
  try {
    const res = await fetchApi<any>(`/api/v1/products/${productId}/`);
    addProductRow(mapProduct(res));
  } catch {
    notifyError('No se pudo cargar el producto indicado. Búscalo manualmente.');
    nextTick(() => quickEntryInput.value?.focus());
  }
}

onMounted(() => {
  loadSuppliers();
  loadCashDrawerContext();
  document.addEventListener('click', onClickOutsideQuickEntry);

  // Preselect e.g. from Cuentas por Pagar → "Compra de Mercancía" (?payment_source=SUPPLIER_CREDIT)
  const paymentSourceParam = Array.isArray(route.query.payment_source) ? route.query.payment_source[0] : route.query.payment_source;
  if (paymentSourceParam && paymentSourceOptions.some((o) => o.value === paymentSourceParam)) {
    paymentSource.value = paymentSourceParam as PaymentSource;
  }

  const productId = Array.isArray(route.query.product_id) ? route.query.product_id[0] : route.query.product_id;
  if (productId) {
    loadInitialProduct(String(productId));
  } else {
    nextTick(() => quickEntryInput.value?.focus());
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutsideQuickEntry);
});
</script>
