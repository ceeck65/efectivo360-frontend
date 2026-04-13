import { ref, computed } from 'vue';
import { useApi } from './useApi';
import { useMockPaymentApi } from './useMockPaymentApi';
import type {
  SaasPaymentMethod,
  TenantSaasPaymentMethodView,
  SaasPaymentMethodFormData,
  ApiListResponse,
  ApiResponse,
} from '@/types';

/**
 * @deprecated Este archivo está marcado para eliminación.
 * Usar el nuevo módulo HMVC: import { useStaffPayments } from '@modules/payments'
 * 
 * COMPOSABLE LEGACY: useSaasPaymentMethods (STAFF)
 * 
 * Responsabilidad: Gestión de los métodos de pago del SaaS para cobrar suscripciones
 * Solo STAFF puede crear/editar estos métodos (son las cuentas bancarias de Efectivo 360)
 * 
 * Estos son los métodos que los Tenants usan para pagar su suscripción a Efectivo 360.
 * 
 * TODO: Eliminar este archivo después de migrar todas las referencias al nuevo módulo.
 */
export function useSaasPaymentMethods() {
  const { fetchApi } = useApi();
  const mockApi = useMockPaymentApi();
  const useMock = ref(false);

  const saasMethods = ref<SaasPaymentMethod[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const activeMethods = computed(() =>
    saasMethods.value.filter(m => m.is_active).sort((a, b) => a.sort_order - b.sort_order)
  );

  const methodsByTemplate = computed(() => {
    const grouped: Record<number, SaasPaymentMethod[]> = {};
    saasMethods.value.forEach(method => {
      const templateId = method.template_id;
      if (!grouped[templateId]) {
        grouped[templateId] = [];
      }
      grouped[templateId].push(method);
    });
    return grouped;
  });

  const loadSaasMethods = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      if (useMock.value) {
        // Mock SaaS methods - currently empty as they're configured separately
        saasMethods.value = [];
      } else {
        const response = await fetchApi<ApiListResponse<SaasPaymentMethod>>(
          '/api/staff/saas-payment-methods/'
        );
        saasMethods.value = response.items || [];
      }
    } catch (err: any) {
      error.value = err?.message || 'Error cargando métodos de pago SaaS';
      saasMethods.value = [];
    } finally {
      isLoading.value = false;
    }
  };

  const createSaasMethod = async (
    data: SaasPaymentMethodFormData
  ): Promise<SaasPaymentMethod> => {
    const response = await fetchApi<ApiResponse<SaasPaymentMethod>>(
      '/api/staff/saas-payment-methods/',
      {
        method: 'POST',
        data,
      }
    );
    saasMethods.value.push(response.data);
    return response.data;
  };

  const updateSaasMethod = async (
    id: number,
    data: Partial<SaasPaymentMethodFormData>
  ): Promise<SaasPaymentMethod> => {
    const response = await fetchApi<ApiResponse<SaasPaymentMethod>>(
      `/api/staff/saas-payment-methods/${id}/`,
      {
        method: 'PUT',
        data,
      }
    );
    const index = saasMethods.value.findIndex(m => m.id === id);
    if (index !== -1) {
      saasMethods.value[index] = response.data;
    }
    return response.data;
  };

  const deleteSaasMethod = async (id: number): Promise<void> => {
    await fetchApi(`/api/staff/saas-payment-methods/${id}/`, {
      method: 'DELETE',
    });
    saasMethods.value = saasMethods.value.filter(m => m.id !== id);
  };

  return {
    saasMethods,
    isLoading,
    error,
    activeMethods,
    methodsByTemplate,
    loadSaasMethods,
    createSaasMethod,
    updateSaasMethod,
    deleteSaasMethod,
  };
}

/**
 * COMPOSABLE: useTenantSaasPayments (TENANT)
 * 
 * Responsabilidad: Vista del Tenant de los métodos de pago del SaaS
 * Los Tenants ven UNA VERSIÓN FILTRADA sin los datos bancarios del Staff
 * Usado en "Planes y Licencias" para que el Tenant pague su suscripción
 */
export function useTenantSaasPayments() {
  const { fetchApi } = useApi();
  const mockApi = useMockPaymentApi();
  const useMock = ref(false);

  const availableMethods = ref<TenantSaasPaymentMethodView[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const loadAvailableMethods = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      if (useMock.value) {
        const response = await mockApi.getTenantSaasMethods();
        availableMethods.value = response.items || [];
      } else {
        const response = await fetchApi<ApiListResponse<TenantSaasPaymentMethodView>>(
          '/api/tenant/saas-payment-methods/'
        );
        availableMethods.value = response.items || [];
      }
    } catch (err: any) {
      error.value = err?.message || 'Error cargando métodos de pago disponibles';
      const response = await mockApi.getTenantSaasMethods();
      availableMethods.value = response.items || [];
    } finally {
      isLoading.value = false;
    }
  };

  return {
    availableMethods,
    isLoading,
    error,
    loadAvailableMethods,
  };
}
