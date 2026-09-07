import React from 'react';
import { ShieldCheck, UserCheck, Lock } from 'lucide-react';
import { AppState } from '../services/store';

interface AuditTrailViewProps {
  state: AppState;
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({ state }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Security & System Audit Trail</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Immutable user action records, role-based permission changes, and state modifications</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">System Audit Logs ({state.auditLogs.length} events)</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">User Name</th>
                <th className="p-3">Module</th>
                <th className="p-3">Action</th>
                <th className="p-3">Record Ref</th>
                <th className="p-3">Previous Value</th>
                <th className="p-3">New Value</th>
                <th className="p-3">Reason / Justification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {state.auditLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-800/50">
                  <td className="p-3 font-mono text-slate-400">{log.timestamp.split('T')[0]} {log.time}</td>
                  <td className="p-3 font-bold text-slate-200">{log.userName}</td>
                  <td className="p-3 text-emerald-400 font-semibold">{log.module}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-bold text-[10px] border border-slate-700">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-300">{log.record}</td>
                  <td className="p-3 text-slate-500 font-mono">{log.previousValue}</td>
                  <td className="p-3 text-slate-200 font-mono font-bold">{log.newValue}</td>
                  <td className="p-3 text-slate-400">{log.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
