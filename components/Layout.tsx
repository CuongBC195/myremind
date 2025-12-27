"use client";

import Sidebar from "./Sidebar";
import NotificationBell from "./NotificationBell";
import { Menu } from "lucide-react";
import { useState, useEffect } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Mobile sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 z-40 transform transition-transform md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar />
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 relative">
        {/* Desktop header */}
        <div className="hidden md:flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 size-8 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">IM</span>
            </div>
            <span className="font-bold text-lg">InsureManager</span>
          </div>
          <NotificationBell />
        </div>

        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 size-8 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">IM</span>
            </div>
            <span className="font-bold text-lg">InsureManager</span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-600"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
        
        {children}
      </main>
    </div>
  );
}

