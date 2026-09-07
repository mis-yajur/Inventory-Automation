import React, { useState } from 'react';
import { Layers, Download, Search, Filter } from 'lucide-react';
import { AppState } from '../services/store';
import { Item } from '../types';
import { formatCurrency, getItemInventoryStatus } from '../utils/calculations';

interface CurrentStockViewProps {
  state: AppState;
  onSelectItem: (item: Item) => void;
}

export const CurrentStockView: React.FC<CurrentStockViewProps> = ({ state, onSelectItem }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStore, setSelectedStore] = useState('ALL');

  const filteredItems = state.items.filter(i => {
    const matchesSearch =
      i.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.categoryName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStore = selectedStore === 'ALL' || i.defaultStoreId === selectedStore;

    return matchesSearch && matchesStore;
  });

  const totalValuation = filteredItems.reduce((sum, item) => sum + item.stockValue, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-black text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <span>Current Live Stock Register</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Real-time stock balances, reserved quantities, locations, and valuation</p>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3">
          <span className="text-xs text-slate-400 font-semibold">Total Stock Valuation:</span>
          <span className="text-base font-black text-emerald-400 font-mono">{formatCurrency(totalValuation)}</span>
        </div>
      </div>

      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="w-full md:w-auto flex-1 flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-xl border border-slate-700">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search code, item name, rack..."
            className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
          />
        </div>

        <select
          value={selectedStore}
          onChange={e => setSelectedStore(e.target.value)}
          className="bg-slate-800 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700"
        >
          <option value="ALL">All Store Locations</option>
          {state.stores.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="p-3">Item Code</th>
                <th className="p-3">Item Name</th>
                <th className="p-3">Warehouse Location</th>
                <th className="p-3">Rack & Bin</th>
                <th className="p-3 text-right">Physical Qty</th>
                <th className="p-3 text-right">Reserved Qty</th>
                <th className="p-3 text-right">Available Qty</th>
                <th className="p-3 text-right">Weighted Rate</th>
                <th className="p-3 text-right">Stock Valuation</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredItems.map(item => {
                const status = getItemInventoryStatus(item);
                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelectItem(item)}
                    className="hover:bg-slate-800/50 cursor-pointer transition"
                  >
                    <td className="p-3 font-mono font-bold text-emerald-400">{item.itemCode}</td>
                    <td className="p-3 font-semibold text-slate-100">{item.itemName}</td>
                    <td className="p-3 text-slate-300">{item.defaultStoreName}</td>
                    <td className="p-3 font-mono text-slate-400">Rack {item.rack || 'A01'} - Bin {item.bin || 'B01'}</td>
                    <td className="p-3 text-right font-mono text-slate-300">{item.currentQty} {item.unitName}</td>
                    <td className="p-3 text-right font-mono text-slate-400">{item.reservedQty}</td>
                    <td className="p-3 text-right font-mono font-black text-slate-100">{item.availableQty} {item.unitName}</td>
                    <td className="p-3 text-right font-mono text-slate-300">₹{item.averageRate}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400">{formatCurrency(item.stockValue)}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        status === 'Critical' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                        status === 'Low' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                        status === 'Overstock' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                        'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      }`}>
                        {status}
                      </span>
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
