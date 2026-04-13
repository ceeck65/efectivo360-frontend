/**
 * @fileoverview Store de Pinia para Users (Gestión de Usuarios)
 * @module @modules/users/stores/usersStore
 * 
 * Estado reactivo de usuarios, roles, invitaciones y sesiones.
 */

import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { toast } from 'vue3-toastify';
import type {
  User,
  UserRole,
  Role,
  Permission,
  UserCreateData,
  UserUpdateData,
  ProfileUpdateData,
  UserInvitation,
  UserFilters,
  UserActivity,
  UserSession,
  UserStats,
} from '../types';
import * as usersService from '../services/users.service';

export const useUsersStore = defineStore('users', () => {
  // ==========================================================================
  // STATE
  // ==========================================================================

  // Usuarios
  const users = ref<User[]>([]);
  const totalUsers = ref(0);
  const currentPage = ref(1);
  const pageSize = ref(20);
  
  // Usuario actual (autenticado)
  const currentUser = ref<User | null>(null);
  const currentUserPermissions = ref<Permission[]>([]);
  
  // Usuario seleccionado (para edición/ver)
  const selectedUser = ref<User | null>(null);
  
  // Roles
  const roles = ref<Role[]>([]);
  
  // Invitaciones
  const invitations = ref<UserInvitation[]>([]);
  
  // Sesiones
  const sessions = ref<UserSession[]>([]);
  
  // Activity
  const userActivity = ref<UserActivity[]>([]);
  
  // Stats
  const stats = ref<UserStats | null>(null);
  
  // UI State
  const isLoading = ref(false);
  const isProcessing = ref(false);

  // ==========================================================================
  // GETTERS
  // ==========================================================================

  const activeUsers = computed(() => 
    users.value.filter(u => u.status === 'active')
  );

  const usersByRole = computed(() => (role: UserRole) => 
    users.value.filter(u => u.role === role)
  );

  const getUserById = computed(() => (id: string) => 
    users.value.find(u => u.id === id) || null
  );

  const getRoleByCode = computed(() => (code: UserRole) => 
    roles.value.find(r => r.code === code) || null
  );

  const hasPermission = computed(() => (permissionCode: string) => 
    currentUserPermissions.value.some(p => p.code === permissionCode)
  );

  const canManageUsers = computed(() => 
    currentUser.value?.role === 'superadmin' || 
    currentUser.value?.role === 'admin'
  );

  const isSuperAdmin = computed(() => 
    currentUser.value?.role === 'superadmin'
  );

  const pendingInvitations = computed(() => 
    invitations.value.filter(i => i.status === 'pending')
  );

  // ==========================================================================
  // ACTIONS - USERS LIST
  // ==========================================================================

  /**
   * Cargar listado de usuarios
   */
  async function loadUsers(filters?: UserFilters): Promise<void> {
    isLoading.value = true;

    try {
      const response = await usersService.fetchUsers(
        filters,
        currentPage.value,
        pageSize.value
      );
      users.value = response.results;
      totalUsers.value = response.count;
    } catch {
      toast.error('Error cargando usuarios');
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Cargar usuario actual (me)
   */
  async function loadCurrentUser(): Promise<boolean> {
    try {
      const user = await usersService.fetchCurrentUser();
      if (user) {
        currentUser.value = user;
        return true;
      }
    } catch {
      console.error('Error cargando usuario actual');
    }
    return false;
  }

  /**
   * Cargar usuario por ID
   */
  async function loadUserById(id: string): Promise<boolean> {
    isLoading.value = true;

    try {
      const user = await usersService.fetchUserById(id);
      if (user) {
        selectedUser.value = user;
        return true;
      }
    } catch {
      toast.error('Error cargando usuario');
    } finally {
      isLoading.value = false;
    }
    return false;
  }

  // ==========================================================================
  // ACTIONS - CRUD
  // ==========================================================================

  /**
   * Crear usuario
   */
  async function createUser(data: UserCreateData): Promise<User | null> {
    isProcessing.value = true;

    try {
      const user = await usersService.createUser(data);
      if (user) {
        users.value.unshift(user);
        toast.success('Usuario creado exitosamente');
        return user;
      }
    } catch (err: any) {
      toast.error(err.message || 'Error creando usuario');
    } finally {
      isProcessing.value = false;
    }
    return null;
  }

  /**
   * Actualizar usuario
   */
  async function updateUser(id: string, data: UserUpdateData): Promise<boolean> {
    isProcessing.value = true;

    try {
      const updated = await usersService.updateUser(id, data);
      if (updated) {
        const index = users.value.findIndex(u => u.id === id);
        if (index !== -1) {
          users.value[index] = { ...users.value[index], ...updated };
        }
        if (selectedUser.value?.id === id) {
          selectedUser.value = { ...selectedUser.value, ...updated };
        }
        toast.success('Usuario actualizado');
        return true;
      }
    } catch (err: any) {
      toast.error(err.message || 'Error actualizando usuario');
    } finally {
      isProcessing.value = false;
    }
    return false;
  }

  /**
   * Actualizar perfil propio
   */
  async function updateProfile(data: ProfileUpdateData): Promise<boolean> {
    isProcessing.value = true;

    try {
      const updated = await usersService.updateProfile(data);
      if (updated) {
        currentUser.value = { ...currentUser.value, ...updated } as User;
        toast.success('Perfil actualizado');
        return true;
      }
    } catch (err: any) {
      toast.error(err.message || 'Error actualizando perfil');
    } finally {
      isProcessing.value = false;
    }
    return false;
  }

  /**
   * Eliminar usuario
   */
  async function deleteUser(id: string): Promise<boolean> {
    try {
      const success = await usersService.deleteUser(id);
      if (success) {
        users.value = users.value.filter(u => u.id !== id);
        toast.success('Usuario eliminado');
      }
      return success;
    } catch {
      toast.error('Error eliminando usuario');
      return false;
    }
  }

  /**
   * Suspender usuario
   */
  async function suspendUser(id: string): Promise<boolean> {
    return await updateUser(id, { status: 'suspended' });
  }

  /**
   * Activar usuario
   */
  async function activateUser(id: string): Promise<boolean> {
    return await updateUser(id, { status: 'active' });
  }

  // ==========================================================================
  // ACTIONS - ROLES
  // ==========================================================================

  /**
   * Cargar roles
   */
  async function loadRoles(): Promise<void> {
    try {
      roles.value = await usersService.fetchRoles();
    } catch {
      console.error('Error cargando roles');
    }
  }

  /**
   * Cargar permisos del usuario actual
   */
  async function loadMyPermissions(): Promise<void> {
    try {
      currentUserPermissions.value = await usersService.fetchMyPermissions();
    } catch {
      console.error('Error cargando permisos');
    }
  }

  /**
   * Verificar permiso específico
   */
  async function checkPermission(permissionCode: string): Promise<boolean> {
    return await usersService.checkPermission(permissionCode);
  }

  // ==========================================================================
  // ACTIONS - INVITATIONS
  // ==========================================================================

  /**
   * Crear invitación
   */
  async function createInvitation(data: Omit<UserCreateData, 'sendInvitation'>): Promise<UserInvitation | null> {
    isProcessing.value = true;

    try {
      const invitation = await usersService.createInvitation(data);
      if (invitation) {
        invitations.value.unshift(invitation);
        toast.success('Invitación enviada');
        return invitation;
      }
    } catch (err: any) {
      toast.error(err.message || 'Error enviando invitación');
    } finally {
      isProcessing.value = false;
    }
    return null;
  }

  /**
   * Cargar invitaciones
   */
  async function loadInvitations(): Promise<void> {
    try {
      invitations.value = await usersService.fetchInvitations();
    } catch {
      console.error('Error cargando invitaciones');
    }
  }

  /**
   * Cancelar invitación
   */
  async function cancelInvitation(id: string): Promise<boolean> {
    try {
      const success = await usersService.cancelInvitation(id);
      if (success) {
        const index = invitations.value.findIndex(i => i.id === id);
        if (index !== -1) {
          invitations.value[index].status = 'cancelled';
        }
        toast.success('Invitación cancelada');
      }
      return success;
    } catch {
      toast.error('Error cancelando invitación');
      return false;
    }
  }

  // ==========================================================================
  // ACTIONS - SESSIONS & ACTIVITY
  // ==========================================================================

  /**
   * Cargar sesiones
   */
  async function loadSessions(): Promise<void> {
    try {
      sessions.value = await usersService.fetchUserSessions();
    } catch {
      console.error('Error cargando sesiones');
    }
  }

  /**
   * Cerrar sesión
   */
  async function terminateSession(sessionId: string): Promise<boolean> {
    try {
      const success = await usersService.terminateSession(sessionId);
      if (success) {
        sessions.value = sessions.value.filter(s => s.id !== sessionId);
        toast.success('Sesión cerrada');
      }
      return success;
    } catch {
      toast.error('Error cerrando sesión');
      return false;
    }
  }

  /**
   * Cargar actividad
   */
  async function loadUserActivity(userId: string): Promise<void> {
    try {
      userActivity.value = await usersService.fetchUserActivity(userId);
    } catch {
      console.error('Error cargando actividad');
    }
  }

  // ==========================================================================
  // ACTIONS - STATS
  // ==========================================================================

  /**
   * Cargar estadísticas
   */
  async function loadStats(): Promise<void> {
    try {
      stats.value = await usersService.fetchUserStats();
    } catch {
      console.error('Error cargando estadísticas');
    }
  }

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    // State
    users,
    totalUsers,
    currentPage,
    pageSize,
    currentUser,
    currentUserPermissions,
    selectedUser,
    roles,
    invitations,
    sessions,
    userActivity,
    stats,
    isLoading,
    isProcessing,
    
    // Getters
    activeUsers,
    usersByRole,
    getUserById,
    getRoleByCode,
    hasPermission,
    canManageUsers,
    isSuperAdmin,
    pendingInvitations,
    
    // Users
    loadUsers,
    loadCurrentUser,
    loadUserById,
    createUser,
    updateUser,
    updateProfile,
    deleteUser,
    suspendUser,
    activateUser,
    
    // Roles
    loadRoles,
    loadMyPermissions,
    checkPermission,
    
    // Invitations
    createInvitation,
    loadInvitations,
    cancelInvitation,
    
    // Sessions
    loadSessions,
    terminateSession,
    loadUserActivity,
    
    // Stats
    loadStats,
  };
});
