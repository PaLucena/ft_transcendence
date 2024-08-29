import { eventEmitter } from './EventEmitter.js';
import customAlert from './customAlert.js'; 
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

	sendMessage(message) {
        if (this.onlineSocket && this.onlineSocket.readyState === WebSocket.OPEN) {
            try {
                const data = JSON.stringify(message);
                this.onlineSocket.send(data);
                console.log("Message sent:", data);
            } catch (error) {
                this.handleError(null, 'Failed to send message');
            }
        } else {
            console.error("WebSocket is not open. Cannot send message.");
        }
    }

    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
			console.log("data: ", data)
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
