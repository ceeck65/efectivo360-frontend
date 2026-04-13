import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { GlobalConfig, Currency, PaymentCategory, PaymentTypeOption, CurrencyFormatRules } from '@/types';
import { useApi } from '@/composables/useApi';

export const useConfigStore = defineStore('config', () => {
  // State
  const config = ref<GlobalConfig | null>(null);
  const isLoading = ref(false);
  const isInitialized = ref(false);
  const error = ref<string | null>(null);

  // Getters (computed)
  const currencies = computed((): Currency[] => config.value?.currencies || []);
  const paymentCategories = computed((): PaymentCategory[] => config.value?.payment_categories || []);
  const paymentTypes = computed((): PaymentTypeOption[] => config.value?.payment_types || []);
  const icons = computed((): Record<string, string> => config.value?.icons || {});
  const tenant = computed(() => config.value?.tenant || null);
  
  const currencyRulesMap = computed((): Record<string, CurrencyFormatRules> => {
    const map: Record<string, CurrencyFormatRules> = {};
    currencies.value.forEach(currency => {
      map[currency.code] = {
        code: currency.code,
        symbol: currency.symbol,
        decimal_precision: currency.decimal_precision,
        symbol_position: currency.symbol_position,
        thousand_separator: currency.thousand_separator,
        decimal_separator: currency.decimal_separator,
      };
    });
    return map;
  });

  const getCurrencyRules = (code: string): CurrencyFormatRules | null => {
    return currencyRulesMap.value[code.toUpperCase()] || null;
  };

  const getPaymentTypeLabel = (id: number): string => {
    const type = paymentTypes.value.find(t => t.id === id);
    return type?.name || String(id);
  };

  const getPaymentCategory = (idOrSlug: number | string): PaymentCategory | null => {
    if (typeof idOrSlug === 'number') {
      return paymentCategories.value.find(c => c.id === idOrSlug) || null;
    }
    return paymentCategories.value.find(c => c.slug === idOrSlug) || null;
  };

  const getIcon = (name: string): string | null => {
    return icons.value[name] || null;
  };

  // Actions
  const { fetchApi } = useApi();

  const initialize = async (): Promise<void> => {
    if (isInitialized.value) return;
    
    isLoading.value = true;
    error.value = null;
    
    try {
      // Initial bootstrap call - gets all global config
      const data = await fetchApi<GlobalConfig>('/api/v1/global-config/');
      config.value = data;
      isInitialized.value = true;
    } catch (err: any) {
      error.value = err.message || 'Failed to load configuration';
      // Silently fail - individual composables will load their own data
      config.value = {
        currencies: [],
        payment_categories: [],
        payment_types: [],
        icons: {},
        tenant: null as any,
        ui_config: {} as any,
      };
      isInitialized.value = true;
    } finally {
      isLoading.value = false;
    }
  };

  const refresh = async (): Promise<void> => {
    isInitialized.value = false;
    await initialize();
  };

  return {
    // State
    config,
    isLoading,
    isInitialized,
    error,
    // Getters
    currencies,
    paymentCategories,
    paymentTypes,
    icons,
    tenant,
    currencyRulesMap,
    // Methods
    getCurrencyRules,
    getPaymentTypeLabel,
    getPaymentCategory,
    getIcon,
    initialize,
    refresh,
  };
});
