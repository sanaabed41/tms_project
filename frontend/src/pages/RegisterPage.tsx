import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Truck, Eye, EyeOff, Loader2, CheckCircle, ShieldCheck } from 'lucide-react';

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrateur',
  MANAGER: 'Manager',
  DISPATCHER: 'Dispatcher',
  ACCOUNTANT: 'Comptable',
  DRIVER: 'Chauffeur',
  CLIENT: 'Client',
};

function parseInviteToken(token: string): { email: string; role: string } | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.type === 'invite') return { email: payload.email, role: payload.role };
  } catch {}
  return null;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');

  const [inviteData, setInviteData] = useState<{ email: string; role: string } | null>(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (inviteToken) {
      const parsed = parseInviteToken(inviteToken);
      if (parsed) {
        setInviteData(parsed);
        setForm(f => ({ ...f, email: parsed.email }));
      } else {
        setError('Lien d\'invitation invalide ou expiré.');
      }
    }
  }, [inviteToken]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (form.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setIsLoading(true);
    try {
      const isInvite = !!inviteToken && !!inviteData;
      const url = isInvite
        ? 'http://localhost:3000/auth/register-with-invite'
        : 'http://localhost:3000/auth/register';

      const body = isInvite
        ? { inviteToken, password: form.password, firstName: form.firstName, lastName: form.lastName, phone: form.phone }
        : { firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone, password: form.password };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erreur lors de la création du compte');
      }

      if (!isInvite) {
        navigate(`/verify-email?email=${encodeURIComponent(form.email)}`);
      } else {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 2500);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/30 mb-4">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">TMS Pro</h1>
          <p className="text-blue-300/70 text-sm mt-1">Transport Management System</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {success ? (
            <div className="flex flex-col items-center justify-center py-6 gap-4">
              <CheckCircle className="w-14 h-14 text-emerald-400" />
              <h2 className="text-xl font-semibold text-white">Compte créé !</h2>
              <p className="text-slate-400 text-sm text-center">
                Votre compte a été créé avec succès. Redirection vers la connexion…
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-white mb-1">
                {inviteData ? 'Finaliser votre inscription' : 'Créer un compte'}
              </h2>

              {/* Invitation badge */}
              {inviteData && (
                <div className="flex items-center gap-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 mb-5 mt-2">
                  <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                  <div className="text-sm">
                    <span className="text-slate-300">Invitation pour : </span>
                    <span className="text-white font-medium">{inviteData.email}</span>
                    <span className="ml-2 bg-blue-600/30 text-blue-300 text-xs px-2 py-0.5 rounded-full font-medium">
                      {roleLabels[inviteData.role] || inviteData.role}
                    </span>
                  </div>
                </div>
              )}

              {!inviteData && (
                <p className="text-slate-400 text-sm mb-5">Remplissez le formulaire pour vous inscrire</p>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Prénom</label>
                    <input type="text" name="firstName" id="firstName" value={form.firstName} onChange={handleChange} placeholder="Prénom" required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Nom</label>
                    <input type="text" name="lastName" id="lastName" value={form.lastName} onChange={handleChange} placeholder="Nom" required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm" />
                  </div>
                </div>

                {/* Email — readonly si invitation */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Adresse email</label>
                  <input type="email" name="email" id="email" value={form.email}
                    onChange={inviteData ? undefined : handleChange}
                    readOnly={!!inviteData}
                    placeholder="exemple@email.com" required
                    className={`w-full border rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none transition-all text-sm
                      ${inviteData ? 'bg-white/10 border-white/5 text-slate-400 cursor-not-allowed' : 'bg-white/5 border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Téléphone <span className="text-slate-500">(optionnel)</span>
                  </label>
                  <input type="tel" name="phone" id="phone" value={form.phone} onChange={handleChange} placeholder="+213 6XX XXX XXX"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Mot de passe</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} name="password" id="password" value={form.password} onChange={handleChange} placeholder="••••••••" required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-11 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirmer le mot de passe</label>
                  <input type={showPassword ? 'text' : 'password'} name="confirmPassword" id="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="••••••••" required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm" />
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>
                )}

                <button type="submit" disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 px-4 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 mt-2">
                  {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Création en cours…</> : 'Créer mon compte'}
                </button>
              </form>

              {!inviteData && (
                <p className="text-center text-slate-500 text-sm mt-5">
                  Déjà un compte ?{' '}
                  <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Se connecter</Link>
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
