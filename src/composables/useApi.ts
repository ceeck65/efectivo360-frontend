import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ref } from 'vue';

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
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

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
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          // Use full path to avoid additional redirects
          if (!window.location.pathname.startsWith('/es/login')) {
            window.location.href = '/es/login';
          }
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, clear auth and redirect
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        if (!window.location.pathname.startsWith('/es/login')) {
          window.location.href = '/es/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export interface UseApiReturn {
  fetchApi: <T>(url: string, options?: AxiosRequestConfig) => Promise<T>;
  isLoading: typeof ref<boolean>;
}

export function useApi() {
  const isLoading = ref(false);

  const fetchApi = async <T>(url: string, options: AxiosRequestConfig = {}): Promise<T> => {
    isLoading.value = true;
    
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
    } finally {
      isLoading.value = false;
    }
  };

  return {
    fetchApi,
    isLoading,
    apiClient,
  };
}

export { apiClient };
