import { httpClient } from '@core/index.js';
import { useAuthStore } from '@/stores/auth';
import type {
  ULID,
  PaginatedResponse,
  PaginationParams,
} from '@core/types';
import type {
  Product,
  ProductCategoryEntity,
  StockMovement,
  ProductLot,
  InventorySummary,
  ProductFilters,
  StockMovementFilters,
  CreateProductDTO,
  UpdateProductDTO,
  CreateStockMovementDTO,
  TaxRate,
  ProductType,
} from '../types';

const PRODUCTS_URL = '/api/products';
const CATEGORIES_URL = '/api/v1/catalog/categories';

function tenantParam(): Record<string, string> {
  const raw = useAuthStore().user?.tenant;
  const tid = raw != null ? String(raw) : null;
  return tid?.trim() ? { tenant_id: tid } : {};
}

export const InventoryService = {
  // ==================== PRODUCTOS ====================

  async getProducts(params: ProductFilters = {}): Promise<PaginatedResponse<Product>> {
    const response = await httpClient.get<any>(`${PRODUCTS_URL}/`, {
      params: {
        page: params.page || 1,
        page_size: params.pageSize || 20,
        search: params.search,
        ...tenantParam(),
      },
    });
    const body = response.data;
    return {
      count: body.count ?? 0,
      next: body.next ?? null,
      previous: body.previous ?? null,
      results: (body.results ?? []).map(mapProduct),
    };
  },

  async getProductById(id: ULID): Promise<Product> {
    const response = await httpClient.get<any>(`${PRODUCTS_URL}/${id}/`, {
      params: { ...tenantParam() },
    });
    return mapProduct(response.data);
  },

  async getProductBySku(sku: string): Promise<Product> {
    const response = await httpClient.get<any>(`${PRODUCTS_URL}/by-sku/`, {
      params: { sku, ...tenantParam() },
    });
    return mapProduct(response.data);
  },

  async createProduct(data: CreateProductDTO): Promise<Product> {
    const response = await httpClient.post<any>(`${PRODUCTS_URL}/`, {
      sku: data.sku,
      name: data.name,
      description: data.description,
      category_id: data.categoryId,
      unit_of_measure: data.unitOfMeasure,
      sale_price: data.salePrice,
      cost_price: data.costPrice,
      initial_stock: data.initialStock ?? 0,
      min_stock_level: data.minStockLevel ?? 0,
      max_stock_level: data.maxStockLevel ?? 0,
      location: data.location,
      barcode: data.barcode,
      track_lots: data.trackLots ?? false,
      track_expiry: data.trackExpiry ?? false,
      ...tenantParam(),
    });
    return mapProduct(response.data);
  },

  async updateProduct(id: ULID, data: UpdateProductDTO): Promise<Product> {
    const response = await httpClient.patch<any>(`${PRODUCTS_URL}/${id}/`, {
      ...(data.sku && { sku: data.sku }),
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.categoryId && { category_id: data.categoryId }),
      ...(data.unitOfMeasure && { unit_of_measure: data.unitOfMeasure }),
      ...(data.salePrice !== undefined && { sale_price: data.salePrice }),
      ...(data.costPrice !== undefined && { cost_price: data.costPrice }),
      ...(data.minStockLevel !== undefined && { min_stock_level: data.minStockLevel }),
      ...(data.maxStockLevel !== undefined && { max_stock_level: data.maxStockLevel }),
      ...(data.location !== undefined && { location: data.location }),
      ...(data.barcode !== undefined && { barcode: data.barcode }),
      ...(data.isActive !== undefined && { is_active: data.isActive }),
      ...(data.trackLots !== undefined && { track_lots: data.trackLots }),
      ...(data.trackExpiry !== undefined && { track_expiry: data.trackExpiry }),
      ...tenantParam(),
    });
    return mapProduct(response.data);
  },

  async deleteProduct(id: ULID): Promise<void> {
    await httpClient.delete(`${PRODUCTS_URL}/${id}/`, {
      params: { ...tenantParam() },
    });
  },

  async searchByBarcode(barcode: string): Promise<Product[]> {
    const response = await httpClient.get<any>(`${PRODUCTS_URL}/search-barcode/`, {
      params: { barcode, ...tenantParam() },
    });
    return (response.data?.results ?? []).map(mapProduct);
  },

  // ==================== BLUEPRINT / CHAMELEON FORM ====================

  async getBlueprintConfig(): Promise<Record<string, unknown>> {
    const response = await httpClient.get(`/api/v1/blueprints/config/`);
    return response.data;
  },

  async validateProduct(productName: string): Promise<Record<string, unknown>> {
    const response = await httpClient.post(`/api/v1/inventory/validate-product/`, {
      product_name: productName,
    });
    return response.data;
  },

  // ==================== CATEGORÍAS INTELIGENTES (EFI) ====================

  async suggestCategory(
    productName: string,
    businessTypeId?: string
  ): Promise<{ suggested: boolean; category: object | null }> {
    const response = await httpClient.post(`/api/v1/inventory/suggest-category/`, {
      product_name: productName,
      business_type_id: businessTypeId,
    });
    return response.data;
  },

  // ==================== CATEGORÍAS ====================

  async getCategories(): Promise<PaginatedResponse<ProductCategoryEntity>> {
    const response = await httpClient.get<any>(`${CATEGORIES_URL}/`, {
      params: {
        page_size: 1000,
        ...tenantParam(),
      },
    });
    const body = response.data;
    const results = (body.results ?? body ?? []).map((c: any) => ({
      id: c.id || c.code || '',
      name: c.name || '',
      description: '',
      color: '',
      icon: c.icon || '📦',
      parentId: undefined,
    }));
    return {
      count: body.count ?? results.length,
      next: body.next ?? null,
      previous: body.previous ?? null,
      results,
    };
  },

  // ==================== TAX RATES & PRODUCT TYPES ====================

  async getTaxRates(): Promise<TaxRate[]> {
    const response = await httpClient.get<any>(`/api/v1/catalog/tax-rates/`, {
      params: { ...tenantParam() },
    });
    const body = response.data;
    const results = body?.results ?? body ?? [];
    return results.map((r: any) => ({
      id: r.id ?? '',
      code: r.code ?? '',
      name: r.name ?? '',
      rate_percentage: Number(r.rate_percentage ?? 0),
      is_active: r.is_active ?? true,
    }));
  },

  async getProductTypes(): Promise<ProductType[]> {
    const response = await httpClient.get<any>(`/api/v1/products/product-types/`, {
      params: { ...tenantParam() },
    });
    const body = response.data;
    const results = body?.results ?? body ?? [];
    return results.map((r: any) => ({
      id: r.id ?? '',
      code: r.code ?? '',
      name: r.name ?? '',
      requires_stock: r.requires_stock ?? true,
      has_variants: r.has_variants ?? false,
      is_bundle: r.is_bundle ?? false,
      is_active: r.is_active ?? true,
    }));
  },

  // ==================== MOVIMIENTOS DE STOCK ====================

  async getStockMovements(params: StockMovementFilters = {}): Promise<PaginatedResponse<StockMovement>> {
    const response = await httpClient.get<any>(`${PRODUCTS_URL}/movements/`, {
      params: {
        page: params.page || 1,
        page_size: params.pageSize || 20,
        product_id: params.productId,
        movement_type: params.movementType?.join(','),
        date_from: params.dateFrom,
        date_to: params.dateTo,
        performed_by: params.performedBy,
        reference_type: params.referenceType,
        ordering: params.ordering || '-movement_date',
        ...tenantParam(),
      },
    });
    return response.data;
  },

  async getProductMovements(
    productId: ULID,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<StockMovement>> {
    return this.getStockMovements({ ...params, productId });
  },

  async createStockMovement(data: CreateStockMovementDTO): Promise<StockMovement> {
    const response = await httpClient.post<any>(`${PRODUCTS_URL}/movements/`, {
      product_id: data.productId,
      movement_type: data.movementType,
      quantity: data.quantity,
      unit_cost: data.unitCost,
      reference_type: data.referenceType,
      reference_id: data.referenceId,
      reference_number: data.referenceNumber,
      notes: data.notes,
      lot_number: data.lotNumber,
      expiry_date: data.expiryDate,
      ...tenantParam(),
    });
    return mapStockMovement(response.data);
  },

  async adjustStock(
    productId: ULID,
    newQuantity: number,
    reason: string
  ): Promise<StockMovement> {
    return this.createStockMovement({
      productId,
      movementType: 'ADJUSTMENT',
      quantity: newQuantity,
      notes: reason,
    });
  },

  // ==================== LOTES ====================

  async getProductLots(productId: ULID): Promise<ProductLot[]> {
    const response = await httpClient.get<any>(`${PRODUCTS_URL}/${productId}/lots/`, {
      params: { ...tenantParam() },
    });
    return response.data?.results ?? [];
  },

  async getExpiringLots(days: number = 30): Promise<ProductLot[]> {
    const response = await httpClient.get<any>(`${PRODUCTS_URL}/lots/expiring/`, {
      params: { days, ...tenantParam() },
    });
    return response.data?.results ?? [];
  },

  // ==================== REPORTES Y RESUMEN ====================

  async getInventorySummary(): Promise<InventorySummary> {
    const response = await httpClient.get<any>(`${PRODUCTS_URL}/summary/`, {
      params: { ...tenantParam() },
    });
    return response.data;
  },

  async getLowStockProducts(): Promise<Product[]> {
    const response = await httpClient.get<any>(`${PRODUCTS_URL}/low-stock/`, {
      params: { ...tenantParam() },
    });
    return (response.data?.results ?? []).map(mapProduct);
  },

  async getInventoryValuation(): Promise<{ totalValue: number; totalCost: number }> {
    const response = await httpClient.get<any>(`${PRODUCTS_URL}/valuation/`, {
      params: { ...tenantParam() },
    });
    return response.data;
  },
} as const;

