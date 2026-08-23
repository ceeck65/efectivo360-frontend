<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="handleClose" />
      <div class="relative bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl">
        <!-- Header -->
        <div class="flex items-start justify-between px-5 py-4 border-b border-slate-200">
          <div class="min-w-0">
            <h3 class="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              <UploadCloud class="w-4 h-4 text-cyan-500" /> Carga Masiva de Catálogo
            </h3>
            <p class="text-[11px] text-slate-400 mt-0.5">Importa productos al Banco Global desde .csv o .xlsx</p>
          </div>
          <button @click="handleClose" class="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 shrink-0">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Body -->
        <div class="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <button type="button" @click="downloadTemplate"
            class="text-xs font-medium text-cyan-600 hover:text-cyan-700 hover:underline flex items-center gap-1.5">
            <Download class="w-3.5 h-3.5" /> Descargar Plantilla de Ejemplo (.csv)
          </button>

          <div
            @dragover.prevent="dragOver = true"
            @dragleave.prevent="dragOver = false"
            @drop.prevent="handleDrop"
            @click="!uploading && fileInput?.click()"
            class="relative flex flex-col items-center justify-center w-full h-36 rounded-xl border-2 border-dashed transition-colors"
            :class="[
              uploading ? 'cursor-default' : 'cursor-pointer',
              selectedFile
                ? 'border-emerald-300 bg-emerald-50/30'
                : dragOver
                  ? 'border-cyan-400 bg-cyan-50'
                  : 'border-slate-300 bg-slate-50 hover:border-slate-400',
            ]"
          >
            <template v-if="selectedFile">
              <FileSpreadsheet class="w-7 h-7 text-emerald-500 mb-1" />
              <p class="text-sm font-medium text-slate-700 truncate max-w-[85%] px-2">{{ selectedFile.name }}</p>
              <p class="text-[10px] text-slate-400 mt-0.5">{{ formatSize(selectedFile.size) }}</p>
              <button v-if="!uploading" type="button" @click.stop="selectedFile = null"
                class="text-[11px] text-red-500 hover:text-red-600 mt-1.5 font-medium">
                Quitar
              </button>
            </template>
            <template v-else>
              <UploadCloud class="w-7 h-7 text-slate-400 mb-1" />
              <p class="text-xs font-medium text-slate-500">Arrastra tu archivo aquí o haz clic para seleccionar</p>
              <p class="text-[10px] text-slate-400 mt-0.5">.csv o .xlsx</p>
            </template>
          </div>
          <input ref="fileInput" type="file" accept=".csv,.xlsx" class="hidden" @change="handleFileInput" />

          <div v-if="uploading" class="space-y-1.5">
            <div class="flex items-center justify-between text-[11px] text-slate-500">
              <span>Subiendo y procesando...</span>
              <span class="font-semibold text-cyan-600">{{ progress }}%</span>
            </div>
            <div class="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div class="h-full bg-cyan-500 transition-all duration-200" :style="{ width: progress + '%' }" />
            </div>
          </div>

          <div v-if="result"
            class="rounded-xl border p-3 space-y-2.5"
            :class="result.errors.length ? 'border-amber-200 bg-amber-50/50' : 'border-emerald-200 bg-emerald-50/50'">
            <div class="flex items-center gap-4 flex-wrap text-sm">
              <span class="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <CheckCircle2 class="w-4 h-4 shrink-0" /> {{ formatQty(result.created) }} creados
              </span>
              <span class="flex items-center gap-1.5 text-blue-700 font-semibold">
                <RefreshCw class="w-4 h-4 shrink-0" /> {{ formatQty(result.updated) }} actualizados
              </span>
              <span v-if="result.errors.length" class="flex items-center gap-1.5 text-amber-700 font-semibold">
                <AlertTriangle class="w-4 h-4 shrink-0" /> {{ result.errors.length }} con errores
              </span>
            </div>
            <div v-if="result.errors.length" class="max-h-32 overflow-y-auto space-y-1 pr-1">
              <p v-for="(err, i) in result.errors" :key="i" class="text-[11px] text-amber-700">
                <strong>Fila {{ err.row }}:</strong> {{ err.message }}
              </p>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-200 bg-slate-50/60 rounded-b-2xl">
          <button @click="handleClose" class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            {{ result ? 'Cerrar' : 'Cancelar' }}
          </button>
          <button v-if="!result" @click="submit" :disabled="!selectedFile || uploading"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm">
            <Loader2 v-if="uploading" class="w-4 h-4 animate-spin" />
            <UploadCloud v-else class="w-4 h-4" />
            {{ uploading ? 'Importando...' : 'Importar' }}
          </button>
          <button v-else @click="resetForm" type="button"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-700 transition-colors shadow-sm">
            <UploadCloud class="w-4 h-4" /> Importar otro archivo
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  X, UploadCloud, Download, FileSpreadsheet, CheckCircle2, RefreshCw, AlertTriangle, Loader2,
} from 'lucide-vue-next';
import { fetchApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';

export interface BulkImportError {
  row: number;
  message: string;
}

export interface BulkImportResult {
  created: number;
  updated: number;
  errors: BulkImportError[];
}

const ACCEPTED_EXTENSIONS = ['csv', 'xlsx'];
const TEMPLATE_HEADERS = 'barcode,name,brand_name,category_name,tax_type,sale_unit';
const TEMPLATE_EXAMPLE_ROWS = [
  '7591031000983,Pepsi Cola 1.5L,Pepsico,Bebidas e Hidratación,EXEMPT,UNIDAD',
  '7591127883322,Fanta de Uva 1L,Coca-Cola,Bebidas e Hidratación,EXEMPT,UNIDAD',
];

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  close: [];
  imported: [result: BulkImportResult];
}>();

