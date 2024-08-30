import { eventEmitter } from './EventEmitter.js';
import { updateOnlineStatus } from './rtchatUtils.js'

class OnlineWebsocket {
    constructor() {
        this.onlineSocket = null;
        this.onlineUsersUpdatedListener = null;
    }

    initWebSocket() {
        try {
            this.onlineSocket = new WebSocket('/ws/online-status/');
        } catch (error) {
            this.handleError(null, 'Failed to create WebSocket');
            return;
        }

        this.onlineSocket.onmessage = (e) => this.handleMessage(e);
        this.onlineSocket.onerror = (e) => {this.handleError(null, e);}
        this.onlineSocket.onclose = (e) => this.handleClose(e);

        this.initOnlineStatusListener();
    }

    initOnlineStatusListener() {
        this.onlineUsersUpdatedListener = (onlineUsers) => {
            updateOnlineStatus(onlineUsers);
        };

        eventEmitter.on('onlineUsersUpdated', this.onlineUsersUpdatedListener);
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

        this.removeOnlineUpdateListeners();
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

        this.removeOnlineUpdateListeners();
    }

    removeOnlineUpdateListeners() {
        if (this.onlineUsersUpdatedListener) {
            eventEmitter.off('onlineUsersUpdated', this.onlineUsersUpdatedListener);
            this.onlineUsersUpdatedListener = null;
        }
    }
}

export const onlineSocket = new OnlineWebsocket();
