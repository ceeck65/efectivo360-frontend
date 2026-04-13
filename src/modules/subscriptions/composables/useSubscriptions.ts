/**
 * @fileoverview Composable principal del módulo Subscriptions
 * @module @modules/subscriptions/composables/useSubscriptions
 * 
 * Lógica de gestión de planes, suscripciones y pagos.
 * Integración con Efi AI para explicación y recomendación de planes.
 */

import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { toast } from 'vue3-toastify';
import { useSubscriptionsStore } from '../stores/subscriptionsStore';
import * as subscriptionsService from '../services/subscriptions.service';
import type {
  Plan,
  BillingCycle,
  PaymentFilters,
  PlanRecommendation,
  SubscriptionPayment,
} from '../types';

// =============================================================================
// MAIN COMPOSABLE
// =============================================================================

export function useSubscriptions() {
  const store = useSubscriptionsStore();
  const {
    plans,
    subscription,
    subscriptionSummary,
    payments,
    isLoading,
    isLoadingPlans,
    isProcessing,
    selectedPlanId,
    selectedBillingCycle,
  } = storeToRefs(store);

  // Local state
  const comparisonPlanIds = ref<string[]>([]);
  const explanationLoading = ref(false);
  const planExplanation = ref<string | null>(null);

  // Getters
  const currentPlan = computed(() => {
    if (!subscription.value) return null;
    return store.getPlanById(subscription.value.planId);
  });

  const upgradeOptions = computed(() => {
    if (!currentPlan.value) return store.availablePlans;
    
    const currentOrder = currentPlan.value.sortOrder;
    return store.availablePlans.filter((p: Plan) => p.sortOrder > currentOrder);
  });

  const downgradeOptions = computed(() => {
    if (!currentPlan.value) return [];
    
    const currentOrder = currentPlan.value.sortOrder;
    return store.availablePlans.filter((p: Plan) => p.sortOrder < currentOrder);
  });

  const comparisonPlans = computed(() => 
    comparisonPlanIds.value.map(id => store.getPlanById(id)).filter(Boolean) as Plan[]
  );

  const annualSavings = computed(() => {
    if (!store.selectedPlan) return 0;
    const monthly = store.selectedPlan.pricing.monthly || 0;
    const yearly = store.selectedPlan.pricing.yearly || 0;
    return (monthly * 12) - yearly;
  });

  // =============================================================================
  // PLANS
  // =============================================================================

  /**
   * Cargar planes disponibles
   */
  async function loadPlans(): Promise<void> {
    await store.loadPlans();
  }

  /**
   * Seleccionar plan y ciclo
   */
  function selectPlan(planId: string, cycle: BillingCycle = 'monthly'): void {
    store.selectPlan(planId, cycle);
  }

  /**
   * Comparar planes específicos
   */
  async function comparePlans(planIds: string[]): Promise<void> {
    comparisonPlanIds.value = planIds;
    await store.comparePlans(planIds);
  }

  /**
   * Agregar/quitar plan de comparación
   */
  function togglePlanComparison(planId: string): void {
    const index = comparisonPlanIds.value.indexOf(planId);
    if (index === -1) {
      if (comparisonPlanIds.value.length < 3) {
        comparisonPlanIds.value.push(planId);
      } else {
        toast.warning('Máximo 3 planes para comparar');
      }
    } else {
      comparisonPlanIds.value.splice(index, 1);
    }
  }

  // =============================================================================
  // SUBSCRIPTION
  // =============================================================================

  /**
   * Cargar suscripción actual
   */
  async function loadSubscription(): Promise<void> {
    await store.loadCurrentSubscription();
  }

  /**
   * Suscribirse al plan seleccionado
   */
  async function subscribe(): Promise<boolean> {
    return await store.subscribe();
  }

  /**
   * Cambiar a otro plan
   */
  async function changePlan(newPlanId: string, immediate: boolean = false): Promise<boolean> {
    return await store.changePlan(newPlanId, immediate ? 'immediate' : 'next_cycle');
  }

  /**
   * Cancelar suscripción
   */
  async function cancelSubscription(reason?: string): Promise<boolean> {
    return await store.cancel(reason);
  }

  /**
   * Reactivar suscripción
   */
  async function reactivateSubscription(): Promise<boolean> {
    return await store.reactivate();
  }

  // =============================================================================
  // EFI AI INTEGRATION
  // =============================================================================

  /**
   * Obtener explicación de planes por Efi
   */
  async function explainPlansWithEfi(
    format: 'detailed' | 'summary' | 'comparison' = 'detailed'
  ): Promise<string | null> {
    explanationLoading.value = true;

    try {
      const result = await subscriptionsService.explainPlansWithEfi({
        currentPlanId: subscription.value?.planId,
        format,
      });

      if (result) {
        planExplanation.value = result.explanation;
        
        // Si Efi recomienda un plan, seleccionarlo automáticamente
        if (result.recommendedPlanId) {
          store.selectPlan(result.recommendedPlanId, selectedBillingCycle.value);
        }
        
        return result.explanation;
      }
    } catch {
      toast.error('Error consultando a Efi');
    } finally {
      explanationLoading.value = false;
    }

    return null;
  }

  /**
   * Obtener recomendación personalizada de plan
   */
  async function getPlanRecommendation(
    answers: Record<string, string | number>
  ): Promise<PlanRecommendation | null> {
    try {
      const recommendation = await subscriptionsService.getPlanRecommendation(answers);
      
      if (recommendation) {
        // Auto-seleccionar plan recomendado
        store.selectPlan(recommendation.recommendedPlanId, selectedBillingCycle.value);
        
        toast.success(`Efi recomienda: ${store.getPlanById(recommendation.recommendedPlanId)?.name || 'un plan personalizado'}`);
        return recommendation;
      }
    } catch {
      toast.error('Error obteniendo recomendación');
    }

    return null;
  }

  /**
   * Comparar planes para chat con Efi
   * Retorna formato simplificado para enviar al chat
   */
  async function getPlanComparisonForEfi(): Promise<Array<{
    id: string;
    name: string;
    price: number;
    keyFeatures: string[];
    pros: string[];
    cons: string[];
  }>> {
    const ids = comparisonPlanIds.value.length > 0 
      ? comparisonPlanIds.value 
      : store.availablePlans.slice(0, 3).map((p: Plan) => p.id);
    
    try {
      return await subscriptionsService.comparePlansForEfi(ids);
    } catch {
      return [];
    }
  }

  /**
   * Enviar mensaje a Efi sobre planes
   */
  async function askEfiAboutPlans(question: string): Promise<void> {
    // Obtener contexto actual
    const comparison = await getPlanComparisonForEfi();
    
    // Construir mensaje enriquecido y enviar al módulo assistant
    const { useAssistantStore } = await import('@modules/assistant');
    const assistantStore = useAssistantStore();
    
    assistantStore.setContext({
      module: 'dashboard', // Usar dashboard como módulo genérico para subscriptions
      action: 'plan_inquiry',
      data: {
        question,
        comparison,
        currentPlanId: subscription.value?.planId,
      },
      timestamp: new Date().toISOString(),
    });

    // Abrir chat
    assistantStore.openChat();
  }

  // =============================================================================
  // PAYMENTS
  // =============================================================================

  /**
   * Cargar historial de pagos
   */
  async function loadPaymentHistory(filters?: PaymentFilters): Promise<void> {
    await store.loadPayments(filters);
  }

  /**
   * Descargar factura
   */
  function downloadInvoice(paymentId: string): void {
    const payment = payments.value.find((p: SubscriptionPayment) => p.id === paymentId);
    if (payment) {
      store.downloadInvoicePdf(payment.id);
    }
  }

  /**
   * Reintentar pago fallido
   */
  async function retryFailedPayment(paymentId: string): Promise<boolean> {
    return await store.retryPayment(paymentId);
  }

  // =============================================================================
  // BILLING CYCLE
  // =============================================================================

  /**
   * Cambiar ciclo de facturación
   */
  function changeBillingCycle(cycle: BillingCycle): void {
    store.setBillingCycle(cycle);
    
    if (annualSavings.value > 0) {
      toast.info(`Ahorras $${annualSavings.value}/año con facturación anual`);
    }
  }

  // =============================================================================
  // RETURN
  // =============================================================================

  return {
    // State
    plans,
    subscription,
    subscriptionSummary,
    payments,
    isLoading,
    isLoadingPlans,
    isProcessing,
    selectedPlanId,
    selectedBillingCycle,
    comparisonPlanIds,
    explanationLoading,
    planExplanation,
    
    // Getters
    currentPlan,
    upgradeOptions,
    downgradeOptions,
    comparisonPlans,
    annualSavings,
    trialDaysLeft: computed(() => store.trialDaysLeft),
    isInTrial: computed(() => store.isInTrial),
    isExpiringSoon: computed(() => store.isExpiringSoon),
    
    // Plans
    loadPlans,
    selectPlan,
    comparePlans,
    togglePlanComparison,
    
    // Subscription
    loadSubscription,
    subscribe,
    changePlan,
    cancelSubscription,
    reactivateSubscription,
    
    // Efi AI
    explainPlansWithEfi,
    getPlanRecommendation,
    getPlanComparisonForEfi,
    askEfiAboutPlans,
    
    // Payments
    loadPaymentHistory,
    downloadInvoice,
    retryFailedPayment,
    
    // Billing
    changeBillingCycle,
  };
}

