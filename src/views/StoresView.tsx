import React, { useState } from 'react';
import { Warehouse, Plus, MapPin, User, Grid, ClipboardCheck, Sparkles, AlertCircle, Edit2, Trash2 } from 'lucide-react';
import { AppState } from '../services/store';
import { Store } from '../types';

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

  // States for Feature 2 & 3
  const [selectedBin, setSelectedBin] = useState<string | null>(null);
  const [scheduleName, setScheduleName] = useState('');
  const [scheduleRack, setScheduleRack] = useState('Rack A');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduledAudits, setScheduledAudits] = useState<Array<{id: string, name: string, rack: string, date: string, status: string}>>([
    { id: '1', name: 'Raw Material High-Value Check', rack: 'Rack A', date: '2026-09-10', status: 'Scheduled' },
    { id: '2', name: 'Fast Moving Spare Parts Audit', rack: 'Rack B', date: '2026-09-15', status: 'Scheduled' }
  ]);

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
      alert(`Cannot delete store "${store.name}" because it contains ${itemCount} items. Transfer stock first.`);
      return;
    }

    if (window.confirm(`Are you sure you want to delete store "${store.name}"?`)) {
      setState(prev => ({
        ...prev,
        stores: prev.stores.filter(s => s.id !== store.id)
      }));
    }
  };

  const handleScheduleAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleName || !scheduleDate) return;
    setScheduledAudits(prev => [
      ...prev,
      {
        id: `aud-${Date.now()}`,
        name: scheduleName,
        rack: scheduleRack,
        date: scheduleDate,
        status: 'Scheduled'
      }
    ]);
    setScheduleName('');
    setScheduleDate('');
  };

  // 2D Warehouse Racks & Shelves Layout Data
  const racks = ['Rack A', 'Rack B', 'Rack C', 'Rack D'];
  const shelves = ['Level 4', 'Level 3', 'Level 2', 'Level 1'];

  // Match items to physical locations
  const findItemsInBin = (rack: string, level: string) => {
    // level: "Level 3" -> "3", rack: "Rack A" -> "A"
    const levelNum = level.replace('Level ', '');
    const rackLetter = rack.replace('Rack ', '');
    return state.items.filter(item => {
      const itemRack = (item.rack || '').toUpperCase();
      const itemBin = (item.bin || '').toUpperCase();
      return itemRack.includes(rackLetter) && itemBin.includes(levelNum);
    });
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
        <form onSubmit={handleAdd} className="p-4 bg-slate-900 border border-slate-700 rounded-2xl space-y-4 shadow-xl">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            {editingId ? 'Edit Warehouse Store' : 'New Warehouse Store Entry'}
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {state.stores.map(store => {
          const storeStockVal = state.items
            .filter(i => i.defaultStoreId === store.id)
            .reduce((sum, i) => sum + i.stockValue, 0);

          return (
            <div key={store.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 group relative">
              <div className="flex items-center justify-between">
                <span className="font-mono text-emerald-400 font-bold text-xs">{store.code}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-emerald-400">
                    Active
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs flex flex-col gap-2">
                <div className="flex justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Responsible Person</span>
                    <span className="font-bold text-slate-200">{store.responsiblePerson}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Valuation</span>
                    <span className="font-bold text-emerald-400 font-mono">₹{storeStockVal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                
                {/* Feature 2: Volumetric Capacity Monitor */}
                <div className="pt-2 border-t border-slate-800/80 space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                    <span>Volumetric Occupancy:</span>
                    <span className="font-bold text-slate-300">
                      {Math.round(storeStockVal > 0 ? (storeStockVal / 12500) + 12.4 : 0)} m³ / 500 m³
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        (storeStockVal / 12500) > 400 ? 'bg-rose-500' : (storeStockVal / 12500) > 250 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, Math.round((storeStockVal / (12500 * 500)) * 100)))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature 2: 2D Warehouse Bin-Mapping Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        <div className="lg:col-span-2 p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Grid className="w-4 h-4 text-emerald-400" />
                <span>Feature 2: Interactive 2D Warehouse Bin-Mapping Grid</span>
              </h2>
              <p className="text-[11px] text-slate-400">Real-time physical layout map of racks and shelves. Click a bin location to view associated stock items.</p>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-900 text-emerald-400 text-[10px] font-bold">2D Spatial Mapper</span>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[600px] grid grid-cols-5 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-center font-bold text-slate-500 text-[10px] uppercase">Shelves</div>
              {racks.map(r => (
                <div key={r} className="text-center font-bold text-slate-300 text-xs py-1 border-b border-slate-800 bg-slate-900/40 rounded-t">{r}</div>
              ))}

              {shelves.map(level => (
                <React.Fragment key={level}>
                  <div className="flex items-center justify-end pr-2 font-bold text-slate-400 text-xs">{level}</div>
                  {racks.map(rack => {
                    const matchedItems = findItemsInBin(rack, level);
                    const binCode = `${rack.replace('Rack ', '')}-${level.replace('Level ', '0')}`;
                    const hasStock = matchedItems.length > 0;
                    const isSelected = selectedBin === binCode;

                    return (
                      <button
                        key={`${rack}-${level}`}
                        onClick={() => setSelectedBin(isSelected ? null : binCode)}
                        className={`p-3 rounded-lg border text-left transition flex flex-col justify-between h-20 ${
                          isSelected ? 'bg-emerald-950 border-emerald-500 ring-2 ring-emerald-500' :
                          hasStock ? 'bg-slate-900/90 border-emerald-900/60 hover:border-emerald-600/40' :
                          'bg-slate-950 border-slate-850 hover:border-slate-800 opacity-60'
                        }`}
                      >
                        <span className="text-[9px] font-mono font-bold text-slate-500">{binCode}</span>
                        {hasStock ? (
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-extrabold text-emerald-400 block truncate leading-tight">
                              {matchedItems[0].itemName}
                            </span>
                            <span className="text-[9px] text-slate-400 block leading-none font-mono">
                              Qty: {matchedItems.reduce((sum, i) => sum + i.availableQty, 0)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-600 italic">Empty Bin</span>
                        )}
                      </button>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>

          {selectedBin && (
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 animate-in slide-in-from-top-1 duration-200">
              <h4 className="text-xs font-bold text-slate-200 mb-2">Items Stored in Bin <span className="text-emerald-400">{selectedBin}</span>:</h4>
              <div className="space-y-2">
                {state.items.filter(item => {
                  const rackLetter = selectedBin.split('-')[0];
                  const levelNum = selectedBin.split('-')[1].replace('0', '');
                  return (item.rack || '').toUpperCase().includes(rackLetter) && (item.bin || '').toUpperCase().includes(levelNum);
                }).length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No specific items registered in this exact bin matrix cell. Default item listing will route here.</p>
                ) : (
                  state.items.filter(item => {
                    const rackLetter = selectedBin.split('-')[0];
                    const levelNum = selectedBin.split('-')[1].replace('0', '');
                    return (item.rack || '').toUpperCase().includes(rackLetter) && (item.bin || '').toUpperCase().includes(levelNum);
                  }).map(item => (
                    <div key={item.id} className="flex items-center justify-between text-xs bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                      <div>
                        <span className="font-mono text-emerald-400 font-bold mr-2">{item.itemCode}</span>
                        <span className="text-slate-200 font-semibold">{item.itemName}</span>
                      </div>
                      <div className="font-mono font-bold text-slate-300">
                        {item.availableQty} {item.unitName}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Feature 3: Cycle Counting Rotation Audit Scheduler */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-100">Feature 3: Cycle Counting Scheduler</h3>
              <p className="text-[11px] text-slate-400">Automate rotating shelf checks instead of full inventory lockouts.</p>
            </div>
          </div>

          <form onSubmit={handleScheduleAudit} className="space-y-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Audit Plan Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Q3 Cable Audit"
                value={scheduleName}
                onChange={e => setScheduleName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Location</label>
                <select
                  value={scheduleRack}
                  onChange={e => setScheduleRack(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-100 focus:outline-none"
                >
                  <option value="Rack A">Rack A</option>
                  <option value="Rack B">Rack B</option>
                  <option value="Rack C">Rack C</option>
                  <option value="Rack D">Rack D</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Audit Date</label>
                <input
                  type="date"
                  required
                  value={scheduleDate}
                  onChange={e => setScheduleDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            <button type="submit" className="w-full py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition">
              Schedule Cycle Count
            </button>
          </form>

          <div className="space-y-2">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Rotations</span>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {scheduledAudits.map(audit => (
                <div key={audit.id} className="p-2.5 bg-slate-950 rounded-lg border border-slate-805 text-xs flex justify-between items-center">
                  <div>
                    <div className="font-bold text-slate-200">{audit.name}</div>
                    <div className="text-[10px] text-slate-400">{audit.rack} • Target Date: {audit.date}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold">
                    {audit.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

