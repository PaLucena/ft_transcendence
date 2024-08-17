import customAlert from "../../scripts/utils/customAlert.js";

export class UISetup {
    constructor(chatModal) {
        this.chatModal = chatModal;
    }

    setupChatModal() {
        const chatModalElement = document.getElementById('chats_modal');
        if (chatModalElement) {
            chatModalElement.addEventListener('shown.bs.modal', () => {
                try {
                    this.chatModal.chatLoader.loadChats();
                } catch (error) {
                    console.error("Failed to load chats:", error);
                }
            });
        } else {
            console.error("Chat modal element not found");
        }
    }

    setupMessagesModal() {
        const messagesModalElement = document.getElementById('messages_modal');
        if (messagesModalElement) {
            messagesModalElement.addEventListener('shown.bs.modal', () => {
                try {
                    if (document.activeElement) {
                        document.activeElement.blur();
                    }
                    const messageInput = document.getElementById('chat_message_input');
                    if (messageInput) {
                        messageInput.focus();
                    } else {
                        console.warn("Message input not found");
                    }
                } catch (error) {
                    console.error("Failed to setup messages modal:", error);
                }
            });
        } else {
            console.error("Messages modal element not found");
        }
    }

    setupCloseMessagesModal() {
        const messagesModalElement = document.getElementById('messages_modal');
        if (messagesModalElement) {
            messagesModalElement.addEventListener('hidden.bs.modal', () => {
                try {
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

                    this.removeMessageInputEvents();
                    this.removeMessageFormEvents();
                } catch (error) {
                    console.error("Failed to close messages modal:", error);
                }
            });
        } else {
            console.error("Messages modal element not found");
        }
    }

    removeMessageInputEvents() {
        const messageInputDom = document.querySelector('#chat_message_input');
        if (messageInputDom &&  this.chatModal.webSocketHandler.messageInputHandler) {
            messageInputDom.removeEventListener('keydown',  this.chatModal.webSocketHandler.messageInputHandler);
        } else {
            console.warn('Message input element not found or handler not set');
        }
    }

    removeMessageFormEvents() {
        const messageForm = document.querySelector('#chat_message_form');
        if (messageForm) {
            messageForm.onsubmit = null;
        } else {
            console.warn('Message form element not found');
        }
    }


    setupScrollEvent() {
        const chatMessagesContainer = document.getElementById('chat_messages_container');
        if (chatMessagesContainer) {
            chatMessagesContainer.addEventListener('scroll', () => {
                try {
                    const expandedButton = document.querySelector('button[aria-expanded="true"]');
                    if (expandedButton) {
                        expandedButton.click();
                    }
                } catch (error) {
                    console.error("Failed to handle scroll event:", error);
                }
            });
        } else {
            console.error("Chat messages container element not found");
        }
    }

    setupChatRender() {
        document.addEventListener('click', event => {
            try {
                const targetElement = event.target.closest('.open_chat_btn');
                if (targetElement) {
                    const chatroomName = targetElement.getAttribute('data-chatroom_name');

                    if (!chatroomName) {
                        customAlert('warning', 'Chatroom name not found', 3000);
                        return;
                    }

                    this.chatModal.chatLoader.initChatroom(chatroomName);
                }
            } catch (error) {
                console.error("Failed to setup chat render:", error);
                customAlert('error', 'An error occurred while trying to open the chat.', 5000);
                event.preventDefault();
            }
        });
    }
}
