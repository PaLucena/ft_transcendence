import handleBlockUnblock from '../../scripts/utils/handleBlockUnblock.js'

export class ChatLoader {
    constructor(chatModal) {
        this.chatModal = chatModal;
        this.chatroomName = null;
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

            if (userNickname) {
                userNickname.textContent = data.other_user.username || 'Unknown User';
            }
            if (userAvatarImg) {
                userAvatarImg.src = data.other_user.avatar || '';
            }
            if (statusDot) {
                statusDot.className = `position-absolute translate-middle border border-3 border-dark ${data.other_user.online === 'online' ? 'green' : 'gray'}-dot`;
            }
        }
    }


    async initChatroom(chatroomName = 'public-chat') {
        this.chatroomName = chatroomName;

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
            this.updateMessageInputContainer(data.block_status, data.other_user);

            if (data.chat_messages) {
                const chatMessages = document.querySelector('#chat_messages');
                if (chatMessages) {
                    const fragment = document.createDocumentFragment();
                    for (const message of data.chat_messages) {
                        const messageElement = this.chatModal.chatRenderer.createMessageElement(message, currentUser, isPublicChat);
                        fragment.appendChild(messageElement);
                    }

                    chatMessages.appendChild(fragment);
                }
            } else {
                console.error('No chat messages found in response');
            }

            this.chatModal.webSocketHandler.initWebSocket(chatroomName, currentUser);
            this.chatModal.chatRenderer.scrollToBottom(200);
        } catch (error) {
            console.error("Messages error: ", error);
        }
    }

    updateMessageInputContainer(blockStatus, otherUser) {
        const messageInputContainer = document.querySelector('.message-input-container');

        if (messageInputContainer) {
            const existingMessage = messageInputContainer.querySelector('.block-status-message');
            if (existingMessage) {
                existingMessage.remove();
            }

            let blockMessage = '';
            if (blockStatus === "blocker") {
                blockMessage = `<div class="text-light block-status-message mb-2">You have blocked this user. <a id="unblock_btn" class="unblock-btn">Unblock</a>.</div>`;
            } else if (blockStatus === "blocked") {
                blockMessage = `<div class="text-light block-status-message mb-2">You are blocked by this user.</div>`;
            }

            if (blockMessage) {
                messageInputContainer.insertAdjacentHTML('afterbegin', blockMessage);

                if (blockStatus === "blocker" && otherUser) {
                    const unblockBtn = document.getElementById('unblock_btn');
                    if (unblockBtn) {
                        unblockBtn.addEventListener('click', () => {
                            handleBlockUnblock('unblock', otherUser.username, () => {
                                removeBlockStatusMessage();
                            });
                        });
                    }
                }
            }
        }

        function removeBlockStatusMessage() {
            const messageInputContainer = document.querySelector('.message-input-container');
            if (messageInputContainer) {
                const blockStatusMessage = messageInputContainer.querySelector('.block-status-message');
                if (blockStatusMessage) {
                    blockStatusMessage.remove();
                }
            }
        }

    }
}
