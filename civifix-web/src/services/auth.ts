import api, { unwrapResponse } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoints";

export interface UserSession {
  access_token: string;
  refresh_token?: string;
  user?: any;
}

export interface UserProfile {
  id: string | number;
  email: string;
  name: string;
  role: string;
  [key: string]: any;
}

export interface Complaint {
  id: string | number;
  title: string;
  description: string;
  status: string;
  [key: string]: any;
}

const storeSession = (session: UserSession) => {
  if (!session?.access_token) return;
  if (typeof window !== "undefined") {
    localStorage.setItem("authToken", session.access_token);
    if (session.refresh_token) {
      localStorage.setItem("refreshToken", session.refresh_token);
    }
  }
};

const e2eMocksEnabled = process.env.NEXT_PUBLIC_E2E_MOCKS === "true";

const getE2EUser = (): UserProfile => {
  const role = typeof window !== "undefined" ? (localStorage.getItem("e2eRole") || "CITIZEN") : "CITIZEN";
  return {
    id: "e2e-user-1",
    email: "selenium-test@civifix.local",
    name: "Selenium " + role,
    role: role,
    mobile_number: "9876543210",
    district: "e2e-district-1",
    district_id: "e2e-district-1",
  };
};

const e2eComplaints = [
  {
    _id: "e2e-complaint-1",
    complaint_id: "CIV-E2E-001",
    complaint_type: "GARBAGE",
    title: "Waste Collection",
    description: "Garbage has not been collected near the community park.",
    status: "OPEN",
    priority: "MEDIUM",
    address: "Near post office, Main Road",
    created_at: "2026-06-01T08:00:00.000Z",
  },
  {
    _id: "e2e-complaint-2",
    complaint_id: "CIV-E2E-002",
    complaint_type: "ROAD_DAMAGE",
    title: "Road Damage",
    description: "Pothole on the main market road requires repair.",
    status: "WORKING",
    priority: "HIGH",
    address: "Market Road",
    created_at: "2026-06-02T08:00:00.000Z",
  },
  {
    _id: "e2e-complaint-3",
    complaint_id: "CIV-E2E-003",
    complaint_type: "STREETLIGHT",
    title: "Street Light",
    description: "Streetlight is not working near the bus stop.",
    status: "CLOSED",
    priority: "LOW",
    address: "Bus stop lane",
    created_at: "2026-06-03T08:00:00.000Z",
  },
];

const e2eWards = [
  { _id: "e2e-ward-1", ward_name: "Ward 1 - Central", ward_number: 1 },
  { _id: "e2e-ward-2", ward_name: "Ward 2 - Market", ward_number: 2 },
];

const e2eSession = (): UserSession => ({
  access_token: "e2e-access-token",
  refresh_token: "e2e-refresh-token",
  user: getE2EUser(),
});

