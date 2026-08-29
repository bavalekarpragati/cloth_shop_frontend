import { apiRequest } from './client.js';

async function getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await apiRequest(`/products/${query ? '?' + query : ''}`);
}

async function getProduct(id) {
    return await apiRequest(`/products/${id}/`);
}

async function createProduct(payload) {
    return await apiRequest('/products/', { method: 'POST', body: payload });
}

async function updateProduct(id, payload) {
    return await apiRequest(`/products/${id}/`, { method: 'PATCH', body: payload });
}

async function deleteProduct(id) {
    return await apiRequest(`/products/${id}/`, { method: 'DELETE' });
}

async function getCategories() {
    return await apiRequest('/categories/');
}

async function getSizes() {
    return await apiRequest('/sizes/');
}

async function getColors() {
    return await apiRequest('/colors/');
}

async function uploadProductImages(id, formData) {
    return await apiRequest(`/products/${id}/upload_images/`, {
        method: 'POST',
        body: formData,
        isFormData: true
    });
}

async function deleteProductImage(productId, imageId) {
    return await apiRequest(`/products/${productId}/delete_image/${imageId}/`, {
        method: 'DELETE'
    });
}

export {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    getCategories,
    getSizes,
    getColors,
    uploadProductImages,
    deleteProductImage
};