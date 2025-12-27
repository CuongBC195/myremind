"use client";

import { Shield, Bell, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", icon: Bell, label: "Nhắc nhở", active: pathname === "/" },
  ];

  const isProfileActive = pathname === "/profile";

  return (
    <aside className="w-64 flex-col bg-white border-r border-slate-200 hidden md:flex shrink-0 z-20">
      <div className="flex h-full flex-col justify-between p-4">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black text-white">
              <Shield className="h-6 w-6" />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">InsureManager</h1>
          </div>
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.active || pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? "bg-slate-900 text-white shadow-md shadow-slate-200"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`h-6 w-6 ${isActive ? "fill-current" : ""}`} />
                  <p className="text-sm font-medium">{item.label}</p>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto border-t border-slate-100 pt-3">
          <Link
            href="/profile"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              isProfileActive
                ? "bg-slate-900 text-white shadow-md shadow-slate-200"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <User className={`h-6 w-6 ${isProfileActive ? "fill-current" : ""}`} />
            <p className="text-sm font-medium">Hồ sơ</p>
          </Link>
        </div>
      </div>
    </aside>
  );
}

