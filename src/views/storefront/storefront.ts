// Tienda pública: tipos, cliente HTTP, precios, horarios y mensajes de WhatsApp.
import axios from 'axios';

// ---------- Tipos ----------
export type CurrencyCode = 'USD' | 'VES';
export type CurrencyMode = 'BOTH' | 'USD' | 'VES';
export type Hours = Record<string, [string, string] | null>;

export interface StoreBanner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  linkLabel: string;
  showOverlay: boolean;
}

export interface StoreBenefit {
  icon: string;
  title: string;
  text: string;
}

export interface StoreFilters {
  categories: boolean;
  brands: boolean;
  price: boolean;
  budget: boolean;
  stock: boolean;
}

export interface StoreConfig {
  tagline: string;
  description: string;
  brand: string;
  hero: 'carousel' | 'none';
  productView: 'grid' | 'list';
  gridColumns: 3 | 4;
  imageFit: 'cover' | 'contain';
  currencyMode: CurrencyMode;
  defaultSort: SortKey;
  showSku: boolean;
  showStockQuantity: boolean;
  hideOutOfStock: boolean;
  filters: StoreFilters;
  whatsapp: string;
  mapUrl: string;
  timezone: string;
  hours: Hours;
  footerNote: string;
  seoTitle: string;
  seoDescription: string;
  banners: StoreBanner[];
  benefits: StoreBenefit[];
}

export interface StoreProfile {
  slug: string;
  name: string;
  legalName: string;
  rif: string;
  logo: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  website: string;
  socials: { platform: string; url: string }[];
  businessType: { name: string; code: string; icon: string } | null;
}

export interface StorePayload {
  store: StoreProfile;
  config: StoreConfig;
  isPublished: boolean;
  preview: boolean;
  rate: number | null;
}

export interface StoreVariant {
  id: string;
  name: string;
  priceUsd: number | null;
  stock: number;
}

export interface StoreProduct {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  brand: string;
  categoryId: string | null;
  category: string;
  image: string | null;
  priceUsd: number;
  priceVes: number | null;
  wholesalePriceUsd: number | null;
  wholesaleMinQty: number | null;
  stock: number;
  unit: string; // '' (unidad), 'kg' o 'L'
  fractionable: boolean;
  variants: StoreVariant[];
  createdAt: string;
}

export interface StoreCategory {
  id: string;
  name: string;
  icon: string;
  parentId: string | null;
}

export interface CategoryItem extends StoreCategory {
  depth: number;
  count: number;
}

export type SortKey = 'featured' | 'name' | 'price-asc' | 'price-desc' | 'newest';

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'featured', label: 'Destacados' },
  { key: 'name', label: 'Nombre (A-Z)' },
  { key: 'price-asc', label: 'Menor precio' },
  { key: 'price-desc', label: 'Mayor precio' },
  { key: 'newest', label: 'Más recientes' },
];

// ---------- URL pública ----------
// Subdominios de la tienda: store.efectivo360.app/<slug>/ (y su alias tienda.).
export const STORE_HOST_PREFIXES = ['store.', 'tienda.'];
export const STORE_BASE_URL = (import.meta.env.VITE_STORE_BASE_URL || 'https://store.efectivo360.app').replace(/\/$/, '');

export function isStoreHost(hostname = window.location.hostname): boolean {
  return STORE_HOST_PREFIXES.some((prefix) => hostname.startsWith(prefix));
}

export function publicStoreUrl(slug: string): string {
  return `${STORE_BASE_URL}/${slug}/`;
}

// Ruta interna de la tienda: en el subdominio es /<slug>/; en el dominio del sistema /store/<slug>
// (desarrollo y vista previa desde el backoffice).
export function storePath(slug: string): string {
  return isStoreHost() ? `/${slug}/` : `/store/${slug}`;
}

// ---------- Cliente HTTP ----------
// Instancia propia, sin los interceptores del backoffice: en una página pública un token vencido
// no debe mostrar el aviso de "sesión finalizada" ni redirigir al login. Si hay sesión (misma
// máquina que el backoffice), se envía el token para permitir la vista previa de una tienda sin publicar.
const publicClient = axios.create({ baseURL: import.meta.env.VITE_API_URL || '' });

