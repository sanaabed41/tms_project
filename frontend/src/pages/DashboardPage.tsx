import { useEffect, useState } from 'react';
import { Truck, MapPin, FileText, Receipt, Users, TrendingUp, Clock, AlertTriangle, Copy, Check, Link2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:3000';

interface Stats {
  camions: { total: number; available: number; inMission: number; maintenance: number };
  missions: { total: number; pending: number; inProgress: number; done: number; cancelled: number };
  bls: { total: number; pending: number; signed: number; invoiced: number };
  factures: { total: number; sent: number; paid: number; overdue: number; chiffreAffaires: number; montantEnAttente: number };
  users: { total: number; active: number };
}

export default function DashboardPage() {
  const { token, user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyCode, setCompanyCode] = useState<string | null>(null);
  const [companyNom, setCompanyNom] = useState<string | null>(null);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  const isAdmin = user?.role === 'ADMIN';

  function copyToClipboard(text: string, type: 'code' | 'link') {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  useEffect(() => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API}/camions/stats`, { headers }).then((r) => r.json()),
      fetch(`${API}/missions/stats`, { headers }).then((r) => r.json()),
      fetch(`${API}/bon-livraison/stats`, { headers }).then((r) => r.json()).catch(() => null),
      fetch(`${API}/factures/stats`, { headers }).then((r) => r.json()).catch(() => null),
      fetch(`${API}/admin/users`, { headers }).then((r) => r.json()).catch(() => null),
      isAdmin ? fetch(`${API}/companies/my-company`, { headers }).then((r) => r.json()).catch(() => null) : Promise.resolve(null),
    ]).then(([camions, missions, bls, factures, usersData, company]) => {
      setStats({
        camions: camions ?? {},
        missions: missions ?? {},
        bls: bls ?? {},
        factures: factures ?? {},
        users: { total: usersData?.total ?? 0, active: (usersData?.users ?? []).filter((u: any) => u.isActive).length },
      });
      if (company?.companyCode) setCompanyCode(company.companyCode);
      if (company?.nom) setCompanyNom(company.nom);
    }).finally(() => setLoading(false));
  }, [token, isAdmin]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-50 rounded-2xl border border-slate-200 p-5 h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const kpis = isSuperAdmin ? [] : [
    {
      label: 'Camions disponibles',
      value: stats?.camions.available ?? 0,
      sub: `${stats?.camions.total ?? 0} au total`,
      icon: Truck,
      color: 'blue',
    },
    {
      label: 'Missions en cours',
      value: stats?.missions.inProgress ?? 0,
      sub: `${stats?.missions.pending ?? 0} en attente`,
      icon: MapPin,
      color: 'emerald',
    },
    {
      label: 'BLs signés',
      value: stats?.bls.signed ?? 0,
      sub: `${stats?.bls.total ?? 0} au total`,
      icon: FileText,
      color: 'violet',
    },
    {
      label: 'Factures en attente',
      value: stats?.factures.sent ?? 0,
      sub: `${stats?.factures.overdue ?? 0} en retard`,
      icon: Receipt,
      color: 'amber',
    },
  ];

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    violet: 'bg-violet-50 text-violet-600 border-violet-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      {!isSuperAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {kpis.map(({ label, value, sub, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${colorMap[color]}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{value}</p>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="text-xs text-slate-400">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Secondary row */}
      {!isSuperAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Camions breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-semibold text-slate-700">Flotte</h3>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Disponibles', value: stats?.camions.available ?? 0, color: 'bg-emerald-400' },
                { label: 'En mission', value: stats?.camions.inMission ?? 0, color: 'bg-blue-400' },
                { label: 'Maintenance', value: stats?.camions.maintenance ?? 0, color: 'bg-amber-400' },
              ].map(({ label, value, color }) => {
                const total = stats?.camions.total || 1;
                const pct = Math.round((value / total) * 100);
                return (
                  <div key={label}>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>{label}</span>
                      <span className="font-medium text-slate-700">{value}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Missions breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-semibold text-slate-700">Missions</h3>
            </div>
            <div className="space-y-2.5">
              {[
                { label: 'En cours', value: stats?.missions.inProgress ?? 0, badge: 'bg-blue-100 text-blue-700' },
                { label: 'En attente', value: stats?.missions.pending ?? 0, badge: 'bg-slate-100 text-slate-600' },
                { label: 'Terminées', value: stats?.missions.done ?? 0, badge: 'bg-emerald-100 text-emerald-700' },
                { label: 'Annulées', value: stats?.missions.cancelled ?? 0, badge: 'bg-red-100 text-red-600' },
              ].map(({ label, value, badge }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">{label}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Financial summary */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-violet-500" />
              <h3 className="text-sm font-semibold text-slate-700">Finances</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-400">Chiffre d'affaires (payé)</p>
                <p className="text-lg font-bold text-emerald-600">
                  {(stats?.factures.chiffreAffaires ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} TND
                </p>
              </div>
              <div className="border-t border-slate-100 pt-3 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1 text-slate-500"><Clock className="w-3 h-3" /> En attente</span>
                  <span className="font-medium text-amber-600">{(stats?.factures.montantEnAttente ?? 0).toLocaleString('fr-FR')} TND</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1 text-slate-500"><AlertTriangle className="w-3 h-3" /> En retard</span>
                  <span className="font-medium text-red-600">{stats?.factures.overdue ?? 0} facture(s)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users summary (ADMIN only) */}
      {!isSuperAdmin && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-slate-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-700">Équipe</p>
            <p className="text-xs text-slate-400">{stats?.users.active ?? 0} actifs sur {stats?.users.total ?? 0} membres</p>
          </div>
          <div className="w-40 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-400 rounded-full"
              style={{ width: `${stats?.users.total ? Math.round(((stats?.users.active ?? 0) / stats.users.total) * 100) : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Company code widget — ADMIN only */}
      {isAdmin && companyCode && (
        <div className="bg-linear-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-blue-100 text-xs font-medium mb-1">Code d'accès client — {companyNom}</p>
            <p className="text-white text-sm">Partagez ce code avec vos clients pour qu'ils puissent créer leur compte.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/10 border border-white/20 rounded-xl px-5 py-2.5">
              <span className="text-white font-mono font-bold text-xl tracking-widest">{companyCode}</span>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => copyToClipboard(companyCode, 'code')}
                className="flex items-center gap-1.5 bg-white text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
              >
                {copied === 'code' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === 'code' ? 'Copié !' : 'Code'}
              </button>
              <button
                onClick={() => copyToClipboard(`${window.location.origin}/register-client?code=${companyCode}`, 'link')}
                className="flex items-center gap-1.5 bg-white/10 border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors"
              >
                {copied === 'link' ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
                {copied === 'link' ? 'Copié !' : 'Lien'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isSuperAdmin && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <p className="text-slate-400 text-sm">Utilisez le menu <strong className="text-slate-600">Super Admin</strong> pour gérer les entreprises et utilisateurs.</p>
        </div>
      )}
    </div>
  );
}
