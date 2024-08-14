export class ChatLoader {
    constructor(chatModal) {
        this.chatModal = chatModal;
    }

    loadChats() {
        fetch(`/api/chat/get_all_private_chats/`, {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
            },
            credentials: 'include'
        })
        .then(response => this.handleResponse(response))
        .then(data => this.chatModal.chatRenderer.renderChatElements(data))
        .catch(error => console.error(`Error: ${error.message}`));
    }


    handleResponse(response) {
        if (!response.ok) {
            return response.json().then(errorData => {
                throw new Error(errorData.detail || `Response status: ${response.status}`);
            });
        }
        return response.json();
    }

    updateChatHeader(isPublicChat, data) {
        const publicChatHeader = document.getElementById('public_chat_header');
        const privateChatHeader = document.getElementById('private_chat_header');

        if (isPublicChat) {
            publicChatHeader.classList.remove('d-none');
            privateChatHeader.classList.add('d-none');
        } else {
            publicChatHeader.classList.add('d-none');
            privateChatHeader.classList.remove('d-none');

            const userNickname = document.getElementById('user_nickname');
            const userAvatarImg = document.getElementById('user_avatar_img');
            const statusDot = document.getElementById('status_dot');

            userNickname.textContent = data.other_user.username || 'Unknown User';
            userAvatarImg.src = data.other_user.avatar || '';
            statusDot.className = `position-absolute translate-middle border border-3 border-dark ${data.other_user.online === 'online' ? 'green' : 'gray'}-dot`;
        }
    }


    async initChatroom(chatroomName) {
        if (chatroomName === undefined) {
            chatroomName = "public-chat";
        }

        try {
            const response = await fetch(`/api/chat/chatroom/${chatroomName}/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `Response status: ${response.status}`);
            }

            const data = await response.json();
            const currentUser = data.current_user;
            const isPublicChat = chatroomName === "public-chat";
            console.log("DATA: ", data);

            this.updateChatHeader(isPublicChat, data);

            if (data.chat_messages) {
                const chatMessages = document.querySelector('#chat_messages');
                if (chatMessages) {
                    const fragment = document.createDocumentFragment();
                    for (const message of data.chat_messages) {
                        const messageElement = this.chatModal.chatRenderer.createMessageElement(message, currentUser, isPublicChat);
                        fragment.appendChild(messageElement);
                    }

                    chatMessages.appendChild(fragment);
                } else {
                    console.error('Element #chat_messages not found');
                }
            } else {
                console.error('No chat messages found in response');
            }

            this.chatModal.webSocketHandler.initWebSocket(chatroomName, currentUser);
            this.chatModal.chatRenderer.scrollToBottom(100);
        } catch (error) {
            console.error("Messages error: ", error);
        }
    }
}
