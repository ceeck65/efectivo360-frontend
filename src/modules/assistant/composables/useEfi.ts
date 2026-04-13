/**
 * @fileoverview Composable principal del módulo Assistant (Efi)
 * @module @modules/assistant/composables/useEfi
 * 
 * Lógica de envío de mensajes, manejo de prompts dinámicos según contexto
 * del usuario y estados de respuesta.
 * 
 * Soporta contexto inteligente desde otros módulos.
 */

import { ref, computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { toast } from 'vue3-toastify';
// UUID generation helper (avoids external dependency)
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
import { useAssistantStore } from '../stores/assistantStore';
import * as assistantService from '../services/assistant.service';
import type {
  Message,
  ModuleContext,
  ContextModule,
  AIPayload,
  PromptSuggestion,
} from '../types';

// =============================================================================
// MAIN COMPOSABLE
// =============================================================================

export function useEfi() {
  const store = useAssistantStore();
  const {
    currentSession,
    messages,
    isOpen,
    isLoading,
    isTyping,
    error,
    activeContext,
  } = storeToRefs(store);

  // Input state
  const inputMessage = ref('');
  const suggestions = ref<PromptSuggestion[]>([]);

  // Streaming state
  const streamingContent = ref('');
  const isStreaming = ref(false);

  // Getters
  const canSend = computed(() => 
    inputMessage.value.trim().length > 0 && !isLoading.value && !isTyping.value
  );

  const hasMessages = computed(() => messages.value.length > 0);

  const contextDescription = computed(() => {
    if (!activeContext.value) return null;
    return getContextDescription(activeContext.value);
  });

  // Watch for context changes to update suggestions
  watch(activeContext, (newContext) => {
    if (newContext) {
      loadSuggestions(newContext.module, newContext.action);
    }
  });

  // =============================================================================
  // INITIALIZATION
  // =============================================================================

  /**
   * Inicializar Efi - cargar sesión almacenada
   */
  async function initialize(): Promise<void> {
    const hasSession = await store.loadStoredSession();
    
    if (!hasSession) {
      // Crear sesión inicial si no hay ninguna
      await store.createNewSession('Bienvenido a Efi');
    }
  }

  // =============================================================================
  // MESSAGE HANDLING
  // =============================================================================

  /**
   * Enviar mensaje a Efi con contexto inteligente
   */
  async function sendMessage(content?: string): Promise<boolean> {
    const messageContent = content || inputMessage.value;
    
    if (!messageContent.trim() || isLoading.value) return false;

    // Clear input
    if (!content) {
      inputMessage.value = '';
    }

    // Create temp user message
    const tempUserMessage: Message = {
      id: generateId(),
      sessionId: store.sessionId || '',
      role: 'user',
      content: messageContent.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    store.addMessage(tempUserMessage);
    store.isTyping = true;
    store.isLoading = true;
    store.error = null;

    try {
      // Build payload with context
      const payload: AIPayload = {
        message: messageContent.trim(),
        sessionId: store.sessionId || undefined,
        context: store.buildContextSnapshot(activeContext.value || {
          module: 'dashboard',
          data: {},
          timestamp: new Date().toISOString(),
        }),
      };

      const response = await assistantService.sendMessageToAI(payload);

      if (response.success) {
        // Update user message status
        store.updateMessage(tempUserMessage.id, { status: 'sent' });

        // Add assistant response
        const assistantMessage: Message = {
          id: response.messageId,
          sessionId: response.sessionId,
          role: 'assistant',
          content: response.content,
          status: 'sent',
          contextUsed: response.contextUsed,
          tokensInput: response.tokensInput,
          tokensOutput: response.tokensOutput,
          modelUsed: response.modelUsed,
          processingTimeMs: response.processingTimeMs,
          createdAt: new Date().toISOString(),
        };

        store.addMessage(assistantMessage);

        // Update session ID if new
        if (!store.sessionId && response.sessionId) {
          localStorage.setItem('efi_session_id', response.sessionId);
        }

        return true;
      } else {
        handleError(response.error || 'Error desconocido', tempUserMessage.id);
        return false;
      }
    } catch (err: any) {
      handleError(err.message || 'Error de conexión', tempUserMessage.id);
      return false;
    } finally {
      store.isLoading = false;
      store.isTyping = false;
    }
  }

  /**
   * Enviar mensaje con contexto específico de módulo
   */
  async function sendMessageWithContext(
    content: string,
    context: ModuleContext
  ): Promise<boolean> {
    store.setContext(context);
    return sendMessage(content);
  }

  /**
   * Manejar errores
   */
  function handleError(errorMsg: string, messageId: string): void {
    store.error = errorMsg;
    store.updateMessage(messageId, { status: 'error' });
    
    // Add error message
    store.addMessage({
      id: generateId(),
      sessionId: store.sessionId || '',
      role: 'assistant',
      content: `❌ ${errorMsg}`,
      status: 'error',
      createdAt: new Date().toISOString(),
    });

    toast.error(errorMsg);
  }

  // =============================================================================
  // STREAMING (WebSocket)
  // =============================================================================

  /**
   * Enviar mensaje con streaming de respuesta
   */
  async function sendMessageStreaming(content?: string): Promise<boolean> {
    const messageContent = content || inputMessage.value;
    if (!messageContent.trim()) return false;

    if (!content) inputMessage.value = '';

    isStreaming.value = true;
    streamingContent.value = '';

    // Create user message
    const userMessage: Message = {
      id: generateId(),
      sessionId: store.sessionId || '',
      role: 'user',
      content: messageContent.trim(),
      status: 'sent',
      createdAt: new Date().toISOString(),
    };
    store.addMessage(userMessage);

    // Create placeholder for assistant response
    const assistantMessageId = generateId();
    store.addMessage({
      id: assistantMessageId,
      sessionId: store.sessionId || '',
      role: 'assistant',
      content: '',
      status: 'streaming',
      createdAt: new Date().toISOString(),
    });

    // Setup WebSocket connection
    const ws = assistantService.createStreamingConnection(
      store.sessionId || '',
      (chunk) => {
        streamingContent.value += chunk;
        store.updateMessage(assistantMessageId, {
          content: streamingContent.value,
        });
      },
      () => {
        isStreaming.value = false;
        store.updateMessage(assistantMessageId, {
          status: 'sent',
          content: streamingContent.value,
        });
      },
      (error) => {
        isStreaming.value = false;
        handleError(error, assistantMessageId);
      }
    );

    // Send message after WS is ready
    ws?.addEventListener('open', () => {
      ws.send(JSON.stringify({
        message: messageContent,
        context: activeContext.value,
      }));
    });

    return true;
  }

  // =============================================================================
  // CONTEXT MANAGEMENT
  // =============================================================================

  /**
   * Establecer contexto desde otro módulo
   * Ejemplo: setModuleContext('inventory', 'product_selected', { product })
   */
  function setModuleContext(
    module: ContextModule,
    action: string,
    data: Record<string, unknown>
  ): void {
    const context: ModuleContext = {
      module,
      action,
      data,
      timestamp: new Date().toISOString(),
    };
    
    store.setContext(context);
    
    // Auto-generar sugerencias basadas en el contexto
    generateContextualPrompts(context);
  }

  /**
   * Limpiar contexto actual
   */
  function clearModuleContext(): void {
    store.clearContext();
    suggestions.value = [];
  }

  /**
   * Generar descripción del contexto para mostrar al usuario
   */
  function getContextDescription(context: ModuleContext): string {
    const descriptions: Record<ContextModule, string> = {
      inventory: '📦 Inventario',
      payments: '💳 Pagos',
      sales: '🛒 Ventas',
      customers: '👥 Clientes',
      reports: '📊 Reportes',
      dashboard: '📈 Dashboard',
      settings: '⚙️ Configuración',
    };

    const baseDesc = descriptions[context.module] || context.module;
    
    if (context.action && context.data) {
      const entityName = context.data.name || context.data.title || '';
      return `${baseDesc}: ${context.action}${entityName ? ` - ${entityName}` : ''}`;
    }

    return baseDesc;
  }

  /**
   * Generar prompts contextuales basados en el módulo
   */
  async function generateContextualPrompts(context: ModuleContext): Promise<void> {
    const contextualPrompts: Record<ContextModule, PromptSuggestion[]> = {
      inventory: [
        { id: 'inv-1', label: '¿Cómo puedo mejorar el stock?', prompt: 'Dame recomendaciones para optimizar el inventario actual', icon: 'TrendingUp' },
        { id: 'inv-2', label: 'Productos con bajo stock', prompt: '¿Qué productos tienen stock bajo y necesitan reabastecimiento?', icon: 'AlertTriangle' },
        { id: 'inv-3', label: 'Análisis de rotación', prompt: 'Analiza la rotación de inventario del último mes', icon: 'BarChart' },
      ],
      payments: [
        { id: 'pay-1', label: 'Resumen de transacciones', prompt: 'Muestrame un resumen de las transacciones de hoy', icon: 'Receipt' },
        { id: 'pay-2', label: 'Métodos de pago populares', prompt: '¿Cuáles son los métodos de pago más usados?', icon: 'CreditCard' },
      ],
      sales: [
        { id: 'sale-1', label: 'Tendencias de ventas', prompt: 'Analiza las tendencias de ventas de esta semana', icon: 'TrendingUp' },
        { id: 'sale-2', label: 'Productos más vendidos', prompt: '¿Cuáles son los productos más vendidos?', icon: 'Star' },
      ],
      customers: [
        { id: 'cust-1', label: 'Clientes frecuentes', prompt: 'Muestrame los clientes más frecuentes', icon: 'Users' },
        { id: 'cust-2', label: 'Segmentación', prompt: 'Ayúdame a segmentar mis clientes', icon: 'PieChart' },
      ],
      reports: [
        { id: 'rep-1', label: 'Generar reporte', prompt: 'Genera un reporte resumen del mes actual', icon: 'FileText' },
        { id: 'rep-2', label: 'Análisis financiero', prompt: 'Realiza un análisis financiero detallado', icon: 'DollarSign' },
      ],
      dashboard: [
        { id: 'dash-1', label: 'Resumen del día', prompt: 'Dame un resumen de las operaciones de hoy', icon: 'Activity' },
        { id: 'dash-2', label: 'Alertas importantes', prompt: '¿Hay alertas o notificaciones importantes?', icon: 'Bell' },
      ],
      settings: [
        { id: 'set-1', label: 'Ayuda de configuración', prompt: 'Ayúdame con la configuración del sistema', icon: 'HelpCircle' },
      ],
    };

    suggestions.value = contextualPrompts[context.module] || [];

    // También intentar cargar sugerencias del backend
    try {
      const serverSuggestions = await assistantService.fetchContextualSuggestions(
        context.module,
        context.action
      );
      if (serverSuggestions.length > 0) {
        suggestions.value = serverSuggestions.map((s, i) => ({
          id: `server-${i}`,
          label: s.label,
          prompt: s.prompt,
          icon: 'MessageCircle',
          module: context.module,
        }));
      }
    } catch {
      // Usar sugerencias locales si el backend falla
    }
  }

  async function loadSuggestions(module: string, action?: string): Promise<void> {
    // Reutilizar generateContextualPrompts
    generateContextualPrompts({
      module: module as ContextModule,
      action: action || '',
      data: {},
      timestamp: new Date().toISOString(),
    });
  }

  // =============================================================================
  // SESSION HELPERS
  // =============================================================================

  /**
   * Iniciar nueva conversación
   */
  async function startNewChat(): Promise<void> {
    await store.createNewSession();
    suggestions.value = [];
    toast.success('Nueva conversación iniciada');
  }

  /**
   * Cargar conversación del historial
   */
  async function loadChat(sessionId: string): Promise<boolean> {
    return store.loadSession(sessionId);
  }

  /**
   * Regenerar última respuesta
   */
  async function regenerateLastResponse(): Promise<boolean> {
    if (!store.sessionId) return false;

    const response = await assistantService.regenerateResponse(store.sessionId);
    
    if (response) {
      // Reemplazar último mensaje del asistente
      const lastAssistantMsg = messages.value
        .filter(m => m.role === 'assistant')
        .pop();
      
      if (lastAssistantMsg) {
        store.updateMessage(lastAssistantMsg.id, {
          content: response.content,
          tokensOutput: response.tokensOutput,
        });
      }
      
      return true;
    }
    
    return false;
  }

  // =============================================================================
  // UI HELPERS
  // =============================================================================

  function toggleChat(): void {
    store.toggleChat();
  }

  function openChat(): void {
    store.openChat();
  }

  function closeChat(): void {
    store.closeChat();
  }

  // =============================================================================
  // RETURN
  // =============================================================================

  return {
    // State refs
    currentSession,
    messages,
    isOpen,
    isLoading,
    isTyping,
    error,
    activeContext,
    inputMessage,
    suggestions,
    streamingContent,
    isStreaming,
    
    // Getters
    canSend,
    hasMessages,
    contextDescription,
    
    // Actions
    initialize,
    sendMessage,
    sendMessageWithContext,
    sendMessageStreaming,
    setModuleContext,
    clearModuleContext,
    startNewChat,
    loadChat,
    regenerateLastResponse,
    toggleChat,
    openChat,
    closeChat,
  };
}

// =============================================================================
// UTILITY COMPOSABLES
// =============================================================================

/**
 * Composable simplificado para uso rápido
 */
export function useEfiQuick() {
  const { sendMessageWithContext, setModuleContext } = useEfi();

  /**
   * Preguntar sobre un producto del inventario
   */
  async function askAboutProduct(product: Record<string, unknown>, question: string): Promise<void> {
    setModuleContext('inventory', 'product_query', { product });
    await sendMessageWithContext(question, {
      module: 'inventory',
      action: 'product_query',
      data: { product },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Preguntar sobre una transacción
   */
  async function askAboutTransaction(transaction: Record<string, unknown>, question: string): Promise<void> {
    await sendMessageWithContext(question, {
      module: 'payments',
      action: 'transaction_query',
      data: { transaction },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Obtener análisis de ventas
   */
  async function getSalesAnalysis(period?: string): Promise<void> {
    await sendMessageWithContext(
      `Analiza las ventas ${period ? `del período ${period}` : 'recientes'}`,
      {
        module: 'sales',
        action: 'analysis',
        data: { period },
        timestamp: new Date().toISOString(),
      }
    );
  }

  return {
    askAboutProduct,
    askAboutTransaction,
    getSalesAnalysis,
  };
}
