<template>
  <div class="fixed inset-0 z-50 bg-slate-50 flex flex-col overflow-hidden select-none">

    <!-- ═══════ HEADER ═══════ -->
    <header class="shrink-0 h-16 bg-gradient-to-r from-blue-700 via-blue-600 to-sky-400 text-white shadow-md border-b border-blue-800/20 flex items-center justify-between px-4 sm:px-6">
      <div class="flex items-center gap-3">
        <button @click="handleClose" class="w-9 h-9 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all">
          <X class="w-5 h-5" />
        </button>
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-lg overflow-hidden bg-white border-2 border-white/40 shadow-md flex items-center justify-center flex-shrink-0">
            <img v-if="tenantLogo" :src="tenantLogo" :alt="tenantCommercialName || 'Logo'" class="w-full h-full object-contain" />
            <img v-else src="/assets/efectivo360/logo-mark.svg" alt="Efectivo 360" class="w-7 h-7" />
          </div>
          <div class="hidden sm:flex flex-col leading-none">
            <span class="text-white font-bold text-sm truncate max-w-[140px]">{{ tenantCommercialName || 'Efectivo 360' }}</span>
            <span class="text-blue-200/70 text-[10px] font-semibold tracking-wide">PUNTO DE VENTA</span>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-1.5 text-xs font-bold text-white bg-white/15 backdrop-blur-md border border-white/25 px-3 py-1 rounded-xl shadow-sm">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          BCV: <span class="text-blue-50">Bs.{{ formatVES(tasaBCV) }}</span>
        </div>
        <div class="flex items-center rounded-full border border-white/25 bg-white/10 p-0.5 backdrop-blur-md shadow-sm" title="Moneda de visualización del POS">
          <button type="button" @click="posDisplayStore.setDisplayCurrency('USD')"
            class="px-2.5 py-1 text-[11px] font-bold rounded-full transition-colors"
            :class="posDisplayStore.displayCurrency === 'USD' ? 'bg-white text-blue-700 shadow-sm' : 'text-white/70 hover:text-white'">
            $ USD
          </button>
          <button type="button" @click="posDisplayStore.setDisplayCurrency('VES')"
            class="px-2.5 py-1 text-[11px] font-bold rounded-full transition-colors"
            :class="posDisplayStore.displayCurrency === 'VES' ? 'bg-white text-blue-700 shadow-sm' : 'text-white/70 hover:text-white'">
            Bs. VES
          </button>
        </div>
        <button v-if="parkedSales.length > 0" @click="showParkedSalesModal = true"
          class="flex items-center gap-1.5 text-xs font-bold text-amber-200 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 px-2.5 py-1 rounded-xl shadow-sm backdrop-blur-md transition-all whitespace-nowrap">
          <Clock class="w-3 h-3" />
          <span>{{ parkedSales.length }} Ventas Pausadas</span>
        </button>
        <div v-if="!esIlimitado"
          class="flex items-center gap-1.5 text-[10px] font-bold text-white/80 bg-white/10 backdrop-blur-md border border-white/20 px-2.5 py-1 rounded-xl shadow-sm whitespace-nowrap">
          <Ticket class="w-3 h-3 text-blue-300" />
          <span>{{ ticketsDisponibles.toLocaleString() }} ventas disponibles</span>
          <span v-if="sinVencimiento" class="text-[9px] text-white/50 font-normal">· Sin vencimiento</span>
        </div>
        <div v-else
          class="flex items-center gap-1.5 text-[10px] font-bold text-emerald-300 bg-emerald-500/15 backdrop-blur-md border border-emerald-400/25 px-2.5 py-1 rounded-xl shadow-sm whitespace-nowrap">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Full Ilimitado
        </div>
        <div class="flex items-center gap-1.5 text-[10px] font-bold text-white/80 bg-white/10 backdrop-blur-md border border-white/20 px-2.5 py-1 rounded-xl shadow-sm"
          :class="isOnline ? '' : '!bg-rose-500/20 !border-rose-400/40 !text-rose-200'">
          <Wifi v-if="isOnline" class="w-3 h-3 text-emerald-300" />
          <WifiOff v-else class="w-3 h-3 text-rose-300" />
          <span>{{ isOnline ? 'En línea' : 'Sin conexión' }}</span>
        </div>
        <div class="hidden sm:flex items-center gap-2 text-xs text-white/70 bg-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-sm">
          <div class="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>{{ cajaStore.turnoActivo?.terminal_name || 'Caja' }}</span>
          <span class="text-white/30 mx-0.5">|</span>
          <User class="w-3 h-3" />
          <span>{{ authStore.user?.full_name || authStore.user?.username || 'Usuario' }}</span>
        </div>
        <button @click="showPOSSettings = true" title="Ajustes del punto de venta"
          class="w-9 h-9 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all">
          <Settings2 class="w-4.5 h-4.5" />
        </button>
      </div>
    </header>

    <!-- ═══════ MOBILE TABS ═══════ -->
    <div class="shrink-0 flex sm:hidden bg-white border-b border-slate-200 px-2">
      <button v-for="tab in mobileTabs" :key="tab.key" @click="mobileTab = tab.key"
        class="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-all border-b-2"
        :class="mobileTab === tab.key ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent'">
        <component :is="tab.icon" class="w-4 h-4" />
        {{ tab.label }}
        <span v-if="tab.key === 'cart' && cartTotal > 0"
          class="ml-1 w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
          {{ cartTotal }}
        </span>
      </button>
    </div>

    <!-- ═══════ MAIN SPLIT ═══════ -->
    <div class="flex-1 flex overflow-hidden">

      <!-- ─── LEFT: White Column (Products + Cart items) ─── -->
      <main class="flex-1 bg-white flex flex-col overflow-hidden"
        :class="mobileTab !== 'products' && mobileTab !== 'cart' ? 'hidden sm:flex' : 'flex'">

        <!-- Search -->
        <div class="shrink-0 px-4 sm:px-6 pt-4 pb-3 border-b border-slate-200/80">
          <div class="relative max-w-lg">
            <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input ref="searchInputRef" v-model="searchQuery" type="text" placeholder="Buscar producto o escanear código de barras..."
              class="w-full h-10 pl-10 pr-20 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 shadow-sm transition-shadow"
              @keydown.enter="handleSearchEnter" />
            <div class="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button @click="toggleScanner"
                class="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                :class="scanning ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'"
                :title="scanning ? 'Detener escáner' : 'Escanear con cámara'">
                <ScanLine v-if="scanning" class="w-3.5 h-3.5 animate-pulse" />
                <ScanBarcode v-else class="w-3.5 h-3.5" />
              </button>
              <button v-if="searchQuery" @click="searchQuery = ''; searchInputRef?.focus()"
                class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <X class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div class="shrink-0 px-4 sm:px-6 pb-2 max-w-lg">
          <BarcodeScanner
            id="pos-scanner"
            :scanning="scanning"
            include-qr
            :qrbox-width="280"
            :qrbox-height="120"
            :aspect-ratio="1.6"
            overlay-class="w-52 h-16"
            overlay-border="border-blue-400/50"
            scan-line-class="bg-blue-400/70"
            height-class="h-36"
            container-class="rounded-xl border-slate-200 bg-slate-900 shadow-md"
            @scan="(txt: string) => { searchQuery = txt; lastScanned = txt; }"
            @close="scanning = false"
          />
        </div>

        <!-- Category pills -->
        <div v-if="categories.length" class="shrink-0 flex gap-2 overflow-x-auto px-4 sm:px-6 pb-3 pt-2 bg-white border-b border-slate-200/80">
          <button @click="showCategorySidebar = true"
            class="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:border-slate-300 transition-all duration-150 flex items-center gap-1.5">
            <ListTree class="w-3 h-3" />
            Todas
          </button>
          <button v-for="cat in categories" :key="cat.id" @click="selectedCategoryId = selectedCategoryId === cat.id ? null : cat.id"
            class="shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all duration-150 whitespace-nowrap"
            :class="categoryPillClass(cat)">
            {{ cat.icon }} {{ cat.name }}
          </button>
        </div>

        <!-- Info bar -->
        <div class="shrink-0 px-4 sm:px-6 py-2 flex items-center justify-between text-[11px] bg-white border-b border-slate-200/80">
          <div class="flex items-center gap-2 text-slate-500 font-medium">
            <span class="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>{{ filteredProducts.length }} producto{{ filteredProducts.length !== 1 ? 's' : '' }}</span>
            <span v-if="selectedCategoryId" class="text-blue-600 font-bold">
              en {{ categories.find(c => c.id === selectedCategoryId)?.icon || '' }} {{ categories.find(c => c.id === selectedCategoryId)?.name }}
            </span>
          </div>
          <div v-if="selectedCategoryId || searchQuery" class="flex items-center gap-2">
            <button v-if="selectedCategoryId" @click="selectedCategoryId = null"
              class="text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-wide">Limpiar filtro</button>
            <button v-if="searchQuery" @click="searchQuery = ''"
              class="text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-wide">Borrar búsqueda</button>
          </div>
          <div class="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button @click="currentLayout = 'modern'"
              class="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all"
              :class="currentLayout === 'modern' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'">
              <LayoutGrid class="w-3 h-3" />
              <span class="hidden sm:inline">Moderno</span>
            </button>
            <button @click="currentLayout = 'traditional'"
              class="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all"
              :class="currentLayout === 'traditional' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'">
              <List class="w-3 h-3" />
              <span class="hidden sm:inline">Clásico</span>
            </button>
          </div>
          <span v-if="lastScanned" class="text-slate-400 font-mono text-[10px]">
            Último: {{ lastScanned }}
          </span>
        </div>

        <!-- Product grid / list -->
        <div class="flex-1 overflow-y-auto px-4 sm:px-6 py-4 bg-[#f6f8fa]">
          <div v-if="dataLoading && filteredProducts.length === 0" class="flex flex-col items-center justify-center h-full text-sm text-slate-400 gap-2">
            <div class="w-8 h-8 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
            <span>Cargando productos...</span>
          </div>
          <div v-else-if="filteredProducts.length === 0" class="flex flex-col items-center justify-center h-full text-sm text-slate-400 gap-1">
            <PackageSearch class="w-10 h-10 text-slate-200" />
            <span v-if="searchQuery">Sin resultados para "<span class="font-medium text-slate-500">{{ searchQuery }}</span>"</span>
            <span v-else>No hay productos disponibles</span>
          </div>

          <!-- ═══════ MODERN LAYOUT (Grid) ═══════ -->
          <div v-else-if="currentLayout === 'modern'" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <button v-for="p in filteredProducts" :key="p.id" @click="addItem(p)"
              class="bg-white border border-slate-300 rounded-xl p-2.5 flex gap-2.5 shadow-sm hover:shadow-md hover:border-blue-400 transition-all cursor-pointer group relative overflow-hidden text-left"
              :class="{ 'opacity-60': p.availableStock <= 0 }">
              <div class="w-16 h-16 rounded-lg bg-slate-50 border border-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden relative">
                <img v-if="p.image" :src="p.image" :alt="p.name"
                  class="w-full h-full object-cover" @error="($event.target as HTMLImageElement).style.display='none'" />
                <div v-if="!p.image" class="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <span v-if="p.availableStock <= 0"
                  class="absolute inset-0 bg-white/60 flex items-center justify-center text-[9px] font-black text-rose-600 uppercase tracking-wider">Agotado</span>
              </div>
              <div class="flex flex-col justify-between flex-1 min-w-0">
                <div>
                  <h4 class="text-[11px] font-bold text-slate-800 truncate leading-tight group-hover:text-blue-600 transition-colors">{{ p.name }}</h4>
                  <p class="text-[9px] text-slate-400 truncate mt-0.5">
                    <span v-if="p.hasVariants && p.variants.length" class="text-blue-500 font-semibold">{{ p.variants.length }} variantes</span>
                    <span v-else>
                      <span v-if="p.unitsPerPackage > 1" class="text-[8px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-1 py-0.5 rounded mr-1">{{ p.unitsPerPackage }} uds/Bulto</span>
                      <span :class="p.availableStock <= 0 ? 'text-rose-600 font-bold' : 'text-amber-600 font-semibold'">
                        {{ formatStockBreakdown(p.availableStock, p.unitsPerPackage) }}
                      </span>
                    </span>
                  </p>
                </div>
                <div class="flex justify-between items-baseline mt-0.5">
                  <span class="text-xs font-black text-slate-900">{{ posDisplayStore.formatPrice(p.price_usd, tasaBCV).primary }}</span>
                  <span class="text-[9px] font-medium text-slate-400 font-mono">{{ posDisplayStore.formatPrice(p.price_usd, tasaBCV).secondary }}</span>
                </div>
                <span v-if="p.hasVariants" class="absolute top-1 right-1 bg-blue-500 text-white text-[7px] font-bold px-1 py-0.5 rounded leading-tight">VAR</span>
              </div>
            </button>
          </div>

          <!-- ═══════ TRADITIONAL LAYOUT (Table) ═══════ -->
          <div v-else class="overflow-x-auto">
            <table class="w-full text-xs border-collapse">
              <thead>
                <tr class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th class="text-left py-2 px-2 w-8"></th>
                  <th class="text-left py-2 px-2 w-24">Código</th>
                  <th class="text-left py-2 px-2">Producto</th>
                  <th class="text-left py-2 px-2 w-20">Categoría</th>
                  <th class="text-center py-2 px-2 w-16">Stock Disp.</th>
                  <th class="text-right py-2 px-2 w-20">Precio USD</th>
                  <th class="text-right py-2 px-2 w-24">Precio Bs</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in filteredProducts" :key="p.id" @click="addItem(p)"
                  class="border-b border-slate-100 hover:bg-blue-50/60 cursor-pointer transition-colors group"
                  :class="{ 'opacity-60': p.availableStock <= 0 }">
                  <td class="py-1.5 px-2">
                    <div class="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden flex-shrink-0">
                      <img v-if="p.image" :src="p.image" :alt="p.name"
                        class="w-full h-full object-cover" @error="($event.target as HTMLImageElement).style.display='none'" />
                      <div v-else class="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-300">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                    </div>
                  </td>
                  <td class="py-1.5 px-2 font-mono text-[10px] text-slate-400 truncate max-w-[6rem]">
                    {{ p.sku || p.barcode || '—' }}
                  </td>
                  <td class="py-1.5 px-2 font-semibold text-slate-800 truncate max-w-[12rem] group-hover:text-blue-600 transition-colors">
                    <div class="flex items-center gap-1.5">
                      <span>{{ p.name }}</span>
                      <span v-if="p.hasVariants" class="shrink-0 text-[8px] font-bold text-blue-600 bg-blue-100 px-1 py-0.5 rounded leading-tight">VAR</span>
                    </div>
                  </td>
                  <td class="py-1.5 px-2 text-slate-500 truncate max-w-[6rem]">
                    {{ p.categoryName || categories.find(c => c.id === p.category_id)?.name || '—' }}
                  </td>
                  <td class="py-1.5 px-2 text-center">
                    <span v-if="p.hasVariants" class="text-[10px] text-blue-600 font-semibold">{{ p.variants.length }} vars.</span>
                    <span v-else class="text-[10px] font-semibold"
                      :class="p.availableStock <= 0 ? 'text-rose-600' : 'text-emerald-600'">
                      <span v-if="p.unitsPerPackage > 1" class="text-[8px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-1 py-0.5 rounded mr-1">{{ p.unitsPerPackage }} uds/Bulto</span>
                      <span v-if="p.availableStock <= 0">Agotado</span>
                      <span v-else>{{ formatStockBreakdown(p.availableStock, p.unitsPerPackage) }}</span>
                    </span>
                  </td>
                  <td class="py-1.5 px-2 text-right font-semibold text-slate-900">
                    {{ posDisplayStore.formatPrice(p.price_usd, tasaBCV).primary }}
                  </td>
                  <td class="py-1.5 px-2 text-right font-mono text-slate-500">
                    {{ posDisplayStore.formatPrice(p.price_usd, tasaBCV).secondary }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ─── Quick actions bar (replaces old ticket section) ─── -->
        <section class="shrink-0 h-24 border-t border-slate-300/50 bg-[#9ca3af] p-3 flex items-center justify-between gap-3 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.08)]"
          :class="{'hidden md:flex': true}">
          <div class="flex items-center gap-3 flex-1 h-full">
            <button @click="showCustomersBrowser = true"
              class="flex-1 h-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-[0.98] shadow-md group">
              <span class="text-xl group-hover:scale-110 transition-transform">👤</span>
              <span class="text-[10px] font-black tracking-wider text-slate-600 uppercase">Clientes</span>
            </button>
            <button @click="showInventoryBrowser = true"
              class="flex-1 h-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-[0.98] shadow-md group">
              <span class="text-xl group-hover:scale-110 transition-transform">📦</span>
              <span class="text-[10px] font-black tracking-wider text-slate-600 uppercase">Inventario</span>
            </button>
            <button class="flex-1 h-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-[0.98] shadow-md group">
              <span class="text-xl group-hover:scale-110 transition-transform">⚙️</span>
              <span class="text-[10px] font-black tracking-wider text-slate-600 uppercase">Ajustes</span>
            </button>
            <button @click="showCierreCaja = true"
              class="flex-1 h-full bg-white hover:bg-rose-50 border border-slate-300 hover:border-rose-300 text-slate-800 hover:text-rose-600 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-[0.98] shadow-md group">
              <span class="text-xl group-hover:scale-110 transition-transform">🔒</span>
              <span class="text-[10px] font-black tracking-wider text-slate-600 uppercase">Cierre Caja</span>
            </button>
          </div>
          <div class="hidden lg:flex flex-col text-right pl-4 border-l-2 border-white/30 justify-center h-full">
            <span class="text-[10px] font-bold text-white/70 uppercase tracking-wider">Items Filtro</span>
            <span class="text-lg font-black text-white">{{ filteredProducts.length }} Prods</span>
          </div>
        </section>

        <!-- ═══════ CATEGORY SIDEBAR ═══════ -->
        <Teleport to="body">
          <div v-if="showCategorySidebar" class="fixed inset-0 z-[60]">
            <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" @click="showCategorySidebar = false" />
            <div class="absolute top-0 left-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col animate-slide-in-left">
              <div class="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-200">
                <div class="flex items-center gap-2">
                  <ListTree class="w-4 h-4 text-blue-600" />
                  <h3 class="text-sm font-bold text-slate-800">Categorías</h3>
                </div>
                <button @click="showCategorySidebar = false" class="p-1 rounded-lg hover:bg-slate-100 transition-colors">
                  <X class="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div class="flex-1 overflow-y-auto py-2">
                <button @click="filterByCategory(null)"
                  class="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                  :class="selectedCategoryId === null ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'">
                  <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                    <PackageSearch class="w-4 h-4 text-slate-500" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <span class="text-sm font-semibold">Todos los productos</span>
                  </div>
                  <span class="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">{{ products.length }}</span>
                </button>

                <div class="h-px bg-slate-100 mx-4 my-1" />

                <div v-for="cat in categories" :key="cat.id">
                  <button @click="filterByCategory(cat.id)"
                    class="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                    :class="selectedCategoryId === cat.id ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                      :class="selectedCategoryId === cat.id ? 'bg-blue-100' : 'bg-slate-100'">
                      {{ cat.icon || '📁' }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <span class="text-sm font-semibold">{{ cat.name }}</span>
                    </div>
                    <span class="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full mr-1">{{ productCountForCategory(cat) }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Teleport>
      </main>

      <!-- ─── RIGHT: Blue Column (Totals + Cart Items + Customer + Charge) ─── -->
      <aside class="w-96 bg-gradient-to-t from-blue-700 via-blue-600 to-sky-400 text-white flex flex-col justify-between p-4 shadow-2xl border-l border-blue-800/30"
        :class="mobileTab !== 'cart' && mobileTab !== 'payment' ? 'hidden sm:flex' : 'flex'">

        <!-- Totals -->
        <div class="space-y-1.5 pb-3 border-b border-white/20">
          <div class="flex justify-between items-baseline">
            <span class="text-xs font-bold text-blue-100 uppercase tracking-wider">Total Cuenta:</span>
            <div class="text-right">
              <p class="text-3xl font-black text-white tracking-tight">{{ formattedTotal.primary }}</p>
              <p class="text-xs text-blue-100 font-medium font-mono mt-0.5">{{ formattedTotal.secondary }}</p>
            </div>
          </div>
        </div>

        <!-- Cart items (slate "foso" container) -->
        <div class="flex-1 my-3 bg-slate-100/90 rounded-2xl p-3 border border-blue-400/20 shadow-inner flex flex-col overflow-hidden">
          <div class="flex justify-between items-center mb-2 shrink-0">
            <span class="text-[10px] font-black uppercase tracking-wider text-slate-500">Productos en Ticket ({{ cart.length }})</span>
            <button @click="cart = []"
              class="text-[10px] font-bold text-rose-500 hover:text-rose-600 uppercase tracking-wide">Vaciar</button>
          </div>
          <div v-if="cart.length === 0" class="flex-1 flex items-center justify-center text-[11px] text-slate-400 font-medium">
            Agregue productos desde el catálogo
          </div>
          <div v-else class="flex-1 overflow-y-auto space-y-2 pr-0.5">
            <div v-for="(item, i) in cart" :key="item.cartItemId || (item.id + item.mode + (item.attrs ? JSON.stringify(item.attrs) : ''))"
              class="bg-white border border-slate-200 rounded-xl p-2.5 shadow-sm flex items-center justify-between hover:border-slate-300 transition-all text-slate-800">
              <div class="flex items-center gap-2.5 min-w-0 flex-1">
                <div class="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-200">
                  <img v-if="item.image" :src="item.image" :alt="item.name" class="w-full h-full object-cover"
                    @error="($event.target as HTMLImageElement).style.display='none'" />
                  <div v-else class="w-full h-full flex items-center justify-center text-slate-300">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                </div>
                <div class="min-w-0 flex-1">
                  <h4 class="text-xs font-bold text-slate-800 truncate leading-tight">{{ item.name }}</h4>
                  <span v-if="item.variantLabel" class="text-[10px] text-slate-500 font-medium truncate block leading-tight">{{ item.variantLabel }}</span>
                  <div class="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <button v-if="item.unitsPerPackage > 1"
                      @click="togglePricingMode(i)"
                      class="text-[10px] px-1.5 py-0.5 font-semibold rounded border uppercase tracking-wider leading-tight cursor-pointer transition-all"
                      :class="item.mode === 'BULTO'
                        ? 'bg-violet-100/60 text-violet-700 border-violet-200/50'
                        : 'bg-emerald-100/60 text-emerald-700 border-emerald-200/50'"
                      :title="'Cambiar a ' + (item.mode === 'BULTO' ? 'Unidad' : 'Bulto')">
                      {{ item.mode === 'BULTO' ? `BULTO (${item.unitsPerPackage} UDS)` : 'UNIDAD' }}
                    </button>
                    <span class="text-[10px] text-slate-400 font-bold">{{ posDisplayStore.formatPrice(item.unitPrice, tasaBCV).primary }}</span>
                    <span class="text-[9px] text-slate-300">·</span>
                    <span class="text-[9px] text-slate-400 font-medium">{{ posDisplayStore.formatPrice(item.unitPrice, tasaBCV).secondary }}</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                <template v-if="item.mode === 'PESO' || item.mode === 'VOLUMEN'">
                  <button @click="openWeightModalForEdit(i)"
                    class="text-right leading-tight hover:bg-blue-50 rounded-lg px-1.5 py-1 transition-colors"
                    title="Click para ajustar el peso/monto">
                    <span class="block text-xs font-black text-slate-800 underline decoration-dotted decoration-slate-300">
                      {{ formatCartQty(item.qty) }} {{ unitsLabelFor(item.sale_unit) }}
                    </span>
                    <span class="block text-[9px] text-slate-400">× {{ posDisplayStore.formatPrice(item.unitPrice, tasaBCV).primary }}/{{ unitsLabelFor(item.sale_unit) }}</span>
                  </button>
                </template>
                <div v-else class="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
                  <button @click="qtyDown(i)"
                    class="w-5 h-5 flex items-center justify-center text-xs font-black bg-white hover:bg-slate-200 text-slate-600 rounded-md border border-slate-300 shadow-sm transition-all active:scale-90">−</button>
                  <span class="w-6 text-center text-xs font-black text-slate-800">{{ item.qty }}</span>
                  <button @click="qtyUp(i)" :disabled="item.qty >= item.maxStock"
                    class="w-5 h-5 flex items-center justify-center text-xs font-black bg-white text-slate-600 rounded-md border border-slate-300 shadow-sm transition-all"
                    :class="item.qty >= item.maxStock ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-200 active:scale-90'">+</button>
                  <span v-if="item.qty >= item.maxStock && item.maxStock > 0" class="text-[8px] text-amber-600 font-semibold ml-1">Máx</span>
                </div>
                <div class="flex items-center gap-2 pl-1">
                  <span class="text-xs font-black text-slate-800">{{ posDisplayStore.formatPrice(item.unitPrice * item.qty, tasaBCV).primary }}</span>
                  <button @click="removeItem(i)"
                    class="text-slate-300 hover:text-rose-500 transition-colors text-xs p-1">
                    <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>

        <!-- Customer + Charge row -->
        <div class="space-y-2.5 pt-2 border-t border-white/10">
          <button id="pos-clientes-btn" @click="showCustomerSelector = true"
            class="w-full flex items-center justify-between bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-3 py-1.5 text-xs transition-colors">
            <span class="text-blue-100 font-medium">CLIENTES:</span>
            <span class="font-bold text-white truncate max-w-[65%]">{{ customerDisplayName(selectedCustomer) }} {{ selectedCustomer ? '' : '👤' }}</span>
          </button>
          <div class="flex gap-2">
            <button @click="showPauseModal = true" :disabled="cart.length === 0"
              class="flex items-center justify-center gap-1 h-12 rounded-xl text-xs font-bold text-white/80 bg-white/10 hover:bg-white/20 border border-white/20 transition-all active:scale-[0.98] px-3 backdrop-blur-sm"
              :class="cart.length === 0 ? 'opacity-30 cursor-not-allowed' : ''">
              <PauseCircle class="w-3.5 h-3.5" />
              Pausar
            </button>
            <button v-if="canCharge || cart.length === 0" @click="openCheckout" :disabled="cart.length === 0"
              class="flex-1 h-12 rounded-xl text-sm font-black text-white transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 uppercase tracking-wider"
              :class="cart.length === 0
                ? 'bg-slate-400/50 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 shadow-emerald-500/30'">
              ⚡ Cobrar
            </button>
            <button v-else @click="showTopUp = true"
              class="flex-1 h-12 rounded-xl text-sm font-black text-white transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-amber-500/30">
              <Ticket class="w-4 h-4" />
              Recargar Tickets
            </button>
          </div>
        </div>
      </aside>
    </div>

    <!-- ═══════ MOBILE FAB (cart summary) ═══════ -->
    <button v-if="cart.length > 0 && mobileTab !== 'cart'" @click="showMobileCart = true"
      class="md:hidden fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold px-5 py-3.5 rounded-2xl shadow-2xl shadow-blue-600/30 transition-all active:scale-95">
      <span class="relative flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-xs font-black">
        {{ cartTotal }}
      </span>
      <span class="text-sm">Ver Ticket</span>
      <span class="text-xs font-semibold text-white/80 ml-1">{{ formattedTotal.primary }}</span>
    </button>

    <!-- ═══════ MOBILE CART BOTTOM SHEET ═══════ -->
    <Teleport to="body">
      <div v-if="showMobileCart" class="fixed inset-0 z-[60] md:hidden">
        <div class="absolute inset-0 bg-black/40" @click="showMobileCart = false" />
        <div class="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl flex flex-col max-h-[80vh] transition-transform duration-300"
          @click.stop>
          <div class="shrink-0 flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
            <h3 class="text-sm font-bold text-slate-800">
              Ticket Activo <span class="text-blue-600 font-black">({{ itemCount }})</span>
            </h3>
            <button @click="showMobileCart = false" class="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <X class="w-4 h-4 text-slate-400" />
            </button>
          </div>
          <div class="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
            <div v-for="(item, i) in cart" :key="'mob-' + (item.cartItemId || (item.id + item.mode + (item.attrs ? JSON.stringify(item.attrs) : '')))"
              class="bg-slate-50 rounded-xl p-3 flex items-start gap-3">
              <div class="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-200 mt-0.5">
                <img v-if="item.image" :src="item.image" :alt="item.name" class="w-full h-full object-cover"
                  @error="($event.target as HTMLImageElement).style.display='none'" />
                <div v-else class="w-full h-full flex items-center justify-center text-slate-300">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="text-sm font-bold text-slate-800 truncate">{{ item.name }}</h4>
                <span v-if="item.variantLabel" class="text-[11px] text-slate-500 font-medium truncate block leading-tight">{{ item.variantLabel }}</span>
                <div class="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <button v-if="item.unitsPerPackage > 1"
                    @click="togglePricingMode(i)"
                    class="text-[10px] px-1.5 py-0.5 font-semibold rounded border uppercase tracking-wider leading-tight cursor-pointer transition-all"
                    :class="item.mode === 'BULTO'
                      ? 'bg-violet-100/60 text-violet-700 border-violet-200/50'
                      : 'bg-emerald-100/60 text-emerald-700 border-emerald-200/50'"
                    :title="'Cambiar a ' + (item.mode === 'BULTO' ? 'Unidad' : 'Bulto')">
                    {{ item.mode === 'BULTO' ? `BULTO (${item.unitsPerPackage} UDS)` : 'UNIDAD' }}
                  </button>
                  <span class="text-[11px] text-slate-400 font-semibold">{{ posDisplayStore.formatPrice(item.unitPrice, tasaBCV).primary }}</span>
                  <span class="text-[9px] text-slate-300">·</span>
                  <span class="text-[10px] text-slate-400">{{ posDisplayStore.formatPrice(item.unitPrice, tasaBCV).secondary }}</span>
                </div>
                <div class="flex items-center gap-2 mt-2">
                  <button v-if="item.mode === 'PESO' || item.mode === 'VOLUMEN'" @click="openWeightModalForEdit(i)"
                    class="text-left leading-tight hover:bg-blue-50 rounded-lg px-1.5 py-1 -ml-1.5 transition-colors"
                    title="Click para ajustar el peso/monto">
                    <span class="block text-sm font-bold text-slate-800 underline decoration-dotted decoration-slate-300">
                      {{ formatCartQty(item.qty) }} {{ unitsLabelFor(item.sale_unit) }}
                    </span>
                    <span class="block text-[10px] text-slate-400">× {{ posDisplayStore.formatPrice(item.unitPrice, tasaBCV).primary }}/{{ unitsLabelFor(item.sale_unit) }}</span>
                  </button>
                  <div v-else class="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                    <button @click="qtyDown(i)" class="px-2 py-0.5 text-slate-500 hover:bg-slate-100 text-sm font-bold">−</button>
                    <span class="px-2.5 text-sm font-bold text-slate-700">{{ item.qty }}</span>
                    <button @click="qtyUp(i)" :disabled="item.qty >= item.maxStock"
                      class="px-2 py-0.5 text-sm font-bold transition-all"
                      :class="item.qty >= item.maxStock ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-100'">+</button>
                  </div>
                  <span class="text-sm font-bold text-slate-800">{{ posDisplayStore.formatPrice(item.unitPrice * item.qty, tasaBCV).primary }}</span>
                  <button @click="removeItem(i)" class="ml-auto p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors">
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="shrink-0 border-t border-slate-100 px-4 py-3 space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-sm font-semibold text-slate-600">Total</span>
              <div class="text-right">
                <p class="text-lg font-black text-slate-900">{{ formattedTotal.primary }}</p>
                <p class="text-[11px] text-slate-400 font-mono">{{ formattedTotal.secondary }}</p>
              </div>
            </div>
            <div class="flex gap-2">
              <button @click="showPauseModal = true; showMobileCart = false" :disabled="cart.length === 0"
                class="flex items-center justify-center gap-1 h-12 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all active:scale-[0.98] px-3"
                :class="cart.length === 0 ? 'opacity-30 cursor-not-allowed' : ''">
                <PauseCircle class="w-4 h-4" />
                Pausar
              </button>
              <button v-if="canCharge || cart.length === 0" @click="showMobileCart = false; openCheckout()"
                :disabled="cart.length === 0"
                class="flex-1 h-12 rounded-xl text-sm font-black text-white bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                :class="cart.length === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:from-emerald-400 hover:to-emerald-500'">
                <CreditCard class="w-4 h-4" />
                COBRAR — {{ formattedTotal.primary }}
              </button>
              <button v-else @click="showTopUp = true; showMobileCart = false"
                class="flex-1 h-12 rounded-xl text-sm font-black text-white bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                <Ticket class="w-4 h-4" />
                Recargar Tickets
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ═══════ CUSTOMER SELECTOR MODAL ═══════ -->
    <Teleport to="body">
      <CustomerSelectorModal
        v-if="showCustomerSelector"
        @select="onCustomerSelected"
        @close="showCustomerSelector = false"
      />
    </Teleport>

    <!-- ═══════ CUSTOMER EDITOR MODAL (editar cliente sin salir del POS) ═══════ -->
    <Teleport to="body">
      <CustomerFormModal
        v-if="showCustomerEditor && selectedCustomer"
        :customer="selectedCustomer"
        @saved="onCustomerEdited"
        @close="showCustomerEditor = false"
      />
    </Teleport>

    <!-- ═══════ CUSTOMERS BROWSER MODAL (sección "Clientes" de la barra inferior) ═══════ -->
    <Teleport to="body">
      <CustomersBrowserModal
        v-if="showCustomersBrowser"
        @close="showCustomersBrowser = false"
      />
    </Teleport>

    <!-- ═══════ INVENTORY BROWSER MODAL (sección "Inventario" de la barra inferior) ═══════ -->
    <Teleport to="body">
      <InventoryBrowserModal
        v-if="showInventoryBrowser"
        @close="showInventoryBrowser = false"
      />
    </Teleport>

    <!-- ═══════ POS SETTINGS MODAL ═══════ -->
    <Teleport to="body">
      <POSSettingsModal
        v-if="showPOSSettings"
        @close="showPOSSettings = false"
      />
    </Teleport>

    <!-- ═══════ CHECKOUT MODAL ═══════ -->
    <CheckoutModal
      v-if="showCheckout"
      :total-usd="totalUSD"
      :total-ves="totalVES"
      :tasa-bcv="tasaBCV"
      :payment-methods="paymentMethods"
      :processing="checkoutModalProcessing"
      :error-message="checkoutModalError"
      :selected-customer="selectedCustomer"
      :is-credit-sale="isCreditSale"
      :requires-fiscal-invoice="requiresFiscalInvoice"
      @confirm="onCheckoutConfirm"
      @confirm-layaway="onLayawayConfirm"
      @close="showCheckout = false"
      @clear-error="clearCheckoutModalError"
      @open-customer-selector="showCustomerSelector = true"
      @open-customer-editor="showCustomerEditor = true"
      @update:is-credit-sale="isCreditSale = $event"
      @update:requires-fiscal-invoice="requiresFiscalInvoice = $event"
    />

    <!-- ═══════ SALE SUCCESS MODAL ═══════ -->
    <SaleSuccessModal
      v-if="successSale"
      :sale="successSale"
      :customer-phone="selectedCustomer?.phone"
      @new-sale="onNewSale"
    />

    <!-- ═══════ LAYAWAY SUCCESS MODAL ═══════ -->
    <LayawaySuccessModal
      v-if="successLayaway"
      :layaway="successLayaway"
      @new-sale="onNewSale"
    />

    <!-- ═══════ TOP-UP MODAL ═══════ -->
    <TransactionTopUpModal
      v-if="showTopUp"
      @close="showTopUp = false"
      @confirm="onTopUpConfirm"
    />

    <!-- ═══════ CIERRE CAJA MODAL ═══════ -->
    <CierreCaja
      v-if="showCierreCaja"
      @close="showCierreCaja = false"
    />

    <!-- ═══════ VARIANT SELECTOR MODAL ═══════ -->
    <VariantSelectorModal
      v-if="showVariantModal && selectedVariantProduct"
      :product="selectedVariantProduct"
      :variants="selectedVariantProduct.variants"
      @select="onVariantSelected"
      @close="showVariantModal = false"
    />

    <!-- ═══════ WEIGHT / VOLUME CALCULATOR ═══════ -->
    <WeightVolumeModal
      :visible="showWeightModal"
      :product="weightModalProductInfo"
      :initial-qty="weightModalInitialQty"
      :bcv-rate="tasaBCV"
      :default-currency="posDisplayStore.displayCurrency"
      @close="closeWeightModal"
      @confirm="confirmWeightEntry"
    />

    <!-- ═══════ PAUSE SALE MODAL ═══════ -->
    <PauseModal
      v-if="showPauseModal"
      @close="showPauseModal = false"
      @pause="onPauseSale"
    />

    <!-- ═══════ PARKED SALES MODAL ═══════ -->
    <ParkedSalesModal
      v-if="showParkedSalesModal"
      :parked-sales="parkedSales"
      :parked-timers="parkedTimers"
      @resume="onResumeSale"
      @cancel="onCancelParked"
      @close="showParkedSalesModal = false"
    />

    <!-- ═══════ EXPIRED PARKED SALE MODAL ═══════ -->
    <ExpiredParkedSaleModal
      v-if="showExpiredModal && expiredSale"
      :sale="expiredSale"
      @extend="onExtendExpired"
      @cancel="onCancelExpired"
      @close="showExpiredModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
  Search, X, User, ShoppingBag, Trash2,
  CreditCard, PackageSearch, PauseCircle, Wifi, WifiOff,
  ScanBarcode, ScanLine, LayoutGrid, List,
  ListTree, Ticket, Clock, Settings2,
} from 'lucide-vue-next';
import BarcodeScanner from '@/components/shared/BarcodeScanner.vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useCajaStore } from '@/stores/caja';
import { useForexRate } from '@/composables/useForexRate';
import { usePosDisplayStore } from '@/stores/posDisplay';
import { useInventory } from '@/modules/inventory/composables/useInventory';
import { useTenantMetadata } from '@/composables/useTenantMetadata';
import { useCheckout } from '@/composables/useCheckout';
import { useLayaway, type LayawayDetail } from '@/composables/useLayaway';
import { useApi } from '@/composables/useApi';
import { usePos, customerDisplayName } from '@/composables/usePos';
import type { Customer } from '@/composables/useCustomers';
import type { SaleDetail } from '@/composables/useSalesHistory';
import CheckoutModal, { type LayawayConfirmPayload } from './CheckoutModal.vue';
import CustomerSelectorModal from './CustomerSelectorModal.vue';
import CustomerFormModal from '@/views/admin/customers/CustomerFormModal.vue';
import CustomersBrowserModal from './CustomersBrowserModal.vue';
import InventoryBrowserModal from './InventoryBrowserModal.vue';
import POSSettingsModal from './POSSettingsModal.vue';
import SaleSuccessModal from './SaleSuccessModal.vue';
import LayawaySuccessModal from './LayawaySuccessModal.vue';
import TransactionTopUpModal from '@/components/modals/TransactionTopUpModal.vue';
import CierreCaja from './CierreCaja.vue';
import VariantSelectorModal from './VariantSelectorModal.vue';
import WeightVolumeModal, { type WeightModalProduct } from './WeightVolumeModal.vue';
import { unitsLabelFor } from '@/composables/usePackageTypes';
import PauseModal from './PauseModal.vue';
import ParkedSalesModal from './ParkedSalesModal.vue';
import ExpiredParkedSaleModal from './ExpiredParkedSaleModal.vue';
import { toast } from 'vue3-toastify';
import { fetchPaymentMethods, type PaymentMethod } from '@/services/treasury.service';
import {
  listParkedSales,
  createParkedSale,
  resumeParkedSale,
  cancelParkedSale,
  extendParkedSale,
  type ParkedSale,
} from '@/modules/inventory/services/parkedSales.service';

const authStore = useAuthStore();
const cajaStore = useCajaStore();
const tenantLogo = computed(() => authStore.user?.tenant_logo || null);
const tenantCommercialName = computed(() => authStore.user?.tenant_commercial_name || authStore.user?.tenant_name || '');

const {
  ticketsDisponibles, esIlimitado, sinVencimiento,
  canCharge, consumirTicket,
} = useTenantMetadata();
const showTopUp = ref(false);

const {
  isProcessing: isProcessingCheckout,
  errorMessage: checkoutError,
  clearError: clearCheckoutError,
  checkout,
} = useCheckout();
const {
  isProcessing: isProcessingLayaway,
  errorMessage: layawayError,
  clearError: clearLayawayError,
  processLayaway,
} = useLayaway();
const { fetchApi } = useApi();
const defaultWarehouseId = ref<string | null>(null);

const {
  selectedCustomer,
  isCreditSale,
  requiresFiscalInvoice,
  selectCustomer,
  resetForNewSale,
  validateBeforeCheckout,
} = usePos();
const showCustomerSelector = ref(false);
const showCustomerEditor = ref(false);
const showCustomersBrowser = ref(false);
const showInventoryBrowser = ref(false);
const successSale = ref<SaleDetail | null>(null);
const successLayaway = ref<LayawayDetail | null>(null);

/** El modal de checkout comparte processing/error entre venta y apartado según cuál esté en curso. */
const checkoutModalProcessing = computed(() => isProcessingCheckout.value || isProcessingLayaway.value);
const checkoutModalError = computed(() => checkoutError.value || layawayError.value);
function clearCheckoutModalError() {
  clearCheckoutError();
  clearLayawayError();
}

const { rateValue: tasaBCV, fetchForexRate } = useForexRate();
const posDisplayStore = usePosDisplayStore();
/** { primary, secondary } del total de la venta, reusado en todos los puntos donde se muestra (header, FAB móvil, hoja de carrito, botón Cobrar). */
const formattedTotal = computed(() => posDisplayStore.formatPrice(totalUSD.value, tasaBCV.value));
const {
  products: inventoryProducts,
  categories: inventoryCategories,
  loadProducts,
  loadCategories,
  loading: invLoading,
} = useInventory();

const emit = defineEmits<{ close: [] }>();
const router = useRouter();
function handleClose() {
  try { emit('close'); } catch {}
  router?.back();
}

interface CartItem {
  id: string;
  /** Unique per row — only set for PESO/VOLUMEN lines, where several rows can
   *  legitimately share the same product `id` (separate weighed portions). */
  cartItemId?: string;
  productId: string;
  variantId?: string;
  name: string;
  variantLabel?: string;
  price_usd: number;
  qty: number;
  stock?: number;
  barcode?: string;
  image?: string;
  attrs?: Record<string, string>;
  maxStock: number;
  maxVariantStock?: number;
  unitsPerPackage: number;
  /** PESO/VOLUMEN lines carry a decimal `qty` (Kg/L) instead of a whole-unit count. */
  mode: 'UNIDAD' | 'BULTO' | 'PESO' | 'VOLUMEN';
  /** Set only for PESO/VOLUMEN lines — drives the ticket's Kg/Litros breakdown and re-opens the weight modal on click. */
  sale_unit?: string;
  unitPrice: number;
  conversionFactor: number;
  unitLabel: string;
  altUnitLabel: string;
}

function getItemAtomicUnits(item: CartItem): number {
  return item.mode === 'BULTO' ? (item.unitsPerPackage || 1) : 1;
}

/** Unique id for a single cart row — lets multiple PESO/VOLUMEN portions of the same product coexist. */
function generateCartItemId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `row-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getCartVariantConsumption(variantId: string): number {
  return cart.value
    .filter(item => item.variantId === variantId)
    .reduce((sum, item) => sum + item.qty, 0);
}

interface VariantData {
  id: string;
  sku: string;
  barcode: string;
  stock: number;
  price_base: string;
  display_name: string;
  formatted_attributes: { name: string; value: string; id: number | null }[];
  attribute_values: Record<string, string>;
}

interface Product {
  id: string;
  name: string;
  price_usd: number;
  stock: number;
  totalStock: number;
  availableStock: number;
  barcode?: string;
  category_id?: string;
  image?: string;
  sku?: string;
  brandName?: string;
  categoryName?: string;
  hasVariants: boolean;
  variants: VariantData[];
  unitsPerPackage: number;
  /** 'PESO' | 'VOLUMEN' | 'UNIDAD' — GlobalProduct.SaleUnitChoices on the backend. */
  sale_unit: string;
}

interface Category {
  id: string;
  name: string;
  icon?: string;
  children?: Category[];
}

const searchQuery = ref('');
const searchInputRef = ref<HTMLInputElement | null>(null);
const selectedCategoryId = ref<string | null>(null);
const showCategorySidebar = ref(false);

// Barcode scanner
const scanning = ref(false);
const lastScanned = ref<string | null>(null);

function toggleScanner() { scanning.value = !scanning.value; }

// Layout toggle
const currentLayout = ref<'modern' | 'traditional'>('modern');

// Parked Sales (API-backed)
const parkedSales = ref<ParkedSale[]>([]);
const showPauseModal = ref(false);
const showParkedSalesModal = ref(false);
const showExpiredModal = ref(false);
const expiredSale = ref<ParkedSale | null>(null);
const notifiedExpired = ref<Set<number>>(new Set());
const pausing = ref(false);
const parkedTimerInterval = ref<number | null>(null);
const parkedRefreshInterval = ref<number | null>(null);
const parkedTimers = ref<Record<number, number>>({});

/** Update local timers from expires_at (no server call). */
function tickTimers() {
  for (const s of parkedSales.value) {
    const expires = new Date(s.expires_at).getTime();
    const remaining = Math.max(0, Math.floor((expires - Date.now()) / 1000));
    parkedTimers.value[s.id] = remaining;
    // Open expired modal once per sale
    if (remaining <= 0 && !notifiedExpired.value.has(s.id) && s.status === 'PAUSED') {
      notifiedExpired.value.add(s.id);
      expiredSale.value = s;
      showExpiredModal.value = true;
    }
  }
}

async function fetchParkedSales() {
  try {
    const result = await listParkedSales('PAUSED');
    parkedSales.value = result;
    // Rebuild notified set — only keep IDs that still exist
    const currentIds = new Set(result.map(s => s.id));
    notifiedExpired.value = new Set(
      [...notifiedExpired.value].filter(id => currentIds.has(id))
    );
    tickTimers();
  } catch {
    // silently retry on next interval
  }
}

async function onPauseSale(alias: string) {
  if (cart.value.length === 0) return;
  pausing.value = true;
  try {
    const items = cart.value.map(i => ({
      id: i.id,
      cartItemId: i.cartItemId,
      productId: i.productId,
      variantId: i.variantId,
      name: i.name,
      variantLabel: i.variantLabel,
      price_usd: i.price_usd,
      qty: i.qty,
      image: i.image || '',
      unitsPerPackage: i.unitsPerPackage,
      mode: i.mode,
      sale_unit: i.sale_unit,
      unitPrice: i.unitPrice,
      maxStock: i.maxStock,
      maxVariantStock: i.maxVariantStock,
      barcode: i.barcode || '',
      attrs: i.attrs,
    }));
    await createParkedSale({
      alias,
      items,
      ttl_minutes: 20,
    });
    cart.value = [];
    showPauseModal.value = false;
    toast.success('Venta pausada – inventario reservado');
    await Promise.all([fetchParkedSales(), loadProducts()]);
  } catch (e: any) {
    toast.warning(e?.response?.data?.detail || 'Error al pausar la venta');
  } finally {
    pausing.value = false;
  }
}

async function onResumeSale(sale: ParkedSale) {
  try {
    const result = await resumeParkedSale(sale.id);
    if (cart.value.length > 0) {
      toast.warning('Finalice la venta actual antes de reanudar');
      return;
    }
    cart.value = result.items.map(i => ({
      ...i,
      stock: i.maxStock,
      maxStock: i.maxStock,
      maxVariantStock: i.maxVariantStock,
      conversionFactor: i.mode === 'BULTO' ? i.unitsPerPackage : 1,
      unitLabel: i.mode === 'BULTO' ? 'Bulto' : 'Unidad',
      altUnitLabel: i.mode === 'BULTO' ? 'Unidad' : (i.unitsPerPackage > 1 ? 'Bulto' : ''),
    }));
    await cancelParkedSale(sale.id);
    parkedSales.value = parkedSales.value.filter(s => s.id !== sale.id);
    showParkedSalesModal.value = false;
    toast.success(`Reanudada: ${result.alias || result.reference}`);
    loadProducts();
  } catch (e: any) {
    toast.warning(e?.response?.data?.detail || 'Error al reanudar');
  }
}

async function onCancelParked(sale: ParkedSale) {
  try {
    await cancelParkedSale(sale.id);
    parkedSales.value = parkedSales.value.filter(s => s.id !== sale.id);
    toast.success('Reservación cancelada, stock liberado');
    loadProducts();
  } catch {
    toast.warning('Error al cancelar');
  }
}

async function onExtendExpired(sale: ParkedSale) {
  try {
    const result = await extendParkedSale(sale.id, 20);
    parkedTimers.value[sale.id] = 1200;
    notifiedExpired.value.delete(sale.id);
    showExpiredModal.value = false;
    expiredSale.value = null;
    // Update expires_at in the list
    const found = parkedSales.value.find(s => s.id === sale.id);
    if (found) found.expires_at = result.expires_at;
    toast.success(`Reserva extendida +20 min — ${result.alias || result.reference}`);
  } catch {
    toast.warning('Error al extender la reserva');
  }
}

async function onCancelExpired(sale: ParkedSale) {
  await onCancelParked(sale);
  showExpiredModal.value = false;
  expiredSale.value = null;
}

async function loadDefaultWarehouse() {
  try {
    const res = await fetchApi<any>('/api/v1/inventory/warehouses/?page_size=200');
    const list = Array.isArray(res?.results) ? res.results : (Array.isArray(res) ? res : []);
    const main = list.find((w: any) => w.code === 'MAIN');
    defaultWarehouseId.value = main?.id ?? list[0]?.id ?? null;
    if (!defaultWarehouseId.value) {
      console.warn('[POS] No hay almacenes configurados para este tenant');
    }
  } catch (e) {
    console.error('[POS] Error al cargar el almacén por defecto', e);
    defaultWarehouseId.value = null;
  }
}

async function onCheckoutConfirm(payload: {
  payments: { payment_method_id: string; gavetero_id: string; amount_usd: number; amount_ves: number; reference: string }[];
  isCredit: boolean;
  clientId: string | null;
  requiresFiscalInvoice: boolean;
}) {
  clearCheckoutModalError();

  // Validaciones estrictas pre-checkout (regla crédito + regla factura fiscal).
  const block = validateBeforeCheckout();
  if (block.blocked) {
    toast.error(block.message || 'No se pudo procesar la venta.');
    if (block.openCustomerModal) showCustomerSelector.value = true;
    return;
  }

  if (!defaultWarehouseId.value) {
    await loadDefaultWarehouse();
  }
  if (!cajaStore.turnoActivo?.id) {
    await cajaStore.verificarTurnoActivo();
  }

  if (!cajaStore.turnoActivo?.id || !defaultWarehouseId.value) {
    toast.warning('No se pudo determinar el turno de caja o el almacén de la venta. Verifica tu conexión e inténtalo de nuevo.');
    return;
  }

  // complete reserved stock when sale is paid
  const matched = parkedSales.value.filter(s =>
    s.items.every((si: any) =>
      cart.value.some(ci => ci.productId === si.productId && ci.qty <= si.qty)
    )
  );
  for (const s of matched) {
    try {
      const { default: axios } = await import('axios');
      await axios.post(`/api/v1/parked-sales/${s.id}/complete/`);
    } catch { /* non-blocking */ }
  }

  const sale = await checkout({
    shift_id: Number(cajaStore.turnoActivo.id),
    warehouse_id: defaultWarehouseId.value,
    exchange_rate: tasaBCV.value,
    items: cart.value.map(i => ({
      product_id: i.id,
      qty: i.qty,
      unit_price_cents: Math.round(i.unitPrice * 100),
      pricing_mode: i.mode,
      conversion_factor: i.conversionFactor,
    })),
    payments: payload.payments,
    client_id: payload.clientId || undefined,
    is_credit: payload.isCredit,
  });

  if (!sale) return;

  // Ticket consumption is now atomic on the backend (same POST); only reflect it
  // locally for the header badge once we know the sale actually went through.
  consumirTicket();

  showCheckout.value = false;
  successSale.value = sale;
  await Promise.all([fetchParkedSales(), loadProducts()]);
}

async function onLayawayConfirm(payload: LayawayConfirmPayload) {
  clearCheckoutModalError();

  // Misma regla de factura fiscal que la venta al contado/crédito (la regla de
  // crédito no aplica: isCreditSale permanece false en modo apartado).
  const block = validateBeforeCheckout();
  if (block.blocked) {
    toast.error(block.message || 'No se pudo procesar el apartado.');
    if (block.openCustomerModal) showCustomerSelector.value = true;
    return;
  }

  if (!cajaStore.turnoActivo?.id) {
    await cajaStore.verificarTurnoActivo();
  }
  if (!cajaStore.turnoActivo?.id) {
    toast.warning('No se pudo determinar el turno de caja. Verifica tu conexión e inténtalo de nuevo.');
    return;
  }

  // El apartado reserva stock (reserved_quantity) sin descontar quantity física
  // ni pasar por un warehouse específico — LayawayService reserva proporcional
  // entre todos los almacenes del tenant, por eso no envía warehouse_id.
  const layaway = await processLayaway({
    shift_id: Number(cajaStore.turnoActivo.id),
    client_id: payload.clientId,
    terminal_id: cajaStore.turnoActivo.terminal_id ?? undefined,
    exchange_rate: tasaBCV.value,
    items: cart.value.map(i => ({
      product_id: i.id,
      qty: i.qty,
      unit_price_cents: Math.round(i.unitPrice * 100),
      pricing_mode: i.mode,
      conversion_factor: i.conversionFactor,
    })),
    initial_deposit_usd: payload.initialDepositUsd,
    expiration_days: payload.expirationDays,
    gavetero_id: payload.gaveteroId || undefined,
  });

  if (!layaway) return;

  showCheckout.value = false;
  successLayaway.value = layaway;
  await Promise.all([fetchParkedSales(), loadProducts()]);
}

function onCustomerSelected(customer: Customer | null) {
  selectCustomer(customer);
  showCustomerSelector.value = false;
}

/** Editar datos del cliente actual sin salir del checkout (CustomerFormModal en modo edición). */
function onCustomerEdited(customer: Customer) {
  selectCustomer(customer);
  showCustomerEditor.value = false;
}

function onNewSale() {
  successSale.value = null;
  successLayaway.value = null;
  cart.value = [];
  resetForNewSale();
}

// ── IndexedDB offline cache ──
const DB_NAME = 'efectivo360-pos';
const DB_VERSION = 1;
let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('parked_sales')) {
        db.createObjectStore('parked_sales', { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function syncOfflineParked() {
  try {
    const db = await openDB();
    const tx = db.transaction('parked_sales', 'readonly');
    const store = tx.objectStore('parked_sales');
    const all = await new Promise<any[]>((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
    });
    for (const item of all) {
      try {
        await createParkedSale(item);
        const delTx = db.transaction('parked_sales', 'readwrite');
        delTx.objectStore('parked_sales').delete(item.id);
      } catch {
        // server will reject duplicates, skip
      }
    }
  } catch { /* offline */ }
}

// Listen for online → sync
if (typeof window !== 'undefined') {
  window.addEventListener('online', syncOfflineParked);
}

// Online status
const isOnline = ref(navigator.onLine);
const updateOnlineStatus = () => { isOnline.value = navigator.onLine; };

const mobileTab = ref<'products' | 'cart' | 'payment'>('products');
const showCheckout = ref(false);
const showPOSSettings = ref(false);
const showMobileCart = ref(false);
const paymentMethods = ref<PaymentMethod[]>([]);
const showCierreCaja = ref(false);
const cart = ref<CartItem[]>([]);

// Variant selector
const showVariantModal = ref(false);
const selectedVariantProduct = ref<Product | null>(null);

// Weight/Volume calculator (PESO/VOLUMEN products)
const showWeightModal = ref(false);
const weightModalProduct = ref<Product | null>(null);
/** Index of the cart line being adjusted, or null when adding a brand-new one. */
const weightModalEditIndex = ref<number | null>(null);
const weightModalInitialQty = computed<number | null>(() => (
  weightModalEditIndex.value != null ? cart.value[weightModalEditIndex.value]?.qty ?? null : null
));
const weightModalProductInfo = computed<WeightModalProduct | null>(() => {
  const p = weightModalProduct.value;
  if (!p) return null;
  // Several PESO/VOLUMEN rows can now coexist for the same product (separate
  // weighed portions) — the cap for THIS row is what's left after every OTHER
  // row of the same product, not the product's raw available stock.
  const consumedByOtherRows = cart.value.reduce((sum, item, idx) => (
    idx !== weightModalEditIndex.value && item.productId === p.id && (item.mode === 'PESO' || item.mode === 'VOLUMEN')
      ? sum + item.qty
      : sum
  ), 0);
  return {
    id: p.id, name: p.name, image: p.image, barcode: p.barcode,
    sale_unit: p.sale_unit, price_usd: p.price_usd,
    maxStock: Math.max(0, p.availableStock - consumedByOtherRows),
  };
});

const categories = computed<Category[]>(() =>
  inventoryCategories.value.map((c, i) => ({
    id: c.id,
    name: c.name,
    icon: c.icon || ['📦', '👟', '🛒', '🥤', '🧀', '🥩', '🧃', '🍞', '🧴', '📚'][i % 10],
  }))
);

const products = computed<Product[]>(() =>
  inventoryProducts.value.map(p => {
    const priceUsd = (p.priceUsd ?? ((p.salePrice as number) || 0) / 100);
    const availStock = p.availableStock ?? p.totalStock ?? p.currentStock ?? 0;
    const totalStock = p.totalStock ?? p.currentStock ?? 0;
    const unitsPerPackage = p.unitsPerPackage ?? 1;
    return {
      id: p.id,
      name: p.effectiveName || p.name,
      sku: p.effectiveSku || p.sku,
      price_usd: priceUsd,
      stock: availStock,
      totalStock,
      availableStock: availStock,
      unitsPerPackage,
      barcode: p.effectiveSku || p.sku || p.barcode || undefined,
      image: String(p.imageUrl || p.image || p.image_url || ''),
      category_id: p.categoryId as string,
      brandName: p.brandName || '',
      categoryName: p.categoryName || '',
      sale_unit: p.saleUnit || 'UNIDAD',
      hasVariants: p.hasVariants ?? false,
      variants: (p.variants || []).map(v => ({
        id: v.id,
        sku: v.sku,
        barcode: v.barcode,
        stock: v.stock,
        price_base: v.price_base,
        display_name: v.display_name,
        formatted_attributes: v.formatted_attributes,
        attribute_values: v.attribute_values,
      })),

    };
  })
);

const filteredProducts = computed(() => {
  let list = products.value;
  if (selectedCategoryId.value) list = list.filter((p) => p.category_id === selectedCategoryId.value);
  const q = searchQuery.value.toLowerCase().trim();
  if (q) list = list.filter((p) => p.name.toLowerCase().includes(q) || String(p.barcode ?? '').includes(q) || p.id.includes(q));
  return list;
});

const cartTotal = computed(() => cart.value.length);
const itemCount = computed(() => cart.value.reduce((sum, i) => sum + i.qty, 0));
const subtotalUSD = computed(() => cart.value.reduce((sum, i) => sum + i.unitPrice * i.qty, 0));
const totalUSD = computed(() => subtotalUSD.value);
const totalVES = computed(() => totalUSD.value * tasaBCV.value);

function formatStockBreakdown(totalUnits: number, unitsPerPackage: number = 1): string {
  if (!unitsPerPackage || unitsPerPackage <= 1) {
    return `${Math.round(totalUnits)} uds`;
  }
  const packages = Math.floor(totalUnits / unitsPerPackage);
  const remainder = totalUnits % unitsPerPackage;
  if (packages > 0 && remainder > 0) return `${packages} Bulto${packages > 1 ? 's' : ''} + ${Math.round(remainder)} Unid.`;
  if (packages > 0) return `${packages} Bulto${packages > 1 ? 's' : ''}`;
  return `${Math.round(remainder)} Unid.`;
}

function getCartAtomicConsumption(productId: string): number {
  return cart.value
    .filter(i => i.productId === productId)
    .reduce((sum, i) => sum + (i.qty * getItemAtomicUnits(i)), 0);
}

/** PESO/VOLUMEN products never add as a flat "1 unit" — they always go through the weight/volume calculator. */
function addToCart(p: Product, variant?: VariantData) {
  if (!variant && p.sale_unit && p.sale_unit !== 'UNIDAD') {
    openWeightModal(p);
    return;
  }

  const productId = p.id;
  const id = variant ? variant.id : p.id;
  const name = variant ? `${p.name} · ${variant.display_name}` : p.name;
  const price = variant ? parseFloat(variant.price_base || '0') : p.price_usd;
  const maxStock = variant ? variant.stock : p.availableStock;
  const unitsPerPackage = p.unitsPerPackage || 1;

  if (variant) {
    const variantConsumed = getCartVariantConsumption(variant.id);
    if (variantConsumed + 1 > variant.stock) {
      toast.warning(`Stock máximo alcanzado (${Math.round(variant.stock)} uds disponibles para esta variante)`);
      return;
    }
  } else {
    const atomicConsumed = getCartAtomicConsumption(productId);
    const requestedUnits = 1;
    if (atomicConsumed + requestedUnits > maxStock) {
      const remaining = maxStock - atomicConsumed;
      if (remaining <= 0) {
        toast.warning(`Stock máximo alcanzado (${Math.round(maxStock)} uds disponibles)`);
      } else {
        toast.warning(`Stock insuficiente: Quedan ${Math.round(remaining)} unidades disponibles (se requieren ${Math.round(requestedUnits)} para 1 Unidad)`);
      }
      return;
    }
  }

  const existing = cart.value.find((i) => i.id === id && i.mode === 'UNIDAD');
  if (existing) {
    existing.qty++;
    return;
  }
  if (maxStock <= 0) return;

  const variantLabel = variant
    ? variant.formatted_attributes?.map((a: any) => `${a.name}: ${a.value}`).join(' · ')
    : undefined;

  cart.value.push({
    id,
    productId,
    variantId: variant?.id,
    name,
    variantLabel,
    price_usd: price,
    qty: 1,
    stock: variant ? variant.stock : p.availableStock,
    maxStock,
    maxVariantStock: variant?.stock,
    unitsPerPackage,
    barcode: variant ? variant.sku : p.barcode,
    image: p.image || '',
    attrs: variant ? variant.attribute_values : undefined,
    mode: 'UNIDAD',
    unitPrice: price,
    conversionFactor: 1,
    unitLabel: 'Unidad',
    altUnitLabel: unitsPerPackage > 1 ? 'Bulto' : '',
  });
}

/** Opens the calculator — pre-filled for editing if this product already has a weight/volume line in the cart. */
/** Clicking the product (grid or scan) always opens the calculator for a NEW
 *  row — it never merges into an existing PESO/VOLUMEN line, so the same
 *  product can appear as separate portions (e.g. 0.500 Kg + 0.250 Kg). */
function openWeightModal(p: Product) {
  weightModalProduct.value = p;
  weightModalEditIndex.value = null;
  showWeightModal.value = true;
}

/** Re-opens the calculator for an existing weight/volume cart line (click on its qty in the ticket). */
function openWeightModalForEdit(index: number) {
  const item = cart.value[index];
  const p = products.value.find((x) => x.id === item.productId);
  if (!p) return;
  weightModalProduct.value = p;
  weightModalEditIndex.value = index;
  showWeightModal.value = true;
}

function closeWeightModal() {
  showWeightModal.value = false;
  weightModalProduct.value = null;
  weightModalEditIndex.value = null;
}

function confirmWeightEntry(qty: number) {
  const p = weightModalProduct.value;
  if (!p) return;

  if (weightModalEditIndex.value != null) {
    cart.value[weightModalEditIndex.value].qty = qty;
  } else {
    const mode = p.sale_unit === 'VOLUMEN' ? 'VOLUMEN' : 'PESO';
    cart.value.push({
      id: p.id,
      cartItemId: generateCartItemId(),
      productId: p.id,
      name: p.name,
      price_usd: p.price_usd,
      qty,
      stock: p.availableStock,
      maxStock: p.availableStock,
      unitsPerPackage: 1,
      barcode: p.barcode,
      image: p.image || '',
      mode,
      sale_unit: p.sale_unit,
      unitPrice: p.price_usd,
      conversionFactor: 1,
      unitLabel: unitsLabelFor(p.sale_unit),
      altUnitLabel: '',
    });
  }
  closeWeightModal();
}

function addItem(p: Product) {
  if (p.availableStock <= 0 && !p.hasVariants) return;
  if (p.hasVariants && p.variants.length > 0) {
    selectedVariantProduct.value = p;
    showVariantModal.value = true;
    return;
  }
  addToCart(p);
}

function onVariantSelected(v: VariantData) {
  if (!selectedVariantProduct.value) return;
  addToCart(selectedVariantProduct.value, v);
  showVariantModal.value = false;
  selectedVariantProduct.value = null;
}

function handleSearchEnter() {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return;

  // Try exact match on variant SKU/barcode
  for (const p of products.value) {
    if (!p.hasVariants || !p.variants) continue;
    const match = p.variants.find(v =>
      v.sku.toLowerCase() === q || v.barcode.toLowerCase() === q
    );
    if (match) {
      if (match.stock <= 0) {
        toast.warning(`Variante sin stock disponible`);
        return;
      }
      const variantConsumed = getCartVariantConsumption(match.id);
      if (variantConsumed + 1 > match.stock) {
        toast.warning(`Stock máximo alcanzado (${Math.round(match.stock)} uds disponibles para esta variante)`);
        return;
      }
      addToCart(p, match);
      searchQuery.value = '';
      return;
    }
  }

  // Try exact match on parent SKU/barcode
  const parent = products.value.find(p =>
    (p.sku && p.sku.toLowerCase() === q) ||
    (p.barcode && p.barcode.toLowerCase() === q)
  );
  if (parent) {
    addItem(parent);
    searchQuery.value = '';
  }
}

function togglePricingMode(index: number) {
  const item = cart.value[index];
  const p = products.value.find(x =>
    x.id === item.id || x.variants?.some(v => v.id === item.id)
  );
  const unitsPerPackage = p?.unitsPerPackage || 1;
  if (unitsPerPackage <= 1) return;

  const isCurrentlyBulto = item.mode === 'BULTO';
  const newMode = isCurrentlyBulto ? 'UNIDAD' : 'BULTO';
  const newUnitPrice = newMode === 'BULTO' ? ((p?.price_usd ?? 0) * unitsPerPackage) : (p?.price_usd ?? item.unitPrice);

  const atomicConsumed = getCartAtomicConsumption(item.productId);
  const atomicInCart = item.qty * getItemAtomicUnits(item);
  const atomicWithout = atomicConsumed - atomicInCart;
  const requestedUnits = newMode === 'BULTO' ? unitsPerPackage : 1;
  if (atomicWithout + (item.qty * requestedUnits) > item.maxStock) {
    toast.warning(`No hay suficiente stock para cambiar a ${newMode === 'BULTO' ? 'Bulto' : 'Unidad'}`);
    return;
  }

  item.mode = newMode;
  item.unitPrice = newUnitPrice;
  item.unitLabel = newMode === 'BULTO' ? 'Bulto' : 'Unidad';
  item.altUnitLabel = newMode === 'BULTO' ? 'Unidad' : 'Bulto';
  item.conversionFactor = newMode === 'BULTO' ? unitsPerPackage : 1;
  item.price_usd = item.unitPrice;
}

function removeItem(index: number) { cart.value.splice(index, 1); }
function qtyUp(index: number) {
  const item = cart.value[index];
  if (item.variantId) {
    const variantConsumed = getCartVariantConsumption(item.variantId);
    const maxStock = item.maxVariantStock ?? item.maxStock;
    if (variantConsumed + 1 > maxStock) {
      toast.warning(`Stock máximo alcanzado (${Math.round(maxStock)} uds disponibles para esta variante)`);
      return;
    }
  } else {
    const atomicConsumed = getCartAtomicConsumption(item.productId);
    const requestedUnits = getItemAtomicUnits(item);
    if (atomicConsumed + requestedUnits > item.maxStock) {
      const remaining = item.maxStock - atomicConsumed;
      if (remaining <= 0) {
        toast.warning(`Stock máximo alcanzado (${Math.round(item.maxStock)} uds disponibles)`);
      } else {
        toast.warning(`Stock insuficiente: Quedan ${Math.round(remaining)} unidades disponibles (se requieren ${Math.round(requestedUnits)} para 1 ${item.unitLabel})`);
      }
      return;
    }
  }
  item.qty++;
}
function qtyDown(index: number) {
  const item = cart.value[index];
  if (item.qty <= 1) removeItem(index);
  else item.qty--;
}

const _colorHues = [
  'bg-blue-50 text-blue-600 border-blue-200 hover:border-blue-300',
  'bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-300',
  'bg-cyan-50 text-cyan-600 border-cyan-200 hover:border-cyan-300',
  'bg-emerald-50 text-emerald-600 border-emerald-200 hover:border-emerald-300',
  'bg-rose-50 text-rose-600 border-rose-200 hover:border-rose-300',
  'bg-violet-50 text-violet-600 border-violet-200 hover:border-violet-300',
  'bg-orange-50 text-orange-600 border-orange-200 hover:border-orange-300',
  'bg-teal-50 text-teal-600 border-teal-200 hover:border-teal-300',
];

function categoryPillClass(cat: Category): string {
  const active = selectedCategoryId.value === cat.id;
  if (active) return 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-transparent shadow-md';
  const idx = inventoryCategories.value.findIndex(c => c.id === cat.id);
  return _colorHues[idx % _colorHues.length] || 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300';
}

function filterByCategory(id: string | null) {
  selectedCategoryId.value = selectedCategoryId.value === id ? null : id;
  showCategorySidebar.value = false;
}

function productCountForCategory(cat: Category): number {
  return products.value.filter((p) => p.category_id === cat.id).length;
}

async function openCheckout() {
  if (cart.value.length === 0) return;
  if (paymentMethods.value.length === 0) {
    paymentMethods.value = await fetchPaymentMethods(true);
  }
  console.log('Métodos de pago recibidos del Backend:', paymentMethods.value);
  showCheckout.value = true;
}

function onTopUpConfirm(_pkg: unknown, _code: string) {
  showTopUp.value = false;
}

function formatVES(n: number): string {
  return n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
/** PESO/VOLUMEN ticket lines carry a decimal qty (e.g. 0.425 Kg) — up to 3 decimals. */
function formatCartQty(n: number): string {
  return (n || 0).toLocaleString('es', { minimumFractionDigits: 0, maximumFractionDigits: 3 });
}

const dataLoading = computed(() => invLoading.value.products || invLoading.value.categories);

onMounted(async () => {
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  await Promise.all([
    loadCategories(),
    loadProducts(),
    fetchForexRate(),
    loadDefaultWarehouse(),
  ]);
  fetchParkedSales();
  fetchPaymentMethods(true).then(methods => { paymentMethods.value = methods; });

  // 1-second local tick for countdown display (no HTTP)
  parkedTimerInterval.value = window.setInterval(tickTimers, 1000);

  // Background refresh every 30 seconds to sync with server
  parkedRefreshInterval.value = window.setInterval(fetchParkedSales, 30_000);
});

onUnmounted(() => {
  if (parkedTimerInterval.value) {
    clearInterval(parkedTimerInterval.value);
    parkedTimerInterval.value = null;
  }
  if (parkedRefreshInterval.value) {
    clearInterval(parkedRefreshInterval.value);
    parkedRefreshInterval.value = null;
  }
  window.removeEventListener('online', updateOnlineStatus);
  window.removeEventListener('offline', updateOnlineStatus);
});

const mobileTabs = [
  { key: 'products' as const, label: 'Productos', icon: ShoppingBag },
  { key: 'cart' as const, label: 'Carrito', icon: ShoppingBag },
];
</script>

<style scoped>
</style>
