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
              class="w-full h-10 pl-10 pr-20 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 shadow-sm transition-shadow" />
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
              <span class="hidden sm:inline">Grid</span>
            </button>
            <button @click="currentLayout = 'traditional'"
              class="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all"
              :class="currentLayout === 'traditional' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'">
              <List class="w-3 h-3" />
              <span class="hidden sm:inline">Lista</span>
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
              class="bg-white border border-slate-300 rounded-xl p-2.5 flex gap-2.5 shadow-sm hover:shadow-md hover:border-blue-400 transition-all cursor-pointer group relative overflow-hidden text-left">
              <div class="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden relative">
                <div class="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <span class="absolute top-0 left-0 bg-slate-900/80 text-white text-[8px] font-bold px-1 rounded-br-md leading-tight">{{ p.stock ?? '—' }}</span>
              </div>
              <div class="flex flex-col justify-between flex-1 min-w-0">
                <div>
                  <h4 class="text-[11px] font-bold text-slate-800 truncate leading-tight group-hover:text-blue-600 transition-colors">{{ p.name }}</h4>
                  <p class="text-[9px] text-slate-400 truncate mt-0.5">Stock: {{ p.stock ?? 0 }} uds</p>
                </div>
                <div class="flex justify-between items-baseline mt-0.5">
                  <span class="text-xs font-black text-slate-900">${{ formatUSD(p.price_usd) }}</span>
                  <span class="text-[9px] font-medium text-slate-400 font-mono">Bs.{{ formatVES(p.price_usd * tasaBCV) }}</span>
                </div>
              </div>
            </button>
          </div>

          <!-- ═══════ TRADITIONAL LAYOUT (Table) ═══════ -->
          <div v-else class="overflow-x-auto">
            <table class="w-full text-xs border-collapse">
              <thead>
                <tr class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th class="text-left py-2 px-2 w-24">Código</th>
                  <th class="text-left py-2 px-2">Producto</th>
                  <th class="text-left py-2 px-2 w-20">Categoría</th>
                  <th class="text-center py-2 px-2 w-16">Stock</th>
                  <th class="text-right py-2 px-2 w-20">Precio USD</th>
                  <th class="text-right py-2 px-2 w-24">Precio Bs</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in filteredProducts" :key="p.id" @click="addItem(p)"
                  class="border-b border-slate-100 hover:bg-blue-50/60 cursor-pointer transition-colors group">
                  <td class="py-1.5 px-2 font-mono text-[10px] text-slate-400 truncate max-w-[6rem]">
                    {{ p.barcode || p.id.slice(0, 8) || '—' }}
                  </td>
                  <td class="py-1.5 px-2 font-semibold text-slate-800 truncate max-w-[12rem] group-hover:text-blue-600 transition-colors">
                    {{ p.name }}
                  </td>
                  <td class="py-1.5 px-2 text-slate-500 truncate max-w-[6rem]">
                    {{ categories.find(c => c.id === p.category_id)?.name || '—' }}
                  </td>
                  <td class="py-1.5 px-2 text-center">
                    <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                      :class="(p.stock ?? 0) === 0
                        ? 'bg-red-100 text-red-700'
                        : (p.stock ?? 0) <= 5
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'">
                      {{ p.stock ?? 0 }}
                    </span>
                  </td>
                  <td class="py-1.5 px-2 text-right font-semibold text-slate-900">
                    ${{ formatUSD(p.price_usd) }}
                  </td>
                  <td class="py-1.5 px-2 text-right font-mono text-slate-500">
                    Bs.{{ formatVES(p.price_usd * tasaBCV) }}
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
            <button class="flex-1 h-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-[0.98] shadow-md group">
              <span class="text-xl group-hover:scale-110 transition-transform">👤</span>
              <span class="text-[10px] font-black tracking-wider text-slate-600 uppercase">Clientes</span>
            </button>
            <button class="flex-1 h-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-[0.98] shadow-md group">
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
              <p class="text-3xl font-black text-white tracking-tight">${{ formatUSD(totalUSD) }}</p>
              <p class="text-xs text-blue-100 font-medium font-mono mt-0.5">Bs.{{ formatVES(totalVES) }}</p>
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
            <div v-for="(item, i) in cart" :key="item.id + item.pricingMode + (item.attrs ? JSON.stringify(item.attrs) : '')"
              class="bg-white border border-slate-200 rounded-xl p-2.5 shadow-sm flex items-center justify-between hover:border-slate-300 transition-all text-slate-800">
              <div class="flex items-center gap-2 min-w-0 flex-1">
                <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs border border-slate-200">
                  {{ item.name.charAt(0).toUpperCase() }}
                </div>
                <div class="min-w-0 flex-1">
                  <h4 class="text-xs font-bold text-slate-800 truncate leading-tight">{{ item.name }}</h4>
                  <div class="flex items-center gap-1.5 mt-0.5">
                    <span class="text-[10px] text-slate-400 font-bold">${{ formatUSD(item.unitPrice) }}</span>
                    <span class="text-[9px] text-slate-300">·</span>
                    <span class="text-[9px] text-slate-400 font-medium">Bs.{{ formatVES(item.unitPrice * tasaBCV) }}</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-1.5">
                <!-- Mayor/Detal Toggle -->
                <button v-if="item.conversionFactor !== 1 || item.altUnitLabel"
                  @click="togglePricingMode(i)"
                  class="shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider transition-all"
                  :class="item.pricingMode === 'wholesale'
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'bg-emerald-100 border-emerald-300 text-emerald-700'"
                  :title="'Cambiar a ' + item.altUnitLabel">
                  {{ item.unitLabel }}
                </button>
                <div class="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
                  <button @click="qtyDown(i)"
                    class="w-5 h-5 flex items-center justify-center text-xs font-black bg-white hover:bg-slate-200 text-slate-600 rounded-md border border-slate-300 shadow-sm transition-all active:scale-90">−</button>
                  <span class="w-6 text-center text-xs font-black text-slate-800">{{ item.qty }}</span>
                  <button @click="qtyUp(i)"
                    class="w-5 h-5 flex items-center justify-center text-xs font-black bg-white hover:bg-slate-200 text-slate-600 rounded-md border border-slate-300 shadow-sm transition-all active:scale-90">+</button>
                </div>
                <div class="flex items-center gap-2 pl-1">
                  <span class="text-xs font-black text-slate-800">${{ formatUSD(item.unitPrice * item.qty) }}</span>
                  <button @click="removeItem(i)"
                    class="text-slate-300 hover:text-rose-500 transition-colors text-xs p-1">
                    <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>

        <!-- Hold / Resume buttons -->
        <div v-if="heldSales.length > 0" class="mb-1.5">
          <div class="flex flex-wrap gap-1.5">
            <button v-for="(sale, i) in heldSales" :key="sale.id" @click="resumeSale(i)"
              class="flex items-center gap-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-2 py-1 text-[10px] font-semibold text-white transition-all backdrop-blur-sm">
              <PlayCircle class="w-3 h-3 text-emerald-300" />
              <span>{{ sale.timestamp }}</span>
              <span class="text-blue-200 font-mono">${{ formatUSD(sale.total) }}</span>
            </button>
          </div>
        </div>

        <!-- Customer + Charge row -->
        <div class="space-y-2.5 pt-2 border-t border-white/10">
          <div class="flex items-center justify-between bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-xs">
            <span class="text-blue-100 font-medium">Cliente:</span>
            <span v-if="!selectedCustomer" class="font-bold text-white">Consumidor Final 👤</span>
            <span v-else class="font-bold text-white">{{ selectedCustomer.name }}</span>
          </div>
          <div class="flex gap-2">
            <button @click="pauseCurrentSale" :disabled="cart.length === 0"
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
      <span class="text-xs font-semibold text-white/80 ml-1">${{ formatUSD(totalUSD) }}</span>
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
            <div v-for="(item, i) in cart" :key="'mob-' + item.id + item.pricingMode + (item.attrs ? JSON.stringify(item.attrs) : '')"
              class="bg-slate-50 rounded-xl p-3 flex items-center justify-between">
              <div class="flex-1 min-w-0 pr-2">
                <h4 class="text-sm font-bold text-slate-800 truncate">{{ item.name }}</h4>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <span class="text-[11px] text-slate-400 font-semibold">${{ formatUSD(item.unitPrice) }}</span>
                  <span class="text-[9px] text-slate-300">·</span>
                  <span class="text-[10px] text-slate-400">Bs.{{ formatVES(item.unitPrice * tasaBCV) }}</span>
                </div>
              </div>
              <div class="flex items-center gap-1.5">
                <button v-if="item.conversionFactor !== 1 || item.altUnitLabel"
                  @click="togglePricingMode(i)"
                  class="shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider transition-all"
                  :class="item.pricingMode === 'wholesale'
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'bg-emerald-100 border-emerald-300 text-emerald-700'"
                  :title="'Cambiar a ' + item.altUnitLabel">
                  {{ item.unitLabel }}
                </button>
                <div class="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <button @click="qtyDown(i)" class="px-2 py-0.5 text-slate-500 hover:bg-slate-100 text-sm font-bold">−</button>
                  <span class="px-2.5 text-sm font-bold text-slate-700">{{ item.qty }}</span>
                  <button @click="qtyUp(i)" class="px-2 py-0.5 text-slate-500 hover:bg-slate-100 text-sm font-bold">+</button>
                </div>
                <div class="text-right min-w-[68px]">
                  <p class="text-sm font-bold text-slate-800">${{ formatUSD(item.unitPrice * item.qty) }}</p>
                </div>
                <button @click="removeItem(i)" class="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors">
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
          <div class="shrink-0 border-t border-slate-100 px-4 py-3 space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-sm font-semibold text-slate-600">Total</span>
              <div class="text-right">
                <p class="text-lg font-black text-slate-900">${{ formatUSD(totalUSD) }}</p>
                <p class="text-[11px] text-slate-400 font-mono">Bs.{{ formatVES(totalVES) }}</p>
              </div>
            </div>
            <div class="flex gap-2">
              <button @click="pauseCurrentSale(); showMobileCart = false" :disabled="cart.length === 0"
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
                COBRAR — ${{ formatUSD(totalUSD) }}
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

    <!-- ═══════ CUSTOMER MODAL ═══════ -->
    <Teleport to="body">
      <div v-if="showCustomerModal" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="showCustomerModal = false" />
        <div class="relative w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-bold text-slate-900">Nuevo Cliente</h3>
            <button @click="showCustomerModal = false" class="p-1 rounded-lg hover:bg-slate-100 transition-colors">
              <X class="w-4 h-4 text-slate-400" />
            </button>
          </div>
          <div class="space-y-3">
            <RifInput v-model="newCustomerRif" placeholder="RIF / Cédula" />
            <input v-model="newCustomerName" type="text" placeholder="Nombre completo"
              class="w-full h-10 px-3.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400" />
            <PhoneInput v-model="newCustomerPhone" />
            <input v-model="newCustomerEmail" type="email" placeholder="Correo electrónico (opcional)"
              class="w-full h-10 px-3.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400" />
          </div>
          <div class="flex justify-end gap-2.5 mt-4">
            <button @click="showCustomerModal = false"
              class="px-4 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">Cancelar</button>
            <button @click="saveNewCustomer" :disabled="!newCustomerName || !newCustomerRif"
              class="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 disabled:from-slate-300 disabled:to-slate-300 rounded-xl hover:from-emerald-500 hover:to-teal-500 transition-all shadow-md disabled:shadow-none">Guardar</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ═══════ CHECKOUT MODAL ═══════ -->
    <CheckoutModal
      v-if="showCheckout"
      :total-usd="totalUSD"
      :total-ves="totalVES"
      :tasa-bcv="tasaBCV"
      @confirm="onCheckoutConfirm"
      @close="showCheckout = false"
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
  Search, X, User, ShoppingBag, Trash2,
  CreditCard, PackageSearch, PauseCircle, PlayCircle, Wifi, WifiOff,
  ScanBarcode, ScanLine, LayoutGrid, List,
  ListTree, Ticket,
} from 'lucide-vue-next';
import BarcodeScanner from '@/components/shared/BarcodeScanner.vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useCajaStore } from '@/stores/caja';
import { useForexRate } from '@/composables/useForexRate';
import { useInventory } from '@/modules/inventory/composables/useInventory';
import { useTenantMetadata } from '@/composables/useTenantMetadata';
import RifInput from '@/components/shared/RifInput.vue';
import PhoneInput from '@/components/shared/PhoneInput.vue';
import CheckoutModal from './CheckoutModal.vue';
import TransactionTopUpModal from '@/components/modals/TransactionTopUpModal.vue';
import CierreCaja from './CierreCaja.vue';

