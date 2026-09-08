const fs = require('fs');
let content = fs.readFileSync('src/views/DashboardView.tsx', 'utf8');

content = content.replace(
  "import { AppState } from '../services/store';",
  "import { AppState, getMonthlyStock } from '../services/store';"
);

const tableBlock = `
      {/* Month Wise Stock Summary Table */}
      <div className="mt-6 p-5 bg-slate-900 border border-slate-800 rounded-2xl">
        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider mb-4">Month Wise Stock Valuation</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-400">
                <th className="py-2 px-3 font-semibold">Month</th>
                <th className="py-2 px-3 font-semibold text-right">Total Quantity</th>
                <th className="py-2 px-3 font-semibold text-right">Closing Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {getMonthlyStock(state).length > 0 ? (
                getMonthlyStock(state).map(row => (
                  <tr key={row.month} className="hover:bg-slate-850/50 transition">
                    <td className="py-2 px-3 font-semibold text-slate-200">{row.month}</td>
                    <td className="py-2 px-3 text-right font-mono text-cyan-400">{row.totalQty.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-400 font-bold">{formatCurrency(row.totalValue)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-xs text-slate-500">No monthly ledger history available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
`;

content = content.replace("    </div>\n  );\n};", tableBlock);

fs.writeFileSync('src/views/DashboardView.tsx', content);
