<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { X, Loader2 } from 'lucide-vue-next';
import { useCustomers, type Customer } from '@/composables/useCustomers';
import { parseApiError } from '@/utils/parseApiError';
import { useAuthStore } from '@/stores/auth';

const props = defineProps<{
  customer?: Customer | null;
}>();

const emit = defineEmits<{
  close: [];
  saved: [customer: Customer];
}>();

const { createCustomer, updateCustomer } = useCustomers();

const isEdit = computed(() => !!props.customer);

// Mismo criterio que apps.accounts.permissions.IsOwnerOrManagerOrTenantAdmin en el
// backend (que ya rechaza el PATCH si estos campos cambian sin ese rol): al crear un
// cliente nuevo sí se permite fijar el límite inicial (perform_create no está gateado),
// pero editar el límite de uno existente sí requiere Admin/Owner/Manager.
const authStore = useAuthStore();
const canManageCredit = computed(() => {
  if (!isEdit.value) return true;
  const u = authStore.user;
  if (!u) return false;
  if (u.is_superuser) return true;
  if (u.role === 'OWNER' || u.role === 'MANAGER') return true;
  return u.user_type === 'ADMIN';
});

const DOC_TYPES = [
  { value: 'V', label: 'V - Venezolano' },
  { value: 'E', label: 'E - Extranjero' },
  { value: 'J', label: 'J - Jurídico (RIF empresa)' },
  { value: 'G', label: 'G - Gubernamental' },
  { value: 'P', label: 'P - Pasaporte' },
] as const;

const form = reactive({
  docType: 'V' as string,
  docNumber: '',
  fullName: '',
  phone: '',
  email: '',
  address: '',
  creditLimitUsd: '0.00',
  creditDays: 15,
});

const submitting = ref(false);
const submitError = ref<string | null>(null);
const touched = reactive({ docNumber: false, fullName: false, email: false });

function splitIdentityDocument(identity: string): { type: string; number: string } {
  const match = /^([VEJGP])-(.+)$/i.exec(identity || '');
  if (!match) return { type: 'V', number: identity || '' };
  return { type: match[1].toUpperCase(), number: match[2] };
}

onMounted(() => {
  if (props.customer) {
    const { type, number } = splitIdentityDocument(props.customer.identity_document);
    form.docType = type;
    form.docNumber = number;
    // El modelo separa first_name/last_name; el formulario usa un solo campo
    // "Nombre / Razón Social" (así lo pide el flujo de negocio, incluyendo
    // clientes jurídicos). Al guardar, todo el nombre va a first_name.
    form.fullName = [props.customer.first_name, props.customer.last_name].filter(Boolean).join(' ').trim();
    form.phone = props.customer.phone || '';
    form.email = props.customer.email || '';
    form.address = props.customer.address || '';
    form.creditLimitUsd = props.customer.credit_limit_usd ?? '0.00';
    form.creditDays = props.customer.credit_days ?? 15;
  }
});

// ── Validaciones reactivas ──
const errors = computed(() => {
  const e: Record<string, string> = {};
  if (!/^\d{7,9}$/.test(form.docNumber.trim())) {
    e.docNumber = 'Debe tener entre 7 y 9 dígitos (sin puntos ni guiones)';
  }
  if (!form.fullName.trim() || form.fullName.trim().length < 3) {
    e.fullName = 'Ingresa el nombre completo o razón social';
  }
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    e.email = 'Correo inválido';
  }
  if (form.creditLimitUsd !== '' && Number(form.creditLimitUsd) < 0) {
    e.creditLimitUsd = 'No puede ser negativo';
  }
  if (Number.isNaN(Number(form.creditDays)) || Number(form.creditDays) < 0) {
    e.creditDays = 'No puede ser negativo';
  }
  return e;
});

const isValid = computed(() => Object.keys(errors.value).length === 0);

