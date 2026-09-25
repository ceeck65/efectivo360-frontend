<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { BookOpen, Copy, Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-vue-next';
import { fetchApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';
import { parseApiError } from '@/utils/parseApiError';
import { API_URL, LAYOUT_LABELS, type DigitalCatalog, type DigitalCatalogSummary } from './catalog';

// Catálogos de la tienda actual: el backend filtra por la tienda seleccionada en el encabezado.
const router = useRouter();
const { success, error: notifyError } = useNotify();

const catalogs = ref<DigitalCatalogSummary[]>([]);
const loading = ref(true);
const loadError = ref('');
const search = ref('');
const confirmDeleteId = ref('');
const busyId = ref('');

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase();
  return term
    ? catalogs.value.filter((c) => c.name.toLowerCase().includes(term) || (c.title || '').toLowerCase().includes(term))
    : catalogs.value;
});

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-VE', { dateStyle: 'medium', timeStyle: 'short' });
}

async function duplicate(catalog: DigitalCatalogSummary) {
  busyId.value = catalog.id;
  try {
    const data = await fetchApi<DigitalCatalog>(`${API_URL}${catalog.id}/duplicate/`, { method: 'POST' });
    success(`Catálogo duplicado como "${data.name}".`);
    router.push({ name: 'DigitalCatalogEdit', params: { id: data.id } });
  } catch (err) {
    notifyError(parseApiError(err) || 'No se pudo duplicar el catálogo.');
  } finally {
    busyId.value = '';
  }
}

async function remove(catalog: DigitalCatalogSummary) {
  busyId.value = catalog.id;
  try {
    await fetchApi(`${API_URL}${catalog.id}/`, { method: 'DELETE' });
    catalogs.value = catalogs.value.filter((c) => c.id !== catalog.id);
    success(`Catálogo "${catalog.name}" eliminado.`);
  } catch (err) {
    notifyError(parseApiError(err) || 'No se pudo eliminar el catálogo.');
  } finally {
    busyId.value = '';
    confirmDeleteId.value = '';
  }
}

onMounted(async () => {
  try {
    catalogs.value = await fetchApi<DigitalCatalogSummary[]>(API_URL);
  } catch {
    loadError.value = 'No se pudieron cargar los catálogos.';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="p-4 md:p-6 space-y-4 max-w-[1400px] mx-auto">
    <!-- Cabecera -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-lg font-black text-slate-800 dark:text-white">Catálogos Digitales</h1>
        <p class="text-xs text-slate-400">Arma catálogos con los productos de tu tienda, descárgalos en PDF o compártelos por WhatsApp</p>
      </div>
      <RouterLink
        :to="{ name: 'DigitalCatalogNew' }"
        class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
      >
        <Plus :size="16" /> Nuevo catálogo
      </RouterLink>
    </div>

    <!-- Buscador -->
    <div class="relative max-w-md">
      <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        v-model="search"
        type="search"
        placeholder="Buscar catálogo..."
        class="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141824] text-sm text-slate-700 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
      />
    </div>

    <div v-if="loading" class="py-16 text-center text-slate-400">
      <Loader2 :size="20" class="animate-spin inline-block" />
    </div>
    <p v-else-if="loadError" class="text-sm text-red-600">{{ loadError }}</p>

    <div
      v-else-if="!catalogs.length"
      class="rounded-xl border border-dashed border-slate-300 dark:border-white/[0.12] bg-white dark:bg-[#141824] py-16 text-center"
    >
      <BookOpen :size="42" class="mx-auto mb-3 text-slate-300" />
      <p class="font-medium text-slate-600 dark:text-slate-200">Todavía no has creado catálogos</p>
      <p class="mb-4 text-sm text-slate-400">Arma uno con los productos que quieras, descárgalo en PDF o compártelo por WhatsApp.</p>
      <RouterLink
        :to="{ name: 'DigitalCatalogNew' }"
        class="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        <Plus :size="16" /> Crear el primero
      </RouterLink>
    </div>

    <p v-else-if="!filtered.length" class="text-sm text-slate-500">Ningún catálogo coincide con "{{ search }}".</p>

    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <article
        v-for="catalog in filtered"
        :key="catalog.id"
        class="flex flex-col overflow-hidden rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#141824] shadow-sm transition hover:shadow-md"
      >
        <div class="h-2" :style="{ background: catalog.brand }" />
        <div class="flex flex-1 flex-col p-4">
          <RouterLink
            :to="{ name: 'DigitalCatalogEdit', params: { id: catalog.id } }"
            class="font-semibold text-slate-800 dark:text-white hover:text-blue-600"
          >
            {{ catalog.name }}
          </RouterLink>
          <p class="mt-0.5 line-clamp-1 text-sm text-slate-500">{{ catalog.title || 'Sin título' }}</p>

          <div class="mt-3 flex flex-wrap gap-2 text-xs">
            <span class="rounded-full bg-slate-100 dark:bg-white/[0.06] px-2.5 py-0.5 font-medium text-slate-600 dark:text-slate-300">
              {{ LAYOUT_LABELS[catalog.layout] }}
            </span>
            <span class="rounded-full bg-blue-50 dark:bg-blue-500/10 px-2.5 py-0.5 font-medium text-blue-700 dark:text-blue-300">
              {{ catalog.product_count }} producto{{ catalog.product_count === 1 ? '' : 's' }}
            </span>
          </div>

          <p class="mt-3 text-xs text-slate-400">
            Actualizado {{ formatDate(catalog.updated_at) }}<span v-if="catalog.created_by_name"> · por {{ catalog.created_by_name }}</span>
          </p>

          <div class="mt-4 flex items-center gap-2 border-t border-slate-100 dark:border-white/[0.06] pt-3">
            <template v-if="confirmDeleteId === catalog.id">
              <span class="text-xs text-slate-500">¿Eliminar este catálogo?</span>
              <button
                type="button"
                class="ml-auto rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                :disabled="busyId === catalog.id"
                @click="remove(catalog)"
              >
                Sí, eliminar
              </button>
              <button
                type="button"
                class="rounded-lg border border-slate-200 dark:border-white/[0.08] px-3 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                @click="confirmDeleteId = ''"
              >
                No
              </button>
            </template>
            <template v-else>
              <RouterLink
                :to="{ name: 'DigitalCatalogEdit', params: { id: catalog.id } }"
                class="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
              >
                <Pencil :size="13" /> Editar
              </RouterLink>
              <button
                type="button"
                class="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.03] disabled:opacity-50"
                :disabled="busyId === catalog.id"
                title="Crear una copia"
                @click="duplicate(catalog)"
              >
                <Copy :size="13" /> Duplicar
              </button>
              <button
                type="button"
                class="ml-auto rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                title="Eliminar"
                @click="confirmDeleteId = catalog.id"
              >
                <Trash2 :size="15" />
              </button>
            </template>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>
