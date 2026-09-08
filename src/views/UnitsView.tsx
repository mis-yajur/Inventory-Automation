import React, { useState } from 'react';
import { Scale, Plus, UploadCloud, FileText, Loader2, Edit2, Trash2 } from 'lucide-react';
import { AppState } from '../services/store';
import { Unit } from '../types';

interface UnitsViewProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const UnitsView: React.FC<UnitsViewProps> = ({ state, setState }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [decimalAllowed, setDecimalAllowed] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const isParsing = false; 

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) return;

    if (editingId) {
      setState(prev => ({
        ...prev,
        units: prev.units.map(u => u.id === editingId ? { ...u, code: code.toUpperCase(), name, decimalAllowed } : u),
        items: prev.items.map(i => i.unitId === editingId ? { ...i, unitName: code.toUpperCase() } : i)
      }));
      setEditingId(null);
    } else {
      const newUnit: Unit = {
        id: `u-${Date.now()}`,
        code: code.toUpperCase(),
        name,
        decimalAllowed,
        active: true
      };

      setState(prev => ({
        ...prev,
        units: [...prev.units, newUnit]
      }));
    }

    setCode('');
    setName('');
    setDecimalAllowed(false);
    setShowAdd(false);
  };

  const startEdit = (unit: Unit) => {
    setEditingId(unit.id);
    setCode(unit.code);
    setName(unit.name);
    setDecimalAllowed(unit.decimalAllowed);
    setActiveTab('single');
    setShowAdd(true);
  };

  const handleDelete = (unit: Unit) => {
    const itemCount = state.items.filter(i => i.unitId === unit.id).length;
    if (itemCount > 0) {
      alert(`Cannot delete unit "${unit.code}" because it is assigned to ${itemCount} items.`);
      return;
    }

    if (window.confirm(`Are you sure you want to delete the unit "${unit.code}"?`)) {
      setState(prev => ({
        ...prev,
        units: prev.units.filter(u => u.id !== unit.id)
      }));
    }
  };

  const handleBulkUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) return;
    parseAndAddBulk(bulkText);
  };

  const parseAndAddBulk = (text: string) => {
    const lines = text.split('\n');
    const newUnits: Unit[] = [];
    lines.forEach((line, index) => {
      if (!line.trim()) return;
      // Skip CSV header if present
      if (index === 0 && line.toLowerCase().includes('code')) return;
      
      const parts = line.split(/[,\t]/).map(p => p.trim());
      if (parts.length >= 2) {
        const uCode = parts[0].toUpperCase();
        const uName = parts[1];
        const uDec = parts[2] ? parts[2].toLowerCase() === 'true' : false;
        
        if (uCode && uName) {
          newUnits.push({
            id: `u-bulk-${Date.now()}-${index}`,
            code: uCode,
            name: uName,
            decimalAllowed: uDec,
            active: true
          });
        }
      }
    });

    if (newUnits.length > 0) {
      setState(prev => ({
        ...prev,
        units: [...prev.units, ...newUnits]
      }));
      setBulkText('');
      setShowAdd(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        parseAndAddBulk(text);
      };
      reader.readAsText(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        parseAndAddBulk(text);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-slate-100 flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-400" />
            <span>Units of Measurement (UOM)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Master measurement units (PCS, KG, LTR, PAIR, MTR, SET)</p>
        </div>
        <button
          onClick={() => {
            setShowAdd(!showAdd);
            setActiveTab('single');
          }}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950"
        >
          <Plus className="w-4 h-4" />
          <span>Add Unit</span>
        </button>
      </div>

      {showAdd && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
          {/* Tab Headers */}
          <div className="flex border-b border-slate-800 bg-slate-950/50">
            <button
              onClick={() => setActiveTab('single')}
              className={`flex-1 py-2.5 text-xs font-bold border-b-2 transition ${activeTab === 'single' ? 'text-emerald-400 border-emerald-500 bg-emerald-950/10' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
            >
              Single Unit Entry
            </button>
            <button
              onClick={() => setActiveTab('bulk')}
              className={`flex-1 py-2.5 text-xs font-bold border-b-2 transition ${activeTab === 'bulk' ? 'text-emerald-400 border-emerald-500 bg-emerald-950/10' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
            >
              Bulk Upload (CSV / Copy-Paste)
            </button>
          </div>

          <div className="p-5">
            {activeTab === 'single' ? (
              <form onSubmit={handleAdd} className="space-y-4">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  {editingId ? 'Edit Unit' : 'New Unit Entry'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Unit Code (e.g. BOX)"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Full Name (e.g. Boxes)"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
                  />
                  <label className="flex items-center gap-2 text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={decimalAllowed}
                      onChange={e => setDecimalAllowed(e.target.checked)}
                      className="w-4 h-4 text-emerald-500 rounded bg-slate-800"
                    />
                    <span>Allow Decimals (e.g. 12.50 KG)</span>
                  </label>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowAdd(false);
                      setEditingId(null);
                      setCode('');
                      setName('');
                      setDecimalAllowed(false);
                    }} 
                    className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition">
                    {editingId ? 'Update UOM' : 'Save UOM'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleBulkUploadSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* CSV / Paste text box */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Paste Raw Data</label>
                    <textarea
                      placeholder="BOX, Boxes, true&#10;ROLL, Rolls, false&#10;BAG, Bags, false"
                      value={bulkText}
                      onChange={e => setBulkText(e.target.value)}
                      rows={6}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 font-mono focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-500">Format: <strong>Code, Name, AllowDecimals(true/false)</strong> (One unit per line. Commas or Tabs are supported)</p>
                  </div>

                  {/* Drag-and-drop container */}
                  <div className="flex flex-col">
                    <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Drag & Drop CSV/TXT File</span>
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`flex-1 border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center transition cursor-pointer relative ${dragActive ? 'border-emerald-500 bg-emerald-950/15' : 'border-slate-700 bg-slate-950/20 hover:border-slate-600'}`}
                    >
                      <input
                        type="file"
                        accept=".csv,.txt"
                        onChange={handleFileSelect}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      {isParsing ? <Loader2 className="w-8 h-8 mb-2 text-emerald-400 animate-spin" /> : <UploadCloud className={`w-8 h-8 mb-2 ${dragActive ? 'text-emerald-400 animate-bounce' : 'text-slate-500'}`} />}
                      <span className="text-xs font-bold text-slate-300">Drag file here or click to browse</span>
                      <span className="text-[10px] text-slate-500 mt-1">Supports standard CSV or plain text files</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button type="button" onClick={() => setShowAdd(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs">Cancel</button>
                  <button
                    type="submit"
                    disabled={!bulkText.trim()}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 disabled:hover:bg-emerald-600"
                  >
                    Process Bulk Upload
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {state.units.map(unit => (
          <div key={unit.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center group relative">
            <span className="font-mono text-emerald-400 font-black text-base block">{unit.code}</span>
            <span className="text-xs font-semibold text-slate-200 mt-1 block">{unit.name}</span>
            <span className="text-[10px] text-slate-500 mt-1 block">Decimals: {unit.decimalAllowed ? 'Yes' : 'No'}</span>
            
            <div className="absolute top-1 right-1 flex flex-col gap-1 transition-opacity">
              <button 
                onClick={() => startEdit(unit)}
                className="p-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded border border-slate-700 shadow-lg"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button 
                onClick={() => handleDelete(unit)}
                className="p-1 bg-slate-800 hover:bg-slate-700 text-rose-500 rounded border border-slate-700 shadow-lg"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