async function onSubmit() {
  touched.docNumber = true;
  touched.fullName = true;
  touched.email = true;
  if (!isValid.value || submitting.value) return;

  submitting.value = true;
  submitError.value = null;

  const payload = {
    identity_document: `${form.docType}-${form.docNumber.trim()}`,
    first_name: form.fullName.trim(),
    last_name: '',
    phone: form.phone.trim(),
    email: form.email.trim(),
    address: form.address.trim(),
    credit_limit_usd: form.creditLimitUsd || '0.00',
    credit_days: Number(form.creditDays),
  };

  try {
    const result = isEdit.value && props.customer
      ? await updateCustomer(props.customer.id, {
          // identity_document es de solo lectura tras la creación (lo aplica el backend).
          first_name: payload.first_name,
          last_name: payload.last_name,
          phone: payload.phone,
          email: payload.email,
          address: payload.address,
          credit_limit_usd: payload.credit_limit_usd,
          credit_days: payload.credit_days,
        })
      : await createCustomer(payload);

    if (result) {
      emit('saved', result);
    } else {
      submitError.value = 'No se pudo guardar el cliente.';
    }
  } catch (e) {
    submitError.value = parseApiError(e);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4" @click.self="emit('close')">
    <div class="bg-white dark:bg-[#141824] w-full max-w-lg rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] border border-slate-200/80 dark:border-white/[0.08] relative z-10 flex flex-col overflow-hidden text-slate-800 dark:text-white">

      <div class="p-4 border-b border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] flex justify-between items-center">
        <h3 class="text-sm font-black uppercase tracking-wider">{{ isEdit ? 'Editar Cliente' : 'Nuevo Cliente' }}</h3>
        <button @click="emit('close')" class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-white/[0.06] dark:hover:text-white transition-colors">
          <X :size="18" />
        </button>
      </div>

      <form @submit.prevent="onSubmit" class="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
        <div v-if="submitError" class="bg-rose-50 border border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/30 rounded-xl px-3 py-2.5">
          <p class="text-rose-600 dark:text-rose-300 text-xs font-medium">{{ submitError }}</p>
        </div>

        <!-- Documento -->
        <div>
          <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Documento de Identidad</label>
          <div class="flex gap-2">
            <select
              v-model="form.docType"
              :disabled="isEdit"
              class="h-10 px-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1320] text-sm w-40 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option v-for="dt in DOC_TYPES" :key="dt.value" :value="dt.value">{{ dt.label }}</option>
            </select>
            <input
              v-model="form.docNumber"
              @blur="touched.docNumber = true"
              :disabled="isEdit"
              type="text"
              inputmode="numeric"
              placeholder="12345678"
              class="flex-1 h-10 px-3 rounded-xl border text-sm bg-white dark:bg-[#0f1320] outline-none focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed"
              :class="touched.docNumber && errors.docNumber ? 'border-rose-400 focus:ring-rose-500/30' : 'border-slate-200 dark:border-white/[0.08] focus:ring-blue-500/30 focus:border-blue-400'"
            />
          </div>
          <p v-if="isEdit" class="text-[10px] text-slate-400 mt-1">El documento no se puede modificar luego de creado.</p>
          <p v-else-if="touched.docNumber && errors.docNumber" class="text-[10px] text-rose-500 mt-1">{{ errors.docNumber }}</p>
        </div>

        <!-- Nombre -->
        <div>
          <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nombre Completo / Razón Social</label>
          <input
            v-model="form.fullName"
            @blur="touched.fullName = true"
            type="text"
            placeholder="Ej: Juan Pérez o Distribuidora XYZ, C.A."
            class="w-full h-10 px-3 rounded-xl border text-sm bg-white dark:bg-[#0f1320] outline-none focus:ring-2"
            :class="touched.fullName && errors.fullName ? 'border-rose-400 focus:ring-rose-500/30' : 'border-slate-200 dark:border-white/[0.08] focus:ring-blue-500/30 focus:border-blue-400'"
          />
          <p v-if="touched.fullName && errors.fullName" class="text-[10px] text-rose-500 mt-1">{{ errors.fullName }}</p>
        </div>

        <!-- Teléfono / Email -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Teléfono / WhatsApp</label>
            <input v-model="form.phone" type="text" placeholder="0412-1234567"
              class="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1320] text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
          </div>
          <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Correo Electrónico</label>
            <input
              v-model="form.email"
              @blur="touched.email = true"
              type="email"
              placeholder="cliente@correo.com"
              class="w-full h-10 px-3 rounded-xl border text-sm bg-white dark:bg-[#0f1320] outline-none focus:ring-2"
              :class="touched.email && errors.email ? 'border-rose-400 focus:ring-rose-500/30' : 'border-slate-200 dark:border-white/[0.08] focus:ring-blue-500/30 focus:border-blue-400'"
            />
            <p v-if="touched.email && errors.email" class="text-[10px] text-rose-500 mt-1">{{ errors.email }}</p>
          </div>
        </div>

        <!-- Dirección -->
        <div>
          <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Dirección Física</label>
          <textarea v-model="form.address" rows="2" placeholder="Dirección completa"
            class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1320] text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none" />
        </div>

        <!-- Crédito -->
        <div class="grid grid-cols-2 gap-3 pt-1 border-t border-dashed border-slate-200 dark:border-white/[0.1]">
          <div class="pt-3">
            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Límite de Crédito (USD)</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input
                v-model="form.creditLimitUsd"
                type="number" step="0.01" min="0"
                :disabled="!canManageCredit"
                class="w-full h-10 pl-6 pr-3 rounded-xl border text-sm bg-white dark:bg-[#0f1320] outline-none focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed"
                :class="errors.creditLimitUsd ? 'border-rose-400 focus:ring-rose-500/30' : 'border-slate-200 dark:border-white/[0.08] focus:ring-blue-500/30 focus:border-blue-400'"
              />
            </div>
            <p v-if="errors.creditLimitUsd" class="text-[10px] text-rose-500 mt-1">{{ errors.creditLimitUsd }}</p>
          </div>
          <div class="pt-3">
            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Días de Crédito</label>
            <input
              v-model.number="form.creditDays"
              type="number" step="1" min="0"
              :disabled="!canManageCredit"
              class="w-full h-10 px-3 rounded-xl border text-sm bg-white dark:bg-[#0f1320] outline-none focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed"
              :class="errors.creditDays ? 'border-rose-400 focus:ring-rose-500/30' : 'border-slate-200 dark:border-white/[0.08] focus:ring-blue-500/30 focus:border-blue-400'"
            />
            <p v-if="errors.creditDays" class="text-[10px] text-rose-500 mt-1">{{ errors.creditDays }}</p>
          </div>
          <p v-if="!canManageCredit" class="col-span-2 text-[10px] text-slate-400 -mt-1">
            Solo Admin/Owner puede modificar el crédito de un cliente existente.
          </p>
        </div>
      </form>

      <div class="p-3 border-t border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] flex justify-end gap-2">
        <button @click="emit('close')" :disabled="submitting"
          class="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] disabled:opacity-50 transition-colors">
          Cancelar
        </button>
        <button @click="onSubmit" :disabled="submitting"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors">
          <Loader2 v-if="submitting" :size="14" class="animate-spin" />
          {{ isEdit ? 'Guardar Cambios' : 'Crear Cliente' }}
        </button>
      </div>
    </div>
  </div>
</template>
