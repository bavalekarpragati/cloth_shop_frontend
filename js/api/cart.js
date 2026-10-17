import { apiRequest } from './client.js';

async function getCart() {
    return await apiRequest('/cart/');
}

async function addToCart(productId, quantity = 1) {
    return await apiRequest('/cart/add/', {
        method: 'POST',
        body: { product_id: productId, quantity }
    });
}

async function removeCartItem(itemId) {
    return await apiRequest(`/cart/items/${itemId}/`, { method: 'DELETE' });
}

export { getCart, addToCart, removeCartItem };