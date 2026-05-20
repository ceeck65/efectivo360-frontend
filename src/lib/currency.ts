import { useConfigStore } from '@/stores/config';
import type { CurrencyFormatRules } from '@/types';

// =============================================================================
// FALLBACK DEFAULTS — used when configStore is not yet initialized
// =============================================================================

const FALLBACK_RULES: Record<string, CurrencyFormatRules> = {
  VES: { code: 'VES', symbol: 'Bs.', decimal_precision: 2, symbol_position: 'prefix', thousand_separator: ',', decimal_separator: '.' },
  USD: { code: 'USD', symbol: '$', decimal_precision: 2, symbol_position: 'prefix', thousand_separator: ',', decimal_separator: '.' },
  EUR: { code: 'EUR', symbol: '€', decimal_precision: 2, symbol_position: 'prefix', thousand_separator: ',', decimal_separator: '.' },
};

// =============================================================================
// PURE UTILITIES — no Pinia/Vue dependency
// =============================================================================

export function roundToPrecision(amount: number, precision: number): number {
  const factor = Math.pow(10, precision);
  return Math.round(amount * factor) / factor;
}

export function getStep(precision: number): number {
  return 1 / Math.pow(10, precision);
}

export function getInputPlaceholder(precision: number): string {
  return precision > 0 ? '0.' + '0'.repeat(precision) : '0';
}

export function formatByRules(amount: number | null | undefined, rules: CurrencyFormatRules, fallback = '—'): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return fallback;

  const { symbol, symbol_position } = rules;
  const precision = Math.max(0, rules.decimal_precision ?? 2);
  const decSep = (rules.decimal_separator || '').trim() || '.';
  const thouSep = (rules.thousand_separator || '').trim() || ',';

  const rounded = roundToPrecision(amount, precision);

  let numberPart: string;
  if (precision > 0) {
    const [intPart, decPart] = rounded.toFixed(precision).split('.');
    const intWithSeparators = intPart.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      thouSep === ' ' ? '\u00A0' : thouSep
    );
    numberPart = `${intWithSeparators}${decSep}${decPart}`;
  } else {
    numberPart = Math.round(rounded).toString().replace(
      /\B(?=(\d{3})+(?!\d))/g,
      thouSep === ' ' ? '\u00A0' : thouSep
    );
  }

  return symbol_position === 'prefix' ? `${symbol}${numberPart}` : `${numberPart} ${symbol}`;
}

export function parseByRules(value: string, rules: CurrencyFormatRules): number | null {
  if (!value || !value.trim()) return null;
  try {
    let cleaned = value.replace(rules.symbol, '').trim();
    cleaned = cleaned.split(rules.thousand_separator).join('');
    cleaned = cleaned.replace(rules.decimal_separator, '.');
    const parsed = parseFloat(cleaned);
    return Number.isNaN(parsed) ? null : parsed;
  } catch {
    return null;
  }
}

export function convertAmount(amount: number, rate: number): number {
  return amount * rate;
}

// =============================================================================
// STORE-BACKED HELPERS — uses Pinia configStore
// =============================================================================

function normalizeRules(raw: CurrencyFormatRules): CurrencyFormatRules {
  const mapThouSep: Record<string, string> = { '1': ',', '2': '.' };
  const mapDecSep: Record<string, string> = { '1': '.', '2': ',' };
  const mapPos: Record<string, 'prefix' | 'suffix'> = { '1': 'prefix', '2': 'suffix' };

  const ts = String(raw.thousand_separator ?? '');
  const ds = String(raw.decimal_separator ?? '');
  const sp = String(raw.symbol_position ?? '');

  return {
    ...raw,
    thousand_separator: mapThouSep[ts] ?? (ts || ','),
    decimal_separator: mapDecSep[ds] ?? (ds || '.'),
    symbol_position: mapPos[sp] ?? (sp === 'suffix' ? 'suffix' : 'prefix'),
  };
}

function getRules(currencyCode: string): CurrencyFormatRules | null {
  try {
    const store = useConfigStore();
    const raw = store.getCurrencyRules(currencyCode);
    if (raw) return normalizeRules(raw);
  } catch {
    // store not available
  }
  const fallback = FALLBACK_RULES[currencyCode.toUpperCase()];
  return fallback ? normalizeRules(fallback) : null;
}

export function formatAmount(amount: number | null | undefined, currencyCode: string, fallback = '—'): string {
  const rules = getRules(currencyCode);
  if (!rules) return fallback;
  return formatByRules(amount, rules, fallback);
}

export function parseAmount(value: string, currencyCode: string): number | null {
  const rules = getRules(currencyCode);
  if (!rules) return null;
  return parseByRules(value, rules);
}

export function getCurrencySymbol(currencyCode: string, fallback = ''): string {
  return getRules(currencyCode)?.symbol ?? fallback;
}

export function getCurrencyPrecision(currencyCode: string, fallback = 2): number {
  return getRules(currencyCode)?.decimal_precision ?? fallback;
}

export function getCurrencyStep(currencyCode: string, fallback = 2): number {
  return getStep(getCurrencyPrecision(currencyCode, fallback));
}

export function getCurrencyPlaceholder(currencyCode: string, fallback = 2): string {
  return getInputPlaceholder(getCurrencyPrecision(currencyCode, fallback));
}

// =============================================================================
// VUE COMPOSABLE
// =============================================================================

export function useCurrency() {
  return {
    formatByRules,
    parseByRules,
    roundToPrecision,
    getStep,
    getInputPlaceholder,
    convertAmount,
    formatAmount,
    parseAmount,
    getCurrencySymbol,
    getCurrencyPrecision,
    getCurrencyStep,
    getCurrencyPlaceholder,
  };
}
