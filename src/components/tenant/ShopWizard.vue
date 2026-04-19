<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useApi } from '@/composables/useApi';
import { useAuthStore } from '@/stores/auth';
import { useGeography } from '@/modules/geography';
import { ChevronRight, ChevronLeft, Store, MapPin, Palette, Upload, Check, AlertCircle } from 'lucide-vue-next';
import { useNotify } from '@/composables/useNotify';

const emit = defineEmits<{
  complete: [];
}>();

const router = useRouter();
const { fetchApi } = useApi();
const authStore = useAuthStore();
const { success: notifySuccess, error: notifyError } = useNotify();
const geography = useGeography();

// Step management
const currentStep = ref(1);
const totalSteps = 3;
const isSubmitting = ref(false);

// Step 1: Identity
const storeName = ref('');
const storeRif = ref('');
const industryType = ref('');
const blueprints = ref<BlueprintOption[]>([]);
const selectedBlueprint = ref<BlueprintOption | null>(null);

// Step 2: Location
const selectedCountryId = ref<string | null>(null);
const selectedStateId = ref<string | null>(null);
const selectedCityId = ref<string | null>(null);

// Geography options (already computed refs from useGeography)
const countryOptions = geography.countryOptions;
const stateOptions = geography.stateOptions;
const cityOptions = geography.cityOptions;

// Step 3: Personalization
const logoFile = ref<File | null>(null);
const logoPreview = ref<string | null>(null);
const primaryColor = ref('#3b82f6');
const secondaryColor = ref('#8b5cf6');

interface BlueprintOption {
  id: number;
  name: string;
  description: string;
  industry_type: string;
}

// Initialize geography
onMounted(async () => {
  await geography.initialize();
  await fetchBlueprints();
});

// Fetch blueprints
const fetchBlueprints = async () => {
  try {
    const response = await fetchApi<{ results: BlueprintOption[] }>('/api/v1/industry-blueprints/');
    blueprints.value = Array.isArray(response) ? response : response.results || [];
  } catch (error) {
    console.error('Failed to fetch blueprints:', error);
  }
};

// Suggest blueprint based on store name (simple heuristic)
const suggestBlueprint = () => {
  const name = storeName.value.toLowerCase();
  const blueprint = blueprints.value.find(bp => 
    name.includes(bp.industry_type.toLowerCase()) ||
    name.includes(bp.name.toLowerCase())
  );
  if (blueprint) {
    selectedBlueprint.value = blueprint;
    industryType.value = blueprint.industry_type;
  }
};

// Handle logo upload
const handleLogoUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    logoFile.value = target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      logoPreview.value = e.target?.result as string;
    };
    reader.readAsDataURL(target.files[0]);
  }
};

// Step navigation
const nextStep = async () => {
  if (currentStep.value === 1) {
    if (!validateStep1()) return;
    if (!selectedBlueprint.value) {
      suggestBlueprint();
    }
  } else if (currentStep.value === 2) {
    if (!validateStep2()) return;
  }
  
  if (currentStep.value < totalSteps) {
    currentStep.value++;
  }
};

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

// Validation
const validateStep1 = (): boolean => {
  if (!storeName.value.trim()) {
    notifyError('El nombre de la tienda es requerido');
    return false;
  }
  if (!storeRif.value.trim()) {
    notifyError('El RIF es requerido');
    return false;
  }
  if (!industryType.value) {
    notifyError('El rubro es requerido');
    return false;
  }
  return true;
};

const validateStep2 = (): boolean => {
  if (!selectedCountryId.value) {
    notifyError('El país es requerido');
    return false;
  }
  if (!selectedStateId.value) {
    notifyError('El estado es requerido');
    return false;
  }
  if (!selectedCityId.value) {
    notifyError('La ciudad es requerida');
    return false;
  }
  return true;
};

