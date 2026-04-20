import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useApi } from '@/composables/useApi';

interface ForexRateResponse {
  rate: number;
  currency: string;
  source: string;
  status: 'ok' | 'degraded';
  updated_at: string;
  last_success_at: string;
}

export function useForexRate() {
  const { apiClient } = useApi();
  
  // State
  const forexRate = ref<ForexRateResponse | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const lastFetch = ref<Date | null>(null);
  
  // Auto-refresh interval
  let refreshInterval: NodeJS.Timeout | null = null;
  
  // Computed
  const isRateAvailable = computed(() => forexRate.value !== null);
  const rateStatus = computed(() => forexRate.value?.status || 'unknown');
  const rateValue = computed(() => forexRate.value?.rate || 0);
  const lastUpdated = computed(() => {
    if (!forexRate.value?.updated_at) return null;
    return new Date(forexRate.value.updated_at);
  });
  
  // Methods
  const fetchForexRate = async () => {
    if (isLoading.value) return;
    
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await apiClient.get('/api/v1/forex/rate/');
      forexRate.value = response.data;
      lastFetch.value = new Date();
      
      // Log successful fetch
      console.log('Forex rate updated:', {
        rate: forexRate.value?.rate,
        status: forexRate.value?.status,
        source: forexRate.value?.source,
        updated_at: forexRate.value?.updated_at
      });
      
    } catch (err) {
      console.error('Failed to fetch forex rate:', err);
      error.value = err instanceof Error ? err.message : 'Failed to fetch exchange rate';
      
      // Don't immediately clear the rate - keep showing the last known rate
      // but mark it as potentially stale
      if (forexRate.value) {
        forexRate.value.status = 'degraded';
      } else {
        // Set a default fallback rate if no data exists
        forexRate.value = {
          rate: 0,
          currency: 'VES',
          source: 'FALLBACK',
          status: 'degraded',
          updated_at: new Date().toISOString(),
          last_success_at: new Date().toISOString()
        };
      }
    } finally {
      isLoading.value = false;
    }
  };
  
  const startAutoRefresh = (intervalMs: number = 5 * 60 * 1000) => { // 5 minutes
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    
    refreshInterval = setInterval(() => {
      fetchForexRate();
    }, intervalMs);
  };
  
  const stopAutoRefresh = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  };
  
  const refreshNow = () => {
    fetchForexRate();
  };
  
  // Lifecycle
  onMounted(() => {
    // Initial fetch only - no auto-refresh (per regla de oro)
    fetchForexRate();
  });
  
  onUnmounted(() => {
    stopAutoRefresh();
  });
  
  return {
    // State
    forexRate: computed(() => forexRate.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    lastFetch: computed(() => lastFetch.value),
    
    // Computed
    isRateAvailable,
    rateStatus,
    rateValue,
    lastUpdated,
    
    // Methods
    fetchForexRate,
    startAutoRefresh,
    stopAutoRefresh,
    refreshNow,
  };
}
