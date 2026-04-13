/**
 * @fileoverview Composable principal del módulo Users
 * @module @modules/users/composables/useUsers
 * 
 * Lógica de gestión de usuarios, roles, permisos y perfiles.
 */

import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { toast } from 'vue3-toastify';
import { useUsersStore } from '../stores/usersStore';
import type {
  User,
  UserRole,
  UserCreateData,
  UserUpdateData,
  ProfileUpdateData,
  ChangePasswordData,
  UserFilters,
} from '../types';

// =============================================================================
// MAIN COMPOSABLE
// =============================================================================

export function useUsers() {
  const store = useUsersStore();
  const {
    users,
    totalUsers,
    currentUser,
    selectedUser,
    roles,
    invitations,
    sessions,
    stats,
    isLoading,
    isProcessing,
    hasPermission,
    canManageUsers,
  } = storeToRefs(store);

  // Local state
  const filters = ref<UserFilters>({});
  const selectedUserId = ref<string | null>(null);

  // Getters
  const filteredUsers = computed(() => {
    let result = users.value;

    if (filters.value.status) {
      result = result.filter(u => u.status === filters.value.status);
    }

    if (filters.value.role) {
      result = result.filter(u => u.role === filters.value.role);
    }

    if (filters.value.search) {
      const search = filters.value.search.toLowerCase();
      result = result.filter(u => 
        u.fullName.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search)
      );
    }

    return result;
  });

  const userRoles = computed(() => roles.value);

  // =============================================================================
  // LIST & FILTER
  // =============================================================================

  /**
   * Cargar usuarios
   */
  async function loadUsers(): Promise<void> {
    await store.loadUsers(filters.value);
  }

  /**
   * Actualizar filtros
   */
  async function updateFilters(newFilters: UserFilters): Promise<void> {
    filters.value = { ...filters.value, ...newFilters };
    store.currentPage = 1;
    await loadUsers();
  }

  /**
   * Limpiar filtros
   */
  async function clearFilters(): Promise<void> {
    filters.value = {};
    store.currentPage = 1;
    await loadUsers();
  }

  /**
   * Cambiar página
   */
  async function changePage(page: number): Promise<void> {
    store.currentPage = page;
    await loadUsers();
  }

  // =============================================================================
  // USER MANAGEMENT
  // =============================================================================

  /**
   * Seleccionar usuario
   */
  async function selectUser(id: string | null): Promise<void> {
    selectedUserId.value = id;
    if (id) {
      await store.loadUserById(id);
    } else {
      store.selectedUser = null;
    }
  }

  /**
   * Crear usuario
   */
  async function createUser(data: UserCreateData): Promise<User | null> {
    return await store.createUser(data);
  }

  /**
   * Actualizar usuario seleccionado
   */
  async function updateUser(data: UserUpdateData): Promise<boolean> {
    if (!selectedUserId.value) return false;
    return await store.updateUser(selectedUserId.value, data);
  }

  /**
   * Cambiar rol de usuario
   */
  async function changeRole(userId: string, newRole: UserRole): Promise<boolean> {
    return await store.updateUser(userId, { role: newRole });
  }

  /**
   * Suspender usuario
   */
  async function suspendUser(userId: string): Promise<boolean> {
    return await store.suspendUser(userId);
  }

  /**
   * Activar usuario
   */
  async function activateUser(userId: string): Promise<boolean> {
    return await store.activateUser(userId);
  }

  /**
   * Eliminar usuario
   */
  async function deleteUser(userId: string): Promise<boolean> {
    const confirmed = confirm('¿Eliminar este usuario permanentemente?');
    if (!confirmed) return false;

    return await store.deleteUser(userId);
  }

  // =============================================================================
  // INVITATIONS
  // =============================================================================

  /**
   * Invitar usuario (crear + enviar email)
   */
  async function inviteUser(data: Omit<UserCreateData, 'sendInvitation'>): Promise<boolean> {
    const invitation = await store.createInvitation(data);
    return !!invitation;
  }

  /**
   * Cancelar invitación
   */
  async function cancelInvitation(invitationId: string): Promise<boolean> {
    return await store.cancelInvitation(invitationId);
  }

  /**
   * Cargar invitaciones pendientes
   */
  async function loadInvitations(): Promise<void> {
    await store.loadInvitations();
  }

  // =============================================================================
  // PROFILE (Current User)
  // =============================================================================

  /**
   * Actualizar perfil propio
   */
  async function updateProfile(data: ProfileUpdateData): Promise<boolean> {
    return await store.updateProfile(data);
  }

  /**
   * Cambiar contraseña
   */
  async function changePassword(data: ChangePasswordData): Promise<boolean> {
    const { useAuthStore } = await import('@/stores/auth');
    const authStore = useAuthStore();
    
    try {
      const success = await authStore.changePassword(data);
      if (success) {
        toast.success('Contraseña actualizada');
      }
      return success;
    } catch {
      toast.error('Error cambiando contraseña');
      return false;
    }
  }

  /**
   * Actualizar preferencias
   */
  async function updatePreferences(preferences: Record<string, unknown>): Promise<boolean> {
    return await updateProfile({ preferences });
  }

  // =============================================================================
  // SESSIONS
  // =============================================================================

  /**
   * Cargar sesiones activas
   */
  async function loadSessions(): Promise<void> {
    await store.loadSessions();
  }

  /**
   * Cerrar sesión específica
   */
  async function terminateSession(sessionId: string): Promise<boolean> {
    return await store.terminateSession(sessionId);
  }

  // =============================================================================
  // PERMISSIONS
  // =============================================================================

  /**
   * Verificar si tiene permiso específico
   */
  async function checkUserPermission(permissionCode: string): Promise<boolean> {
    return await store.checkPermission(permissionCode);
  }

  // =============================================================================
  // STATS
  // =============================================================================

  /**
   * Cargar estadísticas
   */
  async function loadStats(): Promise<void> {
    await store.loadStats();
  }

  // =============================================================================
  // INITIALIZATION
  // =============================================================================

  /**
   * Inicializar módulo
   */
  async function initialize(): Promise<void> {
    await Promise.all([
      store.loadCurrentUser(),
      store.loadRoles(),
      store.loadMyPermissions(),
    ]);
  }

  // =============================================================================
  // RETURN
  // =============================================================================

  return {
    // State
    users,
    totalUsers,
    currentUser,
    selectedUser,
    roles,
    invitations,
    sessions,
    stats,
    isLoading,
    isProcessing,
    filters,
    selectedUserId,
    
    // Getters
    filteredUsers,
    userRoles,
    hasPermission,
    canManageUsers,
    
    // List
    loadUsers,
    updateFilters,
    clearFilters,
    changePage,
    
    // Users
    selectUser,
    createUser,
    updateUser,
    changeRole,
    suspendUser,
    activateUser,
    deleteUser,
    
    // Invitations
    inviteUser,
    cancelInvitation,
    loadInvitations,
    
    // Profile
    updateProfile,
    changePassword,
    updatePreferences,
    
    // Sessions
    loadSessions,
    terminateSession,
    
    // Permissions
    checkUserPermission,
    
    // Stats
    loadStats,
    
    // Init
    initialize,
  };
}

