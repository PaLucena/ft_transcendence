export class ChatRenderer {
    constructor(chatModal) {
        this.chatModal = chatModal;
    }

    renderChatElements(chats) {
        console.log(chats);
        $('#chat_element_container').empty();
        chats.forEach(chat => this.createChatElement(chat));
    }

    createChatElement(chat) {
        const chatElement = $('<div>', {
            class: 'chat-element col-6 col-md-4 col-lg-2 d-flex flex-column align-items-center mb-4'
        });

        const button = $('<button>', {
            class: 'open_chat_btn btn rounded-circle bg-dark d-flex justify-content-center align-items-center position-relative',
            style: 'width: 102px; height: 102px;',
            'data-bs-target': '#messages_modal',
            'data-bs-toggle': 'modal',
            'data-chatroom_name': `${chat.chatroom_name}`
        });

        const avatarImg = $('<img>', {
            src: chat.other_user_avatar_url || '',
            style: 'width: 100px; height: 100px;',
            class: 'rounded-circle',
            alt: 'Circle Image'
        });
        button.append(avatarImg);

        const greenDot = $('<div>', {
            class: `position-absolute translate-middle border border-3 border-dark ${chat.other_user_online_status === 'online' ? 'green' : 'gray'}-dot p-2`,
            style: 'top:90%; left:85%;'
        });
        button.append(greenDot);

        const messageIndicator = $('<span>', {
            class: 'position-absolute translate-middle',
            style: 'top:0%; left:10%;'
        });

        const bounce = $('<span>', {
            class: 'bounce bounce-animation position-absolute p-2 bg-danger border border-1 border-light rounded-circle'
        });
        messageIndicator.append(bounce);
        button.append(messageIndicator);

        chatElement.append(button);

        const username = $('<p>', {
            class: 'text-light mt-2',
            text: chat.other_user_username
        });
        chatElement.append(username);

        $('#chat_element_container').append(chatElement);
    }

    addMessageToChat(message, currentUser, isPublicChat) {
		console.log(isPublicChat);

		const chatMessages = document.querySelector('#chat_messages');
		if (chatMessages) {
			const messageElement = this.createMessageElement(message, currentUser, isPublicChat);
			chatMessages.appendChild(messageElement);
			this.scrollToBottom();
		}
	}

	createMessageElement(message, currentUser, isPublicChat) {
		const messageElement = document.createElement('li');
		messageElement.className = 'fade-in-up d-flex mb-2';
		(message.author.username === currentUser)
		? messageElement.classList.add('justify-content-end')
		: messageElement.classList.add('flex-column', 'justify-start');

		const messageContent = message.author.username === currentUser ?
			this.createCurrentUserMessageContent(message.body) :
			this.createOtherUserMessageContent(message, isPublicChat);

		messageElement.innerHTML = messageContent;
		return messageElement;
	}

	createCurrentUserMessageContent(body) {
		return `
			<div class="my-message text-break rounded-top-3 p-3" style="max-width: 75%;">
				<span>${body}</span>
			</div>
			<div class="d-flex align-items-end">
				<svg height="13" width="8">
					<path fill="#bbf7d0" d="M6.3,10.4C1.5,8.7,0.9,5.5,0,0.2L0,13l5.2,0C7,13,9.6,11.5,6.3,10.4z"/>
				</svg>
			</div>
		`;
	}

	createOtherUserMessageContent(message, isPublicChat) {
		if (isPublicChat) {
			return `
				<div class="d-flex align-items-end">
					<div class="d-flex align-items-end me-2 dropup">
						<button type="button" class="btn p-0" data-bs-toggle="dropdown">
							<div class="position-relative">
								<div class="position-absolute translate-middle border border-3 border-dark ${message.author.online === 'online' ? 'green' : 'gray'}-dot" style="top:90%; left:90%;"></div>
								<img class="rounded-circle" style="width: 32px; height: 32px;" src="${message.author.avatar}">
							</div>
						</button>
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
			`;
		} else {
			return `
			<div class="d-flex align-items-end">
				<svg height="13" width="8">
					<path fill="white" d="M2.8,13L8,13L8,0.2C7.1,5.5,6.5,8.7,1.7,10.4C-1.6,11.5,1,13,2.8,13z"></path>
				</svg>
				<div class="other-message bg-white rounded-top-3 p-3" style="max-width: 75%;">
					<span>${message.body}</span>
				</div>
			</div>
			`;
		}
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
