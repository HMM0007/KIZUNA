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
  UserPlus,
  BarChart3,
  FileText,
  UsersRound,
  ScrollText,
} from "lucide-react";
import { useLocation } from "react-router-dom";

const navigation = [
  { section: "Overview", items: [{ label: "Dashboard", path: "/", icon: LayoutDashboard }] },
  { section: "Patient Care", items: [
    { label: "Patients", path: "/patients", icon: Users },
    { label: "Encounters", path: "/encounters", icon: ClipboardList },
    { label: "New Encounter", path: "/patients", icon: UserPlus },
  ] },
  { section: "Terminology", items: [
    { label: "Mapping", path: "/mapping", icon: GitBranch },
    { label: "Mapping Evidence", path: "/mapping/evidence", icon: FileSearch },
    { label: "Review Queue", path: "/reviews", icon: ClipboardCheck },
  ] },
  { section: "Analytics", items: [
    { label: "Analytics", path: "/", icon: BarChart3 },
    { label: "Reports", path: "/", icon: FileText },
  ] },
];

function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const isActive = (path) => path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[262px] flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-[88px] items-center justify-between border-b border-slate-200 bg-[#0d2742] px-5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-sm font-bold">API</div>
            <div>
              <p className="text-[15px] font-semibold leading-5">Interoperability API</p>
              <p className="mt-0.5 text-[11px] text-slate-300">Team Tenacious</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 text-slate-300 hover:bg-white/10 lg:hidden" aria-label="Close navigation"><X size={18} /></button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {navigation.map((group) => (
            <div key={group.section} className="mb-6">
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{group.section}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <a key={`${item.label}-${item.path}`} href={item.path} onClick={onClose} className={`relative flex items-center gap-3 border-l-2 px-3 py-2.5 text-sm transition ${active ? "border-blue-600 bg-blue-50 font-semibold text-blue-700" : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
                      <Icon size={17} strokeWidth={active ? 2 : 1.8} />
                      <span>{item.label}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="border-t border-slate-100 pt-4">
            <a href="/settings" onClick={onClose} className="flex items-center gap-3 border-l-2 border-transparent px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"><Settings size={17} /><span>Settings</span></a>
          </div>
        </nav>

        <div className="border-t border-slate-200 p-4">
          <div className="border border-slate-200 bg-slate-50 p-3.5">
            <div className="flex items-center gap-2"><ShieldCheck size={15} className="text-emerald-600" /><span className="text-xs font-semibold text-slate-800">API Connection</span><span className="ml-auto status-dot" /></div>
            <p className="mt-2 text-xs font-medium text-slate-700">Team Tenacious API</p>
            <p className="mt-1 text-[10px] text-emerald-700">Connected</p>
            <div className="mt-3 border-t border-slate-200 pt-2 text-[10px] text-slate-400">Version 0.1.0</div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
