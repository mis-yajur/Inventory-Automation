import React, { useState, useMemo } from 'react';
import { Database, Save, CheckCircle2, UploadCloud, Download, Search, Filter, HelpCircle, ArrowUpDown } from 'lucide-react';
import { AppState, saveStateToStorage } from '../services/store';
import { StockLedgerEntry } from '../types';
import { BulkOpeningStockModal } from '../components/BulkOpeningStockModal';
import { OPENING_STOCK_TEMPLATE, downloadCsvTemplate } from '../utils/csvTemplates';
import { formatCurrency } from '../utils/calculations';

interface OpeningStockViewProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const OpeningStockView: React.FC<OpeningStockViewProps> = ({ state, setState }) => {
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'name_asc' | 'code_asc' | 'qty_desc' | 'val_desc'>('name_asc');
  const [showFormatGuide, setShowFormatGuide] = useState(false);

  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    state.items.forEach(i => {
      map[i.id] = i.currentQty;
    });
    return map;
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync quantities when state.items change (e.g. after bulk upload)
  React.useEffect(() => {
    const map: Record<string, number> = {};
    state.items.forEach(i => {
      map[i.id] = i.currentQty;
    });
    setQuantities(map);
  }, [state.items]);

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

  // Filter and sort items
  const filteredItems = useMemo(() => {
    return state.items
      .filter(item => {
        const matchesSearch = 
          item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.categoryName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCat = selectedCategory === 'all' || item.categoryId === selectedCategory;
        return matchesSearch && matchesCat;
      })
      .sort((a, b) => {
        if (sortBy === 'name_asc') return a.itemName.localeCompare(b.itemName);
        if (sortBy === 'code_asc') return a.itemCode.localeCompare(b.itemCode);
        const qtyA = quantities[a.id] !== undefined ? quantities[a.id] : a.currentQty;
        const qtyB = quantities[b.id] !== undefined ? quantities[b.id] : b.currentQty;
        if (sortBy === 'qty_desc') return qtyB - qtyA;
        if (sortBy === 'val_desc') return (qtyB * b.averageRate) - (qtyA * a.averageRate);
        return 0;
      });
  }, [state.items, searchTerm, selectedCategory, sortBy, quantities]);

  const totalOpeningQty = useMemo(() => {
    return state.items.reduce((sum, i) => sum + (quantities[i.id] !== undefined ? quantities[i.id] : i.currentQty), 0);
  }, [state.items, quantities]);

  const totalOpeningValuation = useMemo(() => {
    return state.items.reduce((sum, i) => {
      const qty = quantities[i.id] !== undefined ? quantities[i.id] : i.currentQty;
      return sum + (qty * i.averageRate);
    }, 0);
  }, [state.items, quantities]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-black text-slate-100 tracking-tight">Opening Stock Initial Register</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Setup Stage
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Establish starting physical inventory quantities and valuation rates prior to live operations
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => downloadCsvTemplate(OPENING_STOCK_TEMPLATE)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
            title="Download pre-configured opening stock template"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Sample CSV</span>
          </button>

          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-cyan-950"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Bulk Upload (CSV / Excel)</span>
          </button>

          <button
            onClick={handleSaveOpening}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-950"
          >
            <Save className="w-4 h-4" />
            <span>Save Register</span>
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Total SKUs in Register</span>
          <span className="text-xl font-black text-slate-100 mt-1 block font-mono">{state.items.length} Items</span>
          <span className="text-[10px] text-slate-500 mt-1 block">Configured in master catalog</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Total Opening Physical Qty</span>
          <span className="text-xl font-black text-cyan-400 mt-1 block font-mono">{totalOpeningQty.toLocaleString()} Units</span>
          <span className="text-[10px] text-slate-500 mt-1 block">Sum of all starting units</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Total Opening Stock Valuation</span>
          <span className="text-xl font-black text-emerald-400 mt-1 block font-mono">{formatCurrency(totalOpeningValuation)}</span>
          <span className="text-[10px] text-slate-500 mt-1 block">Calculated at standard rate</span>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>Opening balances successfully saved and ledger entries updated!</span>
        </div>
      )}

      {/* Data Type & Format Reference Banner */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">CSV Upload Data Types Reference</h3>
          </div>
          <button
            onClick={() => setShowFormatGuide(!showFormatGuide)}
            className="text-xs text-emerald-400 hover:underline font-semibold"
          >
            {showFormatGuide ? 'Hide Guide' : 'Show Guide'}
          </button>
        </div>

        {showFormatGuide && (
          <div className="pt-2 border-t border-slate-800/80 text-xs">
            <p className="text-slate-400 mb-3">
              To batch upload your stock register, download our sample template or prepare an Excel sheet with the following standard columns:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-emerald-400 font-mono font-bold block text-[11px]">Item Code (Text)</span>
                <span className="text-slate-400 text-[10px]">Mandatory unique SKU e.g. BRG-6205</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-emerald-400 font-mono font-bold block text-[11px]">Item Name (Text)</span>
                <span className="text-slate-400 text-[10px]">Mandatory full description</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-cyan-400 font-mono font-bold block text-[11px]">Opening Qty (Number)</span>
                <span className="text-slate-400 text-[10px]">Mandatory physical quantity e.g. 45</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-amber-400 font-mono font-bold block text-[11px]">Standard Rate (Currency ₹)</span>
                <span className="text-slate-400 text-[10px]">Mandatory rate per unit e.g. 350.00</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="w-full md:w-auto flex-1 flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search items by code, name, category..."
            className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-slate-950 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-800 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {state.categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="bg-slate-950 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-800 focus:outline-none"
          >
            <option value="name_asc">Sort: Name (A-Z)</option>
            <option value="code_asc">Sort: Item Code (A-Z)</option>
            <option value="qty_desc">Sort: Opening Qty (High to Low)</option>
            <option value="val_desc">Sort: Stock Value (High to Low)</option>
          </select>
        </div>
      </div>

      {/* Main Opening Stock Table */}
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
              {filteredItems.length > 0 ? (
                filteredItems.map(item => {
                  const qty = quantities[item.id] !== undefined ? quantities[item.id] : item.currentQty;
                  const value = qty * item.averageRate;
                  return (
                    <tr key={item.id} className="hover:bg-slate-800/50 transition">
                      <td className="p-3 font-mono font-bold text-emerald-400">{item.itemCode}</td>
                      <td className="p-3 font-semibold text-slate-200">{item.itemName}</td>
                      <td className="p-3 text-slate-400">{item.categoryName}</td>
                      <td className="p-3 text-right font-mono text-slate-300">₹{item.averageRate.toFixed(2)}</td>
                      <td className="p-3 text-right">
                        <input
                          type="number"
                          value={qty}
                          onChange={e => setQuantities({ ...quantities, [item.id]: parseFloat(e.target.value) || 0 })}
                          className="w-28 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-right text-xs font-mono font-bold text-slate-100 focus:border-emerald-500 focus:outline-none"
                        />
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-400">
                        {formatCurrency(value)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500 space-y-2">
                    <p className="text-sm font-semibold text-slate-300">No items found in Opening Stock Register.</p>
                    <p className="text-xs text-slate-400">Use "Bulk Upload (CSV / Excel)" above to import initial quantities, or use "Sample CSV" to download the template format.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Opening Stock Modal */}
      <BulkOpeningStockModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        state={state}
        setState={setState}
        onSuccess={() => {
          setSavedSuccess(true);
          setTimeout(() => setSavedSuccess(false), 3000);
        }}
      />
    </div>
  );
};

