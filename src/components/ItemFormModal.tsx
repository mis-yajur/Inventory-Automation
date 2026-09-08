import React, { useState, useEffect } from 'react';
import { X, Save, Package, Sliders, Shield, AlertTriangle, UploadCloud } from 'lucide-react';
import { AppState } from '../services/store';
import { Item } from '../types';
import { calculateReorderLevel, calculateSafetyStock } from '../utils/calculations';

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  onSave: (item: Item) => void;
  editingItem: Item | null;
  onOpenBulkUpload?: () => void;
}

export const ItemFormModal: React.FC<ItemFormModalProps> = ({
  isOpen,
  onClose,
  state,
  onSave,
  editingItem,
  onOpenBulkUpload
}) => {
  const [formData, setFormData] = useState<Partial<Item>>({
    itemCode: '',
    itemName: '',
    shortName: '',
    description: '',
    categoryId: state.categories[0]?.id || '',
    categoryName: state.categories[0]?.name || '',
    unitId: state.units[0]?.id || '',
    unitName: state.units[0]?.name || '',
    departmentId: state.departments[0]?.id || '',
    departmentName: state.departments[0]?.name || '',
    defaultStoreId: state.stores[0]?.id || '',
    defaultStoreName: state.stores[0]?.name || '',
    preferredSupplierId: state.suppliers[0]?.id || '',
    preferredSupplierName: state.suppliers[0]?.name || '',
    partNumber: '',
    brand: '',
    specification: '',
    rack: '',
    bin: '',
    minStock: 0,
    maxStock: 0,
    reorderLevel: 0,
    reorderQty: 0,
    safetyFactor: 25,
    safetyStock: 0,
    leadTimeDays: 0,
    avgDailyConsumption: 0,
    avgMonthlyConsumption: 0,
    standardRate: 0,
    lastPurchaseRate: 0,
    averageRate: 0,
    criticalItem: false,
    consumable: true,
    active: true,
    currentQty: 0,
    reservedQty: 0,
    availableQty: 0,
    stockValue: 0
  });

  useEffect(() => {
    if (editingItem) {
      setFormData(editingItem);
    } else {
      const nextNum = state.items.length + 1;
      const autoCode = `ITM-${String(nextNum).padStart(4, '0')}`;
      setFormData({
        itemCode: autoCode,
        itemName: '',
        shortName: '',
        description: '',
        categoryId: state.categories[0]?.id || '',
        categoryName: state.categories[0]?.name || '',
        unitId: state.units[0]?.id || '',
        unitName: state.units[0]?.name || '',
        departmentId: state.departments[0]?.id || '',
        departmentName: state.departments[0]?.name || '',
        defaultStoreId: state.stores[0]?.id || '',
        defaultStoreName: state.stores[0]?.name || '',
        preferredSupplierId: state.suppliers[0]?.id || '',
        preferredSupplierName: state.suppliers[0]?.name || '',
        partNumber: '',
        brand: '',
        specification: '',
        rack: '',
        bin: '',
        minStock: 0,
        maxStock: 0,
        reorderLevel: 0,
        reorderQty: 0,
        safetyFactor: 25,
        safetyStock: 0,
        leadTimeDays: 0,
        avgDailyConsumption: 0,
        avgMonthlyConsumption: 0,
        standardRate: 0,
        lastPurchaseRate: 0,
        averageRate: 0,
        criticalItem: false,
        consumable: true,
        active: true,
        currentQty: 0,
        reservedQty: 0,
        availableQty: 0,
        stockValue: 0
      });
    }
  }, [editingItem, isOpen, state.items.length]);

  if (!isOpen) return null;

  // Auto-calculate parameters whenever Lead Time, Avg Daily, or Safety Factor changes
  const handleDailyConsumptionChange = (val: number) => {
    const daily = val >= 0 ? val : 0;
    const monthly = daily * 30;
    const leadDays = formData.leadTimeDays || 7;
    const safetyPct = formData.safetyFactor || 25;
    const safety = calculateSafetyStock(daily, leadDays, safetyPct);
    const reorder = calculateReorderLevel(daily, leadDays, safety);

    setFormData(prev => ({
      ...prev,
      avgDailyConsumption: daily,
      avgMonthlyConsumption: monthly,
      safetyStock: safety,
      reorderLevel: reorder
    }));
  };

  const handleLeadTimeChange = (val: number) => {
    const leadDays = val >= 0 ? val : 1;
    const daily = formData.avgDailyConsumption || 0;
    const safetyPct = formData.safetyFactor || 25;
    const safety = calculateSafetyStock(daily, leadDays, safetyPct);
    const reorder = calculateReorderLevel(daily, leadDays, safety);

    setFormData(prev => ({
      ...prev,
      leadTimeDays: leadDays,
      safetyStock: safety,
      reorderLevel: reorder
    }));
  };

  const handleSafetyFactorChange = (val: number) => {
    const safetyPct = val >= 0 ? val : 0;
    const daily = formData.avgDailyConsumption || 0;
    const leadDays = formData.leadTimeDays || 7;
    const safety = calculateSafetyStock(daily, leadDays, safetyPct);
    const reorder = calculateReorderLevel(daily, leadDays, safety);

    setFormData(prev => ({
      ...prev,
      safetyFactor: safetyPct,
      safetyStock: safety,
      reorderLevel: reorder
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.itemCode || !formData.itemName) return;

    const categoryObj = state.categories.find(c => c.id === formData.categoryId);
    const unitObj = state.units.find(u => u.id === formData.unitId);
    const deptObj = state.departments.find(d => d.id === formData.departmentId);
    const storeObj = state.stores.find(s => s.id === formData.defaultStoreId);
    const supObj = state.suppliers.find(sp => sp.id === formData.preferredSupplierId);

    const now = new Date().toISOString().split('T')[0];

    const finalItem: Item = {
      id: editingItem ? editingItem.id : `itm-${Date.now()}`,
      itemCode: formData.itemCode.trim().toUpperCase(),
      itemName: formData.itemName.trim(),
      shortName: formData.shortName || formData.itemName,
      description: formData.description || '',
      categoryId: formData.categoryId || '',
      categoryName: categoryObj ? categoryObj.name : 'General',
      unitId: formData.unitId || '',
      unitName: unitObj ? unitObj.code : 'PCS',
      departmentId: formData.departmentId,
      departmentName: deptObj?.name,
      defaultStoreId: formData.defaultStoreId || state.stores[0]?.id || '',
      defaultStoreName: storeObj ? storeObj.name : 'Main Store',
      preferredSupplierId: formData.preferredSupplierId,
      preferredSupplierName: supObj?.name,
      partNumber: formData.partNumber,
      brand: formData.brand,
      specification: formData.specification,
      rack: formData.rack || 'A01',
      bin: formData.bin || 'B01',
      minStock: Number(formData.minStock) || 0,
      maxStock: Number(formData.maxStock) || 100,
      reorderLevel: Number(formData.reorderLevel) || 0,
      reorderQty: Number(formData.reorderQty) || 0,
      safetyFactor: Number(formData.safetyFactor) || 25,
      safetyStock: Number(formData.safetyStock) || 0,
      leadTimeDays: Number(formData.leadTimeDays) || 7,
      avgDailyConsumption: Number(formData.avgDailyConsumption) || 0,
      avgMonthlyConsumption: Number(formData.avgMonthlyConsumption) || 0,
      standardRate: Number(formData.standardRate) || 0,
      lastPurchaseRate: Number(formData.lastPurchaseRate) || Number(formData.standardRate) || 0,
      averageRate: Number(formData.averageRate) || Number(formData.standardRate) || 0,
      criticalItem: Boolean(formData.criticalItem),
      consumable: Boolean(formData.consumable),
      active: Boolean(formData.active),
      currentQty: Number(formData.currentQty) || 0,
      reservedQty: Number(formData.reservedQty) || 0,
      availableQty: (Number(formData.currentQty) || 0) - (Number(formData.reservedQty) || 0),
      stockValue: (Number(formData.currentQty) || 0) * (Number(formData.averageRate) || 0),
      createdAt: editingItem ? editingItem.createdAt : now,
      updatedAt: now
    };

    onSave(finalItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">
                {editingItem ? `Edit Item Master: ${editingItem.itemCode}` : 'Create New Item Master'}
              </h3>
              <p className="text-[11px] text-slate-400">Specify inventory classification, thresholds, rates, and storage parameters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close item modal"
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {!editingItem && onOpenBulkUpload && (
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-100">Need to add items in bulk?</h5>
                  <p className="text-[11px] text-slate-400">
                    Upload your entire catalog at once via standard CSV or copy-paste directly from Microsoft Excel.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBulkUpload();
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 self-start sm:self-center shadow-sm"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Switch to Bulk Upload (CSV/Excel)</span>
              </button>
            </div>
          )}

          {/* Section 1: Basic Classification */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-2">
              <Package className="w-3.5 h-3.5" /> 1. General Identification
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Item Code *</label>
                <input
                  type="text"
                  required
                  value={formData.itemCode}
                  onChange={e => setFormData({ ...formData, itemCode: e.target.value })}
                  placeholder="e.g. ITM-0001"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  value={formData.itemName}
                  onChange={e => setFormData({ ...formData, itemName: e.target.value })}
                  placeholder="e.g. Bearing 6205"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Category *</label>
                <select
                  value={formData.categoryId}
                  onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                >
                  {state.categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Unit of Measure *</label>
                <select
                  value={formData.unitId}
                  onChange={e => setFormData({ ...formData, unitId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                >
                  {state.units.map(u => (
                    <option key={u.id} value={u.id}>{u.code} - {u.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Brand / Make</label>
                <input
                  type="text"
                  value={formData.brand || ''}
                  onChange={e => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="e.g. SKF / Shell"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Part / Model Number</label>
                <input
                  type="text"
                  value={formData.partNumber || ''}
                  onChange={e => setFormData({ ...formData, partNumber: e.target.value })}
                  placeholder="e.g. 6205-2RS"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Store & Warehouse Location */}
          <div className="pt-2 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5" /> 2. Warehouse & Location Mapping
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Default Store Location</label>
                <select
                  value={formData.defaultStoreId}
                  onChange={e => setFormData({ ...formData, defaultStoreId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                >
                  {state.stores.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Rack ID</label>
                <input
                  type="text"
                  value={formData.rack || ''}
                  onChange={e => setFormData({ ...formData, rack: e.target.value })}
                  placeholder="e.g. A02"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Bin ID</label>
                <input
                  type="text"
                  value={formData.bin || ''}
                  onChange={e => setFormData({ ...formData, bin: e.target.value })}
                  placeholder="e.g. B06"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Preferred Supplier</label>
                <select
                  value={formData.preferredSupplierId}
                  onChange={e => setFormData({ ...formData, preferredSupplierId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                >
                  {state.suppliers.map(sp => (
                    <option key={sp.id} value={sp.id}>{sp.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Stock Control & Safety Parameters */}
          <div className="pt-2 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" /> 3. Safety Stock & Planning Parameters
            </h4>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 mb-3 text-xs text-slate-400 flex items-center justify-between">
              <span>Formula: <strong>Reorder Level = (Avg Daily × Lead Time) + Safety Stock</strong></span>
              <span className="text-emerald-400 font-semibold">Auto-calculated</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Avg Daily Consumption</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.avgDailyConsumption}
                  onChange={e => handleDailyConsumptionChange(parseFloat(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Supplier Lead Time (Days)</label>
                <input
                  type="number"
                  value={formData.leadTimeDays}
                  onChange={e => handleLeadTimeChange(parseInt(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Safety Factor (%)</label>
                <input
                  type="number"
                  value={formData.safetyFactor}
                  onChange={e => handleSafetyFactorChange(parseInt(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-400 mb-1">Safety Stock (Units)</label>
                <input
                  type="number"
                  readOnly
                  value={formData.safetyStock}
                  className="w-full bg-slate-950 border border-amber-500/40 rounded-lg px-3 py-1.5 text-xs text-amber-400 font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-rose-400 mb-1">Reorder Level (Units)</label>
                <input
                  type="number"
                  readOnly
                  value={formData.reorderLevel}
                  className="w-full bg-slate-950 border border-rose-500/40 rounded-lg px-3 py-1.5 text-xs text-rose-400 font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Minimum Stock Level</label>
                <input
                  type="number"
                  value={formData.minStock}
                  onChange={e => setFormData({ ...formData, minStock: parseFloat(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Maximum Stock Level</label>
                <input
                  type="number"
                  value={formData.maxStock}
                  onChange={e => setFormData({ ...formData, maxStock: parseFloat(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Reorder Lot Quantity</label>
                <input
                  type="number"
                  value={formData.reorderQty}
                  onChange={e => setFormData({ ...formData, reorderQty: parseFloat(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Costing & Controls */}
          <div className="pt-2 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3">
              4. Costing Rates & Flags
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Standard / Weighted Rate (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.averageRate}
                  onChange={e => setFormData({ ...formData, averageRate: parseFloat(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {!editingItem && (
                <div>
                  <label className="block text-[11px] font-bold text-emerald-400 mb-1">Initial Opening Quantity</label>
                  <input
                    type="number"
                    value={formData.currentQty}
                    onChange={e => setFormData({ ...formData, currentQty: parseFloat(e.target.value) })}
                    className="w-full bg-slate-800 border border-emerald-500/40 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-bold focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="sm:col-span-3 flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.criticalItem}
                    onChange={e => setFormData({ ...formData, criticalItem: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-800 border-slate-700"
                  />
                  <span>Critical Spare Part (High Priority Alert)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.consumable}
                    onChange={e => setFormData({ ...formData, consumable: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-800 border-slate-700"
                  />
                  <span>Consumable Material</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={e => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-800 border-slate-700"
                  />
                  <span>Active Item</span>
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-950"
            >
              <Save className="w-4 h-4" />
              <span>{editingItem ? 'Update Item Master' : 'Save Item Master'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
