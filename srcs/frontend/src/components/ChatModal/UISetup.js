import customAlert from "../../scripts/utils/customAlert.js";
import { languageSelector } from '../../components/LanguageSelector/languageSelector.js';
import { handleBlockUnblock, handleResponse } from "../../scripts/utils/rtchatUtils.js";
import { userSocket } from "../../scripts/utils/UserWebsocket.js";

export class UISetup {
    constructor(chatModal) {
        this.chatModal = chatModal;
        this.intervalId = null;
    }

    setupChatModal() {
        const chatModalElement = document.getElementById('chats_modal');

        if (chatModalElement) {
            this.chatModal.addEventListener(chatModalElement, 'shown.bs.modal', async () => {
                await this.chatModal.chatLoader.loadChats();
                setTimeout(() => languageSelector.updateLanguage(), 0);
            });

            this.chatModal.addEventListener(chatModalElement, 'click', async (e) => {
                const targetElement = e.target.closest('.open_chat_btn');
                if (targetElement) {
                    const chatroomName = targetElement.getAttribute('data-chatroom_name');

                    if (!chatroomName) {
                        customAlert('warning', 'Chatroom name not found.', 3000);
                        return;
                    }

                    await this.chatModal.chatLoader.initChatroom(chatroomName);
                }
            });
        } else {
            console.warn("chats_modal not found.");
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
                    console.warn("chat_message_input not found.");
                }
            });

            this.chatModal.addEventListener(messagesModalElement, 'click', (event) => {
                const blockButton = event.target.closest('[data-block-action]');
                const profileLink = event.target.closest('a[href^="/profile/"]');

                if (profileLink) {
                    const modalInstance = bootstrap.Modal.getInstance(messagesModalElement);
                    modalInstance.hide();
                }

                if (blockButton) {
                    const action = blockButton.getAttribute('data-block-action');
                    const username = blockButton.getAttribute('data-block-username');

                    if (action && username) {
                        handleBlockUnblock(action, username, () => {
                            const blockButtons = messagesModalElement.querySelectorAll('[data-block-action]');

                            blockButtons.forEach(button => {
                                this.updateBlockButton(button, action);
                            });

                            this.chatModal.chatRenderer.removeBlockStatusMessage();

                            if (action === 'block') {
                                this.chatModal.chatRenderer.renderMessageInputContainer('blocker', username);
                            } else if (action === 'unblock') {
                                this.chatModal.chatRenderer.toggleInputState(false);
                            }
                        });
                    }
                }
            });
        } else {
            console.warn("messages_modal not found.");
        }
    }

    updateBlockButton(button, action) {
        if (action === 'block') {
            button.setAttribute('data-block-action', 'unblock');
            button.textContent = 'Unblock';
        } else if (action === 'unblock') {
            button.setAttribute('data-block-action', 'block');
            button.textContent = 'Block';
        }
    }

    setupMessageInputEvent() {
        const messageInputDom = document.getElementById('chat_message_input');

        if (messageInputDom) {
            this.chatModal.addEventListener(messageInputDom, 'keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();

                    const messageSubmit = document.getElementById('chat_message_submit');
                    if (messageSubmit) {
                        messageSubmit.click();
                    } else {
                        console.warn('chat_message_submit not found.');
                    }
                }
            });
        } else {
            console.warn("chat_message_input not found.");
        }
    }

    setupMessagesModalClose() {
        const messagesModalElement = document.getElementById('messages_modal');

        if (messagesModalElement) {
            this.chatModal.addEventListener(messagesModalElement, 'hidden.bs.modal', () => {
                this.chatModal.webSocketHandler.closeWebSocket();

                const chatMessages = document.getElementById('chat_messages');
                if (chatMessages) {
                    chatMessages.innerHTML = '';
                } else {
                    console.warn("chat_messages not found.");
                }

                const chatHeader = document.getElementById('chat_header_content');
                if (chatHeader) {
                    chatHeader.innerHTML = '';
                } else {
                    console.warn("chat_header_content not found.");
                }

                const chatForm = document.getElementById('message_input_container');
                if (chatForm) {
                    this.chatModal.chatRenderer.removeBlockStatusMessage();
                    this.chatModal.chatRenderer.toggleInputState(false);
                    this.removeMessageFormEvents();
                    this.cleanMessageTextInput();
                } else {
                    console.warn("message_input_container not found.");
                }
            });
        } else {
            console.warn("messages_modal element not found.");
        }
    }

    removeMessageFormEvents() {
        const messageForm = document.getElementById('chat_message_form');
        if (messageForm) {
            messageForm.onsubmit = null;
        } else {
            console.warn('chat_message_form not found.')
        }
    }

    cleanMessageTextInput() {
        const messageInputDom = document.getElementById('chat_message_input');
        if (messageInputDom) {
            messageInputDom.value = '';
        } else {
            console.warn('chat_message_input not found.')
        }
    }

    setupMessageForm() {
        const messageForm = document.getElementById('chat_message_form');

        if (messageForm) {
            messageForm.onsubmit = (e) => {
                e.preventDefault();

                const messageInputDom = document.getElementById('chat_message_input');
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
                    console.warn('chat_message_input not found.');
                }
            };
        } else {
            console.warn('chat_message_form not found.');
        }
    }

    setupInviteToPlayButton(current_user, invite_user) {
        const inviteToPlayBtn = document.getElementById('invite_to_play_btn');

        this.chatModal.addEventListener(inviteToPlayBtn, 'click', async (e) => {
            const inviteBtn = e.target.closest('[data-invite-to-play-username]');
            if (inviteBtn) {
                const usernameForInvite = inviteBtn.getAttribute('data-invite-to-play-username');

                try {
                    const response = await fetch(`/api/chat/check_users_in_match/`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        credentials: 'include',
                        body: JSON.stringify({ current_user, invite_user}),
                    });

                    await handleResponse(response, (data) => {
                        if (data.status === 1) {
                            this.chatModal.chatLoader.loadInvitation(usernameForInvite);
                        }
                    });

                } catch(error) {
                    this.handleError(error.errorCode, error.errorMessage);
                }
            }
        })
    }

    setupTimer(timeLeft, onTimeUp) {
        const modal = document.getElementById('match_waiting_modal');
        if (modal) {
            const timerElement = modal.querySelector('#match_waiting_timer');

            const updateTimer = () => {
                const minutes = Math.floor(timeLeft / 60);
                const seconds = timeLeft % 60;
                const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

                if (timerElement)
                    timerElement.textContent = formattedTime;
            };

            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }

            updateTimer();

            this.intervalId = setInterval(() => {
                timeLeft--;

                if (timeLeft >= 0) {
                    updateTimer();
                }

                if (timeLeft < 0) {
                    clearInterval(this.intervalId);
                    this.intervalId = null;

                    if (typeof onTimeUp === 'function') {
                        onTimeUp();
                    }
                }
            }, 1000);
        }
    }

    stopTimer() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    setupButtons1x1(group_name) {
        const modal = document.getElementById('match_waiting_buttons_container')

        if (modal) {
            this.chatModal.addEventListener(modal, 'click', (event) => {
                const target = event.target;

                if (target.classList.contains('accept')) {
                    try {
                        userSocket.socket.send(JSON.stringify({
                            action: 'invitation_1x1',
                            type: 'accept',
                            group_name
                        }));

                    } catch (error) {
                        console.error('Failed to send notification:', error);
                    }
                } else if (target.classList.contains('cancel')) {
                    try {
                        userSocket.socket.send(JSON.stringify({
                            action: 'invitation_1x1',
                            type: 'reject',
                            group_name
                        }));

                    } catch (error) {
                        console.error('Failed to send notification:', error);
                    }
                }
            });
        }
    }

    handleError(errorCode, errorMessage) {
        switch (errorCode) {
            case 400:
                customAlert('danger', `${errorMessage}`, 5000);
                break;
            case 404:
                customAlert('danger', `${errorMessage}`, 5000);
                break;
            case 500:
                console.error(errorCode ? `Error ${errorCode}: ${errorMessage}` : `Critical error: ${errorMessage}`);
                break;
            default:
                console.error(errorCode ? `Error ${errorCode}: ${errorMessage}` : `Critical error: ${errorMessage}`);
        }
    }
}
