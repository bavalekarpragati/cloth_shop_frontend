import { signup } from '../api/auth.js';

document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    const errorBox = document.getElementById('error-box');
    errorBox.style.display = 'none';

    if (password !== passwordConfirm) {
        errorBox.textContent = 'Passwords do not match.';
        errorBox.style.display = 'block';
        return;
    }

    try {
        const data = await signup(username, email, password, 'CUSTOMER');
        window.location.href = '../index.html'.replace('../', '');
    } catch (err) {
        errorBox.textContent = err.message;
        errorBox.style.display = 'block';
    }
});