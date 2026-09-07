import React, { useState } from 'react';
import { ArrowDownLeft, Plus, Trash2, CheckCircle2, FileText, Printer } from 'lucide-react';
import { AppState, saveStateToStorage } from '../services/store';
import { StockInReceipt, StockInItem, StockLedgerEntry } from '../types';
import { calculateWeightedAverageRate, formatCurrency } from '../utils/calculations';

interface StockInViewProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const StockInView: React.FC<StockInViewProps> = ({ state, setState }) => {
  const [showNew, setShowNew] = useState(false);
  const [storeId, setStoreId] = useState(state.stores[0]?.id || 'str-1');
  const [supplierId, setSupplierId] = useState(state.suppliers[0]?.id || 'sup-1');
  const [poReference, setPoReference] = useState(`PO/2026-27/0${Math.floor(100 + Math.random() * 900)}`);
  const [challanNo, setChallanNo] = useState(`CH-${Math.floor(1000 + Math.random() * 9000)}`);
  const [invoiceNo, setInvoiceNo] = useState(`INV-${Math.floor(10000 + Math.random() * 90000)}`);
  const [remarks, setRemarks] = useState('');

  const [receiptItems, setReceiptItems] = useState<StockInItem[]>([
    {
      itemId: state.items[0]?.id || '',
      qty: 10,
      unit: state.items[0]?.unitName || 'PCS',
      rate: state.items[0]?.averageRate || 100,
      value: (10 * (state.items[0]?.averageRate || 100))
    }
  ]);

  const [selectedReceiptForPrint, setSelectedReceiptForPrint] = useState<StockInReceipt | null>(null);

