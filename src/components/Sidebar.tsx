import React from 'react';
import {
  LayoutDashboard, Package, Tags, Scale, Network, Warehouse,
  Truck, ArrowDownLeft, ArrowUpRight, RotateCcw, ArrowRightLeft,
  Sliders, Layers, TrendingUp, AlertCircle, RefreshCw, BarChart2,
  FileText, Bell, History, Shield, Settings, Database
} from 'lucide-react';
import { ViewType } from '../types';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: ViewType) => void;
  userRole: string;
}

interface NavGroup {
  title: string;
  items: {
    id: ViewType;
    label: string;
    icon: React.ElementType;
    badge?: number;
    badgeColor?: string;
    allowedRoles?: string[];
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onViewChange,
  userRole
}) => {
  const navGroups: NavGroup[] = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      title: 'MASTERS',
      items: [
        { id: 'items', label: 'Item Catalog', icon: Package },
        { id: 'categories', label: 'Categories', icon: Tags },
        { id: 'units', label: 'Units (UOM)', icon: Scale },
        { id: 'departments', label: 'Departments', icon: Network },
        { id: 'stores', label: 'Stores & Bins', icon: Warehouse },
        { id: 'suppliers', label: 'Suppliers', icon: Truck }
      ]
    },
    {
      title: 'OPERATIONS',
      items: [
        { id: 'opening_stock', label: 'Opening Stock', icon: Database, allowedRoles: ['Admin', 'Store Incharge'] },
        { id: 'stock_in', label: 'Stock In (GRN)', icon: ArrowDownLeft },
        { id: 'material_issue', label: 'Material Issue (MIN)', icon: ArrowUpRight },
        { id: 'material_return', label: 'Material Return (MRN)', icon: RotateCcw },
        { id: 'stock_transfer', label: 'Inter-Store Transfer', icon: ArrowRightLeft },
        { id: 'stock_adjustment', label: 'Stock Audit Adjust', icon: Sliders, allowedRoles: ['Admin', 'Store Incharge'] }
      ]
    },
    {
      title: 'STOCK & PLANNING',
      items: [
        { id: 'current_stock', label: 'Current Inventory', icon: Layers },
        { id: 'consumption', label: 'Usage Velocity', icon: TrendingUp },
        { id: 'reorder_management', label: 'Reorder Planning', icon: AlertCircle },
        { id: 'stock_planning', label: 'Buffer & Lead Parameters', icon: Settings },
        { id: 'monthly_closing', label: 'Month-End Closing', icon: RefreshCw, allowedRoles: ['Admin', 'Finance Auditor'] }
      ]
    },
    {
      title: 'ANALYTICS & REPORTS',
      items: [
        { id: 'stock_ledger', label: 'Transaction Ledger', icon: FileText },
        { id: 'stock_valuation', label: 'Asset Valuation', icon: BarChart2 },
        { id: 'abc_analysis', label: 'ABC Classification', icon: BarChart2 },
        { id: 'fast_slow_moving', label: 'FSN Analysis', icon: TrendingUp },
        { id: 'audit_trail', label: 'Security Audit Logs', icon: History, allowedRoles: ['Admin', 'Finance Auditor'] }
      ]
    },
    {
      title: 'ADMINISTRATION',
      items: [
        { id: 'role_management', label: 'Users & Roles', icon: Shield, allowedRoles: ['Admin'] },
        { id: 'plugin_architecture', label: 'Modular Plugins', icon: Settings, allowedRoles: ['Admin'] }
      ]
    }
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-[calc(100vh-57px)] sticky top-[57px] shrink-0 text-slate-700 select-none overflow-y-auto shadow-sm">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-blue-200">
            Y
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-slate-900 tracking-tight leading-none">
              IMS AUTOMATION
            </h1>
            <p className="text-[11px] font-semibold text-blue-600 mt-1">
              Yajur Fibres Portal
            </p>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 p-3 space-y-5 overflow-y-auto scrollbar-thin">
        {navGroups.map(group => {
          // Filter items based on user role permission if defined
          const allowedItems = group.items.filter(item => {
            if (!item.allowedRoles) return true;
            return item.allowedRoles.includes(userRole);
          });

          if (allowedItems.length === 0) return null;

          return (
            <div key={group.title} className="space-y-1">
              <h2 className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                {group.title}
              </h2>
              <div className="mt-1 space-y-0.5">
                {allowedItems.map(item => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onViewChange(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition group ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-100/50'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 transition ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-700'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${item.badgeColor || 'bg-slate-100 text-slate-600'}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/60 text-[10px] text-slate-500 flex items-center justify-between">
        <div>
          <span className="font-semibold text-slate-700">v2.4.0</span> • Enterprise
        </div>
        <div className="text-blue-600 font-semibold">
          IMS Yajur
        </div>
      </div>
    </aside>
  );
};
