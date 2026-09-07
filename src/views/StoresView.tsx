import React, { useState } from 'react';
import { Warehouse, Plus, MapPin, User } from 'lucide-react';
import { AppState } from '../services/store';
import { Store } from '../types';

interface StoresViewProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const StoresView: React.FC<StoresViewProps> = ({ state, setState }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [person, setPerson] = useState('');
  const [location, setLocation] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const newStore: Store = {
      id: `str-${Date.now()}`,
      code: code || `STR-0${state.stores.length + 1}`,
      name,
      responsiblePerson: person || 'Storekeeper',
      location: location || 'Central Warehouse',
      active: true
    };

    setState(prev => ({
      ...prev,
      stores: [...prev.stores, newStore]
    }));

    setCode('');
    setName('');
    setPerson('');
    setLocation('');
    setShowAdd(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-slate-100 flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-emerald-400" />
            <span>Stores & Bins Locations</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Physical warehouse store locations (Main Store, Mechanical Store, Electrical Store)</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950"
        >
          <Plus className="w-4 h-4" />
          <span>Add Warehouse Store</span>
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="p-4 bg-slate-900 border border-slate-700 rounded-2xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Code (e.g. STR-04)"
              value={code}
              onChange={e => setCode(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
            />
            <input
              type="text"
              required
              placeholder="Store Name *"
              value={name}
              onChange={e => setName(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
            />
            <input
              type="text"
              placeholder="Store Manager / Incharge"
              value={person}
              onChange={e => setPerson(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
            />
            <input
              type="text"
              placeholder="Location Block / Building"
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowAdd(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs">Cancel</button>
            <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white rounded text-xs font-bold">Save Store</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {state.stores.map(store => {
          const storeStockVal = state.items
            .filter(i => i.defaultStoreId === store.id)
            .reduce((sum, i) => sum + i.stockValue, 0);

          return (
            <div key={store.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-emerald-400 font-bold text-xs">{store.code}</span>
                <span className="text-[10px] text-slate-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-emerald-400">
                  Active Location
                </span>
              </div>

              <div>
                <h3 className="font-bold text-sm text-slate-100">{store.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{store.location}</span>
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs flex justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Responsible Person</span>
                  <span className="font-bold text-slate-200">{store.responsiblePerson}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Valuation</span>
                  <span className="font-bold text-emerald-400 font-mono">₹{storeStockVal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
