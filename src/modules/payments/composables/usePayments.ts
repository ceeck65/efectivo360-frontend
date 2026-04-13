/**
 * @fileoverview Composable usePayments - Cerebro del módulo Payments
 * Orquesta selección de moneda, cálculo de conversiones y validación de métodos
 * @module @modules/payments/composables/usePayments
 */

import { ref, computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { toast } from 'vue3-toastify';
import type { ULID } from '@core/types';
import { usePaymentsStore } from '../stores/paymentsStore';
import * as paymentsService from '../services/payments.service';
import type {
  Currency,
  PublicPaymentMethodView,
  PaymentMethodAvailability,
  CurrencyConversionResult,
} from '../types';

/**
 * Composable principal del módulo Payments
 * Unifica la lógica de monedas, conversiones y métodos de pago
 */
export function usePayments() {
  const store = usePaymentsStore();
  const {
    // State refs
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
    activeTemplates,
    templatesByCategory,
    activeSaasMethods,
    availableSaasMethods,
    saasMethodsByTemplate,
    activeTenantMethods,
    tenantMethodsByCategory,
    pendingTransactions,
    completedTransactions,
  } = storeToRefs(store);

  // ===========================================================================
  // LOCAL STATE - Configuración de conversión
  // ===========================================================================
  
  /** Moneda destino para conversiones */
  const targetCurrency = ref<Currency | null>(null);
  
  /** Monto a convertir (en céntimos) */
  const amountToConvert = ref<number>(0);
  
  /** Resultado de la última conversión */
  const lastConversion = ref<CurrencyConversionResult | null>(null);
  
  /** Método de pago seleccionado para transacción */
  const selectedPaymentMethod = ref<TenantPaymentMethod | null>(null);

  // ===========================================================================
  // COMPUTED - Conversión de monedas
  // ===========================================================================

  /** Tasa de cambio entre moneda seleccionada y moneda destino */
  const currentExchangeRate = computed(() => {
    if (!selectedCurrency.value || !targetCurrency.value) return null;
    
    return exchangeRates.value.find(
      r => 
        r.from_currency_id === selectedCurrency.value?.id && 
        r.to_currency_id === targetCurrency.value?.id &&
        r.is_active
    );
  });

  /** Tasa disponible para conversión directa */
  const availableRate = computed(() => {
    if (!currentExchangeRate.value) return null;
    return currentExchangeRate.value.rate;
  });

  /** Monto convertido basado en la tasa actual */
  const convertedAmount = computed(() => {
    if (!amountToConvert.value || !availableRate.value) return 0;
    return Math.round(amountToConvert.value * availableRate.value);
  });

  /** Indica si hay tasa de cambio disponible entre las monedas seleccionadas */
  const canConvert = computed(() => {
    return !!selectedCurrency.value && 
           !!targetCurrency.value && 
           !!availableRate.value &&
           selectedCurrency.value.id !== targetCurrency.value.id;
  });

  // ===========================================================================
  // COMPUTED - Validación de métodos de pago
  // ===========================================================================

  /**
   * Verifica si un método de pago está disponible para un monto específico
   */
  const checkMethodAvailability = computed(() => 
    (method: TenantPaymentMethod | PublicPaymentMethodView, amount: number): PaymentMethodAvailability => {
      // Verificar si está activo
      if (!method) {
        return { available: false, reason: 'Método no encontrado' };
      }

      // Verificar monto mínimo
      if (method.minimum_amount !== null && method.minimum_amount !== undefined) {
        if (amount < method.minimum_amount) {
          return {
            available: false,
            reason: `Monto mínimo: ${formatAmount(method.minimum_amount)}`,
            minimum_amount: method.minimum_amount,
          };
        }
      }

      // Verificar monto máximo
      if (method.maximum_amount !== null && method.maximum_amount !== undefined) {
        if (amount > method.maximum_amount) {
          return {
            available: false,
            reason: `Monto máximo: ${formatAmount(method.maximum_amount)}`,
            maximum_amount: method.maximum_amount,
          };
        }
      }

      // Calcular comisión si aplica (solo para TenantPaymentMethod)
      const commissionRate = 'commission_rate' in method ? method.commission_rate : null;
      const estimatedCommission = commissionRate ? Math.round(amount * (commissionRate / 100)) : 0;

      return {
        available: true,
        minimum_amount: method.minimum_amount ?? undefined,
        maximum_amount: method.maximum_amount ?? undefined,
        estimated_commission: estimatedCommission || undefined,
      };
    }
  );

  /**
   * Filtra métodos disponibles para un monto específico
   */
  const getAvailableMethodsForAmount = computed(() => (amount: number) => {
    return activeTenantMethods.value.filter(method => {
      const availability = checkMethodAvailability.value(method, amount);
      return availability.available;
    });
  });

  // ===========================================================================
  // METHODS - Formato de monedas
  // ===========================================================================

  /**
   * Formatea un monto según las reglas de la moneda
   * @param amount - Monto en céntimos/unidades base
   * @param currencyCode - Código de moneda (usa seleccionada si no se especifica)
   * @returns String formateado
   */
  function formatAmount(amount: number, currencyCode?: string): string {
    const currency = currencyCode 
      ? currenciesByCode.value[currencyCode]
      : selectedCurrency.value;
    
    if (!currency) return String(amount);

    const { 
      symbol, 
      decimal_precision, 
      symbol_position, 
      thousand_separator, 
      decimal_separator 
    } = currency;

    // Convertir de céntimos a unidad base
    const divisor = Math.pow(10, decimal_precision);
    const value = amount / divisor;

    // Formatear número
    const parts = value.toFixed(decimal_precision).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousand_separator);
    const decimalPart = parts[1];

    const formattedNumber = decimal_precision > 0
      ? `${integerPart}${decimal_separator}${decimalPart}`
      : integerPart;

    // Posición del símbolo
    return symbol_position === 'prefix'
      ? `${symbol}${formattedNumber}`
      : `${formattedNumber} ${symbol}`;
  }

  /**
   * Parsea un monto formateado a número
   * @param formattedValue - Valor formateado (ej: "$ 1.234,56")
   * @param currencyCode - Código de moneda
   * @returns Monto en céntimos
   */
  function parseAmount(formattedValue: string, currencyCode?: string): number {
    const currency = currencyCode 
      ? currenciesByCode.value[currencyCode]
      : selectedCurrency.value;
    
    if (!currency) return 0;

    const { decimal_precision, thousand_separator, decimal_separator } = currency;

    // Limpiar el string
    let cleanValue = formattedValue.trim();
    
    // Remover símbolo
    cleanValue = cleanValue.replace(currency.symbol, '').trim();
    
    // Reemplazar separadores
    cleanValue = cleanValue.replace(new RegExp(`\\${thousand_separator}`, 'g'), '');
    cleanValue = cleanValue.replace(decimal_separator, '.');

    const value = parseFloat(cleanValue) || 0;
    
    // Convertir a céntimos
    return Math.round(value * Math.pow(10, decimal_precision));
  }

  // ===========================================================================
  // METHODS - Conversión
  // ===========================================================================

  /**
   * Convierte un monto entre dos monedas
   * @param amount - Monto en moneda origen
   * @param fromCurrencyId - Moneda origen (usa seleccionada si no se especifica)
   * @param toCurrencyId - Moneda destino (usa target si no se especifica)
   * @returns Resultado de la conversión o null si falla
   */
  async function convertCurrency(
    amount: number,
    fromCurrencyId?: ULID,
    toCurrencyId?: ULID
  ): Promise<CurrencyConversionResult | null> {
    const fromId = fromCurrencyId || selectedCurrency.value?.id;
    const toId = toCurrencyId || targetCurrency.value?.id;

    if (!fromId || !toId) {
      toast.error('Selecciona ambas monedas para convertir');
      return null;
    }

    if (fromId === toId) {
      // Misma moneda, no hay conversión
      const currency = currenciesById.value[fromId];
      return {
        original_amount: amount,
        from_currency: currency,
        to_currency: currency,
        converted_amount: amount,
        rate: 1,
        rate_date: new Date().toISOString(),
      };
    }

    try {
      const result = await paymentsService.convertCurrency(amount, fromId, toId);
      lastConversion.value = {
        ...result,
        rate_date: new Date().toISOString(),
      };
      return lastConversion.value;
    } catch (err: any) {
      toast.error(err?.message || 'Error en la conversión');
      return null;
    }
  }

  /**
   * Establece la moneda destino para conversiones
   */
  function setTargetCurrency(currency: Currency | null): void {
    targetCurrency.value = currency;
  }

  /**
   * Establece el monto a convertir
   */
  function setAmountToConvert(amount: number): void {
    amountToConvert.value = amount;
  }

  // ===========================================================================
  // METHODS - Métodos de pago públicos
  // ===========================================================================

  /**
   * Carga métodos de pago públicos de un tenant (para checkout)
   */
  async function loadPublicPaymentMethods(tenantSlug: string): Promise<PublicPaymentMethodView[]> {
    try {
      return await paymentsService.fetchPublicPaymentMethods(tenantSlug);
    } catch (err: any) {
      toast.error(err?.message || 'Error cargando métodos de pago');
      return [];
    }
  }

  // ===========================================================================
  // METHODS - Selección
  // ===========================================================================

  /**
   * Selecciona un método de pago para transacción
   */
  function selectPaymentMethod(method: TenantPaymentMethod | null): void {
    selectedPaymentMethod.value = method;
  }

  /**
   * Selecciona una moneda como activa
   */
  function selectCurrency(currency: Currency): void {
    store.selectCurrency(currency);
  }

  // ===========================================================================
  // METHODS - Inicialización
  // ===========================================================================

  /**
   * Inicializa el módulo cargando datos esenciales
   */
  async function initialize(): Promise<void> {
    await Promise.all([
      store.loadCurrencies(),
      store.loadExchangeRates(),
    ]);
    
    // Establecer moneda destino por defecto si hay múltiples monedas
    if (activeCurrencies.value.length > 1 && selectedCurrency.value) {
      const other = activeCurrencies.value.find(c => c.id !== selectedCurrency.value?.id);
      if (other) {
        targetCurrency.value = other;
      }
    }
  }

  /**
   * Carga todos los datos del tenant
   */
  async function loadTenantData(): Promise<void> {
    await Promise.all([
      store.loadTenantPaymentMethods(),
      store.loadTenantSaasPaymentMethods(),
    ]);
  }

  /**
   * Carga todos los datos de Staff
   */
  async function loadStaffData(): Promise<void> {
    await Promise.all([
      store.loadTemplates(),
      store.loadSaasPaymentMethods(),
    ]);
  }

  // ===========================================================================
  // WATCHERS
  // ===========================================================================

  // Recalcular conversión cuando cambian las monedas o el monto
  watch([selectedCurrency, targetCurrency, amountToConvert], () => {
    if (canConvert.value && amountToConvert.value > 0) {
      // La conversión se hace on-demand, no automáticamente
      // para evitar llamadas excesivas a la API
    }
  });

  // ===========================================================================
  // RETURN
  // ===========================================================================
  return {
    // Store refs
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
    
    // Local refs
    targetCurrency,
    amountToConvert,
    lastConversion,
    selectedPaymentMethod,
    
    // Computed
    activeCurrencies,
    currenciesByCode,
    currenciesById,
    activeTemplates,
    templatesByCategory,
    activeSaasMethods,
    availableSaasMethods,
    saasMethodsByTemplate,
    activeTenantMethods,
    tenantMethodsByCategory,
    pendingTransactions,
    completedTransactions,
    currentExchangeRate,
    availableRate,
    convertedAmount,
    canConvert,
    checkMethodAvailability,
    getAvailableMethodsForAmount,
    
    // Methods - Store actions
    loadCurrencies: store.loadCurrencies,
    createCurrency: store.createCurrency,
    updateCurrency: store.updateCurrency,
    deleteCurrency: store.deleteCurrency,
    toggleCurrencyStatus: store.toggleCurrencyStatus,
    loadExchangeRates: store.loadExchangeRates,
    loadTemplates: store.loadTemplates,
    createTemplate: store.createTemplate,
    updateTemplate: store.updateTemplate,
    deleteTemplate: store.deleteTemplate,
    toggleTemplateStatus: store.toggleTemplateStatus,
    loadSaasPaymentMethods: store.loadSaasPaymentMethods,
    loadTenantSaasPaymentMethods: store.loadTenantSaasPaymentMethods,
    createSaasPaymentMethod: store.createSaasPaymentMethod,
    updateSaasPaymentMethod: store.updateSaasPaymentMethod,
    deleteSaasPaymentMethod: store.deleteSaasPaymentMethod,
    loadTenantPaymentMethods: store.loadTenantPaymentMethods,
    createTenantPaymentMethod: store.createTenantPaymentMethod,
    updateTenantPaymentMethod: store.updateTenantPaymentMethod,
    deleteTenantPaymentMethod: store.deleteTenantPaymentMethod,
    toggleTenantPaymentMethodStatus: store.toggleTenantPaymentMethodStatus,
    loadTransactions: store.loadTransactions,
    loadTransactionById: store.loadTransactionById,
    createTransaction: store.createTransaction,
    updateTransactionStatus: store.updateTransactionStatus,
    clearErrors: store.clearErrors,
    
    // Methods - Local
    formatAmount,
    parseAmount,
    convertCurrency,
    setTargetCurrency,
    setAmountToConvert,
    loadPublicPaymentMethods,
    selectPaymentMethod,
    selectCurrency,
    initialize,
    loadTenantData,
    loadStaffData,
    
    // Legacy compat
    getTemplateById: store.getTemplateById,
    getTenantMethodById: store.getTenantMethodById,
  };
}