// =============================================================================
// UTILITY COMPOSABLES
// =============================================================================

/**
 * Composable simplificado para gestión de perfil
 */
export function useProfile() {
  const store = useUsersStore();
  const { currentUser, isProcessing } = storeToRefs(store);

  async function update(data: ProfileUpdateData): Promise<boolean> {
    return await store.updateProfile(data);
  }

  async function updateAvatar(file: File): Promise<boolean> {
    const { useAuthStore } = await import('@/stores/auth');
    const authStore = useAuthStore();
    return await authStore.updateAvatar(file);
  }

  return {
    user: currentUser,
    isProcessing,
    update,
    updateAvatar,
    preferences: computed(() => currentUser.value?.preferences),
  };
}

/**
 * Composable para selector de usuario
 */
export function useUserSelector() {
  const store = useUsersStore();
  const { users, isLoading } = storeToRefs(store);

  const selectedId = ref<string | null>(null);

  // Auto-cargar si no hay usuarios
  if (users.value.length === 0) {
    store.loadUsers();
  }

  const options = computed(() => 
    users.value.map(u => ({
      id: u.id,
      label: u.fullName,
      sublabel: u.email,
      avatar: u.avatarUrl,
    }))
  );

  return {
    options,
    isLoading,
    selectedId,
    select: (id: string) => { selectedId.value = id; },
    clear: () => { selectedId.value = null; },
    refresh: () => store.loadUsers(),
    selected: computed(() => 
      selectedId.value ? store.getUserById(selectedId.value) : null
    ),
  };
}
