import React from 'react';
import { Settings, UploadCloud, Loader2, Trash2, RotateCcw } from 'lucide-react';
import { AppState, initialCategories, initialDepartments, initialItems, initialLedger, initialUsers, initialUnits, initialStores, initialSuppliers, initialAlerts, initialAuditLogs, STORAGE_KEY } from '../services/store';
import { useCsvParser } from '../hooks/useCsvParser';

interface SystemSettingsViewProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const SystemSettingsView: React.FC<SystemSettingsViewProps> = ({ state, setState }) => {
  const { parseCsv, isParsing, error } = useCsvParser();

  const handleFileSelect = (type: 'items' | 'units' | 'departments') => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      parseCsv<any>(file, type, (newRecords) => {
        setState(prev => {
          if (type === 'items') return { ...prev, items: [...prev.items, ...newRecords] };
          if (type === 'units') return { ...prev, units: [...prev.units, ...newRecords] };
          if (type === 'departments') return { ...prev, departments: [...prev.departments, ...newRecords] };
          return prev;
        });
        alert(`Successfully imported ${newRecords.length} ${type}!`);
      });
    }
  };

  const handleFactoryReset = () => {
    if (window.confirm('CRITICAL: This will delete ALL data including transactions and masters. This action cannot be undone. Proceed?')) {
      const newState: AppState = {
        ...state,
        items: initialItems,
        categories: initialCategories,
        units: initialUnits,
        departments: initialDepartments,
        stores: initialStores,
        suppliers: initialSuppliers,
        ledger: initialLedger,
        stockInReceipts: [],
        materialIssues: [],
        materialReturns: [],
        stockTransfers: [],
        stockAdjustments: [],
        monthlyClosings: [],
        alerts: initialAlerts,
        auditLogs: initialAuditLogs,
        users: initialUsers,
        activeStoreId: 'str-1',
        isOfflineMode: false,
        isFirebaseSynced: true
      };
      
      setState(newState);
      localStorage.removeItem(STORAGE_KEY);
      alert('System has been reset to factory defaults.');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            <span>System Settings & Admin Console</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Administrative tools, mass data management, and system maintenance</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-6">
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-emerald-400" />
            Administrative Bulk Imports
          </h3>
          <p className="text-xs text-slate-400 mb-4">Upload CSV files to securely batch-insert master records. The system will automatically parse and validate the schema headers.</p>
          
          {error && <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs">{error}</div>}
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="border border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center text-center bg-slate-950/30 relative hover:border-emerald-500 transition-colors cursor-pointer">
              <input type="file" accept=".csv" onChange={handleFileSelect('items')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              {isParsing ? <Loader2 className="w-8 h-8 mb-2 text-emerald-400 animate-spin" /> : <UploadCloud className="w-8 h-8 mb-2 text-slate-400" />}
              <span className="text-sm font-bold text-slate-200">Import Master Items</span>
              <span className="text-[10px] text-slate-500 mt-1">Expected: itemCode, itemName, etc.</span>
            </div>
            
            <div className="border border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center text-center bg-slate-950/30 relative hover:border-emerald-500 transition-colors cursor-pointer">
              <input type="file" accept=".csv" onChange={handleFileSelect('units')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              {isParsing ? <Loader2 className="w-8 h-8 mb-2 text-emerald-400 animate-spin" /> : <UploadCloud className="w-8 h-8 mb-2 text-slate-400" />}
              <span className="text-sm font-bold text-slate-200">Import Units (UOM)</span>
              <span className="text-[10px] text-slate-500 mt-1">Expected: code, name, decimalAllowed</span>
            </div>
            
            <div className="border border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center text-center bg-slate-950/30 relative hover:border-emerald-500 transition-colors cursor-pointer">
              <input type="file" accept=".csv" onChange={handleFileSelect('departments')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              {isParsing ? <Loader2 className="w-8 h-8 mb-2 text-emerald-400 animate-spin" /> : <UploadCloud className="w-8 h-8 mb-2 text-slate-400" />}
              <span className="text-sm font-bold text-slate-200">Import Departments</span>
              <span className="text-[10px] text-slate-500 mt-1">Expected: code, name, costCentre</span>
            </div>
          </div>
        </section>

        <section className="pt-6 border-t border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            System Maintenance & Debugging
          </h3>
          <p className="text-xs text-slate-400">Perform sensitive operations to clean up or reset the application state. Use these tools with extreme caution.</p>
          
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={handleFactoryReset}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-950/40 border border-rose-900/50 hover:bg-rose-900/40 text-rose-400 rounded-xl text-xs font-bold transition shadow-lg shadow-rose-950/20"
            >
              <RotateCcw className="w-4 h-4" />
              Factory Reset System (Delete All Data)
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
