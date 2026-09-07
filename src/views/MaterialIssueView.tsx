import React, { useState } from 'react';
import { ArrowUpRight, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { AppState, saveStateToStorage } from '../services/store';
import { MaterialIssue, MaterialIssueItem, StockLedgerEntry } from '../types';

interface MaterialIssueViewProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const MaterialIssueView: React.FC<MaterialIssueViewProps> = ({ state, setState }) => {
  const [showNew, setShowNew] = useState(false);
  const [storeId, setStoreId] = useState(state.stores[0]?.id || 'str-1');
  const [departmentId, setDepartmentId] = useState(state.departments[0]?.id || 'dep-1');
  const [requestedBy, setRequestedBy] = useState('R. Das');
  const [issuedBy, setIssuedBy] = useState('M. Ghosh');
  const [machineJob, setMachineJob] = useState('Line 2 Breakdown Repair');
  const [remarks, setRemarks] = useState('');

  const [issueItems, setIssueItems] = useState<MaterialIssueItem[]>([
    {
      itemId: state.items[0]?.id || '',
      availableQty: state.items[0]?.availableQty || 0,
      reqQty: 2,
      issueQty: 2,
      unit: state.items[0]?.unitName || 'PCS',
      rate: state.items[0]?.averageRate || 100,
      issueValue: 2 * (state.items[0]?.averageRate || 100)
    }
  ]);

  const [validationError, setValidationError] = useState('');

  const handleAddItem = () => {
    const firstItem = state.items[0];
    if (!firstItem) return;
    setIssueItems([
      ...issueItems,
      {
        itemId: firstItem.id,
        availableQty: firstItem.availableQty,
        reqQty: 1,
        issueQty: 1,
        unit: firstItem.unitName,
        rate: firstItem.averageRate,
        issueValue: firstItem.averageRate
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setIssueItems(issueItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof MaterialIssueItem, val: any) => {
    const updated = [...issueItems];
    const row = { ...updated[index], [field]: val };

    if (field === 'itemId') {
      const selected = state.items.find(i => i.id === val);
      if (selected) {
        row.availableQty = selected.availableQty;
        row.unit = selected.unitName;
        row.rate = selected.averageRate;
      }
    }

    if (field === 'issueQty' || field === 'rate' || field === 'itemId') {
      row.issueValue = (Number(row.issueQty) || 0) * (Number(row.rate) || 0);
    }

    updated[index] = row;
    setIssueItems(updated);
  };

  const handlePostIssue = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (issueItems.length === 0) return;

    // Check negative stock restriction if disabled in settings
    if (!state.settings.enableNegativeStock) {
      for (const line of issueItems) {
        const item = state.items.find(i => i.id === line.itemId);
        if (item && line.issueQty > item.availableQty) {
          setValidationError(`Insufficient stock balance for "${item.itemName}". Available: ${item.availableQty} ${item.unitName}, Requested: ${line.issueQty}`);
          return;
        }
      }
    }

    const issueNo = `MIN-2026-${String(state.materialIssues.length + 342).padStart(3, '0')}`;
    const now = new Date().toISOString().split('T')[0];
    const deptObj = state.departments.find(d => d.id === departmentId);
    const storeObj = state.stores.find(s => s.id === storeId);

    const newIssue: MaterialIssue = {
      id: `iss-${Date.now()}`,
      issueNo,
      issueDate: now,
      storeId,
      departmentId,
      requestedBy,
      issuedBy,
      machineJob,
      status: 'Posted',
      items: issueItems,
      remarks,
      createdBy: state.activeUser.name,
      createdAt: new Date().toISOString()
    };

    const ledgerEntries: StockLedgerEntry[] = [];

    const updatedItems = state.items.map(item => {
      const line = issueItems.find(r => r.itemId === item.id);
      if (!line) return item;

      const outwardQty = Number(line.issueQty) || 0;
      const rate = item.averageRate || line.rate;
      const newQty = item.currentQty - outwardQty;
      const newStockVal = newQty * rate;

      ledgerEntries.push({
        id: `led-iss-${item.id}-${Date.now()}`,
        transactionDate: now,
        transactionType: 'ISSUE',
        referenceNumber: issueNo,
        itemId: item.id,
        itemCode: item.itemCode,
        itemName: item.itemName,
        storeId,
        storeName: storeObj?.name || 'Main Store',
        departmentId,
        departmentName: deptObj?.name,
        inwardQty: 0,
        outwardQty: outwardQty,
        runningQty: newQty,
        rate: rate,
        inwardValue: 0,
        outwardValue: outwardQty * rate,
        runningStockValue: newStockVal,
        userId: state.activeUser.id,
        userName: state.activeUser.name,
        timestamp: new Date().toISOString()
      });

      return {
        ...item,
        currentQty: newQty,
        availableQty: newQty - item.reservedQty,
        stockValue: newStockVal,
        lastIssueDate: now,
        updatedAt: now
      };
    });

    setState(prev => {
      const newState = {
        ...prev,
        items: updatedItems,
        materialIssues: [newIssue, ...prev.materialIssues],
        ledger: [...ledgerEntries, ...prev.ledger],
        auditLogs: [
          {
            id: `aud-${Date.now()}`,
            timestamp: new Date().toISOString(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            userId: prev.activeUser.id,
            userName: prev.activeUser.name,
            module: 'Material Issue (MIN)',
            action: 'POST' as const,
            record: issueNo,
            previousValue: 'Draft',
            newValue: `Posted ${issueItems.length} items`,
            reason: `Issued material to ${deptObj?.name || 'Department'} for ${machineJob}`
          },
          ...prev.auditLogs
        ]
      };
      saveStateToStorage(newState);
      return newState;
    });

    setShowNew(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-slate-100 flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-cyan-400" />
            <span>Material Issue Note (MIN)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Issue store items to plant maintenance, production lines, and cost centres</p>
        </div>

        <button
          onClick={() => setShowNew(!showNew)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950"
        >
          <Plus className="w-4 h-4" />
          <span>New Material Issue</span>
        </button>
      </div>

      {/* New Issue Form */}
      {showNew && (
        <form onSubmit={handlePostIssue} className="p-5 bg-slate-900 border border-slate-700 rounded-2xl space-y-5 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              Material Issue Note (MIN) Creation Form
            </h3>
            <span className="text-xs text-slate-400 font-mono">Date: {new Date().toISOString().split('T')[0]}</span>
          </div>

          {validationError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">Issuing Warehouse Store *</label>
              <select
                value={storeId}
                onChange={e => setStoreId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
              >
                {state.stores.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">Target Department / Cost Centre *</label>
              <select
                value={departmentId}
                onChange={e => setDepartmentId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
              >
                {state.departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.costCentre})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">Requested By</label>
              <input
                type="text"
                value={requestedBy}
                onChange={e => setRequestedBy(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">Machine / Job Reference</label>
              <input
                type="text"
                value={machineJob}
                onChange={e => setMachineJob(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
              />
            </div>
          </div>

          {/* Lines Table */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-200">Material Issue Line Items</h4>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded text-xs font-semibold flex items-center gap-1 border border-slate-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3">Item Name</th>
                    <th className="p-3 text-right">Available Qty</th>
                    <th className="p-3 text-right">Issue Qty</th>
                    <th className="p-3">UOM</th>
                    <th className="p-3 text-right">Rate</th>
                    <th className="p-3 text-right">Issue Value</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {issueItems.map((line, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/50">
                      <td className="p-2.5">
                        <select
                          value={line.itemId}
                          onChange={e => handleItemChange(idx, 'itemId', e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-100"
                        >
                          {state.items.map(i => (
                            <option key={i.id} value={i.id}>
                              {i.itemCode} - {i.itemName} (Avail: {i.availableQty} {i.unitName})
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="p-2.5 text-right font-mono font-bold text-slate-300">
                        {line.availableQty}
                      </td>

                      <td className="p-2.5 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={line.issueQty}
                          onChange={e => handleItemChange(idx, 'issueQty', parseFloat(e.target.value))}
                          className="w-24 bg-slate-800 border border-cyan-500/40 rounded px-2 py-1 text-right text-xs font-mono font-bold text-slate-100 focus:outline-none"
                        />
                      </td>

                      <td className="p-2.5 font-mono text-slate-400">{line.unit}</td>
                      <td className="p-2.5 text-right font-mono text-slate-400">₹{line.rate}</td>

                      <td className="p-2.5 text-right font-mono font-bold text-cyan-400">
                        ₹{(line.issueValue || 0).toLocaleString('en-IN')}
                      </td>

                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 hover:bg-slate-800 text-rose-400 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <div className="text-xs text-slate-400">
              Total Issue Value: <strong className="text-cyan-400 font-mono text-sm ml-1">
                ₹{issueItems.reduce((s, i) => s + (i.issueValue || 0), 0).toLocaleString('en-IN')}
              </strong>
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => setShowNew(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-lg shadow-emerald-950">
                Post Issue & Update Stock
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Historical Issues Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Posted Material Issue Notes</h3>
          <span className="text-xs text-slate-400">{state.materialIssues.length} MINs Logged</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="p-3">Issue No</th>
                <th className="p-3">Date</th>
                <th className="p-3">Department</th>
                <th className="p-3">Requested By</th>
                <th className="p-3">Machine / Purpose</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {state.materialIssues.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 text-xs">
                    No material issues recorded yet. Click "New Material Issue" to issue store items.
                  </td>
                </tr>
              ) : (
                state.materialIssues.map(iss => (
                  <tr key={iss.id} className="hover:bg-slate-800/50">
                    <td className="p-3 font-mono font-bold text-cyan-400">{iss.issueNo}</td>
                    <td className="p-3 font-mono text-slate-400">{iss.issueDate}</td>
                    <td className="p-3 text-slate-200">{iss.departmentId}</td>
                    <td className="p-3 text-slate-300">{iss.requestedBy}</td>
                    <td className="p-3 text-slate-400">{iss.machineJob || 'General Consumption'}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-[10px] border border-cyan-500/30">
                        {iss.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
