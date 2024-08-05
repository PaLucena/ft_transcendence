import { Component } from "../../scripts/Component.js";
import { Navbar } from '../../components/Navbar/Navbar.js';

export class Chat extends Component {
    constructor(params = {}) {
        super('/pages/Chat/chat.html', params);
    }

	init() {
		this.initChat(this.params.chatId);
	}

    initChat(chatroomName) {
        if (chatroomName === undefined) {
            chatroomName = "public-chat";
        }

        fetch(`/api/chat/chatroom/${chatroomName}/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.detail || `Response status: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
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
        })
        .catch(error => {
            console.error("Messages error: ", error);
            alert(`Error initializing chat: ${error.message}`);
        });
    }

    initWebSocket(chatroomName, currentUser) {
        let chatSocket;

        try {
            chatSocket = new WebSocket(`/ws/chatroom/${chatroomName}/`);

            console.log("Opened Socket:", chatSocket);
        } catch (error) {
            console.error('Failed to create WebSocket:', error);
            alert('Error initializing WebSocket connection. Please try again later.');
            return;
        }

        chatSocket.onmessage = (e) => {
            try {
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
            } catch (error) {
                console.error('Error processing message:', error);
            }
        };

        chatSocket.onerror = (e) => {
            console.error('WebSocket error:', e);
            alert('WebSocket error occurred. Please try again later.');
        };


        chatSocket.onclose = (e) => {
            if (e.wasClean) {
                console.log('Chat socket closed cleanly:', e.code, e.reason);
            } else {
                console.error('Chat socket closed unexpectedly:', e.reason);
                alert('Connection lost. Trying to reconnect...');
                setTimeout(() => this.initWebSocket(chatroomName, currentUser), 5000);
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
            const message = messageInputDom.value.trim();
            if (message) {
                chatSocket.send(JSON.stringify({
                    'body': message
                }));
                messageInputDom.value = '';
            } else {
                console.warn('Cannot send empty message');
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

                const startPrivateChatButton = messageElement.querySelector('.start-private-chat');
                const blockUserButton = messageElement.querySelector('.block-user');
                const unblockUserButton = messageElement.querySelector('.unblock-user');

                startPrivateChatButton.addEventListener('click', () => {
                    this.startPrivateChat(message.author);
                });

                blockUserButton.addEventListener('click', () => {
                    if (confirm(`Are you sure you want to block ${message.author}?`)) {
                        this.handleUserAction('block', message.author)
                            .finally(() => {
                                blockUserButton.disabled = true;
                                unblockUserButton.disabled = false;
                            });
                    }
                });

                unblockUserButton.addEventListener('click', () => {
                    if (confirm(`Are you sure you want to unblock ${message.author}?`)) {
                        this.handleUserAction('unblock', message.author)
                            .finally(() => {
                                unblockUserButton.disabled = true;
                                blockUserButton.disabled = false;
                            });
                    }
                });
            }

            chatMessages.appendChild(messageElement);
        } else {
            console.error('Element #chat-messages not found');
        }
    }

    startPrivateChat(username) {
        fetch(`/api/chat/${username}/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.detail || `Response status: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log(data);

            if (data.chatroom_name) {
                alert(`Private chat created with ${username}.`);
                window.location.href = `/chat/${data.chatroom_name}`;
            } else {
                alert(`Error creating private chat. ${data.detail ? data.detail : ''}`);
            }
        })
        .catch(error => {
            console.error("Error starting private chat:", error);
            alert(`Error starting private chat: ${error.message}`);
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

    handleUserAction(action, username) {
        const chatroomName = 'public-chat';
        const endpoint = action === 'block' ? 'block_user' : 'unblock_user';
        const method = 'POST';

        fetch(`/api/chat/${endpoint}/${chatroomName}/`, {
            method: method,
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ blocked_username: username }),
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.detail || `Response status: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            alert(data.detail || `User has been ${action === 'block' ? 'blocked' : 'unblocked'} successfully.`);
        })
        .catch(error => {
            console.error(`${action.charAt(0).toUpperCase() + action.slice(1)} user error:`, error);
            alert(`Error ${action === 'block' ? 'blocking' : 'unblocking'} user: ${error.message}`);
        });
    }
}
