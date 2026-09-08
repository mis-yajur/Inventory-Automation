import React, { useState } from 'react';
import { RotateCcw, Plus, CheckCircle2 } from 'lucide-react';
import { AppState, saveStateToStorage } from '../services/store';
import { MaterialReturn, StockLedgerEntry } from '../types';

interface MaterialReturnViewProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const MaterialReturnView: React.FC<MaterialReturnViewProps> = ({ state, setState }) => {
  const [showNew, setShowNew] = useState(false);
  const [itemId, setItemId] = useState(state.items[0]?.id || '');
  const [returnQty, setReturnQty] = useState(1);
  const [departmentId, setDepartmentId] = useState(state.departments[0]?.id || '');
  const [originalIssueRef, setOriginalIssueRef] = useState('');
  const [condition, setCondition] = useState<'Unused' | 'Partially Used' | 'Damaged' | 'Scrap'>('Unused');
  const [remarks, setRemarks] = useState('');

  const handlePostReturn = (e: React.FormEvent) => {
    e.preventDefault();
    const activeItemId = itemId || state.items[0]?.id;
    const item = state.items.find(i => i.id === activeItemId);
    if (!item) return;

    const returnNo = `MRN-${new Date().getFullYear()}-${String(state.materialReturns.length + 1).padStart(4, '0')}`;
    const now = new Date().toISOString().split('T')[0];
    const deptObj = state.departments.find(d => d.id === departmentId);

    const newReturn: MaterialReturn = {
      id: `mrn-${Date.now()}`,
      returnNo,
      date: now,
      originalIssueRef,
      departmentId,
      storeId: item.defaultStoreId,
      items: [
        {
          itemId: item.id,
          issuedQty: returnQty,
          returnQty: returnQty,
          condition,
          rate: item.averageRate,
          returnValue: returnQty * item.averageRate
        }
      ],
      remarks,
      status: 'Posted',
      createdAt: new Date().toISOString()
    };

    const newQty = item.currentQty + returnQty;
    const newStockVal = newQty * item.averageRate;

    const ledgerEntry: StockLedgerEntry = {
      id: `led-mrn-${item.id}-${Date.now()}`,
      transactionDate: now,
      transactionType: 'RETURN',
      referenceNumber: returnNo,
      itemId: item.id,
      itemCode: item.itemCode,
      itemName: item.itemName,
      storeId: item.defaultStoreId,
      storeName: item.defaultStoreName,
      departmentId,
      departmentName: deptObj?.name,
      inwardQty: returnQty,
      outwardQty: 0,
      runningQty: newQty,
      rate: item.averageRate,
      inwardValue: returnQty * item.averageRate,
      outwardValue: 0,
      runningStockValue: newStockVal,
      userId: state.activeUser.id,
      userName: state.activeUser.name,
      timestamp: new Date().toISOString()
    };

    const updatedItems = state.items.map(i => i.id === item.id ? {
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
        materialReturns: [newReturn, ...prev.materialReturns],
        ledger: [ledgerEntry, ...prev.ledger]
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
            <RotateCcw className="w-5 h-5 text-emerald-400" />
            <span>Material Return Note (MRN)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Return unused, excess, or damaged materials from departments back to store credit</p>
        </div>

        <button
          onClick={() => setShowNew(!showNew)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950"
        >
          <Plus className="w-4 h-4" />
          <span>New Material Return</span>
        </button>
      </div>

      {showNew && (
        <form onSubmit={handlePostReturn} className="p-5 bg-slate-900 border border-slate-700 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">New Return Note</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-slate-300 font-bold mb-1">Select Item to Return</label>
              <select
                value={itemId}
                onChange={e => setItemId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100"
              >
                {state.items.map(i => (
                  <option key={i.id} value={i.id}>{i.itemCode} - {i.itemName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-300 font-bold mb-1">Return Quantity</label>
              <input
                type="number"
                value={returnQty}
                onChange={e => setReturnQty(parseFloat(e.target.value) || 1)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-300 font-bold mb-1">Condition</label>
              <select
                value={condition}
                onChange={e => setCondition(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100"
              >
                <option value="Unused">Unused (Full Restock Credit)</option>
                <option value="Partially Used">Partially Used</option>
                <option value="Damaged">Damaged</option>
                <option value="Scrap">Scrap</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button type="button" onClick={() => setShowNew(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded text-xs">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded text-xs font-bold">Post Return & Restock</button>
          </div>
        </form>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950/60 border-b border-slate-800">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Posted Material Return Notes</h3>
        </div>
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 uppercase text-[10px] font-bold text-slate-400">
            <tr>
              <th className="p-3">Return No</th>
              <th className="p-3">Date</th>
              <th className="p-3">Issue Ref</th>
              <th className="p-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {state.materialReturns.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-slate-500">No material returns logged yet.</td></tr>
            ) : (
              state.materialReturns.map(mrn => (
                <tr key={mrn.id}>
                  <td className="p-3 font-mono font-bold text-emerald-400">{mrn.returnNo}</td>
                  <td className="p-3 font-mono text-slate-400">{mrn.date}</td>
                  <td className="p-3 text-slate-200">{mrn.originalIssueRef}</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                      {mrn.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