const authStore = useAuthStore();
const cajaStore = useCajaStore();
const tenantLogo = computed(() => authStore.user?.tenant_logo || null);
const tenantCommercialName = computed(() => authStore.user?.tenant_commercial_name || authStore.user?.tenant_name || '');

const {
  ticketsDisponibles, esIlimitado, sinVencimiento,
  canCharge, consumirTicket, persistTickets,
} = useTenantMetadata();
const showTopUp = ref(false);

const { rateValue: tasaBCV, fetchForexRate } = useForexRate();
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
  name: string;
  price_usd: number;
  qty: number;
  stock?: number;
  barcode?: string;
  attrs?: Record<string, string>;
  /** Modo de venta: 'retail' (unidad/detal) o 'wholesale' (bulto/mayor) */
  pricingMode: 'retail' | 'wholesale';
  /** Precio por unidad o por bulto según pricingMode */
  unitPrice: number;
  /** Unidades que contiene cada bulto (1 si es detal) */
  conversionFactor: number;
  /** Etiqueta de la unidad actual ('Unidad' | 'Bulto') */
  unitLabel: string;
  /** Etiqueta alternativa */
  altUnitLabel: string;
}

interface Product {
  id: string;
  name: string;
  price_usd: number;
  stock?: number;
  barcode?: string;
  category_id?: string;
  /** Precio por bulto (mayor), si aplica */
  wholesalePrice?: number;
  /** Unidades por bulto (ej: 24) */
  wholesaleQty?: number;
  /** Nombre del empaque mayor (ej: 'Bulto', 'Caja') */
  wholesaleLabel?: string;
}

