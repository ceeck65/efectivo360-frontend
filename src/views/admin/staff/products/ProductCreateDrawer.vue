<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-[100] flex justify-end">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="handleClose" />
      <div class="relative w-full max-w-lg h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-white/[0.06] shadow-2xl flex flex-col animate-slide-in">
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/[0.06] shrink-0">
          <div>
            <h2 class="text-base font-semibold text-slate-900 dark:text-white">Nuevo Producto</h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Crear producto en el catálogo del comercio</p>
          </div>
          <button @click="handleClose" class="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Tabs -->
        <div class="flex border-b border-slate-200 dark:border-white/[0.06] px-5 shrink-0">
          <button v-for="tab in tabs" :key="tab.key"
            @click="activeTab = tab.key"
            class="px-4 py-3 text-xs font-semibold border-b-2 transition-colors -mb-px"
            :class="activeTab === tab.key
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'">
            {{ tab.label }}
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <!-- ================================================================ -->
          <!-- TAB: Información General -->
          <!-- ================================================================ -->
          <div v-show="activeTab === 'general'">
            <!-- Dual Search: Local Inventory + Global Catalog -->
            <ProductDualSearch
              @select-local="onSelectLocal"
              @select-global="onSelectGlobal"
              @create-custom="onCreateCustom"
            />
            <hr class="border-slate-200 dark:border-white/[0.06]" />
            <!-- Image -->
            <div>
              <label class="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Imagen del Producto</label>
              <div @click="showImageStudio = true" class="relative flex flex-col items-center justify-center w-full h-40 rounded-xl border-2 border-dashed cursor-pointer transition-colors overflow-hidden"
                :class="form.image
                  ? 'border-emerald-300 bg-emerald-50/30 dark:bg-emerald-500/[0.04]'
                  : 'border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] hover:border-slate-400 dark:hover:border-white/[0.15]'">
                <img v-if="form.image" :src="form.image" class="max-h-full max-w-full object-contain p-2" alt="Preview" />
                <div v-else class="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500">
                  <ImagePlus class="w-8 h-8" />
                  <span class="text-xs font-medium">Haz clic para abrir el editor de imagen</span>
                  <span class="text-[10px]">Recomendado: 400x400px, formato cuadrado</span>
                </div>
              </div>
              <div v-if="form.image" class="flex items-center justify-between mt-2">
                <span class="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 class="w-3.5 h-3.5" /> Imagen cargada
                </span>
                <button @click.stop="removeImage" type="button" class="text-[11px] text-red-500 hover:text-red-600 font-medium flex items-center gap-1 transition-colors">
                  <Trash2 class="w-3.5 h-3.5" /> Eliminar
                </button>
              </div>
            </div>

            <!-- Barcode -->
            <div>
              <label class="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Código de Barras</label>
              <div class="flex gap-2">
                <div class="flex-1 relative">
                  <input v-model="form.barcode" type="text" placeholder="EAN-13, UPC, etc."
                    class="w-full h-9 px-3 pr-8 text-sm border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 placeholder-slate-400 rounded-lg focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50 focus:outline-none transition-colors"
                    :class="{'border-red-400 bg-red-50 dark:bg-red-500/[0.04]': errors.barcode}" @input="errors.barcode = ''" @keydown.enter.prevent="lookupBarcode(form.barcode)" @blur="lookupBarcode(form.barcode)" />
                  <Loader2 v-if="searchingBarcode" class="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />
                </div>
                <button type="button" @click="toggleScanner"
                  class="h-9 px-3 rounded-lg text-sm font-medium border transition-colors flex items-center gap-1.5 shrink-0"
                  :class="scanning ? 'bg-blue-500/20 border-blue-500/40 text-blue-600 dark:text-blue-400' : 'border-slate-300 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.04]'">
                  <ScanBarcode v-if="!scanning" class="w-4 h-4" />
                  <ScanLine v-else class="w-4 h-4 animate-pulse" />
                </button>
              </div>
              <p v-if="errors.barcode" class="text-[11px] text-red-500 mt-1">{{ errors.barcode }}</p>
              <div v-if="isCheckingBarcode" class="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                <Loader2 class="w-3.5 h-3.5 animate-spin" /> Verificando en catálogo global...
              </div>
              <div v-if="isNewProductGlobal" class="mt-2 p-3 bg-blue-50 dark:bg-blue-500/[0.06] border border-blue-200 dark:border-blue-500/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                <span class="font-bold">✨ ¡Producto Nuevo detectado!</span> Este artículo no se encuentra en el catálogo global de Efectivo 360. Se registrará localmente en tu inventario y pasará a nuestra mesa de control para su verificación y aprobación global.
              </div>
            </div>

            <BarcodeScanner
              id="product-create-scanner"
              :scanning="scanning"
              @scan="(txt: string) => { form.barcode = txt; lookupBarcode(txt); }"
              @close="scanning = false"
            />

            <!-- Name -->
            <div>
              <label class="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Nombre <span class="text-red-400">*</span></label>
              <input v-model="form.name" type="text" placeholder="Nombre del producto"
                class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 placeholder-slate-400 rounded-lg focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50 focus:outline-none transition-colors"
                :class="{'border-red-400 bg-red-50 dark:bg-red-500/[0.04]': errors.name}" @input="errors.name = ''" />
              <p v-if="errors.name" class="text-[11px] text-red-500 mt-1">{{ errors.name }}</p>
            </div>

            <!-- SKU -->
            <div>
              <label class="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">SKU <span class="text-red-400">*</span></label>
              <input v-model="form.sku" type="text" placeholder="SKU único"
                class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 placeholder-slate-400 rounded-lg focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50 focus:outline-none transition-colors"
                :class="{'border-red-400 bg-red-50 dark:bg-red-500/[0.04]': errors.sku}" @input="errors.sku = ''" />
              <p v-if="errors.sku" class="text-[11px] text-red-500 mt-1">{{ errors.sku }}</p>
            </div>

            <!-- Category async select -->
            <CategoryAsyncSelect v-model="selectedCategoryId" @select="onCategorySelect" />

            <!-- Brand async select + creatable -->
            <BrandCreatableSelect
              :key="selectedCategoryId ?? 'empty-brand-select'"
              v-model="form.brand"
              :options="brands"
              :loading="loadingBrands"
              :disabled="!selectedCategoryId"
              placeholder="Buscar o crear marca..."
              @create-inline="onBrandCreateInline"
            />

            <!-- IVA Type + Switch Módulo Fiscal + Alerta Preventiva -->
            <div>
              <!-- Switch: Módulo Fiscal -->
              <label class="flex items-center gap-3 cursor-pointer select-none mb-2">
                <div class="relative w-[38px] h-[20px]">
                  <input type="checkbox" v-model="fiscalModuleEnabled" class="sr-only peer" />
                  <div class="w-[38px] h-[20px] rounded-full bg-slate-300 dark:bg-white/[0.12] peer-checked:bg-blue-600 transition-colors" />
                  <div class="absolute top-[2px] left-[2px] w-[16px] h-[16px] rounded-full bg-white shadow-sm peer-checked:translate-x-[18px] transition-transform" />
                </div>
                <span class="text-[11px] font-medium text-slate-600 dark:text-slate-400">⚙️ Simular/Activar Módulo Fiscal para este Producto</span>
              </label>

              <template v-if="fiscalModuleEnabled">
                <label class="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Tipo de IVA</label>
                <select v-model="form.iva_type"
                  class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 rounded-lg focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50 focus:outline-none transition-colors appearance-none cursor-pointer"
                  :class="{'border-amber-400 dark:border-amber-500/50': showFiscalWarning}">
                  <option value="GENERAL">IVA General 16%</option>
                  <option value="REDUCED">IVA Reducido 8%</option>
                  <option value="AMPLIADO">IVA Ampliado 22%</option>
                  <option value="EXENTO">Exento</option>
                </select>

                <p v-if="!fiscalSettings.enable_iva" class="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                  Módulo fiscal desactivado — se usará Exento por defecto
                </p>

                <!-- ⚠️ ALERTA FISCAL PREVENTIVA -->
                <div v-if="showFiscalWarning"
                  class="mt-2 rounded-lg border border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/[0.06] p-3">
                  <div class="flex items-start gap-2.5">
                    <AlertTriangle class="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p class="text-[11px] font-bold text-red-800 dark:text-red-300 uppercase tracking-wider">Advertencia Legal</p>
                      <p class="text-[10px] leading-relaxed text-red-700 dark:text-red-400 mt-1">
                        Esta tienda <strong>no está registrada como Contribuyente Especial</strong> en la configuración del negocio.
                        Activar el módulo fiscal o emitir alícuotas de IVA sin la debida adecuación técnica y máquinas fiscales
                        autorizadas por el <strong>SENIAT</strong> puede acarrear severas sanciones fiscales, clausuras y multas legales.
                      </p>
                    </div>
                  </div>
                </div>
              </template>
              <p v-else class="text-[11px] text-slate-400 dark:text-slate-500 italic">
                El producto se registrará como <strong>EXENTO</strong> de IVA.
              </p>
            </div>

            <!-- Description -->
            <div>
              <label class="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Descripción</label>
              <textarea v-model="form.description" rows="2" placeholder="Descripción opcional..."
                class="w-full px-3 py-2 text-sm border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 placeholder-slate-400 rounded-lg focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50 focus:outline-none transition-colors resize-none"></textarea>
            </div>

          </div>

          <!-- ================================================================ -->
          <!-- TAB: Precios y Logística -->
          <!-- ================================================================ -->
          <div v-show="activeTab === 'pricing'">
            <!-- Initial Stock Banner -->
            <div class="bg-amber-50 dark:bg-amber-500/[0.06] border border-amber-200 dark:border-amber-500/20 rounded-lg p-3">
              <div class="flex items-center gap-2 mb-2">
                <PackagePlus class="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span class="text-xs font-semibold text-amber-800 dark:text-amber-300">Inventario Inicial</span>
              </div>
              <p class="text-[11px] text-amber-700 dark:text-amber-400 mb-3">Si registras stock inicial, se creará automáticamente una capa de inventario con el costo indicado.</p>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">Stock Físico Inicial</label>
                  <input v-model.number="form.initial_physical_stock" type="number" min="0" step="0.001" placeholder="0"
                    class="w-full h-9 px-3 text-sm border border-amber-300 dark:border-amber-500/30 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-slate-200 placeholder-slate-400 rounded-lg focus:ring-amber-500/20 focus:border-amber-400 focus:outline-none transition-colors" />
                  <span class="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 block">{{ isContinuousUnit ? 'Kg / Litros' : 'Unidades' }}</span>
                </div>
                <div>
                  <label class="block text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">Costo Unit. Inicial USD</label>
                  <input type="text" inputmode="decimal" placeholder="0,00"
                    :value="miInitCost.display.value"
                    @focus="miInitCost.onFocus"
                    @input="miInitCost.onInput"
                    @blur="miInitCost.onBlur"
                    class="w-full h-9 px-3 text-sm border border-amber-300 dark:border-amber-500/30 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-slate-200 placeholder-slate-400 rounded-lg focus:ring-amber-500/20 focus:border-amber-400 focus:outline-none transition-colors" />
                </div>
              </div>
            </div>

            <!-- Selector de Tipo de Medida (Unidad / Peso / Líquido) -->
            <div class="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.08] rounded-lg p-4 space-y-3">
              <div class="flex items-center gap-2">
                <Package class="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span class="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Unidad de Medida</span>
              </div>
              <div class="grid grid-cols-3 gap-2">
                <button type="button" @click="form.measurement_type = 'UNIDAD'; form.container_type = 'CAJA'"
                  class="flex flex-col items-center justify-center h-14 rounded-xl border-2 font-semibold text-xs transition-colors"
                  :class="form.measurement_type === 'UNIDAD' ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/[0.06] text-blue-600 dark:text-blue-400' : 'border-slate-200 dark:border-white/[0.08] text-slate-500 dark:text-slate-400 hover:border-slate-300'">
                  <span class="text-base">📦</span>
                  <span>Unidad</span>
                </button>
                <button type="button" @click="form.measurement_type = 'PESO'; form.container_type = 'SACO'"
                  class="flex flex-col items-center justify-center h-14 rounded-xl border-2 font-semibold text-xs transition-colors"
                  :class="form.measurement_type === 'PESO' ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/[0.06] text-blue-600 dark:text-blue-400' : 'border-slate-200 dark:border-white/[0.08] text-slate-500 dark:text-slate-400 hover:border-slate-300'">
                  <span class="text-base">⚖️</span>
                  <span>Peso</span>
                </button>
                <button type="button" @click="form.measurement_type = 'LIQUIDO'; form.container_type = 'BIDON'"
                  class="flex flex-col items-center justify-center h-14 rounded-xl border-2 font-semibold text-xs transition-colors"
                  :class="form.measurement_type === 'LIQUIDO' ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/[0.06] text-blue-600 dark:text-blue-400' : 'border-slate-200 dark:border-white/[0.08] text-slate-500 dark:text-slate-400 hover:border-slate-300'">
                  <span class="text-base">🧪</span>
                  <span>Líquido</span>
                </button>
              </div>

              <!-- Selector de sub‑tipo de contenedor para PESO -->
              <div v-if="form.measurement_type === 'UNIDAD'" class="pt-2">
                <label class="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Tipo de empaque</label>
                <div class="flex gap-1 p-0.5 bg-slate-100 dark:bg-white/[0.04] rounded-lg w-fit">
                  <button type="button" @click="form.container_type = 'CAJA'" class="px-3 py-1.5 text-xs font-semibold rounded-md transition-colors"
                    :class="form.container_type === 'CAJA' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'">📦 Caja</button>
                  <button type="button" @click="form.container_type = 'BULTO'" class="px-3 py-1.5 text-xs font-semibold rounded-md transition-colors"
                    :class="form.container_type === 'BULTO' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'">📦 Bulto</button>
                  <button type="button" @click="form.container_type = 'PAQUETE'" class="px-3 py-1.5 text-xs font-semibold rounded-md transition-colors"
                    :class="form.container_type === 'PAQUETE' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'">📦 Paquete</button>
                </div>
              </div>

              <div v-if="form.measurement_type === 'PESO'" class="pt-2 space-y-2">
                <label class="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Tipo de empaque</label>
                <div class="flex gap-1 p-0.5 bg-slate-100 dark:bg-white/[0.04] rounded-lg w-fit">
                  <button type="button" @click="form.weight_container = 'SACO'" class="px-3 py-1.5 text-xs font-semibold rounded-md transition-colors"
                    :class="form.weight_container === 'SACO' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'">👜 Saco</button>
                  <button type="button" @click="form.weight_container = 'CESTA'" class="px-3 py-1.5 text-xs font-semibold rounded-md transition-colors"
                    :class="form.weight_container === 'CESTA' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'">🧺 Cesta</button>
                  <button type="button" @click="form.weight_container = 'BUN_CAJA'" class="px-3 py-1.5 text-xs font-semibold rounded-md transition-colors"
                    :class="form.weight_container === 'BUN_CAJA' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'">📦 Bún / Caja</button>
                  <button type="button" @click="form.weight_container = 'KG_DIRECTO'" class="px-3 py-1.5 text-xs font-semibold rounded-md transition-colors"
                    :class="form.weight_container === 'KG_DIRECTO' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'">⚖️ Kg directo</button>
                </div>
              </div>

              <div v-if="form.measurement_type === 'LIQUIDO'" class="pt-2 space-y-2">
                <label class="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Tipo de empaque</label>
                <div class="flex gap-1 p-0.5 bg-slate-100 dark:bg-white/[0.04] rounded-lg w-fit">
                  <button type="button" @click="form.liquid_container = 'BIDON'" class="px-3 py-1.5 text-xs font-semibold rounded-md transition-colors"
                    :class="form.liquid_container === 'BIDON' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'">🛢️ Bidón</button>
                  <button type="button" @click="form.liquid_container = 'TAMBOR'" class="px-3 py-1.5 text-xs font-semibold rounded-md transition-colors"
                    :class="form.liquid_container === 'TAMBOR' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'">🥁 Tambor</button>
                  <button type="button" @click="form.liquid_container = 'GALON'" class="px-3 py-1.5 text-xs font-semibold rounded-md transition-colors"
                    :class="form.liquid_container === 'GALON' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'">⛽ Galón</button>
                  <button type="button" @click="form.liquid_container = 'LT_DIRECTO'" class="px-3 py-1.5 text-xs font-semibold rounded-md transition-colors"
                    :class="form.liquid_container === 'LT_DIRECTO' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'">🧪 Litro directo</button>
                </div>
              </div>

              <!-- Campos de cantidad y capacidad (genéricos, labels dinámicos) -->
              <div class="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label class="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    {{ form.measurement_type === 'PESO'
                      ? (form.weight_container === 'KG_DIRECTO' ? 'Cantidad de Kg' : 'Cantidad de ' + (form.weight_container === 'SACO' ? 'Sacos' : form.weight_container === 'CESTA' ? 'Cestas' : 'Bún / Cajas'))
                      : form.measurement_type === 'LIQUIDO'
                        ? (form.liquid_container === 'LT_DIRECTO' ? 'Cantidad de Litros' : 'Cantidad de ' + (form.liquid_container === 'BIDON' ? 'Bidones' : form.liquid_container === 'TAMBOR' ? 'Tambores' : 'Galones'))
                        : 'Cantidad de ' + (form.container_type === 'CAJA' ? 'Cajas' : form.container_type === 'BULTO' ? 'Bultos' : 'Paquetes')
                    }}
                  </label>
                  <input v-model.number="form.cantidad_contenedores" type="number" min="1" step="1" placeholder="1"
                    class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 placeholder-slate-400 rounded-lg focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50 focus:outline-none transition-colors" />
                </div>
                <div>
                  <label class="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    {{ form.measurement_type === 'PESO'
                      ? (form.weight_container === 'KG_DIRECTO' ? 'Kg por contenedor' : 'Kg por ' + (form.weight_container === 'SACO' ? 'Saco' : form.weight_container === 'CESTA' ? 'Cesta' : 'Bún / Caja'))
                      : form.measurement_type === 'LIQUIDO'
                        ? (form.liquid_container === 'LT_DIRECTO' ? 'Litros por contenedor' : 'Litros por ' + (form.liquid_container === 'BIDON' ? 'Bidón' : form.liquid_container === 'TAMBOR' ? 'Tambor' : 'Galón'))
                        : 'Unidades por ' + (form.container_type === 'CAJA' ? 'Caja' : form.container_type === 'BULTO' ? 'Bulto' : 'Paquete')
                    }}
                  </label>
                  <input v-model.number="form.capacidad_por_contenedor" type="number" min="0.1" step="0.1" placeholder="1"
                    class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 placeholder-slate-400 rounded-lg focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50 focus:outline-none transition-colors" />
                </div>
              </div>

              <!-- Stock total calculado en lenguaje humano -->
              <div class="bg-blue-50 dark:bg-blue-500/[0.06] border border-blue-200 dark:border-blue-500/20 rounded-lg p-3">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Stock Total Calculado</span>
                  <span class="text-sm font-mono font-bold text-blue-900 dark:text-blue-200">
                    {{ calculatedStockTotal }}
                    <span class="text-[10px] font-normal">
                      {{ form.measurement_type === 'PESO'
                        ? 'Kg'
                        : form.measurement_type === 'LIQUIDO'
                          ? 'Litros'
                          : 'Unidades'
                      }}
                    </span>
                    <span class="text-[10px] text-blue-500 dark:text-blue-400 ml-1">
                      ({{ form.cantidad_contenedores }} {{ form.measurement_type === 'PESO'
                        ? (form.weight_container === 'KG_DIRECTO' ? 'Kg' : '× ' + form.capacidad_por_contenedor + ' Kg/' + (form.weight_container === 'SACO' ? 'saco' : form.weight_container === 'CESTA' ? 'cesta' : 'bún'))
                        : form.measurement_type === 'LIQUIDO'
                          ? (form.liquid_container === 'LT_DIRECTO' ? 'Litros' : '× ' + form.capacidad_por_contenedor + ' L/' + (form.liquid_container === 'BIDON' ? 'bidón' : form.liquid_container === 'TAMBOR' ? 'tambor' : 'galón'))
                          : '× ' + form.capacidad_por_contenedor + ' uds/' + (form.container_type === 'CAJA' ? 'caja' : form.container_type === 'BULTO' ? 'bulto' : 'paquete')
                      }})
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <!-- Costos y Flete Mayorista (con conversión VES→USD) -->
            <div class="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.08] rounded-lg p-4 space-y-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Package class="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span class="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Costos y Flete Mayorista</span>
                </div>
                <!-- Currency toggle -->
                <div class="flex gap-1 p-0.5 bg-slate-100 dark:bg-white/[0.04] rounded-lg w-fit">
                  <button type="button" @click="selectedInvoiceCurrency = 'USD'"
                    class="px-3 py-1 text-[10px] font-semibold rounded-md transition-colors"
                    :class="selectedInvoiceCurrency === 'USD' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'">
                    USD ($)
                  </button>
                  <button type="button" @click="selectedInvoiceCurrency = 'VES'"
                    class="px-3 py-1 text-[10px] font-semibold rounded-md transition-colors"
                    :class="selectedInvoiceCurrency === 'VES' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'">
                    VES (Bs.)
                  </button>
                </div>
              </div>

              <!-- Badge informativo (solo lectura) -->
              <div class="p-3 bg-blue-50/50 dark:bg-blue-500/[0.04] border border-blue-200 dark:border-blue-500/20 rounded-lg text-xs text-blue-800 dark:text-blue-300 flex items-center justify-between">
                <span>Distribución de costos para:</span>
                <span class="font-bold bg-blue-100 dark:bg-blue-500/[0.12] px-2.5 py-1 rounded-md text-sm text-blue-700 dark:text-blue-300">
                  {{ form.cantidad_contenedores }} {{ containerLabel }}{{ form.cantidad_contenedores !== 1 ? 's' : '' }}
                  <span class="text-[10px] opacity-70">({{ form.capacidad_por_contenedor }}
                    {{ form.measurement_type === 'PESO' ? 'Kg' : form.measurement_type === 'LIQUIDO' ? 'L' : 'uds' }} c/u)</span>
                </span>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Costo Total del {{ containerLabel }} ({{ selectedInvoiceCurrency === 'USD' ? 'USD' : 'VES' }})
                  </label>
                  <input v-model.number="UIFields.costo_ingresado_usuario" type="number" min="0" step="0.01" placeholder="0.00"
                    class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 placeholder-slate-400 rounded-lg focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50 focus:outline-none transition-colors" />
                </div>
                <div>
                  <label class="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Flete / Importación ({{ selectedInvoiceCurrency === 'USD' ? 'USD' : 'VES' }})
                  </label>
                  <input v-model.number="UIFields.flete_ingresado_usuario" type="number" min="0" step="0.01" placeholder="0.00"
                    class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 placeholder-slate-400 rounded-lg focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50 focus:outline-none transition-colors" />
                </div>
              </div>

              <!-- Custom exchange rate (solo cuando la factura es en VES) -->
              <div v-if="selectedInvoiceCurrency === 'VES'" class="p-3 bg-amber-50/50 dark:bg-amber-500/[0.04] border border-amber-200 dark:border-amber-500/20 rounded-lg">
                <label class="block text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">
                  Tasa de Cambio de la Factura ({{ selectedInvoiceCurrency === 'VES' ? 'Bs. por USD' : '' }})
                </label>
                <input v-model.number="dekaRate" type="number" min="0" step="0.01" :placeholder="rateValue > 0 ? String(rateValue) : '0.00'"
                  class="w-full h-9 px-3 text-sm border border-amber-300 dark:border-amber-500/30 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-slate-200 placeholder-slate-400 rounded-lg focus:ring-amber-500/20 focus:border-amber-400 focus:outline-none transition-colors" />
                <p v-if="dekaRate > 0 && UIFields.costo_ingresado_usuario > 0" class="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                  Costo en USD: <strong>${{ fmt(finalCostoBultoUSD) }}</strong>
                  <span v-if="UIFields.flete_ingresado_usuario > 0">
                    · Flete: <strong>${{ fmt(finalFleteUSD) }}</strong>
                  </span>
                </p>
              </div>

              <!-- Costo unitario calculado -->
              <div v-if="finalCostoBultoUSD > 0" class="bg-blue-50 dark:bg-blue-500/[0.06] border border-blue-200 dark:border-blue-500/20 rounded-lg p-3">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Costo Unitario</span>
                  <span class="text-sm font-mono font-bold text-blue-900 dark:text-blue-200">
                    $ {{ fmt(bulkUnitCost) }}
                  </span>
                </div>
                <p class="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">
                  ({{ form.cantidad_contenedores }} × <template v-if="selectedInvoiceCurrency === 'VES'">Bs. {{ fmt(UIFields.costo_ingresado_usuario) }} / {{ fmt(dekaRate) }} = </template>${{ fmt(finalCostoBultoUSD) }}
                  <template v-if="finalFleteUSD > 0"> + ${{ fmt(finalFleteUSD) }} flete</template>)
                  / {{ form.cantidad_contenedores * form.capacidad_por_contenedor }}
                  {{ form.measurement_type === 'PESO' ? 'Kg' : form.measurement_type === 'LIQUIDO' ? 'L' : 'uds' }}
                  = <strong>${{ fmt(bulkUnitCost) }}</strong>
                </p>
                <div v-if="rateValue > 0 && bulkUnitCost > 0" class="mt-1.5 pt-1.5 border-t border-blue-200 dark:border-blue-500/20">
                  <span class="text-[10px] text-blue-600 dark:text-blue-400">Equivalente en VES (BCV):</span>
                  <span class="text-sm font-mono font-bold text-blue-900 dark:text-blue-200 ml-2">
                    {{ fmtVES(bcvRound(bulkUnitCost * rateValue, 2)) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Cost & Margin Card -->
            <div class="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.08] rounded-lg p-4 space-y-3">
              <div class="flex items-center gap-2">
                <Percent class="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span class="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Costo y Margen</span>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Costo USD</label>
                  <input type="text" inputmode="decimal" placeholder="0,00"
                    :value="miCostUsd.display.value"
                    @focus="miCostUsd.onFocus"
                    @input="miCostUsd.onInput"
                    @blur="miCostUsd.onBlur"
                    class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 placeholder-slate-400 rounded-lg focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50 focus:outline-none transition-colors" />
                </div>
                <div>
                  <label class="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Costo VES</label>
                  <input type="text" inputmode="decimal" placeholder="0,00"
                    :value="miCostVes.display.value"
                    @focus="miCostVes.onFocus"
                    @input="miCostVes.onInput"
                    @blur="miCostVes.onBlur"
                    class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 placeholder-slate-400 rounded-lg focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50 focus:outline-none transition-colors" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Margen %</label>
                  <input v-model.number="form.profit_margin" type="number" min="0" max="100" step="0.5" placeholder="30"
                    @input="recalcSuggested"
                    class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 placeholder-slate-400 rounded-lg focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50 focus:outline-none transition-colors" />
                </div>
                <div>
                  <div class="flex items-center gap-1.5 mb-1">
                    <label class="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tipo de Margen</label>
                    <span class="relative inline-flex items-center" @click.stop="toggleTooltip('marginType')">
                      <Info class="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 transition-colors" />
                      <div v-if="showMarginTypeTooltip" class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 rounded-lg bg-slate-800 dark:bg-slate-700 text-white text-[11px] leading-relaxed shadow-xl z-50" @click.stop>
                        <p class="font-semibold text-blue-300 text-[10px] uppercase tracking-wider mb-1">TRADICIONAL (SUMA)</p>
                        <p class="mb-2 text-slate-200">Calcula tu ganancia sumando un porcentaje directo sobre tu costo base. Ideal para operaciones comerciales sencillas.</p>
                        <p class="font-semibold text-blue-300 text-[10px] uppercase tracking-wider mb-1">FINANCIERO (PROTECCIÓN)</p>
                        <p class="text-slate-200">Aplica la fórmula financiera de margen sobre precio de venta, protegiendo tu utilidad real contra fluctuaciones e inflación al reponer inventario. Es la opción recomendada para mantener tu capital sano.</p>
                        <div class="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800 dark:border-t-slate-700" />
                      </div>
                    </span>
                  </div>
                  <select v-model="form.margin_type" @change="recalcSuggested"
                    class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 rounded-lg focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50 focus:outline-none transition-colors appearance-none cursor-pointer">
                    <option value="TRADITIONAL">Tradicional (suma)</option>
                    <option value="FINANCIAL">Financiero (protección)</option>
                  </select>
                </div>
              </div>

              <!-- Suggested Prices -->
              <div class="bg-blue-50 dark:bg-blue-500/[0.06] border border-blue-200 dark:border-blue-500/20 rounded-lg p-3">
                <div class="flex items-center gap-2 mb-2">
                  <BadgeDollarSign class="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span class="text-xs font-semibold text-blue-800 dark:text-blue-300">Precios Sugeridos</span>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <span class="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">USD</span>
                    <p class="text-lg font-mono font-bold text-blue-900 dark:text-blue-200">{{ fmtUSD(suggestedPriceUsdNum) }}</p>
                  </div>
                  <div>
                    <span class="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">VES</span>
                    <p class="text-lg font-mono font-bold text-blue-900 dark:text-blue-200">{{ suggestedPriceVes }}</p>
                    <p v-if="rateValue > 0" class="text-[10px] text-blue-500 dark:text-blue-400">Tasa BCV: {{ fmtVES(rateValue) }}</p>
                    <p v-else class="text-[10px] text-amber-500 dark:text-amber-400">Cargando tasa BCV...</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Final Prices -->
            <div class="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.08] rounded-lg p-4 space-y-3">
              <div class="flex items-center gap-2">
                <DollarSign class="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span class="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Precios de Venta</span>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Precio USD</label>
                  <input type="text" inputmode="decimal" placeholder="0,00"
                    :value="miPriceUsd.display.value"
                    @focus="miPriceUsd.onFocus"
                    @input="miPriceUsd.onInput"
                    @blur="miPriceUsd.onBlur"
                    class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 placeholder-slate-400 rounded-lg focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50 focus:outline-none transition-colors" />
                </div>
                <div>
                  <label class="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Precio VES</label>
                  <input type="text" inputmode="decimal" placeholder="0,00"
                    :value="miPriceVes.display.value"
                    @focus="miPriceVes.onFocus"
                    @input="miPriceVes.onInput"
                    @blur="miPriceVes.onBlur"
                    class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 placeholder-slate-400 rounded-lg focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50 focus:outline-none transition-colors" />
                </div>
              </div>
            </div>

            <!-- Logistics base -->
            <div class="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.08] rounded-lg p-4 space-y-3">
              <div class="flex items-center gap-2">
                <Package class="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span class="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Logística</span>
              </div>
              <div>
                <label class="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Estrategia de Inventario</label>
                <select v-model="form.inventory_type"
                  class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 rounded-lg focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50 focus:outline-none transition-colors appearance-none cursor-pointer">
                  <option value="KARDEX">Kardex — Control transaccional</option>
                  <option value="SIMPLE">Simple — Stock directo</option>
                  <option value="NONE">Servicio — Sin inventario</option>
                </select>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <div class="flex items-center gap-1.5 mb-1">
                    <label class="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Método de Inventario</label>
                    <span class="relative inline-flex items-center" @click.stop="toggleTooltip('inventoryMethod')">
                      <Info class="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 transition-colors" />
                      <div v-if="showInventoryMethodTooltip" class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 rounded-lg bg-slate-800 dark:bg-slate-700 text-white text-[11px] leading-relaxed shadow-xl z-50" @click.stop>
                        <p class="font-semibold text-blue-300 text-[10px] uppercase tracking-wider mb-1">PROMEDIO PONDERADO</p>
                        <p class="mb-2 text-slate-200">Mezcla los costos de bultos viejos y nuevos para darte un costo medio estable. La mejor decisión para abarrotes, víveres, bodegas y productos de alta rotación homogénea.</p>
                        <p class="font-semibold text-blue-300 text-[10px] uppercase tracking-wider mb-1">FIFO (PEPS)</p>
                        <p class="mb-2 text-slate-200">El primer producto que entra es el primero que sale. Ideal si vendes artículos perecederos, alimentos con vencimiento o moda, asegurando que el stock antiguo se agote primero.</p>
                        <p class="font-semibold text-blue-300 text-[10px] uppercase tracking-wider mb-1">LIFO (UEPS)</p>
                        <p class="text-slate-200">El último bulto que entra es el primero que se vende. Útil en entornos inflacionarios muy severos para indexar el costo al precio más nuevo del mercado (usa con discreción fiscal).</p>
                        <div class="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800 dark:border-t-slate-700" />
                      </div>
                    </span>
                  </div>
                  <select v-model="form.inventory_method"
                    class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 rounded-lg focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50 focus:outline-none transition-colors appearance-none cursor-pointer">
                    <option value="AVERAGE">Promedio Ponderado</option>
                    <option value="FIFO">FIFO</option>
                    <option value="LIFO">LIFO</option>
                  </select>
                </div>
                <div>
                  <label class="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Unidad de Compra</label>
                  <select v-model="form.default_purchase_unit"
                    class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 rounded-lg focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50 focus:outline-none transition-colors appearance-none cursor-pointer">
                    <option value="UNIT">Unidad</option>
                    <option value="BOX">Caja</option>
                    <option value="BULK">Bulto</option>
                    <option value="SACK">Saco</option>
                    <option value="LOT">Lote</option>
                    <option value="KG">KG</option>
                    <option value="LITER">Litro</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Unidades por Empaque</label>
                <input v-model.number="form.units_per_package" type="number" min="1" step="1" placeholder="1"
                  class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 placeholder-slate-400 rounded-lg focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50 focus:outline-none transition-colors" />
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-5 py-4 border-t border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.01] flex items-center gap-3 shrink-0">
          <button @click="handleClose" class="flex-1 h-10 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors">Cancelar</button>
          <button @click="handleSubmit" :disabled="submitting"
            class="flex-[2] h-10 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20">
            <Save v-if="!submitting" class="w-4 h-4" />
            <Loader2 v-else class="w-4 h-4 animate-spin" />
            {{ submitting ? 'Guardando...' : 'Guardar Producto' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Brand Creation Modal -->
  <Teleport to="body">
    <div v-if="showBrandModal" class="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showBrandModal = false" />
      <div class="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.06] rounded-xl shadow-2xl max-w-md w-full p-5 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-slate-900 dark:text-white">Crear Marca Propia</h3>
          <button @click="showBrandModal = false" class="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Name -->
        <div class="mb-3">
          <label class="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Nombre de la Marca <span class="text-red-400">*</span></label>
          <input v-model="newBrandName" type="text" placeholder="Ej: Mi Marca Propia"
            class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 placeholder-slate-400 rounded-lg focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50 focus:outline-none transition-colors"
            :class="{'border-red-400 bg-red-50 dark:bg-red-500/[0.04]': brandFormErrors.name}" @input="brandFormErrors.name = ''" />
          <p v-if="brandFormErrors.name" class="text-[11px] text-red-500 mt-1">{{ brandFormErrors.name }}</p>
        </div>

        <!-- Image -->
        <div class="mb-3">
          <label class="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Logo de la Marca</label>
          <div @click="showBrandImageStudio = true" class="relative flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed cursor-pointer transition-colors overflow-hidden"
            :class="newBrandLogo
              ? 'border-emerald-300 bg-emerald-50/30 dark:bg-emerald-500/[0.04]'
              : 'border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] hover:border-slate-400 dark:hover:border-white/[0.15]'">
            <img v-if="newBrandLogo" :src="newBrandLogo" class="max-h-full max-w-full object-contain p-2" alt="Logo preview" />
            <div v-else class="flex flex-col items-center gap-1.5 text-slate-400 dark:text-slate-500">
              <Camera class="w-6 h-6" />
              <span class="text-[11px] font-medium">Haz clic para abrir el editor de imagen</span>
            </div>
          </div>
          <div v-if="newBrandLogo" class="flex justify-end mt-1">
            <button @click.stop="newBrandLogo = ''" type="button" class="text-[11px] text-red-500 hover:text-red-600 font-medium flex items-center gap-1 transition-colors">
              <Trash2 class="w-3.5 h-3.5" /> Eliminar logo
            </button>
          </div>
        </div>

        <!-- Category -->
        <div class="mb-3">
          <CategoryAsyncSelect v-model="newBrandCategoryId" />
        </div>

        <!-- Policy -->
        <div class="rounded-lg bg-blue-50 dark:bg-blue-500/[0.06] border border-blue-200 dark:border-blue-500/20 p-3 mb-4">
          <div class="flex items-start gap-2">
            <Info class="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p class="text-[11px] font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider mb-1">Política de Comunidad</p>
              <p class="text-[10px] leading-relaxed text-blue-700 dark:text-blue-400">
                Podrás utilizar esta marca inmediatamente en tu tienda para no detener tu operación. Sin embargo, nuestro equipo especializado de Efectivo 360 verificará y aprobará la marca para asegurar los estándares de calidad del catálogo global y las políticas comunitarias de la empresa.
              </p>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3">
          <button @click="showBrandModal = false" class="h-9 px-4 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors">Cancelar</button>
          <button @click="createBrand" :disabled="creatingBrand"
            class="h-9 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-40 transition-colors flex items-center gap-2">
            <Loader2 v-if="creatingBrand" class="w-4 h-4 animate-spin" />
            <Save v-else class="w-4 h-4" />
            {{ creatingBrand ? 'Creando...' : 'Guardar Marca' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Brand Image Studio Modal -->
  <Teleport to="body">
    <div v-if="showBrandImageStudio" class="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showBrandImageStudio = false" />
      <div class="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <ProductImageStudio @processed="onBrandStudioProcessed" @cancel="showBrandImageStudio = false" />
      </div>
    </div>
  </Teleport>

  <!-- Image Studio Modal -->
  <Teleport to="body">
    <div v-if="showImageStudio" class="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showImageStudio = false" />
      <div class="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <ProductImageStudio @processed="onStudioProcessed" @cancel="showImageStudio = false" />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch, onMounted, onUnmounted, type Ref } from 'vue';
import {
  X, ScanBarcode, ScanLine, Save, Loader2,
  Percent, DollarSign, Package, PackagePlus, BadgeDollarSign, AlertTriangle, Info,
  ImagePlus, CheckCircle2, Trash2, Camera,
} from 'lucide-vue-next';
import { useApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';
import { useForexRate } from '@/composables/useForexRate';
import { useAuthStore } from '@/stores/auth';
import BarcodeScanner from '@/components/shared/BarcodeScanner.vue';
import ProductImageStudio from '@/views/admin/super-console/components/ProductImageStudio.vue';
import CategoryAsyncSelect from './CategoryAsyncSelect.vue';
import BrandCreatableSelect from './BrandCreatableSelect.vue';
import ProductDualSearch from './ProductDualSearch.vue';
import type { DualSearchProduct } from './ProductDualSearch.vue';
// ── Types ──

// ── Types ──

interface FiscalSettings {
  enable_iva: boolean;
  iva_porcentaje: number;
  es_contribuyente_especial: boolean;
}

interface BrandItem {
  id: string;
  name: string;
}

interface CategoryNode {
  id: number | string;
  name: string;
  code?: string;
  children?: CategoryNode[];
}

interface FlatCategory extends CategoryNode {
  _depth: number;
}

interface LogisticsState {
  unit: string;
  qtyPerPackage: number;
  boxQuantity: number;
  bulkCost: number;
  freight: number;
  purchaseCurrency: 'USD' | 'VES';
}

// ── Props & emits ──

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{
  close: [];
  productCreated: [payload: Record<string, any>];
  selectLocal: [product: DualSearchProduct];
}>();

const { fetchApi, apiClient } = useApi();
const { success: notifySuccess, error: notifyError } = useNotify();
const { rateValue, fetchForexRate } = useForexRate();
const authStore = useAuthStore();

// ── BCV rounding & es‑VE formatting helpers ──

function bcvRound(value: number, decimals: number = 2): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

const _numberFmt = new Intl.NumberFormat('es-VE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function fmt(value: number): string {
  return _numberFmt.format(value);
}
function fmtUSD(value: number): string {
  return '$ ' + _numberFmt.format(value);
}
function fmtVES(value: number): string {
  return 'Bs. ' + _numberFmt.format(value);
}

// ── Monetary input helpers (comma‑accepting, es‑VE blur formatting) ──

interface MonetaryInput {
  display: Ref<string>;
  onFocus: () => void;
  onInput: (e: Event) => void;
  onBlur: () => void;
}

function useMonetaryInput(
  get: () => number,
  set: (v: number) => void,
  precision = 2,
): MonetaryInput {
  const raw = ref('');
  const editing = ref(false);

  function onFocus() {
    raw.value = _numberFmt.format(get());
    editing.value = true;
  }

  function onInput(e: Event) {
    raw.value = (e.target as HTMLInputElement).value;
    const parsed = parseFloat(raw.value.replace(/\./g, '').replace(',', '.'));
    if (!isNaN(parsed)) set(bcvRound(parsed, precision));
  }

  function onBlur() {
    editing.value = false;
    const parsed = parseFloat(raw.value.replace(/\./g, '').replace(',', '.'));
    if (!isNaN(parsed)) set(bcvRound(parsed, precision));
  }

  const display = computed(() => (editing.value ? raw.value : _numberFmt.format(get())));

  return { display, onFocus, onInput, onBlur };
}

const miCostUsd = useMonetaryInput(() => form.cost_price_usd, v => { form.cost_price_usd = v; recalcSuggested(); }, 2);
const miCostVes = useMonetaryInput(() => form.cost_price_ves, v => { form.cost_price_ves = v; onCostVesEdit(); }, 2);
const miPriceUsd = useMonetaryInput(() => form.price_usd, v => { form.price_usd = v; onPriceUsdInput(); }, 2);
const miPriceVes = useMonetaryInput(() => form.price_ves, v => { form.price_ves = v; onPriceVesInput(); }, 2);
const miInitCost = useMonetaryInput(() => form.initial_cost_price, v => { form.initial_cost_price = v; }, 2);

const tabs = [
  { key: 'general', label: 'Información General' },
  { key: 'pricing', label: 'Precios y Logística' },
];

const activeTab = ref('general');
const submitting = ref(false);

// Scanner
const scanning = ref(false);

// ── Categories (async select) ──

const selectedCategoryId = ref<number | string | null>(null);
const selectedCategoryName = ref('');

function onCategorySelect(cat: FlatCategory) {
  selectedCategoryName.value = cat.name;
}

// ── Cascading brand loading when category changes ──

watch(() => selectedCategoryId.value, async (newCatId) => {
  if (!newCatId) {
    brands.value = [];
    return;
  }
  console.log('Gatillando marcas para categoría ID:', newCatId);
  await onCategoryChange();
});

// ── Dual Search Handlers ──

function onSelectLocal(product: DualSearchProduct) {
  form.name = product.name;
  form.sku = String(product.sku ?? '');
  form.barcode = product.barcode ?? '';
  if (product.brand_display) form.brand = product.brand_id ?? null;
  if (product.description) form.description = product.description;
  if (product.category_global_id) {
    selectedCategoryId.value = product.category_global_id;
    selectedCategoryName.value = product.category ?? '';
  }
  // Emit signal to parent to switch drawer to stock-adjustment mode
  emit('selectLocal', product);
}

function onSelectGlobal(product: DualSearchProduct) {
  form.name = product.name;
  form.sku = String(product.sku ?? '');
  form.barcode = product.barcode ?? '';
  if (product.brand) form.brand = product.brand_id ?? null;
  if (product.description) form.description = product.description;
  if (product.cost_price_usd) form.cost_price_usd = product.cost_price_usd;
  if (product.cost_price_ves) form.cost_price_ves = product.cost_price_ves;
  if (product.base_price_usd) form.price_usd = product.base_price_usd;
  if (product.base_price_ves) form.price_ves = product.base_price_ves;
  if (product.category_global_id) {
    selectedCategoryId.value = product.category_global_id;
    selectedCategoryName.value = product.category ?? '';
  }
  if (product.image_url) form.image = product.image_url;
  if (product.iva_type) form.iva_type = product.iva_type;
}

function onCreateCustom(term: string) {
  form.name = term;
  form.sku = '';
  form.barcode = '';
  form.brand = null;
  form.description = '';
  form.image = '';
  form.cost_price_usd = 0;
  form.cost_price_ves = 0;
  form.price_usd = 0;
  form.price_ves = 0;
  form.initial_physical_stock = 0;
  selectedCategoryId.value = null;
  selectedCategoryName.value = '';
}

// ── Brands (cascade + creatable) ─-

const brands = ref<BrandItem[]>([]);
const loadingBrands = ref(false);

// ── Brand Creation Modal ──

const showBrandModal = ref(false);
const newBrandName = ref('');
const newBrandLogo = ref('');
const newBrandCategoryId = ref<number | string | null>(null);
const creatingBrand = ref(false);
const showBrandImageStudio = ref(false);
const brandFormErrors = reactive({ name: '', category: '' });

function onBrandStudioProcessed(_blob: Blob, previewUrl: string) {
  newBrandLogo.value = previewUrl;
  showBrandImageStudio.value = false;
}

async function createBrand() {
  brandFormErrors.name = '';
  brandFormErrors.category = '';
  let hasError = false;
  if (!newBrandName.value.trim()) {
    brandFormErrors.name = 'El nombre de la marca es obligatorio';
    hasError = true;
  }
  if (!newBrandCategoryId.value) {
    brandFormErrors.category = 'Debe seleccionar una categoría';
    hasError = true;
  }
  if (hasError) return;

  creatingBrand.value = true;
  try {
    const created = await fetchApi<any>('/api/v1/catalog/brands/', {
      method: 'POST',
      data: {
        name: newBrandName.value.trim(),
        category_ids: [newBrandCategoryId.value],
      },
    });
    if (created?.id) {
      // Upload logo if provided
      if (newBrandLogo.value) {
        try {
          const blob = await (await fetch(newBrandLogo.value)).blob();
          const formData = new FormData();
          formData.append('image', blob, 'logo.webp');
          formData.append('brand_id', created.id);
          await fetch('/api/v1/catalog/brands/upload-logo/', {
            method: 'POST',
            body: formData,
            credentials: 'include',
          });
        } catch {
          // Logo upload failure is non-critical
        }
      }
      brands.value.push({ id: created.id, name: created.name });
      form.brand = created.id;
      notifySuccess(`Marca "${created.name}" creada exitosamente`);
      showBrandModal.value = false;
      resetBrandForm();
    }
  } catch (e: any) {
    const errData = (e as any)?.data;
    const errMsg = errData
      ? (typeof errData === 'string' ? errData : Object.values(errData).flat().join('. '))
      : 'Error al crear la marca';
    notifyError(errMsg);
  } finally {
    creatingBrand.value = false;
  }
}

function resetBrandForm() {
  newBrandName.value = '';
  newBrandLogo.value = '';
  newBrandCategoryId.value = selectedCategoryId.value;
  brandFormErrors.name = '';
  brandFormErrors.category = '';
}

watch(showBrandModal, (v) => {
  if (v) resetBrandForm();
});

// ── Image Studio ──

const showImageStudio = ref(false);
const selectedImageFile = ref<File | Blob | null>(null);

function onStudioProcessed(blob: Blob, previewUrl: string) {
  form.image = previewUrl;
  selectedImageFile.value = blob;
  showImageStudio.value = false;
}

function removeImage() {
  form.image = '';
  selectedImageFile.value = null;
}

// ── Fiscal ──

const fiscalSettings = reactive<FiscalSettings>({
  enable_iva: true,
  iva_porcentaje: 16,
  es_contribuyente_especial: false,
});

const fiscalModuleEnabled = ref(false);

// ── Logistics toggle ──

const logisticsEnabled = ref(false);
const logistics = reactive<LogisticsState>({
  unit: 'BOX',
  qtyPerPackage: 1,
  boxQuantity: 1,
  bulkCost: 0,
  freight: 0,
  purchaseCurrency: 'USD',
});

// ── Mayorista cost / freight UI (currency toggle + VES conversion) ──

const selectedInvoiceCurrency = ref<'USD' | 'VES'>('USD');
const UIFields = reactive({ costo_ingresado_usuario: 0, flete_ingresado_usuario: 0 });
const dekaRate = ref(0); // custom rate; defaults to BCV rate when switching to VES

watch(selectedInvoiceCurrency, (cur) => {
  if (cur === 'VES' && dekaRate.value === 0 && rateValue.value > 0) {
    dekaRate.value = rateValue.value;
  }
});

const containerLabel = computed(() => {
  if (form.measurement_type === 'PESO') {
    if (form.weight_container === 'SACO') return 'Saco';
    if (form.weight_container === 'CESTA') return 'Cesta';
    if (form.weight_container === 'KG_DIRECTO') return 'Kilo';
    return 'Bulto';
  }
  if (form.measurement_type === 'LIQUIDO') {
    if (form.liquid_container === 'BIDON') return 'Bidón';
    if (form.liquid_container === 'TAMBOR') return 'Tambor';
    return 'Envase';
  }
  return 'Bulto / Caja';
});

const finalCostoBultoUSD = computed(() => {
  if (selectedInvoiceCurrency.value === 'VES') {
    return UIFields.costo_ingresado_usuario > 0 && dekaRate.value > 0
      ? UIFields.costo_ingresado_usuario / dekaRate.value : 0;
  }
  return UIFields.costo_ingresado_usuario;
});

const finalFleteUSD = computed(() => {
  if (selectedInvoiceCurrency.value === 'VES') {
    return UIFields.flete_ingresado_usuario > 0 && dekaRate.value > 0
      ? UIFields.flete_ingresado_usuario / dekaRate.value : 0;
  }
  return UIFields.flete_ingresado_usuario;
});

// ── Form ──

const form = reactive({
  barcode: '',
  name: '',
  sku: '',
  brand: null as string | null,
  category: '',
  description: '',
  image: '',
  global_product_id: null as number | null,
  measurement_type: 'UNIDAD',
  container_type: 'CAJA',
  weight_container: 'SACO',
  liquid_container: 'BIDON',
  cantidad_contenedores: 1,
  capacidad_por_contenedor: 1,
  iva_type: 'GENERAL',
  cost_price_usd: 0,
  cost_price_ves: 0,
  profit_margin: 30,
  margin_type: 'TRADITIONAL',
  price_usd: 0,
  price_ves: 0,
  inventory_method: 'AVERAGE',
  inventory_type: 'SIMPLE',
  default_purchase_unit: 'UNIT',
  units_per_package: 1,
  initial_physical_stock: 0,
  initial_cost_price: 0,
});

const errors = reactive({
  barcode: '',
  name: '',
  sku: '',
});

// ── Form persistence (localStorage) ──

const STORAGE_KEY = 'product_create_draft';
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function clearDraft() {
  localStorage.removeItem(STORAGE_KEY);
}

function saveDraft() {
  const data = {
    form: { ...form },
    selectedCategoryId: selectedCategoryId.value,
    activeTab: activeTab.value,
    logisticsEnabled: logisticsEnabled.value,
    logistics: { ...logistics },
    fiscalModuleEnabled: fiscalModuleEnabled.value,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full — silently ignore
  }
}

function restoreDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data.form) Object.assign(form, data.form);
    if (data.selectedCategoryId) selectedCategoryId.value = data.selectedCategoryId;
    if (data.activeTab) activeTab.value = data.activeTab;
    if (data.logistics) Object.assign(logistics, data.logistics);
    if (data.logisticsEnabled !== undefined) logisticsEnabled.value = data.logisticsEnabled;
    if (data.fiscalModuleEnabled !== undefined) fiscalModuleEnabled.value = data.fiscalModuleEnabled;
  } catch {
    clearDraft();
  }
}

watch(form, () => {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(saveDraft, 500);
}, { deep: true });

watch([activeTab, logisticsEnabled, logistics, fiscalModuleEnabled], () => {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(saveDraft, 500);
}, { deep: true });

onMounted(restoreDraft);

// ── Computed: fiscal warning ──

const showFiscalWarning = computed(() => {
  return fiscalModuleEnabled.value
    && !fiscalSettings.es_contribuyente_especial
    && form.iva_type !== 'EXENTO';
});

// ── Computed: continuous (KG / LITER) detection ──

const isContinuousUnit = computed(() => form.measurement_type === 'PESO' || form.measurement_type === 'LIQUIDO');

const bulkUnitCost = computed(() => {
  const totalCosto = form.cantidad_contenedores * finalCostoBultoUSD.value;
  const inversionTotal = totalCosto + finalFleteUSD.value;
  const stockTotal = form.cantidad_contenedores * form.capacidad_por_contenedor;
  if (stockTotal <= 0) return 0;
  return bcvRound(inversionTotal / stockTotal, 4);
});

const calculatedStockTotal = computed(() => {
  return form.cantidad_contenedores * form.capacidad_por_contenedor;
});

watch([finalCostoBultoUSD, finalFleteUSD], () => {
  const unit = bulkUnitCost.value;
  if (unit > 0) {
    form.cost_price_usd = unit;
    form.initial_cost_price = unit;
    if (rateValue.value > 0) {
      form.cost_price_ves = bcvRound(unit * rateValue.value, 2);
    }
  }
});

watch(calculatedStockTotal, (val) => {
  form.initial_physical_stock = val;
});

watch(() => form.measurement_type, () => {
  logisticsEnabled.value = true;
  form.cantidad_contenedores = 1;
  form.capacidad_por_contenedor = 1;
  if (form.measurement_type === 'PESO') {
    form.weight_container = 'SACO';
    form.container_type = 'SACO';
  } else if (form.measurement_type === 'LIQUIDO') {
    form.liquid_container = 'BIDON';
    form.container_type = 'BIDON';
  } else {
    form.container_type = 'CAJA';
  }
});

// ── Costo VES editable → tracking si el usuario lo tocó a mano ──

const costVesUserEdited = ref(false);

function onCostVesEdit() {
  costVesUserEdited.value = true;
}

const priceUsdUserEdited = ref(false);
const priceVesUserEdited = ref(false);

const showMarginTypeTooltip = ref(false);
const showInventoryMethodTooltip = ref(false);

// ── Computed: suggested prices ──

function recalcSuggested() {
  // Computed auto-update
}

function onPriceUsdInput() {
  priceUsdUserEdited.value = true;
  priceVesUserEdited.value = false;
  if (rateValue.value > 0) {
    form.price_ves = bcvRound(form.price_usd * rateValue.value, 2);
  }
}

function onPriceVesInput() {
  priceVesUserEdited.value = true;
  priceUsdUserEdited.value = false;
  if (rateValue.value > 0) {
    form.price_usd = bcvRound(form.price_ves / rateValue.value, 2);
  }
}

function toggleTooltip(name: 'marginType' | 'inventoryMethod') {
  if (name === 'marginType') showMarginTypeTooltip.value = !showMarginTypeTooltip.value;
  else showInventoryMethodTooltip.value = !showInventoryMethodTooltip.value;
}

function onDocumentClick() {
  showMarginTypeTooltip.value = false;
  showInventoryMethodTooltip.value = false;
}

const effectiveCostUsd = computed(() => {
  const bulk = bulkUnitCost.value;
  if (bulk > 0) return bulk;
  return form.cost_price_usd || 0;
});

const suggestedPriceUsdNum = computed(() => {
  const cost = effectiveCostUsd.value;
  const margin = form.profit_margin || 0;
  if (cost <= 0 || margin <= 0) return 0;
  let raw: number;
  if (form.margin_type === 'FINANCIAL') {
    const divisor = 1 - margin / 100;
    raw = divisor <= 0.01 ? 0 : cost / divisor;
  } else {
    raw = cost * (1 + margin / 100);
  }
  return bcvRound(raw, 2);
});

const suggestedPriceVes = computed(() => {
  if (suggestedPriceUsdNum.value > 0 && rateValue.value > 0) {
    return fmtVES(bcvRound(suggestedPriceUsdNum.value * rateValue.value, 2));
  }
  return fmtVES(0);
});

// ── Auto-fill Precios de Venta desde sugerido ──

watch(suggestedPriceUsdNum, (val) => {
  if (!priceUsdUserEdited.value && !priceVesUserEdited.value) {
    form.price_usd = val;
  }
});

// ── Validate ──

function validate(): boolean {
  let ok = true;
  errors.barcode = '';
  errors.name = '';
  errors.sku = '';

  if (!form.name.trim()) {
    errors.name = 'El nombre es obligatorio';
    ok = false;
  }
  if (!form.sku.trim()) {
    errors.sku = 'El SKU es obligatorio';
    ok = false;
  }
  if (!selectedCategoryId.value) {
    notifyError('Debe seleccionar una categoría');
    ok = false;
  }
  if (form.price_usd <= 0 && form.price_ves <= 0) {
    notifyError('Debe establecer al menos un precio de venta (USD o VES)');
    ok = false;
  }
  return ok;
}

// ── Submit ──

async function handleSubmit() {
  if (!validate()) return;
  // Ensure BCV 2‑decimal rounding on all monetary fields before submit
  form.cost_price_usd = bcvRound(form.cost_price_usd, 2);
  form.cost_price_ves = bcvRound(form.cost_price_ves, 2);
  form.price_usd = bcvRound(form.price_usd, 2);
  form.price_ves = bcvRound(form.price_ves, 2);
  form.initial_cost_price = bcvRound(form.initial_cost_price, 2);
  submitting.value = true;
  try {
    const formData = new FormData();

    formData.append('name', form.name);
    formData.append('sku', form.sku);
    formData.append('barcode', form.barcode || '');
    formData.append('category', selectedCategoryName.value || form.category || '');
    formData.append('description', form.description || '');
    formData.append('iva_type', fiscalModuleEnabled.value ? form.iva_type : 'EXENTO');
    formData.append('cost_price_usd', String(form.cost_price_usd || 0));
    formData.append('cost_price_ves', String(form.cost_price_ves || 0));
    formData.append('base_price_usd', String(form.price_usd || 0));
    formData.append('base_price_ves', String(form.price_ves || 0));
    formData.append('profit_margin', String(form.profit_margin || 0));
    formData.append('margin_type', form.margin_type);
    formData.append('inventory_type', form.inventory_type);
    formData.append('inventory_method', form.inventory_method);
    formData.append('default_purchase_unit', form.default_purchase_unit);
    formData.append('units_per_package', String(form.units_per_package || 1));
    formData.append('initial_stock', String(form.initial_physical_stock || 0));
    formData.append('initial_cost_price', String(form.initial_cost_price || 0));
    formData.append('tenant_id', authStore.tenantUlid || '');
    formData.append('category_id', String(Number(selectedCategoryId.value)));
    formData.append('is_new_global', String(isNewProductGlobal.value));
    if (form.global_product_id) {
      formData.append('global_product_id', String(form.global_product_id));
    }
    if (form.brand) {
      formData.append('brand_id', form.brand);
    }

    // Logistics fields — generic container payload (backend normalizes via cross-fallback)
    formData.append('cantidad_contenedores', String(form.cantidad_contenedores));
    formData.append('capacidad_por_contenedor', String(form.capacidad_por_contenedor));
    formData.append('costo_bulto_total_usd', String(finalCostoBultoUSD.value));
    formData.append('costo_flete_usd', String(finalFleteUSD.value));

    // Image: prefer native File/Blob from ImageStudio, fallback to URL string
    if (selectedImageFile.value instanceof Blob) {
      formData.append('image', selectedImageFile.value, 'product_image.webp');
    } else if (typeof form.image === 'string' && form.image.startsWith('http')) {
      formData.append('image', form.image);
    }

    await apiClient.post('/api/products/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    notifySuccess('Producto creado exitosamente');
    clearDraft();
    resetForm();
    emit('productCreated', { name: form.name, sku: form.sku });
    emit('close');
  } catch (e: any) {
    const drfData = e.data;
    if (drfData && typeof drfData === 'object' && !Array.isArray(drfData)) {
      const msg = Object.entries(drfData)
        .map(([, msgs]) => (Array.isArray(msgs) ? msgs[0] : msgs))
        .filter(Boolean)
        .join('. ');
      if (msg) { notifyError(msg); return; }
    }
    notifyError(e?.message || 'Error al crear producto');
  } finally {
    submitting.value = false;
  }
}

function resetForm() {
  form.barcode = '';
  form.name = '';
  form.sku = '';
  form.brand = null;
  form.category = '';
  form.description = '';
  form.image = '';
  form.global_product_id = null;
  form.measurement_type = 'UNIDAD';
  form.container_type = 'CAJA';
  form.weight_container = 'SACO';
  form.liquid_container = 'BIDON';
  form.cantidad_contenedores = 1;
  form.capacidad_por_contenedor = 1;
  form.iva_type = 'GENERAL';
  form.cost_price_usd = 0;
  form.cost_price_ves = 0;
  form.profit_margin = 30;
  form.margin_type = 'TRADITIONAL';
  form.price_usd = 0;
  form.price_ves = 0;
  form.inventory_method = 'AVERAGE';
  form.inventory_type = 'SIMPLE';
  form.default_purchase_unit = 'UNIT';
  form.units_per_package = 1;
  form.initial_physical_stock = 0;
  form.initial_cost_price = 0;
  errors.barcode = '';
  errors.name = '';
  errors.sku = '';
  activeTab.value = 'general';
  selectedCategoryId.value = null;
  brands.value = [];
  logisticsEnabled.value = false;
  logistics.unit = 'BOX';
  logistics.qtyPerPackage = 1;
  logistics.boxQuantity = 1;
  logistics.bulkCost = 0;
  logistics.freight = 0;
  logistics.purchaseCurrency = 'USD';
  UIFields.costo_ingresado_usuario = 0;
  UIFields.flete_ingresado_usuario = 0;
  dekaRate.value = 0;
  selectedInvoiceCurrency.value = 'USD';
  fiscalModuleEnabled.value = false;
  costVesUserEdited.value = false;
  priceUsdUserEdited.value = false;
  priceVesUserEdited.value = false;
  showMarginTypeTooltip.value = false;
  showInventoryMethodTooltip.value = false;
  showBrandModal.value = false;
  newBrandName.value = '';
  newBrandLogo.value = '';
  newBrandCategoryId.value = null;
  creatingBrand.value = false;
  brandFormErrors.name = '';
  brandFormErrors.category = '';
  showBrandImageStudio.value = false;
  showImageStudio.value = false;
  selectedImageFile.value = null;
  isNewProductGlobal.value = false;
  isCheckingBarcode.value = false;
  scanning.value = false;
}

function handleClose() {
  emit('close');
}

// ── Category change → fetch brands (cascade) ──

async function onCategoryChange() {
  form.brand = null;
  brands.value = [];
  if (!selectedCategoryId.value) return;
  loadingBrands.value = true;
  try {
    const res = await fetchApi<any>(`/api/v1/catalog/brands/`, {
      params: {
        category_id: selectedCategoryId.value,
      },
    });
    brands.value = (Array.isArray(res?.results) ? res.results : (Array.isArray(res) ? res : []))
      .map((b: any) => ({ id: b.id, name: b.name }));
  } catch {
    brands.value = [];
  } finally {
    loadingBrands.value = false;
  }
}

function onBrandCreateInline(name: string) {
  if (!selectedCategoryId.value) return;

  newBrandName.value = name.trim();
  newBrandCategoryId.value = selectedCategoryId.value;
  newBrandLogo.value = '';
  brandFormErrors.name = '';
  brandFormErrors.category = '';
  showBrandModal.value = true;
}

// ── Scanner ──

const isNewProductGlobal = ref(false);
const isCheckingBarcode = ref(false);
let checkBarcodeDebounce: ReturnType<typeof setTimeout> | null = null;

async function checkGlobalCatalog(value: string) {
  if (!value || value.length < 3) return;
  isCheckingBarcode.value = true;
  try {
    const response = await apiClient.get(`/api/global-products/global-check/?search=${encodeURIComponent(value)}`);
    const globalProduct = response.data ?? response;
    if (globalProduct?.id) {
      isNewProductGlobal.value = false;
      form.name = globalProduct.name || form.name;
      if (globalProduct.category_id) {
        selectedCategoryId.value = globalProduct.category_id;
        selectedCategoryName.value = globalProduct.category || '';
      }
      if (globalProduct.brand_id) form.brand = globalProduct.brand_id;
      if (globalProduct.image_url) form.image = globalProduct.image_url;
      if (globalProduct.description) form.description = globalProduct.description;
      form.global_product_id = globalProduct.id;
    } else {
      isNewProductGlobal.value = true;
      form.global_product_id = null;
    }
  } catch {
    isNewProductGlobal.value = false;
  } finally {
    isCheckingBarcode.value = false;
  }
}

watch(() => form.barcode, (newVal) => {
  if (checkBarcodeDebounce) clearTimeout(checkBarcodeDebounce);
  checkBarcodeDebounce = setTimeout(() => checkGlobalCatalog(newVal || ''), 500);
});

watch(() => form.sku, (newVal) => {
  if (!form.barcode && newVal) {
    if (checkBarcodeDebounce) clearTimeout(checkBarcodeDebounce);
    checkBarcodeDebounce = setTimeout(() => checkGlobalCatalog(newVal || ''), 500);
  }
});

const searchingBarcode = ref(false);

async function lookupBarcode(code: string) {
  if (!code.trim() || searchingBarcode.value) return;
  searchingBarcode.value = true;
  try {
    const res = await fetchApi<any>(`/api/v1/inventory/lookup/?code=${encodeURIComponent(code.trim())}`);
    if (res?.data) {
      const { name, sku, category, brand, image_url } = res.data;
      form.name = name || '';
      form.sku = sku || '';
      if (image_url) form.image = image_url;
      notifySuccess(`Producto encontrado: ${name || sku || code}`);
      if (category) {
        try {
          const catRes = await fetchApi<any>('/api/v1/catalog/categories/', { params: { tenant_id: authStore.tenantUlid || '', search: category, page_size: 1 } });
          const catItems = Array.isArray(catRes?.results) ? catRes.results : (Array.isArray(catRes) ? catRes : []);
          const catNode = catItems[0];
          if (catNode) {
            selectedCategoryId.value = catNode.id;
            selectedCategoryName.value = catNode.name;
            if (brand) {
              // wait for brands to settle, then match
              const unwatch = watch(brands, (list) => {
                const match = list.find((b: BrandItem) => b.id === brand);
                if (match) form.brand = match.id;
                unwatch();
              }, { once: true });
            }
          }
        } catch { /* ignore */ }
      }
    }
  } catch { /* ignore */ }
  finally { searchingBarcode.value = false; }
}

function toggleScanner() {
  scanning.value = !scanning.value;
}

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick);
});

// ── Load init data when drawer opens ──

watch(() => props.visible, async (v) => {
  if (v) {
    activeTab.value = 'general';
    await Promise.all([loadFiscalSettings(), fetchForexRate()]);
    document.addEventListener('click', onDocumentClick);
    if (!fiscalSettings.enable_iva) {
      form.iva_type = 'EXENTO';
      fiscalModuleEnabled.value = false;
    }
  } else {
    document.removeEventListener('click', onDocumentClick);
  }
});


async function loadFiscalSettings() {
  try {
    const res = await fetchApi<any>('/api/v1/store/settings/');
    if (res?.settings) {
      fiscalSettings.enable_iva = res.settings.enable_iva !== false;
      fiscalSettings.iva_porcentaje = res.settings.iva_porcentaje || 16;
      fiscalSettings.es_contribuyente_especial = res.settings.es_contribuyente_especial || false;
    }
  } catch {
    // Keep defaults
  }
}
</script>

<style scoped>
@keyframes slide-in {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
.animate-slide-in { animation: slide-in 0.2s ease-out; }
</style>
