import React, { useState } from 'react';
import { Calendar, Lock, CheckCircle2, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { AppState, saveStateToStorage } from '../services/store';

interface MonthlyClosingViewProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const MonthlyClosingView: React.FC<MonthlyClosingViewProps> = ({ state, setState }) => {
  const [closingMonth, setClosingMonth] = useState('2026-08');
  const [closedSuccess, setClosedSuccess] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleRunMonthlyClosing = () => {
    // Generate detailed month-wise In and Out
    const itemsDetail = state.items.map(item => {
      // Find all ledger entries for this item in this month
      const monthEntries = state.ledger.filter(l => l.itemId === item.id && l.transactionDate.startsWith(closingMonth));
      
      const inwardQty = monthEntries.reduce((sum, e) => sum + e.inwardQty, 0);
      const outwardQty = monthEntries.reduce((sum, e) => sum + e.outwardQty, 0);
      
      // Calculate adjustment separately
      const adjustQty = monthEntries
        .filter(e => e.transactionType === 'ADJUSTMENT_PLUS' || e.transactionType === 'ADJUSTMENT_MINUS')
        .reduce((sum, e) => sum + e.inwardQty - e.outwardQty, 0);

      // Estimate opening based on current minus net change this month (assuming closing = current for now)
      const closingQty = item.currentQty;
      const netChange = inwardQty - outwardQty;
      const openingQty = closingQty - netChange;
      
      return {
        itemId: item.id,
        itemCode: item.itemCode,
        itemName: item.itemName,
        openingQty,
        inwardQty,
        outwardQty,
        adjustQty,
        closingQty,
        closingRate: item.averageRate,
        closingValue: item.stockValue
      };
    });

    const totalVal = itemsDetail.reduce((s, i) => s + i.closingValue, 0);

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
      items: itemsDetail
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
            action: 'MONTHLY_CLOSE' as const,
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

  const toggleExpand = (id: string) => {
    if (expandedId === id) setExpandedId(null);
    else setExpandedId(id);
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
              <th className="p-3 w-10"></th>
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
              <React.Fragment key={mc.id}>
                <tr className="hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => toggleExpand(mc.id)}>
                  <td className="p-3 text-center">
                    {expandedId === mc.id ? <ChevronDown className="w-4 h-4 mx-auto" /> : <ChevronRight className="w-4 h-4 mx-auto" />}
                  </td>
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
                {expandedId === mc.id && (
                  <tr className="bg-slate-950/50">
                    <td colSpan={7} className="p-4">
                      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-inner">
                        <div className="p-3 bg-slate-800/50 flex items-center justify-between border-b border-slate-700/50">
                          <h4 className="text-[11px] font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-emerald-400" />
                            Month Wise Stock Report - {mc.monthName}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">{mc.items?.length || 0} Items Recorded</span>
                        </div>
                        <div className="overflow-x-auto max-h-96 overflow-y-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-900 sticky top-0 uppercase text-[9px] font-bold text-slate-500 shadow-sm border-b border-slate-800">
                              <tr>
                                <th className="p-3">Item Code</th>
                                <th className="p-3">Item Name</th>
                                <th className="p-3 text-right">Opening Qty</th>
                                <th className="p-3 text-right text-emerald-400">Inward (Grn)</th>
                                <th className="p-3 text-right text-rose-400">Outward (Min)</th>
                                <th className="p-3 text-right text-amber-400">Adj. Qty</th>
                                <th className="p-3 text-right">Closing Qty</th>
                                <th className="p-3 text-right">Closing Rate</th>
                                <th className="p-3 text-right font-bold">Total Value</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40">
                              {(mc.items || []).map(item => (
                                <tr key={item.itemId} className="hover:bg-slate-800/30">
                                  <td className="p-3 font-mono text-slate-300">{item.itemCode}</td>
                                  <td className="p-3 font-semibold text-slate-200">{item.itemName}</td>
                                  <td className="p-3 text-right font-mono text-slate-400">{item.openingQty}</td>
                                  <td className="p-3 text-right font-mono text-emerald-400">+{item.inwardQty}</td>
                                  <td className="p-3 text-right font-mono text-rose-400">-{item.outwardQty}</td>
                                  <td className="p-3 text-right font-mono text-amber-400">{item.adjustQty !== 0 ? (item.adjustQty > 0 ? `+${item.adjustQty}` : item.adjustQty) : '-'}</td>
                                  <td className="p-3 text-right font-mono font-bold text-slate-100">{item.closingQty}</td>
                                  <td className="p-3 text-right font-mono text-slate-400">₹{item.closingRate.toLocaleString('en-IN')}</td>
                                  <td className="p-3 text-right font-mono font-bold text-emerald-400">₹{item.closingValue.toLocaleString('en-IN')}</td>
                                </tr>
                              ))}
                              {(!mc.items || mc.items.length === 0) && (
                                <tr>
                                  <td colSpan={9} className="p-6 text-center text-slate-500 italic">No detailed item records found for this period.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {state.monthlyClosings.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500 italic">No closed periods recorded yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
