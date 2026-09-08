import React, { useState, useMemo } from 'react';
import {
  Package, AlertTriangle, ArrowDownLeft, ArrowUpRight, TrendingUp,
  Shield, Layers, Clock, CheckCircle2, ArrowRight, IndianRupee,
  FileSpreadsheet, Sparkles, Send, Check, Loader2, Database,
  TrendingDown, Activity, Heart, Lightbulb, Filter, Search,
  ArrowUpDown, SlidersHorizontal, RefreshCw, X, Calendar, Warehouse, Tags
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area
} from 'recharts';
import { AppState, getMonthlyStock } from '../services/store';
import { Item } from '../types';
import { formatCurrency, getItemInventoryStatus } from '../utils/calculations';

interface DashboardViewProps {
  state: AppState;
  onNavigateTab: (tab: string) => void;
  onSelectItem: (item: Item) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  onNavigateTab,
  onSelectItem
}) => {
  // Global Dashboard Filters
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [dashboardSearch, setDashboardSearch] = useState<string>('');
  const [timeHorizon, setTimeHorizon] = useState<'all' | 'this_month' | 'last_month' | 'last_90' | 'fy'>('all');

  // Critical items sub-table filter & sort
  const [criticalStatusFilter, setCriticalStatusFilter] = useState<'all' | 'Out of Stock' | 'Critical' | 'Low' | 'Negative'>('all');
  const [criticalSortBy, setCriticalSortBy] = useState<'cover_asc' | 'qty_asc' | 'shortfall_desc' | 'val_desc' | 'name_asc'>('cover_asc');
  const [criticalSearch, setCriticalSearch] = useState<string>('');

  // Recent Movements filter & sort
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('all');
  const [movementSortBy, setMovementSortBy] = useState<'date_desc' | 'date_asc' | 'val_desc'>('date_desc');

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedStoreId('all');
    setSelectedCategoryId('all');
    setDashboardSearch('');
    setTimeHorizon('all');
    setCriticalStatusFilter('all');
    setCriticalSortBy('cover_asc');
    setCriticalSearch('');
    setMovementTypeFilter('all');
    setMovementSortBy('date_desc');
  };

  const hasActiveFilters = selectedStoreId !== 'all' || selectedCategoryId !== 'all' || dashboardSearch.trim() !== '' || timeHorizon !== 'all';

  // Filter items according to global dashboard filters
  const filteredItems = useMemo(() => {
    return state.items.filter(item => {
      // Store filter
      if (selectedStoreId !== 'all' && item.defaultStoreId !== selectedStoreId) {
        return false;
      }
      // Category filter
      if (selectedCategoryId !== 'all' && item.categoryId !== selectedCategoryId) {
        return false;
      }
      // Search filter
      if (dashboardSearch.trim()) {
        const query = dashboardSearch.toLowerCase();
        const matchesCode = item.itemCode.toLowerCase().includes(query);
        const matchesName = item.itemName.toLowerCase().includes(query);
        const matchesCat = item.categoryName.toLowerCase().includes(query);
        const matchesStore = item.defaultStoreName.toLowerCase().includes(query);
        if (!matchesCode && !matchesName && !matchesCat && !matchesStore) {
          return false;
        }
      }
      return true;
    });
  }, [state.items, selectedStoreId, selectedCategoryId, dashboardSearch]);

  // Aggregate metrics on filtered items
  const totalItemsCount = filteredItems.length;
  const totalStockValue = useMemo(() => {
    return filteredItems.reduce((sum, item) => sum + (item.stockValue || 0), 0);
  }, [filteredItems]);

  const formatValuation = (valInInr: number) => {
    return `₹${valInInr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const formatAxisK = (valInInr: number) => {
    return `₹${(valInInr / 1000).toFixed(0)}k`;
  };

  // Group items by status
  const {
    criticalCount,
    lowCount,
    outOfStockCount,
    overstockCount,
    nonMovingCount,
    negativeCount,
    nonMovingValue,
    normalCount
  } = useMemo(() => {
    let crit = 0;
    let low = 0;
    let out = 0;
    let over = 0;
    let nonMove = 0;
    let neg = 0;
    let nonMoveVal = 0;
    let norm = 0;

    filteredItems.forEach(item => {
      const status = getItemInventoryStatus(item);
      if (status === 'Critical') crit++;
      else if (status === 'Low') low++;
      else if (status === 'Out of Stock') out++;
      else if (status === 'Overstock') over++;
      else if (status === 'Non-moving' || status === 'Dead Stock') {
        nonMove++;
        nonMoveVal += item.stockValue || 0;
      } else if (status === 'Negative') {
        neg++;
      } else {
        norm++;
      }
    });

    return {
      criticalCount: crit,
      lowCount: low,
      outOfStockCount: out,
      overstockCount: over,
      nonMovingCount: nonMove,
      negativeCount: neg,
      nonMovingValue: nonMoveVal,
      normalCount: norm
    };
  }, [filteredItems]);

  // Inventory Health Score calculation based on filtered subset
  const healthScore = useMemo(() => {
    if (totalItemsCount === 0) return 100;
    let score = 100;
    score -= (negativeCount / totalItemsCount) * 40;
    score -= (outOfStockCount / totalItemsCount) * 25;
    score -= (criticalCount / totalItemsCount) * 15;
    score -= (nonMovingCount / totalItemsCount) * 10;
    score -= (overstockCount / totalItemsCount) * 5;
    return Math.max(0, Math.min(100, score));
  }, [totalItemsCount, negativeCount, outOfStockCount, criticalCount, nonMovingCount, overstockCount]);

  const healthInfo = useMemo(() => {
    if (healthScore > 90) return { label: 'Excellent', color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
    if (healthScore > 75) return { label: 'Good', color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
    if (healthScore > 50) return { label: 'Needs Attention', color: 'text-amber-400', bg: 'bg-amber-500/10' };
    return { label: 'Critical', color: 'text-rose-400', bg: 'bg-rose-500/10' };
  }, [healthScore]);

  // Category Distribution Bar Chart Data
  const categoryChartData = useMemo(() => {
    const categoryMap: Record<string, number> = {};
    filteredItems.forEach(item => {
      categoryMap[item.categoryName] = (categoryMap[item.categoryName] || 0) + (item.stockValue || 0);
    });

    const entries = Object.keys(categoryMap).map(catName => ({
      name: catName,
      value: categoryMap[catName]
    }));

    // Sort categories by highest valuation
    entries.sort((a, b) => b.value - a.value);
    return entries;
  }, [filteredItems]);

  // Dynamic Last 6 Months
  const pastMonths = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const result = [];
    const d = new Date();
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(d.getFullYear(), d.getMonth() - i, 1);
      result.push({
        name: months[targetDate.getMonth()],
        year: targetDate.getFullYear(),
        monthKey: `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`
      });
    }
    return result;
  }, []);

  // Filtered Monthly Consumption Data
  const monthlyConsumptionData = useMemo(() => {
    return pastMonths.map(m => {
      const realLedgerValue = state.ledger
        .filter(l => {
          if (l.transactionType !== 'ISSUE') return false;
          if (!l.transactionDate.startsWith(m.monthKey)) return false;
          if (selectedStoreId !== 'all' && l.storeId !== selectedStoreId) return false;
          return true;
        })
        .reduce((sum, l) => sum + (l.outwardValue || 0), 0);

      return {
        month: `${m.name} ${String(m.year).slice(-2)}`,
        value: realLedgerValue
      };
    });
  }, [pastMonths, state.ledger, selectedStoreId]);

  // Filtered Monthly Closing Stock Value
  const monthlyStockData = useMemo(() => {
    return pastMonths.map(m => {
      const isCurrentMonth = m.monthKey === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      let val = 0;
      if (isCurrentMonth) {
        val = totalStockValue;
      } else {
        const closing = state.monthlyClosings?.find(c => c.monthYear === m.monthKey || (c as any).month === m.monthKey);
        val = closing ? ((closing as any).closingValue || (closing as any).totalStockValue || 0) : 0;
      }

      return {
        month: `${m.name} ${String(m.year).slice(-2)}`,
        value: val
      };
    });
  }, [pastMonths, totalStockValue, state.monthlyClosings]);

  // Critical & Risk Items filtered and sorted
  const criticalItemsList = useMemo(() => {
    let list = filteredItems.filter(item => {
      const s = getItemInventoryStatus(item);
      const isAlert = s === 'Critical' || s === 'Low' || s === 'Out of Stock' || s === 'Negative';
      if (!isAlert) return false;

      if (criticalStatusFilter !== 'all' && s !== criticalStatusFilter) {
        return false;
      }

      if (criticalSearch.trim()) {
        const q = criticalSearch.toLowerCase();
        return item.itemCode.toLowerCase().includes(q) || item.itemName.toLowerCase().includes(q);
      }

      return true;
    });

    // Sorting
    list.sort((a, b) => {
      const aDays = a.avgDailyConsumption > 0 ? (a.availableQty / a.avgDailyConsumption) : 999;
      const bDays = b.avgDailyConsumption > 0 ? (b.availableQty / b.avgDailyConsumption) : 999;

      if (criticalSortBy === 'cover_asc') {
        return aDays - bDays;
      } else if (criticalSortBy === 'qty_asc') {
        return a.availableQty - b.availableQty;
      } else if (criticalSortBy === 'shortfall_desc') {
        const aShortfall = Math.max(0, a.reorderLevel - a.availableQty);
        const bShortfall = Math.max(0, b.reorderLevel - b.availableQty);
        return bShortfall - aShortfall;
      } else if (criticalSortBy === 'val_desc') {
        return (b.stockValue || 0) - (a.stockValue || 0);
      } else if (criticalSortBy === 'name_asc') {
        return a.itemName.localeCompare(b.itemName);
      }
      return 0;
    });

    return list;
  }, [filteredItems, criticalStatusFilter, criticalSortBy, criticalSearch]);

  // Recent Movements Feed
  const recentMovements = useMemo(() => {
    let list = [...state.ledger];

    // Filter by movement type
    if (movementTypeFilter !== 'all') {
      list = list.filter(l => l.transactionType === movementTypeFilter);
    }
    // Filter by store
    if (selectedStoreId !== 'all') {
      list = list.filter(l => l.storeId === selectedStoreId);
    }

    // Sort
    list.sort((a, b) => {
      if (movementSortBy === 'date_desc') {
        return b.transactionDate.localeCompare(a.transactionDate);
      } else if (movementSortBy === 'date_asc') {
        return a.transactionDate.localeCompare(b.transactionDate);
      } else if (movementSortBy === 'val_desc') {
        const aVal = Math.max(a.inwardValue || 0, a.outwardValue || 0);
        const bVal = Math.max(b.inwardValue || 0, b.outwardValue || 0);
        return bVal - aVal;
      }
      return 0;
    });

    return list.slice(0, 8);
  }, [state.ledger, movementTypeFilter, selectedStoreId, movementSortBy]);

  const COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#ec4899', '#8b5cf6', '#6366f1'];

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl ${healthInfo.bg} border border-slate-800 flex flex-col items-center justify-center shadow-inner`}>
            <div className={`text-xl font-black ${healthInfo.color}`}>{Math.round(healthScore)}</div>
            <div className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Score</div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-100 tracking-tight">
                Executive Inventory Dashboard
              </h1>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${healthInfo.color} ${healthInfo.bg} border-current opacity-90`}>
                Health: {healthInfo.label}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Real-time inventory intelligence, store-level filtering, and consumption analytics</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(criticalCount > 0 || outOfStockCount > 0) && (
            <button
              onClick={() => onNavigateTab('reorder_management')}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-rose-900/20 shrink-0 animate-pulse"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Review Reorders ({criticalCount + outOfStockCount})</span>
            </button>
          )}
          <button
            onClick={() => onNavigateTab('stock_in')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950 shrink-0"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Post GRN (Inward)</span>
          </button>
          <button
            onClick={() => onNavigateTab('material_issue')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 shrink-0"
          >
            <ArrowUpRight className="w-4 h-4 text-cyan-400" />
            <span>Issue Material (MIN)</span>
          </button>
        </div>
      </div>

      {/* DASHBOARD GLOBAL FILTER BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Dashboard Scope Filters & Sorting</span>
            {hasActiveFilters && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Filtered: {filteredItems.length} of {state.items.length} SKUs
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 transition"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 border-t border-slate-800/80">
          {/* Store Location Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Warehouse className="w-3 h-3 text-cyan-400" />
              <span>Store Location</span>
            </label>
            <select
              value={selectedStoreId}
              onChange={e => setSelectedStoreId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Stores (Consolidated)</option>
              {state.stores.map(store => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Tags className="w-3 h-3 text-emerald-400" />
              <span>Item Category</span>
            </label>
            <select
              value={selectedCategoryId}
              onChange={e => setSelectedCategoryId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Categories</option>
              {state.categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Time Horizon Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-amber-400" />
              <span>Time Horizon</span>
            </label>
            <select
              value={timeHorizon}
              onChange={e => setTimeHorizon(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Time History</option>
              <option value="this_month">Current Month</option>
              <option value="last_month">Previous Month</option>
              <option value="last_90">Trailing 90 Days</option>
              <option value="fy">Financial Year 2026-27</option>
            </select>
          </div>

          {/* Dashboard Keyword Search */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Search className="w-3 h-3 text-slate-400" />
              <span>Search SKU / Item</span>
            </label>
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <input
                type="text"
                value={dashboardSearch}
                onChange={e => setDashboardSearch(e.target.value)}
                placeholder="Filter by name, code..."
                className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
              />
              {dashboardSearch && (
                <button onClick={() => setDashboardSearch('')} className="text-slate-500 hover:text-slate-300">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Row (Reactive to Selected Store & Category) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Stock Value */}
        <div 
          onClick={() => onNavigateTab('stock_valuation')}
          className="p-4 bg-slate-900 border border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-800/80 transition-colors shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
            <span>Valuation</span>
            <IndianRupee className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-400 mt-2 font-mono">
            {formatValuation(totalStockValue)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">{totalItemsCount} Filtered SKUs</div>
        </div>

        {/* Critical Stock */}
        <div 
          onClick={() => onNavigateTab('reorder_management')}
          className="p-4 bg-slate-900 border border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-800/80 transition-colors shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
            <span>Critical Alert</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-black text-rose-400 mt-2">
            {criticalCount} SKUs
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Below Safety Stock</div>
        </div>

        {/* Low Reorder */}
        <div 
          onClick={() => onNavigateTab('reorder_management')}
          className="p-4 bg-slate-900 border border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-800/80 transition-colors shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
            <span>Reorder Trigger</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-black text-amber-400 mt-2">
            {lowCount} SKUs
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Below Reorder Level</div>
        </div>

        {/* Stockouts */}
        <div 
          onClick={() => onNavigateTab('current_stock')}
          className="p-4 bg-slate-900 border border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-800/80 transition-colors shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
            <span>Stockouts</span>
            <Layers className="w-4 h-4 text-rose-700" />
          </div>
          <div className="text-xl font-black text-rose-500 mt-2">
            {outOfStockCount} SKUs
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Zero Available Qty</div>
        </div>

        {/* Overstock */}
        <div 
          onClick={() => onNavigateTab('current_stock')}
          className="p-4 bg-slate-900 border border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-800/80 transition-colors shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
            <span>Overstock</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-black text-purple-400 mt-2">
            {overstockCount} SKUs
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Exceeds Max Level</div>
        </div>

        {/* Non-Moving Capital */}
        <div 
          onClick={() => onNavigateTab('fast_slow_moving')}
          className="p-4 bg-slate-900 border border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-800/80 transition-colors shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
            <span>Non-Moving</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-black text-slate-300 mt-2 font-mono">
            {formatValuation(nonMovingValue)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Idle &gt; 90 Days ({nonMovingCount} items)</div>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Stock Valuation Bar Chart */}
        <div 
          onClick={() => onNavigateTab('abc_analysis')}
          className="lg:col-span-2 p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 cursor-pointer hover:bg-slate-800/80 transition-colors shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Stock Valuation Distribution by Category</h3>
              <p className="text-[11px] text-slate-400">Capital invested across warehouse classifications</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onNavigateTab('abc_analysis'); }}
              className="text-xs text-emerald-400 font-semibold hover:underline"
            >
              ABC Analysis →
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v) => formatAxisK(v)} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(value: any) => [formatValuation(Number(value)), 'Stock Value']}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {categoryChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Health Status Breakdown */}
        <div 
          onClick={() => onNavigateTab('stock_valuation')}
          className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 cursor-pointer hover:bg-slate-800/80 transition-colors shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100">Inventory Health Matrix</h3>
            <span className="text-[10px] text-slate-400 font-mono">{filteredItems.length} SKUs</span>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Normal Buffer Level</span>
              </span>
              <span className="font-mono font-bold text-slate-200">
                {normalCount} items
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Critical / Safety Hit</span>
              </span>
              <span className="font-mono font-bold text-rose-400">{criticalCount} items</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Low / Reorder Triggered</span>
              </span>
              <span className="font-mono font-bold text-amber-400">{lowCount} items</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-700" />
                <span>Stockouts (Zero Available)</span>
              </span>
              <span className="font-mono font-bold text-rose-400">{outOfStockCount} items</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span>Overstock</span>
              </span>
              <span className="font-mono font-bold text-purple-400">{overstockCount} items</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-800" />
                <span>Negative Stock Balances</span>
              </span>
              <span className="font-mono font-bold text-rose-500">{negativeCount} items</span>
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400">
            <span className="font-bold text-emerald-400 block mb-0.5">Automated Calculation:</span>
            Reorder levels & safety stock are dynamically computed based on average daily consumption and vendor lead times.
          </div>
        </div>
      </div>

      {/* Monthly Stock & Consumption Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Month-Wise Consumption Trend */}
        <div 
          onClick={() => onNavigateTab('consumption')}
          className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 cursor-pointer hover:bg-slate-800/80 transition-colors shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Month-Wise Consumption (Issues)</span>
              </h3>
              <p className="text-[11px] text-slate-400">Total value of materials issued to departments monthly</p>
            </div>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">Last 6 Months</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyConsumptionData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v) => formatAxisK(v)} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(value: any) => [formatValuation(Number(value)), 'Consumption Value']}
                />
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorConsumption)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Month-Wise Stock Levels */}
        <div 
          onClick={() => onNavigateTab('monthly_closing')}
          className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 cursor-pointer hover:bg-slate-800/80 transition-colors shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-cyan-400" />
                <span>Month-Wise Closing Stock Value</span>
              </h3>
              <p className="text-[11px] text-slate-400">Aggregated inventory valuation at month-end closing</p>
            </div>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">Last 6 Months</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyStockData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v) => formatAxisK(v)} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(value: any) => [formatValuation(Number(value)), 'Stock Valuation']}
                />
                <Bar dataKey="value" fill="#06b6d4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* CRITICAL & LOW STOCK ITEMS SECTION (WITH SORT & FILTER OPTIONS) */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-100">Critical & Low Stock Items Needing Immediate Action</h3>
              <p className="text-[11px] text-slate-400">Items below reorder point, safety threshold, or facing stockout</p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('reorder_management')}
            className="text-xs text-emerald-400 font-semibold hover:underline flex items-center gap-1 self-start md:self-auto"
          >
            <span>Open Full Reorder Planner</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Critical Items Sort & Filter Controls */}
        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-wrap gap-2.5 items-center justify-between">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
              <Filter className="w-3 h-3 text-slate-400" />
              <select
                value={criticalStatusFilter}
                onChange={e => setCriticalStatusFilter(e.target.value as any)}
                className="bg-transparent text-xs text-slate-200 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all">All Alert SKUs ({criticalCount + lowCount + outOfStockCount + negativeCount})</option>
                <option value="Out of Stock">Out of Stock Only ({outOfStockCount})</option>
                <option value="Critical">Critical (Safety Hit) ({criticalCount})</option>
                <option value="Low">Low (Reorder Hit) ({lowCount})</option>
                <option value="Negative">Negative Stock ({negativeCount})</option>
              </select>
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-1 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
              <ArrowUpDown className="w-3 h-3 text-slate-400" />
              <select
                value={criticalSortBy}
                onChange={e => setCriticalSortBy(e.target.value as any)}
                className="bg-transparent text-xs text-slate-200 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="cover_asc">Stock Cover: Urgent Risk First</option>
                <option value="qty_asc">Available Qty: Lowest First</option>
                <option value="shortfall_desc">Shortfall: Highest Deficit First</option>
                <option value="val_desc">Stock Value: Highest First</option>
                <option value="name_asc">Item Name (A to Z)</option>
              </select>
            </div>
          </div>

          {/* Search within critical table */}
          <div className="w-full sm:w-56 flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={criticalSearch}
              onChange={e => setCriticalSearch(e.target.value)}
              placeholder="Search critical items..."
              className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="p-3">Item Code</th>
                <th className="p-3">Item Name</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-right">Available Qty</th>
                <th className="p-3 text-right">Safety Stock</th>
                <th className="p-3 text-right">Reorder Level</th>
                <th className="p-3 text-right">Stock Cover</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {criticalItemsList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                    <span className="font-semibold text-xs text-slate-400">No critical stockout or reorder warnings found matching this filter!</span>
                  </td>
                </tr>
              ) : (
                criticalItemsList.slice(0, 15).map(item => {
                  const status = getItemInventoryStatus(item);
                  return (
                    <tr key={item.id} className="hover:bg-slate-800/50 transition">
                      <td className="p-3 font-mono font-bold text-emerald-400 whitespace-nowrap">{item.itemCode}</td>
                      <td className="p-3 font-semibold text-slate-200">{item.itemName}</td>
                      <td className="p-3 text-slate-400 whitespace-nowrap">{item.categoryName}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-100 whitespace-nowrap">{item.availableQty} {item.unitName}</td>
                      <td className="p-3 text-right font-mono text-amber-400 whitespace-nowrap">{item.safetyStock}</td>
                      <td className="p-3 text-right font-mono text-rose-400 whitespace-nowrap">{item.reorderLevel}</td>
                      <td className="p-3 text-right font-mono text-xs whitespace-nowrap">
                        {item.avgDailyConsumption > 0 ? (() => {
                          const days = Math.round(item.availableQty / item.avgDailyConsumption);
                          if (days <= 2) {
                            return <span className="text-rose-400 font-extrabold animate-pulse">⚡ Risk Out ({days}d)</span>;
                          } else if (days <= 5) {
                            return <span className="text-amber-400 font-semibold">⚠️ Alert ({days}d)</span>;
                          } else {
                            return <span className="text-emerald-400 font-medium">✓ Safe ({days}d)</span>;
                          }
                        })() : <span className="text-slate-500">No Demand</span>}
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          status === 'Critical' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                          status === 'Out of Stock' ? 'bg-rose-700/20 text-rose-300 border-rose-600/40' :
                          status === 'Negative' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
                          'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => onSelectItem(item)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold border border-slate-700 transition"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECENT STORE MOVEMENTS FEED WITH SORT & FILTER */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Recent Store Movements & Ledger Activity</span>
            </h3>
            <p className="text-[11px] text-slate-400">Live operational ledger log of inventory transactions</p>
          </div>

          {/* Feed Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
              <Filter className="w-3 h-3 text-slate-400" />
              <select
                value={movementTypeFilter}
                onChange={e => setMovementTypeFilter(e.target.value)}
                className="bg-transparent text-xs text-slate-200 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all">All Movement Types</option>
                <option value="STOCK_IN">GRN Receipts</option>
                <option value="ISSUE">Department Issues</option>
                <option value="RETURN">Store Returns</option>
                <option value="TRANSFER_IN">Transfers In</option>
                <option value="TRANSFER_OUT">Transfers Out</option>
                <option value="ADJUSTMENT_PLUS">Adjustment (+)</option>
                <option value="ADJUSTMENT_MINUS">Adjustment (-)</option>
              </select>
            </div>

            <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
              <ArrowUpDown className="w-3 h-3 text-slate-400" />
              <select
                value={movementSortBy}
                onChange={e => setMovementSortBy(e.target.value as any)}
                className="bg-transparent text-xs text-slate-200 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="date_desc">Latest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="val_desc">Highest Value</option>
              </select>
            </div>

            <button
              onClick={() => onNavigateTab('stock_ledger')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-xs font-bold transition border border-slate-700"
            >
              Full Ledger →
            </button>
          </div>
        </div>

        {/* Movements Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="p-2.5">Date</th>
                <th className="p-2.5">Type</th>
                <th className="p-2.5">Ref No</th>
                <th className="p-2.5">Item</th>
                <th className="p-2.5">Store</th>
                <th className="p-2.5 text-right">Inward</th>
                <th className="p-2.5 text-right">Outward</th>
                <th className="p-2.5 text-right">Balance Qty</th>
                <th className="p-2.5 text-right">Running Value</th>
                <th className="p-2.5">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentMovements.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-slate-500">
                    No movements found matching the selected filter.
                  </td>
                </tr>
              ) : (
                recentMovements.map(m => (
                  <tr key={m.id} className="hover:bg-slate-800/50 transition">
                    <td className="p-2.5 font-mono text-slate-400 whitespace-nowrap">{m.transactionDate.split('T')[0]}</td>
                    <td className="p-2.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        m.transactionType === 'STOCK_IN' || m.transactionType === 'OPENING' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                        m.transactionType === 'ISSUE' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' :
                        m.transactionType === 'RETURN' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                        'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      }`}>
                        {m.transactionType}
                      </span>
                    </td>
                    <td className="p-2.5 font-mono font-bold text-slate-200 whitespace-nowrap">{m.referenceNumber}</td>
                    <td className="p-2.5">
                      <span className="font-mono text-emerald-400 font-bold block">{m.itemCode}</span>
                      <span className="text-slate-300 truncate max-w-[180px] block">{m.itemName}</span>
                    </td>
                    <td className="p-2.5 text-slate-400 whitespace-nowrap">{m.storeName}</td>
                    <td className="p-2.5 text-right font-mono text-emerald-400 font-bold whitespace-nowrap">
                      {m.inwardQty > 0 ? `+${m.inwardQty}` : '-'}
                    </td>
                    <td className="p-2.5 text-right font-mono text-rose-400 font-bold whitespace-nowrap">
                      {m.outwardQty > 0 ? `-${m.outwardQty}` : '-'}
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-slate-100 whitespace-nowrap">{m.runningQty}</td>
                    <td className="p-2.5 text-right font-mono text-emerald-400 whitespace-nowrap">{formatCurrency(m.runningStockValue)}</td>
                    <td className="p-2.5 text-slate-400 whitespace-nowrap">{m.userName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Month Wise Stock Summary Table */}
      <div 
        onClick={() => onNavigateTab('monthly_closing')}
        className="p-5 bg-slate-900 border border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-800/80 transition-colors shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Month Wise Stock Valuation History</h3>
          <span className="text-[10px] text-emerald-400 font-bold hover:underline">View Monthly History →</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-400">
                <th className="py-2 px-3 font-semibold">Month</th>
                <th className="py-2 px-3 font-semibold text-right">Total Quantity</th>
                <th className="py-2 px-3 font-semibold text-right">Closing Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {getMonthlyStock(state).length > 0 ? (
                getMonthlyStock(state).map(row => (
                  <tr key={row.month} className="hover:bg-slate-850/50 transition">
                    <td className="py-2 px-3 font-semibold text-slate-200">{row.month}</td>
                    <td className="py-2 px-3 text-right font-mono text-cyan-400">{row.totalQty.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-400 font-bold">{formatCurrency(row.totalValue)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-xs text-slate-500">No monthly ledger history available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
