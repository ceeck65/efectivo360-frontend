/**
 * @fileoverview Tipos del módulo Users (Gestión de Usuarios y Perfiles)
 * @module @modules/users/types
 * 
 * Gestión de usuarios, roles, permisos y perfiles de usuario.
 */

import type { ULID } from '@core/types';

// =============================================================================
// USER TYPES
// =============================================================================

/**
 * Estado del usuario en el sistema
 */
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

/**
 * Rol del usuario
 */
export type UserRole = 
  | 'superadmin'     // Staff - acceso total
  | 'admin'          // Admin del tenant
  | 'manager'        // Gerente
  | 'cashier'        // Cajero
  | 'inventory_manager' // Responsable de inventario
  | 'sales_rep'      // Vendedor
  | 'readonly';      // Solo lectura

/**
 * Usuario del sistema
 */
export interface User {
  id: ULID;
  email: string;
  
  // Datos personales
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  
  // Relaciones
  tenantId: ULID;
  role: UserRole;
  
  // Estado
  status: UserStatus;
  isEmailVerified: boolean;
  isTwoFactorEnabled: boolean;
  
  // Seguridad
  lastLoginAt?: string;
  lastLoginIp?: string;
  passwordChangedAt?: string;
  failedLoginAttempts: number;
  lockedUntil?: string;
  
  // Preferencias
  preferences: UserPreferences;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  invitedAt?: string;
  invitedBy?: ULID;
}

/**
 * Preferencias del usuario
 */
export interface UserPreferences {
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  currency: string;
  
  // UI
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  
  // Dashboard
  defaultDashboardView?: string;
  favoriteModules: string[];
}

/**
 * Perfil público del usuario
 */
export interface UserProfile {
  id: ULID;
  firstName: string;
  lastName: string;
  fullName: string;
  avatarUrl?: string;
  role: UserRole;
  tenantId: ULID;
}

// =============================================================================
// ROLE & PERMISSION TYPES
// =============================================================================

/**
 * Permiso del sistema
 */
export interface Permission {
  id: ULID;
  code: string;
  name: string;
  description?: string;
  module: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage' | 'export';
}

/**
 * Rol con permisos
 */
export interface Role {
  id: ULID;
  code: UserRole;
  name: string;
  description?: string;
  permissions: Permission[];
  isSystem: boolean;  // No se puede eliminar
  isActive: boolean;
}

/**
 * Permisos por módulo para UI
 */
export interface ModulePermissions {
  module: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canManage: boolean;
  canExport: boolean;
}

// =============================================================================
// FORM & CREATE TYPES
// =============================================================================

/**
 * Datos para crear usuario
 */
export interface UserCreateData {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  tenantId: ULID;
  sendInvitation: boolean;
}

/**
 * Datos para actualizar usuario
 */
export interface UserUpdateData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  role?: UserRole;
  status?: UserStatus;
  preferences?: Partial<UserPreferences>;
}

/**
 * Datos para actualizar perfil propio
 */
export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  preferences?: Partial<UserPreferences>;
}

/**
 * Datos para cambiar contraseña
 */
export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// =============================================================================
// INVITATION TYPES
// =============================================================================

/**
 * Invitación pendiente
 */
export interface UserInvitation {
  id: ULID;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId: ULID;
  invitedBy: ULID;
  invitedByName: string;
  token: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  createdAt: string;
}

/**
 * Datos para aceptar invitación
 */
export interface AcceptInvitationData {
  token: string;
  password: string;
  confirmPassword: string;
}

// =============================================================================
// FILTER & SEARCH TYPES
// =============================================================================

/**
 * Filtros para usuarios
 */
export interface UserFilters {
  status?: UserStatus;
  role?: UserRole;
  tenantId?: ULID;
  search?: string;
  isEmailVerified?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Filtros para invitaciones
 */
export interface InvitationFilters {
  status?: 'pending' | 'accepted' | 'expired';
  role?: UserRole;
  tenantId?: ULID;
}

// =============================================================================
// ACTIVITY & AUDIT
// =============================================================================

/**
 * Actividad del usuario
 */
export interface UserActivity {
  id: ULID;
  userId: ULID;
  action: string;
  entityType?: string;
  entityId?: ULID;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

/**
 * Sesión activa del usuario
 */
export interface UserSession {
  id: ULID;
  userId: ULID;
  deviceName: string;
  browser: string;
  os: string;
  ipAddress: string;
  location?: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

// =============================================================================
// STATS
// =============================================================================

/**
 * Estadísticas de usuarios
 */
export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  pending: number;
  byRole: Array<{ role: UserRole; count: number }>;
  newThisMonth: number;
  activeToday: number;
  averageSessionDuration?: number;
}
