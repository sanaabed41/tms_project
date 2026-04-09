import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, User, ChevronRight, ChevronLeft, CheckCircle2, Truck } from 'lucide-react';

const API = 'http://localhost:3000';

const STEPS = ['Votre entreprise', 'Votre compte', 'Confirmation'];

interface FormData {
  // Entreprise
  companyNom: string;
  companyAdresse: string;
  companyVille: string;
  companyPays: string;
  companyEmail: string;
  companyTelephone: string;
  companySiteWeb: string;
  companyRC: string;
  companyTVA: string;
  companyDescription: string;
  // Admin
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPhone: string;
}

const INITIAL: FormData = {
  companyNom: '', companyAdresse: '', companyVille: '', companyPays: 'Tunisie',
  companyEmail: '', companyTelephone: '', companySiteWeb: '', companyRC: '',
  companyTVA: '', companyDescription: '',
  adminFirstName: '', adminLastName: '', adminEmail: '', adminPhone: '',
};

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

const inputCls = 'w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all';

export default function RegisterCompanyPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  function validateStep1() {
    if (!form.companyNom.trim()) return 'Le nom de l\'entreprise est requis';
    if (!form.companyAdresse.trim()) return 'L\'adresse est requise';
    if (!form.companyVille.trim()) return 'La ville est requise';
    if (!form.companyEmail.trim()) return 'L\'email de l\'entreprise est requis';
    if (!form.companyTelephone.trim()) return 'Le téléphone est requis';
    return '';
  }

  function validateStep2() {
    if (!form.adminFirstName.trim()) return 'Le prénom est requis';
    if (!form.adminLastName.trim()) return 'Le nom est requis';
    if (!form.adminEmail.trim()) return 'L\'email est requis';
    if (!form.adminEmail.includes('@')) return 'Email invalide';
    return '';
  }

  function nextStep() {
    const err = step === 0 ? validateStep1() : step === 1 ? validateStep2() : '';
    if (err) { setError(err); return; }
    setError('');
    setStep((s) => s + 1);
  }

  async function submit() {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API}/company-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          companySiteWeb: form.companySiteWeb || undefined,
          companyRC: form.companyRC || undefined,
          companyTVA: form.companyTVA || undefined,
          companyDescription: form.companyDescription || undefined,
          adminPhone: form.adminPhone || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? 'Erreur lors de l\'envoi'); return; }
      setDone(true);
    } catch {
      setError('Erreur de connexion au serveur');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Demande envoyée !</h2>
          <p className="text-slate-500 text-sm mb-6">
            Votre demande d'inscription a été soumise avec succès. Vous recevrez un email de confirmation dès que votre dossier sera examiné par notre équipe.
          </p>
          <p className="text-xs text-slate-400 mb-6">Délai habituel d'examen : 24–48h ouvrées</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-blue-600 text-white rounded-xl py-2.5 font-medium hover:bg-blue-700 transition-colors"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-blue-700 px-8 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg">TMS Pro</span>
          </div>
          <h1 className="text-white text-xl font-bold">Demande d'inscription</h1>
          <p className="text-blue-200 text-sm mt-1">Créez votre espace entreprise sur la plateforme</p>
        </div>

        {/* Stepper */}
        <div className="px-8 py-4 border-b border-slate-100 flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-blue-700' : i < step ? 'text-emerald-600' : 'text-slate-400'}`}>
                {label}
              </span>
              {i < STEPS.length - 1 && <div className={`flex-1 h-px ${i < step ? 'bg-emerald-300' : 'bg-slate-100'}`} />}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="px-8 py-6 space-y-4">
          {step === 0 && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-blue-500" />
                <h2 className="text-sm font-semibold text-slate-700">Informations de l'entreprise</h2>
              </div>
              <Field label="Nom de l'entreprise" required>
                <input value={form.companyNom} onChange={set('companyNom')} placeholder="TransLog DZ" className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Email professionnel" required>
                  <input type="email" value={form.companyEmail} onChange={set('companyEmail')} placeholder="contact@société.dz" className={inputCls} />
                </Field>
                <Field label="Téléphone" required>
                  <input value={form.companyTelephone} onChange={set('companyTelephone')} placeholder="021 000 000" className={inputCls} />
                </Field>
              </div>
              <Field label="Adresse" required>
                <input value={form.companyAdresse} onChange={set('companyAdresse')} placeholder="12 Rue des Transporteurs" className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Ville" required>
                  <input value={form.companyVille} onChange={set('companyVille')} placeholder="Tunis" className={inputCls} />
                </Field>
                <Field label="Pays">
                  <input value={form.companyPays} onChange={set('companyPays')} placeholder="Tunisie" className={inputCls} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="N° RC">
                  <input value={form.companyRC} onChange={set('companyRC')} placeholder="RC-2024-000" className={inputCls} />
                </Field>
                <Field label="N° TVA">
                  <input value={form.companyTVA} onChange={set('companyTVA')} placeholder="TVA-..." className={inputCls} />
                </Field>
              </div>
              <Field label="Site web">
                <input value={form.companySiteWeb} onChange={set('companySiteWeb')} placeholder="https://..." className={inputCls} />
              </Field>
              <Field label="Description / Activité">
                <textarea value={form.companyDescription} onChange={set('companyDescription')} rows={2}
                  placeholder="Transport de marchandises, logistique..." className={inputCls + ' resize-none'} />
              </Field>
            </>
          )}

          {step === 1 && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-blue-500" />
                <h2 className="text-sm font-semibold text-slate-700">Vos informations (responsable)</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Prénom" required>
                  <input value={form.adminFirstName} onChange={set('adminFirstName')} placeholder="Karim" className={inputCls} />
                </Field>
                <Field label="Nom" required>
                  <input value={form.adminLastName} onChange={set('adminLastName')} placeholder="Bensalem" className={inputCls} />
                </Field>
              </div>
              <Field label="Email (servira d'identifiant)" required>
                <input type="email" value={form.adminEmail} onChange={set('adminEmail')} placeholder="vous@exemple.com" className={inputCls} />
              </Field>
              <Field label="Téléphone">
                <input value={form.adminPhone} onChange={set('adminPhone')} placeholder="0551 000 000" className={inputCls} />
              </Field>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700">
                <strong>Note :</strong> Si votre demande est approuvée, un mot de passe temporaire sera envoyé à cet email. Vous pourrez le changer après votre première connexion.
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-sm font-semibold text-slate-700 mb-3">Récapitulatif</h2>
              <div className="space-y-3">
                <Section title="Entreprise">
                  <Row label="Nom" value={form.companyNom} />
                  <Row label="Email" value={form.companyEmail} />
                  <Row label="Téléphone" value={form.companyTelephone} />
                  <Row label="Ville" value={`${form.companyVille}, ${form.companyPays}`} />
                  {form.companyRC && <Row label="RC" value={form.companyRC} />}
                  {form.companyTVA && <Row label="TVA" value={form.companyTVA} />}
                </Section>
                <Section title="Responsable">
                  <Row label="Nom" value={`${form.adminFirstName} ${form.adminLastName}`} />
                  <Row label="Email" value={form.adminEmail} />
                  {form.adminPhone && <Row label="Téléphone" value={form.adminPhone} />}
                </Section>
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="px-8 pb-6 flex gap-3">
          {step > 0 && (
            <button
              onClick={() => { setStep((s) => s - 1); setError(''); }}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Retour
            </button>
          )}
          {step < 2 ? (
            <button
              onClick={nextStep}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Suivant <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={submitting}
              className="flex-1 bg-emerald-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Envoi en cours...' : 'Soumettre la demande'}
            </button>
          )}
        </div>

        <div className="px-8 pb-6 text-center">
          <p className="text-xs text-slate-400">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-50 rounded-xl p-4">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-700 font-medium">{value}</span>
    </div>
  );
}
