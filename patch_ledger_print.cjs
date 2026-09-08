const fs = require('fs');
let content = fs.readFileSync('src/views/StockLedgerView.tsx', 'utf8');

// Add Printer icon import
content = content.replace(
  "import { BookOpen, Search, Download, Calendar, Filter } from 'lucide-react';",
  "import { BookOpen, Search, Download, Calendar, Filter, Printer } from 'lucide-react';"
);

// Add Print button next to Export button
content = content.replace(
  `          <button onClick={handleExportCSV} className="px-3 py-2 bg-slate-900 border border-slate-700 hover:border-emerald-500 rounded-lg text-xs font-bold text-slate-300 hover:text-emerald-400 transition flex items-center gap-2">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>`,
  `          <button onClick={() => window.print()} className="px-3 py-2 bg-slate-900 border border-slate-700 hover:border-cyan-500 rounded-lg text-xs font-bold text-slate-300 hover:text-cyan-400 transition flex items-center gap-2 print:hidden">
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print Report</span>
          </button>
          <button onClick={handleExportCSV} className="px-3 py-2 bg-slate-900 border border-slate-700 hover:border-emerald-500 rounded-lg text-xs font-bold text-slate-300 hover:text-emerald-400 transition flex items-center gap-2 print:hidden">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>`
);

// Ensure the main container doesn't overflow when printing
content = content.replace(
  '<div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[calc(100vh-200px)]">',
  '<div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[calc(100vh-200px)] print:h-auto print:block">'
);

content = content.replace(
  '<div className="overflow-x-auto flex-1">',
  '<div className="overflow-x-auto flex-1 print:overflow-visible">'
);

fs.writeFileSync('src/views/StockLedgerView.tsx', content);
