"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, ClipboardList, LogOut, Users } from "lucide-react";
import { signOut } from "@/lib/auth";

const items = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/assessment", label: "Start Assessment", icon: ClipboardList },
  { href: "/history", label: "Patient Records", icon: Users },
];

export default function Sidebar() {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <>
      <aside className="hidden xl:flex xl:w-72 xl:flex-col xl:gap-3 border-r border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-4">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-white font-bold">
            H
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Hospital Suite
            </p>
            <p className="text-sm font-semibold">Mental Health</p>
          </div>
        </div>
        <div className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
        <div className="mt-auto pt-4 border-t border-slate-100">
          <button
            onClick={() => {
              void handleSignOut();
            }}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white px-2 py-2 xl:hidden">
        <div className="grid grid-cols-3 gap-1">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center gap-1 rounded-md py-1 text-[11px] text-slate-600"
              >
                <Icon className="h-4 w-4" />
                <span>{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
