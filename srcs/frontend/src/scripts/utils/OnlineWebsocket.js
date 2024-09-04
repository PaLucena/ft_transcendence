import { eventEmitter } from './EventEmitter.js';
import { updateOnlineStatus } from './rtchatUtils.js'
import customAlert from './customAlert.js'; 
class OnlineWebsocket {
    constructor() {
        this.onlineSocket = null;
        this.onlineUsersUpdatedListener = null;
    }

    initWebSocket() {
        try {
            this.onlineSocket = new WebSocket('/ws/online-status/');
        } catch (error) {
            this.handleError(null, 'Failed to create WebSocket', true);
            return;
        }

        this.onlineSocket.onmessage = (e) => this.handleMessage(e);
        this.onlineSocket.onerror = (e) => {this.handleError(null, e, true);}
        this.onlineSocket.onclose = (e) => this.handleClose(e);

        this.initOnlineStatusListener();
    }

    initOnlineStatusListener() {
        this.onlineUsersUpdatedListener = (onlineUsers) => {
            updateOnlineStatus(onlineUsers);
        };

        eventEmitter.on('onlineUsersUpdated', this.onlineUsersUpdatedListener);
    }

	sendMessage(message, to_user) {
        if (this.onlineSocket && this.onlineSocket.readyState === WebSocket.OPEN) {
            try {
                const data = {
					'to_user': to_user,
					'message': message
				}
                this.onlineSocket.send(JSON.stringify(data));
                console.log("Message sent:", data);
            } catch (error) {
                this.handleError(null, 'Failed to send message', false);
            }
        } else {
            console.error("WebSocket is not open. Cannot send message.");
        }
    }

	sendMessage(message, to_user) {
        if (this.onlineSocket && this.onlineSocket.readyState === WebSocket.OPEN) {
            try {
                const data = {
					'to_user': to_user,
					'message': message
				}
                this.onlineSocket.send(JSON.stringify(data));
                console.log("Message sent:", data);
            } catch (error) {
                this.handleError(null, 'Failed to send message', false);
            }
        } else {
            console.error("WebSocket is not open. Cannot send message.");
        }
    }

    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
		//https://localhost:8080/profile	console.log("data: ", data)
            if (data.error) {
                this.handleError(data.errorCode, data.errorMessage);
                return;
            }

            if (data.online_users) {
                eventEmitter.emit('onlineUsersUpdated', data.online_users);
            } else if (data.message) {
				customAlert('info', data.message, 3000);
			}
			else {
                this.handleError(null, 'Invalid data format received.', false);
            }
        } catch (error) {
            this.handleError(null, error, false);
        }
    }

    handleClose(event) {
        if (!event.wasClean) {
            console.error('Online socket closed unexpectedly:', event.reason || 'Unknown reason');
        }

        this.removeOnlineUpdateListeners();
    }

    handleError(errorCode, errorMessage, close) {
        console.error(errorCode ? `Error ${errorCode}: ${errorMessage}` : `Critical error: ${errorMessage}`);
        if (close == true)
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
