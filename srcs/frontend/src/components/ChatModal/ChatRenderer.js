import { handleBlockUnblock } from '../../scripts/utils/rtchatUtils.js';

export class ChatRenderer {
    constructor(chatModal, eventEmitter) {
        this.chatModal = chatModal;
		this.eventEmitter = eventEmitter;

		this.onlineUsersUpdatedListener = (onlineUsers) => {
            this.updateOnlineStatus(onlineUsers);
        };

		this.eventEmitter.on('onlineUsersUpdated', this.onlineUsersUpdatedListener);
    }

	updateOnlineStatus(onlineUsers) {
        const chatElements = document.querySelectorAll('[data-username]');

        chatElements.forEach(element => {
            const username = element.getAttribute('data-username');
            const isOnline = onlineUsers.includes(username);
            const statusDot = element.querySelector('.status-dot');

			if (statusDot) {
                statusDot.classList.remove('green-dot', 'gray-dot');
                statusDot.classList.add(isOnline ? 'green-dot' : 'gray-dot');
            }
        });
    }

	renderChatElements(chats) {
        const container = document.getElementById('chat_element_container');

		if (container) {
			container.innerHTML = '';

			chats.forEach(chat => {
				const chatElement = this.createChatElement(chat);

				if (chatElement) {
					container.appendChild(chatElement);
				}
			});
		}
    }

	createChatElement(chat) {
		try {
			const chatHtml = `
				<div class="chat-element col-6 col-md-4 col-lg-2 d-flex flex-column align-items-center mb-4" data-username="${chat.other_user_username}">
					<button class="open_chat_btn btn rounded-circle bg-dark d-flex justify-content-center align-items-center position-relative"
							style="width: 102px; height: 102px;"
							data-bs-target="#messages_modal"
							data-bs-toggle="modal"
							data-chatroom_name="${chat.chatroom_name}">
						<img src="${chat.other_user_avatar_url || ''}"
							 style="width: 100px; height: 100px;"
							 class="rounded-circle"
							 alt="Circle Image">
						<div class="status-dot position-absolute translate-middle border border-3 border-dark ${chat.other_user_online_status ? 'green' : 'gray'}-dot p-2"
							 style="top:90%; left:85%;">
						</div>
					</button>
					<p class="text-light mt-2">${chat.other_user_username}</p>
				</div>
			`;

			const template = document.createElement('template');
			template.innerHTML = chatHtml.trim();

			return template.content.firstChild;
		} catch (error) {
			console.error('Error creating chat element:', error);
			return null;
		}
	}

	renderChatMessages(messages, currentUser, isPublicChat) {
		if (messages) {
			const container = document.querySelector('#chat_messages');

			if (container) {
				container.innerHTML = '';

				messages.forEach(message => {
					this.addMessageElement(message, currentUser, isPublicChat);
				});
			}
		}
	}

	addMessageElement(message, currentUser, isPublicChat) {
		const messageHtml = message.author.username === currentUser ?
			this.createCurrentUserMessageContent(message.body) :
			this.createOtherUserMessageContent(message, isPublicChat);

		const template = document.createElement('template');
		template.innerHTML = messageHtml.trim();
		const messageElement = template.content.firstChild;

		const chatMessages = document.querySelector('#chat_messages');

		if (chatMessages) {
			chatMessages.appendChild(messageElement);
		}
	}

	createCurrentUserMessageContent(body) {
		return `
		<li class="fade-in-up d-flex mb-2 justify-content-end">
			<div class="my-message text-break rounded-top-3 p-3" style="max-width: 75%;">
				<span>${body}</span>
			</div>
			<div class="d-flex align-items-end">
				<svg height="13" width="8">
					<path fill="#bbf7d0" d="M6.3,10.4C1.5,8.7,0.9,5.5,0,0.2L0,13l5.2,0C7,13,9.6,11.5,6.3,10.4z"/>
				</svg>
			</div>
		</li>
		`;
	}

	createOtherUserMessageContent(message, isPublicChat) {
		if (isPublicChat) {
			const userBtn = `
			<button type="button" class="btn p-0" data-bs-toggle="dropdown" data-username="${message.author.username}">
				<div class="status-dot position-absolute translate-middle border border-3 border-dark ${message.author.is_online ? 'green' : 'gray'}-dot" style="top:90%; left:90%;"></div>
				<img
					class="rounded-circle"
					style="width: 32px; height: 32px;"
					src="${message.author.avatar}"
				>
			</button>`;
			return `
			<li class="fade-in-up d-flex mb-2 flex-column justify-start">
				<div class="d-flex align-items-end">
					<div class="d-flex align-items-end me-2 dropup">
						${userBtn}
						<ul class="dropdown-menu dropdown-menu-dark">
							<li><a href="" class="dropdown-item">Profile</a></li>
							<li><hr class="dropdown-divider"></li>
							<li><a class="dropdown-item" href="#">Invite to Play</a></li>
							<li><a class="dropdown-item" href="#">Unblock</a></li>
						</ul>
					</div>
					<div class="d-flex align-items-end">
						<svg height="13" width="8">
							<path fill="white" d="M2.8,13L8,13L8,0.2C7.1,5.5,6.5,8.7,1.7,10.4C-1.6,11.5,1,13,2.8,13z"></path>
						</svg>
					</div>
					<div class="other-message text-break bg-white rounded-top-3 p-3" style="max-width: 75%;">
						<span>${message.body}</span>
					</div>
				</div>
				<div class="text-muted small py-1 mt-2">
					<span class="text-white">${message.author.username}</span>
				</div>
			</li>
			`;
		} else {
			return `
			<li class="fade-in-up d-flex mb-2 flex-column justify-start">
				<div class="d-flex align-items-end">
					<svg height="13" width="8">
						<path fill="white" d="M2.8,13L8,13L8,0.2C7.1,5.5,6.5,8.7,1.7,10.4C-1.6,11.5,1,13,2.8,13z"></path>
					</svg>
					<div class="other-message bg-white rounded-top-3 p-3" style="max-width: 75%;">
						<span>${message.body}</span>
					</div>
				</div>
			</li>
			`;
		}
	}

