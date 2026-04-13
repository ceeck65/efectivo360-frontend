<template>
  <div 
    role="alert"
    class="rounded-lg border p-4"
    :class="variantClasses[variant]"
  >
    <div class="flex items-start gap-3">
      <AlertCircle v-if="showIcon" class="w-5 h-5 flex-shrink-0 mt-0.5" />
      
      <div class="flex-1 min-w-0">
        <h3 v-if="title" class="font-medium text-sm">
          {{ title }}
        </h3>
        
        <p class="text-sm" :class="title ? 'mt-1' : ''">
          {{ message }}
        </p>
        
        <div v-if="details && details.length > 0" class="mt-2">
          <ul class="list-disc list-inside text-sm space-y-0.5">
            <li v-for="(detail, index) in details" :key="index">
              {{ detail }}
            </li>
          </ul>
        </div>
        
        <div v-if="$slots.action || retryLabel" class="mt-3">
          <slot name="action">
            <button
              v-if="retryLabel && onRetry"
              type="button"
              @click="onRetry"
              class="text-sm font-medium underline hover:no-underline"
              :class="actionClasses[variant]"
            >
              {{ retryLabel }}
            </button>
          </slot>
        </div>
      </div>
      
      <button
        v-if="dismissible"
        type="button"
        @click="emit('dismiss')"
        class="flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors"
        aria-label="Cerrar"
      >
        <X class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview Componente UI "mudo" - Mensaje de error
 * @module @shared/components/ErrorMessage
 */
import { AlertCircle, X } from 'lucide-vue-next';

export type ErrorVariant = 'error' | 'warning' | 'info';

interface Props {
  /** Mensaje principal de error */
  message: string;
  /** Título opcional del error */
  title?: string;
  /** Detalles adicionales del error */
  details?: string[];
  /** Variante visual del mensaje */
  variant?: ErrorVariant;
  /** Mostrar ícono de alerta */
  showIcon?: boolean;
  /** Permitir cerrar el mensaje */
  dismissible?: boolean;
  /** Etiqueta para botón de reintentar */
  retryLabel?: string;
  /** Callback al reintentar */
  onRetry?: () => void;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'error',
  showIcon: true,
  dismissible: false,
});

const emit = defineEmits<{
  /** Emitido cuando se cierra el mensaje */
  (e: 'dismiss'): void;
}>();

const variantClasses: Record<ErrorVariant, string> = {
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const actionClasses: Record<ErrorVariant, string> = {
  error: 'text-red-700 hover:text-red-900',
  warning: 'text-yellow-700 hover:text-yellow-900',
  info: 'text-blue-700 hover:text-blue-900',
};
</script>
