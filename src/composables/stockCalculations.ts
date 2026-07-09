/**
 * Pure math functions for inventory cost & margin calculations.
 * Zero framework dependencies — usable in Vue, React Native/Expo, or Node backend.
 */

export interface StockCalcInputs {
  currentStock: number;
  currentUnitCost: number;
  containers: number;
  unitsPerContainer: number;
  costPerContainer: number;
  freight: number;
  margin: number;
  exchangeRate: number;
}

export interface SuggestedPrices {
  traditionalUSD: number;
  traditionalVES: number;
  financialUSD: number;
  financialVES: number;
}

export function bcvRound(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor + (value >= 0 ? 0.0001 : -0.0001)) / factor;
}

export function calcEffectiveContainers(
  rawContainers: number,
  unitMultiplier: number,
  isWholesale: boolean,
): number {
  const c = rawContainers || 0;
  return isWholesale ? c * (unitMultiplier || 1) : c;
}

export function calcNewStockUnits(containers: number, unitsPerContainer: number): number {
  return (containers || 0) * (unitsPerContainer || 0);
}

export function calcEntryUnitCost(
  costPerContainer: number,
  freight: number,
  unitsPerContainer: number,
): number {
  const totalCost = (costPerContainer || 0) + (freight || 0);
  const units = unitsPerContainer || 1;
  if (units <= 0 || totalCost <= 0) return 0;
  return totalCost / units;
}

export function calcWeightedAverageCost(
  oldStock: number,
  oldCost: number,
  newStock: number,
  newUnitCost: number,
): number {
  const totalStock = oldStock + newStock;
  if (totalStock <= 0) return newUnitCost || oldCost || 0;
  return (oldStock * oldCost + newStock * newUnitCost) / totalStock;
}

export function calcTraditionalPrice(cost: number, margin: number): number {
  if (cost <= 0 || margin <= 0) return 0;
  return cost * (1 + margin / 100);
}

export function calcFinancialPrice(cost: number, margin: number): number {
  if (cost <= 0 || margin <= 0) return 0;
  const divisor = 1 - margin / 100;
  if (divisor <= 0.01) return 0;
  return cost / divisor;
}

export function calcVES(usd: number, rate: number): number {
  if (usd <= 0 || !rate) return 0;
  return bcvRound(usd * rate, 2);
}

export function calcSuggestedPrices(inputs: StockCalcInputs): SuggestedPrices {
  const newStock = calcNewStockUnits(inputs.containers, inputs.unitsPerContainer);
  const entryCost = calcEntryUnitCost(inputs.costPerContainer, inputs.freight, inputs.unitsPerContainer);
  const avgCost = calcWeightedAverageCost(
    inputs.currentStock, inputs.currentUnitCost,
    newStock, entryCost,
  );

  const traditionalUSD = calcTraditionalPrice(avgCost, inputs.margin);
  const financialUSD = calcFinancialPrice(avgCost, inputs.margin);

  return {
    traditionalUSD,
    traditionalVES: calcVES(traditionalUSD, inputs.exchangeRate),
    financialUSD,
    financialVES: calcVES(financialUSD, inputs.exchangeRate),
  };
}
