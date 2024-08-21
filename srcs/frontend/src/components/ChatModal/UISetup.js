import customAlert from "../../scripts/utils/customAlert.js";

export class UISetup {
    constructor(chatModal) {
        this.chatModal = chatModal;
    }

    setupChatModal() {
        const chatModalElement = document.getElementById('chats_modal');

        if (chatModalElement) {
            this.chatModal.addEventListener(chatModalElement, 'shown.bs.modal', () => {
                this.chatModal.chatLoader.loadChats();
            });

            this.chatModal.addEventListener(chatModalElement, 'click', (e) => {
                const targetElement = e.target.closest('.open_chat_btn');
                if (targetElement) {
                    const chatroomName = targetElement.getAttribute('data-chatroom_name');

                    if (!chatroomName) {
                        customAlert('warning', 'Chatroom name not found', 3000);
                        return;
                    }

                    this.chatModal.chatLoader.initChatroom(chatroomName);
                }
            });
        } else {
            console.warn("Chat modal element not found");
        }
    }

    setupMessagesModal() {
        const messagesModalElement = document.getElementById('messages_modal');

        if (messagesModalElement) {
            this.chatModal.addEventListener(messagesModalElement, 'shown.bs.modal', () => {
                if (document.activeElement) {
                    document.activeElement.blur();
                }

                const messageInput = document.getElementById('chat_message_input');
                if (messageInput) {
                    messageInput.focus();
                } else {
                    console.warn("Message input not found");
                }
            });
        } else {
            console.warn("Messages modal element not found");
        }
    }

    setupMessageInputEvent() {
        const messageInputDom = document.querySelector('#chat_message_input');

        if (messageInputDom) {
            this.chatModal.addEventListener(messageInputDom, 'keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();

                    const messageSubmit = document.querySelector('#chat_message_submit');
                    if (messageSubmit) {
                        messageSubmit.click();
                    } else {
                        console.warn('Message submit button not found');
                    }
                }
            });
        } else {
            console.warn("Message input element not found");
        }
    }

    setupCloseMessagesModal() {
        const messagesModalElement = document.getElementById('messages_modal');

        if (messagesModalElement) {
            this.chatModal.addEventListener(messagesModalElement, 'hidden.bs.modal', () => {
                this.chatModal.webSocketHandler.closeWebSocket();

                const chatMessages = document.getElementById('chat_messages');
                if (chatMessages) {
                    chatMessages.innerHTML = '';
                } else {
                    console.warn("Chat messages container not found");
                }

                const chatHeader = document.getElementById('chat_header_content');
                if (chatHeader) {
                    chatHeader.innerHTML = '';
                } else {
                    console.warn("Chat header container not found");
                }

                this.removeMessageFormEvents();
            });
        } else {
            console.warn("Messages modal element not found");
        }
    }

    removeMessageFormEvents() {
        const messageForm = document.querySelector('#chat_message_form');
        if (messageForm) {
            messageForm.onsubmit = null;
        }
    }

    setupScrollEvent() {
        const chatMessagesContainer = document.getElementById('chat_messages_container');

        if (chatMessagesContainer) {
            this.chatModal.addEventListener(chatMessagesContainer, 'scroll', () => {
                const expandedButton = document.querySelector('button[aria-expanded="true"]');
                if (expandedButton) {
                    expandedButton.click();
                }
            });
        } else {
            console.warn("Chat messages container element not found");
        }
    }

    setupMessageForm() {
        const messageForm = document.querySelector('#chat_message_form');

        if (messageForm) {
            messageForm.onsubmit = (e) => {
                e.preventDefault();

                const messageInputDom = document.querySelector('#chat_message_input');
                if (messageInputDom) {
                    const message = messageInputDom.value.trim();

                    if (message.length > 300) {
                        customAlert('warning', 'Message cannot be longer than 300 characters.', 3000);
                        return;
                    }

                    if (message) {
                        try {
                            this.chatModal.chatSocket.send(JSON.stringify({ body: message }));
                            messageInputDom.value = '';
                            messageInputDom.focus();
                        } catch (error) {
                            console.error('Failed to send message:', error);
                            customAlert('danger', 'Failed to send message', 5000);
                        }
                    }
                } else {
                    console.warn("Message input element not found");
                }
            };
        } else {
            console.warn("Chat messages form element not found");
        }
    }
}
