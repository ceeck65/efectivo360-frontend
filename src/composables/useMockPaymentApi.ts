import { ref } from 'vue';
import type {
  PaymentMethodTemplate,
  SaasPaymentMethod,
  TenantPaymentMethod,
  TenantSaasPaymentMethodView,
  PublicPaymentMethodView,
} from '@/types';

// Mock data store - persists in memory during session
const mockTemplates = ref<PaymentMethodTemplate[]>([
  {
    id: 1,
    name: 'Zelle',
    slug: 'zelle',
    logo_url: '',
    brand_color: '#6B1CB5',
    default_currency: 'USD',
    category: 'transfer',
    category_display: 'Transferencia',
    payment_type: 'immediate',
    payment_type_display: 'Inmediato',
    description: 'Transferencias instantáneas entre bancos en USA',
    sort_order: 1,
    is_active: true,
    required_metadata: JSON.stringify([
      { name: 'email', label: 'Correo electrónico', type: 'email', required: true },
      { name: 'phone', label: 'Teléfono', type: 'tel', required: false },
    ]),
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Binance Pay',
    slug: 'binance-pay',
    logo_url: '',
    brand_color: '#FCD535',
    default_currency: 'USD',
    category: 'crypto',
    category_display: 'Cripto',
    payment_type: 'immediate',
    payment_type_display: 'Inmediato',
    description: 'Pagos con criptomonedas vía Binance',
    sort_order: 2,
    is_active: true,
    required_metadata: JSON.stringify([
      { name: 'wallet_address', label: 'Dirección de wallet', type: 'text', required: true },
      { name: 'network', label: 'Red', type: 'select', required: true, options: ['TRC20', 'ERC20', 'BEP20'] },
    ]),
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 3,
    name: 'Pago Móvil',
    slug: 'pago-movil',
    logo_url: '',
    brand_color: '#0055A4',
    default_currency: 'VES',
    category: 'bank_transfer',
    category_display: 'Transferencia Bancaria',
    payment_type: 'immediate',
    payment_type_display: 'Inmediato',
    description: 'Transferencias bancarias en Venezuela',
    sort_order: 3,
    is_active: true,
    required_metadata: JSON.stringify([
      { name: 'phone', label: 'Teléfono', type: 'tel', required: true },
      { name: 'bank', label: 'Banco', type: 'text', required: true },
      { name: 'id_number', label: 'Cédula', type: 'text', required: true },
    ]),
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
]);

const mockSaasMethods = ref<SaasPaymentMethod[]>([
  {
    id: 1,
    template_id: 1,
    template: mockTemplates.value[0],
    display_name: 'Zelle Efectivo 360',
    staff_account_data: { email: 'pagos@efectivo360.com', phone: '+1-555-0100' },
    display_instructions: 'Envía tu pago a pagos@efectivo360.com e indica tu tenant ID',
    is_active: true,
    sort_order: 1,
    available_for_all_tenants: true,
    requires_verification: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    template_id: 2,
    template: mockTemplates.value[1],
    display_name: 'Binance Pay Efectivo 360',
    staff_account_data: { wallet_address: '0x1234567890abcdef', network: 'BEP20' },
    display_instructions: 'Envía USDT a la dirección indicada usando red BEP20',
    is_active: true,
    sort_order: 2,
    available_for_all_tenants: true,
    requires_verification: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
]);

const mockTenantMethods = ref<TenantPaymentMethod[]>([]);

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useMockPaymentApi() {
  const getTemplates = async () => {
    await delay(300);
    return { items: [...mockTemplates.value] };
  };

  const createTemplate = async (formData: FormData) => {
    await delay(500);
    const newTemplate: PaymentMethodTemplate = {
      id: Date.now(),
      name: formData.get('name') as string,
      slug: formData.get('slug') as string,
      logo_url: '',
      brand_color: formData.get('brand_color') as string,
      default_currency: (formData.get('default_currency') as 'USD' | 'VES') || 'USD',
      category: formData.get('category') as string,
      category_display: formData.get('category_display') as string,
      payment_type: formData.get('payment_type') as string,
      payment_type_display: formData.get('payment_type_display') as string,
      description: formData.get('description') as string,
      sort_order: parseInt(formData.get('sort_order') as string) || 0,
      is_active: formData.get('is_active') === 'true',
      required_metadata: formData.get('required_metadata') as string,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockTemplates.value.push(newTemplate);
    return { data: newTemplate };
  };

  const updateTemplate = async (id: number, formData: FormData) => {
    await delay(500);
    const index = mockTemplates.value.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Template not found');
    mockTemplates.value[index] = {
      ...mockTemplates.value[index],
      name: formData.get('name') as string,
      slug: formData.get('slug') as string,
      brand_color: formData.get('brand_color') as string,
      default_currency: (formData.get('default_currency') as 'USD' | 'VES') || 'USD',
      category: formData.get('category') as string,
      category_display: formData.get('category_display') as string,
      payment_type: formData.get('payment_type') as string,
      payment_type_display: formData.get('payment_type_display') as string,
      description: formData.get('description') as string,
      sort_order: parseInt(formData.get('sort_order') as string) || 0,
      is_active: formData.get('is_active') === 'true',
      required_metadata: formData.get('required_metadata') as string,
      updated_at: new Date().toISOString(),
    };
    return { data: mockTemplates.value[index] };
  };

  const deleteTemplate = async (id: number) => {
    await delay(300);
    mockTemplates.value = mockTemplates.value.filter(t => t.id !== id);
  };

  const getTenantSaasMethods = async (): Promise<{ items: TenantSaasPaymentMethodView[] }> => {
    await delay(300);
    const filtered: TenantSaasPaymentMethodView[] = mockSaasMethods.value
      .filter(m => m.is_active)
      .map(m => ({
        id: m.id,
        template: m.template,
        display_name: m.display_name,
        display_instructions: m.display_instructions,
        is_active: m.is_active,
        sort_order: m.sort_order,
        requires_verification: m.requires_verification,
      }));
    return { items: filtered };
  };

  const getTenantMethods = async () => {
    await delay(300);
    return { items: [...mockTenantMethods.value] };
  };

  const createTenantMethod = async (data: any) => {
    await delay(500);
    const template = mockTemplates.value.find(t => t.id === data.template_id);
    const newMethod: TenantPaymentMethod = {
      id: Date.now(),
      tenant_id: 1,
      template_id: data.template_id,
      template: template || mockTemplates.value[0],
      display_name: data.display_name,
      account_data: data.account_data,
      display_instructions: data.display_instructions,
      is_active: data.is_active ?? true,
      sort_order: data.sort_order || 0,
      requires_confirmation: data.requires_confirmation ?? false,
      confirmation_time_minutes: data.confirmation_time_minutes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockTenantMethods.value.push(newMethod);
    return { data: newMethod };
  };

  const updateTenantMethod = async (id: number, data: any) => {
    await delay(500);
    const index = mockTenantMethods.value.findIndex(m => m.id === id);
    if (index === -1) throw new Error('Method not found');
    mockTenantMethods.value[index] = {
      ...mockTenantMethods.value[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return { data: mockTenantMethods.value[index] };
  };

  const deleteTenantMethod = async (id: number) => {
    await delay(300);
    mockTenantMethods.value = mockTenantMethods.value.filter(m => m.id !== id);
  };

  const getPublicMethods = async (_tenantSlug: string): Promise<{ items: PublicPaymentMethodView[] }> => {
    await delay(300);
    const publicViews: PublicPaymentMethodView[] = mockTenantMethods.value
      .filter(m => m.is_active)
      .map(m => ({
        id: m.id,
        display_name: m.display_name,
        display_instructions: m.display_instructions,
        template: m.template,
        minimum_amount: m.minimum_amount,
        maximum_amount: m.maximum_amount,
        requires_confirmation: m.requires_confirmation,
      }));
    return { items: publicViews };
  };

  return {
    getTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getTenantSaasMethods,
    getTenantMethods,
    createTenantMethod,
    updateTenantMethod,
    deleteTenantMethod,
    getPublicMethods,
  };
}
