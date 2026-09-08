import React, { useState, useMemo } from 'react';
import { Tags, Plus, UploadCloud, Download, Search, HelpCircle, Trash2, Edit2 } from 'lucide-react';
import { AppState, saveStateToStorage } from '../services/store';
import { Category } from '../types';
import { CATEGORIES_TEMPLATE, downloadCsvTemplate } from '../utils/csvTemplates';
import { BulkGenericMasterModal } from '../components/BulkGenericMasterModal';

interface CategoriesViewProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({ state, setState }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showGuide, setShowGuide] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (editingId) {
      setState(prev => {
        const updated = {
          ...prev,
          categories: prev.categories.map(c => c.id === editingId ? { ...c, code, name, description } : c),
          items: prev.items.map(i => i.categoryId === editingId ? { ...i, categoryName: name } : i)
        };
        saveStateToStorage(updated);
        return updated;
      });
      setEditingId(null);
    } else {
      const newCat: Category = {
        id: `cat-${Date.now()}`,
        code: code || `CAT-00${state.categories.length + 1}`,
        name,
        description,
        active: true
      };

      setState(prev => {
        const updated = {
          ...prev,
          categories: [...prev.categories, newCat]
        };
        saveStateToStorage(updated);
        return updated;
      });
    }

    setCode('');
    setName('');
    setDescription('');
    setShowAdd(false);
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setCode(cat.code);
    setName(cat.name);
    setDescription(cat.description || '');
    setShowAdd(true);
  };

  const handleDelete = (cat: Category) => {
    const itemCount = state.items.filter(i => i.categoryId === cat.id).length;
    if (itemCount > 0) {
      alert(`Cannot delete category "${cat.name}" because it contains ${itemCount} items. Move or reassign items first.`);
      return;
    }

    if (window.confirm(`Are you sure you want to delete the category "${cat.name}"?`)) {
      setState(prev => {
        const updated = {
          ...prev,
          categories: prev.categories.filter(c => c.id !== cat.id)
        };
        saveStateToStorage(updated);
        return updated;
      });
    }
  };

  const handleBulkImportCategories = (rows: Record<string, string>[]) => {
    const newCats: Category[] = [];

    rows.forEach((row, index) => {
      const cCode = row['categorycode'] || row['code'] || row['Category Code'] || `CAT-00${state.categories.length + newCats.length + 1}`;
      const cName = row['categoryname'] || row['name'] || row['Category Name'] || '';
      const cDesc = row['description'] || row['Description'] || '';

      if (cName.trim()) {
        newCats.push({
          id: `cat-bulk-${Date.now()}-${index}`,
          code: cCode.trim(),
          name: cName.trim(),
          description: cDesc.trim(),
          active: true
        });
      }
    });

    if (newCats.length > 0) {
      setState(prev => {
        const updated = {
          ...prev,
          categories: [...prev.categories, ...newCats]
        };
        saveStateToStorage(updated);
        return updated;
      });
    }
  };

  const filteredCategories = useMemo(() => {
    return state.categories.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [state.categories, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
            <Tags className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-black text-slate-100 tracking-tight">Item Categories Master</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {state.categories.length} Categories
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Define master inventory classifications (Mechanical, Electrical, Lubricants, etc.)</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => downloadCsvTemplate(CATEGORIES_TEMPLATE)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
            title="Download formatted sample CSV file"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Sample CSV</span>
          </button>

          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-cyan-950"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Bulk Upload (CSV / Excel)</span>
          </button>

          <button
            onClick={() => {
              setEditingId(null);
              setCode('');
              setName('');
              setDescription('');
              setShowAdd(!showAdd);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Guide */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Category CSV Upload Guide & Data Types</h3>
          </div>
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="text-xs text-emerald-400 hover:underline font-semibold"
          >
            {showGuide ? 'Hide Guide' : 'Show Format Guide'}
          </button>
        </div>

        {showGuide && (
          <div className="pt-2 border-t border-slate-800/80 text-xs">
            <p className="text-slate-400 mb-3">{CATEGORIES_TEMPLATE.description}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {CATEGORIES_TEMPLATE.dataTypes.map(dt => (
                <div key={dt.column} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-emerald-400 font-mono font-bold text-[11px]">{dt.column}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${dt.required ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>
                      {dt.required ? 'Required' : 'Optional'}
                    </span>
                  </div>
                  <span className="text-slate-300 font-medium text-[10px] block">{dt.type}</span>
                  <span className="text-slate-500 text-[10px] block mt-1">{dt.notes}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Inline Form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="p-5 bg-slate-900 border border-slate-700 rounded-2xl space-y-4 shadow-xl animate-in fade-in">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            {editingId ? 'Edit Category' : 'New Category Entry'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Code (e.g. CAT-006)"
              value={code}
              onChange={e => setCode(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
            />
            <input
              type="text"
              required
              placeholder="Category Name *"
              value={name}
              onChange={e => setName(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
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
                setDescription('');
              }} 
              className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition">
              {editingId ? 'Update Category' : 'Save Category'}
            </button>
          </div>
        </form>
      )}

      {/* Search Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search categories by name, code, description..."
            className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Category Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map(cat => {
          const itemCount = state.items.filter(i => i.categoryId === cat.id).length;
          return (
            <div key={cat.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between group shadow-sm hover:border-slate-700 transition">
              <div>
                <span className="font-mono text-emerald-400 text-xs font-bold">{cat.code}</span>
                <h3 className="font-bold text-sm text-slate-100">{cat.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{cat.description || 'General category'}</p>
                <div className="flex items-center gap-2 mt-3">
                  <button 
                    onClick={() => startEdit(cat)}
                    className="p-1.5 bg-slate-850 hover:bg-slate-800 text-cyan-400 rounded-lg transition border border-slate-700 shadow-sm"
                    title="Edit Category"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(cat)}
                    className="p-1.5 bg-slate-850 hover:bg-slate-800 text-rose-500 rounded-lg transition border border-slate-700 shadow-sm"
                    title="Delete Category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="text-right">
                <span className="px-2.5 py-1 rounded-xl bg-slate-950 text-slate-200 text-xs font-bold border border-slate-800 block">
                  {itemCount} SKUs
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCategories.length === 0 && (
        <div className="p-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <p className="text-sm">No categories found matching your query.</p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => downloadCsvTemplate(CATEGORIES_TEMPLATE)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Download Sample CSV</span>
            </button>
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Bulk Upload Categories</span>
            </button>
          </div>
        </div>
      )}

      {/* Bulk Category Modal */}
      <BulkGenericMasterModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Categories Bulk Upload"
        subtitle="Upload item categories via CSV or Excel paste"
        template={CATEGORIES_TEMPLATE}
        entityName="Categories"
        onImportData={handleBulkImportCategories}
      />
    </div>
  );
};
