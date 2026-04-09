import { Bell, Search, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Tableau de bord',
  '/missions': 'Missions',
  '/bons-livraison': 'Bons de livraison',
  '/camions': 'Camions',
  '/factures': 'Factures',
  '/utilisateurs': 'Utilisateurs',
  '/parametres': 'Paramètres',
};

export default function Header() {
  const { user } = useAuth();
  const location = useLocation();
  const pageTitle = pageTitles[location.pathname] || 'TMS Pro';

  const initials = [user?.firstName?.[0], user?.lastName?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase() || user?.email?.[0]?.toUpperCase() || '?';

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center gap-4 px-6 flex-shrink-0">
      {/* Page title */}
      <div className="flex-1">
        <h1 className="text-lg font-semibold text-slate-800">{pageTitle}</h1>
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2 w-64">
        <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Rechercher..."
          className="bg-transparent text-sm text-slate-600 placeholder-slate-400 outline-none w-full"
        />
      </div>

      {/* Notifications */}
      <button className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700">
        <Bell className="w-5 h-5" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full border-2 border-white" />
      </button>

      {/* User menu */}
      <button className="flex items-center gap-2.5 hover:bg-slate-100 rounded-xl px-2.5 py-1.5 transition-colors">
        <div className="w-8 h-8 bg-blue-600/10 border border-blue-200 rounded-full flex items-center justify-center">
          <span className="text-blue-600 text-xs font-bold">{initials}</span>
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-slate-700 leading-none">
            {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email}
          </p>
          <p className="text-xs text-slate-400 capitalize mt-0.5">{user?.role}</p>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>
    </header>
  );
}
