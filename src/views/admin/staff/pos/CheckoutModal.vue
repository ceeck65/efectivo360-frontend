<template>
  <div class="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
    <div class="bg-white w-full max-w-md rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] border border-slate-200/80 relative z-10 flex flex-col overflow-hidden text-slate-800" @click.stop>

      <!-- Header -->
      <div class="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-start gap-2">
        <div>
          <h3 class="text-sm font-black uppercase tracking-wider text-slate-800">Finalizar Venta</h3>
          <p class="text-[10px] text-slate-400 font-medium">Configure la divisa y modalidad de pago</p>
        </div>
        <div class="flex items-start gap-2">
          <button
            v-if="mode === 'contado'"
            type="button"
            @click="toggleKeypad"
            :title="showKeypad ? 'Ocultar teclado numérico' : 'Mostrar teclado numérico'"
            class="mt-0.5 w-6 h-6 shrink-0 flex items-center justify-center rounded-lg transition-colors"
            :class="showKeypad ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'">
            <Keyboard class="w-3.5 h-3.5" />
          </button>
          <div class="text-right">
            <span class="bg-emerald-50 border border-emerald-200 text-emerald-700 font-black px-3 py-1 rounded-xl text-base shadow-sm block">
              ${{ formatUSD(totalUsd) }}
            </span>
            <span class="text-[10px] text-slate-400 font-bold font-mono block mt-0.5">Bs. {{ formatVES(totalVes) }}</span>
          </div>
        </div>
      </div>

      <!-- Modalidad de Pago -->
      <div class="p-3 pb-0">
        <div class="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button @click="setMode('contado')"
            class="flex flex-col items-center gap-1 py-2 rounded-lg font-black text-[10px] uppercase tracking-wide transition-all"
            :class="mode === 'contado' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'">
            <Wallet class="w-4 h-4" /> Contado
          </button>
          <button @click="setMode('credito')"
            class="flex flex-col items-center gap-1 py-2 rounded-lg font-black text-[10px] uppercase tracking-wide transition-all"
            :class="mode === 'credito' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'">
            <CreditCard class="w-4 h-4" /> Crédito / Fiado
          </button>
          <button @click="setMode('apartado')"
            class="flex flex-col items-center gap-1 py-2 rounded-lg font-black text-[10px] uppercase tracking-wide transition-all"
            :class="mode === 'apartado' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'">
            <CalendarClock class="w-4 h-4" /> Apartado
          </button>
        </div>
      </div>

      <!-- Cuerpo -->
      <div class="p-4 space-y-4"
        :class="mode === 'contado' && !showKeypad ? 'max-h-fit' : 'max-h-[70vh] overflow-y-auto'">

        <!-- Cliente (siempre visible: lo requiere crédito, apartado y factura fiscal) -->
        <div class="space-y-1.5">
          <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Cliente</label>
          <div class="flex items-center gap-1.5">
            <button @click="emit('open-customer-selector')"
              class="flex-1 min-w-0 flex items-center justify-between gap-2 bg-white border border-slate-300 rounded-lg px-3 py-2 shadow-sm hover:border-blue-400 transition-colors">
              <div class="flex items-center gap-2 min-w-0">
                <div class="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-black shrink-0">
                  {{ selectedCustomer ? 'C' : '👤' }}
                </div>
                <div class="min-w-0 text-left">
                  <p class="text-xs font-bold text-slate-800 truncate">{{ customerDisplayName(selectedCustomer) }}</p>
                  <p v-if="selectedCustomer" class="text-[9px] text-slate-400 font-mono">{{ selectedCustomer.identity_document }}</p>
                </div>
              </div>
              <span class="text-[10px] text-blue-600 font-semibold shrink-0">{{ selectedCustomer ? 'Cambiar' : 'Seleccionar' }}</span>
            </button>
            <button v-if="selectedCustomer" type="button" @click="emit('open-customer-editor')" title="Editar datos del cliente"
              class="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <Pencil class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <Transition name="tab-fade" mode="out-in">
        <div :key="mode" class="space-y-4">

        <!-- ═══════ MODO: CRÉDITO / FIADO ═══════ -->
        <template v-if="mode === 'credito'">
          <div v-if="!selectedCustomer" class="bg-blue-50 border border-blue-200 rounded-xl px-4 py-4 flex flex-col items-center gap-2.5 text-center">
            <CreditCard class="w-6 h-6 text-blue-500" />
            <p class="text-xs text-blue-700 font-semibold max-w-[260px]">
              Estás vendiendo a "Consumidor Final". Para vender a crédito necesitas un cliente registrado con cuenta de crédito.
            </p>
            <button @click="emit('open-customer-selector')"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm">
              🔍 Seleccionar Cliente con Crédito
            </button>
          </div>

          <template v-else>
            <!-- Tarjeta de Estado Financiero del Cliente -->
            <div class="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Estado Financiero del Cliente</p>
              <div v-if="creditLoading" class="text-[11px] text-slate-400 py-2 text-center">Consultando cuenta...</div>
              <template v-else-if="creditStatus">
                <div class="grid grid-cols-2 gap-2">
                  <div class="bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-center">
                    <p class="text-[9px] text-slate-400 uppercase font-bold">Límite de Crédito</p>
                    <div v-if="editingCreditLimit" class="flex items-center justify-center gap-0.5 mt-0.5">
                      <span class="text-xs font-black text-slate-400">$</span>
                      <input
                        ref="creditLimitInputRef"
                        v-model="creditLimitDraft"
                        type="text"
                        inputmode="decimal"
                        :disabled="creditLimitSaving"
                        @keydown.enter.prevent="($event.target as HTMLInputElement).blur()"
                        @keydown.esc="cancelEditCreditLimit"
                        @blur="commitCreditLimit"
                        class="w-16 text-sm font-black text-slate-800 text-center bg-amber-50 border border-amber-300 rounded outline-none focus:ring-2 focus:ring-blue-400/40" />
                    </div>
                    <button v-else-if="canManageCredit" type="button" @click="startEditCreditLimit"
                      class="text-sm font-black text-slate-700 hover:text-blue-600 underline decoration-dashed decoration-slate-300 underline-offset-2 transition-colors">
                      ${{ formatUSD(creditStatus.credit_limit) }}
                    </button>
                    <p v-else class="text-sm font-black text-slate-700">${{ formatUSD(creditStatus.credit_limit) }}</p>
                  </div>
                  <div class="bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-center">
                    <p class="text-[9px] text-slate-400 uppercase font-bold">Deuda Actual</p>
                    <p class="text-sm font-black text-amber-600">${{ formatUSD(creditStatus.balance_usd) }}</p>
                  </div>
                  <div class="bg-white border rounded-lg px-2.5 py-2 text-center"
                    :class="exceedsAvailableCredit ? 'border-rose-200' : 'border-emerald-200'">
                    <p class="text-[9px] text-slate-400 uppercase font-bold">Crédito Disponible</p>
                    <p class="text-sm font-black" :class="exceedsAvailableCredit ? 'text-rose-600' : 'text-emerald-600'">
                      ${{ formatUSD(creditStatus.available_credit_usd) }}
                    </p>
                  </div>
                  <div class="bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-center flex flex-col items-center justify-center gap-0.5">
                    <p class="text-[9px] text-slate-400 uppercase font-bold">Días de Plazo</p>
                    <span class="inline-block px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-black">
                      {{ selectedCustomer.credit_days }} días
                    </span>
                  </div>
                </div>
                <p v-if="creditLimitError" class="text-[10px] text-rose-600 font-semibold text-center mt-1.5">{{ creditLimitError }}</p>
                <p class="text-[10px] text-slate-400 text-center mt-2">Vence el {{ creditDueDateLabel }} · plazo configurado en la ficha del cliente</p>
              </template>
              <div v-else class="text-[11px] text-rose-500 py-2 text-center">No se pudo consultar la cuenta de crédito.</div>
            </div>

            <div v-if="creditStatus && (hasNoCreditLine || exceedsAvailableCredit)" class="bg-rose-50 border border-rose-300 rounded-xl px-3 py-3 space-y-2.5">
              <div class="flex items-start gap-2">
                <AlertTriangle class="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p class="text-xs text-rose-700 font-semibold">
                  <template v-if="hasNoCreditLine">Este cliente no tiene línea de crédito autorizada.</template>
                  <template v-else>El monto de la venta (${{ formatUSD(creditNeededUsd) }}) excede el crédito disponible del cliente (${{ formatUSD(creditStatus.available_credit_usd) }}).</template>
                </p>
              </div>
              <button v-if="canManageCredit && !isOverLimitDebtor" type="button" @click="expressApprove" :disabled="expressApproving"
                class="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-sm">
                <template v-if="expressApproving">Procesando…</template>
                <template v-else-if="hasNoCreditLine">🔓 Habilitar Crédito y Fiar esta venta (${{ formatUSD(creditNeededUsd) }})</template>
                <template v-else>⚡ Aprobar y Fiar esta venta (${{ formatUSD(creditNeededUsd) }})</template>
              </button>
              <p v-else-if="canManageCredit && isOverLimitDebtor" class="text-[10px] text-rose-700 font-semibold text-center">
                Cliente con saldo vencido por encima de su límite: ajusta el límite manualmente arriba si decides autorizarlo.
              </p>
              <p v-if="expressApproveError" class="text-[10px] text-rose-700 font-semibold text-center">{{ expressApproveError }}</p>
            </div>
            <div v-else-if="creditStatus" class="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5 flex items-center gap-2">
              <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0" />
              <p class="text-xs text-emerald-700 font-semibold">Cuenta al día. Puedes aprobar y procesar el crédito.</p>
            </div>

            <!-- Modalidad del Crédito -->
            <div class="space-y-2">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Modalidad del Crédito</label>
              <div class="grid grid-cols-2 gap-2 p-0.5 bg-slate-200/60 rounded-lg border border-slate-200">
                <button @click="creditType = 'total'; downPayment = ''"
                  class="py-1.5 rounded-md font-bold text-xs transition-all"
                  :class="creditType === 'total' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'">Crédito Total</button>
                <button @click="creditType = 'abono'"
                  class="py-1.5 rounded-md font-bold text-xs transition-all"
                  :class="creditType === 'abono' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'">Con Abono</button>
              </div>
            </div>

            <!-- Pago del abono (solo si hay abono) -->
            <template v-if="creditType === 'abono'">
              <div class="space-y-1.5">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Método de Pago del Abono</span>
                <div v-if="filteredMethods.length === 0" class="text-[11px] text-slate-400 text-center py-3 bg-slate-50 rounded-xl border border-slate-200">
                  No hay métodos de pago disponibles para {{ selectedCurrency }}
                </div>
                <div v-else class="grid grid-cols-2 gap-2">
                  <button v-for="m in filteredMethods" :key="m.id" @click="selectMethod(m)"
                    class="border-2 p-2 rounded-xl font-bold text-xs shadow-sm text-center transition-all"
                    :class="selectedMethod?.id === m.id ? 'border-blue-600 bg-blue-50 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-500'">
                    <span class="block text-sm font-black">{{ m.label || m.name }}</span>
                    <span class="text-[9px] text-slate-400 font-medium uppercase mt-0.5 block">{{ m.code }}</span>
                  </button>
                </div>
              </div>

              <div v-if="selectedMethod && needsReference(selectedMethod)" class="space-y-1">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  N° de Comprobante / Referencia <span class="text-rose-500">*</span>
                </span>
                <input v-model="reference" type="text" placeholder="Ingrese el número de referencia (mín. 4 dígitos)"
                  class="w-full h-11 px-3 text-sm border border-slate-300 rounded-xl bg-white text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 shadow-sm" />
              </div>

              <div class="space-y-1">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Monto del Abono ({{ selectedCurrency === 'USD' ? '$' : 'Bs.' }})</span>
                <div class="relative border-2 border-slate-300 bg-slate-50 rounded-xl px-3 py-2.5 flex items-center justify-between focus-within:border-blue-500 shadow-inner transition-all">
                  <span class="text-sm font-black text-slate-500 mr-2">{{ selectedCurrency === 'USD' ? '$' : 'Bs.' }}</span>
                  <input :value="downPayment" type="text" inputmode="decimal" placeholder="0.00"
                    class="bg-transparent text-right text-xl font-black text-slate-800 w-full focus:outline-none placeholder:text-slate-300" readonly />
                </div>
              </div>

              <div class="grid grid-cols-4 gap-1.5 bg-slate-100 p-2 rounded-xl border border-slate-200 shadow-inner">
                <button v-for="k in numpadKeys" :key="k" @click="numpadPress(k, 'downPayment')"
                  class="rounded-lg shadow-sm text-sm transition-all active:translate-y-0.5 active:shadow-none"
                  :class="numpadKeyClass(k)">
                  <span v-if="k === '⌫'"><Trash2 class="w-3.5 h-3.5 mx-auto" /></span>
                  <span v-else-if="k === '✓'">✓</span>
                  <span v-else>{{ k }}</span>
                </button>
              </div>

              <p class="text-[11px] text-slate-500">
                Saldo a crédito: <span class="font-bold text-slate-700">${{ formatUSD(creditNeededUsd) }}</span>
              </p>
            </template>
          </template>
        </template>

        <!-- ═══════ MODO: APARTADO / RESERVA ═══════ -->
        <template v-else-if="mode === 'apartado'">
          <div v-if="!selectedCustomer" class="bg-blue-50 border border-blue-200 rounded-xl px-4 py-4 flex flex-col items-center gap-2.5 text-center">
            <CalendarClock class="w-6 h-6 text-blue-500" />
            <p class="text-xs text-blue-700 font-semibold max-w-[260px]">
              El apartado requiere un cliente registrado para poder darle seguimiento al saldo pendiente.
            </p>
            <button @click="emit('open-customer-selector')"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm">
              🔍 Seleccionar Cliente
            </button>
          </div>

          <template v-else>
            <!-- Sección 1: Abono Inicial ($ y Bs) -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Abono Inicial</span>
                <span class="text-[10px] text-slate-400">Mínimo {{ minDepositPercent }}%: ${{ formatUSD(minDepositUsd) }}</span>
              </div>
              <div class="relative border-2 border-slate-300 bg-slate-50 rounded-xl px-3 py-2.5 flex items-center justify-between focus-within:border-blue-500 shadow-inner transition-all">
                <span class="text-sm font-black text-slate-500 mr-2">$</span>
                <input :value="depositAmount" type="text" inputmode="decimal" placeholder="0.00"
                  class="bg-transparent text-right text-xl font-black text-slate-800 w-full focus:outline-none placeholder:text-slate-300" readonly />
              </div>
              <p class="text-[10px] text-slate-400 text-right font-mono">≈ Bs. {{ formatVES(depositAmountVes) }}</p>

              <div class="grid grid-cols-3 gap-1.5">
                <button v-for="pct in depositQuickPercents" :key="pct" @click="applyDepositPercent(pct)"
                  class="h-8 rounded-lg border text-xs font-bold transition-colors"
                  :class="isDepositPercentActive(pct) ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'">
                  {{ pct }}%
                </button>
              </div>

              <p v-if="depositBelowMinimum" class="text-[11px] text-rose-600 font-semibold">
                El abono inicial debe ser al menos {{ minDepositPercent }}% del total (mínimo ${{ formatUSD(minDepositUsd) }}).
              </p>
            </div>

            <div class="grid grid-cols-4 gap-1.5 bg-slate-100 p-2 rounded-xl border border-slate-200 shadow-inner">
              <button v-for="k in numpadKeys" :key="k" @click="numpadPress(k, 'depositAmount')"
                class="rounded-lg shadow-sm text-sm transition-all active:translate-y-0.5 active:shadow-none"
                :class="numpadKeyClass(k)">
                <span v-if="k === '⌫'"><Trash2 class="w-3.5 h-3.5 mx-auto" /></span>
                <span v-else-if="k === '✓'">✓</span>
                <span v-else>{{ k }}</span>
              </button>
            </div>

            <!-- Sección 2: Resumen Financiero del Apartado -->
            <div class="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-500 font-semibold">Total Carrito</span>
                <span class="font-black text-slate-700">${{ formatUSD(totalUsd) }}</span>
              </div>
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-500 font-semibold">Monto Abono Inicial</span>
                <span class="font-black text-slate-700">${{ formatUSD(depositAmountUsd) }}</span>
              </div>
              <div class="border-t border-dashed border-slate-200 pt-1.5 flex items-center justify-between">
                <span class="text-xs font-bold text-slate-600">Saldo Pendiente por Liquidar</span>
                <span class="text-base font-black text-blue-700">${{ formatUSD(pendingBalanceUsd) }}</span>
              </div>
            </div>

            <!-- Sección 3: Método de Pago del Abono -->
            <div class="space-y-1.5">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Método de Pago del Abono</span>
              <div v-if="filteredMethods.length === 0" class="text-[11px] text-slate-400 text-center py-3 bg-slate-50 rounded-xl border border-slate-200">
                No hay métodos de pago disponibles para {{ selectedCurrency }}
              </div>
              <div v-else class="grid grid-cols-2 gap-2">
                <button v-for="m in filteredMethods" :key="m.id" @click="selectMethod(m)"
                  class="border-2 p-2 rounded-xl font-bold text-xs shadow-sm text-center transition-all"
                  :class="selectedMethod?.id === m.id ? 'border-blue-600 bg-blue-50 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-500'">
                  <span class="block text-sm font-black">{{ m.label || m.name }}</span>
                  <span class="text-[9px] text-slate-400 font-medium uppercase mt-0.5 block">{{ m.code }}</span>
                </button>
              </div>
            </div>

            <div v-if="selectedMethod && needsReference(selectedMethod)" class="space-y-1">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                N° de Comprobante / Referencia <span class="text-rose-500">*</span>
              </span>
              <input v-model="reference" type="text" placeholder="Ingrese el número de referencia (mín. 4 dígitos)"
                class="w-full h-11 px-3 text-sm border border-slate-300 rounded-xl bg-white text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 shadow-sm" />
            </div>

            <!-- Sección 4: Fecha Límite de Retiro / Plazo -->
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Fecha Límite de Retiro</label>
              <div class="grid grid-cols-3 gap-2">
                <button v-for="d in [15, 30, 45]" :key="d" @click="setExpirationDays(d)"
                  class="h-9 rounded-lg border text-sm font-bold transition-colors"
                  :class="expirationDays === d && !useCustomExpirationDate ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'">
                  {{ d }} días
                </button>
              </div>
              <input type="date" :min="minExpirationDateStr" v-model="customExpirationDate" @change="useCustomExpirationDate = true"
                class="w-full h-9 px-3 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
              <p class="text-[10px] text-slate-400">Vence el {{ formatExpirationDate }}</p>
            </div>
          </template>
        </template>

        <!-- ═══════ MODO: CONTADO ═══════ -->
        <template v-else>
          <!-- Selector de Moneda -->
          <div class="flex justify-between items-center bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-2">Moneda de Entrada</span>
            <div class="flex bg-white p-0.5 rounded-lg border border-slate-200 shadow-sm">
              <button @click="switchCurrency('USD')"
                class="px-3 py-1 rounded-md text-xs font-black transition-all"
                :class="selectedCurrency === 'USD' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'">USD ($)</button>
              <button @click="switchCurrency('VES')"
                class="px-3 py-1 rounded-md text-xs font-bold transition-all"
                :class="selectedCurrency === 'VES' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'">VES (Bs)</button>
            </div>
          </div>

          <!-- Métodos de Pago Dinámicos -->
          <div class="space-y-1.5">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Método de Pago</span>
            <div v-if="filteredMethods.length === 0" class="text-[11px] text-slate-400 text-center py-3 bg-slate-50 rounded-xl border border-slate-200">
              No hay métodos de pago disponibles para {{ selectedCurrency }}
            </div>
            <div v-else class="grid grid-cols-2 gap-2">
              <button v-for="m in filteredMethods" :key="m.id" @click="selectMethod(m)"
                class="border-2 p-2.5 rounded-xl font-bold text-xs shadow-sm text-center transition-all"
                :class="selectedMethod?.id === m.id ? 'border-blue-600 bg-blue-50 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-500'">
                <span class="block text-sm font-black">{{ m.label || m.name }}</span>
                <span class="text-[9px] text-slate-400 font-medium uppercase mt-0.5 block">{{ m.code }}</span>
              </button>
            </div>
          </div>

          <!-- Referencia para pagos electrónicos -->
          <div v-if="selectedMethod && needsReference(selectedMethod)" class="space-y-1">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              N° de Comprobante / Referencia <span class="text-rose-500">*</span>
            </span>
            <input v-model="reference"
              type="text" placeholder="Ingrese el número de referencia (mín. 4 dígitos)"
              class="w-full h-11 px-3 text-sm border border-slate-300 rounded-xl bg-white text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 shadow-sm" />
          </div>

          <!-- Monto a Recibir -->
          <div class="space-y-1.5">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Monto a Recibir</span>
            <div class="relative border-2 border-slate-300 bg-slate-50 rounded-xl px-3 py-2.5 flex items-center justify-between focus-within:border-blue-500 shadow-inner transition-all">
              <span class="text-sm font-black text-slate-500 mr-2">{{ selectedCurrency === 'USD' ? '$' : 'Bs.' }}</span>
              <input
                ref="amountInputRef"
                v-model="amountReceived"
                type="text"
                inputmode="decimal"
                placeholder="0.00"
                :readonly="showKeypad"
                @keydown.enter.prevent="confirm"
                class="bg-transparent text-right w-full focus:outline-none placeholder:text-slate-300 text-slate-800"
                :class="showKeypad ? 'text-xl font-black' : 'text-2xl font-bold'" />
              <div v-if="showKeypad" class="flex gap-1 ml-2">
                <button @click="numpadQuick(20)" class="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 px-2 py-1 rounded-lg transition-all shadow-sm">$20</button>
                <button @click="numpadQuick(50)" class="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 px-2 py-1 rounded-lg transition-all shadow-sm">$50</button>
                <button @click="numpadQuick(100)" class="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 px-2 py-1 rounded-lg transition-all shadow-sm">$100</button>
              </div>
            </div>

            <!-- Accesos rápidos compactos (modo escritorio, sin teclado virtual) -->
            <div v-if="!showKeypad" class="grid grid-cols-4 gap-1.5">
              <button @click="setExactAmount"
                class="h-9 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 text-[11px] font-bold transition-colors">
                Exacto
              </button>
              <button @click="numpadQuick(20)"
                class="h-9 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 text-[11px] font-bold transition-colors">
                $20
              </button>
              <button @click="numpadQuick(50)"
                class="h-9 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 text-[11px] font-bold transition-colors">
                $50
              </button>
              <button @click="numpadQuick(100)"
                class="h-9 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 text-[11px] font-bold transition-colors">
                $100
              </button>
            </div>
          </div>

          <!-- Teclado Numérico Virtual (modo táctil) -->
          <div v-if="showKeypad" class="grid grid-cols-4 gap-1.5 bg-slate-100 p-2 rounded-xl border border-slate-200 shadow-inner">
            <button v-for="k in numpadKeys" :key="k" @click="numpadPress(k, 'amountReceived')"
              class="rounded-lg shadow-sm text-sm transition-all active:translate-y-0.5 active:shadow-none"
              :class="numpadKeyClass(k)">
              <span v-if="k === '⌫'"><Trash2 class="w-3.5 h-3.5 mx-auto" /></span>
              <span v-else-if="k === '✓'">✓</span>
              <span v-else>{{ k }}</span>
            </button>
          </div>

          <!-- Vuelto -->
          <div class="min-h-[52px]">
            <div v-if="changeUSD > 0"
              class="bg-emerald-50 border border-emerald-300 rounded-xl px-3 py-2 text-center transition-all duration-300 shadow-sm">
              <span class="text-[9px] font-bold uppercase tracking-wider text-emerald-600 block">Vuelto a entregar</span>
              <p class="text-base font-black text-emerald-600">${{ formatUSD(changeUSD) }}</p>
              <p class="text-[10px] font-medium text-emerald-500 font-mono">o Bs. {{ formatVES(changeVES) }}</p>
            </div>
          </div>
        </template>

        </div>
        </Transition>

        <!-- Toggle de Factura Fiscal (aplica a los 3 modos) -->
        <div class="border-t border-b border-slate-100 py-3 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-base">🧾</span>
            <div>
              <span class="text-xs font-black text-slate-700 block">¿Requiere Factura Fiscal?</span>
              <p class="text-[10px] text-slate-400">Exige RIF/CI, razón social y dirección completos</p>
            </div>
          </div>
          <input type="checkbox" :checked="requiresFiscalInvoice"
            @change="emit('update:requiresFiscalInvoice', ($event.target as HTMLInputElement).checked)"
            class="w-5 h-5 accent-blue-600 cursor-pointer rounded" />
        </div>
      </div>

      <!-- Error banner -->
      <div v-if="errorMessage" class="mx-3 mb-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
        <p class="flex-1 text-red-600 text-xs font-medium">{{ errorMessage }}</p>
        <button @click="$emit('clear-error')" aria-label="Cerrar error"
          class="shrink-0 text-red-400 hover:text-red-600 transition-colors">
          <X class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Footer -->
      <div class="p-3 bg-slate-50 border-t border-slate-200 flex gap-2 justify-end items-center">
        <div class="flex-1 text-[10px] text-slate-400 font-mono">
          Tasa BCV: Bs. {{ formatVES(tasaBcv) }}
        </div>
        <button @click="$emit('close')" :disabled="processing"
          class="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed">
          Cancelar
        </button>
        <button @click="confirm"
          :disabled="!canConfirm || processing"
          class="px-5 py-2 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-[0.98] disabled:shadow-none"
          :class="mode === 'apartado' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'">
          {{ processing ? 'Procesando…' : confirmLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import { Trash2, X, Wallet, CreditCard, CalendarClock, AlertTriangle, CheckCircle2, Keyboard, Pencil } from 'lucide-vue-next';
import type { PaymentMethod } from '@/services/treasury.service';
import type { Customer } from '@/composables/useCustomers';
import { customerDisplayName } from '@/composables/usePos';
import { useCreditAccount } from '@/composables/useCreditAccount';
import { useCustomers } from '@/composables/useCustomers';
import { LAYAWAY_MIN_DEPOSIT_PERCENT } from '@/composables/useLayaway';
import { usePOSSettingsStore } from '@/stores/posSettings';
import { useAuthStore } from '@/stores/auth';

export type CheckoutMode = 'contado' | 'credito' | 'apartado';

interface CheckoutPayment {
  payment_method_id: string;
  gavetero_id: string;
  amount_usd: number;
  amount_ves: number;
  reference: string;
}

export interface CheckoutConfirmPayload {
  payments: CheckoutPayment[];
  isCredit: boolean;
  clientId: string | null;
  requiresFiscalInvoice: boolean;
}

export interface LayawayConfirmPayload {
  clientId: string;
  initialDepositUsd: number;
  expirationDays: number;
  gaveteroId: string | null;
}

const props = defineProps<{
  totalUsd: number;
  totalVes: number;
  tasaBcv: number;
  paymentMethods: PaymentMethod[];
  processing?: boolean;
  errorMessage?: string | null;
  selectedCustomer: Customer | null;
  isCreditSale: boolean;
  requiresFiscalInvoice: boolean;
}>();

const emit = defineEmits<{
  confirm: [payload: CheckoutConfirmPayload];
  'confirm-layaway': [payload: LayawayConfirmPayload];
  close: [];
  'clear-error': [];
  'open-customer-selector': [];
  'open-customer-editor': [];
  'update:isCreditSale': [v: boolean];
  'update:requiresFiscalInvoice': [v: boolean];
}>();

// Teclado numérico virtual: por defecto sigue la preferencia del usuario (táctil vs.
// escritorio), pero puede alternarse puntualmente desde el modal sin persistir el cambio.
const posSettingsStore = usePOSSettingsStore();
const showKeypad = ref(posSettingsStore.showVirtualKeypad);
function toggleKeypad() {
  showKeypad.value = !showKeypad.value;
}

const amountInputRef = ref<HTMLInputElement | null>(null);
function focusAmountInput() {
  if (showKeypad.value) return;
  nextTick(() => amountInputRef.value?.focus());
}

// Modalidad de pago
const mode = ref<CheckoutMode>(props.isCreditSale ? 'credito' : 'contado');
function setMode(next: CheckoutMode) {
  if (next === mode.value) return;
  mode.value = next;
  emit('update:isCreditSale', next === 'credito');
  // Evita que datos de una modalidad (referencia, abono) se filtren a la siguiente.
  reference.value = '';
  if (next !== 'credito') { creditType.value = 'total'; downPayment.value = ''; }
  if (next !== 'apartado') { depositAmount.value = ''; useCustomExpirationDate.value = false; }
}

// Moneda
const selectedCurrency = ref<'USD' | 'VES'>('USD');
const amountReceived = ref('');
const reference = ref('');

// Método de pago seleccionado (compartido entre Contado / abono de Crédito / abono de Apartado)
const selectedMethod = ref<PaymentMethod | null>(null);

const filteredMethods = computed(() => {
  if (!props.paymentMethods || !Array.isArray(props.paymentMethods)) return [];

  const targetCurrency = selectedCurrency.value.toUpperCase().trim();

  return props.paymentMethods.filter(m => {
    if (!m.is_enabled) return false;
    const methodCurrency = (m.gavetero?.currency || m.currency || '').toUpperCase().trim();
    return methodCurrency === targetCurrency;
  });
});

// Auto-select first method when list changes
watch(filteredMethods, (list) => {
  if (list.length > 0 && (!selectedMethod.value || !list.some(m => m.id === selectedMethod.value?.id))) {
    selectedMethod.value = list[0];
  }
}, { immediate: true });

function selectMethod(m: PaymentMethod) {
  selectedMethod.value = m;
  reference.value = '';
}

const cashCodes = new Set(['cash']);
function needsReference(m: PaymentMethod): boolean {
  return !cashCodes.has(m.code?.toLowerCase());
}

// Numpad
const numpadKeys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '00', '0', '.', '⌫', '✓'];

// ═══════ Crédito / Fiado ═══════
const creditType = ref<'total' | 'abono'>('total');
const downPayment = ref('');

const { status: creditStatus, loading: creditLoading, fetchCreditStatus, reset: resetCreditStatus } = useCreditAccount();

// Segunda fuente (selectedCustomer completo, no solo .id): re-consulta el estado de
// crédito cuando CustomerFormModal guarda cambios sobre el mismo cliente (nuevo objeto,
// mismo id) — p.ej. si el límite se editó ahí en vez de inline en este modal.
watch([mode, () => props.selectedCustomer?.id, () => props.selectedCustomer], ([m, customerId]) => {
  if (m === 'credito' && customerId) {
    fetchCreditStatus(customerId);
  } else if (!customerId) {
    resetCreditStatus();
  }
}, { immediate: true });

const downPaymentUsd = computed(() => parseFloat(downPayment.value.replace(/[^0-9.]/g, '')) || 0);

/** Monto que realmente se registra como crédito: total menos el abono (si lo hay). */
const creditNeededUsd = computed(() => {
  if (creditType.value === 'total') return props.totalUsd;
  return Math.max(0, props.totalUsd - downPaymentUsd.value);
});

const exceedsAvailableCredit = computed(() => {
  if (!creditStatus.value) return false;
  return creditNeededUsd.value > Number(creditStatus.value.available_credit_usd);
});

/** Cliente con cuenta de crédito consultada pero sin línea autorizada (límite $0). */
const hasNoCreditLine = computed(() => {
  if (!creditStatus.value) return false;
  return Number(creditStatus.value.credit_limit) <= 0;
});

/**
 * Deudor por encima de su propio límite (saldo vencido), a diferencia del caso normal
 * de "sin línea de crédito todavía" o "límite insuficiente para esta venta puntual".
 * Aquí NO se ofrece el botón de 1-click: exige ajuste manual del límite arriba.
 */
const isOverLimitDebtor = computed(() => creditStatus.value?.debt_status === 'over-limit');

/** Fecha estimada de vencimiento según el plazo configurado en la ficha del cliente. */
const creditDueDateLabel = computed(() => {
  const days = props.selectedCustomer?.credit_days ?? 0;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
});

// ═══════ Aprobación exprés / edición inline de crédito (solo Admin/Owner/Manager) ═══════
const authStore = useAuthStore();
const { updateCustomer, error: customerUpdateError } = useCustomers();

/** Mismo criterio que apps.accounts.permissions.IsOwnerOrManagerOrTenantAdmin en el backend:
 *  si este chequeo se afloja aquí sin aflojar el del backend, el botón simplemente no
 *  aparecerá para ese usuario (el backend sigue siendo quien realmente autoriza el PATCH). */
const canManageCredit = computed(() => {
  const u = authStore.user;
  if (!u) return false;
  if (u.is_superuser) return true;
  if (u.role === 'OWNER' || u.role === 'MANAGER') return true;
  return u.user_type === 'ADMIN';
});

const editingCreditLimit = ref(false);
const creditLimitDraft = ref('');
const creditLimitSaving = ref(false);
const creditLimitError = ref<string | null>(null);
const creditLimitInputRef = ref<HTMLInputElement | null>(null);

function startEditCreditLimit() {
  if (!canManageCredit.value || !creditStatus.value || !props.selectedCustomer) return;
  creditLimitDraft.value = String(creditStatus.value.credit_limit);
  creditLimitError.value = null;
  editingCreditLimit.value = true;
  nextTick(() => creditLimitInputRef.value?.focus());
}

function cancelEditCreditLimit() {
  editingCreditLimit.value = false;
  creditLimitError.value = null;
}

/** Aplica el nuevo límite a creditStatus en memoria sin volver a golpear el backend. */
function applyCreditLimitLocally(newLimitUsd: number) {
  if (!creditStatus.value) return;
  const balance = Number(creditStatus.value.balance_usd);
  creditStatus.value = {
    ...creditStatus.value,
    credit_limit: newLimitUsd.toFixed(2),
    available_credit_usd: Math.max(0, newLimitUsd - balance).toFixed(2),
  };
}

async function commitCreditLimit() {
  if (!editingCreditLimit.value) return;
  if (!props.selectedCustomer || !creditStatus.value) { editingCreditLimit.value = false; return; }

  const value = parseFloat(creditLimitDraft.value.replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(value) || value < 0) {
    creditLimitError.value = 'Ingresa un monto válido.';
    return;
  }

  creditLimitSaving.value = true;
  creditLimitError.value = null;
  const updated = await updateCustomer(props.selectedCustomer.id, { credit_limit_usd: value });
  creditLimitSaving.value = false;

  if (!updated) {
    creditLimitError.value = customerUpdateError.value || 'No se pudo actualizar el límite de crédito.';
    return;
  }
  applyCreditLimitLocally(Number(updated.credit_limit_usd));
  editingCreditLimit.value = false;
}

const expressApproving = ref(false);
const expressApproveError = ref<string | null>(null);

/**
 * Sube el límite de crédito justo lo necesario para cubrir esta venta ("agregando el
 * faltante", no lo pisa a totalSaleAmount a secas: respeta deuda/abono existentes) y
 * dispara procesarVentaCredito() en el mismo click, sin modal secundario.
 */
async function expressApprove() {
  if (!props.selectedCustomer || !creditStatus.value || expressApproving.value) return;

  const missing = creditNeededUsd.value - Number(creditStatus.value.available_credit_usd);
  if (missing <= 0) return;
  const newLimit = Number((Number(creditStatus.value.credit_limit) + missing).toFixed(2));

  expressApproving.value = true;
  expressApproveError.value = null;
  const updated = await updateCustomer(props.selectedCustomer.id, { credit_limit_usd: newLimit });
  expressApproving.value = false;

  if (!updated) {
    expressApproveError.value = customerUpdateError.value || 'No se pudo aprobar el crédito. Verifica tus permisos e inténtalo de nuevo.';
    return;
  }

  applyCreditLimitLocally(Number(updated.credit_limit_usd));
  await nextTick();
  confirm();
}

// ═══════ Apartado / Reserva ═══════
const depositAmount = ref('');
const expirationDays = ref(30);
const useCustomExpirationDate = ref(false);
const customExpirationDate = ref('');
const minDepositPercent = LAYAWAY_MIN_DEPOSIT_PERCENT;
const depositQuickPercents = [20, 30, 50];

const minDepositUsd = computed(() =>
  Number(((props.totalUsd * minDepositPercent) / 100).toFixed(2))
);

const depositAmountUsd = computed(() => parseFloat(depositAmount.value.replace(/[^0-9.]/g, '')) || 0);
const depositAmountVes = computed(() => depositAmountUsd.value * props.tasaBcv);

const depositBelowMinimum = computed(() =>
  depositAmount.value !== '' && depositAmountUsd.value < minDepositUsd.value
);

const pendingBalanceUsd = computed(() => Math.max(0, props.totalUsd - depositAmountUsd.value));

function applyDepositPercent(pct: number) {
  depositAmount.value = ((props.totalUsd * pct) / 100).toFixed(2);
}

function isDepositPercentActive(pct: number): boolean {
  const target = Number(((props.totalUsd * pct) / 100).toFixed(2));
  return Math.abs(depositAmountUsd.value - target) < 0.005;
}

function setExpirationDays(d: number) {
  expirationDays.value = d;
  useCustomExpirationDate.value = false;
}

const minExpirationDateStr = computed(() => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
});

