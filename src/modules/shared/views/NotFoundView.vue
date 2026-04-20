<template>
  <div class="h-screen w-screen bg-[#0f172a] flex items-center justify-center px-6">
    <div class="text-center max-w-2xl">
      <!-- Logo Section -->
      <div class="flex justify-center mb-8">
        <img 
          src="/assets/logo.svg" 
          alt="Efectivo 360" 
          class="h-16 w-16"
        />
      </div>
      
      <!-- 404 Display -->
      <div class="flex justify-center mb-6">
        <div class="p-6 bg-slate-800/30 rounded-2xl border border-slate-700/50">
          <h1 class="text-9xl font-bold text-white">404</h1>
        </div>
      </div>
      
      <!-- Error Message -->
      <h2 class="text-3xl font-semibold text-slate-300 mb-4">
        Página no encontrada
      </h2>
      <p class="text-slate-400 mb-8 text-lg max-w-md mx-auto leading-relaxed">
        La ruta que buscas no existe o ha sido movida. 
        Por favor, verifica la URL o regresa al panel principal.
      </p>

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <button 
          @click="$router.push('/admin')"
          class="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-blue-600/25"
        >
          <component :is="'LayoutDashboard'" class="w-5 h-5" />
          Ir al Dashboard
        </button>
        
        <button 
          @click="$router.back()"
          class="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-all duration-200 border border-slate-600 hover:border-slate-500"
        >
          Volver atrás
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
/* Full screen override */
body, html {
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>
