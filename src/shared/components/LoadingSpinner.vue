<template>
  <div 
    class="flex items-center justify-center"
    :class="sizeClasses[size]"
  >
    <div 
      class="animate-spin rounded-full border-2 border-current border-t-transparent"
      :class="[colorClasses[color], sizeClasses[size]]"
      role="status"
      aria-label="Cargando"
    >
      <span class="sr-only">Cargando...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview Componente UI "mudo" - Spinner de carga
 * @module @shared/components/LoadingSpinner
 */

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerColor = 'primary' | 'secondary' | 'white' | 'gray';

interface Props {
  /** Tamaño del spinner */
  size?: SpinnerSize;
  /** Color del spinner */
  color?: SpinnerColor;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  color: 'primary',
});

const sizeClasses: Record<SpinnerSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const colorClasses: Record<SpinnerColor, string> = {
  primary: 'text-blue-600',
  secondary: 'text-gray-600',
  white: 'text-white',
  gray: 'text-gray-400',
};
</script>
