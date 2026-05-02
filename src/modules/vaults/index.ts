/**
 * @fileoverview Índice del módulo Vaults
 * @module @modules/vaults
 */

// =============================================================================
// EXPORTS
// =============================================================================

export * from './router';
export * from './types';
export * from './services';
export * from './composables';

// =============================================================================
// MODULE REGISTRATION
// =============================================================================

/**
 * Registra el módulo de vaults en la aplicación Vue
 */
export function registerVaultsModule() {
  // El registro de rutas se maneja en el router principal
  // Aquí se pueden registrar componentes globales, directivas, etc.
  
  console.log('Vaults module registered');
}

// =============================================================================
// MODULE METADATA
// =============================================================================

export const vaultsModuleInfo = {
  name: 'vaults',
  version: '1.0.0',
  description: 'Sistema de gestión de gaveteros con herencia',
  features: [
    'Blueprint templates',
    'Tenant vault inheritance',
    'Financial rules validation',
    'Staff management interface',
    'Tenant management interface',
  ],
} as const;
