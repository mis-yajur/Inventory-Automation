import React, { useState } from 'react';
import { Database, Save, CheckCircle2 } from 'lucide-react';
import { AppState, saveStateToStorage } from '../services/store';
import { StockLedgerEntry } from '../types';

interface OpeningStockViewProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const OpeningStockView: React.FC<OpeningStockViewProps> = ({ state, setState }) => {
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    state.items.forEach(i => {
      map[i.id] = i.currentQty;
    });
    return map;
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveOpening = () => {
    const now = new Date().toISOString().split('T')[0];

    const updatedItems = state.items.map(item => {
      const newQty = quantities[item.id] !== undefined ? quantities[item.id] : item.currentQty;
      const stockVal = newQty * item.averageRate;
      return {
        ...item,
        currentQty: newQty,
        availableQty: newQty - item.reservedQty,
        stockValue: stockVal,
        updatedAt: now
      };
    });

    // Post opening entries to ledger if missing
    const newLedgerEntries: StockLedgerEntry[] = Object.keys(quantities).map(itemId => {
      const item = state.items.find(i => i.id === itemId);
      const qty = quantities[itemId];
      return {
        id: `led-open-${itemId}-${Date.now()}`,
        transactionDate: now,
        transactionType: 'OPENING',
        referenceNumber: 'OPEN-BAL-INIT',
        itemId: itemId,
        itemCode: item?.itemCode || '',
        itemName: item?.itemName || '',
        storeId: item?.defaultStoreId || 'str-1',
        storeName: item?.defaultStoreName || 'Main Store',
        inwardQty: qty,
        outwardQty: 0,
        runningQty: qty,
        rate: item?.averageRate || 0,
        inwardValue: qty * (item?.averageRate || 0),
        outwardValue: 0,
        runningStockValue: qty * (item?.averageRate || 0),
        userId: state.activeUser.id,
        userName: state.activeUser.name,
        timestamp: new Date().toISOString()
      };
    });

    setState(prev => {
      const newState = {
        ...prev,
        items: updatedItems,
        ledger: [...newLedgerEntries, ...prev.ledger]
      };
      saveStateToStorage(newState);
      return newState;
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-slate-100 flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <span>Opening Stock Initial Register</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Establish starting inventory quantities and rate valuation prior to live transactions</p>
        </div>

        <button
          onClick={handleSaveOpening}
          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-950"
        >
          <Save className="w-4 h-4" />
          <span>Save Opening Register</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5" />
          <span>Opening balances successfully saved and ledger entries updated!</span>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="p-3">Item Code</th>
                <th className="p-3">Item Name</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-right">Standard Rate</th>
                <th className="p-3 text-right">Opening Quantity</th>
                <th className="p-3 text-right">Opening Stock Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {state.items.map(item => {
                const qty = quantities[item.id] !== undefined ? quantities[item.id] : item.currentQty;
                const value = qty * item.averageRate;
                return (
                  <tr key={item.id} className="hover:bg-slate-800/50">
                    <td className="p-3 font-mono font-bold text-emerald-400">{item.itemCode}</td>
                    <td className="p-3 font-semibold text-slate-200">{item.itemName}</td>
                    <td className="p-3 text-slate-400">{item.categoryName}</td>
                    <td className="p-3 text-right font-mono text-slate-300">₹{item.averageRate}</td>
                    <td className="p-3 text-right">
                      <input
                        type="number"
                        value={qty}
                        onChange={e => setQuantities({ ...quantities, [item.id]: parseFloat(e.target.value) || 0 })}
                        className="w-28 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-right text-xs font-mono font-bold text-slate-100 focus:border-emerald-500 focus:outline-none"
                      />
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400">
                      ₹{value.toLocaleString('en-IN')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
