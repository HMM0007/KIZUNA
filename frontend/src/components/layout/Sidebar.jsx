import {
  LayoutDashboard,
  Users,
  ClipboardList,
  GitBranch,
  ClipboardCheck,
  FileSearch,
  Settings,
  X,
  ShieldCheck,
} from "lucide-react";
import { useLocation } from "react-router-dom";

const navigation = [
  { section: "Overview", items: [{ label: "Dashboard", path: "/", icon: LayoutDashboard }] },
  { section: "Clinical", items: [{ label: "Patients", path: "/patients", icon: Users }, { label: "Encounters", path: "/encounters", icon: ClipboardList }] },
  { section: "Terminology", items: [{ label: "Mapping", path: "/mapping", icon: GitBranch }, { label: "Mapping Evidence", path: "/mapping/evidence", icon: FileSearch }, { label: "Review Queue", path: "/reviews", icon: ClipboardCheck }] },
];

function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

  const isActive = (path) => path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return <>
    {isOpen && <div className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm lg:hidden" onClick={onClose} />}
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-[268px] flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="border-b border-slate-100 px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <div><div className="flex items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-xs font-bold text-white shadow-sm">API</div><div><p className="text-sm font-bold tracking-tight text-slate-950">Interoperability API</p><p className="mt-0.5 text-[10px] font-medium text-slate-400">Team Tenacious</p></div></div></div>
          <button type="button" onClick={onClose} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden" aria-label="Close navigation"><X size={18} /></button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {navigation.map((group) => <div key={group.section} className="mb-7"><p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">{group.section}</p><div className="space-y-1">{group.items.map((item) => { const Icon = item.icon; const active = isActive(item.path); return <a key={item.path} href={item.path} onClick={onClose} className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active ? "bg-slate-950 font-semibold text-white shadow-sm" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}><Icon size={17} strokeWidth={active ? 2 : 1.8} /><span>{item.label}</span>{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/80" />}</a>; })}</div></div>)}
        <div className="border-t border-slate-100 pt-4"><a href="/settings" onClick={onClose} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"><Settings size={17} strokeWidth={1.8} /><span>Settings</span></a></div>
      </nav>

      <div className="border-t border-slate-100 p-4"><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center gap-2"><ShieldCheck size={15} className="text-emerald-600" /><span className="text-xs font-semibold text-slate-800">API status</span><span className="ml-auto status-dot" /></div><p className="mt-2 text-[10px] leading-4 text-slate-400">Terminology mapping · review · analytics</p><p className="mt-2 text-[10px] font-medium text-slate-400">v0.1.0</p></div></div>
    </aside>
  </>;
}

export default Sidebar;
