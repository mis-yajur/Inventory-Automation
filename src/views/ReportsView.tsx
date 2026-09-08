import React from 'react';
import { FileText, Search, Download, Printer, Filter, ChevronRight } from 'lucide-react';
import { AppState } from '../services/store';
import { ViewType } from '../types';

interface ReportsViewProps {
  state: AppState;
  onNavigate: (view: ViewType) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ state, onNavigate }) => {
  const reportCategories = [
    {
      title: 'Master Data Reports',
      reports: [
        { id: 'items', name: 'Current Stock Statement', desc: 'Complete list of items with current quantities and values.', icon: FileText },
        { id: 'suppliers', name: 'Vendor Directory', desc: 'Approved supplier list with contact and SLA details.', icon: FileText },
        { id: 'stores', name: 'Store-wise Inventory', desc: 'Breakdown of stock across different warehouse locations.', icon: FileText },
      ]
    },
    {
      title: 'Transaction Reports',
      reports: [
        { id: 'stock_ledger', name: 'Stock Ledger', desc: 'Historical transaction history for all items.', icon: FileText },
        { id: 'stock_in', name: 'Stock Inward (GRN) Log', desc: 'Record of all received materials.', icon: FileText },
        { id: 'material_issue', name: 'Material Issue (MIN) Log', desc: 'History of material issues to departments.', icon: FileText },
        { id: 'material_return', name: 'Material Return (MRN) Log', desc: 'Record of materials returned from departments.', icon: FileText },
        { id: 'stock_transfer', name: 'Internal Transfer Log', desc: 'Movements between warehouse stores.', icon: FileText },
        { id: 'stock_adjustment', name: 'Audit Adjustment Log', desc: 'Physical vs System discrepancy corrections.', icon: FileText },
      ]
    },
    {
      title: 'Analytical & Planning Reports',
      reports: [
        { id: 'reorder_management', name: 'Low Stock & Reorder Report', desc: 'Items below reorder level requiring replenishment.', icon: FileText },
        { id: 'stock_valuation', name: 'Stock Valuation Report', desc: 'Weighted average valuation of total inventory.', icon: FileText },
        { id: 'abc_analysis', name: 'ABC Analysis', desc: 'Value-based classification (A, B, C items).', icon: FileText },
        { id: 'fast_slow_moving', name: 'Fast/Slow Moving Analysis', desc: 'Movement velocity and consumption frequency.', icon: FileText },
        { id: 'consumption', name: 'Consumption Analysis', desc: 'Department-wise and item-wise usage trends.', icon: FileText },
        { id: 'stock_planning', name: 'Lead Time & Buffer Analysis', desc: 'Safety stock and replenishment parameter review.', icon: FileText },
      ]
    },
    {
      title: 'Management Insights',
      reports: [
        { id: 'dashboard', name: 'Management Dashboard', desc: 'High-level KPI overview and trend charts.', icon: FileText },
        { id: 'monthly_closing', name: 'Monthly Stock Snapshot', desc: 'Closing balances and valuation for the month.', icon: FileText },
        { id: 'audit_trail', name: 'System Activity Logs', desc: 'Complete user action audit history.', icon: FileText },
        { id: 'data_quality', name: 'Data Quality Dashboard', desc: 'Missing parameters and data inconsistency check.', icon: FileText },
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <span>Centralized Report Center</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Access all inventory, analytical, and management reports from one location.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search reports..." 
              className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 w-64 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportCategories.map((category) => (
          <div key={category.title} className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/40">
              <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{category.title}</h2>
            </div>
            <div className="divide-y divide-slate-800/50">
              {category.reports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => onNavigate(report.id as ViewType)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-800/40 transition-colors group text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-slate-800 rounded-xl group-hover:bg-emerald-950 transition-colors">
                      <report.icon className="w-4 h-4 text-slate-400 group-hover:text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">{report.name}</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">{report.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Export Section */}
      <div className="p-6 bg-emerald-600 rounded-2xl shadow-xl shadow-emerald-900/20 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-white">
          <h2 className="font-black text-lg">Batch Data Export</h2>
          <p className="text-emerald-100 text-sm">Download all master and transaction data for offline analysis or backup.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-5 py-2.5 bg-white text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-50 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            <span>Export Excel (.xlsx)</span>
          </button>
          <button className="px-5 py-2.5 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition-colors flex items-center gap-2">
            <Printer className="w-4 h-4" />
            <span>Print All Masters</span>
          </button>
        </div>
      </div>
    </div>
  );
};
