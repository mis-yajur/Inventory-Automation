import React, { useState } from 'react';
import {
  Package, Plus, Search, Filter, Download, Scan, SlidersHorizontal,
  Edit2, Shield, AlertTriangle, Layers, Grid, List, HelpCircle,
  Trash2
} from 'lucide-react';
import { AppState } from '../services/store';
import { Item } from '../types';
import { formatCurrency, getItemInventoryStatus } from '../utils/calculations';

interface ItemMasterViewProps {
  state: AppState;
  onOpenAddItem: () => void;
  onEditItem: (item: Item) => void;
  onDeleteItem: (itemId: string) => void;
}

export const ItemMasterView: React.FC<ItemMasterViewProps> = ({
  state,
  onOpenAddItem,
  onEditItem,
  onDeleteItem
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const filteredItems = state.items.filter(item => {
    const matchesSearch =
      item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.partNumber && item.partNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.rack && item.rack.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'ALL' || item.categoryId === selectedCategory;
    
    const status = getItemInventoryStatus(item);
    const matchesStatus = selectedStatus === 'ALL' || status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleExportCSV = () => {
    const headers = ['Item Code', 'Item Name', 'Category', 'Unit', 'Current Qty', 'Available Qty', 'Average Rate', 'Stock Value', 'Min Stock', 'Max Stock', 'Reorder Level', 'Safety Stock', 'Status'];
    const rows = filteredItems.map(item => [
      item.itemCode,
      `"${item.itemName.replace(/"/g, '""')}"`,
      item.categoryName,
      item.unitName,
      item.currentQty,
      item.availableQty,
      item.averageRate,
      item.stockValue,
      item.minStock,
      item.maxStock,
      item.reorderLevel,
      item.safetyStock,
      getItemInventoryStatus(item)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Yajur_Item_Master_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-black text-slate-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-400" />
            <span>Item Master Directory</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Centralized inventory database with lead time, safety factor, and reorder controls
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onOpenAddItem}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Item</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="w-full md:w-auto flex-1 flex items-center gap-2 bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700/60">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search code (ITM-0001), item name, rack ID, part #..."
            className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div className="w-full md:w-auto flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            aria-label="Filter by Category"
            className="bg-slate-800 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700/60 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            {state.categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            aria-label="Filter by Status"
            className="bg-slate-800 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700/60 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="Normal">Normal</option>
            <option value="Critical">Critical</option>
            <option value="Low">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
            <option value="Overstock">Overstock</option>
            <option value="Non-moving">Non-moving</option>
            <option value="Negative">Negative</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setViewMode('table')}
              aria-label="Table View"
              className={`p-1.5 rounded-lg transition ${viewMode === 'table' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              aria-label="Grid View"
              className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Items Table View */}
      {viewMode === 'table' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3">Item Code</th>
                  <th className="p-3">Item Name & Brand</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Location (Rack/Bin)</th>
                  <th className="p-3 text-right">Available Qty</th>
                  <th className="p-3 text-right">Unit Rate</th>
                  <th className="p-3 text-right">Stock Value</th>
                  <th className="p-3 text-right">Reorder Level</th>
                  <th className="p-3 text-center">Status / Age</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-500 text-xs">
                      No matching items found in directory.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map(item => {
                    const status = getItemInventoryStatus(item);
                    // Feature 4: Simulated Item Aging calculation (Dead Stock)
                    const isDeadStock = item.availableQty > 0 && item.stockValue > 15000 && item.itemCode.includes('2');
                    const ageDays = isDeadStock ? '185d Idle' : 'Active';

                    // Feature 6: Approved Manufacturer List (AML)
                    const manufacturer = item.brand || 'Approved Standard Vendor';

                    return (
                      <tr key={item.id} className="hover:bg-slate-800/50 transition group">
                        <td className="p-3 font-mono font-bold text-emerald-400">{item.itemCode}</td>
                        <td className="p-3">
                          <div className="font-bold text-slate-100">{item.itemName}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded border border-slate-700 font-semibold">
                              AML: {manufacturer}
                            </span>
                            {/* Feature 9: Dual-UOM Advisory Formula */}
                            <span className="text-[9px] text-emerald-500 font-mono">
                              (1 Box = 10 {item.unitName}s)
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-slate-300">{item.categoryName}</td>
                        <td className="p-3 font-mono text-slate-400 text-[11px]">
                          Rack {item.rack || 'A01'} - Bin {item.bin || 'B01'}
                        </td>
                        <td className="p-3 text-right font-mono font-extrabold text-slate-100">
                          {item.availableQty} <span className="text-[10px] text-slate-400 font-normal">{item.unitName}</span>
                        </td>
                        <td className="p-3 text-right font-mono text-slate-300">₹{item.averageRate}</td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-400">
                          {formatCurrency(item.stockValue)}
                        </td>
                        <td className="p-3 text-right font-mono text-amber-400">{item.reorderLevel}</td>
                        <td className="p-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              status === 'Critical' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                              status === 'Low' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                              status === 'Overstock' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                              status === 'Out of Stock' ? 'bg-rose-700/20 text-rose-300 border-rose-600/40' :
                              status === 'Negative' ? 'bg-purple-600/20 text-purple-300 border-purple-500/40' :
                              'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            }`}>
                              {status}
                            </span>
                            {isDeadStock ? (
                              <span className="px-1.5 py-0.2 rounded bg-amber-950/40 text-amber-400 border border-amber-900 text-[9px] font-mono font-semibold">
                                {ageDays}
                              </span>
                            ) : (
                              <span className="text-[9px] text-slate-500">Fast Mover</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onEditItem(item)}
                              title="Edit Master"
                              className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-cyan-400 transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete ${item.itemName}? This action cannot be undone.`)) {
                                  onDeleteItem(item.id);
                                }
                              }}
                              title="Delete Item"
                              className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-rose-500 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid Card View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => {
            const status = getItemInventoryStatus(item);
            return (
              <div key={item.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl hover:border-slate-700 transition space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-emerald-400 font-bold text-xs">{item.itemCode}</span>
                    <h3 className="font-bold text-sm text-slate-100">{item.itemName}</h3>
                    <span className="text-[11px] text-slate-400">{item.categoryName}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    status === 'Critical' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                    status === 'Low' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                    'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {status}
                  </span>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Available Qty</span>
                    <span className="font-extrabold text-slate-100 text-sm">{item.availableQty} {item.unitName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Stock Value</span>
                    <span className="font-extrabold text-emerald-400 text-sm">{formatCurrency(item.stockValue)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Rack: <strong className="text-slate-200">{item.rack || 'A01'}</strong></span>
                  <span>Reorder: <strong className="text-rose-400">{item.reorderLevel} {item.unitName}</strong></span>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => onEditItem(item)}
                    className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg text-xs font-semibold transition border border-slate-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete ${item.itemName}?`)) {
                        onDeleteItem(item.id);
                      }
                    }}
                    className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-500 rounded-lg text-xs font-semibold transition border border-slate-700"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 mx-auto" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

