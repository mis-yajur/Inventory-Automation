import React from 'react';
import { AlertCircle, CheckCircle, XCircle, Info, Filter, ArrowRight } from 'lucide-react';
import { AppState } from '../services/store';
import { Item } from '../types';

interface DataQualityViewProps {
  state: AppState;
}

export const DataQualityView: React.FC<DataQualityViewProps> = ({ state }) => {
  const checkDataQuality = () => {
    const issues: { id: string; item: Item; type: string; severity: 'high' | 'medium' | 'low' }[] = [];

    state.items.forEach(item => {
      if (!item.categoryId) issues.push({ id: `dq-${item.id}-cat`, item, type: 'Missing Category', severity: 'high' });
      if (!item.unitId) issues.push({ id: `dq-${item.id}-unit`, item, type: 'Missing Unit', severity: 'high' });
      if (!item.reorderLevel || item.reorderLevel === 0) issues.push({ id: `dq-${item.id}-rl`, item, type: 'No Reorder Level', severity: 'medium' });
      if (!item.safetyStock || item.safetyStock === 0) issues.push({ id: `dq-${item.id}-ss`, item, type: 'No Safety Stock', severity: 'medium' });
      if (!item.leadTimeDays || item.leadTimeDays === 0) issues.push({ id: `dq-${item.id}-lt`, item, type: 'No Lead Time', severity: 'medium' });
      if (!item.preferredSupplierId) issues.push({ id: `dq-${item.id}-sup`, item, type: 'No Preferred Supplier', severity: 'low' });
      if (item.averageRate === 0 && item.currentQty > 0) issues.push({ id: `dq-${item.id}-rate`, item, type: 'Zero Rate with Stock', severity: 'high' });
    });

    return issues;
  };

  const issues = checkDataQuality();
  const highSeverity = issues.filter(i => i.severity === 'high').length;
  const mediumSeverity = issues.filter(i => i.severity === 'medium').length;
  const lowSeverity = issues.filter(i => i.severity === 'low').length;

  const totalPossibleChecks = state.items.length * 7;
  const healthScore = Math.max(0, 100 - (issues.length / totalPossibleChecks) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-slate-100 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-emerald-400" />
            <span>Data Quality Dashboard</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Audit master data consistency and identify missing replenishment parameters.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center">
          <div className={`text-4xl font-black mb-1 ${healthScore > 90 ? 'text-emerald-400' : healthScore > 70 ? 'text-amber-400' : 'text-rose-500'}`}>
            {healthScore.toFixed(1)}%
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Master Data Health</span>
        </div>
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-500/10 rounded-xl flex items-center justify-center">
            <XCircle className="w-6 h-6 text-rose-500" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-100">{highSeverity}</div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">High Severity Issues</span>
          </div>
        </div>
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-100">{mediumSeverity}</div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Medium Severity Issues</span>
          </div>
        </div>
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
            <Info className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-100">{lowSeverity}</div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Low Severity Issues</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/20">
          <h2 className="text-sm font-bold text-slate-200">Data Integrity Exceptions</h2>
          <button className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
            <Filter className="w-3 h-3" />
            <span>Filter Exceptions</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40">
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Item Details</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Exception Type</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Severity</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {issues.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <CheckCircle className="w-12 h-12 text-emerald-500/20 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-400">All master data records are fully compliant!</p>
                  </td>
                </tr>
              ) : (
                issues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-mono text-emerald-400 font-bold text-xs">{issue.item.itemCode}</span>
                        <span className="text-xs font-semibold text-slate-200">{issue.item.itemName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-400">{issue.type}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        issue.severity === 'high' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                        issue.severity === 'medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                        'bg-blue-500/10 text-blue-500 border-blue-500/20'
                      }`}>
                        {issue.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-emerald-400 hover:text-emerald-300 text-[10px] font-bold flex items-center gap-1 ml-auto">
                        <span>Fix Now</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
