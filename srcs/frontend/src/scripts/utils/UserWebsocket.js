import { eventEmitter } from './EventEmitter.js';
import { updateOnlineStatus } from './rtchatUtils.js'
import customAlert from './customAlert.js';

class UserWebsocket {
    constructor() {
        this.socket = null;
        this.onlineUsersUpdatedListener = null;
        this.reconnectDelay = 5000;
        this.maxReconnectAttempts = 10;
        this.reconnectAttempts = 0;
    }

    initWebSocket() {
        if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
            console.log("WebSocket is already open or in the process of opening");
            return;
        }

        try {
            console.log("Init userWebsocket");
            

            this.socket = new WebSocket('/ws/user-socket/');
        } catch (error) {
            this.handleError(null, 'Failed to create WebSocket', true);
            return;
        }

        this.socket.onmessage = (e) => this.handleMessage(e);
        this.socket.onerror = (e) => {this.handleError(null, e, true);}
        this.socket.onclose = (e) => this.handleClose(e);

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

            console.log("UserSocket data:", data);

            if (data.online_users) {
                eventEmitter.emit('onlineUsersUpdated', data.online_users);
            } else if (data.notification) {
                this.handleNotification(data.notification);
            } else {
                this.handleError(null, 'Invalid data format received.', false);
            }
        } catch (error) {
            this.handleError(null, error, false);
        }
    }

    handleNotification(notification) {
        switch (notification.type) {
            case 'invite':
                customAlert('info', notification.message, 3000);
                break ;
            case 'accept':
                customAlert('success', notification.message, 3000);
                break ;
            case 'cancel':
                customAlert('danger', notification.message, 3000);
                break ;
        }
    }

    handleClose(event) {
        if (!event.wasClean) {
            console.error('Online socket closed unexpectedly:', event.reason || 'Unknown reason');

            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                console.log(`Reconnecting in ${this.reconnectDelay / 1000} seconds... (Attempt ${this.reconnectAttempts})`);

                setTimeout(() => {
                    this.initWebSocket();
                }, this.reconnectDelay);
            } else {
                console.error('Maximum reconnect attempts reached. Connection closed.');
            }
        } else {
            console.log('WebSocket connection closed cleanly.');
        }

        this.removeOnlineUpdateListeners();
    }

    handleError(errorCode, errorMessage, close) {
        console.error(errorCode ? `Error ${errorCode}: ${errorMessage}` : `Critical error: ${errorMessage}`);
        if (close === true) {
            this.closeWebSocket();
        }
    }

    closeWebSocket() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
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

export const userSocket = new UserWebsocket();
