import { getNotifications, markNotificationsRead } from '../api/notifications.js';

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export function initOwnerNotifications() {
    const bell = document.getElementById('notif-bell');
    const countEl = document.getElementById('notif-count');
    const listEl = document.getElementById('notif-list');
    if (!bell || !countEl || !listEl) return;   // page has no bell, do nothing

    async function refresh() {
        try {
            const data = await getNotifications();

            countEl.textContent = data.unread_count;
            countEl.style.display = data.unread_count > 0 ? 'inline-block' : 'none';

            listEl.innerHTML = data.results.length
                ? data.results.map(n => `
                    <li class="${n.is_read ? '' : 'unread'}">
                        ${escapeHtml(n.message)}
                        <small>${new Date(n.created_at).toLocaleString()}</small>
                    </li>`).join('')
                : '<li>No notifications yet</li>';
        } catch (err) {
            console.error('Notifications failed:', err);
        }
    }

    bell.addEventListener('click', async () => {
        listEl.classList.toggle('open');
        if (listEl.classList.contains('open')) {
            await markNotificationsRead();
            countEl.style.display = 'none';
        }
    });

    refresh();
    setInterval(refresh, 15000);   // ask the backend every 15 seconds
}