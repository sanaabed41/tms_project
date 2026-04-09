import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { Truck, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login, setAuthData } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('EMAIL_NOT_VERIFIED')) {
        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
      } else {
        setError(msg || 'Une erreur est survenue');
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSuccess(credential: string | undefined) {
    if (!credential) return;
    setError('');
    try {
      const res = await fetch('http://localhost:3000/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: credential }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Connexion Google échouée');
      }
      const data = await res.json();
      setAuthData(data.access_token, data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/30 mb-4">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">TMS Pro</h1>
          <p className="text-blue-300/70 text-sm mt-1">Transport Management System</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-1">Bienvenue</h2>
          <p className="text-slate-400 text-sm mb-6">Connectez-vous à votre compte</p>

          {/* Google button — le composant gère tout le flux OAuth */}
          <div className="flex justify-center mb-4">
            <GoogleLogin
              onSuccess={(credentialResponse) =>
                handleGoogleSuccess(credentialResponse.credential)
              }
              onError={() => setError('Connexion Google annulée ou échouée')}
              width="368"
              shape="rectangular"
              theme="filled_black"
              text="continue_with"
            />
          </div>

          {/* Séparateur */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-slate-500 text-xs">ou</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
                Adresse email
              </label>
              <input id="email" name="email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)} placeholder="exemple@email.com" required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                  Mot de passe
                </label>
                <Link to="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <input id="password" name="password" type={showPassword ? 'text' : 'password'}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-11 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button type="submit" disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 px-4 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 mt-2">
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Connexion...</> : 'Se connecter'}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-white/10 space-y-2">
            <p className="text-center text-slate-500 text-xs">Vous n'avez pas encore de compte ?</p>
            <div className="grid grid-cols-2 gap-2">
              <Link to="/register-client"
                className="text-center text-xs py-2 px-3 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition-all">
                Compte client
              </Link>
              <Link to="/register-company"
                className="text-center text-xs py-2 px-3 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition-all">
                Mon entreprise
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          © {new Date().getFullYear()} TMS Pro — Tous droits réservés
        </p>
      </div>
    </div>
  );
}
