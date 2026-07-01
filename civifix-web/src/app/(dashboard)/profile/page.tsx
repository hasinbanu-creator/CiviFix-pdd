"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useComplaints } from "@/hooks/use-complaints";
import {
  User,
  Mail,
  Phone,
  MapPin,
  ClipboardList,
  UserCog,
  Bell,
  Settings,
  HelpCircle,
  Info,
  LogOut,
  ChevronRight,
  ShieldAlert,
  HardHat,
  Map
} from "lucide-react";

const ROLE_META: Record<string, { label: string, color: string, bg: string, gradient: string }> = {
  SUPER_ADMIN:    { label: "Super Admin",     color: "text-primary",    bg: "bg-primary/10",    gradient: "from-primary to-primary/80" },
  DISTRICT_ADMIN: { label: "District Admin",  color: "text-purple-600",  bg: "bg-purple-500/10",  gradient: "from-purple-600 to-purple-800" },
  INSPECTOR:      { label: "Inspector",       color: "text-secondary",    bg: "bg-secondary/10",    gradient: "from-secondary to-secondary/80" },
  WORKER:         { label: "Worker",          color: "text-success", bg: "bg-success/10", gradient: "from-success to-success/80" },
  CITIZEN:        { label: "Citizen",         color: "text-accent",   bg: "bg-accent/10",   gradient: "from-primary to-primary/90" },
};

