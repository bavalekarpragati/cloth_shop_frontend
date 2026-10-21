import { importProducts, getCategories } from '../api/products.js';

const TEMPLATE = [
    'name,description,base_price,selling_price,stock,low_stock_limit,fabric,sizes,colors',
    'Cotton Kurti,Daily wear kurti,300,599,20,5,Cotton,"S,M,L","Red,Blue:#0000ff"',
    'Silk Dupatta,Matching dupatta,150,349,40,5,Silk,Free Size,Pink:#ff69b4',
].join('\n');

function esc(text) {
    const d = document.createElement('div');
    d.textContent = text ?? '';
    return d.innerHTML;
}

function toList(data) {
    return Array.isArray(data) ? data : (data && data.results) || [];
}

// Flat category list -> options like "Kids", "— Girls", "—— Frocks"
function categoryOptions(list) {
    const parentOf = c => (c.parent && typeof c.parent === 'object') ? c.parent.id : (c.parent ?? c.parent_id ?? null);
    const children = new Map();
    list.forEach(c => {
        const pid = parentOf(c);
        if (!children.has(pid)) children.set(pid, []);
        children.get(pid).push(c);
    });

    const options = ['<option value="">Select a section...</option>'];
    (function walk(parentId, depth) {
        (children.get(parentId) || []).forEach(c => {
            options.push(`<option value="${c.id}">${'— '.repeat(depth)}${esc(c.name)}</option>`);
            walk(c.id, depth + 1);
        });
    })(null, 0);
    return options.join('');
}

function downloadTemplate() {
    const blob = new Blob([TEMPLATE], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'product-import-template.csv';
    link.click();
    URL.revokeObjectURL(link.href);
}

// function showResult(box, result) {
//     const errorRows = result.errors.map(e =>
//         `<tr><td>Row ${e.row}</td><td>${esc(e.error)}</td></tr>`).join('');

//     box.innerHTML = `
//         <p class="import-summary">
//             <span class="ok">${result.created} added</span> ·
//             <span class="ok">${result.updated} updated</span> ·
//             <span class="${result.skipped ? 'bad' : 'ok'}">${result.skipped} skipped</span>
//         </p>
//         ${errorRows ? `<table class="import-errors"><tbody>${errorRows}</tbody></table>` : ''}`;
// }

function showResult(box, result) {
    const errorRows = result.errors.map(e =>
        `<tr><td>Row ${e.row}</td><td>${esc(e.error)}</td></tr>`).join('');
    const warnRows = (result.warnings || []).map(w =>
        `<tr><td>${w.row ? 'Row ' + w.row : 'Note'}</td><td>${esc(w.warning)}</td></tr>`).join('');

    box.innerHTML = `
        <p class="import-summary">
            <span class="ok">${result.created} added</span> ·
            <span class="ok">${result.updated} updated</span> ·
            <span class="ok">${result.images_added || 0} pictures</span> ·
            <span class="${result.skipped ? 'bad' : 'ok'}">${result.skipped} skipped</span>
        </p>
        ${errorRows ? `<table class="import-errors"><tbody>${errorRows}</tbody></table>` : ''}
        ${warnRows ? `<p class="import-summary">Pictures not attached:</p><table class="import-errors"><tbody>${warnRows}</tbody></table>` : ''}`;
}

// onDone = your function that reloads the product list
export async function initProductImport(onDone) {
    const select = document.getElementById('import-category');
    const fileInput = document.getElementById('import-file');
    const button = document.getElementById('import-btn');
    const result = document.getElementById('import-result');
    const templateBtn = document.getElementById('import-template');
    if (!select || !fileInput || !button) return;    // page has no import block

    templateBtn.addEventListener('click', downloadTemplate);

    try {
        select.innerHTML = categoryOptions(toList(await getCategories()));
    } catch (err) {
        result.innerHTML = `<p class="import-summary bad">Could not load sections: ${esc(err.message)}</p>`;
    }

    button.addEventListener('click', async () => {
        if (!select.value) { result.innerHTML = '<p class="import-summary bad">Choose a section first.</p>'; return; }
        if (!fileInput.files.length) { result.innerHTML = '<p class="import-summary bad">Choose a file first.</p>'; return; }

        button.disabled = true;
        button.textContent = 'Importing...';
        result.innerHTML = '';

        try {
            const data = await importProducts(fileInput.files[0], select.value);
            showResult(result, data);
            fileInput.value = '';
            if (onDone) onDone();
        } catch (err) {
            result.innerHTML = `<p class="import-summary bad">${esc(err.message)}</p>`;
        } finally {
            button.disabled = false;
            button.textContent = 'Import';
        }
    });
}
