import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useApi } from '@/composables/useApi';

export type PosLayout = 'standard_right' | 'standard_left' | 'compact_grid';
export type PosThemeColor = 'emerald' | 'blue' | 'violet' | 'dark';

export interface POSPreferences {
  show_virtual_keypad: boolean;
  pos_layout: PosLayout;
  theme_color: PosThemeColor;
  auto_focus_search: boolean;
  quick_cash_amounts: number[];
  clear_search_on_add: boolean;
  auto_select_numeric_fields: boolean;
}

const STORAGE_KEY = 'efectivo360_pos_preferences';

function detectTouchDevice(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(pointer: coarse)').matches;
}

function defaultPreferences(): POSPreferences {
  return {
    show_virtual_keypad: detectTouchDevice(),
    pos_layout: 'standard_right',
    theme_color: 'emerald',
    auto_focus_search: true,
    quick_cash_amounts: [5, 10, 20, 50, 100],
    clear_search_on_add: true,
    auto_select_numeric_fields: true,
  };
}

function loadFromStorage(): POSPreferences {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultPreferences();
  try {
    return { ...defaultPreferences(), ...JSON.parse(raw) };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return defaultPreferences();
  }
}

function persistToStorage(prefs: POSPreferences): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

/**
 * Preferencias de UI/UX del POS por usuario (layout, tema, teclado virtual, montos
 * rápidos). Se hidratan de forma síncrona desde localStorage al crear el store para
 * que la caja no "salte" al recargar la página mientras llega la respuesta de la API;
 * `fetchPreferences()` reconcilia luego con el valor real del servidor.
 */
export const usePOSSettingsStore = defineStore('posSettings', () => {
  const cached = loadFromStorage();

  const showVirtualKeypad = ref(cached.show_virtual_keypad);
  const posLayout = ref<PosLayout>(cached.pos_layout);
  const themeColor = ref<PosThemeColor>(cached.theme_color);
  const autoFocusSearch = ref(cached.auto_focus_search);
  const quickCashAmounts = ref<number[]>(cached.quick_cash_amounts);
  const clearSearchOnAdd = ref(cached.clear_search_on_add);
  const autoSelectNumericFields = ref(cached.auto_select_numeric_fields);

  const isSyncing = ref(false);
  const hasLoadedFromServer = ref(false);

  const { fetchApi } = useApi();

  function snapshot(): POSPreferences {
    return {
      show_virtual_keypad: showVirtualKeypad.value,
      pos_layout: posLayout.value,
      theme_color: themeColor.value,
      auto_focus_search: autoFocusSearch.value,
      quick_cash_amounts: quickCashAmounts.value,
      clear_search_on_add: clearSearchOnAdd.value,
      auto_select_numeric_fields: autoSelectNumericFields.value,
    };
  }

  function applyLocally(prefs: Partial<POSPreferences>): void {
    if (prefs.show_virtual_keypad !== undefined) showVirtualKeypad.value = prefs.show_virtual_keypad;
    if (prefs.pos_layout !== undefined) posLayout.value = prefs.pos_layout;
    if (prefs.theme_color !== undefined) themeColor.value = prefs.theme_color;
    if (prefs.auto_focus_search !== undefined) autoFocusSearch.value = prefs.auto_focus_search;
    if (prefs.quick_cash_amounts !== undefined) quickCashAmounts.value = prefs.quick_cash_amounts;
    if (prefs.clear_search_on_add !== undefined) clearSearchOnAdd.value = prefs.clear_search_on_add;
    if (prefs.auto_select_numeric_fields !== undefined) autoSelectNumericFields.value = prefs.auto_select_numeric_fields;
    persistToStorage(snapshot());
  }

  /** Trae las preferencias reales del servidor (llamar una vez al montar el POS). */
  async function fetchPreferences(): Promise<void> {
    try {
      const data = await fetchApi<POSPreferences>('/api/v1/user/pos-preferences/');
      applyLocally(data);
    } catch (err) {
      // Sin conexión o primer uso: se conserva lo que ya había en localStorage/defaults.
      console.error('[posSettings] No se pudo obtener las preferencias del servidor:', err);
    } finally {
      hasLoadedFromServer.value = true;
    }
  }

  /** Aplica el cambio de inmediato (UI + localStorage) y lo sincroniza con la API. */
  async function updatePreferences(data: Partial<POSPreferences>): Promise<void> {
    applyLocally(data);
    isSyncing.value = true;
    try {
      await fetchApi('/api/v1/user/pos-preferences/', { method: 'PATCH', data });
    } catch (err) {
      console.error('[posSettings] No se pudo sincronizar la preferencia con el servidor:', err);
    } finally {
      isSyncing.value = false;
    }
  }

  function toggleVirtualKeypad(): void {
    updatePreferences({ show_virtual_keypad: !showVirtualKeypad.value });
  }

  function setLayout(layout: PosLayout): void {
    updatePreferences({ pos_layout: layout });
  }

  return {
    showVirtualKeypad,
    posLayout,
    themeColor,
    autoFocusSearch,
    quickCashAmounts,
    clearSearchOnAdd,
    autoSelectNumericFields,
    isSyncing,
    hasLoadedFromServer,
    fetchPreferences,
    updatePreferences,
    toggleVirtualKeypad,
    setLayout,
  };
});
