<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <div v-if="loadingEdit" class="flex items-center justify-center py-20">
      <Loader2 class="w-5 h-5 animate-spin text-slate-400" />
      <span class="ml-2 text-sm text-slate-400">Cargando producto...</span>
    </div>

    <template v-else>
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-slate-800">
            {{ isEditing ? 'Editar Producto' : 'Nuevo Producto' }}
          </h2>
          <p class="text-xs text-slate-500 mt-0.5">
            {{ isEditing ? 'Modifica los datos del producto' : 'Registra un nuevo producto en el catálogo' }}
          </p>
        </div>
        <button @click="resetForm" type="button" class="text-xs text-slate-400 hover:text-slate-600 transition-colors">
          Limpiar
        </button>
      </div>

      <div class="border-b border-slate-200">
        <nav class="flex gap-6">
          <button v-for="t in tabs" :key="t.key"
            @click="activeTab = t.key"
            class="pb-3 text-sm font-medium border-b-2 transition-colors"
            :class="activeTab === t.key
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'">
            {{ t.label }}
          </button>
        </nav>
      </div>

      <div v-if="!isStaff"
        class="rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-3 text-xs leading-relaxed text-blue-800">
        <p>
          <span class="font-semibold">🔒 Atributos globales verificados por Efectivo 360.</span>
          Los campos de identidad del producto (Nombre, SKU, código de barras, marca y categoría)
          están protegidos para mantener la estandarización del catálogo.
        </p>
      </div>

      <!-- ════════════════════════════════════ -->
      <!-- TAB: Datos Generales                 -->
      <!-- ════════════════════════════════════ -->
      <div v-show="activeTab === 'general'" class="bg-white border border-slate-200 shadow-sm rounded-xl p-6 space-y-5">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">
              Nombre <span class="text-red-400">*</span>
              <span v-if="!isStaff" class="ml-1.5 text-[10px] font-normal text-slate-400">(Solo lectura)</span>
            </label>
            <div class="relative">
              <input v-model="form.name" type="text" placeholder="Ej. Leche Pasteurizada 1L"
                :disabled="!isStaff" @input="errors.name = ''"
                class="w-full h-10 px-3.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                :class="{'border-red-400 bg-red-50': errors.name}" />
              <span v-if="!isStaff" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300">
                <Lock class="w-3.5 h-3.5" />
              </span>
            </div>
            <p v-if="errors.name" class="text-[11px] text-red-500 mt-1">{{ errors.name }}</p>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">
              SKU <span class="text-red-400">*</span>
              <span v-if="!isStaff" class="ml-1.5 text-[10px] font-normal text-slate-400">(Solo lectura)</span>
            </label>
            <input v-model="form.sku" type="text" placeholder="Ej. LEC-001"
              :disabled="!isStaff"
              class="w-full h-10 px-3.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">Código de barras</label>
            <input v-model="form.barcode" type="text" placeholder="EAN-13, UPC, etc."
              class="w-full h-10 px-3.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">Marca</label>
            <select v-model="form.brand_id"
              class="w-full h-10 px-3.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
              <option :value="null">Seleccionar...</option>
              <option v-for="b in brands" :key="b.id" :value="b.id">{{ b.name }}</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">Categoría</label>
            <input v-model="form.category" type="text" placeholder="Ej. LÁCTEOS"
              :disabled="!isStaff"
              class="w-full h-10 px-3.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
          </div>

          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">Descripción</label>
            <textarea v-model="form.description" rows="3" placeholder="Descripción opcional"
              class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
          </div>

          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">Imagen del Producto</label>
            <div class="flex items-center gap-4">
              <div class="w-24 h-24 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center bg-slate-50 shrink-0">
                <img v-if="form.image && !imageError" :src="form.image" alt=""
                  class="w-full h-full object-cover"
                  @error="imageError = true" />
                <Package v-else class="w-8 h-8 text-slate-300" />
              </div>
              <div class="text-xs text-slate-400">
                <p v-if="form.image && !imageError" class="text-slate-600">Imagen actual</p>
                <p v-else class="text-slate-400">Sin imagen</p>
              </div>
            </div>
          </div>

          <div class="sm:col-span-2 flex items-center gap-3 pt-1">
            <button @click="form.is_active = !form.is_active" type="button"
              class="relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors"
              :class="form.is_active ? 'bg-emerald-500' : 'bg-slate-300'">
              <span class="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform ring-0 transition-transform"
                :class="form.is_active ? 'translate-x-4' : 'translate-x-0.5'" />
            </button>
            <span class="text-sm text-slate-700">{{ form.is_active ? 'Activo' : 'Inactivo' }}</span>
          </div>
        </div>
      </div>

      <!-- ════════════════════════════════════ -->
      <!-- TAB: Precios y Logística             -->
      <!-- ════════════════════════════════════ -->
      <div v-show="activeTab === 'prices'" class="space-y-4">

        <!-- ── Wholesale Mode Toggle ── -->
        <div class="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
          <div>
            <p class="text-sm font-medium text-slate-700">Activar Modo Mayorista</p>
            <p class="text-xs text-slate-500">Cálculos a gran escala — Distribución Masiva</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input v-model="wholesaleEnabled" type="checkbox" class="sr-only peer" />
            <div class="w-[42px] h-[22px] bg-slate-300 rounded-full peer peer-checked:bg-indigo-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-[18px] after:w-[18px] after:shadow-sm after:transition-all"></div>
          </label>
        </div>

        <!-- ⚠️ Wholesale Warning Banner -->
        <div v-if="wholesaleEnabled"
          class="border-l-4 border-red-600 bg-red-50 text-red-800 p-4 text-xs leading-relaxed rounded-r-lg">
          <p class="font-bold mb-1 text-[11px] uppercase tracking-wider">⚠️ ADVERTENCIA DE RENTABILIDAD</p>
          <p>Este modo está diseñado exclusivamente para Distribución Masiva y Mayoristas. <strong>NO SE RECOMIENDA</strong> activar esta opción para ventas minoristas tradicionales (al detal), ya que el cálculo opera bajo márgenes mínimos de volumen masivo y unidades de carga industrial, lo que comprometería la rentabilidad del negocio detal.</p>
        </div>

        <!-- ── Tipo de Medición / Mayorista ── -->
        <div class="bg-white border border-slate-200 shadow-sm rounded-xl p-4 space-y-3">
          <span class="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            {{ wholesaleEnabled ? 'Unidad de Carga Mayorista' : 'Tipo de Medición' }}
          </span>

          <!-- ══════ RETAIL MODE ══════ -->
          <template v-if="!wholesaleEnabled">
            <div class="flex gap-2">
              <button v-for="opt in measureOptions" :key="opt.value"
                @click="selectMeasurement(opt.value)"
                type="button"
                class="flex-1 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors"
                :class="form.measurement_type === opt.value
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'">
                {{ opt.label }}
              </button>
            </div>

            <div v-if="form.measurement_type === 'PESO'" class="flex gap-2">
              <button v-for="opt in weightOptions" :key="opt.value"
                @click="form.weight_container = opt.value; form.container_type = opt.value"
                type="button"
                class="flex-1 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-colors"
                :class="form.weight_container === opt.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-50'">
                {{ opt.label }}
              </button>
            </div>
            <div v-else-if="form.measurement_type === 'LIQUIDO'" class="flex gap-2">
              <button v-for="opt in liquidOptions" :key="opt.value"
                @click="form.liquid_container = opt.value; form.container_type = opt.value"
                type="button"
                class="flex-1 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-colors"
                :class="form.liquid_container === opt.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-50'">
                {{ opt.label }}
              </button>
            </div>
          </template>

          <!-- ══════ WHOLESALE MODE ══════ -->
          <template v-else>
            <div>
              <label class="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Unidad de Carga Mayorista <span class="text-red-400">*</span></label>
              <select v-model="selectedWholesaleUnit"
                class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                <option v-for="u in WHOLESALE_UNITS" :key="u.value" :value="u.value">{{ u.label }} — {{ u.desc }}</option>
              </select>
              <p class="text-[11px] text-slate-400 mt-1">
                1 {{ wholesaleMainConfig.label.split(' /')[0] }} = <strong>{{ wholesaleMainConfig.multiplier }}</strong> {{ wholesaleMainConfig.subLabel.split(' por')[0].toLowerCase() }}s
              </p>
            </div>
          </template>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                <template v-if="wholesaleEnabled">
                  Cantidad de {{ wholesaleMainConfig.label.split(' /')[0].toLowerCase() }}s a ingresar
                </template>
                <template v-else>
                  {{ containerLabel }} (Cantidad)
                </template>
              </label>
              <input v-model.number="form.cantidad_contenedores" type="number" min="1" step="1" placeholder="1"
                :disabled="isEditing"
                class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                <template v-if="wholesaleEnabled">
                  {{ wholesaleMainConfig.subLabel }}
                </template>
                <template v-else>
                  {{ capacityLabel }}
                </template>
              </label>
              <input v-model.number="form.capacidad_por_contenedor" type="number" min="1" step="1" placeholder="1"
                :disabled="isEditing"
                class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>

          <!-- Wholesale multiplier breakdown -->
          <div v-if="wholesaleEnabled" class="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2.5 text-xs text-indigo-700 leading-relaxed">
            🧮 <strong>{{ form.cantidad_contenedores || 0 }} {{ wholesaleMainConfig.label.split(' /')[0].toLowerCase() }}s</strong>
            × {{ wholesaleMainConfig.multiplier }} {{ wholesaleMainConfig.subLabel.split(' por')[0].toLowerCase() }}/unidad
            = <strong>{{ effectiveContainersForm }}</strong> {{ wholesaleMainConfig.subLabel.split(' por')[0].toLowerCase() }}s
            → {{ calculatedStockTotal }} uds. finales
          </div>

          <div class="pt-1 flex items-center flex-wrap gap-2">
            <span class="text-[10px] font-semibold text-blue-700 uppercase tracking-wider">Stock Total Calculado</span>
            <span class="text-sm font-mono font-bold text-blue-900">{{ calculatedStockTotal }}</span>
            <span class="text-[10px] text-blue-600">
              {{ wholesaleEnabled ? 'uds' : (form.measurement_type === 'PESO' ? 'Kg' : form.measurement_type === 'LIQUIDO' ? 'L' : 'uds') }}
            </span>
            <button v-if="isEditing" @click="onRegisterReStock" type="button"
              class="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors">
              <span>➕</span> Registrar Re-compra / Entrada
            </button>
          </div>
        </div>

        <!-- ── Costos y Flete Mayorista ── -->
        <div class="bg-white border border-slate-200 shadow-sm rounded-xl p-4 space-y-3">
          <span class="text-xs font-semibold text-slate-600 uppercase tracking-wider">Costos y Flete Mayorista</span>

          <!-- Invoice currency toggle -->
          <div class="flex items-center gap-3">
            <span class="text-[10px] font-semibold text-slate-500 uppercase">Factura en:</span>
            <button @click="toggleCurrency"
              type="button"
              class="relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors"
              :class="selectedInvoiceCurrency === 'USD' ? 'bg-emerald-500' : 'bg-amber-500'">
              <span class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition-transform"
                :class="selectedInvoiceCurrency === 'USD' ? 'translate-x-5' : 'translate-x-0'" />
            </button>
            <span class="text-xs font-semibold" :class="selectedInvoiceCurrency === 'USD' ? 'text-emerald-700' : 'text-amber-700'">
              {{ selectedInvoiceCurrency === 'USD' ? 'USD' : 'VES' }}
            </span>
          </div>

          <!-- Cost per container + flete -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Costo del {{ containerLabel }} ({{ selectedInvoiceCurrency }})
              </label>
              <input v-model.number="UIFields.costo_ingresado_usuario" type="number" min="0" step="0.01" placeholder="0.00"
                class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Flete / Importación ({{ selectedInvoiceCurrency }})
              </label>
              <input v-model.number="UIFields.flete_ingresado_usuario" type="number" min="0" step="0.01" placeholder="0.00"
                class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>

          <!-- DekaRate (VES mode) -->
          <div v-if="selectedInvoiceCurrency === 'VES'" class="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <label class="block text-[10px] font-semibold text-amber-700 uppercase tracking-wider mb-1">
              Tasa de Cambio de la Factura (Bs. por USD)
            </label>
            <input v-model.number="dekaRate" type="number" min="0" step="0.01" :placeholder="rateValue > 0 ? String(rateValue) : '0.00'"
              class="w-full h-9 px-3 text-sm border border-amber-300 bg-white text-slate-800 rounded-lg focus:outline-none focus:ring-amber-500/20 focus:border-amber-400" />
            <p v-if="dekaRate > 0 && UIFields.costo_ingresado_usuario > 0" class="text-[10px] text-amber-600 mt-1">
              Costo en USD: <strong>${{ fmt(finalCostoBultoUSD) }}</strong>
              <span v-if="UIFields.flete_ingresado_usuario > 0"> · Flete: <strong>${{ fmt(finalFleteUSD) }}</strong></span>
            </p>
          </div>

          <!-- Costo unitario calculado -->
          <div v-if="finalCostoBultoUSD > 0" class="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-semibold text-blue-700 uppercase tracking-wider">Costo Unitario Real</span>
              <span class="text-sm font-mono font-bold text-blue-900">$ {{ fmt(bulkUnitCost) }}</span>
            </div>
            <p class="text-[10px] text-blue-600 mt-0.5">
              ({{ wholesaleEnabled ? effectiveContainersForm : form.cantidad_contenedores }} × ${{ fmt(finalCostoBultoUSD) }}
              <template v-if="finalFleteUSD > 0"> + ${{ fmt(finalFleteUSD) }} flete</template>)
              / {{ calculatedStockTotal }}
              {{ form.measurement_type === 'PESO' ? 'Kg' : form.measurement_type === 'LIQUIDO' ? 'L' : 'uds' }}
              = <strong>${{ fmt(bulkUnitCost) }}</strong>
            </p>
            <div v-if="rateValue > 0 && bulkUnitCost > 0" class="mt-1.5 pt-1.5 border-t border-blue-200">
              <span class="text-[10px] text-blue-600">Equivalente en VES (BCV):</span>
              <span class="text-sm font-mono font-bold text-blue-900 ml-2">
                {{ fmtVES(calcVES(bulkUnitCost, rateValue)) }}
              </span>
            </div>
          </div>
        </div>

        <!-- ── Costo y Margen ── -->
        <div class="bg-white border border-slate-200 shadow-sm rounded-xl p-4 space-y-3">
          <span class="text-xs font-semibold text-slate-600 uppercase tracking-wider">Costo y Margen</span>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Costo USD</label>
              <input v-model.number="form.cost_price_usd" type="number" min="0" step="0.0001"
                class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Costo VES</label>
              <input v-model.number="form.cost_price_ves" type="number" min="0" step="0.01"
                @focus="costVesUserEdited = true" @input="costVesUserEdited = true"
                class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>

          <div class="border-t border-slate-100 pt-3">
            <div class="flex items-center gap-2 mb-3">
              <span class="text-xs font-semibold text-slate-700 uppercase tracking-wide">Margen de Ganancia</span>
              <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">EDUCATIVO</span>
            </div>

            <div class="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-3">
              <div class="grid grid-cols-2 gap-2">
                <button type="button" @click="form.margin_type = 'TRADITIONAL'"
                  class="relative flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-medium transition-all"
                  :class="form.margin_type === 'TRADITIONAL'
                    ? 'bg-white border-2 border-blue-500 shadow-sm text-blue-700'
                    : 'bg-transparent border-2 border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/60'">
                  <span class="text-sm font-bold">Tradicional</span>
                  <span class="text-[10px] opacity-80">Suma simple</span>
                </button>
                <button type="button" @click="form.margin_type = 'FINANCIAL'"
                  class="relative flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-medium transition-all"
                  :class="form.margin_type === 'FINANCIAL'
                    ? 'bg-white border-2 border-emerald-500 shadow-sm text-emerald-700'
                    : 'bg-transparent border-2 border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/60'">
                  <span class="text-sm font-bold">Financiero</span>
                  <span class="text-[10px] opacity-80">Protección de margen</span>
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1.5">Margen (%)</label>
                <div class="relative">
                  <input v-model.number="form.profit_margin" type="number" min="0" max="100" step="0.5" placeholder="30"
                    class="w-full h-10 pr-8 pl-3.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
                  <span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">%</span>
                </div>
              </div>
              <div class="flex items-end pb-1" v-if="form.cost_price_usd > 0 && form.profit_margin > 0">
                <div class="w-full rounded-lg bg-white border border-slate-200 px-3.5 py-2">
                  <p class="text-[10px] text-slate-400 uppercase tracking-wide mb-2">Precios Sugeridos</p>
                  <div class="space-y-1.5">
                    <div class="flex items-center justify-between">
                      <span class="text-[11px] font-semibold text-amber-700">Tradicional <span class="text-[9px] font-normal text-amber-500">(suma)</span></span>
                      <span class="text-sm font-bold text-slate-800">${{ fmt(calcTraditionalPrice(form.cost_price_usd, form.profit_margin)) }}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-[11px] font-semibold text-emerald-700">Financiero <span class="text-[9px] font-normal text-emerald-500">(protección)</span></span>
                      <span class="text-sm font-bold text-slate-800">${{ fmt(calcFinancialPrice(form.cost_price_usd, form.profit_margin)) }}</span>
                    </div>
                  </div>
                  <div v-if="rateValue > 0" class="mt-1.5 pt-1.5 border-t border-slate-100 flex justify-between text-[10px] text-slate-500">
                    <span>BCV: {{ fmtVES(rateValue) }}</span>
                    <span class="font-medium text-slate-700">Bs. {{ fmtVES(calcVES(calcFinancialPrice(form.cost_price_usd, form.profit_margin), rateValue)) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="form.cost_price_usd > 0 && form.profit_margin > 0"
              class="mt-3 rounded-xl border p-4 text-xs leading-relaxed"
              :class="form.margin_type === 'FINANCIAL'
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
                : 'bg-amber-50/60 border-amber-200 text-amber-800'">
              <div class="flex items-start gap-2.5">
                <span class="mt-0.5 text-sm">{{ form.margin_type === 'FINANCIAL' ? '🛡️' : '⚠️' }}</span>
                <div class="space-y-1.5">
                  <p class="text-xs font-semibold">
                    {{ form.margin_type === 'FINANCIAL'
                      ? 'Margen sobre Precio de Venta (Protección financiera)'
                      : 'Margen sobre Costo (Suma simple tradicional)' }}
                  </p>
                  <p class="text-[11px] opacity-90 font-mono">
                    {{ form.margin_type === 'FINANCIAL'
                      ? `Precio = $${form.cost_price_usd} ÷ (1 − ${form.profit_margin}%) = $${suggestedPrice}`
                      : `Precio = $${form.cost_price_usd} × (1 + ${form.profit_margin}%) = $${suggestedPrice}` }}
                  </p>
                </div>
              </div>
              <div class="mt-3 flex flex-col sm:flex-row gap-2">
                <div class="flex-1 rounded-lg bg-white/70 border border-amber-200 px-3 py-2">
                  <p class="text-[10px] font-semibold text-amber-700 uppercase">Tradicional</p>
                  <p class="text-sm font-bold text-slate-800">${{ computePrice('TRADITIONAL') }}</p>
                  <p class="text-[10px] text-slate-500">Con desc. 20%: ${{ applyDiscount('TRADITIONAL') }}</p>
                </div>
                <div class="flex-1 rounded-lg bg-white/70 border border-emerald-200 px-3 py-2">
                  <p class="text-[10px] font-semibold text-emerald-700 uppercase">Financiero</p>
                  <p class="text-sm font-bold text-slate-800">${{ computePrice('FINANCIAL') }}</p>
                  <p class="text-[10px] text-slate-500">Con desc. 20%: ${{ applyDiscount('FINANCIAL') }}</p>
                </div>
              </div>
              <div class="mt-2.5 text-[11px] leading-relaxed"
                :class="form.margin_type === 'FINANCIAL' ? 'text-emerald-700' : 'text-amber-700'">
                <template v-if="form.margin_type === 'FINANCIAL'">
                  Con el método <strong>Financiero</strong>, si aplicas un 20% de descuento
                  sobre el precio de ${{ computePrice('FINANCIAL') }}, recibes
                  <strong>${{ applyDiscount('FINANCIAL') }}</strong> — justo tu costo de
                  ${{ form.cost_price_usd }}. No pierdes dinero.
                </template>
                <template v-else>
                  Con el método <strong>Tradicional</strong>, si aplicas un 20% de descuento,
                  estarías vendiendo a <strong>${{ applyDiscount('TRADITIONAL') }}</strong>
                  <template v-if="Number(applyDiscount('TRADITIONAL')) < Number(form.cost_price_usd)">
                    — <span class="text-red-600 font-semibold">por debajo de tu costo.</span>
                  </template>
                </template>
              </div>
            </div>
            <div v-else class="mt-3 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
              <p class="text-[11px] text-slate-400">
                💡 Define un <strong>costo unitario</strong> y un <strong>margen</strong>
                para ver el precio sugerido y la comparación entre métodos.
              </p>
            </div>
          </div>

          <!-- IVA -->
          <div class="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label class="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Tipo de IVA</label>
              <select v-model="form.iva_type"
                class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                <option value="GENERAL">IVA General 16%</option>
                <option value="REDUCED">IVA Reducido 8%</option>
                <option value="AMPLIADO">IVA Ampliado 22%</option>
                <option value="EXENTO">Exento</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Tipo de Inventario</label>
              <select v-model="form.inventory_type"
                class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                <option value="SIMPLE">Simple</option>
                <option value="COMPOUND">Compuesto</option>
                <option value="KARDEX">Kardex</option>
                <option value="NONE">Sin Stock</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3 pt-1">
        <button @click="handleCancel" type="button"
          class="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-300 hover:bg-slate-50 transition-colors">
          Cancelar
        </button>
        <button @click="handleSave" :disabled="!isValid || saving"
          class="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm inline-flex items-center gap-2">
          <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
          <Save v-else class="w-4 h-4" />
          {{ isEditing ? 'Guardar Cambios' : 'Crear Producto' }}
        </button>
      </div>
    </template>
  </div>

  <!-- Stock Adjustment Modal -->
  <Teleport to="body">
    <div v-if="showStockModal" class="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showStockModal = false" />
      <div class="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between">
          <h3 class="text-base font-semibold text-slate-900">Registrar Re-compra / Entrada</h3>
          <button @click="showStockModal = false" type="button" class="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">Tipo de Ajuste / Motivo <span class="text-red-400">*</span></label>
            <select v-model="stockForm.motivo"
              class="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              :class="{'border-red-400 bg-red-50': stockErrors.motivo}">
              <option value="">Seleccionar...</option>
              <option value="RE_COMPRA">Re-compra (Entrada por Factura)</option>
              <option value="CORRECCION">Corrección por error de registro inicial</option>
              <option value="AJUSTE_FISICO">Ajuste de inventario físico (Faltante/Sobrante)</option>
            </select>
            <p v-if="stockErrors.motivo" class="text-[11px] text-red-500 mt-1">{{ stockErrors.motivo }}</p>
          </div>

          <!-- Wholesale Mode Toggle -->
          <div class="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
            <div>
              <p class="text-sm font-medium text-slate-700">Activar Flujo Mayorista</p>
              <p class="text-xs text-slate-500">Cálculos a gran escala con alta precisión decimal</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input v-model="stockForm.wholesale" type="checkbox" class="sr-only peer" />
              <div class="w-10 h-5 bg-slate-300 rounded-full peer peer-checked:bg-indigo-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
            </label>
          </div>

          <!-- Wholesale Critical Warning -->
          <div v-if="stockForm.wholesale"
            class="border-l-4 border-red-600 bg-red-50 text-red-800 p-4 text-xs leading-relaxed rounded-r-lg">
            <p class="font-bold mb-1">⚠️ ADVERTENCIA: Modo Mayorista</p>
            <p>Este modo está diseñado exclusivamente para Distribución a Gran Escala y Mayoristas. NO SE RECOMIENDA su uso para comercios al detal (Bodegas), ya que calcula márgenes de ganancia mínimos (volumen masivo) y cambiar las unidades primarias afectaría drásticamente la rentabilidad del negocio tradicional.</p>
          </div>

          <!-- Wholesale Unit Type Select -->
          <div v-if="isWholesale">
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">Unidad de Carga Mayorista <span class="text-red-400">*</span></label>
            <select v-model="stockForm.wholesaleUnit"
              class="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
              <option v-for="u in WHOLESALE_UNITS" :key="u.value" :value="u.value">{{ u.label }} — {{ u.desc }}</option>
            </select>
            <p v-if="isWholesale" class="text-[11px] text-slate-400 mt-1">
              1 {{ wholesaleConfig.label.split(' /')[0] }} = {{ wholesaleConfig.multiplier }} {{ wholesaleConfig.subLabel.split(' por')[0].toLowerCase() }}
            </p>
          </div>

          <!-- Container / Quantity fields -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1.5">{{ isWholesale ? 'Cantidad de ' + wholesaleConfig.label.split(' /')[0] : containerLabel }} <span class="text-red-400">*</span></label>
              <input v-model.number="stockForm.cantidad_contenedores" type="number" min="1" step="1"
                :placeholder="isWholesale ? 'Ej: 10' : '1'"
                class="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                :class="{'border-red-400 bg-red-50': stockErrors.cantidad_contenedores}" />
              <p v-if="stockErrors.cantidad_contenedores" class="text-[11px] text-red-500 mt-1">{{ stockErrors.cantidad_contenedores }}</p>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1.5">{{ isWholesale ? wholesaleConfig.subLabel : capacityLabel }} <span class="text-red-400">*</span></label>
              <input v-model.number="stockForm.unidades_por_bulto" type="number" min="1" step="1"
                :placeholder="isWholesale ? 'Ej: 24' : '1'"
                class="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                :class="{'border-red-400 bg-red-50': stockErrors.unidades_por_bulto}" />
              <p v-if="stockErrors.unidades_por_bulto" class="text-[11px] text-red-500 mt-1">{{ stockErrors.unidades_por_bulto }}</p>
            </div>
          </div>

          <!-- Wholesale multiplier breakdown -->
          <div v-if="isWholesale" class="bg-indigo-50 rounded-xl px-4 py-2.5 text-xs text-indigo-700 leading-relaxed">
            🧮 <strong>{{ stockForm.cantidad_contenedores || 0 }} {{ wholesaleConfig.label.split(' /')[0].toLowerCase() }}</strong>
            × {{ wholesaleConfig.multiplier }} {{ wholesaleConfig.subLabel.split(' por')[0].toLowerCase() }}/unidad
            = <strong>{{ effectiveContainers }} {{ wholesaleConfig.subLabel.split(' por')[0].toLowerCase() }}s</strong>
            → {{ newStockUnits }} {{ form.measurement_type === 'PESO' ? 'Kg' : form.measurement_type === 'LIQUIDO' ? 'L' : 'uds' }} finales
          </div>

          <div class="bg-slate-50 rounded-xl px-4 py-3 text-sm">
            <span class="text-slate-500">Nuevo stock calculado:</span>
            <span class="ml-2 font-bold text-blue-700">{{ newStockUnits }}</span>
            <span class="text-slate-500 ml-1">{{ form.measurement_type === 'PESO' ? 'Kg' : form.measurement_type === 'LIQUIDO' ? 'L' : 'uds' }}</span>
          </div>

          <!-- Re-compra: Cost / Freight + Simulation Card + Price Update (only for RE_COMPRA) -->
          <template v-if="isRecompra">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1.5">Costo del bulto (USD)</label>
                <input v-model.number="stockForm.costo_bulto" type="number" min="0" :step="isWholesale ? '0.000001' : '0.01'" :placeholder="isWholesale ? '0.000000' : '0.00'"
                  class="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1.5">Flete (USD)</label>
                <input v-model.number="stockForm.flete" type="number" min="0" :step="isWholesale ? '0.000001' : '0.01'" :placeholder="isWholesale ? '0.000000' : '0.00'"
                  class="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>

            <!-- Cost Simulation Card -->
            <div class="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 space-y-3">
              <h4 class="text-xs font-semibold text-blue-800 uppercase tracking-wider">Simulación de Costo</h4>

              <!-- Editable margin -->
              <div class="flex items-center gap-3">
                <label class="text-xs font-semibold text-slate-600 whitespace-nowrap">Margen de Ganancia (%)</label>
                <input v-model.number="stockForm.stockMargin" type="number" min="0" max="100" step="0.5"
                  class="w-24 h-8 px-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-center" />
              </div>

              <div class="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                <span class="text-slate-500">Costo unitario entrada:</span>
                <span class="font-semibold text-slate-800 text-right">${{ costoUnitarioEntrada.toFixed(isWholesale ? 6 : 2) }}</span>
                <span class="text-slate-500">Costo actual promedio:</span>
                <span class="font-semibold text-slate-800 text-right">${{ currentUnitCost.toFixed(isWholesale ? 6 : 2) }}</span>
                <span class="text-slate-500 border-t border-blue-200 pt-1.5">Costo promedio ponderado:</span>
                <span class="font-bold text-blue-700 text-right border-t border-blue-200 pt-1.5">${{ costoPromedioPonderado.toFixed(isWholesale ? 6 : 4) }}</span>
              </div>

              <div v-if="costoPromedioPonderado > 0" class="pt-2 border-t border-blue-200 space-y-1.5">
                <p class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Precios Sugeridos</p>
                <div class="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm">
                  <span class="text-slate-500">Tradicional ({{ stockForm.stockMargin }}%):</span>
                  <span class="font-semibold text-emerald-700 text-right">${{ suggestedTraditional.toFixed(isWholesale ? 6 : 2) }}
                    <span v-if="suggestedTraditionalVES > 0" class="text-emerald-600 text-[11px] font-normal"> / {{ fmtVES(suggestedTraditionalVES) }}</span>
                  </span>
                  <span class="text-slate-500">Financiero ({{ stockForm.stockMargin }}%):</span>
                  <span class="font-semibold text-emerald-700 text-right">${{ suggestedFinancial.toFixed(isWholesale ? 6 : 2) }}
                    <span v-if="suggestedFinancialVES > 0" class="text-emerald-600 text-[11px] font-normal"> / {{ fmtVES(suggestedFinancialVES) }}</span>
                  </span>
                </div>
              </div>
            </div>

            <!-- Auto-update price toggle -->
            <div class="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <div>
                <p class="text-sm font-medium text-amber-900">Actualizar precio de venta</p>
                <p class="text-xs text-amber-700">Reemplazar precio USD actual con el sugerido (financiero)</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input v-model="stockForm.updatePrice" type="checkbox" class="sr-only peer" />
                <div class="w-10 h-5 bg-slate-300 rounded-full peer peer-checked:bg-amber-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
              </label>
            </div>
          </template>

          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">Observación <span class="text-red-400">*</span></label>
            <textarea v-model="stockForm.observacion" rows="3" placeholder="Detalla la justificación del movimiento (mín. 10 caracteres)"
              class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              :class="{'border-red-400 bg-red-50': stockErrors.observacion}" />
            <p v-if="stockErrors.observacion" class="text-[11px] text-red-500 mt-1">{{ stockErrors.observacion }}</p>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t border-slate-200">
          <button @click="showStockModal = false" type="button"
            class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            Cancelar
          </button>
          <button @click="submitStockAdjustment" :disabled="submittingStock"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-colors shadow-sm">
            <Loader2 v-if="submittingStock" class="w-4 h-4 animate-spin" />
            <span v-else>➕</span>
            Registrar Entrada
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Save, Loader2, Lock, Package, X } from 'lucide-vue-next';
import { useApi } from '@/composables/useApi';
import { usePermissions } from '@/composables/usePermissions';
import { useForexRate } from '@/composables/useForexRate';
import { useNotify } from '@/composables/useNotify';
import {
  calcNewStockUnits,
  calcEntryUnitCost,
  calcWeightedAverageCost,
  calcTraditionalPrice,
  calcFinancialPrice,
  calcVES,
  calcEffectiveContainers,
} from '@/composables/stockCalculations';

const route = useRoute();
const router = useRouter();
const { fetchApi } = useApi();
const { isStaff: isStaffFromStore } = usePermissions();
const { rateValue, fetchForexRate } = useForexRate();
const { success: notifySuccess, error: notifyError } = useNotify();

const props = defineProps<{
  initialData?: Record<string, any> | null;
  brands?: { id: number | string; name: string }[];
  isStaff?: boolean;
}>();

const isEditing = computed(() => !!props.initialData || !!route.params.id);
const saving = ref(false);
const loadingEdit = ref(false);
const activeTab = ref<'general' | 'prices'>('general');
const isStaff = computed(() => props.isStaff ?? isStaffFromStore.value);
let productId: string | null = null;

const tabs = [
  { key: 'general' as const, label: 'Datos Generales' },
  { key: 'prices' as const, label: 'Precios y Logística' },
];

// ── Measurement options ──
const measureOptions = [
  { value: 'UNIDAD', label: 'UNIDAD' },
  { value: 'PESO', label: 'PESO' },
  { value: 'LIQUIDO', label: 'LÍQUIDO' },
];
const weightOptions = [
  { value: 'SACO', label: 'Saco' },
  { value: 'CESTA', label: 'Cesta' },
  { value: 'KG_DIRECTO', label: 'Kilo directo' },
];
const liquidOptions = [
  { value: 'BIDON', label: 'Bidón' },
  { value: 'TAMBOR', label: 'Tambor' },
];

// ── Cost UI state (separate from form to avoid polluting with unconverted VES) ──
const UIFields = reactive({
  costo_ingresado_usuario: 0,
  flete_ingresado_usuario: 0,
});
const selectedInvoiceCurrency = ref<'USD' | 'VES'>('USD');
const dekaRate = ref(0);
const costVesUserEdited = ref(false);

// ── Main form wholesale mode ──

const wholesaleEnabled = ref(false);
const selectedWholesaleUnit = ref('BULTO');

const wholesaleMainConfig = computed(() =>
  WHOLESALE_UNITS.find(u => u.value === selectedWholesaleUnit.value) ?? WHOLESALE_UNITS[1],
);

const effectiveContainersForm = computed(() => {
  return calcEffectiveContainers(
    form.cantidad_contenedores || 0,
    wholesaleMainConfig.value.multiplier,
    wholesaleEnabled.value,
  );
});

// ── Stock Adjustment Modal ──

const showStockModal = ref(false);
const submittingStock = ref(false);

const WHOLESALE_UNITS = [
  { value: 'PALLET',     label: 'Paleta / Pallet',            subLabel: 'Bultos por Paleta',         multiplier: 50,  desc: 'Carga unificada' },
  { value: 'BULTO',      label: 'Bulto / Pack Mayorista',     subLabel: 'Unidades por Bulto',        multiplier: 1,   desc: 'Empaque secundario' },
  { value: 'TAMBOR',     label: 'Tambor / Cilindro',          subLabel: 'Litros por Tambor',         multiplier: 200, desc: 'Estándar 200L / Líquidos masivos' },
  { value: 'CONTENEDOR', label: 'Contenedor / TEU',           subLabel: 'Bultos por Contenedor',     multiplier: 1000, desc: 'Importaciones masivas' },
  { value: 'TONELADA',   label: 'Tonelada Métrica',           subLabel: 'Kg por Tonelada',           multiplier: 1000, desc: 'Granel sólido' },
  { value: 'IBC',        label: 'Tanque / Cúbico IBC',        subLabel: 'Litros por IBC',            multiplier: 1000, desc: 'Estándar 1000L' },
];

const stockForm = reactive({
  motivo: '',
  cantidad_contenedores: 1,
  unidades_por_bulto: 1,
  costo_bulto: 0,
  flete: 0,
  observacion: '',
  updatePrice: false,
  stockMargin: 30,
  wholesale: false,
  wholesaleUnit: 'BULTO',
});

const stockErrors = reactive({
  motivo: '',
  cantidad_contenedores: '',
  unidades_por_bulto: '',
  observacion: '',
});

const isRecompra = computed(() => stockForm.motivo === 'RE_COMPRA');
const isWholesale = computed(() => stockForm.wholesale);

const wholesaleConfig = computed(() =>
  WHOLESALE_UNITS.find(u => u.value === stockForm.wholesaleUnit) ?? WHOLESALE_UNITS[1],
);

const effectiveContainers = computed(() => {
  const containers = stockForm.cantidad_contenedores || 0;
  return isWholesale.value
    ? containers * (wholesaleConfig.value.multiplier || 1)
    : containers;
});

const newStockUnits = computed(() =>
  calcNewStockUnits(effectiveContainers.value, stockForm.unidades_por_bulto),
);

const costoUnitarioEntrada = computed(() => {
  if (!isRecompra.value) return 0;
  return calcEntryUnitCost(stockForm.costo_bulto, stockForm.flete, stockForm.unidades_por_bulto);
});

const costoPromedioPonderado = computed(() => {
  if (!isRecompra.value) return currentUnitCost.value;
  return calcWeightedAverageCost(
    currentStock.value, currentUnitCost.value,
    newStockUnits.value, costoUnitarioEntrada.value,
  );
});

const suggestedTraditional = computed(() =>
  calcTraditionalPrice(costoPromedioPonderado.value, stockForm.stockMargin),
);

const suggestedFinancial = computed(() =>
  calcFinancialPrice(costoPromedioPonderado.value, stockForm.stockMargin),
);

const suggestedTraditionalVES = computed(() =>
  calcVES(suggestedTraditional.value, rateValue.value),
);

const suggestedFinancialVES = computed(() =>
  calcVES(suggestedFinancial.value, rateValue.value),
);

function openStockModal() {
  stockForm.motivo = '';
  stockForm.cantidad_contenedores = 1;
  stockForm.unidades_por_bulto = form.capacidad_por_contenedor || 1;
  stockForm.costo_bulto = 0;
  stockForm.flete = 0;
  stockForm.observacion = '';
  stockForm.updatePrice = false;
  stockForm.stockMargin = form.profit_margin || 30;
  stockForm.wholesale = form.sale_type !== 'UNIDAD';
  stockForm.wholesaleUnit = 'BULTO';
  stockErrors.motivo = '';
  stockErrors.cantidad_contenedores = '';
  stockErrors.unidades_por_bulto = '';
  stockErrors.observacion = '';
  showStockModal.value = true;
}

async function submitStockAdjustment() {
  let ok = true;
  stockErrors.motivo = '';
  stockErrors.cantidad_contenedores = '';
  stockErrors.unidades_por_bulto = '';
  stockErrors.observacion = '';

  if (!stockForm.motivo) { stockErrors.motivo = 'Selecciona un motivo.'; ok = false; }
  if (!stockForm.cantidad_contenedores || stockForm.cantidad_contenedores < 1) { stockErrors.cantidad_contenedores = 'Debe ser 1 o más.'; ok = false; }
  if (!stockForm.unidades_por_bulto || stockForm.unidades_por_bulto < 1) { stockErrors.unidades_por_bulto = 'Debe ser 1 o más.'; ok = false; }
  if (!stockForm.observacion || stockForm.observacion.trim().length < 10) { stockErrors.observacion = 'Debe tener al menos 10 caracteres.'; ok = false; }
  if (!ok) return;

  submittingStock.value = true;
  try {
    await fetchApi(`/api/v1/products/${productId}/adjust-stock/`, {
      method: 'POST',
      data: JSON.stringify({
        motivo: stockForm.motivo,
        cantidad_contenedores: stockForm.cantidad_contenedores,
        unidades_por_bulto: stockForm.unidades_por_bulto,
        costo_bulto: stockForm.costo_bulto || 0,
        flete: stockForm.flete || 0,
        observacion: stockForm.observacion.trim(),
        update_price: stockForm.updatePrice,
        profit_margin: bcvRound(stockForm.stockMargin, 2),
        wholesale: stockForm.wholesale,
        wholesale_unit: stockForm.wholesaleUnit,
        wholesale_multiplier: wholesaleConfig.value.multiplier,
      }),
    });
    notifySuccess('Entrada de stock registrada exitosamente');
    showStockModal.value = false;
    if (productId) {
      const res = await fetchApi<any>(`/api/v1/products/${productId}/`);
      if (res) applyInitialData(res);
    }
  } catch (e: any) {
    const drfData = e.data;
    if (drfData && typeof drfData === 'object') {
      const msg = Object.entries(drfData)
        .map(([, msgs]) => Array.isArray(msgs) ? msgs[0] : msgs)
        .filter(Boolean)
        .join('. ');
      if (msg) { notifyError(msg); return; }
    }
    notifyError(e?.message || 'Error al registrar entrada de stock');
  } finally {
    submittingStock.value = false;
  }
}

// ── Form ──

const form = reactive({
  name: '',
  sku: '',
  barcode: null as string | null,
  brand_id: null as number | string | null,
  category: '',
  description: '',
  is_active: true,
  measurement_type: 'UNIDAD',
  container_type: 'CAJA',
  weight_container: 'SACO',
  liquid_container: 'BIDON',
  cantidad_contenedores: 1,
  capacidad_por_contenedor: 1,
  cost_price_usd: 0,
  cost_price_ves: 0,
  profit_margin: 30,
  margin_type: 'FINANCIAL',
  price_usd: 0,
  price_ves: 0,
  iva_type: 'GENERAL',
  inventory_type: 'SIMPLE',
  sale_type: 'UNIDAD',
  units_per_package: 1,
  initial_physical_stock: 0,
  initial_cost_price: 0,
  image: '',
});

const currentStock = ref(0);
const currentUnitCost = ref(0);

const imageError = ref(false);

const errors = reactive({ name: '', sku: '' });

function toggleCurrency() {
  selectedInvoiceCurrency.value = selectedInvoiceCurrency.value === 'USD' ? 'VES' : 'USD';
}

watch(selectedInvoiceCurrency, (cur) => {
  if (cur === 'VES' && dekaRate.value === 0 && rateValue.value > 0) {
    dekaRate.value = rateValue.value;
  }
});

function selectMeasurement(val: string) {
  form.measurement_type = val;
  form.cantidad_contenedores = 1;
  form.capacidad_por_contenedor = 1;
  wholesaleEnabled.value = false;
  if (val === 'PESO') {
    form.weight_container = 'SACO';
    form.container_type = 'SACO';
  } else if (val === 'LIQUIDO') {
    form.liquid_container = 'BIDON';
    form.container_type = 'BIDON';
  } else {
    form.container_type = 'CAJA';
  }
}

const containerLabel = computed(() => {
  if (wholesaleEnabled.value) return wholesaleMainConfig.value.label.split(' /')[0];
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
  return 'Caja';
});

const capacityLabel = computed(() => {
  if (wholesaleEnabled.value) return wholesaleMainConfig.value.subLabel;
  if (form.measurement_type === 'PESO') {
    if (form.weight_container === 'KG_DIRECTO') return 'Kg por unidad';
    return 'Unidades por ' + containerLabel.value;
  }
  if (form.measurement_type === 'LIQUIDO') {
    return 'Litros por ' + containerLabel.value;
  }
  return 'Unidades por ' + containerLabel.value;
});

// ── Cost computations ──

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

const bulkUnitCost = computed(() => {
  const totalCosto = effectiveContainersForm.value * finalCostoBultoUSD.value;
  const inversionTotal = totalCosto + finalFleteUSD.value;
  const stockTotal = calculatedStockTotal.value;
  if (stockTotal <= 0) return 0;
  return bcvRound(inversionTotal / stockTotal, 4);
});

const calculatedStockTotal = computed(() => {
  return effectiveContainersForm.value * form.capacidad_por_contenedor;
});

watch([finalCostoBultoUSD, finalFleteUSD], () => {
  const unit = bulkUnitCost.value;
  if (unit > 0) {
    form.cost_price_usd = unit;
    if (!costVesUserEdited.value && rateValue.value > 0) {
      form.cost_price_ves = bcvRound(unit * rateValue.value, 2);
    }
  }
});

watch(calculatedStockTotal, (val) => {
  form.initial_physical_stock = val;
});

watch(wholesaleEnabled, () => {
  form.cantidad_contenedores = 1;
  form.capacidad_por_contenedor = 1;
});

function bcvRound(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor + (value >= 0 ? 0.0001 : -0.0001)) / factor;
}

