import React, { useState, useMemo } from 'react';
import { 
  Building2, Calendar, Download, Printer, Filter, Search, ArrowUpRight, 
  RotateCcw, DollarSign, TrendingUp, Layers, ArrowUpDown, ChevronDown, 
  FileText, Clock, BarChart3, SlidersHorizontal, RefreshCw
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { AppState } from '../services/store';
import { StockLedgerEntry } from '../types';
import { formatCurrency } from '../utils/calculations';

interface DepartmentLedgerViewProps {
  state: AppState;
  onNavigateTab?: (tab: string) => void;
}

export const DepartmentLedgerView: React.FC<DepartmentLedgerViewProps> = ({ state, onNavigateTab }) => {
  // Mode: Date-Wise or Month-Wise
  const [reportMode, setReportMode] = useState<'date_wise' | 'month_wise'>('date_wise');
  
  // Filters
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [selectedTxType, setSelectedTxType] = useState<string>('all'); // all, ISSUE, RETURN
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Sorting
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'value_desc' | 'value_asc' | 'qty_desc' | 'dept_asc'>('date_desc');

  // Quick date presets
  const handleDatePreset = (preset: 'today' | 'week' | 'this_month' | 'last_month' | 'quarter' | 'year' | 'all') => {
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
    } else if (preset === 'year') {
      setFromDate(`${now.getFullYear()}-01-01`);
      setToDate(toStr);
    } else {
      setFromDate('');
      setToDate('');
    }
  };

  // Base departmental transactions (ISSUE or RETURN)
  const deptLedgerEntries = useMemo(() => {
    return state.ledger.filter(entry => {
      // Must have department or be an issue/return
      const isDeptTx = entry.transactionType === 'ISSUE' || entry.transactionType === 'RETURN' || Boolean(entry.departmentId);
      if (!isDeptTx) return false;

      // Department filter
      if (selectedDeptId !== 'all') {
        const matchDept = entry.departmentId === selectedDeptId || 
          state.departments.find(d => d.id === selectedDeptId)?.name.toLowerCase() === entry.departmentName?.toLowerCase();
        if (!matchDept) return false;
      }

      // Transaction Type filter
      if (selectedTxType !== 'all') {
        if (entry.transactionType !== selectedTxType) return false;
      }

      // Date filter
      if (fromDate && entry.transactionDate < fromDate) return false;
      if (toDate && entry.transactionDate > toDate) return false;

      // Category filter
      if (selectedCategory !== 'all') {
        const item = state.items.find(i => i.id === entry.itemId);
        if (item && item.categoryId !== selectedCategory) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const item = state.items.find(i => i.id === entry.itemId);
        const match = 
          entry.itemCode.toLowerCase().includes(q) ||
          entry.itemName.toLowerCase().includes(q) ||
          entry.referenceNumber.toLowerCase().includes(q) ||
          (entry.departmentName && entry.departmentName.toLowerCase().includes(q)) ||
          (item && item.categoryName.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [state.ledger, state.departments, state.items, selectedDeptId, selectedTxType, fromDate, toDate, selectedCategory, searchTerm]);

  // Sorted entries for Date-Wise view
  const sortedDateWiseEntries = useMemo(() => {
    return [...deptLedgerEntries].sort((a, b) => {
      if (sortBy === 'date_desc') return b.transactionDate.localeCompare(a.transactionDate) || b.id.localeCompare(a.id);
      if (sortBy === 'date_asc') return a.transactionDate.localeCompare(b.transactionDate) || a.id.localeCompare(b.id);
      if (sortBy === 'value_desc') {
        const valA = a.outwardValue || a.inwardValue || 0;
        const valB = b.outwardValue || b.inwardValue || 0;
        return valB - valA;
      }
      if (sortBy === 'value_asc') {
        const valA = a.outwardValue || a.inwardValue || 0;
        const valB = b.outwardValue || b.inwardValue || 0;
        return valA - valB;
      }
      if (sortBy === 'qty_desc') {
        const qtyA = a.outwardQty || a.inwardQty || 0;
        const qtyB = b.outwardQty || b.inwardQty || 0;
        return qtyB - qtyA;
      }
      if (sortBy === 'dept_asc') {
        return (a.departmentName || '').localeCompare(b.departmentName || '');
      }
      return 0;
    });
  }, [deptLedgerEntries, sortBy]);

  // Aggregated Month-Wise records
  const monthWiseGroups = useMemo(() => {
    interface MonthDeptSummary {
      monthKey: string;
      deptName: string;
      deptId: string;
      costCentre: string;
      totalIssueQty: number;
      totalReturnQty: number;
      netQty: number;
      totalIssueValue: number;
      totalReturnValue: number;
      netValue: number;
      txCount: number;
      itemCount: Set<string>;
    }

    const map = new Map<string, MonthDeptSummary>();

    deptLedgerEntries.forEach(entry => {
      const monthKey = entry.transactionDate.slice(0, 7); // e.g. "2026-09"
      const deptName = entry.departmentName || 'Unassigned Dept';
      const dept = state.departments.find(d => d.name.toLowerCase() === deptName.toLowerCase() || d.id === entry.departmentId);
      const deptId = dept?.id || entry.departmentId || 'unknown';
      const costCentre = dept?.costCentre || 'CC-GEN';

      const key = `${monthKey}_${deptName}`;

      if (!map.has(key)) {
        map.set(key, {
          monthKey,
          deptName,
          deptId,
          costCentre,
          totalIssueQty: 0,
          totalReturnQty: 0,
          netQty: 0,
          totalIssueValue: 0,
          totalReturnValue: 0,
          netValue: 0,
          txCount: 0,
          itemCount: new Set()
        });
      }

      const rec = map.get(key)!;
      rec.txCount += 1;
      rec.itemCount.add(entry.itemId);

      if (entry.transactionType === 'ISSUE') {
        rec.totalIssueQty += entry.outwardQty;
        rec.totalIssueValue += entry.outwardValue;
      } else if (entry.transactionType === 'RETURN') {
        rec.totalReturnQty += entry.inwardQty;
        rec.totalReturnValue += entry.inwardValue;
      } else {
        rec.totalIssueQty += entry.outwardQty;
        rec.totalIssueValue += entry.outwardValue;
      }

      rec.netQty = rec.totalIssueQty - rec.totalReturnQty;
      rec.netValue = rec.totalIssueValue - rec.totalReturnValue;
    });

    const result = Array.from(map.values()).map(r => ({
      ...r,
      distinctSKUs: r.itemCount.size
    }));

    // Sort by month descending, then net value descending
    return result.sort((a, b) => b.monthKey.localeCompare(a.monthKey) || b.netValue - a.netValue);
  }, [deptLedgerEntries, state.departments]);

  // Overall KPIs
  const totalIssueValue = useMemo(() => {
    return deptLedgerEntries.reduce((sum, e) => {
      if (e.transactionType === 'ISSUE') return sum + e.outwardValue;
      if (e.transactionType === 'RETURN') return sum - e.inwardValue;
      return sum + (e.outwardValue || 0);
    }, 0);
  }, [deptLedgerEntries]);

  const totalQuantityMoved = useMemo(() => {
    return deptLedgerEntries.reduce((sum, e) => sum + (e.outwardQty || e.inwardQty || 0), 0);
  }, [deptLedgerEntries]);

  // Top consuming department
  const topDepartment = useMemo(() => {
    const deptTotals: Record<string, number> = {};
    deptLedgerEntries.forEach(e => {
      const name = e.departmentName || 'General';
      const val = e.transactionType === 'ISSUE' ? e.outwardValue : -e.inwardValue;
      deptTotals[name] = (deptTotals[name] || 0) + val;
    });

    let maxDept = 'None';
    let maxVal = 0;
    Object.entries(deptTotals).forEach(([name, val]) => {
      if (val > maxVal) {
        maxVal = val;
        maxDept = name;
      }
    });

    return { name: maxDept, value: maxVal };
  }, [deptLedgerEntries]);

  // Chart data for Department share
  const deptBarChartData = useMemo(() => {
    const deptTotals: Record<string, number> = {};
    deptLedgerEntries.forEach(e => {
      const name = e.departmentName || 'General';
      const val = e.transactionType === 'ISSUE' ? e.outwardValue : -e.inwardValue;
      deptTotals[name] = (deptTotals[name] || 0) + Math.max(0, val);
    });

    return Object.entries(deptTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  }, [deptLedgerEntries]);

  const CHART_COLORS = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ec4899', '#3b82f6', '#14b8a6'];

  // Export Date-Wise or Month-Wise CSV
  const handleExportCsv = () => {
    const timestamp = new Date().toISOString().split('T')[0];

    if (reportMode === 'date_wise') {
      const headers = [
        'Date', 'Transaction Type', 'Ref Voucher No', 'Department', 'Cost Centre', 
        'Item Code', 'Item Name', 'Qty', 'Unit', 'Rate (INR)', 'Total Value (INR)', 'Store', 'Issued By'
      ];

      const rows = sortedDateWiseEntries.map(e => {
        const dept = state.departments.find(d => d.name === e.departmentName || d.id === e.departmentId);
        const qty = e.transactionType === 'ISSUE' ? e.outwardQty : e.inwardQty;
        const val = e.transactionType === 'ISSUE' ? e.outwardValue : e.inwardValue;

        return [
          e.transactionDate,
          e.transactionType,
          `"${e.referenceNumber}"`,
          `"${e.departmentName || ''}"`,
          `"${dept?.costCentre || 'CC-GEN'}"`,
          `"${e.itemCode}"`,
          `"${e.itemName.replace(/"/g, '""')}"`,
          qty,
          'PCS',
          e.rate.toFixed(2),
          val.toFixed(2),
          `"${e.storeName}"`,
          `"${e.userName || 'MIS System'}"`
        ].join(',');
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Department_Ledger_DateWise_${timestamp}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      const headers = [
        'Month', 'Department Name', 'Cost Centre', 'Total Issues Qty', 
        'Total Returns Qty', 'Net Consumed Qty', 'Gross Value (INR)', 
        'Return Value (INR)', 'Net Consumed Value (INR)', 'Transactions Count', 'Distinct SKUs'
      ];

      const rows = monthWiseGroups.map(m => [
        m.monthKey,
        `"${m.deptName}"`,
        `"${m.costCentre}"`,
        m.totalIssueQty.toFixed(2),
        m.totalReturnQty.toFixed(2),
        m.netQty.toFixed(2),
        m.totalIssueValue.toFixed(2),
        m.totalReturnValue.toFixed(2),
        m.netValue.toFixed(2),
        m.txCount,
        m.distinctSKUs
      ].join(','));

      const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Department_Ledger_MonthWise_${timestamp}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-cyan-950">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-black text-slate-100 tracking-tight">Department Ledger Report</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Date-Wise & Month-Wise
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Material issues, returns, cost centre consumption tracking, and departmental valuation analysis
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Mode Selector */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center">
            <button
              onClick={() => setReportMode('date_wise')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                reportMode === 'date_wise'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Date-Wise Ledger</span>
            </button>
            <button
              onClick={() => setReportMode('month_wise')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                reportMode === 'month_wise'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Month-Wise Summary</span>
            </button>
          </div>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
            title="Export filtered ledger rows to CSV"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition print:hidden"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
            <span>Net Consumption Value</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-400 mt-2 font-mono">
            {formatCurrency(totalIssueValue)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Issues minus material returns</div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
            <span>Total Units Issued</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-black text-cyan-400 mt-2 font-mono">
            {totalQuantityMoved.toLocaleString()} Units
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Total physical material drawn</div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
            <span>Top Consuming Dept</span>
            <Building2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-base font-bold text-slate-100 mt-2 truncate">
            {topDepartment.name}
          </div>
          <div className="text-[10px] text-purple-400 font-mono mt-1">
            {formatCurrency(topDepartment.value)} total consumed
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
            <span>Total Records</span>
            <FileText className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-black text-slate-200 mt-2 font-mono">
            {reportMode === 'date_wise' ? `${sortedDateWiseEntries.length} Transactions` : `${monthWiseGroups.length} Month Groups`}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Across active search scope</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by Voucher Ref, Item Code, Item Name, or Department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-2">
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-semibold focus:outline-none focus:border-cyan-500 transition"
            >
              <option value="all">All Departments</option>
              {state.departments.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.costCentre || 'CC'})</option>
              ))}
            </select>

            {/* Transaction Type Filter */}
            <select
              value={selectedTxType}
              onChange={(e) => setSelectedTxType(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-semibold focus:outline-none focus:border-cyan-500 transition"
            >
              <option value="all">All Movements (Issue & Return)</option>
              <option value="ISSUE">Material Issues Only</option>
              <option value="RETURN">Material Returns Only</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-semibold focus:outline-none focus:border-cyan-500 transition"
            >
              <option value="date_desc">Date (Newest First)</option>
              <option value="date_asc">Date (Oldest First)</option>
              <option value="value_desc">Valuation (Highest First)</option>
              <option value="value_asc">Valuation (Lowest First)</option>
              <option value="qty_desc">Quantity (Highest First)</option>
              <option value="dept_asc">Department (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Date Presets and Range Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mr-1">Period:</span>
            {[
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'Last 7 Days' },
              { id: 'this_month', label: 'This Month' },
              { id: 'last_month', label: 'Last Month' },
              { id: 'quarter', label: 'Last 90 Days' },
              { id: 'year', label: 'This Year' },
              { id: 'all', label: 'All History' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => handleDatePreset(p.id as any)}
                className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] text-slate-300 font-medium transition"
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
              <span className="text-slate-500 text-[11px]">From</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-transparent text-slate-200 text-xs focus:outline-none"
              />
            </div>
            <span className="text-slate-600">to</span>
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
              <span className="text-slate-500 text-[11px]">To</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-transparent text-slate-200 text-xs focus:outline-none"
              />
            </div>

            {(fromDate || toDate || searchTerm || selectedDeptId !== 'all' || selectedTxType !== 'all') && (
              <button
                onClick={() => {
                  setFromDate('');
                  setToDate('');
                  setSearchTerm('');
                  setSelectedDeptId('all');
                  setSelectedTxType('all');
                }}
                className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-semibold transition flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Visual Chart: Departmental Consumption Spend */}
      {deptBarChartData.length > 0 && (
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <span>Departmental Consumption Spend Share</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">Top {deptBarChartData.length} Departments</span>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptBarChartData} margin={{ top: 5, right: 10, left: 10, bottom: 20 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(val: any) => [formatCurrency(Number(val)), 'Net Consumed Value']}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {deptBarChartData.map((_, idx) => (
                    <Cell key={`c-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Main Ledger Table */}
      {reportMode === 'date_wise' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Date-Wise Departmental Ledger Transactions</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">
              Showing {sortedDateWiseEntries.length} Records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Voucher Ref</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Item Code</th>
                  <th className="p-3">Item Name</th>
                  <th className="p-3 text-right">Qty</th>
                  <th className="p-3 text-right">Rate</th>
                  <th className="p-3 text-right">Total Value</th>
                  <th className="p-3">Store Location</th>
                  <th className="p-3">Issued By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {sortedDateWiseEntries.length > 0 ? (
                  sortedDateWiseEntries.map((entry) => {
                    const isIssue = entry.transactionType === 'ISSUE';
                    const qty = isIssue ? entry.outwardQty : entry.inwardQty;
                    const val = isIssue ? entry.outwardValue : entry.inwardValue;

                    return (
                      <tr key={entry.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 font-mono text-slate-300 whitespace-nowrap">{entry.transactionDate}</td>
                        <td className="p-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 w-max ${
                            isIssue 
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {isIssue ? <ArrowUpRight className="w-3 h-3" /> : <RotateCcw className="w-3 h-3" />}
                            <span>{entry.transactionType}</span>
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-200">{entry.referenceNumber}</td>
                        <td className="p-3 font-semibold text-cyan-400 whitespace-nowrap">
                          {entry.departmentName || 'General Dept'}
                        </td>
                        <td className="p-3 font-mono text-emerald-400 font-bold">{entry.itemCode}</td>
                        <td className="p-3 text-slate-200 max-w-xs truncate" title={entry.itemName}>
                          {entry.itemName}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-100">
                          {qty.toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-400">
                          ₹{entry.rate.toFixed(2)}
                        </td>
                        <td className={`p-3 text-right font-mono font-bold ${isIssue ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {formatCurrency(val)}
                        </td>
                        <td className="p-3 text-slate-400 text-[11px] whitespace-nowrap">{entry.storeName}</td>
                        <td className="p-3 text-slate-400 text-[11px] whitespace-nowrap">{entry.userName || 'MIS System'}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-500">
                      No departmental transactions found matching the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Month-Wise Aggregated Table */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <span>Month-Wise Department Consumption Summary</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">
              Showing {monthWiseGroups.length} Department-Month Buckets
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3">Month</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Cost Centre</th>
                  <th className="p-3 text-right">Issues Qty</th>
                  <th className="p-3 text-right">Returns Qty</th>
                  <th className="p-3 text-right">Net Qty</th>
                  <th className="p-3 text-right">Gross Value</th>
                  <th className="p-3 text-right">Return Value</th>
                  <th className="p-3 text-right">Net Consumption Value</th>
                  <th className="p-3 text-center">Transactions</th>
                  <th className="p-3 text-center">SKUs Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {monthWiseGroups.length > 0 ? (
                  monthWiseGroups.map((group, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 font-mono font-bold text-slate-200 whitespace-nowrap">{group.monthKey}</td>
                      <td className="p-3 font-semibold text-cyan-400 whitespace-nowrap">{group.deptName}</td>
                      <td className="p-3 font-mono text-slate-400">{group.costCentre}</td>
                      <td className="p-3 text-right font-mono text-slate-300">{group.totalIssueQty.toFixed(1)}</td>
                      <td className="p-3 text-right font-mono text-slate-400">{group.totalReturnQty.toFixed(1)}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-100">{group.netQty.toFixed(1)}</td>
                      <td className="p-3 text-right font-mono text-amber-400">{formatCurrency(group.totalIssueValue)}</td>
                      <td className="p-3 text-right font-mono text-emerald-400">{formatCurrency(group.totalReturnValue)}</td>
                      <td className="p-3 text-right font-mono font-black text-cyan-400 text-sm">
                        {formatCurrency(group.netValue)}
                      </td>
                      <td className="p-3 text-center font-mono text-slate-400">{group.txCount}</td>
                      <td className="p-3 text-center font-mono text-emerald-400">{group.distinctSKUs}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-500">
                      No monthly consumption history available for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
