import { login } from '../api/auth.js';

const roleButtons = document.querySelectorAll('.role-btn');
const selectedRoleInput = document.getElementById('selected-role');
const portalLabel = document.getElementById('portal-label');
const signupHint = document.getElementById('signup-hint');

roleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        roleButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedRoleInput.value = btn.dataset.role;

        if (btn.dataset.role === 'OWNER') {
            portalLabel.textContent = 'Admin Login';
            signupHint.style.display = 'none';
        } else {
            portalLabel.textContent = 'Customer Login';
            signupHint.style.display = 'block';
        }
    });
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const expectedRole = selectedRoleInput.value;
    const errorBox = document.getElementById('error-box');
    errorBox.style.display = 'none';

    try {
        const data = await login(username, password);

        if (data.role !== expectedRole) {
            localStorage.clear();
            const portalName = expectedRole === 'OWNER' ? 'Admin' : 'Customer';
            errorBox.textContent = `This account is not registered for ${portalName} login. Please select the correct option.`;
            errorBox.style.display = 'block';
            return;
        }

        window.location.href = data.role === 'OWNER' ? 'owner/dashboard.html' : 'index.html';
    } catch (err) {
        errorBox.textContent = err.message;
        errorBox.style.display = 'block';
    }
});