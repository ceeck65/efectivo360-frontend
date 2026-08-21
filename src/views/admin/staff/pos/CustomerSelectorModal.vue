<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue';
import { X, Search, SearchX, UserPlus, Loader2, User, Phone } from 'lucide-vue-next';
import { useCustomers, type Customer } from '@/composables/useCustomers';
import RifInput from '@/components/shared/RifInput.vue';
import PhoneInput from '@/components/shared/PhoneInput.vue';

const emit = defineEmits<{
  select: [customer: Customer | null];
  close: [];
}>();

const { customers, loading, error, fetchCustomers, createCustomer } = useCustomers();

const MIN_SEARCH_LENGTH = 2;

// ── Búsqueda con debounce (search-driven: sin carga inicial) ──
const search = ref('');
const hasSearched = ref(false);
const searchInput = ref<HTMLInputElement | null>(null);
let searchTimer: ReturnType<typeof setTimeout> | null = null;

const isIdle = computed(() => search.value.trim().length < MIN_SEARCH_LENGTH);

function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer);
  const term = search.value.trim();
  if (term.length < MIN_SEARCH_LENGTH) {
    customers.value = [];
    hasSearched.value = false;
    return;
  }
  searchTimer = setTimeout(() => {
    hasSearched.value = true;
    fetchCustomers(term);
  }, 300);
}

function pick(customer: Customer) {
  emit('select', customer);
}

function pickConsumidorFinal() {
  emit('select', null);
}

function initials(c: Customer): string {
  const first = (c.first_name || '').trim();
  const last = (c.last_name || '').trim();
  if (first && last) return (first[0] + last[0]).toUpperCase();
  if (first) return first.slice(0, 2).toUpperCase();
  return '??';
}

function displayName(c: Customer): string {
  return [c.first_name, c.last_name].filter(Boolean).join(' ') || 'Sin nombre';
}

function badgeFor(c: Customer): { text: string; class: string } | null {
  const debt = Number(c.saldo_deudor_usd);
  if (debt > 0) {
    return { text: `Debe $${debt.toFixed(2)}`, class: 'text-rose-600 bg-rose-50' };
  }
  const limit = Number(c.credit_limit_usd);
  if (limit > 0) {
    return { text: `Límite: $${limit.toFixed(2)}`, class: 'text-blue-600 bg-blue-50' };
  }
  return null;
}

// ── Registro rápido de nuevo cliente ──
const showCreateForm = ref(false);
const fullNameInput = ref<HTMLInputElement | null>(null);
const form = ref({
  identityDocument: 'J',
  fullName: '',
  phone: '',
  address: '',
});
const submitting = ref(false);
const formError = ref<string | null>(null);

function toggleCreateForm() {
  showCreateForm.value = !showCreateForm.value;
  formError.value = null;
}

// Prefill el formulario de registro con el término buscado sin resultados.
function openCreateFormFromSearch() {
  const term = search.value.trim();
  const docMatch = term.match(/^([VEJPG])-?(\d{5,9})$/i);
  if (docMatch) {
    form.value.identityDocument = `${docMatch[1].toUpperCase()}${docMatch[2]}`;
  } else if (/^\d{5,9}$/.test(term)) {
    form.value.identityDocument = `V${term}`;
  } else {
    form.value.fullName = term;
  }
  showCreateForm.value = true;
  formError.value = null;
  nextTick(() => fullNameInput.value?.focus());
}

async function submitNewCustomer() {
  if (!form.value.fullName.trim() || !form.value.identityDocument.trim()) {
    formError.value = 'Documento y nombre / razón social son obligatorios.';
    return;
  }
  submitting.value = true;
  formError.value = null;
  try {
    const created = await createCustomer({
      identity_document: form.value.identityDocument.trim(),
      first_name: form.value.fullName.trim(),
      last_name: '',
      phone: form.value.phone.trim(),
      address: form.value.address.trim(),
    });
    if (created) {
      emit('select', created);
    } else {
      formError.value = error.value || 'No se pudo registrar el cliente.';
    }
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  nextTick(() => searchInput.value?.focus());
});
</script>