function mapProduct(item: any): Product {
  const priceUsd = parseFloat(item.base_price_usd ?? item.price_data?.current_prices?.usd ?? 0);
  return {
    id: item.id ?? '',
    sku: item.sku ?? '',
    name: item.name ?? '',
    description: item.description ?? '',
    category: item.category ?? '',
    categoryId: item.category_global_id ?? item.category_id ?? '',
    unitOfMeasure: (item.measurement_unit || item.unit_of_measure || 'UNIT') as any,
    salePrice: Math.round(priceUsd * 100),
    costPrice: Math.round(parseFloat(item.cost_price_usd ?? 0) * 100),
    currentStock: Number(item.current_stock ?? item.base_unit_stock ?? 0),
    minStockLevel: Number(item.minimum_stock ?? 0),
    maxStockLevel: 0,
    location: item.location ?? '',
    barcode: item.sku ?? '',
    isActive: true,
    trackLots: false,
    trackExpiry: false,
    image: item.image_url ?? item.image ?? '',
    image_url: item.image_url ?? item.image ?? '',
    status: 'ACTIVE' as any,
    createdBy: item.created_by ?? '',
    updatedBy: item.updated_by ?? '',
    createdAt: item.created_at ?? item.createdAt ?? '',
    updatedAt: item.updated_at ?? item.updatedAt ?? '',
  };
}

function mapStockMovement(item: any): StockMovement {
  return {
    id: item.id ?? '',
    productId: item.product_id ?? '',
    productName: item.product_name ?? '',
    movementType: item.movement_type ?? 'ADJUSTMENT',
    quantity: Number(item.quantity ?? 0),
    unitCost: Number(item.unit_cost ?? 0),
    referenceType: item.reference_type ?? '',
    referenceId: item.reference_id ?? '',
    referenceNumber: item.reference_number ?? '',
    notes: item.notes ?? '',
    performedBy: item.performed_by ?? '',
    performedByName: item.performed_by_name ?? '',
    movementDate: item.movement_date ?? item.created_at ?? '',
    status: 'ACTIVE' as any,
    createdBy: item.created_by ?? '',
    updatedBy: item.updated_by ?? '',
    createdAt: item.created_at ?? item.createdAt ?? '',
    updatedAt: item.updated_at ?? item.updatedAt ?? '',
  };
}

export default InventoryService;