/**
 * Composable para uso en checkout (vista pública)
 * Expone solo lo necesario para el cliente final
 */
export function usePublicPayments() {
  const store = usePaymentsStore();
  const { selectedCurrency } = storeToRefs(store);

  // Local state
  const targetCurrency = ref<Currency | null>(null);
  const amountToConvert = ref<number>(0);
  const publicMethods = ref<PublicPaymentMethodView[]>([]);
  const isLoadingPublic = ref(false);

  /**
   * Carga métodos públicos de un tenant
   */
  async function loadPublicMethods(tenantSlug: string): Promise<void> {
    isLoadingPublic.value = true;
    try {
      publicMethods.value = await paymentsService.fetchPublicPaymentMethods(tenantSlug);
    } catch (err: any) {
      toast.error('Error cargando métodos de pago');
    } finally {
      isLoadingPublic.value = false;
    }
  }

  return {
    publicMethods,
    isLoading: isLoadingPublic,
    selectedCurrency,
    targetCurrency,
    amountToConvert,
    loadPublicMethods,
  };
}

/**
 * Composable para Staff (administración global)
 */
export function useStaffPayments() {
  const store = usePaymentsStore();
  
  return {
    // Templates
    templates: store.templates,
    categories: store.categories,
    paymentTypes: store.paymentTypes,
    activeTemplates: store.activeTemplates,
    templatesByCategory: store.templatesByCategory,
    loadTemplates: store.loadTemplates,
    createTemplate: store.createTemplate,
    updateTemplate: store.updateTemplate,
    deleteTemplate: store.deleteTemplate,
    toggleTemplateStatus: store.toggleTemplateStatus,
    
    // SaaS Methods
    saasPaymentMethods: store.saasPaymentMethods,
    activeSaasMethods: store.activeSaasMethods,
    saasMethodsByTemplate: store.saasMethodsByTemplate,
    loadSaasPaymentMethods: store.loadSaasPaymentMethods,
    createSaasPaymentMethod: store.createSaasPaymentMethod,
    updateSaasPaymentMethod: store.updateSaasPaymentMethod,
    deleteSaasPaymentMethod: store.deleteSaasPaymentMethod,
    
    // Currencies (Staff admin)
    currencies: store.currencies,
    activeCurrencies: store.activeCurrencies,
    loadCurrencies: store.loadCurrencies,
    createCurrency: store.createCurrency,
    updateCurrency: store.updateCurrency,
    deleteCurrency: store.deleteCurrency,
    toggleCurrencyStatus: store.toggleCurrencyStatus,
    
    // Loading states
    isLoading: store.isLoading,
    isSubmitting: store.isSubmitting,
    errors: store.errors,
  };
}

/**
 * Composable para Tenant (gestión de sus propios métodos)
 */
export function useTenantPayments() {
  const store = usePaymentsStore();
  
  return {
    // Métodos del Tenant
    tenantPaymentMethods: store.tenantPaymentMethods,
    activeTenantMethods: store.activeTenantMethods,
    tenantMethodsByCategory: store.tenantMethodsByCategory,
    loadTenantPaymentMethods: store.loadTenantPaymentMethods,
    createTenantPaymentMethod: store.createTenantPaymentMethod,
    updateTenantPaymentMethod: store.updateTenantPaymentMethod,
    deleteTenantPaymentMethod: store.deleteTenantPaymentMethod,
    toggleTenantPaymentMethodStatus: store.toggleTenantPaymentMethodStatus,
    
    // Métodos SaaS disponibles (para pagar suscripción)
    tenantSaasPaymentMethods: store.tenantSaasPaymentMethods,
    availableSaasMethods: store.availableSaasMethods,
    loadTenantSaasPaymentMethods: store.loadTenantSaasPaymentMethods,
    
    // Loading states
    isLoading: store.isLoading,
    isSubmitting: store.isSubmitting,
    errors: store.errors,
  };
}
