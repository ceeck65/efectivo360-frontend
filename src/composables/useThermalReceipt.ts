import { nextTick, reactive, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { fetchApi } from '@/composables/useApi';

export type ThermalPaperWidth = '58mm' | '80mm';
export type ThermalFontFamily = 'monospace' | 'sans-serif';

export interface ThermalReceiptBusiness {
  name: string;
  rif: string;
  address: string;
  phone: string;
  /** "Contribuyente Ordinario" o "Sujeto Pasivo Especial". */
  condition: string;
  logoUrl: string;
}

/**
 * Configuración oficial de impresión del tenant (GET /api/v1/tenant/print-settings/),
 * la misma que edita el usuario en /admin/business/console > Impresión
 * (TabPrintPersonalization.vue). Es la única fuente de verdad para qué se
 * imprime en el ticket del POS — ThermalReceiptPrint no debe traer overrides
 * propios por caller.
 */
export interface ThermalPrintSettings {
  paper_width: ThermalPaperWidth;
  font_family: ThermalFontFamily;
  auto_print: boolean;
  copies_count: number;
  header_custom_text: string;
  footer_custom_text: string;
  show_logo: boolean;
  show_tax_breakdown: boolean;
  show_bcv_rate: boolean;
  show_cashier_name: boolean;
  show_qr_code: boolean;
}

/** Refleja los defaults del backend (apps/tenants/models.py TenantSettings) mientras carga. */
export const DEFAULT_PRINT_SETTINGS: ThermalPrintSettings = {
  paper_width: '80mm',
  font_family: 'monospace',
  auto_print: false,
  copies_count: 1,
  header_custom_text: '',
  footer_custom_text: '',
  show_logo: true,
  show_tax_breakdown: true,
  show_bcv_rate: true,
  show_cashier_name: true,
  show_qr_code: false,
};

function firstPhone(phones: Record<string, string> | undefined | null): string {
  if (!phones) return '';
  return Object.values(phones).find(Boolean) || '';
}

/** Arma el encabezado del emisor (empresa) del ticket desde el tenant del usuario autenticado. */
export function useBusinessInfo(): ThermalReceiptBusiness {
  const authStore = useAuthStore();
  const legal = authStore.user?.tenant_info?.legal;
  // reactive(): logoUrl se completa después (usePrintSettings, fetch aparte) y el
  // template/prop hijo debe reaccionar a esa mutación posterior.
  return reactive({
    name: legal?.commercial_name || legal?.legal_name || legal?.name || '',
    rif: legal?.rif || legal?.tax_id || '',
    address: legal?.address || '',
    phone: firstPhone(legal?.phone_numbers),
    condition: legal?.es_contribuyente_especial ? 'Sujeto Pasivo Especial' : 'Contribuyente Ordinario',
    logoUrl: '',
  });
}

/**
 * Carga la configuración oficial de impresión (`/api/v1/tenant/print-settings/`) y el
 * logo del tenant (`/api/v1/tenants/settings/info/`, misma fuente que usa la página de
 * Configuración). Úsalo en cada punto donde se imprima/muestre el ticket del POS —
 * nunca hardcodees qué secciones mostrar por fuera de esta configuración.
 */
export function usePrintSettings() {
  const settings = ref<ThermalPrintSettings>({ ...DEFAULT_PRINT_SETTINGS });
  const logoUrl = ref('');
  const isLoading = ref(false);
  const isLoaded = ref(false);

  async function fetchPrintSettings(): Promise<void> {
    isLoading.value = true;
    try {
      const [printSettings, businessInfo] = await Promise.all([
        fetchApi<Partial<ThermalPrintSettings>>('/api/v1/tenant/print-settings/'),
        fetchApi<{ thumb_url?: string; logo_url?: string }>('/api/v1/tenants/settings/info/').catch(() => null),
      ]);
      settings.value = { ...DEFAULT_PRINT_SETTINGS, ...printSettings };
      logoUrl.value = businessInfo?.thumb_url || businessInfo?.logo_url || '';
    } catch {
      // Si falla, se queda con DEFAULT_PRINT_SETTINGS — el ticket sigue siendo
      // imprimible, solo que con la configuración de fábrica hasta reintentar.
    } finally {
      isLoading.value = false;
      isLoaded.value = true;
    }
  }

  return { settings, logoUrl, isLoading, isLoaded, fetchPrintSettings };
}

/**
 * Dispara la impresión del ticket térmico.
 *
 * El componente `ThermalReceiptPrint` debe estar montado (p.ej. `v-if="sale"`)
 * antes de llamar esto: qué se ve en pantalla vs. en papel lo decide el CSS de
 * `@media print` del propio componente, no JS. El `nextTick` + `setTimeout`
 * solo garantizan que Vue ya pintó el DOM (y el navegador aplicó los estilos)
 * antes de que `window.print()` capture la página.
 */
export async function printThermalReceipt(): Promise<void> {
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 150));
  window.print();
}
