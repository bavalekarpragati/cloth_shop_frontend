import { getProducts, createProduct, updateProduct, deleteProduct, getCategories } from '../api/products.js';
import { logout } from '../api/auth.js';
import { formatCurrency, requireOwner } from '../utils/dom.js';

if (!requireOwner()) {
    throw new Error('Redirecting - not authorized');
}

document.getElementById('logout-btn').addEventListener('click', logout);

const tbody = document.getElementById('products-tbody');
const formPanel = document.getElementById('form-panel');
const productForm = document.getElementById('product-form');
const formTitle = document.getElementById('form-title');
const formError = document.getElementById('form-error');
const categorySelect = document.getElementById('p-category');

let categoriesFlat = [];

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
    categoriesFlat = flattenCategories(categories);
    categorySelect.innerHTML = categoriesFlat.map(c => `<option value="${c.id}">${c.label}</option>`).join('');
}

function statusBadge(product) {
    if (product.is_out_of_stock) return '<span class="badge danger">Out of Stock</span>';
    if (product.is_low_stock) return '<span class="badge warning">Low Stock</span>';
    return '<span class="badge success">In Stock</span>';
}

async function loadProducts() {
    tbody.innerHTML = '<tr><td colspan="7">Loading...</td></tr>';
    try {
        const products = await getProducts();
        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">No products yet.</td></tr>';
            return;
        }
        tbody.innerHTML = products.map(p => `
            <tr>
                <td>${p.name}</td>
                <td>${p.category ? p.category.name : '-'}</td>
                <td>${formatCurrency(p.base_price)}</td>
                <td>${formatCurrency(p.selling_price)}</td>
                <td>${p.stock}</td>
                <td>${statusBadge(p)}</td>
                <td>
                    <button class="link-btn edit-btn" data-id="${p.id}">Edit</button>
                    <button class="link-btn delete-btn danger-text" data-id="${p.id}">Delete</button>
                </td>
            </tr>
        `).join('');

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => openEditForm(products.find(p => p.id == btn.dataset.id)));
        });
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => handleDelete(btn.dataset.id));
        });
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7">Failed to load: ${err.message}</td></tr>`;
    }
}

function openAddForm() {
    formTitle.textContent = 'Add Product';
    productForm.reset();
    document.getElementById('product-id').value = '';
    formError.style.display = 'none';
    formPanel.style.display = 'block';
}

function openEditForm(product) {
    formTitle.textContent = 'Edit Product';
    document.getElementById('product-id').value = product.id;
    document.getElementById('p-name').value = product.name;
    document.getElementById('p-description').value = product.description || '';
    document.getElementById('p-category').value = product.category ? product.category.id : '';
    document.getElementById('p-base-price').value = product.base_price;
    document.getElementById('p-selling-price').value = product.selling_price;
    document.getElementById('p-stock').value = product.stock;
    document.getElementById('p-low-stock').value = product.low_stock_limit;
    document.getElementById('p-fabric').value = product.fabric || '';
    formError.style.display = 'none';
    formPanel.style.display = 'block';
}

async function handleDelete(id) {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    try {
        await deleteProduct(id);
        loadProducts();
    } catch (err) {
        alert('Failed to delete: ' + err.message);
    }
}

document.getElementById('add-product-btn').addEventListener('click', openAddForm);
document.getElementById('cancel-form-btn').addEventListener('click', () => {
    formPanel.style.display = 'none';
});

productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.style.display = 'none';

    const id = document.getElementById('product-id').value;
    const payload = {
        name: document.getElementById('p-name').value,
        description: document.getElementById('p-description').value,
        category: document.getElementById('p-category').value,
        base_price: document.getElementById('p-base-price').value,
        selling_price: document.getElementById('p-selling-price').value,
        stock: document.getElementById('p-stock').value,
        low_stock_limit: document.getElementById('p-low-stock').value,
        fabric: document.getElementById('p-fabric').value,
    };

    try {
        if (id) {
            await updateProduct(id, payload);
        } else {
            await createProduct(payload);
        }
        formPanel.style.display = 'none';
        loadProducts();
    } catch (err) {
        formError.textContent = err.message;
        formError.style.display = 'block';
    }
});

async function init() {
    await loadCategories();
    await loadProducts();
}

init();