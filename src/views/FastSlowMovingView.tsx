import React, { useState } from 'react';
import { Zap, Clock, AlertTriangle } from 'lucide-react';
import { AppState } from '../services/store';

interface FastSlowMovingViewProps {
  state: AppState;
}

export const FastSlowMovingView: React.FC<FastSlowMovingViewProps> = ({ state }) => {
  const [fsnFilter, setFsnFilter] = useState<'ALL' | 'FAST' | 'SLOW' | 'NON'>('ALL');

  // Classify FSN based on avgMonthlyConsumption
  const fastMoving = state.items.filter(i => i.avgMonthlyConsumption >= 15);
  const slowMoving = state.items.filter(i => i.avgMonthlyConsumption > 0 && i.avgMonthlyConsumption < 15);
  const nonMoving = state.items.filter(i => i.avgMonthlyConsumption === 0 || !i.lastIssueDate);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-slate-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            <span>Fast, Slow & Non-Moving (FSN) Inventory Report</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Identify high-turnover consumables versus deadstock holding capital</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900 border border-emerald-500/30 rounded-2xl space-y-1">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase">
            <Zap className="w-4 h-4" />
            <span>Fast Moving SKUs ({fastMoving.length})</span>
          </div>
          <p className="text-[11px] text-slate-400">Monthly consumption &ge; 15 units. High inventory velocity.</p>
        </div>

        <div className="p-4 bg-slate-900 border border-amber-500/30 rounded-2xl space-y-1">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase">
            <Clock className="w-4 h-4" />
            <span>Slow Moving SKUs ({slowMoving.length})</span>
          </div>
          <p className="text-[11px] text-slate-400">Monthly consumption &lt; 15 units. Occasional maintenance use.</p>
        </div>

        <div className="p-4 bg-slate-900 border border-rose-500/30 rounded-2xl space-y-1">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase">
            <AlertTriangle className="w-4 h-4" />
            <span>Non-Moving / Obsolete ({nonMoving.length})</span>
          </div>
          <p className="text-[11px] text-slate-400">Zero consumption recorded in &gt; 90 days. Capital locked.</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">FSN Classified Inventory Table</h3>
          <div className="flex flex-wrap gap-1.5">
            {(['ALL', 'FAST', 'SLOW', 'NON'] as const).map(cls => (
              <button
                key={cls}
                onClick={() => setFsnFilter(cls)}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg border transition ${
                  fsnFilter === cls
                    ? cls === 'ALL' ? 'bg-slate-800 text-white border-slate-700' :
                      cls === 'FAST' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
                      cls === 'SLOW' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                      'bg-rose-500/20 text-rose-400 border-rose-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {cls === 'ALL' ? 'All FSN' :
                 cls === 'FAST' ? 'Fast Moving' :
                 cls === 'SLOW' ? 'Slow Moving' : 'Non Moving'}
              </button>
            ))}
          </div>
        </div>
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 uppercase text-[10px] font-bold text-slate-400">
            <tr>
              <th className="p-3">Item Code</th>
              <th className="p-3">Item Name</th>
              <th className="p-3 text-right">Available Qty</th>
              <th className="p-3 text-right">Monthly Cons.</th>
              <th className="p-3">Last Issued Date</th>
              <th className="p-3 text-center">FSN Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {state.items
              .filter(item => {
                const isFast = item.avgMonthlyConsumption >= 15;
                const isSlow = item.avgMonthlyConsumption > 0 && item.avgMonthlyConsumption < 15;
                const isNon = item.avgMonthlyConsumption === 0 || !item.lastIssueDate;
                if (fsnFilter === 'ALL') return true;
                if (fsnFilter === 'FAST') return isFast;
                if (fsnFilter === 'SLOW') return isSlow;
                if (fsnFilter === 'NON') return isNon;
                return true;
              })
              .map(item => {
                const isFast = item.avgMonthlyConsumption >= 15;
                const isSlow = item.avgMonthlyConsumption > 0 && item.avgMonthlyConsumption < 15;
                const fsn = isFast ? 'Fast Moving' : isSlow ? 'Slow Moving' : 'Non Moving';

                return (
                  <tr key={item.id} className="hover:bg-slate-800/50">
                    <td className="p-3 font-mono font-bold text-emerald-400">{item.itemCode}</td>
                    <td className="p-3 font-semibold text-slate-100">{item.itemName}</td>
                    <td className="p-3 text-right font-mono text-slate-300">{item.availableQty} {item.unitName}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-200">{item.avgMonthlyConsumption}</td>
                    <td className="p-3 font-mono text-slate-400">{item.lastIssueDate || 'No Issues'}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                        isFast ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                        isSlow ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                        'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      }`}>
                        {fsn}
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
