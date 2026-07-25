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


          <!-- ════════════════════════════════════════════════ -->
          <!-- TAB: Información General                        -->
          <!-- ════════════════════════════════════════════════ -->
          <div v-show="activeTab === 'general'" class="space-y-4">

            <!-- Accordion A: Basic Info (Indigo) -->
            <div class="border border-indigo-200 dark:border-indigo-500/30 rounded-xl">
              <button @click="toggleAccordion('basic')"
                class="w-full flex items-center justify-between px-4 py-3 bg-indigo-50/80 dark:bg-indigo-500/[0.06] hover:bg-indigo-100/80 dark:hover:bg-indigo-500/[0.1] transition-colors text-left">
                <span class="flex items-center gap-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                  <ChevronDown class="w-4 h-4 text-indigo-400 transition-transform" :class="activePanels.basic ? 'rotate-0' : '-rotate-90'" />
                  <FileText class="w-4 h-4 text-indigo-400" />
                  Información Básica
                </span>
              </button>
              <div v-show="activePanels.basic" class="p-4 space-y-4">
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
                    :class="{'border-red-400 bg-red-50 dark:bg-red-500/[0.04]': errors.sku}" @input="errors.sku = ''" @blur="checkSkuDuplicate" />
                  <p v-if="errors.sku" class="text-[11px] text-red-500 mt-1">{{ errors.sku }}</p>
                </div>
              </div>
            </div>

            <!-- Accordion B: Classification (Purple) -->
            <div class="border border-purple-200 dark:border-purple-500/30 rounded-xl">
              <button @click="toggleAccordion('classification')"
                class="w-full flex items-center justify-between px-4 py-3 bg-purple-50/80 dark:bg-purple-500/[0.06] hover:bg-purple-100/80 dark:hover:bg-purple-500/[0.1] transition-colors text-left">
                <span class="flex items-center gap-2 text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                  <ChevronDown class="w-4 h-4 text-purple-400 transition-transform" :class="activePanels.classification ? 'rotate-0' : '-rotate-90'" />
                  <Tag class="w-4 h-4 text-purple-400" />
                  Clasificación
                </span>
              </button>
              <div v-show="activePanels.classification" class="p-4 space-y-4">
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
              </div>
            </div>

            <!-- Accordion C: Información Fiscal (Amber) -->
            <div class="border border-amber-200 dark:border-amber-500/30 rounded-xl">
              <button @click="toggleAccordion('fiscal')"
                class="w-full flex items-center justify-between px-4 py-3 bg-amber-50/80 dark:bg-amber-500/[0.06] hover:bg-amber-100/80 dark:hover:bg-amber-500/[0.1] transition-colors text-left">
                <span class="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                  <ChevronDown class="w-4 h-4 text-amber-400 transition-transform" :class="activePanels.fiscal ? 'rotate-0' : '-rotate-90'" />
                  <Receipt class="w-4 h-4 text-amber-400" />
                  Información Fiscal
                </span>
              </button>
              <div v-show="activePanels.fiscal" class="p-4 space-y-4">
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

                  <!-- ⚠️ ALERTA FISCAL PREVENTIVA -->
                  <div v-if="showFiscalWarning"
                    class="rounded-lg border border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/[0.06] p-3">
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

                  <template v-if="fiscalModuleEnabled">
                    <label class="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Tipo de IVA *</label>
                    <select v-model="form.tax_rate_id"
                      class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 rounded-lg focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50 focus:outline-none transition-colors appearance-none cursor-pointer"
                      :class="{'border-amber-400 dark:border-amber-500/50': showFiscalWarning}">
                      <option :value="null">Seleccionar...</option>
                      <option v-for="tr in taxRates" :key="tr.id" :value="tr.id">
                        {{ tr.name }} ({{ tr.rate_percentage }}%)
                      </option>
                    </select>

                    <p v-if="!fiscalSettings.enable_iva" class="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                      Módulo fiscal desactivado — se usará Exento por defecto
                    </p>
                  </template>
                  <p v-else class="text-[11px] text-slate-400 dark:text-slate-500 italic">
                    El producto se registrará como <strong>EXENTO</strong> de IVA.
                  </p>
                </div>
              </div>
            </div>

            <!-- Description (always visible below accordions) -->
            <div>
              <label class="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Descripción</label>
              <textarea v-model="form.description" rows="2" placeholder="Descripción opcional..."
                class="w-full px-3 py-2 text-sm border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 placeholder-slate-400 rounded-lg focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50 focus:outline-none transition-colors resize-none"></textarea>
            </div>

          </div>

          <!-- ════════════════════════════════════════════════ -->
          <!-- TAB: Precios y Logística                        -->
          <!-- ════════════════════════════════════════════════ -->
          <div v-show="activeTab === 'pricing'" class="space-y-4">

            <!-- Accordion D: Precios y Logística (Emerald) -->
            <div class="border border-emerald-200 dark:border-emerald-500/30 rounded-xl">
              <button @click="toggleAccordion('pricingLogistics')"
                class="w-full flex items-center justify-between px-4 py-3 bg-emerald-50/80 dark:bg-emerald-500/[0.06] hover:bg-emerald-100/80 dark:hover:bg-emerald-500/[0.1] transition-colors text-left">
                <span class="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                  <ChevronDown class="w-4 h-4 text-emerald-400 transition-transform" :class="activePanels.pricingLogistics ? 'rotate-0' : '-rotate-90'" />
                  Precios y Logística
                </span>
              </button>
              <div v-show="activePanels.pricingLogistics" class="p-4 space-y-4">

                <!-- WHOLESALE MODE TOGGLE -->
                <div class="flex items-center justify-between bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.08] rounded-xl px-4 py-3 shrink-0">
                  <div>
                    <p class="text-sm font-medium text-slate-700 dark:text-slate-300">Activar Modo Mayorista</p>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400">Cálculos a gran escala — Distribución Masiva</p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input v-model="wholesaleEnabled" type="checkbox" class="sr-only peer" />
                    <div class="w-[42px] h-[22px] bg-slate-300 dark:bg-white/[0.12] rounded-full peer peer-checked:bg-indigo-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-[18px] after:w-[18px] after:shadow-sm after:transition-all"></div>
                  </label>
                </div>

                <!-- ⚠️ WHOLESALE RENTABILITY WARNING BANNER -->
                <div v-if="wholesaleEnabled"
                  class="border-l-4 border-red-600 bg-red-50 dark:bg-red-500/[0.06] text-red-800 dark:text-red-300 p-4 text-xs leading-relaxed rounded-r-lg">
                  <p class="font-bold mb-1 text-[11px] uppercase tracking-wider">⚠️ ADVERTENCIA DE RENTABILIDAD</p>
                  <p>Este modo está diseñado exclusivamente para Distribución Masiva y Mayoristas. <strong>NO SE RECOMIENDA</strong> activar esta opción para ventas minoristas tradicionales (al detal), ya que el cálculo opera bajo márgenes mínimos de volumen masivo y unidades de carga industrial, lo que comprometería la rentabilidad del negocio detal.</p>
                </div>

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

              </div>
            </div>

            <!-- Accordion: Unidad de Medida (Sky) -->
            <div class="border border-sky-100 dark:border-sky-500/20 rounded-xl space-y-4">
              <button @click="toggleAccordion('unitMeasure')"
                class="w-full flex items-center justify-between px-4 py-3 bg-sky-50/80 dark:bg-sky-500/[0.06] hover:bg-sky-100/80 dark:hover:bg-sky-500/[0.1] transition-colors text-left">
                <span class="flex items-center gap-2 text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                  <ChevronDown class="w-4 h-4 text-sky-400 transition-transform" :class="activePanels.unitMeasure ? 'rotate-0' : '-rotate-90'" />
                  <Package class="w-4 h-4 text-sky-500" />
                  Unidad de Medida
                </span>
              </button>
              <div v-show="activePanels.unitMeasure" class="p-4 space-y-4">

                <!-- ══════ RETAIL MODE (UNIDAD / PESO / LIQUIDO) ══════ -->
                <template v-if="!wholesaleEnabled">
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

                  <!-- Retail sub‑type selectors -->
                  <div v-if="form.measurement_type === 'UNIDAD'" class="pt-2 space-y-4">
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

                  <div v-if="form.measurement_type === 'PESO'" class="pt-2 space-y-4">
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
                </template>

                <!-- ══════ WHOLESALE MODE ══════ -->
                <template v-else>
                  <div>
                    <label class="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Tipo de Unidad Mayorista <span class="text-red-400">*</span></label>
                    <select v-model="selectedWholesaleUnit"
                      class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 rounded-lg focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50 focus:outline-none transition-colors appearance-none cursor-pointer">
                      <option v-for="u in WHOLESALE_UNITS" :key="u.value" :value="u.value">{{ u.label }} — {{ u.desc }}</option>
                    </select>
                    <p class="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                      1 {{ wholesaleConfig.label.split(' /')[0] }} = <strong>{{ wholesaleConfig.multiplier }}</strong> {{ wholesaleConfig.subLabel.split(' por')[0].toLowerCase() }}s
                    </p>
                  </div>
                </template>

                <!-- Container quantity / capacity fields (shared, labels adapt) -->
                <div class="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label class="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      <template v-if="wholesaleEnabled">
                        Cantidad de {{ wholesaleConfig.label.split(' /')[0].toLowerCase() }}s a ingresar
                      </template>
                      <template v-else>
                        {{ form.measurement_type === 'PESO'
                          ? (form.weight_container === 'KG_DIRECTO' ? 'Cantidad de Kg' : 'Cantidad de ' + (form.weight_container === 'SACO' ? 'Sacos' : form.weight_container === 'CESTA' ? 'Cestas' : 'Bún / Cajas'))
                          : form.measurement_type === 'LIQUIDO'
                            ? (form.liquid_container === 'LT_DIRECTO' ? 'Cantidad de Litros' : 'Cantidad de ' + (form.liquid_container === 'BIDON' ? 'Bidones' : form.liquid_container === 'TAMBOR' ? 'Tambores' : 'Galones'))
                            : 'Cantidad de ' + (form.container_type === 'CAJA' ? 'Cajas' : form.container_type === 'BULTO' ? 'Bultos' : 'Paquetes')
                        }}
                      </template>
                    </label>
                    <input v-model.number="form.cantidad_contenedores" type="number" min="1" step="1" placeholder="1"
                      class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 placeholder-slate-400 rounded-lg focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50 focus:outline-none transition-colors" />
                  </div>
                  <div>
                    <label class="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      <template v-if="wholesaleEnabled">
                        {{ wholesaleConfig.subLabel }}
                      </template>
                      <template v-else>
                        {{ form.measurement_type === 'PESO'
                          ? (form.weight_container === 'KG_DIRECTO' ? 'Kg por contenedor' : 'Kg por ' + (form.weight_container === 'SACO' ? 'Saco' : form.weight_container === 'CESTA' ? 'Cesta' : 'Bún / Caja'))
                          : form.measurement_type === 'LIQUIDO'
                            ? (form.liquid_container === 'LT_DIRECTO' ? 'Litros por contenedor' : 'Litros por ' + (form.liquid_container === 'BIDON' ? 'Bidón' : form.liquid_container === 'TAMBOR' ? 'Tambor' : 'Galón'))
                            : 'Unidades por ' + (form.container_type === 'CAJA' ? 'Caja' : form.container_type === 'BULTO' ? 'Bulto' : 'Paquete')
                        }}
                      </template>
                    </label>
                    <input v-model.number="form.capacidad_por_contenedor" type="number" min="0.1" step="0.1" placeholder="1"
                      class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 placeholder-slate-400 rounded-lg focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50 focus:outline-none transition-colors" />
                  </div>
                </div>

                <!-- Wholesale multiplier breakdown -->
                <div v-if="wholesaleEnabled" class="bg-indigo-50 dark:bg-indigo-500/[0.06] border border-indigo-200 dark:border-indigo-500/20 rounded-xl px-4 py-2.5 text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
                  🧮 <strong>{{ form.cantidad_contenedores || 0 }} {{ wholesaleConfig.label.split(' /')[0].toLowerCase() }}s</strong>
                  × {{ wholesaleConfig.multiplier }} {{ wholesaleConfig.subLabel.split(' por')[0].toLowerCase() }}/unidad
                  = <strong>{{ effectiveContainers }}</strong> {{ wholesaleConfig.subLabel.split(' por')[0].toLowerCase() }}s
                  → {{ calculatedStockTotal }} uds. finales
                </div>

                <!-- Stock total calculado -->
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
                      <span v-if="!wholesaleEnabled" class="text-[10px] text-blue-500 dark:text-blue-400 ml-1">
                        ({{ form.cantidad_contenedores }} {{ form.measurement_type === 'PESO'
                          ? (form.weight_container === 'KG_DIRECTO' ? 'Kg' : '× ' + form.capacidad_por_contenedor + ' Kg/' + (form.weight_container === 'SACO' ? 'saco' : form.weight_container === 'CESTA' ? 'cesta' : 'bún'))
                          : form.measurement_type === 'LIQUIDO'
                            ? (form.liquid_container === 'LT_DIRECTO' ? 'Litros' : '× ' + form.capacidad_por_contenedor + ' L/' + (form.liquid_container === 'BIDON' ? 'bidón' : form.liquid_container === 'TAMBOR' ? 'tambor' : 'galón'))
                            : '× ' + form.capacidad_por_contenedor + ' uds/' + (form.container_type === 'CAJA' ? 'caja' : form.container_type === 'BULTO' ? 'bulto' : 'paquete')
                        }})
                      </span>
                      <span v-else class="text-[10px] text-indigo-500 dark:text-indigo-400 ml-1">
                        ({{ effectiveContainers }} {{ wholesaleConfig.subLabel.split(' por')[0].toLowerCase() }}s × {{ form.capacidad_por_contenedor }} uds)
                      </span>
                    </span>
                  </div>
                </div>

              </div>
            </div>

            <!-- Accordion: Costos y Flete Mayorista (Teal) -->
            <div class="border border-teal-200 dark:border-teal-500/30 rounded-xl">
              <button @click="toggleAccordion('costsFreight')"
                class="w-full flex items-center justify-between px-4 py-3 bg-teal-50/80 dark:bg-teal-500/[0.06] hover:bg-teal-100/80 dark:hover:bg-teal-500/[0.1] transition-colors text-left">
                <span class="flex items-center gap-2 text-xs font-semibold text-teal-700 dark:text-teal-300 uppercase tracking-wider">
                  <ChevronDown class="w-4 h-4 text-teal-400 transition-transform" :class="activePanels.costsFreight ? 'rotate-0' : '-rotate-90'" />
                  <Truck class="w-4 h-4 text-teal-400" />
                  Costos y Flete Mayorista
                </span>
              </button>
              <div v-show="activePanels.costsFreight" class="p-4 space-y-4">
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
                    <template v-if="wholesaleEnabled">
                      {{ effectiveContainers }} {{ wholesaleConfig.subLabel.split(' por')[0].toLowerCase() }}s
                    </template>
                    <template v-else>
                      {{ form.cantidad_contenedores }} {{ containerLabel }}{{ form.cantidad_contenedores !== 1 ? 's' : '' }}
                    </template>
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
                    ({{ wholesaleEnabled ? effectiveContainers : form.cantidad_contenedores }} × <template v-if="selectedInvoiceCurrency === 'VES'">Bs. {{ fmt(UIFields.costo_ingresado_usuario) }} / {{ fmt(dekaRate) }} = </template>${{ fmt(finalCostoBultoUSD) }}
                    <template v-if="finalFleteUSD > 0"> + ${{ fmt(finalFleteUSD) }} flete</template>)
                    / {{ calculatedStockTotal }}
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
            </div>

            <!-- Accordion: Costo y Margen (Blue) -->
            <div class="border border-blue-200 dark:border-blue-500/30 rounded-xl">
              <button @click="toggleAccordion('costMargin')"
                class="w-full flex items-center justify-between px-4 py-3 bg-blue-50/80 dark:bg-blue-500/[0.06] hover:bg-blue-100/80 dark:hover:bg-blue-500/[0.1] transition-colors text-left">
                <span class="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                  <ChevronDown class="w-4 h-4 text-blue-400 transition-transform" :class="activePanels.costMargin ? 'rotate-0' : '-rotate-90'" />
                  <Percent class="w-4 h-4 text-blue-400" />
                  Costo y Margen
                </span>
              </button>
              <div v-show="activePanels.costMargin" class="p-4 space-y-4">
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

                <!-- Suggested Prices (dual: Traditional + Financial) -->
                <div class="bg-blue-50 dark:bg-blue-500/[0.06] border border-blue-200 dark:border-blue-500/20 rounded-lg p-3">
                  <div class="flex items-center gap-2 mb-3">
                    <BadgeDollarSign class="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span class="text-xs font-semibold text-blue-800 dark:text-blue-300">Precios Sugeridos</span>
                    <span class="text-[10px] text-blue-500 dark:text-blue-400 ml-auto">Tasa BCV: {{ rateValue > 0 ? fmtVES(rateValue) : 'Cargando...' }}</span>
                  </div>
                  <div class="space-y-2">
                    <!-- Traditional -->
                    <div class="flex items-center justify-between bg-white dark:bg-white/[0.04] rounded-lg px-3 py-2 border border-amber-200 dark:border-amber-500/20">
                      <div>
                        <span class="text-[11px] font-semibold text-amber-700 dark:text-amber-400">Tradicional</span>
                        <span class="text-[9px] text-amber-500 dark:text-amber-500 ml-1">(suma)</span>
                      </div>
                      <div class="text-right">
                        <span class="text-sm font-mono font-bold text-slate-900 dark:text-white">{{ fmtUSD(suggestedTraditionalNum) }}</span>
                        <span v-if="suggestedTraditionalVES !== fmtVES(0)" class="text-[10px] text-slate-500 dark:text-slate-400 ml-2">{{ suggestedTraditionalVES }}</span>
                      </div>
                    </div>
                    <!-- Financial -->
                    <div class="flex items-center justify-between bg-white dark:bg-white/[0.04] rounded-lg px-3 py-2 border border-emerald-200 dark:border-emerald-500/20">
                      <div>
                        <span class="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">Financiero</span>
                        <span class="text-[9px] text-emerald-500 dark:text-emerald-500 ml-1">(protección)</span>
                      </div>
                      <div class="text-right">
                        <span class="text-sm font-mono font-bold text-slate-900 dark:text-white">{{ fmtUSD(suggestedFinancialNum) }}</span>
                        <span v-if="suggestedFinancialVES !== fmtVES(0)" class="text-[10px] text-slate-500 dark:text-slate-400 ml-2">{{ suggestedFinancialVES }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Accordion: Precios de Venta (Violet) -->
            <div class="border border-violet-200 dark:border-violet-500/30 rounded-xl">
              <button @click="toggleAccordion('sellPrices')"
                class="w-full flex items-center justify-between px-4 py-3 bg-violet-50/80 dark:bg-violet-500/[0.06] hover:bg-violet-100/80 dark:hover:bg-violet-500/[0.1] transition-colors text-left">
                <span class="flex items-center gap-2 text-xs font-semibold text-violet-700 dark:text-violet-300 uppercase tracking-wider">
                  <ChevronDown class="w-4 h-4 text-violet-400 transition-transform" :class="activePanels.sellPrices ? 'rotate-0' : '-rotate-90'" />
                  <BadgeDollarSign class="w-4 h-4 text-violet-400" />
                  Precios de Venta
                </span>
              </button>
              <div v-show="activePanels.sellPrices" class="p-4 space-y-4">
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
            </div>

            <!-- Accordion: Logística (Orange) -->
            <div class="border border-orange-200 dark:border-orange-500/30 rounded-xl">
              <button @click="toggleAccordion('logistics')"
                class="w-full flex items-center justify-between px-4 py-3 bg-orange-50/80 dark:bg-orange-500/[0.06] hover:bg-orange-100/80 dark:hover:bg-orange-500/[0.1] transition-colors text-left">
                <span class="flex items-center gap-2 text-xs font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wider">
                  <ChevronDown class="w-4 h-4 text-orange-400 transition-transform" :class="activePanels.logistics ? 'rotate-0' : '-rotate-90'" />
                  <Package class="w-4 h-4 text-orange-400" />
                  Logística
                </span>
              </button>
              <div v-show="activePanels.logistics" class="p-4 space-y-4">
                <div>
                  <label class="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Tipo de Producto *</label>
                  <select v-model="form.product_type_id"
                    class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 rounded-lg focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50 focus:outline-none transition-colors appearance-none cursor-pointer">
                    <option :value="null">Seleccionar...</option>
                    <option v-for="pt in productTypes" :key="pt.id" :value="pt.id">
                      {{ pt.name }}
                    </option>
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


            <!-- Accordion E: Variants & Attributes (Fuchsia) -->
            <div class="border border-fuchsia-200 dark:border-fuchsia-500/30 rounded-xl">
              <button @click="toggleAccordion('variantGenerator')"
                class="w-full flex items-center justify-between px-4 py-3 bg-fuchsia-50/80 dark:bg-fuchsia-500/[0.06] hover:bg-fuchsia-100/80 dark:hover:bg-fuchsia-500/[0.1] transition-colors text-left">
                <span class="flex items-center gap-2 text-xs font-semibold text-fuchsia-700 dark:text-fuchsia-300 uppercase tracking-wider min-w-0">
                  <Layers class="w-4 h-4 text-fuchsia-400 shrink-0" />
                  <span class="truncate">Variantes y Atributos de Producto</span>
                </span>
                <span v-if="variants.length > 0" class="ml-2 flex items-center gap-1.5 shrink-0">
                  <span class="text-[10px] font-mono font-bold text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-100 dark:bg-fuchsia-500/[0.12] px-2 py-0.5 rounded-md">
                    {{ totalAllocatedStock }} / {{ form.initial_physical_stock }} uds
                  </span>
                  <span v-if="stockBalance < 0" class="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/[0.12] px-2 py-0.5 rounded-md">
                    ⚠️ {{ Math.abs(stockBalance) }} faltan
                  </span>
                </span>
              </button>
              <div v-show="activePanels.variantGenerator" class="p-4 space-y-4">
                <div v-if="dynamicAttributes.length === 0" class="text-center py-8">
                  <Layers class="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p class="text-sm font-medium text-slate-500 dark:text-slate-400">No hay atributos disponibles</p>
                  <p class="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Selecciona una categoría con atributos para generar variantes.</p>
                </div>

                <template v-else>
                  <p class="text-[11px] text-slate-500 dark:text-slate-400">Agrega variantes con atributos, stock y precio. Cada fila representa una variante del producto.</p>

                  <!-- Barcode base input -->
                  <div>
                    <label class="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Base de Código de Barras</label>
                    <input v-model="variantBarcodeBase" type="text" placeholder="Ej: 750123456789"
                      class="w-full h-8 px-3 text-xs border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 placeholder-slate-400 rounded-lg focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50 focus:outline-none transition-colors" />
                  </div>

                  <!-- Stock balance deficit badge -->
                  <div v-if="variants.length > 0 && stockBalance > 0"
                    class="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-500/[0.06] border border-red-200 dark:border-red-500/20 rounded-lg">
                    <span class="text-[11px] font-semibold text-red-700 dark:text-red-400">⚠️ Faltan {{ stockBalance }} unidades por asignar</span>
                  </div>

                  <!-- Stock surplus banner -->
                  <div v-if="variants.length > 0 && stockBalance < 0"
                    class="flex items-center justify-between gap-3 px-3 py-2 bg-amber-50 dark:bg-amber-500/[0.06] border border-amber-200 dark:border-amber-500/20 rounded-lg">
                    <p class="text-[11px] text-amber-800 dark:text-amber-300">
                      La cantidad asignada en variantes (<strong>{{ totalAllocatedStock }}</strong>) supera el stock inicial configurado (<strong>{{ form.initial_physical_stock }}</strong>)
                    </p>
                    <button type="button" @click="syncStockToGlobal"
                      class="shrink-0 h-7 px-3 rounded-md text-[10px] font-semibold text-white bg-amber-600 hover:bg-amber-500 transition-colors flex items-center gap-1">
                      Actualizar Stock Global
                    </button>
                  </div>

                  <!-- Variant cards (collapsible) -->
                  <div v-for="(v, idx) in variants" :key="v.id" class="border border-fuchsia-100 dark:border-fuchsia-500/20 rounded-xl">
                    <button type="button" @click="toggleVariantCollapse(v.id)" class="w-full flex items-center justify-between px-3 py-2 bg-fuchsia-50/50 dark:bg-fuchsia-500/[0.04] hover:bg-fuchsia-100/50 dark:hover:bg-fuchsia-500/[0.08] transition-colors text-left">
                      <div class="flex items-center gap-2 min-w-0">
                        <ChevronDown class="w-3 h-3 text-fuchsia-400 shrink-0 transition-transform" :class="isVariantCollapsed(v.id) ? '-rotate-90' : 'rotate-0'" />
                        <span class="text-[10px] font-bold text-fuchsia-700 dark:text-fuchsia-400 uppercase shrink-0">#{{ idx + 1 }}</span>
                        <span v-if="v.sku_suffix" class="text-[9px] font-mono text-fuchsia-500 dark:text-fuchsia-500 truncate max-w-[100px]">{{ v.sku_suffix }}</span>
                        <span v-if="v.barcode && !isVariantCollapsed(v.id)" class="text-[9px] font-mono text-slate-400 dark:text-slate-500 truncate hidden sm:inline max-w-[80px]">| {{ v.barcode }}</span>
                        <span v-if="v.stock > 0" class="text-[9px] font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-white/[0.04] px-1.5 py-0.5 rounded shrink-0">{{ v.stock }} uds</span>
                        <span v-if="v.price_base > 0" class="text-[9px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">${{ fmt(v.price_base) }}</span>
                      </div>
                      <div class="flex items-center gap-1 shrink-0">
                        <button type="button" @click.stop="removeVariantRow(idx)" class="p-1 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/[0.08] transition-colors">
                          <Trash2 class="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </button>
                    <div v-show="!isVariantCollapsed(v.id)" class="p-3 space-y-2 border-t border-fuchsia-100 dark:border-fuchsia-500/20">
                      <!-- Attribute inputs -->
                      <div class="grid grid-cols-2 gap-2">
                        <div v-for="attr in dynamicAttributes" :key="attr.id" class="space-y-0.5">
                          <label class="block text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{{ attr.label }}</label>
                          <select v-if="attr.attr_type === 'select'" v-model="v.attribute_values[attr.id]"
                            class="w-full h-7 px-2 text-[11px] border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 rounded-md focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50 focus:outline-none transition-colors appearance-none cursor-pointer">
                            <option value="">Seleccionar...</option>
                            <option v-for="opt in (attr.options || [])" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                          </select>
                          <input v-else-if="attr.attr_type === 'decimal'" v-model="v.attribute_values[attr.id]" type="number" step="0.01" min="0" placeholder="0.00"
                            class="w-full h-7 px-2 text-[11px] border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 placeholder-slate-400 rounded-md focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50 focus:outline-none transition-colors" />
                          <input v-else-if="attr.attr_type === 'number'" v-model="v.attribute_values[attr.id]" type="number" step="1" min="0" placeholder="0"
                            class="w-full h-7 px-2 text-[11px] border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 placeholder-slate-400 rounded-md focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50 focus:outline-none transition-colors" />
                          <input v-else v-model="v.attribute_values[attr.id]" type="text" :placeholder="attr.label"
                            class="w-full h-7 px-2 text-[11px] border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 placeholder-slate-400 rounded-md focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50 focus:outline-none transition-colors" />
                        </div>
                      </div>
                      <!-- Stock + Price Base -->
                      <div class="grid grid-cols-2 gap-2">
                        <div>
                          <label class="block text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Stock</label>
                          <input v-model.number="v.stock" type="number" step="1" min="0" placeholder="0"
                            class="w-full h-7 px-2 text-[11px] border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 placeholder-slate-400 rounded-md focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50 focus:outline-none transition-colors" />
                        </div>
                        <div>
                          <label class="block text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Precio Base USD</label>
                          <input :value="v.price_base" @input="onPriceBaseInput(idx, $event)" type="number" step="0.01" min="0" placeholder="0.00"
                            class="w-full h-7 px-2 text-[11px] border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 placeholder-slate-400 rounded-md focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50 focus:outline-none transition-colors" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Action buttons -->
                  <div class="flex flex-wrap gap-2">
                    <button type="button" @click="addVariantRow"
                      class="flex-1 h-8 rounded-lg text-xs font-semibold text-fuchsia-700 dark:text-fuchsia-300 border-2 border-dashed border-fuchsia-300 dark:border-fuchsia-500/40 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-500/[0.06] transition-colors flex items-center justify-center gap-1.5">
                      <Plus class="w-3.5 h-3.5" />
                      Agregar Variante
                    </button>
                    <button type="button" @click="applySuggestedPriceToAll" v-if="variants.length > 0"
                      class="h-8 px-3 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 hover:bg-emerald-50 dark:hover:bg-emerald-500/[0.06] transition-colors flex items-center gap-1">
                      Aplicar precio sugerido a todas
                    </button>
                    <button type="button" @click="clearVariants" v-if="variants.length > 0"
                      class="h-8 px-3 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors">
                      Limpiar
                    </button>
                  </div>

                  <!-- Counter -->
                  <div v-if="variants.length > 0" class="text-[10px] text-slate-500 dark:text-slate-400 text-center">
                    {{ variants.length }} variante{{ variants.length !== 1 ? 's' : '' }} · {{ totalAllocatedStock }} unidad{{ totalAllocatedStock !== 1 ? 'es' : '' }} asignada{{ totalAllocatedStock !== 1 ? 's' : '' }}
                  </div>
                </template>
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

  <!-- SKU Duplicate Modal -->
  <Teleport to="body">
    <div v-if="skuDuplicate" class="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="skuDuplicate = null" />
      <div class="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
            <AlertTriangle class="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 class="text-base font-semibold text-slate-900 dark:text-white">Producto ya registrado</h3>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Este SKU ya existe en tu tienda.</p>
          </div>
        </div>
        <p class="text-sm text-slate-600 dark:text-slate-300">
          <strong>{{ skuDuplicate?.product_name }}</strong> (SKU: {{ skuDuplicate?.sku }})
        </p>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          ¿Deseas ir a editarlo o ver sus detalles?
        </p>
        <div class="flex justify-end gap-2 pt-2">
          <button @click="skuDuplicate = null" type="button"
            class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors">
            Cancelar
          </button>
          <button @click="goToDuplicateProduct" type="button"
            class="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-sm">
            Ir a editar
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch, onMounted, onUnmounted, type Ref } from 'vue';
import {
  X, ScanBarcode, ScanLine, Save, Loader2,
  Percent, Package, PackagePlus, Truck, BadgeDollarSign, AlertTriangle, Info,
  ImagePlus, CheckCircle2, Trash2, Camera, ChevronDown, Layers, FileText, Tag, Receipt, Plus,
} from 'lucide-vue-next';
import { useRouter } from 'vue-router';
import { useApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';
import { useForexRate } from '@/composables/useForexRate';
import { useAuthStore } from '@/stores/auth';
import {
  calcTraditionalPrice,
  calcFinancialPrice,
  calcVES,
  calcEffectiveContainers,
} from '@/composables/stockCalculations';
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
const router = useRouter();

const taxRates = ref<{ id: string; name: string; code: string; rate_percentage: number }[]>([]);
const productTypes = ref<{ id: string; name: string; code: string }[]>([]);

onMounted(async () => {
  restoreDraft();
  await Promise.all([
    fetchApi('/api/v1/catalog/tax-rates/').then((r: any) => {
      taxRates.value = (r?.results ?? []).map((t: any) => ({ id: t.id, name: t.name, code: t.code, rate_percentage: t.rate_percentage }));
    }).catch(() => {}),
    fetchApi('/api/v1/products/product-types/').then((r: any) => {
      productTypes.value = (r?.results ?? []).map((t: any) => ({ id: t.id, name: t.name, code: t.code }));
    }).catch(() => {}),
  ]);
});

const skuDuplicate = ref<{ product_id: string; product_name: string; sku: string } | null>(null);

function checkSkuDuplicate() {
  const sku = form.sku?.trim();
  if (!sku) return;
  apiClient.get('/api/v1/products/', { params: { sku, page_size: 1 } })
    .then(res => {
      const results = res.data?.results ?? [];
      if (results.length > 0) {
        const existing = results[0];
        skuDuplicate.value = {
          product_id: existing.id,
          product_name: existing.name || '',
          sku: existing.sku || '',
        };
      }
    })
    .catch(() => {});
}

function goToDuplicateProduct() {
  if (!skuDuplicate.value) return;
  router.push(`/admin/staff/products/${skuDuplicate.value.product_id}/edit`);
}

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
const activePanels = reactive({
  basic: true,
  classification: true,
  fiscal: false,
  pricingLogistics: true,
  variantGenerator: false,
  unitMeasure: true,
  costsFreight: true,
  costMargin: true,
  sellPrices: true,
  logistics: true,
});
function toggleAccordion(panel: keyof typeof activePanels) {
  activePanels[panel] = !activePanels[panel];
}
const submitting = ref(false);

// ── Wholesale Mode ──

const wholesaleEnabled = ref(false);

const WHOLESALE_UNITS = [
  { value: 'PALLET',     label: 'Paleta / Pallet',            subLabel: 'Bultos por Paleta',         multiplier: 50,  desc: 'Carga unificada' },
  { value: 'BULTO',      label: 'Bulto / Pack Mayorista',     subLabel: 'Unidades por Bulto',        multiplier: 1,   desc: 'Empaque secundario' },
  { value: 'TAMBOR',     label: 'Tambor / Cilindro',          subLabel: 'Litros por Tambor',         multiplier: 200, desc: 'Estándar 200L / Líquidos masivos' },
  { value: 'CONTENEDOR', label: 'Contenedor / TEU',           subLabel: 'Bultos por Contenedor',     multiplier: 1000, desc: 'Importaciones masivas' },
  { value: 'TONELADA',   label: 'Tonelada Métrica',           subLabel: 'Kg por Tonelada',           multiplier: 1000, desc: 'Granel sólido' },
  { value: 'IBC',        label: 'Tanque / Cúbico IBC',        subLabel: 'Litros por IBC',            multiplier: 1000, desc: 'Estándar 1000L' },
];

const selectedWholesaleUnit = ref('BULTO');

const wholesaleConfig = computed(() =>
  WHOLESALE_UNITS.find(u => u.value === selectedWholesaleUnit.value) ?? WHOLESALE_UNITS[1],
);

const effectiveContainers = computed(() => {
  return calcEffectiveContainers(
    form.cantidad_contenedores || 0,
    wholesaleConfig.value.multiplier,
    wholesaleEnabled.value,
  );
});

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

// ── Dynamic Attributes ──

interface DynamicAttribute {
  id: string;
  label: string;
  attr_type: string;
  unit?: string;
  options?: { value: string; label: string }[];
}

const dynamicAttributes = ref<DynamicAttribute[]>([]);
const isLoadingAttributes = ref(false);

watch(() => selectedCategoryId.value, async (newCategoryId) => {
  if (!newCategoryId) {
    dynamicAttributes.value = [];
    form.attributes = {};
    return;
  }
  isLoadingAttributes.value = true;
  try {
    const res = await fetchApi<any>(`/api/v1/catalog/smart-categories/${newCategoryId}/attributes/`);
    const data = Array.isArray(res) ? res : [];
    dynamicAttributes.value = data;
    const initial: Record<string, string> = {};
    for (const attr of data) {
      initial[attr.id] = form.attributes[attr.id] || '';
    }
    form.attributes = initial;
  } catch {
    dynamicAttributes.value = [];
    form.attributes = {};
  } finally {
    isLoadingAttributes.value = false;
  }
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
  if (product.tax_rate_id) form.tax_rate_id = product.tax_rate_id;
  if (product.product_type_id) form.product_type_id = product.product_type_id;
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
  if (wholesaleEnabled.value) return wholesaleConfig.value.label.split(' /')[0];
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
  tax_rate_id: null as string | null,
  product_type_id: null as string | null,
  cost_price_usd: 0,
  cost_price_ves: 0,
  profit_margin: 30,
  margin_type: 'TRADITIONAL',
  price_usd: 0,
  price_ves: 0,
  inventory_method: 'AVERAGE',
  default_purchase_unit: 'UNIT',
  units_per_package: 1,
  initial_physical_stock: 0,
  initial_cost_price: 0,
  attributes: {} as Record<string, string>,
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
    wholesaleEnabled: wholesaleEnabled.value,
    selectedWholesaleUnit: selectedWholesaleUnit.value,
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
    if (data.wholesaleEnabled !== undefined) wholesaleEnabled.value = data.wholesaleEnabled;
    if (data.selectedWholesaleUnit) selectedWholesaleUnit.value = data.selectedWholesaleUnit;
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

// ── Computed: fiscal warning ──

const showFiscalWarning = computed(() => {
  if (!fiscalModuleEnabled.value || fiscalSettings.es_contribuyente_especial) return false;
  const sel = taxRates.value.find(t => t.id === form.tax_rate_id);
  return sel != null && sel.code !== 'EXE';
});

// ── Computed: continuous (KG / LITER) detection ──

const isContinuousUnit = computed(() => form.measurement_type === 'PESO' || form.measurement_type === 'LIQUIDO');

const bulkUnitCost = computed(() => {
  const totalCosto = effectiveContainers.value * finalCostoBultoUSD.value;
  const inversionTotal = totalCosto + finalFleteUSD.value;
  const stockTotal = calculatedStockTotal.value;
  if (stockTotal <= 0) return 0;
  return bcvRound(inversionTotal / stockTotal, 4);
});

const calculatedStockTotal = computed(() => {
  return effectiveContainers.value * form.capacidad_por_contenedor;
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

watch(wholesaleEnabled, (on) => {
  form.cantidad_contenedores = 1;
  form.capacidad_por_contenedor = 1;
  if (!on) {
    form.measurement_type = 'UNIDAD';
  }
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
  return form.margin_type === 'FINANCIAL'
    ? calcFinancialPrice(cost, margin)
    : calcTraditionalPrice(cost, margin);
});

// Dual suggested prices for the comparison display (always both)
const suggestedTraditionalNum = computed(() => {
  const cost = effectiveCostUsd.value;
  if (cost <= 0) return 0;
  return calcTraditionalPrice(cost, form.profit_margin || 0);
});

const suggestedFinancialNum = computed(() => {
  const cost = effectiveCostUsd.value;
  if (cost <= 0) return 0;
  return calcFinancialPrice(cost, form.profit_margin || 0);
});

const suggestedTraditionalVES = computed(() => {
  if (suggestedTraditionalNum.value > 0 && rateValue.value > 0) {
    return fmtVES(calcVES(suggestedTraditionalNum.value, rateValue.value));
  }
  return fmtVES(0);
});

const suggestedFinancialVES = computed(() => {
  if (suggestedFinancialNum.value > 0 && rateValue.value > 0) {
    return fmtVES(calcVES(suggestedFinancialNum.value, rateValue.value));
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
    notifyError('El nombre es obligatorio');
    ok = false;
  }
  if (!form.sku.trim()) {
    errors.sku = 'El SKU es obligatorio';
    notifyError('El SKU es obligatorio');
    ok = false;
  }
  if (!selectedCategoryId.value) {
    notifyError('Debe seleccionar una categoría');
    ok = false;
  }
  if (!form.brand) {
    notifyError('Debe seleccionar una marca');
    ok = false;
  }
  if (!form.product_type_id) {
    notifyError('Debe seleccionar un tipo de producto');
    ok = false;
  }
  if (!form.tax_rate_id) {
    notifyError('Debe seleccionar un impuesto (IVA)');
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
  submitting.value = true;
  try {
    const hasVariants = variants.value.length > 0;

    const fd = new FormData();

    const append = (key: string, value: any) => {
      if (value != null && value !== '' && value !== false) fd.append(key, String(value));
    };

    append('name', form.name.trim());
    append('sku', form.sku.trim());
    append('barcode', form.barcode.trim());
    append('description', form.description.trim());
    append('category_id', selectedCategoryId.value);
    append('brand_id', form.brand);
    append('product_type_id', form.product_type_id);
    append('tax_rate_id', form.tax_rate_id ?? (taxRates.value.length > 0 ? taxRates.value[0].id : '1'));
    append('measurement_type', form.measurement_type);
    append('container_type', form.container_type);
    append('weight_container', form.weight_container);
    append('liquid_container', form.liquid_container);
    append('cantidad_contenedores', form.cantidad_contenedores);
    append('capacidad_por_contenedor', form.capacidad_por_contenedor);
    append('cost_price_usd', form.cost_price_usd);
    append('cost_price_ves', form.cost_price_ves);
    append('profit_margin', form.profit_margin);
    append('margin_type', form.margin_type);
    append('initial_physical_stock', form.initial_physical_stock);
    append('suggested_price', form.price_usd);
    append('suggested_price_ves', form.price_ves);
    append('initial_cost_price', form.initial_cost_price);
    append('inventory_method', form.inventory_method);
    append('default_purchase_unit', form.default_purchase_unit);
    append('units_per_package', form.units_per_package);
    append('has_variants', hasVariants ? 'true' : 'false');

    if (form.global_product_id) {
      append('global_product_id', form.global_product_id);
    }
    if (isNewProductGlobal.value) {
      append('is_new_global', 'true');
    }
    if (wholesaleEnabled.value) {
      append('sale_type', 'MAYORISTA');
      append('wholesale_unit', selectedWholesaleUnit.value);
    }
    if (selectedImageFile.value) {
      fd.append('image', selectedImageFile.value, 'product.webp');
    } else if (typeof form.image === 'string' && form.image.startsWith('http')) {
      append('image', form.image);
    }
    const attrKeys = Object.keys(form.attributes).filter(k => form.attributes[k]);
    if (attrKeys.length > 0) {
      append('attributes', JSON.stringify(form.attributes));
    }
    if (hasVariants) {
      append('variants', JSON.stringify(variants.value.map(v => ({
        sku: `${form.sku}${v.sku_suffix}`.replace(/\s+/g, ''),
        barcode: v.barcode || '',
        stock: parseInt(String(v.stock), 10) || 0,
        price_base: parseFloat(String(v.price_base)) || 0,
        attribute_values: v.attribute_values || {},
      }))));
    }

    await apiClient.post('/api/v1/products/', fd);
    notifySuccess('Producto creado exitosamente');
    clearDraft();
    resetForm();
    emit('productCreated', { name: form.name, sku: form.sku });
    emit('close');
  } catch (e: any) {
    const drfData = e?.response?.data ?? e?.data;
    if (drfData && typeof drfData === 'object' && !Array.isArray(drfData)) {
      const errMap = drfData as Record<string, any>;
      if (errMap.sku || errMap.barcode) {
        const msgs = [errMap.sku, errMap.barcode].flat().filter(Boolean).join(' ');
        if (msgs) { notifyError(msgs); return; }
      }
      if (errMap.non_field_errors) {
        const msg = Array.isArray(errMap.non_field_errors)
          ? errMap.non_field_errors.join('. ')
          : errMap.non_field_errors;
        if (msg) { notifyError(msg); return; }
      }
      if (errMap.variants) {
        const msg = Array.isArray(errMap.variants)
          ? errMap.variants.join('. ')
          : errMap.variants;
        if (msg) { notifyError(`Variantes: ${msg}`); return; }
      }
      const msg = Object.entries(errMap)
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
  form.tax_rate_id = null;
  form.product_type_id = null;
  form.cost_price_usd = 0;
  form.cost_price_ves = 0;
  form.profit_margin = 30;
  form.margin_type = 'TRADITIONAL';
  form.price_usd = 0;
  form.price_ves = 0;
  form.inventory_method = 'AVERAGE';
  form.default_purchase_unit = 'UNIT';
  form.units_per_package = 1;
  form.initial_physical_stock = 0;
  form.initial_cost_price = 0;
  form.attributes = {};
  errors.barcode = '';
  errors.name = '';
  errors.sku = '';
  activeTab.value = 'general';
  selectedCategoryId.value = null;
  brands.value = [];
  dynamicAttributes.value = [];
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
  wholesaleEnabled.value = false;
  selectedWholesaleUnit.value = 'BULTO';
  isNewProductGlobal.value = false;
  isCheckingBarcode.value = false;
  scanning.value = false;
  variants.value = [];
  variantBarcodeBase.value = '';
  for (const key of Object.keys(variantCollapsed)) {
    delete variantCollapsed[key];
  }
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
    fiscalModuleEnabled.value = false;
    const exe = taxRates.value.find(t => t.code === 'EXE');
    if (exe) form.tax_rate_id = exe.id;
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

// ── Variant Generator (Accordion E) ──

interface VariantRow {
  id: string;
  attribute_values: Record<string, string>;
  sku_suffix: string;
  barcode: string;
  stock: number;
  price_base: number;
  _manualPrice: boolean;
}

let variantIdCounter = 0;
const variantBarcodeBase = ref('');
const variants = ref<VariantRow[]>([]);
const variantCollapsed = reactive<Record<string, boolean>>({});

function isVariantCollapsed(id: string): boolean {
  return variantCollapsed[id] === true;
}

function toggleVariantCollapse(id: string) {
  variantCollapsed[id] = !variantCollapsed[id];
}

const totalAllocatedStock = computed(() =>
  variants.value.reduce((sum, v) => sum + (v.stock || 0), 0)
);

const stockBalance = computed(() =>
  (form.initial_physical_stock || 0) - totalAllocatedStock.value
);

function generateSkuSuffix(attrs: Record<string, string>): string {
  return Object.values(attrs).filter(Boolean).join('-').toUpperCase().replace(/\s+/g, '-');
}

function addVariantRow() {
  const initialAttrs: Record<string, string> = {};
  for (const attr of dynamicAttributes.value) {
    initialAttrs[attr.id] = '';
  }
  const id = `var_${++variantIdCounter}`;
  const suffix = generateSkuSuffix(initialAttrs);
  const base = variantBarcodeBase.value.trim();
  const bcode = base ? `${base}${String(variantIdCounter).padStart(3, '0')}` : '';
  variantCollapsed[id] = false;
  variants.value.push({
    id,
    attribute_values: initialAttrs,
    sku_suffix: suffix,
    barcode: bcode,
    stock: 0,
    price_base: 0,
    _manualPrice: false,
  });
}

function removeVariantRow(index: number) {
  variants.value.splice(index, 1);
}

function clearVariants() {
  variants.value = [];
  variantBarcodeBase.value = '';
  for (const key of Object.keys(variantCollapsed)) {
    delete variantCollapsed[key];
  }
}

function applySuggestedPriceToAll() {
  const suggested = form.price_usd > 0 ? form.price_usd : (suggestedTraditionalNum.value || 0);
  if (suggested <= 0) return;
  for (const v of variants.value) {
    if (!v._manualPrice) {
      v.price_base = suggested;
    }
  }
}

function syncStockToGlobal() {
  form.initial_physical_stock = totalAllocatedStock.value;
}

function onPriceBaseInput(index: number, event: Event) {
  const v = variants.value[index];
  if (!v) return;
  v._manualPrice = true;
  const raw = (event.target as HTMLInputElement).value;
  const parsed = parseFloat(raw);
  v.price_base = isNaN(parsed) ? 0 : parsed;
}
</script>

<style scoped>
@keyframes slide-in {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
.animate-slide-in { animation: slide-in 0.2s ease-out; }
</style>