const expirationDate = computed(() => {
  if (useCustomExpirationDate.value && customExpirationDate.value) {
    return new Date(`${customExpirationDate.value}T00:00:00`);
  }
  const d = new Date();
  d.setDate(d.getDate() + expirationDays.value);
  return d;
});

const formatExpirationDate = computed(() =>
  expirationDate.value.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' })
);

/** Días efectivos que se envían al backend (deriva de la fecha custom si aplica). */
const effectiveExpirationDays = computed(() => {
  if (useCustomExpirationDate.value && customExpirationDate.value) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffMs = expirationDate.value.getTime() - today.getTime();
    return Math.max(1, Math.round(diffMs / 86400000));
  }
  return expirationDays.value;
});

// ═══════ Contado ═══════
function switchCurrency(currency: 'USD' | 'VES') {
  selectedCurrency.value = currency;
  if (currency === 'USD') {
    amountReceived.value = props.totalUsd.toFixed(2);
  } else {
    amountReceived.value = (props.totalUsd * props.tasaBcv).toFixed(2);
  }
}

watch(selectedCurrency, (c) => {
  if (c === 'USD') amountReceived.value = props.totalUsd.toFixed(2);
  else amountReceived.value = (props.totalUsd * props.tasaBcv).toFixed(2);
}, { immediate: true });

