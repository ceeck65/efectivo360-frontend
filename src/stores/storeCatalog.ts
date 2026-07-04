/**
 * @fileoverview Pinia store para el catálogo de categorías.
 *
 * Enruta dinámicamente según la matriz de autenticación:
 *
 *   Tipo Usuario   | Auth  | tennant_id | Endpoint
 *   ---------------|-------|------------|--------------------------------------
 *   Staff / Admin  |  JWT  | (ninguno)  | GET /api/v1/catalog/categories
 *   Cliente/Tienda |  JWT  | su ULID    | GET /api/v1/catalog/categories/?tennant_id=XXX
 *   Público        |  —    | (ninguno)  | GET /api/v1/catalog/categories
 *
 * El backend ya entrega el árbol pre-masticado. El store NO aplica filtrado local.
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface CatalogNode {
  id: number;
  code: string;
  name: string;
  icon?: string;
  is_active: boolean;
  children?: CatalogNode[];
}

const API_BASE = '/api/v1/catalog/categories';

function getToken(): string | null {
  return localStorage.getItem('access_token');
}

function isStaff(): boolean {
  const raw = localStorage.getItem('user');
  if (!raw) return false;
  try {
    return JSON.parse(raw).is_staff === true;
  } catch {
    return false;
  }
}

function getTenantUlid(): string | null {
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    const u = JSON.parse(raw);
    return typeof u.tenant === 'string' && u.tenant ? u.tenant : null;
  } catch {
    return null;
  }
}

export const useStoreCatalog = defineStore('storeCatalog', () => {
  const categories = ref<CatalogNode[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const rootCount = computed(() => categories.value.length);

  /**
   * Construye la URL y cabeceras según la matriz de autenticación.
   */
  function buildRequest(): { url: string; headers: Record<string, string> } {
    const token = getToken();
    const headers: Record<string, string> = { Accept: 'application/json' };

    if (!token) {
      // ▸ Público anónimo — sin auth, sin parámetros
      return { url: API_BASE, headers };
    }

    // Autenticado → inyectar JWT
    headers['Authorization'] = `Bearer ${token}`;

    if (isStaff()) {
      // ▸ Staff / Admin — sin parámetros
      return { url: API_BASE, headers };
    }

    // ▸ Cliente / Tienda — concatenar tennant_id
    const tid = getTenantUlid();
    if (tid) {
      return { url: `${API_BASE}/?tennant_id=${encodeURIComponent(tid)}`, headers };
    }

    // Fallback: autenticado pero sin tenant ULID → endpoint base
    return { url: API_BASE, headers };
  }

  /** Normaliza la respuesta: extrae `results` o acepta array plano. */
  function normalizeResponse(body: unknown): CatalogNode[] {
    if (body && typeof body === 'object' && 'results' in body) {
      const r = (body as Record<string, unknown>).results;
      if (Array.isArray(r)) return r as CatalogNode[];
    }
    if (Array.isArray(body)) return body as CatalogNode[];
    return [];
  }

  async function fetchCatalog(): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      const { url, headers } = buildRequest();
      const res = await fetch(url, { headers });

      if (!res.ok) {
        if (res.status === 400) throw new Error('tennant_id requerido');
        if (res.status === 404) throw new Error('Comercio no encontrado');
        throw new Error(`Error HTTP ${res.status}`);
      }

      const body = await res.json();
      categories.value = normalizeResponse(body);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar catálogo';
      categories.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  function reset(): void {
    categories.value = [];
    isLoading.value = false;
    error.value = null;
  }

  return { categories, isLoading, error, rootCount, fetchCatalog, reset };
});
