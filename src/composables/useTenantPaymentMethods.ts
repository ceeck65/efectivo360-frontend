import { ref, computed } from 'vue';
import { useApi } from './useApi';
import { useMockPaymentApi } from './useMockPaymentApi';
import type {
  TenantPaymentMethod,
  PublicPaymentMethodView,
  TenantPaymentMethodFormData,
  ApiListResponse,
  ApiResponse,
} from '@/types';

/**
 * @deprecated Este archivo está marcado para eliminación.
 * Usar el nuevo módulo HMVC: import { useTenantPayments } from '@modules/payments'
 * 
 * COMPOSABLE LEGACY: useTenantPaymentMethods (TENANT)
 * 
 * Responsabilidad: Gestión de los métodos de pago que el Tenant usa para cobrar a sus clientes
 * Cada Tenant gestiona sus propias cuentas bancarias/destinatarios
 * Usado en la configuración del Tenant y en el POS para mostrar opciones de pago
 * 
 * TODO: Eliminar este archivo después de migrar todas las referencias al nuevo módulo.
 */
export function useTenantPaymentMethods() {
  const { fetchApi } = useApi();
  const mockApi = useMockPaymentApi();
  const useMock = ref(false);

  const paymentMethods = ref<TenantPaymentMethod[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const activeMethods = computed(() =>
    paymentMethods.value.filter(m => m.is_active).sort((a, b) => a.sort_order - b.sort_order)
  );

  const methodsByCategory = computed(() => {
    const grouped: Record<string, TenantPaymentMethod[]> = {};
    paymentMethods.value.forEach(method => {
      const categoryName = method.template?.category?.name || 'otros';
      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }
      grouped[categoryName].push(method);
    });
    return grouped;
  });

  const loadPaymentMethods = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      if (useMock.value) {
        const response = await mockApi.getTenantMethods();
        paymentMethods.value = response.items || [];
      } else {
        const response = await fetchApi<ApiListResponse<TenantPaymentMethod>>(
          '/api/tenant/payment-methods/'
        );
        paymentMethods.value = response.items || [];
      }
    } catch (err: any) {
      error.value = err?.message || 'Error cargando métodos de pago';
      const response = await mockApi.getTenantMethods();
      paymentMethods.value = response.items || [];
    } finally {
      isLoading.value = false;
    }
  };

  const createPaymentMethod = async (
    data: TenantPaymentMethodFormData
  ): Promise<TenantPaymentMethod> => {
    if (useMock.value) {
      const response = await mockApi.createTenantMethod(data);
      paymentMethods.value.push(response.data);
      return response.data;
    }
    const response = await fetchApi<ApiResponse<TenantPaymentMethod>>(
      '/api/tenant/payment-methods/',
      {
        method: 'POST',
        data,
      }
    );
    paymentMethods.value.push(response.data);
    return response.data;
  };

  const updatePaymentMethod = async (
    id: number,
    data: Partial<TenantPaymentMethodFormData>
  ): Promise<TenantPaymentMethod> => {
    if (useMock.value) {
      const response = await mockApi.updateTenantMethod(id, data);
      const index = paymentMethods.value.findIndex(m => m.id === id);
      if (index !== -1) {
        paymentMethods.value[index] = response.data;
      }
      return response.data;
    }
    const response = await fetchApi<ApiResponse<TenantPaymentMethod>>(
      `/api/tenant/payment-methods/${id}/`,
      {
        method: 'PUT',
        data,
      }
    );
    const index = paymentMethods.value.findIndex(m => m.id === id);
    if (index !== -1) {
      paymentMethods.value[index] = response.data;
    }
    return response.data;
  };

  const deletePaymentMethod = async (id: number): Promise<void> => {
    if (useMock.value) {
      await mockApi.deleteTenantMethod(id);
      paymentMethods.value = paymentMethods.value.filter(m => m.id !== id);
      return;
    }
    await fetchApi(`/api/tenant/payment-methods/${id}/`, {
      method: 'DELETE',
    });
    paymentMethods.value = paymentMethods.value.filter(m => m.id !== id);
  };

  const togglePaymentMethodStatus = async (id: number, isActive: boolean): Promise<void> => {
    await fetchApi(`/api/tenant/payment-methods/${id}/toggle/`, {
      method: 'POST',
      data: { is_active: isActive },
    });
    const method = paymentMethods.value.find(m => m.id === id);
    if (method) {
      method.is_active = isActive;
    }
  };

  return {
    paymentMethods,
    isLoading,
    error,
    activeMethods,
    methodsByCategory,
    loadPaymentMethods,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    togglePaymentMethodStatus,
  };
}

/**
 * COMPOSABLE: usePublicPaymentMethods (CLIENTE FINAL)
 * 
 * Responsabilidad: Vista pública de los métodos de pago de un Tenant
 * Usado en el checkout del POS - solo muestra datos necesarios para el cliente
 * NO expone datos sensibles del Tenant
 */
export function usePublicPaymentMethods() {
  const { fetchApi } = useApi();

  const publicMethods = ref<PublicPaymentMethodView[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const loadPublicMethods = async (tenantSlug: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await fetchApi<ApiListResponse<PublicPaymentMethodView>>(
        `/api/public/${tenantSlug}/payment-methods/`
      );
      publicMethods.value = response.items || [];
    } catch (err: any) {
      error.value = err?.message || 'Error cargando métodos de pago';
    } finally {
      isLoading.value = false;
    }
  };

  return {
    publicMethods,
    isLoading,
    error,
    loadPublicMethods,
  };
}
