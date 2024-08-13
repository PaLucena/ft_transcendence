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
                    this.chatModal.chatSocket.close();
                    console.error('Chat socket closed due to error:', data.error);
                    return;
                }

                const isPublicChat = chatroomName === "public-chat";
                this.chatModal.chatRenderer.addMessageToChat(data, currentUser, isPublicChat);
                this.chatModal.chatRenderer.scrollToBottom();
            } catch (error) {
                console.error('Error processing message:', error);
            }
        };

        this.chatModal.chatSocket.onerror = (e) => {
            console.error('WebSocket error:', e);
        };

        this.chatModal.chatSocket.onclose = (e) => {
            if (e.wasClean) {
                console.log('Chat socket closed cleanly:', e.code, e.reason);
            } else {
                console.error('Chat socket closed unexpectedly:', e.reason);
                setTimeout(() => this.initWebSocket(chatroomName, currentUser), 5000);
            }
        };

        const messageInputDom = document.querySelector('#chat_message_input');
        messageInputDom.focus();

        messageInputDom.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                document.querySelector('#chat_message_submit').click();
            }
        });

        document.querySelector('#chat_message_form').onsubmit = (e) => {
            e.preventDefault();
            const message = messageInputDom.value.trim();

            if (message.length > 300) {
                customAlert('warning', 'Message cannot be longer than 300 characters.', 3000);
                return;
            }

            if (message) {
                this.chatModal.chatSocket.send(JSON.stringify({
                    'body': message
                }));
                messageInputDom.value = '';
                messageInputDom.focus();
            }
        };
    }

    closeWebSocket() {
        if (this.chatModal.chatSocket) {
            this.chatModal.chatSocket.close();
            this.chatModal.chatSocket = null;
            console.log("WebSocket closed.");
        }
    }
}
