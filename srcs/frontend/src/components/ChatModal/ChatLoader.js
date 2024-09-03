import customAlert from "../../scripts/utils/customAlert.js";
import { handleResponse } from "../../scripts/utils/rtchatUtils.js";

export class ChatLoader {
    constructor(chatModal) {
        this.chatModal = chatModal;
        this.chatroomName = null;
    }

    async loadChats() {
        try {
            const response = await fetch(`/api/chat/get_all_private_chats/`, {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: 'include',
            });

            await handleResponse(response, data => {
                this.chatModal.chatRenderer.renderChatElements(data);
            });

        } catch(error) {
            this.handleError(error.errorCode, error.errorMessage);
        }
    }

    async initChatroom(chatroomName) {
        this.chatroomName = chatroomName;

        this.chatModal.webSocketHandler.closeWebSocket();

        try {
            const response = await fetch(`/api/chat/chatroom/${chatroomName}/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            await handleResponse(response, data => {
                const currentUser = data.current_user;
                const isPublicChat = chatroomName === "public-chat";

                this.chatModal.chatRenderer.renderChatHeader(isPublicChat, data);
                this.chatModal.chatRenderer.renderChatMessages(data.chat_messages, currentUser, isPublicChat);
                if (!isPublicChat) {
                    this.chatModal.chatRenderer.renderMessageInputContainer(data.block_status, data.other_user.username);
                }
                this.chatModal.webSocketHandler.initWebSocket(chatroomName, currentUser);
            });

        } catch(error) {
            this.handleError(error.errorCode, error.errorMessage);
        }
    }

    handleError(errorCode, errorMessage) {
        switch (errorCode) {
            case 401:
                customAlert('danger', 'You are not authenticated. Please log in.', 5000);
                break;
            case 403:
                customAlert('danger', `${errorCode}: ${errorMessage || 'You do not have access to this private chat'}.`, 5000);
                break;
            case 404:
                customAlert('danger', `${errorCode}: ${errorMessage || 'Not found'}`, 5000);
                break;
            case 500:
                customAlert('danger', 'An internal server error occurred.', 5000);
                break;
            default:
                console.error(errorCode ? `Error ${errorCode}: ${errorMessage}` : `Critical error: ${errorMessage}`);
        }
    }
}
