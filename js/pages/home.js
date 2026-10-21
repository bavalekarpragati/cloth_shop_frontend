import { getProducts, getCategories } from '../api/products.js';
import { logout } from '../api/auth.js';
import { formatCurrency } from '../utils/dom.js';
import { getUsername, getRole } from '../api/client.js';

// ---------- State ----------
const state = {
    tree: [],                 // category tree: [{id, name, children: [...]}]
    path: [],                 // selected category ids, e.g. [Kids, Girls, Frocks]
    search: '',
    ordering: '-created_at',
};

const els = {
    tabs: document.getElementById('category-tabs'),
    subrows: document.getElementById('subcategory-rows'),
    hero: document.getElementById('hero'),
    viewHead: document.getElementById('view-head'),
    viewTitle: document.getElementById('view-title'),
    count: document.getElementById('results-count'),
    content: document.getElementById('store-content'),
    search: document.getElementById('f-search'),
    ordering: document.getElementById('f-ordering'),
    clear: document.getElementById('clear-filters'),
};

// ---------- Small helpers ----------
function esc(text) {
    const d = document.createElement('div');
    d.textContent = text ?? '';
    return d.innerHTML;
}

// API may return a plain list or a paginated {results: [...]}
function toList(data) {
    return Array.isArray(data) ? data : (data && data.results) || [];
}

function isNew(p) {
    return p.created_at && (Date.now() - new Date(p.created_at).getTime()) < 7 * 24 * 3600 * 1000;
}

// ---------- Nav ----------
function renderNav() {
    const navAuth = document.getElementById('nav-auth');
    const token = localStorage.getItem('authToken');

    if (token) {
        navAuth.innerHTML = `
            <span class="nav-user">Logged in as <b>${esc(getUsername())}</b> <span class="role-tag">${esc(getRole())}</span></span>
            <button id="logout-btn" class="link-btn">Logout</button>
        `;
        document.getElementById('logout-btn').addEventListener('click', logout);
    } else {
        navAuth.innerHTML = `<a href="login.html" class="primary-btn">Login</a>`;
    }
}

// ---------- Category tree ----------
// Turns the flat list from /categories/ into a nested tree using each item's "parent"
function buildTree(list) {
    const byId = new Map(list.map(c => [c.id, { ...c, children: [] }]));
    const parentOf = c => (c.parent && typeof c.parent === 'object') ? c.parent.id : (c.parent ?? c.parent_id ?? null);
    const roots = [];
    byId.forEach(node => {
        const pid = parentOf(node);
        if (pid != null && byId.has(pid)) byId.get(pid).children.push(node);
        else roots.push(node);
    });
    return roots;
}

// Walks state.path and returns the selected category nodes, e.g. [Kids, Girls, Frocks]
function pathNodes() {
    const nodes = [];
    let level = state.tree;
    for (const id of state.path) {
        const node = level.find(c => c.id === id);
        if (!node) break;
        nodes.push(node);
        level = node.children;
    }
    return nodes;
}

function renderCategoryBar() {
    const nodes = pathNodes();

    // Row 1: top-level tabs
    els.tabs.innerHTML =
        `<button class="sf-tab ${nodes.length === 0 ? 'active' : ''}" data-id="">All</button>` +
        state.tree.map(c =>
            `<button class="sf-tab ${nodes[0] && nodes[0].id === c.id ? 'active' : ''}" data-id="${c.id}">${esc(c.name)}</button>`
        ).join('');

    // Next rows: one chip row for each selected level that has children
    els.subrows.innerHTML = nodes.map((node, i) => {
        if (!node.children.length) return '';
        const allActive = nodes.length === i + 1;
        const chips = node.children.map(ch =>
            `<button class="sf-chip ${nodes[i + 1] && nodes[i + 1].id === ch.id ? 'active' : ''}" data-level="${i}" data-id="${ch.id}">${esc(ch.name)}</button>`
        ).join('');
        return `<div class="sf-subrow">
            <button class="sf-chip ${allActive ? 'active' : ''}" data-level="${i}" data-id="">All ${esc(node.name)}</button>
            ${chips}
        </div>`;
    }).join('');
}

// ---------- Product card ----------
function productCard(p) {
    const images = p.images || [];
    const img = images.find(i => i.is_primary) || images[0];

    let badge = '';
    if (p.is_out_of_stock) badge = '<span class="sf-badge danger">Out of stock</span>';
    else if (p.is_low_stock) badge = '<span class="sf-badge warning">Few left</span>';
    else if (isNew(p)) badge = '<span class="sf-badge new">New</span>';

    const dots = (p.colors || []).slice(0, 4)
        .map(c => `<span class="sf-dot" style="background:${esc(c.hex_code)}" title="${esc(c.name)}"></span>`).join('');
    const sizes = (p.sizes || []).slice(0, 4)
        .map(s => `<span class="sf-size">${esc(s.name)}</span>`).join('');

    return `
        <a class="sf-card" href="customer/product-detail.html?id=${p.id}">
            <div class="sf-card-img">
                ${img && img.image
                    ? `<img src="${img.image}" alt="${esc(p.name)}" loading="lazy">`
                    : '<div class="sf-noimg">No Image</div>'}
                ${badge}
            </div>
            <div class="sf-card-body">
                <p class="sf-card-cat">${esc(p.category ? p.category.name : '')}</p>
                <h3 class="sf-card-name">${esc(p.name)}</h3>
                <div class="sf-card-foot">
                    <span class="sf-price">${formatCurrency(p.selling_price)}</span>
                    <span class="sf-dots">${dots}</span>
                </div>
                ${sizes ? `<div class="sf-sizes">${sizes}</div>` : ''}
            </div>
        </a>`;
}

