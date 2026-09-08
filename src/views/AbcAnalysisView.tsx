import React, { useState } from 'react';
import { Award, PieChart, Layers } from 'lucide-react';
import { AppState } from '../services/store';
import { performABCAnalysis, formatCurrency } from '../utils/calculations';

interface AbcAnalysisViewProps {
  state: AppState;
}

export const AbcAnalysisView: React.FC<AbcAnalysisViewProps> = ({ state }) => {
  const [classFilter, setClassFilter] = useState<'ALL' | 'A' | 'B' | 'C'>('ALL');
  const abcData = performABCAnalysis(state.items);

  const groupA = abcData.filter(i => i.abcClass === 'A');
  const groupB = abcData.filter(i => i.abcClass === 'B');
  const groupC = abcData.filter(i => i.abcClass === 'C');

  const totalVal = state.items.reduce((s, i) => s + i.stockValue, 0);

  const valA = groupA.reduce((s, i) => s + i.stockValue, 0);
  const valB = groupB.reduce((s, i) => s + i.stockValue, 0);
  const valC = groupC.reduce((s, i) => s + i.stockValue, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-slate-100 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span>ABC Classification Analysis (Pareto Principle)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Categorize inventory by monetary valuation cumulative impact to optimize stock control rigor</p>
        </div>
      </div>

      {/* ABC Class Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Class A */}
        <div className="p-4 bg-slate-900 border border-emerald-500/30 rounded-2xl space-y-2">
          <div className="flex justify-between items-center">
            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black text-xs rounded-lg">
              CLASS A ITEMS
            </span>
            <span className="font-mono text-xs text-slate-400">{groupA.length} SKUs</span>
          </div>
          <p className="text-[11px] text-slate-400">High Monetary Value (~70% of inventory worth). Requires strict cycle counting.</p>
          <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400">Valuation:</span>
            <span className="font-mono font-bold text-emerald-400">{formatCurrency(valA)} ({totalVal > 0 ? ((valA/totalVal)*100).toFixed(1) : 0}%)</span>
          </div>
        </div>

        {/* Class B */}
        <div className="p-4 bg-slate-900 border border-cyan-500/30 rounded-2xl space-y-2">
          <div className="flex justify-between items-center">
            <span className="px-2.5 py-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-black text-xs rounded-lg">
              CLASS B ITEMS
            </span>
            <span className="font-mono text-xs text-slate-400">{groupB.length} SKUs</span>
          </div>
          <p className="text-[11px] text-slate-400">Moderate Monetary Value (~20% of inventory worth). Standard control policy.</p>
          <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400">Valuation:</span>
            <span className="font-mono font-bold text-cyan-400">{formatCurrency(valB)} ({totalVal > 0 ? ((valB/totalVal)*100).toFixed(1) : 0}%)</span>
          </div>
        </div>

        {/* Class C */}
        <div className="p-4 bg-slate-900 border border-purple-500/30 rounded-2xl space-y-2">
          <div className="flex justify-between items-center">
            <span className="px-2.5 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 font-black text-xs rounded-lg">
              CLASS C ITEMS
            </span>
            <span className="font-mono text-xs text-slate-400">{groupC.length} SKUs</span>
          </div>
          <p className="text-[11px] text-slate-400">Low Individual Value (~10% worth). High volume hardware & fasteners.</p>
          <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400">Valuation:</span>
            <span className="font-mono font-bold text-purple-400">{formatCurrency(valC)} ({totalVal > 0 ? ((valC/totalVal)*100).toFixed(1) : 0}%)</span>
          </div>
        </div>
      </div>

      {/* Item ABC Classification Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">ABC Classified Inventory SKUs</h3>
          <div className="flex flex-wrap gap-1.5">
            {(['ALL', 'A', 'B', 'C'] as const).map(cls => (
              <button
                key={cls}
                onClick={() => setClassFilter(cls)}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg border transition ${
                  classFilter === cls
                    ? cls === 'ALL' ? 'bg-slate-800 text-white border-slate-700' :
                      cls === 'A' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
                      cls === 'B' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' :
                      'bg-purple-500/20 text-purple-400 border-purple-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {cls === 'ALL' ? 'All Classes' : `Class ${cls}`}
              </button>
            ))}
          </div>
        </div>
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 uppercase text-[10px] font-bold text-slate-400">
            <tr>
              <th className="p-3">Rank</th>
              <th className="p-3">Item Code</th>
              <th className="p-3">Item Name</th>
              <th className="p-3 text-right">Stock Qty</th>
              <th className="p-3 text-right">Avg Rate</th>
              <th className="p-3 text-right">Total Valuation</th>
              <th className="p-3 text-right">Cum %</th>
              <th className="p-3 text-center">ABC Class</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {abcData
              .filter(item => classFilter === 'ALL' || item.abcClass === classFilter)
              .map((item) => {
                const originalRank = abcData.indexOf(item) + 1;
                return (
                  <tr key={item.id} className="hover:bg-slate-800/50">
                    <td className="p-3 font-mono text-slate-500">#{originalRank}</td>
                    <td className="p-3 font-mono font-bold text-emerald-400">{item.itemCode}</td>
                    <td className="p-3 font-semibold text-slate-100">{item.itemName}</td>
                    <td className="p-3 text-right font-mono text-slate-300">{item.currentQty} {item.unitName}</td>
                    <td className="p-3 text-right font-mono text-slate-400">₹{item.averageRate}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-100">{formatCurrency(item.stockValue)}</td>
                    <td className="p-3 text-right font-mono text-slate-400">{item.cumulativePct.toFixed(1)}%</td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] border ${
                        item.abcClass === 'A' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                        item.abcClass === 'B' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' :
                        'bg-purple-500/20 text-purple-400 border-purple-500/30'
                      }`}>
                        CLASS {item.abcClass}
                      </span>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
