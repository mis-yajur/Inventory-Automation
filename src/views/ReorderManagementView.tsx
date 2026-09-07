import React, { useState } from 'react';
import {
  AlertCircle, ShoppingCart, CheckCircle2, Shield, ArrowRight, Download, FileText
} from 'lucide-react';
import { AppState } from '../services/store';
import {
  calculateStockCoverDays,
  calculateRecommendedReorderQty,
  formatCurrency,
  getItemInventoryStatus
} from '../utils/calculations';

interface ReorderManagementViewProps {
  state: AppState;
}

export const ReorderManagementView: React.FC<ReorderManagementViewProps> = ({ state }) => {
  const [poGenerated, setPoGenerated] = useState(false);

  // Items that hit reorder trigger (Available Stock <= Reorder Level)
  const reorderNeededItems = state.items.filter(item => item.availableQty <= item.reorderLevel);

  const totalReorderValue = reorderNeededItems.reduce((sum, item) => {
    const qty = calculateRecommendedReorderQty(item.maxStock, item.availableQty, item.reorderLevel) || item.reorderQty;
    return sum + (qty * item.averageRate);
  }, 0);

  const handleGeneratePO = () => {
    setPoGenerated(true);
    setTimeout(() => setPoGenerated(false), 5000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-black text-slate-100 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-400" />
            <span>Automated Reorder Planning & Procurement Portal</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Formula: <strong className="text-slate-200">Reorder Level = (Avg Daily Consumption × Lead Time Days) + Safety Stock</strong>
          </p>
        </div>

        <button
          onClick={handleGeneratePO}
          disabled={reorderNeededItems.length === 0}
          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-rose-950"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Generate PO Indent Draft ({reorderNeededItems.length} SKUs)</span>
        </button>
      </div>

      {poGenerated && (
        <div className="p-4 bg-emerald-950/50 border border-emerald-500/40 text-emerald-400 rounded-2xl text-xs flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <div>
            <strong className="block text-white font-bold">Purchase Order Indent Draft Generated Successfully!</strong>
            <span>PO/2026-27/0238 created for {reorderNeededItems.length} items valued at {formatCurrency(totalReorderValue)}.</span>
          </div>
        </div>
      )}

      {/* Summary KPI Banner */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Reorder SKUs Required</span>
          <span className="text-xl font-black text-rose-400 mt-1 block">{reorderNeededItems.length} SKUs</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Available &le; Reorder Level</span>
        </div>

        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Estimated PO Value</span>
          <span className="text-xl font-black text-emerald-400 mt-1 block">{formatCurrency(totalReorderValue)}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Based on weighted average purchase rates</span>
        </div>

        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Calculation Rule</span>
          <span className="text-xs font-bold text-amber-400 mt-1 block">Lead Time + Safety Factor</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Guarantees zero plant downtime</span>
        </div>
      </div>

      {/* Reorder Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">SKUs Requiring Purchase Reorder</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="p-3">Item Code</th>
                <th className="p-3">Item Name</th>
                <th className="p-3">Supplier</th>
                <th className="p-3 text-right">Lead Time (Days)</th>
                <th className="p-3 text-right">Avg Daily Cons.</th>
                <th className="p-3 text-right">Safety Stock</th>
                <th className="p-3 text-right">Reorder Level</th>
                <th className="p-3 text-right">Avail Stock</th>
                <th className="p-3 text-right">Stock Cover</th>
                <th className="p-3 text-right">Suggested PO Qty</th>
                <th className="p-3 text-right">Est. Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {reorderNeededItems.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-500 text-xs">
                    All inventory levels are healthy. No reorder triggers hit at this time.
                  </td>
                </tr>
              ) : (
                reorderNeededItems.map(item => {
                  const cover = calculateStockCoverDays(item.availableQty, item.avgDailyConsumption);
                  const suggested = calculateRecommendedReorderQty(item.maxStock, item.availableQty, item.reorderLevel) || item.reorderQty;
                  const cost = suggested * item.averageRate;

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/50">
                      <td className="p-3 font-mono font-bold text-emerald-400">{item.itemCode}</td>
                      <td className="p-3 font-semibold text-slate-100">{item.itemName}</td>
                      <td className="p-3 text-slate-300">{item.preferredSupplierName || 'ABC Bearings'}</td>
                      <td className="p-3 text-right font-mono text-slate-300">{item.leadTimeDays}d</td>
                      <td className="p-3 text-right font-mono text-slate-300">{item.avgDailyConsumption}</td>
                      <td className="p-3 text-right font-mono text-amber-400">{item.safetyStock}</td>
                      <td className="p-3 text-right font-mono font-bold text-rose-400">{item.reorderLevel}</td>
                      <td className="p-3 text-right font-mono font-extrabold text-slate-100">{item.availableQty} {item.unitName}</td>
                      <td className={`p-3 text-right font-mono font-bold ${typeof cover === 'number' && cover <= item.leadTimeDays ? 'text-rose-400' : 'text-cyan-400'}`}>
                        {cover === 'Infinite' ? 'Infinite' : `${cover} days`}
                      </td>
                      <td className="p-3 text-right font-mono font-black text-emerald-400">{suggested} {item.unitName}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-100">₹{cost.toLocaleString('en-IN')}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
