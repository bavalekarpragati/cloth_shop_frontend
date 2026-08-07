import { signup } from '../api/auth.js';

const roleButtons = document.querySelectorAll('.role-btn');
const selectedRoleInput = document.getElementById('selected-role');
const portalLabel = document.getElementById('portal-label');

roleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        roleButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedRoleInput.value = btn.dataset.role;
        portalLabel.textContent = btn.dataset.role === 'OWNER'
            ? 'Create Admin Account'
            : 'Create Customer Account';
    });
});

document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    const role = selectedRoleInput.value;
    const errorBox = document.getElementById('error-box');
    errorBox.style.display = 'none';

    if (password !== passwordConfirm) {
        errorBox.textContent = 'Passwords do not match.';
        errorBox.style.display = 'block';
        return;
    }

    try {
        const data = await signup(username, email, password, role);
        window.location.href = data.role === 'OWNER' ? 'owner/dashboard.html' : 'index.html';
    } catch (err) {
        errorBox.textContent = err.message;
        errorBox.style.display = 'block';
    }
});