/**
 * @fileoverview Servicio de API para el módulo Inventory
 * @module @modules/inventory/services/inventory.service
 */

import { httpClient } from '@core/index.js';
import type {
  ULID,
  PaginatedResponse,
  ApiResponse,
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
  ProductListResponse,
  StockMovementListResponse,
  InventorySummaryResponse,
} from '../types';

/** Base URL para endpoints de inventario */
const BASE_URL = '/inventory';

/**
 * Servicio para gestionar operaciones de inventario vía API
 * @namespace InventoryService
 */
export const InventoryService = {
  // ==================== PRODUCTOS ====================
  
  /**
   * Obtiene lista paginada de productos con filtros
   * @param {ProductFilters} params - Parámetros de filtrado y paginación
   * @returns {Promise<PaginatedResponse<Product>>} Lista de productos
   */
  async getProducts(params: ProductFilters = {}): Promise<PaginatedResponse<Product>> {
    const response = await httpClient.get<ProductListResponse>(`${BASE_URL}/products/`, {
      params: {
        page: params.page || 1,
        page_size: params.pageSize || 20,
        search: params.search,
        category_id: params.categoryId,
        category: params.category,
        low_stock: params.lowStockOnly,
        is_active: params.activeOnly,
        sku: params.sku,
        min_price: params.minPrice,
        max_price: params.maxPrice,
        expiring_soon: params.expiringSoon,
        ordering: params.ordering || '-created_at',
        date_from: params.dateFrom,
        date_to: params.dateTo,
        status: params.status?.join(','),
      },
    });
    return response.data;
  },

  /**
   * Obtiene un producto por su ID (ULID)
   * @param {ULID} id - ID del producto
   * @returns {Promise<Product>} Producto encontrado
   */
  async getProductById(id: ULID): Promise<Product> {
    const response = await httpClient.get<ApiResponse<Product>>(`${BASE_URL}/products/${id}/`);
    return response.data.data;
  },

  /**
   * Obtiene un producto por su SKU
   * @param {string} sku - SKU del producto
   * @returns {Promise<Product>} Producto encontrado
   */
  async getProductBySku(sku: string): Promise<Product> {
    const response = await httpClient.get<ApiResponse<Product>>(`${BASE_URL}/products/by-sku/`, {
      params: { sku },
    });
    return response.data.data;
  },

  /**
   * Crea un nuevo producto
   * @param {CreateProductDTO} data - Datos del producto a crear
   * @returns {Promise<Product>} Producto creado
   */
  async createProduct(data: CreateProductDTO): Promise<Product> {
    const response = await httpClient.post<ApiResponse<Product>>(`${BASE_URL}/products/`, {
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
    });
    return response.data.data;
  },

  /**
   * Actualiza un producto existente
   * @param {ULID} id - ID del producto
   * @param {UpdateProductDTO} data - Datos a actualizar
   * @returns {Promise<Product>} Producto actualizado
   */
  async updateProduct(id: ULID, data: UpdateProductDTO): Promise<Product> {
    const response = await httpClient.patch<ApiResponse<Product>>(`${BASE_URL}/products/${id}/`, {
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
    });
    return response.data.data;
  },

  /**
   * Elimina (soft delete) un producto
   * @param {ULID} id - ID del producto
   */
  async deleteProduct(id: ULID): Promise<void> {
    await httpClient.delete(`${BASE_URL}/products/${id}/`);
  },

  /**
   * Busca productos por código de barras
   * @param {string} barcode - Código de barras escaneado
   * @returns {Promise<Product[]>} Productos coincidentes
   */
  async searchByBarcode(barcode: string): Promise<Product[]> {
    const response = await httpClient.get<ApiResponse<Product[]>>(`${BASE_URL}/products/search-barcode/`, {
      params: { barcode },
    });
    return response.data.data;
  },

  // ==================== CATEGORÍAS ====================

  /**
   * Obtiene lista de categorías de productos
   * @returns {Promise<PaginatedResponse<ProductCategoryEntity>>} Lista de categorías
   */
  async getCategories(): Promise<PaginatedResponse<ProductCategoryEntity>> {
    const response = await httpClient.get<PaginatedResponse<ProductCategoryEntity>>(
      `${BASE_URL}/categories/`
    );
    return response.data;
  },

  // ==================== MOVIMIENTOS DE STOCK ====================

  /**
   * Obtiene movimientos de stock paginados
   * @param {StockMovementFilters} params - Filtros para movimientos
   * @returns {Promise<PaginatedResponse<StockMovement>>} Lista de movimientos
   */
  async getStockMovements(params: StockMovementFilters = {}): Promise<PaginatedResponse<StockMovement>> {
    const response = await httpClient.get<StockMovementListResponse>(`${BASE_URL}/movements/`, {
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
      },
    });
    return response.data;
  },

  /**
   * Obtiene movimientos de un producto específico
   * @param {ULID} productId - ID del producto
   * @param {PaginationParams} params - Parámetros de paginación
   * @returns {Promise<PaginatedResponse<StockMovement>>} Movimientos del producto
   */
  async getProductMovements(
    productId: ULID,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<StockMovement>> {
    return this.getStockMovements({ ...params, productId });
  },

  /**
   * Registra un nuevo movimiento de stock
   * @param {CreateStockMovementDTO} data - Datos del movimiento
   * @returns {Promise<StockMovement>} Movimiento registrado
   */
  async createStockMovement(data: CreateStockMovementDTO): Promise<StockMovement> {
    const response = await httpClient.post<ApiResponse<StockMovement>>(`${BASE_URL}/movements/`, {
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
    });
    return response.data.data;
  },

  /**
   * Realiza ajuste de inventario
   * @param {ULID} productId - ID del producto
   * @param {number} newQuantity - Nueva cantidad a establecer
   * @param {string} reason - Razón del ajuste
   * @returns {Promise<StockMovement>} Movimiento de ajuste creado
   */
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

  /**
   * Obtiene lotes de un producto
   * @param {ULID} productId - ID del producto
   * @returns {Promise<ProductLot[]>} Lista de lotes
   */
  async getProductLots(productId: ULID): Promise<ProductLot[]> {
    const response = await httpClient.get<ApiResponse<ProductLot[]>>(
      `${BASE_URL}/products/${productId}/lots/`
    );
    return response.data.data;
  },

  /**
   * Obtiene lotes próximos a vencer
   * @param {number} days - Días para considerar "próximo"
   * @returns {Promise<ProductLot[]>} Lista de lotes
   */
  async getExpiringLots(days: number = 30): Promise<ProductLot[]> {
    const response = await httpClient.get<ApiResponse<ProductLot[]>>(
      `${BASE_URL}/lots/expiring/`,
      { params: { days } }
    );
    return response.data.data;
  },

  // ==================== REPORTES Y RESUMEN ====================

  /**
   * Obtiene resumen del inventario para dashboard
   * @returns {Promise<InventorySummary>} Resumen de inventario
   */
  async getInventorySummary(): Promise<InventorySummary> {
    const response = await httpClient.get<InventorySummaryResponse>(`${BASE_URL}/summary/`);
    return response.data.data;
  },

  /**
   * Obtiene productos con stock bajo
   * @returns {Promise<Product[]>} Productos con alerta de stock
   */
  async getLowStockProducts(): Promise<Product[]> {
    const response = await httpClient.get<ApiResponse<Product[]>>(
      `${BASE_URL}/products/low-stock/`
    );
    return response.data.data;
  },

  /**
   * Valoración total del inventario
   * @returns {Promise<{ totalValue: number; totalCost: number }>} Valoración
   */
  async getInventoryValuation(): Promise<{ totalValue: number; totalCost: number }> {
    const response = await httpClient.get<ApiResponse<{ totalValue: number; totalCost: number }>>(
      `${BASE_URL}/valuation/`
    );
    return response.data.data;
  },
} as const;

export default InventoryService;