function setExactAmount() {
  if (selectedCurrency.value === 'USD') {
    amountReceived.value = props.totalUsd.toFixed(2);
  } else {
    amountReceived.value = (props.totalUsd * props.tasaBcv).toFixed(2);
  }
}

onMounted(() => {
  if (mode.value === 'contado') focusAmountInput();
});

watch(mode, (m) => {
  if (m === 'contado') focusAmountInput();
});

const receivedUSD = computed(() => {
  if (selectedCurrency.value === 'VES') return 0;
  const raw = amountReceived.value.replace(/[^0-9.]/g, '');
  return parseFloat(raw) || 0;
});

const changeUSD = computed(() => Math.max(0, receivedUSD.value - props.totalUsd));
const changeVES = computed(() => changeUSD.value * props.tasaBcv);

// Numpad genérico: escribe en el ref correspondiente al modo/campo activo.
type NumpadTarget = 'amountReceived' | 'downPayment' | 'depositAmount';
function targetRef(target: NumpadTarget) {
  if (target === 'downPayment') return downPayment;
  if (target === 'depositAmount') return depositAmount;
  return amountReceived;
}
function numpadPress(k: string, target: NumpadTarget) {
  if (k === '✓') { confirm(); return; }
  const r = targetRef(target);
  if (k === '⌫') { r.value = r.value.slice(0, -1); return; }
  if (k === '.' && r.value.includes('.')) return;
  r.value += k;
}
function numpadQuick(amount: number) {
  amountReceived.value = amount.toFixed(2);
}
function numpadKeyClass(k: string): string {
  if (k === '⌫') return 'bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-bold py-2.5 flex items-center justify-center';
  if (k === '✓') return 'bg-emerald-500 hover:bg-emerald-600 text-white font-black py-2.5 shadow-md col-span-2';
  return 'bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-black py-2.5';
}

