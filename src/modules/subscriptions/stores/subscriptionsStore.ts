/**
 * @fileoverview Store de Pinia para Subscriptions (Planes y Licencias)
 * @module @modules/subscriptions/stores/subscriptionsStore
 * 
 * Estado reactivo de planes, suscripción actual y pagos.
 */

import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { toast } from 'vue3-toastify';
import type {
  Plan,
  Subscription,
  SubscriptionSummary,
  BillingCycle,
  PaymentFilters,
  SubscribeRequest,
  SaaSStats,
} from '../types';
import * as subscriptionsService from '../services/subscriptions.service';

export const useSubscriptionsStore = defineStore('subscriptions', () => {
  // ==========================================================================
  // STATE
  // ==========================================================================

  // Planes
  const plans = ref<Plan[]>([]);
  const currentPlan = ref<Plan | null>(null);
  
  // Suscripción
  const subscription = ref<Subscription | null>(null);
  const subscriptionSummary = ref<SubscriptionSummary | null>(null);
  
  // Pagos
  const payments = ref<SubscriptionPayment[]>([]);
  const currentInvoice = ref<Invoice | null>(null);
  
  // Stats
  const stats = ref<SaaSStats | null>(null);
  
  // UI State
  const isLoading = ref(false);
  const isLoadingPlans = ref(false);
  const isProcessing = ref(false);
  const error = ref<string | null>(null);

  // Selección para cambio de plan
  const selectedPlanId = ref<string | null>(null);
  const selectedBillingCycle = ref<BillingCycle>('monthly');

  // ==========================================================================
  // GETTERS
  // ==========================================================================

  const availablePlans = computed(() => 
    plans.value.filter(p => p.isPublic && p.isActive)
  );

  const recommendedPlans = computed(() => 
    availablePlans.value.filter(p => p.category !== 'starter')
  );

  const getPlanById = computed(() => (id: string) => 
    plans.value.find(p => p.id === id) || null
  );

  const selectedPlan = computed(() => 
    selectedPlanId.value 
      ? getPlanById.value(selectedPlanId.value)
      : null
  );

  const selectedPlanPrice = computed(() => {
    if (!selectedPlan.value) return 0;
    return selectedPlan.value.pricing[selectedBillingCycle.value] || 0;
  });

  const hasActiveSubscription = computed(() => 
    subscription.value?.status === 'active' || subscription.value?.status === 'trial'
  );

  const isInTrial = computed(() => 
    subscription.value?.status === 'trial'
  );

  const trialDaysLeft = computed(() => {
    if (!subscription.value?.trialEndsAt) return 0;
    const trialEnd = new Date(subscription.value.trialEndsAt);
    const now = new Date();
    const diff = trialEnd.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  });

  const isExpiringSoon = computed(() => {
    if (!subscription.value?.endsAt) return false;
    const daysLeft = subscriptionSummary.value?.daysRemaining || 0;
    return daysLeft <= 7;
  });

  const recentPayments = computed(() => 
    payments.value.slice(0, 5)
  );

  const totalPaidThisYear = computed(() => {
    const currentYear = new Date().getFullYear();
    return payments.value
      .filter(p => p.status === 'completed' && new Date(p.paidAt || '').getFullYear() === currentYear)
      .reduce((sum, p) => sum + p.amount, 0);
  });

  // ==========================================================================
  // ACTIONS - PLANS
  // ==========================================================================

  /**
   * Cargar planes disponibles
   */
  async function loadPlans(): Promise<void> {
    isLoadingPlans.value = true;

    try {
      plans.value = await subscriptionsService.fetchPlans();
    } catch {
      toast.error('Error cargando planes');
    } finally {
      isLoadingPlans.value = false;
    }
  }

  /**
   * Cargar plan específico
   */
  async function loadPlanById(id: string): Promise<boolean> {
    try {
      const plan = await subscriptionsService.fetchPlanById(id);
      if (plan) {
        const index = plans.value.findIndex(p => p.id === id);
        if (index !== -1) {
          plans.value[index] = plan;
        } else {
          plans.value.push(plan);
        }
        return true;
      }
    } catch {
      console.error('Error cargando plan');
    }
    return false;
  }

  /**
   * Comparar planes
   */
  async function comparePlans(planIds: string[]): Promise<Plan[]> {
    try {
      return await subscriptionsService.comparePlans(planIds);
    } catch {
      return [];
    }
  }

  /**
   * Seleccionar plan
   */
  function selectPlan(planId: string, billingCycle: BillingCycle = 'monthly'): void {
    selectedPlanId.value = planId;
    selectedBillingCycle.value = billingCycle;
  }

  /**
   * Cambiar ciclo de facturación seleccionado
   */
  function setBillingCycle(cycle: BillingCycle): void {
    selectedBillingCycle.value = cycle;
  }

  // ==========================================================================
  // ACTIONS - SUBSCRIPTION
  // ==========================================================================

  /**
   * Cargar suscripción actual
   */
  async function loadCurrentSubscription(): Promise<void> {
    isLoading.value = true;

    try {
      const [sub, summary] = await Promise.all([
        subscriptionsService.fetchCurrentSubscription(),
        subscriptionsService.fetchSubscriptionSummary(),
      ]);

      subscription.value = sub;
      subscriptionSummary.value = summary;

      if (sub) {
        await loadPlanById(sub.planId);
      }
    } catch {
      console.error('Error cargando suscripción');
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Suscribirse a un plan
   */
  async function subscribe(data?: Partial<SubscribeRequest>): Promise<boolean> {
    if (!selectedPlanId.value) {
      toast.error('Selecciona un plan primero');
      return false;
    }

    isProcessing.value = true;

    try {
      const result = await subscriptionsService.subscribeToPlan({
        planId: selectedPlanId.value,
        billingCycle: selectedBillingCycle.value,
        isAutoRenew: true,
        startImmediately: true,
        ...data,
      } as SubscribeRequest);

      if (result) {
        subscription.value = result.subscription;
        toast.success('¡Suscripción creada exitosamente!');
        
        // Si hay URL de pago, redirigir
        if (result.paymentUrl) {
          window.location.href = result.paymentUrl;
        }
        
        return true;
      }
    } catch (err: any) {
      toast.error(err.message || 'Error creando suscripción');
    } finally {
      isProcessing.value = false;
    }

    return false;
  }

  /**
   * Cambiar de plan
   */
  async function changePlan(newPlanId: string, proration: 'immediate' | 'next_cycle' = 'next_cycle'): Promise<boolean> {
    isProcessing.value = true;

    try {
      const updated = await subscriptionsService.changePlan({
        newPlanId,
        billingCycle: selectedBillingCycle.value,
        prorationOption: proration,
      });

      if (updated) {
        subscription.value = updated;
        toast.success('Plan cambiado exitosamente');
        return true;
      }
    } catch (err: any) {
      toast.error(err.message || 'Error cambiando de plan');
    } finally {
      isProcessing.value = false;
    }

    return false;
  }

  /**
   * Cancelar suscripción
   */
  async function cancel(reason?: string): Promise<boolean> {
    try {
      const success = await subscriptionsService.cancelSubscription(reason);
      if (success && subscription.value) {
        subscription.value.status = 'cancelled';
        toast.success('Suscripción cancelada');
      }
      return success;
    } catch {
      toast.error('Error cancelando suscripción');
      return false;
    }
  }

  /**
   * Reactivar suscripción
   */
  async function reactivate(): Promise<boolean> {
    try {
      const success = await subscriptionsService.reactivateSubscription();
      if (success && subscription.value) {
        subscription.value.status = 'active';
        toast.success('Suscripción reactivada');
      }
      return success;
    } catch {
      toast.error('Error reactivando suscripción');
      return false;
    }
  }

  // ==========================================================================
  // ACTIONS - PAYMENTS
  // ==========================================================================

  /**
   * Cargar historial de pagos
   */
  async function loadPayments(filters?: PaymentFilters): Promise<void> {
    try {
      const response = await subscriptionsService.fetchPaymentHistory(filters);
      payments.value = response.results;
    } catch {
      console.error('Error cargando pagos');
    }
  }

  /**
   * Cargar factura
   */
  async function loadInvoice(paymentId: string): Promise<void> {
    try {
      const invoice = await subscriptionsService.fetchInvoice(paymentId);
      currentInvoice.value = invoice;
    } catch {
      currentInvoice.value = null;
    }
  }

  /**
   * Descargar PDF de factura
   */
  function downloadInvoicePdf(invoiceId: string): void {
    const url = subscriptionsService.getInvoicePdfUrl(invoiceId);
    window.open(url, '_blank');
  }

  /**
   * Reintentar pago fallido
   */
  async function retryPayment(paymentId: string): Promise<boolean> {
    try {
      const success = await subscriptionsService.retryPayment(paymentId);
      if (success) {
        await loadPayments();
        toast.success('Pago reintentado');
      }
      return success;
    } catch {
      toast.error('Error reintentando pago');
      return false;
    }
  }

  // ==========================================================================
  // ACTIONS - STATS (Staff)
  // ==========================================================================

  /**
   * Cargar estadísticas SaaS
   */
  async function loadStats(): Promise<void> {
    try {
      stats.value = await subscriptionsService.fetchSaaSStats();
    } catch {
      console.error('Error cargando estadísticas');
    }
  }

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    // State
    plans,
    currentPlan,
    subscription,
    subscriptionSummary,
    payments,
    currentInvoice,
    stats,
    isLoading,
    isLoadingPlans,
    isProcessing,
    error,
    selectedPlanId,
    selectedBillingCycle,
    
    // Getters
    availablePlans,
    recommendedPlans,
    getPlanById,
    selectedPlan,
    selectedPlanPrice,
    hasActiveSubscription,
    isInTrial,
    trialDaysLeft,
    isExpiringSoon,
    recentPayments,
    totalPaidThisYear,
    
    // Plans
    loadPlans,
    loadPlanById,
    comparePlans,
    selectPlan,
    setBillingCycle,
    
    // Subscription
    loadCurrentSubscription,
    subscribe,
    changePlan,
    cancel,
    reactivate,
    
    // Payments
    loadPayments,
    loadInvoice,
    downloadInvoicePdf,
    retryPayment,
    
    // Stats
    loadStats,
  };
});
