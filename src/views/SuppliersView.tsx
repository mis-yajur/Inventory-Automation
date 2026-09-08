import React, { useState, useMemo } from 'react';
import { Truck, Plus, Phone, Mail, Clock, ShieldAlert, Award, UploadCloud, Download, Search, HelpCircle, Edit2, Trash2 } from 'lucide-react';
import { AppState, saveStateToStorage } from '../services/store';
import { Supplier } from '../types';
import { SUPPLIERS_TEMPLATE, downloadCsvTemplate } from '../utils/csvTemplates';
import { BulkGenericMasterModal } from '../components/BulkGenericMasterModal';

interface SuppliersViewProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({ state, setState }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [person, setPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [leadTime, setLeadTime] = useState(7);
  const [rating, setRating] = useState(4.8);
  const [searchTerm, setSearchTerm] = useState('');
  const [showGuide, setShowGuide] = useState(false);

  const [incidents, setIncidents] = useState<Record<string, number>>({
    'SUP-001': 1,
    'SUP-002': 0,
    'SUP-003': 3,
  });

  const handleLogIncident = (supplierCode: string) => {
    setIncidents(prev => ({
      ...prev,
      [supplierCode]: (prev[supplierCode] || 0) + 1
    }));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (editingId) {
      setState(prev => {
        const updated = {
          ...prev,
          suppliers: prev.suppliers.map(s => s.id === editingId ? { 
            ...s, 
            code, 
            name, 
            contactPerson: person, 
            phone, 
            email, 
            leadTimeDays: leadTime,
            rating: rating
          } : s)
        };
        saveStateToStorage(updated);
        return updated;
      });
      setEditingId(null);
    } else {
      const newSup: Supplier = {
        id: `sup-${Date.now()}`,
        code: code || `SUP-00${state.suppliers.length + 1}`,
        name,
        contactPerson: person || 'Sales Desk',
        phone: phone || '+91 9800000000',
        email: email || `orders@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        paymentTerms: '30 Days Net',
        taxNumber: '07AAAAA0000A1Z5',
        leadTimeDays: leadTime,
        rating: rating,
        active: true
      };

      setState(prev => {
        const updated = {
          ...prev,
          suppliers: [...prev.suppliers, newSup]
        };
        saveStateToStorage(updated);
        return updated;
      });
    }

    setCode('');
    setName('');
    setPerson('');
    setPhone('');
    setEmail('');
    setLeadTime(7);
    setRating(4.8);
    setShowAdd(false);
  };

  const startEdit = (sup: Supplier) => {
    setEditingId(sup.id);
    setCode(sup.code);
    setName(sup.name);
    setPerson(sup.contactPerson);
    setPhone(sup.phone);
    setEmail(sup.email);
    setLeadTime(sup.leadTimeDays || 7);
    setRating(sup.rating || 4.8);
    setShowAdd(true);
  };

  const handleDelete = (sup: Supplier) => {
    if (window.confirm(`Are you sure you want to delete supplier "${sup.name}"?`)) {
      setState(prev => {
        const updated = {
          ...prev,
          suppliers: prev.suppliers.filter(s => s.id !== sup.id)
        };
        saveStateToStorage(updated);
        return updated;
      });
    }
  };

  const handleBulkImportSuppliers = (rows: Record<string, string>[]) => {
    const newSups: Supplier[] = [];

    rows.forEach((row, index) => {
      const sCode = row['suppliercode'] || row['code'] || row['Supplier Code'] || `SUP-00${state.suppliers.length + newSups.length + 1}`;
      const sName = row['suppliername'] || row['name'] || row['Supplier Name'] || '';
      const sPerson = row['contactperson'] || row['contact_person'] || row['Contact Person'] || 'Sales Desk';
      const sPhone = row['phone'] || row['Phone'] || '+91 9800000000';
      const sEmail = row['email'] || row['Email'] || '';
      const sLead = parseInt(row['leadtimedays'] || row['lead_time_days'] || row['Lead Time (Days)'] || '7', 10) || 7;
      const sGst = row['gstnumber'] || row['gst_number'] || row['GST Number'] || '07AAAAA0000A1Z5';

      if (sName.trim()) {
        newSups.push({
          id: `sup-bulk-${Date.now()}-${index}`,
          code: sCode.trim(),
          name: sName.trim(),
          contactPerson: sPerson.trim(),
          phone: sPhone.trim(),
          email: sEmail.trim() || `orders@${sName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
          paymentTerms: '30 Days Net',
          taxNumber: sGst.trim(),
          leadTimeDays: sLead,
          rating: 4.8,
          active: true
        });
      }
    });

    if (newSups.length > 0) {
      setState(prev => {
        const updated = {
          ...prev,
          suppliers: [...prev.suppliers, ...newSups]
        };
        saveStateToStorage(updated);
        return updated;
      });
    }
  };

  const filteredSuppliers = useMemo(() => {
    return state.suppliers.filter(s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [state.suppliers, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-black text-slate-100 tracking-tight">Approved Vendors & Suppliers</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {state.suppliers.length} Active Vendors
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">OEM manufacturers, industrial suppliers, lead-time tracking, and SLA auditing</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => downloadCsvTemplate(SUPPLIERS_TEMPLATE)}
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
              setPerson('');
              setPhone('');
              setEmail('');
              setLeadTime(7);
              setRating(4.8);
              setShowAdd(!showAdd);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Guide */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Vendor CSV Upload Guide & Data Types</h3>
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
            <p className="text-slate-400 mb-3">{SUPPLIERS_TEMPLATE.description}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {SUPPLIERS_TEMPLATE.dataTypes.map(dt => (
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

      {showAdd && (
        <form onSubmit={handleAdd} className="p-5 bg-slate-900 border border-slate-700 rounded-2xl space-y-4 shadow-xl animate-in fade-in">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            {editingId ? 'Edit Vendor / Supplier' : 'New Vendor Entry'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Vendor Code (e.g. SUP-004)"
              value={code}
              onChange={e => setCode(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
            />
            <input
              type="text"
              required
              placeholder="Company Name *"
              value={name}
              onChange={e => setName(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
            />
            <input
              type="text"
              placeholder="Contact Person"
              value={person}
              onChange={e => setPerson(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
            />
            <input
              type="text"
              placeholder="Phone Number"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
            />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
            />
            <input
              type="number"
              placeholder="Lead Time (Days)"
              value={leadTime}
              onChange={e => setLeadTime(parseInt(e.target.value, 10) || 7)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
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
              {editingId ? 'Update Vendor' : 'Save Vendor'}
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
            placeholder="Search suppliers by name, code, contact person, or email..."
            className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map(sup => {
          const supplierIncidents = incidents[sup.code] || 0;
          const score = Math.max(1.0, Math.min(5.0, (sup.rating || 5.0) - (supplierIncidents * 0.4)));
          const fillRate = Math.max(40, 98.5 - (supplierIncidents * 8));

          return (
            <div key={sup.id} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 relative flex flex-col justify-between group shadow-sm hover:border-slate-700 transition">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-emerald-400 font-bold text-xs">{sup.code}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {sup.leadTimeDays} Days Lead
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-slate-100">{sup.name}</h3>
                  <p className="text-xs text-slate-400">Contact: <strong className="text-slate-200">{sup.contactPerson}</strong></p>
                  
                  <div className="flex items-center gap-1 mt-1.5">
                    <span className="text-[10px] text-slate-400 font-medium">SLA Performance:</span>
                    <div className="flex items-center text-amber-400 font-mono font-bold text-[11px]">
                      ★ {score.toFixed(1)}
                    </div>
                    <span className="text-[10px] text-slate-500">/ 5.0</span>
                  </div>

                  <div className="mt-2.5 p-2 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400 font-semibold flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Fulfillment OTIF Rate:</span>
                      </span>
                      <span className={`font-mono font-bold ${fillRate >= 90 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {fillRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${fillRate >= 90 ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                        style={{ width: `${fillRate}%` }} 
                      />
                    </div>
                    {supplierIncidents > 0 && (
                      <div className="text-[9px] text-rose-400 flex items-center gap-1 mt-0.5 font-semibold">
                        <ShieldAlert className="w-3 h-3 text-rose-500 shrink-0" />
                        <span>{supplierIncidents} SLA Incidents Logged</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-2"><Phone className="w-3 h-3 text-slate-500" /><span>{sup.phone}</span></div>
                  <div className="flex items-center gap-2"><Mail className="w-3 h-3 text-slate-500" /><span>{sup.email}</span></div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/40 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleLogIncident(sup.code)}
                  className="flex-1 py-1.5 bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border border-slate-700/60 hover:border-rose-900/60 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1"
                >
                  <ShieldAlert className="w-3 h-3" />
                  <span>Log SLA Incident</span>
                </button>
                <button 
                  onClick={() => startEdit(sup)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg border border-slate-700"
                  title="Edit Supplier"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => handleDelete(sup)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-rose-500 rounded-lg border border-slate-700"
                  title="Delete Supplier"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredSuppliers.length === 0 && (
        <div className="p-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <p className="text-sm">No suppliers found matching your query.</p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => downloadCsvTemplate(SUPPLIERS_TEMPLATE)}
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
              <span>Bulk Upload Suppliers</span>
            </button>
          </div>
        </div>
      )}

      {/* Bulk Supplier Modal */}
      <BulkGenericMasterModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Vendors / Suppliers Bulk Upload"
        subtitle="Upload approved vendors with contact details and lead times via CSV or Excel paste"
        template={SUPPLIERS_TEMPLATE}
        entityName="Suppliers"
        onImportData={handleBulkImportSuppliers}
      />
    </div>
  );
};
