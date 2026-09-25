// Tipos y utilidades compartidas por el listado, el constructor y la hoja A4 del catálogo digital.

export type CatalogLayout = 'grid2' | 'grid3' | 'list';
export type CurrencyMode = 'USD' | 'VES' | 'BOTH';

export interface CatalogContact {
  phone: string;
  address: string;
  instagram: string;
  tiktok: string;
  facebook: string;
  note: string;
}

export interface CatalogConfig {
  title: string;
  subtitle: string;
  layout: CatalogLayout;
  currencyMode: CurrencyMode;
  showSku: boolean;
  showStock: boolean;
  showBrand: boolean;
  brand: string;
  contact: CatalogContact;
}

export interface DigitalCatalog {
  id: string;
  name: string;
  config: CatalogConfig;
  product_ids: string[];
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface DigitalCatalogSummary {
  id: string;
  name: string;
  title: string;
  layout: CatalogLayout;
  brand: string;
  product_count: number;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

// Producto de la tienda, ya normalizado desde /api/v1/products/.
export interface CatalogItem {
  id: string;
  name: string;
  sku: string;
  brand: string;
  category: string;
  image: string | null;
  priceUsd: number;
  priceVes: number | null; // precio en Bs. cargado en la tienda (si no hay, se convierte con la tasa)
  stock: number;
  unit: string; // sufijo del precio: '' (unidad), 'kg' o 'L'
}

// Datos de la tienda (Mi Negocio) que usa la hoja: logo y nombre comercial.
export interface StoreInfo {
  name: string;
  logo: string;
}

// Lo que recibe cada hoja A4 para dibujarse.
export interface SheetOptions extends Omit<CatalogConfig, 'contact'> {
  contact: CatalogContact;
  rate: number | null;
  date: string;
  store: StoreInfo;
}

export const API_URL = '/api/v1/digital-catalogs/';

export const LAYOUT_LABELS: Record<CatalogLayout, string> = {
  grid2: 'Grid 2x2',
  grid3: 'Grid 3x3',
  list: 'Lista',
};

export const DEFAULT_CONTACT: CatalogContact = {
  phone: '',
  address: '',
  instagram: '',
  tiktok: '',
  facebook: '',
  note: 'Precios sujetos a cambio sin previo aviso.',
};

export const DEFAULT_CONFIG: CatalogConfig = {
  title: 'Catálogo de Productos',
  subtitle: 'Precios válidos por esta semana',
  layout: 'grid2',
  currencyMode: 'BOTH',
  showSku: true,
  showStock: false,
  showBrand: true,
  brand: '#2563eb',
  contact: DEFAULT_CONTACT,
};

export const defaultConfig = (): CatalogConfig => ({ ...DEFAULT_CONFIG, contact: { ...DEFAULT_CONTACT } });

const UNIT_SUFFIX: Record<string, string> = { PESO: 'kg', VOLUMEN: 'L' };

function retailPrice(prices: any[], currency: string): number | null {
  const entry = prices?.find((p: any) => p?.currency_code === currency);
  const value = parseFloat(entry?.retail_price ?? '');
  return Number.isFinite(value) && value > 0 ? value : null;
}

// Mismo criterio que el listado de productos: precio de la presentación por defecto (o base).
export function normalizeProduct(api: any): CatalogItem {
  const presentation =
    api.presentations?.find((p: any) => p.is_default || p.is_base_unit) ?? api.presentations?.[0];
  const prices = presentation?.prices ?? [];
  return {
    id: String(api.id),
    name: api.effective_name || api.global_product?.official_name || '',
    sku: api.effective_sku || api.global_product?.sku || '',
    brand: api.brand_name || '',
    category: api.category_name || api.global_product?.smart_category?.name || '',
    image: api.image || api.image_url || null,
    priceUsd: retailPrice(prices, 'USD') ?? 0,
    priceVes: retailPrice(prices, 'VES'),
    stock: Number(api.total_stock ?? api.current_stock ?? 0),
    unit: UNIT_SUFFIX[api.sale_unit] || '',
  };
}

export function formatUsd(value: number): string {
  return `$${value.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatVes(value: number): string {
  return `Bs. ${value.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function vesPrice(item: CatalogItem, rate: number | null): number | null {
  if (item.priceVes !== null) return item.priceVes;
  return rate ? item.priceUsd * rate : null;
}

// Precio principal y secundario según la moneda elegida para el catálogo.
export function priceParts(item: CatalogItem, mode: CurrencyMode, rate: number | null): { main: string; sub: string } {
  const suffix = item.unit ? ` / ${item.unit}` : '';
  const usd = formatUsd(item.priceUsd) + suffix;
  const bs = vesPrice(item, rate);
  const ves = bs !== null ? formatVes(bs) + suffix : '';
  if (mode === 'USD' || !ves) return { main: usd, sub: '' };
  if (mode === 'VES') return { main: ves, sub: '' };
  return { main: usd, sub: ves };
}

export function formatStock(item: CatalogItem): string {
  if (item.stock <= 0) return 'Agotado';
  const qty = item.stock.toLocaleString('es-VE', { maximumFractionDigits: 3 });
  return `Stock: ${qty}${item.unit ? ` ${item.unit}` : ''}`;
}
