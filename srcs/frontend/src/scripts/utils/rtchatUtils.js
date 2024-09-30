import customAlert from './customAlert.js'

export function updateOnlineStatus(onlineUsers) {
    const statusDots = document.querySelectorAll('.status-dot[data-online-username]');

    statusDots.forEach(dot => {
        const username = dot.getAttribute('data-online-username');
        const isOnline = onlineUsers.includes(username);

        dot.classList.remove('green-dot', 'gray-dot');
        dot.classList.add(isOnline ? 'green-dot' : 'gray-dot');
    });
}


export async function handleBlockUnblock(action, username, callback) {
    try {
        const response = await fetch('/api/chat/block_or_unblock/', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ blocked_username: username, action }),
        });

        await handleResponse(response, data => {
            const message = data.detail || `User has been ${action === 'block' ? 'blocked' : 'unblocked'} successfully.`;
            customAlert('success', message, 3000);
            if (callback) {
                callback();
            }
        });
    }
    catch(error) {
        handleError(error.errorCode, error.errorMessage)
    };
}

export async function handleResponse(response, onSuccess) {
    if (!response.ok) {
        const errorData = await response.json();
        throw {
            errorCode: response.status,
            errorMessage: errorData.detail || errorData.error || `Response status: ${response.status}`
        };
    }

    const data = await response.json();
    onSuccess(data);
}

function handleError(errorCode, errorMessage) {
    switch (errorCode) {
        case 400:
            customAlert('danger', `${errorCode}: ${errorMessage}`, 5000);
            break;
        case 401:
            customAlert('danger', 'You are not authenticated. Please log in.', 5000);
            break;
        case 403:
            customAlert('danger', 'You do not have permission to access this chatroom.', 5000);
            break;
        case 404:
            customAlert('danger', `${errorCode}: ${errorMessage || 'Not found'}`, 5000);
            break;
        case 500:
            customAlert('danger', 'An internal server error occurred.', 5000);
            break;
        default:
            console.error(errorCode ? `Error ${errorCode}: ${errorMessage}` : `Critical error: ${errorMessage}`);
    }
}