interface Customer {
  id: number;
  name: string;
  rif: string;
  phone?: string;
  email?: string;
  isWholesale?: boolean;
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

const selectedCustomer = ref<Customer | null>(null);
const showCustomerModal = ref(false);
const newCustomerRif = ref('');
const newCustomerName = ref('');
const newCustomerPhone = ref('');
const newCustomerEmail = ref('');

// Barcode scanner
const scanning = ref(false);
const lastScanned = ref<string | null>(null);

function toggleScanner() { scanning.value = !scanning.value; }

// Layout toggle
const currentLayout = ref<'modern' | 'traditional'>('modern');

// Hold / Resume
const heldSales = ref<{ id: number; items: CartItem[]; timestamp: string; total: number }[]>([]);

const pauseCurrentSale = () => {
  if (cart.value.length === 0) return;
  heldSales.value.push({
    id: Date.now(),
    items: [...cart.value],
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    total: subtotalUSD.value,
  });
  cart.value = [];
};

const resumeSale = (index: number) => {
  if (cart.value.length > 0) {
    const tmp = [...cart.value];
    cart.value = heldSales.value[index].items;
    heldSales.value[index].items = tmp;
    heldSales.value[index].id = Date.now();
  } else {
    cart.value = heldSales.value[index].items;
    heldSales.value.splice(index, 1);
  }
};

// Online status
const isOnline = ref(navigator.onLine);
const updateOnlineStatus = () => { isOnline.value = navigator.onLine; };

const mobileTab = ref<'products' | 'cart' | 'payment'>('products');
const showCheckout = ref(false);
const showMobileCart = ref(false);
const showCierreCaja = ref(false);
const cart = ref<CartItem[]>([]);

const categories = computed<Category[]>(() =>
  inventoryCategories.value.map((c, i) => ({
    id: c.id,
    name: c.name,
    icon: c.icon || ['📦', '👟', '🛒', '🥤', '🧀', '🥩', '🧃', '🍞', '🧴', '📚'][i % 10],
  }))
);

const products = computed<Product[]>(() =>
  inventoryProducts.value.map(p => {
    const retailPrice = ((p.salePrice as number) || 0) / 100;
    const stock = p.currentStock as number;
    const hasWholesale = stock >= 10 && retailPrice > 0.5;
    return {
      id: p.id,
      name: p.name,
      price_usd: retailPrice,
      stock,
      barcode: p.barcode as string | undefined,
      category_id: p.categoryId as string,
      wholesalePrice: hasWholesale ? retailPrice * 12 : undefined,
      wholesaleQty: hasWholesale ? 12 : undefined,
      wholesaleLabel: hasWholesale ? 'Bulto' : undefined,
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

function addItem(p: Product) {
  const existing = cart.value.find((i) => i.id === p.id && i.pricingMode === (p.wholesaleQty && selectedCustomer.value?.isWholesale ? 'wholesale' : 'retail'));
  if (existing) {
    existing.qty++;
    return;
  }
  const useWholesale = !!(p.wholesaleQty && selectedCustomer.value?.isWholesale);
  cart.value.push({
    ...p,
    qty: 1,
    pricingMode: useWholesale ? 'wholesale' : 'retail',
    unitPrice: useWholesale ? (p.wholesalePrice ?? p.price_usd) : p.price_usd,
    conversionFactor: useWholesale ? (p.wholesaleQty ?? 1) : 1,
    unitLabel: useWholesale ? (p.wholesaleLabel ?? 'Bulto') : 'Unidad',
    altUnitLabel: useWholesale ? 'Unidad' : (p.wholesaleLabel ?? 'Bulto'),
  });
}

function togglePricingMode(index: number) {
  const item = cart.value[index];
  const p = products.value.find(x => x.id === item.id);
  if (!p?.wholesaleQty) return;
  const isCurrentlyWholesale = item.pricingMode === 'wholesale';
  item.pricingMode = isCurrentlyWholesale ? 'retail' : 'wholesale';
  item.unitPrice = isCurrentlyWholesale ? p.price_usd : (p.wholesalePrice ?? p.price_usd);
  item.conversionFactor = isCurrentlyWholesale ? 1 : p.wholesaleQty;
  item.unitLabel = isCurrentlyWholesale ? 'Unidad' : (p.wholesaleLabel ?? 'Bulto');
  item.altUnitLabel = isCurrentlyWholesale ? (p.wholesaleLabel ?? 'Bulto') : 'Unidad';
  item.price_usd = item.unitPrice;
}

function removeItem(index: number) { cart.value.splice(index, 1); }
function qtyUp(index: number) { cart.value[index].qty++; }
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

function saveNewCustomer() {
  if (!newCustomerName.value || !newCustomerRif.value) return;
  selectedCustomer.value = {
    id: Date.now(),
    name: newCustomerName.value,
    rif: newCustomerRif.value,
    phone: newCustomerPhone.value || undefined,
    email: newCustomerEmail.value || undefined,
  };
  newCustomerName.value = '';
  newCustomerRif.value = '';
  newCustomerPhone.value = '';
  newCustomerEmail.value = '';
  showCustomerModal.value = false;
}

function openCheckout() { if (cart.value.length > 0) showCheckout.value = true; }

function onCheckoutConfirm() {
  consumirTicket();
  persistTickets();
  const payload = {
    items: cart.value.map(i => ({
      product_id: i.id,
      qty: i.qty,
      unit_price_cents: Math.round(i.unitPrice * 100),
      pricing_mode: i.pricingMode,
      conversion_factor: i.conversionFactor,
    })),
    currency: 'USD',
    total_usd: subtotalUSD.value,
  };
  console.log('[venta]', payload);
  showCheckout.value = false;
  cart.value = [];
}

function onTopUpConfirm(_pkg: unknown, _code: string) {
  showTopUp.value = false;
}

function formatUSD(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatVES(n: number): string {
  return n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const dataLoading = computed(() => invLoading.value.products || invLoading.value.categories);

onMounted(async () => {
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
    await Promise.all([
    loadCategories(),
    loadProducts(),
    fetchForexRate(),
  ]);
});

onUnmounted(() => {
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
