<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-base font-semibold text-slate-800">Información del Negocio</h3>
      <p class="text-xs text-slate-500 mt-0.5">Datos legales e identidad comercial</p>
    </div>

    <!-- Logo -->
    <div>
      <label class="block text-xs font-medium text-slate-600 mb-2">Logo Comercial</label>
      <div class="flex items-center gap-4">
        <div class="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 relative group cursor-pointer" @click="showImageStudio = true">
          <img v-if="logoThumbUrl || form.logo_url" :src="logoThumbUrl || form.logo_url" class="w-full h-full object-contain" alt="" />
          <Camera v-else class="w-8 h-8 text-slate-300" />
          <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Pencil class="w-5 h-5 text-slate-500" />
          </div>
        </div>
        <div class="flex-1 space-y-2">
          <input v-model="form.logo_url" type="text" placeholder="URL del logo..."
            class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
          <div class="flex gap-2">
            <button @click="showImageStudio = true" class="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
              <ImagePlus class="w-3.5 h-3.5" /> Abrir editor de imagen
            </button>
            <p v-if="logoBlob" class="text-[10px] text-emerald-600">Imagen procesada lista</p>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="block text-xs font-medium text-slate-600 mb-1">Razón Social</label>
        <input v-model="form.legal_name" type="text" placeholder="Nombre legal de la empresa"
          class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
      </div>
      <div>
        <label class="block text-xs font-medium text-slate-600 mb-1">Nombre Comercial</label>
        <input v-model="form.commercial_name" type="text" placeholder="Cómo te conocen tus clientes"
          class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="block text-xs font-medium text-slate-600 mb-1">RIF</label>
        <RifInput v-model="form.rif" />
      </div>
      <div>
        <label class="block text-xs font-medium text-slate-600 mb-1">Teléfono Principal</label>
        <PhoneInput v-model="form.phone" />
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="block text-xs font-medium text-slate-600 mb-1">Email de Contacto</label>
        <input v-model="form.email" type="email" placeholder="contacto@empresa.com"
          class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
      </div>
      <div>
        <label class="block text-xs font-medium text-slate-600 mb-1">Sitio Web</label>
        <input v-model="form.website" type="url" placeholder="https://mitienda.com"
          class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
      </div>
    </div>

    <div>
      <label class="block text-xs font-medium text-slate-600 mb-1">Dirección Fiscal</label>
      <textarea v-model="form.address" rows="2" placeholder="Dirección completa..."
        class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"></textarea>
    </div>

    <!-- Social Media -->
    <div>
      <div class="flex items-center justify-between mb-2">
        <label class="text-xs font-medium text-slate-600">Redes Sociales</label>
        <button @click="addSocial" class="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700">
          <Plus class="w-3 h-3" /> Agregar red social
        </button>
      </div>
      <div class="space-y-2">
        <div v-for="(s, i) in form.socials" :key="i" class="flex items-center gap-2">
          <select v-model="s.platform" class="w-32 h-9 px-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="twitter">X / Twitter</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
            <option value="linkedin">LinkedIn</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
          <input v-model="s.url" type="text" :placeholder="socialPlaceholder(s.platform)" class="flex-1 h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          <button @click="form.socials.splice(i, 1)" class="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"><X class="w-3.5 h-3.5" /></button>
        </div>
      </div>
    </div>

    <div class="flex justify-end">
      <button @click="save" :disabled="saving" class="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 flex items-center gap-2">
        <Save v-if="!saving" class="w-4 h-4" /> Guardar Información
      </button>
    </div>

    <!-- Image Studio Modal -->
    <Teleport to="body">
      <div v-if="showImageStudio" class="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showImageStudio = false" />
        <div class="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <ProductImageStudio @processed="onLogoProcessed" @cancel="showImageStudio = false" />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Camera, Pencil, ImagePlus, Save, Plus, X } from 'lucide-vue-next';
import RifInput from '@/components/shared/RifInput.vue';
import PhoneInput from '@/components/shared/PhoneInput.vue';
import ProductImageStudio from '@/views/admin/super-console/components/ProductImageStudio.vue';
import { useApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';

interface SocialEntry { platform: string; url: string; }

const { fetchApi } = useApi();
const { success } = useNotify();
const saving = ref(false);
const showImageStudio = ref(false);
const logoBlob = ref<Blob | null>(null);
const logoThumbUrl = ref('');
const form = reactive({ legal_name: '', commercial_name: '', rif: '', phone: '', email: '', website: '', address: '', logo_url: '', socials: [] as SocialEntry[] });

function socialPlaceholder(platform: string): string {
  const m: Record<string, string> = { instagram: '@usuario', facebook: 'facebook.com/pagina', twitter: 'x.com/usuario', tiktok: '@usuario', youtube: 'youtube.com/@canal', linkedin: 'linkedin.com/in/usuario', whatsapp: '+58...' };
  return m[platform] || 'URL';
}

function addSocial() { form.socials.push({ platform: 'instagram', url: '' }); }

function onLogoProcessed(blob: Blob, previewUrl: string) {
  logoBlob.value = blob;
  form.logo_url = previewUrl;
  logoThumbUrl.value = previewUrl;
  showImageStudio.value = false;
}

onMounted(async () => {
  try {
    const res = await fetchApi<any>('/api/v1/tenants/settings/info/');
    if (res) {
      form.legal_name = res.legal_name || '';
      form.commercial_name = res.commercial_name || res.name || '';
      form.rif = res.rif || '';
      form.phone = res.phone || '';
      form.email = res.email || '';
      form.website = res.website || '';
      form.address = res.address || '';
      form.logo_url = res.logo_url || '';
      logoThumbUrl.value = res.thumb_url || res.logo_url || '';
      form.socials = Array.isArray(res.socials) ? res.socials : (res.metadata?.socials || []);
    }
  } catch {}
});

async function save() {
  saving.value = true;
  try {
    const payload = { ...form };
    // Upload logo to logos/{tenant_ulid}.webp — auto-replaces existing
    if (logoBlob.value) {
      const fd = new FormData();
      fd.append('image', logoBlob.value, 'logo.webp');
      const uploadRes = await fetchApi<any>('/api/v1/tenants/settings/upload-logo/', { method: 'POST', data: fd, headers: { 'Content-Type': 'multipart/form-data' } });
      payload.logo_url = uploadRes?.url || form.logo_url;
      logoBlob.value = null;
    }
    await fetchApi('/api/v1/tenants/settings/info/', { method: 'PATCH', data: payload });
    success('Información guardada');
  } catch {} finally { saving.value = false; }
}
</script>
