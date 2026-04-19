<template>
  <div class="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
    <!-- Background Pattern -->
    <div class="absolute inset-0 opacity-10">
      <div class="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-slate-900"></div>
      <div class="absolute inset-0 pattern-dots"></div>
    </div>

    <!-- Main Card -->
    <div class="relative z-10 w-full max-w-6xl bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden">
      <div class="flex flex-col lg:flex-row">
        <!-- Left Side - Illustration -->
        <div class="lg:w-2/5 bg-gradient-to-br from-blue-600 to-purple-700 p-8 flex flex-col justify-center relative overflow-hidden">
          <div class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div class="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          
          <div class="relative z-10 text-white">
            <div class="mb-8 flex items-center gap-3">
              <div class="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                <span class="text-2xl font-bold text-blue-600">E</span>
              </div>
              <div>
                <h1 class="text-3xl font-bold">Efectivo 360</h1>
                <p class="text-blue-100 text-sm">Configura tu negocio en minutos</p>
              </div>
            </div>
            
            <div class="space-y-6">
              <div class="flex items-start gap-4">
                <div class="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <LucideIcon name="Store" class="w-5 h-5" />
                </div>
                <div>
                  <h3 class="font-semibold">Gestiona tu inventario</h3>
                  <p class="text-blue-100 text-sm">Control total de tus productos</p>
                </div>
              </div>
              
              <div class="flex items-start gap-4">
                <div class="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <LucideIcon name="TrendingUp" class="w-5 h-5" />
                </div>
                <div>
                  <h3 class="font-semibold">Analiza tus ventas</h3>
                  <p class="text-blue-100 text-sm">Reportes en tiempo real</p>
                </div>
              </div>
              
              <div class="flex items-start gap-4">
                <div class="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <LucideIcon name="ShieldCheck" class="w-5 h-5" />
                </div>
                <div>
                  <h3 class="font-semibold">Seguridad garantizada</h3>
                  <p class="text-blue-100 text-sm">Tus datos protegidos</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Side - Form -->
        <div class="lg:w-3/5 p-8">
          <!-- Stepper -->
          <div class="mb-8">
            <div class="flex items-center justify-between">
              <div 
                v-for="(step, index) in steps" 
                :key="index"
                class="flex items-center"
              >
                <div 
                  class="flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all duration-300"
                  :class="currentStep > index + 1 ? 'bg-green-500 text-white' : currentStep === index + 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'"
                >
                  <LucideIcon v-if="currentStep > index + 1" name="Check" class="w-5 h-5" />
                  <span v-else>{{ index + 1 }}</span>
                </div>
                <div 
                  v-if="index < steps.length - 1"
                  class="w-24 h-1 mx-2 transition-all duration-300"
                  :class="currentStep > index + 1 ? 'bg-green-500' : 'bg-slate-200'"
                ></div>
              </div>
            </div>
            <div class="flex justify-between mt-2 text-sm text-slate-600">
              <span 
                v-for="(step, index) in steps" 
                :key="index"
                class="flex-1 text-center"
                :class="currentStep === index + 1 ? 'font-semibold text-blue-600' : ''"
              >
                {{ step }}
              </span>
            </div>
          </div>

          <!-- Step Content -->
          <div class="relative min-h-[500px]">
            <!-- Step 1: Rubro -->
            <div v-if="currentStep === 1" key="step1" class="space-y-6 animate-fade-in">
              <div>
                <h2 class="text-2xl font-bold text-slate-800 mb-2">¿A qué te dedicas?</h2>
                <p class="text-slate-600">Selecciona el rubro de tu negocio</p>
              </div>

              <!-- Industry Grid -->
              <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div 
                  v-for="industry in industries" 
                  :key="industry.id"
                  @click="selectIndustry(industry)"
                  class="relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:border-blue-400 hover:shadow-lg"
                  :class="selectedIndustry?.id === industry.id ? 'border-blue-600 bg-blue-50 shadow-lg' : 'border-slate-200 bg-white'"
                >
                  <div class="flex flex-col items-center text-center">
                    <div 
                      class="w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors"
                      :class="selectedIndustry?.id === industry.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'"
                    >
                      <LucideIcon :name="industry.icon" class="w-6 h-6" />
                    </div>
                    <span class="font-medium text-sm">{{ industry.name }}</span>
                  </div>

                  <!-- Check Badge -->
                  <div 
                    v-if="selectedIndustry?.id === industry.id"
                    class="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center"
                  >
                    <LucideIcon name="Check" class="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>

              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Nombre de tu tienda</label>
                  <input 
                    v-model="form.storeName"
                    type="text"
                    placeholder="Ej: Mi Tienda Favorita"
                    class="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  >
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">RIF</label>
                  <input 
                    v-model="form.rif"
                    type="text"
                    placeholder="Ej: J-12345678-9"
                    class="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  >
                </div>
              </div>
            </div>

            <!-- Step 2: Localización -->
            <div v-if="currentStep === 2" key="step2" class="space-y-6 animate-fade-in">
              <div>
                <h2 class="text-2xl font-bold text-slate-800 mb-2">¿Dónde está tu negocio?</h2>
                <p class="text-slate-600">Selecciona tu ubicación</p>
              </div>

              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">País</label>
                  <select 
                    v-model="form.country"
                    class="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none bg-white"
                  >
                    <option value="">Selecciona un país</option>
                    <option value="VE">Venezuela</option>
                    <option value="CO">Colombia</option>
                    <option value="PE">Perú</option>
                    <option value="MX">México</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Estado</label>
                  <select 
                    v-model="form.state"
                    :disabled="!form.country"
                    class="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Selecciona un estado</option>
                    <option v-for="state in states" :key="state" :value="state">{{ state }}</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Ciudad</label>
                  <select 
                    v-model="form.city"
                    :disabled="!form.state"
                    class="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Selecciona una ciudad</option>
                    <option v-for="city in cities" :key="city" :value="city">{{ city }}</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Step 3: Identidad y Plan -->
            <div v-if="currentStep === 3" key="step3" class="space-y-6 animate-fade-in">
              <div>
                <h2 class="text-2xl font-bold text-slate-800 mb-2">Identidad y Plan</h2>
                <p class="text-slate-600">Personaliza tu tienda y elige tu plan</p>
              </div>

              <!-- Logo Upload -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Logo de tu tienda (opcional)</label>
                <div class="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
                  <input 
                    type="file" 
                    accept="image/*" 
                    @change="handleLogoUpload"
                    class="hidden"
                    id="logo-upload"
                  >
                  <label for="logo-upload" class="cursor-pointer">
                    <div v-if="!form.logo">
                      <LucideIcon name="UploadCloud" class="w-12 h-12 mx-auto text-slate-400 mb-2" />
                      <p class="text-sm text-slate-600">Haz clic para subir tu logo</p>
                      <p class="text-xs text-slate-400 mt-1">PNG, JPG hasta 5MB</p>
                    </div>
                    <div v-else class="flex items-center justify-center gap-3">
                      <LucideIcon name="CheckCircle" class="w-8 h-8 text-green-500" />
                      <span class="text-sm font-medium text-slate-700">{{ form.logo.name }}</span>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Plan Selection -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-4">Elige tu plan</label>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div 
                    v-for="plan in plans" 
                    :key="plan.id"
                    @click="selectPlan(plan.id as any)"
                    class="relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:border-blue-400"
                    :class="form.plan === plan.id ? 'border-blue-600 bg-blue-50 shadow-lg' : 'border-slate-200 bg-white hover:shadow-md'"
                  >
                    <div v-if="plan.popular" class="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Popular
                    </div>
                    <div class="text-center">
                      <h3 class="text-lg font-bold text-slate-800 mb-1">{{ plan.name }}</h3>
                      <div class="flex items-baseline justify-center gap-1 mb-4">
                        <span class="text-3xl font-bold text-blue-600">{{ plan.price }}</span>
                        <span class="text-sm text-slate-500">{{ plan.period }}</span>
                      </div>
                      <ul class="space-y-2 text-left">
                        <li v-for="feature in plan.features" :key="feature" class="flex items-start gap-2 text-sm text-slate-600">
                          <LucideIcon name="Check" class="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{{ feature }}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Step 4: Configuración (Efi Setup) -->
            <div v-if="currentStep === 4" key="step4" class="space-y-6 animate-fade-in">
              <div>
                <h2 class="text-2xl font-bold text-slate-800 mb-2">Configura tu operación</h2>
                <p class="text-slate-600">Personaliza Efi según tu rubro: {{ selectedIndustry?.name }}</p>
              </div>

              <!-- Suggested Drawers -->
              <div class="bg-blue-50 rounded-xl p-4 flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <LucideIcon name="Lightbulb" class="w-5 h-5 text-blue-600" />
                  <span class="text-sm text-blue-800">Gaveteros sugeridos para {{ selectedIndustry?.name }}</span>
                </div>
                <button 
                  @click="applySuggestedDrawers"
                  class="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Aplicar sugerencia
                </button>
              </div>

              <!-- Payment Drawers -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-4">Gaveteros de Pago</label>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div 
                    v-for="drawer in paymentDrawerOptions" 
                    :key="drawer.id"
                    @click="togglePaymentDrawer(drawer.id)"
                    class="p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:border-blue-400"
                    :class="form.paymentDrawers.includes(drawer.id) ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white'"
                  >
                    <div class="flex flex-col items-center text-center">
                      <div 
                        class="w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors"
                        :class="form.paymentDrawers.includes(drawer.id) ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'"
                      >
                        <LucideIcon :name="drawer.icon" class="w-5 h-5" />
                      </div>
                      <span class="text-sm font-medium">{{ drawer.name }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Inventory Option -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-4">Inventario Inicial</label>
                <div class="space-y-3">
                  <label class="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all hover:border-blue-400"
                    :class="form.inventoryOption === 'manual' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white'"
                  >
                    <input 
                      type="radio" 
                      v-model="form.inventoryOption" 
                      value="manual"
                      class="w-5 h-5 text-blue-600"
                    >
                    <div>
                      <span class="font-medium text-slate-800">Crear manualmente</span>
                      <p class="text-sm text-slate-600">Agrega tus productos uno por uno después</p>
                    </div>
                  </label>

                  <label class="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all hover:border-blue-400"
                    :class="form.inventoryOption === 'upload' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white'"
                  >
                    <input 
                      type="radio" 
                      v-model="form.inventoryOption" 
                      value="upload"
                      class="w-5 h-5 text-blue-600"
                    >
                    <div>
                      <span class="font-medium text-slate-800">Subir archivo</span>
                      <p class="text-sm text-slate-600">Importa desde Excel o CSV</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <!-- Step 5: Confirmación -->
            <div v-if="currentStep === 5" key="step5" class="space-y-6 animate-fade-in">
              <div>
                <h2 class="text-2xl font-bold text-slate-800 mb-2">Confirma tu información</h2>
                <p class="text-slate-600">Verifica los datos antes de crear tu tienda</p>
              </div>

              <div class="bg-slate-50 rounded-xl p-6 space-y-4">
                <div class="flex items-center gap-4">
                  <div 
                    class="w-12 h-12 rounded-full flex items-center justify-center bg-blue-100 text-blue-600"
                  >
                    <LucideIcon :name="selectedIndustry?.icon || 'Store'" class="w-6 h-6" />
                  </div>
                  <div>
                    <p class="text-sm text-slate-600">Rubro</p>
                    <p class="font-semibold text-slate-800">{{ selectedIndustry?.name }}</p>
                  </div>
                </div>

                <div class="h-px bg-slate-200"></div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <p class="text-sm text-slate-600">Nombre de tienda</p>
                    <p class="font-semibold text-slate-800">{{ form.storeName }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-slate-600">RIF</p>
                    <p class="font-semibold text-slate-800">{{ form.rif }}</p>
                  </div>
                </div>

                <div class="h-px bg-slate-200"></div>

                <div>
                  <p class="text-sm text-slate-600">Ubicación</p>
                  <p class="font-semibold text-slate-800">{{ form.city }}, {{ form.state }}, {{ form.country }}</p>
                </div>

                <div class="h-px bg-slate-200"></div>

                <div>
                  <p class="text-sm text-slate-600">Plan</p>
                  <p class="font-semibold text-slate-800">{{ plans.find(p => p.id === form.plan)?.name }}</p>
                </div>

                <div class="h-px bg-slate-200"></div>

                <div>
                  <p class="text-sm text-slate-600">Gaveteros de Pago</p>
                  <p class="font-semibold text-slate-800">{{ paymentDrawerOptions.filter(d => form.paymentDrawers.includes(d.id)).map(d => d.name).join(', ') }}</p>
                </div>
              </div>

              <div class="bg-blue-50 rounded-xl p-4 flex items-start gap-3">
                <LucideIcon name="Info" class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p class="text-sm text-blue-800">
                  Al crear tu tienda, aceptas nuestros términos y condiciones. Podrás modificar esta información más tarde desde la configuración.
                </p>
              </div>
            </div>
          </div>

          <!-- Navigation Buttons -->
          <div class="flex justify-between mt-8 pt-6 border-t border-slate-200">
            <button
              v-if="currentStep > 1"
              @click="previousStep"
              class="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
            >
              Anterior
            </button>

            <div v-else></div>

            <button
              v-if="currentStep < steps.length"
              @click="nextStep"
              :disabled="!canProceed"
              class="px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>

            <button
              v-else
              @click="createTenant"
              :disabled="isSubmitting"
              class="px-6 py-3 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <LucideIcon v-if="isSubmitting" name="Loader2" class="w-4 h-4 animate-spin" />
              <span>{{ isSubmitting ? 'Creando tienda...' : 'Crear tienda' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LucideIcon from '@/components/lucide/LucideIcon.vue'

const router = useRouter()
const authStore = useAuthStore()

const currentStep = ref(1)
const isSubmitting = ref(false)

const steps = ['Rubro', 'Localización', 'Identidad y Plan', 'Configuración', 'Confirmación']

const industries = [
  { id: 'repuestos', name: 'Repuestos', icon: 'Wrench' },
  { id: 'calzado', name: 'Calzado', icon: 'Shoe' },
  { id: 'viveres', name: 'Víveres', icon: 'ShoppingCart' },
  { id: 'licores', name: 'Licores', icon: 'Wine' },
  { id: 'ferreteria', name: 'Ferretería', icon: 'Hammer' },
  { id: 'ropa', name: 'Ropa', icon: 'Shirt' },
  { id: 'tecnologia', name: 'Tecnología', icon: 'Laptop' },
  { id: 'farmacia', name: 'Farmacia', icon: 'Pill' },
  { id: 'restaurante', name: 'Restaurante', icon: 'Utensils' },
]

const selectedIndustry = ref(industries[0])

const form = ref({
  storeName: '',
  rif: '',
  country: '',
  state: '',
  city: '',
  logo: null as File | null,
  plan: 'basic' as 'basic' | 'pro' | 'enterprise',
  paymentDrawers: [] as string[],
  inventoryOption: 'manual' as 'manual' | 'upload',
  inventoryFile: null as File | null,
})

const states = computed(() => {
  if (form.value.country === 'VE') {
    return ['Distrito Capital', 'Miranda', 'Carabobo', 'Zulia', 'Aragua', 'Lara', 'Táchira', 'Mérida', 'Nueva Esparta', 'Anzoátegui']
  }
  if (form.value.country === 'CO') {
    return ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena']
  }
  if (form.value.country === 'PE') {
    return ['Lima', 'Arequipa', 'Cusco', 'Trujillo']
  }
  if (form.value.country === 'MX') {
    return ['Ciudad de México', 'Guadalajara', 'Monterrey', 'Puebla']
  }
  return []
})

const cities = computed(() => {
  if (form.value.country === 'VE' && form.value.state === 'Distrito Capital') {
    return ['Caracas']
  }
  if (form.value.country === 'VE' && form.value.state === 'Miranda') {
    return ['Los Teques', 'Charallave', 'Ocumare del Tuy']
  }
  if (form.value.country === 'VE' && form.value.state === 'Carabobo') {
    return ['Valencia', 'Naguanagua', 'Guacara']
  }
  if (form.value.country === 'VE' && form.value.state === 'Zulia') {
    return ['Maracaibo', 'Cabimas', 'Ciudad Ojeda']
  }
  if (form.value.country === 'CO' && form.value.state === 'Bogotá') {
    return ['Bogotá D.C.']
  }
  if (form.value.country === 'PE' && form.value.state === 'Lima') {
    return ['Lima', 'Miraflores', 'San Isidro']
  }
  if (form.value.country === 'MX' && form.value.state === 'Ciudad de México') {
    return ['Ciudad de México', 'Benito Juárez', 'Coyoacán']
  }
  return []
})

const plans = [
  {
    id: 'basic',
    name: 'Básico',
    price: '$0',
    period: 'Gratis',
    features: [
      '1 Punto de Venta',
      'Inventario básico',
      'Reportes simples',
      'Soporte por email'
    ],
    popular: false
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$29',
    period: '/mes',
    features: [
      '3 Puntos de Venta',
      'Inventario avanzado',
      'Reportes detallados',
      'Soporte prioritario',
      'Integración con bancos'
    ],
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$99',
    period: '/mes',
    features: [
      'Puntos de Venta ilimitados',
      'Inventario ilimitado',
      'Reportes personalizados',
      'Soporte 24/7',
      'API dedicado',
      'Multi-sucursal'
    ],
    popular: false
  }
]

const paymentDrawerOptions = [
  { id: 'cash', name: 'Caja Chica', icon: 'Wallet' },
  { id: 'bank', name: 'Banco', icon: 'Building2' },
  { id: 'mobile', name: 'Pago Móvil', icon: 'Smartphone' },
  { id: 'card', name: 'Tarjeta', icon: 'CreditCard' },
  { id: 'transfer', name: 'Transferencia', icon: 'ArrowRightLeft' },
]

const suggestedDrawersByIndustry = computed(() => {
  switch (selectedIndustry.value?.id) {
    case 'repuestos':
      return ['cash', 'bank', 'mobile', 'card']
    case 'calzado':
      return ['cash', 'card', 'mobile']
    case 'viveres':
      return ['cash', 'mobile', 'card']
    case 'licores':
      return ['cash', 'card', 'bank']
    case 'ferreteria':
      return ['cash', 'bank', 'mobile']
    case 'ropa':
      return ['cash', 'card', 'mobile']
    case 'tecnologia':
      return ['card', 'bank', 'transfer', 'mobile']
    case 'farmacia':
      return ['cash', 'card', 'mobile']
    case 'restaurante':
      return ['cash', 'card', 'mobile']
    default:
      return ['cash', 'mobile', 'card']
  }
})

const canProceed = computed(() => {
  if (currentStep.value === 1) {
    return selectedIndustry.value && form.value.storeName && form.value.rif
  }
  if (currentStep.value === 2) {
    return form.value.country && form.value.state && form.value.city
  }
  if (currentStep.value === 3) {
    return form.value.plan
  }
  if (currentStep.value === 4) {
    return form.value.paymentDrawers.length > 0
  }
  return true
})

const handleLogoUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    form.value.logo = target.files[0]
  }
}

const togglePaymentDrawer = (drawerId: string) => {
  const index = form.value.paymentDrawers.indexOf(drawerId)
  if (index > -1) {
    form.value.paymentDrawers.splice(index, 1)
  } else {
    form.value.paymentDrawers.push(drawerId)
  }
}

const selectPlan = (planId: 'basic' | 'pro' | 'enterprise') => {
  form.value.plan = planId
}

const applySuggestedDrawers = () => {
  form.value.paymentDrawers = [...suggestedDrawersByIndustry.value]
}

const selectIndustry = (industry: any) => {
  selectedIndustry.value = industry
}

const nextStep = () => {
  if (canProceed.value && currentStep.value < steps.length) {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const createTenant = async () => {
  try {
    isSubmitting.value = true

    // Llamada al backend para crear el tenant
    const response = await fetch('/api/tenants/register/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        store: {
          name: form.value.storeName,
          rif: form.value.rif,
          industry_type: selectedIndustry.value.id,
          country: form.value.country,
          state: form.value.state,
          city: form.value.city,
        },
        owner: {
          username: authStore.user?.username,
          email: authStore.user?.email,
        },
      }),
    })

    if (!response.ok) {
      throw new Error('Error al crear la tienda')
    }

    const data = await response.json()

    // Actualizar el store de autenticación
    await authStore.fetchUser()

    // Redirigir al dashboard
    router.push('/dashboard')
  } catch (error) {
    console.error('Error creando tenant:', error)
    alert('Error al crear la tienda. Por favor, intenta nuevamente.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.pattern-dots {
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}
</style>
