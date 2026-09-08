import React, { useState, useMemo } from 'react';
import { Scale, Plus, UploadCloud, Download, Search, HelpCircle, Edit2, Trash2 } from 'lucide-react';
import { AppState, saveStateToStorage } from '../services/store';
import { Unit } from '../types';
import { UNITS_TEMPLATE, downloadCsvTemplate } from '../utils/csvTemplates';
import { BulkGenericMasterModal } from '../components/BulkGenericMasterModal';
import { ConfirmationModal } from '../components/ConfirmationModal';

interface UnitsViewProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const UnitsView: React.FC<UnitsViewProps> = ({ state, setState }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [decimalAllowed, setDecimalAllowed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<Unit | null>(null);
  const [unitError, setUnitError] = useState<string | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) return;

    if (editingId) {
      setState(prev => {
        const updated = {
          ...prev,
          units: prev.units.map(u => u.id === editingId ? { ...u, code: code.toUpperCase(), name, decimalAllowed } : u),
          items: prev.items.map(i => i.unitId === editingId ? { ...i, unitName: code.toUpperCase() } : i)
        };
        saveStateToStorage(updated);
        return updated;
      });
      setEditingId(null);
    } else {
      const newUnit: Unit = {
        id: `u-${Date.now()}`,
        code: code.toUpperCase(),
        name,
        decimalAllowed,
        active: true
      };

      setState(prev => {
        const updated = {
          ...prev,
          units: [...prev.units, newUnit]
        };
        saveStateToStorage(updated);
        return updated;
      });
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
    setShowAdd(true);
  };

  const handleDelete = (unit: Unit) => {
    const itemCount = state.items.filter(i => i.unitId === unit.id).length;
    if (itemCount > 0) {
      setUnitError(`Cannot delete unit "${unit.code}" because it is assigned to ${itemCount} items. Move or reassign items first.`);
      setTimeout(() => setUnitError(null), 5000);
      return;
    }
    setUnitToDelete(unit);
  };

  const confirmDeleteUnit = () => {
    if (!unitToDelete) return;
    setState(prev => {
      const updated = {
        ...prev,
        units: prev.units.filter(u => u.id !== unitToDelete.id)
      };
      saveStateToStorage(updated);
      return updated;
    });
    setUnitToDelete(null);
  };

  const handleBulkImportUnits = (rows: Record<string, string>[]) => {
    const newUnits: Unit[] = [];

    rows.forEach((row, index) => {
      const uCode = (row['unitcode'] || row['code'] || row['Unit Code'] || '').toUpperCase();
      const uName = row['unitname'] || row['name'] || row['Unit Name'] || '';
      const uDecStr = (row['allowdecimals'] || row['decimals'] || row['Allow Decimals'] || 'FALSE').toUpperCase();
      const uDec = uDecStr === 'TRUE' || uDecStr === 'YES' || uDecStr === '1';

      if (uCode.trim() && uName.trim()) {
        newUnits.push({
          id: `u-bulk-${Date.now()}-${index}`,
          code: uCode.trim(),
          name: uName.trim(),
          decimalAllowed: uDec,
          active: true
        });
      }
    });

    if (newUnits.length > 0) {
      setState(prev => {
        const updated = {
          ...prev,
          units: [...prev.units, ...newUnits]
        };
        saveStateToStorage(updated);
        return updated;
      });
    }
  };

  const filteredUnits = useMemo(() => {
    return state.units.filter(u =>
      u.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [state.units, searchTerm]);

  return (
    <div className="space-y-6">
      {unitError && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs flex items-center justify-between">
          <span>{unitError}</span>
          <button onClick={() => setUnitError(null)} className="text-rose-400 hover:text-white font-bold ml-2">✕</button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-inner">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-black text-slate-100 tracking-tight">Units of Measurement (UOM)</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                {state.units.length} Units
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Master measurement standards (PCS, KG, LTR, PAIR, MTR, SET, ROLL)</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => downloadCsvTemplate(UNITS_TEMPLATE)}
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
              setDecimalAllowed(false);
              setShowAdd(!showAdd);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950"
          >
            <Plus className="w-4 h-4" />
            <span>Add Unit</span>
          </button>
        </div>
      </div>

      {/* Guide */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">UOM CSV Upload Guide & Data Types</h3>
          </div>
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="text-xs text-cyan-400 hover:underline font-semibold"
          >
            {showGuide ? 'Hide Guide' : 'Show Format Guide'}
          </button>
        </div>

        {showGuide && (
          <div className="pt-2 border-t border-slate-800/80 text-xs">
            <p className="text-slate-400 mb-3">{UNITS_TEMPLATE.description}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {UNITS_TEMPLATE.dataTypes.map(dt => (
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

      {/* Add / Edit Form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="p-5 bg-slate-900 border border-slate-700 rounded-2xl space-y-4 shadow-xl animate-in fade-in">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            {editingId ? 'Edit Unit' : 'New Unit Entry'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              required
              placeholder="Unit Code * (e.g. PCS, KG)"
              value={code}
              onChange={e => setCode(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono uppercase focus:outline-none"
            />
            <input
              type="text"
              required
              placeholder="Full Unit Name * (e.g. Pieces, Kilograms)"
              value={name}
              onChange={e => setName(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
            />
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
              <input
                type="checkbox"
                id="decimalAllowed"
                checked={decimalAllowed}
                onChange={e => setDecimalAllowed(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
              <label htmlFor="decimalAllowed" className="text-xs text-slate-300 cursor-pointer">
                Allow Fractional / Decimals
              </label>
            </div>
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
              {editingId ? 'Update Unit' : 'Save Unit'}
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
            placeholder="Search units by code or name..."
            className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Unit Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUnits.map(unit => {
          const itemCount = state.items.filter(i => i.unitId === unit.id).length;
          return (
            <div key={unit.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between group shadow-sm hover:border-slate-700 transition">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-emerald-400 font-black text-sm">{unit.code}</span>
                  {unit.decimalAllowed ? (
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded font-bold">
                      Decimals (0.00)
                    </span>
                  ) : (
                    <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.2 rounded font-bold">
                      Integers
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-sm text-slate-200 mt-1">{unit.name}</h3>
                <div className="flex items-center gap-2 mt-3">
                  <button 
                    onClick={() => startEdit(unit)}
                    className="p-1.5 bg-slate-850 hover:bg-slate-800 text-cyan-400 rounded-lg transition border border-slate-700 shadow-sm"
                    title="Edit Unit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(unit)}
                    className="p-1.5 bg-slate-850 hover:bg-slate-800 text-rose-500 rounded-lg transition border border-slate-700 shadow-sm"
                    title="Delete Unit"
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

      {filteredUnits.length === 0 && (
        <div className="p-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <p className="text-sm">No measurement units found matching your search.</p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => downloadCsvTemplate(UNITS_TEMPLATE)}
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
              <span>Bulk Upload Units</span>
            </button>
          </div>
        </div>
      )}

      {/* Bulk Unit Modal */}
      <BulkGenericMasterModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Units of Measurement Bulk Upload"
        subtitle="Upload measurement units via CSV or Excel paste"
        template={UNITS_TEMPLATE}
        entityName="Units"
        onImportData={handleBulkImportUnits}
      />

      <ConfirmationModal
        isOpen={!!unitToDelete}
        title="Delete Unit of Measurement"
        message={`Are you sure you want to delete unit "${unitToDelete?.name}" (${unitToDelete?.code})?`}
        confirmLabel="Delete Unit"
        variant="danger"
        onConfirm={confirmDeleteUnit}
        onCancel={() => setUnitToDelete(null)}
      />
    </div>
  );
};
