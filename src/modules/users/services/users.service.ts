/**
 * @fileoverview Servicio de API para Users (Gestión de Usuarios)
 * @module @modules/users/services/users.service
 * 
 * Gestión de usuarios, roles, invitaciones y actividad.
 */

import { httpClient } from '@core/index.js';
import type { ApiResponse, PaginatedResponse } from '@core/types';
import type {
  User,
  Role,
  Permission,
  UserCreateData,
  UserUpdateData,
  ProfileUpdateData,
  ChangePasswordData,
  UserInvitation,
  AcceptInvitationData,
  UserFilters,
  UserActivity,
  UserSession,
  UserStats,
} from '../types';

const BASE_URL = '/users';
const ROLES_URL = '/roles';
const INVITATIONS_URL = '/invitations';

// =============================================================================
// USERS
// =============================================================================

/**
 * Obtener listado de usuarios
 */
export async function fetchUsers(
  filters?: UserFilters,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<User>> {
  const response = await httpClient.get<ApiResponse<PaginatedResponse<User>>>(
    `${BASE_URL}/`,
    { params: { ...filters, page, page_size: pageSize } }
  );
  return response.data.data!;
}

/**
 * Obtener usuario por ID
 */
export async function fetchUserById(id: string): Promise<User | null> {
  const response = await httpClient.get<ApiResponse<User>>(
    `${BASE_URL}/${id}/`
  );
  return response.data.data || null;
}

/**
 * Obtener usuario actual (me)
 */
export async function fetchCurrentUser(): Promise<User | null> {
  const response = await httpClient.get<ApiResponse<User>>(
    `${BASE_URL}/me/`
  );
  return response.data.data || null;
}

/**
 * Crear usuario
 */
export async function createUser(data: UserCreateData): Promise<User | null> {
  const response = await httpClient.post<ApiResponse<User>>(
    `${BASE_URL}/`,
    data
  );
  return response.data.data || null;
}

/**
 * Actualizar usuario
 */
export async function updateUser(
  id: string,
  data: UserUpdateData
): Promise<User | null> {
  const response = await httpClient.patch<ApiResponse<User>>(
    `${BASE_URL}/${id}/`,
    data
  );
  return response.data.data || null;
}

/**
 * Actualizar perfil propio
 */
export async function updateProfile(data: ProfileUpdateData): Promise<User | null> {
  const response = await httpClient.patch<ApiResponse<User>>(
    `${BASE_URL}/me/`,
    data
  );
  return response.data.data || null;
}

/**
 * Eliminar usuario
 */
export async function deleteUser(id: string): Promise<boolean> {
  try {
    await httpClient.delete(`${BASE_URL}/${id}/`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Cambiar contraseña
 */
export async function changePassword(data: ChangePasswordData): Promise<boolean> {
  try {
    await httpClient.post(`${BASE_URL}/change-password/`, data);
    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// ROLES & PERMISSIONS
// =============================================================================

/**
 * Obtener roles disponibles
 */
export async function fetchRoles(): Promise<Role[]> {
  const response = await httpClient.get<ApiResponse<Role[]>>(
    `${ROLES_URL}/`
  );
  return response.data.data || [];
}

/**
 * Obtener permisos del usuario actual
 */
export async function fetchMyPermissions(): Promise<Permission[]> {
  const response = await httpClient.get<ApiResponse<Permission[]>>(
    `${BASE_URL}/me/permissions/`
  );
  return response.data.data || [];
}

/**
 * Verificar si tiene permiso específico
 */
export async function checkPermission(permissionCode: string): Promise<boolean> {
  try {
    const response = await httpClient.get<ApiResponse<{ has_permission: boolean }>>(
      `${BASE_URL}/me/check-permission/`,
      { params: { code: permissionCode } }
    );
    return response.data.data?.has_permission || false;
  } catch {
    return false;
  }
}

// =============================================================================
// INVITATIONS
// =============================================================================

/**
 * Crear invitación
 */
export async function createInvitation(data: Omit<UserCreateData, 'sendInvitation'>): Promise<UserInvitation | null> {
  const response = await httpClient.post<ApiResponse<UserInvitation>>(
    `${INVITATIONS_URL}/`,
    data
  );
  return response.data.data || null;
}

/**
 * Obtener invitaciones pendientes
 */
export async function fetchInvitations(): Promise<UserInvitation[]> {
  const response = await httpClient.get<ApiResponse<UserInvitation[]>>(
    `${INVITATIONS_URL}/`
  );
  return response.data.data || [];
}

/**
 * Cancelar invitación
 */
export async function cancelInvitation(id: string): Promise<boolean> {
  try {
    await httpClient.post(`${INVITATIONS_URL}/${id}/cancel/`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Reenviar invitación
 */
export async function resendInvitation(id: string): Promise<boolean> {
  try {
    await httpClient.post(`${INVITATIONS_URL}/${id}/resend/`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validar token de invitación
 */
export async function validateInvitationToken(token: string): Promise<UserInvitation | null> {
  const response = await httpClient.get<ApiResponse<UserInvitation>>(
    `${INVITATIONS_URL}/validate/`,
    { params: { token } }
  );
  return response.data.data || null;
}

/**
 * Aceptar invitación
 */
export async function acceptInvitation(data: AcceptInvitationData): Promise<{ user: User; tokens: { access: string; refresh: string } } | null> {
  const response = await httpClient.post<ApiResponse<{ user: User; access_token: string; refresh_token: string }>>(
    `${INVITATIONS_URL}/accept/`,
    data
  );
  
  if (response.data.data) {
    return {
      user: response.data.data.user,
      tokens: {
        access: response.data.data.access_token,
        refresh: response.data.data.refresh_token,
      },
    };
  }
  return null;
}

// =============================================================================
// ACTIVITY & SESSIONS
// =============================================================================

/**
 * Obtener actividad del usuario
 */
export async function fetchUserActivity(
  userId: string,
  limit: number = 50
): Promise<UserActivity[]> {
  const response = await httpClient.get<ApiResponse<UserActivity[]>>(
    `${BASE_URL}/${userId}/activity/`,
    { params: { limit } }
  );
  return response.data.data || [];
}

/**
 * Obtener sesiones activas del usuario
 */
export async function fetchUserSessions(): Promise<UserSession[]> {
  const response = await httpClient.get<ApiResponse<UserSession[]>>(
    `${BASE_URL}/me/sessions/`
  );
  return response.data.data || [];
}

/**
 * Cerrar sesión específica
 */
export async function terminateSession(sessionId: string): Promise<boolean> {
  try {
    await httpClient.post(`${BASE_URL}/me/sessions/${sessionId}/terminate/`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Cerrar todas las sesiones excepto la actual
 */
export async function terminateOtherSessions(): Promise<boolean> {
  try {
    await httpClient.post(`${BASE_URL}/me/sessions/terminate-others/`);
    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// STATS
// =============================================================================

/**
 * Obtener estadísticas de usuarios
 */
export async function fetchUserStats(): Promise<UserStats> {
  const response = await httpClient.get<ApiResponse<UserStats>>(
    `${BASE_URL}/stats/`
  );
  return response.data.data || {
    total: 0,
    active: 0,
    inactive: 0,
    pending: 0,
    byRole: [],
    newThisMonth: 0,
    activeToday: 0,
  };
}

// =============================================================================
// PROFILE
// =============================================================================

/**
 * Subir avatar
 */
export async function uploadAvatar(file: File): Promise<string | null> {
  const formData = new FormData();
  formData.append('avatar', file);
  
  try {
    const response = await httpClient.post<ApiResponse<{ url: string }>>(
      `${BASE_URL}/me/avatar/`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data.data?.url || null;
  } catch {
    return null;
  }
}

/**
 * Desactivar cuenta propia
 */
export async function deactivateAccount(reason?: string): Promise<boolean> {
  try {
    await httpClient.post(`${BASE_URL}/me/deactivate/`, { reason });
    return true;
  } catch {
    return false;
  }
}
