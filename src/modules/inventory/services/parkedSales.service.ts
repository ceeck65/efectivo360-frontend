import { httpClient } from '@core/index.js';

export interface ParkedSaleItem {
  id: string;
  /** Unique per row — lets multiple PESO/VOLUMEN portions of the same product survive pause/resume without key collisions. */
  cartItemId?: string;
  productId: string;
  variantId?: string;
  name: string;
  variantLabel?: string;
  price_usd: number;
  qty: number;
  image?: string;
  unitsPerPackage: number;
  mode: 'UNIDAD' | 'BULTO' | 'PESO' | 'VOLUMEN';
  sale_unit?: string;
  unitPrice: number;
  maxStock: number;
  maxVariantStock?: number;
  barcode?: string;
  attrs?: Record<string, string>;
}

export interface ParkedSale {
  id: number;
  reference: string;
  alias: string;
  terminal_id: number | null;
  customer_id: number | null;
  items: ParkedSaleItem[];
  reserved_stock: { product_id: number; quantity_reserved: number }[];
  total_usd: number;
  total_ves: number;
  status: 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  expires_at: string;
  created_at: string;
}

export interface ResumeResponse {
  id: number;
  reference: string;
  alias: string;
  items: ParkedSaleItem[];
  total_usd: number;
  customer_id: number | null;
}

export async function listParkedSales(status = 'PAUSED'): Promise<ParkedSale[]> {
  const response = await httpClient.get('/api/v1/parked-sales/', { params: { status } });
  return response.data?.data ?? response.data ?? [];
}

export async function createParkedSale(payload: {
  alias?: string;
  items: ParkedSaleItem[];
  terminal_id?: number | null;
  customer_id?: number | null;
  ttl_minutes?: number;
}): Promise<{ id: number; reference: string; expires_at: string }> {
  const response = await httpClient.post('/api/v1/parked-sales/', payload);
  return response.data?.data ?? response.data;
}

export async function resumeParkedSale(id: number): Promise<ResumeResponse> {
  const response = await httpClient.post(`/api/v1/parked-sales/${id}/resume/`);
  return response.data?.data ?? response.data;
}

export async function cancelParkedSale(id: number): Promise<void> {
  await httpClient.post(`/api/v1/parked-sales/${id}/cancel/`);
}

export async function extendParkedSale(id: number, ttlMinutes = 20): Promise<{ id: number; reference: string; alias: string; expires_at: string }> {
  const response = await httpClient.post(`/api/v1/parked-sales/${id}/extend/`, { ttl_minutes: ttlMinutes });
  return response.data?.data ?? response.data;
}
