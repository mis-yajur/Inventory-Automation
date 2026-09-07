import React, { useState } from 'react';
import {
  Search, Scan, Bell, Building2, Sun, Moon, HelpCircle,
  AlertTriangle, CheckCircle2
} from 'lucide-react';
import { AppState } from '../services/store';

interface HeaderProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  onOpenSearch: () => void;
  onOpenScanner: () => void;
  onOpenApiDocs: () => void;
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  setState,
  onOpenSearch,
  onOpenScanner,
  onOpenApiDocs,
  activeTab,
  setActiveTab
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadAlerts = state.alerts.filter(a => !a.read);

  const handleStoreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setState(prev => ({
      ...prev,
      activeStoreId: e.target.value
    }));
  };

  const handleMarkAllRead = () => {
    setState(prev => ({
      ...prev,
      alerts: prev.alerts.map(a => ({ ...a, read: true }))
    }));
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 text-slate-800 px-4 py-3 flex items-center justify-between gap-4 shadow-sm">
      {/* Left section: Store selector & quick badges */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200 text-sm transition">
          <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Active Store:</span>
          <select
            value={state.activeStoreId}
            onChange={handleStoreChange}
            aria-label="Active Store"
            className="bg-transparent text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
          >
            <option value="All Stores" className="bg-white text-slate-800">All Stores (Consolidated)</option>
            {state.stores.map(store => (
              <option key={store.id} value={store.id} className="bg-white text-slate-800">
                {store.code} - {store.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sync Status Badge */}
        {state.isFirebaseSynced ? (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Firebase Firestore Synced</span>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Connecting to Firestore...</span>
          </div>
        )}
      </div>

      {/* Middle section: Search & Scanner */}
      <div className="flex-1 max-w-xl flex items-center gap-2">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 text-xs transition text-left"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <span>Search items, codes, GRNs, MINs, ledger...</span>
          </div>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-slate-100 text-slate-500 rounded font-mono border border-slate-200">
            ⌘K
          </kbd>
        </button>

        <button
          onClick={onOpenScanner}
          title="Barcode Scanner"
          className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg border border-blue-100 transition flex items-center gap-1 shrink-0 text-xs font-medium"
        >
          <Scan className="w-4 h-4" />
          <span className="hidden lg:inline">Scan</span>
        </button>
      </div>

      {/* Right section: Utilities, Notifications, User */}
      <div className="flex items-center gap-2">
        {/* Developer API Docs Button */}
        <button
          onClick={onOpenApiDocs}
          className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 text-xs bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 transition"
          title="API Documentation"
        >
          <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
          <span>API Docs</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Toggle notifications"
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 transition relative"
          >
            <Bell className="w-4 h-4" />
            {unreadAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-bounce">
                {unreadAlerts.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-800">Notifications & Alerts</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 font-semibold">
                    {unreadAlerts.length} New
                  </span>
                </div>
                {unreadAlerts.length > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-blue-600 hover:underline font-semibold"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {state.alerts.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-xs">No alerts found</div>
                ) : (
                  state.alerts.slice(0, 6).map(alert => (
                    <div
                      key={alert.id}
                      onClick={() => {
                        setActiveTab('alerts');
                        setShowNotifications(false);
                      }}
                      className={`p-3 text-xs hover:bg-slate-50 cursor-pointer transition ${
                        !alert.read ? 'bg-blue-50/20' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {alert.severity === 'CRITICAL' && <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />}
                        {alert.severity === 'WARNING' && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
                        {alert.severity === 'INFO' && <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800">{alert.title}</span>
                            <span className="text-[10px] text-slate-400">{alert.timestamp}</span>
                          </div>
                          <p className="text-slate-500 mt-1 line-clamp-2">{alert.message}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                <button
                  onClick={() => {
                    setActiveTab('alerts');
                    setShowNotifications(false);
                  }}
                  className="text-xs text-blue-600 font-semibold hover:underline"
                >
                  View All Notifications →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
          <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 shadow-sm">
            {state.activeUser.name.charAt(0)}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-slate-800 leading-tight">{state.activeUser.name}</div>
            <div className="text-[10px] text-blue-600 leading-none font-semibold">{state.activeUser.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
};
