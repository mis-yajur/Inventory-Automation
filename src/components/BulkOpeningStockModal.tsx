import React, { useState, useRef } from 'react';
import { 
  X, UploadCloud, Download, FileSpreadsheet, AlertCircle, CheckCircle2, 
  HelpCircle, Eye, RefreshCw, Layers, ArrowRight, Table, Database
} from 'lucide-react';
import { AppState, saveStateToStorage } from '../services/store';
import { Item, StockLedgerEntry } from '../types';
import { OPENING_STOCK_TEMPLATE, downloadCsvTemplate } from '../utils/csvTemplates';
import { formatCurrency } from '../utils/calculations';

interface BulkOpeningStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  onSuccess?: () => void;
}

interface ParsedOpeningRow {
  rowNumber: number;
  itemCode: string;
  itemName: string;
  category: string;
  openingQty: number;
  standardRate: number;
  unit: string;
  store: string;
  rack: string;
  bin: string;
  totalValue: number;
  isExisting: boolean;
  isValid: boolean;
  errors: string[];
}

export const BulkOpeningStockModal: React.FC<BulkOpeningStockModalProps> = ({
  isOpen,
  onClose,
  state,
  setState,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'guide'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedOpeningRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const parseCsvText = (text: string) => {
    setErrorMessage(null);
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) {
      setErrorMessage('The uploaded content does not contain data rows. Please check the file.');
      return;
    }

    // Header detection
    const headerLine = lines[0];
    const headers = parseLineTokens(headerLine).map(h => h.toLowerCase().trim().replace(/[^a-z0-9]/g, ''));

    // Map column indexes
    let codeIdx = headers.findIndex(h => h.includes('itemcode') || h.includes('code') || h.includes('sku') || h.includes('partno'));
    let nameIdx = headers.findIndex(h => h.includes('itemname') || h.includes('name') || h.includes('description'));
    let catIdx = headers.findIndex(h => h.includes('category') || h.includes('group'));
    let qtyIdx = headers.findIndex(h => h.includes('openingqty') || h.includes('qty') || h.includes('quantity') || h.includes('stock'));
    let rateIdx = headers.findIndex(h => h.includes('standardrate') || h.includes('rate') || h.includes('price') || h.includes('cost'));
    let unitIdx = headers.findIndex(h => h.includes('unit') || h.includes('uom'));
    let storeIdx = headers.findIndex(h => h.includes('store') || h.includes('warehouse') || h.includes('location'));
    let rackIdx = headers.findIndex(h => h.includes('rack'));
    let binIdx = headers.findIndex(h => h.includes('bin'));

    // Default fallback order if headers aren't standard
    if (codeIdx === -1) codeIdx = 0;
    if (nameIdx === -1) nameIdx = 1;
    if (qtyIdx === -1) qtyIdx = 3;
    if (rateIdx === -1) rateIdx = 4;

    const rows: ParsedOpeningRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const tokens = parseLineTokens(line);
      const itemCode = (tokens[codeIdx] || '').trim();
      const itemName = (tokens[nameIdx] || (tokens[0] && tokens[0] !== itemCode ? tokens[0] : '')).trim();
      const category = (catIdx !== -1 ? tokens[catIdx] : '')?.trim() || 'General Inventory';
      const rawQty = (qtyIdx !== -1 ? tokens[qtyIdx] : '0')?.replace(/[^0-9.-]/g, '');
      const rawRate = (rateIdx !== -1 ? tokens[rateIdx] : '0')?.replace(/[^0-9.-]/g, '');
      const unit = (unitIdx !== -1 ? tokens[unitIdx] : 'PCS')?.trim() || 'PCS';
      const store = (storeIdx !== -1 ? tokens[storeIdx] : 'Main Store')?.trim() || 'Main Store';
      const rack = (rackIdx !== -1 ? tokens[rackIdx] : 'Rack A')?.trim() || 'Rack A';
      const bin = (binIdx !== -1 ? tokens[binIdx] : 'B01')?.trim() || 'B01';

      const openingQty = parseFloat(rawQty) || 0;
      const standardRate = parseFloat(rawRate) || 0;
      const totalValue = openingQty * standardRate;

      const errors: string[] = [];
      if (!itemCode) errors.push('Missing Item Code');
      if (!itemName && !itemCode) errors.push('Missing Item Name');
      if (isNaN(openingQty) || openingQty < 0) errors.push('Invalid Opening Qty');
      if (isNaN(standardRate) || standardRate < 0) errors.push('Invalid Rate');

      const existingItem = state.items.find(
        item => item.itemCode.toLowerCase().trim() === itemCode.toLowerCase().trim()
      );

      rows.push({
        rowNumber: i + 1,
        itemCode: itemCode || `SKU-${String(rows.length + 1).padStart(4, '0')}`,
        itemName: itemName || (existingItem ? existingItem.itemName : `Item ${itemCode}`),
        category: category || (existingItem ? existingItem.categoryName : 'General Inventory'),
        openingQty,
        standardRate: standardRate > 0 ? standardRate : (existingItem ? existingItem.standardRate : 0),
        unit: unit || (existingItem ? existingItem.unitName : 'PCS'),
        store: store || (existingItem ? existingItem.defaultStoreName : 'Main Store'),
        rack: rack || (existingItem ? (existingItem.rack || 'Rack A') : 'Rack A'),
        bin: bin || (existingItem ? (existingItem.bin || 'B01') : 'B01'),
        totalValue,
        isExisting: !!existingItem,
        isValid: errors.length === 0,
        errors
      });
    }

    setParsedRows(rows);
  };

  const parseLineTokens = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    // Detect if tab-separated (from Excel paste)
    if (!line.includes(',') && line.includes('\t')) {
      return line.split('\t').map(t => t.trim().replace(/^["']|["']$/g, ''));
    }

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCsvText(text);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCsvText(text);
    };
    reader.readAsText(file);
  };

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) return;
    setFileName('Pasted_Excel_Data.tsv');
    parseCsvText(pastedText);
  };

  const handleCommitOpeningStock = () => {
    if (parsedRows.length === 0) return;

    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      setErrorMessage('No valid rows found to import. Please correct the errors.');
      return;
    }

    setIsProcessing(true);

    const now = new Date().toISOString().split('T')[0];
    const timestamp = new Date().toISOString();

    const updatedItems = [...state.items];
    const newLedgerEntries: StockLedgerEntry[] = [];
    const newCategories = [...state.categories];
    const newUnits = [...state.units];

    validRows.forEach(row => {
      let item = updatedItems.find(i => i.itemCode.toLowerCase().trim() === row.itemCode.toLowerCase().trim());
      
      // Auto-ensure category exists
      let cat = newCategories.find(c => c.name.toLowerCase().trim() === row.category.toLowerCase().trim());
      if (!cat) {
        cat = {
          id: `cat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          code: `CAT-${row.category.substring(0, 3).toUpperCase()}`,
          name: row.category,
          description: 'Auto-created via Opening Stock register',
          active: true
        };
        newCategories.push(cat);
      }

      // Auto-ensure unit exists
      let unit = newUnits.find(u => u.code.toLowerCase().trim() === row.unit.toLowerCase().trim());
      if (!unit) {
        unit = {
          id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          code: row.unit.toUpperCase(),
          name: row.unit,
          decimalAllowed: true,
          active: true
        };
        newUnits.push(unit);
      }

      if (item) {
        // Update existing item opening values
        item.currentQty = row.openingQty;
        item.availableQty = row.openingQty - (item.reservedQty || 0);
        item.standardRate = row.standardRate > 0 ? row.standardRate : item.standardRate;
        item.averageRate = row.standardRate > 0 ? row.standardRate : item.averageRate;
        item.stockValue = row.openingQty * item.averageRate;
        item.rack = row.rack || item.rack;
        item.bin = row.bin || item.bin;
        item.updatedAt = now;
      } else {
        // Create new item in catalog with this opening stock
        const newItem: Item = {
          id: `itm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          itemCode: row.itemCode,
          itemName: row.itemName,
          shortName: row.itemName.slice(0, 20),
          description: `Opening stock item ${row.itemName}`,
          categoryId: cat.id,
          categoryName: cat.name,
          unitId: unit.id,
          unitName: unit.code,
          defaultStoreId: state.stores[0]?.id || 'str-1',
          defaultStoreName: row.store || state.stores[0]?.name || 'Main Store',
          rack: row.rack || 'Rack A',
          bin: row.bin || 'B01',
          minStock: Math.max(1, Math.round(row.openingQty * 0.2)),
          maxStock: Math.max(10, Math.round(row.openingQty * 2)),
          reorderLevel: Math.max(1, Math.round(row.openingQty * 0.3)),
          reorderQty: Math.max(1, Math.round(row.openingQty * 0.5)),
          safetyFactor: 25,
          safetyStock: Math.max(1, Math.round(row.openingQty * 0.15)),
          leadTimeDays: 7,
          avgDailyConsumption: 1,
          avgMonthlyConsumption: 30,
          standardRate: row.standardRate,
          lastPurchaseRate: row.standardRate,
          averageRate: row.standardRate,
          criticalItem: false,
          consumable: true,
          active: true,
          currentQty: row.openingQty,
          reservedQty: 0,
          availableQty: row.openingQty,
          stockValue: row.openingQty * row.standardRate,
          abcClass: row.openingQty * row.standardRate > 50000 ? 'A' : row.openingQty * row.standardRate > 15000 ? 'B' : 'C',
          createdAt: now,
          updatedAt: now
        };
        updatedItems.push(newItem);
        item = newItem;
      }

      // Record in Stock Ledger as OPENING
      newLedgerEntries.push({
        id: `led-open-${item.id}-${Date.now()}`,
        transactionDate: now,
        transactionType: 'OPENING',
        referenceNumber: 'OPEN-BAL-CSV',
        itemId: item.id,
        itemCode: item.itemCode,
        itemName: item.itemName,
        storeId: item.defaultStoreId,
        storeName: item.defaultStoreName,
        inwardQty: row.openingQty,
        outwardQty: 0,
        runningQty: row.openingQty,
        rate: row.standardRate,
        inwardValue: row.totalValue,
        outwardValue: 0,
        runningStockValue: row.totalValue,
        userId: state.activeUser.id,
        userName: state.activeUser.name,
        timestamp
      });
    });

    // Commit to state
    setState(prev => {
      const newState: AppState = {
        ...prev,
        items: updatedItems,
        categories: newCategories,
        units: newUnits,
        ledger: [...newLedgerEntries, ...prev.ledger],
        auditLogs: [
          {
            id: `aud-${Date.now()}`,
            timestamp,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            userId: prev.activeUser.id,
            userName: prev.activeUser.name,
            module: 'Opening Stock Register',
            action: 'CREATE',
            record: `OPENING_BULK_${validRows.length}_SKUS`,
            previousValue: 'Existing Balances',
            newValue: `${validRows.length} opening balances established`,
            reason: 'Bulk opening stock CSV / Excel import'
          },
          ...prev.auditLogs
        ]
      };
      saveStateToStorage(newState);
      return newState;
    });

    setIsProcessing(false);
    if (onSuccess) onSuccess();
    onClose();
  };

  const totalValidRows = parsedRows.filter(r => r.isValid).length;
  const totalQuantity = parsedRows.filter(r => r.isValid).reduce((sum, r) => sum + r.openingQty, 0);
  const totalValuation = parsedRows.filter(r => r.isValid).reduce((sum, r) => sum + r.totalValue, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Opening Stock Bulk Upload</span>
                <span className="text-[11px] bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full font-semibold border border-emerald-500/30">
                  CSV / Excel Ready
                </span>
              </h2>
              <p className="text-xs text-slate-400">Establish opening physical inventory quantities & standard valuation rates in batch</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadCsvTemplate(OPENING_STOCK_TEMPLATE)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
              title="Download pre-formatted sample CSV file"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Download Sample CSV</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6">
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'upload' 
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload CSV File</span>
          </button>

          <button
            onClick={() => setActiveTab('paste')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'paste' 
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Paste from Excel / Sheets</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'guide' 
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Data Format & Field Guide</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorMessage && (
            <div className="p-3 bg-rose-950/60 border border-rose-500/40 text-rose-300 rounded-xl text-xs flex items-center justify-between">
              <span>{errorMessage}</span>
              <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white font-bold ml-2">✕</button>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition ${
                  dragActive 
                    ? 'border-emerald-500 bg-emerald-950/20' 
                    : 'border-slate-700 bg-slate-950/40 hover:border-slate-600 hover:bg-slate-950/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt,.tsv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3 shadow-inner">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-slate-200">
                  {fileName ? `Selected: ${fileName}` : 'Drag & drop Opening Stock CSV here or click to browse'}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md">
                  Supports comma-separated (.csv) and tab-delimited files. Download the sample CSV template to ensure correct column matching.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'paste' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Copy from Excel & Paste Below:
                  </label>
                  <span className="text-[11px] text-slate-400">Include header row or direct columns</span>
                </div>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={`Item Code\tItem Name\tCategory\tOpening Qty\tStandard Rate\tUnit\nBRG-6205\tDeep Groove Bearing 6205\tMechanical\t45\t350\tPCS\nVBLT-B54\tV-Belt B54\tMechanical\t20\t420\tNOS`}
                  rows={8}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handlePasteSubmit}
                  disabled={!pastedText.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Eye className="w-4 h-4" />
                  <span>Parse & Preview Data</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Opening Stock Register Schema</h4>
                  <p className="text-xs text-slate-300 mt-0.5">{OPENING_STOCK_TEMPLATE.description}</p>
                </div>
                <button
                  onClick={() => downloadCsvTemplate(OPENING_STOCK_TEMPLATE)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample</span>
                </button>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Column Name</th>
                      <th className="p-3">Data Type</th>
                      <th className="p-3 text-center">Required</th>
                      <th className="p-3">Sample Value</th>
                      <th className="p-3">Notes & Rules</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {OPENING_STOCK_TEMPLATE.dataTypes.map((dt) => (
                      <tr key={dt.column} className="hover:bg-slate-800/30">
                        <td className="p-3 font-mono font-bold text-emerald-400">{dt.column}</td>
                        <td className="p-3 text-slate-300 font-semibold">{dt.type}</td>
                        <td className="p-3 text-center">
                          {dt.required ? (
                            <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded text-[10px] font-bold">Mandatory</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px]">Optional</span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-slate-200">{dt.example}</td>
                        <td className="p-3 text-slate-400 text-[11px]">{dt.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Parsed Rows Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Rows</span>
                    <span className="text-slate-100 font-mono font-bold">{parsedRows.length} Items</span>
                  </div>
                  <div className="h-6 w-px bg-slate-800" />
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Opening Quantity</span>
                    <span className="text-cyan-400 font-mono font-bold">{totalQuantity.toLocaleString()}</span>
                  </div>
                  <div className="h-6 w-px bg-slate-800" />
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Opening Valuation</span>
                    <span className="text-emerald-400 font-mono font-bold">{formatCurrency(totalValuation)}</span>
                  </div>
                </div>

                <div className="text-xs flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg font-semibold">
                    ✓ {totalValidRows} Ready to Import
                  </span>
                  {parsedRows.length - totalValidRows > 0 && (
                    <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg font-semibold">
                      ⚠ {parsedRows.length - totalValidRows} Errors
                    </span>
                  )}
                </div>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-x-auto max-h-64">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Item Code</th>
                      <th className="p-2.5">Item Name</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5 text-right">Opening Qty</th>
                      <th className="p-2.5 text-right">Standard Rate</th>
                      <th className="p-2.5 text-right">Opening Value</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className={row.isValid ? 'hover:bg-slate-800/40' : 'bg-rose-950/20'}>
                        <td className="p-2.5 font-mono font-bold text-emerald-400">{row.itemCode}</td>
                        <td className="p-2.5 text-slate-200">{row.itemName}</td>
                        <td className="p-2.5 text-slate-400">{row.category}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-100">{row.openingQty} {row.unit}</td>
                        <td className="p-2.5 text-right font-mono text-slate-300">₹{row.standardRate.toFixed(2)}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-400">{formatCurrency(row.totalValue)}</td>
                        <td className="p-2.5 text-center">
                          {row.isValid ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {row.isExisting ? 'Update SKU' : 'New SKU'}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20" title={row.errors.join(', ')}>
                              Error
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleCommitOpeningStock}
            disabled={parsedRows.length === 0 || totalValidRows === 0 || isProcessing}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-950 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Posting to Ledger...</span>
              </>
            ) : (
              <>
                <Database className="w-4 h-4" />
                <span>Post {totalValidRows} Opening Records to Ledger</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
