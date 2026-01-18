const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

class ApiClient {
    constructor() {
        this.token = localStorage.getItem('token');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }

    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (this.token) {
            headers.Authorization = `Bearer ${this.token}`;
        }

        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Something went wrong');
        }

        return data;
    }

    // Auth
    async register(email, password, name) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, name }),
        });
        this.setToken(data.token);
        return data;
    }

    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        this.setToken(data.token);
        return data;
    }

    async logout() {
        this.setToken(null);
    }

    async getCurrentUser() {
        return this.request('/auth/me');
    }

    // Groups
    async getGroups() {
        return this.request('/groups');
    }

    async createGroup(name, currency = 'INR') {
        return this.request('/groups', {
            method: 'POST',
            body: JSON.stringify({ name, currency }),
        });
    }

    async getGroup(id) {
        return this.request(`/groups/${id}`);
    }

    async updateGroup(id, data) {
        return this.request(`/groups/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteGroup(id) {
        return this.request(`/groups/${id}`, {
            method: 'DELETE',
        });
    }

    // Participants
    async addParticipant(groupId, name, color) {
        return this.request(`/groups/${groupId}/participants`, {
            method: 'POST',
            body: JSON.stringify({ name, color }),
        });
    }

    async updateParticipant(id, data) {
        return this.request(`/participants/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteParticipant(id) {
        return this.request(`/participants/${id}`, {
            method: 'DELETE',
        });
    }

    // Expenses
    async getExpenses(groupId, filters = {}) {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, value);
        });
        const query = params.toString() ? `?${params.toString()}` : '';
        return this.request(`/expenses/group/${groupId}${query}`);
    }

    async createExpense(groupId, expenseData) {
        return this.request(`/expenses/group/${groupId}`, {
            method: 'POST',
            body: JSON.stringify(expenseData),
        });
    }

    async updateExpense(id, data) {
        return this.request(`/expenses/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteExpense(id) {
        return this.request(`/expenses/${id}`, {
            method: 'DELETE',
        });
    }

    // AI - MintSense
    async parseExpense(text, groupId) {
        return this.request('/ai/parse-expense', {
            method: 'POST',
            body: JSON.stringify({ text, groupId }),
        });
    }

    async categorizeExpense(description) {
        return this.request('/ai/categorize', {
            method: 'POST',
            body: JSON.stringify({ description }),
        });
    }

    async getGroupSummary(groupId) {
        return this.request(`/ai/group-summary/${groupId}`);
    }

    async explainSettlements(settlements, balances) {
        return this.request('/ai/explain-settlements', {
            method: 'POST',
            body: JSON.stringify({ settlements, balances }),
        });
    }
}

export const api = new ApiClient();
export default api;
