"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useComplaints, useWardComplaints, useAssignedComplaints } from "@/hooks/use-complaints";
import {
  Search,
  Plus,
  ClipboardList,
  Clock,
  FolderOpen,
  Wrench,
  CheckCircle2,
  XCircle,
  Map,
  Activity,
  TreePine,
  AlertCircle,
  ChevronRight,
  Filter,
  Trash2,
  Lightbulb
} from "lucide-react";

// --- Types ---
type ComplaintStatus = "OPEN" | "WORKING" | "APPROVAL" | "CLOSED" | "REJECTED" | "IN_PROGRESS" | "RESOLVED";
type ComplaintType = "ROAD_DAMAGE" | "POTHOLE" | "GARBAGE" | "STREETLIGHT" | "WATER_SUPPLY" | "DRAINAGE" | "SANITATION" | "TREE_CUTTING" | "CONSTRUCTION" | "OTHER";

// --- Design Tokens ---
const FILTERS = [
  { key: "ALL",         label: "All",         icon: ClipboardList },
  { key: "OPEN",        label: "Pending",      icon: FolderOpen },
  { key: "IN_PROGRESS", label: "In Progress",  icon: Wrench },
  { key: "WORKING",     label: "In Progress",  icon: Wrench },
  { key: "RESOLVED",    label: "Resolved",     icon: CheckCircle2 },
  { key: "CLOSED",      label: "Resolved",     icon: CheckCircle2 },
  { key: "REJECTED",    label: "Rejected",     icon: XCircle },
];

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  OPEN:        { label: "Pending",     color: "text-accent",    bg: "bg-accent/10" },
  WORKING:     { label: "In Progress", color: "text-primary",   bg: "bg-primary/10" },
  IN_PROGRESS: { label: "In Progress", color: "text-primary",    bg: "bg-primary/10" },
  APPROVAL:    { label: "Review",      color: "text-secondary",    bg: "bg-secondary/10" },
  CLOSED:      { label: "Resolved",    color: "text-success", bg: "bg-success/10" },
  RESOLVED:    { label: "Resolved",    color: "text-success", bg: "bg-success/10" },
  REJECTED:    { label: "Rejected",    color: "text-destructive",     bg: "bg-destructive/10" },
};

