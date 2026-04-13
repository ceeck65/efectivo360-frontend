<template>
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            scope="col"
            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            :class="{
              'cursor-pointer hover:bg-gray-100': column.sortable,
              'text-right': column.align === 'right',
              'text-center': column.align === 'center',
            }"
            @click="column.sortable && handleSort(column.key)"
          >
            <div class="flex items-center gap-1" :class="{
              'justify-end': column.align === 'right',
              'justify-center': column.align === 'center',
            }">
              {{ column.label }}
              <template v-if="column.sortable">
                <ArrowUp v-if="sortKey === column.key && sortOrder === 'asc'" class="w-4 h-4" />
                <ArrowDown v-else-if="sortKey === column.key && sortOrder === 'desc'" class="w-4 h-4" />
                <ArrowUpDown v-else class="w-4 h-4 text-gray-300" />
              </template>
            </div>
          </th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        <tr
          v-for="(row, index) in rows"
          :key="getRowKey(row, index)"
          class="hover:bg-gray-50 transition-colors"
          :class="{ 'cursor-pointer': clickable }"
          @click="clickable && emit('row-click', row)"
        >
          <td
            v-for="column in columns"
            :key="column.key"
            class="px-6 py-4 whitespace-nowrap text-sm"
            :class="{
              'text-gray-900': !column.format,
              'text-gray-500': column.format,
              'text-right': column.align === 'right',
              'text-center': column.align === 'center',
            }"
          >
            <slot
              :name="`cell-${column.key}`"
              :row="row"
              :value="getNestedValue(row as Record<string, unknown>, column.key)"
              :column="column"
            >
              {{ formatValue(getNestedValue(row as Record<string, unknown>, column.key), column.format) }}
            </slot>
          </td>
        </tr>
        
        <!-- Empty state -->
        <tr v-if="rows.length === 0">
          <td
            :colspan="columns.length"
            class="px-6 py-12 text-center text-gray-500"
          >
            <slot name="empty">
              <div class="flex flex-col items-center gap-2">
                <Inbox class="w-12 h-12 text-gray-300" />
                <p>{{ emptyMessage }}</p>
              </div>
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview Componente UI "mudo" - Tabla de datos genérica
 * @module @shared/components/DataTable
 */
import { ArrowUp, ArrowDown, ArrowUpDown, Inbox } from 'lucide-vue-next';

export type ColumnAlign = 'left' | 'center' | 'right';
export type ColumnFormat = 'currency' | 'date' | 'datetime' | 'number' | 'percentage' | 'boolean' | 'custom';
export type SortOrder = 'asc' | 'desc';

/** Definición de columna de la tabla */
export interface Column {
  /** Clave del campo en el objeto de datos */
  key: string;
  /** Etiqueta mostrada en el header */
  label: string;
  /** Alineación del contenido */
  align?: ColumnAlign;
  /** Permitir ordenamiento */
  sortable?: boolean;
  /** Formato del valor */
  format?: ColumnFormat;
  /** Función de formato personalizado */
  formatFn?: (value: unknown, row: Record<string, unknown>) => string;
}

interface Props {
  /** Definición de columnas */
  columns: Column[];
  /** Datos a mostrar */
  rows: unknown[];
  /** Clave única para cada fila (propiedad o función) */
  rowKey?: string | ((row: unknown) => string);
  /** Las filas son clickeables */
  clickable?: boolean;
  /** Columna de ordenamiento actual */
  sortKey?: string;
  /** Orden actual */
  sortOrder?: SortOrder;
  /** Mensaje cuando no hay datos */
  emptyMessage?: string;
}

const props = withDefaults(defineProps<Props>(), {
  clickable: false,
  sortOrder: 'asc',
  emptyMessage: 'No hay datos para mostrar',
});

const emit = defineEmits<{
  /** Emitido cuando se hace click en una fila */
  (e: 'row-click', row: unknown): void;
  /** Emitido cuando se cambia el ordenamiento */
  (e: 'sort', key: string, order: SortOrder): void;
}>();

/**
 * Obtiene el valor de una propiedad anidada
 */
function getNestedValue(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== 'object') return undefined;
  return path.split('.').reduce((acc: unknown, part: string) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

/**
 * Obtiene la clave única de una fila
 */
function getRowKey(row: unknown, index: number): string {
  if (typeof props.rowKey === 'function') {
    return props.rowKey(row);
  }
  if (typeof props.rowKey === 'string') {
    const key = getNestedValue(row, props.rowKey);
    return String(key ?? index);
  }
  return String(index);
}

/**
 * Formatea un valor según el tipo especificado
 */
function formatValue(value: unknown, format?: ColumnFormat): string {
  if (value === null || value === undefined) {
    return '-';
  }

  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: 'VES',
      }).format(Number(value));
    
    case 'date':
      return new Date(String(value)).toLocaleDateString('es-VE');
    
    case 'datetime':
      return new Date(String(value)).toLocaleString('es-VE');
    
    case 'number':
      return new Intl.NumberFormat('es-VE').format(Number(value));
    
    case 'percentage':
      return `${Number(value).toFixed(2)}%`;
    
    case 'boolean':
      return value ? 'Sí' : 'No';
    
    default:
      return String(value);
  }
}

/**
 * Maneja el clic en un header ordenable
 */
function handleSort(key: string): void {
  const newOrder = props.sortKey === key && props.sortOrder === 'asc' ? 'desc' : 'asc';
  emit('sort', key, newOrder);
}
</script>
