import React, { useState, useEffect } from 'react';
import {
  Search, Scan, Bell, Building2, HelpCircle,
  AlertTriangle, CheckCircle2, Keyboard, LogOut
} from 'lucide-react';
import { AppState } from '../services/store';
import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';

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
  const [showShortcuts, setShowShortcuts] = useState(false);
  const unreadAlerts = state.alerts.filter(a => !a.read);

  // Feature 5: Listen for Alt+H to trigger Keyboard Shortcuts dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-slate-800 px-4 py-3 flex items-center justify-between gap-4 shadow-sm">
      {/* Left section: Store selector & quick badges */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-slate-950 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-800 text-sm transition">
          <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Active Store:</span>
          <select
            value={state.activeStoreId}
            onChange={handleStoreChange}
            aria-label="Active Store"
            className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
          >
            <option value="All Stores" className="bg-slate-900 text-slate-200">All Stores (Consolidated)</option>
            {state.stores.map(store => (
              <option key={store.id} value={store.id} className="bg-slate-900 text-slate-200">
                {store.code} - {store.name}
              </option>
            ))}
          </select>
        </div>


      </div>

      {/* Middle section: Search & Scanner */}
      <div className="flex-1 max-w-xl flex items-center gap-2">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between bg-slate-950 hover:bg-slate-800 px-3.5 py-1.5 rounded-lg border border-slate-800 text-slate-500 text-xs transition text-left"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <span>Search items, codes, GRNs, MINs, ledger...</span>
          </div>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-slate-800 text-slate-400 rounded font-mono border border-slate-700">
            ⌘K
          </kbd>
        </button>

        <button
          onClick={onOpenScanner}
          title="Barcode Scanner"
          className="p-2 bg-emerald-950 hover:bg-emerald-900 text-emerald-700 rounded-lg border border-emerald-900 transition flex items-center gap-1 shrink-0 text-xs font-medium"
        >
          <Scan className="w-4 h-4" />
          <span className="hidden lg:inline">Scan</span>
        </button>
      </div>

      {/* Right section: Utilities, Notifications, User */}
      <div className="flex items-center gap-2">
        {/* Keyboard Shortcuts Button */}
        <button
          onClick={() => setShowShortcuts(true)}
          className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs bg-slate-950 hover:bg-slate-800 text-slate-400 rounded-lg border border-slate-800 transition"
          title="Keyboard Shortcuts Guide (Alt+H)"
        >
          <Keyboard className="w-3.5 h-3.5 text-cyan-500" />
          <span>Hotkeys</span>
        </button>

        {/* Developer API Docs Button */}
        <button
          onClick={onOpenApiDocs}
          className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 text-xs bg-slate-950 hover:bg-slate-800 text-slate-400 rounded-lg border border-slate-800 transition"
          title="API Documentation"
        >
          <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span>API Docs</span>
        </button>


        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Toggle notifications"
            className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-400 rounded-lg border border-slate-800 transition relative"
          >
            <Bell className="w-4 h-4" />
            {unreadAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-bounce">
                {unreadAlerts.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-100">Notifications & Alerts</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold">
                    {unreadAlerts.length} New
                  </span>
                </div>
                {unreadAlerts.length > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-emerald-600 hover:underline font-semibold"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800">
                {allAlerts.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-xs">No alerts found</div>
                ) : (
                  allAlerts.slice(0, 8).map(alert => (
                    <div
                      key={alert.id}
                      onClick={() => {
                        setActiveTab('alerts');
                        setShowNotifications(false);
                      }}
                      className={`p-3 text-xs hover:bg-slate-850 cursor-pointer transition ${
                        !alert.read ? 'bg-emerald-950/20' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {alert.severity === 'CRITICAL' && <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />}
                        {alert.severity === 'WARNING' && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
                        {alert.severity === 'INFO' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-100">{alert.title}</span>
                            <span className="text-[10px] text-slate-500">{alert.timestamp}</span>
                          </div>
                          <p className="text-slate-400 mt-1 line-clamp-2">{alert.message}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2.5 bg-slate-950 border-t border-slate-800 text-center">
                <button
                  onClick={() => {
                    setActiveTab('alerts');
                    setShowNotifications(false);
                  }}
                  className="text-xs text-emerald-600 font-semibold hover:underline"
                >
                  View All Notifications →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
          <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 shadow-sm">
            {state.activeUser?.name?.charAt(0) || 'S'}
          </div>
          <div className="hidden sm:block text-left mr-2">
            <div className="text-xs font-bold text-slate-100 leading-tight">{state.activeUser?.name || 'Super Admin'}</div>
            <div className="text-[10px] text-emerald-600 leading-none font-semibold">{state.activeUser?.role || 'Super Admin'}</div>
          </div>
          <button
            onClick={() => signOut(auth)}
            className="p-1 hover:bg-slate-800 rounded-md text-slate-400 hover:text-rose-400 transition"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Feature 5: Keyboard Shortcuts Modal Overlay */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95 text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <Keyboard className="w-4 h-4 text-cyan-400" />
                <span>Feature 5: Keyboard Shortcuts Guide</span>
              </h3>
              <button onClick={() => setShowShortcuts(false)} className="text-xs text-slate-400 hover:text-slate-200">Close</button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-400">Boost your warehouse dispatch and posting speed with instant global system shortcuts:</p>
              
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/50">
                  <span className="text-slate-300 font-medium">Toggle Shortcut Guide</span>
                  <kbd className="px-2 py-0.5 bg-slate-800 text-cyan-400 rounded text-[10px] font-mono font-bold border border-slate-700">Alt + H</kbd>
                </div>
                <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/50">
                  <span className="text-slate-300 font-medium">Trigger Global Master Search</span>
                  <kbd className="px-2 py-0.5 bg-slate-800 text-cyan-400 rounded text-[10px] font-mono font-bold border border-slate-700">⌘ + K</kbd>
                </div>
                <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/50">
                  <span className="text-slate-300 font-medium">Open Virtual Barcode Scanner</span>
                  <kbd className="px-2 py-0.5 bg-slate-800 text-cyan-400 rounded text-[10px] font-mono font-bold border border-slate-700">Alt + S</kbd>
                </div>
                <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/50">
                  <span className="text-slate-300 font-medium">Print Current Barcode Label</span>
                  <kbd className="px-2 py-0.5 bg-slate-800 text-cyan-400 rounded text-[10px] font-mono font-bold border border-slate-700">Ctrl + P</kbd>
                </div>
                <div className="flex items-center justify-between text-xs py-1.5">
                  <span className="text-slate-300 font-medium">Close Modal / Escape drawer</span>
                  <kbd className="px-2 py-0.5 bg-slate-800 text-cyan-400 rounded text-[10px] font-mono font-bold border border-slate-700">ESC</kbd>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowShortcuts(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg text-xs font-bold transition mt-2"
            >
              Acknowledge & Continue
            </button>
          </div>
        </div>
      )}
    </header>

  );
};
