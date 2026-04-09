import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Building2, Users, ShieldCheck, ArrowLeft, ToggleLeft, ToggleRight,
  Trash2, Plus, X, AlertCircle, CheckCircle, Mail, Phone, Globe, MapPin,
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

const ADMIN_INIT = { firstName: '', lastName: '', email: '', password: '', phone: '' };

type UserRow = { id: number; email: string; firstName: string; lastName: string; phone?: string; role: string; isActive: boolean; companyId: number };
type CompanyDetail = {
  id: number; nom: string; adresse: string; ville: string; pays: string;
  email: string; telephone: string; siteWeb?: string; RC?: string; TVA?: string;
  isActive: boolean; userCount: number; usersByRole: Record<string, number>;
  users: UserRow[]; createdAt: string;
};

export default function SuperAdminCompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminForm, setAdminForm] = useState(ADMIN_INIT);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  function toast_(msg: string, type: 'success' | 'error') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function load() {
    setLoading(true);
    const res = await fetch(`${API}/super-admin/companies/${id}`, { headers: h() });
    if (res.ok) setCompany(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function handleToggleCompany() {
    const res = await fetch(`${API}/super-admin/companies/${id}/toggle`, { method: 'PATCH', headers: h() });
    const d = await res.json();
    if (res.ok) { toast_(d.message, 'success'); await load(); }
    else toast_(d.message ?? 'Erreur', 'error');
  }

  async function handleToggleUser(userId: number) {
    const res = await fetch(`${API}/super-admin/users/${userId}/toggle`, { method: 'PATCH', headers: h() });
    const d = await res.json();
    if (res.ok) {
      setCompany((prev) => prev ? {
        ...prev,
        users: prev.users.map((u) => u.id === userId ? { ...u, isActive: d.isActive } : u),
      } : prev);
      toast_(d.message, 'success');
    } else toast_(d.message ?? 'Erreur', 'error');
  }

  async function handleDeleteUser(userId: number) {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    const res = await fetch(`${API}/super-admin/users/${userId}`, { method: 'DELETE', headers: h() });
    const d = await res.json();
    if (res.ok) {
      setCompany((prev) => prev ? { ...prev, users: prev.users.filter((u) => u.id !== userId), userCount: prev.userCount - 1 } : prev);
      toast_(d.message, 'success');
    } else toast_(d.message ?? 'Erreur', 'error');
  }

  async function handleCreateAdmin(e: React.SyntheticEvent) {
    e.preventDefault(); setFormError(''); setFormLoading(true);
    try {
      const res = await fetch(`${API}/super-admin/companies/${id}/admin`, { method: 'POST', headers: h(), body: JSON.stringify(adminForm) });
      const d = await res.json();
      if (!res.ok) throw new Error(Array.isArray(d.message) ? d.message.join(', ') : d.message);
      setShowAdmin(false); setAdminForm(ADMIN_INIT); await load();
      toast_(d.message, 'success');
    } catch (err: any) { setFormError(err.message); }
    finally { setFormLoading(false); }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!company) return (
    <div className="text-center py-20 text-slate-400">Entreprise introuvable</div>
  );

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'} text-white`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link to="/super-admin/companies" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center text-xl font-bold text-violet-600">
              {company.nom[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">{company.nom}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${company.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                  {company.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className="text-xs text-slate-400">ID #{company.id}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowAdmin(true); setAdminForm(ADMIN_INIT); setFormError(''); }}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" /> Ajouter admin
          </button>
          <button
            onClick={handleToggleCompany}
            className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border transition-all ${
              company.isActive
                ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            {company.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
            {company.isActive ? 'Désactiver' : 'Activer'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company info */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-700 text-sm mb-4">Informations</h2>
            <div className="space-y-3 text-sm">
              {[
                { icon: Mail, label: company.email },
                { icon: Phone, label: company.telephone },
                { icon: MapPin, label: `${company.adresse}, ${company.ville}, ${company.pays}` },
                ...(company.siteWeb ? [{ icon: Globe, label: company.siteWeb }] : []),
              ].map(({ icon: Icon, label }, i) => (
                <div key={i} className="flex items-start gap-3 text-slate-600">
                  <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <span className="break-all">{label}</span>
                </div>
              ))}
            </div>
            {(company.RC || company.TVA) && (
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-1">
                {company.RC && <p className="text-xs text-slate-500"><span className="text-slate-400">RC: </span>{company.RC}</p>}
                {company.TVA && <p className="text-xs text-slate-500"><span className="text-slate-400">TVA: </span>{company.TVA}</p>}
              </div>
            )}
          </div>

          {/* Role distribution */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-700 text-sm mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              Utilisateurs ({company.userCount})
            </h2>
            <div className="space-y-2">
              {Object.entries(company.usersByRole).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[role] ?? 'bg-slate-100 text-slate-600'}`}>{role}</span>
                  <span className="text-sm font-bold text-slate-700">{count}</span>
                </div>
              ))}
              {Object.keys(company.usersByRole).length === 0 && (
                <p className="text-xs text-slate-400 text-center py-2">Aucun utilisateur</p>
              )}
            </div>
          </div>
        </div>

        {/* Users table */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-violet-500" />
                Membres de l'entreprise
              </h2>
            </div>
            {company.users.length === 0 ? (
              <div className="py-16 text-center">
                <Users className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">Aucun utilisateur</p>
                <button onClick={() => { setShowAdmin(true); setFormError(''); }} className="mt-3 text-violet-500 hover:text-violet-700 text-sm font-medium">
                  + Créer le premier admin
                </button>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {['Utilisateur', 'Rôle', 'Statut', 'Actions'].map((col) => (
                      <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {company.users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">
                            {(u.firstName?.[0] ?? u.email[0]).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-700">{u.firstName ? `${u.firstName} ${u.lastName ?? ''}` : '—'}</p>
                            <p className="text-xs text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role] ?? 'bg-slate-100 text-slate-600'}`}>{u.role}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                          {u.isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleToggleUser(u.id)} className={`p-1.5 rounded-lg transition-all ${u.isActive ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`} title={u.isActive ? 'Désactiver' : 'Activer'}>
                            {u.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          </button>
                          <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Supprimer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Add Admin Modal */}
      {showAdmin && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="font-semibold text-slate-800">Créer un Admin</h3>
                <p className="text-xs text-slate-400 mt-0.5">{company.nom}</p>
              </div>
              <button onClick={() => setShowAdmin(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'firstName', label: 'Prénom *', required: true },
                  { key: 'lastName', label: 'Nom *', required: true },
                  { key: 'email', label: 'Email *', required: true },
                  { key: 'phone', label: 'Téléphone', required: false },
                ].map(({ key, label, required }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
                    <input required={required} value={(adminForm as any)[key]} onChange={(e) => setAdminForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Mot de passe *</label>
                  <input required type="password" value={adminForm.password} onChange={(e) => setAdminForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="Minimum 6 caractères" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
              </div>
              {formError && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{formError}</div>}
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowAdmin(false)} className="px-4 py-2 text-sm text-slate-600">Annuler</button>
                <button type="submit" disabled={formLoading} className="px-5 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl">
                  {formLoading ? 'Création…' : 'Créer l\'admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
