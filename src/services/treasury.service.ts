import { httpClient } from '@core/index.js';

export interface PaymentMethodGavetero {
  id: string;
  name: string;
  currency: string;
}

export interface PaymentMethod {
  id: string;
  code: string;
  name: string;
  is_enabled: boolean;
  label: string;
  gavetero: PaymentMethodGavetero | null;
  currency?: string;
}

export interface PaymentMethodsResponse {
  payment_methods: PaymentMethod[];
  is_platform: boolean;
}

export async function fetchPaymentMethods(isActive = true): Promise<PaymentMethod[]> {
  const response = await httpClient.get('/api/v1/treasury/payment-methods/', {
    params: { is_active: isActive ? 'true' : undefined },
  });

  const body = response.data?.data ?? response.data;

  // DRF paginated: { results: [...] }
  if (body?.results && Array.isArray(body.results)) {
    return body.results;
  }

  // Wrapped: { payment_methods: [...] }
  if (body?.payment_methods && Array.isArray(body.payment_methods)) {
    return body.payment_methods;
  }

  // Plain array
  if (Array.isArray(body)) {
    return body;
  }

  return [];
}
