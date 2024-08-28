import { eventEmitter } from './EventEmitter.js';

class OnlineWebsocket {
    constructor() {
        this.onlineSocket = null;
    }

    initWebSocket() {
        try {
            this.onlineSocket = new WebSocket('/ws/online-status/');
        } catch (error) {
            this.handleError(null, 'Failed to create WebSocket');
            return;
        }

        this.onlineSocket.onmessage = (e) => this.handleMessage(e);
        this.onlineSocket.onerror = (e) => {
            this.handleError(null, e);
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
        }
    }

    handleError(errorCode, errorMessage) {
        console.error(errorCode ? `Error ${errorCode}: ${errorMessage}` : `Critical error: ${errorMessage}`);
        this.closeWebSocket();
    }

    closeWebSocket() {
        if (this.onlineSocket) {
            this.onlineSocket.close();
            this.onlineSocket = null;
        }
    }
}

export const onlineSocket = new OnlineWebsocket();