const TYPE_META: Record<string, { icon: React.ElementType; color: string; bg: string; title: string }> = {
  ROAD_DAMAGE:  { icon: Map, color: "text-destructive", bg: "bg-destructive/10", title: "Road Damage" },
  POTHOLE:      { icon: Map, color: "text-destructive", bg: "bg-destructive/10", title: "Pothole" },
  GARBAGE:      { icon: Trash2, color: "text-secondary", bg: "bg-secondary/10", title: "Waste Collection" },
  STREETLIGHT:  { icon: Lightbulb, color: "text-primary", bg: "bg-primary/10", title: "Street Light" },
  WATER_SUPPLY: { icon: Activity, color: "text-primary", bg: "bg-primary/10", title: "Water Supply" },
  DRAINAGE:     { icon: Wrench, color: "text-secondary", bg: "bg-secondary/10", title: "Drainage" },
  SANITATION:   { icon: ClipboardList, color: "text-secondary", bg: "bg-secondary/10", title: "Sanitation" },
  TREE_CUTTING: { icon: TreePine, color: "text-success", bg: "bg-success/10", title: "Tree Issue" },
  CONSTRUCTION: { icon: Wrench, color: "text-accent", bg: "bg-accent/10", title: "Construction" },
  OTHER:        { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10", title: "Civic Issue" },
};

export default function ComplaintsListPage() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState("ALL");
  const role = user?.role || "CITIZEN";

  const isCitizen = role === "CITIZEN";
  const isInspector = role === "INSPECTOR";
  const isWorker = role === "WORKER";
  
  const queryParams = { limit: 50, ...(activeFilter !== "ALL" ? { status: activeFilter } : {}) };

  const citizenQuery = useComplaints(queryParams, { enabled: isCitizen || role === "SUPER_ADMIN" || role === "DISTRICT_ADMIN" });
  const inspectorQuery = useWardComplaints(queryParams, { enabled: isInspector });
  const workerQuery = useAssignedComplaints(queryParams, { enabled: isWorker });

  const activeQuery = isInspector ? inspectorQuery : isWorker ? workerQuery : citizenQuery;
  const loading = activeQuery.isLoading;
  const data: any = activeQuery.data;
  // Inspector API returns { complaints: [...] }, citizen API returns { data: [...] }
  const complaints = data?.complaints || data?.data || [];
  const filteredComplaints = complaints;
  console.log("activeQuery.data", activeQuery.data);
  console.log("complaints", complaints);

  const counts = useMemo(() => {
    const acc: Record<string, number> = {};
    complaints.forEach((c: any) => {
      const s = c.status || "OPEN";
      acc[s] = (acc[s] || 0) + 1;
    });
    return acc;
  }, [complaints]);

  const summaryChips = [
    { label: "Total", value: complaints.length, colorClass: "text-foreground" },
    { label: "Active", value: (counts.OPEN || 0) + (counts.WORKING || 0) + (counts.IN_PROGRESS || 0) + (counts.APPROVAL || 0), colorClass: "text-primary" },
    { label: "Resolved", value: (counts.CLOSED || 0) + (counts.RESOLVED || 0), colorClass: "text-success" },
    { label: "Rejected", value: counts.REJECTED || 0, colorClass: "text-destructive" },
  ];

  return (
    <div className="flex-1 bg-background min-h-screen pb-20 md:pb-8">
      
      {/* Header */}
      <div className="bg-primary pt-12 pb-16 px-6 md:px-12 md:rounded-b-[60px] rounded-b-[40px] shadow-lg flex items-center justify-between sticky top-0 z-20 md:static">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
           <div>
             <h1 className="text-3xl font-black text-white tracking-tight">My Complaints</h1>
             <p className="text-white/80 font-semibold mt-2">Track your civic issues</p>
           </div>
           <Link 
             href="/complaints/create"
             className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 transition-colors shadow-sm"
           >
             <Plus className="w-6 h-6 text-white" />
           </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full -mt-8 relative z-10">
        
        {/* Summary Chips */}
        {!loading && complaints.length > 0 && (
          <div className="mx-6 md:mx-12 bg-card rounded-3xl flex shadow-md border border-border py-4 divide-x divide-border">
            {summaryChips.map(chip => (
              <div key={chip.label} className="flex-1 flex flex-col items-center justify-center">
                <span className={`text-2xl font-black ${chip.colorClass}`}>{chip.value}</span>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">{chip.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Filter Tabs */}
        {!loading && complaints.length > 0 && (
          <div className="mt-8 px-6 md:px-12 overflow-x-auto no-scrollbar">
            <div className="flex gap-3 pb-2">
              {FILTERS.map(f => {
                const isSelected = activeFilter === f.key;
                const count = f.key === "ALL" ? complaints.length : (counts[f.key] || 0);
                const Icon = f.icon;
                
                return (
                  <button
                    key={f.key}
                    onClick={() => setActiveFilter(f.key)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full whitespace-nowrap transition-all duration-200 border-2 ${
                      isSelected 
                        ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20' 
                        : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                    <span className={`text-xs font-bold ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`}>
                      {f.label}
                    </span>
                    {count > 0 && (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Result Count */}
        {!loading && complaints.length > 0 && (
          <div className="px-6 md:px-12 mt-6 mb-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              {filteredComplaints.length} {activeFilter === "ALL" ? "total" : activeFilter.toLowerCase().replace("_", " ")} complaints
            </p>
          </div>
        )}

        {/* Complaint List */}
        <div className="px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12 mt-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 col-span-full">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-bold text-muted-foreground mt-4">Loading complaints...</p>
            </div>
          ) : complaints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center col-span-full">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
                <ClipboardList className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-black text-foreground mb-2">No complaints yet</h3>
              <p className="text-sm font-semibold text-muted-foreground mb-8 max-w-md">Raise your first civic issue and follow its status right here.</p>
              <Link 
                href="/complaints/create"
                className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20 hover:-translate-y-1"
              >
                <Plus className="w-5 h-5" />
                Raise a Complaint
              </Link>
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center col-span-full">
              <Filter className="w-12 h-12 text-muted-foreground mb-6" />
              <p className="text-sm font-bold text-muted-foreground">No {activeFilter.toLowerCase().replace("_", " ")} complaints found.</p>
              <button 
                onClick={() => setActiveFilter("ALL")}
                className="text-primary font-black text-sm mt-4 hover:underline"
              >
                Show all
              </button>
            </div>
          ) : (
            filteredComplaints.map((complaint: any) => {
              const type = complaint.complaint_type || "OTHER";
              const meta = TYPE_META[type] || TYPE_META.OTHER;
              const status = STATUS_STYLES[complaint.status as string] || STATUS_STYLES.OPEN;
              const IconType = meta.icon;

              return (
                <Link
                  key={complaint._id}
                  href={`/complaints/${complaint._id || complaint.complaint_id}`}
                  className="block bg-card rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-border group relative overflow-hidden hover:-translate-y-1"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl ${meta.bg} flex items-center justify-center shrink-0 shadow-sm border border-border/50`}>
                      <IconType className={`w-7 h-7 ${meta.color}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-lg font-black text-foreground truncate mb-1.5">
                          {complaint.title || meta.title}
                        </h4>
                        <span className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-black ${status.bg} ${status.color} uppercase`}>
                          {status.label}
                        </span>
                      </div>
                      
                      {isInspector || isWorker ? (
                        <div className="mb-4 space-y-1.5">
                          <p className="text-sm font-medium text-muted-foreground line-clamp-1">{complaint.address || complaint.description}</p>
                          {complaint.ward?.ward_name && (
                            <p className="text-xs font-bold text-muted-foreground">Ward: <span className="text-foreground">{complaint.ward.ward_name}</span></p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs font-bold text-muted-foreground">
                              {complaint.citizen?.name || "Citizen"}
                            </span>
                            {complaint.citizen?.phone && (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-border"></span>
                                <span className="text-xs font-bold text-muted-foreground">{complaint.citizen.phone}</span>
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm font-medium text-muted-foreground line-clamp-2 mb-4">
                          {complaint.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-2 pt-4 border-t border-border/50">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black text-muted-foreground tracking-wider bg-muted px-2.5 py-1 rounded-md">
                            {complaint.complaint_id || complaint._id}
                          </span>
                          <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(complaint.created_at).toLocaleDateString()}
                          </span>
                          {complaint.priority && (isInspector || isWorker) && (
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black ${complaint.priority === 'HIGH' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                              {complaint.priority}
                            </span>
                          )}
                        </div>
                        
                        <div className="w-10 h-10 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* Floating Action Button (Mobile mostly) */}
        {!loading && complaints.length > 0 && (
          <Link
            href="/complaints/create"
            className="md:hidden fixed bottom-6 right-6 w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-xl shadow-primary/40 text-primary-foreground z-20 hover:scale-105 transition-transform"
          >
            <Plus className="w-7 h-7" />
          </Link>
        )}

      </div>
    </div>
  );
}
