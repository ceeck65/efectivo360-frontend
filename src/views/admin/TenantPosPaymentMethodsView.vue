<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <RouterLink
          to="/admin"
          class="flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all"
        >
          <ArrowLeft class="h-5 w-5" />
        </RouterLink>
        <div>
          <h1 class="text-xl font-semibold text-slate-900 tracking-tight">Mis Métodos de Cobro</h1>
          <p class="text-sm text-slate-500">Configura cómo tus clientes te pagan en el punto de venta</p>
        </div>
      </div>

      <button @click="handleCreate" class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm">
        <Plus class="h-4 w-4" />
        Agregar Método
      </button>
    </div>

    <!-- Info Card -->
    <div class="bg-amber-50 rounded-xl border border-amber-200 p-4">
      <div class="flex items-start gap-3">
        <AlertCircle class="h-5 w-5 text-amber-600 mt-0.5" />
        <div class="text-sm text-amber-800">
          <p class="font-medium mb-1">Seguridad de datos</p>
          <p class="text-amber-700">
            Los datos bancarios que configures aquí son visibles SOLO para ti y tus clientes
            al momento de pagar. Otros tenants no pueden ver esta información.
          </p>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="space-y-4">
      <div v-for="i in 5" :key="i" class="h-16 animate-pulse bg-slate-200 rounded-lg" />
    </div>

    <!-- Empty State -->
    <div v-else-if="paymentMethods.length === 0" class="bg-white rounded-xl border border-dashed border-slate-300 p-16 text-center">
      <div class="mx-auto mb-6 flex h-12 w-12 items-center justify-center">
        <Wallet class="h-10 w-10 text-slate-300 stroke-[1.5]" />
      </div>
      <h3 class="text-base font-medium text-slate-900 mb-1">No tienes métodos de cobro</h3>
      <p class="text-sm text-slate-500 mb-6">
        Agrega al menos un método para que tus clientes puedan pagarte.
      </p>
      <button @click="handleCreate" class="inline-flex items-center justify-center gap-2 h-10 px-4 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors">
        <Plus class="h-4 w-4" />
        Agregar primer método
      </button>
    </div>

    <!-- Methods Table -->
    <div v-else class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50/50">
            <tr>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Método</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Configuración</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="method in paymentMethods" :key="method.id" class="border-t border-slate-100 hover:bg-slate-50/30 transition-colors">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <img
                    v-if="method.template?.logo"
                    :src="method.template.logo"
                    :alt="method.template.name"
                    class="h-10 w-10 rounded-lg object-contain bg-white border border-slate-100"
                  />
                  <div
                    v-else
                    class="flex h-10 w-10 items-center justify-center rounded-lg text-white"
                    :style="{ backgroundColor: method.template?.brand_color || '#3b82f6' }"
                  >
                    <Wallet class="h-5 w-5" />
                  </div>
                  <div>
                    <div class="font-medium text-slate-900">{{ method.display_name }}</div>
                    <code class="text-xs text-slate-500">{{ method.template?.name }}</code>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-wrap gap-1">
                  <span
                    :class="[
                      'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                      method.is_active
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-700'
                    ]"
                  >
                    {{ method.is_active ? 'Activo' : 'Inactivo' }}
                  </span>
                  <span v-if="method.requires_confirmation" class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-700">
                    Requiere confirmación
                  </span>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="key in Object.keys(method.account_data || {})"
                    :key="key"
                    class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600"
                  >
                    {{ key }}
                  </span>
                  <span v-if="Object.keys(method.account_data || {}).length === 0" class="text-xs text-slate-400">
                    Sin datos configurados
                  </span>
                </div>
                <p v-if="method.display_instructions" class="mt-1 text-xs text-slate-500 line-clamp-1">
                  {{ method.display_instructions }}
                </p>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-1">
                  <button
                    @click="handleEdit(method)"
                    class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                    title="Editar"
                  >
                    <Pencil class="h-4 w-4" />
                  </button>
                  <button
                    @click="handleDelete(method)"
                    class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title="Eliminar"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Form Modal -->
    <TenantPaymentMethodModal
      :is-open="modalOpen"
      :method="editingMethod"
      @close="modalOpen = false"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { ArrowLeft, Plus, Wallet, Pencil, Trash2, AlertCircle } from 'lucide-vue-next';
import { useTenantPaymentMethods } from '@/composables/useTenantPaymentMethods';
import { useNotify } from '@/composables/useNotify';
import type { TenantPaymentMethod, TenantPaymentMethodFormData } from '@/types';
import TenantPaymentMethodModal from '@/components/payment-methods/TenantPaymentMethodModal.vue';
import Swal from 'sweetalert2';

const {
  paymentMethods,
  isLoading,
  loadPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} = useTenantPaymentMethods();
const { success: notifySuccess, error: notifyError } = useNotify();

const modalOpen = ref(false);
const editingMethod = ref<TenantPaymentMethod | null>(null);

onMounted(() => {
  loadPaymentMethods();
});

const handleCreate = () => {
  editingMethod.value = null;
  modalOpen.value = true;
};

const handleEdit = (method: TenantPaymentMethod) => {
  editingMethod.value = method;
  modalOpen.value = true;
};

const handleDelete = async (method: TenantPaymentMethod) => {
  const result = await Swal.fire({
    title: '¿Eliminar método?',
    text: `Se eliminará "${method.display_name}"`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#dc2626',
  });

  if (!result.isConfirmed) return;

  try {
    await deletePaymentMethod(method.id);
    notifySuccess(`Método "${method.display_name}" eliminado`);
  } catch (err: any) {
    notifyError(err?.message || 'Error eliminando método');
  }
};

const handleSave = async (data: TenantPaymentMethodFormData) => {
  try {
    if (editingMethod.value) {
      await updatePaymentMethod(editingMethod.value.id, data);
      notifySuccess(`Método "${data.display_name}" actualizado`);
    } else {
      await createPaymentMethod(data);
      notifySuccess(`Método "${data.display_name}" creado`);
    }
    modalOpen.value = false;
    await loadPaymentMethods();
  } catch (err: any) {
    notifyError(err?.message || 'Error guardando método');
    throw err;
  }
};
</script>
