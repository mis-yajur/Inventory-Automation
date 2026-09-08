import React, { useState } from 'react';
import { Sliders, Plus, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { AppState, saveStateToStorage } from '../services/store';
import { StockAdjustment, StockLedgerEntry } from '../types';

interface StockAdjustmentViewProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const StockAdjustmentView: React.FC<StockAdjustmentViewProps> = ({ state, setState }) => {
  const [showNew, setShowNew] = useState(false);
  const [itemId, setItemId] = useState(state.items[0]?.id || '');
  const [physicalQty, setPhysicalQty] = useState(10);
  const [adjustmentType, setAdjustmentType] = useState<any>('Physical Verification Shortage');
  const [reason, setReason] = useState('Stock count audit variance');

  const activeItemId = itemId || state.items[0]?.id || '';
  const selectedItem = state.items.find(i => i.id === activeItemId);
  const systemQty = selectedItem ? selectedItem.currentQty : 0;
  const differenceQty = physicalQty - systemQty;

  const handlePostAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    const adjustmentNo = `ADJ-2026-${String(state.stockAdjustments.length + 19).padStart(3, '0')}`;
    const now = new Date().toISOString().split('T')[0];

    const newAdj: StockAdjustment = {
      id: `adj-${Date.now()}`,
      adjustmentNo,
      date: now,
      storeId: selectedItem.defaultStoreId,
      adjustmentType,
      itemId: selectedItem.id,
      systemQty,
      physicalQty,
      differenceQty,
      rate: selectedItem.averageRate,
      valueDifference: differenceQty * selectedItem.averageRate,
      reason,
      status: 'Posted',
      approvedBy: state.activeUser.name,
      createdAt: new Date().toISOString()
    };

    const newQty = physicalQty;
    const newStockVal = newQty * selectedItem.averageRate;

    const isPlus = differenceQty > 0;

    const ledgerEntry: StockLedgerEntry = {
      id: `led-adj-${selectedItem.id}-${Date.now()}`,
      transactionDate: now,
      transactionType: isPlus ? 'ADJUSTMENT_PLUS' : 'ADJUSTMENT_MINUS',
      referenceNumber: adjustmentNo,
      itemId: selectedItem.id,
      itemCode: selectedItem.itemCode,
      itemName: selectedItem.itemName,
      storeId: selectedItem.defaultStoreId,
      storeName: selectedItem.defaultStoreName,
      inwardQty: isPlus ? Math.abs(differenceQty) : 0,
      outwardQty: !isPlus ? Math.abs(differenceQty) : 0,
      runningQty: newQty,
      rate: selectedItem.averageRate,
      inwardValue: isPlus ? Math.abs(differenceQty) * selectedItem.averageRate : 0,
      outwardValue: !isPlus ? Math.abs(differenceQty) * selectedItem.averageRate : 0,
      runningStockValue: newStockVal,
      userId: state.activeUser.id,
      userName: state.activeUser.name,
      timestamp: new Date().toISOString()
    };

    const updatedItems = state.items.map(i => i.id === selectedItem.id ? {
      ...i,
      currentQty: newQty,
      availableQty: newQty - i.reservedQty,
      stockValue: newStockVal,
      updatedAt: now
    } : i);

    setState(prev => {
      const newState = {
        ...prev,
        items: updatedItems,
        stockAdjustments: [newAdj, ...prev.stockAdjustments],
        ledger: [ledgerEntry, ...prev.ledger],
        auditLogs: [
          {
            id: `aud-${Date.now()}`,
            timestamp: new Date().toISOString(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            userId: prev.activeUser.id,
            userName: prev.activeUser.name,
            module: 'Stock Adjustment',
            action: 'POST' as const,
            record: adjustmentNo,
            previousValue: `${systemQty} ${selectedItem.unitName}`,
            newValue: `${physicalQty} ${selectedItem.unitName}`,
            reason: `Physical verification adjustment (${differenceQty > 0 ? '+' : ''}${differenceQty}): ${reason}`
          },
          ...prev.auditLogs
        ]
      };
      saveStateToStorage(newState);
      return newState;
    });

    setShowNew(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-slate-100 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <span>Stock Audit & Physical Verification Adjustment</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Reconcile physical stock counts with system balances and log variance entries</p>
        </div>

        <button
          onClick={() => setShowNew(!showNew)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950"
        >
          <Plus className="w-4 h-4" />
          <span>New Stock Adjustment</span>
        </button>
      </div>

      {showNew && (
        <form onSubmit={handlePostAdjustment} className="p-5 bg-slate-900 border border-slate-700 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Stock Adjustment Variance Entry</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] text-slate-300 font-bold mb-1">Select Item</label>
              <select
                value={itemId}
                onChange={e => {
                  setItemId(e.target.value);
                  const sel = state.items.find(i => i.id === e.target.value);
                  if (sel) setPhysicalQty(sel.currentQty);
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100"
              >
                {state.items.map(i => (
                  <option key={i.id} value={i.id}>{i.itemCode} - {i.itemName} (System: {i.currentQty})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-300 font-bold mb-1">Physical Verified Quantity</label>
              <input
                type="number"
                step="0.01"
                value={physicalQty}
                onChange={e => setPhysicalQty(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100 font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-300 font-bold mb-1">Adjustment Type</label>
              <select
                value={adjustmentType}
                onChange={e => setAdjustmentType(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100"
              >
                <option value="Physical Verification Excess">Physical Verification Excess (+)</option>
                <option value="Physical Verification Shortage">Physical Verification Shortage (-)</option>
                <option value="Damage">Damage (-)</option>
                <option value="Scrap">Scrap (-)</option>
                <option value="Expired">Expired (-)</option>
                <option value="Data Correction">Data Correction</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-300 font-bold mb-1">Reason / Justification</label>
              <input
                type="text"
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <span>System Balance: <strong className="text-slate-200">{systemQty}</strong></span>
            <span>Physical Count: <strong className="text-slate-200">{physicalQty}</strong></span>
            <span>Variance Difference: <strong className={differenceQty < 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
              {differenceQty > 0 ? `+${differenceQty}` : differenceQty}
            </strong></span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button type="button" onClick={() => setShowNew(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded text-xs">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded text-xs font-bold">Approve & Adjust Ledger</button>
          </div>
        </form>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950/60 border-b border-slate-800">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Adjustment Audit Log</h3>
        </div>
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 uppercase text-[10px] font-bold text-slate-400">
            <tr>
              <th className="p-3">Ref No</th>
              <th className="p-3">Date</th>
              <th className="p-3">Type</th>
              <th className="p-3 text-right">System Qty</th>
              <th className="p-3 text-right">Physical Qty</th>
              <th className="p-3 text-right">Variance</th>
              <th className="p-3">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {state.stockAdjustments.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-slate-500">No physical stock adjustments logged yet.</td></tr>
            ) : (
              state.stockAdjustments.map(adj => (
                <tr key={adj.id}>
                  <td className="p-3 font-mono font-bold text-emerald-400">{adj.adjustmentNo}</td>
                  <td className="p-3 font-mono text-slate-400">{adj.date}</td>
                  <td className="p-3 text-slate-200">{adj.adjustmentType}</td>
                  <td className="p-3 text-right font-mono text-slate-400">{adj.systemQty}</td>
                  <td className="p-3 text-right font-mono text-slate-100 font-bold">{adj.physicalQty}</td>
                  <td className={`p-3 text-right font-mono font-bold ${adj.differenceQty < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {adj.differenceQty > 0 ? `+${adj.differenceQty}` : adj.differenceQty}
                  </td>
                  <td className="p-3 text-slate-400">{adj.reason}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
