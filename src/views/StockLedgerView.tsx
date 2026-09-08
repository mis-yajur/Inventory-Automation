import React, { useState, useMemo } from 'react';
import { 
  BookOpen, Search, Download, Calendar, Filter, Printer, RotateCcw, 
  ArrowDownLeft, ArrowUpRight, Layers, ArrowUpDown, ChevronDown, 
  Package, RefreshCw, SlidersHorizontal, BarChart3, Clock, CheckCircle2
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { AppState } from '../services/store';
import { StockLedgerEntry, Item } from '../types';
import { formatCurrency } from '../utils/calculations';

interface StockLedgerViewProps {
  state: AppState;
  onReverse?: (entry: StockLedgerEntry) => void;
}

export const StockLedgerView: React.FC<StockLedgerViewProps> = ({ state, onReverse }) => {
  // Selected Item filter: 'all' or specific itemId
  const [selectedItemId, setSelectedItemId] = useState<string>('all');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Date Range
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  
  // Sorting
  const [sortBy, setSortBy] = useState<'date_asc' | 'date_desc' | 'qty_in_desc' | 'qty_out_desc' | 'balance_desc' | 'val_desc'>('date_desc');

  // Quick Date Presets
  const handleDatePreset = (preset: 'today' | 'week' | 'this_month' | 'last_month' | 'quarter' | 'financial_year' | 'all') => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const toStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    if (preset === 'today') {
      setFromDate(toStr);
      setToDate(toStr);
    } else if (preset === 'week') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setFromDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
      setToDate(toStr);
    } else if (preset === 'this_month') {
      setFromDate(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`);
      setToDate(toStr);
    } else if (preset === 'last_month') {
      const prevM = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
      setFromDate(`${prevM.getFullYear()}-${pad(prevM.getMonth() + 1)}-01`);
      setToDate(`${prevM.getFullYear()}-${pad(prevM.getMonth() + 1)}-${pad(lastDay)}`);
    } else if (preset === 'quarter') {
      const d = new Date();
      d.setDate(d.getDate() - 90);
      setFromDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
      setToDate(toStr);
    } else if (preset === 'financial_year') {
      // Indian FY starts April 1st
      const curYear = now.getFullYear();
      const fyStart = now.getMonth() >= 3 ? `${curYear}-04-01` : `${curYear - 1}-04-01`;
      setFromDate(fyStart);
      setToDate(toStr);
    } else if (preset === 'all') {
      setFromDate('');
      setToDate('');
    }
  };

  const handleResetFilters = () => {
    setSelectedItemId('all');
    setSelectedStoreId('all');
    setSelectedType('ALL');
    setSearchTerm('');
    setFromDate('');
    setToDate('');
    setSortBy('date_desc');
  };

  const handleReverseClick = (entry: StockLedgerEntry) => {
    if (window.confirm(`Are you sure you want to REVERSE this transaction (${entry.referenceNumber})? This will create an offsetting entry.`)) {
      if (onReverse) onReverse(entry);
    }
  };

  // Selected item object (if a single item is picked)
  const currentItem = useMemo(() => {
    if (selectedItemId === 'all') return null;
    return state.items.find(i => i.id === selectedItemId) || null;
  }, [state.items, selectedItemId]);

  // Filtered Ledger Entries
  const filteredLedger = useMemo(() => {
    return state.ledger.filter(entry => {
      // Item filter
      if (selectedItemId !== 'all' && entry.itemId !== selectedItemId) {
        return false;
      }

      // Store filter
      if (selectedStoreId !== 'all' && entry.storeId !== selectedStoreId) {
        return false;
      }

      // Transaction Type filter
      if (selectedType !== 'ALL' && entry.transactionType !== selectedType) {
        return false;
      }

      // Date Range filter
      const entryDate = entry.transactionDate.split('T')[0];
      if (fromDate && entryDate < fromDate) {
        return false;
      }
      if (toDate && entryDate > toDate) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesRef = entry.referenceNumber.toLowerCase().includes(query);
        const matchesCode = entry.itemCode.toLowerCase().includes(query);
        const matchesName = entry.itemName.toLowerCase().includes(query);
        const matchesStore = entry.storeName.toLowerCase().includes(query);
        const matchesUser = entry.userName.toLowerCase().includes(query);
        if (!matchesRef && !matchesCode && !matchesName && !matchesStore && !matchesUser) {
          return false;
        }
      }

      return true;
    });
  }, [state.ledger, selectedItemId, selectedStoreId, selectedType, fromDate, toDate, searchTerm]);

  // Sorted Ledger Entries
  const sortedLedger = useMemo(() => {
    const list = [...filteredLedger];
    list.sort((a, b) => {
      if (sortBy === 'date_asc') {
        return a.transactionDate.localeCompare(b.transactionDate);
      } else if (sortBy === 'date_desc') {
        return b.transactionDate.localeCompare(a.transactionDate);
      } else if (sortBy === 'qty_in_desc') {
        return (b.inwardQty || 0) - (a.inwardQty || 0);
      } else if (sortBy === 'qty_out_desc') {
        return (b.outwardQty || 0) - (a.outwardQty || 0);
      } else if (sortBy === 'balance_desc') {
        return (b.runningQty || 0) - (a.runningQty || 0);
      } else if (sortBy === 'val_desc') {
        return (b.runningStockValue || 0) - (a.runningStockValue || 0);
      }
      return 0;
    });
    return list;
  }, [filteredLedger, sortBy]);

  // Statistics & KPI calculations
  const stats = useMemo(() => {
    let totalInwardQty = 0;
    let totalOutwardQty = 0;
    let totalInwardVal = 0;
    let totalOutwardVal = 0;

    filteredLedger.forEach(e => {
      totalInwardQty += e.inwardQty || 0;
      totalOutwardQty += e.outwardQty || 0;
      totalInwardVal += e.inwardValue || 0;
      totalOutwardVal += e.outwardValue || 0;
    });

    const netQtyChange = totalInwardQty - totalOutwardQty;
    const netValChange = totalInwardVal - totalOutwardVal;

    // For single item, calculate Opening Balance before fromDate
    let openingQty = 0;
    let openingVal = 0;

    if (selectedItemId !== 'all' && fromDate) {
      const priorEntries = state.ledger
        .filter(e => e.itemId === selectedItemId && e.transactionDate.split('T')[0] < fromDate)
        .sort((a, b) => a.transactionDate.localeCompare(b.transactionDate));

      if (priorEntries.length > 0) {
        const lastPrior = priorEntries[priorEntries.length - 1];
        openingQty = lastPrior.runningQty;
        openingVal = lastPrior.runningStockValue;
      }
    } else if (selectedItemId !== 'all' && !fromDate) {
      const openingEntry = state.ledger.find(e => e.itemId === selectedItemId && e.transactionType === 'OPENING');
      if (openingEntry) {
        openingQty = openingEntry.inwardQty;
        openingVal = openingEntry.inwardValue;
      }
    }

    const closingQty = selectedItemId !== 'all' ? openingQty + netQtyChange : null;
    const closingVal = selectedItemId !== 'all' ? openingVal + netValChange : null;

    return {
      totalInwardQty,
      totalOutwardQty,
      totalInwardVal,
      totalOutwardVal,
      netQtyChange,
      netValChange,
      openingQty,
      openingVal,
      closingQty,
      closingVal,
      count: filteredLedger.length
    };
  }, [filteredLedger, state.ledger, selectedItemId, fromDate]);

  // Chart data: Chronological progression of balance
  const chartData = useMemo(() => {
    const chronological = [...filteredLedger].sort((a, b) => a.transactionDate.localeCompare(b.transactionDate));
    if (chronological.length > 50) {
      // Subsample for chart display if huge
      const step = Math.ceil(chronological.length / 40);
      return chronological.filter((_, idx) => idx % step === 0 || idx === chronological.length - 1).map(e => ({
        date: e.transactionDate.split('T')[0],
        runningQty: e.runningQty,
        runningVal: e.runningStockValue,
        inward: e.inwardQty,
        outward: e.outwardQty
      }));
    }
    return chronological.map(e => ({
      date: e.transactionDate.split('T')[0],
      runningQty: e.runningQty,
      runningVal: e.runningStockValue,
      inward: e.inwardQty,
      outward: e.outwardQty
    }));
  }, [filteredLedger]);

  const handleExportCSV = () => {
    const headers = [
      'Date', 
      'Type', 
      'Reference No', 
      'Item Code', 
      'Item Name', 
      'Store Location', 
      'Inward Qty', 
      'Outward Qty', 
      'Running Balance Qty', 
      'Unit Rate (INR)', 
      'Inward Value (INR)', 
      'Outward Value (INR)', 
      'Running Balance Value (INR)', 
      'User'
    ];
    
    const rows = sortedLedger.map(l => [
      l.transactionDate,
      l.transactionType,
      `"${l.referenceNumber}"`,
      `"${l.itemCode}"`,
      `"${l.itemName.replace(/"/g, '""')}"`,
      `"${l.storeName}"`,
      l.inwardQty || 0,
      l.outwardQty || 0,
      l.runningQty || 0,
      l.rate || 0,
      l.inwardValue || 0,
      l.outwardValue || 0,
      l.runningStockValue || 0,
      `"${l.userName}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const itemNameStr = currentItem ? currentItem.itemCode : 'All_Items';
    link.setAttribute('download', `Item_Stock_Ledger_${itemNameStr}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-black text-slate-100 tracking-tight">Item Ledger Report (Date-Wise)</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {sortedLedger.length} Movements Logged
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Comprehensive chronological ledger of SKU receipts, issues, returns, and valuation with balance progression</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
            title="Print or Save PDF"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-950"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV Ledger</span>
          </button>
        </div>
      </div>

      {/* Filter & Date-Wise Controls Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Item Selector Dropdown */}
          <div className="flex-1">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-emerald-400" />
              <span>Select Item / SKU</span>
            </label>
            <select
              value={selectedItemId}
              onChange={e => setSelectedItemId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Items (Consolidated Master Ledger)</option>
              {state.items.map(item => (
                <option key={item.id} value={item.id}>
                  {item.itemCode} — {item.itemName} ({item.categoryName} | {item.unitName})
                </option>
              ))}
            </select>
          </div>

          {/* Store Selector */}
          <div className="w-full lg:w-48">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Store Location
            </label>
            <select
              value={selectedStoreId}
              onChange={e => setSelectedStoreId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Stores</option>
              {state.stores.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Transaction Type */}
          <div className="w-full lg:w-48">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Transaction Type
            </label>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Types</option>
              <option value="OPENING">OPENING (Initial Stock)</option>
              <option value="STOCK_IN">STOCK_IN (GRN Receipt)</option>
              <option value="ISSUE">ISSUE (Material Issue)</option>
              <option value="RETURN">RETURN (Return to Store)</option>
              <option value="TRANSFER_IN">TRANSFER_IN</option>
              <option value="TRANSFER_OUT">TRANSFER_OUT</option>
              <option value="ADJUSTMENT_PLUS">ADJUSTMENT_PLUS (+)</option>
              <option value="ADJUSTMENT_MINUS">ADJUSTMENT_MINUS (-)</option>
            </select>
          </div>
        </div>

        {/* Date Range Row */}
        <div className="pt-3 border-t border-slate-800 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mr-1">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>Date Filter:</span>
            </span>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              title="From Date"
            />
            <span className="text-xs text-slate-500">to</span>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              title="To Date"
            />

            {/* Quick Date Presets */}
            <div className="flex flex-wrap items-center gap-1 ml-2">
              <button
                type="button"
                onClick={() => handleDatePreset('today')}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-semibold transition"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleDatePreset('week')}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-semibold transition"
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => handleDatePreset('this_month')}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-semibold transition"
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => handleDatePreset('last_month')}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-semibold transition"
              >
                Last Month
              </button>
              <button
                type="button"
                onClick={() => handleDatePreset('quarter')}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-semibold transition"
              >
                Quarter
              </button>
              <button
                type="button"
                onClick={() => handleDatePreset('financial_year')}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-semibold transition"
              >
                FY 2026-27
              </button>
              <button
                type="button"
                onClick={() => handleDatePreset('all')}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-[10px] font-bold transition"
              >
                All Time
              </button>
            </div>
          </div>

          {/* Search and Sort controls */}
          <div className="w-full xl:w-auto flex flex-wrap items-center gap-2">
            <div className="flex-1 xl:w-64 flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search ref no, user, code..."
                className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs text-slate-200 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="date_desc">Date: Newest First</option>
                <option value="date_asc">Date: Chronological (Oldest First)</option>
                <option value="qty_in_desc">Inward Qty: High to Low</option>
                <option value="qty_out_desc">Outward Qty: High to Low</option>
                <option value="balance_desc">Running Qty: High to Low</option>
                <option value="val_desc">Running Value: High to Low</option>
              </select>
            </div>

            <button
              onClick={handleResetFilters}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-xl transition border border-slate-700"
              title="Reset All Filters"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Item Profile Card (when specific item selected) */}
      {currentItem && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-base">
                {currentItem.unitName || 'SKU'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-emerald-400 font-bold text-sm">{currentItem.itemCode}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    {currentItem.categoryName}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    UOM: {currentItem.unitName}
                  </span>
                </div>
                <h2 className="text-base font-bold text-slate-100 mt-0.5">{currentItem.itemName}</h2>
                <p className="text-xs text-slate-400">Default Store: {currentItem.defaultStoreName} | Rack/Bin: {currentItem.rack || '-'}/{currentItem.bin || '-'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-slate-950/70 px-4 py-2.5 rounded-xl border border-slate-800 text-right">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Current Physical Qty</span>
                <span className="text-base font-black font-mono text-emerald-400">{currentItem.currentQty} {currentItem.unitName}</span>
              </div>
              <div className="h-7 w-px bg-slate-800" />
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Current Inventory Value</span>
                <span className="text-base font-black font-mono text-slate-100">{formatCurrency(currentItem.stockValue)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards: Period Movement Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Period Inward Total */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Inward (Receipts)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-400 font-mono">
            +{stats.totalInwardQty.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 flex items-center justify-between pt-1">
            <span>Inward Value:</span>
            <span className="font-mono font-bold text-emerald-400">{formatCurrency(stats.totalInwardVal)}</span>
          </div>
        </div>

        {/* Period Outward Total */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Outward (Issues)</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-rose-400 font-mono">
            -{stats.totalOutwardQty.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 flex items-center justify-between pt-1">
            <span>Outward Value:</span>
            <span className="font-mono font-bold text-rose-400">{formatCurrency(stats.totalOutwardVal)}</span>
          </div>
        </div>

        {/* Net Period Movement */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Movement Delta</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-xl font-black font-mono ${stats.netQtyChange >= 0 ? 'text-cyan-400' : 'text-amber-400'}`}>
            {stats.netQtyChange >= 0 ? `+${stats.netQtyChange}` : stats.netQtyChange}
          </div>
          <div className="text-xs text-slate-400 flex items-center justify-between pt-1">
            <span>Net Value Delta:</span>
            <span className={`font-mono font-bold ${stats.netValChange >= 0 ? 'text-cyan-400' : 'text-amber-400'}`}>
              {formatCurrency(stats.netValChange)}
            </span>
          </div>
        </div>

        {/* Filtered Records / Single item Closing */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {currentItem ? 'Closing Balance in Range' : 'Total Transactions'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-100 font-mono">
            {currentItem && stats.closingQty !== null 
              ? `${stats.closingQty.toLocaleString()} ${currentItem.unitName}` 
              : `${stats.count} Entries`}
          </div>
          <div className="text-xs text-slate-400 flex items-center justify-between pt-1">
            <span>{currentItem ? 'Closing Value:' : 'Scope:'}</span>
            <span className="font-mono font-bold text-slate-200">
              {currentItem && stats.closingVal !== null ? formatCurrency(stats.closingVal) : (fromDate ? `${fromDate} to ${toDate || 'Now'}` : 'All Dates')}
            </span>
          </div>
        </div>
      </div>

      {/* Chart: Progression Timeline */}
      {chartData.length > 1 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                {currentItem ? `${currentItem.itemName} — Running Stock Balance Progression` : 'Running Inventory Valuation Progression (Date-Wise)'}
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">{chartData.length} Data Points</span>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRunning" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey={currentItem ? "runningQty" : "runningVal"} 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorRunning)" 
                  name={currentItem ? "Running Qty" : "Running Value (₹)"}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Main Ledger Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Type</th>
                <th className="p-3">Ref No</th>
                <th className="p-3">Item Details</th>
                <th className="p-3">Store Location</th>
                <th className="p-3 text-right">Inward Qty</th>
                <th className="p-3 text-right">Outward Qty</th>
                <th className="p-3 text-right">Balance Qty</th>
                <th className="p-3 text-right">Rate (₹)</th>
                <th className="p-3 text-right">Running Value</th>
                <th className="p-3">User</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sortedLedger.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-12 text-center text-slate-500">
                    <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-semibold">No matching ledger entries found.</p>
                    <p className="text-xs text-slate-500 mt-1">Try broadening your date range or clearing the filter.</p>
                    <button
                      onClick={handleResetFilters}
                      className="mt-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-xs font-bold transition"
                    >
                      Reset Filters
                    </button>
                  </td>
                </tr>
              ) : (
                sortedLedger.map(entry => {
                  const isReversible = entry.transactionType !== 'OPENING' && entry.transactionType !== 'MONTHLY_CLOSE' && !entry.referenceNumber.startsWith('REV-');
                  
                  return (
                    <tr key={entry.id} className="hover:bg-slate-800/50 transition">
                      <td className="p-3 font-mono text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{entry.transactionDate}</span>
                        </div>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          entry.transactionType === 'STOCK_IN' || entry.transactionType === 'OPENING' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                          entry.transactionType === 'ISSUE' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' :
                          entry.transactionType === 'RETURN' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                          'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        }`}>
                          {entry.transactionType}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-200 whitespace-nowrap">
                        {entry.referenceNumber}
                      </td>
                      <td className="p-3">
                        <strong className="text-emerald-400 font-mono block text-xs">{entry.itemCode}</strong>
                        <span className="text-slate-300 font-semibold text-xs block">{entry.itemName}</span>
                      </td>
                      <td className="p-3 text-slate-400 whitespace-nowrap">{entry.storeName}</td>
                      <td className="p-3 text-right font-mono text-emerald-400 font-bold whitespace-nowrap">
                        {entry.inwardQty > 0 ? `+${entry.inwardQty}` : '-'}
                      </td>
                      <td className="p-3 text-right font-mono text-rose-400 font-bold whitespace-nowrap">
                        {entry.outwardQty > 0 ? `-${entry.outwardQty}` : '-'}
                      </td>
                      <td className="p-3 text-right font-mono font-black text-slate-100 whitespace-nowrap">
                        {entry.runningQty}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-300 whitespace-nowrap">
                        ₹{entry.rate?.toFixed(2) || '0.00'}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                        {formatCurrency(entry.runningStockValue)}
                      </td>
                      <td className="p-3 text-slate-400 whitespace-nowrap">{entry.userName}</td>
                      <td className="p-3 text-right whitespace-nowrap">
                        {isReversible && onReverse && (
                          <button
                            onClick={() => handleReverseClick(entry)}
                            className="p-1.5 bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700/60 hover:border-rose-900/60 rounded-lg transition-all"
                            title="Reverse this transaction"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
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
