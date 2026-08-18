import { Bell, ChevronDown, Menu, ShieldCheck } from "lucide-react";

function Topbar({ onMenuClick }) {
  return (
    <header className="sticky top-0 z-30 flex h-[72px] shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 shadow-[0_4px_24px_rgba(15,23,42,0.04)] backdrop-blur-xl sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" onClick={onMenuClick} className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 lg:hidden" aria-label="Open navigation"><Menu size={20} /></button>
        <div className="min-w-0">
          <div className="flex items-center gap-2"><span className="hidden text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600 sm:block">Team Tenacious</span><span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" /><span className="truncate text-sm font-semibold text-slate-800">Interoperability Workspace</span></div>
          <p className="mt-0.5 hidden text-[11px] text-slate-400 sm:block">NAMASTE · ICD-11 TM2 terminology integration</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 sm:flex"><span className="status-dot" /><span className="text-[11px] font-semibold text-emerald-700">API online</span></div>
        <button type="button" className="relative rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100" aria-label="Notifications"><Bell size={18} strokeWidth={1.8} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-emerald-500" /></button>
        <div className="hidden h-7 w-px bg-slate-200 sm:block" />
        <button type="button" className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-slate-50"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white shadow-sm">DP</div><div className="hidden text-left md:block"><p className="text-xs font-semibold text-slate-800">Dr. Priya</p><p className="text-[10px] text-slate-400">Clinician</p></div><ChevronDown size={15} className="hidden text-slate-400 md:block" /></button>
      </div>
    </header>
  );
}

export default Topbar;
