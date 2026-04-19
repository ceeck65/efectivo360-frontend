/**
 * @fileoverview Punto de entrada público del módulo Users (Gestión de Usuarios)
 * @module @modules/users
 * 
 * Gestión de usuarios, roles, permisos y perfiles.
 * Soporte para invitaciones y gestión de sesiones.
 * 
 * API Pública - Solo importar desde aquí, nunca de subcarpetas internas.
 */

// =============================================================================
// TYPES
// =============================================================================

export type {
  // User types
  User,
  UserStatus,
  UserRole,
  UserProfile,
  UserPreferences,
  
  // Role & permission types
  Role,
  Permission,
  ModulePermissions,
  RoleOption,
  PermissionDefinition,
  UserPermissionsResponse,
  
  // Form types
  UserCreateData,
  UserUpdateData,
  ProfileUpdateData,
  ChangePasswordData,
  
  // Invitation types
  UserInvitation,
  AcceptInvitationData,
  
  // Filter types
  UserFilters,
  InvitationFilters,
  
  // Activity types
  UserActivity,
  UserSession,
  
  // Stats
  UserStats,
} from './types';

// =============================================================================
// SERVICES
// =============================================================================

export {
  // Users
  fetchUsers,
  fetchUserById,
  fetchCurrentUser,
  createUser,
  updateUser,
  updateProfile,
  deleteUser,
  changePassword,
  
  // Roles & permissions
  fetchRoles,
  fetchMyPermissions,
  checkPermission,
  
  // Invitations
  createInvitation,
  fetchInvitations,
  cancelInvitation,
  resendInvitation,
  validateInvitationToken,
  acceptInvitation,
  
  // Sessions & activity
  fetchUserActivity,
  fetchUserSessions,
  terminateSession,
  terminateOtherSessions,
  
  // Stats
  fetchUserStats,
  
  // Profile
  uploadAvatar,
  deactivateAccount,
} from './services/users.service';

// =============================================================================
// STORE
// =============================================================================

export { useUsersStore } from './stores/usersStore';

// =============================================================================
// COMPOSABLES
// =============================================================================

export {
  useUsers,
  useProfile,
  useUserSelector,
} from './composables/useUsers';

// =============================================================================
// ROUTER
// =============================================================================

export {
  usersRoutes,
  usersRouteNames,
  usersPaths,
  USERS_ROUTE_PREFIX,
  USERS_ROUTE_NAME,
} from './router';
