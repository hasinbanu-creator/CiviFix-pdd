"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import authService from "@/services/auth";
import { useWards } from "@/hooks/use-wards";
import { useCreateComplaint } from "@/hooks/use-complaints";
import {
  AlertCircle,
  Map,
  ClipboardList,
  Wrench,
  MapPin,
  Activity,
  Trash2,
  Lightbulb,
  TreePine,
  CheckCircle2,
  ChevronDown,
  Navigation,
  FileText,
  Send,
  X
} from "lucide-react";

const COMPLAINT_TYPES = [
  { value: "GARBAGE",      label: "Garbage / Waste",      icon: Trash2,    color: "text-secondary", bg: "bg-secondary/10" },
  { value: "ROAD_DAMAGE",  label: "Road Damage",          icon: Map,       color: "text-destructive",  bg: "bg-destructive/10" },
  { value: "POTHOLE",      label: "Pothole",              icon: Map,       color: "text-destructive",  bg: "bg-destructive/10" },
  { value: "STREETLIGHT",  label: "Street Light",         icon: Lightbulb, color: "text-primary", bg: "bg-primary/10" },
  { value: "WATER_SUPPLY", label: "Water Supply",         icon: Activity,  color: "text-primary", bg: "bg-primary/10" },
  { value: "DRAINAGE",     label: "Drainage Issue",       icon: Wrench,    color: "text-secondary", bg: "bg-secondary/10" },
  { value: "SANITATION",   label: "Sanitation",           icon: ClipboardList, color: "text-secondary", bg: "bg-secondary/10" },
  { value: "TREE_CUTTING", label: "Tree / Fallen Branch", icon: TreePine,  color: "text-success", bg: "bg-success/10" },
  { value: "CONSTRUCTION", label: "Construction Block",   icon: Wrench,    color: "text-accent", bg: "bg-accent/10" },
  { value: "OTHER",        label: "Other Issue",          icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10" },
];

const PRIORITIES = [
  { value: "LOW",    label: "Low",    color: "text-success", bg: "bg-success/10", border: "border-success", icon: CheckCircle2 },
  { value: "MEDIUM", label: "Medium", color: "text-accent", bg: "bg-accent/10", border: "border-accent", icon: AlertCircle },
  { value: "HIGH",   label: "High",   color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive", icon: AlertCircle },
];

export default function CreateComplaintPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [form, setForm] = useState({
    ward_id: "",
    complaint_type: "",
    description: "",
    latitude: "",
    longitude: "",
    address: "",
    citizen_note: "",
    priority: "MEDIUM",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [createdComplaint, setCreatedComplaint] = useState<any>(null);
  const [step, setStep] = useState(1);
  const { data: wardsData, isLoading: wardsLoading } = useWards(user?.district || user?.district_id);
  const wards = wardsData?.data || [];
  const createComplaint = useCreateComplaint();

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleGetLocation = () => {
    setGpsLoading(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setGpsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lon = position.coords.longitude.toFixed(6);
        updateField("latitude", lat);
        updateField("longitude", lon);
        
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          const data = await res.json();
          if (data && data.display_name) {
            updateField("address", data.display_name);
          }
        } catch (error) {
          console.error("Failed to reverse geocode:", error);
          // Fallback if nominatim fails
          updateField("address", `${lat}, ${lon}`);
        }
        setGpsLoading(false);
      },
      (error) => {
        console.error(error);
        alert("Unable to retrieve your location");
        setGpsLoading(false);
      }
    );
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.ward_id) next.ward_id = "Please select a ward";
    if (!form.complaint_type) next.complaint_type = "Please select a complaint type";
    if (form.description.trim().length < 10) next.description = "Description must be at least 10 characters";
    if (!form.latitude || !form.longitude) next.location = "Please provide your location";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    setServerError("");
    try {
      const formData = new FormData();
      
      // The backend uses FastAPI Form(...) which expects multipart/form-data
      // We must append fields exactly as named in the Pydantic ComplaintCreateSchema
      formData.append("ward_id", form.ward_id);
      formData.append("complaint_type", form.complaint_type);
      formData.append("description", form.description);
      formData.append("latitude", String(form.latitude));
      formData.append("longitude", String(form.longitude));
      
      // Priority must be sent if we want to override the default
      if (form.priority) {
        formData.append("priority", form.priority);
      }
      
      if (form.address) {
        formData.append("address", form.address);
      }
      
      if (form.citizen_note) {
        formData.append("citizen_note", form.citizen_note.trim());
      }
      
      if (selectedImages.length === 0) {
        // If image upload is disabled or not used, we MUST still satisfy the backend's List[UploadFile] expectation
        formData.append("images", new Blob([""], { type: "application/octet-stream" }), "");
      } else {
        selectedImages.forEach((file) => {
          formData.append("images", file);
        });
      }
      
      console.log("Submitting Complaint as multipart/form-data");
      // Pass the FormData object directly; axios will automatically set the correct headers and boundaries.
      const result = await createComplaint.mutateAsync(formData as any);
      setCreatedComplaint(result);
      setShowSuccess(true);
    } catch (err: any) {
      // LOG COMPLETE ERROR BODY AS REQUESTED
      console.error("Submission failed!", err);
      console.error("Backend Response Data:", err?.response?.data);
      
      setServerError(
        err?.response?.data?.detail 
          ? JSON.stringify(err.response.data.detail)
          : err.message || "Unable to submit. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess && createdComplaint) {
    const complaintId = createdComplaint.complaint_id || createdComplaint.id || "N/A";
    const status = createdComplaint.status || "OPEN";
    
    return (
      <div className="flex-1 bg-background flex items-center justify-center p-6 animate-in fade-in zoom-in duration-500 min-h-[calc(100vh-100px)]">
        <div className="bg-card rounded-3xl p-8 max-w-md w-full text-center shadow-xl shadow-success/10 border border-success/20">
          <div className="w-24 h-24 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-black text-foreground mb-2">Complaint Submitted!</h2>
          
          <div className="bg-muted/30 rounded-2xl p-4 mb-6 text-left border border-border">
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-border/50">
              <span className="text-xs font-bold text-muted-foreground">Complaint ID</span>
              <span className="text-sm font-extrabold text-foreground">{complaintId}</span>
            </div>
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-border/50">
              <span className="text-xs font-bold text-muted-foreground">Status</span>
              <span className="text-xs font-black text-accent bg-accent/10 px-3 py-1 rounded-full">{status}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-muted-foreground">Est. Resolution</span>
              <span className="text-sm font-bold text-foreground">48 hours</span>
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex-1 py-3.5 px-4 bg-muted hover:bg-muted/80 text-foreground font-bold rounded-2xl transition-colors"
            >
              Done
            </button>
            <button
              onClick={() => router.push(`/complaints/${createdComplaint._id || createdComplaint.id}`)}
              className="flex-1 py-3.5 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-2xl transition-colors shadow-md shadow-primary/20"
            >
              View Complaint
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background relative pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-primary pt-12 pb-24 px-6 md:px-12 md:rounded-b-[60px] rounded-b-[40px] shadow-lg">
        <div className="max-w-3xl mx-auto">
           <h1 className="text-3xl font-black text-white tracking-tight">Raise a Complaint</h1>
           <p className="text-white/80 font-semibold mt-2 text-sm">Help us fix your community by reporting an issue.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10 pb-12">
        <div className="bg-card rounded-[2rem] p-6 shadow-md border border-border mb-6">
          <div className="flex justify-between items-center relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted z-0">
               <div className="h-full bg-primary transition-all duration-500" style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}></div>
            </div>
            {[1, 2, 3].map((s) => (
              <div key={s} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${step >= s ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30' : 'bg-muted text-muted-foreground border-2 border-border'}`}>
                {s}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3 px-1 text-xs font-bold text-muted-foreground uppercase tracking-widest">
            <span className={step >= 1 ? 'text-primary' : ''}>Issue</span>
            <span className={step >= 2 ? 'text-primary' : ''}>Location</span>
            <span className={step >= 3 ? 'text-primary' : ''}>Review</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Step 1: What's the issue */}
          <div className={`transition-all duration-500 ${step === 1 ? 'block animate-in fade-in slide-in-from-right-4' : 'hidden'}`}>
            <div className="bg-card rounded-[2rem] p-6 shadow-sm border border-border">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">What&apos;s the issue?</h2>
                  <p className="text-xs font-semibold text-muted-foreground">Type, description and priority</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground tracking-wider mb-2 uppercase">Complaint Type</label>
                  <div className="relative">
                    <select
                      value={form.complaint_type}
                      onChange={(e) => updateField("complaint_type", e.target.value)}
                      className={`w-full appearance-none bg-muted/30 border-2 ${errors.complaint_type ? 'border-destructive' : 'border-border'} rounded-2xl px-5 py-4 text-sm font-bold text-foreground outline-none focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/10 transition-all duration-200`}
                    >
                      <option value="" disabled>Select a category</option>
                      {COMPLAINT_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                  </div>
                  {errors.complaint_type && <p className="text-destructive text-xs font-bold mt-1.5 ml-1">{errors.complaint_type}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground tracking-wider mb-2 uppercase">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="Describe the issue clearly (min 10 characters)"
                    rows={4}
                    className={`w-full bg-muted/30 border-2 ${errors.description ? 'border-destructive' : 'border-border'} rounded-2xl px-5 py-4 text-sm font-medium text-foreground outline-none focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/10 transition-all duration-200 resize-none`}
                  />
                  {errors.description && <p className="text-destructive text-xs font-bold mt-1.5 ml-1">{errors.description}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground tracking-wider mb-3 uppercase">Priority</label>
                  <div className="flex gap-3">
                    {PRIORITIES.map(p => {
                      const isSelected = form.priority === p.value;
                      const Icon = p.icon;
                      return (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => updateField("priority", p.value)}
                          className={`flex-1 flex flex-col items-center gap-2 py-4 border-2 rounded-2xl transition-all duration-200 ${
                            isSelected ? `${p.bg} ${p.border} ${p.color} ring-4 ring-${p.color.split('-')[1]}/10` : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                          }`}
                        >
                          <Icon className="w-6 h-6" />
                          <span className="text-xs font-extrabold">{p.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground tracking-wider mb-2 uppercase">Upload Photos (Optional)</label>
                  <div className="border-2 border-dashed border-border rounded-2xl p-6 flex flex-col items-center justify-center bg-muted/20 hover:bg-muted/40 transition-colors relative cursor-pointer group">
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      onChange={(e) => {
                        if (e.target.files) {
                          setSelectedImages([...selectedImages, ...Array.from(e.target.files)]);
                        }
                      }}
                    />
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                       <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-sm font-bold text-foreground">Tap or drag images here</p>
                    <p className="text-xs font-medium text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
                  </div>
                  
                  {selectedImages.length > 0 && (
                    <div className="flex flex-wrap gap-3 mt-4">
                      {selectedImages.map((file, i) => (
                        <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border group shadow-sm">
                          <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedImages(selectedImages.filter((_, index) => index !== i));
                            }}
                            className="absolute top-1 right-1 bg-black/60 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    let isValid = true;
                    if (!form.complaint_type) { updateField("complaint_type", ""); isValid = false; }
                    if (form.description.length < 10) { updateField("description", ""); isValid = false; }
                    if (isValid) setStep(2);
                  }}
                  className="py-4 px-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-black text-sm tracking-wide shadow-md shadow-primary/20 transition-all hover:-translate-y-0.5"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>

          {/* Step 2: Where is it */}
          <div className={`transition-all duration-500 ${step === 2 ? 'block animate-in fade-in slide-in-from-right-4' : 'hidden'}`}>
            <div className="bg-card rounded-[2rem] p-6 shadow-sm border border-border">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Where is it?</h2>
                  <p className="text-xs font-semibold text-muted-foreground">Ward, address & GPS location</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground tracking-wider mb-2 uppercase">Ward</label>
                  <div className="relative">
                    <select
                      value={form.ward_id}
                      onChange={(e) => updateField("ward_id", e.target.value)}
                      disabled={wardsLoading}
                      className={`w-full appearance-none bg-muted/30 border-2 ${errors.ward_id ? 'border-destructive' : 'border-border'} rounded-2xl px-5 py-4 text-sm font-bold text-foreground outline-none focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/10 transition-all duration-200 disabled:opacity-50`}
                    >
                      <option value="" disabled>{wardsLoading ? "Loading wards..." : "Select your ward"}</option>
                      {wards.map((w: any) => (
                        <option key={w._id} value={w._id}>{w.ward_name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                  </div>
                  {errors.ward_id && <p className="text-destructive text-xs font-bold mt-1.5 ml-1">{errors.ward_id}</p>}
                </div>
                
                {errors.location && <p className="text-destructive text-xs font-bold mt-1.5 ml-1">{errors.location}</p>}

                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={gpsLoading}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-primary/10 text-primary hover:bg-primary/20 border-2 border-primary/20 rounded-2xl transition-all duration-200 font-bold text-sm"
                >
                  <Navigation className={`w-5 h-5 ${gpsLoading ? 'animate-spin' : ''}`} />
                  {gpsLoading ? "Getting location..." : "Use my current location"}
                </button>

                {(form.latitude || form.longitude) && (
                  <div className="flex items-center gap-3 bg-success/10 border border-success/30 rounded-2xl p-4">
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                    <span className="flex-1 text-sm font-bold text-success truncate">
                      {form.latitude}, {form.longitude}
                    </span>
                    <button
                      type="button"
                      onClick={() => { updateField("latitude", ""); updateField("longitude", ""); }}
                      className="p-1 hover:bg-success/20 rounded-lg text-success"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-muted-foreground tracking-wider mb-2 uppercase">Address / Landmark</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    placeholder="e.g. Near post office, Main Road"
                    className="w-full bg-muted/30 border-2 border-border rounded-2xl px-5 py-4 text-sm font-medium text-foreground outline-none focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/10 transition-all duration-200"
                  />
                </div>
              </div>
              
              <div className="mt-8 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="py-4 px-6 bg-muted hover:bg-muted/80 text-foreground rounded-2xl font-black text-sm tracking-wide transition-all"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    let isValid = true;
                    if (!form.ward_id) { updateField("ward_id", ""); isValid = false; }
                    if (!form.latitude || !form.longitude) {
                      setErrors((prev) => ({ ...prev, location: "Please use your current location to proceed" }));
                      isValid = false; 
                    }
                    if (isValid) setStep(3);
                  }}
                  className="py-4 px-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-black text-sm tracking-wide shadow-md shadow-primary/20 transition-all hover:-translate-y-0.5"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>

          {/* Step 3: Additional info & Review */}
          <div className={`transition-all duration-500 ${step === 3 ? 'block animate-in fade-in slide-in-from-right-4' : 'hidden'}`}>
            <div className="bg-card rounded-[2rem] p-6 shadow-sm border border-border">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Review & Submit</h2>
                  <p className="text-xs font-semibold text-muted-foreground">Add any final notes</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground tracking-wider mb-2 uppercase">Citizen Note (Optional)</label>
                <textarea
                  value={form.citizen_note}
                  onChange={(e) => updateField("citizen_note", e.target.value)}
                  placeholder="Anything else we should know?"
                  rows={3}
                  className="w-full bg-muted/30 border-2 border-border rounded-2xl px-5 py-4 text-sm font-medium text-foreground outline-none focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/10 transition-all duration-200 resize-none"
                />
              </div>
              
              <div className="mt-6 bg-muted/50 rounded-2xl p-4 border border-border/50">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Summary</p>
                <div className="space-y-2 text-sm font-medium">
                   <div className="flex justify-between"><span className="text-muted-foreground">Type:</span> <span className="text-foreground">{COMPLAINT_TYPES.find(t=>t.value===form.complaint_type)?.label}</span></div>
                   <div className="flex justify-between"><span className="text-muted-foreground">Priority:</span> <span className="text-foreground">{form.priority}</span></div>
                   <div className="flex justify-between"><span className="text-muted-foreground">Ward:</span> <span className="text-foreground truncate ml-4">{wards.find((w:any)=>w._id===form.ward_id)?.ward_name}</span></div>
                   {selectedImages.length > 0 && (
                     <div className="flex justify-between"><span className="text-muted-foreground">Attachments:</span> <span className="text-foreground">{selectedImages.length} photo(s)</span></div>
                   )}
                </div>
              </div>

              {serverError && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold p-5 rounded-2xl flex items-center gap-3 mt-6">
                  <AlertCircle className="w-6 h-6 shrink-0" />
                  {serverError}
                </div>
              )}
              
              <div className="mt-8 flex justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="py-4 px-6 bg-muted hover:bg-muted/80 text-foreground rounded-2xl font-black text-sm tracking-wide transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-4 bg-primary hover:bg-primary/90 disabled:opacity-70 text-primary-foreground rounded-2xl font-black text-sm tracking-wide flex items-center justify-center gap-2 shadow-md shadow-primary/20 transition-all hover:-translate-y-0.5"
                >
                  {loading ? (
                    <span>Submitting...</span>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Complaint
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
