import React, { useState, useMemo } from 'react';
import { Network, Plus, UploadCloud, Download, Search, HelpCircle, Edit2, Trash2 } from 'lucide-react';
import { AppState, saveStateToStorage } from '../services/store';
import { Department } from '../types';
import { DEPARTMENTS_TEMPLATE, downloadCsvTemplate } from '../utils/csvTemplates';
import { BulkGenericMasterModal } from '../components/BulkGenericMasterModal';
import { ConfirmationModal } from '../components/ConfirmationModal';

interface DepartmentsViewProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const DepartmentsView: React.FC<DepartmentsViewProps> = ({ state, setState }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [head, setHead] = useState('');
  const [costCentre, setCostCentre] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState<Department | null>(null);
  const [deptError, setDeptError] = useState<string | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (editingId) {
      setState(prev => {
        const updated = {
          ...prev,
          departments: prev.departments.map(d => d.id === editingId ? { ...d, code, name, departmentHead: head, costCentre } : d)
        };
        saveStateToStorage(updated);
        return updated;
      });
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

      setState(prev => {
        const updated = {
          ...prev,
          departments: [...prev.departments, newDept]
        };
        saveStateToStorage(updated);
        return updated;
      });
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
    setShowAdd(true);
  };

  const handleDelete = (dept: Department) => {
    const usageCount = state.ledger.filter(l => l.departmentId === dept.id).length;
    if (usageCount > 0) {
      setDeptError(`Cannot delete department "${dept.name}" because it has ${usageCount} transaction records.`);
      setTimeout(() => setDeptError(null), 5000);
      return;
    }
    setDeptToDelete(dept);
  };

  const confirmDeleteDepartment = () => {
    if (!deptToDelete) return;
    setState(prev => {
      const updated = {
        ...prev,
        departments: prev.departments.filter(d => d.id !== deptToDelete.id)
      };
      saveStateToStorage(updated);
      return updated;
    });
    setDeptToDelete(null);
  };

  const handleBulkImportDepartments = (rows: Record<string, string>[]) => {
    const newDepts: Department[] = [];

    rows.forEach((row, index) => {
      const dCode = row['departmentcode'] || row['code'] || row['Department Code'] || `DEP-0${state.departments.length + newDepts.length + 1}`;
      const dName = row['departmentname'] || row['name'] || row['Department Name'] || '';
      const dHead = row['departmenthead'] || row['head'] || row['Department Head'] || 'N/A';
      const dCost = row['costcentre'] || row['cost_centre'] || row['Cost Centre'] || `CC-${dName.toUpperCase().slice(0, 4)}`;

      if (dName.trim()) {
        newDepts.push({
          id: `dep-bulk-${Date.now()}-${index}`,
          code: dCode.trim(),
          name: dName.trim(),
          departmentHead: dHead.trim(),
          costCentre: dCost.trim(),
          active: true
        });
      }
    });

    if (newDepts.length > 0) {
      setState(prev => {
        const updated = {
          ...prev,
          departments: [...prev.departments, ...newDepts],
          auditLogs: [
            {
              id: `aud-${Date.now()}`,
              timestamp: new Date().toISOString(),
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              userId: prev.activeUser.id,
              userName: prev.activeUser.name,
              module: 'Department Master',
              action: 'BULK_CREATE',
              record: `BULK_${newDepts.length}_DEPTS`,
              previousValue: `${prev.departments.length} depts`,
              newValue: `${prev.departments.length + newDepts.length} depts`,
              reason: 'Bulk CSV / Excel import of departments'
            },
            ...prev.auditLogs
          ]
        };
        saveStateToStorage(updated);
        return updated;
      });
    }
  };

  const filteredDepts = useMemo(() => {
    return state.departments.filter(d => 
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.costCentre && d.costCentre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.departmentHead && d.departmentHead.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [state.departments, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Error notification */}
      {deptError && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs flex items-center justify-between">
          <span>{deptError}</span>
          <button onClick={() => setDeptError(null)} className="text-rose-400 hover:text-white font-bold ml-2">✕</button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-inner">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-black text-slate-100 tracking-tight">Departments & Cost Centres</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                {state.departments.length} Units
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Plant departments issuing and consuming inventory (Mechanical, Electrical, Production, QA)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => downloadCsvTemplate(DEPARTMENTS_TEMPLATE)}
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
              setHead('');
              setCostCentre('');
              setShowAdd(!showAdd);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950"
          >
            <Plus className="w-4 h-4" />
            <span>Add Department</span>
          </button>
        </div>
      </div>

      {/* Format & Data Types Reference Guide */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Department Upload Data Types Guide</h3>
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
            <p className="text-slate-400 mb-3">{DEPARTMENTS_TEMPLATE.description}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {DEPARTMENTS_TEMPLATE.dataTypes.map(dt => (
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
        <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-xl p-5">
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
                placeholder="Department Head / Incharge"
                value={head}
                onChange={e => setHead(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Cost Centre (e.g. CC-MECH)"
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
        </div>
      )}

      {/* Search Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search departments by name, code, incharge, or cost centre..."
            className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDepts.map(dept => (
          <div key={dept.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 group relative shadow-sm hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <span className="font-mono text-emerald-400 font-bold text-xs">{dept.code}</span>
              <span className="font-mono text-[10px] text-cyan-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">{dept.costCentre}</span>
            </div>
            <h3 className="font-bold text-sm text-slate-100">{dept.name}</h3>
            <p className="text-xs text-slate-400">Head: <strong className="text-slate-200">{dept.departmentHead || 'N/A'}</strong></p>
            
            <div className="pt-2 flex justify-end gap-1.5">
              <button 
                onClick={() => startEdit(dept)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg border border-slate-700 shadow-sm transition"
                title="Edit Department"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => handleDelete(dept)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-rose-500 rounded-lg border border-slate-700 shadow-sm transition"
                title="Delete Department"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredDepts.length === 0 && (
        <div className="p-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <p className="text-sm">No departments match the current filter.</p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => downloadCsvTemplate(DEPARTMENTS_TEMPLATE)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Download Sample CSV</span>
            </button>
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Bulk Upload Departments</span>
            </button>
          </div>
        </div>
      )}

      {/* Bulk Department Upload Modal */}
      <BulkGenericMasterModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Departments Bulk Upload"
        subtitle="Upload factory departments and cost centres via CSV or Excel paste"
        template={DEPARTMENTS_TEMPLATE}
        entityName="Departments"
        onImportData={handleBulkImportDepartments}
      />

      <ConfirmationModal
        isOpen={!!deptToDelete}
        title="Delete Department"
        message={`Are you sure you want to delete department "${deptToDelete?.name}" (${deptToDelete?.code})?`}
        confirmLabel="Delete Department"
        variant="danger"
        onConfirm={confirmDeleteDepartment}
        onCancel={() => setDeptToDelete(null)}
      />
    </div>
  );
};
