import React, { useState, useEffect } from 'react';
import { Search, X, Package, ArrowDownLeft, ArrowUpRight, ArrowRightLeft, Building2 } from 'lucide-react';
import { AppState } from '../services/store';
import { Item } from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  onSelectItem: (item: Item) => void;
  onNavigateTab: (tab: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  state,
  onSelectItem,
  onNavigateTab
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open triggered by parent window listener
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const matchedItems = q ? state.items.filter(i =>
    i.itemCode.toLowerCase().includes(q) ||
    i.itemName.toLowerCase().includes(q) ||
    (i.partNumber && i.partNumber.toLowerCase().includes(q)) ||
    i.categoryName.toLowerCase().includes(q) ||
    (i.rack && i.rack.toLowerCase().includes(q))
  ) : state.items.slice(0, 5);

  const matchedLedger = q ? state.ledger.filter(l =>
    l.referenceNumber.toLowerCase().includes(q) ||
    l.itemCode.toLowerCase().includes(q) ||
    l.itemName.toLowerCase().includes(q)
  ).slice(0, 5) : [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center pt-16 px-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] text-slate-100">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-900/90">
          <Search className="w-5 h-5 text-emerald-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type item name, code (e.g. ITM-0001), part #, GRN, MIN, rack..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            aria-label="Close search modal"
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2">
          {/* Items Section */}
          <div>
            <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase flex items-center justify-between">
              <span>Items ({matchedItems.length})</span>
              <span className="text-emerald-400">Press item to inspect</span>
            </div>
            {matchedItems.length === 0 ? (
              <div className="p-4 text-xs text-slate-500 text-center">No matching items found</div>
            ) : (
              matchedItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectItem(item);
                    onClose();
                  }}
                  className="p-3 rounded-xl hover:bg-slate-800/80 cursor-pointer transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-emerald-400">{item.itemCode}</span>
                        <span className="text-xs font-semibold text-slate-200">{item.itemName}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {item.categoryName}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-3">
                        <span>Rack: <strong className="text-slate-300">{item.rack || 'A01'}</strong> - Bin: <strong className="text-slate-300">{item.bin || 'B01'}</strong></span>
                        <span>• Unit: {item.unitName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-200">{item.currentQty} {item.unitName}</div>
                    <div className="text-[10px] text-slate-400">Rate: ₹{item.averageRate}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Ledger / Document Entries */}
          {matchedLedger.length > 0 && (
            <div className="pt-2">
              <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                Stock Ledger Transactions ({matchedLedger.length})
              </div>
              {matchedLedger.map(entry => (
                <div
                  key={entry.id}
                  onClick={() => {
                    onNavigateTab('reports');
                    onClose();
                  }}
                  className="p-3 rounded-xl hover:bg-slate-800/80 cursor-pointer transition flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                      <ArrowDownLeft className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-mono font-bold text-cyan-400">{entry.referenceNumber}</div>
                      <div className="text-[11px] text-slate-300">{entry.itemCode} - {entry.itemName}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-semibold text-slate-300">{entry.transactionType}</div>
                    <div className="text-[10px] text-slate-500">{entry.transactionDate}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-950/60 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Search shortcut: <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-300">⌘K</kbd></span>
          <span>Press <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-300">ESC</kbd> to exit</span>
        </div>
      </div>
    </div>
  );
};
