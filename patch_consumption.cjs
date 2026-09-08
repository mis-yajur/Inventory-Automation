const fs = require('fs');
let content = fs.readFileSync('src/views/ConsumptionView.tsx', 'utf8');

content = content.replace("import { AppState } from '../services/store';", "import { AppState, getMonthlyConsumption } from '../services/store';\nimport { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';");

const chartBlock = `
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
`;

content = content.replace('<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">', chartBlock);

fs.writeFileSync('src/views/ConsumptionView.tsx', content);
