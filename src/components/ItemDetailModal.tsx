import React from 'react';
import {
  X, Package, Shield, AlertTriangle, Layers, MapPin, Truck,
  History, Calendar, ArrowDownLeft, ArrowUpRight, BarChart2
} from 'lucide-react';
import { AppState } from '../services/store';
import { Item } from '../types';
import {
  calculateStockCoverDays,
  calculateRecommendedReorderQty,
  formatCurrency,
  getItemInventoryStatus
} from '../utils/calculations';

interface ItemDetailModalProps {
  isOpen: boolean;
  item: Item | null;
  onClose: () => void;
  state: AppState;
  onEdit: (item: Item) => void;
  onStockIn: (item: Item) => void;
  onIssue: (item: Item) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  isOpen,
  item,
  onClose,
  state,
  onEdit,
  onStockIn,
  onIssue
}) => {
  if (!isOpen || !item) return null;

  const status = getItemInventoryStatus(item);
  const coverDays = calculateStockCoverDays(item.availableQty, item.avgDailyConsumption);
  const suggestedReorder = calculateRecommendedReorderQty(item.maxStock, item.availableQty, item.reorderLevel);

  // Filter item ledger entries
  const itemLedger = state.ledger.filter(l => l.itemId === item.id || l.itemCode === item.itemCode);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-emerald-400 font-bold text-xs">{item.itemCode}</span>
                <h3 className="font-extrabold text-base text-slate-100">{item.itemName}</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                  status === 'Critical' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                  status === 'Low' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                  status === 'Overstock' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                  status === 'Out of Stock' ? 'bg-rose-600/20 text-rose-300 border-rose-600/40' :
                  'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}>
                  {status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{item.description || 'Industrial MRO Spare Part'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onEdit(item);
                onClose();
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition border border-slate-700"
            >
              Edit Master
            </button>
            <button
              onClick={onClose}
              aria-label="Close detail modal"
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Key Indicators Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Available Stock</span>
              <span className="text-lg font-extrabold text-slate-100 mt-0.5 block">
                {item.availableQty} <span className="text-xs font-normal text-slate-400">{item.unitName}</span>
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">Total: {item.currentQty} | Reserved: {item.reservedQty}</span>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Stock Valuation</span>
              <span className="text-lg font-extrabold text-emerald-400 mt-0.5 block">
                {formatCurrency(item.stockValue)}
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">Avg Rate: ₹{item.averageRate}</span>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Stock Cover Days</span>
              <span className={`text-lg font-extrabold mt-0.5 block ${
                typeof coverDays === 'number' && coverDays <= item.leadTimeDays ? 'text-rose-400' : 'text-cyan-400'
              }`}>
                {coverDays === 'Infinite' ? 'Infinite' : `${coverDays} Days`}
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">Lead Time: {item.leadTimeDays} Days</span>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Suggested Reorder</span>
              <span className="text-lg font-extrabold text-amber-400 mt-0.5 block">
                {suggestedReorder} <span className="text-xs font-normal text-slate-400">{item.unitName}</span>
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">Reorder Lvl: {item.reorderLevel}</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3 p-3 bg-slate-800/40 rounded-xl border border-slate-800">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 self-center">
              Quick Actions:
            </span>
            <button
              onClick={() => {
                onStockIn(item);
                onClose();
              }}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Inward Stock (GRN)</span>
            </button>
            <button
              onClick={() => {
                onIssue(item);
                onClose();
              }}
              className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Issue Material (MIN)</span>
            </button>
          </div>

          {/* Parameters Detail Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Storage & Classification */}
            <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> Storage & Classification
              </h4>
              <div className="divide-y divide-slate-800/80 text-xs">
                <div className="py-1.5 flex justify-between"><span className="text-slate-400">Category:</span><span className="font-semibold text-slate-200">{item.categoryName}</span></div>
                <div className="py-1.5 flex justify-between"><span className="text-slate-400">Store Location:</span><span className="font-semibold text-slate-200">{item.defaultStoreName}</span></div>
                <div className="py-1.5 flex justify-between"><span className="text-slate-400">Rack / Bin:</span><span className="font-mono text-emerald-400">Rack {item.rack || 'A01'} - Bin {item.bin || 'B01'}</span></div>
                <div className="py-1.5 flex justify-between"><span className="text-slate-400">Part / Model #:</span><span className="font-mono text-slate-200">{item.partNumber || 'N/A'}</span></div>
                <div className="py-1.5 flex justify-between"><span className="text-slate-400">Brand / Make:</span><span className="font-semibold text-slate-200">{item.brand || 'N/A'}</span></div>
                <div className="py-1.5 flex justify-between"><span className="text-slate-400">Preferred Supplier:</span><span className="font-semibold text-slate-200">{item.preferredSupplierName || 'N/A'}</span></div>
              </div>
            </div>

            {/* Thresholds & Planning */}
            <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4" /> Thresholds & Safety Limits
              </h4>
              <div className="divide-y divide-slate-800/80 text-xs">
                <div className="py-1.5 flex justify-between"><span className="text-slate-400">Safety Stock:</span><span className="font-bold text-amber-400">{item.safetyStock} {item.unitName}</span></div>
                <div className="py-1.5 flex justify-between"><span className="text-slate-400">Reorder Level:</span><span className="font-bold text-rose-400">{item.reorderLevel} {item.unitName}</span></div>
                <div className="py-1.5 flex justify-between"><span className="text-slate-400">Min / Max Range:</span><span className="font-semibold text-slate-200">{item.minStock} - {item.maxStock} {item.unitName}</span></div>
                <div className="py-1.5 flex justify-between"><span className="text-slate-400">Avg Daily Consumption:</span><span className="font-semibold text-slate-200">{item.avgDailyConsumption} {item.unitName}/day</span></div>
                <div className="py-1.5 flex justify-between"><span className="text-slate-400">Supplier Lead Time:</span><span className="font-semibold text-slate-200">{item.leadTimeDays} Days</span></div>
                <div className="py-1.5 flex justify-between"><span className="text-slate-400">Safety Factor:</span><span className="font-semibold text-slate-200">{item.safetyFactor}%</span></div>
              </div>
            </div>
          </div>

          {/* Transaction History Register */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-4 h-4 text-emerald-400" /> Recent Stock Ledger Transactions
            </h4>

            {itemLedger.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-950/40 border border-slate-800 rounded-xl">
                No stock ledger history recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">Ref No</th>
                      <th className="p-2.5 text-right">Inward</th>
                      <th className="p-2.5 text-right">Outward</th>
                      <th className="p-2.5 text-right">Running Stock</th>
                      <th className="p-2.5 text-right">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                    {itemLedger.map(entry => (
                      <tr key={entry.id} className="hover:bg-slate-800/50">
                        <td className="p-2.5 font-mono text-slate-400">{entry.transactionDate}</td>
                        <td className="p-2.5 font-semibold text-slate-200">{entry.transactionType}</td>
                        <td className="p-2.5 font-mono text-emerald-400">{entry.referenceNumber}</td>
                        <td className="p-2.5 text-right font-mono text-emerald-400">
                          {entry.inwardQty > 0 ? `+${entry.inwardQty}` : '-'}
                        </td>
                        <td className="p-2.5 text-right font-mono text-rose-400">
                          {entry.outwardQty > 0 ? `-${entry.outwardQty}` : '-'}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-100">
                          {entry.runningQty}
                        </td>
                        <td className="p-2.5 text-right font-mono text-slate-400">
                          ₹{entry.rate}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
