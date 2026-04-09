import { useState, useEffect, useCallback } from 'react';
import {
  Building2, Clock, CheckCircle2, XCircle, Search,
  ChevronDown, Eye, X, RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const API = 'http://localhost:3000';

type Status = 'PENDING' | 'APPROVED' | 'REJECTED';

interface CompanyRequest {
  id: number;
  companyNom: string;
  companyVille: string;
  companyEmail: string;
  companyTelephone: string;
  companyRC?: string;
  companyTVA?: string;
  companySiteWeb?: string;
  companyDescription?: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPhone?: string;
  status: Status;
  rejectReason?: string;
  reviewedAt?: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<Status, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: 'En attente', color: 'bg-amber-100 text-amber-700', icon: Clock },
  APPROVED: { label: 'Approuvée', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  REJECTED: { label: 'Refusée', color: 'bg-red-100 text-red-600', icon: XCircle },
};

function StatusBadge({ status }: { status: Status }) {
  const { label, color, icon: Icon } = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      <Icon className="w-3 h-3" /> {label}
    </span>
  );
}

export default function SuperAdminRequestsPage() {
  const { token } = useAuth();
  const [requests, setRequests] = useState<CompanyRequest[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<CompanyRequest | null>(null);
  const [rejectModal, setRejectModal] = useState<CompanyRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);

      const [reqRes, statsRes] = await Promise.all([
        fetch(`${API}/company-requests?${params}`, { headers }),
        fetch(`${API}/company-requests/stats`, { headers }),
      ]);
      const [reqData, statsData] = await Promise.all([reqRes.json(), statsRes.json()]);
      setRequests(reqData.requests ?? []);
      setStats(statsData);
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  async function approve(id: number) {
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/company-requests/${id}/approve`, { method: 'PATCH', headers });
      if (res.ok) { setSelected(null); load(); }
    } finally {
      setSubmitting(false);
    }
  }

  async function reject() {
    if (!rejectModal || !rejectReason.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/company-requests/${rejectModal.id}/reject`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ rejectReason }),
      });
      if (res.ok) { setRejectModal(null); setRejectReason(''); load(); }
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteRequest(id: number) {
    await fetch(`${API}/company-requests/${id}`, { method: 'DELETE', headers });
    load();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Demandes d'inscription</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gérez les demandes d'accès des nouvelles entreprises</p>
        </div>
        <button onClick={load} className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
          { label: 'En attente', value: stats.pending, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', onClick: () => setStatusFilter('PENDING') },
          { label: 'Approuvées', value: stats.approved, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', onClick: () => setStatusFilter('APPROVED') },
          { label: 'Refusées', value: stats.rejected, color: 'text-red-700', bg: 'bg-red-50 border-red-200', onClick: () => setStatusFilter('REJECTED') },
        ].map(({ label, value, color, bg, onClick }) => (
          <div key={label}
            onClick={onClick}
            className={`rounded-2xl border p-4 ${bg} ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
          >
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
            placeholder="Rechercher une demande..."
            className="text-sm outline-none bg-transparent w-full"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none border border-slate-200 rounded-xl px-3 py-2 pr-8 text-sm outline-none bg-white cursor-pointer"
          >
            <option value="">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="APPROVED">Approuvées</option>
            <option value="REJECTED">Refusées</option>
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Chargement...</div>
        ) : requests.length === 0 ? (
          <div className="py-16 text-center">
            <Building2 className="w-10 h-10 text-slate-200 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">Aucune demande trouvée</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 font-medium text-slate-500">Entreprise</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Responsable</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Date</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Statut</th>
                <th className="text-right px-5 py-3 font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-800">{r.companyNom}</p>
                    <p className="text-xs text-slate-400">{r.companyEmail} · {r.companyVille}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-slate-700">{r.adminFirstName} {r.adminLastName}</p>
                    <p className="text-xs text-slate-400">{r.adminEmail}</p>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-400">
                    {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSelected(r)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors"
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {r.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => approve(r.id)}
                            className="px-3 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
                          >
                            Approuver
                          </button>
                          <button
                            onClick={() => { setRejectModal(r); setRejectReason(''); }}
                            className="px-3 py-1 text-xs font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            Refuser
                          </button>
                        </>
                      )}
                      {r.status !== 'PENDING' && (
                        <button
                          onClick={() => deleteRequest(r.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                          title="Supprimer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-slate-100 z-10">
              <h3 className="font-semibold text-slate-800">Détails de la demande #{selected.id}</h3>
              <button onClick={() => setSelected(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-2">
                <StatusBadge status={selected.status} />
                <span className="text-xs text-slate-400">
                  Soumise le {new Date(selected.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>

              <Section title="Entreprise">
                <Row label="Nom" value={selected.companyNom} />
                <Row label="Email" value={selected.companyEmail} />
                <Row label="Téléphone" value={selected.companyTelephone} />
                <Row label="Ville" value={selected.companyVille} />
                {selected.companyRC && <Row label="RC" value={selected.companyRC} />}
                {selected.companyTVA && <Row label="TVA" value={selected.companyTVA} />}
                {selected.companySiteWeb && <Row label="Site web" value={selected.companySiteWeb} />}
                {selected.companyDescription && <Row label="Description" value={selected.companyDescription} />}
              </Section>

              <Section title="Responsable">
                <Row label="Nom" value={`${selected.adminFirstName} ${selected.adminLastName}`} />
                <Row label="Email" value={selected.adminEmail} />
                {selected.adminPhone && <Row label="Téléphone" value={selected.adminPhone} />}
              </Section>

              {selected.rejectReason && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-red-600 mb-1">Motif de refus</p>
                  <p className="text-sm text-red-700">{selected.rejectReason}</p>
                </div>
              )}

              {selected.status === 'PENDING' && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => { setRejectModal(selected); setSelected(null); setRejectReason(''); }}
                    className="flex-1 border border-red-200 text-red-600 rounded-xl py-2 text-sm font-medium hover:bg-red-50"
                  >
                    Refuser
                  </button>
                  <button
                    onClick={() => approve(selected.id)}
                    disabled={submitting}
                    className="flex-1 bg-emerald-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {submitting ? 'Traitement...' : 'Approuver'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Refuser la demande</h3>
              <button onClick={() => setRejectModal(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-slate-500">
                Vous allez refuser la demande de <strong>{rejectModal.companyNom}</strong>. Un email sera envoyé à {rejectModal.adminEmail}.
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Motif du refus <span className="text-red-500">*</span></label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  placeholder="Expliquez la raison du refus..."
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-200 resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setRejectModal(null)} className="flex-1 border border-slate-200 rounded-xl py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                  Annuler
                </button>
                <button
                  onClick={reject}
                  disabled={submitting || !rejectReason.trim()}
                  className="flex-1 bg-red-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {submitting ? 'Envoi...' : 'Confirmer le refus'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-50 rounded-xl p-4">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-slate-400 shrink-0">{label}</span>
      <span className="text-slate-700 font-medium text-right break-all">{value}</span>
    </div>
  );
}