function emptyHtml(message) {
    return `<div class="sf-empty"><h3>No products found</h3><p>${esc(message)}</p></div>`;
}

function sectionHtml(title, items, categoryId) {
    return `
        <section class="sf-section">
            <div class="sf-section-head">
                <h2>${esc(title)}</h2>
                ${categoryId ? `<button class="sf-viewall" data-id="${categoryId}">View all →</button>` : ''}
            </div>
            <div class="sf-row">${items.map(productCard).join('')}</div>
        </section>`;
}

// ---------- Views ----------
// Home view: "New Arrivals" + one scrolling row per top-level category
async function buildSections() {
    const roots = state.tree;
    const [latest, ...perRoot] = await Promise.all([
        getProducts({ ordering: '-created_at' }),
        ...roots.map(r => getProducts({ category: r.id, ordering: '-created_at' })),
    ]);

    const sections = [];
    const latestList = toList(latest);
    if (latestList.length) sections.push(sectionHtml('New Arrivals', latestList.slice(0, 10), null));

    roots.forEach((root, i) => {
        const items = toList(perRoot[i]);
        if (items.length) sections.push(sectionHtml(root.name, items.slice(0, 10), root.id));
    });

    return sections.length ? sections.join('') : emptyHtml('Products will appear here soon.');
}

// Grid view: a category is selected, or the user is searching/sorting
async function buildGrid() {
    const params = { ordering: state.ordering };
    if (state.search) params.search = state.search;
    const last = state.path[state.path.length - 1];
    if (last) params.category = last;

    const items = toList(await getProducts(params));
    const nodes = pathNodes();
    const title = nodes.length
        ? nodes.map(n => n.name).join(' › ')
        : (state.search ? `Results for "${state.search}"` : 'All products');

    return {
        title,
        count: `${items.length} product${items.length === 1 ? '' : 's'}`,
        html: items.length
            ? `<div class="sf-grid">${items.map(productCard).join('')}</div>`
            : emptyHtml('Try another category or a different search.'),
    };
}

let viewToken = 0;   // ignores slow responses from older clicks

async function loadView() {
    const token = ++viewToken;
    const sectionsMode = state.path.length === 0 && !state.search && state.ordering === '-created_at';

    els.hero.hidden = !sectionsMode;
    els.viewHead.hidden = sectionsMode;
    els.content.innerHTML = '<p class="sf-muted">Loading products...</p>';

    try {
        if (sectionsMode) {
            const html = await buildSections();
            if (token !== viewToken) return;
            els.content.innerHTML = html;
        } else {
            const view = await buildGrid();
            if (token !== viewToken) return;
            els.viewTitle.textContent = view.title;
            els.count.textContent = view.count;
            els.content.innerHTML = view.html;
        }
    } catch (err) {
        if (token !== viewToken) return;
        els.content.innerHTML = `<p class="error-box">Failed to load products: ${esc(err.message)}</p>`;
    }
}

function refresh() {
    renderCategoryBar();
    loadView();
}

// ---------- Events ----------
els.tabs.addEventListener('click', e => {
    const btn = e.target.closest('.sf-tab');
    if (!btn) return;
    state.path = btn.dataset.id ? [Number(btn.dataset.id)] : [];
    refresh();
});

els.subrows.addEventListener('click', e => {
    const btn = e.target.closest('.sf-chip');
    if (!btn) return;
    const level = Number(btn.dataset.level);
    state.path = state.path.slice(0, level + 1);          // keep everything above this row
    if (btn.dataset.id) state.path.push(Number(btn.dataset.id));
    refresh();
});

els.content.addEventListener('click', e => {
    const btn = e.target.closest('.sf-viewall');
    if (!btn) return;
    state.path = [Number(btn.dataset.id)];
    refresh();
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

let searchTimer;
els.search.addEventListener('input', e => {
    clearTimeout(searchTimer);                            // wait until the user stops typing
    searchTimer = setTimeout(() => {
        state.search = e.target.value.trim();
        loadView();
    }, 400);
});

els.ordering.addEventListener('change', e => {
    state.ordering = e.target.value;
    loadView();
});

els.clear.addEventListener('click', () => {
    state.path = [];
    state.search = '';
    state.ordering = '-created_at';
    els.search.value = '';
    els.ordering.value = '-created_at';
    refresh();
});

// ---------- Start ----------
async function init() {
    renderNav();
    try {
        state.tree = buildTree(toList(await getCategories()));
    } catch (err) {
        console.error('Could not load categories:', err);
    }
    refresh();
}

init();