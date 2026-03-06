// ============================================================
// Centralized API Client — Replaces direct Supabase calls
// ============================================================

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
    const url = `${API_BASE}${path}`;
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || `API error: ${res.status}`);
    }

    return res.json();
}

// ── Match State ──────────────────────────────────────────────

export async function getMatchState() {
    return request('/match-state');
}

export async function updateMatchState(data) {
    return request('/match-state', {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

// ── Commentary ───────────────────────────────────────────────

export async function getCommentary(limit = 50) {
    return request(`/commentary?limit=${limit}`);
}

export async function insertCommentary(item) {
    return request('/commentary', {
        method: 'POST',
        body: JSON.stringify(item),
    });
}

export async function insertCommentaryBulk(items) {
    return request('/commentary/bulk', {
        method: 'POST',
        body: JSON.stringify(items),
    });
}

export async function updateCommentary(id, data) {
    return request(`/commentary/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function deleteCommentary(id) {
    return request(`/commentary/${id}`, {
        method: 'DELETE',
    });
}

export async function deleteAllCommentary() {
    return request('/commentary', {
        method: 'DELETE',
    });
}

// ── Roster ───────────────────────────────────────────────────

export async function getRoster() {
    return request('/roster');
}

export async function insertRoster(items) {
    return request('/roster', {
        method: 'POST',
        body: JSON.stringify(items),
    });
}

export async function updateRosterEntry(data) {
    return request('/roster', {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function updateRosterBulk(items) {
    return request('/roster/bulk', {
        method: 'PUT',
        body: JSON.stringify(items),
    });
}

export async function deleteAllRoster() {
    return request('/roster', {
        method: 'DELETE',
    });
}

export async function resetAllRosterStats() {
    return request('/roster/reset-all', {
        method: 'PUT',
    });
}

export async function queryRoster(params) {
    const searchParams = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
        if (val !== undefined && val !== null) searchParams.set(key, val);
    }
    return request(`/roster/query?${searchParams.toString()}`);
}

// ── Auth ─────────────────────────────────────────────────────

export async function verifyAdminPassword(password) {
    return request('/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ password }),
    });
}

// ── SSE URL (for EventSource) ────────────────────────────────

export function getSSEUrl() {
    return `${API_BASE}/events`;
}
