import { getProducts, getCategories } from '../api/products.js';
import { logout } from '../api/auth.js';
import { formatCurrency } from '../utils/dom.js';
import { getUsername, getRole } from '../api/client.js';

function renderNav() {
    const navAuth = document.getElementById('nav-auth');
    const token = localStorage.getItem('authToken');

    if (token) {
        const username = getUsername();
        const role = getRole();
        navAuth.innerHTML = `
            <span class="nav-user">Logged in as <b>${username}</b> <span class="role-tag">${role}</span></span>
            <button id="logout-btn" class="link-btn">Logout</button>
        `;
        document.getElementById('logout-btn').addEventListener('click', logout);
    } else {
        navAuth.innerHTML = `<a href="login.html" class="primary-btn">Login</a>`;
    }
}

function flattenCategories(categories, prefix = '') {
    let flat = [];
    for (const cat of categories) {
        const label = prefix ? `${prefix} > ${cat.name}` : cat.name;
        flat.push({ id: cat.id, label });
        if (cat.subcategories && cat.subcategories.length > 0) {
            flat = flat.concat(flattenCategories(cat.subcategories, label));
        }
    }
    return flat;
}

async function loadCategories() {
    const categories = await getCategories();
    const flat = flattenCategories(categories);
    const select = document.getElementById('f-category');
    flat.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.label;
        select.appendChild(opt);
    });
}

function productCard(product) {
    const primaryImage = product.images.find(img => img.is_primary) || product.images[0];
    const imageHtml = primaryImage
        ? `<img src="${primaryImage.image}" alt="${product.name}">`
        : `<div class="no-image">No Image</div>`;

    const stockBadge = product.is_out_of_stock
        ? '<span class="badge danger">Out of Stock</span>'
        : product.is_low_stock
            ? '<span class="badge warning">Low Stock</span>'
            : '';

    return `
        <a href="customer/product-detail.html?id=${product.id}" class="product-card">
            <div class="product-image">${imageHtml}${stockBadge}</div>
            <div class="product-info">
                <h4>${product.name}</h4>
                <p class="product-category">${product.category ? product.category.name : ''}</p>
                <p class="product-price">${formatCurrency(product.selling_price)}</p>
            </div>
        </a>
    `;
}

async function loadProducts() {
    const grid = document.getElementById('product-grid');
    const resultsCount = document.getElementById('results-count');
    grid.innerHTML = '<p>Loading products...</p>';

    const params = {};
    const search = document.getElementById('f-search').value;
    const category = document.getElementById('f-category').value;
    const ordering = document.getElementById('f-ordering').value;

    if (search) params.search = search;
    if (category) params.category = category;
    if (ordering) params.ordering = ordering;

    try {
        const products = await getProducts(params);
        resultsCount.textContent = `Showing ${products.length} of ${products.length} products`;

        if (products.length === 0) {
            grid.innerHTML = '<p class="muted">No products match your filters.</p>';
            return;
        }

        grid.innerHTML = products.map(productCard).join('');
    } catch (err) {
        grid.innerHTML = `<p class="error-box">Failed to load products: ${err.message}</p>`;
    }
}

document.getElementById('apply-filters').addEventListener('click', loadProducts);
document.getElementById('clear-filters').addEventListener('click', () => {
    document.getElementById('f-search').value = '';
    document.getElementById('f-category').value = '';
    document.getElementById('f-ordering').value = '-created_at';
    loadProducts();
});

async function init() {
    renderNav();
    await loadCategories();
    await loadProducts();
}

init();