"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Home, ClipboardList, LogOut, Users } from "lucide-react";
import { signOut } from "@/lib/auth";

const items = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/assessment", label: "Assessment", icon: ClipboardList },
  { href: "/history", label: "Records", icon: Users },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <>
      <aside className="hidden xl:flex xl:w-72 xl:flex-col xl:gap-3 border-r border-slate-200/60 bg-white/80 backdrop-blur-md p-5 shadow-[4px_0_24px_rgba(0,0,0,0.01)]">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5 mb-5">
          <div className="h-11 w-11 rounded-[14px] bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-blue-500/20">
            H
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-blue-500 mb-0.5">
              Hospital Suite
            </p>
            <p className="text-[15px] font-bold text-slate-800 tracking-tight">Mental Health</p>
          </div>
        </div>
        <div className="space-y-1.5 flex-1">
          {items.map((item) => {
            const Icon = item.icon;
            // Exact match for dashboard, partial mapping for assessment/history
            const isActive = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                  ? "bg-blue-50/80 text-primary font-semibold shadow-[0_1px_3px_rgba(59,130,246,0.08)]" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                }`}
              >
                <Icon className={`w-5 h-5 transition-colors ${isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-600"}`} />
                <span className="text-[15px]">{item.label}</span>
              </Link>
            );
          })}
        </div>
        <div className="mt-auto pt-5 border-t border-slate-100">
          <button
            onClick={() => {
              void handleSignOut();
            }}
            className="group flex w-full items-center gap-3 px-3 py-3 rounded-xl text-[15px] font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
          >
            <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-500 transition-colors" /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile PWA Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/80 bg-white/90 backdrop-blur-xl pb-safe pt-1 px-2 xl:hidden pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-around h-16">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center justify-center w-full h-full gap-1 tap-highlight-transparent touch-manipulation group"
              >
                {isActive && (
                  <div className="absolute top-0 w-12 h-1 bg-primary rounded-b-full animate-in slide-in-from-bottom-1" />
                )}
                <Icon 
                  className={`h-6 w-6 transition-all duration-300 ${
                    isActive 
                      ? "text-primary scale-110 mb-0.5" 
                      : "text-slate-400 group-hover:text-slate-600"
                    }`} 
                />
                <span className={`text-[10px] tracking-wide transition-all duration-300 ${
                  isActive 
                    ? "font-bold text-primary" 
                    : "font-medium text-slate-500 group-hover:text-slate-700"
                }`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute inset-0 bg-blue-500/5 rounded-xl -z-10" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