function fmt(val: number): string {
  return val.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

function fmtVES(val: number): string {
  return 'Bs. ' + val.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const isValid = computed(() => form.name.trim().length > 0 && form.sku.trim().length > 0);

// ── Margin helpers ──

function computePrice(marginType: 'TRADITIONAL' | 'FINANCIAL'): string {
  const cost = Number(form.cost_price_usd);
  const margin = Number(form.profit_margin);
  if (!cost || !margin) return '0.00';
  const raw = marginType === 'FINANCIAL'
    ? calcFinancialPrice(cost, margin)
    : calcTraditionalPrice(cost, margin);
  return raw.toFixed(2);
}

function applyDiscount(marginType: 'TRADITIONAL' | 'FINANCIAL'): string {
  const full = Number(computePrice(marginType));
  if (!full) return '0.00';
  return (full * 0.8).toFixed(2);
}

const suggestedPrice = computed(() => computePrice(form.margin_type as 'TRADITIONAL' | 'FINANCIAL'));

// ── API field mapping ──

function applyInitialData(data: Record<string, any>) {
  form.name = data.name ?? '';
  form.sku = data.sku ?? '';
  form.barcode = data.barcode ?? null;
  form.brand_id = data.marca_id ?? data.brand ?? null;
  form.category = data.category ?? '';
  form.description = data.description ?? '';
  form.price_usd = parseFloat(data.base_price_usd ?? data.price_data?.current_prices?.usd ?? 0);
  form.price_ves = parseFloat(data.base_price_ves ?? data.price_data?.current_prices?.ves ?? 0);
  form.cost_price_usd = parseFloat(data.cost_price_usd ?? 0);
  form.cost_price_ves = parseFloat(data.cost_price_ves ?? 0);
  form.profit_margin = parseFloat(data.porcentaje_ganancia ?? 30);
  form.iva_type = data.tax_type ?? 'GENERAL';
  form.inventory_type = data.inventory_type ?? 'SIMPLE';
  form.sale_type = data.sale_type ?? 'UNIDAD';
  form.measurement_type = data.sale_type === 'PESO' ? 'PESO' : data.sale_type === 'LIQUIDO' ? 'LIQUIDO' : 'UNIDAD';
  form.units_per_package = data.unidades_por_paquete ?? 1;
  form.cantidad_contenedores = data.cantidad_contenedores ?? 1;
  form.capacidad_por_contenedor = data.unidades_por_bulto ?? data.capacidad_por_contenedor ?? 1;
  form.is_active = (data.current_stock ?? 0) > 0;
  currentStock.value = parseFloat(data.current_stock ?? data.base_unit_stock ?? 0);
  currentUnitCost.value = parseFloat(data.cost_price_usd ?? data.costo_unitario ?? 0);
  form.image = data.image ?? data.image_url ?? '';
  imageError.value = false;
  // Rehydrate logistics UI
  if (data.costo_bulto) {
    UIFields.costo_ingresado_usuario = parseFloat(data.costo_bulto);
  }
  // Wholesale mode restoration
  const isWholesale = data.wholesale_enabled === true || data.sale_type === 'MAYORISTA';
  wholesaleEnabled.value = isWholesale;
  if (isWholesale && data.wholesale_unit) {
    selectedWholesaleUnit.value = data.wholesale_unit;
  }
}

// ── Save ──

async function handleSave() {
  if (!isValid.value || saving.value) return;
  saving.value = true;
  try {
    const payload: Record<string, any> = {
      name: form.name.trim(),
      sku: form.sku.trim().toUpperCase(),
      barcode: form.barcode?.trim() || null,
      marca_id: form.brand_id,
      category: form.category.trim().toUpperCase(),
      description: form.description.trim(),
      base_price_usd: bcvRound(form.price_usd, 2),
      base_price_ves: bcvRound(form.price_ves, 2),
      cost_price_usd: bcvRound(form.cost_price_usd, 4),
      porcentaje_ganancia: bcvRound(form.profit_margin, 2),
      margin_type: form.margin_type,
      tax_type: form.iva_type,
      inventory_type: form.inventory_type,
      sale_type: wholesaleEnabled.value ? 'MAYORISTA' : form.sale_type,
      unidades_por_paquete: form.units_per_package,
      cantidad_contenedores: form.cantidad_contenedores,
      capacidad_por_contenedor: form.capacidad_por_contenedor,
      costo_bulto: bcvRound(UIFields.costo_ingresado_usuario, 2),
      unidades_por_bulto: form.capacidad_por_contenedor,
      wholesale_enabled: wholesaleEnabled.value,
      wholesale_unit: wholesaleEnabled.value ? selectedWholesaleUnit.value : null,
      wholesale_multiplier: wholesaleEnabled.value ? wholesaleMainConfig.value.multiplier : null,
      image: form.image || undefined,
    };

    if (isEditing.value && productId) {
      await fetchApi(`/api/v1/products/${productId}/`, {
        method: 'PATCH',
        data: JSON.stringify(payload),
      });
      notifySuccess('Producto actualizado exitosamente');
      router.push('/admin/staff/products');
    } else {
      // New product via same component (non-drawer fallback)
      await fetchApi('/api/v1/products/', {
        method: 'POST',
        data: JSON.stringify(payload),
      });
      notifySuccess('Producto creado exitosamente');
      router.push('/admin/staff/products');
    }
  } catch (e: any) {
    const drfData = e.data;
    if (drfData && typeof drfData === 'object') {
      const msg = Object.entries(drfData)
        .map(([, msgs]) => Array.isArray(msgs) ? msgs[0] : msgs)
        .filter(Boolean)
        .join('. ');
      if (msg) { notifyError(msg); return; }
    }
    notifyError(e?.message || 'Error al guardar producto');
  } finally {
    saving.value = false;
  }
}

function handleCancel() {
  router.push('/admin/staff/products');
}

function onRegisterReStock() {
  openStockModal();
}

function resetForm() {
  form.name = ''; form.sku = ''; form.barcode = null; form.brand_id = null;
  form.category = ''; form.description = ''; form.is_active = true;
  form.measurement_type = 'UNIDAD'; form.container_type = 'CAJA';
  form.weight_container = 'SACO'; form.liquid_container = 'BIDON';
  form.cantidad_contenedores = 1; form.capacidad_por_contenedor = 1;
  form.cost_price_usd = 0; form.cost_price_ves = 0;
  form.profit_margin = 30; form.margin_type = 'FINANCIAL';
  form.price_usd = 0; form.price_ves = 0;
  form.iva_type = 'GENERAL'; form.inventory_type = 'SIMPLE';
  form.sale_type = 'UNIDAD'; form.units_per_package = 1;
  form.initial_physical_stock = 0; form.initial_cost_price = 0;
  errors.name = ''; errors.sku = '';
  UIFields.costo_ingresado_usuario = 0;
  UIFields.flete_ingresado_usuario = 0;
  dekaRate.value = 0;
  selectedInvoiceCurrency.value = 'USD';
  wholesaleEnabled.value = false;
  selectedWholesaleUnit.value = 'BULTO';
  costVesUserEdited.value = false;
  imageError.value = false;
  form.image = '';
  productId = null;
}

onMounted(async () => {
  if (props.initialData) {
    applyInitialData(props.initialData);
  } else if (route.params.id) {
    loadingEdit.value = true;
    try {
      productId = route.params.id as string;
      const res = await fetchApi<any>(`/api/v1/products/${productId}/`);
      if (res) applyInitialData(res);
    } catch {
      notifyError('Error al cargar el producto');
    } finally {
      loadingEdit.value = false;
    }
  }
  fetchForexRate();
});
</script>

<style scoped>
/* No additional styles needed — Tailwind handles everything */
</style>
