"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  User,
  LogOut,
  Menu,
  X,
  Bell,
  Building2,
  Map,
  Users
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const role = user?.role || "CITIZEN";

  // Define navigation based on role
  let navItems = [];
  if (role === "CITIZEN") {
    navItems = [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Raise Complaint", href: "/complaints/create", icon: PlusCircle },
      { name: "My Complaints", href: "/complaints", icon: FileText },
      { name: "Profile", href: "/profile", icon: User },
    ];
  } else if (role === "INSPECTOR" || role === "WORKER") {
    navItems = [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Complaints", href: "/complaints", icon: FileText },
      { name: "Profile", href: "/profile", icon: User },
    ];
  } else {
    // ADMIN roles
    navItems = [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Complaints", href: "/complaints", icon: FileText },
      { name: "Wards", href: "/wards", icon: Map },
      { name: "Users", href: "/users", icon: Users },
      { name: "Profile", href: "/profile", icon: User },
    ];
  }

  const handleSignOut = () => {
    signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background flex text-foreground">
      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden md:flex flex-col w-72 bg-card border-r border-border fixed h-full z-20 shadow-sm transition-all duration-300">
        <div className="p-8 border-b border-border/50 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md shadow-primary/20 overflow-hidden bg-white">
            <img src="/logo.png" alt="CiviFix" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="font-bold text-foreground tracking-tight text-xl leading-tight">CiviFix</h2>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-0.5">{role}</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-200 font-medium text-sm ${
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-[1.02]"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-border/50">
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center gap-3 px-4 py-3.5 w-full rounded-2xl transition-all duration-200 font-semibold text-sm text-destructive hover:bg-destructive/10 hover:scale-[1.02]"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── MOBILE HEADER & MENU ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden shadow-sm shadow-primary/20 bg-white">
            <img src="/logo.png" alt="CiviFix" className="w-full h-full object-cover" />
          </div>
          <h2 className="font-bold text-foreground tracking-tight text-lg">CiviFix</h2>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-foreground p-1">
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-background z-20 flex flex-col animate-in fade-in slide-in-from-top-4 duration-200">
          <nav className="flex-1 px-4 py-6 space-y-3 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-medium text-base ${
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className={`w-6 h-6 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="p-6 border-t border-border/50 bg-card">
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center gap-3 px-4 py-4 w-full rounded-2xl transition-all font-semibold text-base text-destructive bg-destructive/10 hover:bg-destructive/20"
            >
              <LogOut className="w-6 h-6" />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT AREA ── */}
      <main className="flex-1 md:ml-72 pt-16 md:pt-0 min-h-screen flex flex-col relative w-full overflow-x-hidden">
        {/* Desktop Header/Topbar (Optional but good for premium feel) */}
        <div className="hidden md:flex h-20 items-center justify-end px-8 bg-transparent w-full z-10 absolute top-0 right-0 pointer-events-none">
           <div className="pointer-events-auto flex items-center gap-4">
             <button className="w-10 h-10 rounded-full bg-card shadow-sm border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all cursor-pointer">
               <Bell className="w-5 h-5" />
             </button>
             <div className="flex items-center gap-3 bg-card py-2 px-3 rounded-full shadow-sm border border-border cursor-pointer hover:border-primary/50 transition-all">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {user?.name?.charAt(0) || "U"}
                </div>
                <div className="hidden lg:block pr-2">
                  <p className="text-sm font-semibold text-foreground leading-none">{user?.name || "User"}</p>
                </div>
             </div>
           </div>
        </div>

        {/* Content Container with proper padding */}
        <div className="flex-1 p-4 md:p-8 md:pt-24 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
