import React, { useState } from 'react';
import { ArrowRightLeft, Plus } from 'lucide-react';
import { AppState, saveStateToStorage } from '../services/store';
import { StockTransfer, StockLedgerEntry } from '../types';

interface StockTransferViewProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const StockTransferView: React.FC<StockTransferViewProps> = ({ state, setState }) => {
  const [showNew, setShowNew] = useState(false);
  const [fromStoreId, setFromStoreId] = useState(state.stores[0]?.id || 'str-1');
  const [toStoreId, setToStoreId] = useState(state.stores[1]?.id || 'str-2');
  const [itemId, setItemId] = useState(state.items[0]?.id || '');
  const [transferQty, setTransferQty] = useState(5);

  const handlePostTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromStoreId === toStoreId) return;

    const item = state.items.find(i => i.id === itemId);
    if (!item) return;

    const transferNo = `TRF-2026-${String(state.stockTransfers.length + 44).padStart(3, '0')}`;
    const now = new Date().toISOString().split('T')[0];
    const fromStore = state.stores.find(s => s.id === fromStoreId);
    const toStore = state.stores.find(s => s.id === toStoreId);

    const newTransfer: StockTransfer = {
      id: `trf-${Date.now()}`,
      transferNo,
      date: now,
      fromStoreId,
      toStoreId,
      status: 'Posted',
      items: [
        {
          itemId: item.id,
          sourceAvail: item.availableQty,
          transferQty,
          unit: item.unitName,
          rate: item.averageRate,
          value: transferQty * item.averageRate
        }
      ],
      remarks: 'Inter-warehouse rebalancing transfer',
      createdBy: state.activeUser.name,
      createdAt: new Date().toISOString()
    };

    // Post TRANSFER_OUT & TRANSFER_IN ledger entries
    const led1: StockLedgerEntry = {
      id: `led-trf-out-${Date.now()}`,
      transactionDate: now,
      transactionType: 'TRANSFER_OUT',
      referenceNumber: transferNo,
      itemId: item.id,
      itemCode: item.itemCode,
      itemName: item.itemName,
      storeId: fromStoreId,
      storeName: fromStore?.name || '',
      inwardQty: 0,
      outwardQty: transferQty,
      runningQty: item.currentQty - transferQty,
      rate: item.averageRate,
      inwardValue: 0,
      outwardValue: transferQty * item.averageRate,
      runningStockValue: (item.currentQty - transferQty) * item.averageRate,
      userId: state.activeUser.id,
      userName: state.activeUser.name,
      timestamp: new Date().toISOString()
    };

    const led2: StockLedgerEntry = {
      id: `led-trf-in-${Date.now()}`,
      transactionDate: now,
      transactionType: 'TRANSFER_IN',
      referenceNumber: transferNo,
      itemId: item.id,
      itemCode: item.itemCode,
      itemName: item.itemName,
      storeId: toStoreId,
      storeName: toStore?.name || '',
      inwardQty: transferQty,
      outwardQty: 0,
      runningQty: item.currentQty,
      rate: item.averageRate,
      inwardValue: transferQty * item.averageRate,
      outwardValue: 0,
      runningStockValue: item.currentQty * item.averageRate,
      userId: state.activeUser.id,
      userName: state.activeUser.name,
      timestamp: new Date().toISOString()
    };

    setState(prev => {
      const newState = {
        ...prev,
        stockTransfers: [newTransfer, ...prev.stockTransfers],
        ledger: [led1, led2, ...prev.ledger]
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
            <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
            <span>Inter-Store Stock Transfer</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Relocate inventory between Main Store, Mechanical Store, and Electrical Store</p>
        </div>

        <button
          onClick={() => setShowNew(!showNew)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950"
        >
          <Plus className="w-4 h-4" />
          <span>New Stock Transfer</span>
        </button>
      </div>

      {showNew && (
        <form onSubmit={handlePostTransfer} className="p-5 bg-slate-900 border border-slate-700 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">New Transfer Order</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] text-slate-300 font-bold mb-1">Source Store</label>
              <select
                value={fromStoreId}
                onChange={e => setFromStoreId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100"
              >
                {state.stores.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-300 font-bold mb-1">Destination Store</label>
              <select
                value={toStoreId}
                onChange={e => setToStoreId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100"
              >
                {state.stores.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-300 font-bold mb-1">Item to Relocate</label>
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
              <label className="block text-[11px] text-slate-300 font-bold mb-1">Transfer Qty</label>
              <input
                type="number"
                value={transferQty}
                onChange={e => setTransferQty(parseFloat(e.target.value) || 1)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button type="button" onClick={() => setShowNew(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded text-xs">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded text-xs font-bold">Post Inter-Store Transfer</button>
          </div>
        </form>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950/60 border-b border-slate-800">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Posted Transfer Register</h3>
        </div>
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 uppercase text-[10px] font-bold text-slate-400">
            <tr>
              <th className="p-3">Transfer No</th>
              <th className="p-3">Date</th>
              <th className="p-3">From Store</th>
              <th className="p-3">To Store</th>
              <th className="p-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {state.stockTransfers.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-500">No stock transfers logged yet.</td></tr>
            ) : (
              state.stockTransfers.map(tr => (
                <tr key={tr.id}>
                  <td className="p-3 font-mono font-bold text-emerald-400">{tr.transferNo}</td>
                  <td className="p-3 font-mono text-slate-400">{tr.date}</td>
                  <td className="p-3 text-slate-200">{tr.fromStoreId}</td>
                  <td className="p-3 text-slate-200">{tr.toStoreId}</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                      {tr.status}
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
