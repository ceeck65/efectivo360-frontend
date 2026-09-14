import { defineStore } from 'pinia';
import { ref } from 'vue';

export type DisplayCurrency = 'USD' | 'VES';

export interface FormattedPrice {
  primary: string;
  secondary: string;
}

const STORAGE_KEY = 'efectivo360_pos_display_currency';

function loadFromStorage(): DisplayCurrency {
  return localStorage.getItem(STORAGE_KEY) === 'VES' ? 'VES' : 'USD';
}

function formatUSD(amount: number): string {
  return `$${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatVES(amount: number): string {
  return `Bs. ${(amount || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Moneda de visualización global del POS — puramente de presentación (alterna qué
 * monto se muestra grande/destacado en tarjetas de producto, ticket y modal de
 * pesaje). La moneda real de cobro/liquidación sigue siendo siempre USD; esto no
 * afecta checkout ni el registro de la venta, solo cómo se lee la pantalla.
 * Persiste solo en localStorage (no hay campo de backend para esta preferencia).
 */
export const usePosDisplayStore = defineStore('posDisplay', () => {
  const displayCurrency = ref<DisplayCurrency>(loadFromStorage());

  function setDisplayCurrency(currency: DisplayCurrency): void {
    displayCurrency.value = currency;
    localStorage.setItem(STORAGE_KEY, currency);
  }

  function toggleDisplayCurrency(): void {
    setDisplayCurrency(displayCurrency.value === 'USD' ? 'VES' : 'USD');
  }

  /**
   * amountUSD -> { primary, secondary } según displayCurrency. bcvRate se recibe
   * por parámetro porque vive en useForexRate() (por instancia), no en este store.
   */
  function formatPrice(amountUSD: number, bcvRate: number): FormattedPrice {
    const usd = formatUSD(amountUSD);
    const ves = formatVES((amountUSD || 0) * (bcvRate || 0));
    return displayCurrency.value === 'USD'
      ? { primary: usd, secondary: ves }
      : { primary: ves, secondary: usd };
  }

  return {
    displayCurrency,
    setDisplayCurrency,
    toggleDisplayCurrency,
    formatPrice,
  };
});
