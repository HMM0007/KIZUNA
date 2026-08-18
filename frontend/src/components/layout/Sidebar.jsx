import {
  LayoutDashboard,
  Users,
  ClipboardList,
  GitBranch,
  ClipboardCheck,
  Settings,
  Menu,
  X,
} from "lucide-react";

const navigation = [
  {
    section: "Overview",
    items: [
      {
        label: "Dashboard",
        path: "/",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    section: "Clinical",
    items: [
      {
        label: "Patients",
        path: "/patients",
        icon: Users,
      },
      {
        label: "Encounters",
        path: "/encounters",
        icon: ClipboardList,
      },
    ],
  },
  {
    section: "Terminology",
    items: [
      {
        label: "Mapping",
        path: "/mapping",
        icon: GitBranch,
      },
      {
        label: "Review Queue",
        path: "/reviews",
        icon: ClipboardCheck,
      },
    ],
  },
];

function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <div>
            <div className="text-base font-semibold tracking-tight text-slate-900">
              KIZUNA
            </div>

            <div className="mt-0.5 text-[11px] text-slate-500">
              Terminology Interoperability
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {navigation.map((group) => (
            <div key={group.section} className="mb-6">
              <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {group.section}
              </p>

              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <a
                      key={item.path}
                      href={item.path}
                      className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                    >
                      <Icon size={17} strokeWidth={1.8} />

                      <span>{item.label}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="border-t border-slate-100 pt-4">
            <a
              href="/settings"
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              <Settings size={17} strokeWidth={1.8} />
              <span>Settings</span>
            </a>
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-200 px-4 py-4">
          <p className="text-[11px] text-slate-400">
            KIZUNA Prototype
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            v0.1.0
          </p>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;