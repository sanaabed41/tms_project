import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, Plus, X, Search, ToggleLeft, ToggleRight,
  Trash2, ShieldCheck, Eye, AlertCircle, CheckCircle, Users,
} from 'lucide-react';

const API = 'http://localhost:3000';
const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });

const FORM_INIT = { nom: '', adresse: '', ville: '', pays: 'Tunisie', email: '', telephone: '', siteWeb: '', RC: '', TVA: '' };
const ADMIN_INIT = { firstName: '', lastName: '', email: '', password: '', phone: '' };

type Company = {
  id: number; nom: string; adresse: string; ville: string; pays: string;
  email: string; telephone: string; siteWeb?: string; RC?: string; TVA?: string;
  isActive: boolean; userCount: number; adminCount: number; createdAt: string;
};

export default function SuperAdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showAdmin, setShowAdmin] = useState<Company | null>(null);
  const [editCompany, setEditCompany] = useState<Company | null>(null);
  const [form, setForm] = useState(FORM_INIT);
  const [adminForm, setAdminForm] = useState(ADMIN_INIT);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  function toast_(msg: string, type: 'success' | 'error') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filter !== 'all') params.set('isActive', filter === 'active' ? 'true' : 'false');
    const res = await fetch(`${API}/super-admin/companies?${params}`, { headers: h() });
    const d = await res.json();
    setCompanies(d.companies ?? []);
  }, [search, filter]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.SyntheticEvent) {
    e.preventDefault(); setFormError(''); setLoading(true);
    try {
      const res = await fetch(`${API}/super-admin/companies`, { method: 'POST', headers: h(), body: JSON.stringify(form) });
      const d = await res.json();
      if (!res.ok) throw new Error(Array.isArray(d.message) ? d.message.join(', ') : d.message);
      setShowCreate(false); setForm(FORM_INIT); await load();
      toast_(d.message, 'success');
    } catch (err: any) { setFormError(err.message); }
    finally { setLoading(false); }
  }

  async function handleEdit(e: React.SyntheticEvent) {
    e.preventDefault(); setFormError(''); setLoading(true);
    try {
      const res = await fetch(`${API}/super-admin/companies/${editCompany!.id}`, { method: 'PATCH', headers: h(), body: JSON.stringify(form) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message);
      setEditCompany(null); await load();
      toast_('Entreprise mise à jour', 'success');
    } catch (err: any) { setFormError(err.message); }
    finally { setLoading(false); }
  }

  async function handleToggle(id: number) {
    const res = await fetch(`${API}/super-admin/companies/${id}/toggle`, { method: 'PATCH', headers: h() });
    const d = await res.json();
    if (res.ok) { setCompanies((p) => p.map((c) => c.id === id ? { ...c, isActive: d.isActive } : c)); toast_(d.message, 'success'); }
    else toast_(d.message ?? 'Erreur', 'error');
  }

  async function handleDelete(c: Company) {
    if (c.userCount > 0) { toast_(`Impossible : ${c.userCount} utilisateur(s) lié(s). Supprimez-les d'abord.`, 'error'); return; }
    if (!confirm(`Supprimer "${c.nom}" ?`)) return;
    const res = await fetch(`${API}/super-admin/companies/${c.id}`, { method: 'DELETE', headers: h() });
    const d = await res.json();
    if (res.ok) { setCompanies((p) => p.filter((x) => x.id !== c.id)); toast_(d.message, 'success'); }
    else toast_(d.message ?? 'Erreur', 'error');
  }

  async function handleCreateAdmin(e: React.SyntheticEvent) {
    e.preventDefault(); setFormError(''); setLoading(true);
    try {
      const res = await fetch(`${API}/super-admin/companies/${showAdmin!.id}/admin`, { method: 'POST', headers: h(), body: JSON.stringify(adminForm) });
      const d = await res.json();
      if (!res.ok) throw new Error(Array.isArray(d.message) ? d.message.join(', ') : d.message);
      setShowAdmin(null); setAdminForm(ADMIN_INIT); await load();
      toast_(d.message, 'success');
    } catch (err: any) { setFormError(err.message); }
    finally { setLoading(false); }
  }

  function openEdit(c: Company) {
    setEditCompany(c);
    setForm({ nom: c.nom, adresse: c.adresse, ville: c.ville, pays: c.pays, email: c.email, telephone: c.telephone, siteWeb: c.siteWeb ?? '', RC: c.RC ?? '', TVA: c.TVA ?? '' });
    setFormError('');
  }

  const FIELDS = [
    { key: 'nom', label: 'Nom *', placeholder: 'Transport Dupont', required: true, span: 2 },
    { key: 'email', label: 'Email *', placeholder: 'contact@dupont.tn', required: true, span: 1 },
    { key: 'telephone', label: 'Téléphone *', placeholder: '+216 71 000 000', required: true, span: 1 },
    { key: 'adresse', label: 'Adresse *', placeholder: 'Rue de la Liberté', required: true, span: 2 },
    { key: 'ville', label: 'Ville *', placeholder: 'Tunis', required: true, span: 1 },
    { key: 'pays', label: 'Pays', placeholder: 'Tunisie', required: false, span: 1 },
    { key: 'RC', label: 'Registre de Commerce', placeholder: 'B123456789', required: false, span: 1 },
    { key: 'TVA', label: 'N° TVA', placeholder: 'TN123456', required: false, span: 1 },
    { key: 'siteWeb', label: 'Site web', placeholder: 'https://dupont.tn', required: false, span: 2 },
  ];

  return (
    <div className="space-y-5">
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'} text-white`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Entreprises</h1>
          <p className="text-slate-500 text-sm mt-0.5">{companies.length} entreprise(s) enregistrée(s)</p>
        </div>
        <button onClick={() => { setShowCreate(true); setForm(FORM_INIT); setFormError(''); }} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm">
          <Plus className="w-4 h-4" /> Nouvelle entreprise
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email, ville…"
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
          />
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {(['all', 'active', 'inactive'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {f === 'all' ? 'Toutes' : f === 'active' ? 'Actives' : 'Inactives'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {companies.length === 0 ? (
          <div className="py-20 text-center">
            <Building2 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Aucune entreprise trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  {['Entreprise', 'Localisation', 'Contact', 'Utilisateurs', 'Statut', 'Actions'].map((col) => (
                    <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {companies.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold text-violet-600">
                          {c.nom[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{c.nom}</p>
                          <p className="text-xs text-slate-400">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{c.ville}, {c.pays}</td>
                    <td className="px-4 py-3.5 text-slate-600 text-xs">{c.telephone}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-700">{c.userCount}</span>
                        <span className="text-slate-400 text-xs">({c.adminCount} admin)</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${c.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${c.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <Link to={`/super-admin/companies/${c.id}`} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Détails">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button onClick={() => openEdit(c)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all" title="Modifier">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => { setShowAdmin(c); setAdminForm(ADMIN_INIT); setFormError(''); }} className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all" title="Ajouter admin">
                          <ShieldCheck className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleToggle(c.id)} className={`p-1.5 rounded-lg transition-all ${c.isActive ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`} title={c.isActive ? 'Désactiver' : 'Activer'}>
                          {c.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                        <button onClick={() => handleDelete(c)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Supprimer">
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

      {/* Create / Edit Company Modal */}
      {(showCreate || editCompany) && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
              <h3 className="font-semibold text-slate-800 text-lg">{editCompany ? 'Modifier l\'entreprise' : 'Nouvelle entreprise'}</h3>
              <button onClick={() => { setShowCreate(false); setEditCompany(null); }} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={editCompany ? handleEdit : handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {FIELDS.map(({ key, label, placeholder, required, span }) => (
                  <div key={key} className={span === 2 ? 'col-span-2' : ''}>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
                    <input required={required} value={(form as any)[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  </div>
                ))}
              </div>
              {formError && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{formError}</div>}
              <div className="flex gap-3 justify-end pt-1">
                <button type="button" onClick={() => { setShowCreate(false); setEditCompany(null); }} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">Annuler</button>
                <button type="submit" disabled={loading} className="px-5 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all">
                  {loading ? 'Enregistrement…' : editCompany ? 'Sauvegarder' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Admin Modal */}
      {showAdmin && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="font-semibold text-slate-800">Créer un Admin</h3>
                <p className="text-xs text-slate-400 mt-0.5">{showAdmin.nom}</p>
              </div>
              <button onClick={() => setShowAdmin(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
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
                <button type="button" onClick={() => setShowAdmin(null)} className="px-4 py-2 text-sm text-slate-600">Annuler</button>
                <button type="submit" disabled={loading} className="px-5 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all">
                  {loading ? 'Création…' : 'Créer l\'admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
