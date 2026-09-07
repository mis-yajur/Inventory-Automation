import React from 'react';
import {
  LayoutDashboard, Package, Tags, Scale, Network, Warehouse,
  Truck, ArrowDownLeft, ArrowUpRight, RotateCcw, ArrowRightLeft,
  Sliders, Layers, TrendingUp, AlertCircle, RefreshCw, BarChart2,
  FileText, Bell, History, Shield, Settings, Database, Code
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  criticalAlertCount: number;
}

interface NavGroup {
  title: string;
  items: {
    id: string;
    label: string;
    icon: React.ElementType;
    badge?: number;
    badgeColor?: string;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  criticalAlertCount
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
        { id: 'items', label: 'Item Master', icon: Package },
        { id: 'categories', label: 'Categories', icon: Tags },
        { id: 'units', label: 'Units', icon: Scale },
        { id: 'departments', label: 'Departments', icon: Network },
        { id: 'stores', label: 'Stores & Bins', icon: Warehouse },
        { id: 'suppliers', label: 'Suppliers', icon: Truck }
      ]
    },
    {
      title: 'OPERATIONS',
      items: [
        { id: 'opening-stock', label: 'Opening Stock', icon: Database },
        { id: 'stock-in', label: 'Stock In (GRN)', icon: ArrowDownLeft },
        { id: 'material-issue', label: 'Material Issue', icon: ArrowUpRight },
        { id: 'material-return', label: 'Material Return', icon: RotateCcw },
        { id: 'stock-transfer', label: 'Stock Transfer', icon: ArrowRightLeft },
        { id: 'stock-adjustment', label: 'Stock Adjustment', icon: Sliders }
      ]
    },
    {
      title: 'STOCK & PLANNING',
      items: [
        { id: 'current-stock', label: 'Current Stock', icon: Layers },
        { id: 'consumption', label: 'Consumption', icon: TrendingUp },
        {
          id: 'reorder',
          label: 'Reorder Planning',
          icon: AlertCircle,
          badge: criticalAlertCount > 0 ? criticalAlertCount : undefined,
          badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
        },
        { id: 'stock-planning', label: 'Safety Parameters', icon: Settings },
        { id: 'monthly-closing', label: 'Monthly Closing', icon: RefreshCw }
      ]
    },
    {
      title: 'ANALYTICS & REPORTS',
      items: [
        { id: 'inventory-analysis', label: 'ABC & Slow-Moving', icon: BarChart2 },
        { id: 'reports', label: 'Stock Ledger Reports', icon: FileText },
        {
          id: 'alerts',
          label: 'Alerts & Exception',
          icon: Bell,
          badge: criticalAlertCount > 0 ? criticalAlertCount : undefined,
          badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
        },
        { id: 'audit-trail', label: 'Audit Trail', icon: History }
      ]
    },
    {
      title: 'ADMINISTRATION',
      items: [
        { id: 'users', label: 'Users & Roles', icon: Shield },
        { id: 'settings', label: 'System Settings', icon: Settings }
      ]
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-[calc(100vh-57px)] sticky top-[57px] shrink-0 text-slate-300 select-none overflow-y-auto">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-emerald-950">
            Y
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-slate-100 tracking-tight leading-none">
              IMS AUTOMATION
            </h1>
            <p className="text-[11px] font-semibold text-emerald-400 mt-1">
              Yajur Fibres Portal
            </p>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 p-3 space-y-6 overflow-y-auto scrollbar-thin">
        {navGroups.map(group => (
          <div key={group.title} className="space-y-1">
            <h2 className="px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              {group.title}
            </h2>
            <div className="mt-1 space-y-0.5">
              {group.items.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition group ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 transition ${isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[10px] text-slate-400 flex items-center justify-between">
        <div>
          <span className="font-semibold text-slate-300">v2.4.0</span> • Enterprise
        </div>
        <div className="text-emerald-400 font-medium">
          IMS Yajur
        </div>
      </div>
    </aside>
  );
};
