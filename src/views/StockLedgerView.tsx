import React, { useState } from 'react';
import { BookOpen, Search, Download, Calendar, Filter, Printer, RotateCcw } from 'lucide-react';
import { AppState } from '../services/store';
import { StockLedgerEntry } from '../types';
import { formatCurrency } from '../utils/calculations';

interface StockLedgerViewProps {
  state: AppState;
  onReverse?: (entry: StockLedgerEntry) => void;
}

export const StockLedgerView: React.FC<StockLedgerViewProps> = ({ state, onReverse }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');

  const handleReverseClick = (entry: StockLedgerEntry) => {
    if (window.confirm(`Are you sure you want to REVERSE this transaction (${entry.referenceNumber})? This will create a counter-transaction to neutralize the stock effect.`)) {
      if (onReverse) onReverse(entry);
    }
  };

  const filteredLedger = state.ledger.filter(l => {
    const matchesSearch =
      l.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = selectedType === 'ALL' || l.transactionType === selectedType;

    return matchesSearch && matchesType;
  });

  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Ref No', 'Item Code', 'Item Name', 'Store', 'Inward Qty', 'Outward Qty', 'Running Qty', 'Rate', 'Inward Val', 'Outward Val', 'Running Val', 'User'];
    const rows = filteredLedger.map(l => [
      l.transactionDate,
      l.transactionType,
      l.referenceNumber,
      l.itemCode,
      `"${l.itemName}"`,
      l.storeName,
      l.inwardQty,
      l.outwardQty,
      l.runningQty,
      l.rate,
      l.inwardValue,
      l.outwardValue,
      l.runningStockValue,
      l.userName
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Stock_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-black text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <span>Master Inventory Stock Ledger</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Chronological audit trail of all store movements, receipts, issues, returns, and valuation updates</p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Export CSV Ledger</span>
        </button>
      </div>

      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="w-full md:w-auto flex-1 flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-xl border border-slate-700">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search ref no, item code, item name..."
            className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
          />
        </div>

        <select
          value={selectedType}
          onChange={e => setSelectedType(e.target.value)}
          className="bg-slate-800 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700"
        >
          <option value="ALL">All Transaction Types</option>
          <option value="OPENING">OPENING</option>
          <option value="STOCK_IN">STOCK_IN (GRN)</option>
          <option value="ISSUE">ISSUE (MIN)</option>
          <option value="RETURN">RETURN (MRN)</option>
          <option value="TRANSFER_IN">TRANSFER_IN</option>
          <option value="TRANSFER_OUT">TRANSFER_OUT</option>
          <option value="ADJUSTMENT_PLUS">ADJUSTMENT_PLUS</option>
          <option value="ADJUSTMENT_MINUS">ADJUSTMENT_MINUS</option>
        </select>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Type</th>
                <th className="p-3">Ref No</th>
                <th className="p-3">Item Code & Name</th>
                <th className="p-3">Store Location</th>
                <th className="p-3 text-right">Inward Qty</th>
                <th className="p-3 text-right">Outward Qty</th>
                <th className="p-3 text-right">Balance Qty</th>
                <th className="p-3 text-right">Rate (₹)</th>
                <th className="p-3 text-right">Balance Value</th>
                <th className="p-3">User</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLedger.length === 0 ? (
                <tr><td colSpan={12} className="p-8 text-center text-slate-500">No matching ledger entries found.</td></tr>
              ) : (
                filteredLedger.map(entry => {
                  const isReversible = entry.transactionType !== 'OPENING' && entry.transactionType !== 'MONTHLY_CLOSE' && !entry.referenceNumber.startsWith('REV-');
                  
                  return (
                    <tr key={entry.id} className="hover:bg-slate-800/50">
                      <td className="p-3 font-mono text-slate-400">{entry.transactionDate}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          entry.transactionType === 'STOCK_IN' || entry.transactionType === 'OPENING' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                          entry.transactionType === 'ISSUE' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' :
                          entry.transactionType === 'RETURN' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                          'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        }`}>
                          {entry.transactionType}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-200">{entry.referenceNumber}</td>
                      <td className="p-3">
                        <strong className="text-emerald-400 font-mono block">{entry.itemCode}</strong>
                        <span className="text-slate-300 font-semibold">{entry.itemName}</span>
                      </td>
                      <td className="p-3 text-slate-400">{entry.storeName}</td>
                      <td className="p-3 text-right font-mono text-emerald-400 font-bold">{entry.inwardQty > 0 ? `+${entry.inwardQty}` : '-'}</td>
                      <td className="p-3 text-right font-mono text-rose-400 font-bold">{entry.outwardQty > 0 ? `-${entry.outwardQty}` : '-'}</td>
                      <td className="p-3 text-right font-mono font-black text-slate-100">{entry.runningQty}</td>
                      <td className="p-3 text-right font-mono text-slate-300">₹{entry.rate}</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-400">{formatCurrency(entry.runningStockValue)}</td>
                      <td className="p-3 text-slate-400">{entry.userName}</td>
                      <td className="p-3 text-right">
                        {isReversible && onReverse && (
                          <button
                            onClick={() => handleReverseClick(entry)}
                            className="p-1.5 bg-slate-800 hover:bg-rose-950/40 text-slate-500 hover:text-rose-500 border border-slate-700/60 hover:border-rose-900/60 rounded transition-all"
                            title="Reverse Transaction"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
