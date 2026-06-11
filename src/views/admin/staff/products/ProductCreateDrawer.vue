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
          <template v-if="activeTab === 'general'">
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

            <!-- Category (buscador interactivo + cascade) -->
            <div class="relative" ref="categoryTriggerRef">
              <label class="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Categoría <span class="text-red-400">*</span></label>
              <button type="button" @click="catOpen = !catOpen"
                class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-white/[0.08] rounded-lg flex items-center justify-between transition-colors bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200">
                <span class="truncate text-left pr-2">
                  {{ selectedCategoryName || 'Seleccionar categoría...' }}
                </span>
                <ChevronDown class="w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform" :class="{ 'rotate-180': catOpen }" />
              </button>

              <!-- Dropdown buscador -->
              <div v-if="catOpen" data-cat-dropdown
                class="fixed z-[200] bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/[0.08] rounded-lg shadow-xl overflow-hidden"
                :style="catDropdownStyle">
                <div class="p-2 border-b border-slate-100 dark:border-white/[0.06]">
                  <div class="relative">
                    <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input v-model="catFilter" type="text" placeholder="Buscar categoría..."
                      class="w-full h-8 pl-8 pr-3 text-xs border border-slate-200 dark:border-white/[0.08] rounded-md bg-slate-50 dark:bg-white/[0.03] text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                  </div>
                </div>
                <div class="max-h-60 overflow-y-auto py-1">
                  <div v-if="filteredCategories.length === 0" class="px-3 py-4 text-center text-xs text-slate-400">Sin resultados</div>
                  <button v-for="node in filteredCategories" :key="node.id"
                    @click="selectCategory(node)"
                    class="w-full text-left px-3 py-1.5 text-sm hover:bg-blue-50 dark:hover:bg-blue-500/[0.08] transition-colors flex items-center gap-2"
                    :style="{ paddingLeft: (node._depth * 12 + 12) + 'px' }"
                    :class="selectedCategoryId === node.id ? 'bg-blue-50 dark:bg-blue-500/[0.12] text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'">
                    <span v-if="node._depth > 0" class="text-slate-300 text-[10px] shrink-0">{{ '·'.repeat(Math.min(node._depth, 3)) }}</span>
                    <span class="truncate">{{ node.name }}</span>
                    <span class="text-[10px] text-slate-400 font-mono ml-auto shrink-0">{{ node.code }}</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Brand (deshabilitado hasta que se elija categoría) -->
            <div>
              <label class="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Marca</label>
              <div class="flex gap-2">
                <select v-model="form.brand" :disabled="!selectedCategoryId"
                  class="flex-1 h-9 px-3 text-sm border border-slate-300 dark:border-white/[0.08] rounded-lg focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50 focus:outline-none transition-colors appearance-none cursor-pointer"
                  :class="selectedCategoryId
                    ? 'bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200'
                    : 'bg-slate-100 dark:bg-white/[0.01] text-slate-400 dark:text-slate-500 cursor-not-allowed'">
                  <option :value="null">{{ selectedCategoryId ? 'Sin marca' : 'Primero elige una categoría' }}</option>
                  <option v-for="b in brands" :key="b.id" :value="b.id">{{ b.name }}</option>
                </select>
                <button type="button" @click="showBrandModal = true" :disabled="!selectedCategoryId"
                  class="h-9 px-3 rounded-lg text-sm font-medium border transition-colors flex items-center gap-1.5 shrink-0"
                  :class="selectedCategoryId
                    ? 'border-slate-300 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                    : 'border-slate-200 dark:border-white/[0.04] text-slate-300 dark:text-slate-500 cursor-not-allowed'">
                  <Plus class="w-4 h-4" /> Nueva Marca
                </button>
              </div>
              <p v-if="loadingBrands" class="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <Loader2 class="w-3 h-3 animate-spin" /> Cargando marcas...
              </p>
            </div>

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

          </template>

          <!-- ================================================================ -->
          <!-- TAB: Precios y Logística -->
          <!-- ================================================================ -->
          <template v-if="activeTab === 'pricing'">
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
                </div>
                <div>
                  <label class="block text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">Costo Unit. Inicial USD</label>
                  <input v-model.number="form.initial_cost_price" type="number" min="0" step="0.0001" placeholder="0.00"
                    class="w-full h-9 px-3 text-sm border border-amber-300 dark:border-amber-500/30 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-slate-200 placeholder-slate-400 rounded-lg focus:ring-amber-500/20 focus:border-amber-400 focus:outline-none transition-colors" />
                </div>
              </div>
            </div>

            <!-- Toggle Logística por Bulto / Empaque Mayorista -->
            <div class="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.08] rounded-lg p-4 space-y-3">
              <label class="flex items-center gap-3 cursor-pointer select-none">
                <div class="relative w-[44px] h-[24px]">
                  <input type="checkbox" v-model="logisticsEnabled"
                    class="sr-only peer" />
                  <div class="w-[44px] h-[24px] rounded-full bg-slate-300 dark:bg-white/[0.12] peer-checked:bg-blue-600 transition-colors" />
                  <div class="absolute top-[3px] left-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-sm peer-checked:translate-x-[20px] transition-transform" />
                </div>
                <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  📦 Activar Configuración de Logística por Bulto / Empaque Mayorista
                </span>
              </label>

              <div v-if="logisticsEnabled" class="space-y-3 pt-2 border-t border-slate-200 dark:border-white/[0.06]">
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Unidad de Medida</label>
                    <select v-model="logistics.unit"
                      class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 rounded-lg focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50 focus:outline-none transition-colors appearance-none cursor-pointer">
                      <option value="BOX">Caja</option>
                      <option value="BULK">Bulto</option>
                      <option value="SACK">Saco</option>
                      <option value="KG">Kg</option>
                      <option value="LITER">Litro</option>
                      <option value="LOT">Lote</option>
                      <option value="UNIT">Unidad</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Cantidad por Empaque</label>
                    <input v-model.number="logistics.qtyPerPackage" type="number" min="1" step="1" placeholder="1"
                      @input="recalcLogisticsCost"
                      class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 placeholder-slate-400 rounded-lg focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50 focus:outline-none transition-colors" />
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Costo Total del Bulto (USD)</label>
                    <input v-model.number="logistics.bulkCostUsd" type="number" min="0" step="0.0001" placeholder="0.00"
                      @input="recalcLogisticsCost"
                      class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 placeholder-slate-400 rounded-lg focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50 focus:outline-none transition-colors" />
                  </div>
                  <div>
                    <label class="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Flete / Importación (USD)</label>
                    <input v-model.number="logistics.freightUsd" type="number" min="0" step="0.0001" placeholder="0.00 (opcional)"
                      @input="recalcLogisticsCost"
                      class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 placeholder-slate-400 rounded-lg focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50 focus:outline-none transition-colors" />
                  </div>
                </div>

                <!-- Resultado + conversión a VES -->
                <div class="bg-blue-50 dark:bg-blue-500/[0.06] border border-blue-200 dark:border-blue-500/20 rounded-lg p-3">
                  <div class="flex items-center justify-between">
                    <span class="text-[10px] font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Costo Unitario Calculado</span>
                    <span class="text-sm font-mono font-bold text-blue-900 dark:text-blue-200">
                      ${{ computedLogisticsUnitCost }}
                    </span>
                  </div>
                  <p class="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">
                    (Costo Bulto ${{ logistics.bulkCostUsd.toFixed(4) }} + Flete ${{ logistics.freightUsd.toFixed(4) }}) / {{ logistics.qtyPerPackage }} uds
                  </p>
                  <div v-if="rateValue > 0 && computedLogisticsUnitCostNum > 0" class="mt-1.5 pt-1.5 border-t border-blue-200 dark:border-blue-500/20">
                    <span class="text-[10px] text-blue-600 dark:text-blue-400">Equivalente en VES (BCV):</span>
                    <span class="text-sm font-mono font-bold text-blue-900 dark:text-blue-200 ml-2">
                      Bs. {{ (computedLogisticsUnitCostNum * rateValue).toFixed(2) }}
                    </span>
                  </div>
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
                  <input v-model.number="form.cost_price_usd" type="number" min="0" step="0.0001" placeholder="0.00"
                    @input="recalcSuggested"
                    class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 placeholder-slate-400 rounded-lg focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50 focus:outline-none transition-colors" />
                </div>
                <div>
                  <label class="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Costo VES</label>
                  <input v-model.number="form.cost_price_ves" type="number" min="0" step="0.01" placeholder="0.00"
                    @input="onCostVesEdit"
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
                    <p class="text-lg font-mono font-bold text-blue-900 dark:text-blue-200">${{ suggestedPriceUsd }}</p>
                  </div>
                  <div>
                    <span class="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">VES</span>
                    <p class="text-lg font-mono font-bold text-blue-900 dark:text-blue-200">Bs. {{ suggestedPriceVes }}</p>
                    <p v-if="rateValue > 0" class="text-[10px] text-blue-500 dark:text-blue-400">Tasa BCV: Bs. {{ rateValue.toFixed(2) }}</p>
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
                  <input v-model.number="form.price_usd" type="number" min="0" step="0.01" placeholder="0.00" @input="onPriceUsdInput"
                    class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 placeholder-slate-400 rounded-lg focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50 focus:outline-none transition-colors" />
                </div>
                <div>
                  <label class="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Precio VES</label>
                  <input v-model.number="form.price_ves" type="number" min="0" step="0.01" placeholder="0.00" @input="onPriceVesInput"
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
          </template>
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
          <label class="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Categoría <span class="text-red-400">*</span></label>
          <select v-model="newBrandCategoryId"
            class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 rounded-lg focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50 focus:outline-none transition-colors appearance-none cursor-pointer"
            :class="{'border-red-400 bg-red-50 dark:bg-red-500/[0.04]': brandFormErrors.category}">
            <option :value="null">Seleccionar categoría...</option>
            <option v-for="cat in flatTree" :key="cat.id" :value="cat.id">
              {{ '·'.repeat(Math.min(cat._depth, 3)) }} {{ cat.name }}
            </option>
          </select>
          <p v-if="brandFormErrors.category" class="text-[11px] text-red-500 mt-1">{{ brandFormErrors.category }}</p>
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
import { reactive, ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import {
  X, ChevronDown, Search, ScanBarcode, ScanLine, Save, Loader2,
  Percent, DollarSign, Package, PackagePlus, BadgeDollarSign, AlertTriangle, Info, Plus,
  ImagePlus, CheckCircle2, Trash2, Camera,
} from 'lucide-vue-next';
import { useApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';
import { useForexRate } from '@/composables/useForexRate';
import BarcodeScanner from '@/components/shared/BarcodeScanner.vue';
import ProductImageStudio from '@/views/admin/super-console/components/ProductImageStudio.vue';

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
  bulkCostUsd: number;
  freightUsd: number;
}

// ── Props & emits ──

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{
  close: [];
  productCreated: [payload: Record<string, any>];
}>();

const { fetchApi } = useApi();
const { success: notifySuccess, error: notifyError } = useNotify();
const { rateValue, fetchForexRate } = useForexRate();

const tabs = [
  { key: 'general', label: 'Información General' },
  { key: 'pricing', label: 'Precios y Logística' },
];

const activeTab = ref('general');
const submitting = ref(false);

// Scanner
const scanning = ref(false);

// ── Categories (searchable autocomplete) ──

const categoryTree = ref<CategoryNode[]>([]);
const selectedCategoryId = ref<number | string | null>(null);
const catOpen = ref(false);
const catFilter = ref('');
const categoryTriggerRef = ref<HTMLElement | null>(null);
const catDropdownStyle = ref<Record<string, string>>({});

const flatTree = computed<FlatCategory[]>(() => {
  const list: FlatCategory[] = [];
  function walk(nodes: CategoryNode[], depth: number) {
    for (const n of nodes) {
      list.push({ ...n, _depth: depth, children: undefined as any });
      if (n.children) walk(n.children, depth + 1);
    }
  }
  if (categoryTree.value) walk(categoryTree.value, 0);
  return list;
});

const filteredCategories = computed(() => {
  if (!catFilter.value.trim()) return flatTree.value;
  const q = catFilter.value.toLowerCase();
  return flatTree.value.filter(
    n => n.name.toLowerCase().includes(q) || (n.code || '').toLowerCase().includes(q),
  );
});

const selectedCategoryName = computed(() => {
  if (!selectedCategoryId.value) return '';
  const found = flatTree.value.find(n => n.id === selectedCategoryId.value);
  return found ? found.name : '';
});

function selectCategory(node: FlatCategory) {
  selectedCategoryId.value = node.id;
  catOpen.value = false;
  catFilter.value = '';
  onCategoryChange();
}

function updateCatDropdownPos() {
  if (!categoryTriggerRef.value) return;
  const rect = categoryTriggerRef.value.getBoundingClientRect();
  catDropdownStyle.value = {
    top: (rect.bottom + 4) + 'px',
    left: rect.left + 'px',
    width: rect.width + 'px',
    maxHeight: '260px',
    zIndex: '9999',
  };
}

function onOutsideCatClick(e: MouseEvent) {
  const target = e.target as Node;
  if (categoryTriggerRef.value?.contains(target)) return;
  const panel = document.querySelector('[data-cat-dropdown]');
  if (panel?.contains(target)) return;
  catOpen.value = false;
}

watch(catOpen, async (v) => {
  if (v) {
    await nextTick();
    updateCatDropdownPos();
  } else {
    catFilter.value = '';
  }
});

// ── Brands (cascade) ──

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

function onStudioProcessed(_blob: Blob, previewUrl: string) {
  form.image = previewUrl;
  showImageStudio.value = false;
}

function removeImage() {
  form.image = '';
}

// ── Fiscal ──

const fiscalSettings = reactive<FiscalSettings>({
  enable_iva: true,
  iva_porcentaje: 16,
  es_contribuyente_especial: false,
});

const fiscalModuleEnabled = ref(true);

// ── Logistics toggle ──

const logisticsEnabled = ref(false);
const logistics = reactive<LogisticsState>({
  unit: 'BOX',
  qtyPerPackage: 1,
  bulkCostUsd: 0,
  freightUsd: 0,
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
  iva_type: 'GENERAL',
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

// ── Computed: logistics unit cost ──

const computedLogisticsUnitCostNum = computed(() => {
  if (!logisticsEnabled.value || logistics.qtyPerPackage <= 0) return 0;
  return (logistics.bulkCostUsd + logistics.freightUsd) / logistics.qtyPerPackage;
});

const computedLogisticsUnitCost = computed(() => {
  return computedLogisticsUnitCostNum.value.toFixed(4);
});

function recalcLogisticsCost() {
  if (logisticsEnabled.value && logistics.qtyPerPackage > 0) {
    const unitCost = (logistics.bulkCostUsd + logistics.freightUsd) / logistics.qtyPerPackage;
    form.initial_cost_price = unitCost;
    form.cost_price_usd = unitCost;
    form.cost_price_ves = unitCost * (rateValue.value || 0);
    form.default_purchase_unit = logistics.unit;
  }
}

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
    form.price_ves = Number((form.price_usd * rateValue.value).toFixed(2));
  }
}

function onPriceVesInput() {
  priceVesUserEdited.value = true;
  priceUsdUserEdited.value = false;
  if (rateValue.value > 0) {
    form.price_usd = Number((form.price_ves / rateValue.value).toFixed(4));
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
  if (logisticsEnabled.value && logistics.qtyPerPackage > 0) {
    return computedLogisticsUnitCostNum.value;
  }
  return form.cost_price_usd || 0;
});

const suggestedPriceUsd = computed(() => {
  const cost = effectiveCostUsd.value;
  const margin = form.profit_margin || 0;
  if (cost <= 0 || margin <= 0) return '0.00';
  if (form.margin_type === 'FINANCIAL') {
    const divisor = 1 - margin / 100;
    return divisor <= 0.01 ? '0.00' : (cost / divisor).toFixed(2);
  }
  return (cost * (1 + margin / 100)).toFixed(2);
});

const suggestedPriceVes = computed(() => {
  const usd = Number(suggestedPriceUsd.value) || 0;
  if (usd > 0 && rateValue.value > 0) {
    return (usd * rateValue.value).toFixed(2);
  }
  return '0.00';
});

// ── Auto-fill Precios de Venta desde sugerido ──

watch(suggestedPriceUsd, (val) => {
  if (!priceUsdUserEdited.value && !priceVesUserEdited.value) {
    form.price_usd = Number(val);
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
  submitting.value = true;
  try {
    const selectedCat = flatTree.value.find(c => c.id === selectedCategoryId.value);
    const payload: Record<string, any> = {
      barcode: form.barcode.trim() || '',
      name: form.name.trim(),
      sku: form.sku.trim(),
      brand: form.brand,
      category: selectedCat ? selectedCat.name : '',
      description: form.description.trim(),
      iva_type: fiscalModuleEnabled.value ? form.iva_type : 'EXENTO',
      cost_price_usd: form.cost_price_usd,
      cost_price_ves: form.cost_price_ves,
      profit_margin: form.profit_margin,
      margin_type: form.margin_type,
      price_usd: form.price_usd,
      price_ves: form.price_ves,
      inventory_method: form.inventory_method,
      default_purchase_unit: form.default_purchase_unit,
      units_per_package: form.units_per_package,
      initial_physical_stock: form.initial_physical_stock,
      initial_cost_price: form.initial_cost_price,
      image_b64: form.image || '',
    };

    if (logisticsEnabled.value && logistics.qtyPerPackage > 0) {
      payload.costo_bulto_total_usd = logistics.bulkCostUsd;
      payload.costo_flete_usd = logistics.freightUsd;
      payload.default_purchase_unit = logistics.unit;
    }

    if (payload.brand === null) delete payload.brand;

    await fetchApi('/api/v1/products/', {
      method: 'POST',
      data: JSON.stringify(payload),
    });
    notifySuccess('Producto creado exitosamente');
    clearDraft();
    resetForm();
    emit('productCreated', payload);
    emit('close');
  } catch (e: any) {
    notifyError(e?.response?.data?.error || e?.message || 'Error al crear producto');
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
  form.iva_type = 'GENERAL';
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
  errors.barcode = '';
  errors.name = '';
  errors.sku = '';
  activeTab.value = 'general';
  selectedCategoryId.value = null;
  brands.value = [];
  logisticsEnabled.value = false;
  logistics.unit = 'BOX';
  logistics.qtyPerPackage = 1;
  logistics.bulkCostUsd = 0;
  logistics.freightUsd = 0;
  fiscalModuleEnabled.value = true;
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
  scanning.value = false;
}

function handleClose() {
  resetForm();
  clearDraft();
  emit('close');
}

// ── Category change → fetch brands (cascade) ──

async function onCategoryChange() {
  form.brand = null;
  brands.value = [];
  if (!selectedCategoryId.value) return;
  loadingBrands.value = true;
  try {
    const res = await fetchApi<any>(`/api/v1/catalog/categories/${selectedCategoryId.value}/brands/`);
    brands.value = Array.isArray(res)
      ? res.map((b: any) => ({ id: b.id, name: b.name }))
      : [];
  } catch {
    brands.value = [];
  } finally {
    loadingBrands.value = false;
  }
}

// ── Scanner ──

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
        const catNode = flatTree.value.find(
          n => n.name.toLowerCase() === category.toLowerCase()
        );
        if (catNode) {
          selectedCategoryId.value = catNode.id;
          loadingBrands.value = true;
          try {
            const brandRes = await fetchApi<any>(`/api/v1/catalog/categories/${catNode.id}/brands/`);
            brands.value = Array.isArray(brandRes) ? brandRes.map((b: any) => ({ id: b.id, name: b.name })) : [];
          } catch { brands.value = []; }
          finally { loadingBrands.value = false; }
          if (brand) {
            const match = brands.value.find((b: BrandItem) => b.id === brand);
            if (match) form.brand = match.id;
          }
        }
      }
    }
  } catch { /* ignore */ }
  finally { searchingBarcode.value = false; }
}

function toggleScanner() {
  scanning.value = !scanning.value;
}

onUnmounted(() => {
  document.removeEventListener('click', onOutsideCatClick, true);
  document.removeEventListener('click', onDocumentClick);
});

// ── Load init data when drawer opens ──

watch(() => props.visible, async (v) => {
  if (v) {
    activeTab.value = 'general';
    await Promise.all([loadCategories(), loadFiscalSettings(), fetchForexRate()]);
    document.addEventListener('click', onOutsideCatClick, true);
    document.addEventListener('click', onDocumentClick);
    if (!fiscalSettings.enable_iva) {
      form.iva_type = 'EXENTO';
      fiscalModuleEnabled.value = false;
    }
  } else {
    document.removeEventListener('click', onOutsideCatClick, true);
    document.removeEventListener('click', onDocumentClick);
  }
});

async function loadCategories() {
  try {
    const res = await fetchApi<any>('/api/v1/catalog/categories/?page_size=200');
    categoryTree.value = Array.isArray(res?.results) ? res.results : (Array.isArray(res) ? res : []);
  } catch {
    categoryTree.value = [];
  }
}

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
