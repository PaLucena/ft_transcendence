function applyChat() {
	fetch('components/chat/chat.html')
		.then(response => response.text())
		.then(data => {
			document.getElementById('chat-placeholder').innerHTML = data;
		})
		.catch(error => console.error('Error loading chat:', error));
}