// ═══════ Validación / confirmación ═══════
const confirmLabel = computed(() => {
  if (mode.value === 'credito') return 'Aprobar y Procesar Crédito';
  if (mode.value === 'apartado') return 'Procesar Reserva y Emitir Ticket';
  return 'Procesar Pago';
});

const canConfirm = computed(() => {
  if (mode.value === 'credito') {
    if (!props.selectedCustomer) return false;
    if (!creditStatus.value) return false;
    if (hasNoCreditLine.value) return false;
    if (exceedsAvailableCredit.value) return false;
    if (creditType.value === 'abono') {
      if (downPaymentUsd.value <= 0 || downPaymentUsd.value > props.totalUsd) return false;
      if (!selectedMethod.value) return false;
      if (needsReference(selectedMethod.value) && reference.value.trim().length < 4) return false;
    }
    return true;
  }

  if (mode.value === 'apartado') {
    if (!props.selectedCustomer) return false;
    if (!selectedMethod.value) return false;
    if (depositAmountUsd.value <= 0) return false;
    if (depositBelowMinimum.value) return false;
    if (depositAmountUsd.value > props.totalUsd) return false;
    return true;
  }

  // Contado
  if (!selectedMethod.value) return false;
  if (needsReference(selectedMethod.value) && reference.value.trim().length < 4) return false;
  if (selectedCurrency.value === 'USD' && receivedUSD.value <= 0) return false;
  return true;
});

