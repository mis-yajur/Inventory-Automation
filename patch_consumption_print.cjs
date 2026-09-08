const fs = require('fs');
let content = fs.readFileSync('src/views/ConsumptionView.tsx', 'utf8');

content = content.replace(
  "import { TrendingUp, BarChart2, DollarSign } from 'lucide-react';",
  "import { TrendingUp, BarChart2, DollarSign, Printer } from 'lucide-react';"
);

content = content.replace(
  `        <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold">Total Issued Material Expense:</span>
          <span className="text-sm font-black text-cyan-400 font-mono">{formatCurrency(totalConsumptionValue)}</span>
        </div>`,
  `        <div className="flex items-center gap-4">
          <button onClick={() => window.print()} className="px-3 py-2 bg-slate-900 border border-slate-700 hover:border-cyan-500 rounded-lg text-xs font-bold text-slate-300 hover:text-cyan-400 transition flex items-center gap-2 print:hidden">
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print Report</span>
          </button>
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">Total Issued Material Expense:</span>
            <span className="text-sm font-black text-cyan-400 font-mono">{formatCurrency(totalConsumptionValue)}</span>
          </div>
        </div>`
);

fs.writeFileSync('src/views/ConsumptionView.tsx', content);
