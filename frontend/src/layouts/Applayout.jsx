import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1680px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
            <div className="app-gradient rounded-[28px] p-1">
              <div className="rounded-[24px] bg-white/60 p-3 shadow-[0_18px_60px_rgba(15,23,42,0.04)] backdrop-blur-sm sm:p-5 lg:p-6">
                <Outlet />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
