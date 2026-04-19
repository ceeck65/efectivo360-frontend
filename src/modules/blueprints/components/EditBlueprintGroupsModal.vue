<template>
  <div v-if="isOpen && blueprint" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
    <div class="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/[0.06] dark:bg-[#141824]">
      <!-- Header -->
      <div class="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 z-10 dark:border-white/[0.06] dark:bg-[#141824]">
        <div>
          <h2 class="text-xl font-semibold text-slate-900 dark:text-white">Grupos de Atributos</h2>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            Blueprint: <span class="font-mono text-slate-700 dark:text-slate-300">{{ blueprint.code }}</span>
          </p>
        </div>
        <button
          @click="$emit('close')"
          class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <!-- Info -->
      <div class="bg-blue-50 border-b border-blue-100 px-6 py-3 dark:bg-blue-900/20 dark:border-blue-900">
        <p class="text-sm text-blue-700 dark:text-blue-300">
          Define grupos de atributos que se activarán según la categoría del producto.
          Por ejemplo, el grupo "tornilleria" se activará para productos en la categoría "Tornilleria".
        </p>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-6">
        <!-- Agregar nuevo grupo -->
        <div class="flex gap-2">
          <input
            v-model="newGroupKey"
            @keydown="e => e.key === 'Enter' && addGroup()"
            placeholder="Nombre del nuevo grupo (ej: tornilleria)"
            class="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
          />
          <button
            @click="addGroup"
            class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            <Plus class="h-4 w-4" />
            Agregar grupo
          </button>
        </div>

        <!-- Lista de grupos -->
        <div class="grid gap-4 md:grid-cols-2">
          <GroupEditor
            v-for="(group, key) in schemaLogic.grupos"
            :key="key"
            :group-key="key"
            :group="group"
            @update="updateGroup(key, $event)"
            @remove="removeGroup(key)"
          />
        </div>

        <div v-if="Object.keys(schemaLogic.grupos).length === 0" class="text-center py-8 text-slate-500 dark:text-slate-400">
          <Settings class="h-12 w-12 mx-auto mb-3 text-slate-300" />
          <p>No hay grupos definidos</p>
          <p class="text-sm">Agrega tu primer grupo de atributos arriba</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="sticky bottom-0 flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4 dark:border-white/[0.06] dark:bg-[#141824]">
        <button
          @click="$emit('close')"
          :disabled="saving"
          class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 dark:text-slate-300 dark:border-white/[0.06] dark:hover:bg-[#1a1f2e]"
        >
          Cancelar
        </button>
        <button
          @click="handleSubmit"
          :disabled="saving"
          class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          <Save class="h-4 w-4" />
          {{ saving ? 'Guardando...' : 'Guardar cambios' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview Modal para editar grupos de atributos de blueprint
 * @module @modules/blueprints/components/EditBlueprintGroupsModal
 */
import { ref, watch } from 'vue';
import { useApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';
import type { Blueprint, AttributeGroup, SchemaLogic } from '../types';
import { Plus, Settings, Save, X } from 'lucide-vue-next';
import GroupEditor from './GroupEditor.vue';

interface Props {
  blueprint: Blueprint | null;
  isOpen: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  updated: [];
}>();

const { fetchApi } = useApi();
const { success: notifySuccess, error: notifyError } = useNotify();

const saving = ref(false);
const schemaLogic = ref<SchemaLogic>({ grupos: {} });
const newGroupKey = ref('');

const loadSchemaLogic = async () => {
  if (!props.blueprint) return;
  try {
    const response = await fetchApi<{ schema_logic: SchemaLogic; grupos: Record<string, AttributeGroup> }>(
      `/api/v1/industry-blueprints/${props.blueprint.id}/schema-groups/`
    );
    schemaLogic.value = response.schema_logic || { grupos: {} };
  } catch {
    notifyError('No se pudo cargar la configuración de grupos.');
  }
};

const addGroup = () => {
  const key = newGroupKey.value.trim().toLowerCase().replace(/\s+/g, '_');
  if (!key) return;
  const grupos = schemaLogic.value.grupos || {};
  if (grupos[key]) {
    notifyError(`Ya existe un grupo llamado ${key}`);
    return;
  }
  schemaLogic.value = {
    ...schemaLogic.value,
    grupos: {
      ...grupos,
      [key]: { fields: [] },
    },
  };
  newGroupKey.value = '';
};

const updateGroup = (key: string, group: AttributeGroup) => {
  const grupos = schemaLogic.value.grupos || {};
  schemaLogic.value = {
    ...schemaLogic.value,
    grupos: {
      ...grupos,
      [key]: group,
    },
  };
};

const removeGroup = (key: string) => {
  const grupos = schemaLogic.value.grupos || {};
  const { [key]: _, ...rest } = grupos;
  schemaLogic.value = { ...schemaLogic.value, grupos: rest };
};

const handleSubmit = async () => {
  if (!props.blueprint) return;

  // Validar que no haya campos vacíos
  const grupos = schemaLogic.value.grupos || {};
  for (const [groupKey, group] of Object.entries(grupos)) {
    for (const field of group.fields) {
      if (!field.name || !field.label) {
        notifyError(`El grupo "${groupKey}" tiene campos vacíos.`);
        return;
      }
    }
  }

  try {
    saving.value = true;
    await fetchApi(`/api/v1/industry-blueprints/${props.blueprint.id}/schema-groups/`, {
      method: 'PATCH',
      data: { grupos: schemaLogic.value.grupos || {} },
    });
    notifySuccess('Grupos de atributos actualizados correctamente.');
    emit('updated');
    emit('close');
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'No se pudieron guardar los cambios.');
  } finally {
    saving.value = false;
  }
};

watch(() => props.isOpen, (isOpen) => {
  if (isOpen && props.blueprint) {
    loadSchemaLogic();
  }
});
</script>
