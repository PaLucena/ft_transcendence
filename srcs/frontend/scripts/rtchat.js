function initChat() {
        const chatSocket = new WebSocket('/ws/chatroom/public-chat/');

        console.log(chatSocket)

        chatSocket.onmessage = function(e) {
            const data = JSON.parse(e.data);
            console.log(data);

            if (data.error) {
                alert(data.error);
                chatSocket.close();
                return;
            }

            document.querySelector('#chat-log').value += (data.body + '\n');
        };

        chatSocket.onclose = function(e) {
            console.error('Chat socket closed unexpectedly');
        };

        document.querySelector('#chat-message-input').focus();
        document.querySelector('#chat-message-input').onkeyup = function(e) {
            if (e.key === 'Enter') {  // enter, return
                document.querySelector('#chat-message-submit').click();
            }
        };

        document.querySelector('#chat-message-submit').onclick = function(e) {
            const messageInputDom = document.querySelector('#chat-message-input');
            const message = messageInputDom.value;
            chatSocket.send(JSON.stringify({
                'body': message
            }));
            messageInputDom.value = '';
        };
}
