import { Bell, ChevronDown, Menu, ShieldCheck } from "lucide-react";

function Topbar({ onMenuClick }) {
  return (
    <header className="sticky top-0 z-30 flex h-[68px] shrink-0 items-center justify-between border-b border-slate-700 bg-[#0d2742] px-4 text-white sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" onClick={onMenuClick} className="rounded-md p-2 text-slate-200 hover:bg-white/10 lg:hidden" aria-label="Open navigation"><Menu size={20} /></button>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold">Clinical Interoperability Workspace</p>
          <p className="mt-0.5 hidden text-[11px] text-slate-300 sm:block">NAMASTE <span className="mx-1.5 text-slate-500">•</span> ICD-11 TM2 terminology integration</p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        <div className="hidden items-center gap-2 border-r border-white/15 pr-5 sm:flex">
          <span className="text-[11px] text-slate-300">API Status</span>
          <span className="status-dot" />
          <span className="text-[12px] font-semibold text-white">Online</span>
        </div>
        <button type="button" className="relative rounded-md p-2 text-slate-200 hover:bg-white/10" aria-label="Notifications"><Bell size={18} /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" /></button>
        <div className="hidden h-7 w-px bg-white/15 sm:block" />
        <button type="button" className="flex items-center gap-2 rounded-md px-1.5 py-1.5 hover:bg-white/10">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white text-xs font-bold text-[#0d2742]">DP</div>
          <div className="hidden text-left md:block"><p className="text-xs font-semibold">Dr. Priya</p><p className="text-[10px] text-slate-300">Clinician</p></div>
          <ChevronDown size={15} className="hidden text-slate-300 md:block" />
        </button>
      </div>
    </header>
  );
}

export default Topbar;
