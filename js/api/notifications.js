import { apiRequest } from './client.js';

async function getNotifications() {
    return await apiRequest('/owner/notifications/');
}

async function markNotificationsRead() {
    return await apiRequest('/owner/notifications/mark-read/', { method: 'POST', body: {} });
}

export { getNotifications, markNotificationsRead };