// =============================================================================
// UTILITY COMPOSABLES
// =============================================================================

/**
 * Composable simplificado para upgrade rápido
 */
export function usePlanUpgrade() {
  const store = useSubscriptionsStore();
  const { currentPlan } = useSubscriptions();

  /**
   * Opciones de upgrade disponibles
   */
  const upgradeOptions = computed(() => {
    if (!currentPlan.value) return store.availablePlans;
    
    const currentOrder = currentPlan.value.sortOrder;
    return store.availablePlans.filter((p: Plan) => p.sortOrder > currentOrder);
  });

  /**
   * Obtener mejor opción de upgrade
   */
  const bestUpgradeOption = computed(() => {
    if (upgradeOptions.value.length === 0) return null;
    return upgradeOptions.value[0];
  });

  /**
   * Verificar si necesita upgrade
   */
  const needsUpgrade = computed(() => {
    // Lógica basada en límites del plan actual
    // TODO: Integrar con datos reales de uso
    return false;
  });

  async function upgrade(): Promise<boolean> {
    if (!bestUpgradeOption.value) return false;
    
    const planId = bestUpgradeOption.value.id;
    store.selectPlan(planId, 'monthly');
    return await store.changePlan(planId, 'next_cycle');
  }

  return {
    currentPlan,
    bestUpgradeOption,
    needsUpgrade,
    upgrade,
  };
}

