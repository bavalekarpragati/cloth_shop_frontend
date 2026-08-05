import { apiRequest } from './client.js';

async function login(username, password) {
    const data = await apiRequest('/auth/login/', {
        method: 'POST',
        body: { username, password },
        auth: false,
    });

    localStorage.setItem('authToken', data.token);
    localStorage.setItem('userRole', data.role);
    localStorage.setItem('username', data.username);

    return data;
}

async function signup(username, email, password, role) {
    const data = await apiRequest('/auth/signup/', {
        method: 'POST',
        body: { username, email, password, role },
        auth: false,
    });

    localStorage.setItem('authToken', data.token);
    localStorage.setItem('userRole', data.role);
    localStorage.setItem('username', data.username);

    return data;
}

async function logout() {
    try {
        await apiRequest('/auth/logout/', { method: 'POST' });
    } catch (e) {
        // ignore — clear local state regardless
    }
    localStorage.clear();
    window.location.href = '/login.html';
}

export { login, signup, logout };