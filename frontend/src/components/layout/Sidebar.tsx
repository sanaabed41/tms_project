import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Truck,
  MapPin,
  FileText,
  Receipt,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord', roles: null },
  { to: '/missions', icon: MapPin, label: 'Missions', roles: ['ADMIN', 'DISPATCHER', 'ACCOUNTANT'] },
  { to: '/bons-livraison', icon: FileText, label: 'Bons de livraison', roles: ['ADMIN', 'DISPATCHER', 'ACCOUNTANT'] },
  { to: '/camions', icon: Truck, label: 'Camions', roles: ['ADMIN', 'DISPATCHER', 'ACCOUNTANT'] },
  { to: '/factures', icon: Receipt, label: 'Factures', roles: ['ADMIN', 'ACCOUNTANT'] },
  { to: '/utilisateurs', icon: Users, label: 'Utilisateurs', roles: ['ADMIN'] },
];

const superAdminItems = [
  { to: '/super-admin', icon: LayoutDashboard, label: 'Vue globale' },
  { to: '/super-admin/requests', icon: FileText, label: 'Demandes' },
  { to: '/super-admin/companies', icon: Building2, label: 'Entreprises' },
  { to: '/super-admin/users', icon: Users, label: 'Utilisateurs' },
  { to: '/super-admin/settings', icon: Settings, label: 'Paramètres' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const initials = [user?.firstName?.[0], user?.lastName?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase() || user?.email?.[0]?.toUpperCase() || '?';

  const visibleNavItems = navItems.filter(
    (item) => !isSuperAdmin && (item.roles === null || item.roles.includes(user?.role ?? ''))
  );

  return (
    <aside
      className={`
        relative flex flex-col h-screen bg-slate-900 border-r border-slate-700/50
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-700/50 ${collapsed ? 'justify-center' : ''}`}>
        <div className="shrink-0 w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
          <Truck className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <span className="text-white font-bold text-base tracking-tight">TMS Pro</span>
            <p className={`text-xs leading-none mt-0.5 ${isSuperAdmin ? 'text-violet-400 font-semibold' : 'text-slate-500'}`}>
              {isSuperAdmin ? 'Super Admin' : 'Management'}
            </p>
          </div>
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-18 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all z-10 shadow-md"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {isSuperAdmin ? (
          <>
            {!collapsed && (
              <p className="text-violet-500 text-xs font-semibold uppercase tracking-wider px-3 mb-2">
                Administration
              </p>
            )}
            {superAdminItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/super-admin'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150
                  ${isActive
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }
                  ${collapsed ? 'justify-center' : ''}`
                }
                title={collapsed ? label : undefined}
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span>{label}</span>}
              </NavLink>
            ))}
          </>
        ) : (
          <>
            {!collapsed && (
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 mb-2">
                Navigation
              </p>
            )}
            {visibleNavItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150
                  ${isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }
                  ${collapsed ? 'justify-center' : ''}`
                }
                title={collapsed ? label : undefined}
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span>{label}</span>}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Bottom: Settings + User */}
      <div className="border-t border-slate-700/50 py-3 px-2 space-y-0.5">
        {!isSuperAdmin && (
          <NavLink
            to="/parametres"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150
              ${isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}
              ${collapsed ? 'justify-center' : ''}`
            }
            title={collapsed ? 'Paramètres' : undefined}
          >
            <Settings size={18} className="shrink-0" />
            {!collapsed && <span>Paramètres</span>}
          </NavLink>
        )}

        {/* User info */}
        <div className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${collapsed ? 'justify-center' : ''}`}>
          <div className={`w-8 h-8 border rounded-full flex items-center justify-center shrink-0 ${isSuperAdmin ? 'bg-violet-600/20 border-violet-500/30' : 'bg-blue-600/20 border-blue-500/30'}`}>
            <span className={`text-xs font-bold ${isSuperAdmin ? 'text-violet-400' : 'text-blue-400'}`}>{initials}</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email}
              </p>
              <p className={`text-xs capitalize truncate ${isSuperAdmin ? 'text-violet-400' : 'text-slate-500'}`}>
                {isSuperAdmin ? 'Super Admin' : user?.role?.toLowerCase()}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Déconnexion' : undefined}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
}
