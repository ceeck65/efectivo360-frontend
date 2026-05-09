<template>
  <div class="space-y-6 p-6">
    <!-- Header -->
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          <Shield class="h-8 w-8 text-cyan-500" />
          Consola de Super-Admin
        </h1>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Gestiona la infraestructura de Efectivo 360: tipos de negocio, categorías y blueprints.
        </p>
      </div>
      <div class="flex gap-2">
        <button
          @click="loadAllData"
          :disabled="loading"
          class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 dark:text-slate-300 dark:border-white/[0.06] dark:hover:bg-[#1a1f2e]"
        >
          <RefreshCw :class="['h-4 w-4', loading && 'animate-spin']" />
          Recargar
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="relative overflow-hidden rounded-xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-slate-50/90 p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.7)_inset,0_12px_40px_-12px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-white/[0.07] dark:from-[#141824] dark:via-[#111620] dark:to-[#0c0f16] dark:shadow-[0_0_0_1px_rgba(56,189,248,0.06),0_20px_50px_-15px_rgba(0,0,0,0.55)]">
        <div class="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[3px] bg-gradient-to-r opacity-95 from-cyan-500/90 via-blue-500/70 to-indigo-600/50" />
        <div class="relative z-[2] flex items-center justify-between">
          <div>
            <p class="text-[11px] font-semibold uppercase leading-snug tracking-[0.12em] text-slate-500 dark:text-slate-400">Blueprints</p>
            <p class="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{{ blueprints.length }}</p>
          </div>
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/12 text-cyan-600 ring-1 ring-cyan-500/25 dark:bg-cyan-500/10 dark:text-cyan-300 dark:ring-cyan-400/30">
            <Building2 class="h-[18px] w-[18px]" stroke-width="1.5" />
          </div>
        </div>
      </div>

      <div class="relative overflow-hidden rounded-xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-slate-50/90 p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.7)_inset,0_12px_40px_-12px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-white/[0.07] dark:from-[#141824] dark:via-[#111620] dark:to-[#0c0f16] dark:shadow-[0_0_0_1px_rgba(56,189,248,0.06),0_20px_50px_-15px_rgba(0,0,0,0.55)]">
        <div class="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[3px] bg-gradient-to-r opacity-95 from-emerald-500/90 via-green-500/70 to-teal-600/50" />
        <div class="relative z-[2] flex items-center justify-between">
          <div>
            <p class="text-[11px] font-semibold uppercase leading-snug tracking-[0.12em] text-slate-500 dark:text-slate-400">Categorías</p>
            <p class="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{{ totalCategories }}</p>
          </div>
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-600 ring-1 ring-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/30">
            <Boxes class="h-[18px] w-[18px]" stroke-width="1.5" />
          </div>
        </div>
      </div>

      <div class="relative overflow-hidden rounded-xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-slate-50/90 p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.7)_inset,0_12px_40px_-12px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-white/[0.07] dark:from-[#141824] dark:via-[#111620] dark:to-[#0c0f16] dark:shadow-[0_0_0_1px_rgba(56,189,248,0.06),0_20px_50px_-15px_rgba(0,0,0,0.55)]">
        <div class="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[3px] bg-gradient-to-r opacity-95 from-purple-500/90 via-violet-500/70 to-indigo-600/50" />
        <div class="relative z-[2] flex items-center justify-between">
          <div>
            <p class="text-[11px] font-semibold uppercase leading-snug tracking-[0.12em] text-slate-500 dark:text-slate-400">Atributos</p>
            <p class="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{{ totalAttributes }}</p>
          </div>
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/12 text-purple-600 ring-1 ring-purple-500/25 dark:bg-purple-500/10 dark:text-purple-300 dark:ring-purple-400/30">
            <Tags class="h-[18px] w-[18px]" stroke-width="1.5" />
          </div>
        </div>
      </div>

      <div class="relative overflow-hidden rounded-xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-slate-50/90 p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.7)_inset,0_12px_40px_-12px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-white/[0.07] dark:from-[#141824] dark:via-[#111620] dark:to-[#0c0f16] dark:shadow-[0_0_0_1px_rgba(56,189,248,0.06),0_20px_50px_-15px_rgba(0,0,0,0.55)]">
        <div class="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[3px] bg-gradient-to-r opacity-95 from-amber-500/90 via-orange-500/70 to-red-600/50" />
        <div class="relative z-[2] flex items-center justify-between">
          <div>
            <p class="text-[11px] font-semibold uppercase leading-snug tracking-[0.12em] text-slate-500 dark:text-slate-400">Tenants</p>
            <p class="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{{ tenantCount }}</p>
          </div>
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/12 text-amber-600 ring-1 ring-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/30">
            <Building class="h-[18px] w-[18px]" stroke-width="1.5" />
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="border-b border-slate-200 dark:border-white/[0.06]">
      <nav class="flex gap-8">
        <button
          @click="activeTab = 'blueprints'"
          :class="[
            'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
            activeTab === 'blueprints'
              ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          ]"
        >
          <div class="flex items-center gap-2">
            <Building2 class="h-4 w-4" />
            Tipos de Negocio
          </div>
        </button>
        <button
          @click="activeTab = 'categories'"
          :class="[
            'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
            activeTab === 'categories'
              ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          ]"
        >
          <div class="flex items-center gap-2">
            <Boxes class="h-4 w-4" />
            Categorías Inteligentes
          </div>
        </button>
        <button
          @click="activeTab = 'plans'"
          :class="[
            'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
            activeTab === 'plans'
              ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          ]"
        >
          <div class="flex items-center gap-2">
            <CreditCard class="h-4 w-4" />
            Planes
          </div>
        </button>
        <button
          @click="activeTab = 'modules'"
          :class="[
            'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
            activeTab === 'modules'
              ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          ]"
        >
          <div class="flex items-center gap-2">
            <Package class="h-4 w-4" />
            Módulos
          </div>
        </button>
        <button
          @click="activeTab = 'addons'"
          :class="[
            'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
            activeTab === 'addons'
              ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          ]"
        >
          <div class="flex items-center gap-2">
            <Target class="h-4 w-4" />
            Add-ons
          </div>
        </button>
        <button
          @click="activeTab = 'config'"
          :class="[
            'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
            activeTab === 'config'
              ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          ]"
        >
          <div class="flex items-center gap-2">
            <Settings class="h-4 w-4" />
            Panel de Blueprints
          </div>
        </button>
      </nav>
    </div>

    <!-- Tab Content -->
    <div class="min-h-[400px]">
      <!-- Blueprints Tab -->
      <div v-if="activeTab === 'blueprints'" class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="relative w-64">
            <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              v-model="blueprintSearch"
              type="text"
              placeholder="Buscar blueprints..."
              class="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
            />
          </div>
          <button
            @click="openCreateBlueprint"
            class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700"
          >
            <Plus class="h-4 w-4" />
            Nuevo Blueprint
          </button>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 shadow-sm dark:border-white/[0.06] dark:bg-[#141824]">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-slate-50/50 dark:bg-[#1a1f2e]/50">
                <tr>
                  <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Código</th>
                  <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Nombre</th>
                  <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Features</th>
                  <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Categorías</th>
                  <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Estado</th>
                  <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right dark:text-slate-400">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-white/[0.06]">
                <tr v-if="loading">
                  <td colspan="6" class="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                    <RefreshCw class="mx-auto mb-2 h-5 w-5 animate-spin" />
                    Cargando...
                  </td>
                </tr>
                <tr v-else-if="filteredBlueprints.length === 0">
                  <td colspan="6" class="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                    No hay blueprints para mostrar.
                  </td>
                </tr>
                <tr v-else v-for="bp in filteredBlueprints" :key="bp.id" class="hover:bg-slate-50/50 dark:hover:bg-[#1a1f2e]/50">
                  <td class="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">{{ bp.code }}</td>
                  <td class="px-6 py-4 font-medium text-slate-900 dark:text-white">{{ bp.name }}</td>
                  <td class="px-6 py-4">
                    <div class="flex flex-wrap gap-1">
                      <span v-for="feature in (bp.required_features || [])" :key="feature" class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {{ feature }}
                      </span>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{{ (bp.default_categories || []).length }}</td>
                  <td class="px-6 py-4">
                    <span :class="[
                      'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                      bp.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    ]">
                      {{ bp.is_active ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <button @click="openEditBlueprint(bp)" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" title="Editar Blueprint">
                        <Edit3 class="h-4 w-4" />
                      </button>
                      <button @click="toggleBlueprintActive(bp)" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" :title="bp.is_active ? 'Desactivar' : 'Activar'">
                        <Power class="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Categories Tab -->
      <div v-if="activeTab === 'categories'" class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="relative w-64">
            <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              v-model="categorySearch"
              type="text"
              placeholder="Buscar categorías..."
              class="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
            />
          </div>
          <button
            @click="openCreateCategory"
            class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
          >
            <Plus class="h-4 w-4" />
            Nueva Categoría
          </button>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 shadow-sm dark:border-white/[0.06] dark:bg-[#141824]">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-slate-50/50 dark:bg-[#1a1f2e]/50">
                <tr>
                  <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Nombre</th>
                  <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Código</th>
                  <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Blueprint</th>
                  <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Padre</th>
                  <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Estado</th>
                  <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right dark:text-slate-400">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-white/[0.06]">
                <tr v-if="loading">
                  <td colspan="6" class="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                    <RefreshCw class="mx-auto mb-2 h-5 w-5 animate-spin" />
                    Cargando...
                  </td>
                </tr>
                <tr v-else-if="filteredCategories.length === 0">
                  <td colspan="6" class="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                    No hay categorías para mostrar.
                  </td>
                </tr>
                <tr v-else v-for="cat in filteredCategories" :key="cat.id" class="hover:bg-slate-50/50 dark:hover:bg-[#1a1f2e]/50">
                  <td class="px-6 py-4 font-medium text-slate-900 dark:text-white">{{ cat.nombre }}</td>
                  <td class="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">{{ cat.code }}</td>
                  <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{{ getBlueprintName(cat.industry_blueprint_id) }}</td>
                  <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{{ cat.parent?.nombre || '-' }}</td>
                  <td class="px-6 py-4">
                    <span :class="[
                      'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                      cat.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    ]">
                      {{ cat.is_active ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <button @click="toggleCategoryActive(cat)" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" :title="cat.is_active ? 'Desactivar' : 'Activar'">
                        <Power class="h-4 w-4" />
                      </button>
                      <button @click="openEditCategory(cat)" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" title="Editar Categoría">
                        <Edit3 class="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Modules Tab -->
      <div v-if="activeTab === 'modules'" class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="relative w-64">
            <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              v-model="moduleSearch"
              type="text"
              placeholder="Buscar módulos..."
              class="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
            />
          </div>
          <div class="flex gap-2">
            <button
              @click="openCreateModule"
              class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
            >
              <Plus class="h-4 w-4" />
              Nuevo Módulo
            </button>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 shadow-sm dark:border-white/[0.06] dark:bg-[#141824]">
          <table class="w-full">
            <thead class="bg-slate-50 dark:bg-[#1a1f2e] border-b border-slate-200 dark:border-white/[0.06]">
              <tr>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">ULID</th>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Nombre</th>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Slug</th>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Descripción</th>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Estado</th>
                <th class="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="6" class="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                  Cargando...
                </td>
              </tr>
              <tr v-else-if="filteredModules.length === 0">
                <td colspan="6" class="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                  No hay módulos para mostrar.
                </td>
              </tr>
              <tr v-else v-for="module in filteredModules" :key="module.ulid" class="hover:bg-slate-50/50 dark:hover:bg-[#1a1f2e]/50">
                <td class="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">{{ module.ulid }}</td>
                <td class="px-6 py-4 font-medium text-slate-900 dark:text-white">{{ module.name }}</td>
                <td class="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">{{ module.slug }}</td>
                <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{{ module.description }}</td>
                <td class="px-6 py-4">
                  <span :class="[
                    'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                    module.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  ]">
                    {{ module.is_active ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button
                      @click="editModule(module)"
                      class="inline-flex items-center justify-center gap-1 h-8 w-8 text-sm text-slate-600 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400"
                    >
                      <Edit class="h-4 w-4" />
                    </button>
                    <button
                      @click="toggleModuleStatus(module)"
                      :class="[
                        'inline-flex items-center justify-center gap-1 h-8 w-8 text-sm',
                        module.is_active ? 'text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400' : 'text-slate-600 hover:text-green-600 dark:text-slate-400 dark:hover:text-green-400'
                      ]"
                    >
                      <Power class="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Plans Tab -->
      <div v-if="activeTab === 'plans'" class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="relative w-64">
            <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              v-model="planSearch"
              type="text"
              placeholder="Buscar planes..."
              class="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
            />
          </div>
          <div class="flex gap-2">
            <button
              @click="openCreatePlan"
              class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700"
            >
              <Plus class="h-4 w-4" />
              Nuevo Plan
            </button>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 shadow-sm dark:border-white/[0.06] dark:bg-[#141824]">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-slate-50/50 dark:bg-[#1a1f2e]/50">
                <tr>
                  <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">SKU</th>
                  <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Nombre</th>
                  <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Precio Mensual</th>
                  <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Límites</th>
                  <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Módulos</th>
                  <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Tenants</th>
                  <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right dark:text-slate-400">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-white/[0.06]">
                <tr v-if="loading">
                  <td colspan="7" class="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                    <RefreshCw class="mx-auto mb-2 h-5 w-5 animate-spin" />
                    Cargando...
                  </td>
                </tr>
                <tr v-else-if="filteredPlans.length === 0">
                  <td colspan="7" class="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                    No hay planes para mostrar.
                  </td>
                </tr>
                <tr v-else v-for="plan in filteredPlans" :key="plan.id" 
                    :class="[
                      'hover:bg-slate-50/50 dark:hover:bg-[#1a1f2e]/50',
                      !plan.is_active && 'opacity-50'
                    ]">
                  <td class="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">{{ plan.sku }}</td>
                  <td class="px-6 py-4">
                    <div class="font-medium text-slate-900 dark:text-white">{{ plan.name }}</div>
                    <div v-if="plan.description" class="text-sm text-slate-500 dark:text-slate-400">{{ plan.description }}</div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-sm font-medium text-slate-900 dark:text-white">
                      <span v-if="plan.config?.is_courtesy" class="text-green-600 font-medium">Gratis</span>
                      <div v-else class="space-y-1">
                        <div v-for="(price, frequency) in plan.prices" :key="String(frequency)" class="flex items-center gap-1">
                          <span class="font-medium">${{ price.amount }}</span>
                          <span class="text-xs text-slate-500 dark:text-slate-400">({{ getFrequencyLabel(String(frequency)) }})</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    <div class="space-y-1">
                      <div v-if="plan.config?.limits?.doc_limit !== undefined">
                        Documentos: {{ plan.config.limits.doc_limit === -1 ? 'Ilimitado' : plan.config.limits.doc_limit }}
                      </div>
                      <div v-if="plan.config?.limits?.vault_limit !== undefined">
                        Vault: {{ plan.config.limits.vault_limit === -1 ? 'Ilimitado' : plan.config.limits.vault_limit }}
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex flex-wrap gap-1">
                      <span v-for="moduleUlid in plan.config?.modules || []" :key="moduleUlid"
                        class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300">
                        {{ getModuleNameByUlid(moduleUlid) }}
                      </span>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{{ plan.tenant_count || 0 }}</td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <button
                        @click="editPlan(plan)"
                        class="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        title="Editar Plan"
                      >
                        <Edit class="h-4 w-4" />
                      </button>
                      <button
                        @click="togglePlanActive(plan)"
                        :class="[
                          'p-1',
                          plan.is_active ? 'text-green-600 hover:text-green-700' : 'text-slate-400 hover:text-slate-600'
                        ]"
                        :title="plan.is_active ? 'Desactivar' : 'Activar'"
                      >
                        <Power :class="['h-4 w-4', !plan.is_active && 'rotate-90']" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Add-ons Tab -->
      <div v-if="activeTab === 'addons'" class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="relative w-64">
            <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              v-model="addonSearch"
              type="text"
              placeholder="Buscar add-ons..."
              class="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
            />
          </div>
          <div class="flex gap-2">
            <button
              @click="openCreateAddon"
              :disabled="loading || isSaving"
              class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:opacity-50"
            >
              <Plus class="h-4 w-4" />
              Nuevo Add-on
            </button>
            <button
              @click="openAssignAddon"
              :disabled="loading || isSaving"
              class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              <Target class="h-4 w-4" />
              Asignar Add-on a Tenant
            </button>
          </div>
        </div>

        <!-- Assignment Form -->
        <div v-if="selectedTenant && selectedAddon" class="bg-white rounded-xl border border-slate-200 shadow-sm dark:border-white/[0.06] dark:bg-[#141824] p-6">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Asignar Add-on a Tenant</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tenant</label>
              <div class="text-sm text-slate-600 dark:text-slate-400">{{ selectedTenant.commercial_name || selectedTenant.name }} ({{ selectedTenant.slug }})</div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Add-on</label>
              <div class="text-sm text-slate-600 dark:text-slate-400">{{ selectedAddon.name }} ({{ selectedAddon.code }})</div>
            </div>
            <div v-if="selectedAddon.addon_type === 'CONSUMO'">
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cantidad de Unidades</label>
              <input
                v-model.number="assignAddonQuantity"
                type="number"
                min="1"
                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
              />
            </div>
          </div>
          <div class="flex justify-end gap-2 mt-4">
            <button
              @click="selectedTenant = null; selectedAddon = null"
              :disabled="isSaving"
              class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 dark:text-slate-300 dark:border-white/[0.06] dark:hover:bg-[#1a1f2e]"
            >
              Cancelar
            </button>
            <button
              @click="assignAddonToTenant"
              :disabled="isSaving"
              class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:opacity-50"
            >
              {{ isSaving ? 'Asignando...' : 'Asignar' }}
            </button>
          </div>
        </div>
        
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm dark:border-white/[0.06] dark:bg-[#141824]">
          <table class="w-full">
            <thead>
              <tr class="border-b border-slate-200 dark:border-white/[0.06]">
                <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Código</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nombre</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tipo</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Precio</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Unidades</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estado</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="7" class="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                  Cargando...
                </td>
              </tr>
              <tr v-else-if="filteredAddons.length === 0">
                <td colspan="7" class="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                  No hay add-ons para mostrar.
                </td>
              </tr>
              <tr v-else v-for="addon in filteredAddons" :key="addon.id" 
                  :class="[
                    'hover:bg-slate-50/50 dark:hover:bg-[#1a1f2e]/50',
                    !addon.is_active && 'opacity-50'
                  ]">
                <td class="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">{{ addon.code }}</td>
                <td class="px-6 py-4">
                  <div class="font-medium text-slate-900 dark:text-white">{{ addon.name }}</div>
                  <div class="text-xs text-slate-500 dark:text-slate-400">{{ addon.description }}</div>
                </td>
                <td class="px-6 py-4">
                  <span :class="[
                    'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
                    addon.addon_type === 'SERVICIO' 
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                      : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  ]">
                    {{ addon.addon_type }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">${{ addon.price }}</td>
                <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                  {{ addon.addon_type === 'CONSUMO' ? addon.units_included : '-' }}
                </td>
                <td class="px-6 py-4">
                  <span :class="addon.is_active ? 'inline-flex items-center px-2 py-1 rounded-full px-2.5 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'inline-flex items-center px-2 py-1 rounded-full px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400'">
                    {{ addon.is_active ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button 
                      @click="openEditAddon(addon)"
                      class="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      title="Editar"
                    >
                      <Edit3 class="h-4 w-4" />
                    </button>
                    <button 
                      @click="toggleAddonActive(addon)"
                      :class="[
                        'p-1',
                        addon.is_active ? 'text-green-600 hover:text-green-700' : 'text-slate-400 hover:text-slate-600'
                      ]"
                      :title="addon.is_active ? 'Desactivar' : 'Activar'"
                    >
                      <Power :class="['h-4 w-4', !addon.is_active && 'rotate-90']" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Config Tab -->
      <div v-if="activeTab === 'config'" class="space-y-6">
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm dark:border-white/[0.06] dark:bg-[#141824] p-6">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Configuración de Auto-Setup para Nuevos Tenants</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Define qué módulos y categorías se activan automáticamente cuando se crea un nuevo tenant según su tipo de negocio.
          </p>

          <div class="space-y-4">
            <div v-for="bp in blueprints" :key="bp.id" class="border border-slate-200 rounded-lg p-4 dark:border-white/[0.06]">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-3">
                  <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/12 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-300">
                    <Building2 class="h-5 w-5" />
                  </div>
                  <div>
                    <h4 class="font-medium text-slate-900 dark:text-white">{{ bp.name }}</h4>
                    <p class="text-xs text-slate-500 dark:text-slate-400">{{ bp.code }}</p>
                  </div>
                </div>
                <button
                  @click="toggleAutoConfig(bp)"
                  class="inline-flex items-center justify-center gap-2 h-8 px-3 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 dark:text-slate-300 dark:border-white/[0.06] dark:hover:bg-[#1a1f2e]"
                >
                  <Settings class="h-4 w-4" />
                  Configurar
                </button>
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Features Activados</label>
                  <div class="flex flex-wrap gap-1">
                    <span v-for="feature in (bp.required_features || [])" :key="feature" class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {{ feature }}
                    </span>
                    <span v-if="!bp.required_features || bp.required_features.length === 0" class="text-xs text-slate-400 italic">Ninguno</span>
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Categorías Iniciales</label>
                  <div class="flex flex-wrap gap-1">
                    <span v-for="cat in (bp.default_categories || []).slice(0, 3)" :key="cat" class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                      {{ cat }}
                    </span>
                    <span v-if="(bp.default_categories || []).length > 3" class="text-xs text-slate-400">
                      +{{ (bp.default_categories || []).length - 3 }} más
                    </span>
                    <span v-if="!bp.default_categories || bp.default_categories.length === 0" class="text-xs text-slate-400 italic">Ninguna</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Blueprint Modal -->
    <div v-if="showCreateBlueprint" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 dark:bg-[#141824]">
        <div class="border-b border-slate-200 p-6 dark:border-white/[0.06]">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Nuevo Blueprint</h3>
        </div>
        <div class="p-6 space-y-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Código *</label>
              <input v-model="newBlueprint.code" type="text" placeholder="ej: bodega" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Nombre *</label>
              <input v-model="newBlueprint.name" type="text" placeholder="ej: Bodega" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Ícono (Lucide)</label>
            <div class="flex gap-2">
              <div class="relative flex-1">
                <input
                  v-model="newBlueprint.icon"
                  type="text"
                  placeholder="Seleccionar icono..."
                  readonly
                  @click="showIconPicker = true"
                  class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
                />
                <button
                  type="button"
                  @click="showIconPicker = true"
                  class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <Search class="h-4 w-4" />
                </button>
              </div>
              <div v-if="newBlueprint.icon" class="flex items-center justify-center w-11 h-11 rounded-md border border-slate-200 bg-slate-50 dark:border-white/[0.06] dark:bg-[#1a1f2e]">
                <LucideIcon :name="newBlueprint.icon" :size="20" class="text-slate-600 dark:text-slate-300" />
              </div>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Features (separadas por coma)</label>
            <input v-model="newBlueprint.features" type="text" placeholder="ej: balanza,variantes" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300" />
          </div>
        </div>
        <div class="border-t border-slate-200 p-6 flex justify-end gap-2 dark:border-white/[0.06]">
          <button @click="showCreateBlueprint = false" class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 dark:text-slate-300 dark:border-white/[0.06] dark:hover:bg-[#1a1f2e]">
            Cancelar
          </button>
          <button
            @click="createBlueprint"
            :disabled="isSaving"
            class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw v-if="isSaving" class="h-4 w-4 animate-spin" />
            <Plus v-else class="h-4 w-4" />
            <span v-if="isSaving">Creando...</span>
            <span v-else>Crear Blueprint</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Icon Picker Modal -->
    <IconPicker
      :is-open="showIconPicker"
      v-model="newBlueprint.icon"
      @update:is-open="showIconPicker = $event"
      @close="showIconPicker = false"
    />

    <!-- Edit Blueprint Modal -->
    <div v-if="showEditBlueprint && editingBlueprint" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 dark:bg-[#141824]">
        <div class="border-b border-slate-200 p-6 dark:border-white/[0.06]">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Editar Blueprint</h3>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Código</label>
            <input v-model="editingBlueprint.code" type="text" disabled class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Nombre *</label>
            <input v-model="editingBlueprint.name" type="text" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Ícono (Lucide)</label>
            <div class="flex gap-2">
              <div class="relative flex-1">
                <input
                  v-model="editingBlueprint.icon"
                  type="text"
                  placeholder="Seleccionar icono..."
                  readonly
                  @click="showIconPicker = true"
                  class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
                />
                <button
                  type="button"
                  @click="showIconPicker = true"
                  class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <Search class="h-4 w-4" />
                </button>
              </div>
              <div v-if="editingBlueprint.icon" class="flex items-center justify-center w-11 h-11 rounded-md border border-slate-200 bg-slate-50 dark:border-white/[0.06] dark:bg-[#1a1f2e]">
                <LucideIcon :name="editingBlueprint.icon" :size="20" class="text-slate-600 dark:text-slate-300" />
              </div>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Features (separadas por coma)</label>
            <input v-model="editingBlueprintFeaturesString" type="text" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300" />
          </div>
          <div class="flex items-center gap-3">
            <input
              id="edit-active"
              v-model="editingBlueprint.is_active"
              type="checkbox"
              class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
            />
            <label for="edit-active" class="text-sm text-slate-700 dark:text-slate-300">Activo</label>
          </div>
        </div>
        <div class="border-t border-slate-200 p-6 flex justify-end gap-2 dark:border-white/[0.06]">
          <button @click="showEditBlueprint = false; editingBlueprint = null" class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 dark:text-slate-300 dark:border-white/[0.06] dark:hover:bg-[#1a1f2e]">
            Cancelar
          </button>
          <button
            @click="updateBlueprint"
            :disabled="isSaving"
            class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw v-if="isSaving" class="h-4 w-4 animate-spin" />
            <span v-else>Guardar cambios</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Category Modal -->
    <div v-if="showEditCategory && editingCategory" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 dark:bg-[#141824]">
        <div class="border-b border-slate-200 p-6 dark:border-white/[0.06]">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Editar Categoría</h3>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Código</label>
            <input v-model="editingCategory.code" type="text" disabled class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Nombre *</label>
            <input v-model="editingCategory.nombre" type="text" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Blueprint</label>
            <select v-model="editingCategory.industry_blueprint_id" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300">
              <option :value="undefined">Sin blueprint</option>
              <option v-for="bp in blueprints" :key="bp.id" :value="bp.id">
                {{ bp.name }} ({{ bp.code }})
              </option>
            </select>
          </div>
          <div class="flex items-center gap-3">
            <input
              id="edit-cat-active"
              v-model="editingCategory.is_active"
              type="checkbox"
              class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
            />
            <label for="edit-cat-active" class="text-sm text-slate-700 dark:text-slate-300">Activo</label>
          </div>
        </div>
        <div class="border-t border-slate-200 p-6 flex justify-end gap-2 dark:border-white/[0.06]">
          <button @click="showEditCategory = false; editingCategory = null" class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 dark:text-slate-300 dark:border-white/[0.06] dark:hover:bg-[#1a1f2e]">
            Cancelar
          </button>
          <button
            @click="updateCategory"
            :disabled="isSaving"
            class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw v-if="isSaving" class="h-4 w-4 animate-spin" />
            <span v-else>Guardar cambios</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Blueprint Config Modal -->
    <div v-if="configBlueprint" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 dark:bg-[#141824]">
        <div class="border-b border-slate-200 p-6 dark:border-white/[0.06]">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Configurar Blueprint</h3>
              <p class="text-sm text-slate-500 dark:text-slate-400">{{ configBlueprint.name }} ({{ configBlueprint.code }})</p>
            </div>
            <button
              @click="configBlueprint = null"
              class="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors dark:hover:bg-[#1a1f2e] dark:hover:text-slate-300"
            >
              <X class="h-5 w-5" />
            </button>
          </div>
        </div>
        <div class="p-6 space-y-6">
          <!-- Features Section -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm font-medium text-slate-900 dark:text-white">Features Activados</h4>
              <button
                @click="addConfigFeature"
                class="inline-flex items-center gap-1 text-sm text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300"
              >
                <Plus class="h-4 w-4" />
                Agregar
              </button>
            </div>
            <div class="space-y-2">
              <div
                v-for="(feature, index) in configFeatures"
                :key="index"
                class="flex items-center justify-between p-3 bg-slate-50 rounded-lg dark:bg-[#1a1f2e]"
              >
                <span class="text-sm text-slate-700 dark:text-slate-300">{{ feature }}</span>
                <button
                  @click="removeConfigFeature(index)"
                  class="text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                >
                  <X class="h-4 w-4" />
                </button>
              </div>
              <div v-if="configFeatures.length === 0" class="text-sm text-slate-400 italic p-3 text-center">
                No hay features configurados
              </div>
            </div>
          </div>

          <!-- Categories Section -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm font-medium text-slate-900 dark:text-white">Categorías Iniciales</h4>
              <button
                @click="addConfigCategory"
                class="inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                <Plus class="h-4 w-4" />
                Agregar
              </button>
            </div>
            <div class="max-h-60 overflow-y-auto space-y-2 pr-2">
              <div
                v-for="(category, index) in configCategories"
                :key="index"
                class="flex items-center justify-between p-3 bg-slate-50 rounded-lg dark:bg-[#1a1f2e]"
              >
                <span class="text-sm text-slate-700 dark:text-slate-300">{{ category }}</span>
                <button
                  @click="removeConfigCategory(index)"
                  class="text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                >
                  <X class="h-4 w-4" />
                </button>
              </div>
              <div v-if="configCategories.length === 0" class="text-sm text-slate-400 italic p-3 text-center">
                No hay categorías configuradas
              </div>
            </div>
          </div>
        </div>
        <div class="border-t border-slate-200 p-6 flex justify-end gap-2 dark:border-white/[0.06]">
          <button
            @click="configBlueprint = null"
            class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 dark:text-slate-300 dark:border-white/[0.06] dark:hover:bg-[#1a1f2e]"
          >
            Cancelar
          </button>
          <button
            @click="saveBlueprintConfig"
            :disabled="isSaving"
            class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw v-if="isSaving" class="h-4 w-4 animate-spin" />
            <span v-else>Guardar Configuración</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Create Plan Modal -->
    <div v-if="showCreatePlan" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 dark:bg-[#141824] max-h-[90vh] overflow-y-auto">
        <div class="border-b border-slate-200 p-6 dark:border-white/[0.06]">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Crear Nuevo Plan</h3>
        </div>
        <div class="p-6 space-y-6">
          <!-- Básico -->
          <div class="space-y-4">
            <h4 class="text-sm font-medium text-slate-900 dark:text-white">Información Básica</h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">SKU *</label>
                <input v-model="newPlan.sku" type="text" placeholder="Ej: COMPETENCIA" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Nombre *</label>
                <input v-model="newPlan.name" type="text" placeholder="Ej: Competencia" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Descripción</label>
              <textarea v-model="newPlan.description" rows="2" placeholder="Descripción del plan..." class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"></textarea>
            </div>
            <!-- Precios Dinámicos -->
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-medium text-slate-900 dark:text-white">Precios</h4>
                <button
                  type="button"
                  @click="addPlanPrice"
                  :disabled="newPlan.config?.is_courtesy"
                  class="inline-flex items-center gap-1 px-3 py-1 text-sm bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <Plus class="h-3 w-3" />
                  Añadir Precio
                </button>
              </div>
              
              <div v-if="newPlan.config?.is_courtesy" class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 dark:bg-yellow-900/20 dark:border-yellow-800">
                <p class="text-sm text-yellow-800 dark:text-yellow-300">Los precios están deshabilitados porque este es un plan de cortesía (costo $0).</p>
              </div>
              
              <div v-if="planPricesList.length === 0 && !newPlan.config?.is_courtesy" class="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                No hay precios configurados. Haz clic en "Añadir Precio" para agregar uno.
              </div>
              
              <div v-for="(price, index) in planPricesList" :key="price.id" class="border border-slate-200 rounded-lg p-4 space-y-3 dark:border-white/[0.06]">
                <div class="flex items-center justify-between">
                  <h5 class="text-sm font-medium text-slate-900 dark:text-white">Precio #{{ index + 1 }}</h5>
                  <button
                    type="button"
                    @click="removePlanPrice(price.id)"
                    class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <X class="h-4 w-4" />
                  </button>
                </div>
                
                <div class="grid grid-cols-3 gap-3">
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Frecuencia</label>
                    <select
                      :value="price.frequency"
                      @input="updatePlanPriceFrequency(price.id, $event)"
                      :disabled="newPlan.config?.is_courtesy"
                      class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300 disabled:bg-gray-100"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="monthly">Mensual</option>
                      <option value="quarterly">Trimestral</option>
                      <option value="yearly">Anual</option>
                      <option value="weekly">Semanal</option>
                      <option value="biannual">Semestral</option>
                    </select>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Monto (USD)</label>
                    <input
                      :value="price.amount"
                      @input="updatePlanPriceAmount(price.id, $event)"
                      type="number"
                      step="0.01"
                      min="0"
                      :disabled="newPlan.config?.is_courtesy"
                      placeholder="0.00"
                      class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300 disabled:bg-gray-100"
                    />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Moneda</label>
                    <select
                      :value="price.currency"
                      @input="updatePlanPriceCurrency(price.id, $event)"
                      :disabled="newPlan.config?.is_courtesy"
                      class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300 disabled:bg-gray-100"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="MXN">MXN</option>
                      <option value="COP">COP</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Límites -->
          <div class="space-y-4">
            <h4 class="text-sm font-medium text-slate-900 dark:text-white">Límites del Plan</h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Límite de Documentos</label>
                <input 
  :value="newPlan.config?.limits?.doc_limit" 
  @input="handleLimitInput('doc_limit', $event)" 
  type="number" 
  min="-1" 
  placeholder="100" 
  class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300" 
/>
                <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">-1 = Ilimitado</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Límite de Vault</label>
                <input 
  :value="newPlan.config?.limits?.vault_limit" 
  @input="handleLimitInput('vault_limit', $event)" 
  type="number" 
  min="-1" 
  placeholder="3" 
  class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300" 
/>
                <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">-1 = Ilimitado</p>
              </div>
            </div>
          </div>

          <!-- Estado y Promociones -->
          <div class="space-y-4">
            <h4 class="text-sm font-medium text-slate-900 dark:text-white">Estado y Promociones</h4>
            <div class="space-y-3">
              <label class="flex items-center gap-2">
                <input
                  type="checkbox"
                  :checked="newPlan.config?.is_trial || false"
                  @input="handleNewPlanConfig('is_trial', $event)"
                  class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                />
                <span class="text-sm text-slate-700 dark:text-slate-300">Activar periodo de prueba</span>
              </label>
              
              <div v-if="newPlan.config?.is_trial" class="ml-6">
                <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Días de prueba</label>
                <input
                  v-model.number="newPlan.config.trial_days"
                  type="number"
                  min="1"
                  max="365"
                  placeholder="7"
                  class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
                />
              </div>
              
              <label class="flex items-center gap-2">
                <input
                  type="checkbox"
                  :checked="newPlan.config?.has_promo || false"
                  @input="handleNewPlanConfig('has_promo', $event)"
                  class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                />
                <span class="text-sm text-slate-700 dark:text-slate-300">Tiene promoción activa</span>
              </label>
              
              <label class="flex items-center gap-2">
                <input
                  type="checkbox"
                  :checked="newPlan.config?.is_courtesy || false"
                  @input="handleNewPlanConfig('is_courtesy', $event)"
                  class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                />
                <span class="text-sm text-slate-700 dark:text-slate-300">Es un plan de cortesía</span>
              </label>
            </div>
          </div>

          <!-- Módulos -->
          <div class="space-y-4">
            <h4 class="text-sm font-medium text-slate-900 dark:text-white">Módulos</h4>
            <p class="text-xs text-slate-500 dark:text-slate-400">Selecciona los módulos disponibles para este plan</p>
            <div class="grid grid-cols-2 gap-3">
              <label v-for="module in availableModules" :key="module.ulid" class="flex items-center gap-2">
                <input 
                  @change="() => toggleNewModule(module.ulid)"
                  type="checkbox" 
                  class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" 
                />
                <span class="text-sm text-slate-700 dark:text-slate-300">{{ module.name }}</span>
              </label>
            </div>
          </div>
        </div>
        <div class="border-t border-slate-200 p-6 flex justify-end gap-2 dark:border-white/[0.06]">
          <button @click="showCreatePlan = false" class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 dark:text-slate-300 dark:border-white/[0.06] dark:hover:bg-[#1a1f2e]">
            Cancelar
          </button>
          <button
            @click="createPlan"
            :disabled="isSaving"
            class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw v-if="isSaving" class="h-4 w-4 animate-spin" />
            <Plus v-else class="h-4 w-4" />
            <span v-if="isSaving">Creando...</span>
            <span v-else>Crear Plan</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Plan Modal -->
    <div v-if="showEditPlan && editingPlan" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 dark:bg-[#141824] max-h-[90vh] overflow-y-auto">
        <div class="border-b border-slate-200 p-6 dark:border-white/[0.06]">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Editar Plan</h3>
        </div>
        <div class="p-6 space-y-6">
          <!-- Básico -->
          <div class="space-y-4">
            <h4 class="text-sm font-medium text-slate-900 dark:text-white">Información Básica</h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">SKU</label>
                <input v-model="editingPlan.sku" type="text" disabled class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Nombre *</label>
                <input v-model="editingPlan.name" type="text" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Descripción</label>
              <textarea v-model="editingPlan.description" rows="2" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"></textarea>
            </div>
            <!-- Precios Dinámicos -->
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-medium text-slate-900 dark:text-white">Precios</h4>
                <button
                  type="button"
                  @click="addEditPlanPrice"
                  :disabled="editingPlan.config?.is_courtesy"
                  class="inline-flex items-center gap-1 px-3 py-1 text-sm bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <Plus class="h-3 w-3" />
                  Añadir Precio
                </button>
              </div>
              
              <div v-if="editingPlan.config?.is_courtesy" class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 dark:bg-yellow-900/20 dark:border-yellow-800">
                <p class="text-sm text-yellow-800 dark:text-yellow-300">Los precios están deshabilitados porque este es un plan de cortesía (costo $0).</p>
              </div>
              
              <div v-if="editPlanPricesList.length === 0 && !editingPlan.config?.is_courtesy" class="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                No hay precios configurados. Haz clic en "Añadir Precio" para agregar uno.
              </div>
              
              <div v-for="(price, index) in editPlanPricesList" :key="price.id" class="border border-slate-200 rounded-lg p-4 space-y-3 dark:border-white/[0.06]">
                <div class="flex items-center justify-between">
                  <h5 class="text-sm font-medium text-slate-900 dark:text-white">Precio #{{ index + 1 }}</h5>
                  <button
                    type="button"
                    @click="removeEditPlanPrice(price.id)"
                    class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <X class="h-4 w-4" />
                  </button>
                </div>
                
                <div class="grid grid-cols-3 gap-3">
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Frecuencia</label>
                    <select
                      :value="price.frequency"
                      @input="updateEditPlanPriceFrequency(price.id, $event)"
                      :disabled="editingPlan.config?.is_courtesy"
                      class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300 disabled:bg-gray-100"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="monthly">Mensual</option>
                      <option value="quarterly">Trimestral</option>
                      <option value="yearly">Anual</option>
                      <option value="weekly">Semanal</option>
                      <option value="biannual">Semestral</option>
                    </select>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Monto (USD)</label>
                    <input
                      :value="price.amount"
                      @input="updateEditPlanPriceAmount(price.id, $event)"
                      type="number"
                      step="0.01"
                      min="0"
                      :disabled="editingPlan.config?.is_courtesy"
                      placeholder="0.00"
                      class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300 disabled:bg-gray-100"
                    />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Moneda</label>
                    <select
                      :value="price.currency"
                      @input="updateEditPlanPriceCurrency(price.id, $event)"
                      :disabled="editingPlan.config?.is_courtesy"
                      class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300 disabled:bg-gray-100"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="MXN">MXN</option>
                      <option value="COP">COP</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Límites -->
          <div class="space-y-4">
            <h4 class="text-sm font-medium text-slate-900 dark:text-white">Límites del Plan</h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Límite de Documentos</label>
                <input 
  :value="editingPlan.config?.limits?.doc_limit" 
  @input="handleEditLimitInput('doc_limit', $event)" 
  type="number" 
  min="-1" 
  class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300" 
/>
                <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">-1 = Ilimitado</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Límite de Vault</label>
                <input 
  :value="editingPlan.config?.limits?.vault_limit" 
  @input="handleEditLimitInput('vault_limit', $event)" 
  type="number" 
  min="-1" 
  class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300" 
/>
                <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">-1 = Ilimitado</p>
              </div>
            </div>
          </div>

          <!-- Estado y Promociones -->
          <div class="space-y-4">
            <h4 class="text-sm font-medium text-slate-900 dark:text-white">Estado y Promociones</h4>
            <div class="space-y-3">
              <label class="flex items-center gap-2">
                <input
                  type="checkbox"
                  :checked="editingPlan.config?.is_trial || false"
                  @input="handleEditPlanConfig('is_trial', $event)"
                  class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                />
                <span class="text-sm text-slate-700 dark:text-slate-300">Activar periodo de prueba</span>
              </label>
              
              <div v-if="editingPlan.config?.is_trial" class="ml-6">
                <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Días de prueba</label>
                <input
                  v-model.number="editingPlan.config.trial_days"
                  type="number"
                  min="1"
                  max="365"
                  placeholder="7"
                  class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
                />
              </div>
              
              <label class="flex items-center gap-2">
                <input
                  type="checkbox"
                  :checked="editingPlan.config?.has_promo || false"
                  @input="handleEditPlanConfig('has_promo', $event)"
                  class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                />
                <span class="text-sm text-slate-700 dark:text-slate-300">Tiene promoción activa</span>
              </label>
              
              <label class="flex items-center gap-2">
                <input
                  type="checkbox"
                  :checked="editingPlan.config?.is_courtesy || false"
                  @input="handleEditPlanConfig('is_courtesy', $event)"
                  class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                />
                <span class="text-sm text-slate-700 dark:text-slate-300">Es un plan de cortesía</span>
              </label>
            </div>
          </div>

          <!-- Módulos -->
          <div class="space-y-4">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm font-medium text-slate-900 dark:text-white">Módulos</h4>
              <div class="relative w-64">
                <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  v-model="moduleSearch"
                  type="text"
                  placeholder="Buscar módulos..."
                  class="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
                />
              </div>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400">Selecciona los módulos disponibles para este plan</p>
            <div class="grid grid-cols-2 gap-3">
              <label v-for="module in filteredModules" :key="module.ulid" class="flex items-center gap-2">
                <input 
                  :checked="isEditModuleSelected(module.ulid)" 
                  @change="() => toggleEditModule(module.ulid)"
                  type="checkbox" 
                  class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" 
                />
                <span class="text-sm text-slate-700 dark:text-slate-300">{{ module.name }}</span>
              </label>
            </div>
          </div>
        </div>
        <div class="border-t border-slate-200 p-6 flex justify-end gap-2 dark:border-white/[0.06]">
          <button @click="showEditPlan = false; editingPlan = null" class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 dark:text-slate-300 dark:border-white/[0.06] dark:hover:bg-[#1a1f2e]">
            Cancelar
          </button>
          <button
            @click="updatePlan"
            :disabled="isSaving"
            class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw v-if="isSaving" class="h-4 w-4 animate-spin" />
            <span v-else>Guardar cambios</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Create Addon Modal -->
    <div v-if="showCreateAddon" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 dark:bg-[#141824]">
        <div class="border-b border-slate-200 p-6 dark:border-white/[0.06]">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Nuevo Add-on</h3>
        </div>
        <div class="p-6 space-y-6">
          <!-- Información Básica -->
          <div class="space-y-4">
            <h4 class="text-sm font-medium text-slate-900 dark:text-white">Información Básica</h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Código *</label>
                <input v-model="newAddon.code" type="text" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Nombre *</label>
                <input v-model="newAddon.name" type="text" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300" />
              </div>
              <div class="col-span-2">
                <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Descripción</label>
                <textarea v-model="newAddon.description" rows="3" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Tipo *</label>
                <select v-model="newAddon.addon_type" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300">
                  <option value="SERVICIO">Servicio Recurrente</option>
                  <option value="CONSUMO">Pack de Consumo</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Precio (USD) *</label>
                <input v-model.number="newAddon.price" type="number" step="0.01" min="0" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300" />
              </div>
              <div v-if="newAddon.addon_type === 'CONSUMO'">
                <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Unidades Incluidas *</label>
                <input v-model.number="newAddon.units_included" type="number" min="1" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300" />
              </div>
              <div v-if="newAddon.addon_type === 'SERVICIO'">
                <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Duración por Defecto (días)</label>
                <input v-model.number="newAddon.default_duration_days" type="number" min="1" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Orden de Visualización</label>
                <input v-model.number="newAddon.display_order" type="number" min="0" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300" />
              </div>
              <div class="flex items-center">
                <input v-model="newAddon.is_active" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
                <label class="ml-2 text-sm text-slate-700 dark:text-slate-300">Activo</label>
              </div>
            </div>
          </div>
        </div>
        <div class="border-t border-slate-200 p-6 flex justify-end gap-2 dark:border-white/[0.06]">
          <button @click="showCreateAddon = false" class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 dark:text-slate-300 dark:border-white/[0.06] dark:hover:bg-[#1a1f2e]">
            Cancelar
          </button>
          <button
            @click="createAddon"
            :disabled="isSaving"
            class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw v-if="isSaving" class="h-4 w-4 animate-spin" />
            <span v-else>Crear Add-on</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Addon Modal -->
    <div v-if="showEditAddon && editingAddon" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 dark:bg-[#141824]">
        <div class="border-b border-slate-200 p-6 dark:border-white/[0.06]">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Editar Add-on: {{ editingAddon.name }}</h3>
        </div>
        <div class="p-6 space-y-6">
          <!-- Información Básica -->
          <div class="space-y-4">
            <h4 class="text-sm font-medium text-slate-900 dark:text-white">Información Básica</h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Código *</label>
                <input v-model="editingAddon.code" type="text" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Nombre *</label>
                <input v-model="editingAddon.name" type="text" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300" />
              </div>
              <div class="col-span-2">
                <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Descripción</label>
                <textarea v-model="editingAddon.description" rows="3" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Tipo *</label>
                <select v-model="editingAddon.addon_type" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300">
                  <option value="SERVICIO">Servicio Recurrente</option>
                  <option value="CONSUMO">Pack de Consumo</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Precio (USD) *</label>
                <input 
  v-model.number="editingAddon.price" 
  type="number" 
  step="0.01" 
  min="0" 
  class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300" 
/>
              </div>
              <div v-if="editingAddon.addon_type === 'CONSUMO'">
                <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Unidades Incluidas *</label>
                <input v-model.number="editingAddon.units_included" type="number" min="1" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300" />
              </div>
              <div v-if="editingAddon.addon_type === 'SERVICIO'">
                <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Duración por Defecto (días)</label>
                <input v-model.number="editingAddon.default_duration_days" type="number" min="1" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Orden de Visualización</label>
                <input v-model.number="editingAddon.display_order" type="number" min="0" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300" />
              </div>
              <div class="flex items-center">
                <input v-model="editingAddon.is_active" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
                <label class="ml-2 text-sm text-slate-700 dark:text-slate-300">Activo</label>
              </div>
            </div>
          </div>
        </div>
        <div class="border-t border-slate-200 p-6 flex justify-end gap-2 dark:border-white/[0.06]">
          <button @click="showEditAddon = false; editingAddon = null" class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 dark:text-slate-300 dark:border-white/[0.06] dark:hover:bg-[#1a1f2e]">
            Cancelar
          </button>
          <button
            @click="updateAddon"
            :disabled="isSaving"
            class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw v-if="isSaving" class="h-4 w-4 animate-spin" />
            <span v-else>Guardar cambios</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Create Module Modal -->
    <div v-if="showCreateModule" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 dark:bg-[#141824]">
        <div class="border-b border-slate-200 p-6 dark:border-white/[0.06]">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Nuevo Módulo</h3>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Nombre *</label>
            <input 
              v-model="newModule.name" 
              type="text" 
              placeholder="ej: Gestión de Inventario" 
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300" 
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Slug *</label>
            <input 
              v-model="newModule.slug" 
              type="text" 
              placeholder="ej: gestion-inventario" 
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300" 
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Descripción</label>
            <textarea 
              v-model="newModule.description" 
              rows="3" 
              placeholder="Descripción del módulo..." 
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
            ></textarea>
          </div>
          <div class="flex items-center gap-3">
            <input
              id="create-module-active"
              v-model="newModule.is_active"
              type="checkbox"
              class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
            />
            <label for="create-module-active" class="text-sm text-slate-700 dark:text-slate-300">Activo</label>
          </div>
        </div>
        <div class="border-t border-slate-200 p-6 flex justify-end gap-2 dark:border-white/[0.06]">
          <button 
            @click="showCreateModule = false" 
            class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 dark:text-slate-300 dark:border-white/[0.06] dark:hover:bg-[#1a1f2e]"
          >
            Cancelar
          </button>
          <button
            @click="createModule"
            :disabled="isSaving"
            class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw v-if="isSaving" class="h-4 w-4 animate-spin" />
            <Plus v-else class="h-4 w-4" />
            <span v-if="isSaving">Creando...</span>
            <span v-else>Crear Módulo</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Module Modal -->
    <div v-if="showEditModule && editingModule" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 dark:bg-[#141824]">
        <div class="border-b border-slate-200 p-6 dark:border-white/[0.06]">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Editar Módulo</h3>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">ULID</label>
            <input 
              v-model="editingModule.ulid" 
              type="text" 
              disabled 
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300" 
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Nombre *</label>
            <input 
              v-model="editingModule.name" 
              type="text" 
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300" 
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Slug *</label>
            <input 
              v-model="editingModule.slug" 
              type="text" 
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300" 
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Descripción</label>
            <textarea 
              v-model="editingModule.description" 
              rows="3" 
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
            ></textarea>
          </div>
          <div class="flex items-center gap-3">
            <input
              id="edit-module-active"
              v-model="editingModule.is_active"
              type="checkbox"
              class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
            />
            <label for="edit-module-active" class="text-sm text-slate-700 dark:text-slate-300">Activo</label>
          </div>
        </div>
        <div class="border-t border-slate-200 p-6 flex justify-end gap-2 dark:border-white/[0.06]">
          <button 
            @click="showEditModule = false; editingModule = null" 
            class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 dark:text-slate-300 dark:border-white/[0.06] dark:hover:bg-[#1a1f2e]"
          >
            Cancelar
          </button>
          <button
            @click="updateModule"
            :disabled="isSaving"
            class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw v-if="isSaving" class="h-4 w-4 animate-spin" />
            <span v-else>Guardar cambios</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';
import { useAlert } from '@/composables/useAlert';
import Swal from 'sweetalert2';
import { Shield, Building2, Boxes, Tags, Building, RefreshCw, Search, Plus, Edit3, Power, Settings, X, CreditCard, Target, Edit } from 'lucide-vue-next';
import IconPicker from '@/components/shared/IconPicker.vue';
import LucideIcon from '@/components/lucide/LucideIcon.vue';

interface Blueprint {
  id: number;
  code: string;
  name: string;
  icon?: string;
  is_active: boolean;
  required_features?: string[];
  default_categories?: string[];
}

interface Category {
  id: number;
  code: string;
  nombre: string;
  is_active: boolean;
  industry_blueprint_id?: number;
  parent?: { nombre: string };
}


interface Plan {
  id: number;
  ulid: string;
  sku: string;
  name: string;
  description?: string;
  prices?: {
    [frequency: string]: { amount: string; currency: string };
  };
  config?: {
    modules?: string[];
    limits?: {
      doc_limit?: number;
      vault_limit?: number;
    };
    is_trial?: boolean;
    has_promo?: boolean;
    is_courtesy?: boolean;
    trial_days?: number;
  };
  is_active: boolean;
  is_public: boolean;
  sort_order?: number;
  tenant_count?: number;
}

interface PlanPrice {
  id: string;
  frequency: string;
  amount: string;
  currency: string;
}

interface AppModule {
  id: number;
  ulid: string;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
}

const authStore = useAuthStore();
const { fetchApi } = useApi();
const { success: notifySuccess, error: notifyError } = useNotify();
const { showInput } = useAlert();

const loading = ref(true);
const isSaving = ref(false);
const activeTab = ref<'blueprints' | 'categories' | 'plans' | 'addons' | 'modules' | 'permissions' | 'config'>('blueprints');
const blueprintSearch = ref('');
const categorySearch = ref('');
const planSearch = ref('');
const addonSearch = ref('');
const moduleSearch = ref('');

const blueprints = ref<Blueprint[]>([]);
const categories = ref<Category[]>([]);
const plans = ref<Plan[]>([]);
const addons = ref<any[]>([]);
const modules = ref<AppModule[]>([]);
const permissions = ref<any[]>([]);
const availableModules = ref<any[]>([]);
const selectedTenant = ref<any>(null);
const selectedAddon = ref<any>(null);
const assignAddonQuantity = ref(100);
const tenantCount = ref(0);

const showCreateBlueprint = ref(false);
const showEditBlueprint = ref(false);
const showEditCategory = ref(false);
const showCreatePlan = ref(false);
const showEditPlan = ref(false);
const showIconPicker = ref(false);
const showCreateAddon = ref(false);
const showEditAddon = ref(false);
const showCreateModule = ref(false);
const showEditModule = ref(false);
const editingModule = ref<AppModule | null>(null);
const newModule = ref({
  name: '',
  slug: '',
  description: '',
  is_active: true
});
const editingBlueprint = ref<Blueprint | null>(null);
const editingCategory = ref<Category | null>(null);
const editingPlan = ref<Partial<Plan> | null>(null);
const editingAddon = ref<any | null>(null);
const configBlueprint = ref<Blueprint | null>(null);
const configFeatures = ref<string[]>([]);
const configCategories = ref<string[]>([]);
const newBlueprint = ref({
  code: '',
  name: '',
  icon: '',
  features: ''
});
const newPlan = ref({
  ulid: '',
  sku: '',
  name: '',
  description: '',
  prices: {},
  config: {
    modules: [],
    limits: {
      doc_limit: 100,
      vault_limit: 3
    },
    is_trial: false,
    has_promo: false,
    is_courtesy: false,
    trial_days: 7
  },
  is_active: true,
  is_public: true,
  sort_order: 0
});

// Dynamic prices list for new plan
const planPricesList = ref<PlanPrice[]>([]);

// Dynamic prices list for edit plan
const editPlanPricesList = ref<PlanPrice[]>([]);

const newAddon = ref({
  code: '',
  name: '',
  description: '',
  addon_type: 'CONSUMO',
  price: 0,
  units_included: 100,
  default_duration_days: 30,
  is_active: true,
  display_order: 0
});

const isStaff = computed(() => authStore.user?.is_staff || false);

const editingBlueprintFeaturesString = computed({
  get: () => editingBlueprint.value?.required_features?.join(', ') || '',
  set: (value: string) => {
    if (editingBlueprint.value) {
      editingBlueprint.value.required_features = value.split(',').map(f => f.trim()).filter(Boolean);
    }
  }
});

const filteredBlueprints = computed(() => {
  if (!blueprintSearch.value.trim()) return blueprints.value;
  const q = blueprintSearch.value.toLowerCase();
  return blueprints.value.filter(bp => 
    bp.code.toLowerCase().includes(q) || 
    bp.name.toLowerCase().includes(q)
  );
});

const filteredCategories = computed(() => {
  if (!categorySearch.value.trim()) return categories.value;
  const q = categorySearch.value.toLowerCase();
  return categories.value.filter(cat => 
    cat.code.toLowerCase().includes(q) || 
    cat.nombre.toLowerCase().includes(q)
  );
});

const filteredPlans = computed(() => {
  if (!planSearch.value.trim()) return plans.value;
  const q = planSearch.value.toLowerCase();
  return plans.value.filter(plan => 
    plan.sku.toLowerCase().includes(q) || 
    plan.name.toLowerCase().includes(q) ||
    plan.description?.toLowerCase().includes(q)
  );
});

const filteredAddons = computed(() => {
  if (!Array.isArray(addons.value)) return [];
  if (!addonSearch.value.trim()) return addons.value.filter(addon => addon != null);
  const q = addonSearch.value.toLowerCase();
  return addons.value.filter(addon => 
    addon != null && (
      addon.name.toLowerCase().includes(q) ||
      addon.code.toLowerCase().includes(q) ||
      addon.description.toLowerCase().includes(q)
    )
  );
});

const totalCategories = computed(() => categories.value.length);
const totalAttributes = computed(() => {
  return blueprints.value.reduce((sum, bp) => {
    return sum + (bp.required_features?.length || 0);
  }, 0);
});

const getBlueprintName = (id?: number) => {
  if (!id) return '-';
  const bp = blueprints.value.find(b => b.id === id);
  return bp?.name || '-';
};

const loadAppModules = async () => {
  try {
    console.log('Loading modules from API...');
    const response = await fetchApi<AppModule[] | { results?: AppModule[] } | { data?: AppModule[] | { results?: AppModule[] } }>('/api/v1/app-modules/');
    console.log('API response:', response);

    // Handle different response structures
    if (Array.isArray(response)) {
      console.log('Response is direct array, length:', response.length);
      modules.value = response;
      availableModules.value = response;
    } else if ('results' in response && Array.isArray(response.results)) {
      modules.value = response.results;
      availableModules.value = response.results;
    } else if ('data' in response && response.data) {
      const data = response.data;
      if (Array.isArray(data)) {
        modules.value = data;
        availableModules.value = data;
      } else if ('results' in data && Array.isArray(data.results)) {
        modules.value = data.results;
        availableModules.value = data.results;
      } else {
        modules.value = [];
        availableModules.value = [];
      }
    } else {
      modules.value = [];
      availableModules.value = [];
    }
    
    console.log('Final modules value:', modules.value);
    console.log('Final availableModules value:', availableModules.value);
  } catch (error: any) {
    console.error('Error loading modules:', error);
    notifyError('Error al cargar módulos');
    modules.value = [];
    availableModules.value = [];
  }
};

const loadAllData = async () => {
  try {
    loading.value = true;
    await Promise.all([
      loadBlueprints(),
      loadCategories(),
      loadPlans(),
      loadAddons(),
      loadPermissions(),
      loadAppModules(),
      loadTenantCount()
    ]);
  } finally {
    loading.value = false;
  }
};

const loadBlueprints = async () => {
  try {
    const data = await fetchApi<Blueprint[] | { results?: Blueprint[] }>('/api/v1/industry-blueprints/');
    blueprints.value = Array.isArray(data) ? data : (data as { results?: Blueprint[] }).results ?? [];
  } catch (error) {
    console.error('Error loading blueprints:', error);
    notifyError('Error al cargar blueprints');
  }
};

const loadCategories = async () => {
  try {
    const data = await fetchApi<Category[] | { results?: Category[] }>('/api/v1/categories/');
    categories.value = Array.isArray(data) ? data : (data as { results?: Category[] }).results ?? [];
  } catch (error) {
    console.error('Error loading categories:', error);
    notifyError('Error al cargar categorías');
  }
};

const loadPlans = async () => {
  try {
    const data = await fetchApi<any[] | { results?: any[] }>('/api/v1/subscription-plans/');
    plans.value = Array.isArray(data) ? data : (data as { results?: any[] }).results ?? [];
  } catch (error) {
    console.error('Error loading plans:', error);
    notifyError('Error al cargar planes');
  }
};

const loadAddons = async () => {
  try {
    const data = await fetchApi<any[]>('/api/v1/addons/');
    console.log('Addons loaded:', data);
    addons.value = Array.isArray(data) ? data : (data as { results?: any[] }).results ?? [];
  } catch (error) {
    console.error('Error loading addons:', error);
    notifyError('Error al cargar add-ons');
    addons.value = [];
  }
};

const loadPermissions = async () => {
  try {
    const data = await fetchApi<any[]>('/api/v1/permissions/');
    permissions.value = data;
  } catch (error) {
    console.error('Error loading permissions:', error);
    notifyError('Error al cargar permisos');
  }
};

const loadTenantCount = async () => {
  try {
    const data = await fetchApi<{ count: number }>('/api/v1/tenants/');
    tenantCount.value = data.count || 0;
  } catch {
    tenantCount.value = 0;
  }
};

const loadTenants = async () => {
  try {
    const data = await fetchApi<any[] | { results?: any[] }>('/api/v1/tenants/');
    return Array.isArray(data) ? data : (data as { results?: any[] }).results ?? [];
  } catch (error: any) {
    console.error('Error loading tenants:', error);
    notifyError('Error al cargar tenants');
    return [];
  }
};

const assignAddonToTenant = async () => {
  if (!selectedTenant.value || !selectedAddon.value) {
    notifyError('Seleccione un tenant y un add-on');
    return;
  }

  isSaving.value = true;
  try {
    const addonData = {
      tenant: selectedTenant.value.id,
      addon: selectedAddon.value.id,
      remaining_units: selectedAddon.value.addon_type === 'CONSUMO' ? assignAddonQuantity.value : 0,
      notes: 'Asignado manualmente para pruebas'
    };

    await fetchApi('/api/v1/tenant-addons/', {
      method: 'POST',
      data: addonData
    });

    notifySuccess('Add-on asignado correctamente');
    selectedTenant.value = null;
    selectedAddon.value = null;
  } catch (error: any) {
    console.error('Error assigning addon:', error);
    notifyError(`Error al asignar add-on: ${error.data?.detail || error.message}`);
  } finally {
    isSaving.value = false;
  }
};

const openAssignAddon = async () => {
  const tenants = await loadTenants();
  if (tenants.length === 0) {
    notifyError('No hay tenants disponibles');
    return;
  }

  // For now, just set the first tenant and addon as defaults
  selectedTenant.value = tenants[0];
  selectedAddon.value = addons.value[0];
};

const openCreateBlueprint = () => {
  newBlueprint.value = { code: '', name: '', icon: '', features: '' };
  showCreateBlueprint.value = true;
};

const createBlueprint = async () => {
  if (!newBlueprint.value.code || !newBlueprint.value.name || isSaving.value) {
    notifyError('Código y nombre son obligatorios');
    return;
  }

  isSaving.value = true;
  try {
    await fetchApi('/api/v1/industry-blueprints/', {
      method: 'POST',
      data: {
        code: newBlueprint.value.code,
        name: newBlueprint.value.name,
        icon: newBlueprint.value.icon,
        required_features: newBlueprint.value.features.split(',').map(f => f.trim()).filter(Boolean),
        is_active: true
      }
    });
    notifySuccess('Blueprint creado correctamente');
    showCreateBlueprint.value = false;
    await loadBlueprints();
  } catch (error) {
    notifyError('Error al crear blueprint');
  } finally {
    isSaving.value = false;
  }
};

const openEditBlueprint = (bp: Blueprint) => {
  editingBlueprint.value = {
    id: bp.id,
    code: bp.code,
    name: bp.name,
    icon: bp.icon,
    is_active: bp.is_active,
    required_features: bp.required_features ? [...bp.required_features] : [],
    default_categories: bp.default_categories ? [...bp.default_categories] : []
  };
  showEditBlueprint.value = true;
};

const updateBlueprint = async () => {
  if (!editingBlueprint.value || isSaving.value) return;

  isSaving.value = true;
  try {
    const payload: any = {
      name: editingBlueprint.value.name,
      icon: editingBlueprint.value.icon,
      required_features: editingBlueprint.value.required_features,
      is_active: editingBlueprint.value.is_active
    };
    
    // Remove undefined fields
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });

    console.log('Updating blueprint payload:', payload);
    console.log('Editing blueprint object:', editingBlueprint.value);

    await fetchApi(`/api/v1/industry-blueprints/${editingBlueprint.value.id}/`, {
      method: 'PATCH',
      data: payload
    });
    notifySuccess('Blueprint actualizado correctamente');
    showEditBlueprint.value = false;
    editingBlueprint.value = null;
    await loadBlueprints();
  } catch (error) {
    console.error('Error updating blueprint:', error);
    notifyError('Error al actualizar blueprint');
  } finally {
    isSaving.value = false;
  }
};

const toggleBlueprintActive = async (bp: Blueprint) => {
  const title = bp.is_active ? '¿Desactivar Blueprint?' : '¿Activar Blueprint?';
  const message = bp.is_active 
    ? 'Esta acción es reversible. Los datos históricos se mantendrán íntegros. El blueprint dejará de estar disponible para nuevos clientes.'
    : 'Esta acción es reversible. Los datos históricos se mantendrán íntegros. El blueprint estará disponible para nuevos clientes.';

  const result = await Swal.fire({
    title,
    text: message,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: bp.is_active ? '#ef4444' : '#22c55e',
    cancelButtonColor: '#64748b',
    confirmButtonText: bp.is_active ? 'Sí, desactivar' : 'Sí, activar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    try {
      await fetchApi(`/api/v1/industry-blueprints/${bp.id}/`, {
        method: 'PATCH',
        data: { is_active: !bp.is_active }
      });
      bp.is_active = !bp.is_active;
      notifySuccess(bp.is_active ? 'Blueprint activado correctamente' : 'Blueprint desactivado correctamente');
    } catch (error) {
      console.error('Error updating blueprint status:', error);
      notifyError('Error al actualizar estado');
    }
  }
};

const toggleAutoConfig = (bp: Blueprint) => {
  configBlueprint.value = {
    id: bp.id,
    code: bp.code,
    name: bp.name,
    icon: bp.icon,
    is_active: bp.is_active,
    required_features: bp.required_features ? [...bp.required_features] : [],
    default_categories: bp.default_categories ? [...bp.default_categories] : []
  };
  configFeatures.value = [...(bp.required_features || [])];
  configCategories.value = [...(bp.default_categories || [])];
};

const saveBlueprintConfig = async () => {
  if (!configBlueprint.value || isSaving.value) return;

  isSaving.value = true;
  try {
    // Create clean payload with only the fields we want to update
    const payload = {
      required_features: JSON.parse(JSON.stringify(configFeatures.value)),
      default_categories: JSON.parse(JSON.stringify(configCategories.value)),
      category_structure: [],
      business_conditions: {},
      product_schema: [],
      schema_logic: {}
    };

    console.log('Saving blueprint config payload:', payload);
    console.log('Payload keys:', Object.keys(payload));

    await fetchApi(`/api/v1/industry-blueprints/${configBlueprint.value.id}/`, {
      method: 'PATCH',
      data: payload,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Update local blueprint
    const bpIndex = blueprints.value.findIndex(b => b.id === configBlueprint.value!.id);
    if (bpIndex !== -1) {
      blueprints.value[bpIndex].required_features = [...configFeatures.value];
      blueprints.value[bpIndex].default_categories = [...configCategories.value];
    }
    
    notifySuccess('Configuración guardada correctamente');
    configBlueprint.value = null;
  } catch (error: any) {
    console.error('Error saving blueprint config:', error);
    console.error('Error details:', error.data);
    notifyError(`Error al guardar configuración: ${error.data?.detail || error.message}`);
  } finally {
    isSaving.value = false;
  }
};

const addConfigFeature = async () => {
  const feature = await showInput('Nombre del feature:', 'ej: balanza');
  if (feature && feature.trim()) {
    configFeatures.value.push(feature.trim());
  }
};

const removeConfigFeature = (index: number) => {
  configFeatures.value.splice(index, 1);
};

const addConfigCategory = async () => {
  const category = await showInput('Código de categoría:', 'ej: BEBIDAS');
  if (category && category.trim()) {
    configCategories.value.push(category.trim());
  }
};

const removeConfigCategory = (index: number) => {
  configCategories.value.splice(index, 1);
};

const openCreateCategory = () => {
  // TODO: Implement create category modal
  notifyError('Creación de categorías próximamente');
};

const openEditCategory = (cat: Category) => {
  editingCategory.value = cat;
  showEditCategory.value = true;
};

const updateCategory = async () => {
  if (!editingCategory.value || isSaving.value) return;

  isSaving.value = true;
  try {
    await fetchApi(`/api/v1/categories/${editingCategory.value.id}/`, {
      method: 'PATCH',
      data: {
        nombre: editingCategory.value.nombre,
        is_active: editingCategory.value.is_active
      }
    });
    notifySuccess('Categoría actualizada correctamente');
    showEditCategory.value = false;
    editingCategory.value = null;
    await loadCategories();
  } catch (error) {
    notifyError('Error al actualizar categoría');
  } finally {
    isSaving.value = false;
  }
};

const toggleCategoryActive = async (cat: Category) => {
  const title = cat.is_active ? '¿Desactivar Categoría?' : '¿Activar Categoría?';
  const message = cat.is_active 
    ? 'Esta acción es reversible. Los datos históricos se mantendrán íntegros. La categoría dejará de estar disponible para nuevos clientes.'
    : 'Esta acción es reversible. Los datos históricos se mantendrán íntegros. La categoría estará disponible para nuevos clientes.';

  const result = await Swal.fire({
    title,
    text: message,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: cat.is_active ? '#ef4444' : '#22c55e',
    cancelButtonColor: '#64748b',
    confirmButtonText: cat.is_active ? 'Sí, desactivar' : 'Sí, activar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    try {
      await fetchApi(`/api/v1/categories/${cat.id}/`, {
        method: 'PATCH',
        data: { is_active: !cat.is_active }
      });
      cat.is_active = !cat.is_active;
      notifySuccess(cat.is_active ? 'Categoría activada correctamente' : 'Categoría desactivada correctamente');
    } catch (error) {
      console.error('Error updating category status:', error);
      notifyError('Error al actualizar estado');
    }
  }
};

// Module management functions
const openCreateModule = () => {
  newModule.value = {
    name: '',
    slug: '',
    description: '',
    is_active: true
  };
  showCreateModule.value = true;
};

const editModule = (module: AppModule) => {
  editingModule.value = { ...module };
  showEditModule.value = true;
};

const toggleModuleStatus = async (module: AppModule) => {
  try {
    await fetchApi(`/api/v1/app-modules/${module.ulid}/`, {
      method: 'PATCH',
      data: { is_active: !module.is_active }
    });
    
    const index = modules.value.findIndex(m => m.ulid === module.ulid);
    if (index !== -1) {
      modules.value[index].is_active = !module.is_active;
    }
    
    notifySuccess(module.is_active ? 'Módulo desactivado' : 'Módulo activado');
  } catch (error: any) {
    console.error('Error toggling module status:', error);
    notifyError('Error al cambiar estado del módulo');
  }
};

const createModule = async () => {
  if (isSaving.value) return;
  
  if (!newModule.value.name || !newModule.value.slug) {
    notifyError('Complete los campos requeridos');
    return;
  }
  
  isSaving.value = true;
  try {
    console.log('Creating module with data:', newModule.value);
    const createdModule = await fetchApi('/api/v1/app-modules/', {
      method: 'POST',
      data: newModule.value
    });
    console.log('Module created successfully:', createdModule);
    
    await loadAppModules();
    showCreateModule.value = false;
    notifySuccess('Módulo creado correctamente');
  } catch (error: any) {
    console.error('Error creating module:', error);
    notifyError(`Error al crear módulo: ${error.data?.detail || error.message}`);
  } finally {
    isSaving.value = false;
  }
};

const updateModule = async () => {
  if (isSaving.value || !editingModule.value) return;
  
  if (!editingModule.value.name || !editingModule.value.slug) {
    notifyError('Complete los campos requeridos');
    return;
  }
  
  isSaving.value = true;
  try {
    await fetchApi(`/api/v1/app-modules/${editingModule.value.ulid}/`, {
      method: 'PATCH',
      data: editingModule.value
    });
    
    await loadAppModules();
    showEditModule.value = false;
    editingModule.value = null;
    notifySuccess('Módulo actualizado correctamente');
  } catch (error: any) {
    console.error('Error updating module:', error);
    notifyError('Error al actualizar módulo');
  } finally {
    isSaving.value = false;
  }
};

// Plan management functions
const getModuleNameByUlid = (moduleUlid: string) => {
  const module = availableModules.value.find(m => m.ulid === moduleUlid);
  return module ? module.name : moduleUlid;
};

const filteredModules = computed(() => {
  if (!moduleSearch.value) return availableModules.value;
  const search = moduleSearch.value.toLowerCase();
  return availableModules.value.filter(module => 
    module.name.toLowerCase().includes(search) ||
    module.slug.toLowerCase().includes(search) ||
    module.description.toLowerCase().includes(search)
  );
});

const getFrequencyLabel = (frequency: string): string => {
  const labels: { [key: string]: string } = {
    'monthly': 'Mensual',
    'quarterly': 'Trimestral',
    'yearly': 'Anual',
    'weekly': 'Semanal',
    'biannual': 'Semestral'
  }
  return labels[frequency] || frequency
};

// Dynamic prices functions
const addPlanPrice = () => {
  const newPrice: PlanPrice = {
    id: Math.random().toString(36).substr(2, 9),
    frequency: '',
    amount: '',
    currency: 'USD'
  }
  planPricesList.value.push(newPrice)
}

const removePlanPrice = (id: string) => {
  const index = planPricesList.value.findIndex(p => p.id === id)
  if (index > -1) {
    planPricesList.value.splice(index, 1)
    updatePlanPricesObject()
  }
}

const updatePlanPriceFrequency = (id: string, event: Event) => {
  const target = event.target as HTMLSelectElement
  const price = planPricesList.value.find(p => p.id === id)
  if (price) {
    price.frequency = target.value
    updatePlanPricesObject()
  }
}

const updatePlanPriceAmount = (id: string, event: Event) => {
  const target = event.target as HTMLInputElement
  const price = planPricesList.value.find(p => p.id === id)
  if (price) {
    price.amount = target.value
    updatePlanPricesObject()
  }
}

const updatePlanPriceCurrency = (id: string, event: Event) => {
  const target = event.target as HTMLSelectElement
  const price = planPricesList.value.find(p => p.id === id)
  if (price) {
    price.currency = target.value
    updatePlanPricesObject()
  }
}

const updatePlanPricesObject = () => {
  const prices: { [frequency: string]: { amount: string; currency: string } } = {}
  planPricesList.value.forEach(price => {
    if (price.frequency && price.amount) {
      prices[price.frequency] = {
        amount: price.amount,
        currency: price.currency
      }
    }
  })
  newPlan.value.prices = prices
}

const handleNewPlanConfig = (field: 'is_trial' | 'has_promo' | 'is_courtesy', event: Event) => {
  const target = event.target as HTMLInputElement
  if (!newPlan.value.config) {
    newPlan.value.config = {
      modules: [],
      limits: {
        doc_limit: 100,
        vault_limit: 3
      },
      is_trial: false,
      has_promo: false,
      is_courtesy: false,
      trial_days: 7
    }
  }
  
  newPlan.value.config[field] = target.checked
  
  // If courtesy is enabled, clear all prices
  if (field === 'is_courtesy' && target.checked) {
    planPricesList.value = []
    newPlan.value.prices = {}
  }
}

// Edit plan dynamic prices functions
const addEditPlanPrice = () => {
  const newPrice: PlanPrice = {
    id: Math.random().toString(36).substr(2, 9),
    frequency: '',
    amount: '',
    currency: 'USD'
  }
  editPlanPricesList.value.push(newPrice)
}

const removeEditPlanPrice = (id: string) => {
  const index = editPlanPricesList.value.findIndex(p => p.id === id)
  if (index > -1) {
    editPlanPricesList.value.splice(index, 1)
    updateEditPlanPricesObject()
  }
}

const updateEditPlanPriceFrequency = (id: string, event: Event) => {
  const target = event.target as HTMLSelectElement
  const price = editPlanPricesList.value.find(p => p.id === id)
  if (price) {
    price.frequency = target.value
    updateEditPlanPricesObject()
  }
}

const updateEditPlanPriceAmount = (id: string, event: Event) => {
  const target = event.target as HTMLInputElement
  const price = editPlanPricesList.value.find(p => p.id === id)
  if (price) {
    price.amount = target.value
    updateEditPlanPricesObject()
  }
}

const updateEditPlanPriceCurrency = (id: string, event: Event) => {
  const target = event.target as HTMLSelectElement
  const price = editPlanPricesList.value.find(p => p.id === id)
  if (price) {
    price.currency = target.value
    updateEditPlanPricesObject()
  }
}

const updateEditPlanPricesObject = () => {
  if (!editingPlan.value) return
  
  const prices: { [frequency: string]: { amount: string; currency: string } } = {}
  editPlanPricesList.value.forEach(price => {
    if (price.frequency && price.amount) {
      prices[price.frequency] = {
        amount: price.amount,
        currency: price.currency
      }
    }
  })
  editingPlan.value.prices = prices
}

const handleEditPlanConfig = (field: 'is_trial' | 'has_promo' | 'is_courtesy', event: Event) => {
  const target = event.target as HTMLInputElement
  if (!editingPlan.value?.config) {
    if (!editingPlan.value) return
    editingPlan.value.config = {
      modules: [],
      limits: {
        doc_limit: 100,
        vault_limit: 3
      },
      is_trial: false,
      has_promo: false,
      is_courtesy: false,
      trial_days: 7
    }
  }
  
  editingPlan.value.config[field] = target.checked
  
  // If courtesy is enabled, clear all prices
  if (field === 'is_courtesy' && target.checked) {
    editPlanPricesList.value = []
    if (editingPlan.value) {
      editingPlan.value.prices = {}
    }
  }
}

const isEditModuleSelected = (moduleUlid: string) => {
  return (editingPlan.value?.config?.modules as string[] || []).includes(moduleUlid);
};

const toggleNewModule = (moduleUlid: string) => {
  if (!newPlan.value.config) {
    newPlan.value.config = { 
      modules: [], 
      limits: { doc_limit: 100, vault_limit: 3 },
      is_trial: false,
      has_promo: false,
      is_courtesy: false,
      trial_days: 7
    };
  }
  
  const modules = newPlan.value.config.modules as string[];
  const index = modules.indexOf(moduleUlid);
  if (index > -1) {
    modules.splice(index, 1);
  } else {
    modules.push(moduleUlid);
  }
};

const toggleEditModule = (moduleUlid: string) => {
  if (!editingPlan.value?.config) {
    if (!editingPlan.value) return;
    editingPlan.value.config = {
      modules: [],
      limits: {
        doc_limit: 100,
        vault_limit: 3
      },
      is_trial: false,
      has_promo: false,
      is_courtesy: false,
      trial_days: 7
    };
  }
  
  const modules = editingPlan.value.config.modules as string[];
  const index = modules.indexOf(moduleUlid);
  if (index > -1) {
    modules.splice(index, 1);
  } else {
    modules.push(moduleUlid);
  }
};


const handleEditLimitInput = (limitType: 'doc_limit' | 'vault_limit', event: Event) => {
  const target = event.target as HTMLInputElement;
  const value = Number(target.value || 0);
  
  if (!editingPlan.value) return;
  
  if (!editingPlan.value.config) {
    editingPlan.value.config = { modules: [], limits: { doc_limit: 100, vault_limit: 3 } };
  }
  
  if (!editingPlan.value.config.limits) {
    editingPlan.value.config.limits = { doc_limit: 100, vault_limit: 3 };
  }
  
  editingPlan.value.config.limits[limitType] = value;
};

const handleLimitInput = (limitType: 'doc_limit' | 'vault_limit', event: Event) => {
  const target = event.target as HTMLInputElement;
  const value = Number(target.value || 0);
  
  if (!newPlan.value.config) {
    newPlan.value.config = { 
      modules: [], 
      limits: { doc_limit: 100, vault_limit: 3 },
      is_trial: false,
      has_promo: false,
      is_courtesy: false,
      trial_days: 7
    };
  }
  
  if (!newPlan.value.config.limits) {
    newPlan.value.config.limits = { doc_limit: 100, vault_limit: 3 };
  }
  
  newPlan.value.config.limits[limitType] = value;
};

const openCreatePlan = () => {
  newPlan.value = {
    ulid: '',
    sku: '',
    name: '',
    description: '',
    prices: {},
    config: {
      modules: [],
      limits: {
        doc_limit: 100,
        vault_limit: 3
      },
      is_trial: false,
      has_promo: false,
      is_courtesy: false,
      trial_days: 7
    },
    is_active: true,
    is_public: true,
    sort_order: 0
  };
  showCreatePlan.value = true;
};

const createPlan = async () => {
  if (isSaving.value) return;
  
  if (!newPlan.value.sku || !newPlan.value.name) {
    notifyError('Complete los campos requeridos');
    return;
  }

  isSaving.value = true;
  try {
    const planData = {
      ...newPlan.value,
      sku: newPlan.value.sku.toUpperCase(),
      is_active: true,
      sort_order: plans.value.length + 1
    };

    const createdPlan = await fetchApi<Plan>('/api/v1/subscription-plans/', {
      method: 'POST',
      data: planData
    });

    plans.value.push(createdPlan);
    notifySuccess('Plan creado correctamente');
    showCreatePlan.value = false;
  } catch (error: any) {
    console.error('Error creating plan:', error);
    notifyError(`Error al crear plan: ${error.data?.detail || error.message}`);
  } finally {
    isSaving.value = false;
  }
};

const editPlan = (plan: any) => {
  // Initialize editing plan with complete data
  editingPlan.value = {
    ...plan,
    is_active: plan.is_active ?? true,
    config: plan.config || {
      modules: [],
      limits: {
        doc_limit: 100,
        vault_limit: 3
      },
      is_trial: false,
      has_promo: false,
      is_courtesy: false
    },
    prices: plan.prices || {}
  };
  
  // Initialize edit plan prices list from existing prices
  editPlanPricesList.value = [];
  const prices = plan.prices || {};
  Object.entries(prices).forEach(([frequency, price]) => {
    const priceObj = price as { amount: string; currency: string };
    editPlanPricesList.value.push({
      id: Math.random().toString(36).substr(2, 9),
      frequency,
      amount: priceObj.amount,
      currency: priceObj.currency
    });
  });
  
  showEditPlan.value = true;
};

const updatePlan = async () => {
  if (isSaving.value || !editingPlan.value) return;

  isSaving.value = true;
  try {
    const planData = {
      ...editingPlan.value,
      config: editingPlan.value.config
    };

    await fetchApi(`/api/v1/subscription-plans/${editingPlan.value.ulid}/`, {
      method: 'PATCH',
      data: planData
    });

    const index = plans.value.findIndex(p => p.id === editingPlan.value!.id);
    if (index !== -1) {
      plans.value[index] = { ...plans.value[index], ...planData };
    }

    notifySuccess('Plan actualizado correctamente');
    showEditPlan.value = false;
    editingPlan.value = null;
  } catch (error: any) {
    console.error('Error updating plan:', error);
    notifyError(`Error al actualizar plan: ${error.data?.detail || error.message}`);
  } finally {
    isSaving.value = false;
  }
};

const togglePlanActive = async (plan: any) => {
  const title = plan.is_active ? '¿Desactivar Plan?' : '¿Activar Plan?';
  const message = plan.is_active 
    ? 'Esta acción es reversible. Los datos históricos se mantendrán íntegros. El plan dejará de estar disponible para nuevos clientes.'
    : 'Esta acción es reversible. Los datos históricos se mantendrán íntegros. El plan estará disponible para nuevos clientes.';

  const result = await Swal.fire({
    title,
    text: message,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: plan.is_active ? '#ef4444' : '#22c55e',
    cancelButtonColor: '#64748b',
    confirmButtonText: plan.is_active ? 'Sí, desactivar' : 'Sí, activar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    try {
      await fetchApi(`/api/v1/subscription-plans/${plan.id}/`, {
        method: 'PATCH',
        data: { is_active: !plan.is_active }
      });
      plan.is_active = !plan.is_active;
      notifySuccess(plan.is_active ? 'Plan activado correctamente' : 'Plan desactivado correctamente');
    } catch (error) {
      console.error('Error updating plan status:', error);
      notifyError('Error al actualizar estado');
    }
  }
};

// Add-on CRUD functions
const openCreateAddon = () => {
  newAddon.value = {
    code: '',
    name: '',
    description: '',
    addon_type: 'CONSUMO',
    price: 0,
    units_included: 100,
    default_duration_days: 30,
    is_active: true,
    display_order: 0
  };
  showCreateAddon.value = true;
};

const createAddon = async () => {
  if (isSaving.value) return;
  
  if (!newAddon.value.code || !newAddon.value.name || newAddon.value.price < 0) {
    notifyError('Complete los campos requeridos');
    return;
  }
  
  if (newAddon.value.addon_type === 'CONSUMO' && newAddon.value.units_included <= 0) {
    notifyError('Las unidades incluidas son obligatorias para tipo CONSUMO');
    return;
  }
  
  isSaving.value = true;
  try {
    await fetchApi('/api/v1/addons/', {
      method: 'POST',
      data: newAddon.value
    });
    
    notifySuccess('Add-on creado correctamente');
    showCreateAddon.value = false;
    await loadAddons();
  } catch (error: any) {
    console.error('Error creating addon:', error);
    notifyError(`Error al crear add-on: ${error.data?.detail || error.message}`);
  } finally {
    isSaving.value = false;
  }
};

const openEditAddon = (addon: any) => {
  editingAddon.value = { ...addon };
  showEditAddon.value = true;
};

const updateAddon = async () => {
  if (isSaving.value || !editingAddon.value) return;
  
  if (!editingAddon.value.code || !editingAddon.value.name || editingAddon.value.price < 0) {
    notifyError('Complete los campos requeridos');
    return;
  }
  
  if (editingAddon.value.addon_type === 'CONSUMO' && editingAddon.value.units_included <= 0) {
    notifyError('Las unidades incluidas son obligatorias para tipo CONSUMO');
    return;
  }
  
  isSaving.value = true;
  try {
    await fetchApi(`/api/v1/addons/${editingAddon.value.id}/`, {
      method: 'PATCH',
      data: editingAddon.value
    });
    
    notifySuccess('Add-on actualizado correctamente');
    showEditAddon.value = false;
    editingAddon.value = null;
    await loadAddons();
  } catch (error: any) {
    console.error('Error updating addon:', error);
    notifyError(`Error al actualizar add-on: ${error.data?.detail || error.message}`);
  } finally {
    isSaving.value = false;
  }
};

const toggleAddonActive = async (addon: any) => {
  const title = addon.is_active ? '¿Desactivar Add-on?' : '¿Activar Add-on?';
  const message = addon.is_active 
    ? 'Esta acción es reversible. Los datos históricos se mantendrán íntegros. El add-on dejará de estar disponible para nuevos clientes.'
    : 'Esta acción es reversible. Los datos históricos se mantendrán íntegros. El add-on estará disponible para nuevos clientes.';

  const result = await Swal.fire({
    title,
    text: message,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: addon.is_active ? '#ef4444' : '#22c55e',
    cancelButtonColor: '#64748b',
    confirmButtonText: addon.is_active ? 'Sí, desactivar' : 'Sí, activar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    try {
      await fetchApi(`/api/v1/addons/${addon.id}/`, {
        method: 'PATCH',
        data: JSON.stringify({ is_active: !addon.is_active })
      });
      addon.is_active = !addon.is_active;
      notifySuccess(addon.is_active ? 'Add-on activado correctamente' : 'Add-on desactivado correctamente');
    } catch (error) {
      console.error('Error updating addon status:', error);
      notifyError('Error al actualizar estado');
    }
  }
};



onMounted(() => {
  if (!isStaff.value) {
    notifyError('No tiene permisos de super-admin');
    return;
  }
  loadAllData();
});
</script>