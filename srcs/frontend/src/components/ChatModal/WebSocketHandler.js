import customAlert from '../../scripts/utils/customAlert.js'

export class WebSocketHandler {
    constructor(chatModal) {
        this.chatModal = chatModal;
    }

    initWebSocket(chatroomName, currentUser) {
        try {
            this.chatModal.chatSocket = new WebSocket(`/ws/chatroom/${chatroomName}/`);
        } catch (error) {
            this.handleError(null, 'Failed to create WebSocket');
            customAlert('danger', 'Failed to connect', 5000);
            return;
        }

        this.chatModal.chatSocket.onmessage = (e) => this.handleMessage(e, chatroomName, currentUser);
        this.chatModal.chatSocket.onerror = (e) => {
            this.handleError(null, e);
            customAlert('danger', 'An connection error has occurred', 5000);
        };
        this.chatModal.chatSocket.onclose = (e) => this.handleClose(e, chatroomName, currentUser);
        this.chatModal.uiSetup.setupMessageForm();
    }

    handleMessage(event, chatroomName, currentUser) {
        try {
            const data = JSON.parse(event.data);

            if (data.error) {
                this.handleError(data.errorCode, data.errorMessage);
                return;
            }

            const isPublicChat = chatroomName === "public-chat";
            this.chatModal.chatRenderer.addMessageElement(data, currentUser, isPublicChat);
            this.chatModal.chatRenderer.scrollToBottom();
        } catch (error) {
            this.handleError(null, error);
            customAlert('danger', 'Error on processing message', 5000);
        }
    }

    handleClose(event, chatroomName, currentUser) {
        if (!event.wasClean) {
            console.error('Chat socket closed unexpectedly:', event.reason);
        }
    }

    handleError(errorCode, errorMessage) {
        switch (errorCode) {
            case 1001:
                customAlert('info', errorMessage, 3000);
                break;
            case 1002:
                customAlert('info', errorMessage, 3000);
                break;
            case 404:
                customAlert('danger', 'Chatroom not found or author not found', 5000);
                this.closeWebSocket();
                break;
            case 401:
                customAlert('danger', 'You are not authenticated. Please log in.', 5000);
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
        if (this.chatModal.chatSocket) {
            this.chatModal.chatSocket.close();
            this.chatModal.chatSocket = null;
        }
    }
}
