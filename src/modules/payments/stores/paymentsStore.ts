/**
 * @fileoverview Store de Pinia para el módulo Payments
 * @module @modules/payments/stores/paymentsStore
 */

import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { toast } from 'vue3-toastify';
import type { ULID } from '@core/types';
import type {
  Currency,
  ExchangeRate,
  PaymentMethodTemplate,
  SaasPaymentMethod,
  TenantSaasPaymentMethodView,
  TenantPaymentMethod,
  PaymentCategory,
  PaymentTypeOption,
  PaymentTransaction,
  CurrencyFormData,
  SaasPaymentMethodFormData,
  TenantPaymentMethodFormData,
  TransactionFilters,
} from '../types';
import * as paymentsService from '../services/payments.service';

export const usePaymentsStore = defineStore('payments', () => {
  // ===========================================================================
  // STATE - Monedas
  // ===========================================================================
  const currencies = ref<Currency[]>([]);
  const exchangeRates = ref<ExchangeRate[]>([]);
  const selectedCurrency = ref<Currency | null>(null);

  // ===========================================================================
  // STATE - Plantillas (Staff)
  // ===========================================================================
  const templates = ref<PaymentMethodTemplate[]>([]);
  const categories = ref<PaymentCategory[]>([]);
  const paymentTypes = ref<PaymentTypeOption[]>([]);

  // ===========================================================================
  // STATE - Métodos SaaS
  // ===========================================================================
  const saasPaymentMethods = ref<SaasPaymentMethod[]>([]);
  const tenantSaasPaymentMethods = ref<TenantSaasPaymentMethodView[]>([]);

  // ===========================================================================
  // STATE - Métodos Tenant
  // ===========================================================================
  const tenantPaymentMethods = ref<TenantPaymentMethod[]>([]);

  // ===========================================================================
  // STATE - Transacciones
  // ===========================================================================
  const transactions = ref<PaymentTransaction[]>([]);
  const selectedTransaction = ref<PaymentTransaction | null>(null);

  // ===========================================================================
  // STATE - UI
  // ===========================================================================
  const isLoading = ref(false);
  const isSubmitting = ref(false);
  const errors = ref<Record<string, string | null>>({});

  // ===========================================================================
  // GETTERS - Monedas
  // ===========================================================================

  /** Monedas activas ordenadas por código */
  const activeCurrencies = computed(() =>
    currencies.value.filter(c => c.is_active).sort((a, b) => a.code.localeCompare(b.code))
  );

  /** Mapa de monedas por código para búsqueda rápida */
  const currenciesByCode = computed(() => {
    const map: Record<string, Currency> = {};
    currencies.value.forEach(c => {
      map[c.code] = c;
    });
    return map;
  });

  /** Mapa de monedas por ULID */
  const currenciesById = computed(() => {
    const map: Record<string, Currency> = {};
    currencies.value.forEach(c => {
      map[c.id] = c;
    });
    return map;
  });

  /** Tasa de cambio entre dos monedas */
  const getExchangeRate = computed(() => (fromId: ULID, toId: ULID) => {
    return exchangeRates.value.find(
      r => r.from_currency_id === fromId && r.to_currency_id === toId && r.is_active
    );
  });

  // ===========================================================================
  // GETTERS - Plantillas
  // ===========================================================================

  /** Plantillas activas ordenadas */
  const activeTemplates = computed(() =>
    templates.value.filter(t => t.is_active).sort((a, b) => a.sort_order - b.sort_order)
  );

  /** Plantillas agrupadas por categoría */
  const templatesByCategory = computed(() => {
    const grouped: Record<string, PaymentMethodTemplate[]> = {};
    templates.value.forEach(template => {
      const categorySlug = template.category?.slug || 'otros';
      if (!grouped[categorySlug]) {
        grouped[categorySlug] = [];
      }
      grouped[categorySlug].push(template);
    });
    return grouped;
  });

  /** Plantilla por ID */
  const getTemplateById = computed(() => (id: ULID) => {
    return templates.value.find(t => t.id === id);
  });

  // ===========================================================================
  // GETTERS - Métodos SaaS
  // ===========================================================================

  /** Métodos SaaS activos */
  const activeSaasMethods = computed(() =>
    saasPaymentMethods.value.filter(m => m.is_active).sort((a, b) => a.sort_order - b.sort_order)
  );

  /** Métodos SaaS disponibles para el Tenant */
  const availableSaasMethods = computed(() =>
    tenantSaasPaymentMethods.value.filter(m => m.is_active).sort((a, b) => a.sort_order - b.sort_order)
  );

  /** Métodos SaaS agrupados por plantilla */
  const saasMethodsByTemplate = computed(() => {
    const grouped: Record<string, SaasPaymentMethod[]> = {};
    saasPaymentMethods.value.forEach(method => {
      const templateId = method.template_id;
      if (!grouped[templateId]) {
        grouped[templateId] = [];
      }
      grouped[templateId].push(method);
    });
    return grouped;
  });

  // ===========================================================================
  // GETTERS - Métodos Tenant
  // ===========================================================================

  /** Métodos del Tenant activos */
  const activeTenantMethods = computed(() =>
    tenantPaymentMethods.value.filter(m => m.is_active).sort((a, b) => a.sort_order - b.sort_order)
  );

  /** Métodos del Tenant agrupados por categoría */
  const tenantMethodsByCategory = computed(() => {
    const grouped: Record<string, TenantPaymentMethod[]> = {};
    tenantPaymentMethods.value.forEach(method => {
      const category = method.template?.category?.slug || 'otros';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(method);
    });
    return grouped;
  });

  /** Método del Tenant por ID */
  const getTenantMethodById = computed(() => (id: ULID) => {
    return tenantPaymentMethods.value.find(m => m.id === id);
  });

  // ===========================================================================
  // GETTERS - Transacciones
  // ===========================================================================

  /** Transacciones pendientes */
  const pendingTransactions = computed(() =>
    transactions.value.filter(t => t.status === 'pending')
  );

  /** Transacciones completadas */
  const completedTransactions = computed(() =>
    transactions.value.filter(t => t.status === 'completed')
  );

  // ===========================================================================
  // ACTIONS - Monedas
  // ===========================================================================

  /**
   * Carga todas las monedas del sistema
   */
  async function loadCurrencies(): Promise<void> {
    isLoading.value = true;
    errors.value.currencies = null;
    
    try {
      const data = await paymentsService.fetchCurrencies();
      currencies.value = data;
      
      // Seleccionar primera moneda activa por defecto si no hay seleccionada
      if (!selectedCurrency.value && activeCurrencies.value.length > 0) {
        selectedCurrency.value = activeCurrencies.value[0];
      }
    } catch (err: any) {
      errors.value.currencies = err?.message || 'Error cargando monedas';
      toast.error(errors.value.currencies);
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Crea una nueva moneda (Staff only)
   */
  async function createCurrency(data: CurrencyFormData): Promise<Currency | null> {
    isSubmitting.value = true;
    errors.value.currencyForm = null;
    
    try {
      const currency = await paymentsService.createCurrency(data);
      currencies.value.push(currency);
      toast.success(`Moneda ${currency.code} creada exitosamente`);
      return currency;
    } catch (err: any) {
      errors.value.currencyForm = err?.message || 'Error creando moneda';
      toast.error(errors.value.currencyForm);
      return null;
    } finally {
      isSubmitting.value = false;
    }
  }

  /**
   * Actualiza una moneda (Staff only)
   */
  async function updateCurrency(id: ULID, data: CurrencyFormData): Promise<Currency | null> {
    isSubmitting.value = true;
    errors.value.currencyForm = null;
    
    try {
      const currency = await paymentsService.updateCurrency(id, data);
      const index = currencies.value.findIndex(c => c.id === id);
      if (index !== -1) {
        currencies.value[index] = currency;
      }
      toast.success(`Moneda ${currency.code} actualizada`);
      return currency;
    } catch (err: any) {
      errors.value.currencyForm = err?.message || 'Error actualizando moneda';
      toast.error(errors.value.currencyForm);
      return null;
    } finally {
      isSubmitting.value = false;
    }
  }

  /**
   * Elimina una moneda (Staff only)
   */
  async function deleteCurrency(id: ULID): Promise<boolean> {
    try {
      await paymentsService.deleteCurrency(id);
      currencies.value = currencies.value.filter(c => c.id !== id);
      toast.success('Moneda eliminada');
      return true;
    } catch (err: any) {
      toast.error(err?.message || 'Error eliminando moneda');
      return false;
    }
  }

  /**
   * Activa/desactiva una moneda
   */
  async function toggleCurrencyStatus(id: ULID, isActive: boolean): Promise<void> {
    try {
      await paymentsService.toggleCurrencyStatus(id, isActive);
      const currency = currencies.value.find(c => c.id === id);
      if (currency) {
        currency.is_active = isActive;
      }
      toast.success(`Moneda ${isActive ? 'activada' : 'desactivada'}`);
    } catch (err: any) {
      toast.error(err?.message || 'Error cambiando estado');
    }
  }

  /**
   * Selecciona una moneda activa
   */
  function selectCurrency(currency: Currency): void {
    selectedCurrency.value = currency;
  }

  /**
   * Carga las tasas de cambio
   */
  async function loadExchangeRates(): Promise<void> {
    try {
      const data = await paymentsService.fetchExchangeRates();
      exchangeRates.value = data;
    } catch (err: any) {
      errors.value.exchangeRates = err?.message || 'Error cargando tasas';
    }
  }

  // ===========================================================================
  // ACTIONS - Plantillas (Staff)
  // ===========================================================================

  /**
   * Carga las plantillas de métodos de pago
   */
  async function loadTemplates(): Promise<void> {
    isLoading.value = true;
    errors.value.templates = null;
    
    try {
      const [templatesData, categoriesData, typesData] = await Promise.all([
        paymentsService.fetchPaymentTemplates(),
        paymentsService.fetchPaymentCategories(),
        paymentsService.fetchPaymentTypes(),
      ]);
      templates.value = templatesData;
      categories.value = categoriesData;
      paymentTypes.value = typesData;
    } catch (err: any) {
      errors.value.templates = err?.message || 'Error cargando plantillas';
      if (err?.status === 403) {
        errors.value.templates = 'Acceso denegado. Solo Staff puede gestionar plantillas.';
      }
      toast.error(errors.value.templates);
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Crea una nueva plantilla
   */
  async function createTemplate(data: FormData): Promise<PaymentMethodTemplate | null> {
    isSubmitting.value = true;
    
    try {
      const template = await paymentsService.createPaymentTemplate(data);
      templates.value.push(template);
      toast.success(`Plantilla "${template.name}" creada`);
      return template;
    } catch (err: any) {
      toast.error(err?.message || 'Error creando plantilla');
      return null;
    } finally {
      isSubmitting.value = false;
    }
  }

  /**
   * Actualiza una plantilla
   */
  async function updateTemplate(id: ULID, data: FormData): Promise<PaymentMethodTemplate | null> {
    isSubmitting.value = true;
    
    try {
      const template = await paymentsService.updatePaymentTemplate(id, data);
      const index = templates.value.findIndex(t => t.id === id);
      if (index !== -1) {
        templates.value[index] = template;
      }
      toast.success(`Plantilla "${template.name}" actualizada`);
      return template;
    } catch (err: any) {
      toast.error(err?.message || 'Error actualizando plantilla');
      return null;
    } finally {
      isSubmitting.value = false;
    }
  }

  /**
   * Elimina una plantilla
   */
  async function deleteTemplate(id: ULID): Promise<boolean> {
    try {
      await paymentsService.deletePaymentTemplate(id);
      templates.value = templates.value.filter(t => t.id !== id);
      toast.success('Plantilla eliminada');
      return true;
    } catch (err: any) {
      toast.error(err?.message || 'Error eliminando plantilla');
      return false;
    }
  }

  /**
   * Activa/desactiva una plantilla
   */
  async function toggleTemplateStatus(id: ULID, isActive: boolean): Promise<void> {
    try {
      await paymentsService.toggleTemplateStatus(id, isActive);
      const template = templates.value.find(t => t.id === id);
      if (template) {
        template.is_active = isActive;
      }
      toast.success(`Plantilla ${isActive ? 'activada' : 'desactivada'}`);
    } catch (err: any) {
      toast.error(err?.message || 'Error cambiando estado');
    }
  }

  // ===========================================================================
  // ACTIONS - Métodos SaaS
  // ===========================================================================

  /**
   * Carga los métodos de pago SaaS (Staff view)
   */
  async function loadSaasPaymentMethods(): Promise<void> {
    isLoading.value = true;
    errors.value.saasMethods = null;
    
    try {
      const data = await paymentsService.fetchSaasPaymentMethods();
      saasPaymentMethods.value = data;
    } catch (err: any) {
      errors.value.saasMethods = err?.message || 'Error cargando métodos SaaS';
      toast.error(errors.value.saasMethods);
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Carga los métodos SaaS disponibles para el Tenant
   */
  async function loadTenantSaasPaymentMethods(): Promise<void> {
    isLoading.value = true;
    errors.value.saasMethods = null;
    
    try {
      const data = await paymentsService.fetchTenantSaasPaymentMethods();
      tenantSaasPaymentMethods.value = data;
    } catch (err: any) {
      errors.value.saasMethods = err?.message || 'Error cargando métodos disponibles';
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Crea un método de pago SaaS
   */
  async function createSaasPaymentMethod(
    data: SaasPaymentMethodFormData
  ): Promise<SaasPaymentMethod | null> {
    isSubmitting.value = true;
    
    try {
      const method = await paymentsService.createSaasPaymentMethod(data);
      saasPaymentMethods.value.push(method);
      toast.success('Método SaaS creado');
      return method;
    } catch (err: any) {
      toast.error(err?.message || 'Error creando método');
      return null;
    } finally {
      isSubmitting.value = false;
    }
  }

  /**
   * Actualiza un método SaaS
   */
  async function updateSaasPaymentMethod(
    id: ULID,
    data: Partial<SaasPaymentMethodFormData>
  ): Promise<SaasPaymentMethod | null> {
    isSubmitting.value = true;
    
    try {
      const method = await paymentsService.updateSaasPaymentMethod(id, data);
      const index = saasPaymentMethods.value.findIndex(m => m.id === id);
      if (index !== -1) {
        saasPaymentMethods.value[index] = method;
      }
      toast.success('Método SaaS actualizado');
      return method;
    } catch (err: any) {
      toast.error(err?.message || 'Error actualizando método');
      return null;
    } finally {
      isSubmitting.value = false;
    }
  }

  /**
   * Elimina un método SaaS
   */
  async function deleteSaasPaymentMethod(id: ULID): Promise<boolean> {
    try {
      await paymentsService.deleteSaasPaymentMethod(id);
      saasPaymentMethods.value = saasPaymentMethods.value.filter(m => m.id !== id);
      toast.success('Método SaaS eliminado');
      return true;
    } catch (err: any) {
      toast.error(err?.message || 'Error eliminando método');
      return false;
    }
  }

  // ===========================================================================
  // ACTIONS - Métodos Tenant
  // ===========================================================================

  /**
   * Carga los métodos de pago del Tenant
   */
  async function loadTenantPaymentMethods(): Promise<void> {
    isLoading.value = true;
    errors.value.tenantMethods = null;
    
    try {
      const data = await paymentsService.fetchTenantPaymentMethods();
      tenantPaymentMethods.value = data;
    } catch (err: any) {
      errors.value.tenantMethods = err?.message || 'Error cargando métodos de pago';
      toast.error(errors.value.tenantMethods);
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Crea un método de pago para el Tenant
   */
  async function createTenantPaymentMethod(
    data: TenantPaymentMethodFormData
  ): Promise<TenantPaymentMethod | null> {
    isSubmitting.value = true;
    
    try {
      const method = await paymentsService.createTenantPaymentMethod(data);
      tenantPaymentMethods.value.push(method);
      toast.success('Método de pago creado');
      return method;
    } catch (err: any) {
      toast.error(err?.message || 'Error creando método de pago');
      return null;
    } finally {
      isSubmitting.value = false;
    }
  }

  /**
   * Actualiza un método de pago del Tenant
   */
  async function updateTenantPaymentMethod(
    id: ULID,
    data: Partial<TenantPaymentMethodFormData>
  ): Promise<TenantPaymentMethod | null> {
    isSubmitting.value = true;
    
    try {
      const method = await paymentsService.updateTenantPaymentMethod(id, data);
      const index = tenantPaymentMethods.value.findIndex(m => m.id === id);
      if (index !== -1) {
        tenantPaymentMethods.value[index] = method;
      }
      toast.success('Método de pago actualizado');
      return method;
    } catch (err: any) {
      toast.error(err?.message || 'Error actualizando método');
      return null;
    } finally {
      isSubmitting.value = false;
    }
  }

  /**
   * Elimina un método de pago del Tenant
   */
  async function deleteTenantPaymentMethod(id: ULID): Promise<boolean> {
    try {
      await paymentsService.deleteTenantPaymentMethod(id);
      tenantPaymentMethods.value = tenantPaymentMethods.value.filter(m => m.id !== id);
      toast.success('Método de pago eliminado');
      return true;
    } catch (err: any) {
      toast.error(err?.message || 'Error eliminando método');
      return false;
    }
  }

  /**
   * Activa/desactiva un método de pago del Tenant
   */
  async function toggleTenantPaymentMethodStatus(id: ULID, isActive: boolean): Promise<void> {
    try {
      await paymentsService.toggleTenantPaymentMethodStatus(id, isActive);
      const method = tenantPaymentMethods.value.find(m => m.id === id);
      if (method) {
        method.is_active = isActive;
      }
      toast.success(`Método ${isActive ? 'activado' : 'desactivado'}`);
    } catch (err: any) {
      toast.error(err?.message || 'Error cambiando estado');
    }
  }

  // ===========================================================================
  // ACTIONS - Transacciones
  // ===========================================================================

  /**
   * Carga las transacciones del Tenant
   */
  async function loadTransactions(filters?: TransactionFilters): Promise<void> {
    isLoading.value = true;
    errors.value.transactions = null;
    
    try {
      const data = await paymentsService.fetchTransactions(filters);
      transactions.value = data;
    } catch (err: any) {
      errors.value.transactions = err?.message || 'Error cargando transacciones';
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Carga una transacción por ID
   */
  async function loadTransactionById(id: ULID): Promise<PaymentTransaction | null> {
    try {
      const transaction = await paymentsService.fetchTransactionById(id);
      selectedTransaction.value = transaction;
      return transaction;
    } catch (err: any) {
      toast.error(err?.message || 'Error cargando transacción');
      return null;
    }
  }

  /**
   * Crea una nueva transacción
   */
  async function createTransaction(
    data: Partial<PaymentTransaction>
  ): Promise<PaymentTransaction | null> {
    isSubmitting.value = true;
    
    try {
      const transaction = await paymentsService.createTransaction(data);
      transactions.value.unshift(transaction);
      toast.success('Transacción registrada');
      return transaction;
    } catch (err: any) {
      toast.error(err?.message || 'Error registrando transacción');
      return null;
    } finally {
      isSubmitting.value = false;
    }
  }

  /**
   * Actualiza el estado de una transacción
   */
  async function updateTransactionStatus(
    id: ULID,
    status: PaymentTransaction['status']
  ): Promise<PaymentTransaction | null> {
    try {
      const transaction = await paymentsService.updateTransactionStatus(id, status);
      const index = transactions.value.findIndex(t => t.id === id);
      if (index !== -1) {
        transactions.value[index] = transaction;
      }
      if (selectedTransaction.value?.id === id) {
        selectedTransaction.value = transaction;
      }
      toast.success(`Estado actualizado a: ${status}`);
      return transaction;
    } catch (err: any) {
      toast.error(err?.message || 'Error actualizando estado');
      return null;
    }
  }

  // ===========================================================================
  // ACTIONS - Limpieza
  // ===========================================================================

  /**
   * Limpia todos los errores
   */
  function clearErrors(): void {
    errors.value = {};
  }

  /**
   * Resetea el store a su estado inicial
   */
  function $reset(): void {
    currencies.value = [];
    exchangeRates.value = [];
    selectedCurrency.value = null;
    templates.value = [];
    categories.value = [];
    paymentTypes.value = [];
    saasPaymentMethods.value = [];
    tenantSaasPaymentMethods.value = [];
    tenantPaymentMethods.value = [];
    transactions.value = [];
    selectedTransaction.value = null;
    isLoading.value = false;
    isSubmitting.value = false;
    errors.value = {};
  }

  // ===========================================================================
  // RETURN
  // ===========================================================================
  return {
    // State
    currencies,
    exchangeRates,
    selectedCurrency,
    templates,
    categories,
    paymentTypes,
    saasPaymentMethods,
    tenantSaasPaymentMethods,
    tenantPaymentMethods,
    transactions,
    selectedTransaction,
    isLoading,
    isSubmitting,
    errors,
    
    // Getters
    activeCurrencies,
    currenciesByCode,
    currenciesById,
    getExchangeRate,
    activeTemplates,
    templatesByCategory,
    getTemplateById,
    activeSaasMethods,
    availableSaasMethods,
    saasMethodsByTemplate,
    activeTenantMethods,
    tenantMethodsByCategory,
    getTenantMethodById,
    pendingTransactions,
    completedTransactions,
    
    // Actions - Currencies
    loadCurrencies,
    createCurrency,
    updateCurrency,
    deleteCurrency,
    toggleCurrencyStatus,
    selectCurrency,
    loadExchangeRates,
    
    // Actions - Templates
    loadTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    toggleTemplateStatus,
    
    // Actions - SaaS Methods
    loadSaasPaymentMethods,
    loadTenantSaasPaymentMethods,
    createSaasPaymentMethod,
    updateSaasPaymentMethod,
    deleteSaasPaymentMethod,
    
    // Actions - Tenant Methods
    loadTenantPaymentMethods,
    createTenantPaymentMethod,
    updateTenantPaymentMethod,
    deleteTenantPaymentMethod,
    toggleTenantPaymentMethodStatus,
    
    // Actions - Transactions
    loadTransactions,
    loadTransactionById,
    createTransaction,
    updateTransactionStatus,
    
    // Utils
    clearErrors,
    $reset,
  };
});
