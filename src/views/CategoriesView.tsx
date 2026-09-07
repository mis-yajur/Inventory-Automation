import React, { useState } from 'react';
import { Tags, Plus, Trash2, Edit2, CheckCircle2 } from 'lucide-react';
import { AppState } from '../services/store';
import { Category } from '../types';

interface CategoriesViewProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({ state, setState }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const newCat: Category = {
      id: `cat-${Date.now()}`,
      code: code || `CAT-00${state.categories.length + 1}`,
      name,
      description,
      active: true
    };

    setState(prev => ({
      ...prev,
      categories: [...prev.categories, newCat]
    }));

    setCode('');
    setName('');
    setDescription('');
    setShowAdd(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-slate-100 flex items-center gap-2">
            <Tags className="w-5 h-5 text-emerald-400" />
            <span>Item Categories Master</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Define master inventory groups (Mechanical, Electrical, Lubricants, etc.)</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="p-4 bg-slate-900 border border-slate-700 rounded-2xl space-y-4 animate-in fade-in">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">New Category</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Code (e.g. CAT-006)"
              value={code}
              onChange={e => setCode(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none"
            />
            <input
              type="text"
              required
              placeholder="Category Name *"
              value={name}
              onChange={e => setName(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowAdd(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs">Cancel</button>
            <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white rounded text-xs font-bold">Save Category</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.categories.map(cat => {
          const itemCount = state.items.filter(i => i.categoryId === cat.id).length;
          return (
            <div key={cat.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div>
                <span className="font-mono text-emerald-400 text-xs font-bold">{cat.code}</span>
                <h3 className="font-bold text-sm text-slate-100">{cat.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{cat.description || 'General category'}</p>
              </div>
              <div className="text-right">
                <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700 block">
                  {itemCount} SKUs
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
