import React, { useState } from 'react';
import { Network, Plus, UploadCloud, FileText, Loader2, Edit2, Trash2 } from 'lucide-react';
import { useCsvParser } from '../hooks/useCsvParser';
import { AppState } from '../services/store';
import { Department } from '../types';

interface DepartmentsViewProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const DepartmentsView: React.FC<DepartmentsViewProps> = ({ state, setState }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [head, setHead] = useState('');
  const [costCentre, setCostCentre] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const { parseCsv, isParsing, error } = useCsvParser();

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (editingId) {
      setState(prev => ({
        ...prev,
        departments: prev.departments.map(d => d.id === editingId ? { ...d, code, name, departmentHead: head, costCentre } : d)
      }));
      setEditingId(null);
    } else {
      const newDept: Department = {
        id: `dep-${Date.now()}`,
        code: code || `DEP-0${state.departments.length + 1}`,
        name,
        departmentHead: head || 'N/A',
        costCentre: costCentre || `CC-${name.toUpperCase().slice(0, 4)}`,
        active: true
      };

      setState(prev => ({
        ...prev,
        departments: [...prev.departments, newDept]
      }));
    }

    setCode('');
    setName('');
    setHead('');
    setCostCentre('');
    setShowAdd(false);
  };

  const startEdit = (dept: Department) => {
    setEditingId(dept.id);
    setCode(dept.code);
    setName(dept.name);
    setHead(dept.departmentHead || '');
    setCostCentre(dept.costCentre || '');
    setActiveTab('single');
    setShowAdd(true);
  };

  const handleDelete = (dept: Department) => {
    // Check if department is used in any ledger entries or movements
    const usageCount = state.ledger.filter(l => l.departmentId === dept.id).length;
    if (usageCount > 0) {
      alert(`Cannot delete department "${dept.name}" because it has ${usageCount} transaction records.`);
      return;
    }

    if (window.confirm(`Are you sure you want to delete the department "${dept.name}"?`)) {
      setState(prev => ({
        ...prev,
        departments: prev.departments.filter(d => d.id !== dept.id)
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
    const newDepts: Department[] = [];
    lines.forEach((line, index) => {
      if (!line.trim()) return;
      if (index === 0 && line.toLowerCase().includes('name')) return;

      const parts = line.split(/[,\t]/).map(p => p.trim());
      if (parts.length >= 1) {
        const dName = parts[0];
        const dCode = parts[1] || `DEP-0${state.departments.length + newDepts.length + 1}`;
        const dHead = parts[2] || 'N/A';
        const dCost = parts[3] || `CC-${dName.toUpperCase().slice(0, 4)}`;

        if (dName) {
          newDepts.push({
            id: `dep-bulk-${Date.now()}-${index}`,
            code: dCode,
            name: dName,
            departmentHead: dHead,
            costCentre: dCost,
            active: true
          });
        }
      }
    });

    if (newDepts.length > 0) {
      setState(prev => ({
        ...prev,
        departments: [...prev.departments, ...newDepts]
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
            <Network className="w-5 h-5 text-emerald-400" />
            <span>Departments & Cost Centres</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Plant departments issuing and consuming inventory (Mechanical, Electrical, Production, QA)</p>
        </div>
        <button
          onClick={() => {
            setShowAdd(!showAdd);
            setActiveTab('single');
          }}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950"
        >
          <Plus className="w-4 h-4" />
          <span>Add Department</span>
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
              Single Department Entry
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
                  {editingId ? 'Edit Department' : 'New Department Entry'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input
                    type="text"
                    placeholder="Code (e.g. DEP-06)"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Department Name *"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Head of Dept"
                    value={head}
                    onChange={e => setHead(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Cost Centre Code"
                    value={costCentre}
                    onChange={e => setCostCentre(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowAdd(false);
                      setEditingId(null);
                      setCode('');
                      setName('');
                      setHead('');
                      setCostCentre('');
                    }} 
                    className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition">
                    {editingId ? 'Update Department' : 'Save Department'}
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
                      placeholder="Mechanical, DEP-01, M. Ghosh, CC-MECH&#10;Electrical, DEP-02, S. Roy, CC-ELEC&#10;Production, DEP-03, K. Paul, CC-PROD"
                      value={bulkText}
                      onChange={e => setBulkText(e.target.value)}
                      rows={6}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 font-mono focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-500">Format: <strong>Name, Code, DepartmentHead, CostCentre</strong> (One department per line. Code, Head, CostCentre are optional)</p>
                  </div>

                  {/* Drag-and-drop container */}
                  <div className="flex flex-col">
                    <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Drag & Drop CSV/TXT File</span>
{error && <div className="text-rose-500 text-xs mb-2">{error}</div>}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.departments.map(dept => (
          <div key={dept.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 group relative">
            <div className="flex items-center justify-between">
              <span className="font-mono text-emerald-400 font-bold text-xs">{dept.code}</span>
              <span className="font-mono text-[10px] text-cyan-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{dept.costCentre}</span>
            </div>
            <h3 className="font-bold text-sm text-slate-100">{dept.name}</h3>
            <p className="text-xs text-slate-400">Head: <strong className="text-slate-200">{dept.departmentHead}</strong></p>
            
            <div className="absolute bottom-4 right-4 flex gap-1.5 transition-opacity">
              <button 
                onClick={() => startEdit(dept)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg border border-slate-700 shadow-xl"
                title="Edit Dept"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => handleDelete(dept)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-rose-500 rounded-lg border border-slate-700 shadow-xl"
                title="Delete Dept"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
