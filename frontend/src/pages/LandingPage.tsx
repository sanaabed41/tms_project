import { Link } from 'react-router-dom';
import {
  Truck, MapPin, FileText, Receipt, Users, Shield,
  ArrowRight, CheckCircle2, Building2, BarChart3,
  Globe, Clock, Star, ChevronRight, Menu, X,
} from 'lucide-react';
import { useState } from 'react';

// ── Nav ───────────────────────────────────────────────────────────────────────

function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-600/30">
            <Truck className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-bold text-slate-900 text-lg tracking-tight">TMS Pro</span>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#features" className="hover:text-slate-900 transition-colors">Fonctionnalités</a>
          <a href="#roles" className="hover:text-slate-900 transition-colors">Rôles</a>
          <a href="#how" className="hover:text-slate-900 transition-colors">Comment ça marche</a>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-4 py-2">
            Connexion
          </Link>
          <Link
            to="/register-company"
            className="text-sm font-semibold bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20"
          >
            Démarrer gratuitement
          </Link>
        </div>

        {/* Mobile burger */}
        <button className="md:hidden text-slate-700" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-slate-100 px-6 py-4 flex flex-col gap-4">
          <a href="#features" className="text-sm font-medium text-slate-600" onClick={() => setOpen(false)}>Fonctionnalités</a>
          <a href="#roles" className="text-sm font-medium text-slate-600" onClick={() => setOpen(false)}>Rôles</a>
          <a href="#how" className="text-sm font-medium text-slate-600" onClick={() => setOpen(false)}>Comment ça marche</a>
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
            <Link to="/login" className="text-sm font-medium text-center text-slate-700 py-2.5 border border-slate-200 rounded-xl">Connexion</Link>
            <Link to="/register-company" className="text-sm font-semibold text-center bg-blue-600 text-white py-2.5 rounded-xl">Démarrer gratuitement</Link>
          </div>
        </div>
      )}
    </nav>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="pt-32 pb-24 px-6 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-100/60 rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-100/50 rounded-full blur-3xl translate-y-1/2" />
      </div>

      <div className="max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold px-4 py-2 rounded-full mb-6">
          <Star className="w-3.5 h-3.5 fill-blue-500 text-blue-500" />
          Plateforme TMS multi-entreprises
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-6">
          Gérez vos transports
          <br />
          <span className="bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            avec précision
          </span>
        </h1>

        <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          TMS Pro centralise missions, bons de livraison, camions et factures sur une seule plateforme.
          Chaque entreprise dispose de son espace isolé, géré par son propre administrateur.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/register-company"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold px-7 py-3.5 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/25 text-base"
          >
            Inscrire mon entreprise <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 bg-white text-slate-700 font-semibold px-7 py-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all text-base"
          >
            Se connecter
          </Link>
        </div>

        {/* Stats row */}
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
          {[
            { value: '100%', label: 'Isolation des données' },
            { value: '5 rôles', label: 'Gestion granulaire' },
            { value: 'Temps réel', label: 'Suivi des missions' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-bold text-slate-900">{s.value}</div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Features ──────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: MapPin,
    color: 'bg-blue-50 text-blue-600',
    title: 'Gestion des missions',
    desc: 'Créez et suivez toutes vos missions de transport — origine, destination, charge, statuts en temps réel.',
  },
  {
    icon: FileText,
    color: 'bg-violet-50 text-violet-600',
    title: 'Bons de livraison',
    desc: 'Générez des BLs automatiquement à partir des missions. Assignez les camions par glisser-déposer avec contrôle du poids.',
  },
  {
    icon: Truck,
    color: 'bg-amber-50 text-amber-600',
    title: 'Parc de camions',
    desc: 'Suivez la disponibilité, la capacité et l\'état de chaque véhicule. Statistiques d\'utilisation intégrées.',
  },
  {
    icon: Receipt,
    color: 'bg-emerald-50 text-emerald-600',
    title: 'Facturation',
    desc: 'Générez des factures depuis les BLs signés. Suivi des paiements, relances et état comptable en temps réel.',
  },
  {
    icon: Users,
    color: 'bg-pink-50 text-pink-600',
    title: 'Multi-rôles',
    desc: 'Admin, Dispatcher, Comptable, Chauffeur, Client — chaque utilisateur accède uniquement à son périmètre.',
  },
  {
    icon: Shield,
    color: 'bg-slate-50 text-slate-600',
    title: 'Isolation par entreprise',
    desc: 'Chaque société dispose d\'un espace totalement isolé. Aucune fuite de données entre entreprises.',
  },
];

function Features() {
  return (
    <section id="features" className="py-24 px-6 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-slate-500 mt-3 max-w-xl mx-auto">
            Une suite complète pour piloter votre activité logistique, du devis à la facture payée.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white rounded-2xl p-6 border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className={`w-10 h-10 ${f.color} rounded-xl flex items-center justify-center mb-4`}>
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Roles ─────────────────────────────────────────────────────────────────────

const ROLES = [
  {
    role: 'Super Admin',
    color: 'from-violet-600 to-purple-700',
    badge: 'bg-violet-100 text-violet-700',
    desc: 'Gère l\'ensemble de la plateforme : valide les demandes d\'entreprises, supervise tous les utilisateurs.',
    perms: ['Approuver / rejeter des entreprises', 'Voir tous les utilisateurs', 'Activer / désactiver des comptes', 'Tableau de bord global'],
  },
  {
    role: 'Admin',
    color: 'from-blue-600 to-blue-700',
    badge: 'bg-blue-100 text-blue-700',
    desc: 'Responsable de son entreprise. Crée son équipe, configure les camions, suit l\'activité globale.',
    perms: ['Inviter les collaborateurs', 'Gérer camions & clients', 'Voir toutes les missions', 'Accès complet à son entreprise'],
  },
  {
    role: 'Dispatcher',
    color: 'from-sky-500 to-cyan-600',
    badge: 'bg-sky-100 text-sky-700',
    desc: 'Planifie et suit les missions. Assigne les chauffeurs et les camions aux bons de livraison.',
    perms: ['Créer des missions', 'Gérer les BLs', 'Assigner les camions', 'Suivi en temps réel'],
  },
  {
    role: 'Comptable',
    color: 'from-emerald-500 to-teal-600',
    badge: 'bg-emerald-100 text-emerald-700',
    desc: 'Gère la facturation et le suivi des paiements. Accès aux rapports financiers de l\'entreprise.',
    perms: ['Créer des factures', 'Suivi des paiements', 'Rapports financiers', 'Export comptable'],
  },
  {
    role: 'Chauffeur',
    color: 'from-amber-500 to-orange-600',
    badge: 'bg-amber-100 text-amber-700',
    desc: 'Consulte ses missions du jour, valide les livraisons et met à jour les statuts sur le terrain.',
    perms: ['Voir ses missions', 'Valider les livraisons', 'Mettre à jour les statuts', 'Accès mobile'],
  },
  {
    role: 'Client',
    color: 'from-slate-500 to-slate-700',
    badge: 'bg-slate-100 text-slate-700',
    desc: 'Suit ses commandes et livraisons en temps réel. Accède à ses factures directement depuis la plateforme.',
    perms: ['Suivi de commandes', 'Consulter ses factures', 'Historique des livraisons', 'Notifications'],
  },
];

function Roles() {
  return (
    <section id="roles" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            Un accès taillé pour chaque rôle
          </h2>
          <p className="text-slate-500 mt-3 max-w-xl mx-auto">
            Chaque collaborateur voit uniquement ce dont il a besoin — pas plus, pas moins.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {ROLES.map((r) => (
            <div key={r.role} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow">
              <div className={`h-1.5 w-full bg-linear-to-r ${r.color}`} />
              <div className="p-6">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${r.badge}`}>{r.role}</span>
                <p className="text-sm text-slate-500 mt-3 mb-4 leading-relaxed">{r.desc}</p>
                <ul className="space-y-1.5">
                  {r.perms.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── How it works ──────────────────────────────────────────────────────────────

const STEPS = [
  {
    n: '01',
    color: 'bg-blue-600',
    icon: Building2,
    title: 'L\'admin soumet une demande',
    desc: 'Le responsable logistique remplit un formulaire en ligne avec les informations de son entreprise et ses coordonnées.',
  },
  {
    n: '02',
    color: 'bg-violet-600',
    icon: Shield,
    title: 'Le Super Admin valide',
    desc: 'La plateforme examine la demande sous 24–48h. En cas d\'approbation, l\'entreprise est créée et les identifiants envoyés par email.',
  },
  {
    n: '03',
    color: 'bg-emerald-600',
    icon: Users,
    title: 'L\'admin configure son équipe',
    desc: 'Il invite ses collaborateurs (Dispatcher, Comptable, Chauffeur) par email avec leur rôle défini à l\'avance.',
  },
  {
    n: '04',
    color: 'bg-amber-600',
    icon: Globe,
    title: 'Les clients s\'inscrivent',
    desc: 'Les clients utilisent le code unique de l\'entreprise pour créer leur compte et suivre leurs commandes en temps réel.',
  },
];

function HowItWorks() {
  return (
    <section id="how" className="py-24 px-6 bg-slate-50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            Opérationnel en 4 étapes
          </h2>
          <p className="text-slate-500 mt-3 max-w-xl mx-auto">
            De la demande d'inscription à l'équipe complète — en moins de 24h.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {STEPS.map((s) => (
            <div key={s.n} className="bg-white rounded-2xl p-6 border border-slate-100 flex gap-5">
              <div className={`shrink-0 w-12 h-12 ${s.color} rounded-2xl flex items-center justify-center shadow-md`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 mb-1">Étape {s.n}</div>
                <h3 className="font-semibold text-slate-900 mb-1.5">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Dashboard preview ─────────────────────────────────────────────────────────

function DashboardPreview() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            Un tableau de bord pour chaque rôle
          </h2>
          <p className="text-slate-500 mt-3 max-w-xl mx-auto">
            Chaque utilisateur voit les indicateurs qui le concernent, sans information superflue.
          </p>
        </div>

        {/* Fake dashboard UI */}
        <div className="rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/80 overflow-hidden">
          {/* Topbar */}
          <div className="bg-slate-900 px-5 py-3 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <div className="flex-1 mx-4 bg-slate-700 rounded-md h-6 flex items-center px-3">
              <span className="text-slate-400 text-xs">app.tmspro.dz/dashboard</span>
            </div>
          </div>

          <div className="flex h-80">
            {/* Sidebar mock */}
            <div className="w-48 bg-slate-900 p-4 flex flex-col gap-1">
              <div className="flex items-center gap-2 mb-5 px-2">
                <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Truck className="w-4 h-4 text-white" />
                </div>
                <span className="text-white text-sm font-bold">TMS Pro</span>
              </div>
              {[
                { icon: BarChart3, label: 'Dashboard', active: true },
                { icon: MapPin, label: 'Missions', active: false },
                { icon: FileText, label: 'BL', active: false },
                { icon: Truck, label: 'Camions', active: false },
                { icon: Receipt, label: 'Factures', active: false },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium cursor-default
                    ${item.active ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </div>
              ))}
            </div>

            {/* Content mock */}
            <div className="flex-1 bg-slate-50 p-5">
              <div className="text-sm font-semibold text-slate-800 mb-4">Tableau de bord</div>

              {/* KPI cards */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Missions', value: '24', color: 'bg-blue-500' },
                  { label: 'Camions', value: '8', color: 'bg-amber-500' },
                  { label: 'BL actifs', value: '12', color: 'bg-violet-500' },
                  { label: 'Factures', value: '18', color: 'bg-emerald-500' },
                ].map((kpi) => (
                  <div key={kpi.label} className="bg-white rounded-xl p-3 border border-slate-100">
                    <div className={`w-6 h-6 ${kpi.color} rounded-lg mb-2`} />
                    <div className="text-lg font-bold text-slate-800">{kpi.value}</div>
                    <div className="text-xs text-slate-400">{kpi.label}</div>
                  </div>
                ))}
              </div>

              {/* Fake table */}
              <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-slate-100 flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-700">Missions récentes</span>
                  <span className="text-xs text-blue-600 font-medium cursor-default">Voir tout</span>
                </div>
                {[
                  { ref: 'MS-2024-001', from: 'Tunis', to: 'Sfax', status: 'EN COURS', dot: 'bg-blue-500' },
                  { ref: 'MS-2024-002', from: 'Sfax', to: 'Sousse', status: 'PLANIFIÉE', dot: 'bg-slate-400' },
                  { ref: 'MS-2024-003', from: 'Bizerte', to: 'Tunis', status: 'LIVRÉE', dot: 'bg-emerald-500' },
                ].map((row) => (
                  <div key={row.ref} className="px-4 py-2 flex items-center justify-between text-xs text-slate-600 border-b border-slate-50 last:border-0">
                    <span className="font-mono font-medium text-slate-800">{row.ref}</span>
                    <span>{row.from} → {row.to}</span>
                    <span className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${row.dot}`} />
                      {row.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── CTA ───────────────────────────────────────────────────────────────────────

function CTA() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <div className="bg-linear-to-br from-blue-600 to-indigo-700 rounded-3xl p-12 shadow-2xl shadow-blue-600/20">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Truck className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">
            Prêt à digitaliser votre logistique ?
          </h2>
          <p className="text-blue-100 mb-8 text-base leading-relaxed">
            Soumettez votre demande d'inscription en 2 minutes.<br />
            Notre équipe valide votre dossier sous 24–48h.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register-company"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 font-semibold px-7 py-3.5 rounded-2xl hover:bg-blue-50 transition-colors text-sm"
            >
              Inscrire mon entreprise <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              to="/register-client"
              className="inline-flex items-center justify-center gap-2 bg-white/10 text-white font-semibold px-7 py-3.5 rounded-2xl hover:bg-white/20 transition-colors text-sm border border-white/20"
            >
              Je suis un client <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-slate-200 py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <Truck className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-700">TMS Pro</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-slate-500">
          <Link to="/login" className="hover:text-slate-700 transition-colors">Connexion</Link>
          <Link to="/register-company" className="hover:text-slate-700 transition-colors">Inscrire mon entreprise</Link>
          <Link to="/register-client" className="hover:text-slate-700 transition-colors">Espace client</Link>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          © {new Date().getFullYear()} TMS Pro — Tous droits réservés
        </div>
      </div>
    </footer>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Features />
      <Roles />
      <HowItWorks />
      <DashboardPreview />
      <CTA />
      <Footer />
    </div>
  );
}
