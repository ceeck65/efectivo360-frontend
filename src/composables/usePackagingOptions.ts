/**
 * usePackagingOptions — catálogo centralizado de tipos de empaque.
 *
 * Fuente única de verdad: el backend (`products.PackagingType` /
 * `products.ProductPackagingConfig`, sembrados desde
 * `apps/data/measurement_units_seeder.json`). NINGÚN string de empaque ni
 * factor de conversión debe vivir hardcoded en este repo — todo se consume
 * de la API.
 *
 * Endpoints:
 *   GET /api/v1/inventory/packaging-types/              → catálogo global plano
 *   GET /api/v1/products/{id}/packaging-options/        → opciones válidas de 1 producto
 */
import { ref, computed, type Component } from 'vue';
import { useApi } from '@/composables/useApi';
import {
  Package, PackageOpen, Archive, Truck, Scale,
  ShoppingBag, ShoppingBasket, Droplet, GlassWater, Container, FlaskConical,
  LayoutGrid,
} from 'lucide-vue-next';

// ── Tipos (espejo del serializer backend) ──────────────────────────────
export interface PackagingType {
  code: string;
  label: string;
  icon: string;            // nombre de Material Symbol (metadata del backend)
  default_factor: string;  // DecimalField → string
  allow_decimals: boolean;
  allowed_channels: string[];
  is_direct: boolean;
  sort_order: number;
  dimension: string;       // UNIT | WEIGHT | VOLUME
  dimension_name: string;
  base_unit: string;       // UND | KG | LITRO
  sale_unit_code: string;  // UNIDAD | PESO | VOLUMEN
}

export interface ProductPackagingOption {
  /** ULID de la ProductPackagingConfig; null en las filas de fallback del catálogo. */
  packaging_config_id: string | null;
  code: string;
  label: string;
  icon: string;
  conversion_factor: string;   // factor EFECTIVO (override por producto o default)
  default_factor: string;
  allow_decimals: boolean;
  is_direct: boolean;
  sort_order: number;
  is_default_purchase: boolean;
  is_default_sales: boolean;
  allow_wholesale: boolean;
  allow_retail: boolean;
  allow_detal_fraction: boolean;
  configured: boolean;
}

export interface ProductPackagingResponse {
  product_id: string;
  dimension: string | null;
  base_unit: string | null;
  options: ProductPackagingOption[];
}

type Channel = 'RETAIL' | 'DETAL' | 'WHOLESALE';

// ── Traducción Material Symbol → componente lucide (capa de presentación) ──
const ICON_MAP: Record<string, Component> = {
  inventory_2: Package,
  widgets: LayoutGrid,
  inventory: PackageOpen,
  archive: Archive,
  local_shipping: Truck,
  scale: Scale,
  shopping_bag: ShoppingBag,
  shopping_basket: ShoppingBasket,
  water_drop: Droplet,
  local_drink: GlassWater,
  propane_tank: Container,
  oil_barrel: FlaskConical,
};

/** Componente de ícono para un empaque; cae a Package si no hay match. */
export function iconFor(materialName: string | null | undefined): Component {
  return ICON_MAP[materialName || ''] || Package;
}

// ── Cálculo / validación puros (reutilizables sin instancia) ───────────

/** Valor canónico para el Kardex: siempre `factor * cantidad`. */
export function calculateBaseUnits(
  factor: number | string,
  quantity: number | string,
): number {
  const f = typeof factor === 'string' ? parseFloat(factor) : factor;
  const q = typeof quantity === 'string' ? parseFloat(quantity) : quantity;
  if (!Number.isFinite(f) || !Number.isFinite(q)) return 0;
  // 3 decimales — igual que Stock/StockMovement.quantity (DecimalField 12,3)
  return Math.round(f * q * 1000) / 1000;
}

/**
 * Valida la cantidad de empaques contra la regla `allow_decimals`.
 * Devuelve { valid, message, normalized } — `normalized` trunca a entero
 * cuando no se permiten decimales, para poder auto-corregir el input.
 */
