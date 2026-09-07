import React, { useState } from 'react';
import { Cpu, Power, CheckCircle2, AlertCircle, Plus } from 'lucide-react';
import { AppState, saveStateToStorage } from '../services/store';

interface PluginArchitectureViewProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const PluginArchitectureView: React.FC<PluginArchitectureViewProps> = ({ state, setState }) => {
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [pluginName, setPluginName] = useState('');
  const [pluginDesc, setPluginDesc] = useState('');

  const togglePlugin = (pluginId: string) => {
    setState(prev => {
      const updated = prev.plugins.map(p =>
        p.id === pluginId ? { ...p, enabled: !p.enabled } : p
      );
      const newState = { ...prev, plugins: updated };
      saveStateToStorage(newState);
      return newState;
    });
  };

  const handleRegisterPlugin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pluginName) return;

    const newPlugin = {
      id: `plg-${Date.now()}`,
      name: pluginName,
      version: '1.0.0',
      description: pluginDesc || 'Custom enterprise modular extension',
      enabled: true,
      author: 'In-House Automation'
    };

    setState(prev => {
      const newState = {
        ...prev,
        plugins: [...prev.plugins, newPlugin]
      };
      saveStateToStorage(newState);
      return newState;
    });

    setPluginName('');
    setPluginDesc('');
    setShowAddCustom(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <span>Modular Plugin Architecture Framework</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Extend IMS AUTOMATION Yajur with hot-swappable plugins, ERP connectors, and IoT device drivers</p>
        </div>

        <button
          onClick={() => setShowAddCustom(!showAddCustom)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950"
        >
          <Plus className="w-4 h-4" />
          <span>Register Custom Plugin</span>
        </button>
      </div>

      {showAddCustom && (
        <form onSubmit={handleRegisterPlugin} className="p-5 bg-slate-900 border border-slate-700 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Custom Plugin Integration Loader</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              placeholder="Plugin Name (e.g. Weighbridge Automation Driver)"
              value={pluginName}
              onChange={e => setPluginName(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
            />
            <input
              type="text"
              placeholder="Description"
              value={pluginDesc}
              onChange={e => setPluginDesc(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button type="button" onClick={() => setShowAddCustom(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs">Cancel</button>
            <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white rounded text-xs font-bold">Mount Plugin</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {state.plugins.map(plg => (
          <div key={plg.id} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-100">{plg.name}</span>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded">v{plg.version}</span>
              </div>

              <button
                onClick={() => togglePlugin(plg.id)}
                className={`p-2 rounded-xl transition ${
                  plg.enabled
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}
              >
                <Power className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">{plg.description}</p>

            <div className="flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t border-slate-800">
              <span>Author: <strong className="text-slate-400">{plg.author}</strong></span>
              <span className={`font-bold ${plg.enabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                {plg.enabled ? '● Active Hook Loaded' : '○ Disabled'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
