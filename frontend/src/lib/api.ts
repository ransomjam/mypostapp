import { APIResponse } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

class ApiClient {
    private token: string | null = null;

    constructor() {
        if (typeof window !== 'undefined') {
            this.token = localStorage.getItem('mypostapp_token');
        }
    }

    setToken(token: string) {
        this.token = token;
        if (typeof window !== 'undefined') {
            localStorage.setItem('mypostapp_token', token);
        }
    }

    clearToken() {
        this.token = null;
        if (typeof window !== 'undefined') {
            localStorage.removeItem('mypostapp_token');
        }
    }

    getToken(): string | null {
        return this.token;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<APIResponse<T>> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string>),
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                ...options,
                headers,
            });

            const data = await response.json();
            return data;
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Network error',
            };
        }
    }

    private async uploadRequest<T>(
        endpoint: string,
        formData: FormData
    ): Promise<APIResponse<T>> {
        const headers: Record<string, string> = {};

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers,
                body: formData,
            });

            const data = await response.json();
            return data;
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Network error',
            };
        }
    }

    // Auth
    async register(email: string, password: string) {
        return this.request<{ token: string; user: any }>('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    }

    async login(email: string, password: string) {
        return this.request<{ token: string; user: any }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    }

    async getProfile() {
        return this.request<any>('/auth/profile');
    }

    // Post Generation
    async generate(params: {
        topic: string;
        platform: string;
        tone: string;
        lengthPreference: string;
        audience: string;
        samplePost?: string;
        goal?: string;
        contextIds?: string[];
        useSamples?: boolean;
    }) {
        return this.request<any>('/generate', {
            method: 'POST',
            body: JSON.stringify(params),
        });
    }

    // Content Planning
    async generateContentPlan(contextIds: string[], postCount: number = 5, topic?: string) {
        return this.request<any>('/plan/generate', {
            method: 'POST',
            body: JSON.stringify({ contextIds, postCount, topic }),
        });
    }

    async saveContentPlan(planData: any) {
        return this.request<any>('/plan/save', {
            method: 'POST',
            body: JSON.stringify(planData),
        });
    }

    async getSavedPlans() {
        return this.request<any[]>('/plan');
    }

    // Platform Adaptation
    async adapt(content: string, targetPlatforms: string[]) {
        return this.request<any>('/adapt', {
            method: 'POST',
            body: JSON.stringify({ content, targetPlatforms }),
        });
    }

    // Analysis
    async analyse(content: string, platform?: string) {
        return this.request<any>('/analyse', {
            method: 'POST',
            body: JSON.stringify({ content, platform }),
        });
    }

    // Scoring
    async score(content: string, platform: string, postId?: string) {
        return this.request<any>('/score', {
            method: 'POST',
            body: JSON.stringify({ content, platform, postId }),
        });
    }

    async fixScore(params: { content: string; platform: string; suggestions: string[]; penalties: string[] }) {
        return this.request<any>('/score/fix', {
            method: 'POST',
            body: JSON.stringify(params),
        });
    }

    // Risk Detection
    async risk(content: string) {
        return this.request<any>('/risk', {
            method: 'POST',
            body: JSON.stringify({ content }),
        });
    }

    // Image Optimisation
    async optimiseImage(file: File, ratios?: string[]) {
        const formData = new FormData();
        formData.append('image', file);
        if (ratios) {
            ratios.forEach((r) => formData.append('ratios', r));
        }
        return this.uploadRequest<any>('/image/optimise', formData);
    }

    // Post History
    async getHistory(page = 1, limit = 20) {
        return this.request<any>(`/generate/history?page=${page}&limit=${limit}`);
    }

    async updateHistory(id: string, content: string) {
        return this.request<any>(`/generate/history/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ content }),
        });
    }

    async humanize(content: string) {
        return this.request<string>('/generate/humanize', {
            method: 'POST',
            body: JSON.stringify({ content }),
        });
    }

    // Context Profiles (Knowledge Base)
    async getContexts() {
        return this.request<any>('/context');
    }

    async createContext(data: { name: string; type: string; description: string; keywords?: string[] }) {
        return this.request<any>('/context', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateContext(id: string, data: any) {
        return this.request<any>(`/context/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteContext(id: string) {
        return this.request<any>(`/context/${id}`, {
            method: 'DELETE',
        });
    }

    // Admin Scraped Samples
    async getAdminSamples() {
        return this.request<any>('/admin/samples');
    }

    async createAdminSample(data: { platform: string; url?: string; content?: string; engagementScore?: number; isActive?: boolean }) {
        return this.request<any>('/admin/samples', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateAdminSample(id: string, data: any) {
        return this.request<any>(`/admin/samples/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteAdminSample(id: string) {
        return this.request<any>(`/admin/samples/${id}`, {
            method: 'DELETE',
        });
    }
}

export const api = new ApiClient();