export function validateQuantity(
  quantity: number | string,
  allowDecimals: boolean,
): { valid: boolean; message: string; normalized: number } {
  const q = typeof quantity === 'string' ? parseFloat(quantity) : quantity;
  if (!Number.isFinite(q) || q <= 0) {
    return { valid: false, message: 'Ingresa una cantidad mayor a cero.', normalized: 0 };
  }
  if (!allowDecimals && !Number.isInteger(q)) {
    return {
      valid: false,
      message: 'Este empaque no admite fracciones. Usa una cantidad entera.',
      normalized: Math.trunc(q),
    };
  }
  return { valid: true, message: '', normalized: q };
}

// ── Composable ────────────────────────────────────────────────────────
export function usePackagingOptions() {
  const { apiClient } = useApi();

  const catalog = ref<PackagingType[]>([]);
  const productOptions = ref<ProductPackagingOption[]>([]);
  const productMeta = ref<{ dimension: string | null; base_unit: string | null }>({
    dimension: null,
    base_unit: null,
  });
  const loading = ref(false);
  const error = ref<string | null>(null);

  /** Catálogo global plano. `params` opcional: { dimension, sale_unit, channel }. */
  async function loadCatalog(params: Record<string, string> = {}): Promise<PackagingType[]> {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await apiClient.get('/api/v1/inventory/packaging-types/', { params });
      catalog.value = data.packaging_types ?? [];
      return catalog.value;
    } catch (e: any) {
      error.value = e?.response?.data?.detail || 'No se pudo cargar el catálogo de empaques.';
      catalog.value = [];
      return [];
    } finally {
      loading.value = false;
    }
  }

  /** Opciones válidas para un producto concreto (ULID). */
  async function loadForProduct(productId: string): Promise<ProductPackagingOption[]> {
    if (!productId) return [];
    loading.value = true;
    error.value = null;
    try {
      const { data } = await apiClient.get<ProductPackagingResponse>(
        `/api/v1/products/${productId}/packaging-options/`,
      );
      productOptions.value = data.options ?? [];
      productMeta.value = { dimension: data.dimension, base_unit: data.base_unit };
      return productOptions.value;
    } catch (e: any) {
      error.value = e?.response?.data?.detail || 'No se pudieron cargar los empaques del producto.';
      productOptions.value = [];
      return [];
    } finally {
      loading.value = false;
    }
  }

  // Derivados
  const defaultPurchaseOption = computed(
    () => productOptions.value.find((o) => o.is_default_purchase) || productOptions.value[0] || null,
  );
  const defaultSalesOption = computed(
    () => productOptions.value.find((o) => o.is_default_sales)
      || productOptions.value.find((o) => o.is_direct)
      || productOptions.value[0] || null,
  );

  function optionsForChannel(channel: Channel): ProductPackagingOption[] {
    return productOptions.value.filter((o) =>
      channel === 'WHOLESALE' ? o.allow_wholesale : o.allow_retail,
    );
  }

  function findOption(code: string): ProductPackagingOption | undefined {
    return productOptions.value.find((o) => o.code === code);
  }

  /** Etiqueta lista para UI: "Caja (x24 UND)". */
  function equivalenceLabel(
    opt: Pick<ProductPackagingOption, 'label' | 'conversion_factor'>,
    baseUnit = productMeta.value.base_unit || 'UND',
  ): string {
    const f = parseFloat(opt.conversion_factor);
    if (!Number.isFinite(f) || f === 1) return opt.label;
    // sin ceros de más: 3.785 → "3.785", 24.000 → "24"
    const pretty = Number(f.toFixed(3)).toString();
    return `${opt.label} (x${pretty} ${baseUnit})`;
  }

  return {
    // state
    catalog,
    productOptions,
    productMeta,
    loading,
    error,
    // actions
    loadCatalog,
    loadForProduct,
    // derived
    defaultPurchaseOption,
    defaultSalesOption,
    optionsForChannel,
    findOption,
    // helpers
    equivalenceLabel,
    iconFor,
    calculateBaseUnits,
    validateQuantity,
  };
}