	renderChatHeader(isPublicChat, data) {
		const chatHeader = document.getElementById('chat_header_content');

		if (chatHeader) {
			chatHeader.innerHTML = '';

			const headerHtml = isPublicChat ?
				this.createPublicChatHeaderContent() :
				this.createPrivateChatHeaderContent(data);

			const template = document.createElement('template');
			template.innerHTML = headerHtml.trim();
			const headerElement = template.content.firstChild;

			chatHeader.appendChild(headerElement);
		}
	}

	createPublicChatHeaderContent() {
		return `
		<div class="d-flex align-items-center">
			<span class="pr-1 position-absolute top-50 start-50" style="transform: translate(-50%, -50%); color: #34d399">Public chat</span>
		</div>
		`;
	}

	createPrivateChatHeaderContent(data) {
		return `
		<div class="d-flex align-items-center">
			<div class="d-flex align-items-end me-2 dropup">
				<button
					type="button"
					class="btn p-0"
					data-bs-toggle="dropdown"
					data-username="${data.other_user.username}"
				>
					<div class="status-dot position-absolute translate-middle border border-3 border-dark ${data.other_user.is_online ? 'green' : 'gray'}-dot" style="top:90%; left:90%;"></div>
					<img
						class="rounded-circle"
						src="${data.other_user.avatar}"
						style="width: 32px; height: 32px;"
					>
				</button>
				<ul class="dropdown-menu dropdown-menu-dark">
					<li><a href="" class="dropdown-item">Profile</a></li>
					<li><hr class="dropdown-divider"></li>
					<li><a class="dropdown-item" href="#">Invite to Play</a></li>
					<li><a class="dropdown-item" href="#">Unblock</a></li>
				</ul>
			</div>
			<span class="text-light">${data.other_user.username}</span>
		</div>
		`;
	}

	renderMessageInputContainer(blockStatus, otherUser) {
        const messageInputContainer = document.querySelector('.message-input-container');
		const chatMessageInput = document.getElementById('chat_message_input');
    	const chatMessageSubmit = document.getElementById('chat_message_submit');



        if (messageInputContainer && chatMessageInput && chatMessageSubmit) {
            const existingMessage = messageInputContainer.querySelector('.block-status-message');
            if (existingMessage) {
                existingMessage.remove();
            }

            const blockMessage = this.createInputBlockMessage(blockStatus);

            if (blockMessage) {
                messageInputContainer.insertAdjacentHTML('afterbegin', blockMessage);

				this.toggleInputState(chatMessageInput, chatMessageSubmit, true);

				if (blockStatus === "blocker" && otherUser) {
					const unblockBtn = document.getElementById('unblock_btn');
					if (unblockBtn) {
						unblockBtn.addEventListener('click', () => {
							handleBlockUnblock('unblock', otherUser.username, () => {
								this.removeBlockStatusMessage();
								this.toggleInputState(chatMessageInput, chatMessageSubmit, false);
							});
						});
					}
				}
            } else {
				this.toggleInputState(chatMessageInput, chatMessageSubmit, false);
			}
        }
    }

	createInputBlockMessage (blockStatus) {
		if (blockStatus === "blocker") {
			 return `
			 	<div class="text-light block-status-message mb-2">
					You have blocked this user.
					<a id="unblock_btn" class="unblock-btn">Unblock</a>.
				</div>
			`;
		} else if (blockStatus === "blocked") {
			return `
				<div class="text-light block-status-message mb-2">
					You are blocked by this user.
				</div>`;
		}
		else {
			return null;
		}
	}

	removeBlockStatusMessage() {
		const messageInputContainer = document.querySelector('.message-input-container');
		if (messageInputContainer) {
			const blockStatusMessage = messageInputContainer.querySelector('.block-status-message');
			if (blockStatusMessage) {
				blockStatusMessage.remove();
			}
		}
	}

	toggleInputState(inputElement, submitButton, disable) {
		inputElement.disabled = disable;
		submitButton.disabled = disable;
	}

    scrollToBottom(time=0) {
        setTimeout(() => {
            const container = document.getElementById("chat_messages_container");
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
        }, time);
    }
}
