<template>
  <span
    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
    :class="badgeClasses"
    :title="titleText"
  >
    <component 
      :is="iconComponent" 
      class="w-3.5 h-3.5"
      aria-hidden="true"
    />
    <span>{{ displayText }}</span>
    <span v-if="showQuantity && stockQuantity !== null" class="opacity-75">
      ({{ formattedQuantity }})
    </span>
  </span>
</template>

<script setup lang="ts">
/**
 * @fileoverview Componente específico del módulo - Badge de nivel de stock
 * @module @modules/inventory/components/ProductStockBadge
 * 
 * Muestra el estado del stock de un producto con indicadores visuales.
 * Es "dumb" respecto a la UI pero tiene lógica de dominio específica de inventario.
 */
import { computed } from 'vue';
import { 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Package,
} from 'lucide-vue-next';
import type { StockLevel } from '../types';

interface Props {
  /** Nivel de stock a mostrar */
  level: StockLevel;
  /** Cantidad actual (opcional, para mostrar número) */
  stockQuantity?: number | null;
  /** Mostrar la cantidad numérica */
  showQuantity?: boolean;
  /** Tamaño del badge */
  size?: 'sm' | 'md';
  /** Variante visual */
  variant?: 'default' | 'outline' | 'subtle';
  /** Texto personalizado (si no se quiere el default) */
  customText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  stockQuantity: null,
  showQuantity: false,
  size: 'md',
  variant: 'default',
});

/** Mapa de configuración por nivel de stock */
const stockConfig: Record<StockLevel, {
  label: string;
  icon: any;
  colors: Record<string, string>;
}> = {
  CRITICAL: {
    label: 'Sin stock',
    icon: AlertCircle,
    colors: {
      default: 'bg-red-100 text-red-800 border-red-200',
      outline: 'bg-transparent text-red-600 border-red-300',
      subtle: 'bg-red-50 text-red-700 border-transparent',
    },
  },
  LOW: {
    label: 'Stock bajo',
    icon: AlertTriangle,
    colors: {
      default: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      outline: 'bg-transparent text-yellow-600 border-yellow-300',
      subtle: 'bg-yellow-50 text-yellow-700 border-transparent',
    },
  },
  NORMAL: {
    label: 'Stock OK',
    icon: CheckCircle2,
    colors: {
      default: 'bg-green-100 text-green-800 border-green-200',
      outline: 'bg-transparent text-green-600 border-green-300',
      subtle: 'bg-green-50 text-green-700 border-transparent',
    },
  },
  HIGH: {
    label: 'Stock alto',
    icon: Package,
    colors: {
      default: 'bg-blue-100 text-blue-800 border-blue-200',
      outline: 'bg-transparent text-blue-600 border-blue-300',
      subtle: 'bg-blue-50 text-blue-700 border-transparent',
    },
  },
};

/** Clases CSS computadas según configuración */
const badgeClasses = computed(() => {
  const config = stockConfig[props.level];
  const baseClasses = config.colors[props.variant];
  const sizeClasses = props.size === 'sm' 
    ? 'px-2 py-0.5 text-xs' 
    : 'px-2.5 py-1';
  return `${baseClasses} ${sizeClasses}`;
});

/** Componente de icono según nivel */
const iconComponent = computed(() => stockConfig[props.level].icon);

/** Texto a mostrar */
const displayText = computed(() => 
  props.customText || stockConfig[props.level].label
);

/** Texto del tooltip/title */
const titleText = computed(() => {
  if (props.stockQuantity !== null) {
    return `Cantidad en stock: ${props.stockQuantity} unidades`;
  }
  return stockConfig[props.level].label;
});

/** Cantidad formateada */
const formattedQuantity = computed(() => {
  if (props.stockQuantity === null) return '';
  return new Intl.NumberFormat('es-VE').format(props.stockQuantity);
});
</script>
