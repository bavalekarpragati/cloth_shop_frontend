import { apiRequest } from './client.js';

async function getSales() {
    return await apiRequest('/sales/');
}

async function createSale(payload) {
    return await apiRequest('/sales/', { method: 'POST', body: payload });
}

export { getSales, createSale };