function MenuItem({ icon: Icon, title, subtitle, colorClass, bgClass, danger, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center p-5 bg-card rounded-[2rem] mb-4 shadow-sm hover:shadow-md transition-all duration-300 border border-border group ${danger ? 'hover:border-destructive/30' : 'hover:border-primary/30'} hover:-translate-y-0.5`}
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 mr-4 ${danger ? 'bg-destructive/10 text-destructive' : `${bgClass} ${colorClass}`}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1 text-left">
        <h3 className={`text-base font-black ${danger ? 'text-destructive' : 'text-foreground'}`}>{title}</h3>
        {subtitle && <p className="text-sm text-muted-foreground font-semibold mt-0.5">{subtitle}</p>}
      </div>
      <ChevronRight className={`w-5 h-5 ${danger ? 'text-destructive/50 group-hover:text-destructive' : 'text-muted-foreground group-hover:text-primary'} transition-colors`} />
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-xs font-black text-muted-foreground tracking-widest uppercase mb-4 mt-8 px-2">
      {children}
    </h4>
  );
}

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const role = user?.role || "CITIZEN";
  const roleMeta = ROLE_META[role] || ROLE_META.CITIZEN;
  const displayName = user?.name || user?.full_name || "Welcome Back!";
  const displayEmail = user?.email || "";
  const displayPhone = user?.mobile_number || "";
  const district = user?.district || "";

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() || "?";
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to log out?")) {
      signOut();
      router.push("/login");
    }
  };

  // Stats
  const { data: rawComplaintsData } = useComplaints({ limit: 100 }, { enabled: role === "CITIZEN" });
  const complaintsData: any = rawComplaintsData;
  
  const stats = React.useMemo(() => {
    if (role !== "CITIZEN") {
      return [
        { value: "—", label: "Stat 1" },
        { value: "—", label: "Stat 2" },
        { value: "—", label: "Stat 3" },
      ];
    }
    
    if (complaintsData?.meta?.status_counts) {
      const counts = complaintsData.meta.status_counts;
      return [
        { value: complaintsData.meta.total_records?.toString() || "0", label: "Submitted" },
        { value: ((counts.WORKING || 0) + (counts.APPROVAL || 0)).toString(), label: "Active" },
        { value: (counts.CLOSED || 0).toString(), label: "Resolved" },
      ];
    }
    
    const complaints = complaintsData?.data || [];
    return [
      { value: complaints.length.toString(), label: "Submitted" },
      { value: complaints.filter((c: any) => ["WORKING", "APPROVAL"].includes(c.status)).length.toString(), label: "Active" },
      { value: complaints.filter((c: any) => c.status === "CLOSED").length.toString(), label: "Resolved" },
    ];
  }, [role, complaintsData]);

  return (
    <div className="flex-1 bg-background min-h-screen pb-20 md:pb-8">
      
      {/* Hero Header Card */}
      <div className={`bg-gradient-to-br ${roleMeta.gradient} pt-12 pb-16 px-6 md:px-12 md:rounded-b-[60px] rounded-b-[40px] shadow-lg`}>
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 max-w-3xl mx-auto">
          
          {/* Avatar */}
          <div className="w-28 h-28 rounded-full bg-white/20 border-[3px] border-white/30 flex items-center justify-center shrink-0 shadow-xl backdrop-blur-md">
            <span className="text-4xl font-black text-white">{getInitials(displayName)}</span>
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left mt-2">
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight">{displayName}</h1>
            
            <div className="flex flex-col md:flex-row items-center md:items-start gap-3 md:gap-6 mt-4">
              {displayEmail && (
                <div className="flex items-center gap-2 text-white/90">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm font-semibold">{displayEmail}</span>
                </div>
              )}
              {displayPhone && (
                <div className="flex items-center gap-2 text-white/90">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm font-semibold">{displayPhone}</span>
                </div>
              )}
              {district && (
                <div className="flex items-center gap-2 text-white/90">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-semibold">{district}</span>
                </div>
              )}
            </div>

            <div className="mt-5">
              <span className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/20 text-white border border-white/20 shadow-sm backdrop-blur-md`}>
                {roleMeta.label}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="max-w-3xl mx-auto mt-10 bg-white/10 backdrop-blur-md rounded-3xl py-5 flex items-center justify-center divide-x divide-white/20 border border-white/20 shadow-sm">
          {stats.map((stat, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-white">{stat.value}</span>
              <span className="text-xs font-bold text-white/80 uppercase tracking-widest mt-1">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-2 pb-12">
        
        {/* Role Specific Section */}
        {role === "CITIZEN" && (
          <>
            <SectionLabel>My Activity</SectionLabel>
            <MenuItem 
              icon={ClipboardList} 
              title="My Complaints" 
              subtitle="Track your submissions" 
              colorClass="text-primary" 
              bgClass="bg-primary/10" 
              onClick={() => router.push("/complaints")}
            />
          </>
        )}

        {/* Account Section */}
        <SectionLabel>Account</SectionLabel>
        <MenuItem 
          icon={UserCog} 
          title="Personal Information" 
          subtitle="Edit name, phone, address" 
          colorClass="text-primary" 
          bgClass="bg-primary/10" 
        />
        <MenuItem 
          icon={Bell} 
          title="Notifications" 
          subtitle="Manage your alerts" 
          colorClass="text-accent" 
          bgClass="bg-accent/10" 
        />
        <MenuItem 
          icon={Settings} 
          title="Settings" 
          subtitle="App preferences" 
          colorClass="text-secondary" 
          bgClass="bg-secondary/10" 
        />

        {/* Support Section */}
        <SectionLabel>Support</SectionLabel>
        <MenuItem 
          icon={HelpCircle} 
          title="Help & Support" 
          subtitle="FAQs, contact us" 
          colorClass="text-success" 
          bgClass="bg-success/10" 
        />
        <MenuItem 
          icon={Info} 
          title="About CiviFix" 
          subtitle="Version 1.0.0" 
          colorClass="text-primary" 
          bgClass="bg-primary/10" 
        />

        {/* Session Section */}
        <SectionLabel>Session</SectionLabel>
        <MenuItem 
          icon={LogOut} 
          title="Logout" 
          subtitle="You'll need to sign in again" 
          danger 
          onClick={handleLogout}
        />

        {/* Footer */}
        <div className="text-center mt-16 pb-6">
          <p className="text-sm font-black text-muted-foreground">CiviFix Web v1.0.0</p>
          <p className="text-xs font-bold text-muted-foreground/70 mt-1">© 2026 CiviFix. All rights reserved.</p>
        </div>

      </div>
    </div>
  );
}