// Submit
const handleSubmit = async () => {
  if (!validateStep1() || !validateStep2()) return;
  
  isSubmitting.value = true;
  
  try {
    // Get current user data
    const user = authStore.user;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Prepare form data
    const formData = new FormData();
    
    // Store data
    formData.append('store[name]', storeName.value);
    formData.append('store[rif]', storeRif.value);
    formData.append('store[industry_type]', industryType.value);
    formData.append('store[country_id]', selectedCountryId.value!);
    formData.append('store[state_id]', selectedStateId.value!);
    formData.append('store[city_id]', selectedCityId.value!);
    
    // Personalization
    formData.append('store[primary_color]', primaryColor.value);
    formData.append('store[secondary_color]', secondaryColor.value);
    if (logoFile.value) {
      formData.append('store[logo]', logoFile.value);
    }
    
    // Owner data
    formData.append('owner[username]', user.username ?? '');
    formData.append('owner[email]', user.email ?? '');
    formData.append('owner[national_id]', ''); // Will be collected in a modal if needed
    
    // Submit to backend
    const response = await fetchApi<{ tenant_id: number; owner_id: number }>('/api/tenants/register/', {
      method: 'POST',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    notifySuccess('Tienda creada exitosamente');
    
    // Emit complete event
    emit('complete');
    
    // Redirect to dashboard
    router.push('/admin/dashboard');
  } catch (error: any) {
    console.error('Error creating tenant:', error);
    notifyError(error.message || 'Error al crear la tienda');
  } finally {
    isSubmitting.value = false;
  }
};

// Computed
const canGoNext = computed(() => {
  if (currentStep.value === 1) {
    return storeName.value.trim() && storeRif.value.trim() && industryType.value;
  }
  if (currentStep.value === 2) {
    return selectedCountryId.value && selectedStateId.value && selectedCityId.value;
  }
  return true;
});

const stepTitle = computed(() => {
  const titles = ['Identidad de tu Tienda', 'Ubicación', 'Personalización'];
  return titles[currentStep.value - 1];
});

const stepIcon = computed(() => {
  const icons = [Store, MapPin, Palette];
  return icons[currentStep.value - 1];
});

// Watch for country/state changes to reset dependent selections
const handleCountryChange = () => {
  selectedStateId.value = null;
  selectedCityId.value = null;
  geography.setSelection(
    selectedCountryId.value?.toString() ?? null,
    null,
    null
  );
};

const handleStateChange = () => {
  selectedCityId.value = null;
  geography.setSelection(
    selectedCountryId.value?.toString() ?? null,
    selectedStateId.value?.toString() ?? null,
    null
  );
};

const handleCityChange = () => {
  geography.setSelection(
    selectedCountryId.value?.toString() ?? null,
    selectedStateId.value?.toString() ?? null,
    selectedCityId.value?.toString() ?? null
  );
};
</script>

<template>
  <div class="max-w-4xl mx-auto p-6">
    <!-- Progress Steps -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <template v-for="step in totalSteps" :key="step">
          <div class="flex items-center">
            <div
              :class="[
                'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition',
                step <= currentStep
                  ? 'border-brand-primary bg-brand-primary text-white'
                  : 'border-slate-300 bg-white text-slate-500'
              ]"
            >
              <component :is="stepIcon" v-if="step === currentStep" class="h-5 w-5" />
              <Check v-else-if="step < currentStep" class="h-5 w-5" />
              <span v-else>{{ step }}</span>
            </div>
            <span
              v-if="step < totalSteps"
              :class="[
                'mx-2 h-0.5 w-16 transition',
                step < currentStep ? 'bg-brand-primary' : 'bg-slate-300'
              ]"
            />
          </div>
        </template>
      </div>
      <div class="mt-4">
        <h2 class="text-2xl font-bold text-slate-900">{{ stepTitle }}</h2>
        <p class="mt-1 text-sm text-slate-500">Paso {{ currentStep }} de {{ totalSteps }}</p>
      </div>
    </div>

    <!-- Step 1: Identity -->
    <div v-if="currentStep === 1" class="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">
          Nombre de la Tienda *
        </label>
        <input
          v-model="storeName"
          @blur="suggestBlueprint"
          type="text"
          placeholder="Ej: Mi Tienda Favorita"
          class="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">
          RIF *
        </label>
        <input
          v-model="storeRif"
          type="text"
          placeholder="Ej: J-123456789-0"
          class="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">
          Rubro *
        </label>
        <select
          v-model="industryType"
          class="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
        >
          <option value="">Selecciona un rubro</option>
          <option v-for="blueprint in blueprints" :key="blueprint.id" :value="blueprint.industry_type">
            {{ blueprint.name }}
          </option>
        </select>
        <p v-if="selectedBlueprint" class="mt-2 flex items-center gap-2 text-sm text-slate-600">
          <Check class="h-4 w-4 text-emerald-500" />
          Efi ha sugerido: {{ selectedBlueprint.name }}
        </p>
      </div>
    </div>

    <!-- Step 2: Location -->
    <div v-if="currentStep === 2" class="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">
          País *
        </label>
        <select
          v-model="selectedCountryId"
          @change="handleCountryChange"
          :disabled="geography.isLoadingCountries.value"
          class="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
        >
          <option value="">Selecciona un país</option>
          <option v-for="country in countryOptions" :key="country.value" :value="country.value">
            {{ country.label }}
          </option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">
          Estado *
        </label>
        <select
          v-model="selectedStateId"
          @change="handleStateChange"
          :disabled="geography.isLoadingStates.value || !selectedCountryId"
          class="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
        >
          <option value="">Selecciona un estado</option>
          <option v-for="state in stateOptions" :key="state.value" :value="state.value">
            {{ state.label }}
          </option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">
          Ciudad *
        </label>
        <select
          v-model="selectedCityId"
          @change="handleCityChange"
          :disabled="geography.isLoadingCities.value || !selectedStateId"
          class="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
        >
          <option value="">Selecciona una ciudad</option>
          <option v-for="city in cityOptions" :key="city.value" :value="city.value">
            {{ city.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- Step 3: Personalization -->
    <div v-if="currentStep === 3" class="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">
          Logo de la Tienda
        </label>
        <div class="flex items-center gap-4">
          <div
            class="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50"
          >
            <img
              v-if="logoPreview"
              :src="logoPreview"
              alt="Logo preview"
              class="h-full w-full object-contain rounded-lg"
            />
            <Upload v-else class="h-8 w-8 text-slate-400" />
          </div>
          <div>
            <input
              type="file"
              accept="image/*"
              @change="handleLogoUpload"
              class="hidden"
              id="logo-upload"
            />
            <label
              for="logo-upload"
              class="cursor-pointer rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Subir Logo
            </label>
            <p class="mt-1 text-xs text-slate-500">PNG, JPG hasta 2MB</p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">
            Color Primario
          </label>
          <div class="flex items-center gap-2">
            <input
              v-model="primaryColor"
              type="color"
              class="h-10 w-16 rounded cursor-pointer border-0"
            />
            <input
              v-model="primaryColor"
              type="text"
              class="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">
            Color Secundario
          </label>
          <div class="flex items-center gap-2">
            <input
              v-model="secondaryColor"
              type="color"
              class="h-10 w-16 rounded cursor-pointer border-0"
            />
            <input
              v-model="secondaryColor"
              type="text"
              class="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>
        </div>
      </div>

      <!-- Preview -->
      <div class="rounded-lg border border-slate-200 p-4">
        <p class="mb-2 text-sm font-medium text-slate-700">Vista Previa</p>
        <div
          class="rounded-lg p-4 text-white"
          :style="{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }"
        >
          <div class="flex items-center gap-3">
            <div
              v-if="logoPreview"
              class="h-12 w-12 rounded-lg bg-white/20 p-1"
            >
              <img :src="logoPreview" alt="Logo" class="h-full w-full object-contain" />
            </div>
            <div v-else class="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
              <Store class="h-6 w-6" />
            </div>
            <div>
              <p class="font-semibold">{{ storeName || 'Mi Tienda' }}</p>
              <p class="text-sm opacity-80">{{ industryType || 'Rubro' }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Buttons -->
    <div class="mt-8 flex items-center justify-between">
      <button
        v-if="currentStep > 1"
        @click="prevStep"
        :disabled="isSubmitting"
        class="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft class="h-4 w-4" />
        Anterior
      </button>

      <button
        v-if="currentStep < totalSteps"
        @click="nextStep"
        :disabled="!canGoNext || isSubmitting"
        class="ml-auto flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Siguiente
        <ChevronRight class="h-4 w-4" />
      </button>

      <button
        v-if="currentStep === totalSteps"
        @click="handleSubmit"
        :disabled="isSubmitting"
        class="ml-auto flex items-center gap-2 rounded-lg bg-brand-primary px-6 py-2 text-sm font-medium text-white transition hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Check v-if="!isSubmitting" class="h-4 w-4" />
        <span v-else class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        {{ isSubmitting ? 'Creando Tienda...' : 'Crear Tienda' }}
      </button>
    </div>
  </div>
</template>
