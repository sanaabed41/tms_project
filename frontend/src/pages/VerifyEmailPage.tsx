import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Truck, Loader2, MailCheck, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';


export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const navigate = useNavigate();
  const { setAuthData } = useAuth();

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [resendMsg, setResendMsg] = useState('');
  const [countdown, setCountdown] = useState(60);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Countdown pour renvoyer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    // Auto-submit when all 6 digits filled
    if (newCode.every(d => d !== '') && value) {
      handleVerify(newCode.join(''));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.split('');
      setCode(newCode);
      inputRefs.current[5]?.focus();
      handleVerify(pasted);
    }
  }

  async function handleVerify(fullCode?: string) {
    const codeToVerify = fullCode || code.join('');
    if (codeToVerify.length < 6) return;
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:3000/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: codeToVerify }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Code incorrect');
      }

      const data = await res.json();
      setAuthData(data.access_token, data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResend() {
    setIsResending(true);
    setError('');
    setResendMsg('');
    try {
      const res = await fetch('http://localhost:3000/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('Erreur lors de l\'envoi');
      setResendMsg('Nouveau code envoyé !');
      setCountdown(60);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsResending(false);
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

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-7">
            <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mb-4">
              <MailCheck className="w-7 h-7 text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Vérifiez votre email</h2>
            <p className="text-slate-400 text-sm mt-2 leading-relaxed">
              Nous avons envoyé un code à 6 chiffres à<br />
              <span className="text-blue-400 font-medium">{email}</span>
            </p>
          </div>

          {/* OTP inputs */}
          <div className="flex gap-2.5 justify-center mb-6" onPaste={handlePaste}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className={`w-12 h-14 text-center text-xl font-bold rounded-xl border transition-all outline-none
                  ${digit ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-white'}
                  focus:border-blue-400 focus:ring-1 focus:ring-blue-400`}
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 mb-4 text-center">
              {error}
            </div>
          )}

          {resendMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-sm text-emerald-400 mb-4 text-center">
              {resendMsg}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={() => handleVerify()}
            disabled={isLoading || code.some(d => !d)}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Vérification…</> : 'Confirmer'}
          </button>

          {/* Resend */}
          <div className="mt-5 text-center">
            <p className="text-slate-500 text-sm">Vous n'avez pas reçu le code ?</p>
            {countdown > 0 ? (
              <p className="text-slate-500 text-sm mt-1">
                Renvoyer dans <span className="text-blue-400 font-medium">{countdown}s</span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={isResending}
                className="mt-1 flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors mx-auto disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                {isResending ? 'Envoi…' : 'Renvoyer le code'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
