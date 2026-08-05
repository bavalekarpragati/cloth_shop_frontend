const BASE_URL = 'http://127.0.0.1:8000/api';

function getToken() {
    return localStorage.getItem('authToken');
}

function getRole() {
    return localStorage.getItem('userRole');
}

function getUsername() {
    return localStorage.getItem('username');
}

async function apiRequest(endpoint, { method = 'GET', body = null, auth = true, isFormData = false } = {}) {
    const headers = {};

    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    if (auth) {
        const token = getToken();
        if (token) {
            headers['Authorization'] = `Token ${token}`;
        }
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        method,
        headers,
        body: isFormData ? body : (body ? JSON.stringify(body) : null),
    });

    if (response.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('username');
        window.location.href = '/login.html';
        return null;
    }

    const contentType = response.headers.get('content-type') || '';
    let data = null;

    if (contentType.includes('application/json')) {
        data = await response.json().catch(() => null);
    }

    if (!response.ok) {
        const message = (data && (data.error || data.detail)) || 'Request failed';
        throw new Error(message);
    }

    return data;
}

export { apiRequest, getToken, getRole, getUsername, BASE_URL };
