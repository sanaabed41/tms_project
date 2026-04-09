import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, Users, ShieldCheck, TrendingUp,
  CheckCircle, XCircle, UserCheck, ArrowRight, Clock,
} from 'lucide-react';

const API = 'http://localhost:3000';
const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-violet-100 text-violet-700',
  DISPATCHER: 'bg-blue-100 text-blue-700',
  DRIVER: 'bg-amber-100 text-amber-700',
  ACCOUNTANT: 'bg-emerald-100 text-emerald-700',
  CLIENT: 'bg-slate-100 text-slate-600',
  SUPER_ADMIN: 'bg-rose-100 text-rose-700',
};

export default function SuperAdminOverviewPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/super-admin/stats`, { headers: headers() })
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const kpis = [
    { label: 'Entreprises', value: stats?.totalCompanies ?? 0, sub: `${stats?.activeCompanies ?? 0} actives`, icon: Building2, color: 'bg-violet-50 text-violet-600 border-violet-100' },
    { label: 'Inactives', value: stats?.inactiveCompanies ?? 0, sub: 'entreprises bloquées', icon: XCircle, color: 'bg-red-50 text-red-500 border-red-100' },
    { label: 'Utilisateurs', value: stats?.totalUsers ?? 0, sub: `${stats?.activeUsers ?? 0} actifs`, icon: Users, color: 'bg-blue-50 text-blue-600 border-blue-100' },
    { label: 'Admins', value: stats?.usersByRole?.ADMIN ?? 0, sub: 'gestionnaires', icon: ShieldCheck, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Vue d'ensemble</h1>
        <p className="text-slate-500 text-sm mt-0.5">Tableau de bord de la plateforme TMS Pro</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 leading-none">{value}</p>
              <p className="text-xs text-slate-500 mt-1">{label}</p>
              <p className="text-xs text-slate-400">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-700 flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-violet-500" />
              Répartition des rôles
            </h2>
            <Link to="/super-admin/users" className="text-xs text-violet-500 hover:text-violet-700 flex items-center gap-1">
              Voir tous <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {stats?.usersByRole && (
            <div className="space-y-2.5">
              {Object.entries(stats.usersByRole as Record<string, number>)
                .filter(([r]) => r !== 'SUPER_ADMIN')
                .sort(([, a], [, b]) => b - a)
                .map(([role, count]) => {
                  const total = stats.totalUsers || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={role}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[role] ?? 'bg-slate-100 text-slate-600'}`}>
                          {role}
                        </span>
                        <span className="text-sm font-bold text-slate-700">{count}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-700 text-sm mb-4">Actions rapides</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { to: '/super-admin/companies', label: 'Gérer les entreprises', icon: Building2, color: 'bg-violet-50 hover:bg-violet-100 text-violet-700 border-violet-200' },
              { to: '/super-admin/users', label: 'Gérer les utilisateurs', icon: Users, color: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200' },
              { to: '/super-admin/companies/new', label: 'Nouvelle entreprise', icon: Building2, color: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200' },
              { to: '/super-admin/users?role=ADMIN', label: 'Voir les admins', icon: ShieldCheck, color: 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200' },
            ].map(({ to, label, icon: Icon, color }) => (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center text-xs font-medium transition-all ${color}`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent companies */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              Dernières entreprises
            </h2>
            <Link to="/super-admin/companies" className="text-xs text-violet-500 hover:text-violet-700 flex items-center gap-1">
              Tout voir <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {(stats?.recentCompanies ?? []).length === 0 && (
              <p className="text-slate-400 text-xs text-center py-4">Aucune entreprise</p>
            )}
            {(stats?.recentCompanies ?? []).map((c: any) => (
              <Link
                key={c.id}
                to={`/super-admin/companies/${c.id}`}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 group-hover:text-violet-600">{c.nom}</p>
                    <p className="text-xs text-slate-400">{c.ville}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                  {c.isActive ? 'Active' : 'Inactive'}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent admins */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-slate-400" />
              Derniers admins créés
            </h2>
            <Link to="/super-admin/users?role=ADMIN" className="text-xs text-violet-500 hover:text-violet-700 flex items-center gap-1">
              Tout voir <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {(stats?.recentAdmins ?? []).length === 0 && (
              <p className="text-slate-400 text-xs text-center py-4">Aucun admin créé</p>
            )}
            {(stats?.recentAdmins ?? []).map((u: any) => (
              <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                  {(u.firstName?.[0] ?? u.email[0]).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {u.firstName ? `${u.firstName} ${u.lastName ?? ''}` : u.email}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{u.email}</p>
                </div>
                <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium shrink-0">ADMIN</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
