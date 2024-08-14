import customAlert from './customAlert.js'

export default function handleBlockUnblock(action, username, callback) {
    fetch(`/api/chat/block_or_unblock/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ blocked_username: username, action }),
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errorData => {
                throw new Error(errorData.detail || `Response status: ${response.status}`);
            });
        }
        return response.json();
    })
    .then(data => {
        const message = data.detail || `User has been ${action === 'block' ? 'blocked' : 'unblocked'} successfully.`;
        customAlert('success', message, 3000);
        if (callback) {
            callback();
        }
    })
    .catch(error => {
        console.error(`${action.charAt(0).toUpperCase() + action.slice(1)} user error:`, error);
    });
}
