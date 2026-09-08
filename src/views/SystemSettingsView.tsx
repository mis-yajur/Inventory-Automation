import React, { useState } from 'react';
import { Settings, UploadCloud, Loader2, Trash2, RotateCcw, Sparkles, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { AppState, initialCategories, initialDepartments, initialUsers, initialUnits, initialStores, initialSuppliers, STORAGE_KEY, isDummyItem, isDummyLedgerEntry } from '../services/store';
import { useCsvParser } from '../hooks/useCsvParser';
import { purgeLegacyDummyDataFromFirebase } from '../services/syncManager';
import { ConfirmationModal } from '../components/ConfirmationModal';

interface SystemSettingsViewProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  onOpenBulkUpload?: () => void;
}

export const SystemSettingsView: React.FC<SystemSettingsViewProps> = ({ state, setState, onOpenBulkUpload }) => {
  const { parseCsv, isParsing, error } = useCsvParser();
  const [isPurging, setIsPurging] = useState(false);
  const [purgeStatus, setPurgeStatus] = useState<string | null>(null);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [importNotification, setImportNotification] = useState<string | null>(null);

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
        setImportNotification(`Successfully imported ${newRecords.length} ${type}!`);
        setTimeout(() => setImportNotification(null), 4000);
      });
    }
  };

  const handlePurgeDummyData = async () => {
    setShowPurgeModal(false);
    setIsPurging(true);
    setPurgeStatus('Purging all dummy data from cloud & local storage...');
    try {
      await purgeLegacyDummyDataFromFirebase();
      
      setState(prev => {
        const cleanState: AppState = {
          ...prev,
          items: prev.items.filter(i => !isDummyItem(i)),
          ledger: prev.ledger.filter(l => !isDummyLedgerEntry(l)),
          alerts: prev.alerts.filter(a => !a.id || !/^alt-[1-5]$/.test(a.id)),
          auditLogs: prev.auditLogs.filter(al => !al.id || !/^aud-[1-4]$/.test(al.id))
        };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanState));
        } catch (e) {
          // ignore
        }
        return cleanState;
      });

      setPurgeStatus('All dummy items and dummy transactions have been permanently deleted! Database is 100% clean.');
    } catch (err: any) {
      setPurgeStatus(`Purge error: ${err.message || 'Unknown error'}`);
    } finally {
      setIsPurging(false);
    }
  };

  const handleFactoryReset = () => {
    setShowResetModal(false);
    const newState: AppState = {
      ...state,
      items: [],
      categories: initialCategories,
      units: initialUnits,
      departments: initialDepartments,
      stores: initialStores,
      suppliers: initialSuppliers,
      ledger: [],
      stockInReceipts: [],
      materialIssues: [],
      materialReturns: [],
      stockTransfers: [],
      stockAdjustments: [],
      monthlyClosings: [],
      alerts: [],
      auditLogs: [
        {
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          userId: state.activeUser.id,
          userName: state.activeUser.name,
          module: 'System Administration',
          action: 'RESET',
          record: 'ALL_DATA',
          previousValue: 'Existing Data',
          newValue: 'CLEAN_SLATE',
          reason: 'System reset to clean production state'
        }
      ],
      users: initialUsers,
      activeStoreId: state.stores[0]?.id || 'str-1',
      isOfflineMode: false,
      isFirebaseSynced: true
    };
    
    setState(newState);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      localStorage.removeItem('ims_automation_yajur_data_v1');
    } catch (e) {
      // ignore
    }
    setPurgeStatus('System has been reset to a completely clean, zero-dummy production state.');
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
        {/* Bulk Uploader Featured Card */}
        {onOpenBulkUpload && (
          <div className="bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <FileSpreadsheet className="w-5 h-5" />
                <span>Standard Inventory Bulk Upload Tool</span>
              </div>
              <p className="text-xs text-slate-300 max-w-xl">
                Upload your company inventory catalog in standard CSV format or copy-paste directly from Microsoft Excel. Automatically validates units, auto-creates missing categories, and posts opening stock entries.
              </p>
            </div>
            <button
              onClick={onOpenBulkUpload}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-950 shrink-0 self-start sm:self-center"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Launch Bulk Uploader</span>
            </button>
          </div>
        )}

        <section className="space-y-4">
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-emerald-400" />
            Individual CSV Master Imports
          </h3>
          <p className="text-xs text-slate-400 mb-4">Upload individual CSV files to batch-insert records into specific master tables.</p>
          
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
            System Clean Slate & Maintenance
          </h3>
          <p className="text-xs text-slate-400">Manage dummy data cleanup and reset system state to a pristine live production condition.</p>
          
          {importNotification && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{importNotification}</span>
            </div>
          )}

          {purgeStatus && (
            <div className="p-3 bg-emerald-950/50 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-semibold">
              {purgeStatus}
            </div>
          )}

          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => setShowPurgeModal(true)}
              disabled={isPurging}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-950/40 border border-amber-800/50 hover:bg-amber-900/40 text-amber-300 rounded-xl text-xs font-bold transition shadow-lg shadow-amber-950/20 disabled:opacity-50 cursor-pointer"
            >
              {isPurging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Purge Legacy Dummy Data from Database</span>
            </button>

            <button 
              onClick={() => setShowResetModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-950/40 border border-rose-900/50 hover:bg-rose-900/40 text-rose-400 rounded-xl text-xs font-bold transition shadow-lg shadow-rose-950/20 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset to Clean Live State (Zero Dummy Items)</span>
            </button>
          </div>
        </section>
      </div>

      <ConfirmationModal
        isOpen={showPurgeModal}
        title="Purge Legacy Dummy Data"
        message="This will permanently delete all legacy sample items (Bearing 6205, Seal 45mm, etc.) and all test opening stock ledger entries from both Cloud Firestore and local storage. Your real uploaded inventory and masters will be safely retained."
        confirmLabel="Purge All Dummy Data"
        variant="warning"
        isLoading={isPurging}
        onConfirm={handlePurgeDummyData}
        onCancel={() => setShowPurgeModal(false)}
      />

      <ConfirmationModal
        isOpen={showResetModal}
        title="Reset to Clean Production State"
        message="This will clear all inventory items, ledger transactions, receipts, and issue records to start with a completely empty, clean slate ready for official company data. Master categories, units, and departments will remain intact."
        confirmLabel="Reset to Clean State"
        variant="danger"
        onConfirm={handleFactoryReset}
        onCancel={() => setShowResetModal(false)}
      />
    </div>
  );
};
