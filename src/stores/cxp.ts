import { defineStore } from 'pinia';
import { ref } from 'vue';
import { fetchApi } from '@/composables/useApi';

export interface ProviderDebt {
  id: number | string;
  ulid: string;
  provider_name: string;
  invoice_number: string;
  total_amount: number;
  remaining_balance: number;
  currency_code: string;
  due_date: string;
  status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
  created_at: string;
  /** Only present for debts originated by Carga Express (SUPPLIER_CREDIT). */
  purchase_id: string | null;
}

export interface CxpKpi {
  total_pending: number;
  overdue_count: number;
  due_in_7_days: number;
  total_pending_amount: number;
}

export interface ConsignmentItem {
  /** ConsignmentLotItem id — the unit of settlement (POST .../settle/ takes this as consignment_lot_id). */
  id: string;
  lot_id: string;
  purchase_id: string;
  invoice_number: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  received_at: string;
  received_units: number;
  sold_units: number;
  settled_units: number;
  pending_units_to_settle: number;
  unit_cost_usd: number;
  amount_to_pay_usd: number;
  equiv_ves: number | null;
  status: 'ACTIVE' | 'PARTIALLY_SETTLED' | 'FULLY_SETTLED';
}

export interface ConsignmentSupplierGroup {
  supplier_id: string | null;
  supplier_name: string;
  total_pending_usd: number;
  total_pending_ves: number | null;
  items: ConsignmentItem[];
}

export const useCxpStore = defineStore('cxp', () => {
  const debts = ref<ProviderDebt[]>([]);
  const kpi = ref<CxpKpi>({ total_pending: 0, overdue_count: 0, due_in_7_days: 0, total_pending_amount: 0 });
  const loadingDebts = ref(false);

  const consignmentSuppliers = ref<ConsignmentSupplierGroup[]>([]);
  const consignmentTotalUsd = ref(0);
  const consignmentTotalVes = ref<number | null>(null);
  const loadingConsignments = ref(false);
  const consignmentsError = ref<string | null>(null);

  async function loadDebts(status = 'UNPAID') {
    loadingDebts.value = true;
    try {
      const res = await fetchApi<any>(`/api/v1/cxp/debts/?status=${encodeURIComponent(status)}`);
      debts.value = res?.debts || [];
      kpi.value = {
        total_pending: res?.total_pending ?? 0,
        overdue_count: res?.overdue_count ?? 0,
        due_in_7_days: res?.due_in_7_days ?? 0,
        total_pending_amount: res?.total_pending_amount ?? 0,
      };
    } catch {
      debts.value = [];
    } finally {
      loadingDebts.value = false;
    }
  }

  async function loadConsignments() {
    loadingConsignments.value = true;
    consignmentsError.value = null;
    try {
      const res = await fetchApi<any>('/api/v1/cxp/consignments/');
      consignmentSuppliers.value = Array.isArray(res?.suppliers) ? res.suppliers : [];
      consignmentTotalUsd.value = Number(res?.total_pending_usd ?? 0);
      consignmentTotalVes.value = res?.total_pending_ves != null ? Number(res.total_pending_ves) : null;
    } catch (e: any) {
      consignmentSuppliers.value = [];
      consignmentsError.value = e?.message || 'Error al cargar la mercancía en consignación.';
    } finally {
      loadingConsignments.value = false;
    }
  }

  async function registerPayment(payload: Record<string, any>) {
    return fetchApi<any>('/api/v1/cxp/payments/', { method: 'POST', data: payload });
  }

  async function createOperationalDebt(payload: Record<string, any>) {
    return fetchApi<any>('/api/v1/cxp/debts/', { method: 'POST', data: payload });
  }

  async function settleConsignment(payload: Record<string, any>) {
    return fetchApi<any>('/api/v1/cxp/consignments/settle/', { method: 'POST', data: payload });
  }

  return {
    debts, kpi, loadingDebts,
    consignmentSuppliers, consignmentTotalUsd, consignmentTotalVes, loadingConsignments, consignmentsError,
    loadDebts, loadConsignments, registerPayment, createOperationalDebt, settleConsignment,
  };
});
