import { apiRequest } from './client.js';

async function getAnalytics() {
    return await apiRequest('/analytics/');
}

export { getAnalytics };