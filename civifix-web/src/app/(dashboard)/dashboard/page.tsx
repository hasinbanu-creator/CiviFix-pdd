"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { 
  FlaskConical, 
  Search, 
  MapPin, 
  Bell, 
  ChevronRight,
  ClipboardList,
  AlertCircle,
  Activity,
  CheckCircle2,
  Clock,
  Wrench,
  Eye,
  Settings,
  Users,
  Map,
  ShieldCheck,
  Building2,
  FileText
} from "lucide-react";
import { useComplaints } from "@/hooks/use-complaints";
import { useInspectorDashboard, useAdminDashboard } from "@/hooks/use-dashboard";

// --- Types ---
type ComplaintStatus = "OPEN" | "WORKING" | "APPROVAL" | "CLOSED" | "REJECTED";
type ComplaintType = "ROAD_DAMAGE" | "POTHOLE" | "GARBAGE" | "STREETLIGHT" | "WATER_SUPPLY" | "DRAINAGE" | "SANITATION" | "TREE_CUTTING" | "CONSTRUCTION" | "OTHER";

// Mock Data / Styles - Updated with premium tokens
const STATUS_STYLES: Record<ComplaintStatus, { label: string; color: string; bg: string }> = {
  OPEN:     { label: "Pending",     color: "text-accent", bg: "bg-accent/10" },
  WORKING:  { label: "In Progress", color: "text-primary",  bg: "bg-primary/10" },
  APPROVAL: { label: "Review",      color: "text-secondary",  bg: "bg-secondary/10" },
  CLOSED:   { label: "Resolved",    color: "text-success", bg: "bg-success/10" },
  REJECTED: { label: "Rejected",    color: "text-destructive",   bg: "bg-destructive/10" },
};

