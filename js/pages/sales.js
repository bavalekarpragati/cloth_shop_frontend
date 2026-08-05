import { getSales, createSale } from '../api/sales.js';
import { getProducts } from '../api/products.js';
import { logout } from '../api/auth.js';
import { formatCurrency, requireOwner } from '../utils/dom.js';

if (!requireOwner()) {
    throw new Error('Redirecting - not authorized');
}

document.getElementById('logout-btn').addEventListener('click', logout);

const productSelect = document.getElementById('s-product');
const stockHint = document.getElementById('stock-hint');
const saleError = document.getElementById('sale-error');
const saleSuccess = document.getElementById('sale-success');
const salesTbody = document.getElementById('sales-tbody');

let productsCache = [];

async function loadProductOptions() {
    productsCache = await getProducts({ stock_status: 'in' });
    if (productsCache.length === 0) {
        productSelect.innerHTML = '<option value="">No products in stock</option>';
        return;
    }
    productSelect.innerHTML = productsCache.map(p =>
        `<option value="${p.id}">${p.name} (Stock: ${p.stock})</option>`
    ).join('');
    updateStockHint();
}

function updateStockHint() {
    const selected = productsCache.find(p => p.id == productSelect.value);
    if (selected) {
        stockHint.textContent = `Available stock: ${selected.stock} | Selling Price: ${formatCurrency(selected.selling_price)}`;
    }
}

productSelect.addEventListener('change', updateStockHint);

async function loadSales() {
    salesTbody.innerHTML = '<tr><td colspan="7">Loading...</td></tr>';
    try {
        const sales = await getSales();
        if (sales.length === 0) {
            salesTbody.innerHTML = '<tr><td colspan="7">No sales recorded yet.</td></tr>';
            return;
        }
        salesTbody.innerHTML = sales.slice(0, 20).map(s => `
            <tr>
                <td>${new Date(s.timestamp).toLocaleString('en-IN')}</td>
                <td>${s.product_name_snapshot}</td>
                <td>${s.quantity}</td>
                <td>${formatCurrency(s.selling_price_snapshot)}</td>
                <td>${formatCurrency(s.total_profit)}</td>
                <td>${s.payment_method}</td>
                <td>${s.customer_name || '-'}</td>
            </tr>
        `).join('');
    } catch (err) {
        salesTbody.innerHTML = `<tr><td colspan="7">Failed to load: ${err.message}</td></tr>`;
    }
}

document.getElementById('sale-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    saleError.style.display = 'none';
    saleSuccess.style.display = 'none';

    const payload = {
        product: productSelect.value,
        quantity: document.getElementById('s-quantity').value,
        payment_method: document.getElementById('s-payment').value,
        customer_name: document.getElementById('s-customer-name').value,
        customer_phone: document.getElementById('s-customer-phone').value,
    };

    try {
        await createSale(payload);
        saleSuccess.textContent = 'Sale recorded successfully!';
        saleSuccess.style.display = 'block';
        document.getElementById('sale-form').reset();
        await loadProductOptions();
        await loadSales();
    } catch (err) {
        saleError.textContent = err.message;
        saleError.style.display = 'block';
    }
});

async function init() {
    await loadProductOptions();
    await loadSales();
}

init();