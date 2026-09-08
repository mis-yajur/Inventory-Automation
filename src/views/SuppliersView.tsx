import React, { useState } from 'react';
import { Truck, Plus, Phone, Mail, Clock, ShieldAlert, Award, TrendingUp, Edit2, Trash2 } from 'lucide-react';
import { AppState } from '../services/store';
import { Supplier } from '../types';

interface SuppliersViewProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({ state, setState }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [person, setPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [leadTime, setLeadTime] = useState(7);
  const [rating, setRating] = useState(4.8);

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
      setState(prev => ({
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
      }));
      setEditingId(null);
    } else {
      const newSup: Supplier = {
        id: `sup-${Date.now()}`,
        code: code || `SUP-00${state.suppliers.length + 1}`,
        name,
        contactPerson: person || 'Sales Desk',
        phone: phone || '+91 9800000000',
        email: email || 'sales@supplier.com',
        address: 'Industrial Zone',
        leadTimeDays: leadTime,
        preferred: true,
        active: true,
        rating: rating
      } as any;

      setState(prev => ({
        ...prev,
        suppliers: [...prev.suppliers, newSup]
      }));
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
    setPerson(sup.contactPerson || '');
    setPhone(sup.phone || '');
    setEmail(sup.email || '');
    setLeadTime(sup.leadTimeDays || 7);
    setRating((sup as any).rating || 4.8);
    setShowAdd(true);
  };

  const handleDelete = (sup: Supplier) => {
    const usageCount = state.items.filter(i => i.barcode === sup.code).length; // Just a dummy check, normally would check POs/Vendors
    if (window.confirm(`Are you sure you want to delete vendor "${sup.name}"?`)) {
      setState(prev => ({
        ...prev,
        suppliers: prev.suppliers.filter(s => s.id !== sup.id)
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-slate-100 flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-400" />
            <span>Vendors & Suppliers Master</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Approved suppliers with lead time tracking and contact details</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950"
        >
          <Plus className="w-4 h-4" />
          <span>Add Supplier</span>
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="p-4 bg-slate-900 border border-slate-700 rounded-2xl space-y-4 shadow-xl">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            {editingId ? 'Edit Vendor / Supplier' : 'New Vendor Entry'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Vendor Code (e.g. SUP-004)"
              value={code}
              onChange={e => setCode(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
            />
            <input
              type="text"
              required
              placeholder="Company Name *"
              value={name}
              onChange={e => setName(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
            />
            <input
              type="text"
              placeholder="Contact Person"
              value={person}
              onChange={e => setPerson(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
            />
            <input
              type="text"
              placeholder="Phone Number"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
            />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
            />
             <input
              type="number"
              placeholder="Lead Time (Days)"
              value={leadTime}
              onChange={e => setLeadTime(parseInt(e.target.value))}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
            />
            <input
              type="number"
              step="0.1"
              min="1"
              max="5"
              placeholder="SLA Rating (1.0 - 5.0)"
              value={rating}
              onChange={e => setRating(parseFloat(e.target.value))}
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
                setPhone('');
                setEmail('');
                setLeadTime(7);
                setRating(4.8);
              }} 
              className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white rounded text-xs font-bold">
              {editingId ? 'Update Vendor' : 'Save Vendor'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {state.suppliers.map(sup => {
          const score = (sup as any).rating || (sup.preferred ? 4.9 : 4.4);
          const variance = sup.leadTimeDays > 10 ? '±1.5d var' : '±0.5d var';
          const supplierIncidents = incidents[sup.code] || 0;
          const fillRate = Math.max(45, 99.5 - (supplierIncidents * 6.5));

          return (
            <div key={sup.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 flex flex-col justify-between group relative">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-emerald-400 font-bold text-xs">{sup.code}</span>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1">
                      <div className="flex items-center gap-1 transition-opacity">
                        <button 
                          onClick={() => startEdit(sup)}
                          className="p-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded border border-slate-700"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => handleDelete(sup)}
                          className="p-1 bg-slate-800 hover:bg-slate-700 text-rose-500 rounded border border-slate-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="flex items-center gap-1 text-[11px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                        <Clock className="w-3 h-3" /> {sup.leadTimeDays} Days Lead
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono">{variance}</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-slate-100">{sup.name}</h3>
                  <p className="text-xs text-slate-400">Contact: <strong className="text-slate-200">{sup.contactPerson}</strong></p>
                  
                  {/* Feature 8: Rating Score Indicator */}
                  <div className="flex items-center gap-1 mt-1.5">
                    <span className="text-[10px] text-slate-400 font-medium">SLA Performance:</span>
                    <div className="flex items-center text-amber-400 font-mono font-bold text-[11px]">
                      ★ {score.toFixed(1)}
                    </div>
                    <span className="text-[10px] text-slate-500">/ 5.0</span>
                  </div>

                  {/* Feature 5 (Fulfillment Fill Rate Tracking Indicator) */}
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
                    {/* Visual Progress Bar */}
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

              {/* Log Incident Button */}
              <div className="pt-2 border-t border-slate-800/40">
                <button
                  type="button"
                  onClick={() => handleLogIncident(sup.code)}
                  className="w-full py-1 bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border border-slate-700/60 hover:border-rose-900/60 rounded text-[10px] font-bold transition flex items-center justify-center gap-1.5"
                >
                  <ShieldAlert className="w-3 h-3" />
                  <span>Log SLA Deviation / Defect</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
