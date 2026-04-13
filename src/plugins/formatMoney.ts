import type { App } from 'vue';
import { useConfigStore } from '@/stores/config';
import type { CurrencyFormatRules } from '@/types';

export interface FormatMoneyPlugin {
  formatMoney: (amount: number, currencyCode: string, fallback?: string) => string;
  formatMoneyByRules: (amount: number, rules: CurrencyFormatRules, fallback?: string) => string;
  parseMoney: (value: string, currencyCode: string) => number | null;
}

export const formatMoneyPlugin = {
  install(app: App) {
    const formatMoney = (amount: number, currencyCode: string, fallback: string = '—'): string => {
      const configStore = useConfigStore();
      const rules = configStore.getCurrencyRules(currencyCode);
      
      if (!rules) {
        console.warn(`[formatMoney] Currency ${currencyCode} not found in store`);
        return fallback;
      }
      
      return formatMoneyByRules(amount, rules, fallback);
    };

    const formatMoneyByRules = (
      amount: number, 
      rules: CurrencyFormatRules, 
      fallback: string = '—'
    ): string => {
      if (amount === null || amount === undefined || Number.isNaN(amount)) {
        return fallback;
      }

      const {
        symbol,
        decimal_precision,
        symbol_position,
        thousand_separator,
        decimal_separator,
      } = rules;

      const factor = Math.pow(10, decimal_precision);
      const rounded = Math.round(amount * factor) / factor;

      let numberPart: string;

      if (decimal_precision > 0) {
        const fixed = rounded.toFixed(decimal_precision);
        const [intPart, decPart] = fixed.split('.');
        const intWithSeparators = intPart.replace(
          /\B(?=(\d{3})+(?!\d))/g,
          thousand_separator === ' ' ? '\u00A0' : thousand_separator
        );
        numberPart = `${intWithSeparators}${decimal_separator}${decPart}`;
      } else {
        const intPart = Math.round(rounded).toString();
        numberPart = intPart.replace(
          /\B(?=(\d{3})+(?!\d))/g,
          thousand_separator === ' ' ? '\u00A0' : thousand_separator
        );
      }

      if (symbol_position === 'prefix') {
        return `${symbol}${numberPart}`;
      } else {
        return `${numberPart} ${symbol}`;
      }
    };

    const parseMoney = (value: string, currencyCode: string): number | null => {
      const configStore = useConfigStore();
      const rules = configStore.getCurrencyRules(currencyCode);
      
      if (!rules || !value || value.trim() === '') return null;

      try {
        let cleaned = value.replace(rules.symbol, '').trim();
        cleaned = cleaned.split(rules.thousand_separator).join('');
        cleaned = cleaned.replace(rules.decimal_separator, '.');
        const parsed = parseFloat(cleaned);
        return Number.isNaN(parsed) ? null : parsed;
      } catch {
        return null;
      }
    };

    app.config.globalProperties.$formatMoney = formatMoney;
    app.config.globalProperties.$formatMoneyByRules = formatMoneyByRules;
    app.config.globalProperties.$parseMoney = parseMoney;
    app.provide('formatMoney', formatMoney);
    app.provide('formatMoneyByRules', formatMoneyByRules);
    app.provide('parseMoney', parseMoney);
  },
};

export function useFormatMoney(): FormatMoneyPlugin {
  const configStore = useConfigStore();
  
  const formatMoney = (amount: number, currencyCode: string, fallback: string = '—'): string => {
    const rules = configStore.getCurrencyRules(currencyCode);
    if (!rules) return fallback;
    return formatMoneyByRules(amount, rules, fallback);
  };

  const formatMoneyByRules = (amount: number, rules: CurrencyFormatRules, fallback: string = '—'): string => {
    if (amount === null || amount === undefined || Number.isNaN(amount)) return fallback;

    const { symbol, decimal_precision, symbol_position, thousand_separator, decimal_separator } = rules;
    const factor = Math.pow(10, decimal_precision);
    const rounded = Math.round(amount * factor) / factor;

    let numberPart: string;
    if (decimal_precision > 0) {
      const fixed = rounded.toFixed(decimal_precision);
      const [intPart, decPart] = fixed.split('.');
      const intWithSeparators = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousand_separator === ' ' ? '\u00A0' : thousand_separator);
      numberPart = `${intWithSeparators}${decimal_separator}${decPart}`;
    } else {
      numberPart = Math.round(rounded).toString().replace(/\B(?=(\d{3})+(?!\d))/g, thousand_separator === ' ' ? '\u00A0' : thousand_separator);
    }

    return symbol_position === 'prefix' ? `${symbol}${numberPart}` : `${numberPart} ${symbol}`;
  };

  const parseMoney = (value: string, currencyCode: string): number | null => {
    const rules = configStore.getCurrencyRules(currencyCode);
    if (!rules || !value?.trim()) return null;
    try {
      let cleaned = value.replace(rules.symbol, '').trim();
      cleaned = cleaned.split(rules.thousand_separator).join('');
      cleaned = cleaned.replace(rules.decimal_separator, '.');
      const parsed = parseFloat(cleaned);
      return Number.isNaN(parsed) ? null : parsed;
    } catch { return null; }
  };

  return { formatMoney, formatMoneyByRules, parseMoney };
}
