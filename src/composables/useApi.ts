import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ref } from 'vue';
import Swal from 'sweetalert2';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  // No Content-Type header - let axios detect it automatically
  // FormData will use multipart/form-data, JSON will use application/json
  withCredentials: true,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    console.log('🔑 Token exists:', !!token);
    console.log('🔑 Request URL:', config.url);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Authorization header set');
    } else {
      console.log('❌ No token found or no headers');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Guards against stacking one alert+redirect per concurrent failed request —
// only the first 401-with-failed-refresh triggers the explanation + redirect.
let sessionEndHandled = false;

/**
 * Replaces the old silent `window.location.href = '/es/login'` kick: the user
 * must be told the session ended and why (expired/invalidated server-side —
 * the "otro motivo" case, distinct from the proactive inactivity warning in
 * useIdleTimeout.ts) before losing whatever they were doing.
 */
function endSessionWithNotice(reason: 'no_refresh_token' | 'refresh_failed') {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  if (window.location.pathname.startsWith('/es/login') || sessionEndHandled) return;
  sessionEndHandled = true;

  Swal.fire({
    icon: 'warning',
    title: 'Tu sesión ha finalizado',
    text: reason === 'no_refresh_token'
      ? 'Tu sesión expiró. Por favor, inicia sesión nuevamente.'
      : 'Tu sesión fue cerrada o expiró en el servidor. Por favor, inicia sesión nuevamente.',
    confirmButtonText: 'Iniciar sesión',
    confirmButtonColor: '#3b82f6',
    allowOutsideClick: false,
    allowEscapeKey: false,
  }).then(() => {
    window.location.href = '/es/login';
  });
}

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle 401 - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          const response = await axios.post('/api/v1/auth/refresh/', {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access}`;
          }
          return apiClient(originalRequest);
        } catch (refreshError) {
          endSessionWithNotice('refresh_failed');
          return Promise.reject(refreshError);
        }
      } else {
        endSessionWithNotice('no_refresh_token');
      }
    }

    return Promise.reject(error);
  }
);

export interface UseApiReturn {
  fetchApi: <T>(url: string, options?: AxiosRequestConfig) => Promise<T>;
  isLoading: typeof ref<boolean>;
}

// Export fetchApi as a standalone function
export const fetchApi = async <T>(url: string, options: AxiosRequestConfig = {}): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await apiClient({
      url,
      ...options,
    });
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      const message = axiosError.response?.data?.message 
        || axiosError.response?.data?.error 
        || axiosError.message 
        || 'An error occurred';
      
      const customError = new Error(message);
      (customError as any).status = axiosError.response?.status;
      (customError as any).data = axiosError.response?.data;
      throw customError;
    }
    throw error;
  }
};

export function useApi() {
  const isLoading = ref(false);

  const internalFetchApi = async <T>(url: string, options: AxiosRequestConfig = {}): Promise<T> => {
    isLoading.value = true;
    
    try {
      return await fetchApi<T>(url, options);
    } finally {
      isLoading.value = false;
    }
  };

  return {
    fetchApi: internalFetchApi,
    isLoading,
    apiClient,
  };
}

export { apiClient };
