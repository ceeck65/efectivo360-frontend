import { ref, computed } from 'vue';
import { useApi } from './useApi';
import type {
  PaymentMethodTemplate,
  ApiResponse,
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * @deprecated Este archivo está marcado para eliminación.
 * Usar el nuevo módulo HMVC: import { useStaffPayments } from '@modules/payments'
 * 
 * COMPOSABLE LEGACY: useStaffPaymentTemplates
 * 
 * Responsabilidad: Gestión del catálogo GLOBAL de plantillas de métodos de pago
 * Solo usuarios con rol STAFF pueden acceder a este composable
 * 
 * Esto es el "Catálogo Maestro" - Define las marcas disponibles: Zelle, Binance, PagoMóvil, etc.
 * 
 * TODO: Eliminar este archivo después de migrar todas las referencias al nuevo módulo.
 */
export function useStaffPaymentTemplates() {
  const { fetchApi } = useApi();

  // State
  const templates = ref<PaymentMethodTemplate[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const activeTemplates = computed(() => 
    templates.value.filter(t => t.is_active).sort((a, b) => a.sort_order - b.sort_order)
  );

  const templatesByCategory = computed(() => {
    const grouped: Record<string, PaymentMethodTemplate[]> = {};
    templates.value.forEach(template => {
      const categorySlug = template.category?.slug || 'otros';
      if (!grouped[categorySlug]) {
        grouped[categorySlug] = [];
      }
      grouped[categorySlug].push(template);
    });
    return grouped;
  });

  // Actions
  const loadTemplates = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await fetchApi<{count: number, next: string | null, previous: string | null, results: PaymentMethodTemplate[]}>(
        '/api/staff/payment-templates/'
      );
      templates.value = response.results || [];
    } catch (err: any) {
      error.value = err?.message || 'Error cargando plantillas';
      if (err?.status === 403) {
        error.value = 'Acceso denegado. Solo Staff puede gestionar plantillas globales.';
      }
    } finally {
      isLoading.value = false;
    }
  };

  const createTemplate = async (formData: FormData): Promise<PaymentMethodTemplate> => {
    const response = await fetchApi<ApiResponse<PaymentMethodTemplate>>(
      '/api/staff/payment-templates/',
      {
        method: 'POST',
        data: formData,
        headers: {},
      }
    );
    return response.data;
  };

  const updateTemplate = async (
    id: number,
    formData: FormData
  ): Promise<PaymentMethodTemplate> => {
    const response = await fetchApi<ApiResponse<PaymentMethodTemplate>>(
      `/api/staff/payment-templates/${id}/`,
      {
        method: 'PUT',
        data: formData,
        headers: {},
      }
    );
    return response.data;
  };

  const deleteTemplate = async (id: number): Promise<void> => {
    await fetchApi(`/api/staff/payment-templates/${id}/`, {
      method: 'DELETE',
    });
    templates.value = templates.value.filter(t => t.id !== id);
  };

  const toggleTemplateStatus = async (id: number, isActive: boolean): Promise<void> => {
    await fetchApi(`/api/staff/payment-templates/${id}/toggle/`, {
      method: 'POST',
      data: { is_active: isActive },
    });
    const template = templates.value.find(t => t.id === id);
    if (template) {
      template.is_active = isActive;
    }
  };

  return {
    // State
    templates,
    isLoading,
    error,
    // Config
    apiBaseUrl: API_BASE_URL,
    // Getters
    activeTemplates,
    templatesByCategory,
    // Actions
    loadTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    toggleTemplateStatus,
  };
}
