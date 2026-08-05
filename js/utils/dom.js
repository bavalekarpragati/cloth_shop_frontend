function formatCurrency(amount) {
    return '₹' + Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function requireOwner() {
    const role = localStorage.getItem('userRole');
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = '/login.html';
        return false;
    }
    if (role !== 'OWNER') {
        window.location.href = '/index.html';
        return false;
    }
    return true;
}

function requireAuth() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

export { formatCurrency, requireOwner, requireAuth };