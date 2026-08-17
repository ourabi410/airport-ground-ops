import axios from 'axios';
import {
  User,
  Company,
  Flight,
  Baggage,
  Dolly,
  FlightTaskItem,
  TurnaroundMilestone,
  AuditLog,
  UserSessionLog,
  UserRole,
  UserPermission
} from '../types';

export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add CSRF token or Auth token if present
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('sas_auth_token');
  if (token) {
    config.headers.Authorization = token;
  }
  const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  if (csrf) {
    config.headers['X-CSRF-TOKEN'] = csrf;
  }
  return config;
});

export const api = {
  // Auth & RBAC
  auth: {
    login: (identifier: string, password?: string) =>
      apiClient.post<{ success: boolean; token: string; user: User; permissions: UserPermission; sessionId: string }>('/auth/login', { identifier, password }),
    logout: (userId?: string) => apiClient.post('/auth/logout', { userId }),
    switchUser: (userId: string) => apiClient.post<{ success: boolean; user: User; permissions: UserPermission }>('/auth/switch-user', { userId }),
    me: () => apiClient.get<{ user: User; permissions: UserPermission }>('/auth/me'),
  },

  // Users CRUD
  users: {
    getAll: () => apiClient.get<User[]>('/users'),
    get: (id: string) => apiClient.get<User>(`/users/${id}`),
    create: (data: Partial<User>) => apiClient.post<User>('/users', data),
    update: (id: string, data: Partial<User>) => apiClient.put<User>(`/users/${id}`, data),
    delete: (id: string) => apiClient.delete(`/users/${id}`),
  },

  // Companies CRUD
  companies: {
    getAll: () => apiClient.get<Company[]>('/companies'),
    get: (id: string) => apiClient.get<Company>(`/companies/${id}`),
    create: (data: Partial<Company>) => apiClient.post<Company>('/companies', data),
    update: (id: string, data: Partial<Company>) => apiClient.put<Company>(`/companies/${id}`, data),
    delete: (id: string) => apiClient.delete(`/companies/${id}`),
  },

  // Flights CRUD
  flights: {
    getAll: () => apiClient.get<Flight[]>('/flights'),
    get: (id: string) => apiClient.get<Flight>(`/flights/${id}`),
    create: (data: Partial<Flight>) => apiClient.post<Flight>('/flights', data),
    update: (id: string, data: Partial<Flight>) => apiClient.put<Flight>(`/flights/${id}`, data),
    delete: (id: string) => apiClient.delete(`/flights/${id}`),
    lock: (id: string, isLocked?: boolean) => apiClient.post<Flight>(`/flights/${id}/lock`, { isLocked }),
    addComment: (id: string, comment: { authorId: string; authorName: string; authorRole: UserRole; message: string; category: string }) =>
      apiClient.post(`/flights/${id}/comments`, comment),
  },

  // Baggage Tracking & Zebra Scanning
  baggages: {
    getAll: (flightNbr?: string) => apiClient.get<Baggage[]>('/baggages', { params: { flightNbr } }),
    get: (id: string) => apiClient.get<Baggage>(`/baggages/${id}`),
    create: (data: Partial<Baggage>) => apiClient.post<Baggage>('/baggages', data),
    update: (id: string, data: Partial<Baggage>) => apiClient.put<Baggage>(`/baggages/${id}`, data),
    delete: (id: string) => apiClient.delete(`/baggages/${id}`),
    scanSorting: (payload: { tagNumber: string; zone: string; userName: string; userId: string; dollyId?: string }) =>
      apiClient.post<{ success: boolean; message: string; baggage: Baggage; isAlert?: boolean }>('/baggages/scan/sorting', payload),
    scanLoading: (payload: { tagNumber: string; zone: string; userName: string; userId: string; holdLocation: string }) =>
      apiClient.post<{ success: boolean; message: string; baggage: Baggage; isAlert?: boolean }>('/baggages/scan/loading', payload),
  },

  // Dollies & ULD Containers
  dollies: {
    getAll: () => apiClient.get<Dolly[]>('/dollies'),
    get: (id: string) => apiClient.get<Dolly>(`/dollies/${id}`),
    create: (data: Partial<Dolly>) => apiClient.post<Dolly>('/dollies', data),
    update: (id: string, data: Partial<Dolly>) => apiClient.put<Dolly>(`/dollies/${id}`, data),
    delete: (id: string) => apiClient.delete(`/dollies/${id}`),
    assignBags: (id: string, tagNumbers: string[]) => apiClient.post<Dolly>(`/dollies/${id}/assign-bags`, { tagNumbers }),
  },

  // Tasks & Checklists
  tasks: {
    getAll: (params?: { flightNbr?: string; userId?: string }) => apiClient.get<FlightTaskItem[]>('/tasks', { params }),
    get: (id: string) => apiClient.get<FlightTaskItem>(`/tasks/${id}`),
    create: (data: Partial<FlightTaskItem>) => apiClient.post<FlightTaskItem>('/tasks', data),
    update: (id: string, data: Partial<FlightTaskItem>) => apiClient.put<FlightTaskItem>(`/tasks/${id}`, data),
    delete: (id: string) => apiClient.delete(`/tasks/${id}`),
    toggleItem: (id: string, checkId: string) => apiClient.post<FlightTaskItem>(`/tasks/${id}/toggle-item`, { checkId }),
  },

  // Turnaround Milestones & GPS Verification
  milestones: {
    getAll: (flightNbr?: string) => apiClient.get<TurnaroundMilestone[]>('/milestones', { params: { flightNbr } }),
    get: (id: string) => apiClient.get<TurnaroundMilestone>(`/milestones/${id}`),
    create: (data: Partial<TurnaroundMilestone>) => apiClient.post<TurnaroundMilestone>('/milestones', data),
    update: (id: string, data: Partial<TurnaroundMilestone>) => apiClient.put<TurnaroundMilestone>(`/milestones/${id}`, data),
    complete: (id: string, payload: { userId: string; userName: string; userRole: UserRole; gpsLatitude?: number; gpsLongitude?: number; gpsAccuracy?: number; notes?: string }) =>
      apiClient.post<TurnaroundMilestone>(`/milestones/${id}/complete`, payload),
    delete: (id: string) => apiClient.delete(`/milestones/${id}`),
  },

  // Audit Logs & Sessions
  auditLogs: {
    getAll: () => apiClient.get<AuditLog[]>('/audit-logs'),
    create: (data: Partial<AuditLog>) => apiClient.post<AuditLog>('/audit-logs', data),
  },
  sessions: {
    getAll: () => apiClient.get<UserSessionLog[]>('/sessions'),
    create: (data: Partial<UserSessionLog>) => apiClient.post<UserSessionLog>('/sessions', data),
    close: (id: string) => apiClient.post<UserSessionLog>(`/sessions/${id}/close`),
  },
};
