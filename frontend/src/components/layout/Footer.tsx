export default function Footer() {
  return (
    <footer className="h-10 bg-white border-t border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
      <p className="text-xs text-slate-400">
        © {new Date().getFullYear()} TMS Pro — Tous droits réservés
      </p>
      <p className="text-xs text-slate-400">v1.0.0</p>
    </footer>
  );
}
