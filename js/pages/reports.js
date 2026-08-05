import { apiRequest, BASE_URL, getToken } from '../api/client.js';
import { logout } from '../api/auth.js';
import { formatCurrency, requireOwner } from '../utils/dom.js';

if (!requireOwner()) {
    throw new Error('Redirecting - not authorized');
}

document.getElementById('logout-btn').addEventListener('click', logout);

const reportType = document.getElementById('report-type');
const customRange = document.getElementById('custom-range');
const reportError = document.getElementById('report-error');

reportType.addEventListener('change', () => {
    customRange.style.display = reportType.value === 'custom' ? 'grid' : 'none';
});

function buildQueryParams(exportFormat) {
    const params = new URLSearchParams();
    params.set('report_type', reportType.value);
    params.set('export_format', exportFormat);

    if (reportType.value === 'custom') {
        params.set('start_date', document.getElementById('start-date').value);
        params.set('end_date', document.getElementById('end-date').value);
    }

    return params.toString();
}

async function downloadFile(exportFormat) {
    reportError.style.display = 'none';
    const query = buildQueryParams(exportFormat);
    const token = getToken();

    try {
        const response = await fetch(`${BASE_URL}/reports/export/?${query}`, {
            headers: { 'Authorization': `Token ${token}` },
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => null);
            throw new Error(errData?.error || 'Failed to generate report');
        }

        const blob = await response.blob();
        const disposition = response.headers.get('Content-Disposition') || '';
        const match = disposition.match(/filename="?([^"]+)"?/);
        const filename = match ? match[1] : `report.${exportFormat}`;

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    } catch (err) {
        reportError.textContent = err.message;
        reportError.style.display = 'block';
    }
}

document.getElementById('export-csv').addEventListener('click', () => downloadFile('csv'));
document.getElementById('export-excel').addEventListener('click', () => downloadFile('excel'));
document.getElementById('export-pdf').addEventListener('click', () => downloadFile('pdf'));

document.getElementById('preview-btn').addEventListener('click', async () => {
    reportError.style.display = 'none';
    const query = buildQueryParams('json');

    try {
        const data = await apiRequest(`/reports/export/?${query}`);

        document.getElementById('preview-title').textContent = data.title;
        document.getElementById('preview-stats').innerHTML = `
            <div class="stat-card">
                <span class="stat-label">Total Revenue</span>
                <span class="stat-value">${formatCurrency(data.total_revenue)}</span>
            </div>
            <div class="stat-card">
                <span class="stat-label">Total Profit</span>
                <span class="stat-value">${formatCurrency(data.total_profit)}</span>
            </div>
            <div class="stat-card">
                <span class="stat-label">Items Sold</span>
                <span class="stat-value">${data.total_qty}</span>
            </div>
        `;

        const bestDiv = document.getElementById('preview-best');
        if (data.best_selling.length === 0) {
            bestDiv.innerHTML = '<p class="muted">No sales in this period.</p>';
        } else {
            bestDiv.innerHTML = data.best_selling.map(b => `
                <div class="low-stock-row">
                    <span>${b.product_name_snapshot}</span>
                    <span>${b.qty} sold — ${formatCurrency(b.profit)} profit</span>
                </div>
            `).join('');
        }

        document.getElementById('preview-panel').style.display = 'block';
    } catch (err) {
        reportError.textContent = err.message;
        reportError.style.display = 'block';
    }
});