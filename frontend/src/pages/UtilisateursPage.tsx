import { useState, useEffect, useCallback } from 'react';
import {
  Users, UserPlus, Search, Mail, Phone,
  ShieldCheck, Truck, BookOpen, Calculator,
  User, ToggleLeft, ToggleRight, Trash2, KeyRound, X, ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:3000';

type UserRole = 'ADMIN' | 'DISPATCHER' | 'ACCOUNTANT' | 'DRIVER' | 'CLIENT';

interface AppUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Admin',
  DISPATCHER: 'Dispatcher',
  ACCOUNTANT: 'Comptable',
  DRIVER: 'Chauffeur',
  CLIENT: 'Client',
};

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: 'bg-violet-100 text-violet-700',
  DISPATCHER: 'bg-blue-100 text-blue-700',
  ACCOUNTANT: 'bg-emerald-100 text-emerald-700',
  DRIVER: 'bg-amber-100 text-amber-700',
  CLIENT: 'bg-slate-100 text-slate-700',
};

const ROLE_ICONS: Record<UserRole, React.ElementType> = {
  ADMIN: ShieldCheck,
  DISPATCHER: BookOpen,
  ACCOUNTANT: Calculator,
  DRIVER: Truck,
  CLIENT: User,
};

const INVITABLE_ROLES: UserRole[] = ['DISPATCHER', 'ACCOUNTANT', 'DRIVER', 'CLIENT'];

