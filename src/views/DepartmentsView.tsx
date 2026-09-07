import React, { useState } from 'react';
import { Network, Plus } from 'lucide-react';
import { AppState } from '../services/store';
import { Department } from '../types';

interface DepartmentsViewProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const DepartmentsView: React.FC<DepartmentsViewProps> = ({ state, setState }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [head, setHead] = useState('');
  const [costCentre, setCostCentre] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

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

    setCode('');
    setName('');
    setHead('');
    setCostCentre('');
    setShowAdd(false);
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
          onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950"
        >
          <Plus className="w-4 h-4" />
          <span>Add Department</span>
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="p-4 bg-slate-900 border border-slate-700 rounded-2xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Code (e.g. DEP-06)"
              value={code}
              onChange={e => setCode(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
            />
            <input
              type="text"
              required
              placeholder="Department Name *"
              value={name}
              onChange={e => setName(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
            />
            <input
              type="text"
              placeholder="Head of Dept"
              value={head}
              onChange={e => setHead(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
            />
            <input
              type="text"
              placeholder="Cost Centre Code"
              value={costCentre}
              onChange={e => setCostCentre(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowAdd(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs">Cancel</button>
            <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white rounded text-xs font-bold">Save Department</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.departments.map(dept => (
          <div key={dept.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-emerald-400 font-bold text-xs">{dept.code}</span>
              <span className="font-mono text-[10px] text-cyan-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{dept.costCentre}</span>
            </div>
            <h3 className="font-bold text-sm text-slate-100">{dept.name}</h3>
            <p className="text-xs text-slate-400">Head: <strong className="text-slate-200">{dept.departmentHead}</strong></p>
          </div>
        ))}
      </div>
    </div>
  );
};
