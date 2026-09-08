import React, { useState } from 'react';
import { Calendar, Lock, CheckCircle2 } from 'lucide-react';
import { AppState, saveStateToStorage } from '../services/store';

interface MonthlyClosingViewProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const MonthlyClosingView: React.FC<MonthlyClosingViewProps> = ({ state, setState }) => {
  const [closingMonth, setClosingMonth] = useState('2026-08');
  const [closedSuccess, setClosedSuccess] = useState(false);

  const handleRunMonthlyClosing = () => {
    const totalVal = state.items.reduce((s, i) => s + i.stockValue, 0);

    const newClosing: import('../types').MonthlyClosing = {
      id: `cls-${Date.now()}`,
      monthYear: closingMonth,
      monthName: closingMonth,
      storeId: 'ALL',
      storeName: 'All Stores',
      closingValue: totalVal,
      status: 'Closed',
      closedBy: state.activeUser.name,
      closedAt: new Date().toISOString().split('T')[0],
      items: []
    };

    setState(prev => {
      const newState = {
        ...prev,
        monthlyClosings: [newClosing, ...prev.monthlyClosings],
        auditLogs: [
          {
            id: `aud-${Date.now()}`,
            timestamp: new Date().toISOString(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            userId: prev.activeUser.id,
            userName: prev.activeUser.name,
            module: 'Monthly Closing',
            action: 'MONTHLY_CLOSE',
            record: closingMonth,
            previousValue: 'Open Period',
            newValue: 'Closed & Locked',
            reason: `Month-end inventory valuation lock for ${closingMonth} (Valuation: ₹${totalVal.toLocaleString('en-IN')})`
          },
          ...prev.auditLogs
        ]
      };
      saveStateToStorage(newState);
      return newState;
    });

    setClosedSuccess(true);
    setTimeout(() => setClosedSuccess(false), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-slate-100 flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-400" />
            <span>Month-End Valuation Closing & Ledger Lock</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Freeze inventory valuation balances at month end for SAP/ERP financial reconciliation</p>
        </div>
      </div>

      {closedSuccess && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5" />
          <span>Period {closingMonth} closed and locked successfully! Valuation snapshot archived.</span>
        </div>
      )}

      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 max-w-xl">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Execute Period Closing</h3>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={closingMonth}
            onChange={e => setClosingMonth(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono"
          />
          <button
            onClick={handleRunMonthlyClosing}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-950"
          >
            <Lock className="w-4 h-4" />
            <span>Lock & Close Period</span>
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950/60 border-b border-slate-800">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Closed Periods Register</h3>
        </div>
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 uppercase text-[10px] font-bold text-slate-400">
            <tr>
              <th className="p-3">Period</th>
              <th className="p-3">Store</th>
              <th className="p-3">Closed Date</th>
              <th className="p-3 text-right">Locked Valuation</th>
              <th className="p-3">Closed By</th>
              <th className="p-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {state.monthlyClosings.map(mc => (
              <tr key={mc.id}>
                <td className="p-3 font-mono font-bold text-emerald-400">{mc.monthYear}</td>
                <td className="p-3 font-semibold text-slate-200">{mc.storeName}</td>
                <td className="p-3 font-mono text-slate-400">{mc.closedAt}</td>
                <td className="p-3 text-right font-mono font-bold text-emerald-400">₹{mc.closingValue.toLocaleString('en-IN')}</td>
                <td className="p-3 text-slate-300">{mc.closedBy}</td>
                <td className="p-3 text-center">
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold text-[10px] border border-slate-700">
                    {mc.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