const TYPE_META: Record<ComplaintType, { icon: React.ElementType; color: string; bg: string; title: string }> = {
  ROAD_DAMAGE:  { icon: Map, color: "text-destructive", bg: "bg-destructive/10", title: "Road Damage" },
  POTHOLE:      { icon: Map, color: "text-destructive", bg: "bg-destructive/10", title: "Pothole" },
  GARBAGE:      { icon: ClipboardList, color: "text-secondary", bg: "bg-secondary/10", title: "Waste Collection" },
  STREETLIGHT:  { icon: AlertCircle, color: "text-primary", bg: "bg-primary/10", title: "Street Light" },
  WATER_SUPPLY: { icon: Activity, color: "text-primary", bg: "bg-primary/10", title: "Water Supply" },
  DRAINAGE:     { icon: Wrench, color: "text-secondary", bg: "bg-secondary/10", title: "Drainage" },
  SANITATION:   { icon: ClipboardList, color: "text-secondary", bg: "bg-secondary/10", title: "Sanitation" },
  TREE_CUTTING: { icon: MapPin, color: "text-success", bg: "bg-success/10", title: "Tree Issue" },
  CONSTRUCTION: { icon: Wrench, color: "text-accent", bg: "bg-accent/10", title: "Construction" },
  OTHER:        { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10", title: "Civic Issue" },
};

const ROLE_META: Record<string, { label: string; color: string; bg: string; gradient: string }> = {
  SUPER_ADMIN:    { label: "Super Admin",    color: "text-primary", bg: "bg-primary/20", gradient: "from-primary to-slate-900" },
  DISTRICT_ADMIN: { label: "District Admin", color: "text-secondary", bg: "bg-secondary/20", gradient: "from-secondary to-indigo-900" },
  INSPECTOR:      { label: "Inspector",      color: "text-secondary", bg: "bg-secondary/20", gradient: "from-secondary to-slate-800" },
  WORKER:         { label: "Worker",         color: "text-success", bg: "bg-success/20", gradient: "from-success to-slate-900" },
  CITIZEN:        { label: "Citizen",        color: "text-accent", bg: "bg-accent/20", gradient: "from-primary to-slate-900" },
};

const ROLE_GREETING: Record<string, { title: string; sub: string }> = {
  SUPER_ADMIN:    { title: "Civifix", sub: "Super Admin Panel" },
  DISTRICT_ADMIN: { title: "Civifix", sub: "District Admin Panel" },
  INSPECTOR:      { title: "Civifix", sub: "Inspector Dashboard" },
  WORKER:         { title: "Civifix", sub: "Worker Dashboard" },
  CITIZEN:        { title: "Civifix", sub: "Citizen Platform" },
};

// --- Shared Components ---
function SectionTitle({ left, right, rightHref }: { left: string; right?: string; rightHref?: string }) {
  return (
    <div className="flex justify-between items-center mt-8 mb-5 px-1">
      <h3 className="text-base font-bold text-foreground">{left}</h3>
      {right && rightHref && (
        <Link href={rightHref} className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
          {right}
        </Link>
      )}
    </div>
  );
}

function MetricCard({ icon: Icon, value, label, colorClass, bgClass }: any) {
  return (
    <div className="flex-1 bg-card rounded-2xl p-5 flex flex-col items-center justify-center border border-border shadow-sm hover:shadow-md transition-all duration-300 min-h-[110px] hover:-translate-y-1">
      <div className={`w-12 h-12 rounded-xl ${bgClass} flex items-center justify-center mb-3`}>
        <Icon className={`w-6 h-6 ${colorClass}`} />
      </div>
      <p className="text-2xl font-black text-foreground">{value}</p>
      <p className="text-xs font-semibold text-muted-foreground text-center mt-1 uppercase tracking-wider">{label}</p>
    </div>
  );
}

function ComplaintItem({ complaint, index, total }: any) {
  const { user } = useAuth();
  const isInspector = user?.role === "INSPECTOR" || user?.role === "WORKER";
  
  const type = (complaint.complaint_type as ComplaintType) || "OTHER";
  const meta = TYPE_META[type] || TYPE_META.OTHER;
  const status = STATUS_STYLES[complaint.status as ComplaintStatus] || STATUS_STYLES.OPEN;
  const title = complaint.title || complaint.type || meta.title;
  const desc = complaint.description || "No description provided";
  const Icon = meta.icon;

  return (
    <Link 
      href={`/complaints/${complaint._id || complaint.complaint_id}`}
      className={`flex items-start p-5 hover:bg-muted/50 transition-colors duration-200 ${index !== total - 1 ? 'border-b border-border/50' : ''}`}
    >
      <div className={`w-12 h-12 rounded-xl ${meta.bg} flex items-center justify-center mr-4 shrink-0 mt-1 shadow-sm`}>
        <Icon className={`w-6 h-6 ${meta.color}`} />
      </div>
      <div className="flex-1 min-w-0 mr-4">
        <h4 className="text-base font-bold text-foreground truncate">{title}</h4>
        
        {isInspector ? (
          <div className="mt-1.5 space-y-1.5">
            <p className="text-sm font-medium text-muted-foreground truncate">{complaint.address || desc}</p>
            {complaint.ward?.ward_name && (
              <p className="text-xs font-semibold text-muted-foreground">Ward: <span className="text-foreground">{complaint.ward.ward_name}</span></p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold text-muted-foreground tracking-wider">
                {complaint.complaint_id || complaint._id || "#CIV-NEW"}
              </span>
              <span className="w-1 h-1 rounded-full bg-border"></span>
              <span className="text-xs font-bold text-foreground">
                {complaint.citizen?.name || "Citizen"}
              </span>
            </div>
            {complaint.created_at && (
              <p className="text-xs font-semibold text-muted-foreground mt-1">
                {new Date(complaint.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm font-medium text-muted-foreground truncate mt-1">{desc}</p>
            <p className="text-xs font-bold text-muted-foreground mt-1.5 uppercase tracking-wider">
              {complaint.complaint_id || complaint._id || "#CIV-NEW"}
            </p>
          </>
        )}
      </div>
      <div className="flex flex-col items-end gap-3 shrink-0">
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${status.bg} ${status.color}`}>
          {status.label}
        </span>
        {complaint.priority && isInspector && (
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${complaint.priority === 'HIGH' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
            {complaint.priority}
          </span>
        )}
        <ChevronRight className="w-5 h-5 text-muted-foreground mt-auto" />
      </div>
    </Link>
  );
}

function QuickActionBtn({ icon: Icon, title, colorClass, bgClass, href }: any) {
  return (
    <Link 
      href={href}
      className="flex-1 min-h-[100px] rounded-2xl bg-card border border-border flex flex-col items-center justify-center p-3 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
    >
      <div className={`w-12 h-12 rounded-full ${bgClass} flex items-center justify-center mb-3`}>
        <Icon className={`w-6 h-6 ${colorClass}`} />
      </div>
      <p className="text-xs leading-snug font-bold text-foreground text-center whitespace-pre-line">
        {title}
      </p>
    </Link>
  );
}

// --- Dashboards ---

function CitizenDashboard() {
  const { data: rawData, isLoading: loading } = useComplaints({ page: 1, limit: 10 });
  const data: any = rawData;
  const complaints = data?.data || [];

  const counts = useMemo(() => {
    if (data?.meta?.status_counts) {
      return {
        open: data.meta.status_counts.OPEN || 0,
        active: (data.meta.status_counts.WORKING || 0) + (data.meta.status_counts.APPROVAL || 0),
        closed: data.meta.status_counts.CLOSED || 0,
      };
    }
    return {
      open: complaints.filter((c: any) => c.status === "OPEN").length,
      active: complaints.filter((c: any) => ["WORKING", "APPROVAL"].includes(c.status)).length,
      closed: complaints.filter((c: any) => c.status === "CLOSED").length,
    };
  }, [complaints, data]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Profile Stats Row */}
      <div className="bg-card rounded-3xl p-6 shadow-md border border-border mb-8 mt-[-3rem] relative z-10 mx-4 md:mx-0">
        <div className="flex items-center justify-between">
          <div className="flex-1 text-center border-r border-border">
            <p className="text-3xl font-black text-foreground">{counts.open}</p>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Pending</p>
          </div>
          <div className="flex-1 text-center border-r border-border">
            <p className="text-3xl font-black text-foreground">{counts.active}</p>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Active</p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-3xl font-black text-foreground">{counts.closed}</p>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Resolved</p>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-0">
        <SectionTitle left="Quick Actions" />
        <div className="grid grid-cols-4 gap-3 md:gap-4">
          <QuickActionBtn icon={FlaskConical} title="Raise\nComplaint" colorClass="text-primary" bgClass="bg-primary/10" href="/complaints/create" />
          <QuickActionBtn icon={Search} title="Track\nStatus" colorClass="text-secondary" bgClass="bg-secondary/10" href="/complaints" />
          <QuickActionBtn icon={MapPin} title="Nearby\nOffices" colorClass="text-accent" bgClass="bg-accent/10" href="#" />
          <QuickActionBtn icon={Bell} title="Notifs" colorClass="text-muted-foreground" bgClass="bg-muted" href="/profile" />
        </div>

        <SectionTitle left="My Complaints" right="View All" rightHref="/complaints" />
        <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden mb-8">
          {loading ? (
            <div className="p-10 flex justify-center">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : complaints.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                 <ClipboardList className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-base font-bold text-foreground">No complaints found</p>
              <p className="text-sm font-medium text-muted-foreground mt-1">You haven't raised any complaints yet.</p>
            </div>
          ) : (
            complaints.map((c: any, i: number) => (
              <ComplaintItem key={c._id || c.id} complaint={c} index={i} total={complaints.length} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function InspectorDashboard() {
  const { data, isLoading } = useInspectorDashboard();

  if (isLoading) {
    return (
      <div className="p-10 flex justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-10 text-center flex flex-col items-center">
         <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <ClipboardList className="w-8 h-8 text-muted-foreground" />
         </div>
         <p className="text-base font-bold text-foreground">No data available</p>
      </div>
    );
  }

  const complaints = data.recent_complaints || [];
  const stats = data.stats || {};

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Profile Stats Row (Inspector specific) */}
      <div className="bg-card rounded-3xl p-6 shadow-md border border-border mb-8 mt-[-3rem] relative z-10 mx-4 md:mx-0">
        <div className="flex items-center justify-between">
          <div className="flex-1 text-center border-r border-border">
            <p className="text-3xl font-black text-foreground">{stats.total_complaints || 0}</p>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Total</p>
          </div>
          <div className="flex-1 text-center border-r border-border">
            <p className="text-3xl font-black text-foreground">{stats.pending || 0}</p>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Pending</p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-3xl font-black text-foreground">{stats.resolved_complaints || stats.resolved || 0}</p>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Resolved</p>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-0">
        {data.ward_info && (
          <div className="mb-8 bg-card rounded-3xl p-6 shadow-sm border border-border flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1">{data.ward_info.ward_name}</h3>
              <p className="text-sm font-medium text-muted-foreground">Ward Number: <span className="font-bold text-foreground">#{data.ward_info.ward_number}</span></p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Map className="w-6 h-6 text-primary" />
            </div>
          </div>
        )}

        <SectionTitle left="Complaint Overview" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <MetricCard icon={AlertCircle} value={stats.pending || 0} label="Pending" colorClass="text-accent" bgClass="bg-accent/10" />
          <MetricCard icon={Wrench} value={stats.in_progress || 0} label="In Progress" colorClass="text-primary" bgClass="bg-primary/10" />
          <MetricCard icon={Eye} value={data.pending_approvals || stats.for_review || 0} label="For Review" colorClass="text-secondary" bgClass="bg-secondary/10" />
          <MetricCard icon={CheckCircle2} value={stats.resolved_complaints || stats.resolved || 0} label="Resolved" colorClass="text-success" bgClass="bg-success/10" />
        </div>

        <SectionTitle left="Recent Complaints" right="View All" rightHref="/complaints" />
        <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden mb-8">
          {complaints.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center">
               <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <ClipboardList className="w-8 h-8 text-muted-foreground" />
               </div>
               <p className="text-base font-bold text-foreground">No complaints in your ward.</p>
            </div>
          ) : (
            complaints.map((c: any, i: number) => (
              <ComplaintItem key={c._id || c.id} complaint={c} index={i} total={complaints.length} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const { data, isLoading } = useAdminDashboard();

  if (isLoading) {
    return (
      <div className="p-10 flex justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-10 text-center flex flex-col items-center">
         <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <ClipboardList className="w-8 h-8 text-muted-foreground" />
         </div>
         <p className="text-base font-bold text-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 px-4 md:px-0">
      <SectionTitle left="District Overview" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MetricCard icon={Map} value={data.stats?.total_wards || 0} label="Wards" colorClass="text-primary" bgClass="bg-primary/10" />
        <MetricCard icon={Users} value={data.stats?.total_inspectors || 0} label="Inspectors" colorClass="text-secondary" bgClass="bg-secondary/10" />
        <MetricCard icon={FileText} value={data.stats?.total_complaints || 0} label="Complaints" colorClass="text-accent" bgClass="bg-accent/10" />
        <MetricCard icon={CheckCircle2} value={data.stats?.resolved_complaints || 0} label="Resolved" colorClass="text-success" bgClass="bg-success/10" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const role = user?.role || "CITIZEN";
  const roleMeta = ROLE_META[role] || ROLE_META.CITIZEN;
  const greeting = ROLE_GREETING[role] || ROLE_GREETING.CITIZEN;

  return (
    <div className="flex-1 bg-background relative pb-20 md:pb-8">
      {/* Dynamic Header Gradient */}
      <div className={`bg-gradient-to-br ${roleMeta.gradient} pt-12 pb-24 px-6 md:px-12 md:rounded-b-[60px] rounded-b-[40px] shadow-lg`}>
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-wide">{greeting.title}</h1>
              <p className="text-sm font-semibold text-white/80 mt-1">{greeting.sub}</p>
            </div>
          </div>
          <Link href="/profile" className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors md:hidden">
            <Bell className="w-5 h-5 text-white" />
          </Link>
        </div>

        {/* User Greeting */}
        <div className="mt-8 flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border-4 border-white/30 shadow-xl">
            <span className="text-3xl font-black text-white">
              {user?.name ? user.name.substring(0, 2).toUpperCase() : "US"}
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-white mb-1">{user?.name || "Welcome Back"}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-4 py-1.5 rounded-full text-xs font-black ${roleMeta.bg} ${roleMeta.color} border border-white/10`}>
                {roleMeta.label}
              </span>
            </div>
          </div>
        </div>
      </div>
      </div>
      {/* Role-based Dashboard Content */}
      <div className="max-w-7xl mx-auto w-full md:px-12">
        {role === "CITIZEN" && <CitizenDashboard />}
        {(role === "INSPECTOR" || role === "WORKER") && <InspectorDashboard />}
        {(role === "SUPER_ADMIN" || role === "DISTRICT_ADMIN") && <AdminDashboard />}
      </div>
    </div>
  );
}
