import { Component } from "../../scripts/Component.js";
import { Navbar } from '../../components/Navbar/Navbar.js';

export class Chat extends Component {
    constructor(params = {}) {
        super('/pages/Chat/chat.html', params);
    }

	async init() {
		await this.renderComponent(Navbar, 'navbar-placeholder');

		this.initChat(this.params.chatId);
	}

    async initChat(chatroomName) {
        try {
            if (chatroomName === undefined) {
                chatroomName = "public-chat";
            }
            const response = await fetch(`/api/chat/chatroom/${chatroomName}/`, {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
            }

            const data = await response.json();
            const currentUser = data.current_user;

            console.log("DATA: ", data);

            if (data.chat_messages) {
                const chatMessages = document.querySelector('#chat-messages');
                if (chatMessages) {
                    data.chat_messages.forEach(message => {
                        this.addMessageToChat(message, currentUser);
                    });
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                } else {
                    console.error('Element #chat-messages not found');
                }
            } else {
                console.error('No chat messages found in response');
            }

            this.initWebSocket(chatroomName, currentUser);
            this.scrollToBottom();

        } catch (error) {
            console.error("Messages error: ", error);
        }
    }

    initWebSocket(chatroomName, currentUser) {
        const chatSocket = new WebSocket(`/ws/chatroom/${chatroomName}/`);

        console.log("Opened Socket:", chatSocket);

        chatSocket.onmessage = (e) => {
            const data = JSON.parse(e.data);
            console.log('Received message:', data);

            if (data.error) {
                alert(data.error);
                chatSocket.close();
                console.error('Chat socket closed due to error:', data.error);
                return;
            }

            this.addMessageToChat(data, currentUser);
            this.scrollToBottom();
        };

        chatSocket.onerror = (e) => {
            console.error('WebSocket error:', e.message);
        };

        chatSocket.onclose = (e) => {
            if (e.wasClean) {
                console.log('Chat socket closed cleanly:', e.code, e.reason);
            } else {
                console.error('Chat socket closed unexpectedly:', e.reason);
            }
        };

        document.querySelector('#chat-message-input').focus();
        document.querySelector('#chat-message-input').onkeyup = (e) => {
            if (e.key === 'Enter') {
                document.querySelector('#chat-message-submit').click();
            }
        };

        document.querySelector('#chat-message-submit').onclick = () => {
            const messageInputDom = document.querySelector('#chat-message-input');
            const message = messageInputDom.value;
            if (message.trim()) {
                chatSocket.send(JSON.stringify({
                    'body': message
                }));
                messageInputDom.value = '';
            }
        };
    }

    addMessageToChat(message, currentUser) {
        console.log("message.author: ", message.author, "CURRENT_USER: ", currentUser)
        const chatMessages = document.querySelector('#chat-messages');
        if (chatMessages) {
            const messageElement = document.createElement('li');
            messageElement.className = 'bg-gray-700 p-2 rounded-lg';
            messageElement.innerHTML = `
                <strong>${message.author}:</strong> ${message.body} <br>
                <span class="text-gray-500 text-sm">${new Date(message.created).toLocaleTimeString()}</span>
            `;

            if (message.author !== currentUser) {
                messageElement.innerHTML += `
                    <button class="start-private-chat btn btn-primary btn-sm" data-username="${message.author}">Start Private Chat</button>
                    <button class="block-user btn btn-danger btn-sm" data-username="${message.author}">Block</button>
                    <button class="unblock-user btn btn-success btn-sm" data-username="${message.author}">Unblock</button>
                `;

                messageElement.querySelector('.start-private-chat').addEventListener('click', () => {
                    this.startPrivateChat(message.author);
                });

                messageElement.querySelector('.block-user').addEventListener('click', () => {
                    this.blockUser(message.author);
                });

                messageElement.querySelector('.unblock-user').addEventListener('click', () => {
                    this.unblockUser(message.author);
                });
            }

            chatMessages.appendChild(messageElement);
        } else {
            console.error('Element #chat-messages not found');
        }
    }

    startPrivateChat(username) {
        fetch(`/api/chat/${username}/`, { credentials: 'include' })
            .then(response => response.json())
            .then(data => {
                console.log(data);

                if (data.chatroom_name) {
                    alert(`Private chat created with ${username}.`);
                    window.location.href = `/chat/${data.chatroom_name}`;
                } else {
                    alert("Error creating private chat.");
                }
            })
            .catch(error => {
                console.error("Error starting private chat:", error);
                alert("Error starting private chat.");
            });
    }

    scrollToBottom() {
        const container = document.getElementById("chat-log");
        if (container) {
            container.scrollTop = container.scrollHeight;
        } else {
            console.error('Element #chat-log not found');
        }
    }

    blockUser(username) {
        const chatroomName = 'public-chat';
        const csrfToken = this.getCookie('csrftoken');

        fetch(`/api/chat/block_user/${chatroomName}/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrfToken
            },
            body: JSON.stringify({ blocked_username: username }),
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            alert(data.detail);
        })
        .catch(error => {
            console.error("Block user error:", error);
            alert("Error on blocking user.");
        });
    }

    unblockUser(username) {
        const chatroomName = 'public-chat';
        const csrfToken = this.getCookie('csrftoken');

        fetch(`/api/chat/unblock_user/${chatroomName}/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrfToken
            },
            body: JSON.stringify({ blocked_username: username }),
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            alert(data.detail);
        })
        .catch(error => {
            console.error("Unblock user error:", error);
            alert("Error on unblocking user.");
        });
    }

    getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
}
