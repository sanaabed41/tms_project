import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Users, Search, ToggleLeft, ToggleRight, Trash2, KeyRound,
  AlertCircle, CheckCircle, Building2, X,
} from 'lucide-react';

const API = 'http://localhost:3000';
const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-violet-100 text-violet-700',
  DISPATCHER: 'bg-blue-100 text-blue-700',
  DRIVER: 'bg-amber-100 text-amber-700',
  ACCOUNTANT: 'bg-emerald-100 text-emerald-700',
  CLIENT: 'bg-slate-100 text-slate-600',
};

const ROLES = ['ADMIN', 'DISPATCHER', 'DRIVER', 'ACCOUNTANT', 'CLIENT'];

type UserRow = {
  id: number; email: string; firstName: string; lastName: string;
  phone?: string; role: string; isActive: boolean;
  companyId: number | null; companyName: string | null; createdAt: string;
};

export default function SuperAdminUsersPage() {
  const [params, setParams] = useSearchParams();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState(params.get('role') ?? '');
  const [isActive, setIsActive] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [resetModal, setResetModal] = useState<UserRow | null>(null);
  const [newPwd, setNewPwd] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  function toast_(msg: string, type: 'success' | 'error') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  const load = useCallback(async () => {
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    if (role) p.set('role', role);
    if (isActive) p.set('isActive', isActive);
    const res = await fetch(`${API}/super-admin/users?${p}`, { headers: h() });
    const d = await res.json();
    setUsers(d.users ?? []);
    setTotal(d.total ?? 0);
  }, [search, role, isActive]);

  useEffect(() => { load(); }, [load]);

  // Sync role from URL params on mount
  useEffect(() => {
    const r = params.get('role');
    if (r) setRole(r);
  }, []);

  async function handleToggle(id: number) {
    const res = await fetch(`${API}/super-admin/users/${id}/toggle`, { method: 'PATCH', headers: h() });
    const d = await res.json();
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, isActive: d.isActive } : u));
      toast_(d.message, 'success');
    } else toast_(d.message ?? 'Erreur', 'error');
  }

  async function handleDelete(u: UserRow) {
    if (!confirm(`Supprimer "${u.email}" ?`)) return;
    const res = await fetch(`${API}/super-admin/users/${u.id}`, { method: 'DELETE', headers: h() });
    const d = await res.json();
    if (res.ok) { setUsers((prev) => prev.filter((x) => x.id !== u.id)); setTotal((t) => t - 1); toast_(d.message, 'success'); }
    else toast_(d.message ?? 'Erreur', 'error');
  }

  async function handleResetPwd(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!resetModal) return;
    if (newPwd.length < 6) { setPwdError('Minimum 6 caractères'); return; }
    setPwdError(''); setPwdLoading(true);
    try {
      const res = await fetch(`${API}/super-admin/users/${resetModal.id}/reset-password`, {
        method: 'POST', headers: h(), body: JSON.stringify({ newPassword: newPwd }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message);
      setResetModal(null); setNewPwd('');
      toast_('Mot de passe réinitialisé', 'success');
    } catch (err: any) { setPwdError(err.message); }
    finally { setPwdLoading(false); }
  }

  return (
    <div className="space-y-5">
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'} text-white`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Utilisateurs</h1>
        <p className="text-slate-500 text-sm mt-0.5">{total} utilisateur(s) sur la plateforme</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Email, prénom, nom…"
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
          />
        </div>
        <select value={role} onChange={(e) => setRole(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-700">
          <option value="">Tous les rôles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={isActive} onChange={(e) => setIsActive(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-700">
          <option value="">Tous les statuts</option>
          <option value="true">Actifs</option>
          <option value="false">Inactifs</option>
        </select>
        {(search || role || isActive) && (
          <button onClick={() => { setSearch(''); setRole(''); setIsActive(''); }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl bg-white">
            <X className="w-4 h-4" /> Réinitialiser
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {users.length === 0 ? (
          <div className="py-20 text-center">
            <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  {['Utilisateur', 'Rôle', 'Entreprise', 'Statut', 'Actions'].map((col) => (
                    <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">
                          {(u.firstName?.[0] ?? u.email[0]).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-700">
                            {u.firstName ? `${u.firstName} ${u.lastName ?? ''}` : '—'}
                          </p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role] ?? 'bg-slate-100 text-slate-600'}`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      {u.companyId ? (
                        <Link to={`/super-admin/companies/${u.companyId}`}
                          className="flex items-center gap-1.5 text-slate-600 hover:text-violet-600 transition-colors">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs">{u.companyName ?? `#${u.companyId}`}</span>
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-400 italic">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                        {u.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleToggle(u.id)}
                          className={`p-1.5 rounded-lg transition-all ${u.isActive ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                          title={u.isActive ? 'Désactiver' : 'Activer'}>
                          {u.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                        <button onClick={() => { setResetModal(u); setNewPwd(''); setPwdError(''); }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Réinitialiser le mot de passe">
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(u)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Supprimer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reset Password Modal */}
      {resetModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="font-semibold text-slate-800">Réinitialiser le mot de passe</h3>
                <p className="text-xs text-slate-400 mt-0.5">{resetModal.email}</p>
              </div>
              <button onClick={() => setResetModal(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleResetPwd} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nouveau mot de passe *</label>
                <input
                  required type="password" value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  placeholder="Minimum 6 caractères"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              {pwdError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />{pwdError}
                </div>
              )}
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setResetModal(null)} className="px-4 py-2 text-sm text-slate-600">Annuler</button>
                <button type="submit" disabled={pwdLoading} className="px-5 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl">
                  {pwdLoading ? 'Réinitialisation…' : 'Confirmer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
