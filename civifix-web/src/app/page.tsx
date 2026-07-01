"use client";

import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import {
  Building2,
  CheckCircle,
  Clock,
  FileText,
  MapPin,
  ShieldCheck,
  ArrowRight,
  Activity,
  User,
  LogOut
} from "lucide-react";

export default function Home() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden bg-primary/5 p-1">
              <img src="/logo.png" alt="CiviFix" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-foreground block leading-tight">
                CiviFix
              </span>
              <span className="text-xs font-bold text-muted-foreground tracking-widest uppercase block">
                Citizen Portal
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
            <Link href="/complaints" className="hover:text-primary transition-colors">My Complaints</Link>
            <Link href="/complaints/create" className="hover:text-primary transition-colors">Raise Issue</Link>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-muted/50 hover:bg-muted transition-colors text-sm font-bold border border-border/50 shadow-sm"
                >
                  <User className="w-4 h-4 text-primary" />
                  <span className="hidden sm:inline text-foreground">{user.name}</span>
                </Link>
                <button
                  onClick={signOut}
                  className="p-2.5 rounded-2xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-6 py-3 rounded-2xl text-sm font-black text-primary-foreground bg-primary hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/30 active:scale-95 border border-primary/20"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground py-24 sm:py-32">
        {/* Decorative elements */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full border-[60px] border-white/10 pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] rounded-full border-[40px] border-white/5 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-black/0 via-black/10 to-black/30 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-black tracking-widest text-primary-foreground mb-8 uppercase shadow-sm">
              <Activity className="w-4 h-4 text-white animate-pulse" />
              Empowering communities together
            </div>
            <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-[1.05] mb-6">
              India&apos;s #1 Civic <br />
              <span className="text-white/90">
                Issue Reporting Portal
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-primary-foreground/80 leading-relaxed mb-10 max-w-2xl font-semibold">
              File complaints, track solutions, and coordinate with municipal officers to repair roads, fix streetlights, clean garbage, and rebuild your neighborhood.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/complaints/create"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-black text-primary bg-background hover:bg-muted transition-all hover:shadow-xl hover:shadow-black/20 active:scale-95 text-center border-2 border-transparent"
              >
                File a Complaint
                <ArrowRight className="w-5 h-5 text-primary" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center px-8 py-4 rounded-2xl text-base font-black text-primary-foreground bg-white/10 hover:bg-white/20 border-2 border-white/30 transition-all active:scale-95 text-center backdrop-blur-sm"
              >
                View Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>


      {/* HOW IT WORKS */}
      <section className="py-24 sm:py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-grow relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10"></div>
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl sm:text-5xl font-black text-foreground tracking-tight mb-6">
            How CiviFix Helps Your City
          </h2>
          <p className="text-muted-foreground font-semibold text-lg leading-relaxed">
            Report issues in seconds, track actions, and coordinate with municipal officers to resolve public issues quickly and efficiently.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              step: "01",
              title: "Report",
              desc: "Snap a photo, select the issue category (road damage, streetlights, garbage), choose the ward, and submit in seconds.",
              bg: "bg-primary/10",
              text: "text-primary",
              border: "border-primary/20",
              shadow: "hover:shadow-primary/10"
            },
            {
              step: "02",
              title: "Assign",
              desc: "Municipal administrators inspect your report and automatically dispatch the designated inspector and field workers.",
              bg: "bg-secondary/10",
              text: "text-secondary",
              border: "border-secondary/20",
              shadow: "hover:shadow-secondary/10"
            },
            {
              step: "03",
              title: "Resolve",
              desc: "Assigned field workers repair the issue, snap a resolution photo, and submit it for validation by the ward inspector.",
              bg: "bg-success/10",
              text: "text-success",
              border: "border-success/20",
              shadow: "hover:shadow-success/10"
            },
            {
              step: "04",
              title: "Track",
              desc: "Monitor progress in real-time through an interactive status timeline. Receive instant alerts on your portal.",
              bg: "bg-accent/10",
              text: "text-accent",
              border: "border-accent/20",
              shadow: "hover:shadow-accent/10"
            }
          ].map((item, i) => (
            <div
              key={i}
              className={`p-8 bg-card border ${item.border} rounded-[2rem] shadow-sm hover:shadow-xl ${item.shadow} transition-all hover:-translate-y-1.5 duration-300 relative group`}
            >
              <span className={`inline-flex items-center justify-center px-4 py-2 rounded-xl ${item.bg} ${item.text} text-xs font-black tracking-widest uppercase mb-6 border border-current/10`}>
                Step {item.step}
              </span>
              <h3 className={`text-2xl font-black text-foreground group-hover:${item.text} transition-colors mb-4`}>
                {item.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed font-semibold">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-card border-t border-border py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight block leading-tight text-foreground">CiviFix</span>
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Municipal Portal</span>
            </div>
          </div>
          <p className="text-sm font-semibold text-muted-foreground">
            © {new Date().getFullYear()} CiviFix India. All rights reserved. Secure government communication.
          </p>
          <div className="flex items-center gap-6 text-sm font-bold text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
