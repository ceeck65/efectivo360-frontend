/**
 * Catálogo centralizado de permisos.
 * Debe mantenerse sincronizado con apps/accounts/permission_constants.py (backend).
 * 
 * El frontend NUNCA evalúa lógica de negocio — solo reacciona a estos strings
 * que llegan desde el backend en authStore.user.permissions.
 * 
 * Uso:
 *   import { INV_VIEW } from '@/lib/permissions';
 *   if (authStore.hasPermission(INV_VIEW)) { ... }
 */

// ── Dashboard ──
export const DASH_VIEW = 'dash.view';
export const DASH_REPORT = 'dash.report';
export const DASH_VIEW_MENU = 'dash.view_menu';

// ── Ventas / POS ──
export const VTA_VIEW = 'vta.view';
export const VTA_CREATE = 'vta.create';
export const VTA_UPDATE = 'vta.update';
export const VTA_STATUS = 'vta.status';
export const VTA_REPORT = 'vta.report';
export const VTA_USE_POS = 'vta.use_pos';

// ── Inventario ──
export const INV_VIEW = 'inv.view';
export const INV_CREATE = 'inv.create';
export const INV_UPDATE = 'inv.update';
export const INV_STATUS = 'inv.status';
export const INV_REPORT = 'inv.report';

// ── Finanzas ──
export const FIN_VIEW = 'fin.view';
export const FIN_CREATE = 'fin.create';
export const FIN_UPDATE = 'fin.update';
export const FIN_STATUS = 'fin.status';
export const FIN_REPORT = 'fin.report';

// ── Clientes ──
export const CLI_VIEW = 'cli.view';
export const CLI_CREATE = 'cli.create';
export const CLI_UPDATE = 'cli.update';
export const CLI_STATUS = 'cli.status';
export const CLI_REPORT = 'cli.report';

// ── Proveedores ──
export const PROV_VIEW = 'prov.view';
export const PROV_CREATE = 'prov.create';
export const PROV_UPDATE = 'prov.update';
export const PROV_STATUS = 'prov.status';
export const PROV_REPORT = 'prov.report';

// ── Usuarios / Roles ──
export const USR_VIEW = 'usr.view';
export const USR_CREATE = 'usr.create';
export const USR_UPDATE = 'usr.update';
export const USR_STATUS = 'usr.status';

// ── Configuración ──
export const CFG_VIEW = 'cfg.view';
export const CFG_UPDATE = 'cfg.update';

// ── IA Efi ──
export const EFI_VIEW = 'efi.view';
export const EFI_USE_AI = 'efi.use_ai';

// ── 3 perfiles lógicos (solo referencia — el backend envía permissions planas) ──
export const LOGICAL_PROFILES = {
  ADMIN: 'Administrador',
  SUPERVISOR: 'Supervisor',
  CAJERO: 'Cajero',
} as const;
