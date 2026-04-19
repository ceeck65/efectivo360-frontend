/**
 * @fileoverview Configuración centralizada de Axios con interceptores multi-tenant
 * @module @core/services/axios
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { useTenantStore } from '@core/stores/tenantStore';
import { ApiError } from '@core/types';

/** Configuración por defecto de Axios */
const DEFAULT_CONFIG: AxiosRequestConfig = {
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

/** Headers específicos para multi-tenancy */
const MULTITENANT_HEADERS = {
  'X-Tenant-ID': 'X-Tenant-ID',
  'X-Tenant-Slug': 'X-Tenant-Slug',
} as const;

/**
 * Crea una instancia de Axios configurada con interceptores multi-tenant
 * @returns {AxiosInstance} Instancia configurada de Axios
 */
export function createAxiosInstance(): AxiosInstance {
  const instance = axios.create(DEFAULT_CONFIG);

  // Request Interceptor - Agrega headers de tenant y auth
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
      const tenantStore = useTenantStore();
      
      // Headers de multi-tenancy
      if (tenantStore.tenantId) {
        config.headers.set(MULTITENANT_HEADERS['X-Tenant-ID'], tenantStore.tenantId);
        config.headers.set(MULTITENANT_HEADERS['X-Tenant-Slug'], tenantStore.tenantSlug);
      }

      // Token de autenticación
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.set('Authorization', `Bearer ${token}`);
      }

      // Request ID para trazabilidad
      config.headers.set('X-Request-ID', generateRequestId());

      return config;
    },
    (error: AxiosError): Promise<AxiosError> => {
      return Promise.reject(error);
    }
  );

  // Response Interceptor - Manejo de errores centralizado
  instance.interceptors.response.use(
    (response: AxiosResponse): AxiosResponse => {
      return response;
    },
    async (error: AxiosError): Promise<AxiosError | AxiosResponse> => {
      const apiError = transformAxiosError(error);
      
      // Handle 401 - Token expirado
      if (apiError.status === 401) {
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (refreshToken && !isRefreshTokenRequest(error.config)) {
          try {
            const newToken = await refreshAccessToken(refreshToken, instance);
            localStorage.setItem('access_token', newToken);
            
            // Retry original request
            if (error.config) {
              error.config.headers = error.config.headers || {};
              error.config.headers.Authorization = `Bearer ${newToken}`;
              return instance.request(error.config);
            }
          } catch (refreshError) {
            // Refresh failed - logout user
            handleAuthFailure();
            return Promise.reject(refreshError);
          }
        } else {
          handleAuthFailure();
        }
      }

      // Handle 403 - Forbidden
      if (apiError.status === 403) {
        console.warn('Access denied:', apiError.message);
      }

      // Handle 429 - Rate limiting
      if (apiError.status === 429) {
        const retryAfter = error.response?.headers['retry-after'];
        console.warn(`Rate limited. Retry after: ${retryAfter}s`);
      }

      return Promise.reject(apiError);
    }
  );

  return instance;
}

/**
 * Transforma un error de Axios a nuestro formato ApiError estándar
 * @param {AxiosError} error - Error de Axios
 * @returns {ApiError} Error estandarizado
 */
function transformAxiosError(error: AxiosError): ApiError {
  const response = error.response;
  
  if (response) {
    const data = response.data as Record<string, unknown>;
    
    return {
      status: response.status,
      message: (data?.message as string) || error.message || 'Error desconocido',
      details: (data?.details as Record<string, string[]>) || undefined,
      timestamp: new Date().toISOString(),
    };
  }

  // Error de red o timeout
  if (error.request) {
    return {
      status: 0,
      message: 'Error de conexión. Verifique su red.',
      timestamp: new Date().toISOString(),
    };
  }

  // Error en configuración
  return {
    status: -1,
    message: error.message || 'Error en la configuración de la petición',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Genera un ID único para la petición
 * @returns {string} Request ID
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Verifica si la petición actual es de refresh token
 * @param {AxiosRequestConfig | undefined} config - Config de Axios
 * @returns {boolean} True si es petición de refresh
 */
function isRefreshTokenRequest(config?: AxiosRequestConfig): boolean {
  return config?.url?.includes('/auth/refresh') ?? false;
}

/**
 * Refresca el token de acceso
 * @param {string} refreshToken - Token de refresh
 * @param {AxiosInstance} instance - Instancia de Axios
 * @returns {Promise<string>} Nuevo access token
 */
async function refreshAccessToken(refreshToken: string, instance: AxiosInstance): Promise<string> {
  const response = await instance.post('/auth/refresh/', {
    refresh: refreshToken,
  });
  return response.data.access;
}

/**
 * Maneja el fallo de autenticación
 */
function handleAuthFailure(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  
  // Redirección a login (evita redirecciones infinitas)
  if (!window.location.pathname.includes('/login')) {
    window.location.href = '/login?session=expired';
  }
}

/** Instancia global de Axios configurada */
export const httpClient = createAxiosInstance();

export default httpClient;
