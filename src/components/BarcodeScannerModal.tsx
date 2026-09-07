import React, { useState } from 'react';
import { Camera, X, Scan, CheckCircle2, AlertCircle, Package } from 'lucide-react';
import { AppState } from '../services/store';
import { Item } from '../types';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  onSelectItem: (item: Item) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  state,
  onSelectItem
}) => {
  const [manualCode, setManualCode] = useState('');
  const [scannedResult, setScannedResult] = useState<Item | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleScanSimulate = (item: Item) => {
    setScannedResult(item);
    setErrorMsg('');
  };

  const handleManualSearch = () => {
    const code = manualCode.trim().toLowerCase();
    if (!code) return;

    const found = state.items.find(i =>
      i.itemCode.toLowerCase() === code ||
      (i.barcode && i.barcode.toLowerCase() === code) ||
      i.itemName.toLowerCase().includes(code)
    );

    if (found) {
      setScannedResult(found);
      setErrorMsg('');
    } else {
      setScannedResult(null);
      setErrorMsg(`No item found matching code or barcode: "${manualCode}"`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2">
            <Scan className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-100">Barcode & QR Code Scanner</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close barcode scanner modal"
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder simulation */}
        <div className="p-6 space-y-4">
          <div className="relative aspect-video bg-slate-950 rounded-xl border-2 border-dashed border-emerald-500/50 overflow-hidden flex flex-col items-center justify-center p-4 text-center group">
            {/* Red Laser Scanner Line */}
            <div className="absolute inset-x-0 h-0.5 bg-rose-500 shadow-[0_0_12px_#f43f5e] animate-pulse top-1/2 -translate-y-1/2" />

            <Camera className="w-8 h-8 text-slate-600 mb-2" />
            <p className="text-xs text-slate-400 font-medium">Position barcode inside camera viewfinder</p>
            <p className="text-[10px] text-slate-500 mt-1">Camera Feed Active • Auto Focus Enabled</p>

            {/* Quick barcode simulation buttons */}
            <div className="mt-3 flex flex-wrap justify-center gap-1.5 z-10">
              <span className="text-[10px] font-semibold text-slate-400 w-full mb-1">Simulate Scan:</span>
              {state.items.slice(0, 4).map(item => (
                <button
                  key={item.id}
                  onClick={() => handleScanSimulate(item)}
                  className="px-2 py-1 text-[10px] font-mono bg-slate-800/90 hover:bg-emerald-600 text-slate-300 hover:text-white rounded border border-slate-700 transition"
                >
                  {item.itemCode}
                </button>
              ))}
            </div>
          </div>

          {/* Manual Barcode Input Fallback */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
              placeholder="Or enter barcode / item code manually..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleManualSearch}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition"
            >
              Lookup
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Scanned Result Card */}
          {scannedResult && (
            <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-xl space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Item Code Detected!</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Rack: {scannedResult.rack || 'A01'}</span>
              </div>

              <div className="flex items-center gap-3 bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <Package className="w-8 h-8 text-emerald-400 shrink-0" />
                <div className="flex-1">
                  <div className="font-bold text-sm text-slate-100">{scannedResult.itemName}</div>
                  <div className="text-xs font-mono text-emerald-400">{scannedResult.itemCode} • {scannedResult.categoryName}</div>
                  <div className="text-[11px] text-slate-400 mt-1">Current Stock: <strong className="text-slate-200">{scannedResult.currentQty} {scannedResult.unitName}</strong> (₹{scannedResult.averageRate}/unit)</div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onSelectItem(scannedResult);
                    onClose();
                  }}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-lg shadow-emerald-950"
                >
                  Open Item Master Card
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
