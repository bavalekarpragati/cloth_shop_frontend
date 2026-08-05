import { getAnalytics } from '../api/analytics.js';
import { logout } from '../api/auth.js';
import { formatCurrency, requireOwner } from '../utils/dom.js';

if (!requireOwner()) {
    throw new Error('Redirecting - not authorized');
}

document.getElementById('logout-btn').addEventListener('click', logout);

async function loadDashboard() {
    const statCards = document.getElementById('stat-cards');
    const lowStockList = document.getElementById('low-stock-list');

    try {
        const data = await getAnalytics();

        statCards.innerHTML = `
            <div class="stat-card">
                <span class="stat-label">Today's Revenue</span>
                <span class="stat-value">${formatCurrency(data.today_revenue)}</span>
            </div>
            <div class="stat-card">
                <span class="stat-label">Today's Profit</span>
                <span class="stat-value">${formatCurrency(data.today_profit)}</span>
            </div>
            <div class="stat-card">
                <span class="stat-label">Month Revenue</span>
                <span class="stat-value">${formatCurrency(data.month_revenue)}</span>
            </div>
            <div class="stat-card">
                <span class="stat-label">Month Profit</span>
                <span class="stat-value">${formatCurrency(data.month_profit)}</span>
            </div>
            <div class="stat-card">
                <span class="stat-label">Total Products</span>
                <span class="stat-value">${data.total_products}</span>
            </div>
            <div class="stat-card">
                <span class="stat-label">Total Inventory</span>
                <span class="stat-value">${data.total_inventory}</span>
            </div>
            <div class="stat-card warning">
                <span class="stat-label">Low Stock</span>
                <span class="stat-value">${data.low_stock_count}</span>
            </div>
            <div class="stat-card danger">
                <span class="stat-label">Out of Stock</span>
                <span class="stat-value">${data.out_of_stock_count}</span>
            </div>
        `;

        if (data.low_stock_items.length === 0) {
            lowStockList.innerHTML = '<p class="muted">No low stock items right now.</p>';
        } else {
            lowStockList.innerHTML = data.low_stock_items.map(p => `
                <div class="low-stock-row">
                    <span>${p.name}</span>
                    <span>Stock: ${p.stock}</span>
                </div>
            `).join('');
        }
    } catch (err) {
        statCards.innerHTML = `<p class="error-box">Failed to load dashboard: ${err.message}</p>`;
    }
}

loadDashboard();