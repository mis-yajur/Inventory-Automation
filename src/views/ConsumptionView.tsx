import React from 'react';
import { TrendingUp, BarChart2, DollarSign, Printer } from 'lucide-react';
import { AppState, getMonthlyConsumption } from '../services/store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../utils/calculations';

interface ConsumptionViewProps {
  state: AppState;
}

export const ConsumptionView: React.FC<ConsumptionViewProps> = ({ state }) => {
  // Aggregate department-wise issue consumption value
  const deptConsumptionMap: Record<string, number> = {};

  state.ledger
    .filter(l => l.transactionType === 'ISSUE')
    .forEach(l => {
      const deptName = l.departmentName || 'General Plant Maintenance';
      deptConsumptionMap[deptName] = (deptConsumptionMap[deptName] || 0) + l.outwardValue;
    });

  const totalConsumptionValue = Object.values(deptConsumptionMap).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <span>Consumption & Outward Analytics</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Track departmental material consumption trends, high-consumption SKUs, and cost centre expenses</p>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => window.print()} className="px-3 py-2 bg-slate-900 border border-slate-700 hover:border-cyan-500 rounded-lg text-xs font-bold text-slate-300 hover:text-cyan-400 transition flex items-center gap-2 print:hidden">
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print Report</span>
          </button>
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">Total Issued Material Expense:</span>
            <span className="text-sm font-black text-cyan-400 font-mono">{formatCurrency(totalConsumptionValue)}</span>
          </div>
        </div>
      </div>

      
      {/* Monthly Consumption Chart */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Monthly Consumption Trend</h3>
        <div className="h-64 w-full">
          {getMonthlyConsumption(state).length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getMonthlyConsumption(state)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                />
                <Bar dataKey="value" name="Value" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs">No consumption data available to chart</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Department Consumption Card */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Departmental Consumption Cost</h3>
          <div className="space-y-3">
            {Object.keys(deptConsumptionMap).length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No outward issues recorded yet.</p>
            ) : (
              Object.keys(deptConsumptionMap).map(dept => {
                const val = deptConsumptionMap[dept];
                const pct = totalConsumptionValue > 0 ? (val / totalConsumptionValue) * 100 : 0;
                return (
                  <div key={dept} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-200">{dept}</span>
                      <span className="font-mono font-bold text-cyan-400">{formatCurrency(val)} ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top Consumed Items */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">High Velocity Consumables Rate</h3>
          <div className="divide-y divide-slate-800/80">
            {state.items
              .slice()
              .sort((a, b) => b.avgMonthlyConsumption - a.avgMonthlyConsumption)
              .slice(0, 5)
              .map(item => (
                <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono text-emerald-400 font-bold">{item.itemCode}</span>
                    <span className="font-bold text-slate-200 block">{item.itemName}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-slate-100 font-bold">{item.avgMonthlyConsumption} {item.unitName}/mo</span>
                    <span className="text-[10px] text-slate-400 block">Daily: {item.avgDailyConsumption} {item.unitName}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
