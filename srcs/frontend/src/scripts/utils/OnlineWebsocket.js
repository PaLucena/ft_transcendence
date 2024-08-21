import customAlert from './customAlert.js';
import { eventEmitter } from './EventEmitter.js';

class OnlineWebsocket {
    constructor () {
        this.onlineSocket = null;
    }

    initWebSocket () {
        try {
            this.onlineSocket = new WebSocket('/ws/online-status/');
        } catch (error) {
            this.handleError(null, 'Failed to create WebSocket');
            customAlert('danger', 'Failed to connect', 5000);
            return;
        }

        this.onlineSocket.onmessage = (e) => this.handleMessage(e);
        this.onlineSocket.onerror = (e) => {
            this.handleError(null, e);
            customAlert('danger', 'An connection error has occurred', 5000);
        }
        this.onlineSocket.onclose = (e) => this.handleClose(e);
    }

    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);

            if (data.error) {
				this.handleError(data.errorCode, data.errorMessage);
                return;
            }

			if (data.online_users) {
                eventEmitter.emit('onlineUsersUpdated', data.online_users);
            } else {
                this.handleError(null, 'Invalid data format received.');
            }
        } catch (error) {
            this.handleError(null, error);
        }
    }

    handleClose(event) {
        if (!event.wasClean) {
            console.error('Online socket closed unexpectedly:', event.reason || 'Unknown reason');
            // customAlert('danger', 'An unexpected disconnection has occurred. Reconnecting...', 5000);
            // setTimeout(() => this.initWebSocket(), 5000);
        }
    }

    handleError(errorCode, errorMessage) {
        switch (errorCode) {
            case 404:
                customAlert('danger', 'Resource not found.', 5000);
                break;
			case 403:
                customAlert('danger', 'You do not have permission to perform this action.', 5000);
                this.closeWebSocket();
				break;
            case 500:
                customAlert('danger', 'An internal server error occurred.', 5000);
                this.closeWebSocket();
                break;
            default:
                console.error('Critical error:', errorMessage);
                this.closeWebSocket();
        }
    }

    closeWebSocket() {
        if (this.onlineSocket) {
            this.onlineSocket.close();
            this.onlineSocket = null;
        }
    }
}

export const onlineSocket = new OnlineWebsocket();