const { error: notifyError } = useNotify();

const fileInput = ref<HTMLInputElement | null>(null);
const dragOver = ref(false);
const selectedFile = ref<File | null>(null);
const uploading = ref(false);
const progress = ref(0);
const result = ref<BulkImportResult | null>(null);

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatQty(n: number): string {
  return (n || 0).toLocaleString('es');
}

function validateAndSet(file: File) {
  const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : '';
  if (!ACCEPTED_EXTENSIONS.includes(ext)) {
    notifyError('Formato no soportado. Usa un archivo .csv o .xlsx.');
    return;
  }
  selectedFile.value = file;
  result.value = null;
}

function handleFileInput(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files?.[0]) validateAndSet(target.files[0]);
  target.value = '';
}

function handleDrop(e: DragEvent) {
  dragOver.value = false;
  if (uploading.value) return;
  if (e.dataTransfer?.files?.[0]) validateAndSet(e.dataTransfer.files[0]);
}

function downloadTemplate() {
  const csv = [TEMPLATE_HEADERS, ...TEMPLATE_EXAMPLE_ROWS].join('\n') + '\n';
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'plantilla-catalogo-global.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function extractErrorMessage(e: any): string {
  const data = e?.data;
  if (data && typeof data === 'object' && data.error) return String(data.error);
  return e?.message || 'Error al importar el archivo';
}

async function submit() {
  if (!selectedFile.value || uploading.value) return;
  uploading.value = true;
  progress.value = 0;
  result.value = null;
  try {
    const fd = new FormData();
    fd.append('file', selectedFile.value);
    const res = await fetchApi<BulkImportResult>('/api/v1/admin/global-catalog/bulk-import/', {
      method: 'POST',
      data: fd,
      onUploadProgress: (evt: ProgressEvent) => {
        if (evt.total) progress.value = Math.round((evt.loaded / evt.total) * 100);
      },
    } as any);
    result.value = res;
    emit('imported', res);
  } catch (e: any) {
    notifyError(extractErrorMessage(e));
  } finally {
    uploading.value = false;
  }
}

function handleClose() {
  if (uploading.value) return;
  emit('close');
}

function resetForm() {
  selectedFile.value = null;
  uploading.value = false;
  progress.value = 0;
  result.value = null;
  dragOver.value = false;
  if (fileInput.value) fileInput.value.value = '';
}

watch(() => props.visible, (v) => {
  if (v) resetForm();
});
</script>
