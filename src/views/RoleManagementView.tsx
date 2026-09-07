import React, { useState } from 'react';
import { UserCheck, Shield, Key, Plus, CheckCircle2 } from 'lucide-react';
import { AppState, saveStateToStorage } from '../services/store';
import { UserRole } from '../types';

interface RoleManagementViewProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const RoleManagementView: React.FC<RoleManagementViewProps> = ({ state, setState }) => {
  const [showAddUser, setShowAddUser] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('STORE_INCHARGE');
  const [userDept, setUserDept] = useState(state.departments[0]?.id || 'dep-1');

  const handleSwitchUser = (userId: string) => {
    const target = state.users.find(u => u.id === userId);
    if (!target) return;

    setState(prev => {
      const newState = {
        ...prev,
        activeUser: target
      };
      saveStateToStorage(newState);
      return newState;
    });
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !userEmail) return;

    const newUser = {
      id: `usr-${Date.now()}`,
      name: userName,
      email: userEmail,
      role: userRole,
      departmentId: userDept,
      active: true
    };

    setState(prev => {
      const newState = {
        ...prev,
        users: [...prev.users, newUser]
      };
      saveStateToStorage(newState);
      return newState;
    });

    setUserName('');
    setUserEmail('');
    setShowAddUser(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-slate-100 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <span>Role-Based Access Control (RBAC) & User Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage user profiles, assign granular permissions, and test active user role views</p>
        </div>

        <button
          onClick={() => setShowAddUser(!showAddUser)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950"
        >
          <Plus className="w-4 h-4" />
          <span>Add System User</span>
        </button>
      </div>

      {showAddUser && (
        <form onSubmit={handleCreateUser} className="p-5 bg-slate-900 border border-slate-700 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Create New User Account</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="text"
              required
              placeholder="Full Name *"
              value={userName}
              onChange={e => setUserName(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
            />
            <input
              type="email"
              required
              placeholder="Email Address *"
              value={userEmail}
              onChange={e => setUserEmail(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
            />
            <select
              value={userRole}
              onChange={e => setUserRole(e.target.value as UserRole)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-bold"
            >
              <option value="PLANT_MANAGER">Plant Manager (Full Access)</option>
              <option value="STORE_INCHARGE">Store Incharge (GRN, MIN, Transfers)</option>
              <option value="MAINTENANCE_ENGINEER">Maintenance Engineer (Issue Requests)</option>
              <option value="FINANCE_AUDITOR">Finance Auditor (Read-only Reports)</option>
            </select>
            <select
              value={userDept}
              onChange={e => setUserDept(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
            >
              {state.departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button type="button" onClick={() => setShowAddUser(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs">Cancel</button>
            <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white rounded text-xs font-bold">Save User</button>
          </div>
        </form>
      )}

      {/* User Switcher Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {state.users.map(user => {
          const isActive = state.activeUser.id === user.id;
          return (
            <div
              key={user.id}
              className={`p-4 rounded-2xl border transition space-y-3 ${
                isActive
                  ? 'bg-slate-900 border-emerald-500 shadow-xl shadow-emerald-950/40 ring-1 ring-emerald-500/50'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                  user.role === 'PLANT_MANAGER' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                  user.role === 'STORE_INCHARGE' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                  user.role === 'MAINTENANCE_ENGINEER' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' :
                  'bg-amber-500/20 text-amber-400 border-amber-500/30'
                }`}>
                  {user.role}
                </span>
                {isActive && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active Session
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-bold text-sm text-slate-100">{user.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
              </div>

              {!isActive && (
                <button
                  onClick={() => handleSwitchUser(user.id)}
                  className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition"
                >
                  Switch Active User Context
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