function RoleBadge({ role }: { role: UserRole }) {
  const Icon = ROLE_ICONS[role];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[role]}`}>
      <Icon className="w-3 h-3" />
      {ROLE_LABELS[role]}
    </span>
  );
}

export default function UtilisateursPage() {
  const { token, user: authUser } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('');

  // Modals
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState<AppUser | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<AppUser | null>(null);

  // Forms
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'DRIVER' as UserRole });
  const [createForm, setCreateForm] = useState({
    firstName: '', lastName: '', email: '', password: '', phone: '', role: 'DRIVER' as UserRole,
  });
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.set('role', roleFilter);
      if (activeFilter !== '') params.set('isActive', activeFilter);
      const res = await fetch(`${API}/admin/users?${params}`, { headers });
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [token, roleFilter, activeFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  async function toggle(u: AppUser) {
    const endpoint = u.isActive ? 'deactivate' : 'activate';
    await fetch(`${API}/admin/users/${u.id}/${endpoint}`, { method: 'PATCH', headers });
    load();
  }

  async function deleteUser() {
    if (!showDeleteConfirm) return;
    await fetch(`${API}/admin/users/${showDeleteConfirm.id}`, { method: 'DELETE', headers });
    setShowDeleteConfirm(null);
    load();
  }

  async function resetPassword() {
    if (!showResetModal || !newPassword.trim()) return;
    setSubmitting(true);
    await fetch(`${API}/admin/users/${showResetModal.id}/reset-password`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ newPassword }),
    });
    setNewPassword('');
    setShowResetModal(null);
    setSubmitting(false);
  }

  async function sendInvite() {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API}/admin/invite`, {
        method: 'POST',
        headers,
        body: JSON.stringify(inviteForm),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.message ?? 'Erreur');
        return;
      }
      setShowInviteModal(false);
      setInviteForm({ email: '', role: 'DRIVER' });
    } finally {
      setSubmitting(false);
    }
  }

  async function createUser() {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API}/admin/users`, {
        method: 'POST',
        headers,
        body: JSON.stringify(createForm),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.message ?? 'Erreur');
        return;
      }
      setShowCreateModal(false);
      setCreateForm({ firstName: '', lastName: '', email: '', password: '', phone: '', role: 'DRIVER' });
      load();
    } finally {
      setSubmitting(false);
    }
  }

  const stats = {
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    drivers: users.filter((u) => u.role === 'DRIVER').length,
    dispatchers: users.filter((u) => u.role === 'DISPATCHER').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Utilisateurs</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gérez les membres de votre entreprise</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowInviteModal(true); setError(''); }}
            className="flex items-center gap-2 px-4 py-2 border border-blue-200 text-blue-700 bg-blue-50 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors"
          >
            <Mail className="w-4 h-4" />
            Inviter par email
          </button>
          <button
            onClick={() => { setShowCreateModal(true); setError(''); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Créer un utilisateur
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
          { label: 'Actifs', value: stats.active, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'Chauffeurs', value: stats.drivers, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
          { label: 'Dispatchers', value: stats.dispatchers, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`rounded-2xl border p-4 ${bg}`}>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 flex-1 min-w-48">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un utilisateur..."
            className="text-sm outline-none bg-transparent w-full"
          />
        </div>
        <div className="relative">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="appearance-none border border-slate-200 rounded-xl px-3 py-2 pr-8 text-sm outline-none bg-white cursor-pointer"
          >
            <option value="">Tous les rôles</option>
            {(['ADMIN', 'DISPATCHER', 'ACCOUNTANT', 'DRIVER', 'CLIENT'] as UserRole[]).map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="appearance-none border border-slate-200 rounded-xl px-3 py-2 pr-8 text-sm outline-none bg-white cursor-pointer"
          >
            <option value="">Tous les statuts</option>
            <option value="true">Actifs</option>
            <option value="false">Inactifs</option>
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 text-slate-200 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 font-medium text-slate-500">Utilisateur</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Contact</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Rôle</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Statut</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Depuis</th>
                <th className="text-right px-5 py-3 font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((u) => {
                const isSelf = authUser?.id === u.id;
                return (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-xs shrink-0">
                          {u.firstName[0]}{u.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">
                            {u.firstName} {u.lastName}
                            {isSelf && <span className="ml-1 text-xs text-blue-500">(vous)</span>}
                          </p>
                          <p className="text-xs text-slate-400">#{u.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-slate-700">{u.email}</p>
                      {u.phone && <p className="text-xs text-slate-400 flex items-center gap-1"><Phone className="w-3 h-3" />{u.phone}</p>}
                    </td>
                    <td className="px-5 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-red-400'}`} />
                        {u.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-xs">
                      {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {!isSelf && (
                          <>
                            <button
                              onClick={() => toggle(u)}
                              title={u.isActive ? 'Désactiver' : 'Activer'}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              {u.isActive ? <ToggleRight className="w-4 h-4 text-emerald-500" /> : <ToggleLeft className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => { setShowResetModal(u); setNewPassword(''); }}
                              title="Réinitialiser le mot de passe"
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                            {u.role !== 'ADMIN' && (
                              <button
                                onClick={() => setShowDeleteConfirm(u)}
                                title="Supprimer"
                                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <Modal title="Inviter par email" onClose={() => setShowInviteModal(false)}>
          <div className="space-y-4">
            <Field label="Email">
              <input
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                placeholder="utilisateur@example.com"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              />
            </Field>
            <Field label="Rôle">
              <select
                value={inviteForm.role}
                onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as UserRole })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              >
                {INVITABLE_ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </Field>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowInviteModal(false)} className="flex-1 border border-slate-200 rounded-xl py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Annuler</button>
              <button onClick={sendInvite} disabled={submitting || !inviteForm.email} className="flex-1 bg-blue-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {submitting ? 'Envoi...' : 'Envoyer l\'invitation'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <Modal title="Créer un utilisateur" onClose={() => setShowCreateModal(false)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Prénom">
                <input value={createForm.firstName} onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200" placeholder="Prénom" />
              </Field>
              <Field label="Nom">
                <input value={createForm.lastName} onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200" placeholder="Nom" />
              </Field>
            </div>
            <Field label="Email">
              <input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200" placeholder="email@example.com" />
            </Field>
            <Field label="Mot de passe">
              <input type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200" placeholder="••••••••" />
            </Field>
            <Field label="Téléphone (optionnel)">
              <input value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200" placeholder="+213 ..." />
            </Field>
            <Field label="Rôle">
              <select value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as UserRole })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200">
                {INVITABLE_ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </Field>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 border border-slate-200 rounded-xl py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Annuler</button>
              <button onClick={createUser} disabled={submitting || !createForm.email || !createForm.password || !createForm.firstName}
                className="flex-1 bg-blue-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {submitting ? 'Création...' : 'Créer'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <Modal title={`Réinitialiser le mot de passe`} onClose={() => setShowResetModal(null)}>
          <p className="text-sm text-slate-500 mb-4">
            Définir un nouveau mot de passe pour <strong>{showResetModal.firstName} {showResetModal.lastName}</strong>
          </p>
          <Field label="Nouveau mot de passe">
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200" placeholder="••••••••" />
          </Field>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setShowResetModal(null)} className="flex-1 border border-slate-200 rounded-xl py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Annuler</button>
            <button onClick={resetPassword} disabled={submitting || !newPassword.trim()}
              className="flex-1 bg-blue-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {submitting ? 'Enregistrement...' : 'Réinitialiser'}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <Modal title="Confirmer la suppression" onClose={() => setShowDeleteConfirm(null)}>
          <p className="text-sm text-slate-600 mb-6">
            Supprimer <strong>{showDeleteConfirm.firstName} {showDeleteConfirm.lastName}</strong> ? Cette action est irréversible.
          </p>
          <div className="flex gap-2">
            <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 border border-slate-200 rounded-xl py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Annuler</button>
            <button onClick={deleteUser} className="flex-1 bg-red-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-red-700">Supprimer</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  );
}
