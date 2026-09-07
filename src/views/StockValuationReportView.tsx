import React from 'react';
import { DollarSign, PieChart, BarChart3 } from 'lucide-react';
import { AppState } from '../services/store';
import { formatCurrency } from '../utils/calculations';

interface StockValuationReportViewProps {
  state: AppState;
}

export const StockValuationReportView: React.FC<StockValuationReportViewProps> = ({ state }) => {
  const totalValuation = state.items.reduce((s, i) => s + i.stockValue, 0);

  // Group by category
  const categoryValuation: Record<string, { count: number; value: number }> = {};
  state.items.forEach(item => {
    const name = item.categoryName || 'Uncategorized';
    if (!categoryValuation[name]) categoryValuation[name] = { count: 0, value: 0 };
    categoryValuation[name].count += 1;
    categoryValuation[name].value += item.stockValue;
  });

  // Group by Store
  const storeValuation: Record<string, { count: number; value: number }> = {};
  state.items.forEach(item => {
    const name = item.defaultStoreName || 'Main Store';
    if (!storeValuation[name]) storeValuation[name] = { count: 0, value: 0 };
    storeValuation[name].count += 1;
    storeValuation[name].value += item.stockValue;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-slate-100 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <span>Stock Financial Valuation Summary</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Financial asset valuation breakdown across categories, stores, and valuation models</p>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold">Total Stock Asset Value:</span>
          <span className="text-base font-black text-emerald-400 font-mono">{formatCurrency(totalValuation)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Valuation */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <PieChart className="w-4 h-4 text-emerald-400" />
            <span>Valuation By Item Category</span>
          </h3>
          <div className="space-y-3">
            {Object.keys(categoryValuation).map(cat => {
              const data = categoryValuation[cat];
              const pct = totalValuation > 0 ? (data.value / totalValuation) * 100 : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-200">{cat} ({data.count} SKUs)</span>
                    <span className="font-mono font-bold text-emerald-400">{formatCurrency(data.value)} ({pct.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Store Valuation */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <span>Valuation By Store Warehouse</span>
          </h3>
          <div className="space-y-3">
            {Object.keys(storeValuation).map(str => {
              const data = storeValuation[str];
              const pct = totalValuation > 0 ? (data.value / totalValuation) * 100 : 0;
              return (
                <div key={str} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-200">{str} ({data.count} SKUs)</span>
                    <span className="font-mono font-bold text-cyan-400">{formatCurrency(data.value)} ({pct.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
