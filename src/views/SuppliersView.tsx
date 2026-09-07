import React, { useState } from 'react';
import { Truck, Plus, Phone, Mail, Clock } from 'lucide-react';
import { AppState } from '../services/store';
import { Supplier } from '../types';

interface SuppliersViewProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({ state, setState }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [person, setPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [leadTime, setLeadTime] = useState(7);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

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
      active: true
    };

    setState(prev => ({
      ...prev,
      suppliers: [...prev.suppliers, newSup]
    }));

    setCode('');
    setName('');
    setPerson('');
    setPhone('');
    setEmail('');
    setShowAdd(false);
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
        <form onSubmit={handleAdd} className="p-4 bg-slate-900 border border-slate-700 rounded-2xl space-y-4">
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
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowAdd(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs">Cancel</button>
            <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white rounded text-xs font-bold">Save Vendor</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {state.suppliers.map(sup => (
          <div key={sup.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-emerald-400 font-bold text-xs">{sup.code}</span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                <Clock className="w-3 h-3" /> {sup.leadTimeDays} Days Lead
              </span>
            </div>

            <div>
              <h3 className="font-bold text-sm text-slate-100">{sup.name}</h3>
              <p className="text-xs text-slate-400">Contact: <strong className="text-slate-200">{sup.contactPerson}</strong></p>
            </div>

            <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2"><Phone className="w-3 h-3 text-slate-500" /><span>{sup.phone}</span></div>
              <div className="flex items-center gap-2"><Mail className="w-3 h-3 text-slate-500" /><span>{sup.email}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
