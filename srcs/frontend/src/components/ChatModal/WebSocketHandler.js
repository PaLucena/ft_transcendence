import customAlert from '../../scripts/utils/customAlert.js'

export class WebSocketHandler {
    constructor(chatModal) {
        this.chatModal = chatModal;
    }

    initWebSocket(chatroomName, currentUser) {
        try {
            this.chatModal.chatSocket = new WebSocket(`/ws/chatroom/${chatroomName}/`);
            console.log("Opened Socket:", this.chatModal.chatSocket);
        } catch (error) {
            console.error('Failed to create WebSocket:', error);
            return;
        }

        this.chatModal.chatSocket.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                console.log('Received message:', data);

                if (data.error) {
                    this.handleError(data.errorCode, data.errorMessage);
                    return;
                }

                const isPublicChat = chatroomName === "public-chat";
                this.chatModal.chatRenderer.addMessageToChat(data, currentUser, isPublicChat);
                this.chatModal.chatRenderer.scrollToBottom();
            } catch (error) {
                console.error('Error processing message:', error);
                this.handleError(null, 'Error processing message');
            }
        };

        this.chatModal.chatSocket.onerror = (e) => {
            console.error('WebSocket error:', e);
            this.handleError(null, 'WebSocket error occurred');
        };

        this.chatModal.chatSocket.onclose = (e) => {
            if (e.wasClean) {
                console.log('Chat socket closed cleanly:', e.code, e.reason);
            } else {
                console.error('Chat socket closed unexpectedly:', e.reason);
                this.handleError(null, 'Chat socket closed unexpectedly');
                setTimeout(() => this.initWebSocket(chatroomName, currentUser), 5000);
            }
        };

        const messageInputDom = document.querySelector('#chat_message_input');
        if (messageInputDom) {
            messageInputDom.focus();
            messageInputDom.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const messageSubmit = document.querySelector('#chat_message_submit')
                    if (messageSubmit) {
                        messageSubmit.click();
                    }
                }
            });
        }



        const messageForm = document.querySelector('#chat_message_form')
        if (messageForm) {
            messageForm.onsubmit = (e) => {
                e.preventDefault();
                const message = messageInputDom.value.trim();

                if (message.length > 300) {
                    customAlert('warning', 'Message cannot be longer than 300 characters.', 3000);
                    return;
                }

                if (message) {
                    try {
                        this.chatModal.chatSocket.send(JSON.stringify({ 'body': message }));
                        if (messageInputDom) {
                            messageInputDom.value = '';
                            messageInputDom.focus();
                        }
                    } catch (error) {
                        console.error('Failed to send message:', error);
                        this.handleError(null, 'Failed to send message');
                    }
                }
            };
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
            default:
                console.error('Critical error:', errorMessage);
                this.closeWebSocket();
                break;
        }
    }

    closeWebSocket() {
        if (this.chatModal.chatSocket) {
            this.chatModal.chatSocket.close();
            this.chatModal.chatSocket = null;
            console.log("WebSocket closed.");
        }
    }
}
