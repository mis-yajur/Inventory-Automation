import React from 'react';
import { Settings, UploadCloud, Loader2 } from 'lucide-react';
import { AppState } from '../services/store';
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            <span>System Settings & Bulk Import</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Administrative tools and mass data management</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Administrative Bulk Imports</h3>
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
      </div>
    </div>
  );
};
