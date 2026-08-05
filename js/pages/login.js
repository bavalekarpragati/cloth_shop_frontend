import { login } from '../api/auth.js';

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorBox = document.getElementById('error-box');
    errorBox.style.display = 'none';

    try {
        const data = await login(username, password);
        window.location.href = data.role === 'OWNER' ? 'owner/dashboard.html' : 'index.html';
    } catch (err) {
        errorBox.textContent = err.message;
        errorBox.style.display = 'block';
    }
});