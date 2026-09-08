import React, { useState, useRef } from 'react';
import {
  X, UploadCloud, Download, CheckCircle2, AlertCircle, FileSpreadsheet,
  Layers, Package, Check, HelpCircle, ChevronDown, ChevronUp, RefreshCw,
  PlusCircle, FileText
} from 'lucide-react';
import Papa from 'papaparse';
import { Item, Category, Unit, Department, Store, StockLedgerEntry } from '../types';
import { AppState } from '../services/store';

interface BulkItemUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  onImportSuccess: (payload: {
    items: Item[];
    newCategories: Category[];
    newUnits: Unit[];
    newDepartments: Department[];
    ledgerEntries: StockLedgerEntry[];
  }) => void;
}

interface ParsedRow {
  rowNum: number;
  raw: Record<string, any>;
  itemCode: string;
  itemName: string;
  shortName: string;
  categoryName: string;
  unitName: string;
  departmentName: string;
  defaultStoreName: string;
  rack: string;
  bin: string;
  minStock: number;
  maxStock: number;
  reorderLevel: number;
  reorderQty: number;
  safetyStock: number;
  leadTimeDays: number;
  avgDailyConsumption: number;
  standardRate: number;
  openingQty: number;
  partNumber: string;
  brand: string;
  specification: string;
  criticalItem: boolean;
  consumable: boolean;
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

export const BulkItemUploadModal: React.FC<BulkItemUploadModalProps> = ({
  isOpen,
  onClose,
  state,
  onImportSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  
  // Options
  const [autoCreateCategories, setAutoCreateCategories] = useState(true);
  const [autoCreateUnits, setAutoCreateUnits] = useState(true);
  const [autoCreateDepartments, setAutoCreateDepartments] = useState(true);
  const [postOpeningStock, setPostOpeningStock] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Standard Template CSV definition
  const handleDownloadTemplate = () => {
    const headers = [
      'Item Code',
      'Item Name',
      'Short Name',
      'Category',
      'Unit',
      'Department',
      'Store',
      'Rack',
      'Bin',
      'Min Stock',
      'Max Stock',
      'Reorder Level',
      'Reorder Qty',
      'Safety Stock',
      'Lead Time (Days)',
      'Avg Daily Consumption',
      'Standard Rate',
      'Opening Qty',
      'Part Number',
      'Brand',
      'Specification',
      'Critical (Yes/No)',
      'Consumable (Yes/No)'
    ];

    const sampleRows = [
      [
        'SP-6205',
        'Spindle Ball Bearing 6205',
        'Bearing 6205',
        'Mechanical Spares',
        'PCS',
        'Spinning',
        'Main Store',
        'A01',
        'B02',
        '10',
        '50',
        '20',
        '30',
        '8',
        '14',
        '2',
        '450',
        '25',
        '6205-ZZ',
        'SKF',
        '25x52x15 mm',
        'Yes',
        'Yes'
      ],
      [
        'OIL-ISO10',
        'Synthetic Spindle Lubricant Oil',
        'Spindle Oil',
        'Lubricants',
        'LTR',
        'Spinning',
        'Main Store',
        'C01',
        'D04',
        '50',
        '200',
        '80',
        '100',
        '25',
        '7',
        '5',
        '280',
        '60',
        'SO-10',
        'Mobil',
        'ISO VG 10',
        'No',
        'Yes'
      ],
      [
        'BELT-B72',
        'Drive Belt B-72 Heavy Duty',
        'V-Belt B72',
        'Power Transmission',
        'PCS',
        'Maintenance',
        'Main Store',
        'E03',
        'F01',
        '5',
        '30',
        '12',
        '15',
        '4',
        '10',
        '1',
        '680',
        '12',
        'B72-HD',
        'Gates',
        'B-Section 72-Inch',
        'Yes',
        'Yes'
      ]
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...sampleRows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Yajur_Items_Import_Standard_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Flexible column mapping
  const normalizeKey = (key: string): string => {
    return key.toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  const parseRawRecords = (records: any[]) => {
    const existingCodes = new Set(state.items.map(i => i.itemCode.toLowerCase().trim()));
    let nextAutoIndex = state.items.length + 1;

    const parsed: ParsedRow[] = records.map((row, idx) => {
      const normalizedRow: Record<string, any> = {};
      for (const [k, v] of Object.entries(row)) {
        normalizedRow[normalizeKey(k)] = v;
      }

      // Helper to extract value by multiple candidate normalized keys
      const getVal = (...keys: string[]): any => {
        for (const k of keys) {
          const norm = normalizeKey(k);
          if (normalizedRow[norm] !== undefined && normalizedRow[norm] !== null && String(normalizedRow[norm]).trim() !== '') {
            return normalizedRow[norm];
          }
        }
        return '';
      };

      const rawItemCode = String(getVal('itemcode', 'code', 'sku', 'partcode', 'itemid')).trim();
      const rawItemName = String(getVal('itemname', 'name', 'materialname', 'description', 'title')).trim();
      const shortName = String(getVal('shortname', 'short_name', 'alias')).trim() || rawItemName;
      const categoryName = String(getVal('category', 'categoryname', 'group', 'itemcategory')).trim() || 'General';
      const unitName = String(getVal('unit', 'unitname', 'uom', 'measure')).trim() || 'PCS';
      const departmentName = String(getVal('department', 'departmentname', 'dept', 'costcentre')).trim() || 'General';
      const defaultStoreName = String(getVal('store', 'storename', 'warehouse')).trim() || (state.stores[0]?.name || 'Main Store');
      const rack = String(getVal('rack', 'rackno', 'rackid')).trim() || '';
      const bin = String(getVal('bin', 'binno', 'binid')).trim() || '';
      
      const minStock = parseFloat(getVal('minstock', 'min_stock', 'minimumstock')) || 0;
      const maxStock = parseFloat(getVal('maxstock', 'max_stock', 'maximumstock')) || 0;
      const reorderLevel = parseFloat(getVal('reorderlevel', 'reorder_level', 'rol')) || 0;
      const reorderQty = parseFloat(getVal('reorderqty', 'reorder_qty', 'roq')) || 0;
      const safetyStock = parseFloat(getVal('safetystock', 'safety_stock')) || 0;
      const leadTimeDays = parseInt(getVal('leadtimedays', 'leadtime', 'lead_time')) || 0;
      const avgDailyConsumption = parseFloat(getVal('avgdailyconsumption', 'dailyconsumption', 'consumption')) || 0;
      const standardRate = parseFloat(getVal('standardrate', 'rate', 'price', 'unitrate', 'purchaseprice')) || 0;
      const openingQty = parseFloat(getVal('openingqty', 'openingstock', 'currentqty', 'qty', 'stock', 'quantity')) || 0;
      
      const partNumber = String(getVal('partnumber', 'partno', 'part_number')).trim();
      const brand = String(getVal('brand', 'make', 'manufacturer')).trim();
      const specification = String(getVal('specification', 'spec', 'specs', 'dimension')).trim();
      
      const rawCritical = String(getVal('criticalitem', 'critical', 'iscritical')).toLowerCase();
      const criticalItem = rawCritical === 'yes' || rawCritical === 'true' || rawCritical === '1';

      const rawConsumable = String(getVal('consumable', 'isconsumable')).toLowerCase();
      const consumable = rawConsumable === 'no' || rawConsumable === 'false' || rawConsumable === '0' ? false : true;

      const warnings: string[] = [];
      const errors: string[] = [];

      let finalCode = rawItemCode;
      if (!finalCode) {
        finalCode = `ITM-${String(nextAutoIndex).padStart(4, '0')}`;
        nextAutoIndex++;
        warnings.push(`Auto-generated Code: ${finalCode}`);
      }

      if (existingCodes.has(finalCode.toLowerCase())) {
        warnings.push(`Code "${finalCode}" already exists (will be updated)`);
      }

      if (!rawItemName) {
        errors.push('Item Name is required');
      }

      return {
        rowNum: idx + 1,
        raw: row,
        itemCode: finalCode,
        itemName: rawItemName,
        shortName,
        categoryName,
        unitName,
        departmentName,
        defaultStoreName,
        rack,
        bin,
        minStock,
        maxStock,
        reorderLevel,
        reorderQty,
        safetyStock,
        leadTimeDays,
        avgDailyConsumption,
        standardRate,
        openingQty,
        partNumber,
        brand,
        specification,
        criticalItem,
        consumable,
        isValid: errors.length === 0,
        warnings,
        errors
      };
    });

    setParsedRows(parsed);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      setIsProcessing(true);

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setIsProcessing(false);
          parseRawRecords(results.data);
        },
        error: (err) => {
          setIsProcessing(false);
          alert(`Failed to parse CSV file: ${err.message}`);
        }
      });
    }
  };

  const handleParsePastedText = () => {
    if (!pastedText.trim()) return;
    setIsProcessing(true);
    setFileName('Pasted Data');

    Papa.parse(pastedText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setIsProcessing(false);
        parseRawRecords(results.data);
      },
      error: (err) => {
        setIsProcessing(false);
        alert(`Failed to parse text: ${err.message}`);
      }
    });
  };

  const handleExecuteImport = () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      alert('No valid rows found to import.');
      return;
    }

    // 1. Prepare Categories
    const existingCats = new Map<string, Category>(state.categories.map(c => [c.name.toLowerCase().trim(), c]));
    const newCategories: Category[] = [];

    // 2. Prepare Units
    const existingUnits = new Map<string, Unit>(state.units.map(u => [u.name.toLowerCase().trim(), u]));
    const existingUnitsByCode = new Map<string, Unit>(state.units.map(u => [u.code.toLowerCase().trim(), u]));
    const newUnits: Unit[] = [];

    // 3. Prepare Departments
    const existingDepts = new Map<string, Department>(state.departments.map(d => [d.name.toLowerCase().trim(), d]));
    const newDepartments: Department[] = [];

    // 4. Default Store
    const defaultStore = state.stores[0] || {
      id: 'str-1',
      code: 'STR-01',
      name: 'Main Store',
      responsiblePerson: 'Admin',
      location: 'Warehouse',
      active: true
    };

    const timestamp = new Date().toISOString();
    const todayDate = timestamp.split('T')[0];

    const importedItems: Item[] = [];
    const ledgerEntries: StockLedgerEntry[] = [];

    validRows.forEach((row, idx) => {
      // Find or create Category
      let catId = 'cat-gen';
      const catNorm = row.categoryName.toLowerCase().trim();
      if (existingCats.has(catNorm)) {
        catId = existingCats.get(catNorm)!.id;
      } else if (autoCreateCategories) {
        const existingNewCat = newCategories.find(c => c.name.toLowerCase().trim() === catNorm);
        if (existingNewCat) {
          catId = existingNewCat.id;
        } else {
          catId = `cat-${Date.now()}-${idx}`;
          const newCat: Category = {
            id: catId,
            code: row.categoryName.substring(0, 4).toUpperCase() || 'CAT',
            name: row.categoryName,
            description: `Auto-created during bulk upload for ${row.itemName}`,
            active: true
          };
          newCategories.push(newCat);
        }
      }

      // Find or create Unit
      let unitId = 'u-pcs';
      let unitDisplay = row.unitName.toUpperCase() || 'PCS';
      const unitNorm = row.unitName.toLowerCase().trim();
      if (existingUnitsByCode.has(unitNorm)) {
        const u = existingUnitsByCode.get(unitNorm)!;
        unitId = u.id;
        unitDisplay = u.code;
      } else if (existingUnits.has(unitNorm)) {
        const u = existingUnits.get(unitNorm)!;
        unitId = u.id;
        unitDisplay = u.code;
      } else if (autoCreateUnits) {
        const existingNewUnit = newUnits.find(u => u.code.toLowerCase().trim() === unitNorm || u.name.toLowerCase().trim() === unitNorm);
        if (existingNewUnit) {
          unitId = existingNewUnit.id;
          unitDisplay = existingNewUnit.code;
        } else {
          unitId = `u-${Date.now()}-${idx}`;
          unitDisplay = row.unitName.toUpperCase();
          const newUnit: Unit = {
            id: unitId,
            code: unitDisplay,
            name: row.unitName,
            decimalAllowed: ['KG', 'LTR', 'MTR', 'TON'].includes(unitDisplay),
            active: true
          };
          newUnits.push(newUnit);
        }
      }

      // Find or create Department
      let deptId = 'dep-gen';
      const deptNorm = row.departmentName.toLowerCase().trim();
      if (existingDepts.has(deptNorm)) {
        deptId = existingDepts.get(deptNorm)!.id;
      } else if (autoCreateDepartments) {
        const existingNewDept = newDepartments.find(d => d.name.toLowerCase().trim() === deptNorm);
        if (existingNewDept) {
          deptId = existingNewDept.id;
        } else {
          deptId = `dep-${Date.now()}-${idx}`;
          const newDept: Department = {
            id: deptId,
            code: row.departmentName.substring(0, 4).toUpperCase() || 'DEPT',
            name: row.departmentName,
            departmentHead: 'Department Incharge',
            costCentre: `CC-${row.departmentName.substring(0, 3).toUpperCase()}`,
            active: true
          };
          newDepartments.push(newDept);
        }
      }

      const itemId = `item-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`;
      const currentQty = row.openingQty;
      const availableQty = currentQty;
      const stockValue = currentQty * (row.standardRate || 0);

      const newItem: Item = {
        id: itemId,
        itemCode: row.itemCode,
        itemName: row.itemName,
        shortName: row.shortName || row.itemName,
        description: `${row.itemName} ${row.specification ? `(${row.specification})` : ''}`,
        categoryId: catId,
        categoryName: row.categoryName,
        unitId: unitId,
        unitName: unitDisplay,
        departmentId: deptId,
        departmentName: row.departmentName,
        defaultStoreId: defaultStore.id,
        defaultStoreName: defaultStore.name,
        preferredSupplierId: '',
        preferredSupplierName: '',
        partNumber: row.partNumber,
        brand: row.brand,
        specification: row.specification,
        rack: row.rack,
        bin: row.bin,
        minStock: row.minStock,
        maxStock: row.maxStock,
        reorderLevel: row.reorderLevel,
        reorderQty: row.reorderQty,
        safetyFactor: 25,
        safetyStock: row.safetyStock,
        leadTimeDays: row.leadTimeDays,
        avgDailyConsumption: row.avgDailyConsumption,
        avgMonthlyConsumption: row.avgDailyConsumption * 30,
        standardRate: row.standardRate,
        lastPurchaseRate: row.standardRate,
        averageRate: row.standardRate,
        criticalItem: row.criticalItem,
        consumable: row.consumable,
        active: true,
        currentQty,
        reservedQty: 0,
        availableQty,
        stockValue,
        createdAt: timestamp,
        updatedAt: timestamp
      };

      importedItems.push(newItem);

      // Create opening stock ledger entry if quantity > 0
      if (postOpeningStock && currentQty > 0) {
        const ledgerEntry: StockLedgerEntry = {
          id: `led-${Date.now()}-${idx}`,
          transactionDate: todayDate,
          transactionType: 'OPENING',
          referenceNumber: `OPN-${row.itemCode}`,
          itemId: itemId,
          itemCode: row.itemCode,
          itemName: row.itemName,
          storeId: defaultStore.id,
          storeName: defaultStore.name,
          departmentId: deptId,
          departmentName: row.departmentName,
          inwardQty: currentQty,
          outwardQty: 0,
          runningQty: currentQty,
          rate: row.standardRate,
          inwardValue: stockValue,
          outwardValue: 0,
          runningStockValue: stockValue,
          userId: state.activeUser.id,
          userName: state.activeUser.name,
          timestamp: timestamp
        };
        ledgerEntries.push(ledgerEntry);
      }
    });

    onImportSuccess({
      items: importedItems,
      newCategories,
      newUnits,
      newDepartments,
      ledgerEntries
    });

    onClose();
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl my-auto shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-100 flex items-center gap-2">
                <span>Bulk Upload Item Master</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Standard Format (CSV / Excel)
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Import complete inventory catalog with automatic category, unit & opening stock setup
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 shadow-sm"
              title="Download standard formatted CSV file ready for Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Standard CSV Template</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Quick Guidance banner */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300">
                <span className="font-bold text-slate-100">Standard Upload Guide:</span> Download our CSV template, copy/paste from your Excel file, or drop your CSV below.
                Opening stock quantities and rates will automatically post to your live Stock Ledger!
              </div>
            </div>
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 shrink-0 self-start sm:self-center"
            >
              <span>{showGuide ? 'Hide Column Guide' : 'View Column Guide'}</span>
              {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Collapsible Column Guide */}
          {showGuide && (
            <div className="p-4 bg-slate-950 border border-cyan-500/20 rounded-xl text-xs space-y-2 animate-in fade-in">
              <h4 className="font-bold text-cyan-400 uppercase tracking-wider text-[11px]">
                Supported Standard Format Columns:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-[11px] text-slate-300">
                <div><span className="font-mono text-emerald-400 font-bold">Item Code</span>: Unique SKU (e.g. SP-6205, auto-generated if blank)</div>
                <div><span className="font-mono text-emerald-400 font-bold">Item Name *</span>: Primary description (e.g. Spindle Bearing 6205)</div>
                <div><span className="font-mono text-emerald-400 font-bold">Category</span>: e.g. Mechanical, Electrical, Spares (Auto-created)</div>
                <div><span className="font-mono text-emerald-400 font-bold">Unit</span>: UOM like PCS, KG, MTR, LTR, SET (Auto-created)</div>
                <div><span className="font-mono text-emerald-400 font-bold">Department</span>: e.g. Spinning, Maintenance (Auto-created)</div>
                <div><span className="font-mono text-emerald-400 font-bold">Standard Rate</span>: Purchase or valuation cost in ₹</div>
                <div><span className="font-mono text-emerald-400 font-bold">Opening Qty</span>: Initial stock count (Creates Opening Ledger!)</div>
                <div><span className="font-mono text-emerald-400 font-bold">Rack & Bin</span>: Storage location coordinates (e.g. A01 / B02)</div>
                <div><span className="font-mono text-emerald-400 font-bold">Min / Max Stock</span>: Lower threshold & ceiling capacity</div>
                <div><span className="font-mono text-emerald-400 font-bold">Reorder Level & Qty</span>: Trigger point & replenishment quantity</div>
                <div><span className="font-mono text-emerald-400 font-bold">Lead Time (Days)</span>: Supplier delivery turnaround time</div>
                <div><span className="font-mono text-emerald-400 font-bold">Part # / Brand</span>: OEM Part Number & Manufacturer Make</div>
              </div>
            </div>
          )}

          {/* Mode Tabs */}
          <div className="flex border-b border-slate-800">
            <button
              onClick={() => setActiveTab('upload')}
              className={`pb-2.5 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
                activeTab === 'upload'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Option 1: Upload CSV / Excel File</span>
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className={`pb-2.5 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
                activeTab === 'paste'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Option 2: Copy & Paste from Excel</span>
            </button>
          </div>

          {/* Tab 1: File Upload */}
          {activeTab === 'upload' && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-emerald-500/80 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-slate-950/40 cursor-pointer transition group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="p-4 bg-slate-800/80 group-hover:bg-emerald-500/10 rounded-2xl text-slate-400 group-hover:text-emerald-400 transition mb-3">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 mb-1">
                {fileName ? fileName : 'Click to Browse or Drag & Drop your inventory file'}
              </h3>
              <p className="text-xs text-slate-400 max-w-md">
                Supports Standard CSV format, comma-separated or tab-separated text files.
              </p>
            </div>
          )}

          {/* Tab 2: Paste from Excel */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <textarea
                rows={6}
                value={pastedText}
                onChange={e => setPastedText(e.target.value)}
                placeholder="Paste rows copied directly from your Microsoft Excel or Google Sheets spreadsheet here (including headers)...&#10;Item Code	Item Name	Category	Unit	Standard Rate	Opening Qty&#10;SP-001	Bearing 6205	Mechanical	PCS	450	25&#10;LUB-01	Spindle Oil	Lubricants	LTR	280	60"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleParsePastedText}
                  disabled={!pastedText.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Parse Pasted Records</span>
                </button>
              </div>
            </div>
          )}

          {/* Options Checkboxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={autoCreateCategories}
                onChange={e => setAutoCreateCategories(e.target.checked)}
                className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-800"
              />
              <span>Auto-create Categories</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={autoCreateUnits}
                onChange={e => setAutoCreateUnits(e.target.checked)}
                className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-800"
              />
              <span>Auto-create Units (UOM)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={autoCreateDepartments}
                onChange={e => setAutoCreateDepartments(e.target.checked)}
                className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-800"
              />
              <span>Auto-create Departments</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-emerald-400 font-semibold">
              <input
                type="checkbox"
                checked={postOpeningStock}
                onChange={e => setPostOpeningStock(e.target.checked)}
                className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-800"
              />
              <span>Post Opening Stock to Ledger</span>
            </label>
          </div>

          {/* Live Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>Import Preview & Validation</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    Total: {parsedRows.length} Rows
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Valid: {validCount} Ready
                  </span>
                  {invalidCount > 0 && (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      Errors: {invalidCount}
                    </span>
                  )}
                </div>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="p-2.5 font-bold">#</th>
                      <th className="p-2.5 font-bold">Status</th>
                      <th className="p-2.5 font-bold">Code</th>
                      <th className="p-2.5 font-bold">Item Name</th>
                      <th className="p-2.5 font-bold">Category</th>
                      <th className="p-2.5 font-bold">Unit</th>
                      <th className="p-2.5 font-bold text-right">Opening Qty</th>
                      <th className="p-2.5 font-bold text-right">Rate (₹)</th>
                      <th className="p-2.5 font-bold text-right">Stock Value (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                    {parsedRows.slice(0, 50).map(row => (
                      <tr key={row.rowNum} className={row.isValid ? 'hover:bg-slate-800/40' : 'bg-rose-950/20 hover:bg-rose-950/30'}>
                        <td className="p-2.5 text-slate-500 font-mono text-[11px]">{row.rowNum}</td>
                        <td className="p-2.5">
                          {row.isValid ? (
                            <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[11px] text-rose-400 font-bold" title={row.errors.join(', ')}>
                              <AlertCircle className="w-3.5 h-3.5" /> Error
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 font-mono text-emerald-400 font-bold">{row.itemCode}</td>
                        <td className="p-2.5 text-slate-100 font-medium">{row.itemName || <span className="text-rose-400 italic">Missing name</span>}</td>
                        <td className="p-2.5 text-slate-300">{row.categoryName}</td>
                        <td className="p-2.5 text-slate-300 font-mono">{row.unitName}</td>
                        <td className="p-2.5 text-right font-mono text-slate-100 font-bold">{row.openingQty}</td>
                        <td className="p-2.5 text-right font-mono text-slate-300">₹{row.standardRate.toLocaleString('en-IN')}</td>
                        <td className="p-2.5 text-right font-mono text-emerald-400 font-bold">
                          ₹{(row.openingQty * row.standardRate).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {parsedRows.length > 50 && (
                <div className="text-[11px] text-slate-500 text-center">
                  Showing first 50 of {parsedRows.length} rows. All {validCount} valid items will be imported.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/95 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {validCount > 0 ? (
              <span className="text-emerald-400 font-bold">
                ✓ Ready to import {validCount} items into production inventory.
              </span>
            ) : (
              <span>Select or paste data using the standard format template.</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              onClick={handleExecuteImport}
              disabled={validCount === 0 || isProcessing}
              className="flex-1 sm:flex-none px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950"
            >
              <Check className="w-4 h-4" />
              <span>Confirm & Import {validCount > 0 ? `${validCount} Items` : 'All'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