/**
 * Composable para wizard de onboarding
 */
export function useSubscriptionWizard() {
  const store = useSubscriptionsStore();

  const wizardStep = ref<'select_plan' | 'select_cycle' | 'payment' | 'confirmation'>('select_plan');
  const answers = ref<Record<string, string | number>>({});

  async function answerQuestion(questionId: string, value: string | number): Promise<void> {
    answers.value[questionId] = value;
    
    // Si tenemos suficientes respuestas, obtener recomendación
    if (Object.keys(answers.value).length >= 3) {
      const { getPlanRecommendation } = useSubscriptions();
      await getPlanRecommendation(answers.value);
    }
  }

  function nextStep(): void {
    const steps: Array<'select_plan' | 'select_cycle' | 'payment' | 'confirmation'> = [
      'select_plan', 'select_cycle', 'payment', 'confirmation'
    ];
    const currentIndex = steps.indexOf(wizardStep.value);
    if (currentIndex < steps.length - 1) {
      wizardStep.value = steps[currentIndex + 1];
    }
  }

  function prevStep(): void {
    const steps: Array<'select_plan' | 'select_cycle' | 'payment' | 'confirmation'> = [
      'select_plan', 'select_cycle', 'payment', 'confirmation'
    ];
    const currentIndex = steps.indexOf(wizardStep.value);
    if (currentIndex > 0) {
      wizardStep.value = steps[currentIndex - 1];
    }
  }

  return {
    wizardStep,
    answers,
    recommendedPlan: computed(() => store.selectedPlan),
    answerQuestion,
    nextStep,
    prevStep,
  };
}
