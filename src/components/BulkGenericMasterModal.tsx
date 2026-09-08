import React, { useState, useRef } from 'react';
import { 
  X, UploadCloud, Download, FileSpreadsheet, AlertCircle, CheckCircle2, 
  HelpCircle, Eye, RefreshCw, Table, Plus
} from 'lucide-react';
import { SampleTemplate, downloadCsvTemplate } from '../utils/csvTemplates';

interface BulkGenericMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  template: SampleTemplate;
  onImportData: (rows: Record<string, string>[]) => void;
  entityName: string;
}

export const BulkGenericMasterModal: React.FC<BulkGenericMasterModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  template,
  onImportData,
  entityName
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'guide'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const parseCsvContent = (content: string) => {
    setErrorMsg(null);
    const lines = content.trim().split(/\r?\n/);
    if (lines.length < 2) {
      setErrorMsg('The file or pasted content has no data rows. At least one data row is required.');
      return;
    }

    const headerTokens = parseLine(lines[0]);
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const tokens = parseLine(line);
      const rowObj: Record<string, string> = {};

      headerTokens.forEach((header, idx) => {
        const key = header.toLowerCase().replace(/[^a-z0-9]/g, '');
        rowObj[key] = tokens[idx] || '';
        // Also save standard header text
        rowObj[header] = tokens[idx] || '';
      });

      // Save row index
      rowObj['_rowNumber'] = String(i + 1);
      rows.push(rowObj);
    }

    if (rows.length === 0) {
      setErrorMsg('Could not extract valid records. Please verify delimiter format.');
      return;
    }

    setParsedRows(rows);
  };

  const parseLine = (line: string): string[] => {
    // If tab-separated
    if (!line.includes(',') && line.includes('\t')) {
      return line.split('\t').map(t => t.trim().replace(/^["']|["']$/g, ''));
    }

    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCsvContent(text);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCsvContent(text);
    };
    reader.readAsText(file);
  };

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) return;
    setFileName('Pasted_Clipboard_Data.tsv');
    parseCsvContent(pastedText);
  };

  const handleCommit = () => {
    if (parsedRows.length === 0) return;
    onImportData(parsedRows);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>{title}</span>
              <span className="text-[11px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/30">
                Bulk CSV / Excel
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadCsvTemplate(template)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Download Sample CSV</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6">
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'upload' 
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload CSV File</span>
          </button>

          <button
            onClick={() => setActiveTab('paste')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'paste' 
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Paste from Excel / Sheets</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'guide' 
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Field & Data Types Guide</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === 'upload' && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition ${
                dragActive 
                  ? 'border-emerald-500 bg-emerald-950/20' 
                  : 'border-slate-700 bg-slate-950/40 hover:border-slate-600 hover:bg-slate-950/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.tsv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">
                {fileName ? `Selected: ${fileName}` : `Drag & drop ${entityName} CSV file or click to browse`}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Supports standard CSV with comma delimiters or tab-separated text. Click &quot;Download Sample CSV&quot; for the exact format.
              </p>
            </div>
          )}

          {activeTab === 'paste' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Copy columns from Excel / Google Sheets and paste below:
                  </label>
                  <span className="text-[11px] text-slate-500">First row should be headers</span>
                </div>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={template.headers.join('\t') + '\n' + template.sampleRows[0]?.join('\t')}
                  rows={7}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handlePasteSubmit}
                  disabled={!pastedText.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Eye className="w-4 h-4" />
                  <span>Parse Data</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{entityName} Data Schema</h4>
                  <p className="text-xs text-slate-300 mt-0.5">{template.description}</p>
                </div>
                <button
                  onClick={() => downloadCsvTemplate(template)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample</span>
                </button>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Column Name</th>
                      <th className="p-3">Data Type</th>
                      <th className="p-3 text-center">Required</th>
                      <th className="p-3">Sample Value</th>
                      <th className="p-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {template.dataTypes.map((dt) => (
                      <tr key={dt.column} className="hover:bg-slate-800/30">
                        <td className="p-3 font-mono font-bold text-emerald-400">{dt.column}</td>
                        <td className="p-3 text-slate-300 font-semibold">{dt.type}</td>
                        <td className="p-3 text-center">
                          {dt.required ? (
                            <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded text-[10px] font-bold">Mandatory</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px]">Optional</span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-slate-200">{dt.example}</td>
                        <td className="p-3 text-slate-400 text-[11px]">{dt.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Parsed Rows Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-300">
                  Found <strong className="text-emerald-400">{parsedRows.length}</strong> records ready to import into <strong className="text-slate-100">{entityName}</strong>
                </span>
                <span className="text-[11px] text-slate-500">Previewing first 20 records</span>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-x-auto max-h-56">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold sticky top-0 border-b border-slate-800">
                    <tr>
                      {template.headers.map((h) => (
                        <th key={h} className="p-2.5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {parsedRows.slice(0, 20).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        {template.headers.map((h) => {
                          const key = h.toLowerCase().replace(/[^a-z0-9]/g, '');
                          const val = row[key] || row[h] || '';
                          return (
                            <td key={h} className="p-2.5 text-slate-200 font-mono text-[11px]">
                              {val || <span className="text-slate-600 italic">auto</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleCommit}
            disabled={parsedRows.length === 0}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-950 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Import {parsedRows.length} {entityName} Records</span>
          </button>
        </div>
      </div>
    </div>
  );
};