export const authService = {
  register: async (userData: any): Promise<any> => {
    if (e2eMocksEnabled) return { message: "OTP sent", user: userData };
    const response = await api.post(ENDPOINTS.REGISTER, userData);
    return unwrapResponse(response);
  },

  login: async (email: string): Promise<any> => {
    if (e2eMocksEnabled) return { message: "OTP sent", email };
    const response = await api.post(ENDPOINTS.LOGIN, { email });
    return unwrapResponse(response);
  },

  verifyLogin: async (email: string, otp: string): Promise<UserSession> => {
    if (e2eMocksEnabled) {
      const session = e2eSession();
      storeSession(session);
      return session;
    }
    const response = await api.post(ENDPOINTS.VERIFY_LOGIN, { email, otp });
    const session = unwrapResponse<UserSession>(response);
    storeSession(session);
    return session;
  },

  verifyRegister: async (email: string, otp: string): Promise<UserSession> => {
    if (e2eMocksEnabled) {
      const session = e2eSession();
      storeSession(session);
      return session;
    }
    const response = await api.post(ENDPOINTS.VERIFY_REGISTER, { email, otp });
    const session = unwrapResponse<UserSession>(response);
    storeSession(session);
    return session;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post(ENDPOINTS.LOGOUT);
    } catch (error) {
      console.warn("Logout API failed, clearing local storage", error);
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    }
  },

  getProfile: async (): Promise<UserProfile> => {
    if (e2eMocksEnabled) return getE2EUser();
    const response = await api.get(ENDPOINTS.GET_PROFILE);
    return unwrapResponse<UserProfile>(response);
  },

  updateProfile: async (userData: any): Promise<UserProfile> => {
    if (e2eMocksEnabled) return { ...getE2EUser(), ...userData };
    const response = await api.put(ENDPOINTS.UPDATE_PROFILE, userData);
    return unwrapResponse<UserProfile>(response);
  },

  getComplaints: async ({ page = 1, limit = 10, status }: { page?: number; limit?: number; status?: string } = {}): Promise<any> => {
    if (e2eMocksEnabled) {
      const filtered = status ? e2eComplaints.filter((c) => c.status === status) : e2eComplaints;
      return {
        data: filtered.slice(0, limit),
        meta: {
          page,
          limit,
          total_records: filtered.length,
          status_counts: { OPEN: 1, WORKING: 1, APPROVAL: 0, CLOSED: 1, REJECTED: 0 },
        },
      };
    }
    const response = await api.get(ENDPOINTS.GET_COMPLAINTS, {
      params: { page, limit, status },
    });
    return unwrapResponse(response);
  },

  getComplaint: async (id: string | number): Promise<Complaint> => {
    if (e2eMocksEnabled) return (e2eComplaints.find((c) => c._id === id || c.complaint_id === id) || e2eComplaints[0]) as unknown as Complaint;
    const response = await api.get(ENDPOINTS.GET_COMPLAINT(id));
    return unwrapResponse<Complaint>(response);
  },

  createComplaint: async (complaintData: any): Promise<Complaint> => {
    if (e2eMocksEnabled) {
      return {
        id: "e2e-created-1",
        _id: "e2e-created-1",
        complaint_id: "CIV-E2E-NEW",
        status: "OPEN",
        title: "Created Complaint",
        description: complaintData.description,
        ...complaintData,
      } as Complaint;
    }
    const response = await api.post(ENDPOINTS.CREATE_COMPLAINT, complaintData);
    return unwrapResponse<Complaint>(response);
  },

  getToken: (): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("authToken");
    }
    return null;
  },

  isAuthenticated: (): boolean => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("authToken");
      return !!token;
    }
    return false;
  },

  getMe: async (): Promise<UserProfile> => {
    if (e2eMocksEnabled) return getE2EUser();
    const res = await api.get(ENDPOINTS.GET_PROFILE);
    return unwrapResponse<UserProfile>(res);
  },

  // ─── SUPER ADMIN ─────────────────────────────────────────────────────────────
  getAdminStats: async (): Promise<any> => {
    const res = await api.get("/admin/stats");
    return unwrapResponse(res);
  },

  // ─── DISTRICT ADMIN ──────────────────────────────────────────────────────────
  getInspectors: async (): Promise<any[]> => {
    const res = await api.get("/admin/inspectors");
    return unwrapResponse<any[]>(res);
  },

  getWorkers: async (): Promise<any[]> => {
    const res = await api.get("/admin/workers");
    return unwrapResponse<any[]>(res);
  },

  getDistrictUsers: async (): Promise<any[]> => {
    const res = await api.get("/admin/users");
    return unwrapResponse<any[]>(res);
  },

  // ─── INSPECTOR ───────────────────────────────────────────────────────────────
  getWardComplaints: async ({ page = 1, limit = 20, status }: { page?: number; limit?: number; status?: string } = {}): Promise<any> => {
    const params: any = { page, limit };
    if (status) params.status = status;
    const res = await api.get("/inspector/complaints", { params });
    return unwrapResponse(res);
  },

  getWardWorkers: async (): Promise<any[]> => {
    const res = await api.get("/inspector/workers");
    return unwrapResponse<any[]>(res);
  },

  // ─── WORKER ──────────────────────────────────────────────────────────────────
  getAssignedComplaints: async ({ page = 1, limit = 20, status }: { page?: number; limit?: number; status?: string } = {}): Promise<any> => {
    const params: any = { page, limit };
    if (status) params.status = status;
    const res = await api.get("/worker/complaints", { params });
    return unwrapResponse(res);
  },

  getWardsByDistrict: async (districtId: string | number, { page = 1, is_active = true, limit = 60 }: { page?: number; is_active?: boolean; limit?: number } = {}): Promise<any> => {
    if (e2eMocksEnabled) return { data: e2eWards.slice(0, limit), meta: { page, is_active } };
    const res = await api.get(`/wards/district/${districtId}`, {
      params: { page, is_active, limit },
    });
    return unwrapResponse(res);
  },

  // ─── WARD MANAGEMENT ─────────────────────────────────────────────────────────
  getWards: async ({ page = 1, limit = 20, is_active = true }: { page?: number; limit?: number; is_active?: boolean } = {}): Promise<any> => {
    if (e2eMocksEnabled) return { data: e2eWards.slice(0, limit), meta: { page, is_active } };
    const res = await api.get("/wards/district", {
      params: { page, limit, is_active },
    });
    return unwrapResponse(res);
  },

  getWardDetail: async (wardId: string | number): Promise<any> => {
    const res = await api.get(`/wards/${wardId}`);
    return unwrapResponse(res);
  },

  getInspectorWard: async (): Promise<any> => {
    const res = await api.get("/wards/inspector/assigned");
    return unwrapResponse(res);
  },

  assignInspectorToWard: async (wardId: string | number, inspectorId: string | number): Promise<any> => {
    const res = await api.post(`/wards/${wardId}/assign-inspector`, {
      inspector_id: inspectorId,
    });
    return unwrapResponse(res);
  },

  // ─── DASHBOARD ROLE-SPECIFIC ────────────────────────────────────────────────
  getInspectorDashboard: async (): Promise<any> => {
    const res = await api.get("/dashboard/inspector/dashboard");
    return unwrapResponse(res);
  },

  getDistrictAdminDashboard: async (): Promise<any> => {
    const res = await api.get("/dashboard/district-admin/dashboard");
    return unwrapResponse(res);
  },

  getWorkerDashboard: async (): Promise<any> => {
    const res = await api.get("/dashboard/worker/dashboard");
    return unwrapResponse(res);
  },

  // ─── INSPECTOR COMPLAINT ACTIONS ─────────────────────────────────────────────
  inspectorStartWork: async (complaintId: string | number): Promise<any> => {
    const res = await api.put(`/inspector/complaints/${complaintId}/start-work`);
    return unwrapResponse(res);
  },

  inspectorRejectComplaint: async (complaintId: string | number): Promise<any> => {
    const res = await api.put(`/inspector/complaints/${complaintId}/reject`);
    return unwrapResponse(res);
  },

  inspectorResolveComplaint: async (complaintId: string | number): Promise<any> => {
    const res = await api.put(`/inspector/complaints/${complaintId}/resolve`);
    return unwrapResponse(res);
  },
};

export default authService;
