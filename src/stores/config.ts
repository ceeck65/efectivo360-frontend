import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { GlobalConfig, Currency, PaymentCategory, PaymentTypeOption, CurrencyFormatRules } from '@/types';
import { useApi } from '@/composables/useApi';

// Mock config for development when API is not available
const getMockConfig = (): GlobalConfig => ({
  currencies: [
    {
      id: 1,
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
      is_active: true,
      format_rules: {
        code: 'USD',
        symbol: '$',
        symbol_position: 'prefix',
        decimal_separator: '.',
        thousand_separator: ',',
        decimal_precision: 2,
      },
    },
    {
      id: 2,
      code: 'VES',
      name: 'Bolívar Soberano',
      symbol: 'Bs',
      is_active: true,
      format_rules: {
        code: 'VES',
        symbol: 'Bs',
        symbol_position: 'prefix',
        decimal_separator: ',',
        thousand_separator: '.',
        decimal_precision: 2,
      },
    },
  ],
  payment_categories: [],
  payment_types: [],
  icons: {
    'banknote': 'Banknote',
    'credit-card': 'CreditCard',
    'arrow-left-right': 'ArrowLeftRight',
  },
  tenant: {
    id: 1,
    name: 'Efectivo 360',
    slug: 'efectivo360',
    timezone: 'America/Caracas',
    default_currency_code: 'USD',
    default_language: 'es',
    features: [],
  },
  ui_config: {
    primary_color: '#3b82f6',
    logo_url: '',
    favicon_url: '',
  },
});

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
      map[currency.code] = currency.format_rules;
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
