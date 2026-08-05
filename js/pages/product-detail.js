import { getProduct } from '../api/products.js';
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
        navAuth.innerHTML = `<a href="../login.html" class="primary-btn">Login</a>`;
    }
}

function getProductIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

async function loadProduct() {
    const container = document.getElementById('product-detail-container');
    const id = getProductIdFromUrl();

    if (!id) {
        container.innerHTML = '<p class="error-box">No product specified.</p>';
        return;
    }

    try {
        const product = await getProduct(id);

        const images = product.images.length > 0 ? product.images : [{ image: null }];
        const primaryImage = product.images.find(img => img.is_primary) || product.images[0];

        const stockBadge = product.is_out_of_stock
            ? '<span class="badge danger">Out of Stock</span>'
            : product.is_low_stock
                ? '<span class="badge warning">Low Stock</span>'
                : '<span class="badge success">In Stock</span>';

        const sizesHtml = product.sizes.map(s => `<span class="tag">${s.name}</span>`).join('');
        const colorsHtml = product.colors.map(c => `<span class="color-swatch" style="background:${c.hex_code}" title="${c.name}"></span>`).join('');

        container.innerHTML = `
            <div class="detail-image">
                ${primaryImage && primaryImage.image ? `<img src="${primaryImage.image}" alt="${product.name}">` : `<div class="no-image">No Image</div>`}
            </div>
            <div class="detail-info">
                <p class="product-category">${product.category ? product.category.name : ''}</p>
                <h1>${product.name}</h1>
                <p class="detail-price">${formatCurrency(product.selling_price)}</p>
                ${stockBadge}
                <p class="detail-description">${product.description || 'No description available.'}</p>

                ${product.fabric ? `<p><strong>Fabric:</strong> ${product.fabric}</p>` : ''}

                ${sizesHtml ? `<div class="detail-attr"><strong>Sizes:</strong> ${sizesHtml}</div>` : ''}
                ${colorsHtml ? `<div class="detail-attr"><strong>Colors:</strong> ${colorsHtml}</div>` : ''}

                <p class="stock-note">${product.stock} units in stock</p>
            </div>
        `;
    } catch (err) {
        container.innerHTML = `<p class="error-box">Failed to load product: ${err.message}</p>`;
    }
}

renderNav();
loadProduct();