import { Item, ItemStatus } from '../types';

export function calculateLeadTimeConsumption(avgDailyConsumption: number, leadTimeDays: number): number {
  return avgDailyConsumption * leadTimeDays;
}

export function calculateSafetyStock(avgDailyConsumption: number, leadTimeDays: number, safetyFactorPct: number): number {
  // Safety Stock = Avg Daily Consumption * Lead Time * (Safety Factor %)
  const safetyStock = avgDailyConsumption * leadTimeDays * (safetyFactorPct / 100);
  return Math.ceil(safetyStock);
}

export function calculateReorderLevel(avgDailyConsumption: number, leadTimeDays: number, safetyStock: number): number {
  // Reorder Level = Lead Time Consumption + Safety Stock
  return Math.ceil((avgDailyConsumption * leadTimeDays) + safetyStock);
}

export function calculateStockCoverDays(availableQty: number, avgDailyConsumption: number): number | 'Infinite' {
  if (avgDailyConsumption <= 0) return 'Infinite';
  return Math.round(availableQty / avgDailyConsumption);
}

export function calculateRecommendedReorderQty(maxStock: number, availableQty: number, reorderLevel: number): number {
  if (availableQty > reorderLevel && availableQty > 0) return 0;
  const qty = maxStock - availableQty;
  return qty > 0 ? qty : 0;
}

export function calculateWeightedAverageRate(
  currentQty: number,
  currentValue: number,
  inwardQty: number,
  inwardRate: number
): number {
  const totalQty = currentQty + inwardQty;
  if (totalQty <= 0) return inwardRate > 0 ? inwardRate : 0;
  const totalVal = currentValue + (inwardQty * inwardRate);
  return Number((totalVal / totalQty).toFixed(2));
}

export function getItemInventoryStatus(item: Item): ItemStatus {
  if (item.availableQty < 0 || item.currentQty < 0) {
    return 'Negative';
  }
  if (item.availableQty === 0) {
    return 'Out of Stock';
  }
  if (item.safetyStock > 0 && item.availableQty <= item.safetyStock) {
    return 'Critical';
  }
  if (item.reorderLevel > 0 && item.availableQty <= item.reorderLevel) {
    return 'Low';
  }
  if (item.maxStock > 0 && item.availableQty > item.maxStock) {
    return 'Overstock';
  }
  
  // Non-moving check: if last issue date is older than 90 days or missing
  if (item.lastIssueDate) {
    const issueDate = new Date(item.lastIssueDate);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays >= 180) {
      return 'Dead Stock';
    }
    if (diffDays >= 90) {
      return 'Non-moving';
    }
  } else if (item.createdAt) {
    const createdDate = new Date(item.createdAt);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays >= 90 && item.currentQty > 0) {
      return 'Non-moving';
    }
  }

  return 'Normal';
}

export function formatCurrency(amount: number): string {
  if (isNaN(amount)) return '₹0';
  // Format in Lakhs/Crores or Indian Number Format if preferred
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (absAmount >= 10000000) {
    return `${sign}₹${(absAmount / 10000000).toFixed(2)} Cr`;
  } else if (absAmount >= 100000) {
    return `${sign}₹${(absAmount / 100000).toFixed(2)} L`;
  }
  return `${sign}₹${absAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export function formatNumber(num: number): string {
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-IN');
}

export function performABCAnalysis(items: Item[]) {
  const sorted = [...items].sort((a, b) => b.stockValue - a.stockValue);
  const totalValue = sorted.reduce((sum, item) => sum + item.stockValue, 0) || 1;

  let cumulativeVal = 0;

  return sorted.map(item => {
    cumulativeVal += item.stockValue;
    const cumulativePct = (cumulativeVal / totalValue) * 100;

    let abcClass: 'A' | 'B' | 'C' = 'C';
    if (cumulativePct <= 70 || item === sorted[0]) {
      abcClass = 'A';
    } else if (cumulativePct <= 90) {
      abcClass = 'B';
    } else {
      abcClass = 'C';
    }

    return {
      ...item,
      cumulativePct,
      abcClass
    };
  });
}

export function classifyABC(items: Item[]): { item: Item; annualValue: number; pctTotal: number; category: 'A' | 'B' | 'C' }[] {
  // Sort items by annual consumption value = avgMonthlyConsumption * 12 * averageRate
  const mapped = items.map(item => {
    const annualQty = (item.avgMonthlyConsumption || (item.avgDailyConsumption * 30)) * 12;
    const annualValue = annualQty * (item.averageRate || item.standardRate || 1);
    return { item, annualValue, pctTotal: 0, category: 'C' as 'A' | 'B' | 'C' };
  });

  mapped.sort((a, b) => b.annualValue - a.annualValue);

  const totalValue = mapped.reduce((sum, i) => sum + i.annualValue, 0) || 1;

  let cumulativeValue = 0;
  return mapped.map(entry => {
    cumulativeValue += entry.annualValue;
    const cumPct = (cumulativeValue / totalValue) * 100;
    const pctTotal = (entry.annualValue / totalValue) * 100;

    let category: 'A' | 'B' | 'C' = 'C';
    if (cumPct <= 75 || entry === mapped[0]) {
      category = 'A';
    } else if (cumPct <= 92) {
      category = 'B';
    } else {
      category = 'C';
    }

    return {
      item: entry.item,
      annualValue: entry.annualValue,
      pctTotal: Number(pctTotal.toFixed(1)),
      category
    };
  });
}
