import React, { useState } from 'react';
import { Scale, Plus } from 'lucide-react';
import { AppState } from '../services/store';
import { Unit } from '../types';

interface UnitsViewProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const UnitsView: React.FC<UnitsViewProps> = ({ state, setState }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [decimalAllowed, setDecimalAllowed] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) return;

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

    setCode('');
    setName('');
    setShowAdd(false);
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
          onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950"
        >
          <Plus className="w-4 h-4" />
          <span>Add Unit</span>
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="p-4 bg-slate-900 border border-slate-700 rounded-2xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              required
              placeholder="Unit Code (e.g. BOX)"
              value={code}
              onChange={e => setCode(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none"
            />
            <input
              type="text"
              required
              placeholder="Full Name (e.g. Boxes)"
              value={name}
              onChange={e => setName(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none"
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
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowAdd(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs">Cancel</button>
            <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white rounded text-xs font-bold">Save UOM</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {state.units.map(unit => (
          <div key={unit.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center">
            <span className="font-mono text-emerald-400 font-black text-base block">{unit.code}</span>
            <span className="text-xs font-semibold text-slate-200 mt-1 block">{unit.name}</span>
            <span className="text-[10px] text-slate-500 mt-1 block">Decimals: {unit.decimalAllowed ? 'Yes' : 'No'}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
