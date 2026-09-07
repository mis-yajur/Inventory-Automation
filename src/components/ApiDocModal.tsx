import React, { useState } from 'react';
import { X, Code, Terminal, Check, Copy, Server, Database } from 'lucide-react';

interface ApiDocModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiDocModal: React.FC<ApiDocModalProps> = ({ isOpen, onClose }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const codeSnippets = [
    {
      title: 'Get Current Stock Register (GET /api/v1/stock/current)',
      code: `curl -X GET "https://ims-api.yajurfibres.com/v1/stock/current?storeId=str-1" \\
  -H "Authorization: Bearer yajur_sec_89f3a8b2" \\
  -H "Accept: application/json"`
    },
    {
      title: 'Post Material Issue Note (POST /api/v1/material-issue)',
      code: `curl -X POST "https://ims-api.yajurfibres.com/v1/material-issue" \\
  -H "Authorization: Bearer yajur_sec_89f3a8b2" \\
  -H "Content-Type: application/json" \\
  -d '{
    "issueNo": "MIN-2026-089",
    "storeId": "str-1",
    "departmentId": "dep-1",
    "issuedBy": "M. Ghosh",
    "items": [
      { "itemCode": "ITM-0001", "qty": 5, "rate": 1610 }
    ]
  }'`
    },
    {
      title: 'Stock Ledger Query (GET /api/v1/ledger)',
      code: `curl -X GET "https://ims-api.yajurfibres.com/v1/ledger?itemCode=ITM-0001&startDate=2026-09-01" \\
  -H "Authorization: Bearer yajur_sec_89f3a8b2"`
    }
  ];

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-sm text-slate-100">IMS AUTOMATION Developer REST API Specs</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close API documentation modal"
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300">
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center gap-2 font-bold text-cyan-400 text-sm">
              <Server className="w-4 h-4" /> Endpoint Base URL: <code className="font-mono text-slate-100">https://ims-api.yajurfibres.com/v1</code>
            </div>
            <p className="text-slate-400">
              Integrate ERP, SCADA, or barcode scanners directly with IMS Yajur. All endpoints accept JSON payloads and enforce strict role validation.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-slate-100 uppercase tracking-wider text-[11px]">Integration Endpoints</h4>
            {codeSnippets.map((snippet, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">{snippet.title}</span>
                  <button
                    onClick={() => handleCopy(snippet.code, idx)}
                    className="flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
                  >
                    {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedIndex === idx ? 'Copied' : 'Copy cURL'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-slate-300 overflow-x-auto">
                  {snippet.code}
                </pre>
              </div>
            ))}
          </div>

          <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-1">
            <div className="font-bold text-emerald-400 flex items-center gap-1.5">
              <Database className="w-4 h-4" /> Real-time Offline Synchronization
            </div>
            <p className="text-slate-400">
              When network connectivity drops, all client transactions queue locally inside indexed LocalStorage and auto-flush to the backend server upon reconnect.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
