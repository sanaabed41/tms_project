import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Truck, Building2, CheckCircle2, Search, MapPin, ChevronRight, ArrowLeft, X } from 'lucide-react';

const API = 'http://localhost:3000';

const inputCls = 'w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all';

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

interface PublicCompany {
  companyCode: string;
  nom: string;
  ville: string;
  pays: string;
  siteWeb?: string;
}

export default function ClientRegisterPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // ── Étape 1 : choisir une entreprise ──────────────────────────────────────
  const [step, setStep] = useState<'pick' | 'form' | 'verify' | 'done'>(
    searchParams.get('code') ? 'form' : 'pick',
  );
  const [companies, setCompanies] = useState<PublicCompany[]>([]);
  const [search, setSearch] = useState('');
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<PublicCompany | null>(null);

  // ── Étape 2 : formulaire ──────────────────────────────────────────────────
  const [form, setForm] = useState({
    companyCode: searchParams.get('code') ?? '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // ── Étape 3 : vérification OTP ────────────────────────────────────────────
  const [verifyEmail, setVerifyEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [companyNom, setCompanyNom] = useState('');

  // Charger les entreprises publiques
  const loadCompanies = useCallback(async (q: string) => {
    setLoadingCompanies(true);
    try {
      const res = await fetch(`${API}/companies/public?search=${encodeURIComponent(q)}`);
      const data = await res.json();
      setCompanies(data.companies ?? []);
    } catch {
      setCompanies([]);
    } finally {
      setLoadingCompanies(false);
    }
  }, []);

  useEffect(() => {
    if (step === 'pick') loadCompanies(search);
  }, [step, search, loadCompanies]);

  // Si URL contient ?code=, pré-remplir et retrouver la société
  useEffect(() => {
    const code = searchParams.get('code');
    if (code && step === 'form') {
      fetch(`${API}/companies/public?search=`)
        .then((r) => r.json())
        .then((data) => {
          const found = (data.companies ?? []).find((c: PublicCompany) => c.companyCode === code);
          if (found) setSelectedCompany(found);
        })
        .catch(() => null);
    }
  }, []);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  function pickCompany(c: PublicCompany) {
    setSelectedCompany(c);
    setForm((f) => ({ ...f, companyCode: c.companyCode }));
    setStep('form');
    setError('');
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.firstName.trim() || !form.lastName.trim()) { setError('Prénom et nom requis'); return; }
    if (!form.email.includes('@')) { setError('Email invalide'); return; }
    if (form.password.length < 6) { setError('Mot de passe trop court (6 caractères min.)'); return; }
    if (form.password !== form.confirmPassword) { setError('Les mots de passe ne correspondent pas'); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/auth/register-as-client`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyCode: form.companyCode,
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? 'Erreur lors de l\'inscription'); return; }
      setVerifyEmail(form.email);
      setCompanyNom(data.companyNom ?? selectedCompany?.nom ?? '');
      setStep('verify');
    } catch {
      setError('Erreur de connexion au serveur');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) { setError('Code OTP invalide'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifyEmail, code: otp }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? 'Code incorrect'); return; }
      setStep('done');
    } catch {
      setError('Erreur de connexion');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Step: done ────────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Compte activé !</h2>
          <p className="text-slate-500 text-sm mb-6">
            Votre compte client pour <strong>{companyNom}</strong> est prêt.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-blue-600 text-white rounded-xl py-2.5 font-medium hover:bg-blue-700 transition-colors"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  // ── Step: verify OTP ──────────────────────────────────────────────────────
  if (step === 'verify') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Truck className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 text-center mb-1">Vérifiez votre email</h2>
          <p className="text-sm text-slate-500 text-center mb-6">
            Code envoyé à <strong>{verifyEmail}</strong>
          </p>
          <form onSubmit={handleVerify} className="space-y-4">
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-center text-2xl font-mono font-bold tracking-widest outline-none focus:ring-2 focus:ring-blue-200"
            />
            {error && <p className="text-red-500 text-xs text-center">{error}</p>}
            <button
              type="submit"
              disabled={submitting || otp.length !== 6}
              className="w-full bg-blue-600 text-white rounded-xl py-2.5 font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Vérification...' : 'Confirmer'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Step: form ────────────────────────────────────────────────────────────
  if (step === 'form') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
          {/* Header */}
          <div className="bg-slate-900 px-7 py-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Truck className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold">TMS Pro</span>
            </div>
            <h1 className="text-white text-lg font-bold">Créer votre compte</h1>

            {/* Entreprise sélectionnée */}
            {selectedCompany && (
              <div className="mt-3 flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
                <Building2 className="w-4 h-4 text-blue-300 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{selectedCompany.nom}</p>
                  <p className="text-blue-300 text-xs">{selectedCompany.ville}</p>
                </div>
                <button
                  onClick={() => setStep('pick')}
                  className="text-blue-300 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <form onSubmit={handleRegister} className="px-7 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Prénom" required>
                <input value={form.firstName} onChange={set('firstName')} placeholder="Prénom" className={inputCls} />
              </Field>
              <Field label="Nom" required>
                <input value={form.lastName} onChange={set('lastName')} placeholder="Nom" className={inputCls} />
              </Field>
            </div>
            <Field label="Email" required>
              <input type="email" value={form.email} onChange={set('email')} placeholder="vous@exemple.com" className={inputCls} />
            </Field>
            <Field label="Téléphone">
              <input value={form.phone} onChange={set('phone')} placeholder="55 000 000" className={inputCls} />
            </Field>
            <Field label="Mot de passe" required>
              <input type="password" value={form.password} onChange={set('password')} placeholder="6 caractères minimum" className={inputCls} />
            </Field>
            <Field label="Confirmer" required>
              <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Répéter" className={inputCls} />
            </Field>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 text-sm text-red-600">{error}</div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white rounded-xl py-2.5 font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Création...' : 'Créer mon compte'}
            </button>
          </form>

          <div className="px-7 pb-5 text-center text-xs text-slate-400 space-y-1">
            <p>Déjà un compte ? <Link to="/login" className="text-blue-600 hover:underline font-medium">Se connecter</Link></p>
            <p>Vous êtes une entreprise ? <Link to="/register-company" className="text-blue-600 hover:underline font-medium">Demander un accès</Link></p>
          </div>
        </div>
      </div>
    );
  }

  // ── Step: pick company ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 px-7 py-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold">TMS Pro</span>
          </div>
          <h1 className="text-white text-lg font-bold">Choisissez votre prestataire</h1>
          <p className="text-slate-400 text-sm mt-1">Sélectionnez l'entreprise dont vous souhaitez utiliser les services</p>
        </div>

        {/* Search */}
        <div className="px-6 pt-5 pb-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Chercher par nom ou ville..."
              className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
            />
          </div>
        </div>

        {/* List */}
        <div className="px-6 pb-4 max-h-80 overflow-y-auto space-y-2">
          {loadingCompanies ? (
            <div className="space-y-2 py-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-10">
              <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Aucune entreprise trouvée</p>
            </div>
          ) : (
            companies.map((c) => (
              <button
                key={c.companyCode}
                onClick={() => pickCompany(c)}
                className="w-full flex items-center gap-4 border border-slate-100 hover:border-blue-200 hover:bg-blue-50 rounded-xl px-4 py-3.5 transition-all text-left group"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{c.nom}</p>
                  <p className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                    <MapPin className="w-3 h-3" /> {c.ville}, {c.pays}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-colors shrink-0" />
              </button>
            ))
          )}
        </div>

        {/* Divider — saisie manuelle du code */}
        <div className="px-6 pb-5 border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-400 text-center mb-3">Vous avez déjà un code ? Saisissez-le directement</p>
          <div className="flex gap-2">
            <input
              placeholder="Code entreprise (ex: TRANSLOG1)"
              className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
              onChange={(e) => setForm((f) => ({ ...f, companyCode: e.target.value.toUpperCase() }))}
              value={form.companyCode}
            />
            <button
              disabled={!form.companyCode.trim()}
              onClick={() => {
                if (form.companyCode.trim()) {
                  setSelectedCompany(null);
                  setStep('form');
                }
              }}
              className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </div>

        <div className="px-6 pb-5 text-center text-xs text-slate-400">
          Déjà un compte ? <Link to="/login" className="text-blue-600 hover:underline font-medium">Se connecter</Link>
        </div>
      </div>
    </div>
  );
}