  const handleAddItem = () => {
    const firstItem = state.items[0];
    if (!firstItem) return;
    setReceiptItems([
      ...receiptItems,
      {
        itemId: firstItem.id,
        qty: 10,
        unit: firstItem.unitName,
        rate: firstItem.averageRate,
        value: 10 * firstItem.averageRate
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setReceiptItems(receiptItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof StockInItem, val: any) => {
    const updated = [...receiptItems];
    const row = { ...updated[index], [field]: val };

    if (field === 'itemId') {
      const selected = state.items.find(i => i.id === val);
      if (selected) {
        row.unit = selected.unitName;
        row.rate = selected.averageRate;
      }
    }

    if (field === 'qty' || field === 'rate' || field === 'itemId') {
      row.value = (Number(row.qty) || 0) * (Number(row.rate) || 0);
    }

    updated[index] = row;
    setReceiptItems(updated);
  };

  const handlePostReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (receiptItems.length === 0) return;

    const receiptNo = `GRN-2026-${String(state.stockInReceipts.length + 125).padStart(3, '0')}`;
    const now = new Date().toISOString().split('T')[0];
    const storeObj = state.stores.find(s => s.id === storeId);

    const newReceipt: StockInReceipt = {
      id: `grn-${Date.now()}`,
      receiptNo,
      date: now,
      storeId,
      supplierId,
      poReference,
      challanNo,
      invoiceNo,
      status: 'Posted',
      items: receiptItems,
      remarks,
      createdBy: state.activeUser.name,
      createdAt: new Date().toISOString()
    };

    // Update Item Master quantities and Weighted Average Rates
    const ledgerEntries: StockLedgerEntry[] = [];

    const updatedItems = state.items.map(item => {
      const line = receiptItems.find(r => r.itemId === item.id);
      if (!line) return item;

      const inwardQty = Number(line.qty) || 0;
      const inwardRate = Number(line.rate) || 0;

      // Weighted Average Rate formula: (currentVal + inwardVal) / (currentQty + inwardQty)
      const newRate = calculateWeightedAverageRate(item.currentQty, item.stockValue, inwardQty, inwardRate);
      const newQty = item.currentQty + inwardQty;
      const newStockVal = newQty * newRate;

      // Create ledger entry
      ledgerEntries.push({
        id: `led-grn-${item.id}-${Date.now()}`,
        transactionDate: now,
        transactionType: 'STOCK_IN',
        referenceNumber: receiptNo,
        itemId: item.id,
        itemCode: item.itemCode,
        itemName: item.itemName,
        storeId: storeId,
        storeName: storeObj?.name || 'Main Store',
        inwardQty: inwardQty,
        outwardQty: 0,
        runningQty: newQty,
        rate: inwardRate,
        inwardValue: inwardQty * inwardRate,
        outwardValue: 0,
        runningStockValue: newStockVal,
        userId: state.activeUser.id,
        userName: state.activeUser.name,
        timestamp: new Date().toISOString()
      });

      return {
        ...item,
        currentQty: newQty,
        availableQty: newQty - item.reservedQty,
        averageRate: newRate,
        lastPurchaseRate: inwardRate,
        stockValue: newStockVal,
        lastReceiptDate: now,
        updatedAt: now
      };
    });

    setState(prev => {
      const newState = {
        ...prev,
        items: updatedItems,
        stockInReceipts: [newReceipt, ...prev.stockInReceipts],
        ledger: [...ledgerEntries, ...prev.ledger],
        auditLogs: [
          {
            id: `aud-${Date.now()}`,
            timestamp: new Date().toISOString(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            userId: prev.activeUser.id,
            userName: prev.activeUser.name,
            module: 'Stock In (GRN)',
            action: 'POST' as const,
            record: receiptNo,
            previousValue: 'Draft',
            newValue: `Posted ${receiptItems.length} items`,
            reason: `Goods receipt note posted against PO ${poReference}`
          },
          ...prev.auditLogs
        ]
      };
      saveStateToStorage(newState);
      return newState;
    });

    setShowNew(false);
    setSelectedReceiptForPrint(newReceipt);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-slate-100 flex items-center gap-2">
            <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
            <span>Goods Inward Receipt (GRN)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Process vendor material receipts, update weighted average rates, and log inward ledger</p>
        </div>

        <button
          onClick={() => setShowNew(!showNew)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950"
        >
          <Plus className="w-4 h-4" />
          <span>New GRN Entry</span>
        </button>
      </div>

      {/* New GRN Form */}
      {showNew && (
        <form onSubmit={handlePostReceipt} className="p-5 bg-slate-900 border border-slate-700 rounded-2xl space-y-5 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Goods Receipt Note (GRN) Inward Entry Form
            </h3>
            <span className="text-xs text-slate-400 font-mono">Date: {new Date().toISOString().split('T')[0]}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">Target Warehouse Store *</label>
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
              <label className="block text-[11px] font-bold text-slate-300 mb-1">Vendor / Supplier *</label>
              <select
                value={supplierId}
                onChange={e => setSupplierId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
              >
                {state.suppliers.map(sp => (
                  <option key={sp.id} value={sp.id}>{sp.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">PO Reference Number</label>
              <input
                type="text"
                value={poReference}
                onChange={e => setPoReference(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">Challan / Invoice No</label>
              <input
                type="text"
                value={challanNo}
                onChange={e => setChallanNo(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100"
              />
            </div>
          </div>

          {/* Lines Table */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-200">Inward Material Line Items</h4>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded text-xs font-semibold flex items-center gap-1 border border-slate-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Row</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3">Select Item</th>
                    <th className="p-3 text-right">Inward Qty</th>
                    <th className="p-3">UOM</th>
                    <th className="p-3 text-right">Purchase Rate (₹)</th>
                    <th className="p-3 text-right">Line Value</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {receiptItems.map((line, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/50">
                      <td className="p-2.5">
                        <select
                          value={line.itemId}
                          onChange={e => handleItemChange(idx, 'itemId', e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-100"
                        >
                          {state.items.map(i => (
                            <option key={i.id} value={i.id}>
                              {i.itemCode} - {i.itemName} (Cur: {i.currentQty} {i.unitName})
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="p-2.5 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={line.qty}
                          onChange={e => handleItemChange(idx, 'qty', parseFloat(e.target.value))}
                          className="w-24 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-right text-xs font-mono text-slate-100"
                        />
                      </td>

                      <td className="p-2.5 font-mono text-slate-400">{line.unit}</td>

                      <td className="p-2.5 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={line.rate}
                          onChange={e => handleItemChange(idx, 'rate', parseFloat(e.target.value))}
                          className="w-28 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-right text-xs font-mono text-slate-100"
                        />
                      </td>

                      <td className="p-2.5 text-right font-mono font-bold text-emerald-400">
                        ₹{(line.value || 0).toLocaleString('en-IN')}
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
              Total Inward Value: <strong className="text-emerald-400 font-mono text-sm ml-1">
                ₹{receiptItems.reduce((s, i) => s + (i.value || 0), 0).toLocaleString('en-IN')}
              </strong>
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => setShowNew(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-lg shadow-emerald-950">
                Post & Post Ledger
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Printable GRN Modal Preview */}
      {selectedReceiptForPrint && (
        <div className="p-6 bg-slate-950 border border-emerald-500/40 rounded-2xl space-y-4 text-slate-100 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase text-emerald-400">Printable Document Preview</span>
              <h3 className="text-base font-extrabold text-slate-100">GOODS RECEIPT NOTE (GRN) - {selectedReceiptForPrint.receiptNo}</h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-bold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Document</span>
              </button>
              <button
                onClick={() => setSelectedReceiptForPrint(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-900 rounded-xl space-y-3 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300">
              <div>GRN No: <strong className="text-emerald-400 font-mono">{selectedReceiptForPrint.receiptNo}</strong></div>
              <div>Date: <strong className="text-slate-100">{selectedReceiptForPrint.date}</strong></div>
              <div>PO Ref: <strong className="text-slate-100">{selectedReceiptForPrint.poReference}</strong></div>
              <div>Challan: <strong className="text-slate-100">{selectedReceiptForPrint.challanNo}</strong></div>
            </div>

            <table className="w-full text-left text-xs text-slate-300 border border-slate-800">
              <thead className="bg-slate-950 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-2">Item</th>
                  <th className="p-2 text-right">Inward Qty</th>
                  <th className="p-2 text-right">Rate</th>
                  <th className="p-2 text-right">Value</th>
                </tr>
              </thead>
              <tbody>
                {selectedReceiptForPrint.items.map((it, i) => (
                  <tr key={i} className="border-t border-slate-800">
                    <td className="p-2 font-semibold text-slate-200">{it.itemId}</td>
                    <td className="p-2 text-right font-mono text-slate-100">{it.qty} {it.unit}</td>
                    <td className="p-2 text-right font-mono">₹{it.rate}</td>
                    <td className="p-2 text-right font-mono font-bold text-emerald-400">₹{it.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Historical Stock In Receipts */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Posted Goods Receipts Log</h3>
          <span className="text-xs text-slate-400">{state.stockInReceipts.length} GRNs Logged</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="p-3">GRN No</th>
                <th className="p-3">Date</th>
                <th className="p-3">PO Reference</th>
                <th className="p-3">Challan / Invoice</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {state.stockInReceipts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 text-xs">
                    No inward GRNs recorded yet. Click "New GRN Entry" to post vendor receipts.
                  </td>
                </tr>
              ) : (
                state.stockInReceipts.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-800/50">
                    <td className="p-3 font-mono font-bold text-emerald-400">{rec.receiptNo}</td>
                    <td className="p-3 font-mono text-slate-400">{rec.date}</td>
                    <td className="p-3 text-slate-200">{rec.poReference}</td>
                    <td className="p-3 font-mono text-slate-400">{rec.challanNo}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] border border-emerald-500/30">
                        {rec.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedReceiptForPrint(rec)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-semibold border border-slate-700"
                      >
                        Print GRN
                      </button>
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
