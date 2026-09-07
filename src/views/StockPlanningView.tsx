import React, { useState } from 'react';
import { Settings, Save, CheckCircle2 } from 'lucide-react';
import { AppState, saveStateToStorage } from '../services/store';

interface StockPlanningViewProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const StockPlanningView: React.FC<StockPlanningViewProps> = ({ state, setState }) => {
  const [safetyFactor, setSafetyFactor] = useState(state.settings.safetyStockFactor);
  const [negStock, setNegStock] = useState(state.settings.enableNegativeStock);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Recalculate reorder levels across all items with new safety factor %
    const updatedItems = state.items.map(item => {
      const leadConsumption = item.avgDailyConsumption * item.leadTimeDays;
      const newSafety = Math.ceil(leadConsumption * (safetyFactor / 100));
      const newReorderLevel = leadConsumption + newSafety;

      return {
        ...item,
        safetyStock: newSafety,
        reorderLevel: newReorderLevel,
        updatedAt: new Date().toISOString().split('T')[0]
      };
    });

    setState(prev => {
      const newState = {
        ...prev,
        items: updatedItems,
        settings: {
          ...prev.settings,
          safetyStockFactor: safetyFactor,
          enableNegativeStock: negStock
        }
      };
      saveStateToStorage(newState);
      return newState;
    });

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            <span>Inventory Policy & Safety Buffer Parameters</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Configure global safety factors, lead time buffers, and stock controls</p>
        </div>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5" />
          <span>Inventory policy updated! Reorder levels recalculated for all SKUs.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-6 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1">
              Safety Stock Buffer Factor ({safetyFactor}%)
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              Percentage multiplier applied to lead-time consumption to insulate plant from supplier delivery delays.
            </p>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={safetyFactor}
              onChange={e => setSafetyFactor(parseInt(e.target.value))}
              className="w-full accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>10% (Lean Buffer)</span>
              <span>50% (Standard Industrial)</span>
              <span>100% (High Resilience)</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={negStock}
                onChange={e => setNegStock(e.target.checked)}
                className="w-5 h-5 text-emerald-500 rounded bg-slate-800 border-slate-700"
              />
              <div>
                <span className="text-xs font-bold text-slate-200 block">Allow Negative Stock Issuance</span>
                <span className="text-[11px] text-slate-400">If unchecked, MIN issues will be blocked if stock quantity is insufficient.</span>
              </div>
            </label>
          </div>
        </div>

        <button type="submit" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950">
          <Save className="w-4 h-4" />
          <span>Apply Parameters & Recalculate SKUs</span>
        </button>
      </form>
    </div>
  );
};