function confirm() {
  if (!canConfirm.value || props.processing) return;

  if (mode.value === 'apartado') {
    if (!props.selectedCustomer) return;
    emit('confirm-layaway', {
      clientId: props.selectedCustomer.id,
      initialDepositUsd: depositAmountUsd.value,
      expirationDays: effectiveExpirationDays.value,
      gaveteroId: selectedMethod.value?.gavetero?.id || null,
    });
    return;
  }

  let payments: CheckoutPayment[] = [];

  if (mode.value === 'credito') {
    if (creditType.value === 'abono' && selectedMethod.value) {
      payments = [{
        payment_method_id: selectedMethod.value.id,
        gavetero_id: selectedMethod.value.gavetero?.id || '',
        amount_usd: downPaymentUsd.value,
        amount_ves: 0,
        reference: needsReference(selectedMethod.value) ? reference.value.trim() : '',
      }];
    }
    // creditType === 'total': sin pago inicial, 100% a crédito.
  } else if (selectedMethod.value) {
    const amountUsd = selectedCurrency.value === 'USD' ? receivedUSD.value : 0;
    const amountVes = selectedCurrency.value === 'VES'
      ? parseFloat(amountReceived.value.replace(/[^0-9.]/g, '')) || 0
      : 0;
    payments = [{
      payment_method_id: selectedMethod.value.id,
      gavetero_id: selectedMethod.value.gavetero?.id || '',
      amount_usd: amountUsd,
      amount_ves: amountVes,
      reference: needsReference(selectedMethod.value) ? reference.value.trim() : '',
    }];
  }

  emit('confirm', {
    payments,
    isCredit: mode.value === 'credito',
    clientId: props.selectedCustomer?.id ?? null,
    requiresFiscalInvoice: props.requiresFiscalInvoice,
  });
}

function formatUSD(n: number | string): string {
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatVES(n: number | string): string {
  return Number(n).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
</script>

<style scoped>
.tab-fade-enter-active,
.tab-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.tab-fade-enter-from,
.tab-fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
