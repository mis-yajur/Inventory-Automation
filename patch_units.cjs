const fs = require('fs');
let content = fs.readFileSync('src/views/UnitsView.tsx', 'utf8');

// import useCsvParser
content = content.replace(
  "import { Scale, Plus, UploadCloud } from 'lucide-react';",
  "import { Scale, Plus, UploadCloud, Loader2 } from 'lucide-react';\nimport { useCsvParser } from '../hooks/useCsvParser';"
);

// add hook state
content = content.replace(
  "const [dragActive, setDragActive] = useState(false);",
  "const [dragActive, setDragActive] = useState(false);\n  const { parseCsv, isParsing, error } = useCsvParser();"
);

// update handleFileSelect
content = content.replace(
  /const handleFileSelect = \(e: React.ChangeEvent<HTMLInputElement>\) => {[^}]+}[^}]+};/s,
  `const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      parseCsv<Unit>(file, 'units', (newUnits) => {
        setState(prev => ({
          ...prev,
          units: [...prev.units, ...newUnits]
        }));
        setShowAdd(false);
        setBulkText('');
      });
    }
  };`
);

// update handleDrop
content = content.replace(
  /const handleDrop = \(e: React.DragEvent<HTMLDivElement>\) => {[^}]+}[^}]+}[^}]+};/s,
  `const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      parseCsv<Unit>(file, 'units', (newUnits) => {
        setState(prev => ({
          ...prev,
          units: [...prev.units, ...newUnits]
        }));
        setShowAdd(false);
        setBulkText('');
      });
    }
  };`
);

// Display error or loader if applicable
content = content.replace(
  '<span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Drag & Drop CSV/TXT File</span>',
  '<span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Drag & Drop CSV/TXT File</span>\n{error && <div className="text-rose-500 text-xs mb-2">{error}</div>}'
);

content = content.replace(
  '<UploadCloud className={`w-8 h-8 mb-2 ${dragActive ? \'text-emerald-400 animate-bounce\' : \'text-slate-500\'}`} />',
  '{isParsing ? <Loader2 className="w-8 h-8 mb-2 text-emerald-400 animate-spin" /> : <UploadCloud className={`w-8 h-8 mb-2 ${dragActive ? \'text-emerald-400 animate-bounce\' : \'text-slate-500\'}`} />}'
);


fs.writeFileSync('src/views/UnitsView.tsx', content);