<template>
  <div class="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4" @click.self="emit('close')">
    <div class="bg-white w-full max-w-md rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] border border-slate-200/80 relative z-10 flex flex-col overflow-hidden text-slate-800 max-h-[85vh]">

      <div class="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
        <div>
          <h3 class="text-sm font-black uppercase tracking-wider text-slate-800">Seleccionar Cliente</h3>
          <p class="text-[10px] text-slate-400 font-medium">Busca por RIF/CI, nombre o teléfono, o registra uno nuevo</p>
        </div>
        <button @click="emit('close')" class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
          <X :size="18" />
        </button>
      </div>

      <!-- Consumidor Final + Buscador (fijos) -->
      <div class="p-4 pb-3 space-y-3 shrink-0">
        <button @click="pickConsumidorFinal"
          class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-colors text-left">
          <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
            <User :size="16" class="text-slate-400" />
          </div>
          <span class="text-sm font-bold text-slate-700">Consumidor Final</span>
        </button>

        <div class="relative">
          <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            ref="searchInput"
            v-model="search"
            @input="onSearchInput"
            type="text"
            autofocus
            placeholder="Escribe el RIF, Cédula, Nombre o Teléfono…"
            class="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
          />
        </div>
      </div>

      <!-- Resultados (área con scroll propio) -->
      <div class="px-4 flex-1 overflow-y-auto min-h-0">
        <div class="space-y-1.5 min-h-[120px]">
          <!-- Estado inicial: sin texto en buscador -->
          <div v-if="isIdle" class="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <Search :size="22" class="text-slate-300" />
            <p class="text-xs text-slate-400 font-medium max-w-[220px]">
              Escribe el RIF, Cédula, Nombre o Teléfono para buscar cliente…
            </p>
          </div>

          <!-- Estado cargando: skeleton -->
          <div v-else-if="loading" class="space-y-1.5">
            <div v-for="i in 3" :key="i" class="animate-pulse flex items-center gap-2.5 px-3 py-2 rounded-xl border border-slate-100">
              <div class="w-8 h-8 rounded-full bg-slate-200 shrink-0"></div>
              <div class="flex-1 space-y-1.5">
                <div class="h-2.5 w-2/3 bg-slate-200 rounded"></div>
                <div class="h-2 w-1/3 bg-slate-200 rounded"></div>
              </div>
            </div>
          </div>

          <!-- Estado sin resultados -->
          <div v-else-if="customers.length === 0" class="flex flex-col items-center gap-2.5 py-6 text-center">
            <SearchX :size="22" class="text-slate-300" />
            <p class="text-xs text-slate-400 font-medium max-w-[240px]">
              No se encontró ningún cliente registrado con ese término
            </p>
            <button @click="openCreateFormFromSearch"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors">
              <UserPlus :size="13" /> Registrar "{{ search.trim() }}" como Nuevo Cliente
            </button>
          </div>

          <!-- Resultados -->
          <button
            v-else
            v-for="c in customers"
            :key="c.id"
            @click="pick(c)"
            class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-colors text-left"
          >
            <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 text-[11px] font-black">
              {{ initials(c) }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-xs font-bold text-slate-800 truncate">{{ displayName(c) }}</p>
              <div class="flex items-center gap-2 mt-0.5">
                <span class="text-[10px] text-slate-500 font-mono font-semibold">{{ c.identity_document }}</span>
                <span v-if="c.phone" class="inline-flex items-center gap-0.5 text-[10px] text-slate-400">
                  <Phone :size="10" /> {{ c.phone }}
                </span>
              </div>
            </div>
            <span v-if="badgeFor(c)" :class="badgeFor(c)!.class" class="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {{ badgeFor(c)!.text }}
            </span>
            <span class="shrink-0 text-[10px] font-bold text-blue-600">Seleccionar</span>
          </button>
        </div>
      </div>

      <!-- Registrar nuevo cliente (fijo en la parte inferior) -->
      <div class="p-4 pt-3 border-t border-dashed border-slate-200 shrink-0 max-h-[45vh] overflow-y-auto">
        <button @click="toggleCreateForm"
          class="w-full inline-flex items-center justify-center gap-1.5 h-10 rounded-xl text-xs font-bold border transition-colors"
          :class="showCreateForm ? 'border-slate-300 text-slate-500 hover:bg-slate-50' : 'border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100'">
          <UserPlus :size="14" /> {{ showCreateForm ? 'Cancelar registro' : 'Registrar Nuevo Cliente' }}
        </button>

        <div v-if="showCreateForm" class="mt-3 space-y-2.5">
          <div v-if="formError" class="bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
            <p class="text-rose-600 text-[11px] font-medium">{{ formError }}</p>
          </div>
          <RifInput v-model="form.identityDocument" />
          <input ref="fullNameInput" v-model="form.fullName" type="text" placeholder="Nombre completo / Razón Social"
            class="w-full h-10 px-3 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
          <PhoneInput v-model="form.phone" />
          <textarea v-model="form.address" rows="2" placeholder="Dirección fiscal"
            class="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none" />
          <button @click="submitNewCustomer" :disabled="submitting"
            class="w-full inline-flex items-center justify-center gap-1.5 h-10 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors">
            <Loader2 v-if="submitting" :size="14" class="animate-spin" />
            Guardar y Seleccionar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
