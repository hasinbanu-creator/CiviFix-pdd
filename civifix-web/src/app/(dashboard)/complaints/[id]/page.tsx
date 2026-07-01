"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import authService from "@/services/auth";
import { useParams, useRouter } from "next/navigation";
import { useComplaint } from "@/hooks/use-complaints";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  AlertCircle,
  Map,
  ClipboardList,
  Wrench,
  TreePine,
  Activity,
  Lightbulb,
  CheckCircle2,
  Clock,
  FolderOpen,
  XCircle,
  Info,
  MapPin,
  Navigation,
  FileText,
  User,
  ShieldCheck,
  HardHat,
  ChevronRight,
  Phone,
  Mail,
  Check,
  PenSquare,
  Play,
  X,
  History,
  MoreVertical
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { complaintsApi } from "@/services/api";

const STATUS_CONFIG: Record<string, { color: string, bg: string, border: string, icon: any, label: string }> = {
  PENDING:     { color: "text-accent", bg: "bg-accent/10", border: "border-accent/20", icon: Clock, label: "Pending" },
  OPEN:        { color: "text-accent", bg: "bg-accent/10", border: "border-accent/20", icon: FolderOpen, label: "Open" },
  ASSIGNED:    { color: "text-primary", bg: "bg-primary/10", border: "border-primary/20", icon: HardHat, label: "Assigned" },
  WORKING:     { color: "text-secondary", bg: "bg-secondary/10", border: "border-secondary/20", icon: Wrench, label: "In Progress" },
  IN_PROGRESS: { color: "text-secondary", bg: "bg-secondary/10", border: "border-secondary/20", icon: Wrench, label: "In Progress" },
  CLOSED:      { color: "text-success", bg: "bg-success/10", border: "border-success/20", icon: CheckCircle2, label: "Resolved" },
  RESOLVED:    { color: "text-success", bg: "bg-success/10", border: "border-success/20", icon: CheckCircle2, label: "Resolved" },
  REJECTED:    { color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20", icon: XCircle, label: "Rejected" },
};

const PRIORITY_CONFIG: Record<string, { color: string, bg: string, label: string }> = {
  LOW:      { color: "text-success", bg: "bg-success/10", label: "Low" },
  MEDIUM:   { color: "text-accent", bg: "bg-accent/10", label: "Medium" },
  HIGH:     { color: "text-destructive", bg: "bg-destructive/10", label: "High" },
  CRITICAL: { color: "text-destructive", bg: "bg-destructive/20", label: "Critical" },
};

const TYPE_META: Record<string, { icon: any, color: string, bg: string, title: string }> = {
  ROAD_DAMAGE:  { icon: Map, color: "text-destructive", bg: "bg-destructive/10", title: "Road Damage" },
  GARBAGE:      { icon: ClipboardList, color: "text-secondary", bg: "bg-secondary/10", title: "Waste Collection" },
  POTHOLE:      { icon: Map, color: "text-destructive", bg: "bg-destructive/10", title: "Pothole" },
  STREETLIGHT:  { icon: Lightbulb, color: "text-primary", bg: "bg-primary/10", title: "Street Light" },
  WATER_SUPPLY: { icon: Activity, color: "text-primary", bg: "bg-primary/10", title: "Water Supply" },
  DRAINAGE:     { icon: Wrench, color: "text-secondary", bg: "bg-secondary/10", title: "Drainage Issue" },
  SANITATION:   { icon: ClipboardList, color: "text-secondary", bg: "bg-secondary/10", title: "Sanitation" },
  TREE_CUTTING: { icon: TreePine, color: "text-success", bg: "bg-success/10", title: "Tree Issue" },
  CONSTRUCTION: { icon: Wrench, color: "text-accent", bg: "bg-accent/10", title: "Construction Block" },
  OTHER:        { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10", title: "Civic Issue" },
};

function InfoRow({ icon: Icon, label, value }: { icon: any, label: string, value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-4 mb-5">
      <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 mt-1 border border-border/50">
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mb-1">{label}</p>
        <p className="text-sm font-semibold text-foreground leading-relaxed">{value}</p>
      </div>
    </div>
  );
}

function NoteCard({ icon: Icon, label, value, colorClass, borderClass, bgClass }: any) {
  if (!value) return null;
  return (
    <div className={`border-l-4 ${borderClass} bg-muted/30 rounded-2xl p-5 mb-4`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-5 h-5 ${colorClass}`} />
        <span className={`text-sm font-bold ${colorClass}`}>{label}</span>
      </div>
      <p className="text-sm font-medium text-muted-foreground leading-relaxed">{value}</p>
    </div>
  );
}

export default function ComplaintDetailsPage() {
  const { user } = useAuth();
  const isPrivileged = user?.role === "INSPECTOR" || user?.role === "WORKER" || user?.role === "SUPER_ADMIN" || user?.role === "DISTRICT_ADMIN";
  const isInspectorOrWorker = user?.role === "INSPECTOR" || user?.role === "WORKER";
  
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data, isLoading: loading, refetch } = useComplaint(id);
  const complaint: any = data;
  const queryClient = useQueryClient();

  const [updating, setUpdating] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [newNote, setNewNote] = useState("");

  const updateStatus = async (newStatus: string) => {
    try {
      setUpdating(true);
      await complaintsApi.updateStatus(id, newStatus);
      refetch();
    } catch (e) {
      console.error(e);
      alert("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleStartWork = async () => {
    try {
      setUpdating(true);
      await authService.inspectorStartWork(id);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["ward-complaints"] });
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
    } catch (e) {
      console.error(e);
      alert("Failed to start work");
    } finally {
      setUpdating(false);
    }
  };

  const handleRejectConfirm = async () => {
    try {
      setUpdating(true);
      setShowRejectModal(false);
      await authService.inspectorRejectComplaint(id);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["ward-complaints"] });
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
    } catch (e) {
      console.error(e);
      alert("Failed to reject complaint");
    } finally {
      setUpdating(false);
    }
  };

  const handleResolveConfirm = async () => {
    try {
      setUpdating(true);
      setShowResolveModal(false);
      await authService.inspectorResolveComplaint(id);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["ward-complaints"] });
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
    } catch (e) {
      console.error(e);
      alert("Failed to resolve complaint");
    } finally {
      setUpdating(false);
    }
  };

  const addNote = async () => {
    try {
      setUpdating(true);
      await complaintsApi.addNote(id, { text: newNote });
      setNewNote("");
      setShowNotesModal(false);
      refetch();
    } catch (e) {
      console.error(e);
      alert("Failed to add note");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-background flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-bold text-muted-foreground">Loading details...</p>
        </div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="flex-1 bg-background flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-black text-foreground mb-2">Complaint Not Found</h2>
          <button onClick={() => router.back()} className="text-primary font-bold hover:underline">Go Back</button>
        </div>
      </div>
    );
  }

  const typeMeta = TYPE_META[complaint.complaint_type] || TYPE_META.OTHER;
  const statusCfg = STATUS_CONFIG[complaint.status] || STATUS_CONFIG.PENDING;
  const priorityCfg = PRIORITY_CONFIG[complaint.priority] || PRIORITY_CONFIG.MEDIUM;
  const StatusIcon = statusCfg.icon;
  const TypeIcon = typeMeta.icon;

  return (
    <div className="flex-1 bg-background min-h-screen pb-20 md:pb-8">
      
      {/* Header */}
      <div className="bg-primary pt-10 pb-16 px-6 md:px-12 md:rounded-b-[60px] rounded-b-[40px] shadow-lg flex items-start justify-between">
        <div className="max-w-3xl mx-auto w-full flex items-start justify-between">
          <div className="flex items-start gap-4">
            <button 
              onClick={() => router.back()}
              className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center hover:bg-white/30 transition-colors shadow-sm mt-1"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Complaint Details</h1>
              <p className="text-white/80 font-bold text-sm mt-1 bg-white/10 px-3 py-1 rounded-full inline-block">{complaint.complaint_id}</p>
            </div>
          </div>
          <div className={`w-4 h-4 rounded-full ${statusCfg.bg} border-[3px] border-white/50 shadow-sm mt-3`}></div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        
        {/* Hero Card */}
        <div className={`bg-card rounded-[2rem] p-6 shadow-md mb-6 border-t-[6px] ${statusCfg.border.replace('border-', 'border-t-')}`}>
          <div className="flex items-start gap-5 mb-6">
            <div className={`w-16 h-16 rounded-2xl ${typeMeta.bg} flex items-center justify-center shrink-0 border border-border/50`}>
              <TypeIcon className={`w-8 h-8 ${typeMeta.color}`} />
            </div>
            <div className="flex-1 mt-1">
              <h2 className="text-2xl font-black text-foreground tracking-tight leading-tight mb-2">
                {complaint.title || typeMeta.title}
              </h2>
              <p className="text-xs font-bold text-muted-foreground tracking-widest">{complaint.complaint_id}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 border-t border-border/50 pt-5 mt-2">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${statusCfg.border} ${statusCfg.bg}`}>
              <StatusIcon className={`w-5 h-5 ${statusCfg.color}`} />
              <span className={`text-sm font-bold ${statusCfg.color}`}>{statusCfg.label}</span>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border border-border ${priorityCfg.bg}`}>
              <AlertCircle className={`w-5 h-5 ${priorityCfg.color}`} />
              <span className={`text-sm font-bold ${priorityCfg.color}`}>{priorityCfg.label} Priority</span>
            </div>
            <div className="ml-auto text-sm font-bold text-muted-foreground flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-xl border border-border/50">
              <Clock className="w-4 h-4" />
              {new Date(complaint.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-card rounded-[2rem] p-6 shadow-sm border border-border mb-6">
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border/50">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Info className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-black text-foreground">Complaint Info</h3>
          </div>

          <InfoRow icon={FileText} label="Description" value={complaint.description} />
          <InfoRow icon={MapPin} label="Address" value={complaint.address} />
          <InfoRow 
            icon={Navigation} 
            label="Coordinates" 
            value={complaint.latitude && complaint.longitude ? `${complaint.latitude}, ${complaint.longitude}` : null} 
          />

          {(complaint.citizen_note || complaint.worker_note || complaint.inspector_note || complaint.rejection_reason) && (
            <>
              <div className="h-px bg-border my-8"></div>
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-black text-foreground">Notes</h3>
              </div>
              
              <NoteCard 
                icon={User} 
                label="Citizen Note" 
                value={complaint.citizen_note} 
                colorClass="text-primary" 
                borderClass="border-primary" 
              />
              <NoteCard 
                icon={HardHat} 
                label="Worker Note" 
                value={complaint.worker_note} 
                colorClass="text-secondary" 
                borderClass="border-secondary" 
              />
              <NoteCard 
                icon={ShieldCheck} 
                label="Inspector Note" 
                value={complaint.inspector_note} 
                colorClass="text-accent" 
                borderClass="border-accent" 
              />
              <NoteCard 
                icon={XCircle} 
                label="Rejection Reason" 
                value={complaint.rejection_reason} 
                colorClass="text-destructive" 
                borderClass="border-destructive" 
              />
            </>
          )}
        </div>

        {/* Citizen Information */}
        {isPrivileged && complaint.citizen && (
          <div className="bg-card rounded-[2rem] p-6 shadow-sm border border-border mb-6">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border/50">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <User className="w-5 h-5 text-success" />
              </div>
              <h3 className="text-lg font-black text-foreground">Citizen Information</h3>
            </div>
            <InfoRow icon={User} label="Name" value={complaint.citizen.name} />
            <InfoRow icon={Phone} label="Phone" value={complaint.citizen.phone} />
            <InfoRow icon={Mail} label="Email" value={complaint.citizen.email} />
          </div>
        )}

        {/* Activity Timeline */}
        {isPrivileged && complaint.history && complaint.history.length > 0 && (
          <div className="bg-card rounded-[2rem] p-6 shadow-sm border border-border mb-6">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border/50">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <History className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-black text-foreground">Activity Timeline</h3>
            </div>
            <div className="relative pl-8 border-l-2 border-border ml-5 pb-4 mt-4">
              {complaint.history.map((h: any, i: number) => {
                const s = STATUS_CONFIG[h.status] || STATUS_CONFIG.PENDING;
                return (
                  <div key={i} className="mb-8 relative">
                    <div className={`absolute -left-[41px] w-5 h-5 rounded-full border-[4px] border-card ${s.bg.replace('bg-', 'bg-').replace('10', '500')} shadow-sm`}></div>
                    <p className="text-sm font-black text-foreground">{s.label}</p>
                    <p className="text-xs font-bold text-muted-foreground mt-1">
                      {new Date(h.timestamp || h.created_at).toLocaleString()}
                    </p>
                    {h.remarks && (
                      <p className="text-sm font-medium text-muted-foreground mt-3 bg-muted/30 p-4 rounded-2xl border border-border/50">{h.remarks}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Inspector Actions — simplified workflow */}
        {user?.role === "INSPECTOR" && (
          <>
            {/* OPEN: Start Work + Reject */}
            {complaint.status === "OPEN" && (
              <div className="bg-card rounded-[2rem] p-6 shadow-sm border border-border mb-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <MoreVertical className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-black text-foreground">Complaint Actions</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    disabled={updating}
                    onClick={handleStartWork}
                    className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl py-4 text-sm font-bold shadow-md shadow-primary/20 disabled:opacity-50 transition-all hover:-translate-y-0.5"
                  >
                    <Play className="w-5 h-5" /> Start Work
                  </button>
                  <button
                    disabled={updating}
                    onClick={() => setShowRejectModal(true)}
                    className="flex items-center justify-center gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-2xl py-4 text-sm font-bold shadow-md shadow-destructive/20 disabled:opacity-50 transition-all hover:-translate-y-0.5"
                  >
                    <X className="w-5 h-5" /> Reject
                  </button>
                </div>
              </div>
            )}

            {/* IN_PROGRESS: Resolve */}
            {complaint.status === "IN_PROGRESS" && (
              <div className="bg-card rounded-[2rem] p-6 shadow-sm border border-border mb-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
                  <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  </div>
                  <h3 className="text-lg font-black text-foreground">Complaint Actions</h3>
                </div>
                <button
                  disabled={updating}
                  onClick={() => setShowResolveModal(true)}
                  className="w-full flex items-center justify-center gap-2 bg-success hover:bg-success/90 text-success-foreground rounded-2xl py-4 text-sm font-bold shadow-md shadow-success/20 disabled:opacity-50 transition-all hover:-translate-y-0.5"
                >
                  <Check className="w-5 h-5" /> Resolve Complaint
                </button>
              </div>
            )}
          </>
        )}

        {/* Notes Modal */}
        {showNotesModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-[2rem] p-8 w-full max-w-md shadow-2xl border border-border animate-in fade-in zoom-in duration-200">
              <h3 className="text-xl font-black text-foreground mb-6">Add Note</h3>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full h-32 bg-muted/30 border-2 border-border rounded-2xl p-5 text-sm font-medium text-foreground mb-6 focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-none"
                placeholder="Type your observations..."
              />
              <div className="flex gap-4">
                <button onClick={() => setShowNotesModal(false)} className="flex-1 bg-muted hover:bg-muted/80 text-foreground font-bold py-3.5 rounded-2xl transition-colors">Cancel</button>
                <button disabled={updating || !newNote} onClick={addNote} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 rounded-2xl shadow-md shadow-primary/20 disabled:opacity-50 transition-colors">Save Note</button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Confirmation Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-[2rem] p-8 w-full max-w-md shadow-2xl border border-border animate-in fade-in zoom-in duration-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                  <XCircle className="w-6 h-6 text-destructive" />
                </div>
                <h3 className="text-xl font-black text-foreground">Confirm Rejection</h3>
              </div>
              <p className="text-sm font-medium text-muted-foreground leading-relaxed mb-8">
                Have you physically inspected the reported location and confirmed that this complaint should be rejected?
              </p>
              <div className="flex gap-4">
                <button
                  disabled={updating}
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 bg-muted hover:bg-muted/80 text-foreground font-bold py-3.5 rounded-2xl disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={updating}
                  onClick={handleRejectConfirm}
                  className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold py-3.5 rounded-2xl shadow-md shadow-destructive/20 disabled:opacity-50 transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Resolve Confirmation Modal */}
        {showResolveModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-[2rem] p-8 w-full max-w-md shadow-2xl border border-border animate-in fade-in zoom-in duration-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-success" />
                </div>
                <h3 className="text-xl font-black text-foreground">Mark Resolved</h3>
              </div>
              <p className="text-sm font-medium text-muted-foreground leading-relaxed mb-8">
                Have you verified that the issue has been successfully resolved?
              </p>
              <div className="flex gap-4">
                <button
                  disabled={updating}
                  onClick={() => setShowResolveModal(false)}
                  className="flex-1 bg-muted hover:bg-muted/80 text-foreground font-bold py-3.5 rounded-2xl disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={updating}
                  onClick={handleResolveConfirm}
                  className="flex-1 bg-success hover:bg-success/90 text-success-foreground font-bold py-3.5 rounded-2xl shadow-md shadow-success/20 disabled:opacity-50 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
