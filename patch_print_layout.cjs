const fs = require('fs');

let header = fs.readFileSync('src/components/Header.tsx', 'utf8');
header = header.replace(
  '<header className="h-[57px] bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 sticky top-0 z-40 shrink-0 shadow-sm">',
  '<header className="h-[57px] bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 sticky top-0 z-40 shrink-0 shadow-sm print:hidden">'
);
fs.writeFileSync('src/components/Header.tsx', header);

let sidebar = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');
sidebar = sidebar.replace(
  '<aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-[calc(100vh-57px)] sticky top-[57px] shrink-0 text-slate-700 select-none overflow-y-auto shadow-sm">',
  '<aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-[calc(100vh-57px)] sticky top-[57px] shrink-0 text-slate-700 select-none overflow-y-auto shadow-sm print:hidden">'
);
fs.writeFileSync('src/components/Sidebar.tsx', sidebar);

