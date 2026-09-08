import React, { useState } from 'react';
import { Warehouse, Plus, MapPin, Edit2, Trash2, CheckCircle2 } from 'lucide-react';
import { AppState } from '../services/store';
import { Store } from '../types';
import { ConfirmationModal } from '../components/ConfirmationModal';

interface StoresViewProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const StoresView: React.FC<StoresViewProps> = ({ state, setState }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [person, setPerson] = useState('');
  const [location, setLocation] = useState('');
  const [storeToDelete, setStoreToDelete] = useState<Store | null>(null);
  const [storeError, setStoreError] = useState<string | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (editingId) {
      setState(prev => ({
        ...prev,
        stores: prev.stores.map(s => s.id === editingId ? { ...s, code, name, responsiblePerson: person, location } : s),
        items: prev.items.map(i => i.defaultStoreId === editingId ? { ...i, defaultStoreName: name } : i)
      }));
      setEditingId(null);
    } else {
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
    }

    setCode('');
    setName('');
    setPerson('');
    setLocation('');
    setShowAdd(false);
  };

  const startEdit = (store: Store) => {
    setEditingId(store.id);
    setCode(store.code);
    setName(store.name);
    setPerson(store.responsiblePerson || '');
    setLocation(store.location || '');
    setShowAdd(true);
  };

  const handleDelete = (store: Store) => {
    const itemCount = state.items.filter(i => i.defaultStoreId === store.id).length;
    if (itemCount > 0) {
      setStoreError(`Cannot delete store "${store.name}" because it contains ${itemCount} items. Transfer stock first.`);
      setTimeout(() => setStoreError(null), 5000);
      return;
    }
    setStoreToDelete(store);
  };

  const confirmDeleteStore = () => {
    if (!storeToDelete) return;
    setState(prev => ({
      ...prev,
      stores: prev.stores.filter(s => s.id !== storeToDelete.id)
    }));
    setStoreToDelete(null);
  };

  return (
    <div className="space-y-6">
      {storeError && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs flex items-center justify-between">
          <span>{storeError}</span>
          <button onClick={() => setStoreError(null)} className="text-rose-400 hover:text-white font-bold ml-2">✕</button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-slate-100 flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-emerald-400" />
            <span>Store</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Physical warehouse store locations (Main Store, Mechanical Store, Electrical Store)</p>
        </div>
        <button
          onClick={() => {
            if (showAdd) {
              setShowAdd(false);
              setEditingId(null);
            } else {
              setEditingId(null);
              setCode('');
              setName('');
              setPerson('');
              setLocation('');
              setShowAdd(true);
            }
          }}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950"
        >
          <Plus className="w-4 h-4" />
          <span>Add Store</span>
        </button>
      </div>

      {/* Add / Edit Form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="p-4 bg-slate-900 border border-slate-700 rounded-2xl space-y-4 shadow-xl">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            {editingId ? 'Edit Store' : 'New Store Entry'}
          </h3>
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
            <button 
              type="button" 
              onClick={() => {
                setShowAdd(false);
                setEditingId(null);
                setCode('');
                setName('');
                setPerson('');
                setLocation('');
              }} 
              className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white rounded text-xs font-bold">
              {editingId ? 'Update Store' : 'Save Store'}
            </button>
          </div>
        </form>
      )}

      {/* Stores List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {state.stores.map(store => {
          const storeStockVal = state.items
            .filter(i => i.defaultStoreId === store.id)
            .reduce((sum, i) => sum + i.stockValue, 0);

          const itemCount = state.items.filter(i => i.defaultStoreId === store.id).length;

          return (
            <div key={store.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 group relative shadow-sm hover:border-slate-700 transition">
              <div className="flex items-center justify-between">
                <span className="font-mono text-emerald-400 font-bold text-xs">{store.code}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-emerald-400">
                    Active
                  </span>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => startEdit(store)}
                      className="p-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded border border-slate-700"
                      title="Edit Store"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => handleDelete(store)}
                      className="p-1 bg-slate-800 hover:bg-slate-700 text-rose-500 rounded border border-slate-700"
                      title="Delete Store"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-sm text-slate-100">{store.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{store.location}</span>
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-400 block">Incharge</span>
                  <span className="font-bold text-slate-200">{store.responsiblePerson}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Inventory ({itemCount} SKUs)</span>
                  <span className="font-bold text-emerald-400 font-mono">₹{storeStockVal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {state.stores.length === 0 && (
        <div className="p-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <p className="text-sm font-semibold text-slate-300">No stores registered yet.</p>
          <p className="text-xs text-slate-400">Click "+ Add Store" above to create your initial store location.</p>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!storeToDelete}
        title="Delete Store Location"
        message={`Are you sure you want to delete warehouse store "${storeToDelete?.name}" (${storeToDelete?.code})?`}
        confirmLabel="Delete Store"
        variant="danger"
        onConfirm={confirmDeleteStore}
        onCancel={() => setStoreToDelete(null)}
      />
    </div>
  );
};