publicClient.interceptors.request.use((config) => {
  if (!isStoreHost()) {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function fetchStore(slug: string): Promise<StorePayload> {
  return (await publicClient.get<StorePayload>(`/api/v1/public/stores/${encodeURIComponent(slug)}/`)).data;
}

export async function fetchStoreProducts(
  slug: string
): Promise<{ products: StoreProduct[]; categories: StoreCategory[]; brands: string[] }> {
  return (await publicClient.get(`/api/v1/public/stores/${encodeURIComponent(slug)}/products/`)).data;
}

// ---------- Precios ----------
export interface Priced {
  priceUsd: number;
  priceVes?: number | null;
}

// Precio de `quantity` unidades en la moneda pedida. Si la tienda cargó un precio en Bs. se
// respeta; si no, se convierte con la tasa del día (null si no hay tasa).
export function priceIn(item: Priced, code: CurrencyCode, rate: number | null, quantity = 1): number | null {
  if (code === 'USD') return item.priceUsd * quantity;
  const unitVes = item.priceVes || (rate ? item.priceUsd * rate : null);
  return unitVes === null ? null : unitVes * quantity;
}

export function formatMoney(amount: number | null, code: CurrencyCode): string {
  if (amount === null || !Number.isFinite(amount)) return '—';
  const value = amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return code === 'USD' ? `$${value}` : `Bs. ${value}`;
}

export function formatQuantity(value: number, unit = ''): string {
  const text = value.toLocaleString('es-VE', { maximumFractionDigits: 3 });
  return unit ? `${text} ${unit}` : text;
}

// Paso de cantidad: los productos por peso/volumen se venden por fracciones.
export function quantityStep(product: { unit: string }): number {
  return product.unit ? 0.25 : 1;
}

// ---------- Horarios ----------
export const is24h = (range: [string, string] | null | undefined) => !!range && range[0] === '00:00' && range[1] === '24:00';

const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function formatHour(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 && h < 24 ? 'p. m.' : 'a. m.';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
}

// Estado de apertura según el horario y la zona horaria configurados.
export function getOpenStatus(hours: Hours, timezone: string, now = new Date()) {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now);
  } catch {
    return { open: false, label: 'Tienda Cerrada', detail: '' };
  }
  const get = (type: string) => parts.find((p) => p.type === type)?.value || '';

  const day = WEEKDAYS[get('weekday')];
  const minutes = Number(get('hour')) * 60 + Number(get('minute'));
  const today = hours[String(day)];

  if (today && minutes >= toMinutes(today[0]) && minutes < toMinutes(today[1])) {
    return { open: true, label: 'Tienda Abierta', detail: is24h(today) ? 'Abierto las 24 horas' : `Hasta las ${formatHour(today[1])}` };
  }
  if (today && minutes < toMinutes(today[0])) {
    return { open: false, label: 'Tienda Cerrada', detail: `Abre hoy a las ${formatHour(today[0])}` };
  }
  for (let i = 1; i <= 7; i += 1) {
    const next = hours[String((day + i) % 7)];
    if (next) {
      const when = i === 1 ? 'mañana' : 'pronto';
      return { open: false, label: 'Tienda Cerrada', detail: `Abre ${when}${is24h(next) ? ' (24 horas)' : ` a las ${formatHour(next[0])}`}` };
    }
  }
  return { open: false, label: 'Tienda Cerrada', detail: '' };
}

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
export const DAY_SHORT: Record<number, string> = { 0: 'Dom', 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb' };
export const DAY_LONG: Record<number, string> = { 0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado' };

// Agrupa días consecutivos con el mismo horario: [{ days: 'Lun–Vie', text: '8:00 a. m. – 6:00 p. m.' }].
export function formatHours(hours: Hours) {
  const groups: { key: string; start: number; end: number; range: [string, string] | null }[] = [];
  for (const day of DAY_ORDER) {
    const range = hours[String(day)] || null;
    const key = range ? range.join('-') : 'closed';
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.end = day;
    else groups.push({ key, start: day, end: day, range });
  }
  return groups.map((g) => ({
    days: g.start === g.end ? DAY_SHORT[g.start] : `${DAY_SHORT[g.start]}–${DAY_SHORT[g.end]}`,
    text: g.range ? (is24h(g.range) ? '24 horas' : `${formatHour(g.range[0])} – ${formatHour(g.range[1])}`) : 'Cerrado',
  }));
}

// ---------- Categorías ----------
// Lista plana (con parentId) → lista ordenada en profundidad con .depth para indentar.
export function flattenCategories(categories: StoreCategory[]): (StoreCategory & { depth: number })[] {
  const children = new Map<string | null, StoreCategory[]>();
  categories.forEach((c) => {
    const key = c.parentId && categories.some((p) => p.id === c.parentId) ? c.parentId : null;
    if (!children.has(key)) children.set(key, []);
    children.get(key)!.push(c);
  });
  const result: (StoreCategory & { depth: number })[] = [];
  const walk = (parentId: string | null, depth: number) => {
    (children.get(parentId) || []).forEach((c) => {
      result.push({ ...c, depth });
      walk(c.id, depth + 1);
    });
  };
  walk(null, 0);
  return result;
}

// Id de la categoría y de todas sus subcategorías.
export function descendantIds(id: string, categories: StoreCategory[]): Set<string> {
  const ids = new Set([id]);
  let added = true;
  while (added) {
    added = false;
    categories.forEach((c) => {
      if (c.parentId && ids.has(c.parentId) && !ids.has(c.id)) {
        ids.add(c.id);
        added = true;
      }
    });
  }
  return ids;
}

// ---------- Contacto ----------
// Número de WhatsApp (solo dígitos con código de país): el configurado en la tienda, el de redes
// o, como último recurso, el teléfono del negocio (se quita el 0 de operadora: +58 0412 → 58412).
export function whatsappNumber(config: StoreConfig, store: StoreProfile): string {
  if (config.whatsapp) return config.whatsapp;
  const social = store.socials.find((s) => s.platform === 'whatsapp')?.url || '';
  const digits = (social || store.phone).replace(/\D/g, '').replace(/^580/, '58');
  return digits.length >= 8 ? digits : '';
}

const SOCIAL_BASES: Record<string, (user: string) => string> = {
  instagram: (u) => `https://instagram.com/${u}`,
  tiktok: (u) => `https://www.tiktok.com/@${u}`,
  facebook: (u) => `https://facebook.com/${u}`,
  twitter: (u) => `https://x.com/${u}`,
  youtube: (u) => `https://youtube.com/@${u}`,
  linkedin: (u) => `https://linkedin.com/in/${u}`,
};

// Convierte lo que escribió el negocio (@usuario, usuario o una URL) en un enlace.
export function socialUrl(platform: string, value: string): string {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^[\w.-]+\.[a-z]{2,}\//i.test(raw)) return `https://${raw}`;
  const build = SOCIAL_BASES[platform];
  return build ? build(raw.replace(/^@/, '')) : '';
}

export function openWhatsApp(number: string, text: string) {
  const base = number ? `https://wa.me/${number}` : 'https://wa.me/';
  window.open(`${base}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
}

// ---------- Color de marca ----------
function parseHex(hex: string): [number, number, number] {
  const clean = String(hex).replace('#', '');
  const full = clean.length === 3 ? clean.replace(/(.)/g, '$1$1') : clean.padEnd(6, '0');
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) || 0) as [number, number, number];
}

// Variables CSS de la marca: se usan con clases como bg-[color:var(--brand)].
export function brandVars(hex: string): Record<string, string> {
  const [r, g, b] = parseHex(hex);
  const light = (r * 299 + g * 587 + b * 114) / 1000 > 160;
  return {
    '--brand': `rgb(${r} ${g} ${b})`,
    '--brand-soft': `rgb(${r} ${g} ${b} / 0.1)`,
    '--brand-ring': `rgb(${r} ${g} ${b} / 0.35)`,
    '--brand-dark': `rgb(${Math.round(r * 0.8)} ${Math.round(g * 0.8)} ${Math.round(b * 0.8)})`,
    '--on-brand': light ? '#0f172a' : '#ffffff',
  };
}
