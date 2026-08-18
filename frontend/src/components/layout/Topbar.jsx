import { Bell, Menu, ChevronDown } from "lucide-react";

function Topbar({ onMenuClick }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-md p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>

        <div className="hidden text-sm text-slate-500 sm:block">
          AYUSH Clinical Workspace
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          type="button"
          className="relative rounded-md p-2 text-slate-500 hover:bg-slate-100"
          aria-label="Notifications"
        >
          <Bell size={18} strokeWidth={1.8} />

          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-600" />
        </button>

        <div className="h-6 w-px bg-slate-200" />

        <button
          type="button"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-50"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-700">
            DP
          </div>

          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium text-slate-800">
              Dr. Priya
            </p>

            <p className="text-[11px] text-slate-400">
              Clinician
            </p>
          </div>

          <ChevronDown
            size={15}
            className="hidden text-slate-400 sm:block"
          />
        </button>
      </div>
    </header>
  );
}

export default Topbar;